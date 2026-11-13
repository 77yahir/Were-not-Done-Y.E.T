import Pill from "../ui/Pill";
import GameTile from "./GameTile";
import { gameSummary } from "./gameDetails";

// A badge saying whether the game can be borrowed. Nothing when the
// API leaves is_available out
function availabilityPill(isAvailable) {
  if (isAvailable === true) {
    return <Pill tone="green">Available</Pill>;
  }

  if (isAvailable === false) {
    return <Pill tone="red">Unavailable</Pill>;
  }

  return null;
}

// One game in My Collection
function GameCard({ game, onOpen, onRemove, isRemoving }) {
  return (
    <GameTile
      title={game.title}
      imageUrl={game.image_url}
      summary={gameSummary(game)}
      status={availabilityPill(game.is_available)}
      onOpen={() => onOpen(game)}
      onRemove={() => onRemove(game.library_item_id)}
      removeLabel={`Remove ${game.title}`}
      isRemoving={isRemoving}
    />
  );
}

export default GameCard;
