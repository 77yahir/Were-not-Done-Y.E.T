import { NavLink } from "react-router-dom";
import Avatar from "../ui/Avatar";

// One row in the Messages list, for a direct message or a community
// chat: who it's with, a line about the latest message and, when
// there is one, a count of unread messages. The chat that's open is
// highlighted with a green bar on its left
function ChatCard({ to, name, preview, unreadCount = 0 }) {
  const hasUnread = unreadCount > 0;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
          isActive
            ? "bg-parchment-200 shadow-sm shadow-black/10 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-forest-600"
            : "hover:bg-parchment-200/60"
        }`
      }>
      <Avatar name={name} />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-bold">
            {name}
          </span>

          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-berry-600 px-1.5 text-xs font-extrabold text-parchment-50">
              {unreadCount}
              <span className="sr-only"> unread</span>
            </span>
          )}
        </span>

        <span
          className={`block truncate text-sm ${
            hasUnread
              ? "font-bold text-ink-900"
              : "text-ink-700"
          }`}>
          {preview}
        </span>
      </span>
    </NavLink>
  );
}

export default ChatCard;
