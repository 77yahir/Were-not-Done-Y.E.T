import { useEffect, useRef, useState } from "react";
import {
  getSearchedGame,
  searchGames
} from "../../services/games";
import { GAME_FIELD_CLASS } from "./gameDetails";

const MIN_SEARCH_LENGTH = 3;

// Wait for a pause in typing so every keystroke doesn't call BGG
const SEARCH_DELAY_MS = 600;

// BGG leaves out numbers it doesn't know
function toFormNumber(value) {
  return value ? String(value) : "";
}

// Convert a picked game into Add Game form values
function toFormDetails(game) {
  return {
    title: game.title,
    minPlayers: toFormNumber(game.min_players),
    maxPlayers: toFormNumber(game.max_players),
    genre: game.genre,
    description: game.description,
    imageUrl: game.image_url ?? "",
    minAge: toFormNumber(game.min_age),
    avgPlayingTime: toFormNumber(game.avg_playing_time)
  };
}

// Search BoardGameGeek and fill in the form with the picked game
function GameSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const isOpen = useRef(true);

  const searchTerm = query.trim();
  const showResults = searchTerm.length >= MIN_SEARCH_LENGTH;

  // The pop-up can close while a picked game is still loading.
  // That game must not fill in the form the next time it opens
  useEffect(() => {
    isOpen.current = true;

    return () => {
      isOpen.current = false;
    };
  }, []);

  useEffect(() => {
    if (searchTerm.length < MIN_SEARCH_LENGTH) {
      return;
    }

    let active = true;

    const timer = setTimeout(async () => {
      setMessage("Searching...");

      try {
        const result = await searchGames(searchTerm);
        if (active) {
          setResults(result.games);
          setMessage(
            result.games.length === 0 ? "No matches found" : ""
          );
        }
      } catch (error) {
        if (active) {
          setResults([]);
          setMessage(
            "Search isn't available right now. You can still type the details below."
          );
          console.error(error);
        }
      }
    }, SEARCH_DELAY_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  async function handleSelect(game) {
    setLoadingId(game.bgg_id);

    try {
      const result = await getSearchedGame(game.bgg_id);
      if (!isOpen.current) return;

      onSelect(toFormDetails(result.game));
      setQuery("");
      setResults([]);
      setMessage("");
    } catch (error) {
      setMessage(
        "Couldn't load that game. Pick another or type the details below."
      );
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  }

  function handleKeyDown(e) {
    // Enter would otherwise submit the whole form
    if (e.key === "Enter") {
      e.preventDefault();
    }
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search for a game"
        aria-label="Search BoardGameGeek for a game"
        autoComplete="off"
        className={GAME_FIELD_CLASS}
        autoFocus
      />

      {showResults && message && (
        <p
          className="m-0 text-center text-[13px]"
          role="status">
          {message}
        </p>
      )}

      {showResults && results.length > 0 && (
        <ul className="m-0 flex max-h-[200px] list-none flex-col gap-1 overflow-y-auto p-0">
          {results.map((game) => (
            <li key={game.bgg_id}>
              <button
                type="button"
                onClick={() => handleSelect(game)}
                disabled={loadingId !== null}
                className="flex w-full items-center gap-2 text-left text-[16px]">
                {/* The box keeps names lined up when a game has no image */}
                <span className="size-10 shrink-0 bg-bb-tan">
                  {game.thumbnail && (
                    <img
                      src={game.thumbnail}
                      alt=""
                      className="size-full object-contain"
                    />
                  )}
                </span>
                <span>
                  {loadingId === game.bgg_id
                    ? "Loading..."
                    : game.year > 0
                      ? `${game.name} (${game.year})`
                      : game.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* BGG's terms require crediting them by name. A public
          release would need their "Powered by BGG" logo here */}
      <a
        className="text-center text-[13px] text-bb-text"
        href="https://boardgamegeek.com"
        target="_blank"
        rel="noreferrer">
        Powered by BoardGameGeek
      </a>
    </div>
  );
}

export default GameSearch;
