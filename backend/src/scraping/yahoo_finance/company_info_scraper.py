"""
CompanyInfoScraper — Yahoo Finance company information scraper.
Inherits from BaseScraper and extracts company info, financials for multiple markets.
"""

import json
import os
import time
from datetime import datetime
from typing import Dict

import yfinance as yf

from backend.src.scraping.base_scraper import BaseScraper

MARKETS = {
    "US": ["NVDA", "AAPL", "GOOGL", "MSFT", "AMZN", "META", "TSLA", "BRK-B", "LLY", "JPM"],
    "ID": ["BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK", "ASII.JK", "BBNI.JK", "PGAS.JK", "ADRO.JK", "UNVR.JK", "KLBF.JK"],
    "JP": ["7203.T", "8306.T", "6758.T", "9984.T", "6501.T", "8316.T", "9983.T", "6857.T", "8035.T", "8058.T"],
    "GB": ["AZN.L", "HSBA.L", "SHEL.L", "BATS.L", "GSK.L", "BP.L", "BARC.L", "LLOY.L", "NG.L", "REL.L"],
}

INFO_FIELDS = {
    "identity":      ["longName", "shortName", "symbol", "quoteType", "exchange", "market",
                      "currency", "sector", "industry", "fullTimeEmployees", "website",
                      "longBusinessSummary", "companyOfficers"],
    "price":         ["currentPrice", "previousClose", "open", "dayHigh", "dayLow",
                      "bid", "ask", "fiftyTwoWeekHigh", "fiftyTwoWeekLow",
                      "fiftyDayAverage", "twoHundredDayAverage",
                      "volume", "averageVolume", "averageVolume10days",
                      "regularMarketChangePercent", "52WeekChange"],
    "valuation":     ["marketCap", "enterpriseValue", "trailingPE", "forwardPE",
                      "priceToBook", "priceToSalesTrailing12Months",
                      "trailingEps", "forwardEps", "bookValue", "pegRatio"],
    "profitability": ["profitMargins", "operatingMargins", "grossMargins",
                      "returnOnEquity", "returnOnAssets", "revenueGrowth", "earningsGrowth",
                      "grossProfits", "totalRevenue", "netIncomeToCommon",
                      "operatingCashflow", "totalCash", "totalDebt"],
    "dividend":      ["dividendRate", "dividendYield", "fiveYearAvgDividendYield",
                      "payoutRatio", "exDividendDate", "lastDividendValue"],
    "analyst":       ["recommendationKey", "recommendationMean", "numberOfAnalystOpinions",
                      "targetHighPrice", "targetLowPrice", "targetMeanPrice", "targetMedianPrice"],
    "ownership":     ["sharesOutstanding", "floatShares", "heldPercentInsiders",
                      "heldPercentInstitutions", "lastSplitFactor", "lastSplitDate", "beta"]
}

COMPANY_TTL_SECONDS = 86400  # 24 hours


def safe_val(val):
    """Return None for None, NaN floats, or unserializable values."""
    if val is None:
        return None
    try:
        if isinstance(val, float) and val != val:  # NaN check
            return None
        return val
    except Exception:
        return None


def extract_info(raw):
    """Extract grouped info fields from raw yfinance info dict."""
    return {
        group: {field: safe_val(raw.get(field)) for field in fields}
        for group, fields in INFO_FIELDS.items()
    }


def scrape_financials(tk):
    """Fetch income_stmt, balance_sheet, cashflow and convert DataFrames to JSON."""
    out = {}
    for attr, key in [
        ("income_stmt", "income_statement"),
        ("balance_sheet", "balance_sheet"),
        ("cashflow", "cash_flow")
    ]:
        try:
            df = getattr(tk, attr)
            if df is not None and not df.empty:
                out[key] = json.loads(df.to_json(date_format="iso"))
            else:
                out[key] = {}
        except Exception:
            out[key] = {}
    return out


def to_filename(ticker):
    """Convert ticker symbol to safe filename."""
    return ticker.replace(".", "_").replace("-", "_")


class CompanyInfoScraper(BaseScraper):
    """Scraper for Yahoo Finance company information across multiple markets."""

    TTL_SECONDS = COMPANY_TTL_SECONDS

    def __init__(self) -> None:
        super().__init__()

    def scraper_key(self) -> str:
        """Return unique cache key for this scraper."""
        return "company_info"

    def run(self, output_dir: str) -> dict:
        """
        Main entry point for the scraper.

        Args:
            output_dir: Directory to write JSON files to (e.g., /home/reiyo/Project/PBL1/pbl1-main_application/data)

        Returns:
            Summary dict with scraped_at timestamp and per-ticker status.
        """
        self.set_output_dir(output_dir)
        os.makedirs(output_dir, exist_ok=True)

        print("=" * 50)
        print("MAPRO Scraper — Company Info")
        print(f"Started: {datetime.now()}")
        print(f"Output directory: {output_dir}")
        print("=" * 50)

        summary = {
            "scraped_at": str(datetime.now()),
            "tickers": {}
        }

        for market, tickers in MARKETS.items():
            print(f"\n[Market: {market}]")
            for ticker in tickers:
                print(f"  Scraping {ticker}...", end=" ")
                ticker_filename = to_filename(ticker)

                fresh, result = self.is_cache_fresh(f"company:{ticker}")
                if fresh and result:
                    print("OK (cache)")
                    summary["tickers"][ticker] = {
                        "market": market,
                        "name": result.get("info", {}).get("identity", {}).get("longName"),
                        "sector": result.get("info", {}).get("identity", {}).get("sector"),
                        "status": "ok"
                    }
                else:
                    try:
                        tk = yf.Ticker(ticker)
                        raw = tk.info

                        result = {
                            "ticker": ticker,
                            "market": market,
                            "scraped_at": str(datetime.now()),
                            "updated_at": datetime.now().isoformat(),
                            "info": extract_info(raw),
                            "financials": scrape_financials(tk)
                        }

                        self._cache_db.cache_set(f"company:{ticker}", result)

                        print("OK")
                        summary["tickers"][ticker] = {
                            "market": market,
                            "name": raw.get("longName"),
                            "sector": raw.get("sector"),
                            "status": "ok"
                        }
                    except Exception as e:
                        print(f"ERROR: {e}")
                        summary["tickers"][ticker] = {
                            "market": market,
                            "status": f"error: {e}"
                        }

                filename = f"{ticker_filename}.json"
                filepath = os.path.join(output_dir, filename)
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=2, default=str, ensure_ascii=False)

                time.sleep(0.5)

        summary_path = os.path.join(output_dir, "_summary.json")
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, default=str, ensure_ascii=False)

        print(f"\n[DONE] {datetime.now()}")
        print(f"Total tickers processed: {len(summary['tickers'])}")

        return summary