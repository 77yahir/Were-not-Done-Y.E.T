import { useRef, useState, useEffect } from "react";
import {
  getPendingJoinRequests,
  reviewJoinRequest
} from "../../services/communities";
import Button from "../ui/Button";
import Notice from "../ui/Notice";
import Panel from "../ui/Panel";
import {
  IconCheck,
  IconInbox,
  IconUser,
  IconX
} from "../ui/icons";
import EmptyState from "./EmptyState";

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

  // A fixed-width column beside the members on wide screens
  return (
    <Panel
      title="Pending Join Requests"
      icon={<IconInbox className="size-5" />}
      className="lg:w-96 lg:shrink-0"
      bodyClassName="flex flex-col gap-3">
      {loading && <Notice>Loading pending requests...</Notice>}

      {error && (
        <Notice tone="error" role="alert">
          {error}
        </Notice>
      )}
      {reviewError && (
        <Notice tone="error" role="alert">
          {reviewError}
        </Notice>
      )}

      {!loading && !error && requests.length === 0 && (
        <EmptyState icon={<IconInbox className="size-6" />}>
          No pending requests
        </EmptyState>
      )}

      {!loading && !error && requests.length > 0 && (
        <ul className="flex flex-col gap-2">
          {requests.map((request) => (
            <li
              key={request.membership_id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-parchment-300 bg-parchment-50 p-3 shadow-sm shadow-black/10">
              <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-parchment-200 text-wood-600 ring-1 ring-parchment-300">
                  <IconUser className="size-5" />
                </span>

                {/* The requester's account id */}
                <p className="min-w-0 font-mono text-xs text-ink-500 wrap-anywhere">
                  {request.user_id}
                </p>
              </div>

              <div className="ml-auto flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={processingId !== null || loading}
                  onClick={() =>
                    handleReview(
                      request.membership_id,
                      "approved"
                    )
                  }>
                  <IconCheck className="size-4" />
                  Accept
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={processingId !== null || loading}
                  onClick={() =>
                    handleReview(
                      request.membership_id,
                      "rejected"
                    )
                  }>
                  <IconX className="size-4" />
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
