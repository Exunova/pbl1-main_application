"""Scraping error logging utility."""

import os
import sys
from datetime import datetime

def _get_log_dir():
    """Get log directory, handling frozen executables."""
    if getattr(sys, 'frozen', False):
        return os.path.expanduser("~/.mapro")
    return os.path.dirname(__file__)

LOG_FILE = os.path.join(_get_log_dir(), "scraping_errors.log")


def log_scraping_error(
    source: str, error_message: str, exception: Exception = None
) -> None:
    """Append an error entry to the scraping errors log."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{timestamp}] ERROR: {error_message} | Source: {source}"
    if exception:
        entry += f" | Exception: {type(exception).__name__}: {str(exception)}"
    entry += "\n"

    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(entry)
        f.flush()


def get_error_count() -> int:
    """Return the number of error entries in the log file."""
    if not os.path.exists(LOG_FILE):
        return 0
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        return sum(1 for _ in f)
