"""
MAPRO — Macroeconomic Events Scraper for Investing.com

Usage:
    from macro import scrape_calendar, main

    # Or import the module directly
    import macro.scraper
"""

from macro.scraper import (
    COUNTRY_CONFIG,
    ALL_COUNTRIES,
    OUTPUT_DIR,
    load_cookies,
    save_json,
    parse_impact,
    scrape_calendar,
    main,
)

__all__ = [
    "COUNTRY_CONFIG",
    "ALL_COUNTRIES",
    "OUTPUT_DIR",
    "load_cookies",
    "save_json",
    "parse_impact",
    "scrape_calendar",
    "main",
]
