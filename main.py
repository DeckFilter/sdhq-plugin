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
    "?meta_key=steam_app_id&meta_value={appid}"
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


def _extract_app_id(url: str) -> str | None:
    if "/library/app/" in url:
        return url.split("/library/app/")[1].split("/")[0]

    if "store.steampowered.com/app/" in url:
        return url.split("/app/")[1].split("?")[0].split("/")[0]

    return None


class Plugin:
    def __init__(self):
        self._last_request_errors: dict[str, str] = {}

    async def _main(self):
        decky.logger.info("Steam Deck HQ plugin loaded")

    async def _unload(self):
        decky.logger.info("Steam Deck HQ plugin unloaded")

    def _clear_request_error(self, request_name: str):
        self._last_request_errors.pop(request_name, None)

    def _set_request_error(self, request_name: str, err: Exception):
        if isinstance(err, HTTPError):
            detail = f"HTTP {err.code}: {err.reason}"
        else:
            detail = f"{type(err).__name__}: {err}"

        self._last_request_errors[request_name] = detail
        decky.logger.error(f"Request {request_name} failed: {detail}")

    async def _fetch_json(self, request_name: str, url: str):
        try:
            response = await asyncio.to_thread(_request_json, url)
            self._clear_request_error(request_name)
            return response
        except (HTTPError, URLError, TimeoutError, JSONDecodeError) as err:
            self._set_request_error(request_name, err)
            return None
        except Exception as err:
            self._set_request_error(request_name, err)
            decky.logger.error(
                f"Unexpected error while requesting {url}: {err}", exc_info=True
            )
            return None

    async def _fetch_posts(self, request_name: str, url: str):
        posts = await self._fetch_json(request_name, url)
        if not isinstance(posts, list):
            return []

        for post in posts:
            title = post.get("title") if isinstance(post, dict) else None
            if isinstance(title, dict) and isinstance(title.get("rendered"), str):
                title["rendered"] = unescape(title["rendered"])
        return posts

    async def get_news(self):
        return await self._fetch_posts("news", POSTS_URL)

    async def get_latest_reviews(self):
        return await self._fetch_posts("latest_reviews", REVIEWS_URL)

    async def get_review_for_app(self, app_id: str):
        if not app_id:
            self._clear_request_error("review_for_app")
            return None

        reviews = await self._fetch_posts(
            "review_for_app", SETTINGS_URL.format(appid=app_id)
        )
        return reviews[0] if reviews else None

    async def get_store_app_id(self):
        tabs = await self._fetch_json("store_app_id", STORE_TABS_URL)
        if not isinstance(tabs, list):
            return None

        for tab in tabs:
            if not isinstance(tab, dict):
                continue

            url = tab.get("url")
            if not isinstance(url, str):
                continue

            app_id = _extract_app_id(url)
            if app_id:
                return app_id

        return None

    async def get_last_request_errors(self):
        return dict(self._last_request_errors)
