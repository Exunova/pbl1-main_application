"""
OHLCV Scraper — 15m historical data for indices and stocks across 4 markets.
Supports incremental scraping: if data exists, only fetches gap from last timestamp to now.
No data doubling: duplicates are prevented based on timestamp deduplication.
Usage: run(output_dir) where output_dir = /home/reiyo/Project/PBL1/pbl1-main_application/data
       run(output_dir, incremental=True) for gap-fill only
       run(output_dir, full=True) to force full 30-day fetch
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

import yfinance as yf
import json
import time
from datetime import datetime, timedelta

from backend.src.scraping.base_scraper import BaseScraper

MARKETS = {
    "US": {"index": "^GSPC",   "tickers": ["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM"]},
    "ID": {"index": "^JKLQ45", "tickers": ["BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK"]},
    "JP": {"index": "^N225",   "tickers": ["7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T"]},
    "GB": {"index": "^FTSE",   "tickers": ["AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L"]},
}

OHLCV_TTL_SECONDS = 3600  # 1 hour
MAX_RETRIES = 3
FALLBACK_PERIOD_DAYS = 30  # Days of data to fetch when no existing data


def safe_float(val):
    """Round a value to 4 decimal places, returning None on failure."""
    try:
        return round(float(val), 4)
    except Exception:
        return None


def to_filename(ticker):
    """Convert ticker symbol to safe filename."""
    return ticker.replace(".", "_").replace("^", "IDX_").replace("-", "_")


def parse_timestamp(ts_str):
    """Parse timestamp string to datetime object. Handles various formats."""
    if not ts_str:
        return None
    try:
        # Try ISO format with timezone
        return datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
    except Exception:
        try:
            # Try without timezone
            return datetime.fromisoformat(ts_str)
        except Exception:
            try:
                # Try fromisoformat with space separator
                return datetime.strptime(ts_str.split('.')[0], '%Y-%m-%d %H:%M:%S')
            except Exception:
                return None


def scrape_15m(ticker, start=None, end=None):
    """
    Fetch 15m OHLCV data for a ticker.
    If start/end provided, use them. Otherwise falls back to period="30d".
    """
    for attempt in range(MAX_RETRIES):
        try:
            if start and end:
                df = yf.Ticker(ticker).history(start=start, end=end, interval="15m")
            else:
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


def load_existing_data(output_dir, ticker):
    """Load existing OHLCV data from file. Returns (data, last_timestamp)."""
    fname = to_filename(ticker) + ".json"
    path = os.path.join(output_dir, fname)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            last_ts = None
            for bar in data.get("ohlcv_15m", []):
                ts = parse_timestamp(bar.get("timestamp", ""))
                if ts:
                    if last_ts is None or ts > last_ts:
                        last_ts = ts
            return data, last_ts
        except Exception as e:
            print(f"  [WARN] Could not load {fname}: {e}")
    return None, None


def merge_ohlcv_data(existing, new_bars):
    """
    Merge new bars with existing data, avoiding duplicates by timestamp.
    Returns merged list sorted by timestamp.
    """
    if not existing:
        return new_bars
    if not new_bars:
        return existing

    # Deduplicate by timestamp
    seen_timestamps = set()
    merged = []

    # Add existing bars first (deduplicated)
    for bar in existing:
        ts_str = bar.get("timestamp", "")
        if ts_str not in seen_timestamps:
            seen_timestamps.add(ts_str)
            merged.append(bar)

    # Add new bars (skip if timestamp already exists)
    for bar in new_bars:
        ts_str = bar.get("timestamp", "")
        if ts_str not in seen_timestamps:
            seen_timestamps.add(ts_str)
            merged.append(bar)

    # Sort by timestamp
    def sort_key(bar):
        ts = parse_timestamp(bar.get("timestamp", ""))
        return ts if ts else datetime.min

    merged.sort(key=sort_key)
    return merged


def save_json(data, path):
    """Write data dict to a JSON file."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  [OK] Saved: {os.path.basename(path)}")


class OHLCVScraper(BaseScraper):
    """OHLCV scraper for 15m historical data across US, ID, JP, GB markets."""

    TTL_SECONDS: int = OHLCV_TTL_SECONDS

    def __init__(self) -> None:
        super().__init__()

    def scraper_key(self) -> str:
        """Return unique cache key for this scraper."""
        return "ohlcv"

    def run(self, output_dir: str, incremental: bool = True, full: bool = False) -> dict:
        """
        Run the OHLCV scraper.

        Args:
            output_dir: Directory to write output files
            incremental: If True, only fetch gap from last timestamp
            full: If True, force full 30-day fetch

        Returns:
            dict with scrape summary
        """
        self.set_output_dir(output_dir)
        os.makedirs(output_dir, exist_ok=True)

        print("=" * 50)
        print("OHLCV Scraper — 15m Historical Data")
        print(f"Output dir : {output_dir}")
        print(f"Incremental: {incremental}")
        print(f"Full fetch : {full}")
        print(f"Started    : {datetime.now()}")
        print("=" * 50)

        summary = {"scraped_at": str(datetime.now()), "markets": {}}

        try:
            for market, config in MARKETS.items():
                print(f"\n[Market: {market}]")

                idx = config["index"]
                idx_filename = to_filename(idx)
                print(f"  Index: {idx}")

                existing_idx_data, last_idx_ts = load_existing_data(output_dir, idx)
                new_idx_bars = []

                if full:
                    new_idx_bars = scrape_15m(idx)
                    print(f"    [FULL] Fetched 30 days fresh for {idx}")
                elif existing_idx_data and incremental:
                    if last_idx_ts:
                        start_str = last_idx_ts.strftime('%Y-%m-%d')
                        end_str = datetime.now().strftime('%Y-%m-%d')
                        new_idx_bars = scrape_15m(idx, start=start_str, end=end_str)
                        print(f"    [INCREMENTAL] Gap fill from {start_str} to {end_str}: {len(new_idx_bars)} new bars")
                    else:
                        new_idx_bars = scrape_15m(idx)
                        print(f"    [INCREMENTAL] No valid last timestamp, fetching 30 days")
                else:
                    new_idx_bars = scrape_15m(idx)
                    print(f"    [FULL] Fetched 30 days for {idx}")

                merged_idx = merge_ohlcv_data(existing_idx_data.get("ohlcv_15m") if existing_idx_data else None, new_idx_bars)

                idx_data = {
                    "ticker": idx,
                    "type": "index",
                    "market": market,
                    "scraped_at": str(datetime.now()),
                    "updated_at": datetime.now().isoformat(),
                    "ohlcv_15m": merged_idx,
                }
                self.cache_db.cache_set(f"ohlcv:{idx_filename}", idx_data)

                idx_path = os.path.join(output_dir, f"{idx_filename}.json")
                save_json(idx_data, idx_path)

                summary["markets"][market] = {
                    "index": idx,
                    "index_15m_count": len(merged_idx),
                    "new_bars": len(new_idx_bars),
                    "stocks": {},
                }

                for ticker in config["tickers"]:
                    print(f"  Stock: {ticker}")
                    ticker_filename = to_filename(ticker)

                    existing_ticker_data, last_ticker_ts = load_existing_data(output_dir, ticker)
                    new_ticker_bars = []

                    if full:
                        new_ticker_bars = scrape_15m(ticker)
                        print(f"    [FULL] Fetched 30 days fresh for {ticker}")
                    elif existing_ticker_data and incremental:
                        if last_ticker_ts:
                            start_str = last_ticker_ts.strftime('%Y-%m-%d')
                            end_str = datetime.now().strftime('%Y-%m-%d')
                            new_ticker_bars = scrape_15m(ticker, start=start_str, end=end_str)
                            print(f"    [INCREMENTAL] Gap fill from {start_str} to {end_str}: {len(new_ticker_bars)} new bars")
                        else:
                            new_ticker_bars = scrape_15m(ticker)
                            print(f"    [INCREMENTAL] No valid last timestamp, fetching 30 days")
                    else:
                        new_ticker_bars = scrape_15m(ticker)
                        print(f"    [FULL] Fetched 30 days for {ticker}")

                    merged_ticker = merge_ohlcv_data(existing_ticker_data.get("ohlcv_15m") if existing_ticker_data else None, new_ticker_bars)

                    ticker_data = {
                        "ticker": ticker,
                        "type": "stock",
                        "market": market,
                        "scraped_at": str(datetime.now()),
                        "updated_at": datetime.now().isoformat(),
                        "ohlcv_15m": merged_ticker,
                    }
                    self.cache_db.cache_set(f"ohlcv:{ticker_filename}", ticker_data)

                    ticker_path = os.path.join(output_dir, f"{ticker_filename}.json")
                    save_json(ticker_data, ticker_path)

                    summary["markets"][market]["stocks"][ticker] = {
                        "ohlcv_15m_count": len(merged_ticker),
                        "new_bars": len(new_ticker_bars),
                    }
                    time.sleep(5)

            summary_path = os.path.join(output_dir, "_summary.json")
            save_json(summary, summary_path)

            print(f"\n[DONE] {datetime.now()}")
            self.cache_db.set_scrape_status(self.scraper_key(), "completed", summary)
            return summary

        except Exception as e:
            print(f"\n[ERROR] {e}")
            self.cache_db.set_scrape_status(self.scraper_key(), "error", {"error": str(e)})
            raise


if __name__ == "__main__":
    # Default DATA_DIR when run standalone
    DATA_DIR = "/home/reiyo/Project/PBL1/pbl1-main_application/data"
    scraper = OHLCVScraper()
    scraper.run(DATA_DIR)