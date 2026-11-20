export const AVATAR_IDS = [
  "meeple",
  "cat",
  "fox",
  "bear",
  "robot",
  "wizard"
];

export function isValidUsername(username) {
  if (typeof username !== "string") return false;

  const trimmed = username.trim();

  return trimmed.length >= 3 && trimmed.length <= 75;
}

export function isValidAvatar(avatarId) {
  return avatarId === null || AVATAR_IDS.includes(avatarId);
}
