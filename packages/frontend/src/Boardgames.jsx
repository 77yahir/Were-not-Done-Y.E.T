import { useState } from "react";

const MAX_TITLE_LENGTH = 100;
const MAX_GENRE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 300;

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  maxWidth: "320px",
  margin: "0 auto 16px",
  textAlign: "left"
};
const labelStyle = { display: "flex", flexDirection: "column" };

const EMPTY_FORM = {
  title: "",
  minPlayers: "",
  maxPlayers: "",
  genre: "",
  description: ""
};

function validateGame(form) {
  const title = form.title.trim();
  const genre = form.genre.trim();
  const description = form.description.trim();
  const minPlayers = Number(form.minPlayers);
  const maxPlayers = Number(form.maxPlayers);

  if (!title) return { error: "Title is required." };
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`
    };
  }
  if (!Number.isInteger(minPlayers) || minPlayers < 1) {
    return { error: "Min players must be a whole number of at least 1." };
  }
  if (!Number.isInteger(maxPlayers) || maxPlayers < minPlayers) {
    return {
      error: "Max players must be a whole number no less than min players."
    };
  }
  if (!genre) return { error: "Genre is required." };
  if (!description) return { error: "Description is required." };

  return {
    game: { title, minPlayers, maxPlayers, genre, description }
  };
}

function Boardgames() {
  // Stand-in for the library until users and the database exist.
  const [games, setGames] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function closeForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const { game, error } = validateGame(form);
    if (error) {
      setError(error);
      return;
    }

    setGames((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...game }
    ]);
    closeForm();
  }

  function handleRemove(id) {
    setGames((prev) => prev.filter((game) => game.id !== id));
  }

  return (
    <section>
      <h2>My Collection</h2>

      {showForm ? (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3>Add Game</h3>
          <label style={labelStyle}>
            Title
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              maxLength={MAX_TITLE_LENGTH}
              required
              autoFocus
            />
          </label>
          <label style={labelStyle}>
            Min players
            <input
              name="minPlayers"
              type="number"
              min="1"
              value={form.minPlayers}
              onChange={handleChange}
              required
            />
          </label>
          <label style={labelStyle}>
            Max players
            <input
              name="maxPlayers"
              type="number"
              min={form.minPlayers || 1}
              value={form.maxPlayers}
              onChange={handleChange}
              required
            />
          </label>
          <label style={labelStyle}>
            Genre
            <input
              name="genre"
              type="text"
              value={form.genre}
              onChange={handleChange}
              maxLength={MAX_GENRE_LENGTH}
              required
            />
          </label>
          <label style={labelStyle}>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={3}
              required
            />
          </label>
          {error && <p>{error}</p>}
          <div>
            <button type="submit">Submit</button>{" "}
            <button type="button" onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowForm(true)}>
          Add Game
        </button>
      )}

      {games.length === 0 ? (
        <p>No games yet.</p>
      ) : (
        <ul>
          {games.map((game) => (
            <li key={game.id}>
              <strong>{game.title}</strong> ({game.minPlayers}–
              {game.maxPlayers} players, {game.genre}){" "}
              <button
                type="button"
                onClick={() => handleRemove(game.id)}>
                Remove
              </button>
              <p>{game.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Boardgames;
