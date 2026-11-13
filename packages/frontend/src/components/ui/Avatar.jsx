const COLORS = [
  "bg-forest-600",
  "bg-berry-600",
  "bg-gold-500",
  "bg-lake-700",
  "bg-wood-600"
];

const SIZES = {
  sm: "size-8 text-sm",
  md: "size-10 text-lg",
  lg: "size-16 text-2xl",
  xl: "size-24 text-4xl"
};

// The same name always gets the same color
function colorFor(name) {
  let total = 0;

  for (const character of name ?? "") {
    total = (total * 31 + character.codePointAt(0)) % 997;
  }

  return COLORS[total % COLORS.length];
}

// A round badge with the first letter of someone's name. It's hidden
// from screen readers, since the name is shown beside it, unless a
// label is passed
function Avatar({
  name = "",
  size = "md",
  label,
  className = ""
}) {
  const initial =
    (name ?? "").trim().charAt(0).toUpperCase() || "?";
  const accessibility = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true };

  return (
    <span
      {...accessibility}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-extrabold text-parchment-50 shadow-sm ring-2 ring-parchment-50/80 ${colorFor(name)} ${SIZES[size]} ${className}`}>
      {initial}
    </span>
  );
}

export default Avatar;
