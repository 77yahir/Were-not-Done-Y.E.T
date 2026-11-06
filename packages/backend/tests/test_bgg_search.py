import xml.etree.ElementTree as ET

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.schemas.games import BoardGameCreate
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
        <thumbnail>https://example.com/catan-small.png</thumbnail>
        <image>https://example.com/catan.png</image>
        <name type="primary" sortindex="1" value="CATAN"/>
        <name type="alternate" sortindex="1" value="The Settlers of Catan"/>
        <description>In CATAN players build settlements&amp;mdash;and trade.&#10;&#10;{filler}</description>
        <yearpublished value="1995"/>
        <minplayers value="3"/>
        <maxplayers value="4"/>
        <playingtime value="120"/>
        <minplaytime value="60"/>
        <maxplaytime value="120"/>
        <minage value="10"/>
        <link type="boardgamemechanic" id="2072" value="Dice Rolling"/>
        <link type="boardgamecategory" id="1021" value="Economic"/>
        <link type="boardgamecategory" id="1026" value="Negotiation"/>
    </item>
</items>""".replace("{filler}", "Roll dice to gather resources. " * 50)

# The games in SEARCH_XML, one of them without an image
THINGS_XML = """<?xml version="1.0" encoding="utf-8"?>
<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
    <item type="boardgame" id="13">
        <thumbnail>https://example.com/catan-small.png</thumbnail>
        <name type="primary" value="CATAN"/>
    </item>
    <item type="boardgame" id="101">
        <thumbnail>https://example.com/dice-small.png</thumbnail>
        <name type="primary" value="Catan Dice Game"/>
    </item>
    <item type="boardgame" id="102">
        <name type="primary" value="Catan Junior"/>
    </item>
    <item type="boardgame" id="103">
        <thumbnail>https://example.com/card-small.png</thumbnail>
        <name type="primary" value="Catan Card Game"/>
    </item>
</items>"""

SEARCH_RESPONSES = {"search": SEARCH_XML, "thing": THINGS_XML}

@pytest.fixture(autouse=True)
def empty_cache():
    bgg._cache.clear()

@pytest.fixture
def bgg_returns(monkeypatch):
    calls = []

    # Takes one response for every command, or a dict with one each
    def respond(xml):
        def fake_get_xml(command, params):
            calls.append((command, params))
            return ET.fromstring(xml[command] if isinstance(xml, dict) else xml)

        monkeypatch.setattr(bgg, "_get_xml", fake_get_xml)
        return calls

    return respond

def test_search_ranks_closest_names_first(bgg_returns):
    bgg_returns(SEARCH_RESPONSES)

    games = bgg.search_board_games("catan")

    assert [game["bgg_id"] for game in games] == [13, 103, 101, 102]
    assert games[0]["name"] == "CATAN"
    assert games[0]["year"] == 1995
    assert games[3]["year"] is None

def test_search_gets_every_thumbnail_in_one_request(bgg_returns):
    calls = bgg_returns(SEARCH_RESPONSES)

    games = bgg.search_board_games("catan")

    assert calls[1:] == [("thing", {"id": "13,103,101,102"})]
    assert games[0]["thumbnail"] == "https://example.com/catan-small.png"
    assert games[3]["thumbnail"] is None

def test_search_keeps_names_when_thumbnails_fail(monkeypatch, bgg_returns):
    def fake_get_xml(command, params):
        if command == "thing":
            raise bgg.BoardGameSearchError("BoardGameGeek returned 429")
        return ET.fromstring(SEARCH_XML)

    monkeypatch.setattr(bgg, "_get_xml", fake_get_xml)

    games = bgg.search_board_games("catan")

    assert games[0]["name"] == "CATAN"
    assert all(game["thumbnail"] is None for game in games)

    # The failure isn't remembered, so the next search tries again
    bgg_returns(SEARCH_RESPONSES)

    assert bgg.search_board_games("catan")[0]["thumbnail"] is not None

def test_search_without_matches_skips_thumbnail_request(bgg_returns):
    calls = bgg_returns({"search": "<items></items>"})

    assert bgg.search_board_games("zzzzzz") == []
    assert [command for command, _ in calls] == ["search"]

def test_search_results_are_cached(bgg_returns):
    calls = bgg_returns(SEARCH_RESPONSES)

    bgg.search_board_games("catan")
    bgg.search_board_games("CATAN")

    assert [command for command, _ in calls] == ["search", "thing"]

def test_picking_a_search_result_needs_no_extra_request(bgg_returns):
    calls = bgg_returns(SEARCH_RESPONSES)

    bgg.search_board_games("catan")
    requests_after_search = len(calls)

    assert bgg.get_board_game(13)["title"] == "CATAN"
    assert len(calls) == requests_after_search

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

def test_game_details_include_image_age_and_playing_time(bgg_returns):
    bgg_returns(THING_XML)

    game = bgg.get_board_game(13)

    assert game["thumbnail"] == "https://example.com/catan-small.png"
    assert game["image_url"] == "https://example.com/catan.png"
    assert game["min_age"] == 10

@pytest.mark.parametrize(
    "shortest, longest, listed, expected",
    [
        (60, 120, 120, 90),
        (45, 45, 45, 45),
        (30, 45, 45, 37),
        # Without a usable range, fall back to BGG's listed time
        (0, 0, 45, 45),
        (120, 60, 90, 90),
        # Unknown, or too long for the form
        (0, 0, 0, None),
        (200000, 200000, 200000, None),
    ],
)
def test_average_playing_time(bgg_returns, shortest, longest, listed, expected):
    bgg_returns(
        THING_XML
        .replace('<minplaytime value="60"/>', f'<minplaytime value="{shortest}"/>')
        .replace('<maxplaytime value="120"/>', f'<maxplaytime value="{longest}"/>')
        .replace('<playingtime value="120"/>', f'<playingtime value="{listed}"/>')
    )

    assert bgg.get_board_game(13)["avg_playing_time"] == expected

def test_picked_game_passes_add_game_validation(bgg_returns):
    bgg_returns(
        THING_XML
        .replace('value="CATAN"', f'value="{"Long Title " * 20}"')
        .replace('value="Economic"', f'value="{"Long Genre " * 10}"')
        .replace('<minage value="10"/>', '<minage value="150"/>')
        .replace('https://example.com/catan.png', "https://example.com/" + "a" * 500)
    )

    game = bgg.get_board_game(13)

    # Raises if BGG's values don't fit what the backend accepts
    BoardGameCreate(**{field: game[field] for field in BoardGameCreate.model_fields})

    assert game["min_age"] is None
    assert game["image_url"] is None

def test_unknown_values_are_left_blank(bgg_returns):
    bgg_returns(
        THING_XML
        .replace('<minplayers value="3"/>', '<minplayers value="0"/>')
        .replace('<maxplayers value="4"/>', '<maxplayers value="0"/>')
        .replace('<minage value="10"/>', '<minage value="0"/>')
        .replace('<image>https://example.com/catan.png</image>', "")
    )

    game = bgg.get_board_game(13)

    assert game["min_players"] is None
    assert game["max_players"] is None
    assert game["min_age"] is None
    assert game["image_url"] is None

def test_image_that_is_not_a_web_link_is_left_out(bgg_returns):
    bgg_returns(
        THING_XML.replace("https://example.com/catan.png", "javascript:alert(1)")
    )

    assert bgg.get_board_game(13)["image_url"] is None

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
    bgg_returns(SEARCH_RESPONSES)

    response = client.get("/api/games/search?query=catan")

    assert response.status_code == 200
    assert response.json()["games"][0] == {
        "bgg_id": 13,
        "name": "CATAN",
        "year": 1995,
        "thumbnail": "https://example.com/catan-small.png"
    }

def test_search_endpoint_rejects_short_queries(client):
    response = client.get("/api/games/search?query=ca")

    assert response.status_code == 422

def test_search_endpoint_reports_unavailable_search(client, monkeypatch):
    monkeypatch.delenv("BGG_API_TOKEN", raising=False)

    response = client.get("/api/games/search?query=catan")

    assert response.status_code == 503

def test_details_endpoint_requires_login():
    response = TestClient(app).get("/api/games/search/13")

    assert response.status_code == 401

def test_details_endpoint_returns_game(client, bgg_returns):
    bgg_returns(THING_XML)

    response = client.get("/api/games/search/13")

    assert response.status_code == 200
    assert response.json()["game"]["title"] == "CATAN"

def test_details_endpoint_returns_404_for_unknown_game(client, bgg_returns):
    bgg_returns("<items></items>")

    response = client.get("/api/games/search/999999999")

    assert response.status_code == 404

def test_details_endpoint_reports_unavailable_search(client, monkeypatch):
    monkeypatch.delenv("BGG_API_TOKEN", raising=False)

    response = client.get("/api/games/search/13")

    assert response.status_code == 503
