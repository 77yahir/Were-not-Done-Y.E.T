import { useState } from "react";
import AddGame from "../components/games/AddGame";
import GameList from "../components/games/GameList";

// Columns from the Figma "Library" page that aren't built yet
const UPCOMING_COLUMNS = ["Borrowing", "Lent Out", "Requested"];

function Boardgames() {
  // Remount the list after a game is added so it reloads
  const [listKey, setListKey] = useState(0);

  return (
    <div className="library">
      <section className="library-column">
        <h2>My Collection</h2>

        <AddGame onGameAdded={() => setListKey((key) => key + 1)} />
        <GameList key={listKey} />
      </section>

      {UPCOMING_COLUMNS.map((title) => (
        <section key={title} className="library-column">
          <h2>{title}</h2>
          <p className="library-empty">Nothing here yet</p>
        </section>
      ))}
    </div>
  );
}

export default Boardgames;
