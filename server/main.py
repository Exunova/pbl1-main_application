from flask import Flask, jsonify, request
from flask_cors import CORS
import json, os, threading
from datetime import datetime

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

scrape_status = {"ohlcv": None, "news": None, "macro": None, "forex": None, "company_info": None}
scrape_lock = threading.Lock()

def get_data_path(category, filename):
    d = os.path.join(DATA_DIR, category)
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, filename)

def read_cache(category, filename):
    path = get_data_path(category, filename)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return None

def trigger_scrape_in_bg(scraper_fn, key, output_dir):
    def run():
        with scrape_lock:
            try:
                result = scraper_fn(output_dir)
                scrape_status[key] = result.get("scraped_at") if isinstance(result, dict) else datetime.now().isoformat()
            except Exception as e:
                app.logger.error(f"Scrape error {key}: {e}")
    t = threading.Thread(target=run, daemon=True)
    t.start()

@app.route('/api/ohlcv/<ticker>')
def ohlcv(ticker):
    fname = ticker.replace(".", "_").replace("^", "IDX_").replace("-", "_") + ".json"
    data = read_cache("ohlcv", fname)
    if not data:
        from . import ohlcv_scraper
        ohlcv_scraper.run(os.path.join(DATA_DIR, "ohlcv"))
        data = read_cache("ohlcv", fname)
    if not data:
        return jsonify({"ticker": ticker, "ohlcv_15m": []})
    return jsonify(data)

@app.route('/api/news/<region>')
def news(region):
    data = read_cache("news", f"{region.lower()}_news.json")
    if not data:
        from . import news_scraper
        news_scraper.run(os.path.join(DATA_DIR, "news"))
        data = read_cache("news", f"{region.lower()}_news.json")
    if not data:
        labels = {"US": "S&P 500 / Wall Street", "ID": "LQ45 / IHSG", "JP": "Nikkei 225", "GB": "FTSE 100"}
        return jsonify({"region": region.upper(), "label": labels.get(region.upper(), region), "articles": []})
    return jsonify(data)

@app.route('/api/macro/<cc>')
def macro(cc):
    data = read_cache("macro", f"{cc.lower()}_macro.json")
    if not data:
        from . import macro_scraper
        macro_scraper.run(os.path.join(DATA_DIR, "macro"))
        data = read_cache("macro", f"{cc.lower()}_macro.json")
    if not data:
        return jsonify({"country": cc.upper(), "name": cc.upper(), "events": []})
    return jsonify(data)

@app.route('/api/forex/<pair>')
def forex(pair):
    data = read_cache("forex", f"{pair.lower()}.json")
    if not data:
        from . import forex_scraper
        forex_scraper.run(os.path.join(DATA_DIR, "forex"))
        data = read_cache("forex", f"{pair.lower()}.json")
    if not data:
        return jsonify({"pair": pair.upper(), "current_rate": None, "change_pct": 0})
    return jsonify(data)

@app.route('/api/company/<ticker>')
def company(ticker):
    fname = ticker.replace(".", "_").replace("-", "_") + ".json"
    data = read_cache("company_info", fname)
    if not data:
        from . import company_info_scraper
        company_info_scraper.run(os.path.join(DATA_DIR, "company_info"))
        data = read_cache("company_info", fname)
    if not data:
        return jsonify({"ticker": ticker, "info": {}})
    return jsonify(data)

@app.route('/api/index/<idx>')
def index(idx):
    fname = idx.replace(".", "_").replace("^", "IDX_").replace("-", "_") + ".json"
    data = read_cache("ohlcv", fname)
    indices_map = {"^GSPC": {"name": "S&P 500", "country": "US"}, "^JKLQ45": {"name": "LQ45", "country": "ID"}, "^N225": {"name": "Nikkei 225", "country": "JP"}, "^FTSE": {"name": "FTSE 100", "country": "GB"}}
    meta = indices_map.get(idx, {"name": idx, "country": "XX"})
    if data and data.get("ohlcv_15m"):
        candles = data["ohlcv_15m"]
        cur = candles[-1].get("close")
        prv = candles[0].get("close")
        chg = ((cur - prv) / prv * 100) if cur and prv else 0
        return jsonify({**meta, "index": idx, "current_price": cur, "prev_close": prv, "change_pct": chg, "scraped_at": data.get("scraped_at", "")})
    return jsonify({**meta, "index": idx, "current_price": None, "prev_close": None, "change_pct": 0})

@app.route('/api/indices')
def indices():
    results = []
    for idx, meta in [("^GSPC",{"name":"S&P 500","country":"US"}),("^JKLQ45",{"name":"LQ45","country":"ID"}),("^N225",{"name":"Nikkei 225","country":"JP"}),("^FTSE",{"name":"FTSE 100","country":"GB"})]:
        fname = idx.replace(".", "_").replace("^", "IDX_").replace("-", "_") + ".json"
        data = read_cache("ohlcv", fname)
        if data and data.get("ohlcv_15m"):
            candles = data["ohlcv_15m"]
            cur = candles[-1].get("close")
            prv = candles[0].get("close")
            chg = ((cur - prv) / prv * 100) if cur and prv else 0
            results.append({"index": idx, **meta, "current_price": cur, "prev_close": prv, "change_pct": chg})
        else:
            results.append({"index": idx, **meta, "current_price": None, "prev_close": None, "change_pct": 0})
    return jsonify(results)

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
        "positions": [{"ticker": p["ticker"], "shares": p["shares"], "buyPrice": p["buyPrice"], "currentPrice": 186.2, "currency": p["currency"], "fxRate": 15650.0, "fxRateAtBuy": 15500.0} for p in positions],
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

@app.route('/api/scrape/<stype>', methods=['POST'])
def scrape(stype):
    dirs = {"ohlcv": os.path.join(DATA_DIR,"ohlcv"), "news": os.path.join(DATA_DIR,"news"), "macro": os.path.join(DATA_DIR,"macro"), "forex": os.path.join(DATA_DIR,"forex"), "company_info": os.path.join(DATA_DIR,"company_info")}
    scraper_mods = {
        "ohlcv": ("scrapers.ohlcv_scraper", "ohlcv_scraper"),
        "news": ("scrapers.news_scraper", "news_scraper"),
        "macro": ("scrapers.macro_scraper", "macro_scraper"),
        "forex": ("scrapers.forex_scraper", "forex_scraper"),
        "company_info": ("scrapers.company_info_scraper", "company_info_scraper"),
    }
    if stype in scraper_mods:
        mod_path, mod_name = scraper_mods[stype]
        mod = __import__(mod_path, fromlist=[mod_name])
        trigger_scrape_in_bg(getattr(mod, mod_name).run, stype, dirs[stype])
        return jsonify({"status": "started", "type": stype})
    return jsonify({"error": "unknown type"}), 400

@app.route('/api/scrape/status')
def scrape_status_route():
    return jsonify(scrape_status)

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=3847, debug=False)
