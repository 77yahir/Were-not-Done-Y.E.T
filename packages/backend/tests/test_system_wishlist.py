# System tests for adding a game to the wishlist (US-11) and removing it
# (US-12).
#
# Each test uses the API the way the frontend does. A request goes
# through the FastAPI router, the login check and the service to the
# local Supabase database, where the SQL functions and security rules
# run. Nothing is mocked.

GAME = {
    "title": "Wingspan",
    "min_players": 1,
    "max_players": 5,
    "genre": "Engine building",
    "description": "Attract birds to your wildlife preserve",
    "image_url": "https://example.com/wingspan.png",
    "min_age": 10,
    "avg_playing_time": 70,
}


def logged_in_as(user):
    token = user.auth.get_session().access_token
    return {"Authorization": f"Bearer {token}"}


def add_to_wishlist(api, user, game=GAME):
    return api.post("/api/wishlist", json=game, headers=logged_in_as(user))


def wishlist_titles(api, user):
    response = api.get("/api/wishlist", headers=logged_in_as(user))

    assert response.status_code == 200
    return [game["title"] for game in response.json()["games"]]


def test_user_adds_a_game_to_their_wishlist_and_removes_it(api, test_users):
    user, _, _ = test_users

    response = add_to_wishlist(api, user)

    assert response.status_code == 200
    wishlist_item_id = response.json()["wishlist_item_id"]

    games = api.get("/api/wishlist", headers=logged_in_as(user)).json()["games"]
    assert len(games) == 1
    assert games[0]["wishlist_item_id"] == wishlist_item_id
    assert games[0]["title"] == "Wingspan"
    assert games[0]["image_url"] == "https://example.com/wingspan.png"

    response = api.delete(
        f"/api/wishlist/{wishlist_item_id}",
        headers=logged_in_as(user)
    )

    assert response.status_code == 200
    assert wishlist_titles(api, user) == []


def test_the_same_game_cannot_be_added_twice(api, test_users):
    user, _, _ = test_users
    add_to_wishlist(api, user)

    # Matching ignores case and spaces around the title
    response = add_to_wishlist(api, user, {**GAME, "title": " wingspan "})

    assert response.status_code == 409
    assert response.json() == {"detail": "Game is already on your wishlist"}
    assert wishlist_titles(api, user) == ["Wingspan"]


def test_users_cannot_remove_games_from_each_others_wishlists(api, test_users):
    owner, other_user, _ = test_users
    wishlist_item_id = add_to_wishlist(api, owner).json()["wishlist_item_id"]

    response = api.delete(
        f"/api/wishlist/{wishlist_item_id}",
        headers=logged_in_as(other_user)
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Game not found or removal not allowed"
    }
    assert wishlist_titles(api, owner) == ["Wingspan"]
