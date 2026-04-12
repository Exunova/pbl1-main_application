import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from cache_db import cache_get, cache_set, set_scrape_status

import yfinance as yf
import json
from datetime import datetime, timedelta

FOREX_PAIRS = {
    "IDR_USD": {"ticker": "IDRUSD=X", "base": "IDR", "quote": "USD", "label": "Indonesian Rupiah / US Dollar"},
    "JPY_USD": {"ticker": "JPYUSD=X", "base": "JPY", "quote": "USD", "label": "Japanese Yen / US Dollar"},
    "GBP_USD": {"ticker": "GBPUSD=X", "base": "GBP", "quote": "USD", "label": "British Pound / US Dollar"},
    "USD_IDR": {"ticker": "USDIDR=X", "base": "USD", "quote": "IDR", "label": "US Dollar / Indonesian Rupiah"},
    "USD_JPY": {"ticker": "USDJPY=X", "base": "USD", "quote": "JPY", "label": "US Dollar / Japanese Yen"},
    "USD_GBP": {"ticker": "USDGBP=X", "base": "USD", "quote": "GBP", "label": "US Dollar / British Pound"},
}

FOREX_TTL_SECONDS = 3600  # 1 hour


def safe_float(val, decimals=6):
    try:
        return round(float(val), decimals)
    except (TypeError, ValueError):
        return None


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


def scrape_pair(pair_key, config):
    ticker = config["ticker"]
    try:
        tk = yf.Ticker(ticker)
        info = tk.info

        current = (
            safe_float(info.get("currentPrice")) or
            safe_float(info.get("regularMarketPrice")) or
            safe_float(info.get("bid"))
        )

        df = tk.history(period="1mo", interval="1d")
        history = []
        if not df.empty:
            for ts, row in df.iterrows():
                history.append({
                    "date": str(ts.date()),
                    "close": safe_float(row["Close"])
                })

        return {
            "pair": pair_key,
            "ticker": ticker,
            "base": config["base"],
            "quote": config["quote"],
            "label": config["label"],
            "scraped_at": str(datetime.now()),
            "updated_at": datetime.now().isoformat(),
            "current_rate": current,
            "prev_close": safe_float(info.get("previousClose")),
            "change_pct": safe_float(info.get("regularMarketChangePercent"), 4),
            "history_30d": history
        }

    except Exception as e:
        return {
            "pair": pair_key,
            "ticker": ticker,
            "base": config["base"],
            "quote": config["quote"],
            "label": config["label"],
            "scraped_at": str(datetime.now()),
            "updated_at": datetime.now().isoformat(),
            "current_rate": None,
            "prev_close": None,
            "change_pct": None,
            "history_30d": [],
            "error": str(e)
        }


def save_json(data, filepath):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)


def run(output_dir):
    os.makedirs(output_dir, exist_ok=True)

    summary = {
        "scraped_at": str(datetime.now()),
        "pairs": {}
    }

    for pair_key, config in FOREX_PAIRS.items():
        # Check cache first
        fresh, data = is_cache_fresh(f"forex:{pair_key}", FOREX_TTL_SECONDS)

        if fresh and data:
            print(f"  [CACHE] Using cached data for {pair_key}")
        else:
            print(f"  Scraping {pair_key}...")
            data = scrape_pair(pair_key, config)
            cache_set(f"forex:{pair_key}", data)

        filename = f"{pair_key.lower()}.json"
        filepath = os.path.join(output_dir, filename)
        save_json(data, filepath)

        if "error" in data:
            summary["pairs"][pair_key] = {
                "rate": data.get("current_rate"),
                "change": data.get("change_pct"),
                "status": "error"
            }
        else:
            summary["pairs"][pair_key] = {
                "rate": data.get("current_rate"),
                "change": data.get("change_pct"),
                "status": "ok"
            }

    save_json(summary, os.path.join(output_dir, "_summary.json"))

    return summary


if __name__ == "__main__":
    DATA_DIR = "/home/reiyo/Project/PBL1/pbl1-main_application/data"
    print("=" * 50)
    print("MAPRO Scraper — Forex Rate")
    print(f"Started: {datetime.now()}")
    print(f"Output: {DATA_DIR}")
    print("=" * 50)
    run(DATA_DIR)
    print(f"\n[DONE] {datetime.now()}")