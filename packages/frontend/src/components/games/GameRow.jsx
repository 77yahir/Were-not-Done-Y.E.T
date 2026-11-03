import closeIcon from "../../assets/icons/close.svg";

// A brown bar with a game's title centered. Lists that can remove
// games also pass onRemove and removeLabel to show an X button
function GameRow({
  title,
  tooltip,
  onRemove,
  removeLabel,
  isRemoving
}) {
  return (
    <div
      title={tooltip}
      className="relative flex min-h-[46px] items-center justify-center bg-bb-brown px-10 py-1 text-center text-[20px]">
      <span>{isRemoving ? "Removing..." : title}</span>

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
