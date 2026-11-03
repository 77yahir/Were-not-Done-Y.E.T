import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { usePolledData } from "../../hooks/usePolledData";
import {
  getMessages,
  markConversationRead,
  sendMessage
} from "../../services/messages";
import MessageBubble from "./MessageBubble";
import MessageForm from "./MessageForm";

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

  const messages = data?.messages;
  const messageCount = messages?.length;
  const newestUnreadId = messages?.findLast(
    (message) => !message.is_mine && !message.read_at
  )?.message_id;

  const listRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messageCount]);

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

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        className="flex flex-1 flex-col gap-2 overflow-y-auto bg-bb-tan-overlay p-3">
        {!data && !error && (
          <p className="m-0 text-center">Loading messages...</p>
        )}

        {!data && error && (
          <p role="alert" className="m-0 text-center">
            Failed to load messages
          </p>
        )}

        {messageCount === 0 && (
          <p className="m-0 text-center">
            No messages yet. Say hello!
          </p>
        )}

        {messages?.map((message) => (
          <MessageBubble key={message.message_id} message={message} />
        ))}
      </div>

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
