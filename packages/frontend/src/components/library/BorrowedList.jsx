import { useEffect,  useState } from "react";
import { getBorrowedGames } from "../../services/borrowing";

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

    if (error) return <p className="library-empty">{error}</p>;
    if (borrowings.length === 0) return <p className="library-empty">Nothing here yet</p>;
    return borrowings.map((b) => (
        <div className="game-row" key={b.borrowing_id}>
            {b.library_item?.board_game?.title}
        </div>
    ))
}

export default BorrowedList