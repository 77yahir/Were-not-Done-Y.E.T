import { useEffect, useRef, useState } from "react";
import {
  getMyFriendRequests,
  respondToFriendRequest
} from "../../services/friends";
import { Link } from "react-router-dom";

export function FriendRequests({
  refreshVersion = 0,
  onFriendChanged
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const processingRef = useRef(false);
  const generationRef = useRef(0);

  async function handleReview(friendshipId, decision) {
    if (processingRef.current) return;

    processingRef.current = true;
    const generation = generationRef.current;

    setReviewError("");
    setProcessingId(friendshipId);

    try {
      await respondToFriendRequest(friendshipId, decision);

      if (generation !== generationRef.current) return;

      setRequests((current) =>
        current.filter(
          (request) => request.friendship_id !== friendshipId
        )
      );

      onFriendChanged?.();
    } catch {
      if (generation === generationRef.current) {
        setReviewError("Failed to review friend request");
      }
    } finally {
      processingRef.current = false;

      if (generation === generationRef.current) {
        setProcessingId(null);
      }
    }
  }

  useEffect(() => {
    let ignore = false;
    generationRef.current += 1;

    async function loadRequests() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyFriendRequests();

        if (!ignore) {
          setRequests(data.requests ?? []);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load friend requests");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      ignore = true;
      generationRef.current += 1;
    };
  }, [refreshVersion]);

  const incoming = requests.filter(
    (request) => request.direction === "incoming"
  );

  const outgoing = requests.filter(
    (request) => request.direction === "outgoing"
  );

  return (
    <section>
      <h2>Friend Requests</h2>

      {loading && <p>Loading friend requests...</p>}
      {error && <p role="alert">{error}</p>}
      {reviewError && <p role="alert">{reviewError}</p>}

      {!loading && !error && (
        <>
          <h3>Received Requests</h3>

          {incoming.length === 0 && (
            <p>No pending received requests</p>
          )}

          {incoming.map((request) => (
            <div key={request.friendship_id}>
              <p>
                From:{" "}
                <Link to={`/users/${request.other_user_id}`}>
                  {request.username}
                </Link>
              </p>

              <button
                type="button"
                disabled={processingId !== null}
                onClick={() =>
                  handleReview(
                    request.friendship_id,
                    "accepted"
                  )
                }>
                Accept
              </button>

              <button
                type="button"
                disabled={processingId !== null}
                onClick={() =>
                  handleReview(
                    request.friendship_id,
                    "declined"
                  )
                }>
                Decline
              </button>
            </div>
          ))}

          <h3>Sent Requests</h3>

          {outgoing.length === 0 && (
            <p>No pending sent requests</p>
          )}

          {outgoing.map((request) => (
            <div key={request.friendship_id}>
              <p>
                To:{" "}
                <Link to={`/users/${request.other_user_id}`}>
                  {request.username}
                </Link>
              </p>
              <p>Status: Pending</p>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
