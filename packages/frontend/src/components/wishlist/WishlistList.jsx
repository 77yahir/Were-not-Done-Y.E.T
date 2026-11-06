import { useEffect, useState } from "react";
import {
  getWishlist,
  removeFromWishlist
} from "../../services/wishlist.js";
import GameDetailsModal from "../games/GameDetailsModal.jsx";
import ListMessage from "../games/ListMessage.jsx";
import WishlistCard from "./WishlistCard.jsx";

function WishlistList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [openGame, setOpenGame] = useState(null);

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
    return <ListMessage>Loading wishlist...</ListMessage>;
  }

  if (error) {
    return <ListMessage>{error}</ListMessage>;
  }

  return (
    <>
      {message && <ListMessage>{message}</ListMessage>}

      {games.length === 0 ? (
        <ListMessage>No games on your wishlist yet</ListMessage>
      ) : (
        games.map((game) => (
          <WishlistCard
            key={game.wishlist_item_id}
            game={game}
            onOpen={setOpenGame}
            onRemove={handleRemoveGame}
            isRemoving={removingId === game.wishlist_item_id}
          />
        ))
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

export default WishlistList;
