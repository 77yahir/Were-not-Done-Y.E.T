import { apiFetch } from "./api";

export async function getUserProfile(userId) {
  return apiFetch(`/users/${userId}`, {
    method: "GET"
  });
}

export async function getUserLibrary(userId) {
  return apiFetch(`/users/${userId}/library`, {
    method: "GET"
  });
}

export async function updateMyUsername(username) {
  return apiFetch("/users/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username })
  });
}

export async function updateMyAvatar(avatarId) {
  return apiFetch("/users/me/avatar", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ avatar_id: avatarId })
  });
}
