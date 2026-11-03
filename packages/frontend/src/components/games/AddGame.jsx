import { useState } from "react";
import { addGame } from "../../services/games";
import Modal from "../ui/Modal";
import AddGameButton from "./AddGameButton";
import GameDetailsFields from "./GameDetailsFields";
import GameForm from "./GameForm";
import ListMessage from "./ListMessage";
import {
  EMPTY_GAME_DETAILS,
  GAME_FIELD_CLASS,
  validateGameDetails
} from "./gameDetails";

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
      <AddGameButton onClick={openForm} />

      {message && <ListMessage>{message}</ListMessage>}

      {showForm && (
        <Modal title="Add Game" onClose={closeForm}>
          <GameForm
            error={formError}
            loading={loading}
            submitLabel="Submit"
            onSubmit={handleSubmit}>
            <GameDetailsFields form={form} onChange={handleChange} />
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              aria-label="Condition"
              className={GAME_FIELD_CLASS}
              required>
              {CONDITIONS.map((condition) => (
                <option key={condition.value} value={condition.value}>
                  Condition: {condition.label}
                </option>
              ))}
            </select>
          </GameForm>
        </Modal>
      )}
    </>
  );
}

export default AddGame;
