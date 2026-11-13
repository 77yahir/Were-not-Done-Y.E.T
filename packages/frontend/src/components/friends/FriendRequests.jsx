import { useEffect, useRef, useState } from "react";
import {
  getMyFriendRequests,
  respondToFriendRequest
} from "../../services/friends";
import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Notice from "../ui/Notice";
import Panel from "../ui/Panel";
import Pill from "../ui/Pill";
import {
  IconCheck,
  IconClock,
  IconInbox,
  IconX
} from "../ui/icons";

// A name that links to that user's profile
const NAME_LINK_CLASS =
  "rounded-sm font-bold text-ink-900 underline-offset-2 hover:text-forest-700 hover:underline";

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
    <Panel
      title="Friend Requests"
      icon={<IconInbox className="size-5" />}
      bodyClassName="flex flex-col gap-5">
      {loading && <Notice>Loading friend requests...</Notice>}
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

      {!loading && !error && (
        <>
          <div>
            <h3 className="text-lg font-bold text-ink-700">
              Received Requests
            </h3>

            {incoming.length === 0 && (
              <Notice className="mt-1">
                No pending received requests
              </Notice>
            )}

            {/* The list is a container, so each request fits on
                one line when the list is wide enough, and puts
                its buttons under the name when it isn't */}
            {incoming.length > 0 && (
              <ul className="@container mt-1 divide-y divide-parchment-300">
                {incoming.map((request) => (
                  <li
                    key={request.friendship_id}
                    className="flex items-start gap-3 py-3 @sm:items-center">
                    <Avatar name={request.username} />

                    <div className="flex min-w-0 flex-1 flex-col gap-2 @sm:flex-row @sm:items-center @sm:justify-between">
                      <p className="wrap-anywhere text-ink-700">
                        From:{" "}
                        <Link
                          to={`/users/${request.other_user_id}`}
                          className={NAME_LINK_CLASS}>
                          {request.username}
                        </Link>
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={processingId !== null}
                          onClick={() =>
                            handleReview(
                              request.friendship_id,
                              "accepted"
                            )
                          }>
                          <IconCheck className="size-4" />
                          Accept
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          disabled={processingId !== null}
                          onClick={() =>
                            handleReview(
                              request.friendship_id,
                              "declined"
                            )
                          }>
                          <IconX className="size-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-ink-700">
              Sent Requests
            </h3>

            {outgoing.length === 0 && (
              <Notice className="mt-1">
                No pending sent requests
              </Notice>
            )}

            {outgoing.length > 0 && (
              <ul className="mt-1 divide-y divide-parchment-300">
                {outgoing.map((request) => (
                  <li
                    key={request.friendship_id}
                    className="flex items-center gap-3 py-3">
                    <Avatar name={request.username} />

                    <p className="min-w-0 flex-1 wrap-anywhere text-ink-700">
                      To:{" "}
                      <Link
                        to={`/users/${request.other_user_id}`}
                        className={NAME_LINK_CLASS}>
                        {request.username}
                      </Link>
                    </p>

                    <p className="shrink-0">
                      <span className="sr-only">Status: </span>
                      <Pill tone="blue">
                        <IconClock className="size-3.5" />
                        Pending
                      </Pill>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
