import GameRow from "../games/GameRow";
import { gameSummary } from "../games/gameDetails";

function WishlistCard({ game, onOpen, onRemove, isRemoving }) {
  return (
    <GameRow
      title={game.title}
      imageUrl={game.image_url}
      summary={gameSummary(game)}
      onOpen={() => onOpen(game)}
      onRemove={() => onRemove(game.wishlist_item_id)}
      removeLabel={`Remove ${game.title} from wishlist`}
      isRemoving={isRemoving}
    />
  );
}

export default WishlistCard;
