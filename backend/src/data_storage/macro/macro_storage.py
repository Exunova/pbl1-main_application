"""Macro data storage implementation."""

import json
import os

from ..base_storage_interface import BaseStorageInterface, DATA_DIR


class MacroStorage(BaseStorageInterface):
    """Storage implementation for macro (country) data."""

    def __init__(self):
        """Initialize macro storage."""
        self.category = "macro"

    def save(self, data: dict, identifier: str) -> None:
        """Save country macro data to storage.

        Args:
            data: Dictionary of macro data to save.
            identifier: Country code (e.g., 'US').
        """
        filepath = os.path.join(self._ensure_directory(self.category), f"{identifier}_macro.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def load(self, identifier: str) -> dict | None:
        """Load country macro data from storage.

        Args:
            identifier: Country code (e.g., 'US').

        Returns:
            Dictionary of macro data if found, None otherwise.
        """
        filepath = os.path.join(self._ensure_directory(self.category), f"{identifier}_macro.json")
        if not os.path.exists(filepath):
            return None
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)

    def list_items(self) -> list[str]:
        """List all available country codes in storage.

        Returns:
            List of country code strings.
        """
        category_path = os.path.join(DATA_DIR, self.category)
        if not os.path.exists(category_path):
            return []
        filenames = [f for f in os.listdir(category_path) if f.endswith('_macro.json')]
        return [f.replace('_macro.json', '') for f in filenames]