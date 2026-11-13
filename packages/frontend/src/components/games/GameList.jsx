import { useEffect, useState } from "react";
import {
  getGames,
  removeGame
} from "../../services/games.js";
import GameCard from "./GameCard.jsx";
import GameDetailsModal from "./GameDetailsModal.jsx";
import GameRows from "./GameRows.jsx";
import ListMessage from "./ListMessage.jsx";

function GameList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [openGame, setOpenGame] = useState(null);

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
    return <ListMessage>Loading games...</ListMessage>;
  }

  if (error) {
    return <ListMessage>{error}</ListMessage>;
  }

  const visibleGames = games.filter((game) => game.is_available);

  return (
    <>
      {message && <ListMessage>{message}</ListMessage>}

      {visibleGames.length === 0 ? (
        <ListMessage>No games yet</ListMessage>
      ) : (
        <GameRows>
          {games.map((game) => (
            <GameCard
              key={game.library_item_id}
              game={game}
              onOpen={setOpenGame}
              onRemove={handleRemoveGame}
              isRemoving={removingId === game.library_item_id}
            />
          ))}
        </GameRows>
      )}

      {openGame && (
        <GameDetailsModal
          game={openGame}
          onClose={() => setOpenGame(null)}
        />
      )}
    </>
  );
}

export default GameList;
