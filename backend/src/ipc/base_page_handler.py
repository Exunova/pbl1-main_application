import os
import json
import threading
from abc import ABC, abstractmethod
from typing import Optional

from backend.src.db.cache_database import CacheDatabase
from backend.src.config import SCRAPING_ENABLED


db = CacheDatabase()


class BasePageHandler(ABC):

    _cache_db: Optional[CacheDatabase] = None

    def __init__(self) -> None:
        self._cache_db = db

    @abstractmethod
    def handle_command(self, cmd: str, params: dict) -> dict:
        ...

    def get_data_path(self, category: str, filename: str) -> str:
        data_dir = os.environ.get(
            "DATA_DIR",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data"),
        )
        d = os.path.join(data_dir, category)
        os.makedirs(d, exist_ok=True)
        return os.path.join(d, filename)

    def read_cache_file(self, category: str, filename: str) -> Optional[dict]:
        path = self.get_data_path(category, filename)
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return None

    def cache_set(self, key: str, data: dict) -> None:
        if self._cache_db is None:
            return
        try:
            self._cache_db.set(key, data)
        except Exception:
            pass

    def cache_get(self, key: str) -> Optional[dict]:
        if self._cache_db is None:
            return None
        try:
            return self._cache_db.get(key)
        except Exception:
            return None

    def trigger_scrape_in_bg(self, scraper_key: str) -> None:
        if not SCRAPING_ENABLED:
            return

        from backend.src.ipc_main import SCRAPER_MODULES, scrape_lock, active_scrapers, set_scrape_status

        with scrape_lock:
            if scraper_key in active_scrapers:
                return
            active_scrapers.add(scraper_key)

        def run():
            try:
                scraper_mod, output_dir = SCRAPER_MODULES[scraper_key]
                result = scraper_mod.run(output_dir)
                status = result.get("scraped_at") if isinstance(result, dict) else None
                if status:
                    set_scrape_status(scraper_key, status)
            except Exception as e:
                set_scrape_status(scraper_key, f"error: {e}")
            finally:
                with scrape_lock:
                    active_scrapers.discard(scraper_key)

        t = threading.Thread(target=run, daemon=True)
        t.start()