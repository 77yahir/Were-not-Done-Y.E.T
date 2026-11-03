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
