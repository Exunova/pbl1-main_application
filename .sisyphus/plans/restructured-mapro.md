# MAPRO Restructure Plan — Unifying Proto + Main Application

> **Objective**: Unify `pbl1-proto` (Electron/React frontend) with `pbl1-main_application` (Python scrapers + data) into one coherent codebase under `pbl1-main_application`, then delete `pbl1-proto`.

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ELECTRON SHELL (main process)                │
│                                                                  │
│  ┌────────────────────────────┐  ┌──────────────────────────┐  │
│  │   PYTHON BACKEND (Flask)    │  │   REACT FRONTEND         │  │
│  │   127.0.0.1:3847           │  │   (Renderer Process)      │  │
│  │                            │  │                          │  │
│  │  ┌──────────────────────┐ │  │  ┌────────────────────┐  │  │
│  │  │  IPC API Routes       │ │  │  │  React App         │  │  │
│  │  │  GET /api/ohlcv/:ticker│ │  │  │  GlobeView (D3 2D) │  │  │
│  │  │  GET /api/news/:region │ │  │  │  ScreenerView     │  │  │
│  │  │  GET /api/macro/:cc   │ │  │  │  CompareView      │  │  │
│  │  │  GET /api/forex/:pair │ │  │  │  PortfolioView    │  │  │
│  │  │  GET /api/company/:t  │ │  │  │  StockDetailPanel │  │  │
│  │  │  GET /api/index/:idx  │ │  │  └────────────────────┘  │  │
│  │  └──────────────────────┘ │  │  ▲                       │  │
│  │  ┌──────────────────────┐ │  │  │ IPC (fetch)           │  │
│  │  │  SQLite DB           │ │  │  └──────────────────────┘  │  │
│  │  │  - positions table   │ │◄┼──│  preload/index.js       │  │
│  │  │  - settings table     │ │  │                          │  │
│  │  └──────────────────────┘ │  │                          │  │
│  │  ┌──────────────────────┐ │  │                          │  │
│  │  │  Scraper Runners     │ │  │                          │  │
│  │  │  (child_process)     │ │  │                          │  │
│  │  │  ohlcv_scraper.py    │ │  │                          │  │
│  │  │  news_scraper.py     │ │  │                          │  │
│  │  │  macro_scraper.py    │ │  │                          │  │
│  │  │  forex_scraper.py    │ │  │                          │  │
│  │  │  company_info/scraper│ │  │                          │  │
│  │  └──────────────────────┘ │  │                          │  │
│  └────────────────────────────┘  │                          │  │
└─────────────────────────────────────────────────────────────────┘
```

### Stack per layer

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron (same as proto) |
| Frontend | React 19 + Vite + Tailwind CSS 3.4 + React Router 7 |
| Map/Globe | D3.js 2D choropleth (NOT globe.gl / Three.js) |
| Charts | Recharts 3.8 (area, line, candlestick) |
| Backend | Python Flask |
| Database | SQLite (via Python `sqlite3`) + `better-sqlite3` for portfolio |
| Data | JSON cache + Python scrapers |

---

## 2. Folder Structure

```
pbl1-main_application/
│
├── electron/                          # Electron main + preload
│   ├── main.js                         # BrowserWindow, IPC handlers, Flask spawning
│   ├── preload.js                      # Context bridge (window.api)
│   └── db.js                          # SQLite via better-sqlite3 (portfolio positions)
│
├── src/                               # React frontend (renderer)
│   ├── index.html
│   ├── main.jsx                       # React entry
│   ├── App.jsx                        # Layout: Titlebar + Sidebar + Routes
│   ├── index.css                      # Tailwind + custom scrollbar
│   │
│   ├── components/                     # Shared UI components
│   │   ├── Titlebar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── StockCard.jsx
│   │   ├── CandlestickChart.jsx       # Recharts candlestick
│   │   ├── Sparkline.jsx
│   │   ├── EconomicCalendar.jsx
│   │   ├── ForexTable.jsx
│   │   ├── MacroNewsPanel.jsx
│   │   ├── MarketHeatmap.jsx
│   │   └── StockDetailModal.jsx       # ← StockDetailPanel IS AN OVERLAY/MODAL, NOT A PAGE ROUTE
│   │
│   ├── pages/
│   │   ├── GlobeView.jsx              # D3.js 2D choropleth world map
│   │   ├── ScreenerView.jsx           # Stock grid + stock search + access to StockDetailModal
│   │   ├── CompareView.jsx            # Two-index overlay + heatmap + news per index
│   │   └── PortfolioView.jsx          # Position CRUD
│   │
│   └── data/
│       └── mockData.js                 # Fallback/mock data (used when Flask offline)
│
├── server/                            # Python Flask backend
│   ├── main.py                        # Flask app, CORS, route definitions
│   │
│   ├── scrapers/                       # Python scraper modules
│   │   ├── __init__.py
│   │   ├── ohlcv_scraper.py           # yfinance OHLCV fetcher
│   │   ├── news_scraper.py            # Google News RSS parser
│   │   ├── company_info_scraper.py    # yfinance fundamentals
│   │   ├── macro_scraper.py           # Investing.com calendar via Playwright
│   │   └── forex_scraper.py           # yfinance forex pairs
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── sqlite.py                  # Python sqlite3 wrapper (read JSON cache, serve via API)
│   │   └── portfolio.py              # Portfolio CRUD (add/edit/delete/get positions)
│   │
│   └── requirements.txt
│
├── data/                              # Scraped JSON cache (gitignored, generated at runtime)
│   ├── ohlcv/
│   ├── news/
│   ├── company_info/
│   ├── macro/
│   └── forex/
│
├── resources/
│   └── world-atlas/                   # GeoJSON world map (stored locally, no CDN dependency)
│       └── countries-110m.json
│
├── Draft_Fitur.txt                    # Feature spec (move to GitHub Issues later)
├── MAPRO_Context.md                   # Keep as reference
├── Backend_Scope_MAPRO.md            # Keep as reference
│
├── package.json                       # Electron + frontend deps
├── electron.vite.config.mjs
├── tailwind.config.js
├── postcss.config.js
└── electron-builder.yml
```

---

## 3. Key Decisions

### 3.1 Python scrapers → Flask API
Each scraper becomes a Flask route. The Electron main process spawns the Flask server as a child process on app launch, and shuts it down on quit.

```
GET http://127.0.0.1:3847/api/ohlcv/AAPL
GET http://127.0.0.1:3847/api/news/US
GET http://127.0.0.1:3847/api/macro/US
GET http://127.0.0.1:3847/api/forex/IDR_USD
GET http://127.0.0.1:3847/api/company/AAPL
GET http://127.0.0.1:3847/api/portfolio
POST http://127.0.0.1:3847/api/portfolio
PUT  http://127.0.0.1:3847/api/portfolio/:id
DELETE http://127.0.0.1:3847/api/portfolio/:id
POST http://127.0.0.1:3847/api/scrape/:type   # trigger individual scraper
```

### 3.2 D3.js 2D choropleth (GlobeView)
The GlobeView replaces `globe.gl` (3D) with D3.js geo + topojson.

- Use `topojson-client` to parse world topology
- Use `d3-geo` for choropleth coloring by index performance
- GeoJSON from local file in `resources/world-atlas/` (no CDN)
- Countries clickable → show macro news + economic calendar panel
- Country colors: green (positive) / red (negative) based on index % change

### 3.3 Preload bridges Flask API
The preload script exposes `window.api` which calls `fetch('http://127.0.0.1:3847/api/...')` instead of IPC for data. Portfolio CRUD stays IPC → `db.js` (better-sqlite3).

### 3.4 Phase 1 deliverables (MVP)
1. Electron shell launches with Flask backend child process
2. GlobeView shows D3.js 2D world map with country colors from mock data
3. ScreenerView shows stock cards with sparklines
4. PortfolioView CRUD works (add/delete positions)
5. Data falls back to mockData.js when Flask is unavailable

---

## 4. Implementation Phases

### Phase 1 — Scaffold (NEW branch: `feature/unified-mapro`)
Pre-requisites (run first):
```bash
pip install playwright && playwright install chromium
curl -o resources/world-atlas/countries-110m.json https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
```
Steps:
- [ ] Git: create branch `feature/unified-mapro` from `pbl1-main_application` HEAD
- [ ] Scaffold folder structure (electron/, src/, server/, data/, resources/)
- [ ] Copy Electron main/preload from proto (adapt for Flask spawning)
- [ ] Copy React frontend from proto (minus globe.gl/three.js deps)
- [ ] Create Flask server with mock-data routes (confirm 200 OK for every /api/* route)
- [ ] Wire preload → Flask API: all `window.api` calls use `fetch('http://127.0.0.1:3847/api/...')`
- [ ] Flask spawns as child process on app launch, killed on quit
- [ ] Confirm Electron app launches with Flask running in background
- [ ] Data falls back to mockData.js when Flask is unreachable

### Phase 2 — D3 Globe (replace 3D)
- [ ] Install d3, topojson-client npm packages
- [ ] Verify countries-110m.json exists in resources/world-atlas/
- [ ] Create components: MacroNewsPanel.jsx, ForexTable.jsx, EconomicCalendar.jsx
- [ ] Rewrite GlobeView.jsx: D3.js geo + topojson choropleth (2D, NOT 3D)
- [ ] Country-click → MacroNewsPanel + EconomicCalendar appear for that country
- [ ] Country colors: green/red based on index % change from GET /api/index/:idx
- [ ] Auto-rotate idle globe (optional polish)
- [ ] Verify globe renders with mock data, then with real Flask /api/index/* data

### Phase 3 — Scraper Integration
- [ ] Copy `data_scraping/ohlcv/ohlcv_scraper.py` → `server/scrapers/ohlcv_scraper.py` (adapt)
- [ ] Copy `data_scraping/news/news_scraper.py` → `server/scrapers/news_scraper.py` (adapt)
- [ ] Copy `data_scraping/company_info/scraper.py` → `server/scrapers/company_info_scraper.py` (adapt)
- [ ] Copy `data_scraping/macro/scraper.py` → `server/scrapers/macro_scraper.py` (adapt)
- [ ] Copy `data_scraping/forex/forex_scraper.py` → `server/scrapers/forex_scraper.py` (adapt)
- [ ] Add `POST /api/scrape/:type` routes — each triggers corresponding scraper function
- [ ] Add `GET /api/scrape/status` — returns which scrapers last ran and their scraped_at times
- [ ] Flask checks TTL on startup; stale scrapers fire in background threads
- [ ] Confirm news auto-refresh timer works (re-scrapes every 2 hours)
- [ ] Test: call `POST /api/scrape/ohlcv` from browser DevTools → verify data/ohlcv/*.json updated

### Phase 4 — Portfolio Enhancement + Screener + Compare
- [ ] Add `PUT /api/portfolio/:id` — edit position (shares, buyPrice)
- [ ] Add `GET /api/portfolio/export` — returns all positions as JSON (download)
- [ ] Add `POST /api/portfolio/import` — accepts JSON, validates, bulk-inserts
- [ ] Implement PnL calculation in Flask: Stock Return vs Forex Return decomposition
- [ ] Add `GET /api/portfolio/pnl` — returns per-position and total PnL breakdown
- [ ] Wire PortfolioView to Flask portfolio API (replace mock data)
- [ ] Implement StockDetailModal.jsx: candlestick chart + fundamentals tabs (overlay, not route)
- [ ] ScreenerView → click stock → opens StockDetailModal overlay
- [ ] Implement MarketHeatmap.jsx component (used in CompareView)
- [ ] Implement CompareView: two-index selector + normalized overlay chart + heatmap + news per index
- [ ] Phase 4 deliverables: All 4 pages (Globe, Screener, Compare, Portfolio) functionally complete

### Phase 5 — Polish & Feature Parity
- [ ] Implement theme toggle (light/dark/auto) — feature #24
- [ ] Verify GlobeView economic calendar + forex table panels render correctly per Draft_Fitur #4, #5
- [ ] Verify ScreenerView full stock list + search per Draft_Fitur #11, #13
- [ ] Verify CompareView heatmap + per-index news per Draft_Fitur #14, #15
- [ ] Verify PortfolioView export/import per Draft_Fitur #22, #23
- [ ] Add `GET /api/indices` — returns all 4 index summaries for globe coloring
- [ ] Confirm D3.js 2D globe matches spec (not 3D, not globe.gl)
- [ ] Run `npm run build` → produce .exe via electron-builder
- [ ] Phase 5 deliverable: shippable .exe with all 24 Draft_Fitur features implemented

### Phase 6 — Archive Old Proto
- [ ] Rename `pbl1-proto/` → `pbl1-proto-archived/` (git mv preserving history)
- [ ] Delete `data_scraping/main_program/main_app.py` (PyQt5 shell superseded)
- [ ] Commit as one large PR: `feature/unified-mapro` → main/master

---

## 5. Git Strategy

```
Current state:
  pbl1-proto/          ← old frontend prototypes (to be archived)
  pbl1-main_application/ ← main repo (scrapers + PyQt5 shell)

Target state:
  pbl1-proto/          ← RENAME to pbl1-proto-archived/ (preserve history)
  pbl1-main_application/ ← unified app (Electron + React + Flask backend)
```

**New branch**: `feature/unified-mapro` created from `pbl1-main_application` HEAD.

---

## 6. Dependencies to Add

### npm (frontend)
```json
{
  "d3": "^7.9.0",
  "topojson-client": "^3.1.0",
  "d3-geo": "^1.12.1"
}
```

### pip (backend)
```
flask>=3.0
flask-cors
yfinance>=0.2
feedparser>=6.0
playwright>=1.40
requests>=2.31
```

---

## 7. API Response Schemas

Every Flask route returns `application/json`. All timestamps in ISO 8601.

### GET /api/ohlcv/:ticker
```json
{
  "ticker": "AAPL",
  "market": "US",
  "scraped_at": "2026-04-12T10:00:00Z",
  "ohlcv_15m": [
    { "timestamp": "2026-04-11 09:30:00", "open": 185.0, "high": 186.5, "low": 184.8, "close": 186.2, "volume": 45230000 },
    ...
  ]
}
```

### GET /api/news/:region
```json
{
  "region": "US",
  "label": "S&P 500 / Wall Street",
  "scraped_at": "2026-04-12T10:00:00Z",
  "articles": [
    { "title": "...", "link": "https://...", "publisher": "Reuters", "published": "2026-04-12 08:30:00", "thumbnail": { "type": "og", "url": "https://..." } },
    ...
  ]
}
```

### GET /api/macro/:cc
```json
{
  "country": "US",
  "name": "United States",
  "scraped_at": "2026-04-12T06:00:00Z",
  "events": [
    { "name": "Core CPI", "date": "2026-04-12", "time": "08:30", "impact": "high", "actual": "3.1%", "forecast": "3.0%", "previous": "2.9%" },
    ...
  ]
}
```

### GET /api/forex/:pair
```json
{
  "pair": "IDR_USD",
  "label": "USD/IDR",
  "current_rate": 15650.0,
  "prev_close": 15620.0,
  "change_pct": 0.19,
  "scraped_at": "2026-04-12T10:00:00Z"
}
```

### GET /api/company/:ticker
```json
{
  "ticker": "AAPL",
  "scraped_at": "2026-04-12T10:00:00Z",
  "info": {
    "identity": { "longName": "Apple Inc.", "sector": "Technology", "industry": "Consumer Electronics" },
    "price": { "currentPrice": 186.2, "marketCap": 2900000000000, "beta": 1.24 },
    "valuation": { "trailingPE": 28.5, "priceToBook": 45.2 },
    "profitability": { "profitMargins": 0.24, "returnOnEquity": 1.52 },
    "dividend": { "dividendRate": 0.96, "dividendYield": 0.0052, "payoutRatio": 0.16 },
    "analyst": { "recommendationKey": "buy", "targetMeanPrice": 210.0 }
  }
}
```

### GET /api/index/:idx   (market index data for globe coloring)
```json
{
  "index": "^GSPC",
  "name": "S&P 500",
  "country": "US",
  "current_price": 5234.5,
  "prev_close": 5200.0,
  "change_pct": 0.66,
  "scraped_at": "2026-04-12T10:00:00Z"
}
```

### GET /api/portfolio
```json
{
  "positions": [
    { "id": 1, "ticker": "AAPL", "company": "Apple Inc.", "shares": 10, "buyPrice": 175.0, "buyDate": "2026-01-15", "currency": "USD" }
  ]
}
```

### POST /api/portfolio   { ticker, company, shares, buyPrice, buyDate, currency }
### PUT /api/portfolio/:id   { shares?, buyPrice?, buyDate? }
### DELETE /api/portfolio/:id

### POST /api/scrape/:type   type ∈ {ohlcv, news, company_info, macro, forex}
Returns `{ "status": "started", "type": "ohlcv" }`

---

## 8. SQLite Schema

### Electron SQLite (better-sqlite3) — `positions` table
```sql
CREATE TABLE IF NOT EXISTS positions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker     TEXT    NOT NULL,
  company    TEXT    NOT NULL,
  shares     REAL    NOT NULL,
  buyPrice   REAL    NOT NULL,
  buyDate    TEXT    NOT NULL,   -- ISO date string
  currency   TEXT    NOT NULL    -- 'IDR' | 'USD' | 'JPY' | 'GBP'
);
```

### Flask SQLite (python sqlite3) — `settings` table
```sql
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
-- Keys: 'theme' (light/dark/auto), 'home_region' (US/ID/JP/GB)
```

### JSON Cache Files (data/) — NOT SQLite, plain JSON files written by scrapers
- `data/ohlcv/AAPL.json`        — ohlcv_15m array
- `data/news/us_news.json`      — articles array
- `data/macro/us_macro.json`    — events array
- `data/forex/idr_usd.json`     — rate object
- `data/company_info/AAPL.json` — info object

Flask does NOT convert JSON cache to SQLite — it reads JSON files directly and serves via API. Scraper runs write JSON cache files.

---

## 9. Data Refresh Policy

| Data Type | TTL | Refresh Trigger |
|-----------|-----|----------------|
| OHLCV (15m candles) | Until app open | On app open, batch fetch all 40 tickers via yfinance batch download |
| Company fundamentals | 7 days | On app open if >7 days old |
| News | 2 hours | On app open + auto-refresh every 2 hours via timer |
| Economic calendar | 24 hours | On app open |
| Forex rates | Until app open | On app open |
| Index current price | Until app open | On app open |
| Portfolio positions | Persistent | Never auto-refresh (user-managed) |

**Cache invalidation**: Each JSON cache file has `scraped_at` field. On read, Flask checks TTL. If stale, triggers async scraper and returns stale data (don't block user).

---

## 10. Scraping Trigger Strategy

1. **On app start** (main.js spawns Flask → Flask checks all `scraped_at` timestamps → fires stale scrapers in background threads)
2. **Manual** via `POST /api/scrape/:type` — renderer can call this (e.g., "Refresh" button)
3. **Timer** for news: Flask starts a background thread that re-scrapes news every 2 hours

**Scraper execution**: Each scraper runs as a Python function call (NOT subprocess) within the Flask process or a thread pool. They write JSON files to `data/` directory.

**Playwright setup** (pre-requisite, must run before macro_scraper works):
```bash
playwright install chromium   # installs browser binaries for Investing.com scraping
```

---

## 11. Environment Setup (pre-requisites before Phase 1)

```bash
# 1. Install Playwright browser (for macro_scraper.py)
pip install playwright
playwright install chromium

# 2. Download GeoJSON for D3 world map
mkdir -p resources/world-atlas
curl -o resources/world-atlas/countries-110m.json \
  https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json

# 3. Initialize SQLite schema
python server/db/init_db.py   # creates settings table
```

---

## 7. Files to Delete from Proto (not moving to unified app)

- `pbl1-proto/source-proto/**` — old React proto (superseded)
- `pbl1-proto/source-proto-fix/**` — old fix proto (superseded)
- `pbl1-proto/source-proto-fix-v2/**` — superseded by unified app
- `pbl1-proto/proto-1/**` — earliest vanilla JS proto
- `pbl1-proto/proto-2/**` — intermediate vanilla JS proto
- `pbl1-proto/shared/**` — mockData moved into unified app `src/data/`
- `pbl1-main_application/data_scraping/main_program/main_app.py` — PyQt5 shell (superseded by Electron)
