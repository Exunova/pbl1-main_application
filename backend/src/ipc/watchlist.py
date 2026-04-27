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
        if cached:
            return cached

        data = self.read_cache_file("company_info", fname)
        if not data:
            self.trigger_scrape_in_bg("company_info")
            return {"ticker": ticker, "info": {}, "loading": True}

        if not data:
            return {"ticker": ticker, "info": {}}

        self.cache_set(f"company:{ticker}", data)
        return data

    def _handle_companies(self, tickers):
        """Handle companies command - returns company info for multiple tickers."""
        results = {}
        for ticker in tickers:
            results[ticker] = self._handle_company(ticker)
        return results
