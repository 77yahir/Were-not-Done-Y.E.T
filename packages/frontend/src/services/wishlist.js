import { apiFetch } from "./api";

export async function addToWishlist(game) {
  return apiFetch("/wishlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: game.title,
      min_players: game.minPlayers,
      max_players: game.maxPlayers,
      genre: game.genre,
      description: game.description
    })
  });
}

export async function removeFromWishlist(wishlistItemId) {
  return apiFetch(`/wishlist/${wishlistItemId}`, {
    method: "DELETE"
  });
}

export async function getWishlist() {
  return apiFetch("/wishlist");
}
