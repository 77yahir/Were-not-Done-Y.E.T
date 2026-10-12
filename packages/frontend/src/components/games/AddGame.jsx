import { useState } from "react";
import { addGame } from "../../services/games";

const MAX_TITLE_LENGTH = 100;
const MAX_GENRE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 300;

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" }
];

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
  description: "",
  condition: "good"
};

function validateGame(form) {
  const title = form.title.trim();
  const genre = form.genre.trim();
  const description = form.description.trim();
  const minPlayers = Number(form.minPlayers);
  const maxPlayers = Number(form.maxPlayers);
  const condition = form.condition;

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
  if (!condition) return { error: "Condition is required." };

  return {
    game: { title, minPlayers, maxPlayers, genre, description, condition }
  };
}

function AddGame({ onGameAdded }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function closeForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const { game, error } = validateGame(form);
    if (error) {
      setMessage(error);
      return;
    }

    setLoading(true);

    try {
      await addGame(game);
      setMessage("Game added!");
      closeForm();
      onGameAdded?.();
    } catch (error) {
      setMessage("Failed to add game");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {message && <p>{message}</p>}

      {showForm ? (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h2>Add Game</h2>
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
          <label style={labelStyle}>
            Condition
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              required>
              {CONDITIONS.map((condition) => (
                <option key={condition.value} value={condition.value}>
                  {condition.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Submit"}
            </button>{" "}
            <button type="button" onClick={closeForm} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowForm(true)}>
          Add Game
        </button>
      )}
    </div>
  );
}

export default AddGame;
