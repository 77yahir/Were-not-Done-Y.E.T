import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { usePolledData } from "../../hooks/usePolledData";
import {
  getUnreadMessageCount,
  MESSAGES_READ_EVENT
} from "../../services/messages";
import { IconMail } from "../ui/icons";
import { navBadgeClass, navLinkClass } from "./navStyles";

// How often the navbar checks for new messages
const POLL_MS = 15000;

function MessagesNavLink() {
  const { data, reload } = usePolledData(
    getUnreadMessageCount,
    POLL_MS
  );
  const unreadCount = data?.unread_count ?? 0;

  useEffect(() => {
    window.addEventListener(MESSAGES_READ_EVENT, reload);

    return () => {
      window.removeEventListener(MESSAGES_READ_EVENT, reload);
    };
  }, [reload]);

  return (
    <NavLink to="/messages" className={navLinkClass}>
      <IconMail className="size-5 shrink-0" />
      Messages
      {unreadCount > 0 && (
        <span className={navBadgeClass}>
          {unreadCount}
          <span className="sr-only"> unread</span>
        </span>
      )}
    </NavLink>
  );
}

export default MessagesNavLink;
