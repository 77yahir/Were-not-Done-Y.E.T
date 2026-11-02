import pytest
from postgrest.exceptions import APIError

GAME = {
    "p_title": "Catan",
    "p_min_players": 3,
    "p_max_players": 4,
    "p_genre": "Strategy",
    "p_description": "Trade and build settlements",
    "p_condition": "good",
}

def test_owner_can_add_and_view_game(test_users):
    user1, _, _ = test_users

    library_item_id = user1.rpc(
        "add_game_to_library", GAME
    ).execute().data

    games = user1.rpc("get_my_library").execute().data

    assert len(games) == 1
    assert games[0]["library_item_id"] == library_item_id
    assert games[0]["title"] == GAME["p_title"]
    assert games[0]["genre"] == GAME["p_genre"]
    assert games[0]["condition"] == GAME["p_condition"]
    assert games[0]["is_available"] is True

def test_other_user_cannot_view_library(test_users):
    user1, user2, _ = test_users

    library_item_id = user1.rpc(
        "add_game_to_library", GAME
    ).execute().data

    games2 = user2.rpc("get_my_library").execute().data

    items2 = user2.table("library_items").select("*").eq(
        "library_item_id", library_item_id
    ).execute().data

    assert games2 == []
    assert items2 == []

def test_owner_can_remove_game(test_users):
    user1, _, _ = test_users

    library_item_id = user1.rpc(
        "add_game_to_library", GAME
    ).execute().data

    deleted = user1.table("library_items").delete().eq(
        "library_item_id", library_item_id
    ).execute().data

    games = user1.rpc("get_my_library").execute().data

    assert len(deleted) == 1
    assert games == []

def test_other_user_cannot_remove_game(test_users):
    user1, user2, _ = test_users

    library_item_id = user1.rpc(
        "add_game_to_library", GAME
    ).execute().data

    deleted = user2.table("library_items").delete().eq(
        "library_item_id", library_item_id
    ).execute().data

    games1 = user1.rpc("get_my_library").execute().data

    assert deleted == []
    assert len(games1) == 1

def test_anonymous_cannot_add_game(anonymous_client):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.rpc(
            "add_game_to_library", GAME
        ).execute()

    assert exc_info.value.code == "42501"

def test_anonymous_cannot_get_library(anonymous_client):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.rpc(
            "get_my_library"
        ).execute()

    assert exc_info.value.code == "42501"
