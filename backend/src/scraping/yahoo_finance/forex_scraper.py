"""Forex scraper using Yahoo Finance."""

import os
import json
from datetime import datetime
from typing import Optional

import yfinance as yf

from backend.src.scraping.base_scraper import BaseScraper

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


class ForexScraper(BaseScraper):
    """Scraper for forex pairs via Yahoo Finance."""

    TTL_SECONDS: int = FOREX_TTL_SECONDS

    def scraper_key(self) -> str:
        return "forex"

    def _scrape_pair(self, pair_key: str, config: dict) -> dict:
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

    def run(self, output_dir: str) -> dict:
        self.set_output_dir(output_dir)
        os.makedirs(output_dir, exist_ok=True)

        summary = {
            "scraped_at": str(datetime.now()),
            "pairs": {}
        }

        for pair_key, config in FOREX_PAIRS.items():
            fresh, data = self.is_cache_fresh(f"forex:{pair_key}")

            if fresh and data:
                print(f"  [CACHE] Using cached data for {pair_key}")
            else:
                print(f"  Scraping {pair_key}...")
                data = self._scrape_pair(pair_key, config)
                self._cache_db.cache_set(f"forex:{pair_key}", data)

            filename = f"{pair_key.lower()}.json"
            self.save_json(data, filename)

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

        self.save_json(summary, "_summary.json")

        return summary