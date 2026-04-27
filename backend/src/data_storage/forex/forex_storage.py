"""Forex data storage implementation."""

import os
import json
from typing import Optional

from backend.src.data_storage.base_storage_interface import (
    BaseStorageInterface,
    DATA_DIR
)


class ForexStorage(BaseStorageInterface):
    """Storage interface for forex pair data."""

    CATEGORY = "forex"

    def save(self, data: dict, identifier: str) -> None:
        """Save forex data to storage.

        Args:
            data: Dictionary of forex data to save.
            identifier: Forex pair identifier (e.g., 'USD_IDR').
        """
        filepath = self._get_storage_path(self.CATEGORY, identifier)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def load(self, identifier: str) -> Optional[dict]:
        """Load forex data from storage.

        Args:
            identifier: Forex pair identifier (e.g., 'USD_IDR').

        Returns:
            Dictionary of forex data if found, None otherwise.
        """
        filepath = self._get_storage_path(self.CATEGORY, identifier)
        if not os.path.exists(filepath):
            return None
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)

    def list_items(self) -> list[str]:
        """List all available forex pair identifiers.

        Returns:
            List of forex pair strings.
        """
        directory = self._ensure_directory(self.CATEGORY)
        if not os.path.exists(directory):
            return []
        return [
            os.path.splitext(f)[0]
            for f in os.listdir(directory)
            if f.endswith('.json')
        ]