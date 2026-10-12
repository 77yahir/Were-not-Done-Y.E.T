function GameCard({ game, onRemove, isRemoving }) {
  return (
    <div>
      <p>
        <strong>{game.title}</strong> ({game.min_players}–
        {game.max_players} players, {game.genre})
      </p>
      <p>{game.description}</p>

      <button
        type="button"
        onClick={() => onRemove(game.library_item_id)}
        disabled={isRemoving}>
        {isRemoving ? "Removing..." : "Remove Game"}
      </button>
    </div>
  );
}

export default GameCard;
