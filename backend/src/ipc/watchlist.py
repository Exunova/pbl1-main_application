from datetime import datetime

from backend.src.ipc.base_page_handler import BasePageHandler


def to_filename(ticker):
    """Convert ticker symbol to safe filename."""
    return ticker.replace(".", "_").replace("^", "IDX_").replace("-", "_")


class WatchlistHandler(BasePageHandler):

    def handle_command(self, cmd: str, params: dict) -> dict:
        if cmd == "ohlcv":
            return self._handle_ohlcv(params.get("ticker"))
        elif cmd == "company":
            return self._handle_company(params.get("ticker"))
        elif cmd == "companies":
            return self._handle_companies(params.get("tickers", []))
        return {}

    def _handle_ohlcv(self, ticker):
        """Handle ohlcv command - returns OHLCV data for a ticker."""
        if not ticker:
            return {"ticker": ticker, "ohlcv_15m": []}

        fname = to_filename(ticker) + ".json"
        cached = self.cache_get(f"ohlcv:{ticker}")
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

        data = self.read_cache_file("ohlcv", fname)
        if not data:
            self.trigger_scrape_in_bg("ohlcv")
            return {"ticker": ticker, "ohlcv_15m": [], "loading": True}

        if not data:
            return {"ticker": ticker, "ohlcv_15m": []}

        self.cache_set(f"ohlcv:{ticker}", data)
        return data

    def _handle_company(self, ticker):
        """Handle company command - returns company info for a ticker."""
        if not ticker:
            return {"ticker": ticker, "info": {}}

        fname = to_filename(ticker) + ".json"
        cached = self.cache_get(f"company:{ticker}")
        # Only return cached data if it contains actual price info.
        # Stale entries with only identity data must fall through to OHLCV fallback.
        if cached and cached.get("info", {}).get("price"):
            return cached

        data = self.read_cache_file("company_info", fname)
        if data:
            self.cache_set(f"company:{ticker}", data)
            return data

        # Fallback: derive price info from OHLCV data when company_info file missing
        ohlcv_data = self.read_cache_file("ohlcv", fname)
        if ohlcv_data and ohlcv_data.get("ohlcv_15m"):
            candles = ohlcv_data["ohlcv_15m"]
            if candles:
                first = candles[0]
                last = candles[-1]
                first_close = first.get("close")
                last_close = last.get("close")
                if first_close and last_close:
                    closes = [c.get("close") for c in candles if c.get("close") is not None]
                    highs = [c.get("high") for c in candles if c.get("high") is not None]
                    lows = [c.get("low") for c in candles if c.get("low") is not None]
                    volumes = [c.get("volume") for c in candles if c.get("volume") is not None]

                    chg_pct = ((last_close - first_close) / first_close) * 100

                    info = {"price": {
                        "currentPrice": last_close,
                        "previousClose": first_close,
                        "open": last.get("open"),
                        "dayLow": last.get("low"),
                        "dayHigh": last.get("high"),
                        "volume": last.get("volume"),
                        "fiftyTwoWeekLow": min(lows) if lows else None,
                        "fiftyTwoWeekHigh": max(highs) if highs else None,
                        "fiftyDayAverage": round(sum(closes[-50:]) / len(closes[-50:]), 2) if len(closes) >= 50 else None,
                        "twoHundredDayAverage": round(sum(closes) / len(closes), 2) if closes else None,
                        "averageVolume": round(sum(volumes) / len(volumes)) if volumes else None,
                        "averageVolume10days": round(sum(volumes[-10:]) / len(volumes[-10:])) if len(volumes) >= 10 else None,
                        "regularMarketChangePercent": round(chg_pct, 2),
                        "marketCap": None,
                    }}
                    # Merge any cached identity data (company name, sector, etc.)
                    if cached and cached.get("info", {}).get("identity"):
                        info["identity"] = cached["info"]["identity"]
                    result = {"ticker": ticker, "info": info}
                    self.cache_set(f"company:{ticker}", result)
                    return result

        self.trigger_scrape_in_bg("company_info")
        return {"ticker": ticker, "info": {}, "loading": True}

    def _handle_companies(self, tickers):
        """Handle companies command - returns company info for multiple tickers."""
        results = {}
        for ticker in tickers:
            results[ticker] = self._handle_company(ticker)
        return results
