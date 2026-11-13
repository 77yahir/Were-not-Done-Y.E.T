const TONES = {
  muted: "text-ink-700",
  error: "text-berry-700",
  success: "text-forest-700"
};

// Short status text on parchment: loading, empty lists, results and
// errors. Pass role="alert" where the old text had it, so screen
// readers still announce errors
function Notice({
  tone = "muted",
  role,
  className = "",
  children
}) {
  return (
    <p
      role={role}
      className={`text-sm ${TONES[tone]} ${className}`}>
      {children}
    </p>
  );
}

export default Notice;
