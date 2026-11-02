import { useState } from "react";
import AddWishlistGame from "../components/wishlist/AddWishlistGame";
import WishlistList from "../components/wishlist/WishlistList";

function Wishlist() {
  // Remount the list after a game is added so it reloads
  const [listKey, setListKey] = useState(0);

  return (
    <section className="wishlist">
      <h2>My Wishlist</h2>

      <AddWishlistGame onGameAdded={() => setListKey((key) => key + 1)} />
      <WishlistList key={listKey} />
    </section>
  );
}

export default Wishlist;
