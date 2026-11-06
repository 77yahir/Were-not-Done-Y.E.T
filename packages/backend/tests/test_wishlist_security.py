import pytest
from postgrest.exceptions import APIError
from supabase import create_client

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

NEW_DETAILS = {
    "p_image_url": "https://example.com/catan.png",
    "p_min_age": 10,
    "p_avg_playing_time": 90,
}

SAVED_DETAILS = {
    "image_url": "https://example.com/catan.png",
    "min_age": 10,
    "avg_playing_time": 90,
}

NO_DETAILS = {
    "image_url": None,
    "min_age": None,
    "avg_playing_time": None,
}

DETAIL_COLUMNS = "image_url, min_age, avg_playing_time"

def board_game_details(user):
    board_game_id = user.rpc("get_my_wishlist").execute().data[0]["board_game_id"]

    return user.table("board_games").select(DETAIL_COLUMNS).eq(
        "board_game_id", board_game_id
    ).execute().data[0]

def wishlist_row_details(user):
    return user.table("wishlist_items").select(
        DETAIL_COLUMNS
    ).execute().data[0]

def test_new_details_are_saved(test_users):
    user1, _, _ = test_users

    user1.rpc("add_game_to_wishlist", {**GAME, **NEW_DETAILS}).execute()

    assert board_game_details(user1) == SAVED_DETAILS

def test_new_details_are_on_the_wishlist_row(test_users):
    user1, _, _ = test_users

    user1.rpc("add_game_to_wishlist", {**GAME, **NEW_DETAILS}).execute()

    assert wishlist_row_details(user1) == SAVED_DETAILS

def test_wishlist_includes_new_details(test_users):
    user1, _, _ = test_users

    user1.rpc("add_game_to_wishlist", {**GAME, **NEW_DETAILS}).execute()

    game = user1.rpc("get_my_wishlist").execute().data[0]

    assert {field: game[field] for field in SAVED_DETAILS} == SAVED_DETAILS

# Code that doesn't send the new details yet must keep working
def test_new_details_are_optional(test_users):
    user1, _, _ = test_users

    user1.rpc("add_game_to_wishlist", GAME).execute()

    assert board_game_details(user1) == NO_DETAILS
    assert wishlist_row_details(user1) == NO_DETAILS

def test_other_user_cannot_read_details_on_wishlist_row(test_users):
    user1, user2, _ = test_users

    user1.rpc("add_game_to_wishlist", {**GAME, **NEW_DETAILS}).execute()

    assert user2.table("wishlist_items").select(
        DETAIL_COLUMNS
    ).execute().data == []

@pytest.mark.parametrize(
    "bad_detail",
    [
        {"image_url": "javascript:alert(1)"},
        {"min_age": 0},
        {"avg_playing_time": 0},
    ],
)
def test_wishlist_row_rejects_bad_details(test_users, test_config, bad_detail):
    user1, _, _ = test_users
    url, _, service_key = test_config

    user1.rpc("add_game_to_wishlist", GAME).execute()
    wishlist_item_id = user1.rpc("get_my_wishlist").execute().data[0]["wishlist_item_id"]

    with pytest.raises(APIError) as exc_info:
        create_client(url, service_key).table("wishlist_items").update(
            bad_detail
        ).eq("wishlist_item_id", wishlist_item_id).execute()

    assert exc_info.value.code == "23514"

@pytest.mark.parametrize(
    "bad_detail",
    [
        {"p_image_url": "javascript:alert(1)"},
        {"p_min_age": 0},
        {"p_avg_playing_time": 0},
    ],
)
def test_database_rejects_bad_details(test_users, bad_detail):
    user1, _, _ = test_users

    with pytest.raises(APIError) as exc_info:
        user1.rpc("add_game_to_wishlist", {**GAME, **bad_detail}).execute()

    assert exc_info.value.code == "23514"
    assert user1.rpc("get_my_wishlist").execute().data == []

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
