"""Base storage interface for data storage modules."""

import os
from abc import ABC, abstractmethod

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BASE_DIR)
DATA_DIR = os.path.join(ROOT_DIR, 'data')


class BaseStorageInterface(ABC):
    """Abstract base class for data storage implementations."""

    @abstractmethod
    def save(self, data: dict, identifier: str) -> None:
        """Save data to storage.

        Args:
            data: Dictionary of data to save.
            identifier: Unique identifier for the data.
        """
        pass

    @abstractmethod
    def load(self, identifier: str) -> dict | None:
        """Load data from storage.

        Args:
            identifier: Unique identifier for the data.

        Returns:
            Dictionary of data if found, None otherwise.
        """
        pass

    @abstractmethod
    def list_items(self) -> list[str]:
        """List all item identifiers in storage.

        Returns:
            List of identifier strings.
        """
        pass

    def _get_storage_path(self, category: str, identifier: str) -> str:
        """Get full storage path for a category and identifier.

        Args:
            category: Storage category (e.g., 'ohlcv', 'news').
            identifier: Unique identifier for the data.

        Returns:
            Full path to the storage file.
        """
        return os.path.join(self._ensure_directory(category), f"{identifier}.json")

    def _ensure_directory(self, category: str) -> str:
        """Ensure storage directory exists for category.

        Args:
            category: Storage category.

        Returns:
            Path to the category directory.
        """
        path = os.path.join(DATA_DIR, category)
        os.makedirs(path, exist_ok=True)
        return path