const TIME_FORMAT = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
};

function MessageBubble({ message }) {
  const sentAt = new Date(message.created_at);

  return (
    <div
      className={`max-w-[75%] px-3 py-2 ${
        message.is_mine
          ? "self-end bg-bb-brown"
          : "self-start bg-bb-cream"
      }`}>
      <p className="m-0 wrap-anywhere whitespace-pre-wrap">
        {message.body}
      </p>

      <time
        dateTime={message.created_at}
        className="mt-1 block text-right text-xs">
        {sentAt.toLocaleString([], TIME_FORMAT)}
      </time>
    </div>
  );
}

export default MessageBubble;
