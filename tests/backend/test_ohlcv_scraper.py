"""
Pytest suite for ohlcv_scraper.py
Tests safe_float, to_filename, scrape_15m, MARKETS, and run().
"""

import pytest
import sys
import os
import json
import pandas as pd

sys.path.insert(0, '/home/reiyo/Project/PBL1/pbl1-main_application/backend/src')
sys.path.insert(0, '/home/reiyo/Project/PBL1/pbl1-main_application/backend/src/scraping/yahoo_finance')

from ohlcv_scraper import safe_float, to_filename, scrape_15m, MARKETS, OHLCVScraper


class TestSafeFloat:
    def test_rounding(self):
        """safe_float rounds to 4 decimal places."""
        result = safe_float(3.14159265)
        assert result == 3.1416

    def test_none_input_returns_none(self):
        """safe_float returns None for None input."""
        assert safe_float(None) is None

    def test_non_numeric_returns_none(self):
        """safe_float returns None for strings or other non-numeric values."""
        assert safe_float("abc") is None
        assert safe_float([1]) is None


class TestToFilename:
    def test_idx_mapping(self):
        """to_filename converts ^ prefix to IDX_."""
        assert to_filename("^GSPC") == "IDX_GSPC"
        assert to_filename("^N225") == "IDX_N225"
        assert to_filename("^JKLQ45") == "IDX_JKLQ45"
        assert to_filename("^FTSE") == "IDX_FTSE"

    def test_bbcajk(self):
        """to_filename converts BBCA.JK to BBCA_JK."""
        assert to_filename("BBCA.JK") == "BBCA_JK"

    def test_brkb(self):
        """to_filename converts BRK-B to BRK_B."""
        assert to_filename("BRK-B") == "BRK_B"

    def test_aznl(self):
        """to_filename converts AZN.L to AZN_L."""
        assert to_filename("AZN.L") == "AZN_L"


class TestMarkets:
    def test_4_markets_10_stocks_each(self):
        """MARKETS has exactly 4 markets: US, ID, JP, GB, each with 10 stocks."""
        assert set(MARKETS.keys()) == {"US", "ID", "JP", "GB"}
        for market, config in MARKETS.items():
            assert len(config["tickers"]) == 10, f"{market} should have 10 stocks"

    def test_index_present_for_each_market(self):
        """Each market has an 'index' key with a valid ticker."""
        for market, config in MARKETS.items():
            assert "index" in config
            assert config["index"].startswith("^") or "IDX_" in config["index"]


class TestScrape15m:
    def test_returns_list_of_ohlcv_dicts(self, monkeypatch):
        """scrape_15m returns a list of dicts with ohlcv keys."""
        df = pd.DataFrame({
            "Open": [100.0, 101.0],
            "High": [102.0, 103.0],
            "Low": [99.0, 100.5],
            "Close": [101.5, 102.5],
            "Volume": [1000000, 1100000],
        }, index=pd.to_datetime(["2024-01-01 09:00", "2024-01-01 09:15"]))

        class MockTicker:
            def history(self, period, interval):
                return df

        import yfinance
        monkeypatch.setattr(yfinance, "Ticker", lambda s: MockTicker())

        result = scrape_15m("AAPL")

        assert isinstance(result, list)
        assert len(result) == 2
        for candle in result:
            for key in ["timestamp", "open", "high", "low", "close", "volume"]:
                assert key in candle

    def test_empty_df_returns_empty_list(self, monkeypatch):
        """scrape_15m returns [] when yfinance returns an empty DataFrame."""
        class EmptyDF:
            empty = True

        class MockTicker:
            def history(self, period, interval):
                return EmptyDF()

        import yfinance
        monkeypatch.setattr(yfinance, "Ticker", lambda s: MockTicker())

        result = scrape_15m("NOVALIDTICKER")
        assert result == []


class TestRun:
    def test_run_writes_all_44_stock_plus_4_index_files(self, monkeypatch, tmp_path):
        """run() writes 45 JSON files: 40 stock files + 4 index files + 1 _summary.json."""
        output_dir = str(tmp_path / "ohlcv")
        os.makedirs(output_dir, exist_ok=True)

        # Mock yfinance to return minimal valid data
        df = pd.DataFrame({
            "Open": [100.0],
            "High": [101.0],
            "Low": [99.0],
            "Close": [100.5],
            "Volume": [1000000],
        }, index=pd.to_datetime(["2024-01-01 09:00"]))

        class MockTicker:
            def history(self, period, interval):
                return df

        import yfinance
        monkeypatch.setattr(yfinance, "Ticker", lambda s: MockTicker())

        import cache_db
        monkeypatch.setattr(cache_db, "cache_get", lambda k: None)
        monkeypatch.setattr(cache_db, "cache_set", lambda k, v: None)
        monkeypatch.setattr(cache_db, "set_scrape_status", lambda k, s: None)

        # Speed up tests
        monkeypatch.setattr("time.sleep", lambda s: None)

        result = OHLCVScraper().run(output_dir)

        json_files = [f for f in os.listdir(output_dir) if f.endswith(".json")]
        # 4 markets * (1 index + 10 stocks) + 1 _summary = 45
        assert len(json_files) == 45

        assert "scraped_at" in result
        assert "markets" in result
        assert len(result["markets"]) == 4

        # Each market has an index and 10 stocks
        for market in ["US", "ID", "JP", "GB"]:
            mdata = result["markets"][market]
            assert "index" in mdata
            assert len(mdata["stocks"]) == 10
