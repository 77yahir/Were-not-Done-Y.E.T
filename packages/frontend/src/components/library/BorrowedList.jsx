import { useEffect, useState } from "react";
import { getBorrowedGames } from "../../services/borrowing";
import GameDetailsModal from "../games/GameDetailsModal";
import ListMessage from "../games/ListMessage";
import { IconMeeple } from "../ui/icons";

// A due date like "Nov 20, 2026", in the viewer's time zone
function formatDueDate(dueAt) {
  return new Date(dueAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function BorrowedList({ statuses = ["active", "overdue"] }) {
  const [borrowings, setBorrowings] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openGame, setOpenGame] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBorrowedGames();
        setBorrowings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Unable to load in borrowed games");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const visible = borrowings.filter((b) =>
    statuses.includes(b.status)
  );

  if (loading) {
    return <ListMessage>Loading...</ListMessage>;
  }

  if (error) {
    return <ListMessage tone="error">{error}</ListMessage>;
  }

  if (visible.length === 0) {
    return <ListMessage>Nothing here yet</ListMessage>;
  }

  // On phones and tablets the list is at most about one screen tall.
  // On wide screens its panel shrinks to fit the sidebar. Either way
  // a long list scrolls inside it
  return (
    <>
      <ul className="bb-scrollbar -m-1 flex max-h-[max(10rem,calc(100vh-16rem))] flex-col gap-2 overflow-y-auto p-1 lg:max-h-none lg:min-h-0">
        {visible.map((b) => (
          <li
            key={b.borrowing_id}
            className="flex items-center gap-3 rounded-lg border border-parchment-300 bg-parchment-50 px-3 py-2 shadow-sm shadow-black/5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-parchment-200 text-wood-500">
              <IconMeeple className="size-5" />
            </span>

            <button
              type="button"
              onClick={() =>
                setOpenGame({
                  ...b.library_item?.board_game,
                  condition: b.library_item?.condition
                })
              }
              className="min-w-0 flex-1 cursor-pointer text-left">
              <span className="block font-display leading-snug font-bold wrap-anywhere">
                {b.library_item?.board_game?.title}
              </span>

              {b.due_at && (
                <span className="block text-xs text-ink-500">
                  Due {formatDueDate(b.due_at)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {openGame && (
        <GameDetailsModal
          game={openGame}
          onClose={() => setOpenGame(null)}
        />
      )}
    </>
  );
}

export default BorrowedList;
