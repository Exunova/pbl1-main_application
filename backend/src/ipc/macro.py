from datetime import datetime

from backend.src.ipc.base_page_handler import BasePageHandler


VALID_COUNTRIES = {"US", "ID", "JP", "UK", "DE"}
CACHE_TTL_SECONDS = 24 * 3600  # 24 hours


class MacroHandler(BasePageHandler):

    def handle_command(self, cmd: str, params: dict) -> dict:
        if cmd == "macro":
            return self._handle_macro(params.get("cc", ""))
        return {}

    def _handle_macro(self, cc: str) -> dict:
        """Handle macro command - returns macro events for a country code."""
        country = cc.upper()

        if country not in VALID_COUNTRIES:
            return {"country": country, "name": country, "events": []}

        cache_key = f"macro:{country}"
        cached = self.cache_get(cache_key)
        if cached:
            updated_at_str = cached.get("updated_at") or cached.get("scraped_at")
            if updated_at_str:
                try:
                    updated_at = datetime.fromisoformat(updated_at_str)
                    age = (datetime.now() - updated_at).total_seconds()
                    if age < CACHE_TTL_SECONDS:
                        return cached
                except Exception:
                    pass

        data = self.read_cache_file("macro", f"{cc.lower()}_macro.json")
        if not data:
            self.trigger_scrape_in_bg("macro")
            return {"country": country, "name": country, "events": [], "loading": True}

        if not data:
            return {"country": country, "name": country, "events": []}

        self.cache_set(cache_key, data)
        return data