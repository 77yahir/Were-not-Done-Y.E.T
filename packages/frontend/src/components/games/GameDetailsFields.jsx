import { fieldClass } from "../ui/styles";
import GameSearch from "./GameSearch";
import {
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
        className={fieldClass}
        required
      />
      {/* Side by side, since their placeholders are short enough
          for half the width even on a phone */}
      <div className="grid grid-cols-2 gap-3">
        <input
          name="minPlayers"
          type="number"
          min="1"
          value={form.minPlayers}
          onChange={onChange}
          placeholder="Min players"
          aria-label="Min players"
          className={fieldClass}
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
          className={fieldClass}
          required
        />
      </div>
      <input
        name="minAge"
        type="number"
        min="1"
        max={MAX_MIN_AGE}
        value={form.minAge}
        onChange={onChange}
        placeholder="Min age (optional)"
        aria-label="Min age"
        className={fieldClass}
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
        className={fieldClass}
      />
      <input
        name="genre"
        type="text"
        value={form.genre}
        onChange={onChange}
        placeholder="Genre"
        aria-label="Genre"
        maxLength={MAX_GENRE_LENGTH}
        className={fieldClass}
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
        className={`${fieldClass} resize-y`}
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
        className={fieldClass}
      />
    </>
  );
}

export default GameDetailsFields;
