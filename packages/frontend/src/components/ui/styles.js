// Tailwind classes shared by many components. They live here, not in
// the component files, so React's fast refresh keeps working

const BUTTON_BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg font-bold no-underline transition-colors disabled:cursor-default disabled:opacity-60";

const BUTTON_VARIANTS = {
  // The main action on a page or form, in green
  primary:
    "border border-transparent bg-forest-600 text-parchment-50 shadow-sm shadow-black/25 not-disabled:hover:bg-forest-700",
  // Everything else
  secondary:
    "border border-parchment-400 bg-parchment-50 text-ink-900 shadow-sm shadow-black/10 not-disabled:hover:bg-parchment-200",
  // Quiet actions, e.g. Back
  ghost:
    "border border-transparent text-ink-700 not-disabled:hover:bg-parchment-200 not-disabled:hover:text-ink-900",
  // Removing or declining something
  danger:
    "border border-berry-600/40 bg-parchment-50 text-berry-700 shadow-sm shadow-black/10 not-disabled:hover:bg-berry-100"
};

const BUTTON_SIZES = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-3 text-lg"
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className = ""
} = {}) {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;
}

// Text boxes, text areas and drop-downs on parchment
export const fieldClass =
  "w-full rounded-lg border border-parchment-400 bg-parchment-50 px-3 py-2 text-ink-900 shadow-inner shadow-black/5 placeholder:text-ink-500 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/30 focus:outline-none disabled:opacity-60";

// A grid of game cards that fits as many columns as there's room for
export const gameGridClass =
  "grid grid-cols-[repeat(auto-fill,minmax(min(9.5rem,calc(50%-0.375rem)),1fr))] gap-3";
