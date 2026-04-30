"""
Pytest suite for forex_scraper.py
Tests ForexScraper class methods, safe_float, and FOREX_PAIRS.
"""

import pytest
import sys
import os
import json

sys.path.insert(0, '/home/reiyo/Project/PBL1/pbl1-main_application/backend/src')

from backend.src.scraping.yahoo_finance.forex_scraper import ForexScraper, safe_float, FOREX_PAIRS


class TestSafeFloat:
    def test_valid_float_rounding(self):
        """safe_float rounds to 6 decimal places by default."""
        result = safe_float(1.23456789)
        assert result == 1.234568

    def test_valid_float_custom_decimals(self):
        """safe_float accepts custom decimal places."""
        result = safe_float(1.23456789, decimals=3)
        assert result == 1.235

    def test_invalid_returns_none(self):
        """safe_float returns None for non-numeric values."""
        assert safe_float("hello") is None
        assert safe_float(None) is None
        assert safe_float([1, 2, 3]) is None


class TestScrapePair:
    def test_scrape_pair_success_returns_valid_structure(self, monkeypatch):
        """_scrape_pair returns a dict with all required keys on success."""
        class MockTicker:
            info = {
                "currentPrice": 15000.0,
                "regularMarketPrice": 14950.0,
                "previousClose": 14900.0,
                "regularMarketChangePercent": 0.5,
            }

            def history(self, period, interval):
                class MockDF:
                    @property
                    def empty(self):
                        return False

                    def iterrows(self):
                        return []
                return MockDF()

        import yfinance
        monkeypatch.setattr(yfinance, "Ticker", lambda s: MockTicker())

        scraper = ForexScraper()
        config = FOREX_PAIRS["USD_IDR"]
        result = scraper._scrape_pair("USD_IDR", config)

        assert result["pair"] == "USD_IDR"
        assert "current_rate" in result
        assert "change_pct" in result
        assert "history_30d" in result
        assert "scraped_at" in result

    def test_scrape_pair_error_returns_error_field(self, monkeypatch):
        """_scrape_pair returns an error field when yfinance raises."""
        import yfinance
        monkeypatch.setattr(yfinance, "Ticker", lambda s: (_ for _ in ()).throw(RuntimeError("network error")))

        scraper = ForexScraper()
        config = FOREX_PAIRS["JPY_USD"]
        result = scraper._scrape_pair("JPY_USD", config)

        assert result["pair"] == "JPY_USD"
        assert "error" in result
        assert result["current_rate"] is None


class TestForexPairs:
    def test_forrex_pairs_all_6_present(self):
        """FOREX_PAIRS contains all 6 currency pairs."""
        assert len(FOREX_PAIRS) == 6

        expected_pairs = {
            "IDR_USD", "JPY_USD", "GBP_USD",
            "USD_IDR", "USD_JPY", "USD_GBP",
        }
        assert set(FOREX_PAIRS.keys()) == expected_pairs

    def test_each_pair_has_required_fields(self):
        """Each FOREX_PAIRS entry has ticker, base, quote, and label."""
        for key, cfg in FOREX_PAIRS.items():
            assert "ticker" in cfg
            assert "base" in cfg
            assert "quote" in cfg
            assert "label" in cfg
            assert cfg["ticker"].endswith("=X")


class TestRun:
    def test_run_writes_6_pair_json_files(self, monkeypatch, tmp_path):
        """run() writes 7 JSON files: 6 pair files + _summary.json."""
        import yfinance
        monkeypatch.setattr(yfinance, "Ticker", lambda s: type("", (), {
            "info": {"currentPrice": 100.0, "previousClose": 99.0, "regularMarketChangePercent": 1.0},
            "history": lambda p, i: type("", (), {"empty": True, "iterrows": lambda s: []})()
        })())

        import cache_db
        monkeypatch.setattr(cache_db, "cache_get", lambda k: None)
        monkeypatch.setattr(cache_db, "cache_set", lambda k, v: None)
        monkeypatch.setattr(cache_db, "set_scrape_status", lambda k, s: None)

        scraper = ForexScraper()
        output_dir = str(tmp_path / "forex")

        result = scraper.run(output_dir)

        json_files = [f for f in os.listdir(output_dir) if f.endswith(".json")]
        assert len(json_files) == 7  # 6 pairs + _summary

        assert "scraped_at" in result
        assert "pairs" in result
        assert len(result["pairs"]) == 6