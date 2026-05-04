"""Scraping error logging utility."""

import os
from datetime import datetime

LOG_FILE = os.path.join(os.path.dirname(__file__), "scraping_errors.log")


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
