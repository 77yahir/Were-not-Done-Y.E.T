import { useState } from "react";
import { addGame } from "../../services/games";
import Modal from "../ui/Modal";
import { fieldClass } from "../ui/styles";
import AddGameButton from "./AddGameButton";
import GameDetailsFields from "./GameDetailsFields";
import GameForm from "./GameForm";
import {
  CONDITIONS,
  EMPTY_GAME_DETAILS,
  validateGameDetails
} from "./gameDetails";

const EMPTY_FORM = {
  ...EMPTY_GAME_DETAILS,
  condition: "good"
};

function validateGame(form) {
  const { details, error } = validateGameDetails(form);
  if (error) return { error };
  if (!form.condition)
    return { error: "Condition is required." };

  return {
    game: { ...details, condition: form.condition }
  };
}

// The Add Game button and its pop-up. The page shows the "Game
// added!" message by the list: onOpen tells it the form opened, so an
// old message can go, and onGameAdded that a game was added
function AddGame({ onOpen, onGameAdded }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAutofill(details) {
    setForm((prev) => ({ ...prev, ...details }));
  }

  function openForm() {
    onOpen?.();
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

      {showForm && (
        <Modal title="Add Game" onClose={closeForm}>
          <GameForm
            error={formError}
            loading={loading}
            submitLabel="Submit"
            onSubmit={handleSubmit}>
            <GameDetailsFields
              form={form}
              onChange={handleChange}
              onAutofill={handleAutofill}
            />
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              aria-label="Condition"
              className={`${fieldClass} cursor-pointer`}
              required>
              {CONDITIONS.map((condition) => (
                <option
                  key={condition.value}
                  value={condition.value}>
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
