import { useEffect, useState } from "react";
import { getUserLibrary } from "../../services/users";
import GameDetailsModal from "../games/GameDetailsModal";
import { requestBorrow } from "../../services/borrowing";

export default function UserLibrary({ userId }) {
  const [games, setGames] = useState([]);
  const [openGame, setOpenGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingId, setRequestingId] = useState(null);
  const [message, setMessage] = useState("");

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


    async function handleRequest(game) {
      setRequestingId(game.library_item_id);
      setMessage("");

      try {
        await requestBorrow(game.library_item_id);
        setMessage(`Request sent for ${game.title}`);
      } catch (err) {
        if (error.status === 409) {
          setMessage("That game is already borrowed");
        }
        else if (error.status === 403) {
          setMessage("You can only borrow from friends")
        }
        else {
          setMessage("Could not send request")
        }
      } finally {
        setRequestingId(null);
      }
    }

  return (
    <section>
      <h2>Game Library</h2>
      {message && <p>{message}</p>}

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
            <button
            type="button"
            disabled={!game.is_available || requestingId === game.library_item_id}
            onClick={() => handleRequest(game)}>
              {game.is_available ? "Request to Borrow" : "Currently Borrowed"}
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
