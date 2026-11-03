import { useEffect, useState } from "react";
import { getSearchedGame, searchGames } from "../../services/games";

const MIN_SEARCH_LENGTH = 3;

// Wait for a pause in typing; BGG allows one request every 2 seconds
const SEARCH_DELAY_MS = 600;

// Convert a picked game into Add Game form values
function toFormDetails(game) {
  return {
    title: game.title,
    minPlayers: game.min_players ? String(game.min_players) : "",
    maxPlayers: game.max_players ? String(game.max_players) : "",
    genre: game.genre,
    description: game.description
  };
}

// Search BoardGameGeek and fill in the form with the picked game
function GameSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const searchTerm = query.trim();
  const showResults = searchTerm.length >= MIN_SEARCH_LENGTH;

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
          setMessage(result.games.length === 0 ? "No matches found" : "");
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
      onSelect(toFormDetails(result.game));
      setQuery("");
      setResults([]);
      setMessage("");
    } catch (error) {
      setMessage("Couldn't load that game. Pick another or type the details below.");
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
    <div className="game-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search for a game"
        aria-label="Search BoardGameGeek for a game"
        autoComplete="off"
        autoFocus
      />

      {showResults && message && (
        <p className="game-search-message" role="status">
          {message}
        </p>
      )}

      {showResults && results.length > 0 && (
        <ul className="game-search-results">
          {results.map((game) => (
            <li key={game.bgg_id}>
              <button
                type="button"
                onClick={() => handleSelect(game)}
                disabled={loadingId !== null}>
                {loadingId === game.bgg_id
                  ? "Loading..."
                  : game.year > 0
                    ? `${game.name} (${game.year})`
                    : game.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* BGG's terms ask apps to credit them */}
      <a
        className="game-search-credit"
        href="https://boardgamegeek.com"
        target="_blank"
        rel="noreferrer">
        Powered by BoardGameGeek
      </a>
    </div>
  );
}

export default GameSearch;
