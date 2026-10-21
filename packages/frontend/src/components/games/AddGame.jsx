import { useState } from "react";
import { addGame } from "../../services/games";
import Modal from "../ui/Modal";
import plusIcon from "../../assets/icons/plus.svg";

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
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function openForm() {
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const { game, error } = validateGame(form);
    if (error) {
      setFormError(error);
      return;
    }

    setLoading(true);

    try {
      await addGame(game);
      setMessage("Game added!");
      closeForm();
      onGameAdded?.();
    } catch (error) {
      setFormError("Failed to add game");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="add-game-button" onClick={openForm}>
        <img src={plusIcon} alt="" width="22" height="22" />
        Add Game
      </button>

      {message && <p className="library-empty">{message}</p>}

      {showForm && (
        <Modal title="Add Game" onClose={closeForm}>
          {formError && <p className="form-message">{formError}</p>}

          <form
            className="modal-form modal-form--compact"
            onSubmit={handleSubmit}>
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Title"
              aria-label="Title"
              maxLength={MAX_TITLE_LENGTH}
              required
              autoFocus
            />
            <input
              name="minPlayers"
              type="number"
              min="1"
              value={form.minPlayers}
              onChange={handleChange}
              placeholder="Min players"
              aria-label="Min players"
              required
            />
            <input
              name="maxPlayers"
              type="number"
              min={form.minPlayers || 1}
              value={form.maxPlayers}
              onChange={handleChange}
              placeholder="Max players"
              aria-label="Max players"
              required
            />
            <input
              name="genre"
              type="text"
              value={form.genre}
              onChange={handleChange}
              placeholder="Genre"
              aria-label="Genre"
              maxLength={MAX_GENRE_LENGTH}
              required
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              aria-label="Description"
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={3}
              required
            />
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              aria-label="Condition"
              required>
              {CONDITIONS.map((condition) => (
                <option key={condition.value} value={condition.value}>
                  Condition: {condition.label}
                </option>
              ))}
            </select>
            <button type="submit" className="modal-submit" disabled={loading}>
              {loading ? "Adding..." : "Submit"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

export default AddGame;
