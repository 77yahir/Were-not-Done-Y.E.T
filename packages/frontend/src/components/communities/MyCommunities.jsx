import { useEffect, useState } from "react";
import { getMyCommunities } from "../../services/communities";
import { CommunityCard } from "./CommunityCard";

export function MyCommunities() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCommunities() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyCommunities();

        if (!ignore) {
          setCommunities(data.communities ?? []);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load your communities");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCommunities();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section>
      <h2>My Communities</h2>

      {loading && <p>Loading communities...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && communities.length === 0 && (
        <p>You haven't joined any communities yet</p>
      )}

      {!loading &&
        !error &&
        communities.map((community) => (
          <CommunityCard
            key={community.group_id}
            community={community}
          />
        ))}
    </section>
  );
}
