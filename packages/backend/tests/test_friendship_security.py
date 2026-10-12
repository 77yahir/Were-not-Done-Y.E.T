import pytest
from postgrest.exceptions import APIError

def test_accepted_friends_visible_to_both_users(test_users):
    user1, user2, _ = test_users

    user1_id = str(user1.auth.get_user().user.id)
    user2_id = str(user2.auth.get_user().user.id)

    # Create a pending friend request
    result = user1.table("friendships").insert({
        "requester_user_id": user1_id,
        "recipient_user_id": user2_id,
        "status": "pending",
    }).execute()

    friendship_id = result.data[0]["friendship_id"]

    # Recipient accepts the request
    user2.rpc(
        "respond_to_friend_request",
        {
            "p_friendship_id": friendship_id,
            "p_response": "accepted",
        },
    ).execute()

    # Both users retrieve accepted friends
    friends1 = user1.rpc(
        "get_accepted_friends"
    ).execute().data

    friends2 = user2.rpc(
        "get_accepted_friends"
    ).execute().data

    assert len(friends1) == 1
    assert len(friends2) == 1

    assert friends1[0]["friend_user_id"] == user2_id
    assert friends2[0]["friend_user_id"] == user1_id

    assert friends1[0]["friendship_id"] == friendship_id
    assert friends2[0]["friendship_id"] == friendship_id
     
    # Look up each user's actual username
    profile1 = user1.table("users").select("username").eq(
        "user_id", user1_id
    ).single().execute().data

    profile2 = user2.table("users").select("username").eq(
        "user_id", user2_id
    ).single().execute().data

    # Each user should see the OTHER person's username
    assert friends1[0]["username"] == profile2["username"]
    assert friends2[0]["username"] == profile1["username"]

def test_pending_friendships_not_visible(test_users):
    user1, user2, _ = test_users

    user1_id = str(user1.auth.get_user().user.id)
    user2_id = str(user2.auth.get_user().user.id)

    user1.table("friendships").insert({
        "requester_user_id": user1_id,
        "recipient_user_id": user2_id,
        "status": "pending",
    }).execute()

    friends1 = user1.rpc("get_accepted_friends").execute().data
    friends2 = user2.rpc("get_accepted_friends").execute().data

    assert friends1 == []
    assert friends2 == []

def test_unrelated_user_cannot_view_friendships(test_users):
    user1, user2, user3 = test_users

    user1_id = str(user1.auth.get_user().user.id)
    user2_id = str(user2.auth.get_user().user.id)

    result = user1.table("friendships").insert({
        "requester_user_id": user1_id,
        "recipient_user_id": user2_id,
        "status": "pending",
    }).execute()

    friendship_id = result.data[0]["friendship_id"]

    user2.rpc(
        "respond_to_friend_request",
        {
            "p_friendship_id": friendship_id,
            "p_response": "accepted",
        },
    ).execute()

    friends3 = user3.rpc("get_accepted_friends").execute().data

    assert friends3 == []

def test_anonymous_cannot_get_accepted_friends(
    anonymous_client,
):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.rpc(
            "get_accepted_friends"
        ).execute()

    assert exc_info.value.code == "42501"
