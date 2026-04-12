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
    "US": {"label": "S&P 500 / Wall Street", "url": "https://news.google.com/rss/search?q=%22S%26P+500%22+OR+%22SPX%22+when:1d&hl=en-US&gl=US&ceid=US:en"},
    "ID": {"label": "LQ45 / IHSG", "url": "https://news.google.com/rss/search?q=%22LQ45%22+OR+%22IHSG%22+when:1d&hl=id&gl=ID&ceid=ID:id"},
    "JP": {"label": "Nikkei 225", "url": "https://news.google.com/rss/search?q=%22Nikkei+225%22+OR+%22Nikkei+index%22+when:1d&hl=en&gl=JP&ceid=JP:en"},
    "GB": {"label": "FTSE 100", "url": "https://news.google.com/rss/search?q=%22FTSE+100%22+when:1d&hl=en-GB&gl=GB&ceid=GB:en"},
}

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"}

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
        except:
            pass
        return {"type": "favicon", "url": favicon}
    except:
        return {"type": "none", "url": None}

def run(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    summary = {"scraped_at": str(datetime.now()), "markets": {}}

    for market, config in NEWS_FEEDS.items():
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
                    "thumbnail": thumb,
                    "favicon": f"https://www.google.com/s2/favicons?domain={domain}&sz=64" if domain else None
                })
                time.sleep(1)

            with open(os.path.join(output_dir, f"{market.lower()}_news.json"), "w", encoding="utf-8") as f:
                json.dump({"market": market, "label": config["label"], "scraped_at": str(datetime.now()), "article_count": len(articles), "articles": articles}, f, indent=2, ensure_ascii=False)
            summary["markets"][market] = {"label": config["label"], "article_count": len(articles)}
        except Exception as e:
            summary["markets"][market] = {"label": config["label"], "error": str(e)}

    with open(os.path.join(output_dir, "_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    return summary
