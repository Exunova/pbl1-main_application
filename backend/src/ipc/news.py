"""News handler for IPC framework."""
from .base_page_handler import BasePageHandler


class NewsHandler(BasePageHandler):
    """Handler for news commands."""

    LABELS = {
        "US": "S&P 500 / Wall Street",
        "ID": "LQ45 / IHSG",
        "JP": "Nikkei 225",
        "GB": "FTSE 100",
    }

    VALID_REGIONS = {"US", "ID", "JP", "GB"}

    def handle_command(self, cmd: str, params: dict) -> dict:
        """Handle news command.

        Args:
            cmd: Command name (should be 'news')
            params: Dict with 'region' key

        Returns:
            Dict with region, label, articles, and optionally loading flag
        """
        if cmd != "news":
            return {}

        region = params.get("region", "").upper()
        if region not in self.VALID_REGIONS:
            return {}

        # Check cache first
        cached = self.cache_get(f"news:{region}")
        if cached:
            return cached

        # Read from cache file
        data = self.read_cache_file("news", f"{region.lower()}_news.json")
        if not data:
            self.trigger_scrape_in_bg("news")
            return {
                "region": region,
                "market": self.LABELS.get(region, region),
                "label": self.LABELS.get(region, region),
                "articles": [],
                "loading": True,
            }

        # Sort articles descending by published timestamp
        articles = data.get("articles", [])
        if articles:
            articles = sorted(
                articles,
                key=lambda a: a.get("published", ""),
                reverse=True,
            )

            # Ensure thumbnails use og:image type
            for article in articles:
                if "thumbnail" in article and article["thumbnail"].get("type") != "og:image":
                    article["thumbnail"]["type"] = "og:image"

        result = {
            "region": region,
            "market": self.LABELS.get(region, region),
            "label": self.LABELS.get(region, region),
            "articles": articles,
        }

        self.cache_set(f"news:{region}", result)
        return result