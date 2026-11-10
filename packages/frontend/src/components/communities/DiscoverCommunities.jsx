import { useEffect, useRef, useState } from "react";
import {
  getDiscoverableCommunities,
  requestToJoinCommunity
} from "../../services/communities";
import Avatar from "../ui/Avatar";
import Button, { ButtonLink } from "../ui/Button";
import Notice from "../ui/Notice";
import Panel from "../ui/Panel";
import Pill from "../ui/Pill";
import {
  IconClock,
  IconCompass,
  IconUserPlus
} from "../ui/icons";
import EmptyState from "./EmptyState";

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
    <Panel
      title="Discoverable Communities"
      icon={<IconCompass className="size-5" />}
      bodyClassName="flex flex-col gap-3">
      {loading && <Notice>Loading communities...</Notice>}

      {error && (
        <Notice tone="error" role="alert">
          {error}
        </Notice>
      )}
      {requestError && (
        <Notice tone="error" role="alert">
          {requestError}
        </Notice>
      )}

      {!loading && !error && communities.length === 0 && (
        <EmptyState icon={<IconCompass className="size-6" />}>
          There are currently no discoverable communities!
        </EmptyState>
      )}

      {/* As many columns of cards as fit. empty:hidden drops the
          list's gap when there are no communities */}
      {!loading && !error && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-3 empty:hidden">
          {communities.map((community) => (
            <li
              key={community.group_id}
              className="flex flex-col gap-3 rounded-xl border border-parchment-300 bg-parchment-50 p-4 shadow-sm shadow-black/10">
              <div className="flex items-center gap-3">
                <Avatar name={community.name} />

                <h3 className="min-w-0 text-lg leading-tight font-bold wrap-anywhere">
                  {community.name}
                </h3>
              </div>

              <p className="text-sm text-ink-700 wrap-anywhere empty:hidden">
                {community.description}
              </p>

              {/* mt-auto lines the buttons up along the bottom of a
                  row of cards */}
              <div className="mt-auto flex flex-wrap items-center gap-2 empty:hidden">
                {community.membership_status === "approved" && (
                  <ButtonLink
                    to={`/communities/${community.group_id}`}
                    variant="secondary"
                    size="sm">
                    View Community
                  </ButtonLink>
                )}

                {community.membership_status === "pending" && (
                  <Pill tone="blue">
                    <IconClock className="size-3.5" />
                    Request Pending
                  </Pill>
                )}

                {(community.membership_status === null ||
                  community.membership_status === "rejected" ||
                  community.membership_status ===
                    "removed") && (
                  <Button
                    size="sm"
                    disabled={requestingId !== null}
                    onClick={() =>
                      handleJoin(community.group_id)
                    }>
                    <IconUserPlus className="size-4" />
                    {requestingId === community.group_id
                      ? "Submitting..."
                      : "Request to Join"}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
