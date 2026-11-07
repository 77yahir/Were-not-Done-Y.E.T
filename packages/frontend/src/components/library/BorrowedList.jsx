import { useEffect,  useState } from "react";
import { getBorrowedGames } from "../../services/borrowing";
import GameRow from "../games/GameRow";
import GameRows from "../games/GameRows";
import ListMessage from "../games/ListMessage";

function BorrowedList() {
    const [borrowings, setBorrowings] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await getBorrowedGames();
                setBorrowings(Array.isArray(data) ? data : []) 
            } catch (err) {
                console.error(err);
                setError("Unable to load in borrowed games")
            }
        }
        load();
    }, []);

    if (error) return <ListMessage>{error}</ListMessage>;
    if (borrowings.length === 0) return <ListMessage>Nothing here yet</ListMessage>;
    return (
        <GameRows>
            {borrowings.map((b) => (
                <GameRow
                    key={b.borrowing_id}
                    title={b.library_item?.board_game?.title}
                />
            ))}
        </GameRows>
    )
}

export default BorrowedList