import GameRow from "./GameRow";
import { gameSummary } from "./gameDetails";

function GameCard({ game, onOpen, onRemove, isRemoving }) {
  return (
    <GameRow
      title={game.title}
      imageUrl={game.image_url}
      summary={gameSummary(game)}
      onOpen={() => onOpen(game)}
      onRemove={() => onRemove(game.library_item_id)}
      removeLabel={`Remove ${game.title}`}
      isRemoving={isRemoving}
    />
  );
}

export default GameCard;
