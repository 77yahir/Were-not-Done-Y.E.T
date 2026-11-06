// Board game details shared by the Library and Wishlist pages

export const MAX_TITLE_LENGTH = 100;
export const MAX_GENRE_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_IMAGE_URL_LENGTH = 500;
export const MAX_MIN_AGE = 99;
export const MAX_AVG_PLAYING_TIME = 100000;

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" }
];

// Tailwind classes for the inputs in these forms
export const GAME_FIELD_CLASS =
  "min-h-[43px] w-full px-[7px] py-0 text-[20px]";

export const EMPTY_GAME_DETAILS = {
  title: "",
  minPlayers: "",
  maxPlayers: "",
  genre: "",
  description: "",
  imageUrl: "",
  minAge: "",
  avgPlayingTime: ""
};

// For an image's onError, so a dead link doesn't show the browser's
// broken image icon. Picture links can be typed in by hand
export function hideImage(e) {
  e.currentTarget.hidden = true;
}

// The line under a game's title in a list, like "Ages 10+ · 90 min".
// Both details are optional, so it can be empty
export function gameSummary(game) {
  const parts = [];

  if (game.min_age) parts.push(`Ages ${game.min_age}+`);
  if (game.avg_playing_time) {
    parts.push(`${game.avg_playing_time} min`);
  }

  return parts.join(" · ");
}

// Blank, or a whole number from 1 up to the maximum
function isOptionalNumber(value, maximum) {
  if (value === "") return true;

  const number = Number(value);
  return (
    Number.isInteger(number) && number >= 1 && number <= maximum
  );
}

export function validateGameDetails(form) {
  const title = form.title.trim();
  const genre = form.genre.trim();
  const description = form.description.trim();
  const imageUrl = form.imageUrl.trim();
  const minPlayers = Number(form.minPlayers);
  const maxPlayers = Number(form.maxPlayers);

  if (!title) return { error: "Title is required." };
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`
    };
  }
  if (!Number.isInteger(minPlayers) || minPlayers < 1) {
    return {
      error: "Min players must be a whole number of at least 1."
    };
  }
  if (
    !Number.isInteger(maxPlayers) ||
    maxPlayers < minPlayers
  ) {
    return {
      error:
        "Max players must be a whole number no less than min players."
    };
  }
  if (!genre) return { error: "Genre is required." };
  if (!description)
    return { error: "Description is required." };
  if (imageUrl && !/^https?:\/\/\S+$/.test(imageUrl)) {
    return {
      error: "Image URL must start with http:// or https://."
    };
  }
  if (!isOptionalNumber(form.minAge, MAX_MIN_AGE)) {
    return {
      error: `Min age must be a whole number from 1 to ${MAX_MIN_AGE}.`
    };
  }
  if (
    !isOptionalNumber(form.avgPlayingTime, MAX_AVG_PLAYING_TIME)
  ) {
    return {
      error: `Average playing time must be a whole number of minutes from 1 to ${MAX_AVG_PLAYING_TIME}.`
    };
  }

  return {
    details: {
      title,
      minPlayers,
      maxPlayers,
      genre,
      description,
      imageUrl: imageUrl || null,
      minAge: form.minAge === "" ? null : Number(form.minAge),
      avgPlayingTime:
        form.avgPlayingTime === ""
          ? null
          : Number(form.avgPlayingTime)
    }
  };
}
