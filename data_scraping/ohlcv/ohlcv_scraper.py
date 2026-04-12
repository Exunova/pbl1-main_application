"""
MAPRO Scraper — OHLCV (Harga Historikal Saham & Index)
Jalankan: python scraper.py
Output  : ../data/ohlcv/
"""

import yfinance as yf
import json
import os
import time
from datetime import datetime

MARKETS = {
    "US": {
        "index": "^GSPC",
        "tickers": ["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM"]
    },
    "ID": {
        "index": "^JKLQ45",
        "tickers": ["BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK"]
    },
    "JP": {
        "index": "^N225",
        "tickers": ["7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T"]
    },
    "GB": {
        "index": "^FTSE",
        "tickers": ["AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L"]
    }
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../data/ohlcv")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def safe_float(val):
    try:
        return round(float(val), 4)
    except:
        return None


def save_json(data, filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  [OK] Saved: {filename}")


def scrape_15m(ticker):
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
                "volume": int(row["Volume"])
            }
            for ts, row in df.iterrows()
        ]
    except Exception as e:
        print(f"  [ERROR] {ticker} 15m: {e}")
        return []


def scrape_daily(ticker, period="1y"):
    try:
        df = yf.Ticker(ticker).history(period=period, interval="1d")
        if df.empty:
            return []
        return [
            {
                "date":   str(ts.date()),
                "open":   safe_float(row["Open"]),
                "high":   safe_float(row["High"]),
                "low":    safe_float(row["Low"]),
                "close":  safe_float(row["Close"]),
                "volume": int(row["Volume"])
            }
            for ts, row in df.iterrows()
        ]
    except Exception as e:
        print(f"  [ERROR] {ticker} daily: {e}")
        return []


def to_filename(ticker):
    return ticker.replace(".", "_").replace("^", "IDX_").replace("-", "_")


def main():
    print("=" * 50)
    print("MAPRO Scraper — OHLCV")
    print(f"Started: {datetime.now()}")
    print("=" * 50)

    summary = {"scraped_at": str(datetime.now()), "markets": {}}

    for market, config in MARKETS.items():
        print(f"\n[Market: {market}]")

        # Index — daily 1 tahun
        idx = config["index"]
        print(f"  Index: {idx}")
        idx_daily = scrape_daily(idx, period="1y")
        save_json({
            "ticker": idx, "type": "index", "market": market,
            "scraped_at": str(datetime.now()),
            "ohlcv_daily": idx_daily
        }, f"{to_filename(idx)}_daily.json")

        summary["markets"][market] = {
            "index": idx,
            "index_daily_count": len(idx_daily),
            "stocks": {}
        }

        # Stocks — 1m (7 hari) + daily (3 bulan)
        for ticker in config["tickers"]:
            print(f"  Stock: {ticker}")
            ohlcv_15m = scrape_15m(ticker)

            save_json({
                "ticker": ticker, "type": "stock", "market": market,
                "scraped_at": str(datetime.now()),
                "ohlcv_15m": ohlcv_15m
            }, f"{to_filename(ticker)}.json")

            summary["markets"][market]["stocks"][ticker] = {
                "ohlcv_15m_count": len(ohlcv_15m)
            }
            time.sleep(3)

    save_json(summary, "_summary.json")
    print(f"\n[DONE] {datetime.now()}")


if __name__ == "__main__":
    main()
