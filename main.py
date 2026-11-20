from __future__ import annotations

import asyncio
import json
import ssl
import urllib.request
from html import unescape
from json import JSONDecodeError
from urllib.error import HTTPError, URLError

import decky

try:
    import certifi
except Exception:
    certifi = None

POSTS_URL = "https://steamdeckhq.com/wp-json/wp/v2/posts?per_page=3"
SETTINGS_URL = (
    "https://steamdeckhq.com/wp-json/wp/v2/game-reviews/"
    "?meta_key=steam_app_id&meta_value={appid}&per_page=1"
)
REVIEWS_URL = "https://steamdeckhq.com/wp-json/wp/v2/game-reviews/?per_page=3"
STORE_TABS_URL = "http://localhost:8080/json"
USER_AGENT = "SteamDeckHQDeckyPlugin/1.0"


def _create_ssl_context():
    if certifi is not None:
        return ssl.create_default_context(cafile=certifi.where())

    return ssl.create_default_context()


def _request_json(url: str):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    context = _create_ssl_context() if url.startswith("https://") else None

    with urllib.request.urlopen(request, context=context, timeout=10) as response:
        return json.load(response)


async def _fetch(url, read_result):
    try:
        payload = await asyncio.to_thread(_request_json, url)
        return {"data": read_result(payload)}
    except Exception as err:
        if isinstance(err, HTTPError):
            detail = f"HTTP {err.code}: {err.reason}"
        else:
            detail = f"{type(err).__name__}: {err}"
        decky.logger.error(
            f"Request to {url} failed: {detail}",
            exc_info=not isinstance(err, (URLError, TimeoutError, JSONDecodeError)),
        )
        return {"error": detail}


def _decode_posts(posts):
    if not isinstance(posts, list):
        return []

    for post in posts:
        title = post.get("title") if isinstance(post, dict) else None
        if isinstance(title, dict) and isinstance(title.get("rendered"), str):
            title["rendered"] = unescape(title["rendered"])
    return posts


def _store_app_id(tabs):
    if not isinstance(tabs, list):
        return None

    for tab in tabs:
        url = tab.get("url") if isinstance(tab, dict) else None
        if not isinstance(url, str):
            continue

        if "/library/app/" in url:
            app_id = url.split("/library/app/")[1].split("/")[0]
        elif "store.steampowered.com/app/" in url:
            app_id = url.split("/app/")[1].split("?")[0].split("/")[0]
        else:
            continue
        if app_id:
            return app_id
    return None


class Plugin:
    async def _main(self):
        decky.logger.info("Steam Deck HQ plugin loaded")

    async def _unload(self):
        decky.logger.info("Steam Deck HQ plugin unloaded")

    async def get_news(self):
        return await _fetch(POSTS_URL, _decode_posts)

    async def get_latest_reviews(self):
        return await _fetch(REVIEWS_URL, _decode_posts)

    async def get_review_for_app(self, app_id: str):
        if not app_id:
            return {"data": None}

        return await _fetch(
            SETTINGS_URL.format(appid=app_id),
            lambda posts: next(iter(_decode_posts(posts)), None),
        )

    async def get_store_app_id(self):
        return await _fetch(STORE_TABS_URL, _store_app_id)
