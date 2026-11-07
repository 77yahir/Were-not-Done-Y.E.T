from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from postgrest.exceptions import APIError

from app.core.auth import get_current_user
from app.main import app
from app.routers import messages as messages_router
from app.services import messages as messages_service

OTHER_USER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
CONVERSATION_URL = f"/api/messages/conversations/{OTHER_USER_ID}"

GROUP_ID = "6fa85f64-5717-4562-b3fc-2c963f66afa6"
GROUP_CHAT_URL = f"/api/messages/communities/{GROUP_ID}"

@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: object()
    yield TestClient(app, headers={"Authorization": "Bearer test-token"})
    app.dependency_overrides.clear()

@pytest.mark.parametrize(
    "method, url",
    [
        ("get", "/api/messages/conversations"),
        ("get", "/api/messages/unread-count"),
        ("get", CONVERSATION_URL),
        ("post", CONVERSATION_URL),
        ("patch", f"{CONVERSATION_URL}/read"),
        ("get", "/api/messages/communities"),
        ("get", GROUP_CHAT_URL),
        ("post", GROUP_CHAT_URL),
    ],
)
def test_endpoints_require_login(method, url):
    response = getattr(TestClient(app), method)(url)

    assert response.status_code == 401

def test_lists_conversations(client, monkeypatch):
    monkeypatch.setattr(
        messages_router,
        "get_conversations",
        lambda access_token: [{"user_id": OTHER_USER_ID}]
    )

    response = client.get("/api/messages/conversations")

    assert response.status_code == 200
    assert response.json() == {"conversations": [{"user_id": OTHER_USER_ID}]}

def test_returns_unread_count(client, monkeypatch):
    monkeypatch.setattr(
        messages_router,
        "get_unread_count",
        lambda access_token: 3
    )

    response = client.get("/api/messages/unread-count")

    assert response.json() == {"unread_count": 3}

def test_sends_trimmed_message_with_the_callers_token(client, monkeypatch):
    send_message = MagicMock(return_value="new-message-id")
    monkeypatch.setattr(messages_router, "send_message", send_message)

    response = client.post(CONVERSATION_URL, json={"body": "  Hello!  "})

    assert response.status_code == 200
    assert response.json() == {"message_id": "new-message-id"}
    send_message.assert_called_once_with(
        recipient_id=OTHER_USER_ID,
        body="Hello!",
        access_token="test-token"
    )

@pytest.mark.parametrize(
    "payload",
    [
        {"body": ""},
        {"body": "   \n "},
        {"body": "x" * 2001},
        {},
    ],
)
def test_rejects_invalid_message_bodies(client, monkeypatch, payload):
    send_message = MagicMock()
    monkeypatch.setattr(messages_router, "send_message", send_message)

    response = client.post(CONVERSATION_URL, json=payload)

    assert response.status_code == 422
    send_message.assert_not_called()

def test_accepts_a_message_at_the_length_limit(client, monkeypatch):
    monkeypatch.setattr(
        messages_router,
        "send_message",
        lambda **kwargs: "new-message-id"
    )

    response = client.post(CONVERSATION_URL, json={"body": "x" * 2000})

    assert response.status_code == 200

@pytest.mark.parametrize(
    "method, url",
    [
        ("get", "/api/messages/conversations/not-a-uuid"),
        ("patch", "/api/messages/conversations/not-a-uuid/read"),
    ],
)
def test_rejects_invalid_user_ids(client, method, url):
    response = getattr(client, method)(url)

    assert response.status_code == 422

def test_message_to_non_contact_returns_403(client, monkeypatch):
    error = APIError({
        "code": "P0001",
        "message": "You can only message friends or community members"
    })
    monkeypatch.setattr(
        messages_router,
        "send_message",
        MagicMock(side_effect=error)
    )

    response = client.post(CONVERSATION_URL, json={"body": "Hello"})

    assert response.status_code == 403

def test_other_database_errors_are_not_hidden(client, monkeypatch):
    error = APIError({"code": "XX000", "message": "Something else broke"})
    monkeypatch.setattr(
        messages_router,
        "send_message",
        MagicMock(side_effect=error)
    )

    with pytest.raises(APIError):
        client.post(CONVERSATION_URL, json={"body": "Hello"})

def test_marks_conversation_read(client, monkeypatch):
    mark_read = MagicMock()
    monkeypatch.setattr(messages_router, "mark_conversation_read", mark_read)

    response = client.patch(f"{CONVERSATION_URL}/read")

    assert response.status_code == 200
    mark_read.assert_called_once_with(
        other_user_id=OTHER_USER_ID,
        access_token="test-token"
    )

def test_messages_come_back_oldest_first(monkeypatch):
    database = MagicMock()
    database.rpc.return_value.execute.return_value.data = [
        {"body": "Newest"},
        {"body": "Oldest"},
    ]
    monkeypatch.setattr(
        messages_service,
        "get_user_supabase_client",
        lambda access_token: database
    )

    messages = messages_service.get_messages(OTHER_USER_ID, "test-token")

    assert [m["body"] for m in messages] == ["Oldest", "Newest"]

def not_a_member_error():
    return APIError({
        "code": "P0001",
        "message": "Only community members can use this chat"
    })

def test_lists_community_chats(client, monkeypatch):
    monkeypatch.setattr(
        messages_router,
        "get_community_chats",
        lambda access_token: [{"group_id": GROUP_ID}]
    )

    response = client.get("/api/messages/communities")

    assert response.status_code == 200
    assert response.json() == {"chats": [{"group_id": GROUP_ID}]}

def test_reads_community_chat_with_the_callers_token(client, monkeypatch):
    get_community_messages = MagicMock(return_value=[{"body": "Hi"}])
    monkeypatch.setattr(
        messages_router,
        "get_community_messages",
        get_community_messages
    )

    response = client.get(GROUP_CHAT_URL)

    assert response.status_code == 200
    assert response.json() == {"messages": [{"body": "Hi"}]}
    get_community_messages.assert_called_once_with(
        group_id=GROUP_ID,
        access_token="test-token"
    )

def test_sends_trimmed_community_message(client, monkeypatch):
    send_community_message = MagicMock(return_value="new-message-id")
    monkeypatch.setattr(
        messages_router,
        "send_community_message",
        send_community_message
    )

    response = client.post(GROUP_CHAT_URL, json={"body": "  Hello all!  "})

    assert response.status_code == 200
    assert response.json() == {"message_id": "new-message-id"}
    send_community_message.assert_called_once_with(
        group_id=GROUP_ID,
        body="Hello all!",
        access_token="test-token"
    )

@pytest.mark.parametrize(
    "method, service, kwargs",
    [
        ("get", "get_community_messages", {}),
        ("post", "send_community_message", {"json": {"body": "Hello"}}),
    ],
)
def test_non_members_get_403_from_community_chat(client, monkeypatch, method, service, kwargs):
    monkeypatch.setattr(
        messages_router,
        service,
        MagicMock(side_effect=not_a_member_error())
    )

    response = getattr(client, method)(GROUP_CHAT_URL, **kwargs)

    assert response.status_code == 403
    assert response.json() == {"detail": "Only community members can use this chat"}

@pytest.mark.parametrize(
    "method, service, kwargs",
    [
        ("get", "get_community_messages", {}),
        ("post", "send_community_message", {"json": {"body": "Hello"}}),
    ],
)
def test_other_community_chat_errors_are_not_hidden(client, monkeypatch, method, service, kwargs):
    error = APIError({"code": "XX000", "message": "Something else broke"})
    monkeypatch.setattr(messages_router, service, MagicMock(side_effect=error))

    with pytest.raises(APIError):
        getattr(client, method)(GROUP_CHAT_URL, **kwargs)

@pytest.mark.parametrize(
    "payload",
    [
        {"body": ""},
        {"body": "   \n "},
        {"body": "x" * 2001},
        {},
    ],
)
def test_rejects_invalid_community_messages(client, monkeypatch, payload):
    send_community_message = MagicMock()
    monkeypatch.setattr(
        messages_router,
        "send_community_message",
        send_community_message
    )

    response = client.post(GROUP_CHAT_URL, json=payload)

    assert response.status_code == 422
    send_community_message.assert_not_called()

@pytest.mark.parametrize(
    "method, kwargs",
    [
        ("get", {}),
        ("post", {"json": {"body": "Hello"}}),
    ],
)
def test_rejects_invalid_group_ids(client, method, kwargs):
    response = getattr(client, method)(
        "/api/messages/communities/not-a-uuid",
        **kwargs
    )

    assert response.status_code == 422

def test_community_messages_come_back_oldest_first(monkeypatch):
    database = MagicMock()
    database.rpc.return_value.execute.return_value.data = [
        {"body": "Newest"},
        {"body": "Oldest"},
    ]
    monkeypatch.setattr(
        messages_service,
        "get_user_supabase_client",
        lambda access_token: database
    )

    messages = messages_service.get_community_messages(GROUP_ID, "test-token")

    assert [m["body"] for m in messages] == ["Oldest", "Newest"]
    database.rpc.assert_called_once_with(
        "get_community_messages",
        {"p_group_id": GROUP_ID}
    )
