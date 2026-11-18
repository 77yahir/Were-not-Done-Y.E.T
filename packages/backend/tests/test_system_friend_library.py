# System tests for viewing a friend's library (US-21), which builds on
# adding a game (US-9) and friend requests (FR-03, FR-04).
#
# Each test uses the API the way the frontend does. A request goes
# through the FastAPI router, the login check and the service to the
# local Supabase database, where the SQL functions and security rules
# run. Nothing is mocked.
from unittest.mock import ANY

GAME = {
    "title": "Catan",
    "min_players": 3,
    "max_players": 4,
    "genre": "Strategy",
    "description": "Trade and build settlements",
    "condition": "good",
    "image_url": "https://example.com/catan.png",
    "min_age": 10,
    "avg_playing_time": 90,
}


def logged_in_as(user):
    token = user.auth.get_session().access_token
    return {"Authorization": f"Bearer {token}"}


def user_id(user):
    return str(user.auth.get_user().user.id)


def add_game(api, owner):
    response = api.post(
        "/api/games/library",
        json=GAME,
        headers=logged_in_as(owner)
    )

    assert response.status_code == 200
    return response.json()["library_item_id"]


def send_friend_request(api, sender, recipient):
    response = api.post(
        "/api/friends/requests",
        json={"recipient_user_id": user_id(recipient)},
        headers=logged_in_as(sender)
    )

    assert response.status_code == 200
    return response.json()["friendship_id"]


def become_friends(api, owner, friend):
    friendship_id = send_friend_request(api, friend, owner)

    response = api.patch(
        f"/api/friends/requests/{friendship_id}",
        json={"decision": "accepted"},
        headers=logged_in_as(owner)
    )

    assert response.status_code == 200
    return friendship_id


def view_library(api, viewer, owner):
    return api.get(
        f"/api/users/{user_id(owner)}/library",
        headers=logged_in_as(viewer)
    )


def test_friend_sees_a_game_the_owner_added_with_its_picture(api, test_users):
    owner, friend, _ = test_users
    library_item_id = add_game(api, owner)
    become_friends(api, owner, friend)

    response = view_library(api, friend, owner)

    assert response.status_code == 200
    assert response.json()["games"] == [
        {
            "library_item_id": library_item_id,
            "board_game_id": ANY,
            "title": "Catan",
            "min_players": 3,
            "max_players": 4,
            "genre": "Strategy",
            "description": "Trade and build settlements",
            "condition": "good",
            "is_available": True,
            "image_url": "https://example.com/catan.png",
            "min_age": 10,
            "avg_playing_time": 90,
        }
    ]


def test_stranger_cannot_see_the_library(api, test_users):
    owner, _, stranger = test_users
    add_game(api, owner)

    response = view_library(api, stranger, owner)

    assert response.status_code == 403
    assert response.json() == {"detail": "Not authorized to view library"}


def test_unanswered_friend_request_does_not_give_access(api, test_users):
    owner, requester, _ = test_users
    add_game(api, owner)
    send_friend_request(api, requester, owner)

    response = view_library(api, requester, owner)

    assert response.status_code == 403


def test_removing_a_friend_takes_away_access(api, test_users):
    owner, friend, _ = test_users
    add_game(api, owner)
    friendship_id = become_friends(api, owner, friend)
    assert view_library(api, friend, owner).status_code == 200

    response = api.delete(
        f"/api/friends/friendships/{friendship_id}",
        headers=logged_in_as(owner)
    )

    assert response.status_code == 200
    assert view_library(api, friend, owner).status_code == 403
