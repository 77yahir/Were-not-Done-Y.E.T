import { useState, useEffect, useRef } from "react";
import {
  getCommunityMembers,
  removeCommunityMember
} from "../../services/communities";

export function MemberList({ groupId, permissions }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState("");

  const processingRef = useRef(false);
  const generationRef = useRef(0);

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

  return (
    <div>
      <h2>Community Members</h2>

      {loading && <p>Loading community members...</p>}

      {error && <p role="alert">{error}</p>}

      {removeError && <p role="alert">{removeError}</p>}

      {!loading && !error && members.length === 0 && (
        <p>No community members found</p>
      )}

      {!loading &&
        !error &&
        members.map((member) => (
          <div key={member.user_id}>
            <p>{member.username}</p>
            <p>Role: {member.role}</p>

            {canRemoveMember(member) && (
              <button
                disabled={removingId !== null || loading}
                onClick={() => handleRemove(member)}>
                {removingId === member.user_id
                  ? "Removing..."
                  : "Remove"}
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
