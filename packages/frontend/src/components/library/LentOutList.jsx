import { useEffect, useState } from "react";
import { getMyLending } from "../../services/borrowing";
import { gameSummary } from "../games/gameDetails";
import GameDetailsModal from "../games/GameDetailsModal";
import GameRow from "../games/GameRow";
import GameRows from "../games/GameRows";
import ListMessage from "../games/ListMessage";

// used for later implementation
// function formatDate(value) {
//   return new Date(value).toLocaleDateString();
// }

function LentOutList() {
  const [lending, setLending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openGame, setOpenGame] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyLending();
        setLending(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Unable to load lent out games");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const lentOut = lending.filter(
    (l) => l.status === "active" || l.status === "overdue"
  );

  if (loading) return <ListMessage>Loading...</ListMessage>;
  if (error) return <ListMessage>{error}</ListMessage>;
  if (lentOut.length === 0)
    return <ListMessage>Nothing here yet</ListMessage>;

  return (
    <>
      <GameRows>
        {lentOut.map((l) => (
          <GameRow
            key={l.borrowing_id}
            title={l.title}
            imageUrl={l.image_url}
            summary={gameSummary(l)}
            onOpen={() => setOpenGame(l)}
          />
        ))}
      </GameRows>

      {openGame && (
        <GameDetailsModal
          game={openGame}
          onClose={() => setOpenGame(null)}
        />
      )}
    </>
  );
}

export default LentOutList;
