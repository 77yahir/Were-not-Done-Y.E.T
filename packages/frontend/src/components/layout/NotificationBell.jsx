import { useEffect, useState } from "react";
import { getNotifications, markAsRead } from "../../services/notifications"
import bell from "../../assets/icons/bell.svg"

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [error, setError] = useState(null)

    useEffect(() => {
        async function load() {
            try {
                const data = await getNotifications();
                setNotifications(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setError("Could not load notifications")
            }
        }
        load();
    }, []);

    const unreadCount = notifications.filter((n) => !n.is_read).length

    async function handleClick(notification) {
        if (notification.is_read) return;
    

        try {
            await markAsRead(notification.notification_id);
            setNotifications((prev) => 
                prev.map((n) => 
                    n.notification_id === notification.notification_id ? {...n, is_read: true} : n
                )
            );
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="nav-user notification-bell">
        <button
            type="button"
            className="nav-user-button notification-bell-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={`Notifications, ${unreadCount} unread`}>
            <img src={bell} alt="" width="28" height="28" />
            {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
            )}
        </button>

        {menuOpen && (
            <div className="nav-user-menu notification-menu">
            {error && <p>{error}</p>}
            {!error && notifications.length === 0 && <p>No notifications</p>}

            <ul>
                {notifications.map((n) => (
                <li key={n.notification_id}>
                    <button
                    type="button"
                    className={n.is_read ? "read" : "unread"}
                    onClick={() => handleClick(n)}>
                    {n.sender?.username && <strong>{n.sender.username} </strong>}
                    {n.message}
                    </button>
                </li>
                ))}
            </ul>
            </div>
        )}
        </div>
    );
}

export default NotificationBell