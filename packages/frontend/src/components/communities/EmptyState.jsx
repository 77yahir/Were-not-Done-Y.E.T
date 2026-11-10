import Notice from "../ui/Notice";

// What a list shows when there's nothing in it: a faint icon in a
// circle over a short line of text
function EmptyState({ icon, children }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-parchment-200 text-wood-500 ring-1 ring-parchment-300">
        {icon}
      </span>

      <Notice>{children}</Notice>
    </div>
  );
}

export default EmptyState;
