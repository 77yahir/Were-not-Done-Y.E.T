import { useState } from "react";
import AddGame from "../components/games/AddGame";
import GameList from "../components/games/GameList";
import ListMessage from "../components/games/ListMessage";
import BorrowedList from "../components/library/BorrowedList";
import {
  IconClock,
  IconDice,
  IconInbox,
  IconLibrary,
  IconSwap
} from "../components/ui/icons";
import Notice from "../components/ui/Notice";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";

// Panels from the Figma "Library" page that aren't built yet
const UPCOMING_PANELS = [
  { title: "Lent Out", Icon: IconClock },
  { title: "Requested", Icon: IconInbox }
];

function Boardgames() {
  // Remount the list after a game is added so it reloads
  const [listKey, setListKey] = useState(0);
  const [gameAdded, setGameAdded] = useState(false);

  function handleGameAdded() {
    setGameAdded(true);
    setListKey((key) => key + 1);
  }

  // On wide screens the page is exactly the height of the screen
  // below the navbar (4rem, plus the page's 3rem of padding), and long
  // lists scroll inside their panels instead of making it longer. On a
  // screen too short to fit the sidebar's panels, the page keeps a
  // usable height and scrolls instead
  return (
    <div className="lg:flex lg:h-[calc(100vh-7rem)] lg:min-h-[32rem] lg:flex-col">
      <PageHeader
        title="Library"
        subtitle="Keep track of the games you own and borrow."
        icon={<IconLibrary className="size-8" />}
      />

      <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel
          title="My Collection"
          icon={<IconDice className="size-5" />}
          action={
            <AddGame
              onOpen={() => setGameAdded(false)}
              onGameAdded={handleGameAdded}
            />
          }
          className="flex flex-col lg:min-h-0"
          bodyClassName="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
          {gameAdded && (
            <Notice tone="success">Game added!</Notice>
          )}
          <GameList key={listKey} />
        </Panel>

        {/* A long Borrowing list shrinks its panel to fit the sidebar
            and scrolls inside it */}
        <div className="flex flex-col gap-5 lg:min-h-0">
          <Panel
            title="Borrowing"
            icon={<IconSwap className="size-5" />}
            className="flex flex-col lg:min-h-0"
            bodyClassName="flex flex-col lg:min-h-0">
            <BorrowedList />
          </Panel>

          {UPCOMING_PANELS.map(({ title, Icon }) => (
            <Panel
              key={title}
              title={title}
              icon={<Icon className="size-5" />}
              className="shrink-0">
              <ListMessage>Nothing here yet</ListMessage>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Boardgames;
