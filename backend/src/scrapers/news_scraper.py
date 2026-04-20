"""
News Scraper — Google News RSS + Thumbnail Fetcher
Fetches RSS feeds for multiple regions and writes JSON output files.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from cache_db import cache_get, cache_set, set_scrape_status

import feedparser
import requests
import json
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse
from html.parser import HTMLParser
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

NEWS_FEEDS = {
    "US": {"label": "S&P 500 / Wall Street", "url": "https://news.google.com/rss/search?q=%22S%26P+500%22+OR+%22SPX%22+when:1d&hl=en-US&gl=US&ceid=US:en"},
    "ID": {"label": "LQ45 / IHSG", "url": "https://news.google.com/rss/search?q=%22LQ45%22+OR+%22IHSG%22+when:1d&hl=id&gl=ID&ceid=ID:id"},
    "JP": {"label": "Nikkei 225", "url": "https://news.google.com/rss/search?q=%22Nikkei+225%22+OR+%22Nikkei+index%22+when:1d&hl=en&gl=JP&ceid=JP:en"},
    "GB": {"label": "FTSE 100", "url": "https://news.google.com/rss/search?q=%22FTSE+100%22+when:1d&hl=en-GB&gl=GB&ceid=GB:en"},
}

NEWS_TTL_SECONDS = 7200  # 2 hours

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}

session = requests.Session()
retry = Retry(connect=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
session.mount('https://', adapter)


class OGParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.og_image = None

    def handle_starttag(self, tag, attrs):
        if tag == "meta":
            d = dict(attrs)
            if d.get("property") == "og:image":
                self.og_image = d.get("content")


def get_thumbnail(url, timeout=10):
    try:
        domain = urlparse(url).netloc
        favicon = f"https://www.google.com/s2/favicons?domain={domain}&sz=64"
        try:
            resp = session.get(url, headers=HEADERS, timeout=timeout)
            parser = OGParser()
            parser.feed(resp.text)
            if parser.og_image:
                return {"type": "og_image", "url": parser.og_image}
        except Exception:
            pass
        return {"type": "favicon", "url": favicon}
    except Exception:
        return {"type": "none", "url": None}


def parse_feed(market, config):
    try:
        rss_resp = session.get(config["url"], headers=HEADERS, timeout=15)
        feed = feedparser.parse(rss_resp.content)

        articles = []
        for entry in feed.entries:
            link = entry.get("link", "")
            domain = urlparse(link).netloc if link else ""

            thumb = get_thumbnail(link) if link else {"type": "none", "url": None}

            articles.append({
                "title": entry.get("title", ""),
                "link": link,
                "publisher": entry.get("source", {}).get("title", "") if hasattr(entry, "source") else "",
                "published": entry.get("published", ""),
                "summary": entry.get("summary", ""),
                "thumbnail": thumb,
                "favicon": f"https://www.google.com/s2/favicons?domain={domain}&sz=64" if domain else None
            })

            # Sleep 1 second between thumbnail fetches to avoid rate limiting
            time.sleep(3)

        return articles
    except Exception as e:
        print(f"  [ERROR] {market}: {e}")
        return []


def is_cache_fresh(key, ttl_seconds):
    """Check if cache entry exists and is within TTL."""
    data = cache_get(key)
    if data is None:
        return False, None
    updated_at_str = data.get("updated_at") or data.get("scraped_at")
    if not updated_at_str:
        return False, None
    try:
        updated_at = datetime.fromisoformat(updated_at_str)
        age = datetime.now() - updated_at
        if age.total_seconds() < ttl_seconds:
            return True, data
    except Exception:
        pass
    return False, None


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


def run(output_dir):
    os.makedirs(output_dir, exist_ok=True)

    summary = {"scraped_at": str(datetime.now()), "markets": {}}

    for market, config in NEWS_FEEDS.items():
        print(f"  Fetching: {config['label']}")

        news_data = None
        fresh, news_data = is_cache_fresh(f"news:{market}", NEWS_TTL_SECONDS)

        if fresh and news_data:
            print(f"    [CACHE] Using cached news for {market}")
        else:
            existing_news = load_existing_news(output_dir, market)
            new_articles = parse_feed(market, config)
            merged_articles = merge_articles(existing_news, new_articles)
            news_data = {
                "market": market,
                "label": config["label"],
                "scraped_at": str(datetime.now()),
                "updated_at": datetime.now().isoformat(),
                "article_count": len(merged_articles),
                "articles": merged_articles
            }
            cache_set(f"news:{market}", news_data)

        save_json(news_data, output_dir, f"{market.lower()}_news.json")

        summary["markets"][market] = {
            "label": config["label"],
            "article_count": news_data.get("article_count", 0)
        }

    save_json(summary, output_dir, "_summary.json")

    print(f"[DONE] News scraper completed at {datetime.now()}")
    return summary


if __name__ == "__main__":
    DATA_DIR = "/home/reiyo/Project/PBL1/pbl1-main_application/data"
    run(DATA_DIR)