const TIME_FORMAT = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
};

// Group chats set showSender to name who wrote other people's messages.
// Your own messages are green on the right, everyone else's are on
// the left
function MessageBubble({ message, showSender }) {
  const sentAt = new Date(message.created_at);

  return (
    <div
      className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${
        message.is_mine
          ? "self-end rounded-br-md bg-forest-600 text-parchment-50 shadow-black/20"
          : "self-start rounded-bl-md bg-parchment-50 text-ink-900 shadow-black/5 ring-1 ring-parchment-300"
      }`}>
      {showSender && !message.is_mine && (
        <span className="mb-0.5 block text-xs font-bold wrap-anywhere text-wood-600">
          {message.sender_username}
        </span>
      )}

      <p className="wrap-anywhere whitespace-pre-wrap">
        {message.body}
      </p>

      <time
        dateTime={message.created_at}
        className={`mt-1 block text-right text-xs ${
          message.is_mine ? "text-forest-100" : "text-ink-500"
        }`}>
        {sentAt.toLocaleString([], TIME_FORMAT)}
      </time>
    </div>
  );
}

export default MessageBubble;
