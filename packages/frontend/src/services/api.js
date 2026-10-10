import { supabase } from "../lib/supabaseClient";

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

  const response = await fetch(`/api${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}
