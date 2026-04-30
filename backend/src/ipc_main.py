#!/usr/bin/env python3
"""
IPC Main — Electron Child Process Entry Point
Listens on STDIN for JSON commands, writes JSON responses to STDOUT.
Replaces Flask as the backend for Electron.
"""

import sys
import os
import json
import threading
import sqlite3
import builtins
from datetime import datetime
from contextlib import contextmanager

import yfinance as yf

# =============================================================================
# HARDCODE TOGGLE — SCRAPING ON / OFF
# Set SCRAPING_ENABLED = False to completely disable all background scrapers.
# The app will still serve existing cached / file data; it just won't fetch
# any new data from the network.  Flip back to True to re-enable scraping.
# =============================================================================
SCRAPING_ENABLED = True   # ← change this to False to turn off all scraping

# =============================================================================
# PATH SETUP
# =============================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(BASE_DIR)
ROOT_DIR = os.path.dirname(APP_DIR)
DATA_DIR = os.path.join(ROOT_DIR, 'data')
CACHE_DB = os.path.join(APP_DIR, 'cache.db')

# Ensure data dir exists
os.makedirs(DATA_DIR, exist_ok=True)
sys.stderr.write(f"[Python IPC] DATA_DIR initialized at: {DATA_DIR}\n")
sys.stderr.write(f"[Python IPC] Scraping is {'ENABLED' if SCRAPING_ENABLED else 'DISABLED'}\n")

# Ensure sys.path has APP_DIR for scrapers imports
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Menambahkan fungsi baru untuk fitur dropdown ticker di portofolio
def handle_get_scraped_tickers():
    """Fungsi untuk mengambil daftar 40 ticker beserta nama perusahaannya hasil scraping"""
    try:
        # Membaca file _summary.json dari folder data/company_info
        data = read_cache_file("company_info", "_summary.json")
        result = []
        
        # Mengekstrak nama-nama ticker dan nama perusahaan dari dalam file JSON
        if data and "tickers" in data:
            for ticker, details in data["tickers"].items():
                result.append({
                    "ticker": ticker,
                    "name": details.get("name", "")
                })
                    
        return result
    except Exception as e:
        return []


# =============================================================================
# CACHE DATABASE
# =============================================================================

def get_db_conn():
    """Get a connection to the cache SQLite database."""
    conn = sqlite3.connect(CACHE_DB, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the cache database schema."""
    with get_db_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                company TEXT NOT NULL,
                shares REAL NOT NULL,
                buyPrice REAL NOT NULL,
                buyDate TEXT NOT NULL,
                currency TEXT NOT NULL DEFAULT 'USD'
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scrape_status (
                key TEXT PRIMARY KEY,
                updated_at TEXT,
                status TEXT
            )
        """)
        conn.commit()

@contextmanager
def db_cursor():
    """Context manager for database cursor."""
    conn = get_db_conn()
    try:
        cursor = conn.cursor()
        yield cursor
        conn.commit()
    finally:
        conn.close()

# =============================================================================
# CACHE FUNCTIONS
# =============================================================================

def cache_get(key):
    """Get cached data by key. Returns parsed JSON or None."""
    try:
        with db_cursor() as cur:
            cur.execute("SELECT data FROM cache WHERE key = ?", (key,))
            row = cur.fetchone()
            if row:
                return json.loads(row['data'])
    except Exception:
        pass
    return None

def cache_set(key, data):
    """Store data in cache with current timestamp."""
    try:
        with db_cursor() as cur:
            cur.execute(
                "INSERT OR REPLACE INTO cache (key, data, updated_at) VALUES (?, ?, ?)",
                (key, json.dumps(data, default=str), datetime.now().isoformat())
            )
    except Exception:
        pass

def cache_get_or_run(key, scraper_fn):
    """Return cached data if exists, otherwise run scraper_fn() and cache result."""
    cached = cache_get(key)
    if cached is not None:
        return cached
    result = scraper_fn()
    if result is not None:
        cache_set(key, result)
    return result

# =============================================================================
# SCRAPER IMPORTS (after path setup)
# =============================================================================

from src.scrapers import ohlcv_scraper, news_scraper, macro_scraper, forex_scraper, company_info_scraper

SCRAPER_MODULES = {
    "ohlcv": (ohlcv_scraper, os.path.join(DATA_DIR, "ohlcv")),
    "news": (news_scraper, os.path.join(DATA_DIR, "news")),
    "macro": (macro_scraper, os.path.join(DATA_DIR, "macro")),
    "forex": (forex_scraper, os.path.join(DATA_DIR, "forex")),
    "company_info": (company_info_scraper, os.path.join(DATA_DIR, "company_info")),
}

# =============================================================================
# IPC HANDLER IMPORTS
# =============================================================================
from backend.src.ipc import (
    DashboardHandler,
    WatchlistHandler,
    NewsHandler,
    MacroHandler,
    ForexHandler,
    PortfolioHandler,
    SettingsHandler,
)

# Create handler instances (module level for reuse across commands)
dashboard_handler = DashboardHandler()
watchlist_handler = WatchlistHandler()
news_handler = NewsHandler()
macro_handler = MacroHandler()
forex_handler = ForexHandler()
portfolio_handler = PortfolioHandler()
settings_handler = SettingsHandler()

# =============================================================================
# REDIRECT PRINT TO STDERR (to keep STDOUT clean for JSON IPC)
# =============================================================================
_original_print = builtins.print
def print_to_stderr(*args, **kwargs):
    kwargs["file"] = sys.stderr
    _original_print(*args, **kwargs)
builtins.print = print_to_stderr

# =============================================================================
# SCRAPE STATUS (thread-safe)
# =============================================================================

scrape_status = {
    "ohlcv": None,
    "news": None,
    "macro": None,
    "forex": None,
    "company_info": None
}
scrape_lock = threading.Lock()
active_scrapers = set()

def set_scrape_status(key, status):
    """Set scrape status for a scraper type."""
    with scrape_lock:
        scrape_status[key] = status
        try:
            with db_cursor() as cur:
                cur.execute(
                    "INSERT OR REPLACE INTO scrape_status (key, updated_at, status) VALUES (?, ?, ?)",
                    (key, datetime.now().isoformat(), status)
                )
        except Exception:
            pass

def get_scrape_status():
    """Get current scrape status for all scrapers."""
    with scrape_lock:
        return dict(scrape_status)

# =============================================================================
# BACKGROUND SCRAPING
# =============================================================================

def trigger_scrape_in_bg(scraper_key):
    """Trigger a scraper to run in the background if not already running.
    
    Scraping is completely skipped when SCRAPING_ENABLED is False.
    """
    if not SCRAPING_ENABLED:
        sys.stderr.write(f"[Python IPC] Scraping is DISABLED — skipping '{scraper_key}'\n")
        return

    with scrape_lock:
        if scraper_key in active_scrapers:
            return
        active_scrapers.add(scraper_key)

    def run():
        try:
            scraper_mod, output_dir = SCRAPER_MODULES[scraper_key]
            result = scraper_mod.run(output_dir)
            status = result.get("scraped_at") if isinstance(result, dict) else datetime.now().isoformat()
            set_scrape_status(scraper_key, status)
        except Exception as e:
            set_scrape_status(scraper_key, f"error: {str(e)}")
            sys.stderr.write(f"Scrape error {scraper_key}: {e}\n")
        finally:
            with scrape_lock:
                active_scrapers.discard(scraper_key)

    t = threading.Thread(target=run, daemon=True)
    t.start()

# =============================================================================
# FILE HELPERS (mirror Flask implementation)
# =============================================================================

def get_data_path(category, filename):
    """Get full path for a data file."""
    d = os.path.join(DATA_DIR, category)
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, filename)

def read_cache_file(category, filename):
    """Read JSON data from a cache file."""
    path = get_data_path(category, filename)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return None

def to_filename(ticker):
    """Convert ticker symbol to safe filename."""
    return ticker.replace(".", "_").replace("^", "IDX_").replace("-", "_")

# =============================================================================
# COMMAND HANDLERS
# =============================================================================

def handle_ohlcv(ticker):
    """Handle ohlcv command - returns OHLCV data for a ticker."""
    fname = to_filename(ticker) + ".json"
    cached = cache_get(f"ohlcv:{ticker}")
    if cached:
        updated_at_str = cached.get("updated_at") or cached.get("scraped_at")
        if updated_at_str:
            try:
                updated_at = datetime.fromisoformat(updated_at_str)
                age = (datetime.now() - updated_at).total_seconds()
                if age < 3600:
                    return cached
            except Exception:
                pass
    
    data = read_cache_file("ohlcv", fname)
    if not data:
        trigger_scrape_in_bg("ohlcv")
        return {"ticker": ticker, "ohlcv_15m": [], "loading": True}
    
    if not data:
        return {"ticker": ticker, "ohlcv_15m": []}
    
    cache_set(f"ohlcv:{ticker}", data)
    return data

def handle_news(region):
    """Handle news command - returns news articles for a region."""
    cached = cache_get(f"news:{region.upper()}")
    if cached:
        return cached
    
    data = read_cache_file("news", f"{region.lower()}_news.json")
    if not data:
        trigger_scrape_in_bg("news")
        labels = {"US": "S&P 500 / Wall Street", "ID": "LQ45 / IHSG", "JP": "Nikkei 225", "GB": "FTSE 100"}
        return {"region": region.upper(), "label": labels.get(region.upper(), region), "articles": [], "loading": True}
    
    labels = {"US": "S&P 500 / Wall Street", "ID": "LQ45 / IHSG", "JP": "Nikkei 225", "GB": "FTSE 100"}
    if not data:
        return {"region": region.upper(), "label": labels.get(region.upper(), region), "articles": []}
    
    cache_set(f"news:{region.upper()}", data)
    return data

def handle_macro(cc):
    """Handle macro command - returns macro events for a country code."""
    cached = cache_get(f"macro:{cc.upper()}")
    if cached:
        return cached
    
    data = read_cache_file("macro", f"{cc.lower()}_macro.json")
    if not data:
        trigger_scrape_in_bg("macro")
        return {"country": cc.upper(), "name": cc.upper(), "events": [], "loading": True}
    
    if not data:
        return {"country": cc.upper(), "name": cc.upper(), "events": []}
    
    cache_set(f"macro:{cc.upper()}", data)
    return data

def handle_forex(pair):
    """Handle forex command - returns forex data for a pair."""
    cached = cache_get(f"forex:{pair.upper()}")
    if cached:
        return cached
    
    data = read_cache_file("forex", f"{pair.lower()}.json")
    if not data:
        trigger_scrape_in_bg("forex")
        return {"pair": pair.upper(), "current_rate": None, "change_pct": 0, "loading": True}
    
    if not data:
        return {"pair": pair.upper(), "current_rate": None, "change_pct": 0}
    
    cache_set(f"forex:{pair.upper()}", data)
    return data

def handle_company(ticker):
    """Handle company command - returns company info for a ticker."""
    fname = to_filename(ticker) + ".json"
    cached = cache_get(f"company:{ticker}")
    if cached:
        return cached
    
    data = read_cache_file("company_info", fname)
    if not data:
        trigger_scrape_in_bg("company_info")
        return {"ticker": ticker, "info": {}, "loading": True}
    
    if not data:
        return {"ticker": ticker, "info": {}}
    
    cache_set(f"company:{ticker}", data)
    return data

def handle_companies(tickers):
    """Handle companies command - returns company info for multiple tickers in one call."""
    results = {}
    for ticker in tickers:
        results[ticker] = handle_company(ticker)
    return results

def handle_index(idx):
    """Handle index command - returns index summary from OHLCV data."""
    fname = to_filename(idx) + ".json"
    data = read_cache_file("ohlcv", fname)
    
    indices_map = {
        "^GSPC": {"name": "S&P 500", "country": "US"},
        "^JKLQ45": {"name": "LQ45", "country": "ID"},
        "^N225": {"name": "Nikkei 225", "country": "JP"},
        "^FTSE": {"name": "FTSE 100", "country": "GB"}
    }
    meta = indices_map.get(idx, {"name": idx, "country": "XX"})
    
    if data and data.get("ohlcv_15m"):
        candles = data["ohlcv_15m"]
        cur = candles[-1].get("close")
        prv = candles[0].get("close")
        chg = ((cur - prv) / prv * 100) if cur and prv else 0
        return {**meta, "index": idx, "current_price": cur, "prev_close": prv, "change_pct": chg, "scraped_at": data.get("scraped_at", "")}
    
    return {**meta, "index": idx, "current_price": None, "prev_close": None, "change_pct": 0}

def handle_indices():
    """Handle indices command - returns all 4 indices summary."""
    results = []
    indices_list = [
        ("^GSPC", {"name": "S&P 500", "country": "US"}),
        ("^JKLQ45", {"name": "LQ45", "country": "ID"}),
        ("^N225", {"name": "Nikkei 225", "country": "JP"}),
        ("^FTSE", {"name": "FTSE 100", "country": "GB"})
    ]
    
    for idx, meta in indices_list:
        fname = to_filename(idx) + ".json"
        data = read_cache_file("ohlcv", fname)
        if data and data.get("ohlcv_15m"):
            candles = data["ohlcv_15m"]
            cur = candles[-1].get("close")
            prv = candles[0].get("close")
            chg = ((cur - prv) / prv * 100) if cur and prv else 0
            results.append({"index": idx, **meta, "current_price": cur, "prev_close": prv, "change_pct": chg})
        else:
            results.append({"index": idx, **meta, "current_price": None, "prev_close": None, "change_pct": 0})
    
    return results

def handle_scrape(stype):
    if not SCRAPING_ENABLED:
        return {"status": "disabled", "type": stype, "message": "Scraping is currently disabled (SCRAPING_ENABLED=False)"}
    if stype in SCRAPER_MODULES:
        trigger_scrape_in_bg(stype)
        return {"status": "started", "type": stype}
    return {"error": "unknown type"}


def handle_scrape_latest():
    """
    Handle scrape_latest command - triggers incremental scrape for all data types.
    Always works (bypasses SCRAPING_ENABLED) since user explicitly requested it via button.
    Scrapers will automatically detect if data exists and do gap-fill, or full 30-day fetch if no data.
    """
    for stype in SCRAPER_MODULES:
        trigger_scrape_in_bg(stype)
    return {"status": "started", "type": "all", "message": "Incremental scrape triggered for all data types"}


def handle_scrape_status():
    """Handle scrape_status command - returns current scrape status."""
    return get_scrape_status()


def handle_portfolio_list():
    """Handle portfolio_list command - returns all portfolio positions."""
    try:
        with db_cursor() as cur:
            cur.execute("SELECT id, ticker, company, shares, buyPrice, buyDate, currency FROM positions")
            rows = cur.fetchall()
            positions = [
                {
                    "id": row['id'],
                    "ticker": row['ticker'],
                    "company": row['company'],
                    "shares": row['shares'],
                    "buyPrice": row['buyPrice'],
                    "buyDate": row['buyDate'],
                    "currency": row['currency']
                }
                for row in rows
            ]
            return {"positions": positions}
    except Exception as e:
        return {"positions": [], "error": str(e)}

def handle_portfolio_add(params):
    """Handle portfolio_add command - adds a new position."""
    try:
        ticker = params.get("ticker")
        company = params.get("company")
        shares = params.get("shares")
        buyPrice = params.get("buyPrice")
        buyDate = params.get("buyDate")
        currency = params.get("currency", "USD")
        
        if not all([ticker, company, shares, buyPrice, buyDate]):
            return {"error": "Missing required fields"}
        
        with db_cursor() as cur:
            cur.execute(
                "INSERT INTO positions (ticker, company, shares, buyPrice, buyDate, currency) VALUES (?, ?, ?, ?, ?, ?)",
                (ticker, company, shares, buyPrice, buyDate, currency)
            )
            new_id = cur.lastrowid
        
        return {"id": new_id, "ticker": ticker, "company": company, "shares": shares, "buyPrice": buyPrice, "buyDate": buyDate, "currency": currency}
    except Exception as e:
        return {"error": str(e)}

def handle_portfolio_edit(params):
    """Handle portfolio_edit command - edits an existing position."""
    try:
        pid = params.get("id")
        if not pid:
            return {"error": "Missing position id"}
        
        # Build update fields
        allowed_fields = ["ticker", "company", "shares", "buyPrice", "buyDate", "currency"]
        update_fields = []
        update_values = []
        
        for field in allowed_fields:
            if field in params:
                update_fields.append(f"{field} = ?")
                update_values.append(params[field])
        
        if not update_fields:
            return {"error": "No fields to update"}
        
        update_values.append(pid)
        query = f"UPDATE positions SET {', '.join(update_fields)} WHERE id = ?"
        
        with db_cursor() as cur:
            cur.execute(query, update_values)
            if cur.rowcount == 0:
                return {"error": "Position not found"}
            
            # Fetch updated position
            cur.execute("SELECT id, ticker, company, shares, buyPrice, buyDate, currency FROM positions WHERE id = ?", (pid,))
            row = cur.fetchone()
        
        if row:
            return {
                "id": row['id'],
                "ticker": row['ticker'],
                "company": row['company'],
                "shares": row['shares'],
                "buyPrice": row['buyPrice'],
                "buyDate": row['buyDate'],
                "currency": row['currency']
            }
        return {"error": "Position not found after update"}
    except Exception as e:
        return {"error": str(e)}

def handle_portfolio_delete(params):
    """Handle portfolio_delete command - deletes a position."""
    try:
        pid = params.get("id")
        if not pid:
            return {"error": "Missing position id"}
        
        with db_cursor() as cur:
            cur.execute("DELETE FROM positions WHERE id = ?", (pid,))
            if cur.rowcount == 0:
                return {"error": "Position not found"}
        
        return {"status": "ok"}
    except Exception as e:
        return {"error": str(e)}

def handle_portfolio_pnl():
    """Handle portfolio_pnl command - calculates PnL for all positions."""
    try:
        with db_cursor() as cur:
            cur.execute("SELECT id, ticker, company, shares, buyPrice, buyDate, currency FROM positions")
            rows = cur.fetchall()
            positions = [
                {
                    "id": row['id'],
                    "ticker": row['ticker'],
                    "company": row['company'],
                    "shares": row['shares'],
                    "buyPrice": row['buyPrice'],
                    "buyDate": row['buyDate'],
                    "currency": row['currency']
                }
                for row in rows
            ]

        if not positions:
            return {"positions": [], "total": {"totalPnL": 0, "stockReturn": 0, "forexReturn": 0}}

        tickers = [p['ticker'] for p in positions]
        try:
            prices = yf.download(tickers, period="1d", auto_adjust=True, threads=True)
        except Exception as e:
            sys.stderr.write(f"yfinance batch download failed: {e}\n")
            prices = None

        fx_tickers = {"USD_IDR": "USDIDR=X", "USD_JPY": "USDJPY=X", "USD_GBP": "USDGBP=X"}
        fx_rates = {}
        for key, ticker in fx_tickers.items():
            try:
                info = yf.Ticker(ticker).info
                fx_rates[key] = info.get("currentPrice") or info.get("regularMarketPrice") or 1.0
            except Exception:
                fx_rates[key] = 1.0

        def get_hist_avg_approx(pair_ticker):
            try:
                hist = yf.Ticker(pair_ticker).history(period="1mo")
                return float(hist['Close'].iloc[-1]) if not hist.empty else None
            except Exception:
                return None

        current_fx = {c: fx_rates.get(k, 1.0) for c, k in [("IDR", "USD_IDR"), ("JPY", "USD_JPY"), ("GBP", "USD_GBP")]}

        def get_buy_fx(currency):
            if currency == "USD":
                return 1.0
            pair = {"IDR": "USDIDR=X", "JPY": "USDJPY=X", "GBP": "USDGBP=X"}.get(currency)
            return get_hist_avg_approx(pair) if pair else (15650.0 if currency == "IDR" else 1.0)

        pnl_positions = []
        total_pnl_idr = 0.0
        total_stock_idr = 0.0
        total_forex_idr = 0.0

        for p in positions:
            ticker = p['ticker']
            currency = p['currency']
            shares = p['shares']
            buy_price = p['buyPrice']
            buy_fx = get_buy_fx(currency)
            curr_fx = current_fx.get(currency, 1.0 if currency == "USD" else 15650.0)

            current_price = None
            if prices is not None and not prices.empty:
                try:
                    current_price = float(prices['Close'].iloc[-1]) if len(tickers) == 1 else float(prices['Close'][ticker].iloc[-1])
                except Exception:
                    pass

            if current_price is None:
                try:
                    info = yf.Ticker(ticker).info
                    current_price = info.get("currentPrice") or info.get("regularMarketPrice")
                except Exception:
                    current_price = None

            if current_price is None:
                current_price = buy_price

            stock_return = (current_price - buy_price) * shares
            stock_return_idr = stock_return * curr_fx
            forex_return_idr = shares * buy_price * (curr_fx - buy_fx)

            total_pnl_idr += stock_return_idr + forex_return_idr
            total_stock_idr += stock_return_idr
            total_forex_idr += forex_return_idr

            pnl_positions.append({
                "ticker": ticker,
                "shares": shares,
                "buyPrice": buy_price,
                "currentPrice": current_price,
                "currency": currency,
                "fxRate": curr_fx,
                "fxRateAtBuy": buy_fx,
                "stockReturn": stock_return_idr,
                "forexReturn": forex_return_idr,
            })

        return {
            "positions": pnl_positions,
            "total": {"totalPnL": total_pnl_idr, "stockReturn": total_stock_idr, "forexReturn": total_forex_idr}
        }
    except Exception as e:
        return {"error": str(e)}

def handle_portfolio_export():
    """Handle portfolio_export command - exports all positions."""
    try:
        with db_cursor() as cur:
            cur.execute("SELECT id, ticker, company, shares, buyPrice, buyDate, currency FROM positions")
            rows = cur.fetchall()
            positions = [
                {
                    "id": row['id'],
                    "ticker": row['ticker'],
                    "company": row['company'],
                    "shares": row['shares'],
                    "buyPrice": row['buyPrice'],
                    "buyDate": row['buyDate'],
                    "currency": row['currency']
                }
                for row in rows
            ]
            return {"positions": positions}
    except Exception as e:
        return {"error": str(e)}

def handle_portfolio_import(params):
    """Handle portfolio_import command - imports positions."""
    try:
        incoming = params.get("positions", [])
        if not isinstance(incoming, list):
            return {"error": "positions must be a list"}
        
        added = 0
        with db_cursor() as cur:
            for pos in incoming:
                if all(k in pos for k in ("ticker", "shares", "buyPrice", "buyDate", "currency")):
                    cur.execute(
                        "INSERT INTO positions (ticker, company, shares, buyPrice, buyDate, currency) VALUES (?, ?, ?, ?, ?, ?)",
                        (pos.get("ticker"), pos.get("company", ""), pos.get("shares"), pos.get("buyPrice"), pos.get("buyDate"), pos.get("currency"))
                    )
                    added += 1
            
            # Get total count
            cur.execute("SELECT COUNT(*) as cnt FROM positions")
            total = cur.fetchone()['cnt']
        
        return {"imported": added, "total": total}
    except Exception as e:
        return {"error": str(e)}

# =============================================================================
# MAIN COMMAND DISPATCHER
# =============================================================================

def handle_command(req):
    """Handle an incoming command request."""
    req_id = req.get("id", "")
    cmd = req.get("cmd")
    params = req.get("params", {})
    
    try:
        if cmd == "ohlcv":
            ticker = params.get("ticker")
            if not ticker:
                return {"id": req_id, "ok": False, "error": "Missing ticker parameter"}
            # Ubah baris di bawah ini:
            data = handle_ohlcv(ticker)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "news":
            region = params.get("region")
            if not region:
                return {"id": req_id, "ok": False, "error": "Missing region parameter"}
            data = handle_news(region)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "macro":
            cc = params.get("cc")
            if not cc:
                return {"id": req_id, "ok": False, "error": "Missing cc parameter"}
            data = macro_handler.handle_command(cmd, params)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "forex":
            pair = params.get("pair")
            if not pair:
                return {"id": req_id, "ok": False, "error": "Missing pair parameter"}
            data = forex_handler.handle_command(cmd, params)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "company":
            ticker = params.get("ticker")
            if not ticker:
                return {"id": req_id, "ok": False, "error": "Missing ticker parameter"}
            data = watchlist_handler.handle_command(cmd, params)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "companies":
            raw = params.get("tickers", [])
            if isinstance(raw, list):
                tickers = raw
            elif isinstance(raw, dict) and "tickers" in raw:
                tickers = raw["tickers"]
            elif isinstance(raw, dict):
                return {"id": req_id, "ok": False, "error": "tickers must be a list"}
            else:
                return {"id": req_id, "ok": False, "error": "tickers must be a list"}
            data = watchlist_handler.handle_command(cmd, {"tickers": tickers})
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "index":
            idx = params.get("idx")
            if not idx:
                return {"id": req_id, "ok": False, "error": "Missing idx parameter"}
            # Ubah baris di bawah ini:
            data = handle_index(idx)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "indices":
            # Ubah baris di bawah ini:
            data = handle_indices()
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "scrape":
            stype = params.get("type")
            if not stype:
                return {"id": req_id, "ok": False, "error": "Missing type parameter"}
            data = settings_handler.handle_command(cmd, params)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "scrape_status":
            data = settings_handler.handle_command(cmd, params)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "scrape_latest":
            data = settings_handler.handle_command(cmd, params)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "health":
            data = settings_handler.handle_command(cmd, params)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "portfolio_list":
            data = portfolio_handler.handle_command(cmd, params)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "portfolio_add":
            data = portfolio_handler.handle_command(cmd, params)
            if "error" in data:
                return {"id": req_id, "ok": False, "error": data["error"]}
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "portfolio_edit":
            data = portfolio_handler.handle_command(cmd, params)
            if "error" in data:
                return {"id": req_id, "ok": False, "error": data["error"]}
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "portfolio_delete":
            data = portfolio_handler.handle_command(cmd, params)
            if "error" in data:
                return {"id": req_id, "ok": False, "error": data["error"]}
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "portfolio_pnl":
            data = portfolio_handler.handle_command(cmd, params)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "portfolio_export":
            data = portfolio_handler.handle_command(cmd, params)
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "portfolio_import":
            data = portfolio_handler.handle_command(cmd, params)
            if "error" in data:
                return {"id": req_id, "ok": False, "error": data["error"]}
            return {"id": req_id, "ok": True, "data": data}

        # Untuk fitur dropdown ticker di portofolio
        elif cmd == "get_scraped_tickers":
            data = handle_get_scraped_tickers()
            return {"id": req_id, "ok": True, "data": data}

        else:
            return {"id": req_id, "ok": False, "error": f"Unknown command: {cmd}"}

    except Exception as e:
        return {"id": req_id, "ok": False, "error": str(e)}

# =============================================================================
# MAIN LOOP
# =============================================================================

def main():
    """Main entry point - read commands from STDIN, write responses to STDOUT."""
    # Initialize database
    init_db()
    
    # Load scrape status from database
    try:
        with db_cursor() as cur:
            cur.execute("SELECT key, status FROM scrape_status")
            rows = cur.fetchall()
            for row in rows:
                scrape_status[row['key']] = row['status']
    except Exception:
        pass
    
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            resp = handle_command(req)
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
        except json.JSONDecodeError as e:
            sys.stdout.write(json.dumps({"id": "", "ok": False, "error": f"Invalid JSON: {str(e)}"}) + "\n")
            sys.stdout.flush()
        except Exception as e:
            sys.stdout.write(json.dumps({"id": "", "ok": False, "error": str(e)}) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()