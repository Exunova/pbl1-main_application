import yfinance as yf
import json
import os
from datetime import datetime

FOREX_PAIRS = {
    "IDR_USD": {"ticker": "IDRUSD=X", "base": "IDR", "quote": "USD"},
    "JPY_USD": {"ticker": "JPYUSD=X", "base": "JPY", "quote": "USD"},
    "GBP_USD": {"ticker": "GBPUSD=X", "base": "GBP", "quote": "USD"},
    "USD_IDR": {"ticker": "USDIDR=X", "base": "USD", "quote": "IDR"},
    "USD_JPY": {"ticker": "USDJPY=X", "base": "USD", "quote": "JPY"},
    "USD_GBP": {"ticker": "USDGBP=X", "base": "USD", "quote": "GBP"},
}

def safe_float(val, decimals=6):
    try:
        return round(float(val), decimals)
    except:
        return None

def run(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    summary = {"scraped_at": str(datetime.now()), "pairs": {}}

    for pair_key, config in FOREX_PAIRS.items():
        ticker = config["ticker"]
        try:
            tk = yf.Ticker(ticker)
            info = tk.info
            current = safe_float(info.get("currentPrice")) or safe_float(info.get("regularMarketPrice")) or safe_float(info.get("bid"))
            df = tk.history(period="1mo", interval="1d")
            history = []
            if not df.empty:
                for ts, row in df.iterrows():
                    history.append({"date": str(ts.date()), "close": safe_float(row["Close"])})

            data = {
                "pair": pair_key, "ticker": ticker, "base": config["base"], "quote": config["quote"],
                "label": f"{config['base']}/{config['quote']}",
                "scraped_at": str(datetime.now()),
                "current_rate": current,
                "prev_close": safe_float(info.get("previousClose")),
                "change_pct": safe_float(info.get("regularMarketChangePercent"), 4),
                "history_30d": history
            }
            summary["pairs"][pair_key] = {"rate": current, "change": data.get("change_pct"), "status": "ok"}
        except Exception as e:
            data = {"pair": pair_key, "ticker": ticker, "error": str(e), "scraped_at": str(datetime.now())}
            summary["pairs"][pair_key] = {"status": "error"}

        with open(os.path.join(output_dir, f"{pair_key.lower()}.json"), "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    with open(os.path.join(output_dir, "_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)
    return summary
