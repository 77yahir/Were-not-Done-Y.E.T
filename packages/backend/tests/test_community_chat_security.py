import time

import pytest
from postgrest.exceptions import APIError

NOT_A_MEMBER = "Only community members can use this chat"

def get_user_id(client):
    return str(client.auth.get_user().user.id)

def create_community(owner, name="Chat Test Community"):
    return owner.rpc(
        "create_community",
        {"p_name": name}
    ).execute().data

def request_to_join(member, group_id):
    member.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    return member.table("group_memberships").select(
        "membership_id"
    ).eq("group_id", group_id).single().execute().data["membership_id"]

def review(owner, membership_id, decision):
    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": membership_id,
            "p_decision": decision,
        },
    ).execute()

def join(owner, member, group_id):
    review(owner, request_to_join(member, group_id), "approved")

def remove(owner, member, group_id):
    owner.rpc(
        "remove_community_member",
        {
            "p_group_id": group_id,
            "p_user_id": get_user_id(member),
        },
    ).execute()

def post(client, group_id, body="Who's up for Catan?"):
    message_id = client.rpc(
        "send_community_message",
        {
            "p_group_id": group_id,
            "p_body": body,
        },
    ).execute().data

    # Some local test databases only count whole milliseconds, so two
    # quick messages could share a timestamp and swap places
    time.sleep(0.005)

    return message_id

def read(client, group_id):
    return client.rpc(
        "get_community_messages",
        {"p_group_id": group_id}
    ).execute().data

def my_chats(client):
    return client.rpc("get_my_community_chats").execute().data

def chat_ids(client):
    return [chat["group_id"] for chat in my_chats(client)]

def usernames(owner, group_id):
    members = owner.rpc(
        "get_community_members",
        {"p_group_id": group_id}
    ).execute().data

    return {member["user_id"]: member["username"] for member in members}

def assert_shut_out(client, group_id):
    with pytest.raises(APIError) as read_error:
        read(client, group_id)

    with pytest.raises(APIError) as post_error:
        post(client, group_id)

    assert read_error.value.message == NOT_A_MEMBER
    assert post_error.value.message == NOT_A_MEMBER
    assert group_id not in chat_ids(client)

    # Reading the table directly is blocked too
    assert client.table("community_messages").select("*").eq(
        "group_id", group_id
    ).execute().data == []

def test_creator_is_in_the_chat_right_away(test_users):
    owner, _, _ = test_users
    group_id = create_community(owner)

    assert chat_ids(owner) == [group_id]
    assert read(owner, group_id) == []

def test_members_chat_together(test_users):
    owner, member, _ = test_users
    group_id = create_community(owner)
    join(owner, member, group_id)
    names = usernames(owner, group_id)

    post(owner, group_id, "Welcome!")
    post(member, group_id, "Thanks!")

    for client, mine in ((owner, [False, True]), (member, [True, False])):
        messages = read(client, group_id)

        # Newest first, from each member's point of view
        assert [m["body"] for m in messages] == ["Thanks!", "Welcome!"]
        assert [m["is_mine"] for m in messages] == mine
        assert [m["sender_username"] for m in messages] == [
            names[get_user_id(member)],
            names[get_user_id(owner)],
        ]

def test_pending_request_has_no_chat(test_users):
    owner, member, _ = test_users
    group_id = create_community(owner)
    post(owner, group_id, "Members only")
    request_to_join(member, group_id)

    assert_shut_out(member, group_id)

def test_rejected_request_has_no_chat(test_users):
    owner, member, _ = test_users
    group_id = create_community(owner)
    post(owner, group_id, "Members only")
    review(owner, request_to_join(member, group_id), "rejected")

    assert_shut_out(member, group_id)

def test_approved_member_joins_chat_and_sees_history(test_users):
    owner, member, _ = test_users
    group_id = create_community(owner)
    post(owner, group_id, "Before you joined")

    join(owner, member, group_id)

    assert chat_ids(member) == [group_id]
    assert [m["body"] for m in read(member, group_id)] == ["Before you joined"]
    assert post(member, group_id, "Hi all") is not None

def test_removed_member_leaves_chat(test_users):
    owner, member, _ = test_users
    group_id = create_community(owner)
    join(owner, member, group_id)
    post(member, group_id, "See you next week")

    remove(owner, member, group_id)

    assert_shut_out(member, group_id)

    # What they said before leaving stays in the chat
    remaining = read(owner, group_id)
    assert [m["body"] for m in remaining] == ["See you next week"]
    assert remaining[0]["sender_user_id"] == get_user_id(member)

def test_rejoining_member_rejoins_chat(test_users):
    owner, member, _ = test_users
    group_id = create_community(owner)
    join(owner, member, group_id)
    remove(owner, member, group_id)
    post(owner, group_id, "Sent while you were away")

    join(owner, member, group_id)

    assert chat_ids(member) == [group_id]
    assert [m["body"] for m in read(member, group_id)] == ["Sent while you were away"]

def test_outsider_cannot_see_or_post(test_users):
    owner, member, outsider = test_users
    group_id = create_community(owner)
    join(owner, member, group_id)
    post(owner, group_id)

    assert_shut_out(outsider, group_id)
    assert outsider.table("community_messages").select("*").execute().data == []

def test_members_only_see_their_own_communities(test_users):
    owner, member, _ = test_users
    joined = create_community(owner, "Joined Community")
    other = create_community(owner, "Other Community")
    join(owner, member, joined)
    post(owner, joined, "For members")
    post(owner, other, "Not for you")

    assert chat_ids(member) == [joined]

    rows = member.table("community_messages").select("body").execute().data
    assert [row["body"] for row in rows] == ["For members"]

def test_messages_cannot_be_written_directly(test_users):
    owner, _, _ = test_users
    group_id = create_community(owner)
    message_id = post(owner, group_id)

    attempts = [
        lambda: owner.table("community_messages").insert({
            "group_id": group_id,
            "sender_user_id": get_user_id(owner),
            "body": "Skipping the checks",
        }).execute(),
        lambda: owner.table("community_messages").update(
            {"body": "Edited"}
        ).eq("message_id", message_id).execute(),
        lambda: owner.table("community_messages").delete().eq(
            "message_id", message_id
        ).execute(),
    ]

    for attempt in attempts:
        with pytest.raises(APIError) as exc_info:
            attempt()

        assert exc_info.value.code == "42501"

    assert [m["body"] for m in read(owner, group_id)] == ["Who's up for Catan?"]

@pytest.mark.parametrize(
    "body, error",
    [
        ("   \n ", "Message cannot be empty"),
        ("x" * 2001, "Message is too long"),
    ],
)
def test_invalid_messages_are_refused(test_users, body, error):
    owner, _, _ = test_users
    group_id = create_community(owner)

    with pytest.raises(APIError) as exc_info:
        post(owner, group_id, body)

    assert exc_info.value.message == error
    assert read(owner, group_id) == []

def test_messages_are_trimmed_and_can_be_2000_characters(test_users):
    owner, _, _ = test_users
    group_id = create_community(owner)

    post(owner, group_id, "  Game night?  ")
    post(owner, group_id, "x" * 2000)

    assert [m["body"] for m in read(owner, group_id)] == ["x" * 2000, "Game night?"]

def test_chat_list_shows_latest_message_newest_first(test_users):
    owner, member, _ = test_users
    quiet = create_community(owner, "Quiet Community")
    busy = create_community(owner, "Busy Community")
    join(owner, member, busy)
    post(owner, busy, "First")
    post(member, busy, "Latest")

    chats = my_chats(owner)

    assert [chat["group_id"] for chat in chats] == [busy, quiet]
    assert chats[0]["name"] == "Busy Community"
    assert chats[0]["last_message"] == "Latest"
    assert chats[0]["last_sender_username"] == usernames(owner, busy)[get_user_id(member)]
    assert chats[1]["last_message"] is None

@pytest.mark.parametrize(
    "function, params",
    [
        ("get_my_community_chats", {}),
        ("get_community_messages", {"p_group_id": "6fa85f64-5717-4562-b3fc-2c963f66afa6"}),
        ("send_community_message", {"p_group_id": "6fa85f64-5717-4562-b3fc-2c963f66afa6", "p_body": "Hi"}),
    ],
)
def test_anonymous_cannot_use_chats(anonymous_client, function, params):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.rpc(function, params).execute()

    assert exc_info.value.code == "42501"

def test_anonymous_cannot_read_chat_table(anonymous_client):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.table("community_messages").select("*").execute()

    assert exc_info.value.code == "42501"
