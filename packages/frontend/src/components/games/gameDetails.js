// Board game details shared by the Add Game and Wishlist forms

export const MAX_TITLE_LENGTH = 100;
export const MAX_GENRE_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 300;

export const EMPTY_GAME_DETAILS = {
  title: "",
  minPlayers: "",
  maxPlayers: "",
  genre: "",
  description: ""
};

export function validateGameDetails(form) {
  const title = form.title.trim();
  const genre = form.genre.trim();
  const description = form.description.trim();
  const minPlayers = Number(form.minPlayers);
  const maxPlayers = Number(form.maxPlayers);

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

  return {
    details: { title, minPlayers, maxPlayers, genre, description }
  };
}
