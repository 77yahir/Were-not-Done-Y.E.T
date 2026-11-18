// Stands in for the Supabase client in UI tests. The app only uses
// Supabase to keep the login session; everything else goes through the
// backend API, which fakeBackend.js stands in for. Test files swap it in
// with vi.mock("../lib/supabaseClient", ...)

const usersByToken = new Map();
const listeners = new Set();
let session = null;

function announce(event) {
  listeners.forEach((listener) => listener(event, session));
}

export const fakeSupabase = {
  auth: {
    async getSession() {
      return { data: { session }, error: null };
    },

    // LoginForm calls this with the tokens the backend's signin returned
    async setSession({ access_token, refresh_token }) {
      const user = usersByToken.get(access_token);

      if (!user) {
        return {
          data: { session: null, user: null },
          error: new Error("Invalid access token")
        };
      }

      session = { access_token, refresh_token, user };
      announce("SIGNED_IN");
      return { data: { session, user }, error: null };
    },

    onAuthStateChange(listener) {
      listeners.add(listener);

      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(listener)
          }
        }
      };
    },

    async signOut() {
      session = null;
      announce("SIGNED_OUT");
      return { error: null };
    }
  }
};

// The access token the fake signin hands out for a user
export function tokenFor(user) {
  const token = `token-for-${user.id}`;
  usersByToken.set(token, user);
  return token;
}

// Start a test already logged in
export function logInAs(user) {
  session = {
    access_token: tokenFor(user),
    refresh_token: "refresh-token",
    user
  };
}

// Start a test logged out
export function logOutEveryone() {
  session = null;
}
