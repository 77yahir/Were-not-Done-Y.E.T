import Notice from "../ui/Notice";

// Short status text in a Library or Wishlist panel, like "Loading
// games...". tone is "muted", "error" or "success". With an icon it's
// the bigger message an empty list shows, centered in the space the
// games would fill
function ListMessage({ tone = "muted", icon, children }) {
  if (icon) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center lg:flex-1">
        <span className="flex size-16 items-center justify-center rounded-full bg-parchment-200 text-wood-500 ring-1 ring-parchment-300">
          {icon}
        </span>
        <p className="font-display text-xl font-bold text-ink-700">
          {children}
        </p>
      </div>
    );
  }

  return (
    <Notice tone={tone} className="py-1 text-center">
      {children}
    </Notice>
  );
}

export default ListMessage;
