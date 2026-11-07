// The rows of a Library, Borrowing or Wishlist list. The column or
// panel around it is at most one screen tall, so once there are
// more games than fit, the rows scroll inside it with a thin brown
// scroll bar instead of making the whole page longer
function GameRows({ children }) {
  return (
    <div className="bb-scrollbar flex min-h-0 flex-col gap-[7px] overflow-y-auto">
      {children}
    </div>
  );
}

export default GameRows;
