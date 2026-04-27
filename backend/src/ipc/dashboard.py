"""Dashboard handler for market indices summary."""

from backend.src.ipc.base_page_handler import BasePageHandler


class DashboardHandler(BasePageHandler):

    indices_map = {
        "^GSPC": {"name": "S&P 500", "country": "US"},
        "^JKLQ45": {"name": "LQ45", "country": "ID"},
        "^N225": {"name": "Nikkei 225", "country": "JP"},
        "^FTSE": {"name": "FTSE 100", "country": "GB"}
    }

    def handle_command(self, cmd: str, params: dict) -> dict:
        if cmd == "index":
            idx = params.get("idx")
            return self._handle_index(idx)
        elif cmd == "indices":
            return self._handle_indices()
        return {}

    def _handle_index(self, idx: str) -> dict:
        """Handle index command - returns index summary from OHLCV data."""
        if not idx:
            return {}

        fname = idx.replace(".", "_").replace("^", "IDX_").replace("-", "_") + ".json"
        data = self.read_cache_file("ohlcv", fname)

        meta = self.indices_map.get(idx, {"name": idx, "country": "XX"})

        if data and data.get("ohlcv_15m"):
            candles = data["ohlcv_15m"]
            cur = candles[-1].get("close")
            prv = candles[0].get("close")
            chg = ((cur - prv) / prv * 100) if cur and prv else 0
            return {**meta, "index": idx, "current_price": cur, "prev_close": prv, "change_pct": chg, "scraped_at": data.get("scraped_at", "")}

        return {**meta, "index": idx, "current_price": None, "prev_close": None, "change_pct": 0, "scraped_at": ""}

    def _handle_indices(self) -> list:
        """Handle indices command - returns all 4 indices summary."""
        results = []
        indices_list = [
            ("^GSPC", {"name": "S&P 500", "country": "US"}),
            ("^JKLQ45", {"name": "LQ45", "country": "ID"}),
            ("^N225", {"name": "Nikkei 225", "country": "JP"}),
            ("^FTSE", {"name": "FTSE 100", "country": "GB"})
        ]

        for idx, meta in indices_list:
            fname = idx.replace(".", "_").replace("^", "IDX_").replace("-", "_") + ".json"
            data = self.read_cache_file("ohlcv", fname)
            if data and data.get("ohlcv_15m"):
                candles = data["ohlcv_15m"]
                cur = candles[-1].get("close")
                prv = candles[0].get("close")
                chg = ((cur - prv) / prv * 100) if cur and prv else 0
                results.append({**meta, "index": idx, "current_price": cur, "prev_close": prv, "change_pct": chg, "scraped_at": data.get("scraped_at", "")})
            else:
                results.append({**meta, "index": idx, "current_price": None, "prev_close": None, "change_pct": 0, "scraped_at": ""})

        return results
