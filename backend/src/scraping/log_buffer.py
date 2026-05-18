"""Thread-safe bounded log buffer for scraping operations."""

import threading
from collections import deque
from datetime import datetime
from typing import List, Dict


class ScrapeLogBuffer:
    """Bounded thread-safe log buffer for scrape events."""

    def __init__(self, maxlen: int = 100) -> None:
        self._buffer: deque[Dict] = deque(maxlen=maxlen)
        self._lock = threading.Lock()

    def add(self, type_: str, message: str) -> None:
        """Add a log entry with current timestamp."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": type_,
            "message": message,
        }
        with self._lock:
            self._buffer.append(entry)

    def get_logs(self) -> List[Dict]:
        """Return a copy of current log entries as a list."""
        with self._lock:
            return list(self._buffer)

    def clear(self) -> None:
        """Clear all log entries."""
        with self._lock:
            self._buffer.clear()


# Global singleton instance for use across scrapers
scrape_log_buffer = ScrapeLogBuffer(maxlen=100)
