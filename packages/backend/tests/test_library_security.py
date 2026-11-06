import pytest
from postgrest.exceptions import APIError
from supabase import create_client

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
    board_game_id = user.rpc("get_my_library").execute().data[0]["board_game_id"]

    return user.table("board_games").select(DETAIL_COLUMNS).eq(
        "board_game_id", board_game_id
    ).execute().data[0]

def library_row_details(user):
    return user.table("library_items").select(
        DETAIL_COLUMNS
    ).execute().data[0]

def test_new_details_are_saved(test_users):
    user1, _, _ = test_users

    user1.rpc("add_game_to_library", {**GAME, **NEW_DETAILS}).execute()

    assert board_game_details(user1) == SAVED_DETAILS

def test_new_details_are_on_the_library_row(test_users):
    user1, _, _ = test_users

    user1.rpc("add_game_to_library", {**GAME, **NEW_DETAILS}).execute()

    assert library_row_details(user1) == SAVED_DETAILS

def test_library_list_includes_new_details(test_users):
    user1, _, _ = test_users

    user1.rpc("add_game_to_library", {**GAME, **NEW_DETAILS}).execute()

    game = user1.rpc("get_my_library").execute().data[0]

    assert {field: game[field] for field in SAVED_DETAILS} == SAVED_DETAILS

# Code that doesn't send the new details yet must keep working
def test_new_details_are_optional(test_users):
    user1, _, _ = test_users

    user1.rpc("add_game_to_library", GAME).execute()

    assert board_game_details(user1) == NO_DETAILS
    assert library_row_details(user1) == NO_DETAILS

def test_other_user_cannot_read_details_on_library_row(test_users):
    user1, user2, _ = test_users

    user1.rpc("add_game_to_library", {**GAME, **NEW_DETAILS}).execute()

    assert user2.table("library_items").select(
        DETAIL_COLUMNS
    ).execute().data == []

BAD_COLUMN_VALUES = [
    {"image_url": "javascript:alert(1)"},
    {"min_age": 0},
    {"avg_playing_time": 0},
]

@pytest.mark.parametrize("bad_detail", BAD_COLUMN_VALUES)
def test_library_row_rejects_bad_details(test_users, test_config, bad_detail):
    user1, _, _ = test_users
    url, _, service_key = test_config

    user1.rpc("add_game_to_library", GAME).execute()
    library_item_id = user1.rpc("get_my_library").execute().data[0]["library_item_id"]

    with pytest.raises(APIError) as exc_info:
        create_client(url, service_key).table("library_items").update(
            bad_detail
        ).eq("library_item_id", library_item_id).execute()

    assert exc_info.value.code == "23514"

# The add functions write to both tables, so check this one on its own
@pytest.mark.parametrize("bad_detail", BAD_COLUMN_VALUES)
def test_board_game_rejects_bad_details(test_users, test_config, bad_detail):
    user1, _, _ = test_users
    url, _, service_key = test_config

    user1.rpc("add_game_to_library", GAME).execute()
    board_game_id = user1.rpc("get_my_library").execute().data[0]["board_game_id"]

    with pytest.raises(APIError) as exc_info:
        create_client(url, service_key).table("board_games").update(
            bad_detail
        ).eq("board_game_id", board_game_id).execute()

    assert exc_info.value.code == "23514"

@pytest.mark.parametrize(
    "bad_detail",
    [
        {"p_image_url": "javascript:alert(1)"},
        {"p_image_url": "https://example.com/two words.png"},
        {"p_min_age": 0},
        {"p_avg_playing_time": 0},
    ],
)
def test_database_rejects_bad_details(test_users, bad_detail):
    user1, _, _ = test_users

    with pytest.raises(APIError) as exc_info:
        user1.rpc("add_game_to_library", {**GAME, **bad_detail}).execute()

    assert exc_info.value.code == "23514"
    assert user1.rpc("get_my_library").execute().data == []

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
