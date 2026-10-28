import {
  MAX_DESCRIPTION_LENGTH,
  MAX_GENRE_LENGTH,
  MAX_TITLE_LENGTH
} from "./gameDetails";

// Inputs shared by the Add Game and Wishlist forms
function GameDetailsFields({ form, onChange }) {
  return (
    <>
      <input
        name="title"
        type="text"
        value={form.title}
        onChange={onChange}
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
        onChange={onChange}
        placeholder="Min players"
        aria-label="Min players"
        required
      />
      <input
        name="maxPlayers"
        type="number"
        min={form.minPlayers || 1}
        value={form.maxPlayers}
        onChange={onChange}
        placeholder="Max players"
        aria-label="Max players"
        required
      />
      <input
        name="genre"
        type="text"
        value={form.genre}
        onChange={onChange}
        placeholder="Genre"
        aria-label="Genre"
        maxLength={MAX_GENRE_LENGTH}
        required
      />
      <textarea
        name="description"
        value={form.description}
        onChange={onChange}
        placeholder="Description"
        aria-label="Description"
        maxLength={MAX_DESCRIPTION_LENGTH}
        rows={3}
        required
      />
    </>
  );
}

export default GameDetailsFields;
