import { useRef, useState, useEffect } from "react";
import {
  getPendingJoinRequests,
  reviewJoinRequest
} from "../../services/communities";

export function PendingRequests({ groupId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const generationRef = useRef(0);
  const processingRef = useRef(false);

  async function handleReview(membershipId, decision) {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    const reviewGeneration = generationRef.current;

    setReviewError("");
    setProcessingId(membershipId);

    try {
      await reviewJoinRequest(membershipId, decision);

      if (reviewGeneration !== generationRef.current) {
        return;
      }

      setRequests((joinRequests) =>
        joinRequests.filter(
          (request) => request.membership_id !== membershipId
        )
      );
    } catch (error) {
      if (reviewGeneration === generationRef.current) {
        setReviewError("Failed to review join request");
      }
    } finally {
      processingRef.current = false;
      if (reviewGeneration === generationRef.current) {
        setProcessingId(null);
      }
    }
  }

  useEffect(() => {
    let ignore = false;
    generationRef.current += 1;

    async function loadJoinRequests() {
      setRequests([]);
      setLoading(true);
      setError("");
      setReviewError("");
      setProcessingId(null);

      try {
        const data = await getPendingJoinRequests(groupId);
        if (!ignore) {
          setRequests(data.requests);
        }
      } catch (error) {
        if (!ignore) {
          setError("Failed to load pending join requests");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadJoinRequests();
    return () => {
      ignore = true;
      generationRef.current += 1;
    };
  }, [groupId]);

  return (
    <div>
      <h1>Pending Join Requests</h1>

      {loading && <p>Loading pending requests...</p>}

      {error && <p role="alert">{error}</p>}
      {reviewError && <p role="alert">{reviewError}</p>}

      {!loading && !error && requests.length === 0 && (
        <p>No pending requests</p>
      )}

      {!loading &&
        !error &&
        requests.length > 0 &&
        requests.map((request) => (
          <p key={request.membership_id}>
            <button
              disabled={processingId !== null || loading}
              onClick={() =>
                handleReview(request.membership_id, "approved")
              }>
              Accept
            </button>
            <button
              disabled={processingId !== null || loading}
              onClick={() =>
                handleReview(request.membership_id, "rejected")
              }>
              Decline
            </button>
            {request.user_id}
          </p>
        ))}
    </div>
  );
}
