import { apiFetch } from "./api";

export async function getUserProfile(userId) {
  return apiFetch(`/users/${userId}`, {
    method: "GET"
  });
}

export async function getUserLibrary(userId) {
  return apiFetch(`/users/${userId}/library`, {
    method: "GET"
  });
}
