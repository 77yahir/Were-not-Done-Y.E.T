import { useState } from "react";
import { IconDice, IconHeart } from "../components/ui/icons";
import Notice from "../components/ui/Notice";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";
import AddWishlistGame from "../components/wishlist/AddWishlistGame";
import WishlistList from "../components/wishlist/WishlistList";

function Wishlist() {
  // Remount the list after a game is added so it reloads
  const [listKey, setListKey] = useState(0);
  const [gameAdded, setGameAdded] = useState(false);

  function handleGameAdded() {
    setGameAdded(true);
    setListKey((key) => key + 1);
  }

  // On wide screens the page is exactly the height of the screen
  // below the navbar (4rem, plus the page's 3rem of padding), and a
  // long wishlist scrolls inside its panel. On a very short screen the
  // panel keeps room for a row of games and the page scrolls instead
  return (
    <div className="lg:flex lg:h-[calc(100vh-7rem)] lg:min-h-[26rem] lg:flex-col">
      <PageHeader
        title="Wishlist"
        subtitle="Remember the games you'd like to get next."
        icon={<IconHeart className="size-8" />}
      />

      <Panel
        title="My Wishlist"
        icon={<IconDice className="size-5" />}
        action={
          <AddWishlistGame
            onOpen={() => setGameAdded(false)}
            onGameAdded={handleGameAdded}
          />
        }
        className="flex flex-col lg:min-h-0 lg:flex-1"
        bodyClassName="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
        {gameAdded && (
          <Notice tone="success">
            Added to your wishlist!
          </Notice>
        )}
        <WishlistList key={listKey} />
      </Panel>
    </div>
  );
}

export default Wishlist;
