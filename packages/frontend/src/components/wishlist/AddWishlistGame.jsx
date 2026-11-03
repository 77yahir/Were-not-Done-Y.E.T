import { useState } from "react";
import { addToWishlist } from "../../services/wishlist";
import Modal from "../ui/Modal";
import AddGameButton from "../games/AddGameButton";
import GameDetailsFields from "../games/GameDetailsFields";
import GameForm from "../games/GameForm";
import ListMessage from "../games/ListMessage";
import {
  EMPTY_GAME_DETAILS,
  validateGameDetails
} from "../games/gameDetails";

function AddWishlistGame({ onGameAdded }) {
  const [form, setForm] = useState(EMPTY_GAME_DETAILS);
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
    setForm(EMPTY_GAME_DETAILS);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const { details, error } = validateGameDetails(form);
    if (error) {
      setFormError(error);
      return;
    }

    setLoading(true);

    try {
      await addToWishlist(details);
      setMessage("Added to your wishlist!");
      closeForm();
      onGameAdded?.();
    } catch (error) {
      // The backend answers 409 when the title is already listed
      setFormError(
        error.status === 409
          ? "That game is already on your wishlist."
          : "Failed to add game"
      );
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
        <Modal title="Wishlist" onClose={closeForm}>
          <GameForm
            error={formError}
            loading={loading}
            submitLabel="Add to Wishlist"
            onSubmit={handleSubmit}>
            <GameDetailsFields form={form} onChange={handleChange} />
          </GameForm>
        </Modal>
      )}
    </>
  );
}

export default AddWishlistGame;
