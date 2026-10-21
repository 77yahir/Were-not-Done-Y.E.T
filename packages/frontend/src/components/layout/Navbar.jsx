import { useState } from "react";
import { NavLink } from "react-router-dom";
import { logOut } from "../../services/auth";
import avatarIcon from "../../assets/icons/avatar.svg";
import bookIcon from "../../assets/icons/book.svg";
import chevronIcon from "../../assets/icons/chevron-down.svg";
import userIcon from "../../assets/icons/user.svg";
import usersIcon from "../../assets/icons/users.svg";

const NAV_LINKS = [
  { to: "/collection", label: "Library", icon: bookIcon },
  { to: "/friends", label: "Friends", icon: userIcon },
  { to: "/communities", label: "Communities", icon: usersIcon }
];

function Navbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Username comes from sign-up; fall back to email for older accounts
  const displayName = user?.user_metadata?.username || user?.email;

  async function handleLogOut() {
    setLoggingOut(true);

    try {
      // PageLayout redirects to the start page once the session ends
      await logOut();
    } catch (error) {
      console.error(error);
      setLoggingOut(false);
    }
  }

  return (
    <nav className="navbar">
      {NAV_LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} className="nav-button">
          <img src={link.icon} alt="" width="32" height="32" />
          {link.label}
        </NavLink>
      ))}

      <div className="nav-user">
        <button
          type="button"
          className="nav-user-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}>
          <img src={avatarIcon} alt="" width="34" height="34" />
          <span className="nav-user-name">{displayName}</span>
          <img src={chevronIcon} alt="" width="14" height="7" />
        </button>

        {menuOpen && (
          <div className="nav-user-menu">
            <button
              type="button"
              onClick={handleLogOut}
              disabled={loggingOut}>
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
