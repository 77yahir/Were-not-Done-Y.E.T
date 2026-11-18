import { supabase } from "../lib/supabaseClient";

// Where the backend lives. Locally this is blank and Vite's dev server
// forwards /api to the backend. The deployed frontend is on a different
// domain from the backend, so its build sets VITE_API_URL to the
// backend's address
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(
  /\/$/,
  ""
);

export function apiUrl(path) {
  return `${API_URL}/api${path}`;
}

export async function apiFetch(path, options = {}) {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error("User is not signed in");
  }

  const headers = new Headers(options.headers);
  headers.set(
    "Authorization",
    `Bearer ${session.access_token}`
  );

  const response = await fetch(apiUrl(path), {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = new Error(
      `API request failed: ${response.status}`
    );
    // Lets callers react to specific failures, e.g. 409 for a duplicate
    error.status = response.status;
    throw error;
  }

  return response.json();
}
