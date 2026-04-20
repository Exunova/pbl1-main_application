# Struktur Data MAPRO (Multimarket Analytics Portfolio Tracker)

## 1. Arsitektur Sistem

MAPRO adalah aplikasi Electron dengan arsitektur tiga lapis:

```
┌─────────────────────────────────────────────────────────┐
│  RENDERER PROCESS (React + Vite)                       │
│  frontend/src/                                          │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐ │
│  │GlobeView│  │CompareView│  │ScreenerView│ │PortfolioView│ │
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  └────┬─────┘ │
│       └────────────┴──────────────┴──────────────┘       │
│                         │ window.api                  │
│                    contextBridge                       │
├─────────────────────────┼─────────────────────────────┤
│  PRELOAD (preload.mjs) │ ipcRenderer.invoke()        │
├─────────────────────────┼─────────────────────────────┤
│  MAIN PROCESS (Electron main.js)                       │
│  ┌──────────────────┐  ┌────────────────────────────┐  │
│  │  BrowserWindow   │  │  Python IPC Bridge          │  │
│  │  (UI window)     │◄─┤  (subprocess spawn)         │  │
│  └──────────────────┘  │  stdin/stdout pipe          │  │
│                         └──────────┬─────────────────┘  │
├─────────────────────────────────────┼──────────────────┤
│  PYTHON BACKEND (ipc_main.py)       │                  │
│  backend/src/                        │                  │
│  ┌────────────┐ ┌────────────┐ ┌─────┴─────────────┐   │
│  │cache_db.py│ │scrapers/   │ │  Command Dispatcher │   │
│  │(SQLite)   │ │(yfinance)  │ │  handle_ohlcv()    │   │
│  └─────┬─────┘ └─────┬──────┘ │  handle_news()     │   │
│        │             │         │  ...               │   │
│        └──────┬──────┘         └─────────┬─────────┘   │
│               │                           │              │
│  ┌────────────┴───────────────────────────┴────────────┐ │
│  │  DATA DIRECTORY (data/)                            │ │
│  │  ohlcv/  news/  macro/  forex/  company_info/     │ │
│  │  cache.db (SQLite)                                  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Direktori Data

```
data/
├── ohlcv/
│   ├── IDX_GSPC.json       # ^GSPC → S&P 500
│   ├── IDX_N225.json       # ^N225 → Nikkei 225
│   ├── IDX_JKLQ45.json    # ^JKLQ45 → LQ45
│   ├── IDX_FTSE.json       # ^FTSE → FTSE 100
│   ├── NVDA.json           # saham US
│   ├── AAPL.json
│   ├── BBCA_JK.json         # saham ID (.JK → _JK)
│   ├── 7203_T.json          # saham JP (.T → _T)
│   ├── AZN_L.json           # saham GB (.L → _L)
│   └── _summary.json        # ringkasan hasil scrape
├── news/
│   ├── us_news.json
│   ├── id_news.json
│   ├── jp_news.json
│   ├── gb_news.json
│   └── _summary.json
├── macro/
│   ├── us_macro.json
│   ├── id_macro.json
│   ├── jp_macro.json
│   ├── gb_macro.json
│   └── _summary.json
├── forex/
│   ├── idr_usd.json
│   ├── jpy_usd.json
│   ├── gbp_usd.json
│   └── _summary.json
└── company_info/
    ├── NVDA.json
    ├── AAPL.json
    ├── BBCA_JK.json
    └── _summary.json

backend/
├── cache.db                 # SQLite cache (WAL mode)
└── src/
    ├── ipc_main.py          # Entry point Python subprocess
    ├── cache_db.py          # Wrapper SQLite
    └── scrapers/
        ├── ohlcv_scraper.py
        ├── news_scraper.py
        ├── macro_scraper.py
        ├── forex_scraper.py
        └── company_info_scraper.py
```

---

## 3. Format JSON per Tipe Data

### 3.1 OHLCV (Open-High-Low-Close-Volume)

**File:** `data/ohlcv/{TICKER}.json`

**Sumber:** `yfinance.Ticker.history(period="30d", interval="15m")`

**TTL Cache:** 3600 detik (1 jam)

```json
{
  "ticker": "^GSPC",
  "type": "index",
  "market": "US",
  "scraped_at": "2026-04-13 08:03:51.595366",
  "updated_at": "2026-04-13T08:03:51.595391",
  "ohlcv_15m": [
    {
      "timestamp": "2026-02-27 09:30:00-05:00",
      "open":   6856.54,
      "high":   6857.04,
      "low":    6831.7402,
      "close":  6841.7598,
      "volume": 136654281
    }
  ]
}
```

**Catatan timestamp:**
- `^GSPC` (US): `"2026-02-27 09:30:00-05:00"` → UTC-5 (EST), berubah ke UTC-4 (EDT) saat DST
- `^N225` (JP): `"2026-03-02 09:00:00+09:00"` → UTC+9 (JST), tetap konstan
- `^JKLQ45` (ID): `"2026-02-23 09:00:00+07:00"` → UTC+7 (WIB), tetap konstan
- `^FTSE` (GB): `"2026-02-26 08:00:00+00:00"` → UTC+0 (GMT), berubah ke UTC+1 (BST) saat DST

**Kode ticker → nama file:**

| Ticker Asli | `to_filename()` | Nama File |
|---|---|---|
| `^GSPC` | `^`→`IDX_` | `IDX_GSPC.json` |
| `^N225` | `^`→`IDX_` | `IDX_N225.json` |
| `^JKLQ45` | `^`→`IDX_` | `IDX_JKLQ45.json` |
| `^FTSE` | `^`→`IDX_` | `IDX_FTSE.json` |
| `BBCA.JK` | `.`→`_` | `BBCA_JK.json` |
| `7203.T` | `.`→`_` | `7203_T.json` |
| `AZN.L` | `.`→`_` | `AZN_L.json` |
| `BRK-B` | `-`→`_` | `BRK_B.json` |

**`to_filename()` di `ipc_main.py` (baris 209):**
```python
def to_filename(ticker):
    return ticker.replace(".", "_").replace("^", "IDX_").replace("-", "_")
```

**`to_filename()` di `company_info_scraper.py` (baris 89):**
```python
def to_filename(ticker):
    return ticker.replace(".", "_").replace("-", "_")
```
**PERHATIAN:** `company_info_scraper` TIDAK menggantikan `^` dengan `IDX_`. Jika ticker berupa `^GSPC`, file yang disimpan akan salah (`^GSPC.json` bukan `IDX_^GSPC.json`).

---

### 3.2 NEWS

**File:** `data/news/{region}_news.json`

**Sumber:** Google News RSS Feed (via `feedparser`)

**TTL Cache:** 7200 detik (2 jam)

```json
{
  "market": "ID",
  "label": "LQ45 / IHSG",
  "scraped_at": "2026-04-13 09:00:00.000000",
  "updated_at": "2026-04-13T09:00:00.000000",
  "article_count": 5,
  "articles": [
    {
      "title": "LQ45 hits new high as commodities rally",
      "link": "https://news.google.com/...",
      "publisher": "Kompas",
      "published": "2026-04-12 09:00:00",
      "summary": "...",
      "thumbnail": {
        "type": "og_image",
        "url": "https://example.com/image.jpg"
      },
      "favicon": "https://www.google.com/s2/favicons?domain=kompas.com&sz=64"
    }
  ]
}
```

**Thumbnail strategy:** scraper mencoba fetch `og:image` meta tag. Jika gagal, fallback ke favicon Google.

---

### 3.3 MACRO (Economic Calendar)

**File:** `data/macro/{cc}_macro.json`

**Sumber:** scraping `investing.com/economic-calendar` via Playwright

**TTL Cache:** 86400 detik (24 jam)

```json
{
  "country": "ID",
  "name": "Indonesia",
  "currency": "IDR",
  "scraped_at": "2026-04-13 09:00:00.000000",
  "updated_at": "2026-04-13T09:00:00.000000",
  "event_count": 3,
  "events": [
    {
      "name": "BI Rate",
      "date": "04/15/2026",
      "time": "14:00",
      "impact": "high",
      "actual": "5.75%",
      "forecast": "5.75%",
      "previous": "5.50%"
    }
  ]
}
```

**Impact level:** ditentukan dari jumlah bintangSVG yang terisi di UI investing.com:
- 0 bintang → `"low"`
- 1 bintang terisi → `"medium"`
- 2+ bintang terisi → `"high"`

**Target negara scrape:** `["US", "ID", "JP", "UK", "DE"]`

---

### 3.4 FOREX

**File:** `data/forex/{pair}.json`

**Sumber:** `yfinance.Ticker.info` + `yfinance.Ticker.history(period="1mo", interval="1d")`

**TTL Cache:** 3600 detik (1 jam)

```json
{
  "pair": "IDR_USD",
  "ticker": "IDRUSD=X",
  "base": "IDR",
  "quote": "USD",
  "label": "Indonesian Rupiah / US Dollar",
  "scraped_at": "2026-04-13 09:00:00.000000",
  "updated_at": "2026-04-13T09:00:00.000000",
  "current_rate": 15650.0,
  "prev_close": 15620.0,
  "change_pct": 0.19,
  "history_30d": [
    { "date": "2026-03-13", "close": 15500.0 },
    { "date": "2026-03-14", "close": 15600.0 }
  ]
}
```

**Pasangan forex yang discrape:**

| Pair Key | Ticker yfinance | Base | Quote |
|---|---|---|---|
| `IDR_USD` | `IDRUSD=X` | IDR | USD |
| `JPY_USD` | `JPYUSD=X` | JPY | USD |
| `GBP_USD` | `GBPUSD=X` | GBP | USD |
| `USD_IDR` | `USDIDR=X` | USD | IDR |
| `USD_JPY` | `USDJPY=X` | USD | JPY |
| `USD_GBP` | `USDGBP=X` | USD | GBP |

---

### 3.5 COMPANY INFO

**File:** `data/company_info/{TICKER_FILENAME}.json`

**Sumber:** `yfinance.Ticker.info` + `yfinance.Ticker.income_stmt/balance_sheet/cashflow`

**TTL Cache:** 86400 detik (24 jam)

```json
{
  "ticker": "NVDA",
  "market": "US",
  "scraped_at": "2026-04-13 09:00:00.000000",
  "updated_at": "2026-04-13T09:00:00.000000",
  "info": {
    "identity": {
      "longName": "NVIDIA Corporation",
      "shortName": "NVIDIA",
      "symbol": "NVDA",
      "quoteType": "EQUITY",
      "exchange": "NASDAQ",
      "market": "US",
      "currency": "USD",
      "sector": "Technology",
      "industry": "Semiconductors",
      "fullTimeEmployees": 29600,
      "website": "https://www.nvidia.com",
      "longBusinessSummary": "NVIDIA Corporation provides...",
      "companyOfficers": []
    },
    "price": {
      "currentPrice": 875.0,
      "previousClose": 860.0,
      "open": 862.0,
      "dayHigh": 880.0,
      "dayLow": 855.0,
      "bid": 874.5,
      "ask": 875.5,
      "fiftyTwoWeekHigh": 974.0,
      "fiftyTwoWeekLow": 420.0,
      "fiftyDayAverage": 850.0,
      "twoHundredDayAverage": 780.0,
      "volume": 45000000,
      "averageVolume": 42000000,
      "averageVolume10days": 43000000,
      "regularMarketChangePercent": 1.74,
      "52WeekChange": 45.6
    },
    "valuation": {
      "marketCap": 2150000000000,
      "enterpriseValue": 2100000000000,
      "trailingPE": 65.4,
      "forwardPE": 45.2,
      "priceToBook": 55.3,
      "priceToSalesTrailing12Months": 35.2,
      "trailingEps": 13.38,
      "forwardEps": 19.4,
      "bookValue": 15.8,
      "pegRatio": 3.4
    },
    "profitability": {
      "profitMargins": 0.55,
      "operatingMargins": 0.60,
      "grossMargins": 0.75,
      "returnOnEquity": 0.85,
      "returnOnAssets": 0.45,
      "revenueGrowth": 0.25,
      "earningsGrowth": 0.30,
      "grossProfits": 45000000000,
      "totalRevenue": 65000000000,
      "netIncomeToCommon": 35000000000,
      "operatingCashflow": 40000000000,
      "totalCash": 20000000000,
      "totalDebt": 15000000000
    },
    "dividend": {
      "dividendRate": 0.16,
      "dividendYield": 0.0002,
      "fiveYearAvgDividendYield": 0.0003,
      "payoutRatio": 0.01,
      "exDividendDate": "2026-03-15",
      "lastDividendValue": 0.04
    },
    "analyst": {
      "recommendationKey": "buy",
      "recommendationMean": 4.2,
      "numberOfAnalystOpinions": 45,
      "targetHighPrice": 1000.0,
      "targetLowPrice": 750.0,
      "targetMeanPrice": 900.0,
      "targetMedianPrice": 890.0
    },
    "ownership": {
      "sharesOutstanding": 2450000000,
      "floatShares": 2400000000,
      "heldPercentInsiders": 0.04,
      "heldPercentInstitutions": 0.75,
      "lastSplitFactor": "4-for-1",
      "lastSplitDate": "2021-07-20",
      "beta": 1.65
    }
  },
  "financials": {
    "income_statement": {
      "2025-12-31": { "Total Revenue": 65000000000, "Gross Profit": 48000000000, ... },
      "2024-12-31": { "Total Revenue": 50000000000, "Gross Profit": 36000000000, ... }
    },
    "balance_sheet": { ... },
    "cash_flow": { ... }
  }
}
```

---

## 4. Sistem Cache SQLite

**Lokasi:** `backend/cache.db`

**Mode:** WAL (Write-Ahead Logging) — banyak reader, satu writer. Semua koneksi pakai `PRAGMA journal_mode=WAL`.

**Terdapat 3 tabel:**

```sql
-- Tabel 1: cache
-- Menyimpan data hasil scrape dalam bentuk JSON string.
-- Key adalah unique identifier per tipe data (lihat Cache Key Convention di bawah).
CREATE TABLE cache (
    key        TEXT PRIMARY KEY,
    data       TEXT NOT NULL,   -- JSON string (di-serialize via json.dumps)
    updated_at  TEXT             -- ISO timestamp, misal "2026-04-13T08:03:51.595391"
);

-- Tabel 2: positions
-- Menyimpan posisi portofolio pengguna.
-- Currency default adalah 'USD' jika tidak dispesifikasikan.
CREATE TABLE positions (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker   TEXT NOT NULL,                    -- Simbol saham, misal "NVDA", "BBCA.JK"
    company  TEXT NOT NULL,                    -- Nama perusahaan, misal "NVIDIA Corporation"
    shares   REAL NOT NULL,                    -- Jumlah lot/saham, misal 10.0
    buyPrice REAL NOT NULL,                    -- Harga beli per saham, misal 875.50
    buyDate  TEXT NOT NULL,                    -- Tanggal beli, format "YYYY-MM-DD"
    currency TEXT NOT NULL DEFAULT 'USD'        -- Mata uang: USD, IDR, JPY, GBP
);

-- Tabel 3: scrape_status
-- Menyimpan status terakhir setiap scraper (timestamp atau error message).
CREATE TABLE scrape_status (
    key        TEXT PRIMARY KEY,   -- Nama scraper: "ohlcv", "news", "macro", "forex", "company_info"
    updated_at  TEXT,              -- ISO timestamp update terakhir
    status     TEXT                -- Timestamp sukses "2026-04-13T08:03:51" atau error "error: rate limit"
);
```

### 4.1 Semua Operasi SQL

Berikut seluruh query yang dijalankan terhadap `cache.db`:

**cache table:**
```sql
-- Baca cache
SELECT data FROM cache WHERE key = ?;

-- Simpan/upsert cache (INSERT OR REPLACE)
INSERT OR REPLACE INTO cache (key, data, updated_at) VALUES (?, ?, ?);

-- Hapus cache
DELETE FROM cache WHERE key = ?;
```

**positions table:**
```sql
-- Ambil semua posisi
SELECT id, ticker, company, shares, buyPrice, buyDate, currency FROM positions;

-- Ambil 1 posisi by id
SELECT id, ticker, company, shares, buyPrice, buyDate, currency FROM positions WHERE id = ?;

-- Insert posisi baru
INSERT INTO positions (ticker, company, shares, buyPrice, buyDate, currency)
VALUES (?, ?, ?, ?, ?, ?);

-- Update beberapa kolom posisi (dynamic SET)
UPDATE positions SET ticker = ?, company = ?, shares = ?,
      buyPrice = ?, buyDate = ?, currency = ?
WHERE id = ?;

-- Hapus posisi
DELETE FROM positions WHERE id = ?;

-- Hitung total posisi
SELECT COUNT(*) as cnt FROM positions;
```

**scrape_status table:**
```sql
-- Baca semua status scraper
SELECT key, status FROM scrape_status;

-- Insert/update status scraper
INSERT OR REPLACE INTO scrape_status (key, updated_at, status) VALUES (?, ?, ?);

-- Baca status satu scraper
SELECT * FROM scrape_status WHERE key = ?;
```

### 4.2 Cache Key Naming Convention

Setiap tipe data punya naming scheme berbeda:

| Tipe | Format Key | Contoh |
|---|---|---|
| OHLCV | `ohlcv:{ticker}` | `ohlcv:^GSPC`, `ohlcv:BBCA_JK` |
| News | `news:{region.upper()}` | `news:US`, `news:ID` |
| Macro | `macro:{cc.upper()}` | `macro:US`, `macro:ID` |
| Forex | `forex:{pair.upper()}` | `forex:IDR_USD` |
| Company | `company:{ticker}` | `company:NVDA`, `company:BBCA.JK` |

**CRITICAL:** `handle_ohlcv` di `ipc_main.py` menggunakan key `ohlcv:{ticker}` dengan ticker ASLI (bukan `to_filename`). Tapi `ohlcv_scraper` menyimpan dengan key `ohlcv:{to_filename(ticker)}`.

| Komponen | Key yang Dipakai | Key yang Disimpan |
|---|---|---|
| `handle_ohlcv` (GET) | `ohlcv:^GSPC` | — |
| `handle_ohlcv` (SET) | `ohlcv:^GSPC` | ✅ |
| `ohlcv_scraper` (SET) | — | `ohlcv:IDX_GSPC` |

**Hasil:** scraper dan IPC tidak berbagi cache yang sama untuk ticker index! Scraper menyimpan ke `IDX_GSPC`, IPC membaca dari `^GSPC`.

---

## 5. Lapisan IPC (Inter-Process Communication)

### 5.1 Alur Pemanggilan (Renderer → Python)

```
Renderer                    Main.js                  ipc_main.py
   │                           │                          │
   │ window.api.fetchOHLCV    │                          │
   │ ───────────────────────► │                          │
   │                          │ sendToPython()           │
   │                          │ JSON.stringify()         │
   │                          │ ───────────────────────► │
   │                          │                          │ handle_command()
   │                          │                          │ handle_ohlcv()
   │                          │                          │   ├── cache_get()
   │                          │                          │   ├── read_cache_file()
   │                          │                          │   └── cache_set()
   │                          │                          │
   │                          │ ◄───────────────────────│ JSON response
   │                          │                          │
   │ ◄────────────────────── │ pendingRequests.get(id)   │
   │ Promise resolve(data)    │                          │
```

### 5.2 IPC Command Protocol

**Format request (stdin Python):**
```json
{
  "id": "m1abc2def3",
  "cmd": "ohlcv",
  "params": { "ticker": "^GSPC" }
}
```

**Format response (stdout Python):**
```json
{
  "id": "m1abc2def3",
  "ok": true,
  "data": { ... }
}
```

**Jika error:**
```json
{
  "id": "m1abc2def3",
  "ok": false,
  "error": "Missing ticker parameter"
}
```

### 5.3 Semua Command yang Tersedia

| Command | Params | Return | Cache TTL |
|---|---|---|---|
| `ohlcv` | `{ ticker }` | OHLCV array | 1 jam (hardcoded) |
| `news` | `{ region }` | News articles | 2 jam |
| `macro` | `{ cc }` | Economic events | 24 jam |
| `forex` | `{ pair }` | Forex rate + history | 1 jam |
| `company` | `{ ticker }` | Company info + financials | 24 jam |
| `companies` | `{ tickers: [] }` | Batch company info | inherit |
| `index` | `{ idx }` | Single index summary | no cache |
| `indices` | `{}` | All 4 indices summary | no cache |
| `scrape` | `{ type }` | Triggers background scrape | — |
| `scrape_status` | `{}` | Status semua scraper | — |
| `health` | `{}` | `{ status: "ok" }` | — |
| `portfolio_list` | `{}` | Semua posisi | — |
| `portfolio_add` | position object | Posisi baru + id | — |
| `portfolio_edit` | `{ id, ...fields }` | Posisi yang diupdate | — |
| `portfolio_delete` | `{ id }` | Status | — |
| `portfolio_pnl` | `{}` | PnL semua posisi (konversi ke IDR) | — |
| `portfolio_export` | `{}` | Semua posisi | — |
| `portfolio_import` | `{ positions: [] }` | Count imported | — |

### 5.4 Background Scrape

`triggerScrape(type)` menjalankan scraper di thread terpisah (daemon thread). Scraper吃饱择时更新 cache dan file JSON. Frontend bisa poll `scrapeStatus()` untuk cek progres.

---

## 6. Data Frontend (React State)

### 6.1 GlobeView

```
indicesData: Array<{
  index: "^GSPC",
  name: "S&P 500",
  country: "US",
  current_price: 6841.75,
  prev_close: 6831.74,
  change_pct: 0.15,
  scraped_at: "2026-04-13T08:03:51"
}>

selectedCountry: "ID" | "US" | "JP" | "GB" | null

calendarEvents: Array<{
  name: "BI Rate",
  date: "04/15/2026",
  time: "14:00",
  impact: "high" | "medium" | "low",
  actual: "5.75%",
  forecast: "5.75%",
  previous: "5.50%"
}>

newsArticles: Array<{
  title: string,
  link: string,
  publisher: string,
  published: string,
  summary: string,
  thumbnail: { type: "og_image" | "favicon", url: string },
  favicon: string
}>
```

**ISO bridging:**
```
ISO2 (MARKETS key) → ISO3 (GeoJSON properties) → kembali ISO2
US  → USA → US
ID  → IDN → ID
JP  → JPN → JP
GB  → GBR → GB
```

### 6.2 CompareView

```
idx1: "US" | "ID" | "JP" | "GB"   # default: "US"
idx2: "US" | "ID" | "JP" | "GB"   # default: "ID"
normalize: boolean                  # default: true

chartData: Array<{
  ts: "2026-04-10",          # tanggal UTC (slice 0-10 dari timestamp)
  v1: number,                # harga normalized idx1 (rebased 100)
  v2: number                 # harga normalized idx2 (rebased 100)
}>

tickerData: {
  [ticker: string]: {
    change_pct: number       # % perubahan harga harian
  }
}
```

**Merge algorithm:** timestamp alignment by UTC date. `c2ByDay[day]` lookup, bukan positional index — agar market dengan jam trading berbeda tetap bisa dicompare.

### 6.3 Portfolio PnL

Konversi semua return ke IDR menggunakan kurs forex saat ini:

```
stockReturn_IDR = (currentPrice - buyPrice) × shares × currentFXRate
forexReturn_IDR = shares × buyPrice × (currentFXRate - buyFXRate)
totalPnL_IDR   = stockReturn_IDR + forexReturn_IDR
```

---

## 7. Catatan Penting & Known Issues

1. **`handle_ohlcv` TTL check:** baru ditambahkan — cek `updated_at`/`scraped_at`, tolak jika data older dari 3600 detik.

2. **Cache key mismatch OHLCV:** scraper pakai `ohlcv:IDX_GSPC`, IPC pakai `ohlcv:^GSPC` — keduanya tidak saling overwrite.

3. **`company_info_scraper.to_filename`:** tidak mengganti `^` → `IDX_`, tapi ini tidak bermasalah karena company info TIDAK menggunakan ticker index (`^GSPC` dll tidak pernah discrape sebagai company).

4. **DST Timestamp Mismatch:** CompareView merge berdasarkan UTC date (`slice(0,10)`) — ini adalah solusi yang benar, bukan positional matching.

5. **Playwright cookies:** `macro_scraper.py` butuh file `cookies.txt` (Netscape format) untuk accessing investing.com. Tanpa cookie, scraping economic calendar tidak akan berhasil.

6. **`globe.gl` cleanup:** saat unmount, renderer di-dispose untuk mencegah memory leak dan WebGL context errors.

---

## 8. Route Frontend

| Path | Komponen | Data yang Dimuat |
|---|---|---|
| `/` | `GlobeView` | `fetchIndices()`, `fetchMapData()` (GeoJSON), `fetchMacro()`, `fetchNews()` per negara |
| `/screener` | `ScreenerView` | `fetchCompanies(allTickers)` |
| `/compare` | `CompareView` | `fetchOHLCV(idx1)`, `fetchOHLCV(idx2)`, `fetchCompanies(allTickers)` |
| `/portfolio` | `PortfolioView` | `getPositions()`, `fetchPnL()` |
