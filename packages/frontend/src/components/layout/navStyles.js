// The navbar's links, for NavLink's className. The page you're on is
// a parchment tab. On phones the links share the width, with their
// labels under the icons
export function navLinkClass({ isActive }) {
  return `relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-bold no-underline transition-colors sm:flex-none sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
    isActive
      ? "bg-parchment-100 text-ink-900 shadow-sm shadow-black/40 [--focus-color:var(--color-ink-900)]"
      : "text-parchment-200 hover:bg-wood-700/70 hover:text-parchment-50"
  }`;
}

// A round count over an icon, e.g. unread messages
export const navBadgeClass =
  "absolute top-0 left-1/2 ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry-600 px-1 text-[11px] font-extrabold text-parchment-50 ring-2 ring-wood-950 sm:static sm:ml-0";
