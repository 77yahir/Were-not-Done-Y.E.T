import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { logOut } from "../../services/auth";
import Avatar from "../ui/Avatar";
import {
  IconChevronDown,
  IconHeart,
  IconLibrary,
  IconLogOut,
  IconMeeple,
  IconUser,
  IconUsers
} from "../ui/icons";
import MessagesNavLink from "./MessagesNavLink";
import NotificationBell from "./NotificationBell";
import { navLinkClass } from "./navStyles";

const NAV_LINKS = [
  { to: "/collection", label: "Library", Icon: IconLibrary },
  { to: "/wishlist", label: "Wishlist", Icon: IconHeart },
  { to: "/friends", label: "Friends", Icon: IconUser },
  { to: "/communities", label: "Communities", Icon: IconUsers }
];

// The dark wood bar at the top of every logged-in page. On wide
// screens it's one 64px row. Narrower, the links move to a second row
function Navbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Username comes from sign-up; fall back to email for older accounts
  const displayName =
    user?.user_metadata?.username || user?.email;

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
    <header className="bg-wood-bar sticky top-0 z-40 border-b border-wood-700 shadow-lg shadow-black/40 lg:h-16">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 sm:px-5 lg:h-full lg:flex-nowrap lg:py-0">
        <Link
          to="/collection"
          className="flex shrink-0 items-center gap-2 rounded-lg no-underline">
          <IconMeeple className="size-8 text-gold-400 drop-shadow-[0_2px_0_rgb(0_0_0/0.5)]" />
          <span className="font-display text-xl font-extrabold tracking-wide text-gold-300 uppercase [text-shadow:0_2px_0_rgb(0_0_0/0.55)] sm:text-2xl">
            Board Buddies
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="order-last flex w-full items-center gap-1 lg:order-none lg:w-auto">
          {NAV_LINKS.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              <Icon className="size-5 shrink-0" />
              {label}
            </NavLink>
          ))}

          <MessagesNavLink />
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <NotificationBell />

          <div className="relative">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-full py-1 pr-2 pl-1 text-parchment-100 transition-colors hover:bg-wood-700/70"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}>
              <Avatar name={displayName} size="sm" />
              {/* Hidden on smaller screens, but still the button's name */}
              <span className="sr-only max-w-32 truncate text-sm font-bold xl:not-sr-only">
                {displayName}
              </span>
              <IconChevronDown className="size-4 shrink-0" />
            </button>

            {menuOpen && (
              <div className="bg-parchment absolute right-0 z-50 mt-2 w-44 rounded-xl border border-parchment-300 p-1.5 text-ink-900 shadow-panel [--focus-color:var(--color-ink-900)]">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors not-disabled:hover:bg-parchment-200 disabled:cursor-default disabled:opacity-60"
                  onClick={handleLogOut}
                  disabled={loggingOut}>
                  <IconLogOut className="size-4" />
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
