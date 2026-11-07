import closeIcon from "../../assets/icons/close.svg";
import { hideImage } from "./gameDetails";

// A brown bar for one game, showing just its title. Library and
// Wishlist pass onOpen to make it clickable, with the game's picture
// on the left as in the Figma "Library" page and a summary under the
// title. They also pass onRemove and removeLabel to show an X button
function GameRow({
  title,
  imageUrl,
  summary,
  onOpen,
  onRemove,
  removeLabel,
  isRemoving
}) {
  if (!onOpen) {
    return (
      <div className="flex min-h-[46px] items-center justify-center bg-bb-brown px-10 py-1 text-center text-[20px]">
        {title}
      </div>
    );
  }

  return (
    <div className="relative bg-bb-brown">
      {/* Its focus outline sits just inside the bar, since the
          list's scroll area would cut off one drawn outside it */}
      <button
        type="button"
        onClick={onOpen}
        disabled={isRemoving}
        aria-haspopup="dialog"
        className="flex min-h-[46px] w-full items-center gap-1 py-px pr-9 pl-[9px] text-[20px] leading-6 focus-visible:-outline-offset-2">
        {/* The box keeps titles lined up when a game has no picture */}
        <span className="size-[43px] shrink-0">
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              onError={hideImage}
              className="size-full object-contain"
            />
          )}
        </span>

        <span className="min-w-0 grow py-0.5 text-center wrap-anywhere">
          <span className="block">
            {isRemoving ? "Removing..." : title}
          </span>
          {summary && (
            <span className="block text-[13px] leading-4">
              {summary}
            </span>
          )}
        </span>
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          aria-label={removeLabel}
          className="absolute top-1/2 right-1.5 flex size-[30px] -translate-y-1/2 items-center justify-center bg-transparent p-1.5 enabled:hover:bg-bb-brown-dark">
          <img
            src={closeIcon}
            alt=""
            width="18"
            height="18"
            className="size-[18px]"
          />
        </button>
      )}
    </div>
  );
}

export default GameRow;
