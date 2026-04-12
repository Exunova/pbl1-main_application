import yfinance as yf
import json
import os
import time
from datetime import datetime

MARKETS = {
    "US": {"index": "^GSPC", "tickers": ["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM"]},
    "ID": {"index": "^JKLQ45", "tickers": ["BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK"]},
    "JP": {"index": "^N225", "tickers": ["7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T"]},
    "GB": {"index": "^FTSE", "tickers": ["AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L"]},
}

def safe_float(val):
    try:
        return round(float(val), 4)
    except:
        return None

def to_filename(ticker):
    return ticker.replace(".", "_").replace("^", "IDX_").replace("-", "_")

def scrape_15m(ticker):
    try:
        df = yf.Ticker(ticker).history(period="30d", interval="15m")
        if df.empty:
            return []
        return [
            {
                "timestamp": str(ts),
                "open":   safe_float(row["Open"]),
                "high":   safe_float(row["High"]),
                "low":    safe_float(row["Low"]),
                "close":  safe_float(row["Close"]),
                "volume": int(row["Volume"])
            }
            for ts, row in df.iterrows()
        ]
    except Exception as e:
        return []

def run(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    summary = {"scraped_at": str(datetime.now()), "markets": {}}

    for market, config in MARKETS.items():
        idx = config["index"]
        idx_15m = scrape_15m(idx)
        fname = f"{to_filename(idx)}.json"
        with open(os.path.join(output_dir, fname), "w", encoding="utf-8") as f:
            json.dump({"ticker": idx, "type": "index", "market": market, "scraped_at": str(datetime.now()), "ohlcv_15m": idx_15m}, f, indent=2, default=str)

        summary["markets"][market] = {"index": idx, "index_15m_count": len(idx_15m), "stocks": {}}

        for ticker in config["tickers"]:
            ohlcv_15m = scrape_15m(ticker)
            fname = f"{to_filename(ticker)}.json"
            with open(os.path.join(output_dir, fname), "w", encoding="utf-8") as f:
                json.dump({"ticker": ticker, "type": "stock", "market": market, "scraped_at": str(datetime.now()), "ohlcv_15m": ohlcv_15m}, f, indent=2, default=str)
            summary["markets"][market]["stocks"][ticker] = {"ohlcv_15m_count": len(ohlcv_15m)}
            time.sleep(2)

    with open(os.path.join(output_dir, "_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)
    return summary
