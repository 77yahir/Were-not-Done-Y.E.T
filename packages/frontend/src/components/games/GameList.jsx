import { useEffect, useState } from "react";
import { getGames, removeGame } from "../../services/games.js";
import { IconMeeple } from "../ui/icons.jsx";
import Notice from "../ui/Notice.jsx";
import GameCard from "./GameCard.jsx";
import GameDetailsModal from "./GameDetailsModal.jsx";
import GameGrid from "./GameGrid.jsx";
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
          (game) => game.library_item_id !== libraryItemId
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
    return <ListMessage tone="error">{error}</ListMessage>;
  }

  return (
    <>
      {message && (
        <Notice
          tone={
            message === "Failed to remove game"
              ? "error"
              : "success"
          }>
          {message}
        </Notice>
      )}

      {games.length === 0 ? (
        <ListMessage icon={<IconMeeple className="size-8" />}>
          No games yet
        </ListMessage>
      ) : (
        <GameGrid>
          {games.map((game) => (
            <GameCard
              key={game.library_item_id}
              game={game}
              onOpen={setOpenGame}
              onRemove={handleRemoveGame}
              isRemoving={removingId === game.library_item_id}
            />
          ))}
        </GameGrid>
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
