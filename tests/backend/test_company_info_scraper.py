"""
Pytest suite for company_info_scraper.py
Tests safe_val, extract_info, scrape_financials, to_filename, and run().
"""

import pytest
import sys
import os
import json
import tempfile
import shutil

# Ensure backend/src is in path
sys.path.insert(0, '/home/reiyo/Project/PBL1/pbl1-main_application/backend/src')
sys.path.insert(0, '/home/reiyo/Project/PBL1/pbl1-main_application/backend/src/scraping/yahoo_finance')

from company_info_scraper import safe_val, extract_info, scrape_financials, to_filename


# ── safe_val tests ────────────────────────────────────────────────────────────

def test_safe_val_None_returns_None():
    """safe_val(None) returns None."""
    assert safe_val(None) is None


def test_safe_val_NaN_returns_None():
    """safe_val(float('nan')) returns None."""
    import math
    result = safe_val(float('nan'))
    assert result is None


def test_safe_val_valid_float_passthrough():
    """safe_val returns a float value unchanged (no rounding)."""
    result = safe_val(3.14159265359)
    assert isinstance(result, float)
    assert result == 3.14159265359  # no rounding applied


def test_safe_val_string_passthrough():
    """safe_val returns a string unchanged."""
    result = safe_val("hello world")
    assert result == "hello world"


# ── extract_info tests ────────────────────────────────────────────────────────

def test_extract_info_groups_all_6_groups():
    """extract_info returns a dict with all 6 groups."""
    raw = {
        "longName": "Apple Inc.",
        "shortName": "Apple",
        "symbol": "AAPL",
        "currentPrice": 150.0,
        "marketCap": 2500000000000,
        "profitMargins": 0.25,
        "dividendRate": 0.96,
        "recommendationKey": "buy",
        "sharesOutstanding": 15000000000,
    }
    result = extract_info(raw)

    assert isinstance(result, dict)
    expected_groups = {
        "identity", "price", "valuation",
        "profitability", "dividend", "analyst", "ownership"
    }
    for group in expected_groups:
        assert group in result, f"Missing group: {group}"


def test_extract_info_missing_fields_become_None():
    """extract_info sets missing fields to None without raising."""
    raw = {"symbol": "AAPL"}  # only symbol provided
    result = extract_info(raw)

    assert result["identity"]["symbol"] == "AAPL"
    assert result["identity"]["longName"] is None
    assert result["price"]["currentPrice"] is None


# ── scrape_financials tests ────────────────────────────────────────────────────

def test_scrape_financials_returns_all_3_dicts(monkeypatch):
    """scrape_financials returns income_statement, balance_sheet, cash_flow keys."""
    import pandas as pd

    class MockTicker:
        income_stmt = pd.DataFrame({"A": [1, 2]})
        balance_sheet = pd.DataFrame({"B": [3, 4]})
        cashflow = pd.DataFrame({"C": [5, 6]})

    result = scrape_financials(MockTicker())

    assert "income_statement" in result
    assert "balance_sheet" in result
    assert "cash_flow" in result


def test_scrape_financials_empty_df_returns_empty_dicts(monkeypatch):
    """scrape_financials returns {} for each key when DataFrames are empty."""
    import pandas as pd

    class EmptyTicker:
        income_stmt = pd.DataFrame()
        balance_sheet = pd.DataFrame()
        cashflow = pd.DataFrame()

    result = scrape_financials(EmptyTicker())

    assert result["income_statement"] == {}
    assert result["balance_sheet"] == {}
    assert result["cash_flow"] == {}


# ── to_filename tests ──────────────────────────────────────────────────────────

def test_to_filename_bbcajk():
    """to_filename converts BBCA.JK to BBCA_JK."""
    assert to_filename("BBCA.JK") == "BBCA_JK"


def test_to_filename_brkb():
    """to_filename converts BRK-B to BRK_B."""
    assert to_filename("BRK-B") == "BRK_B"


# ── run integration tests ──────────────────────────────────────────────────────

def test_run_creates_40_json_files(monkeypatch, tmp_path):
    """run() writes 41 JSON files: 40 company files + 1 _summary.json."""
    import company_info_scraper
    from datetime import datetime

    output_dir = str(tmp_path / "company_info")
    os.makedirs(output_dir, exist_ok=True)

    # Mock yfinance.Ticker
    class MockInfo(dict):
        pass

    class MockTicker:
        info = {
            "longName": "Test Corp",
            "shortName": "Test",
            "symbol": "TEST",
            "quoteType": "EQUITY",
            "exchange": "TESTEX",
            "market": "TEST_MKT",
            "currency": "USD",
            "sector": "Technology",
            "industry": "Software",
            "fullTimeEmployees": 1000,
            "website": "https://test.com",
            "longBusinessSummary": "A test company.",
            "companyOfficers": [],
        }

        @property
        def income_stmt(self):
            import pandas as pd
            return pd.DataFrame({"A": [1, 2]})

        @property
        def balance_sheet(self):
            import pandas as pd
            return pd.DataFrame({"B": [3, 4]})

        @property
        def cashflow(self):
            import pandas as pd
            return pd.DataFrame({"C": [5, 6]})

    ticker_instances = {}

    def mock_ticker(sym):
        ticker_instances[sym] = MockTicker()
        return ticker_instances[sym]

    import yfinance
    monkeypatch.setattr(yfinance, "Ticker", mock_ticker)

    # Also mock cache_db functions
    import cache_db
    monkeypatch.setattr(cache_db, "cache_get", lambda k: None)
    monkeypatch.setattr(cache_db, "cache_set", lambda k, v: None)
    monkeypatch.setattr(cache_db, "set_scrape_status", lambda k, s: None)

    # Patch time.sleep to speed up tests
    monkeypatch.setattr("time.sleep", lambda s: None)

    result = company_info_scraper.run(output_dir)

    # Should have _summary.json
    assert os.path.exists(os.path.join(output_dir, "_summary.json"))

    # Count company JSON files (MARKETS has 40 tickers: 10+10+10+10)
    json_files = [f for f in os.listdir(output_dir) if f.endswith(".json")]
    assert len(json_files) == 41  # 40 tickers + _summary

    assert "scraped_at" in result
    assert len(result["tickers"]) == 40


def test_run_summary_has_correct_structure(monkeypatch, tmp_path):
    """run() summary contains scraped_at and tickers dict."""
    import company_info_scraper

    output_dir = str(tmp_path / "company_info2")
    os.makedirs(output_dir, exist_ok=True)

    class MockTicker:
        info = {
            "longName": "Test Corp", "shortName": "Test", "symbol": "TEST",
            "quoteType": "EQUITY", "exchange": "TESTEX", "market": "TEST_MKT",
            "currency": "USD", "sector": "Tech", "industry": "Software",
            "fullTimeEmployees": 100, "website": "", "longBusinessSummary": "",
            "companyOfficers": [],
        }

        @property
        def income_stmt(self):
            import pandas as pd
            return pd.DataFrame()

        @property
        def balance_sheet(self):
            import pandas as pd
            return pd.DataFrame()

        @property
        def cashflow(self):
            import pandas as pd
            return pd.DataFrame()

    import yfinance
    monkeypatch.setattr(yfinance, "Ticker", lambda s: MockTicker())

    import cache_db
    monkeypatch.setattr(cache_db, "cache_get", lambda k: None)
    monkeypatch.setattr(cache_db, "cache_set", lambda k, v: None)
    monkeypatch.setattr(cache_db, "set_scrape_status", lambda k, s: None)
    monkeypatch.setattr("time.sleep", lambda s: None)

    result = company_info_scraper.run(output_dir)

    assert "scraped_at" in result
    assert "tickers" in result
    assert isinstance(result["tickers"], dict)
