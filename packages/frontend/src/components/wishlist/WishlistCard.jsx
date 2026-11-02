import closeIcon from "../../assets/icons/close.svg";

function WishlistCard({ game, onRemove, isRemoving }) {
  const details = `${game.min_players}–${game.max_players} players · ${game.genre}`;

  return (
    <div className="game-row" title={`${details}\n${game.description}`}>
      <span>{isRemoving ? "Removing..." : game.title}</span>

      <button
        type="button"
        className="game-row-remove"
        onClick={() => onRemove(game.wishlist_item_id)}
        disabled={isRemoving}
        aria-label={`Remove ${game.title} from wishlist`}>
        <img src={closeIcon} alt="" width="18" height="18" />
      </button>
    </div>
  );
}

export default WishlistCard;
