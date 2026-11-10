import { useState, useEffect, useRef } from "react";
import { getSession } from "../../services/auth";
import {
  getCommunityMembers,
  removeCommunityMember
} from "../../services/communities";
import MessageLink from "../messages/MessageLink";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Notice from "../ui/Notice";
import Panel from "../ui/Panel";
import { IconUsers } from "../ui/icons";
import EmptyState from "./EmptyState";
import RolePill from "./RolePill";

export function MemberList({ groupId, permissions }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState("");
  const [myUserId, setMyUserId] = useState(null);

  const processingRef = useRef(false);
  const generationRef = useRef(0);

  useEffect(() => {
    getSession().then((session) => {
      setMyUserId(session?.user.id ?? null);
    });
  }, []);

  async function handleRemove(member) {
    if (processingRef.current) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.username} from this community?`
    );

    if (!confirmed) {
      return;
    }

    processingRef.current = true;
    const removeGeneration = generationRef.current;

    setRemoveError("");
    setRemovingId(member.user_id);

    try {
      await removeCommunityMember(groupId, member.user_id);

      if (removeGeneration !== generationRef.current) {
        return;
      }

      setMembers((currentMembers) =>
        currentMembers.filter(
          (currentMember) =>
            currentMember.user_id !== member.user_id
        )
      );
    } catch (error) {
      if (removeGeneration === generationRef.current) {
        setRemoveError("Failed to remove community member");
      }
    } finally {
      processingRef.current = false;

      if (removeGeneration === generationRef.current) {
        setRemovingId(null);
      }
    }
  }

  function canRemoveMember(member) {
    if (!permissions?.can_review_requests) {
      return false;
    }

    if (member.role === "owner") {
      return false;
    }

    if (permissions.role === "owner") {
      return (
        member.role === "member" || member.role === "admin"
      );
    }

    if (permissions.role === "admin") {
      return member.role === "member";
    }

    return false;
  }

  useEffect(() => {
    let ignore = false;
    generationRef.current += 1;

    setMembers([]);
    setError("");
    setRemoveError("");
    setRemovingId(null);

    async function loadMembers() {
      setLoading(true);

      try {
        const data = await getCommunityMembers(groupId);

        if (!ignore) {
          setMembers(data.members ?? []);
        }
      } catch (error) {
        if (!ignore) {
          setError("Failed to load community members");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (groupId) {
      loadMembers();
    } else {
      setLoading(false);
      setError("No community selected");
    }

    return () => {
      ignore = true;
      generationRef.current += 1;
    };
  }, [groupId]);

  // On wide screens this shares a row with the join requests, and
  // lg:flex-1 gives it all the room they leave
  return (
    <Panel
      title="Community Members"
      icon={<IconUsers className="size-5" />}
      className="min-w-0 lg:flex-1"
      bodyClassName="flex flex-col gap-3">
      {loading && <Notice>Loading community members...</Notice>}

      {error && (
        <Notice tone="error" role="alert">
          {error}
        </Notice>
      )}

      {removeError && (
        <Notice tone="error" role="alert">
          {removeError}
        </Notice>
      )}

      {!loading && !error && members.length === 0 && (
        <EmptyState icon={<IconUsers className="size-6" />}>
          No community members found
        </EmptyState>
      )}

      {/* As many columns as fit. empty:hidden drops the list's gap
          when there are no members */}
      {!loading && !error && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(22rem,100%),1fr))] gap-3 empty:hidden">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-parchment-300 bg-parchment-50 p-3 shadow-sm shadow-black/10">
              <div className="flex min-w-0 flex-1 basis-40 items-center gap-3">
                <Avatar name={member.username} />

                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight font-bold wrap-anywhere">
                    {member.username}
                  </p>
                  <p className="mt-1">
                    <RolePill role={member.role} />
                  </p>
                </div>
              </div>

              {/* Wraps onto its own line when the card is narrow */}
              <div className="ml-auto flex flex-wrap gap-2 empty:hidden">
                {myUserId && member.user_id !== myUserId && (
                  <MessageLink userId={member.user_id} />
                )}

                {canRemoveMember(member) && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={removingId !== null || loading}
                    onClick={() => handleRemove(member)}>
                    {removingId === member.user_id
                      ? "Removing..."
                      : "Remove"}
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
