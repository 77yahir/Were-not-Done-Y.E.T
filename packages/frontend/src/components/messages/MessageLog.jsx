import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

// The scrolling list of messages in a conversation or group chat.
// Group chats pass showSenders so each message is labelled with its
// sender's name
function MessageLog({ data, error, emptyText, showSenders }) {
  const messages = data?.messages;
  const messageCount = messages?.length;
  const listRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messageCount]);

  return (
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
        <p className="m-0 text-center">{emptyText}</p>
      )}

      {messages?.map((message) => (
        <MessageBubble
          key={message.message_id}
          message={message}
          showSender={showSenders}
        />
      ))}
    </div>
  );
}

export default MessageLog;
