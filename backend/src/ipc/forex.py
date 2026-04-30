from datetime import datetime

from backend.src.ipc.base_page_handler import BasePageHandler


VALID_PAIRS = {"IDR_USD", "JPY_USD", "GBP_USD", "USD_IDR", "USD_JPY", "USD_GBP"}


class ForexHandler(BasePageHandler):

    def handle_command(self, cmd: str, params: dict) -> dict:
        if cmd == "forex":
            return self._handle_forex(params.get("pair"))
        return {}

    def _handle_forex(self, pair):
        if not pair:
            return {"pair": None, "current_rate": None, "change_pct": 0}

        pair_upper = pair.upper()
        if pair_upper not in VALID_PAIRS:
            return {"pair": pair_upper, "current_rate": None, "change_pct": 0}

        cached = self.cache_get(f"forex:{pair_upper}")
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

        fname = f"{pair_upper.lower()}.json"
        data = self.read_cache_file("forex", fname)
        if not data:
            self.trigger_scrape_in_bg("forex")
            return {"pair": pair_upper, "current_rate": None, "change_pct": 0, "loading": True}

        if not data:
            return {"pair": pair_upper, "current_rate": None, "change_pct": 0}

        self.cache_set(f"forex:{pair_upper}", data)
        return data