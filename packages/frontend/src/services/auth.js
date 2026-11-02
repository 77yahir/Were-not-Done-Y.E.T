import { supabase } from "../lib/supabaseClient";

export async function signUp(username, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by the on_auth_user_created trigger to create the profile
      data: { username },
      // The confirmation email links back to the app's start page
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function logIn(email, password) {
  const response = await fetch("/api/users/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.detail);
  }

  // Store the backend's tokens client-side so apiFetch can attach them
  const { data, error } = await supabase.auth.setSession({
    access_token: body.access_token,
    refresh_token: body.refresh_token
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function logOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getSession() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session;
}

export function onAuthChange(callback) {
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}
