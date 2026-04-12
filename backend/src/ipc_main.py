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
from datetime import datetime
from contextlib import contextmanager

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

# Ensure sys.path has APP_DIR for scrapers imports
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

# =============================================================================
# CACHE DATABASE
# =============================================================================

def get_db_conn():
    """Get a connection to the cache SQLite database."""
    conn = sqlite3.connect(CACHE_DB, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the cache database schema."""
    with get_db_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                data TEXT,
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
    """Trigger a scraper to run in the background."""
    def run():
        try:
            scraper_mod, output_dir = SCRAPER_MODULES[scraper_key]
            result = scraper_mod.run(output_dir)
            status = result.get("scraped_at") if isinstance(result, dict) else datetime.now().isoformat()
            set_scrape_status(scraper_key, status)
        except Exception as e:
            set_scrape_status(scraper_key, f"error: {str(e)}")
            sys.stderr.write(f"Scrape error {scraper_key}: {e}\n")

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
        return cached
    
    data = read_cache_file("ohlcv", fname)
    if not data:
        ohlcv_scraper.run(os.path.join(DATA_DIR, "ohlcv"))
        data = read_cache_file("ohlcv", fname)
    
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
        news_scraper.run(os.path.join(DATA_DIR, "news"))
        data = read_cache_file("news", f"{region.lower()}_news.json")
    
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
        macro_scraper.run(os.path.join(DATA_DIR, "macro"))
        data = read_cache_file("macro", f"{cc.lower()}_macro.json")
    
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
        forex_scraper.run(os.path.join(DATA_DIR, "forex"))
        data = read_cache_file("forex", f"{pair.lower()}.json")
    
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
        company_info_scraper.run(os.path.join(DATA_DIR, "company_info"))
        data = read_cache_file("company_info", fname)
    
    if not data:
        return {"ticker": ticker, "info": {}}
    
    cache_set(f"company:{ticker}", data)
    return data

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
    """Handle scrape command - triggers background scrape."""
    if stype in SCRAPER_MODULES:
        trigger_scrape_in_bg(stype)
        return {"status": "started", "type": stype}
    return {"error": "unknown type"}

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
        
        # For now, return mock PnL data matching Flask behavior
        # In production, this would fetch current prices and calculate real PnL
        pnl_positions = []
        for p in positions:
            current_price = 186.2 if p['currency'] == 'USD' else 9000.0
            fx_rate = 15650.0 if p['currency'] == 'IDR' else 1.0
            fx_rate_at_buy = 15500.0 if p['currency'] == 'IDR' else 1.0
            pnl_positions.append({
                "ticker": p['ticker'],
                "shares": p['shares'],
                "buyPrice": p['buyPrice'],
                "currentPrice": current_price,
                "currency": p['currency'],
                "fxRate": fx_rate,
                "fxRateAtBuy": fx_rate_at_buy
            })
        
        return {
            "positions": pnl_positions,
            "total": {
                "totalPnL": 1865000,
                "stockReturn": 112000,
                "forexReturn": 1753000
            }
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
            data = handle_macro(cc)
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "forex":
            pair = params.get("pair")
            if not pair:
                return {"id": req_id, "ok": False, "error": "Missing pair parameter"}
            data = handle_forex(pair)
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "company":
            ticker = params.get("ticker")
            if not ticker:
                return {"id": req_id, "ok": False, "error": "Missing ticker parameter"}
            data = handle_company(ticker)
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "index":
            idx = params.get("idx")
            if not idx:
                return {"id": req_id, "ok": False, "error": "Missing idx parameter"}
            data = handle_index(idx)
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "indices":
            data = handle_indices()
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "scrape":
            stype = params.get("type")
            if not stype:
                return {"id": req_id, "ok": False, "error": "Missing type parameter"}
            data = handle_scrape(stype)
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "scrape_status":
            data = handle_scrape_status()
            return {"id": req_id, "ok": True, "data": data}

        elif cmd == "health":
            return {"id": req_id, "ok": True, "data": {"status": "ok"}}

        elif cmd == "portfolio_list":
            data = handle_portfolio_list()
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "portfolio_add":
            data = handle_portfolio_add(params)
            if "error" in data:
                return {"id": req_id, "ok": False, "error": data["error"]}
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "portfolio_edit":
            data = handle_portfolio_edit(params)
            if "error" in data:
                return {"id": req_id, "ok": False, "error": data["error"]}
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "portfolio_delete":
            data = handle_portfolio_delete(params)
            if "error" in data:
                return {"id": req_id, "ok": False, "error": data["error"]}
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "portfolio_pnl":
            data = handle_portfolio_pnl()
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "portfolio_export":
            data = handle_portfolio_export()
            return {"id": req_id, "ok": True, "data": data}
        
        elif cmd == "portfolio_import":
            data = handle_portfolio_import(params)
            if "error" in data:
                return {"id": req_id, "ok": False, "error": data["error"]}
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
            print(json.dumps(resp), flush=True)
        except json.JSONDecodeError as e:
            print(json.dumps({"id": "", "ok": False, "error": f"Invalid JSON: {str(e)}"}), flush=True)
        except Exception as e:
            print(json.dumps({"id": "", "ok": False, "error": str(e)}), flush=True)

if __name__ == "__main__":
    main()