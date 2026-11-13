import { useEffect } from "react";
import { IconX } from "./icons";

// A parchment pop-up over the dimmed page. Escape, the X and a click
// outside it all close it. Its body scrolls when it's taller than the
// screen, while the title stays put
function Modal({ title, onClose, children }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-wood-950/70 p-4 backdrop-blur-[2px]"
      onClick={onClose}>
      <div
        className="bg-parchment flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-parchment-300 text-ink-900 shadow-panel [--focus-color:var(--color-ink-900)]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-parchment-300 px-5 py-3">
          <h2 className="text-2xl font-extrabold">{title}</h2>

          <button
            type="button"
            className="-mr-2 flex size-10 cursor-pointer items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-parchment-200 hover:text-ink-900"
            onClick={onClose}
            aria-label="Close">
            <IconX className="size-5" />
          </button>
        </div>

        <div className="bb-scrollbar flex flex-col overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
