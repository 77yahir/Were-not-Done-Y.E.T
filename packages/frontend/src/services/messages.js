import { apiFetch } from "./api";

// Fired after messages are read so the navbar badge can refresh
export const MESSAGES_READ_EVENT = "messages-read";

export async function getConversations() {
  return apiFetch("/messages/conversations");
}

export async function getMessages(userId) {
  return apiFetch(`/messages/conversations/${userId}`);
}

export async function sendMessage(userId, body) {
  return apiFetch(`/messages/conversations/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body })
  });
}

export async function markConversationRead(userId) {
  const result = await apiFetch(
    `/messages/conversations/${userId}/read`,
    {
      method: "PATCH"
    }
  );

  window.dispatchEvent(new Event(MESSAGES_READ_EVENT));

  return result;
}

export async function getUnreadMessageCount() {
  return apiFetch("/messages/unread-count");
}

// Group chats, one per community the user is an approved member of
export async function getCommunityChats() {
  return apiFetch("/messages/communities");
}

export async function getCommunityMessages(groupId) {
  return apiFetch(`/messages/communities/${groupId}`);
}

export async function sendCommunityMessage(groupId, body) {
  return apiFetch(`/messages/communities/${groupId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body })
  });
}
