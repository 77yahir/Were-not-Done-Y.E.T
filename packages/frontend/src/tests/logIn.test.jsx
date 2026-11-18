// UI tests for logging in (FR-01: "The system will authenticate users")
// and seeing protected content: after logging in, a user lands on their
// own Library, and the app's pages stay closed to anyone logged out.
//
// The whole app renders as it does in the browser. Only the backend API
// (fakeBackend) and the Supabase login session (fakeSupabase) are faked.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { fakeBackend, reply } from "./fakeBackend";
import { logOutEveryone, tokenFor } from "./fakeSupabase";

vi.mock("../lib/supabaseClient", async () => ({
  supabase: (await import("./fakeSupabase")).fakeSupabase
}));

const BOB = {
  id: "bob-id",
  email: "bob@example.com",
  user_metadata: { username: "bob" }
};

const PASSWORD = "correct-horse-battery";

const CATAN = {
  library_item_id: "bobs-catan",
  board_game_id: "catan",
  title: "Catan",
  min_players: 3,
  max_players: 4,
  genre: "Strategy",
  description: "Trade and build settlements",
  condition: "good",
  is_available: true,
  image_url: null,
  min_age: 10,
  avg_playing_time: 90
};

const ROUTES = {
  // Like the real backend: tokens for the right password, 401 otherwise
  "POST /api/users/signin": ({ body }) =>
    body.email === BOB.email && body.password === PASSWORD
      ? {
          access_token: tokenFor(BOB),
          refresh_token: "refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          user: { id: BOB.id, email: BOB.email }
        }
      : reply(401, { detail: "Invalid login credentials" }),
  "GET /api/games/library": { games: [CATAN] },
  "GET /api/borrowings/": [],
  "GET /api/borrowings/lending": []
};

function openApp(path) {
  window.history.pushState({}, "", path);
  render(<App />);
}

async function logIn(user, email, password) {
  await user.type(await screen.findByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(
    screen.getByRole("button", { name: "Log in" })
  );
}

function libraryRequests(backend) {
  return backend.requests.filter(
    (request) => request.path === "/api/games/library"
  );
}

describe("Logging in", () => {
  beforeEach(() => {
    logOutEveryone();
  });

  it("takes the user to their own library after they log in", async () => {
    const backend = fakeBackend(ROUTES);
    const user = userEvent.setup();
    openApp("/");

    await logIn(user, BOB.email, PASSWORD);

    expect(
      await screen.findByRole("heading", { name: "Library" })
    ).toBeVisible();
    // The game's card, not its "Remove Catan" button
    expect(
      await screen.findByRole("button", { name: /^Catan/ })
    ).toBeVisible();
    // The account menu shows who is logged in
    expect(
      screen.getByRole("button", { name: /bob/ })
    ).toBeVisible();
    expect(window.location.pathname).toBe("/collection");

    // The library was loaded as Bob
    expect(libraryRequests(backend)[0].token).toBe(
      "Bearer token-for-bob-id"
    );
  });

  it("shows an error and stays on the login form when the password is wrong", async () => {
    // The form logs failed attempts; keep that out of the test output
    vi.spyOn(console, "error").mockImplementation(() => {});
    const backend = fakeBackend(ROUTES);
    const user = userEvent.setup();
    openApp("/");

    await logIn(user, BOB.email, "wrong-password");

    expect(
      await screen.findByText("Incorrect email or password")
    ).toBeVisible();
    expect(screen.getByLabelText("Email")).toBeVisible();
    expect(window.location.pathname).toBe("/");
    expect(libraryRequests(backend)).toHaveLength(0);
  });

  it("sends someone who is logged out to the login form instead of a library", async () => {
    const backend = fakeBackend(ROUTES);
    openApp("/collection");

    expect(await screen.findByLabelText("Email")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Log in" })
    ).toBeVisible();
    expect(window.location.pathname).toBe("/");
    expect(
      screen.queryByRole("heading", { name: "Library" })
    ).not.toBeInTheDocument();
    expect(libraryRequests(backend)).toHaveLength(0);
  });
});
