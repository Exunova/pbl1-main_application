"""
News Scraper — Google News RSS + Publisher Logo Fetcher
Fetches RSS feeds for multiple regions and writes JSON output files.
Extracts real publisher logos from the Google News article page (which re-hosts
publisher favicons in <link sizes="..."> tags), falling back to Google's favicon service.
"""

import feedparser
import re
import requests
import json
import time
import os
from datetime import datetime
from urllib.parse import urlparse
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from backend.src.scraping.base_scraper import BaseScraper
from backend.src.config import NEWS_FEEDS

NEWS_TTL_SECONDS = 7200  # 2 hours

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}

session = requests.Session()
retry = Retry(connect=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
session.mount('https://', adapter)



def get_publisher_logo(gnews_link, publisher_domain=None, timeout=10):
    """
    Extract the actual publisher logo from the Google News article page.

    Google News RSS links (news.google.com/rss/articles/...) do NOT redirect
    to the real article — they stay on Google's domain. The og:image found on
    that page is Google's own article thumbnail, NOT the publisher logo.

    However, the Google News article page re-hosts the publisher's favicon in
    <link> tags with sizes attributes (e.g. sizes="48x48"). This function
    extracts those icons which are the real publisher logos.

    Falls back to Google's favicon service using the publisher_domain extracted
    from the RSS <source href="..."> element, which reliably points to the
    actual publisher's website.
    """
    favicon_url = (
        f"https://www.google.com/s2/favicons?domain={publisher_domain}&sz=64"
        if publisher_domain
        else None
    )
    favicon_fallback = {"type": "favicon", "url": favicon_url}

    # Build the Google News article page URL from the RSS link
    match = re.search(r"/articles/([A-Za-z0-9_-]+)", gnews_link)
    if not match:
        return favicon_fallback

    article_id = match.group(1)
    article_page_url = f"https://news.google.com/articles/{article_id}"

    try:
        resp = session.get(article_page_url, headers=HEADERS, timeout=timeout)
        text = resp.text

        # Google News re-hosts publisher icons in <link> tags with sizes attribute.
        # Example: <link href="https://lh3.googleusercontent.com/...-w48" sizes="48x48">
        # These are the REAL publisher logos, not Google's article thumbnails.
        icons = re.findall(
            r'href="(https://lh[0-9]\.googleusercontent\.com/[^"]+)"\s+sizes="([^"]+)"',
            text,
        )

        if icons:
            # Pick the largest available size
            sized = []
            for icon_url, size_str in icons:
                try:
                    w = int(size_str.split("x")[0])
                    sized.append((w, icon_url))
                except Exception:
                    pass
            if sized:
                sized.sort(reverse=True)
                best_url = sized[0][1]
                # Bump to 64 px for a crisper display
                best_url_64 = re.sub(r"=w\d+$", "=w64", best_url)
                return {"type": "publisher_icon", "url": best_url_64}
    except Exception:
        pass

    return favicon_fallback


def parse_feed(market, config):
    try:
        rss_resp = session.get(config["url"], headers=HEADERS, timeout=15)
        feed = feedparser.parse(rss_resp.content)

        articles = []
        for entry in feed.entries:
            link = entry.get("link", "")

            # Extract publisher info from RSS source element
            source = entry.get("source", {}) if hasattr(entry, "source") else {}
            publisher = source.get("title", "")
            publisher_href = source.get("href", "")
            publisher_domain = urlparse(publisher_href).netloc if publisher_href else ""

            # Fetch the real publisher logo from the Google News article page.
            # The link stays on news.google.com (no redirect), so og:image gives
            # Google's own CDN image. Instead we extract the publisher icon that
            # Google re-hosts in <link sizes="..."> tags on that same page.
            logo = (
                get_publisher_logo(link, publisher_domain=publisher_domain)
                if link
                else {"type": "none", "url": None}
            )

            # Favicon via Google's favicon service (reliable fallback / extra field)
            favicon_domain = publisher_domain or (urlparse(link).netloc if link else "")

            articles.append({
                "title": entry.get("title", ""),
                "link": link,
                "publisher": publisher,
                "published": entry.get("published", ""),
                "summary": entry.get("summary", ""),
                "thumbnail": logo,
                "favicon": f"https://www.google.com/s2/favicons?domain={favicon_domain}&sz=64" if favicon_domain else None,
            })

            # Brief pause between logo fetches to avoid rate limiting
            time.sleep(2)

        return articles
    except Exception as e:
        print(f"  [ERROR] {market}: {e}")
        return []


def save_json(data, output_dir, filename):
    path = os.path.join(output_dir, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_existing_news(output_dir, market):
    path = os.path.join(output_dir, f"{market.lower()}_news.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return None


def merge_articles(existing, new_articles, max_articles=50):
    if not existing:
        return new_articles
    if not new_articles:
        return existing.get("articles", [])

    seen_links = set()
    merged = []

    for article in existing.get("articles", []):
        link = article.get("link", "")
        if link and link not in seen_links:
            seen_links.add(link)
            merged.append(article)

    for article in new_articles:
        link = article.get("link", "")
        if link and link not in seen_links:
            seen_links.add(link)
            merged.append(article)

    return merged[:max_articles]


def _parse_published(published_str):
    """Parse published timestamp string to datetime for sorting."""
    if not published_str:
        return datetime.min
    try:
        # Try ISO format first
        return datetime.fromisoformat(published_str.replace('Z', '+00:00'))
    except Exception:
        pass
    try:
        # Try feedparser common formats
        return datetime.strptime(published_str.split('.')[0], '%Y-%m-%d %H:%M:%S')
    except Exception:
        pass
    return datetime.min


class NewsScraper(BaseScraper):
    """News scraper using Google News RSS feeds with og:image thumbnail extraction."""

    TTL_SECONDS: int = NEWS_TTL_SECONDS

    def scraper_key(self) -> str:
        return "news"

    def run(self, output_dir: str) -> dict:
        self.set_output_dir(output_dir)
        os.makedirs(output_dir, exist_ok=True)

        summary = {"scraped_at": str(datetime.now()), "markets": {}}

        for market, config in NEWS_FEEDS.items():
            print(f"  Fetching: {config['label']}")

            news_data = None
            fresh, news_data = self.is_cache_fresh(f"news:{market}")

            if fresh and news_data:
                print(f"    [CACHE] Using cached news for {market}")
            else:
                existing_news = load_existing_news(output_dir, market)
                new_articles = parse_feed(market, config)
                merged_articles = merge_articles(existing_news, new_articles)

                # FIX #2: Sort all articles descending by published timestamp (newest first)
                merged_articles.sort(key=lambda a: _parse_published(a.get("published", "")), reverse=True)

                news_data = {
                    "market": market,
                    "label": config["label"],
                    "scraped_at": str(datetime.now()),
                    "updated_at": datetime.now().isoformat(),
                    "article_count": len(merged_articles),
                    "articles": merged_articles
                }
                self._cache_db.cache_set(f"news:{market}", news_data)

            save_json(news_data, output_dir, f"{market.lower()}_news.json")

            summary["markets"][market] = {
                "label": config["label"],
                "article_count": news_data.get("article_count", 0)
            }

        save_json(summary, output_dir, "_summary.json")

        print(f"[DONE] News scraper completed at {datetime.now()}")
        return summary
