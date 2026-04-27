"""OHLCV data storage implementation."""

import json
import os

from ..base_storage_interface import BaseStorageInterface, DATA_DIR
from ...scrapers.ohlcv_scraper import to_filename


class OHLCVStorage(BaseStorageInterface):
    """Storage implementation for OHLCV ticker data."""

    def __init__(self):
        """Initialize OHLCV storage."""
        self.category = "ohlcv"

    def save(self, data: dict, identifier: str) -> None:
        """Save ticker OHLCV data to storage.

        Args:
            data: Dictionary of OHLCV data to save.
            identifier: Ticker symbol (e.g., 'AAPL').
        """
        filename = to_filename(identifier)
        filepath = os.path.join(self._ensure_directory(self.category), f"{filename}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def load(self, identifier: str) -> dict | None:
        """Load ticker OHLCV data from storage.

        Args:
            identifier: Ticker symbol (e.g., 'AAPL').

        Returns:
            Dictionary of OHLCV data if found, None otherwise.
        """
        filename = to_filename(identifier)
        filepath = os.path.join(self._ensure_directory(self.category), f"{filename}.json")
        if not os.path.exists(filepath):
            return None
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)

    def list_items(self) -> list[str]:
        """List all available ticker symbols in storage.

        Returns:
            List of ticker symbol strings.
        """
        category_path = os.path.join(DATA_DIR, self.category)
        if not os.path.exists(category_path):
            return []
        filenames = [f for f in os.listdir(category_path) if f.endswith('.json')]
        return [os.path.splitext(f)[0] for f in filenames]