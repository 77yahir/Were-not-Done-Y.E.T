import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDiscoverableCommunities,
  requestToJoinCommunity
} from "../../services/communities";

export function DiscoverableCommunities() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingId, setRequestingId] = useState(null);
  const [requestError, setRequestError] = useState("");

  const processingRef = useRef(false);
  const generationRef = useRef(0);

  async function handleJoin(groupId) {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;
    const requestGeneration = generationRef.current;

    setRequestError("");
    setRequestingId(groupId);

    try {
      await requestToJoinCommunity(groupId);

      if (requestGeneration !== generationRef.current) {
        return;
      }

      setCommunities((currentCommunities) =>
        currentCommunities.map((community) =>
          community.group_id === groupId
            ? {
                ...community,
                membership_status: "pending",
                membership_role: "member"
              }
            : community
        )
      );
    } catch (error) {
      if (requestGeneration === generationRef.current) {
        setRequestError("Failed to submit join request");
      }
    } finally {
      processingRef.current = false;

      if (requestGeneration === generationRef.current) {
        setRequestingId(null);
      }
    }
  }

  useEffect(() => {
    let ignore = false;
    generationRef.current += 1;

    async function loadDiscoverableCommunities() {
      setLoading(true);
      setError("");
      setRequestError("");

      try {
        const data = await getDiscoverableCommunities();

        if (!ignore) {
          setCommunities(data.communities ?? []);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load available communities");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadDiscoverableCommunities();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section>
      <h2>Discoverable Communities</h2>

      {loading && <p>Loading communities...</p>}

      {error && <p role="alert">{error}</p>}
      {requestError && <p role="alert">{requestError}</p>}

      {!loading && !error && communities.length === 0 && (
        <p>There are currently no discoverable communities!</p>
      )}

      {!loading &&
        !error &&
        communities.map((community) => (
          <div key={community.group_id}>
            <h3>Name: {community.name}</h3>

            <p>Description: {community.description}</p>

            {community.membership_status === "approved" && (
              <Link to={`/communities/${community.group_id}`}>
                View Community
              </Link>
            )}

            {community.membership_status === "pending" && (
              <p>Request Pending</p>
            )}

            {(community.membership_status === null ||
              community.membership_status === "rejected" ||
              community.membership_status === "removed") && (
              <button
                type="button"
                disabled={requestingId !== null}
                onClick={() => handleJoin(community.group_id)}>
                {requestingId === community.group_id
                  ? "Submitting..."
                  : "Request to Join"}
              </button>
            )}
          </div>
        ))}
    </section>
  );
}
