import { useEffect, useState } from "react";
import { getUserLibrary } from "../../services/users";
import GameDetailsModal from "../games/GameDetailsModal";
import { requestBorrow } from "../../services/borrowing";
import GameTile from "../games/GameTile";
import { gameSummary } from "../games/gameDetails";
import Notice from "../ui/Notice";
import Panel from "../ui/Panel";
import Pill from "../ui/Pill";
import { IconLibrary, IconMeeple } from "../ui/icons";
import { gameGridClass } from "../ui/styles";

// The badge on a game's card, as in your own Library. Nothing when
// the library doesn't say
function availabilityPill(game) {
  if (game.is_available === true) {
    return <Pill tone="green">Available</Pill>;
  }

  if (game.is_available === false) {
    return <Pill tone="red">Unavailable</Pill>;
  }

  return null;
}

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
    } catch (error) {
      if (error.status === 409) {
        setMessage("That game is already borrowed");
      } else if (error.status === 403) {
        setMessage("You can only borrow from friends");
      } else {
        setMessage("Could not send request");
      }
    } finally {
      setRequestingId(null);
    }
  }

  return (
    <Panel
      title="Game Library"
      icon={<IconLibrary className="size-5" />}>
      {loading && <Notice>Loading games...</Notice>}
      {message && <Notice>{message}</Notice>}

      {/* Not being friends yet is the usual reason, so this isn't
          shown as an error */}
      {error && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <IconMeeple className="size-10 text-parchment-400" />
          <Notice>{error}</Notice>
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <IconMeeple className="size-10 text-parchment-400" />
          <Notice>No games in this library yet</Notice>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <div className={gameGridClass}>
          {games.map((game) => (
            <div
              key={game.library_item_id}
              className="flex flex-col gap-2">
              <GameTile
                title={game.title}
                imageUrl={game.image_url}
                summary={gameSummary(game)}
                status={availabilityPill(game)}
                onOpen={() => setOpenGame(game)}
              />

              <button
                type="button"
                disabled={
                  !game.is_available || requestingId !== null
                }
                onClick={() => handleRequest(game)}
                className="rounded-lg bg-wood-700 px-3 py-2 text-sm font-semibold text-parchment-50 disabled:cursor-not-allowed disabled:opacity-50">
                {requestingId === game.library_item_id
                  ? "Requesting..."
                  : game.is_available
                    ? "Request to Borrow"
                    : "Currently Borrowed"}
              </button>
            </div>
          ))}
        </div>
      )}

      {openGame && (
        <GameDetailsModal
          game={openGame}
          onClose={() => setOpenGame(null)}
        />
      )}
    </Panel>
  );
}
