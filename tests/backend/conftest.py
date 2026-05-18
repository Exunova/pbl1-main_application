"""
pytest configuration and shared fixtures for MAPRO backend tests.
"""
import os
import sys
import tempfile
import pytest
import threading
from pathlib import Path


def pytest_configure(config):
    config.addinivalue_line(
        "markers", "network: marks tests that require real network access"
    )

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_SRC = ROOT_DIR / 'backend' / 'src'
SCRAPERS_DIR = BACKEND_SRC / 'scraping'
YAHOO_SCRAPERS_DIR = BACKEND_SRC / 'scraping' / 'yahoo_finance'

# Ensure backend modules are on the import path
for path in (BACKEND_SRC, SCRAPERS_DIR, YAHOO_SCRAPERS_DIR):
    sys.path.insert(0, str(path))

# Point cache DB to a temp file for each test session
ORIGINAL_APP_DIR = None
ORIGINAL_CACHE_DB = None


@pytest.fixture
def tmp_cache_db(tmp_path, monkeypatch):
    """Redirect CacheDatabase to use a temp SQLite file for isolation."""
    from backend.src.db.cache_database import CacheDatabase
    tmp_db = str(tmp_path / "cache.db")
    monkeypatch.setenv('Cache_DB', tmp_db)
    cache = CacheDatabase()
    yield cache


@pytest.fixture
def tmp_output_dir(tmp_path):
    """Temp directory for scraper output."""
    d = tmp_path / "data"
    d.mkdir(parents=True, exist_ok=True)
    return str(d)


@pytest.fixture
def mock_yfinance(monkeypatch):
    """Mock yfinance Ticker/info/history for scraper tests."""
    from unittest.mock import MagicMock

    class FakeInfo(dict):
        def __getitem__(self, key):
            return super().__getitem__(key)

    info_data = {
        "longName": "Test Corp",
        "shortName": "TEST",
        "symbol": "TEST",
        "quoteType": "EQUITY",
        "exchange": "NASDAQ",
        "market": "US",
        "currency": "USD",
        "sector": "Technology",
        "industry": "Semiconductors",
        "currentPrice": 150.0,
        "previousClose": 148.0,
        "open": 149.0,
        "dayHigh": 152.0,
        "dayLow": 147.0,
        "volume": 1000000,
        "marketCap": 1500000000000,
        "trailingPE": 30.0,
        "fiftyTwoWeekHigh": 160.0,
        "fiftyTwoWeekLow": 120.0,
        "regularMarketChangePercent": 1.35,
        "recommendationKey": "buy",
        "targetMeanPrice": 165.0,
        "dividendYield": 0.005,
        "profitMargins": 0.25,
        "returnOnEquity": 0.30,
    }

    fake_ticker = MagicMock()
    fake_ticker.info = FakeInfo(info_data)
    fake_ticker.info.get = lambda k, v=None: info_data.get(k, v)

    fake_df = MagicMock()
    fake_df.empty = False
    fake_df.iterrows = lambda: iter([
        ("2026-04-10 09:30:00", {"Open": 149.0, "High": 152.0, "Low": 147.0, "Close": 150.0, "Volume": 1000000}),
        ("2026-04-10 09:45:00", {"Open": 150.0, "High": 151.0, "Low": 149.0, "Close": 150.5, "Volume": 800000}),
    ])

    fake_ticker.history = MagicMock(return_value=fake_df)
    fake_ticker.income_stmt = fake_df
    fake_ticker.balance_sheet = fake_df
    fake_ticker.cashflow = fake_df

    import yfinance as real_yf
    monkeypatch.setattr(real_yf, 'Ticker', lambda t: fake_ticker)
    monkeypatch.setattr(real_yf, 'download', lambda *a, **kw: fake_df)
    yield fake_ticker


@pytest.fixture
def mock_feed_and_requests(monkeypatch):
    """Mock feedparser.parse and requests.Session.get for news scraper."""
    from unittest.mock import MagicMock

    class FakeEntry:
        link = "https://example.com/article"
        title = "Test Article"
        source = MagicMock(title="Example News")
        published = "2026-04-12"
        summary = "Summary text"

    class FakeFeed:
        entries = [FakeEntry(), FakeEntry()]

    class FakeResp:
        content = b"<rss>test</rss>"

    fake_session = MagicMock()
    fake_session.get = MagicMock(return_value=FakeResp())

    monkeypatch.setattr('backend.src.scraping.google_news.news_scraper.session', fake_session)
    monkeypatch.setattr('backend.src.scraping.google_news.news_scraper.feedparser.parse', lambda f: FakeFeed())
    yield fake_session


@pytest.fixture
def clean_cache():
    """Callable fixture to clear all scraper cache entries between tests."""
    from backend.src.db.cache_database import CacheDatabase
    def _clean():
        db = CacheDatabase()
        conn = db.get_conn()
        conn.execute("""
            DELETE FROM cache WHERE
            key LIKE 'forex:%' OR key LIKE 'news:%' OR
            key LIKE 'ohlcv:%' OR key LIKE 'macro:%' OR
            key LIKE 'company:%'
        """)
        conn.commit()
        conn.close()
    return _clean


@pytest.fixture
def mock_playwright_page(monkeypatch):
    """Mock Playwright page for macro scraper tests."""
    from unittest.mock import MagicMock

    fake_page = MagicMock()
    fake_page.goto = MagicMock(return_value=None)
    fake_page.wait_for_selector = MagicMock(return_value=None)
    fake_page.query_selector_all = MagicMock(return_value=[])
    fake_page.query_selector = MagicMock(return_value=None)
    fake_page.evaluate = MagicMock(return_value=[])
    fake_page.content = MagicMock(return_value="<html><body></body></html>")
    fake_page.close = MagicMock(return_value=None)

    fake_browser = MagicMock()
    fake_browser.new_page = MagicMock(return_value=fake_page)
    fake_browser.close = MagicMock(return_value=None)

    fake_playwright = MagicMock()
    fake_playwright.chromium.launch = MagicMock(return_value=fake_browser)
    fake_playwright.stop = MagicMock(return_value=None)

    monkeypatch.setattr('backend.src.scraping.investing.macro_scraper.sync_playwright', lambda: fake_playwright)
    yield fake_page


@pytest.fixture
def ipc_bridge_mock(monkeypatch):
    """Mock IPC bridge for testing command handlers without subprocess."""
    from unittest.mock import MagicMock

    bridge = MagicMock()
    bridge.send = MagicMock(return_value={"id": "test", "ok": True, "data": {}})
    bridge.receive = MagicMock(return_value={"id": "test", "cmd": "test", "params": {}})
    monkeypatch.setattr('ipc_main.handle_command', bridge.send)
    yield bridge


@pytest.fixture
def ipc_process(tmp_path, monkeypatch):
    """Spawn ipc_main.py as a subprocess for command testing with isolated temp cache."""
    import subprocess
    import json
    import time
    import shutil

    # Copy the real cache.db to a temp location so we don't pollute real data
    real_db = ROOT_DIR / 'backend' / 'cache.db'
    tmp_db = str(tmp_path / "cache.db")
    if os.path.exists(real_db):
        shutil.copy(real_db, tmp_db)

    # Set environment so subprocess uses temp cache
    env = os.environ.copy()
    env['PYTHONPATH'] = os.pathsep.join(str(p) for p in (BACKEND_SRC, SCRAPERS_DIR, YAHOO_SCRAPERS_DIR, ROOT_DIR))
    env['CACHE_DB'] = tmp_db

    proc = subprocess.Popen(
        [sys.executable, str(BACKEND_SRC / 'ipc_main.py')],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
    )

    time.sleep(0.5)

    def send(cmd, params=None):
        msg = json.dumps({"id": "test", "cmd": cmd, "params": params or {}}) + "\n"
        proc.stdin.write(msg.encode())
        proc.stdin.flush()
        line = proc.stdout.readline()
        if not line:
            raise RuntimeError(f"No response for {cmd}")
        return json.loads(line)

    yield send

    try:
        proc.stdin.close()
        proc.wait(timeout=2)
    except Exception:
        proc.kill()
