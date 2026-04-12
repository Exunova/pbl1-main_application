import yfinance as yf
import json
import os
import time
from datetime import datetime

MARKETS_TICKERS = {
    "US": ["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM"],
    "ID": ["BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK"],
    "JP": ["7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T"],
    "GB": ["AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L"]
}

INFO_FIELDS = {
    "identity":      ["longName","shortName","symbol","quoteType","exchange","market","currency","sector","industry","fullTimeEmployees","website","longBusinessSummary"],
    "price":         ["currentPrice","previousClose","open","dayHigh","dayLow","bid","ask","fiftyTwoWeekHigh","fiftyTwoWeekLow","fiftyDayAverage","twoHundredDayAverage","volume","averageVolume","regularMarketChangePercent"],
    "valuation":     ["marketCap","enterpriseValue","trailingPE","forwardPE","priceToBook","priceToSalesTrailing12Months","trailingEps","forwardEps","bookValue","pegRatio"],
    "profitability": ["profitMargins","operatingMargins","grossMargins","returnOnEquity","returnOnAssets","revenueGrowth","grossProfits","totalRevenue","netIncomeToCommon"],
    "dividend":      ["dividendRate","dividendYield","fiveYearAvgDividendYield","payoutRatio","exDividendDate","lastDividendValue"],
    "analyst":       ["recommendationKey","recommendationMean","numberOfAnalystOpinions","targetHighPrice","targetLowPrice","targetMeanPrice","targetMedianPrice"],
    "ownership":     ["sharesOutstanding","floatShares","heldPercentInsiders","heldPercentInstitutions","beta"]
}

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
    return {group: {field: safe_val(raw.get(field)) for field in fields} for group, fields in INFO_FIELDS.items()}

def to_filename(ticker):
    return ticker.replace(".", "_").replace("-", "_")

def run(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    summary = {"scraped_at": str(datetime.now()), "tickers": {}}

    for market, tickers in MARKETS_TICKERS.items():
        for ticker in tickers:
            try:
                tk = yf.Ticker(ticker)
                raw = tk.info
                result = {
                    "ticker": ticker, "market": market, "scraped_at": str(datetime.now()),
                    "info": extract_info(raw)
                }
                with open(os.path.join(output_dir, f"{to_filename(ticker)}.json"), "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=2, default=str, ensure_ascii=False)
                summary["tickers"][ticker] = {"market": market, "name": raw.get("longName"), "sector": raw.get("sector"), "status": "ok"}
            except Exception as e:
                summary["tickers"][ticker] = {"market": market, "status": f"error: {e}"}
            time.sleep(0.5)

    with open(os.path.join(output_dir, "_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)
    return summary
