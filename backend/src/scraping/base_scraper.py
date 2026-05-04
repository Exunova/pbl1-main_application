"""Base scraper abstract class for all data scrapers."""

import json
import os
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.src.db.cache_database import CacheDatabase
from backend.src.scraping.logging_util import log_scraping_error


class BaseScraper(ABC):
    """Abstract base class for all scrapers. Provides shared caching and data merge logic."""

    TTL_SECONDS: int = 3600  # Override in subclass

    def __init__(self) -> None:
        self._cache_db: CacheDatabase = CacheDatabase()

    @property
    def cache_db(self) -> CacheDatabase:
        return self._cache_db

    @abstractmethod
    def scraper_key(self) -> str:
        """Return unique cache key for this scraper."""
        pass

    @abstractmethod
    def run(self, output_dir: str) -> dict:
        """
        Run the scraper and return result dict.

        Args:
            output_dir: Directory to write output files

        Returns:
            dict with at least 'success' bool and 'data' key
        """
        try:
            pass
        except Exception as e:
            log_scraping_error(self.scraper_key(), str(e), e)
            raise

    def is_cache_fresh(self, key: str) -> tuple[bool, Optional[dict]]:
        """
        Check if cache entry exists and is within TTL.

        Args:
            key: Cache key to check

        Returns:
            (is_fresh, cached_data) tuple. data is None if not fresh.
        """
        cached = self._cache_db.cache_get(key)
        if cached is None:
            return False, None
        updated_at_str = cached.get("updated_at") or cached.get("scraped_at")
        if not updated_at_str:
            return False, None
        try:
            updated_at = datetime.fromisoformat(updated_at_str)
            age = datetime.now() - updated_at
            if age.total_seconds() < self.TTL_SECONDS:
                return True, cached
        except Exception:
            pass
        return False, None

    def _parse_timestamp(self, ts_str: str) -> Optional[datetime]:
        """Parse timestamp string to datetime. Handles various formats."""
        if not ts_str:
            return None
        try:
            return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        except Exception:
            pass
        try:
            return datetime.fromisoformat(ts_str)
        except Exception:
            pass
        try:
            return datetime.strptime(ts_str.split(".")[0], "%Y-%m-%d %H:%M:%S")
        except Exception:
            return None

    def get_last_timestamp(self, data: List[dict]) -> Optional[datetime]:
        """
        Get the last timestamp from a list of data records.

        Args:
            data: List of dicts with 'timestamp' or similar field

        Returns:
            Last datetime, or None if not found
        """
        if not data or not isinstance(data, list):
            return None
        last_ts: Optional[datetime] = None
        for bar in data:
            ts = self._parse_timestamp(bar.get("timestamp", ""))
            if ts:
                if last_ts is None or ts > last_ts:
                    last_ts = ts
        return last_ts

    def merge_data(self, existing: List[dict], new: List[dict]) -> List[dict]:
        """
        Merge new records with existing, avoiding duplicates by timestamp.
        Returns merged list sorted by timestamp.

        Args:
            existing: Existing data list
            new: New data list to merge in

        Returns:
            Merged list sorted by timestamp
        """
        if not existing:
            return new
        if not new:
            return existing

        seen_timestamps: set = set()
        merged: List[dict] = []

        for bar in existing:
            ts_str = bar.get("timestamp", "")
            if ts_str not in seen_timestamps:
                seen_timestamps.add(ts_str)
                merged.append(bar)

        for bar in new:
            ts_str = bar.get("timestamp", "")
            if ts_str not in seen_timestamps:
                seen_timestamps.add(ts_str)
                merged.append(bar)

        def sort_key(bar: dict) -> datetime:
            ts = self._parse_timestamp(bar.get("timestamp", ""))
            return ts if ts else datetime.min

        merged.sort(key=sort_key)
        return merged

    def save_json(self, data: dict, filename: str) -> None:
        """
        Write data dict to JSON file in output_dir.

        Args:
            data: Data to serialize
            filename: Filename within output_dir
        """
        path = os.path.join(self.output_dir, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    @property
    def output_dir(self) -> str:
        """Return the configured output directory. Override via run()."""
        return self._output_dir

    def set_output_dir(self, output_dir: str) -> None:
        self._output_dir = output_dir
