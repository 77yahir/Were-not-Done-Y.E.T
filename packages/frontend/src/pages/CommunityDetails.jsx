import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MemberList } from "../components/communities/MemberList";
import { PendingRequests } from "../components/communities/PendingRequests";
import CommunityChatLink from "../components/messages/CommunityChatLink";
import PageHeader from "../components/ui/PageHeader";
import { IconUsers } from "../components/ui/icons";
import {
  getMyCommunityPermissions,
  getCommunityDetails,
  requestToJoinCommunity
} from "../services/communities";

function CommunityDetails() {
  const { groupId } = useParams();

  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [community, setCommunity] = useState(null);
  const [communityLoading, setCommunityLoading] =
    useState(true);
  const [communityError, setCommunityError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [membersRefreshVersion, setMembersRefreshVersion] =
    useState(0);

  useEffect(() => {
    setRequesting(false);
    setRequestError("");
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

  useEffect(() => {
    let ignore = false;

    setCommunity(null);
    setCommunityLoading(true);
    setCommunityError("");

    async function loadCommunity() {
      try {
        const result = await getCommunityDetails(groupId);

        if (!ignore) {
          if (result.community) {
            setCommunity(result.community);
          } else {
            setCommunityError("Community not found");
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load community:", error);
          setCommunityError(
            "Failed to load community information"
          );
        }
      } finally {
        if (!ignore) {
          setCommunityLoading(false);
        }
      }
    }

    if (groupId) {
      loadCommunity();
    } else {
      setCommunity(null);
      setCommunityLoading(false);
      setCommunityError("No community selected");
    }

    return () => {
      ignore = true;
    };
  }, [groupId]);

  async function handleJoinRequest() {
    if (requesting) return;

    setRequesting(true);
    setRequestError("");

    try {
      await requestToJoinCommunity(groupId);

      setPermissions((current) => ({
        ...current,
        status: "pending",
        can_review_requests: false
      }));
    } catch (error) {
      console.error(error);
      setRequestError("Failed to submit join request");
    } finally {
      setRequesting(false);
    }
  }

  // Approved members are in the community's group chat
  const showGroupChat =
    !loading && !error && permissions?.status === "approved";

  return (
    <div>
      <PageHeader
        title={
          communityLoading
            ? "Loading community..."
            : (community?.name ?? "Community Details")
        }
        subtitle={
          community?.description ??
          "Meet the people in this community."
        }
        icon={<IconUsers className="size-8" />}
        action={
          showGroupChat && (
            <CommunityChatLink groupId={groupId} />
          )
        }
      />

      {!loading && !error && permissions && (
        <div className="mb-4">
          {permissions.status === "pending" && (
            <p>Request Pending</p>
          )}

          {(permissions.status === null ||
            permissions.status === "rejected" ||
            permissions.status === "removed") && (
            <button
              type="button"
              disabled={requesting}
              onClick={handleJoinRequest}>
              {requesting ? "Submitting..." : "Request to Join"}
            </button>
          )}

          {requestError && <p role="alert">{requestError}</p>}
        </div>
      )}

      {!loading &&
        !error &&
        permissions?.status === "approved" && (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <MemberList
              key={groupId}
              groupId={groupId}
              permissions={permissions}
              refreshVersion={membersRefreshVersion}
            />

            {permissions.can_review_requests && (
              <PendingRequests
                groupId={groupId}
                onMemberApproved={() =>
                  setMembersRefreshVersion(
                    (version) => version + 1
                  )
                }
              />
            )}
          </div>
        )}

      {communityError && (
        <p role="alert" className="text-sm text-berry-700">
          {communityError}
        </p>
      )}

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
    </div>
  );
}

export default CommunityDetails;
