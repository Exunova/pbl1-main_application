"""
Pytest suite for news_scraper.py
Tests OGParser, get_thumbnail, parse_feed, NEWS_FEEDS, and run().
"""

import pytest
import sys
import os
import json
from unittest.mock import MagicMock, patch

sys.path.insert(0, '/home/reiyo/Project/PBL1/pbl1-main_application/backend/src')
sys.path.insert(0, '/home/reiyo/Project/PBL1/pbl1-main_application/backend/src/scraping/google_news')

from news_scraper import OGParser, get_thumbnail, parse_feed, NEWS_FEEDS


class TestOGParser:
    def test_extracts_og_image(self):
        """OGParser extracts og:image meta tag content."""
        html = '''
        <html>
        <head>
            <meta property="og:image" content="https://example.com/image.jpg" />
            <meta name="description" content="Some description" />
        </head>
        <body></body>
        </html>
        '''
        parser = OGParser()
        parser.feed(html)
        assert parser.og_image == "https://example.com/image.jpg"

    def test_ignores_other_meta_tags(self):
        """OGParser ignores meta tags that are not og:image."""
        html = '''
        <html>
        <head>
            <meta name="twitter:image" content="https://example.com/twitter.jpg" />
            <meta property="og:title" content="My Title" />
        </head>
        <body></body>
        </html>
        '''
        parser = OGParser()
        parser.feed(html)
        assert parser.og_image is None


class TestGetThumbnail:
    def test_returns_og_image_when_available(self, monkeypatch):
        """get_thumbnail returns type=og_image when og:image is found."""
        mock_response = MagicMock()
        mock_response.text = '<html><head><meta property="og:image" content="https://news.com/og.jpg" /></head></html>'

        mock_session = MagicMock()
        mock_session.get.return_value = mock_response

        monkeypatch.setattr("news_scraper.session", mock_session)

        result = get_thumbnail("https://news.com/article")
        assert result["type"] == "og_image"
        assert result["url"] == "https://news.com/og.jpg"

    def test_fallback_to_favicon(self, monkeypatch):
        """get_thumbnail falls back to favicon when og:image is not found."""
        mock_response = MagicMock()
        mock_response.text = '<html><head></head></html>'

        mock_session = MagicMock()
        mock_session.get.return_value = mock_response

        monkeypatch.setattr("news_scraper.session", mock_session)

        result = get_thumbnail("https://news.com/article")
        assert result["type"] == "favicon"
        assert "favicon" in result["url"]
        assert "news.com" in result["url"]

    def test_handles_exception_gracefully(self, monkeypatch):
        """get_thumbnail returns type=favicon on exception (fallback)."""
        import requests
        monkeypatch.setattr("news_scraper.session.get", lambda *a, **k: (_ for _ in ()).throw(requests.RequestException("network error")))

        result = get_thumbnail("https://bad.domain.com")
        assert result["type"] == "favicon"
        assert "favicon" in result["url"]


class TestParseFeed:
    def test_returns_articles_with_required_keys(self, monkeypatch):
        """parse_feed returns a list of article dicts with all required keys."""
        mock_feed = MagicMock()
        mock_entry = MagicMock()
        mock_entry.get.side_effect = lambda k, *a: {
            "title": "Test Article",
            "link": "https://news.com/article",
            "source": MagicMock(**{"title": "Test Source"}),
            "published": "2024-01-01",
            "summary": "A summary",
        }.get(k, None)
        mock_feed.entries = [mock_entry]

        mock_session = MagicMock()
        mock_session.get.return_value = MagicMock(content=b"dummy")

        monkeypatch.setattr("news_scraper.session", mock_session)
        monkeypatch.setattr("news_scraper.feedparser.parse", lambda c: mock_feed)
        monkeypatch.setattr("news_scraper.get_thumbnail", lambda u: {"type": "none", "url": None})

        config = NEWS_FEEDS["US"]
        articles = parse_feed("US", config)

        assert len(articles) == 1
        article = articles[0]
        for key in ["title", "link", "publisher", "published", "summary", "thumbnail"]:
            assert key in article


class TestNewsFeeds:
    def test_all_4_markets_present(self):
        """NEWS_FEEDS contains US, ID, JP, GB markets."""
        assert set(NEWS_FEEDS.keys()) == {"US", "ID", "JP", "GB"}

    def test_urls_are_valid_google_rss_format(self):
        """Each NEWS_FEEDS URL is a Google News RSS URL."""
        for market, config in NEWS_FEEDS.items():
            url = config["url"]
            assert "news.google.com" in url
            assert "rss" in url
            assert "ceid" in url

    def test_feed_labels_are_non_empty(self):
        """Each NEWS_FEEDS entry has a non-empty label."""
        for market, config in NEWS_FEEDS.items():
            assert config["label"]
            assert len(config["label"]) > 0


class TestRun:
    def test_run_writes_4_news_json_files(self, monkeypatch, tmp_path):
        """run() writes 5 JSON files: 4 market files + _summary.json."""
        import news_scraper

        output_dir = str(tmp_path / "news")
        os.makedirs(output_dir, exist_ok=True)

        monkeypatch.setattr(news_scraper.session, "get", lambda *a, **k: MagicMock(content=b"", text='<html></html>'))
        monkeypatch.setattr(news_scraper.feedparser, "parse", lambda c: MagicMock(entries=[]))
        monkeypatch.setattr(news_scraper, "get_thumbnail", lambda u: {"type": "none", "url": None})

        import cache_db
        monkeypatch.setattr(cache_db, "cache_get", lambda k: None)
        monkeypatch.setattr(cache_db, "cache_set", lambda k, v: None)
        monkeypatch.setattr(cache_db, "set_scrape_status", lambda k, s: None)

        monkeypatch.setattr("time.sleep", lambda s: None)

        result = news_scraper.run(output_dir)

        json_files = [f for f in os.listdir(output_dir) if f.endswith(".json")]
        assert len(json_files) == 5  # 4 markets + _summary

        assert "scraped_at" in result
        assert "markets" in result
        assert len(result["markets"]) == 4
