"""
Pytest suite for cache_db.py
Tests all public functions using an isolated temporary database.
"""

import pytest
import sys
import os
import tempfile
import sqlite3
import json
import threading
import shutil

# Path to backend source
BACKEND_SRC = '/home/reiyo/Project/PBL1/pbl1-main_application/backend/src'

# Temp DB path for this test module
TEST_DB_FILE = None


@pytest.fixture(autouse=True)
def fresh_cache_db(tmp_path):
    """Replace CACHE_DB with a temp file for each test."""
    import cache_db

    old_cache_db = cache_db.CACHE_DB
    tmp_db = str(tmp_path / "test_cache.db")
    cache_db.CACHE_DB = tmp_db

    # Force re-init of the DB
    cache_db.init_db()

    yield tmp_path, tmp_db

    # Restore
    cache_db.CACHE_DB = old_cache_db


@pytest.fixture
def conn(tmp_path):
    """Direct sqlite3 connection to the temp DB (WAL disabled for test simplicity)."""
    import cache_db
    db_path = cache_db.CACHE_DB
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


# ── init_db tests ──────────────────────────────────────────────────────────────

def test_init_db_creates_tables(tmp_path):
    """init_db creates the cache, positions, and scrape_status tables."""
    import cache_db

    # Fresh temp DB path
    tmp_db = str(tmp_path / "new.db")
    cache_db.CACHE_DB = tmp_db
    cache_db.init_db()

    con = sqlite3.connect(tmp_db)
    cur = con.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )
    tables = {r[0] for r in cur.fetchall()}
    con.close()

    assert "cache" in tables
    assert "positions" in tables
    assert "scrape_status" in tables


def test_init_db_idempotent(tmp_path):
    """Calling init_db twice does not raise."""
    import cache_db

    tmp_db = str(tmp_path / "idempotent.db")
    cache_db.CACHE_DB = tmp_db

    cache_db.init_db()
    cache_db.init_db()  # must not raise


# ── cache_* tests ──────────────────────────────────────────────────────────────

def test_cache_get_returns_none_for_missing(tmp_path):
    """cache_get returns None when key does not exist."""
    import cache_db

    result = cache_db.cache_get("nonexistent_key_12345")
    assert result is None


def test_cache_get_returns_parsed_dict_for_existing(tmp_path):
    """cache_get returns a parsed dict for an existing key."""
    import cache_db

    cache_db.cache_set("test_key", {"foo": "bar", "num": 42})
    result = cache_db.cache_get("test_key")

    assert result is not None
    assert result["foo"] == "bar"
    assert result["num"] == 42


def test_cache_set_stores_json_with_updated_at(tmp_path):
    """cache_set stores data as JSON and includes an updated_at field."""
    import cache_db

    cache_db.cache_set("store_test", {"hello": "world"})
    import cache_db as cd

    con = sqlite3.connect(cd.CACHE_DB)
    cur = con.execute("SELECT data, updated_at FROM cache WHERE key = ?", ("store_test",))
    row = cur.fetchone()
    con.close()

    assert row is not None
    data = json.loads(row[0])
    assert data["hello"] == "world"
    assert row[1] is not None and row[1] != ""


def test_cache_set_upsert_replaces_existing(tmp_path):
    """cache_set with an existing key replaces the value."""
    import cache_db

    cache_db.cache_set("upsert_key", {"v": 1})
    cache_db.cache_set("upsert_key", {"v": 2})

    result = cache_db.cache_get("upsert_key")
    assert result["v"] == 2

    # Must be exactly one row
    import cache_db as cd
    con = sqlite3.connect(cd.CACHE_DB)
    count = con.execute("SELECT COUNT(*) FROM cache WHERE key = ?", ("upsert_key",)).fetchone()[0]
    con.close()
    assert count == 1


def test_cache_delete_removes_key(tmp_path):
    """cache_delete removes the key from the cache table."""
    import cache_db

    cache_db.cache_set("to_delete", {"x": 1})
    cache_db.cache_delete("to_delete")

    result = cache_db.cache_get("to_delete")
    assert result is None


# ── portfolio / positions tests ────────────────────────────────────────────────

def test_get_positions_empty_returns_empty_list(tmp_path):
    """get_positions returns [] when no positions exist."""
    import cache_db

    result = cache_db.get_positions()
    assert result == []


def test_get_positions_returns_dicts_with_all_columns(tmp_path):
    """get_positions returns a list of dicts with all required columns."""
    import cache_db

    cache_db.add_position({
        "ticker": "AAPL",
        "company": "Apple Inc.",
        "shares": 10.0,
        "buyPrice": 150.0,
        "buyDate": "2024-01-01",
        "currency": "USD",
    })

    positions = cache_db.get_positions()
    assert len(positions) == 1
    p = positions[0]
    assert p["ticker"] == "AAPL"
    assert p["company"] == "Apple Inc."
    assert p["shares"] == 10.0
    assert p["buyPrice"] == 150.0
    assert p["buyDate"] == "2024-01-01"
    assert p["currency"] == "USD"


def test_add_position_returns_new_id_and_is_retrievable(tmp_path):
    """add_position returns the new row ID and the position is findable."""
    import cache_db

    new_id = cache_db.add_position({
        "ticker": "MSFT",
        "company": "Microsoft",
        "shares": 5.0,
        "buyPrice": 300.0,
        "buyDate": "2024-02-01",
        "currency": "USD",
    })

    assert isinstance(new_id, int)
    assert new_id >= 1

    positions = cache_db.get_positions()
    tickers = {p["ticker"] for p in positions}
    assert "MSFT" in tickers


def test_edit_position_partial_update_works(tmp_path):
    """edit_position updates only the specified fields."""
    import cache_db

    pos_id = cache_db.add_position({
        "ticker": "GOOGL",
        "company": "Alphabet",
        "shares": 2.0,
        "buyPrice": 100.0,
        "buyDate": "2024-03-01",
        "currency": "USD",
    })

    cache_db.edit_position(pos_id, {"shares": 3.0})

    positions = cache_db.get_positions()
    p = next(pp for pp in positions if pp["id"] == pos_id)
    assert p["shares"] == 3.0
    assert p["buyPrice"] == 100.0  # unchanged


def test_edit_position_multiple_fields(tmp_path):
    """edit_position can update multiple fields at once."""
    import cache_db

    pos_id = cache_db.add_position({
        "ticker": "TSLA",
        "company": "Tesla",
        "shares": 1.0,
        "buyPrice": 200.0,
        "buyDate": "2024-04-01",
        "currency": "USD",
    })

    cache_db.edit_position(pos_id, {
        "shares": 4.0,
        "buyPrice": 210.0,
    })

    positions = cache_db.get_positions()
    p = next(pp for pp in positions if pp["id"] == pos_id)
    assert p["shares"] == 4.0
    assert p["buyPrice"] == 210.0
    assert p["ticker"] == "TSLA"  # unchanged


def test_delete_position_removes_by_id(tmp_path):
    """delete_position removes the position with the given ID."""
    import cache_db

    pos_id = cache_db.add_position({
        "ticker": "META",
        "company": "Meta Platforms",
        "shares": 2.0,
        "buyPrice": 350.0,
        "buyDate": "2024-05-01",
        "currency": "USD",
    })

    cache_db.delete_position(pos_id)

    positions = cache_db.get_positions()
    ids = {p["id"] for p in positions}
    assert pos_id not in ids


# ── scrape_status tests ────────────────────────────────────────────────────────

def test_set_scrape_status_insert_and_update(tmp_path):
    """set_scrape_status inserts a new row and updates an existing one."""
    import cache_db

    cache_db.set_scrape_status("ohlcv", "2024-06-01T10:00:00")
    result1 = cache_db.get_scrape_status("ohlcv")
    assert result1 is not None
    assert result1["status"] == "2024-06-01T10:00:00"

    cache_db.set_scrape_status("ohlcv", "2024-06-02T12:00:00")
    result2 = cache_db.get_scrape_status("ohlcv")
    assert result2["status"] == "2024-06-02T12:00:00"


def test_get_scrape_status_none_for_missing(tmp_path):
    """get_scrape_status returns None when the key does not exist."""
    import cache_db

    result = cache_db.get_scrape_status("nonexistent_scrape_key")
    assert result is None


def test_get_scrape_status_returns_dict(tmp_path):
    """get_scrape_status returns a dict with key, updated_at, status."""
    import cache_db

    cache_db.set_scrape_status("forex", "ok")
    result = cache_db.get_scrape_status("forex")

    assert isinstance(result, dict)
    assert "key" in result
    assert "status" in result
    assert result["key"] == "forex"
    assert result["status"] == "ok"


def test_get_all_scrape_status_empty_returns_empty_dict(tmp_path):
    """get_all_scrape_status returns {} when no scrape status rows exist."""
    import cache_db

    result = cache_db.get_all_scrape_status()
    assert isinstance(result, dict)
    assert result == {}


def test_wal_mode_enabled_on_connection(tmp_path):
    """get_conn returns a connection with WAL journal_mode enabled."""
    import cache_db

    cache_db.CACHE_DB = str(tmp_path / "wal_test.db")
    cache_db.init_db()

    con = cache_db.get_conn()
    cur = con.execute("PRAGMA journal_mode")
    mode = cur.fetchone()[0]
    con.close()

    assert mode.upper() == "WAL"
