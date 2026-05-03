import os

# =============================================================================
# SCRAPING TOGGLE
# =============================================================================
SCRAPING_ENABLED = False   # change this to False to turn off all scraping

# =============================================================================
# PATH SETUP
# =============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(BASE_DIR)
ROOT_DIR = os.path.dirname(APP_DIR)
DATA_DIR = os.path.join(ROOT_DIR, 'data')
CACHE_DB = os.path.join(APP_DIR, 'cache.db')

# =============================================================================
# SCRAPER CONSTANTS
# =============================================================================

MARKETS = {
    "US": {"index": "^GSPC",   "tickers": ["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM"]},
    "ID": {"index": "^JKLQ45", "tickers": ["BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK"]},
    "JP": {"index": "^N225",   "tickers": ["7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T"]},
    "GB": {"index": "^FTSE",   "tickers": ["AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L"]},
}

NEWS_FEEDS = {
    "US": {"label": "S&P 500 / Wall Street", "url": "https://news.google.com/rss/search?q=%22S%26P+500%22+OR+%22SPX%22+when:1d&hl=en-US&gl=US&ceid=US:en"},
    "ID": {"label": "LQ45 / IHSG", "url": "https://news.google.com/rss/search?q=%22LQ45%22+OR+%22IHSG%22+when:1d&hl=id&gl=ID&ceid=ID:id"},
    "JP": {"label": "Nikkei 225", "url": "https://news.google.com/rss/search?q=%22Nikkei+225%22+OR+%22Nikkei+index%22+when:1d&hl=en&gl=JP&ceid=JP:en"},
    "GB": {"label": "FTSE 100", "url": "https://news.google.com/rss/search?q=%22FTSE+100%22+when:1d&hl=en-GB&gl=GB&ceid=GB:en"},
}

FOREX_PAIRS = {
    "IDR_USD": {"ticker": "IDRUSD=X", "base": "IDR", "quote": "USD", "label": "Indonesian Rupiah / US Dollar"},
    "JPY_USD": {"ticker": "JPYUSD=X", "base": "JPY", "quote": "USD", "label": "Japanese Yen / US Dollar"},
    "GBP_USD": {"ticker": "GBPUSD=X", "base": "GBP", "quote": "USD", "label": "British Pound / US Dollar"},
    "USD_IDR": {"ticker": "USDIDR=X", "base": "USD", "quote": "IDR", "label": "US Dollar / Indonesian Rupiah"},
    "USD_JPY": {"ticker": "USDJPY=X", "base": "USD", "quote": "JPY", "label": "US Dollar / Japanese Yen"},
    "USD_GBP": {"ticker": "USDGBP=X", "base": "USD", "quote": "GBP", "label": "US Dollar / British Pound"},
}

COUNTRY_CONFIG = {
    "US": {"name": "United States", "currency": "USD"},
    "ID": {"name": "Indonesia", "currency": "IDR"},
    "JP": {"name": "Japan", "currency": "JPY"},
    "UK": {"name": "United Kingdom", "currency": "GBP"},
    "DE": {"name": "Germany", "currency": "EUR"},
}

# =============================================================================
# TTL SETTINGS (in seconds)
# =============================================================================
COMPANY_TTL_SECONDS = 86400   # 24 hours
OHLCV_TTL_SECONDS = 3600      # 1 hour
NEWS_TTL_SECONDS = 7200       # 2 hours
MACRO_TTL_SECONDS = 86400     # 24 hours
FOREX_TTL_SECONDS = 3600      # 1 hour
