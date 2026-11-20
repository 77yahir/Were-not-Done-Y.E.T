import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.routers import notifications as notifications_router

NOTIFICATION_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
URL = f"/api/notifications/{NOTIFICATION_ID}"

@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: object()
    yield TestClient(app, headers={"Authorization": "Bearer test-token"})
    app.dependency_overrides.clear()


def test_deletes_own_notification(client, monkeypatch):
    monkeypatch.setattr(
        notifications_router,
        "delete_notification",
        lambda notification_id, access_token: None
    )

    response = client.delete(URL)

    assert response.status_code == 204


def test_delete_missing_notification_returns_404(client, monkeypatch):
    def fake_delete(notification_id, access_token):
        raise ValueError("Notification not found")

    monkeypatch.setattr(notifications_router, "delete_notification", fake_delete)

    response = client.delete(URL)

    assert response.status_code == 404