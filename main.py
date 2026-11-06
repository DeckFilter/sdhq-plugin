from __future__ import annotations

import asyncio
import json
import ssl
import urllib.request
from json import JSONDecodeError
from urllib.error import HTTPError, URLError

import decky

try:
    import certifi
except Exception:
    certifi = None

POSTS_API_URL = "https://steamdeckhq.com/wp-json/wp/v2/posts"
SETTINGS_URL = (
    "https://steamdeckhq.com/wp-json/wp/v2/game-reviews/"
    "?meta_key=steam_app_id&meta_value={appid}&_embed=wp:featuredmedia"
)
REVIEWS_API_URL = "https://steamdeckhq.com/wp-json/wp/v2/game-reviews/"
STORE_TABS_URL = "http://localhost:8080/json"
USER_AGENT = "SteamDeckHQDeckyPlugin/1.0"


def _create_ssl_context():
    if certifi is not None:
        return ssl.create_default_context(cafile=certifi.where())

    return ssl.create_default_context()


def _request_json(url: str, include_total_pages: bool = False):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    context = _create_ssl_context() if url.startswith("https://") else None

    with urllib.request.urlopen(request, context=context, timeout=10) as response:
        data = json.load(response)
        if include_total_pages:
            return data, response.headers.get("X-WP-TotalPages")
        return data


def _build_page_url(base_url: str, page: int, per_page: int) -> str:
    safe_page = max(1, int(page))
    safe_per_page = max(1, int(per_page))
    return (
        f"{base_url}?page={safe_page}&per_page={safe_per_page}"
        "&_embed=wp:featuredmedia"
    )


def _build_item_url(base_url: str, item_id: int) -> str:
    safe_item_id = int(item_id)
    return f"{base_url.rstrip('/')}/{safe_item_id}?_embed=wp:featuredmedia"


def _prepare_article(article):
    if not isinstance(article, dict):
        return article

    embedded = article.pop("_embedded", None)
    media_items = embedded.get("wp:featuredmedia") if isinstance(embedded, dict) else None
    if not isinstance(media_items, list):
        return article

    for media in media_items:
        if not isinstance(media, dict):
            continue
        details = media.get("media_details")
        if not isinstance(details, dict):
            continue
        source = media.get("source_url")
        width = details.get("width")
        if (
            isinstance(source, str) and source
            and isinstance(width, (int, float)) and not isinstance(width, bool)
            and 0 < width <= 2048
        ):
            article["featured_img"] = source
            return article

        sizes = details.get("sizes")
        candidates = []
        for size in sizes.values() if isinstance(sizes, dict) else ():
            if not isinstance(size, dict):
                continue
            source = size.get("source_url")
            width = size.get("width")
            if (
                isinstance(source, str) and source
                and isinstance(width, (int, float)) and not isinstance(width, bool)
                and 0 < width <= 1280
            ):
                candidates.append((width, source))
        if candidates:
            article["featured_img"] = max(candidates, key=lambda item: item[0])[1]
            return article

    return article


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

    async def _fetch_article_json(self, request_name: str, url: str):
        response = await self._fetch_json(request_name, url)
        if isinstance(response, list):
            return [_prepare_article(article) for article in response]
        return _prepare_article(response)

    async def get_news(self):
        posts = await self._fetch_article_json("news", _build_page_url(POSTS_API_URL, 1, 3))
        return posts if isinstance(posts, list) else []

    async def get_latest_reviews(self):
        reviews = await self._fetch_article_json(
            "latest_reviews", _build_page_url(REVIEWS_API_URL, 1, 3)
        )
        return reviews if isinstance(reviews, list) else []

    async def get_article_page(self, kind: str, page: int):
        if kind not in ("news", "review") or type(page) is not int or page < 1:
            return {"articles": [], "hasMore": False, "error": "Invalid article page"}

        request_name = f"{kind}_page"
        base_url = POSTS_API_URL if kind == "news" else REVIEWS_API_URL
        try:
            articles, total_pages_header = await asyncio.to_thread(
                _request_json, _build_page_url(base_url, page, 3), True
            )
            if not isinstance(articles, list) or any(
                not isinstance(article, dict) for article in articles
            ):
                raise ValueError("Unexpected article page response")
            try:
                total_pages = int(total_pages_header)
            except (TypeError, ValueError):
                total_pages = -1
            has_more = bool(articles) and (
                page < total_pages if total_pages >= 0 else len(articles) == 3
            )
            self._clear_request_error(request_name)
            return {
                "articles": [_prepare_article(article) for article in articles],
                "hasMore": has_more,
                "error": None,
            }
        except Exception as err:
            if isinstance(err, HTTPError) and err.code == 400:
                try:
                    detail = json.load(err)
                except (ValueError, UnicodeError, OSError):
                    detail = None
                if isinstance(detail, dict) and detail.get("code") == "rest_post_invalid_page_number":
                    self._clear_request_error(request_name)
                    return {"articles": [], "hasMore": False, "error": None}
            self._set_request_error(request_name, err)
            return {
                "articles": [],
                "hasMore": True,
                "error": self._last_request_errors[request_name],
            }

    async def get_news_article(self, article_id: int):
        article = await self._fetch_article_json(
            "news_article", _build_item_url(POSTS_API_URL, article_id)
        )
        return article if isinstance(article, dict) else None

    async def get_review_article(self, article_id: int):
        article = await self._fetch_article_json(
            "review_article", _build_item_url(REVIEWS_API_URL, article_id)
        )
        return article if isinstance(article, dict) else None

    async def get_review_for_app(self, app_id: str):
        if not app_id:
            self._clear_request_error("review_for_app")
            return None

        reviews = await self._fetch_article_json(
            "review_for_app", SETTINGS_URL.format(appid=app_id)
        )
        if isinstance(reviews, list) and reviews:
            return reviews[0]

        return None

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
