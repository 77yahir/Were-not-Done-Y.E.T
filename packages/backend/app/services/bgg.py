import html
import os
import threading
import time
import xml.etree.ElementTree as ET

import httpx

# BoardGameGeek XML API2. BGG requires an approved application
# token (boardgamegeek.com/applications), server-side requests,
# and no more than one request every 2 seconds
BGG_API_URL = "https://boardgamegeek.com/xmlapi2"
SECONDS_BETWEEN_REQUESTS = 2
REQUEST_TIMEOUT_SECONDS = 10

# BGG asks apps to cache, and game details rarely change
CACHE_SECONDS = 24 * 60 * 60
MAX_CACHE_ENTRIES = 500

MAX_SEARCH_RESULTS = 10

# Same limits as BoardGameCreate, so a picked game passes validation
MAX_TITLE_LENGTH = 100
MAX_GENRE_LENGTH = 50
MAX_DESCRIPTION_LENGTH = 300

class BoardGameSearchError(Exception):
    pass

_cache = {}
_cache_lock = threading.Lock()
_request_lock = threading.Lock()
_last_request_at = 0.0

def search_board_games(query: str):

    def load():
        root = _get_xml("search", {"query": query, "type": "boardgame"})
        return _rank_matches(_parse_search(root), query)

    return _cached(("search", query.casefold()), load)

# Returns None when BGG has no game with this id
def get_board_game(bgg_id: int):

    def load():
        item = _get_xml("thing", {"id": bgg_id}).find("item")
        return None if item is None else _parse_game(item)

    return _cached(("thing", bgg_id), load)

def _cached(key, load):
    now = time.monotonic()

    with _cache_lock:
        hit = _cache.get(key)

    if hit and now - hit[0] < CACHE_SECONDS:
        return hit[1]

    value = load()

    with _cache_lock:
        # Dicts keep insertion order, so this drops the oldest entry
        if len(_cache) >= MAX_CACHE_ENTRIES:
            _cache.pop(next(iter(_cache)))
        _cache[key] = (now, value)

    return value

def _get_xml(command: str, params: dict):
    global _last_request_at

    token = os.getenv("BGG_API_TOKEN")

    if not token:
        raise BoardGameSearchError("BGG_API_TOKEN is not set")

    # One request at a time, spaced out for BGG's rate limit
    with _request_lock:
        wait = _last_request_at + SECONDS_BETWEEN_REQUESTS - time.monotonic()
        if wait > 0:
            time.sleep(wait)

        try:
            response = httpx.get(
                f"{BGG_API_URL}/{command}",
                params=params,
                headers={"Authorization": f"Bearer {token}"},
                timeout=REQUEST_TIMEOUT_SECONDS
            )
        except httpx.HTTPError as error:
            raise BoardGameSearchError("Could not reach BoardGameGeek") from error
        finally:
            _last_request_at = time.monotonic()

    if response.status_code != 200:
        raise BoardGameSearchError(
            f"BoardGameGeek returned {response.status_code}"
        )

    try:
        return ET.fromstring(response.content)
    except ET.ParseError as error:
        raise BoardGameSearchError("BoardGameGeek returned invalid XML") from error

def _parse_search(root):
    games = {}

    for item in root.findall("item"):
        bgg_id = _to_int(item.get("id"))
        name = item.find("name")

        # Skip malformed or repeated items
        if bgg_id is None or name is None or bgg_id in games:
            continue

        games[bgg_id] = {
            "bgg_id": bgg_id,
            "name": name.get("value", ""),
            "year": _to_int(_value(item, "yearpublished"))
        }

    return list(games.values())

# Exact names first, then names that start with the query, then
# names that contain it. Shorter names win ties
def _rank_matches(games, query):
    query = query.casefold()

    def closeness(game):
        name = game["name"].casefold()

        if name == query:
            rank = 0
        elif name.startswith(query):
            rank = 1
        elif query in name:
            rank = 2
        else:
            rank = 3

        return (rank, len(name), name)

    return sorted(games, key=closeness)[:MAX_SEARCH_RESULTS]

def _parse_game(item):
    name = item.find("name[@type='primary']")
    title = name.get("value", "").strip() if name is not None else ""
    min_players, max_players = _player_counts(item)

    categories = [
        link.get("value", "")
        for link in item.findall("link[@type='boardgamecategory']")
    ]

    return {
        "bgg_id": _to_int(item.get("id")),
        "title": title[:MAX_TITLE_LENGTH],
        "min_players": min_players,
        "max_players": max_players,
        "genre": categories[0][:MAX_GENRE_LENGTH] if categories else "",
        "description": _clean_description(item.findtext("description", "")),
        "year": _to_int(_value(item, "yearpublished"))
    }

# BGG uses 0 for unknown player counts. Return None instead so
# the user fills them in
def _player_counts(item):
    min_players = _to_int(_value(item, "minplayers"))
    max_players = _to_int(_value(item, "maxplayers"))

    if not min_players or min_players < 1:
        min_players = None

    if not max_players or max_players < (min_players or 1):
        max_players = None

    return min_players, max_players

# BGG descriptions are long, use &#10; for line breaks, and
# double-escape HTML entities (&amp;mdash;)
def _clean_description(text: str):
    text = " ".join(html.unescape(text).split())

    if len(text) <= MAX_DESCRIPTION_LENGTH:
        return text

    # Cut at a word break and mark the cut
    cut = text[:MAX_DESCRIPTION_LENGTH - 1].rsplit(" ", 1)[0]
    return cut + "…"

# Reads <tag value="..."/> from a BGG item
def _value(item, tag: str):
    element = item.find(tag)
    return None if element is None else element.get("value")

def _to_int(text):
    try:
        return int(text)
    except (TypeError, ValueError):
        return None
