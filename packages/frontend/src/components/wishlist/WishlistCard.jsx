import GameRow from "../games/GameRow";

function WishlistCard({ game, onRemove, isRemoving }) {
  const details = `${game.min_players}–${game.max_players} players · ${game.genre}`;

  return (
    <GameRow
      title={game.title}
      tooltip={`${details}\n${game.description}`}
      onRemove={() => onRemove(game.wishlist_item_id)}
      removeLabel={`Remove ${game.title} from wishlist`}
      isRemoving={isRemoving}
    />
  );
}

export default WishlistCard;
