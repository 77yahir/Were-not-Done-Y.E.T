import { useEffect, useState } from "react";
import { getUserLibrary } from "../../services/users";
import GameDetailsModal from "../games/GameDetailsModal";

export default function UserLibrary({ userId }) {
  const [games, setGames] = useState([]);
  const [openGame, setOpenGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLibrary() {
      setLoading(true);
      setError("");
      setGames([]);
      setOpenGame(null);

      try {
        const result = await getUserLibrary(userId);

        if (active) {
          setGames(result.games ?? []);
        }
      } catch (error) {
        if (active) {
          if (error.status === 403) {
            setError(
              "Become friends to view this user's library"
            );
          } else {
            setError("Unable to load this user's library");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (userId) {
      loadLibrary();
    }

    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <section>
      <h2>Game Library</h2>

      {loading && <p>Loading games...</p>}

      {error && (
        <p className="text-base font-normal">{error}</p>
      )}

      {!loading && !error && games.length === 0 && (
        <p>No games in this library yet</p>
      )}

      {!loading &&
        !error &&
        games.map((game) => (
          <div key={game.library_item_id}>
            <p>{game.title}</p>

            <button
              type="button"
              onClick={() => setOpenGame(game)}>
              View Details
            </button>
          </div>
        ))}

      {openGame && (
        <GameDetailsModal
          game={openGame}
          onClose={() => setOpenGame(null)}
        />
      )}
    </section>
  );
}
