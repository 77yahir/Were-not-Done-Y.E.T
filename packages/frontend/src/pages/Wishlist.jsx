import { useState } from "react";
import AddWishlistGame from "../components/wishlist/AddWishlistGame";
import WishlistList from "../components/wishlist/WishlistList";

function Wishlist() {
  // Remount the list after a game is added so it reloads
  const [listKey, setListKey] = useState(0);

  return (
    <section className="tailwind-page mx-auto mt-[7px] flex max-w-[480px] flex-col gap-[7px] bg-bb-cream px-6 py-4">
      <h2 className="text-center text-[20px]">My Wishlist</h2>

      <AddWishlistGame onGameAdded={() => setListKey((key) => key + 1)} />
      <WishlistList key={listKey} />
    </section>
  );
}

export default Wishlist;
