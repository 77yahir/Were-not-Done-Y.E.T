const TONES = {
  green: "bg-forest-100 text-forest-800 ring-forest-600/25",
  red: "bg-berry-100 text-berry-700 ring-berry-600/25",
  blue: "bg-lake-100 text-lake-700 ring-lake-700/20",
  gold: "bg-gold-300/50 text-ink-900 ring-gold-500/40",
  neutral: "bg-parchment-200 text-ink-700 ring-parchment-400/60"
};

// A small rounded label for a status or role, e.g. "Available",
// "Pending" or "Owner". tone is green, red, blue, gold or neutral
function Pill({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ring-1 ring-inset ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export default Pill;
