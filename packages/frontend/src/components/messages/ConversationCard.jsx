import { NavLink } from "react-router-dom";

function getPreview(conversation) {
  if (conversation.last_message) {
    return conversation.last_message;
  }

  return conversation.is_friend ? "Friend" : "Community member";
}

function ConversationCard({ conversation }) {
  return (
    <NavLink
      to={`/messages/${conversation.user_id}`}
      className={({ isActive }) =>
        `block p-2 text-bb-text no-underline hover:bg-bb-brown-dark ${
          isActive ? "bg-bb-brown-dark" : "bg-bb-brown"
        }`
      }>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate">{conversation.username}</span>

        {conversation.unread_count > 0 && (
          <span className="rounded-full bg-bb-cream px-1.5 text-xs">
            {conversation.unread_count}
            <span className="sr-only"> unread</span>
          </span>
        )}
      </span>

      <span className="block truncate text-xs">
        {getPreview(conversation)}
      </span>
    </NavLink>
  );
}

export default ConversationCard;
