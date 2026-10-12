import { apiFetch } from "./api";

export async function searchUsers(username) {
  const query = encodeURIComponent(username);

  return apiFetch(`/friends/search?username=${query}`);
}

export async function sendFriendRequest(recipientUserId) {
  return apiFetch("/friends/requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      recipient_user_id: recipientUserId
    })
  });
}

export async function removeFriend(friendshipId) {
  return apiFetch(`/friends/friendships/${friendshipId}`, {
    method: "DELETE"
  });
}

export async function getFriends() {
  return apiFetch("/friends/friendships");
}
