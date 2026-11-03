import xml.etree.ElementTree as ET

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.services import bgg

# Shaped like BoardGameGeek XML API2 responses
SEARCH_XML = """<?xml version="1.0" encoding="utf-8"?>
<items total="4" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
    <item type="boardgame" id="101">
        <name type="primary" value="Catan Dice Game"/>
        <yearpublished value="2007"/>
    </item>
    <item type="boardgame" id="13">
        <name type="primary" value="CATAN"/>
        <yearpublished value="1995"/>
    </item>
    <item type="boardgame" id="102">
        <name type="alternate" value="Settlers of Catan Junior"/>
    </item>
    <item type="boardgame" id="103">
        <name type="primary" value="Catan Card Game"/>
        <yearpublished value="1996"/>
    </item>
</items>"""

THING_XML = """<?xml version="1.0" encoding="utf-8"?>
<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
    <item type="boardgame" id="13">
        <name type="primary" sortindex="1" value="CATAN"/>
        <name type="alternate" sortindex="1" value="The Settlers of Catan"/>
        <description>In CATAN players build settlements&amp;mdash;and trade.&#10;&#10;{filler}</description>
        <yearpublished value="1995"/>
        <minplayers value="3"/>
        <maxplayers value="4"/>
        <link type="boardgamemechanic" id="2072" value="Dice Rolling"/>
        <link type="boardgamecategory" id="1021" value="Economic"/>
        <link type="boardgamecategory" id="1026" value="Negotiation"/>
    </item>
</items>""".replace("{filler}", "Roll dice to gather resources. " * 20)

@pytest.fixture(autouse=True)
def empty_cache():
    bgg._cache.clear()

@pytest.fixture
def bgg_returns(monkeypatch):
    calls = []

    def respond(xml):
        def fake_get_xml(command, params):
            calls.append((command, params))
            return ET.fromstring(xml)

        monkeypatch.setattr(bgg, "_get_xml", fake_get_xml)
        return calls

    return respond

def test_search_ranks_closest_names_first(bgg_returns):
    bgg_returns(SEARCH_XML)

    games = bgg.search_board_games("catan")

    assert [game["bgg_id"] for game in games] == [13, 103, 101, 102]
    assert games[0] == {"bgg_id": 13, "name": "CATAN", "year": 1995}
    assert games[3]["year"] is None

def test_search_results_are_cached(bgg_returns):
    calls = bgg_returns(SEARCH_XML)

    bgg.search_board_games("catan")
    bgg.search_board_games("CATAN")

    assert len(calls) == 1

def test_game_details_fit_add_game_form(bgg_returns):
    bgg_returns(THING_XML)

    game = bgg.get_board_game(13)

    assert game["title"] == "CATAN"
    assert game["min_players"] == 3
    assert game["max_players"] == 4
    assert game["genre"] == "Economic"
    assert game["description"].startswith(
        "In CATAN players build settlements—and trade. Roll dice"
    )
    assert "\n" not in game["description"]
    assert len(game["description"]) <= bgg.MAX_DESCRIPTION_LENGTH
    assert game["description"].endswith("…")

def test_unknown_player_counts_are_left_blank(bgg_returns):
    bgg_returns(
        THING_XML
        .replace('<minplayers value="3"/>', '<minplayers value="0"/>')
        .replace('<maxplayers value="4"/>', '<maxplayers value="0"/>')
    )

    game = bgg.get_board_game(13)

    assert game["min_players"] is None
    assert game["max_players"] is None

def test_unknown_game_returns_none(bgg_returns):
    bgg_returns("<items></items>")

    assert bgg.get_board_game(999999999) is None

def test_search_without_token_raises(monkeypatch):
    monkeypatch.delenv("BGG_API_TOKEN", raising=False)

    with pytest.raises(bgg.BoardGameSearchError):
        bgg.search_board_games("catan")

def test_requests_send_token_and_reject_errors(monkeypatch):
    monkeypatch.setenv("BGG_API_TOKEN", "test-token")
    monkeypatch.setattr(bgg, "SECONDS_BETWEEN_REQUESTS", 0)
    sent = {}

    def fake_get(url, params, headers, timeout):
        sent.update(url=url, params=params, headers=headers)
        return httpx.Response(401)

    monkeypatch.setattr(bgg.httpx, "get", fake_get)

    with pytest.raises(bgg.BoardGameSearchError):
        bgg.search_board_games("catan")

    assert sent["url"] == "https://boardgamegeek.com/xmlapi2/search"
    assert sent["params"] == {"query": "catan", "type": "boardgame"}
    assert sent["headers"]["Authorization"] == "Bearer test-token"

@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: object()
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_search_endpoint_requires_login():
    response = TestClient(app).get("/api/games/search?query=catan")

    assert response.status_code == 401

def test_search_endpoint_returns_games(client, bgg_returns):
    bgg_returns(SEARCH_XML)

    response = client.get("/api/games/search?query=catan")

    assert response.status_code == 200
    assert response.json()["games"][0]["name"] == "CATAN"

def test_search_endpoint_rejects_short_queries(client):
    response = client.get("/api/games/search?query=ca")

    assert response.status_code == 422

def test_search_endpoint_reports_unavailable_search(client, monkeypatch):
    monkeypatch.delenv("BGG_API_TOKEN", raising=False)

    response = client.get("/api/games/search?query=catan")

    assert response.status_code == 503

def test_details_endpoint_returns_404_for_unknown_game(client, bgg_returns):
    bgg_returns("<items></items>")

    response = client.get("/api/games/search/999999999")

    assert response.status_code == 404
