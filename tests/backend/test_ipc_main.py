"""
Pytest suite for ipc_main.py
Spawns ipc_main.py as a subprocess and sends JSON commands via STDIN,
verifies JSON responses on STDOUT.
"""

import pytest
import subprocess
import json
import time
import threading
import os
import tempfile

IPC_PATH = '/home/reiyo/Project/PBL1/pbl1-main_application/backend/src/ipc_main.py'
PYTHON = '/home/reiyo/Project/PBL1/pbl1-main_application/backend/venv/bin/python'
VENV_PYTHON = PYTHON if os.path.exists(PYTHON) else 'python3'


@pytest.fixture
def ipc_process(tmp_path):
    """Spawn ipc_main.py with a temporary cache.db, yield the process, then clean up."""
    cache_db = str(tmp_path / "cache.db")
    env = os.environ.copy()
    env['PYTHONPATH'] = os.path.dirname(os.path.dirname(os.path.dirname(IPC_PATH)))

    proc = subprocess.Popen(
        [VENV_PYTHON, IPC_PATH],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
    )

    # Wait for startup
    time.sleep(0.5)

    yield proc

    try:
        proc.stdin.close()
    except Exception:
        pass
    proc.kill()
    proc.wait(timeout=5)


def send_command(proc, cmd, params=None, req_id="test1"):
    """Send a JSON command and return the parsed response."""
    msg = json.dumps({"id": req_id, "cmd": cmd, "params": params or {}}) + "\n"
    proc.stdin.write(msg.encode())
    proc.stdin.flush()
    resp_line = proc.stdout.readline()
    if not resp_line:
        raise RuntimeError("No response from ipc_main process")
    return json.loads(resp_line.decode())


# ── Basic command tests ────────────────────────────────────────────────────────

def test_health_command(ipc_process):
    """health command returns ok:true with status data."""
    resp = send_command(ipc_process, "health")
    assert resp["ok"] is True
    assert "data" in resp
    assert resp["data"]["status"] == "ok"


def test_unknown_command_returns_error(ipc_process):
    """Unknown command returns ok:False and an error message."""
    resp = send_command(ipc_process, "nonexistent_cmd_xyz")
    assert resp["ok"] is False
    assert "error" in resp


# ── OHLCV ─────────────────────────────────────────────────────────────────────

def test_ohlcv_command(ipc_process):
    """ohlcv command returns a dict with ohlcv_15m key."""
    resp = send_command(ipc_process, "ohlcv", {"ticker": "AAPL"})
    assert resp["ok"] is True
    assert "data" in resp
    # May be empty list if no data, but structure should be present
    assert "ohlcv_15m" in resp["data"] or resp["data"].get("ticker") == "AAPL"


# ── News ──────────────────────────────────────────────────────────────────────

def test_news_command(ipc_process):
    """news command returns a dict with market and articles key."""
    resp = send_command(ipc_process, "news", {"region": "US"})
    assert resp["ok"] is True
    assert "data" in resp
    data = resp["data"]
    assert "market" in data
    assert "articles" in data


# ── Macro ─────────────────────────────────────────────────────────────────────

def test_macro_command(ipc_process):
    """macro command returns a dict with country and events key."""
    resp = send_command(ipc_process, "macro", {"cc": "US"})
    assert resp["ok"] is True
    assert "data" in resp
    data = resp["data"]
    assert "country" in data
    assert "events" in data


# ── Forex ──────────────────────────────────────────────────────────────────────

def test_forex_command(ipc_process):
    """forex command returns a dict with pair and current_rate fields."""
    resp = send_command(ipc_process, "forex", {"pair": "USD_IDR"})
    assert resp["ok"] is True
    assert "data" in resp
    data = resp["data"]
    assert "pair" in data
    assert "current_rate" in data


# ── Company Info ───────────────────────────────────────────────────────────────

def test_company_command(ipc_process):
    """company command returns a dict with ticker and info key."""
    resp = send_command(ipc_process, "company", {"ticker": "AAPL"})
    assert resp["ok"] is True
    assert "data" in resp
    data = resp["data"]
    assert "ticker" in data
    assert "info" in data


# ── Index ─────────────────────────────────────────────────────────────────────

def test_index_command(ipc_process):
    """index command returns a dict with index and current_price fields."""
    resp = send_command(ipc_process, "index", {"idx": "^GSPC"})
    assert resp["ok"] is True
    assert "data" in resp
    data = resp["data"]
    assert "index" in data
    assert "current_price" in data


def test_indices_command(ipc_process):
    """indices command returns a list of index summaries."""
    resp = send_command(ipc_process, "indices")
    assert resp["ok"] is True
    assert "data" in resp
    data = resp["data"]
    assert isinstance(data, list)
    # Should contain 4 indices: ^GSPC, ^JKLQ45, ^N225, ^FTSE
    assert len(data) == 4


# ── Scrape ─────────────────────────────────────────────────────────────────────

def test_scrape_command(ipc_process):
    """scrape command starts a background scrape and returns status."""
    resp = send_command(ipc_process, "scrape", {"type": "ohlcv"})
    assert resp["ok"] is True
    assert "data" in resp
    assert resp["data"]["status"] == "started"


def test_scrape_status_command(ipc_process):
    """scrape_status command returns a dict with status per scraper."""
    resp = send_command(ipc_process, "scrape_status")
    assert resp["ok"] is True
    assert "data" in resp
    data = resp["data"]
    # Should have entries for each scraper type
    for key in ["ohlcv", "news", "macro", "forex", "company_info"]:
        assert key in data


# ── Portfolio ──────────────────────────────────────────────────────────────────

def test_portfolio_list_command(ipc_process):
    """portfolio_list returns a dict with positions list."""
    resp = send_command(ipc_process, "portfolio_list")
    assert resp["ok"] is True
    assert "data" in resp
    assert "positions" in resp["data"]
    assert isinstance(resp["data"]["positions"], list)


def test_portfolio_add_command(ipc_process):
    """portfolio_add adds a position and returns the new record."""
    resp = send_command(ipc_process, "portfolio_add", {
        "ticker": "AAPL",
        "company": "Apple Inc.",
        "shares": 10.0,
        "buyPrice": 150.0,
        "buyDate": "2024-01-01",
        "currency": "USD",
    })
    assert resp["ok"] is True
    assert "data" in resp
    data = resp["data"]
    assert "id" in data
    assert data["ticker"] == "AAPL"
    assert data["shares"] == 10.0


def test_portfolio_edit_command(ipc_process):
    """portfolio_edit updates a position and returns the updated record."""
    # First add
    add_resp = send_command(ipc_process, "portfolio_add", {
        "ticker": "MSFT",
        "company": "Microsoft",
        "shares": 5.0,
        "buyPrice": 300.0,
        "buyDate": "2024-02-01",
        "currency": "USD",
    })
    pos_id = add_resp["data"]["id"]

    # Edit
    resp = send_command(ipc_process, "portfolio_edit", {
        "id": pos_id,
        "shares": 7.0,
    })
    assert resp["ok"] is True
    assert resp["data"]["shares"] == 7.0


def test_portfolio_delete_command(ipc_process):
    """portfolio_delete removes a position by id."""
    # First add
    add_resp = send_command(ipc_process, "portfolio_add", {
        "ticker": "GOOGL",
        "company": "Alphabet",
        "shares": 2.0,
        "buyPrice": 100.0,
        "buyDate": "2024-03-01",
        "currency": "USD",
    })
    pos_id = add_resp["data"]["id"]

    # Delete
    resp = send_command(ipc_process, "portfolio_delete", {"id": pos_id})
    assert resp["ok"] is True
    assert resp["data"]["status"] == "ok"


def test_portfolio_pnl_command(ipc_process):
    """portfolio_pnl returns positions with PnL calculations."""
    resp = send_command(ipc_process, "portfolio_pnl")
    assert resp["ok"] is True
    assert "data" in resp
    data = resp["data"]
    assert "positions" in data
    assert "total" in data
    assert "totalPnL" in data["total"]


def test_portfolio_export_command(ipc_process):
    """portfolio_export returns all positions."""
    resp = send_command(ipc_process, "portfolio_export")
    assert resp["ok"] is True
    assert "data" in resp
    assert "positions" in resp["data"]


def test_portfolio_import_command(ipc_process):
    """portfolio_import accepts a list of positions and imports them."""
    resp = send_command(ipc_process, "portfolio_import", {
        "positions": [
            {
                "ticker": "TSLA",
                "company": "Tesla",
                "shares": 1.0,
                "buyPrice": 200.0,
                "buyDate": "2024-04-01",
                "currency": "USD",
            },
            {
                "ticker": "META",
                "company": "Meta",
                "shares": 3.0,
                "buyPrice": 350.0,
                "buyDate": "2024-05-01",
                "currency": "USD",
            },
        ]
    })
    assert resp["ok"] is True
    assert "data" in resp
    assert resp["data"]["imported"] == 2
    assert resp["data"]["total"] >= 2
