import { useEffect, useRef, useState } from "react";
import {
  getSearchedGame,
  searchGames
} from "../../services/games";
import { IconSearch } from "../ui/icons";
import { fieldClass } from "../ui/styles";

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
    <div className="flex flex-col gap-2 border-b border-parchment-300 pb-3">
      <div className="relative">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a game"
          aria-label="Search BoardGameGeek for a game"
          autoComplete="off"
          className={`${fieldClass} pl-9`}
          autoFocus
        />
      </div>

      {showResults && message && (
        <p
          className="text-center text-sm text-ink-700"
          role="status">
          {message}
        </p>
      )}

      {showResults && results.length > 0 && (
        <ul className="bb-scrollbar flex max-h-52 flex-col gap-0.5 overflow-y-auto rounded-lg border border-parchment-300 bg-parchment-50 p-1">
          {results.map((game) => (
            <li key={game.bgg_id}>
              <button
                type="button"
                onClick={() => handleSelect(game)}
                disabled={loadingId !== null}
                className="flex w-full cursor-pointer items-center gap-3 rounded-md p-1.5 text-left text-sm transition-colors not-disabled:hover:bg-parchment-200 disabled:cursor-default disabled:opacity-60">
                {/* The box keeps names lined up when a game has no image */}
                <span className="size-10 shrink-0 overflow-hidden rounded bg-parchment-200">
                  {game.thumbnail && (
                    <img
                      src={game.thumbnail}
                      alt=""
                      className="size-full object-contain"
                    />
                  )}
                </span>
                <span className="min-w-0 wrap-anywhere">
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
        className="self-center py-1 text-xs text-ink-500 underline underline-offset-2 hover:text-ink-900"
        href="https://boardgamegeek.com"
        target="_blank"
        rel="noreferrer">
        Powered by BoardGameGeek
      </a>
    </div>
  );
}

export default GameSearch;
