import { useState } from "react";
import AddGame from "../components/games/AddGame";
import GameList from "../components/games/GameList";

function Boardgames() {
  // Remount the list after a game is added so it reloads
  const [listKey, setListKey] = useState(0);

  return (
    <div>
      <h1>My Collection</h1>

      <AddGame onGameAdded={() => setListKey((key) => key + 1)} />
      <GameList key={listKey} />
    </div>
  );
}

export default Boardgames;
