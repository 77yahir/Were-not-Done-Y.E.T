import { useState } from "react";
import { addGame } from "../../services/games";
import Modal from "../ui/Modal";
import GameDetailsFields from "./GameDetailsFields";
import {
  EMPTY_GAME_DETAILS,
  validateGameDetails
} from "./gameDetails";
import plusIcon from "../../assets/icons/plus.svg";

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" }
];

const EMPTY_FORM = {
  ...EMPTY_GAME_DETAILS,
  condition: "good"
};

function validateGame(form) {
  const { details, error } = validateGameDetails(form);
  if (error) return { error };
  if (!form.condition) return { error: "Condition is required." };

  return {
    game: { ...details, condition: form.condition }
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
            <GameDetailsFields form={form} onChange={handleChange} />
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
