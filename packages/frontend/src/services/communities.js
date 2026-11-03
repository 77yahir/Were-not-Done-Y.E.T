import { apiFetch } from "./api";

export async function createCommunity(name, description) {
  return apiFetch("/communities/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: name,
      description: description
    })
  });
}

export async function reviewJoinRequest(
  membershipId,
  decision
) {
  return apiFetch(
    `/communities/requests/${membershipId}/review`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        decision: decision
      })
    }
  );
}

export async function getPendingJoinRequests(groupId) {
  return apiFetch(`/communities/${groupId}/requests`, {
    method: "GET"
  });
}

export async function getMyCommunityPermissions(groupId) {
  return apiFetch(`/communities/${groupId}/membership/me`, {
    method: "GET"
  });
}

export async function removeCommunityMember(groupId, userId) {
  return apiFetch(`/communities/${groupId}/members/${userId}`, {
    method: "DELETE"
  });
}

export async function getCommunityMembers(groupId) {
  return apiFetch(`/communities/${groupId}/members`, {
    method: "GET"
  });
}

export async function getMyCommunities() {
  return apiFetch("/communities/mine", {
    method: "GET"
  });
}
