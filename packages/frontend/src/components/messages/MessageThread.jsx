import { useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePolledData } from "../../hooks/usePolledData";
import {
  getMessages,
  markConversationRead,
  sendMessage
} from "../../services/messages";
import MessageForm from "./MessageForm";
import MessageLog from "./MessageLog";

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
      className="flex h-[calc(100vh-20rem)] min-h-96 flex-col gap-2 md:h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-3">
        <Link to="/messages" className="text-bb-text md:hidden">
          Back
        </Link>

        <h2 className="truncate text-xl">{username}</h2>
      </div>

      <MessageLog
        data={data}
        error={error}
        emptyText="No messages yet. Say hello!"
      />

      {canMessage ? (
        <MessageForm onSend={handleSend} />
      ) : (
        <p className="m-0 text-sm">
          You can't message {username} right now because you're not
          friends or in the same community.
        </p>
      )}
    </section>
  );
}

export default MessageThread;
