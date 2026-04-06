"""
MAPRO Scraper — Informasi Perusahaan
Jalankan: python scraper.py
Output  : ../data/company_info/
"""

import yfinance as yf
import json
import os
import time
from datetime import datetime

MARKETS = {
    "US": ["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM"],
    "ID": ["BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK"],
    "JP": ["7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T"],
    "GB": ["AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L"]
}

INFO_FIELDS = {
    "identity":      ["longName","shortName","symbol","quoteType","exchange","market",
                      "currency","sector","industry","fullTimeEmployees","website",
                      "longBusinessSummary","companyOfficers"],
    "price":         ["currentPrice","previousClose","open","dayHigh","dayLow",
                      "bid","ask","fiftyTwoWeekHigh","fiftyTwoWeekLow",
                      "fiftyDayAverage","twoHundredDayAverage",
                      "volume","averageVolume","averageVolume10days",
                      "regularMarketChangePercent","52WeekChange"],
    "valuation":     ["marketCap","enterpriseValue","trailingPE","forwardPE",
                      "priceToBook","priceToSalesTrailing12Months",
                      "trailingEps","forwardEps","bookValue","pegRatio"],
    "profitability": ["profitMargins","operatingMargins","grossMargins",
                      "returnOnEquity","returnOnAssets","revenueGrowth","earningsGrowth",
                      "grossProfits","totalRevenue","netIncomeToCommon",
                      "operatingCashflow","totalCash","totalDebt"],
    "dividend":      ["dividendRate","dividendYield","fiveYearAvgDividendYield",
                      "payoutRatio","exDividendDate","lastDividendValue"],
    "analyst":       ["recommendationKey","recommendationMean","numberOfAnalystOpinions",
                      "targetHighPrice","targetLowPrice","targetMeanPrice","targetMedianPrice"],
    "ownership":     ["sharesOutstanding","floatShares","heldPercentInsiders",
                      "heldPercentInstitutions","lastSplitFactor","lastSplitDate","beta"]
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../data/company_info")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def safe_val(val):
    if val is None:
        return None
    try:
        if isinstance(val, float) and val != val:
            return None
        return val
    except:
        return None


def extract_info(raw):
    return {
        group: {field: safe_val(raw.get(field)) for field in fields}
        for group, fields in INFO_FIELDS.items()
    }


def scrape_financials(tk):
    out = {}
    for attr, key in [("financials","income_statement"),
                      ("balance_sheet","balance_sheet"),
                      ("cashflow","cash_flow")]:
        try:
            df = getattr(tk, attr)
            out[key] = json.loads(df.to_json(date_format="iso")) if df is not None and not df.empty else {}
        except:
            out[key] = {}
    return out


def save_json(data, filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str, ensure_ascii=False)
    print(f"  [OK] Saved: {filename}")


def to_filename(ticker):
    return ticker.replace(".", "_").replace("-", "_")


def main():
    print("=" * 50)
    print("MAPRO Scraper — Company Info")
    print(f"Started: {datetime.now()}")
    print("=" * 50)

    summary = {"scraped_at": str(datetime.now()), "tickers": {}}

    for market, tickers in MARKETS.items():
        print(f"\n[Market: {market}]")
        for ticker in tickers:
            print(f"  Scraping {ticker}...")
            try:
                tk      = yf.Ticker(ticker)
                raw     = tk.info
                result  = {
                    "ticker":     ticker,
                    "market":     market,
                    "scraped_at": str(datetime.now()),
                    "info":       extract_info(raw),
                    "financials": scrape_financials(tk)
                }
                save_json(result, f"{to_filename(ticker)}.json")
                summary["tickers"][ticker] = {
                    "market": market,
                    "name":   raw.get("longName"),
                    "sector": raw.get("sector"),
                    "status": "ok"
                }
            except Exception as e:
                print(f"  [ERROR] {ticker}: {e}")
                summary["tickers"][ticker] = {"market": market, "status": f"error: {e}"}

            time.sleep(0.5)

    save_json(summary, "_summary.json")
    print(f"\n[DONE] {datetime.now()}")


if __name__ == "__main__":
    main()
