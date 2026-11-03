import { useState } from "react";
import AddGame from "../components/games/AddGame";
import GameList from "../components/games/GameList";
import ListMessage from "../components/games/ListMessage";
import BorrowedList from "../components/library/BorrowedList";

// Columns from the Figma "Library" page that aren't built yet
const UPCOMING_COLUMNS = ["Lent Out", "Requested"];

function LibraryColumn({ title, children }) {
  return (
    <section className="flex min-h-60 flex-col gap-[7px] bg-bb-cream px-[17px] pt-[7px] pb-6 min-[1001px]:min-h-[calc(100vh-100px)]">
      <h2 className="text-center text-[20px]">{title}</h2>
      {children}
    </section>
  );
}

function Boardgames() {
  // Remount the list after a game is added so it reloads
  const [listKey, setListKey] = useState(0);

  return (
    <div className="tailwind-page grid grid-cols-1 gap-6 min-[561px]:grid-cols-2 min-[1001px]:grid-cols-4">
      <LibraryColumn title="My Collection">
        <AddGame onGameAdded={() => setListKey((key) => key + 1)} />
        <GameList key={listKey} />
      </LibraryColumn>

      <LibraryColumn title="Borrowing">
        <BorrowedList />
      </LibraryColumn>

      {UPCOMING_COLUMNS.map((title) => (
        <LibraryColumn key={title} title={title}>
          <ListMessage>Nothing here yet</ListMessage>
        </LibraryColumn>
      ))}
    </div>
  );
}

export default Boardgames;
