import { useEffect, useState } from "react";
import {
  getGames,
  removeGame
} from "../../services/games.js";
import GameCard from "./GameCard.jsx";

function GameList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState(null);

  async function handleRemoveGame(libraryItemId) {
    setRemovingId(libraryItemId);
    setMessage("");

    try {
      await removeGame(libraryItemId);

      setGames((current) =>
        current.filter(
          (game) =>
            game.library_item_id !== libraryItemId
        )
      );

      setMessage("Game removed successfully");
    } catch (error) {
      setMessage("Failed to remove game");
      console.error(error);
    } finally {
      setRemovingId(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadGames() {
      try {
        const result = await getGames();
        if (active) {
          setGames(result.games);
        }
      } catch (error) {
        if (active) {
          setError("Failed to load games");
          console.error(error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGames();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="library-empty">Loading games...</p>;
  }

  if (error) {
    return <p className="library-empty">{error}</p>;
  }

  return (
    <>
      {message && <p className="library-empty">{message}</p>}

      {games.length === 0 ? (
        <p className="library-empty">No games yet</p>
      ) : (
        games.map((game) => (
          <GameCard
            key={game.library_item_id}
            game={game}
            onRemove={handleRemoveGame}
            isRemoving={removingId === game.library_item_id}
          />
        ))
      )}
    </>
  );
}

export default GameList;
