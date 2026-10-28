import { useState } from "react";
import { addToWishlist } from "../../services/wishlist";
import Modal from "../ui/Modal";
import GameDetailsFields from "../games/GameDetailsFields";
import {
  EMPTY_GAME_DETAILS,
  validateGameDetails
} from "../games/gameDetails";
import plusIcon from "../../assets/icons/plus.svg";

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
      <button type="button" className="add-game-button" onClick={openForm}>
        <img src={plusIcon} alt="" width="22" height="22" />
        Add Game
      </button>

      {message && <p className="library-empty">{message}</p>}

      {showForm && (
        <Modal title="Wishlist" onClose={closeForm}>
          {formError && <p className="form-message">{formError}</p>}

          <form
            className="modal-form modal-form--compact"
            onSubmit={handleSubmit}>
            <GameDetailsFields form={form} onChange={handleChange} />
            <button type="submit" className="modal-submit" disabled={loading}>
              {loading ? "Adding..." : "Add to Wishlist"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

export default AddWishlistGame;
