"""
OHLCV Scraper — 15m historical data for indices and stocks across 4 markets.
Usage: run(output_dir) where output_dir = /home/reiyo/Project/PBL1/pbl1-main_application/data
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from cache_db import cache_get, cache_set, set_scrape_status

import yfinance as yf
import json
import time
from datetime import datetime, timedelta

MARKETS = {
    "US": {"index": "^GSPC",   "tickers": ["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM"]},
    "ID": {"index": "^JKLQ45", "tickers": ["BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK"]},
    "JP": {"index": "^N225",   "tickers": ["7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T"]},
    "GB": {"index": "^FTSE",   "tickers": ["AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L"]},
}

OHLCV_TTL_SECONDS = 3600  # 1 hour

MAX_RETRIES = 3


def safe_float(val):
    """Round a value to 4 decimal places, returning None on failure."""
    try:
        return round(float(val), 4)
    except Exception:
        return None


def to_filename(ticker):
    """Convert ticker symbol to safe filename."""
    return ticker.replace(".", "_").replace("^", "IDX_").replace("-", "_")


def is_cache_fresh(key, ttl_seconds):
    """Check if cache entry exists and is within TTL."""
    data = cache_get(key)
    if data is None:
        return False, None
    updated_at_str = data.get("updated_at") or data.get("scraped_at")
    if not updated_at_str:
        return False, None
    try:
        updated_at = datetime.fromisoformat(updated_at_str)
        age = datetime.now() - updated_at
        if age.total_seconds() < ttl_seconds:
            return True, data
    except Exception:
        pass
    return False, None


def scrape_15m(ticker):
    for attempt in range(MAX_RETRIES):
        try:
            df = yf.Ticker(ticker).history(period="30d", interval="15m")
            if df.empty:
                print(f"  [WARN] No 15m data: {ticker}")
                return []
            return [
                {
                    "timestamp": str(ts),
                    "open":   safe_float(row["Open"]),
                    "high":   safe_float(row["High"]),
                    "low":    safe_float(row["Low"]),
                    "close":  safe_float(row["Close"]),
                    "volume": int(row["Volume"]),
                }
                for ts, row in df.iterrows()
            ]
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "rate" in err_str or "too many" in err_str:
                wait = (2 ** attempt) * 30
                print(f"  [RATE LIMIT] {ticker} attempt {attempt+1}, waiting {wait}s...")
                time.sleep(wait)
                continue
            print(f"  [ERROR] {ticker} 15m: {e}")
            return []
    print(f"  [FAIL] {ticker} exceeded retries after {MAX_RETRIES} attempts")
    return []


def save_json(data, path):
    """Write data dict to a JSON file."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  [OK] Saved: {os.path.basename(path)}")


def run(output_dir):
    """
    Scrape OHLCV 15m data for indices and stocks across US, ID, JP, GB markets.

    Args:
        output_dir: Directory to write JSON files to
                   (e.g., /home/reiyo/Project/PBL1/pbl1-main_application/data)

    Returns:
        Summary dict with counts per market/ticker
    """
    os.makedirs(output_dir, exist_ok=True)

    print("=" * 50)
    print("OHLCV Scraper — 15m Historical Data")
    print(f"Output dir : {output_dir}")
    print(f"Started    : {datetime.now()}")
    print("=" * 50)

    summary = {"scraped_at": str(datetime.now()), "markets": {}}

    for market, config in MARKETS.items():
        print(f"\n[Market: {market}]")

        # --- Index ---
        idx = config["index"]
        idx_filename = to_filename(idx)
        print(f"  Index: {idx}")
        idx_15m = []
        idx_data = None

        # Check cache first
        fresh, idx_data = is_cache_fresh(f"ohlcv:{idx_filename}", OHLCV_TTL_SECONDS)
        if fresh and idx_data:
            idx_15m = idx_data.get("ohlcv_15m", [])
            print(f"  [CACHE] Using cached data for {idx} ({len(idx_15m)} bars)")
        else:
            idx_15m = scrape_15m(idx)
            idx_data = {
                "ticker": idx,
                "type": "index",
                "market": market,
                "scraped_at": str(datetime.now()),
                "updated_at": datetime.now().isoformat(),
                "ohlcv_15m": idx_15m,
            }
            cache_set(f"ohlcv:{idx_filename}", idx_data)

        idx_path = os.path.join(output_dir, f"{idx_filename}.json")
        save_json(idx_data, idx_path)

        summary["markets"][market] = {
            "index": idx,
            "index_15m_count": len(idx_15m),
            "stocks": {},
        }

        # --- Stocks ---
        for ticker in config["tickers"]:
            print(f"  Stock: {ticker}")
            ticker_filename = to_filename(ticker)
            ohlcv_15m = []
            ticker_data = None

            # Check cache first
            fresh, ticker_data = is_cache_fresh(f"ohlcv:{ticker_filename}", OHLCV_TTL_SECONDS)
            if fresh and ticker_data:
                ohlcv_15m = ticker_data.get("ohlcv_15m", [])
                print(f"    [CACHE] Using cached data for {ticker} ({len(ohlcv_15m)} bars)")
            else:
                ohlcv_15m = scrape_15m(ticker)
                ticker_data = {
                    "ticker": ticker,
                    "type": "stock",
                    "market": market,
                    "scraped_at": str(datetime.now()),
                    "updated_at": datetime.now().isoformat(),
                    "ohlcv_15m": ohlcv_15m,
                }
                cache_set(f"ohlcv:{ticker_filename}", ticker_data)

            ticker_path = os.path.join(output_dir, f"{ticker_filename}.json")
            save_json(ticker_data, ticker_path)

            summary["markets"][market]["stocks"][ticker] = {
                "ohlcv_15m_count": len(ohlcv_15m),
            }
            time.sleep(5)

    # --- Summary ---
    summary_path = os.path.join(output_dir, "_summary.json")
    save_json(summary, summary_path)

    print(f"\n[DONE] {datetime.now()}")
    return summary


if __name__ == "__main__":
    # Default DATA_DIR when run standalone
    DATA_DIR = "/home/reiyo/Project/PBL1/pbl1-main_application/data"
    run(DATA_DIR)