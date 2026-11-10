import { useEffect, useRef } from "react";
import Notice from "../ui/Notice";
import { IconChat } from "../ui/icons";
import MessageBubble from "./MessageBubble";

// The scrolling list of messages in a conversation or group chat.
// Group chats pass showSenders so each message is labelled with its
// sender's name. A short chat sits at the bottom, next to the message
// box, and a long one scrolls. The first child's top margin does
// that: unlike justify-content, an auto margin never pushes messages
// out of reach above the top
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
      className="bb-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl bg-parchment-200/50 p-3 shadow-inner shadow-black/5 ring-1 ring-parchment-300 sm:p-4 [&>:first-child]:mt-auto">
      {!data && !error && (
        <Notice className="m-auto text-center">
          Loading messages...
        </Notice>
      )}

      {!data && error && (
        <Notice
          role="alert"
          tone="error"
          className="m-auto text-center">
          Failed to load messages
        </Notice>
      )}

      {messageCount === 0 && (
        <div className="m-auto flex flex-col items-center gap-2 text-center">
          <IconChat className="size-10 text-wood-400" />
          <Notice>{emptyText}</Notice>
        </div>
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
