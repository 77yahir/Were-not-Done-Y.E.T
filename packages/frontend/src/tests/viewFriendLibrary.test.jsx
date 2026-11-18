// UI tests for US-21: "As a user, I want to view a friend's board game
// library so that I can see which games they own", continued into US-15
// (asking to borrow one of their games).
//
// The whole app renders as it does in the browser. Only the backend API
// (fakeBackend) and the Supabase login session (fakeSupabase) are faked.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { fakeBackend, reply } from "./fakeBackend";
import { logInAs } from "./fakeSupabase";

vi.mock("../lib/supabaseClient", async () => ({
  supabase: (await import("./fakeSupabase")).fakeSupabase
}));

const BOB = {
  id: "bob-id",
  email: "bob@example.com",
  user_metadata: { username: "bob" }
};

const ALICE_ID = "alice-id";
const CAROL_ID = "carol-id";

const CATAN = {
  library_item_id: "alices-catan",
  board_game_id: "catan",
  title: "Catan",
  min_players: 3,
  max_players: 4,
  genre: "Strategy",
  description: "Trade and build settlements",
  condition: "good",
  is_available: true,
  image_url: "https://images.example.com/catan.png",
  min_age: 10,
  avg_playing_time: 90
};

const WINGSPAN = {
  library_item_id: "alices-wingspan",
  board_game_id: "wingspan",
  title: "Wingspan",
  min_players: 1,
  max_players: 5,
  genre: "Engine building",
  description: "Attract birds to your wildlife preserve",
  condition: "like_new",
  // Someone is borrowing it
  is_available: false,
  image_url: "https://images.example.com/wingspan.png",
  min_age: 10,
  avg_playing_time: 70
};

// Bob is friends with Alice, but not with Carol
const ROUTES = {
  "GET /api/friends/friendships": {
    friends: [
      {
        friendship_id: "bob-and-alice",
        friend_user_id: ALICE_ID,
        username: "alice"
      }
    ]
  },
  "GET /api/friends/requests": { requests: [] },
  [`GET /api/users/${ALICE_ID}`]: {
    profile: {
      user_id: ALICE_ID,
      username: "alice",
      created_at: "2026-09-01T12:00:00Z"
    }
  },
  [`GET /api/users/${ALICE_ID}/library`]: {
    games: [CATAN, WINGSPAN]
  },
  [`GET /api/users/${CAROL_ID}`]: {
    profile: {
      user_id: CAROL_ID,
      username: "carol",
      created_at: "2026-09-02T12:00:00Z"
    }
  },
  [`GET /api/users/${CAROL_ID}/library`]: reply(403, {
    detail: "Not authorized to view library"
  })
};

function openApp(path) {
  window.history.pushState({}, "", path);
  render(<App />);
}

// A game's card on the profile. Its name starts with the title, and
// opening it shows the game's details
function gameCard(title) {
  return screen.findByRole("button", {
    name: new RegExp(`^${title}`)
  });
}

function pictureOn(card) {
  return card.querySelector("img");
}

describe("Viewing a friend's library", () => {
  beforeEach(() => {
    logInAs(BOB);
  });

  it("shows the games a friend owns, with their pictures, after opening their profile", async () => {
    fakeBackend(ROUTES);
    const user = userEvent.setup();
    openApp("/friends");

    await user.click(
      await screen.findByRole("link", { name: "alice" })
    );

    expect(
      await screen.findByRole("heading", { name: "alice" })
    ).toBeVisible();

    const catan = await gameCard("Catan");
    expect(pictureOn(catan)).toHaveAttribute(
      "src",
      CATAN.image_url
    );
    expect(pictureOn(catan)).toBeVisible();
    expect(
      within(catan).getByText("Ages 10+ · 90 min")
    ).toBeVisible();
    expect(within(catan).getByText("Available")).toBeVisible();

    const wingspan = await gameCard("Wingspan");
    expect(pictureOn(wingspan)).toHaveAttribute(
      "src",
      WINGSPAN.image_url
    );
    expect(
      within(wingspan).getByText("Unavailable")
    ).toBeVisible();
  });

  it("lets the user ask to borrow an available game and confirms the request", async () => {
    const backend = fakeBackend({
      ...ROUTES,
      "POST /api/borrowings/": { borrowing_id: "new-request" }
    });
    const user = userEvent.setup();
    openApp(`/users/${ALICE_ID}`);

    await gameCard("Catan");
    // Wingspan is out on loan, so it can't be requested
    expect(
      screen.getByRole("button", { name: "Currently Borrowed" })
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Request to Borrow" })
    );

    expect(
      await screen.findByText("Request sent for Catan")
    ).toBeVisible();
    expect(backend.requests).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/borrowings/",
        body: { library_item_id: CATAN.library_item_id },
        token: "Bearer token-for-bob-id"
      })
    );
  });

  it("tells the user when someone else borrowed the game first", async () => {
    fakeBackend({
      ...ROUTES,
      "POST /api/borrowings/": reply(409, {
        detail: "Game is already borrowed"
      })
    });
    const user = userEvent.setup();
    openApp(`/users/${ALICE_ID}`);

    await gameCard("Catan");
    await user.click(
      screen.getByRole("button", { name: "Request to Borrow" })
    );

    expect(
      await screen.findByText("That game is already borrowed")
    ).toBeVisible();
    expect(
      screen.queryByText("Request sent for Catan")
    ).not.toBeInTheDocument();
  });

  it("asks the user to become friends before showing someone's library", async () => {
    fakeBackend(ROUTES);
    openApp(`/users/${CAROL_ID}`);

    expect(
      await screen.findByText(
        "Become friends to view this user's library"
      )
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "carol" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", {
        name: "Request to Borrow"
      })
    ).not.toBeInTheDocument();
  });
});
