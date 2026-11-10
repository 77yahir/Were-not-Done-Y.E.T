// Line icons drawn in the current text color, so the same icon works
// on the dark wood and on parchment. They're decorative: put the
// words next to them, or an aria-label on the button around them.
// Size them with a class, e.g. <IconLibrary className="size-6" />

function Svg({
  filled,
  className = "size-5",
  children,
  ...props
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}>
      {children}
    </svg>
  );
}

// The Board Buddies logo: a game piece
export function IconMeeple(props) {
  return (
    <Svg filled {...props}>
      <circle cx="12" cy="5.1" r="3.4" />
      <path d="M9.4 8.4C6.4 8.8 3.2 9.4 2.3 10.6c-.7 1 0 2.2 1.3 2.2h4.1l-2.8 7.4c-.3.9.2 1.5 1.1 1.5h3.4c.6 0 1-.3 1.2-.8L12 17.6l1.4 3.3c.2.5.6.8 1.2.8H18c.9 0 1.4-.6 1.1-1.5l-2.8-7.4h4.1c1.3 0 2-1.2 1.3-2.2-.9-1.2-4.1-1.8-7.1-2.2Z" />
    </Svg>
  );
}

export function IconLibrary(props) {
  return (
    <Svg {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z" />
    </Svg>
  );
}

export function IconHeart(props) {
  return (
    <Svg {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
    </Svg>
  );
}

export function IconUser(props) {
  return (
    <Svg {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
    </Svg>
  );
}

export function IconUsers(props) {
  return (
    <Svg {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
    </Svg>
  );
}

export function IconUserPlus(props) {
  return (
    <Svg {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM20 8v6M23 11h-6" />
    </Svg>
  );
}

export function IconMail(props) {
  return (
    <Svg {...props}>
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 2-10 7L2 6" />
    </Svg>
  );
}

export function IconChat(props) {
  return (
    <Svg {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
    </Svg>
  );
}

export function IconBell(props) {
  return (
    <Svg {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

export function IconSearch(props) {
  return (
    <Svg {...props}>
      <path d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
    </Svg>
  );
}

export function IconPlus(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconX(props) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  );
}

export function IconCheck(props) {
  return (
    <Svg {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function IconChevronDown(props) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconArrowLeft(props) {
  return (
    <Svg {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

export function IconLogOut(props) {
  return (
    <Svg {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </Svg>
  );
}

export function IconClock(props) {
  return (
    <Svg {...props}>
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2" />
    </Svg>
  );
}

// Borrowing and lending
export function IconSwap(props) {
  return (
    <Svg {...props}>
      <path d="m17 1 4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
    </Svg>
  );
}

export function IconInbox(props) {
  return (
    <Svg {...props}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </Svg>
  );
}

// Finding communities
export function IconCompass(props) {
  return (
    <Svg {...props}>
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z" />
    </Svg>
  );
}

export function IconDice(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="16" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="8" cy="16" r="1.2" fill="currentColor" />
      <circle cx="16" cy="16" r="1.2" fill="currentColor" />
    </Svg>
  );
}
