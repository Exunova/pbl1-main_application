"""
MAPRO Scraper Forex
Jalankan: python forex_scraper.py
Output  : ../data/forex/
"""

import yfinance as yf
import json
import os
from datetime import datetime

FOREX_PAIRS = {
    "IDR_USD": {"ticker": "IDRUSD=X", "base": "IDR", "quote": "USD", "label": "Indonesian Rupiah / US Dollar"},
    "JPY_USD": {"ticker": "JPYUSD=X", "base": "JPY", "quote": "USD", "label": "Japanese Yen / US Dollar"},
    "GBP_USD": {"ticker": "GBPUSD=X", "base": "GBP", "quote": "USD", "label": "British Pound / US Dollar"},
    "USD_IDR": {"ticker": "USDIDR=X", "base": "USD", "quote": "IDR", "label": "US Dollar / Indonesian Rupiah"},
    "USD_JPY": {"ticker": "USDJPY=X", "base": "USD", "quote": "JPY", "label": "US Dollar / Japanese Yen"},
    "USD_GBP": {"ticker": "USDGBP=X", "base": "USD", "quote": "GBP", "label": "US Dollar / British Pound"},
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../data/forex")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def safe_float(val, decimals=6):
    try:
        return round(float(val), decimals)
    except:
        return None


def save_json(data, filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  [OK] Saved: {filename}")


def scrape_pair(pair_key, config):
    ticker = config["ticker"]
    try:
        tk   = yf.Ticker(ticker)
        info = tk.info

        current = (
            safe_float(info.get("currentPrice")) or
            safe_float(info.get("regularMarketPrice")) or
            safe_float(info.get("bid"))
        )

        df      = tk.history(period="1mo", interval="1d")
        history = []
        if not df.empty:
            for ts, row in df.iterrows():
                history.append({
                    "date":  str(ts.date()),
                    "close": safe_float(row["Close"])
                })

        return {
            "pair":         pair_key,
            "ticker":       ticker,
            "base":         config["base"],
            "quote":        config["quote"],
            "label":        config["label"],
            "scraped_at":   str(datetime.now()),
            "current_rate": current,
            "prev_close":   safe_float(info.get("previousClose")),
            "change_pct":   safe_float(info.get("regularMarketChangePercent"), 4),
            "history_30d":  history
        }

    except Exception as e:
        print(f"  [ERROR] {ticker}: {e}")
        return {
            "pair":       pair_key,
            "ticker":     ticker,
            "error":      str(e),
            "scraped_at": str(datetime.now())
        }


def main():
    print("=" * 50)
    print("MAPRO Scraper — Forex Rate")
    print(f"Started: {datetime.now()}")
    print("=" * 50)

    summary = {"scraped_at": str(datetime.now()), "pairs": {}}

    for pair_key, config in FOREX_PAIRS.items():
        print(f"  {pair_key} ({config['ticker']})...")
        data = scrape_pair(pair_key, config)
        save_json(data, f"{pair_key.lower()}.json")
        summary["pairs"][pair_key] = {
            "rate":   data.get("current_rate"),
            "change": data.get("change_pct"),
            "status": "ok" if "error" not in data else "error"
        }

    save_json(summary, "_summary.json")
    print(f"\n[DONE] {datetime.now()}")


if __name__ == "__main__":
    main()
