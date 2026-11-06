import { apiFetch } from "./api";

export async function addGame(game) {
  return apiFetch("/games/library", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: game.title,
      min_players: game.minPlayers,
      max_players: game.maxPlayers,
      genre: game.genre,
      description: game.description,
      condition: game.condition,
      image_url: game.imageUrl,
      min_age: game.minAge,
      avg_playing_time: game.avgPlayingTime
    })
  });
}

export async function removeGame(libraryItemId) {
  return apiFetch(`/games/library/${libraryItemId}`, {
    method: "DELETE"
  });
}

export async function getGames() {
  return apiFetch("/games/library");
}

// Board game search through BoardGameGeek
export async function searchGames(searchTerm) {
  const query = encodeURIComponent(searchTerm);

  return apiFetch(`/games/search?query=${query}`);
}

export async function getSearchedGame(bggId) {
  return apiFetch(`/games/search/${bggId}`);
}
