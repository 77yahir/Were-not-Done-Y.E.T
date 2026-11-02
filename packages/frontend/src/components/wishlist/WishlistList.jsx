import { useEffect, useState } from "react";
import {
  getWishlist,
  removeFromWishlist
} from "../../services/wishlist.js";
import WishlistCard from "./WishlistCard.jsx";

function WishlistList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState(null);

  async function handleRemoveGame(wishlistItemId) {
    setRemovingId(wishlistItemId);
    setMessage("");

    try {
      await removeFromWishlist(wishlistItemId);

      setGames((current) =>
        current.filter(
          (game) =>
            game.wishlist_item_id !== wishlistItemId
        )
      );

      setMessage("Game removed from your wishlist");
    } catch (error) {
      setMessage("Failed to remove game");
      console.error(error);
    } finally {
      setRemovingId(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadWishlist() {
      try {
        const result = await getWishlist();
        if (active) {
          setGames(result.games);
        }
      } catch (error) {
        if (active) {
          setError("Failed to load wishlist");
          console.error(error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadWishlist();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="library-empty">Loading wishlist...</p>;
  }

  if (error) {
    return <p className="library-empty">{error}</p>;
  }

  return (
    <>
      {message && <p className="library-empty">{message}</p>}

      {games.length === 0 ? (
        <p className="library-empty">No games on your wishlist yet</p>
      ) : (
        games.map((game) => (
          <WishlistCard
            key={game.wishlist_item_id}
            game={game}
            onRemove={handleRemoveGame}
            isRemoving={removingId === game.wishlist_item_id}
          />
        ))
      )}
    </>
  );
}

export default WishlistList;
