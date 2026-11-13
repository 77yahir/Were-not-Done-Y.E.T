import { useEffect,  useState } from "react";
import { getBorrowedGames } from "../../services/borrowing";
import { gameSummary } from "../games/gameDetails";
import GameDetailsModal from "../games/GameDetailsModal";
import GameRow from "../games/GameRow";
import GameRows from "../games/GameRows";
import ListMessage from "../games/ListMessage";

function BorrowedList({ statuses = ["active", "overdue" ]}) {
    const [borrowings, setBorrowings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openGame, setOpenGame] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await getBorrowedGames();
                setBorrowings(Array.isArray(data) ? data : []) 
            } catch (err) {
                console.error(err);
                setError("Unable to load in borrowed games")
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const visible = borrowings.filter((b) => statuses.includes(b.status))
    if (visible.length === 0) return <ListMessage>Nothing here yet</ListMessage>

    if (loading) return <ListMessage>Loading...</ListMessage>
    if (error) return <ListMessage>{error}</ListMessage>;
    if (borrowings.length === 0) return <ListMessage>Nothing here yet</ListMessage>;
    
    return (
        <>
        <GameRows>
            {visible.map((b) => {
                const game = {
                    ...b.library_item?.board_game,
                    condition: b.library_item?.condition
                };

                return (
                    <GameRow
                        key={b.borrowing_id}
                        title={game.title}
                        imageUrl={game.image_url}
                        summary={gameSummary(game)}
                        onOpen={() => setOpenGame(game)}
                    />
                );
            })}
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

export default BorrowedList