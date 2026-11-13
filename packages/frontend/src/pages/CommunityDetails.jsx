import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MemberList } from "../components/communities/MemberList";
import { PendingRequests } from "../components/communities/PendingRequests";
import CommunityChatLink from "../components/messages/CommunityChatLink";
import PageHeader from "../components/ui/PageHeader";
import { IconUsers } from "../components/ui/icons";
import { getMyCommunityPermissions } from "../services/communities";

function CommunityDetails() {
  const { groupId } = useParams();

  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadPermissions() {
      setLoading(true);
      setPermissions(null);
      setError("");

      try {
        const data = await getMyCommunityPermissions(groupId);

        if (!ignore) {
          setPermissions(data);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load community permissions");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (groupId) {
      loadPermissions();
    } else {
      setLoading(false);
      setPermissions(null);
      setError("No community selected");
    }

    return () => {
      ignore = true;
    };
  }, [groupId]);

  // Approved members are in the community's group chat
  const showGroupChat =
    !loading && !error && permissions?.status === "approved";

  return (
    <div>
      <PageHeader
        title="Community Details"
        subtitle="Meet the people in this community."
        icon={<IconUsers className="size-8" />}
        action={
          showGroupChat && (
            <CommunityChatLink groupId={groupId} />
          )
        }
      />

      {loading && (
        <p className="text-parchment-200">
          Loading community permissions...
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-berry-600/40 bg-berry-100 px-4 py-3 text-sm font-bold text-berry-700">
          {error}
        </p>
      )}

      {/* Owners and admins also get the join requests, in a column
          on the right on wide screens */}
      {!loading && !error && permissions && (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <MemberList
            key={groupId}
            groupId={groupId}
            permissions={permissions}
          />

          {permissions.can_review_requests && (
            <PendingRequests groupId={groupId} />
          )}
        </div>
      )}
    </div>
  );
}

export default CommunityDetails;
