import { apiFetch } from "./api";

export async function getUserProfile(userId) {
  return apiFetch(`/users/${userId}`, {
    method: "GET"
  });
}
