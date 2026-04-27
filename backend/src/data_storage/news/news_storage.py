"""News data storage implementation."""

import json
import os

from backend.src.data_storage.base_storage_interface import (
    BaseStorageInterface,
    DATA_DIR,
)


class NewsStorage(BaseStorageInterface):
    """Storage implementation for news data."""

    CATEGORY = "news"

    def save(self, data: dict, identifier: str) -> None:
        """Save news data to storage.

        Args:
            data: Dictionary of news data to save.
            identifier: Region identifier (e.g., 'US', 'ID', 'JP', 'GB').
        """
        file_path = os.path.join(DATA_DIR, self.CATEGORY, f"{identifier}_news.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def load(self, identifier: str) -> dict | None:
        """Load news data from storage.

        Args:
            identifier: Region identifier (e.g., 'US', 'ID', 'JP', 'GB').

        Returns:
            Dictionary of news data if found, None otherwise.
        """
        file_path = os.path.join(DATA_DIR, self.CATEGORY, f"{identifier}_news.json")
        if not os.path.exists(file_path):
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def list_items(self) -> list[str]:
        """List all available news region identifiers.

        Returns:
            List of region identifier strings.
        """
        return ["US", "ID", "JP", "GB"]