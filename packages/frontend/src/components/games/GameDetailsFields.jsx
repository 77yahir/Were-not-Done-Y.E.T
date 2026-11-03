import {
  GAME_FIELD_CLASS,
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
        className={GAME_FIELD_CLASS}
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
        className={GAME_FIELD_CLASS}
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
        className={GAME_FIELD_CLASS}
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
        className={GAME_FIELD_CLASS}
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
        className={`${GAME_FIELD_CLASS} resize-y pt-1`}
        required
      />
    </>
  );
}

export default GameDetailsFields;
