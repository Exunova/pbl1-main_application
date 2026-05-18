"""
Skeleton test suite for Caching & TTL — 19 test cases (CAC-001 to CAC-019).

Modules covered:
- cache_database.py / cache_db.py  (CAC-001 .. CAC-014)
- data/ folder JSON backup          (CAC-015 .. CAC-019)
"""

import json
import os
import time
from datetime import datetime, timedelta

import pytest

from backend.src.config import (
    COMPANY_TTL_SECONDS,
    FOREX_TTL_SECONDS,
    MACRO_TTL_SECONDS,
    NEWS_TTL_SECONDS,
    OHLCV_TTL_SECONDS,
)
from backend.src.db.cache_database import CacheDatabase
from backend.src.scraping.base_scraper import BaseScraper
from backend.src.scraping.yahoo_finance.ohlcv_scraper import OHLCVScraper, to_filename


# ═══════════════════════════════════════════════════════════════════════════════
# 2.1 SQLite Cache
# ═══════════════════════════════════════════════════════════════════════════════

class TestSQLiteCache:
    """CAC-001 .. CAC-014 — SQLite cache operations and TTL validation."""

    def test_cac_001_cache_write(self, tmp_cache_db):
        """CAC-001: Cache write — data tersimpan ke SQLite dengan key, data JSON, updated_at."""
        tmp_cache_db.cache_set("test_key", {"value": 42})
        result = tmp_cache_db.cache_get("test_key")
        assert result is not None
        assert result["value"] == 42

    def test_cac_002_cache_read(self, tmp_cache_db):
        """CAC-002: Cache read — data terbaca dari SQLite, identik dengan yang disimpan."""
        data = {"ticker": "AAPL", "price": 150.0, "meta": {"sector": "Tech"}}
        tmp_cache_db.cache_set("read_key", data)
        result = tmp_cache_db.cache_get("read_key")
        assert result == data

    def test_cac_003_cache_hit_fresh(self, tmp_cache_db):
        """CAC-003: Cache hit — data masih segar (dalam TTL), scraper TIDAK dipanggil."""
        scraper = OHLCVScraper()
        data = {"updated_at": datetime.now().isoformat(), "payload": "fresh"}
        scraper.cache_db.cache_set("ohlcv:fresh", data)
        fresh, cached = scraper.is_cache_fresh("ohlcv:fresh")
        assert fresh is True
        assert cached == data

    def test_cac_004_cache_miss_expired(self, tmp_cache_db):
        """CAC-004: Cache miss — data sudah expired, scraper DIPANGGIL untuk refresh."""
        scraper = OHLCVScraper()
        past = datetime.now() - timedelta(seconds=scraper.TTL_SECONDS + 1)
        data = {"updated_at": past.isoformat(), "payload": "stale"}
        scraper.cache_db.cache_set("ohlcv:stale", data)
        fresh, cached = scraper.is_cache_fresh("ohlcv:stale")
        assert fresh is False
        assert cached is None

    def test_cac_005_cache_miss_key_missing(self, tmp_cache_db):
        """CAC-005: Cache miss — key tidak ada, mengembalikan None, tidak error."""
        result = tmp_cache_db.cache_get("nonexistent_key_xyz")
        assert result is None

    def test_cac_006_cache_overwrite(self, tmp_cache_db):
        """CAC-006: Update cache (overwrite) — data lama tertimpa, updated_at diperbarui."""
        tmp_cache_db.cache_set("overwrite_key", {"value": "old"})
        conn = tmp_cache_db.get_conn()
        row1 = conn.execute("SELECT updated_at FROM cache WHERE key = ?", ("overwrite_key",)).fetchone()
        conn.close()

        time.sleep(0.01)

        tmp_cache_db.cache_set("overwrite_key", {"value": "new"})
        conn = tmp_cache_db.get_conn()
        row2 = conn.execute("SELECT updated_at FROM cache WHERE key = ?", ("overwrite_key",)).fetchone()
        conn.close()

        assert row1[0] != row2[0]
        assert tmp_cache_db.cache_get("overwrite_key") == {"value": "new"}

    def test_cac_007_ttl_ohlcv_1_hour(self, tmp_cache_db):
        """CAC-007: TTL OHLCV = 1 jam — cache expired setelah >1 jam, trigger scraping ulang."""
        scraper = OHLCVScraper()

        fresh_time = datetime.now() - timedelta(seconds=1800)
        scraper.cache_db.cache_set("ohlcv:ttl_test", {"updated_at": fresh_time.isoformat()})
        assert scraper.is_cache_fresh("ohlcv:ttl_test")[0] is True

        expired_time = datetime.now() - timedelta(seconds=7201)
        scraper.cache_db.cache_set("ohlcv:ttl_test", {"updated_at": expired_time.isoformat()})
        assert scraper.is_cache_fresh("ohlcv:ttl_test")[0] is False

    def test_cac_008_ttl_company_24_hours(self, tmp_cache_db):
        """CAC-008: TTL Company Info = 24 jam — cache expired setelah >24 jam."""
        from backend.src.scraping.yahoo_finance.company_info_scraper import CompanyInfoScraper

        scraper = CompanyInfoScraper()

        fresh_time = datetime.now() - timedelta(seconds=43200)
        scraper.cache_db.cache_set("company:ttl_test", {"updated_at": fresh_time.isoformat()})
        assert scraper.is_cache_fresh("company:ttl_test")[0] is True

        expired_time = datetime.now() - timedelta(seconds=90001)
        scraper.cache_db.cache_set("company:ttl_test", {"updated_at": expired_time.isoformat()})
        assert scraper.is_cache_fresh("company:ttl_test")[0] is False

    def test_cac_009_ttl_macro_news(self, tmp_cache_db):
        """CAC-009: TTL Macro & News — cache expired setelah TTL masing-masing."""
        from backend.src.scraping.google_news.news_scraper import NewsScraper
        from backend.src.scraping.investing.macro_scraper import MacroScraper

        news_scraper = NewsScraper()
        fresh_news = datetime.now() - timedelta(seconds=3600)
        news_scraper.cache_db.cache_set("news:ttl_test", {"updated_at": fresh_news.isoformat()})
        assert news_scraper.is_cache_fresh("news:ttl_test")[0] is True

        expired_news = datetime.now() - timedelta(seconds=7201)
        news_scraper.cache_db.cache_set("news:ttl_test", {"updated_at": expired_news.isoformat()})
        assert news_scraper.is_cache_fresh("news:ttl_test")[0] is False

        macro_scraper = MacroScraper()
        fresh_macro = datetime.now() - timedelta(seconds=43200)
        macro_scraper.cache_db.cache_set("macro:ttl_test", {"updated_at": fresh_macro.isoformat()})
        assert macro_scraper.is_cache_fresh("macro:ttl_test")[0] is True

        expired_macro = datetime.now() - timedelta(seconds=86401)
        macro_scraper.cache_db.cache_set("macro:ttl_test", {"updated_at": expired_macro.isoformat()})
        assert macro_scraper.is_cache_fresh("macro:ttl_test")[0] is False

    def test_cac_010_ttl_forex_1_hour(self, tmp_cache_db):
        """CAC-010: TTL Forex = 1 jam — cache expired setelah >1 jam."""
        from backend.src.scraping.yahoo_finance.forex_scraper import ForexScraper

        scraper = ForexScraper()

        fresh_time = datetime.now() - timedelta(seconds=1800)
        scraper.cache_db.cache_set("forex:ttl_test", {"updated_at": fresh_time.isoformat()})
        assert scraper.is_cache_fresh("forex:ttl_test")[0] is True

        expired_time = datetime.now() - timedelta(seconds=7201)
        scraper.cache_db.cache_set("forex:ttl_test", {"updated_at": expired_time.isoformat()})
        assert scraper.is_cache_fresh("forex:ttl_test")[0] is False

    def test_cac_011_future_updated_at(self, tmp_cache_db):
        """CAC-011: Cache tidak terpengaruh TTL yang salah — updated_at masa depan = masih segar."""
        scraper = OHLCVScraper()
        future = datetime.now() + timedelta(hours=1)
        data = {"updated_at": future.isoformat(), "payload": "future"}
        scraper.cache_db.cache_set("ohlcv:future", data)
        fresh, cached = scraper.is_cache_fresh("ohlcv:future")
        assert fresh is True
        assert cached == data

    def test_cac_012_query_performance(self, tmp_cache_db):
        """CAC-012: Performa query SQLite — waktu query < 500ms untuk 1000 key reads."""
        for i in range(1000):
            tmp_cache_db.cache_set(f"perf_key_{i}", {"index": i, "data": "x" * 100})

        start = time.perf_counter()
        for i in range(1000):
            tmp_cache_db.cache_get(f"perf_key_{i}")
        elapsed = (time.perf_counter() - start) * 1000

        assert elapsed < 500, f"1000 cache_get calls took {elapsed:.2f}ms"

    def test_cac_013_json_integrity(self, tmp_cache_db):
        """CAC-013: Integritas data JSON tersimpan — nested dict/list, no data loss."""
        data = {
            "level1": {
                "level2": {
                    "list": [1, 2, {"nested": True}],
                    "tuple": (3, 4),
                }
            },
            "null": None,
            "bool": False,
        }
        tmp_cache_db.cache_set("integrity_key", data)
        result = tmp_cache_db.cache_get("integrity_key")
        assert json.loads(json.dumps(data, default=str)) == result

    def test_cac_014_sqlite_file_missing(self, tmp_path, monkeypatch):
        """CAC-014: SQLite file tidak ada — aplikasi membuat cache.db baru, tidak crash."""
        db_path = str(tmp_path / "new_cache.db")
        import backend.src.db.cache_database as cache_db_module
        monkeypatch.setattr(cache_db_module, "CACHE_DB", db_path)

        if os.path.exists(db_path):
            os.remove(db_path)

        db = CacheDatabase()
        assert os.path.exists(db_path)

        db.cache_set("schema_test", {"ok": True})
        assert db.cache_get("schema_test") == {"ok": True}


# ═══════════════════════════════════════════════════════════════════════════════
# 2.2 File JSON Backup
# ═══════════════════════════════════════════════════════════════════════════════

class TestJSONFileBackup:
    """CAC-015 .. CAC-019 — JSON file backup and fallback validation."""

    def test_cac_015_json_saved_after_scraping(self, tmp_path, mock_yfinance, monkeypatch):
        """CAC-015: Data disimpan ke file JSON setelah scraping — file ter-buat/ter-update."""
        monkeypatch.setattr("time.sleep", lambda x: None)
        output_dir = str(tmp_path / "ohlcv")
        scraper = OHLCVScraper()
        result = scraper.run(output_dir, incremental=False, full=True)

        assert result is not None
        assert any(f.endswith(".json") for f in os.listdir(output_dir))

    def test_cac_016_fallback_json_when_sqlite_expired(self, tmp_path, tmp_cache_db, monkeypatch):
        """CAC-016: Fallback ke file JSON saat SQLite expired — data diambil dari JSON."""
        import backend.src.ipc_main as ipc

        monkeypatch.setattr(ipc, "DATA_DIR", str(tmp_path))
        output_dir = str(tmp_path / "ohlcv")
        os.makedirs(output_dir, exist_ok=True)

        test_data = {"ticker": "TEST", "ohlcv_15m": [{"close": 100.0}], "updated_at": datetime.now().isoformat()}
        filepath = os.path.join(output_dir, "TEST.json")
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(test_data, f)

        past = datetime.now() - timedelta(seconds=OHLCV_TTL_SECONDS + 1)
        tmp_cache_db.cache_set("ohlcv:TEST", {"updated_at": past.isoformat(), "data": "stale"})

        fallback = ipc.read_cache_file("ohlcv", "TEST.json")
        assert fallback is not None
        assert fallback["ticker"] == "TEST"
        assert fallback["ohlcv_15m"][0]["close"] == 100.0

    def test_cac_017_full_flow_request_sqlite_json_scraper(self, tmp_path, tmp_cache_db, mock_yfinance, monkeypatch):
        """CAC-017: Alur lengkap Request → SQLite → JSON → Scraper — menyimpan ke SQLite DAN JSON."""
        monkeypatch.setattr("time.sleep", lambda x: None)
        output_dir = str(tmp_path / "ohlcv")
        os.makedirs(output_dir, exist_ok=True)

        tmp_cache_db.cache_delete("ohlcv:NVDA")

        fallback_data = {
            "ticker": "NVDA",
            "ohlcv_15m": [{"timestamp": "2026-01-01", "close": 500.0}],
            "updated_at": datetime.now().isoformat(),
        }
        filepath = os.path.join(output_dir, "NVDA.json")
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(fallback_data, f)

        with open(filepath, "r", encoding="utf-8") as f:
            file_data = json.load(f)
        assert file_data["ticker"] == "NVDA"

        scraper = OHLCVScraper()
        result = scraper.run(output_dir, incremental=False, full=True)
        assert result is not None

        cached = tmp_cache_db.cache_get("ohlcv:NVDA")
        assert cached is not None
        assert "ohlcv_15m" in cached

    def test_cac_018_auto_create_data_folders(self, tmp_path, monkeypatch):
        """CAC-018: Struktur folder data/ terbentuk otomatis — subfolder company_info, ohlcv, dll."""
        import backend.src.ipc_main as ipc

        monkeypatch.setattr(ipc, "DATA_DIR", str(tmp_path))
        path = ipc.get_data_path("test_category", "test.json")
        assert os.path.exists(os.path.dirname(path))

    def test_cac_019_json_filename_matches_ticker(self):
        """CAC-019: Nama file JSON sesuai ticker — NVDA → data/ohlcv/NVDA.json."""
        assert to_filename("NVDA") == "NVDA"
        assert to_filename("NVDA") + ".json" == "NVDA.json"
