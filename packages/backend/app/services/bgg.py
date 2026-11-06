import html
import os
import re
import threading
import time
import xml.etree.ElementTree as ET

import httpx

# BoardGameGeek XML API2. BGG requires an approved application
# token (boardgamegeek.com/applications). Requests stay on the
# backend so the token never reaches the browser
BGG_API_URL = "https://boardgamegeek.com/xmlapi2"
REQUEST_TIMEOUT_SECONDS = 10

# Our own limit, not a published BGG number. It keeps us well
# clear of BGG rejecting requests for coming in too fast
SECONDS_BETWEEN_REQUESTS = 2

# Game details rarely change, so don't ask BGG for them twice
CACHE_SECONDS = 24 * 60 * 60
MAX_CACHE_ENTRIES = 500

MAX_SEARCH_RESULTS = 10

# Same limits as BoardGameCreate, so a picked game passes validation
MAX_TITLE_LENGTH = 100
MAX_GENRE_LENGTH = 50
MAX_DESCRIPTION_LENGTH = 1000
MAX_IMAGE_URL_LENGTH = 500
MAX_MIN_AGE = 99
MAX_AVG_PLAYING_TIME = 100000

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

    games = _cached(("search", query.casefold()), load)

    return _with_thumbnails(games)

# Returns None when BGG has no game with this id
def get_board_game(bgg_id: int):

    def load():
        item = _get_xml("thing", {"id": bgg_id}).find("item")
        return None if item is None else _parse_game(item)

    return _cached(("thing", bgg_id), load)

# BGG's search results have no images, so they come from a second
# request for the listed games. That also caches their details, which
# makes picking one instant. If it fails, the names still show
def _with_thumbnails(games):
    try:
        details = _get_board_games([game["bgg_id"] for game in games])
    except BoardGameSearchError:
        details = {}

    return [
        {
            **game,
            "thumbnail": (details.get(game["bgg_id"]) or {}).get("thumbnail")
        }
        for game in games
    ]

# Details for several games, with one request for any not yet cached
def _get_board_games(bgg_ids):
    games = {}
    missing = []

    for bgg_id in bgg_ids:
        hit = _read_cache(("thing", bgg_id))

        if hit:
            games[bgg_id] = hit[1]
        else:
            missing.append(bgg_id)

    if missing:
        ids = ",".join(str(bgg_id) for bgg_id in missing)

        for item in _get_xml("thing", {"id": ids}).findall("item"):
            game = _parse_game(item)
            _write_cache(("thing", game["bgg_id"]), game)
            games[game["bgg_id"]] = game

    return games

def _cached(key, load):
    hit = _read_cache(key)

    if hit:
        return hit[1]

    value = load()
    _write_cache(key, value)

    return value

def _read_cache(key):
    with _cache_lock:
        hit = _cache.get(key)

    if hit and time.monotonic() - hit[0] < CACHE_SECONDS:
        return hit

    return None

def _write_cache(key, value):
    with _cache_lock:
        # Dicts keep insertion order, so this drops the oldest entry
        if len(_cache) >= MAX_CACHE_ENTRIES:
            _cache.pop(next(iter(_cache)))
        _cache[key] = (time.monotonic(), value)

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
        "year": _to_int(_value(item, "yearpublished")),
        "thumbnail": _web_url(item.findtext("thumbnail")),
        "image_url": _web_url(item.findtext("image")),
        "min_age": _in_range(_to_int(_value(item, "minage")), MAX_MIN_AGE),
        "avg_playing_time": _average_playing_time(item)
    }

# BGG has no average, and its playingtime is usually just the longest
# time. So use the middle of its range: 60 to 120 minutes gives 90
def _average_playing_time(item):
    shortest = _to_int(_value(item, "minplaytime")) or 0
    longest = _to_int(_value(item, "maxplaytime")) or 0

    if 0 < shortest <= longest:
        average = (shortest + longest) // 2
    else:
        average = _to_int(_value(item, "playingtime"))

    return _in_range(average, MAX_AVG_PLAYING_TIME)

# BGG uses 0 for unknown values. Return None for those, or anything
# the form wouldn't accept, so the user can fill them in
def _in_range(value, maximum):
    if value is None or value < 1 or value > maximum:
        return None

    return value

def _web_url(text):
    url = (text or "").strip()

    if len(url) > MAX_IMAGE_URL_LENGTH or not re.fullmatch(r"https?://\S+", url):
        return None

    return url

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
