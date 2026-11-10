import { useCallback, useEffect } from "react";
import { usePolledData } from "../../hooks/usePolledData";
import {
  getMessages,
  markConversationRead,
  sendMessage
} from "../../services/messages";
import Notice from "../ui/Notice";
import MessageForm from "./MessageForm";
import MessageLog from "./MessageLog";
import ThreadHeader from "./ThreadHeader";

// How often an open conversation checks for new messages
const POLL_MS = 5000;

function MessageThread({ contact, onChange }) {
  const {
    user_id: userId,
    username,
    can_message: canMessage
  } = contact;

  const fetchMessages = useCallback(
    () => getMessages(userId),
    [userId]
  );
  const { data, error, reload } = usePolledData(
    fetchMessages,
    POLL_MS
  );

  const newestUnreadId = data?.messages?.findLast(
    (message) => !message.is_mine && !message.read_at
  )?.message_id;

  // An open conversation counts as read, including new arrivals
  useEffect(() => {
    if (!newestUnreadId) {
      return;
    }

    markConversationRead(userId)
      .then(() => Promise.all([reload(), onChange()]))
      .catch(console.error);
  }, [newestUnreadId, userId, reload, onChange]);

  async function handleSend(body) {
    await sendMessage(userId, body);
    await Promise.all([reload(), onChange()]);
  }

  return (
    <section
      aria-label={`Conversation with ${username}`}
      className="flex min-h-0 flex-1 flex-col gap-3">
      <ThreadHeader name={username} />

      <MessageLog
        data={data}
        error={error}
        emptyText="No messages yet. Say hello!"
      />

      {canMessage ? (
        <MessageForm onSend={handleSend} />
      ) : (
        <Notice className="rounded-lg bg-parchment-200/60 px-3 py-2.5 ring-1 ring-parchment-300">
          You can't message {username} right now because you're
          not friends or in the same community.
        </Notice>
      )}
    </section>
  );
}

export default MessageThread;
