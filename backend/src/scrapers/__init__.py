"""Scrapers module for backward compatibility."""

from backend.src.scraping.yahoo_finance import OHLCVScraper, CompanyInfoScraper, ForexScraper
from backend.src.scraping.investing import MacroScraper
from backend.src.scraping.google_news import NewsScraper

__all__ = [
    "OHLCVScraper",
    "CompanyInfoScraper",
    "ForexScraper",
    "MacroScraper",
    "NewsScraper",
]