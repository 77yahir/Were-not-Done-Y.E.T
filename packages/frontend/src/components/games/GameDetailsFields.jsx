import GameSearch from "./GameSearch";
import {
  GAME_FIELD_CLASS,
  MAX_AVG_PLAYING_TIME,
  MAX_DESCRIPTION_LENGTH,
  MAX_GENRE_LENGTH,
  MAX_IMAGE_URL_LENGTH,
  MAX_MIN_AGE,
  MAX_TITLE_LENGTH
} from "./gameDetails";

// Inputs shared by the Add Game and Wishlist forms.
// onAutofill receives the details of a game picked from search
function GameDetailsFields({ form, onChange, onAutofill }) {
  return (
    <>
      <GameSearch onSelect={onAutofill} />
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
        name="minAge"
        type="number"
        min="1"
        max={MAX_MIN_AGE}
        value={form.minAge}
        onChange={onChange}
        placeholder="Min age (optional)"
        aria-label="Min age"
        className={GAME_FIELD_CLASS}
      />
      <input
        name="avgPlayingTime"
        type="number"
        min="1"
        max={MAX_AVG_PLAYING_TIME}
        value={form.avgPlayingTime}
        onChange={onChange}
        placeholder="Avg minutes (optional)"
        aria-label="Average playing time in minutes"
        className={GAME_FIELD_CLASS}
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
      <input
        name="imageUrl"
        type="url"
        value={form.imageUrl}
        onChange={onChange}
        placeholder="Image URL (optional)"
        aria-label="Image URL"
        maxLength={MAX_IMAGE_URL_LENGTH}
        className={GAME_FIELD_CLASS}
      />
    </>
  );
}

export default GameDetailsFields;
