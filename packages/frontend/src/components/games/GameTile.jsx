import { IconMeeple, IconX } from "../ui/icons";
import { hideImage } from "./gameDetails";

// One game in a grid of cards: its picture, name, a short line about
// it and an optional status such as an "Available" badge. Library,
// Wishlist and friends' libraries all use it. onOpen makes the card a
// button that opens the game's details; onRemove adds an X in the
// corner. Lay cards out with gameGridClass from ../ui/styles
function GameTile({
  title,
  imageUrl,
  summary,
  status,
  onOpen,
  onRemove,
  removeLabel,
  isRemoving
}) {
  const content = (
    <>
      <span className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-t-[11px] border-b border-parchment-300 bg-parchment-200">
        {/* Shows when a game has no picture, or its link is dead */}
        <IconMeeple className="size-12 text-parchment-400" />

        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={hideImage}
            className="absolute inset-0 size-full object-contain p-2"
          />
        )}
      </span>

      <span className="flex w-full flex-1 flex-col gap-1 p-3">
        {/* Leaves room for the X on the first line */}
        <span
          className={`font-display text-lg leading-tight font-bold wrap-anywhere ${
            onRemove ? "pr-8" : ""
          }`}>
          {isRemoving ? "Removing..." : title}
        </span>

        {summary && (
          <span className="text-xs text-ink-700">
            {summary}
          </span>
        )}

        {status && (
          <span className="mt-auto pt-1">{status}</span>
        )}
      </span>
    </>
  );

  return (
    <div className="relative flex flex-col rounded-xl border border-parchment-300 bg-parchment-50 text-ink-900 shadow-sm shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20">
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          disabled={isRemoving}
          aria-haspopup="dialog"
          className="flex flex-1 cursor-pointer flex-col items-start rounded-[11px] text-left disabled:cursor-default">
          {content}
        </button>
      ) : (
        <div className="flex flex-1 flex-col items-start">
          {content}
        </div>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          aria-label={removeLabel}
          className="absolute top-2 right-2 flex size-9 cursor-pointer items-center justify-center rounded-full bg-parchment-50/90 text-ink-700 shadow-sm ring-1 ring-parchment-400/70 transition-colors not-disabled:hover:bg-berry-100 not-disabled:hover:text-berry-700 disabled:cursor-default disabled:opacity-60">
          <IconX className="size-4" />
        </button>
      )}
    </div>
  );
}

export default GameTile;
