import importlib

import pytest
from fastapi.testclient import TestClient

from app import main

FRONTEND = "https://board-buddies.azurestaticapps.net"


@pytest.fixture
def start_app(monkeypatch):
    """Starts the app with CORS_ORIGINS set, as Azure would.

    The setting is read when the app starts, so this builds a new app.
    """
    def start(cors_origins):
        monkeypatch.setenv("CORS_ORIGINS", cors_origins)
        return TestClient(importlib.reload(main).app)

    yield start

    # Rebuild the app the other tests use, without the setting
    monkeypatch.delenv("CORS_ORIGINS")
    importlib.reload(main)


def test_deployed_frontend_may_call_the_api(start_app):
    # A trailing slash or extra spaces in the setting don't matter
    client = start_app(f" {FRONTEND}/ , https://other.example.com")

    # What the browser asks before sending a logged-in request
    response = client.options(
        "/api/health",
        headers={
            "Origin": FRONTEND,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND


def test_other_sites_may_not_call_the_api(start_app):
    client = start_app(FRONTEND)

    response = client.get(
        "/api/health",
        headers={"Origin": "https://somewhere-else.example.com"}
    )

    assert "access-control-allow-origin" not in response.headers


def test_no_sites_are_allowed_without_the_setting(start_app):
    client = start_app("")

    response = client.get("/api/health", headers={"Origin": FRONTEND})

    assert "access-control-allow-origin" not in response.headers
