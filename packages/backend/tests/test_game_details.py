import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.auth import get_current_user
from app.main import app
from app.routers import games as games_router
from app.routers import wishlist as wishlist_router
from app.schemas.games import BoardGameCreate

GAME = {
    "title": "Catan",
    "min_players": 3,
    "max_players": 4,
    "genre": "Strategy",
    "description": "Trade and build settlements",
}

EXTRAS = {
    "image_url": "https://example.com/catan.png",
    "min_age": 10,
    "avg_playing_time": 90,
}

@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: object()
    yield TestClient(app, headers={"Authorization": "Bearer test-token"})
    app.dependency_overrides.clear()

def test_new_details_are_optional():
    game = BoardGameCreate(**GAME)

    assert game.image_url is None
    assert game.min_age is None
    assert game.avg_playing_time is None

@pytest.mark.parametrize(
    "field, value",
    [
        ("description", "a" * 1000),
        ("image_url", "http://example.com/catan.png"),
        ("image_url", "https://example.com/" + "a" * 480),
        ("min_age", 1),
        ("min_age", 99),
        ("avg_playing_time", 1),
        ("avg_playing_time", 100000),
    ],
)
def test_accepts_values_within_limits(field, value):
    game = BoardGameCreate(**{**GAME, field: value})

    assert getattr(game, field) == value

@pytest.mark.parametrize(
    "field, value",
    [
        ("description", "a" * 1001),
        ("image_url", "javascript:alert(1)"),
        ("image_url", "ftp://example.com/catan.png"),
        ("image_url", "https://example.com/two words.png"),
        ("image_url", "https://example.com/" + "a" * 481),
        ("min_age", 0),
        ("min_age", 100),
        ("avg_playing_time", 0),
        ("avg_playing_time", 100001),
    ],
)
def test_rejects_values_outside_limits(field, value):
    with pytest.raises(ValidationError):
        BoardGameCreate(**{**GAME, field: value})

def test_library_route_passes_on_new_details(client, monkeypatch):
    saved = {}

    def fake_add(**details):
        saved.update(details)
        return "new-item-id"

    monkeypatch.setattr(games_router, "add_game_to_library", fake_add)

    response = client.post(
        "/api/games/library",
        json={**GAME, **EXTRAS, "condition": "good"}
    )

    assert response.status_code == 200
    assert {field: saved[field] for field in EXTRAS} == EXTRAS

def test_wishlist_route_passes_on_new_details(client, monkeypatch):
    saved = {}

    def fake_add(**details):
        saved.update(details)
        return "new-item-id"

    monkeypatch.setattr(wishlist_router, "add_game_to_wishlist", fake_add)

    response = client.post("/api/wishlist", json={**GAME, **EXTRAS})

    assert response.status_code == 200
    assert {field: saved[field] for field in EXTRAS} == EXTRAS

def test_routes_reject_a_bad_image_url(client):
    bad_game = {**GAME, "image_url": "javascript:alert(1)"}

    library = client.post(
        "/api/games/library",
        json={**bad_game, "condition": "good"}
    )
    wishlist = client.post("/api/wishlist", json=bad_game)

    assert library.status_code == 422
    assert wishlist.status_code == 422
