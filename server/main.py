from flask import Flask, jsonify, request
from flask_cors import CORS
import json, os

app = Flask(__name__)
CORS(app)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

# GET /api/ohlcv/:ticker
@app.route('/api/ohlcv/<ticker>')
def ohlcv(ticker):
    return jsonify({
        "ticker": ticker,
        "market": "US",
        "scraped_at": "2026-04-12T10:00:00Z",
        "ohlcv_15m": [
            { "timestamp": "2026-04-11 09:30:00", "open": 185.0, "high": 186.5, "low": 184.8, "close": 186.2, "volume": 45230000 },
            { "timestamp": "2026-04-11 09:45:00", "open": 186.2, "high": 187.0, "low": 185.9, "close": 186.8, "volume": 42100000 },
            { "timestamp": "2026-04-11 10:00:00", "open": 186.8, "high": 186.9, "low": 185.5, "close": 185.7, "volume": 38900000 },
            { "timestamp": "2026-04-11 10:15:00", "open": 185.7, "high": 186.2, "low": 185.1, "close": 185.9, "volume": 35600000 },
            { "timestamp": "2026-04-11 10:30:00", "open": 185.9, "high": 187.5, "low": 185.8, "close": 187.1, "volume": 41200000 },
        ]
    })

# GET /api/news/:region
@app.route('/api/news/<region>')
def news(region):
    labels = {"US": "S&P 500 / Wall Street", "ID": "LQ45 / IHSG", "JP": "Nikkei 225", "GB": "FTSE 100"}
    return jsonify({
        "region": region.upper(),
        "label": labels.get(region.upper(), region),
        "scraped_at": "2026-04-12T10:00:00Z",
        "articles": [
            { "title": f"Market update: {region} equities rally on strong earnings", "link": "https://example.com/article1", "publisher": "Reuters", "published": "2026-04-12 08:30:00", "thumbnail": { "type": "og", "url": "https://placehold.co/120x63/1c2030/60a5fa?text=Market" } },
            { "title": f"Fed signals patience on rate cuts as {region} inflation cools", "link": "https://example.com/article2", "publisher": "Bloomberg", "published": "2026-04-12 07:15:00", "thumbnail": { "type": "og", "url": "https://placehold.co/120x63/1c2030/60a5fa?text=Fed" } },
            { "title": f"{region} stocks close higher on consumer spending boost", "link": "https://example.com/article3", "publisher": "CNBC", "published": "2026-04-11 16:00:00", "thumbnail": { "type": "og", "url": "https://placehold.co/120x63/1c2030/60a5fa?text=Stocks" } },
        ]
    })

# GET /api/macro/:cc
@app.route('/api/macro/<cc>')
def macro(cc):
    return jsonify({
        "country": cc.upper(),
        "name": {"US": "United States", "ID": "Indonesia", "JP": "Japan", "GB": "United Kingdom"}.get(cc.upper(), cc.upper()),
        "scraped_at": "2026-04-12T06:00:00Z",
        "events": [
            { "name": "Core CPI", "date": "2026-04-12", "time": "08:30", "impact": "high", "actual": "3.1%", "forecast": "3.0%", "previous": "2.9%" },
            { "name": "Retail Sales", "date": "2026-04-12", "time": "10:00", "impact": "medium", "actual": "0.5%", "forecast": "0.4%", "previous": "0.3%" },
            { "name": "Industrial Production", "date": "2026-04-13", "time": "09:00", "impact": "low", "actual": "—", "forecast": "0.2%", "previous": "-0.1%" },
        ]
    })

# GET /api/forex/:pair
@app.route('/api/forex/<pair>')
def forex(pair):
    rates = {"IDR_USD": 15650.0, "JPY_USD": 149.5, "GBP_USD": 0.79, "USD_IDR": 0.000064, "USD_JPY": 0.0067, "USD_GBP": 1.27}
    rate = rates.get(pair.upper().replace('-', '_'), 1.0)
    return jsonify({
        "pair": pair.upper(),
        "label": pair.upper().replace('_', '/'),
        "current_rate": rate,
        "prev_close": rate * 0.998,
        "change_pct": 0.19,
        "scraped_at": "2026-04-12T10:00:00Z"
    })

# GET /api/company/:ticker
@app.route('/api/company/<ticker>')
def company(ticker):
    return jsonify({
        "ticker": ticker,
        "scraped_at": "2026-04-12T10:00:00Z",
        "info": {
            "identity": { "longName": f"{ticker} Inc.", "sector": "Technology", "industry": "Software" },
            "price": { "currentPrice": 186.2, "marketCap": 2900000000000, "beta": 1.24 },
            "valuation": { "trailingPE": 28.5, "priceToBook": 45.2 },
            "profitability": { "profitMargins": 0.24, "returnOnEquity": 1.52 },
            "dividend": { "dividendRate": 0.96, "dividendYield": 0.0052, "payoutRatio": 0.16 },
            "analyst": { "recommendationKey": "buy", "targetMeanPrice": 210.0 }
        }
    })

# GET /api/index/:idx
@app.route('/api/index/<idx>')
def index(idx):
    indices = {
        "^GSPC": {"name": "S&P 500", "country": "US", "current_price": 5234.5, "prev_close": 5200.0, "change_pct": 0.66},
        "^JKLQ45": {"name": "LQ45", "country": "ID", "current_price": 1820.0, "prev_close": 1810.0, "change_pct": 0.55},
        "^N225": {"name": "Nikkei 225", "country": "JP", "current_price": 39500.0, "prev_close": 39200.0, "change_pct": 0.77},
        "^FTSE": {"name": "FTSE 100", "country": "GB", "current_price": 7950.0, "prev_close": 7980.0, "change_pct": -0.38},
    }
    data = indices.get(idx, {"name": idx, "country": "XX", "current_price": 1000.0, "prev_close": 990.0, "change_pct": 1.0})
    return jsonify({**data, "index": idx, "scraped_at": "2026-04-12T10:00:00Z"})

# GET /api/indices
@app.route('/api/indices')
def indices():
    return jsonify([
        {"index": "^GSPC", "name": "S&P 500", "country": "US", "current_price": 5234.5, "prev_close": 5200.0, "change_pct": 0.66},
        {"index": "^JKLQ45", "name": "LQ45", "country": "ID", "current_price": 1820.0, "prev_close": 1810.0, "change_pct": 0.55},
        {"index": "^N225", "name": "Nikkei 225", "country": "JP", "current_price": 39500.0, "prev_close": 39200.0, "change_pct": 0.77},
        {"index": "^FTSE", "name": "FTSE 100", "country": "GB", "current_price": 7950.0, "prev_close": 7980.0, "change_pct": -0.38},
    ])

# Portfolio mock storage (in-memory for mock phase)
positions = [
    {"id": 1, "ticker": "AAPL", "company": "Apple Inc.", "shares": 10, "buyPrice": 175.0, "buyDate": "2026-01-15", "currency": "USD"},
    {"id": 2, "ticker": "BBCA.JK", "company": "Bank Central Asia", "shares": 100, "buyPrice": 8900.0, "buyDate": "2026-02-20", "currency": "IDR"},
]

@app.route('/api/portfolio')
def portfolio_list():
    return jsonify({"positions": positions})

@app.route('/api/portfolio', methods=['POST'])
def portfolio_add():
    data = request.json
    pos = {"id": max(p["id"] for p in positions)+1, **data}
    positions.append(pos)
    return jsonify(pos)

@app.route('/api/portfolio/<int:pid>', methods=['PUT'])
def portfolio_edit(pid):
    for p in positions:
        if p["id"] == pid:
            p.update(request.json)
            return jsonify(p)
    return jsonify({"error": "not found"}), 404

@app.route('/api/portfolio/<int:pid>', methods=['DELETE'])
def portfolio_delete(pid):
    global positions
    positions = [p for p in positions if p["id"] != pid]
    return jsonify({"status": "ok"})

@app.route('/api/portfolio/pnl')
def portfolio_pnl():
    return jsonify({
        "positions": [
            {"ticker": "AAPL", "shares": 10, "buyPrice": 175.0, "currentPrice": 186.2, "currency": "USD", "fxRate": 15650.0, "fxRateAtBuy": 15500.0}
        ],
        "total": {"totalPnL": 1865000, "stockReturn": 112000, "forexReturn": 1753000}
    })

@app.route('/api/portfolio/export')
def portfolio_export():
    return jsonify({"positions": positions})

@app.route('/api/portfolio/import', methods=['POST'])
def portfolio_import():
    data = request.json or {}
    incoming = data.get("positions", [])
    added = 0
    for pos in incoming:
        if all(k in pos for k in ("ticker", "shares", "buyPrice", "buyDate", "currency")):
            pos_copy = dict(pos)
            pos_copy["id"] = max(p["id"] for p in positions)+1 if positions else 1
            positions.append(pos_copy)
            added += 1
    return jsonify({"imported": added, "total": len(positions)})

# POST /api/scrape/:type
@app.route('/api/scrape/<stype>', methods=['POST'])
def scrape(stype):
    return jsonify({"status": "started", "type": stype, "scraped_at": "2026-04-12T10:00:00Z"})

@app.route('/api/scrape/status')
def scrape_status():
    return jsonify({
        "ohlcv": "2026-04-12T10:00:00Z",
        "news": "2026-04-12T10:00:00Z",
        "macro": "2026-04-12T06:00:00Z",
        "forex": "2026-04-12T10:00:00Z",
        "company_info": "2026-04-12T10:00:00Z"
    })

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=3847, debug=False)
