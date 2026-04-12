"""
MAPRO Scraper — Berita (Google News RSS + Thumbnail)
Jalankan: python scraper.py
Output  : ../data/news/
"""

import feedparser
import requests
import json
import os
import time
from datetime import datetime
from urllib.parse import urlparse
from html.parser import HTMLParser
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

NEWS_FEEDS = {
    "US": {
        "label": "S&P 500",
        "url":   "https://news.google.com/rss/search?q=%22S%26P+500%22+OR+%22SPX%22+when:1d&hl=en-US&gl=US&ceid=US:en"
    },
    "ID": {
        "label": "LQ45 / IHSG",
        "url":   "https://news.google.com/rss/search?q=%22LQ45%22+OR+%22IHSG%22+when:1d&hl=id&gl=ID&ceid=ID:id"
    },
    "JP": {
        "label": "Nikkei 225",
        "url":   "https://news.google.com/rss/search?q=%22Nikkei+225%22+OR+%22Nikkei+index%22+when:1d&hl=en&gl=JP&ceid=JP:en"
    },
    "GB": {
        "label": "FTSE 100",
        "url":   "https://news.google.com/rss/search?q=%22FTSE+100%22+when:1d&hl=en-GB&gl=GB&ceid=GB:en"
    }
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}

# Konfigurasi session bawaan dengan fitur Retry (mencegah failed jika koneksi time-out/putus sementara)
session = requests.Session()
retry = Retry(connect=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
session.mount('https://', adapter)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../data/news")
os.makedirs(OUTPUT_DIR, exist_ok=True)


class OGParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.og_image = None

    def handle_starttag(self, tag, attrs):
        if tag == "meta":
            d = dict(attrs)
            if d.get("property") == "og:image":
                self.og_image = d.get("content")


def get_thumbnail(url, timeout=10):  # Timeout dinaikkan menjadi 10 detik
    try:
        domain  = urlparse(url).netloc
        favicon = f"https://www.google.com/s2/favicons?domain={domain}&sz=64"
        try:
            # Menggunakan session yang mendukung retry otomatis
            resp   = session.get(url, headers=HEADERS, timeout=timeout)
            parser = OGParser()
            parser.feed(resp.text)
            if parser.og_image:
                return {"type": "og_image", "url": parser.og_image}
        except Exception as e:
            # Terdapat masalah saat koneksi/parse og_image untuk thumbnail
            pass
        return {"type": "favicon", "url": favicon}
    except Exception:
        return {"type": "none", "url": None}


def parse_feed(market, config):
    print(f"  Fetching: {config['label']}")
    try:
        # Panggil Google News RSS menggunakan requests session + header, agar tidak dicekal (403/429)
        rss_resp = session.get(config["url"], headers=HEADERS, timeout=15)
        feed     = feedparser.parse(rss_resp.content)
        
        articles = []
        for entry in feed.entries:
            link   = entry.get("link", "")
            domain = urlparse(link).netloc if link else ""

            print(f"    Thumbnail: {link[:60]}...")
            thumb = get_thumbnail(link) if link else {"type": "none", "url": None}

            articles.append({
                "title":     entry.get("title", ""),
                "link":      link,
                "publisher": entry.get("source", {}).get("title", "") if hasattr(entry, "source") else "",
                "published": entry.get("published", ""),
                "summary":   entry.get("summary", ""),
                "thumbnail": thumb,
                "favicon":   f"https://www.google.com/s2/favicons?domain={domain}&sz=64" if domain else None
            })
            
            # Waktu tunda (delay) 1 detik setiap proses 1 berita agar tidak di-banned server portal berita
            time.sleep(1)

        print(f"  [OK] {len(articles)} articles")
        return articles
    except Exception as e:
        print(f"  [ERROR] {market}: {e}")
        return []


def save_json(data, filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved: {filename}")


def main():
    print("=" * 50)
    print("MAPRO Scraper — News")
    print(f"Started: {datetime.now()}")
    print("=" * 50)

    summary = {"scraped_at": str(datetime.now()), "markets": {}}

    for market, config in NEWS_FEEDS.items():
        print(f"\n[Market: {market}]")
        articles = parse_feed(market, config)

        save_json({
            "market":        market,
            "label":         config["label"],
            "scraped_at":    str(datetime.now()),
            "article_count": len(articles),
            "articles":      articles
        }, f"{market.lower()}_news.json")

        summary["markets"][market] = {
            "label":         config["label"],
            "article_count": len(articles)
        }

    save_json(summary, "_summary.json")
    print(f"\n[DONE] {datetime.now()}")


if __name__ == "__main__":
    main()
