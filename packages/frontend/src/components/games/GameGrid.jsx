import { gameGridClass } from "../ui/styles";

// The game cards of the Library or Wishlist. Once there are more
// games than fit, the cards scroll inside their panel with a thin
// scroll bar instead of making the whole page longer. On phones and
// tablets the grid is at most about one screen tall; on wide screens
// the panel fills the screen and the grid takes the rest of it. The
// padding keeps a card's hover lift and focus outline from being cut
// off at the edges of the scroll area
function GameGrid({ children }) {
  return (
    <div className="bb-scrollbar -m-2 max-h-[max(15rem,calc(100vh-16rem))] overflow-y-auto p-2 lg:max-h-none lg:min-h-0 lg:flex-1">
      <div className={gameGridClass}>{children}</div>
    </div>
  );
}

export default GameGrid;
