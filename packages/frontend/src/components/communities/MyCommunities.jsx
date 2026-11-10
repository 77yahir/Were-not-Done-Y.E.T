import { useEffect, useState } from "react";
import { getMyCommunities } from "../../services/communities";
import Notice from "../ui/Notice";
import Panel from "../ui/Panel";
import { IconUsers } from "../ui/icons";
import { CommunityCard } from "./CommunityCard";
import EmptyState from "./EmptyState";

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
    <Panel
      title="My Communities"
      icon={<IconUsers className="size-5" />}
      bodyClassName="flex flex-col gap-3">
      {loading && <Notice>Loading communities...</Notice>}

      {error && (
        <Notice tone="error" role="alert">
          {error}
        </Notice>
      )}

      {!loading && !error && communities.length === 0 && (
        <EmptyState icon={<IconUsers className="size-6" />}>
          You haven't joined any communities yet
        </EmptyState>
      )}

      {/* empty:hidden drops the list's gap when it has nothing in it */}
      {!loading && !error && (
        <ul className="flex flex-col gap-2 empty:hidden">
          {communities.map((community) => (
            <li key={community.group_id}>
              <CommunityCard community={community} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
