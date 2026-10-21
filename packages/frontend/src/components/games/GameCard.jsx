import closeIcon from "../../assets/icons/close.svg";

function GameCard({ game, onRemove, isRemoving }) {
  const details = `${game.min_players}–${game.max_players} players · ${game.genre}`;

  return (
    <div className="game-row" title={`${details}\n${game.description}`}>
      <span>{isRemoving ? "Removing..." : game.title}</span>

      <button
        type="button"
        className="game-row-remove"
        onClick={() => onRemove(game.library_item_id)}
        disabled={isRemoving}
        aria-label={`Remove ${game.title}`}>
        <img src={closeIcon} alt="" width="18" height="18" />
      </button>
    </div>
  );
}

export default GameCard;
