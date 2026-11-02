import pytest
from postgrest.exceptions import APIError

GAME = {
    "p_title": "Catan",
    "p_min_players": 3,
    "p_max_players": 4,
    "p_genre": "Strategy",
    "p_description": "Trade and build settlements",
}

def test_user_can_add_and_view_wishlist_game(test_users):
    user1, _, _ = test_users

    wishlist_item_id = user1.rpc(
        "add_game_to_wishlist", GAME
    ).execute().data

    games = user1.rpc("get_my_wishlist").execute().data

    assert len(games) == 1
    assert games[0]["wishlist_item_id"] == wishlist_item_id
    assert games[0]["title"] == GAME["p_title"]
    assert games[0]["genre"] == GAME["p_genre"]

def test_user_cannot_add_same_title_twice(test_users):
    user1, _, _ = test_users

    user1.rpc("add_game_to_wishlist", GAME).execute()

    with pytest.raises(APIError) as exc_info:
        user1.rpc(
            "add_game_to_wishlist",
            {**GAME, "p_title": " catan "}
        ).execute()

    games = user1.rpc("get_my_wishlist").execute().data

    assert exc_info.value.code == "23505"
    assert len(games) == 1

def test_users_can_wishlist_same_title(test_users):
    user1, user2, _ = test_users

    user1.rpc("add_game_to_wishlist", GAME).execute()
    user2.rpc("add_game_to_wishlist", GAME).execute()

    games1 = user1.rpc("get_my_wishlist").execute().data
    games2 = user2.rpc("get_my_wishlist").execute().data

    assert len(games1) == 1
    assert len(games2) == 1

def test_other_user_cannot_view_wishlist(test_users):
    user1, user2, _ = test_users

    wishlist_item_id = user1.rpc(
        "add_game_to_wishlist", GAME
    ).execute().data

    games2 = user2.rpc("get_my_wishlist").execute().data

    items2 = user2.table("wishlist_items").select("*").eq(
        "wishlist_item_id", wishlist_item_id
    ).execute().data

    assert games2 == []
    assert items2 == []

def test_user_can_remove_wishlist_game(test_users):
    user1, _, _ = test_users

    wishlist_item_id = user1.rpc(
        "add_game_to_wishlist", GAME
    ).execute().data

    deleted = user1.table("wishlist_items").delete().eq(
        "wishlist_item_id", wishlist_item_id
    ).execute().data

    games = user1.rpc("get_my_wishlist").execute().data

    assert len(deleted) == 1
    assert games == []

def test_other_user_cannot_remove_wishlist_game(test_users):
    user1, user2, _ = test_users

    wishlist_item_id = user1.rpc(
        "add_game_to_wishlist", GAME
    ).execute().data

    deleted = user2.table("wishlist_items").delete().eq(
        "wishlist_item_id", wishlist_item_id
    ).execute().data

    games1 = user1.rpc("get_my_wishlist").execute().data

    assert deleted == []
    assert len(games1) == 1

def test_user_cannot_insert_wishlist_item_directly(test_users):
    user1, user2, _ = test_users

    user2.rpc("add_game_to_wishlist", GAME).execute()

    board_game_id = user2.rpc(
        "get_my_wishlist"
    ).execute().data[0]["board_game_id"]

    # Inserts must go through add_game_to_wishlist
    with pytest.raises(APIError) as exc_info:
        user1.table("wishlist_items").insert({
            "user_id": str(user2.auth.get_user().user.id),
            "board_game_id": board_game_id,
        }).execute()

    assert exc_info.value.code == "42501"

def test_anonymous_cannot_add_to_wishlist(anonymous_client):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.rpc(
            "add_game_to_wishlist", GAME
        ).execute()

    assert exc_info.value.code == "42501"

def test_anonymous_cannot_get_wishlist(anonymous_client):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.rpc(
            "get_my_wishlist"
        ).execute()

    assert exc_info.value.code == "42501"
