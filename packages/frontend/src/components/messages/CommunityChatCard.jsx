import { NavLink } from "react-router-dom";

function getPreview(chat) {
  if (!chat.last_message) {
    return "No messages yet";
  }

  return `${chat.last_sender_username}: ${chat.last_message}`;
}

function CommunityChatCard({ chat }) {
  return (
    <NavLink
      to={`/messages/communities/${chat.group_id}`}
      className={({ isActive }) =>
        `block p-2 text-bb-text no-underline hover:bg-bb-brown-dark ${
          isActive ? "bg-bb-brown-dark" : "bg-bb-brown"
        }`
      }>
      <span className="block truncate">{chat.name}</span>

      <span className="block truncate text-xs">
        {getPreview(chat)}
      </span>
    </NavLink>
  );
}

export default CommunityChatCard;
