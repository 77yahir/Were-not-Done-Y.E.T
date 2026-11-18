import pytest
from postgrest.exceptions import APIError


def become_friends(owner, friend):
    owner_id = str(owner.auth.get_user().user.id)
    friend_id = str(friend.auth.get_user().user.id)

    # Send friend request
    friend.table("friendships").insert({
        "requester_user_id": friend_id,
        "recipient_user_id": owner_id,
        "status": "pending"
    }).execute()

    # Owner accepts
    friendship = (
        owner.table("friendships")
        .select("friendship_id")
        .eq("requester_user_id", friend_id)
        .eq("recipient_user_id", owner_id)
        .eq("status", "pending")
        .single()
        .execute()
        .data
    )

    owner.rpc(
        "respond_to_friend_request",
        {
            "p_friendship_id": friendship["friendship_id"],
            "p_response": "accepted"
        }
    ).execute()


def test_nonfriend_cannot_view_library(test_users):
    owner, nonfriend, _ = test_users

    # Create a game in the owner's library
    library_item_id = owner.rpc(
        "add_game_to_library",
        {
            "p_title": "Friend Library Test",
            "p_min_players": 2,
            "p_max_players": 4,
            "p_genre": "Strategy",
            "p_description": "Test game",
            "p_condition": "good",
        }
    ).execute().data

    # Get the owner's authenticated user ID
    owner_id = owner.auth.get_user().user.id

    with pytest.raises(
        APIError,
        match="Not authorized to view library"
    ):
        nonfriend.rpc(
            "get_user_library",
            {"p_user_id": str(owner_id)}
        ).execute()


def test_accepted_friend_can_view_library(test_users):
    owner, friend, _ = test_users

    owner_id = str(owner.auth.get_user().user.id)

    # Owner adds a game
    owner.rpc(
        "add_game_to_library",
        {
            "p_title": "Friend Access Test",
            "p_min_players": 2,
            "p_max_players": 4,
            "p_genre": "Strategy",
            "p_description": "Testing friend access",
            "p_condition": "good"
        }
    ).execute()

    become_friends(owner, friend)

    # Accepted friend retrieves owner's library
    result = friend.rpc(
        "get_user_library",
        {"p_user_id": owner_id}
    ).execute()

    assert any(
        game["title"] == "Friend Access Test"
        for game in result.data
    )


def test_friend_sees_game_image_and_details(test_users):
    owner, friend, _ = test_users

    owner_id = str(owner.auth.get_user().user.id)

    owner.rpc(
        "add_game_to_library",
        {
            "p_title": "Friend Image Test",
            "p_min_players": 3,
            "p_max_players": 4,
            "p_genre": "Strategy",
            "p_description": "Testing game images",
            "p_condition": "good",
            "p_image_url": "https://example.com/catan.png",
            "p_min_age": 10,
            "p_avg_playing_time": 90
        }
    ).execute()

    become_friends(owner, friend)

    result = friend.rpc(
        "get_user_library",
        {"p_user_id": owner_id}
    ).execute()

    game = next(
        game for game in result.data
        if game["title"] == "Friend Image Test"
    )

    # The friend sees the same picture and details as the owner
    assert game["image_url"] == "https://example.com/catan.png"
    assert game["min_age"] == 10
    assert game["avg_playing_time"] == 90


def test_owner_can_view_own_library(test_users):
    owner, _, _ = test_users

    owner_id = str(owner.auth.get_user().user.id)

    result = owner.rpc(
        "get_user_library",
        {"p_user_id": owner_id}
    ).execute()

    assert isinstance(result.data, list)
