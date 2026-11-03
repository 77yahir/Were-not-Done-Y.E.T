import pytest
from postgrest.exceptions import APIError
from supabase import create_client

NOT_ALLOWED = "You can only message friends or community members"

def get_user_id(client):
    return str(client.auth.get_user().user.id)

def make_friends(requester, recipient):
    friendship_id = requester.table("friendships").insert({
        "requester_user_id": get_user_id(requester),
        "recipient_user_id": get_user_id(recipient),
        "status": "pending",
    }).execute().data[0]["friendship_id"]

    recipient.rpc(
        "respond_to_friend_request",
        {
            "p_friendship_id": friendship_id,
            "p_response": "accepted",
        },
    ).execute()

    return friendship_id

def request_to_join(member, group_id):
    member.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    return member.table("group_memberships").select(
        "membership_id"
    ).eq("group_id", group_id).single().execute().data["membership_id"]

def share_community(owner, member):
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Message Test Community"}
    ).execute().data

    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": request_to_join(member, group_id),
            "p_decision": "approved",
        },
    ).execute()

    return group_id

def send(sender, recipient, body="Want to play Catan?"):
    return sender.rpc(
        "send_message",
        {
            "p_recipient_user_id": get_user_id(recipient),
            "p_body": body,
        },
    ).execute().data

def get_conversation(client, other):
    return client.rpc(
        "get_conversation",
        {"p_other_user_id": get_user_id(other)}
    ).execute().data

def get_unread_count(client):
    return client.rpc("get_unread_message_count").execute().data

def assert_not_allowed(sender, recipient):
    with pytest.raises(APIError) as exc_info:
        send(sender, recipient)

    assert exc_info.value.message == NOT_ALLOWED

def test_friends_can_message_each_other(test_users):
    user1, user2, _ = test_users
    make_friends(user1, user2)

    message_id = send(user1, user2, "Want to play Catan?")
    send(user2, user1, "Yes!")

    messages1 = get_conversation(user1, user2)
    messages2 = get_conversation(user2, user1)

    # Newest first, from each person's point of view
    assert [m["body"] for m in messages1] == ["Yes!", "Want to play Catan?"]
    assert [m["is_mine"] for m in messages1] == [False, True]
    assert [m["is_mine"] for m in messages2] == [True, False]
    assert messages1[1]["message_id"] == message_id

def test_community_members_can_message_each_other(test_users):
    owner, member, _ = test_users
    share_community(owner, member)

    send(owner, member, "Welcome to the club")
    send(member, owner, "Thanks")

    assert len(get_conversation(owner, member)) == 2
    assert len(get_conversation(member, owner)) == 2

def test_strangers_cannot_message_each_other(test_users):
    user1, user2, _ = test_users

    assert_not_allowed(user1, user2)
    assert get_conversation(user2, user1) == []

def test_pending_friend_request_does_not_allow_messaging(test_users):
    user1, user2, _ = test_users

    user1.table("friendships").insert({
        "requester_user_id": get_user_id(user1),
        "recipient_user_id": get_user_id(user2),
        "status": "pending",
    }).execute()

    assert_not_allowed(user1, user2)
    assert_not_allowed(user2, user1)

def test_pending_community_member_cannot_message(test_users):
    owner, member, _ = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Pending Test Community"}
    ).execute().data

    request_to_join(member, group_id)

    assert_not_allowed(member, owner)
    assert_not_allowed(owner, member)

def test_unfriended_user_cannot_send_but_keeps_history(test_users):
    user1, user2, _ = test_users
    friendship_id = make_friends(user1, user2)

    send(user1, user2)

    user2.table("friendships").delete().eq(
        "friendship_id", friendship_id
    ).execute()

    assert_not_allowed(user1, user2)
    assert_not_allowed(user2, user1)

    assert len(get_conversation(user1, user2)) == 1
    assert len(get_conversation(user2, user1)) == 1

    conversations = user1.rpc("get_my_conversations").execute().data

    assert len(conversations) == 1
    assert conversations[0]["user_id"] == get_user_id(user2)
    assert conversations[0]["can_message"] is False
    assert conversations[0]["is_friend"] is False

def test_removed_community_member_cannot_send_but_keeps_history(test_users):
    owner, member, _ = test_users
    group_id = share_community(owner, member)

    send(member, owner)

    owner.rpc(
        "remove_community_member",
        {
            "p_group_id": group_id,
            "p_user_id": get_user_id(member),
        },
    ).execute()

    assert_not_allowed(member, owner)
    assert_not_allowed(owner, member)
    assert len(get_conversation(member, owner)) == 1

def test_blocked_friendship_prevents_messaging_in_shared_community(
    test_users,
    test_config
):
    url, _, service_key = test_config
    user1, user2, _ = test_users

    friendship_id = make_friends(user1, user2)
    share_community(user1, user2)
    send(user1, user2)

    create_client(url, service_key).table("friendships").update({
        "status": "blocked"
    }).eq("friendship_id", friendship_id).execute()

    assert_not_allowed(user1, user2)
    assert_not_allowed(user2, user1)

def test_cannot_message_yourself(test_users):
    user1, _, _ = test_users

    assert_not_allowed(user1, user1)

@pytest.mark.parametrize(
    "body, error_message",
    [
        ("", "Message cannot be empty"),
        ("  \n\t ", "Message cannot be empty"),
        ("x" * 2001, "Message is too long"),
    ],
)
def test_invalid_message_bodies_are_rejected(test_users, body, error_message):
    user1, user2, _ = test_users
    make_friends(user1, user2)

    with pytest.raises(APIError) as exc_info:
        send(user1, user2, body)

    assert exc_info.value.message == error_message
    assert get_conversation(user1, user2) == []

def test_other_users_cannot_read_a_conversation(test_users):
    user1, user2, user3 = test_users
    make_friends(user1, user2)

    message_id = send(user1, user2)

    # Asking for either person's conversation only returns your own
    assert get_conversation(user3, user1) == []
    assert get_conversation(user3, user2) == []

    rows = user3.table("messages").select("*").eq(
        "message_id", message_id
    ).execute().data

    assert rows == []

def test_participants_can_read_their_message_rows(test_users):
    user1, user2, _ = test_users
    make_friends(user1, user2)

    message_id = send(user1, user2)

    for client in (user1, user2):
        rows = client.table("messages").select("*").eq(
            "message_id", message_id
        ).execute().data

        assert len(rows) == 1

def test_messages_can_only_be_changed_through_functions(test_users):
    user1, user2, _ = test_users
    make_friends(user1, user2)

    message_id = send(user1, user2)

    with pytest.raises(APIError) as insert_error:
        user1.table("messages").insert({
            "sender_user_id": get_user_id(user1),
            "recipient_user_id": get_user_id(user2),
            "body": "Skipping the friend check",
        }).execute()

    with pytest.raises(APIError) as update_error:
        user1.table("messages").update({
            "body": "Rewriting history"
        }).eq("message_id", message_id).execute()

    with pytest.raises(APIError) as delete_error:
        user2.table("messages").delete().eq(
            "message_id", message_id
        ).execute()

    assert insert_error.value.code == "42501"
    assert update_error.value.code == "42501"
    assert delete_error.value.code == "42501"

def test_can_message_check_is_not_callable_directly(test_users):
    user1, user2, _ = test_users

    with pytest.raises(APIError) as exc_info:
        user1.rpc(
            "can_message_user",
            {"p_user_id": get_user_id(user2)}
        ).execute()

    assert exc_info.value.code == "42501"

def test_unread_count_and_marking_read(test_users):
    user1, user2, user3 = test_users
    make_friends(user1, user2)
    make_friends(user3, user2)

    send(user1, user2)
    send(user1, user2)
    send(user3, user2)

    assert get_unread_count(user2) == 3
    assert get_unread_count(user1) == 0

    # The sender can't mark the recipient's messages as read
    user1.rpc(
        "mark_conversation_read",
        {"p_other_user_id": get_user_id(user2)}
    ).execute()

    assert get_unread_count(user2) == 3

    # Reading one conversation leaves the other one unread
    user2.rpc(
        "mark_conversation_read",
        {"p_other_user_id": get_user_id(user1)}
    ).execute()

    assert get_unread_count(user2) == 1
    assert all(m["read_at"] for m in get_conversation(user2, user1))
    assert not any(m["read_at"] for m in get_conversation(user2, user3))

def test_conversation_list(test_users):
    user1, friend, member = test_users
    make_friends(user1, friend)
    share_community(user1, member)

    # Nobody has sent anything yet: both show up, sorted by name
    conversations = user1.rpc("get_my_conversations").execute().data
    by_id = {c["user_id"]: c for c in conversations}

    assert len(conversations) == 2
    assert by_id[get_user_id(friend)]["is_friend"] is True
    assert by_id[get_user_id(member)]["is_friend"] is False
    assert all(c["can_message"] for c in conversations)
    assert all(c["last_message"] is None for c in conversations)
    assert all(c["unread_count"] == 0 for c in conversations)

    # The most recent conversation comes first
    send(friend, user1, "First")
    send(member, user1, "Second")
    send(member, user1, "Third")

    conversations = user1.rpc("get_my_conversations").execute().data

    assert conversations[0]["user_id"] == get_user_id(member)
    assert conversations[0]["last_message"] == "Third"
    assert conversations[0]["unread_count"] == 2
    assert conversations[1]["user_id"] == get_user_id(friend)
    assert conversations[1]["unread_count"] == 1

def test_conversation_list_hides_strangers(test_users):
    user1, user2, _ = test_users

    make_friends(user1, user2)

    conversations = user1.rpc("get_my_conversations").execute().data

    assert [c["user_id"] for c in conversations] == [get_user_id(user2)]

def test_user_is_not_listed_as_their_own_contact(test_users):
    owner, member, _ = test_users
    share_community(owner, member)

    conversations = owner.rpc("get_my_conversations").execute().data

    assert get_user_id(owner) not in [c["user_id"] for c in conversations]

@pytest.mark.parametrize(
    "function, params",
    [
        (
            "send_message",
            {
                "p_recipient_user_id": "00000000-0000-0000-0000-000000000000",
                "p_body": "Hello",
            },
        ),
        (
            "get_conversation",
            {"p_other_user_id": "00000000-0000-0000-0000-000000000000"},
        ),
        ("get_my_conversations", {}),
        ("get_unread_message_count", {}),
        (
            "mark_conversation_read",
            {"p_other_user_id": "00000000-0000-0000-0000-000000000000"},
        ),
    ],
)
def test_anonymous_cannot_use_messaging(anonymous_client, function, params):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.rpc(function, params).execute()

    assert exc_info.value.code == "42501"

def test_anonymous_cannot_read_messages(anonymous_client):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.table("messages").select("*").execute()

    assert exc_info.value.code == "42501"
