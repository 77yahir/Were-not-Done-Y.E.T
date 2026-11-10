import { useEffect, useState } from "react";
import {
  getNotifications,
  markAsRead
} from "../../services/notifications";
import { IconBell } from "../ui/icons";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Could not load notifications");
      }
    }
    load();
  }, []);

  const unreadCount = notifications.filter(
    (n) => !n.is_read
  ).length;

  async function handleClick(notification) {
    if (notification.is_read) return;

    try {
      await markAsRead(notification.notification_id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notification.notification_id
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex size-10 cursor-pointer items-center justify-center rounded-full text-parchment-200 transition-colors hover:bg-wood-700/70 hover:text-parchment-50"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-label={`Notifications, ${unreadCount} unread`}>
        <IconBell className="size-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry-600 px-1 text-[11px] font-extrabold text-parchment-50 ring-2 ring-wood-950">
            {unreadCount}
          </span>
        )}
      </button>

      {menuOpen && (
        <div className="bg-parchment bb-scrollbar absolute right-0 z-50 mt-2 max-h-80 w-80 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-xl border border-parchment-300 p-1.5 text-ink-900 shadow-panel [--focus-color:var(--color-ink-900)]">
          <p className="px-2.5 pt-1 pb-2 font-display text-lg font-bold">
            Notifications
          </p>

          {error && (
            <p className="px-2.5 pb-2 text-sm text-berry-700">
              {error}
            </p>
          )}
          {!error && notifications.length === 0 && (
            <p className="px-2.5 pb-2 text-sm text-ink-700">
              No notifications
            </p>
          )}

          <ul className="flex flex-col gap-1">
            {notifications.map((n) => (
              <li key={n.notification_id}>
                <button
                  type="button"
                  className={`flex w-full cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-parchment-200 ${
                    n.is_read
                      ? "text-ink-500"
                      : "bg-parchment-50 text-ink-900"
                  }`}
                  onClick={() => handleClick(n)}>
                  {/* A red dot marks the ones not read yet */}
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      n.is_read ? "" : "bg-berry-600"
                    }`}
                  />
                  <span>
                    {!n.is_read && (
                      <span className="sr-only">Unread: </span>
                    )}
                    {n.sender?.username && (
                      <strong>{n.sender.username} </strong>
                    )}
                    {n.message}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
