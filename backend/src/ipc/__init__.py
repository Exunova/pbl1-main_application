"""IPC (Inter-Process Communication) package."""

from .dashboard import DashboardHandler
from .watchlist import WatchlistHandler
from .news import NewsHandler
from .macro import MacroHandler
from .forex import ForexHandler
from .portfolio import PortfolioHandler
from .settings import SettingsHandler

__all__ = [
    "DashboardHandler",
    "WatchlistHandler",
    "NewsHandler",
    "MacroHandler",
    "ForexHandler",
    "PortfolioHandler",
    "SettingsHandler",
]