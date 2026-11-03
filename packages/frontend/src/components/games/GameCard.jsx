import GameRow from "./GameRow";

function GameCard({ game, onRemove, isRemoving }) {
  const details = `${game.min_players}–${game.max_players} players · ${game.genre}`;

  return (
    <GameRow
      title={game.title}
      tooltip={`${details}\n${game.description}`}
      onRemove={() => onRemove(game.library_item_id)}
      removeLabel={`Remove ${game.title}`}
      isRemoving={isRemoving}
    />
  );
}

export default GameCard;
