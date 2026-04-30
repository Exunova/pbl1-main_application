"""Settings handler for scrape control, status, and health check commands."""

from datetime import datetime

from backend.src.ipc.base_page_handler import BasePageHandler
from backend.src.config import SCRAPING_ENABLED


class SettingsHandler(BasePageHandler):

    def handle_command(self, cmd: str, params: dict) -> dict:
        if cmd == "scrape":
            return self.handle_scrape_control(None, params)
        elif cmd == "scrape_status":
            return self.handle_scrape_status(None, params)
        elif cmd == "scrape_latest":
            return self.handle_scrape_latest(None, params)
        elif cmd == "health":
            return self.handle_health(None, params)
        return {}

    def handle_scrape_control(self, client_id, data) -> dict:
        """Start or stop scraping for a specific source.

        Args:
            client_id: Client identifier (unused, for IPCResponse compatibility).
            data: Dictionary containing 'type' key specifying the scraper type
                  (e.g., 'ohlcv', 'news', 'macro', 'forex', 'company_info').

        Returns:
            dict: Status response with 'status' and 'type' keys.
        """
        stype = data.get("type") if isinstance(data, dict) else None
        if not stype:
            return {"error": "Missing type parameter"}

        if not SCRAPING_ENABLED:
            return {
                "status": "disabled",
                "type": stype,
                "message": "Scraping is currently disabled (SCRAPING_ENABLED=False)"
            }

        from backend.src.ipc_main import SCRAPER_MODULES, trigger_scrape_in_bg
        if stype in SCRAPER_MODULES:
            trigger_scrape_in_bg(stype)
            return {"status": "started", "type": stype}
        return {"error": f"Unknown type: {stype}"}

    def handle_scrape_status(self, client_id, data) -> dict:
        """Get current scraping status for all scrapers.

        Args:
            client_id: Client identifier (unused, for IPCResponse compatibility).
            data: Optional dictionary (unused).

        Returns:
            dict: Current scrape status keyed by scraper type.
        """
        from backend.src.ipc_main import get_scrape_status
        return get_scrape_status()

    def handle_scrape_latest(self, client_id, data) -> dict:
        """Trigger incremental scrape for all data types.

        This command triggers all scrapers to run in the background.
        Each scraper will automatically detect if data exists and do gap-fill,
        or perform a full fetch if no data exists.

        Args:
            client_id: Client identifier (unused, for IPCResponse compatibility).
            data: Optional dictionary (unused).

        Returns:
            dict: Status response indicating scrape was triggered for all types.
        """
        from backend.src.ipc_main import SCRAPER_MODULES, trigger_scrape_in_bg
        for stype in SCRAPER_MODULES:
            trigger_scrape_in_bg(stype)
        return {
            "status": "started",
            "type": "all",
            "message": "Incremental scrape triggered for all data types"
        }

    def handle_health(self, client_id, data) -> dict:
        """System health check.

        Args:
            client_id: Client identifier (unused, for IPCResponse compatibility).
            data: Optional dictionary (unused).

        Returns:
            dict: Health status with current timestamp and scraping enabled flag.
        """
        return {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "scraping_enabled": SCRAPING_ENABLED
        }
