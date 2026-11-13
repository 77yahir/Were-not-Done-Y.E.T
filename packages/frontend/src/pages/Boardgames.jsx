import { useState } from "react";
import AddGame from "../components/games/AddGame";
import GameList from "../components/games/GameList";
import ListMessage from "../components/games/ListMessage";
import BorrowedList from "../components/library/BorrowedList";
import LentOutList from "../components/library/LentOutList";

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

function Boardgames() {
  const [listKey, setListKey] = useState(0);
  const [gameAdded, setGameAdded] = useState(false);

  function handleGameAdded() {
    setGameAdded(true);
    setListKey((key) => key + 1);
  }

  return (
    <div className="lg:flex lg:h-[calc(100vh-7rem)] lg:min-h-[32rem] lg:flex-col">
      <PageHeader
        title="Library"
        subtitle="Keep track of the games you own and borrow."
        icon={<IconLibrary className="size-8" />}
      />

      <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* My Collection */}
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

        {/* Borrowing and loan management */}
        <div className="flex flex-col gap-5 lg:min-h-0">
          <Panel
            title="Borrowing"
            icon={<IconSwap className="size-5" />}
            className="flex flex-col lg:min-h-0"
            bodyClassName="flex flex-col lg:min-h-0">
            <BorrowedList statuses={["active", "overdue"]} />
          </Panel>

          <Panel
            title="Pending"
            icon={<IconInbox className="size-5" />}
            className="shrink-0">
            <BorrowedList statuses={["pending"]} />
          </Panel>

          <Panel
            title="Lent Out"
            icon={<IconClock className="size-5" />}
            className="shrink-0">
            <LentOutList
              onChange={() => setListKey((key) => key + 1)}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default Boardgames;
