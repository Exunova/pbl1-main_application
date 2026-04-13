# MAPRO — Analisis Konsep Python & Alur Program

**Nama:** ________________________  
**NIM:** ________________________  
**Tanggal:** 13 April 2026

---

## 1. Konsep Dasar yang Digunakan

### a. Fungsi (def)

MAPRO menggunakan **74 fungsi Python** di backend. Fungsi dipakai untuk **memisahkan proses**:

| Kategori | Contoh Fungsi | Tujuan |
|----------|--------------|--------|
| **Input** | `handle_news(region)` | Menerima request dari frontend via IPC |
| **Proses Data** | `handle_company(ticker)` | Cek cache → baca file → parse → return |
| **Output** | `read_cache_file(category, fn)` | Mengembalikan dict dari file JSON |
| **Utility** | `to_filename(ticker)` | Convert `"^GSPC"` → `"IDX_GSPC"` (aman untuk nama file) |
| **Scraper** | `scrape_15m(ticker)` | Fetch dari yfinance, return list of dict |

**Contoh alur fungsi per tanggung jawab (`handle_company`):**

```python
# INPUT: handler menerima perintah
def handle_company(ticker):
    fname = to_filename(ticker) + ".json"      # UTILITY — converter ticker ke nama file
    cached = cache_get(f"company:{ticker}")    # PROSES — cek cache SQLite dulu
    if cached:
        return cached                          # OUTPUT — langsung return kalau ada cache

    # Cache miss → baca dari file JSON
    data = read_cache_file("company_info", fname)  # INPUT/OUTPUT — baca file

    if not data:
        # Kalau file juga tidak ada → jalankan scraper
        company_info_scraper.run(os.path.join(DATA_DIR, "company_info"))
        data = read_cache_file("company_info", fname)

    cache_set(f"company:{ticker}", data)     # PROSES — simpan ke cache
    return data                               # OUTPUT — kembalikan data
```

**Daftar fungsi utama di `ipc_main.py`:**

| Fungsi | Line | Tujuan |
|--------|------|--------|
| `main()` | 758 | Entry point — loop STDIN/STDOUT |
| `handle_command(req)` | 638 | Dispatcher — route perintah ke handler |
| `handle_company(ticker)` | 287 | Handler data perusahaan |
| `handle_companies(tickers)` | 305 | Handler batch banyak perusahaan |
| `handle_ohlcv(ticker)` | 217 | Handler data OHLCV 15 menit |
| `handle_news(region)` | 235 | Handler berita pasar |
| `handle_macro(cc)` | 253 | Handler kalender ekonomi |
| `handle_forex(pair)` | 270 | Handler kurs forex |
| `handle_portfolio_list()` | 369 | Handler daftar posisi portofolio |
| `handle_portfolio_pnl()` | 477 | Handler perhitungan PnL |
| `cache_get(key)` | 91 | Baca data dari SQLite cache |
| `cache_set(key, data)` | 103 | Simpan data ke SQLite cache |
| `read_cache_file(category, filename)` | 198 | Baca file JSON dari disk |
| `to_filename(ticker)` | 209 | Convert ticker ke nama file aman |

---

### b. Class/Object

**MAPRO HANYA memiliki 1 class di seluruh backend —其余 adalah procedural.**

```python
# news_scraper.py — OGParser (turunan HTMLParser)
class OGParser(html.parser.HTMLParser):          # Pewarisan (inheritance)
    def __init__(self):                            # Konstruktor
        super().__init__()                         # Panggil parent constructor
        self.og_image = None                       # Atribut instance

    def handle_starttag(self, tag, attrs):           # Method override
        if tag == 'meta':
            for name, value in attrs:
                if name == 'property' and value == 'og:image':
                    # ...
```

**Kenapa procedural bukan OOP?**

Alasan utama: scraper bersifat **stateless** — input → proses → output, tidak perlu menyimpan state antar pemanggilan. Fungsi procedural lebih:
- **Sederhana** — tidak perlu buat class, `def run()` langsung jalan
- **Mudah di-test** — setiap fungsi bisa di-test independen
- **Tidak ada kompleksitas OOP** — inheritance, polymorphism tidak diperlukan di sini

---

### c. Struktur Data

#### List `[ ]` — Menyimpan banyak data berurutan

```python
# List ticker dari 4 negara
MARKETS = {
    "US": ["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM"],
    "ID": ["BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK"],
}

# List comprehension — 780 candle OHLCV
candles = [
    {
        "timestamp": str(ts),
        "open":   safe_float(row["Open"]),
        "high":   safe_float(row["High"]),
        "low":    safe_float(row["Low"]),
        "close":  safe_float(row["Close"]),
        "volume": int(row["Volume"]),
    }
    for ts, row in df.iterrows()       # iterrows() return tuple (index, Series)
]
```

#### Dictionary `{ }` — Key-Value untuk data terstruktur

```python
# Config — key: grup, value: list field yang mau diambil
INFO_FIELDS = {
    "identity":    ["longName", "shortName", "symbol", "sector", "industry"],
    "price":       ["currentPrice", "previousClose", "marketCap", "trailingPE"],
    "dividend":    ["dividendYield", "dividendRate", "payoutRatio"],
    "analyst":     ["recommendationKey", "targetMeanPrice"],
}

# Dict comprehension — ekstrak field dari yfinance
return {
    group: {field: safe_val(raw.get(field)) for field in fields}
    for group, fields in INFO_FIELDS.items()
}

# Contoh hasil dict:
{
    "ticker": "AAPL",
    "info": {
        "identity":    {"longName": "Apple Inc.", "sector": "Technology"},
        "price":       {"currentPrice": 255.92, "marketCap": 3761492983808},
        "valuation":   {"trailingPE": 32.35},
        "dividend":    {"dividendYield": 0.41, "dividendRate": 1.04}
    },
    "financials": {
        "income_statement": {
            "2025-09-30T00:00:00.000": {
                "Total Revenue": 416161000000,
                "Net Income": 112010000000,
                "Diluted EPS": 7.46,
            }
        },
        "balance_sheet": {...},
    }
}
```

#### Tuple `( )` — Untuk SQL parameterized queries (aman dari SQL injection)

```python
# Tuple untuk parameterized query
cur.execute("SELECT data FROM cache WHERE key = ?", (key,))
conn.execute(
    "INSERT INTO cache (key, data, updated_at) VALUES (?, ?, ?)",
    (key, json.dumps(data, default=str), datetime.now().isoformat())
)
```

---

### d. File Handling

#### Struktur Direktori Data

```
/home/reiyo/Project/PBL1/pbl1-main_application/data/
├── company_info/
│   ├── AAPL.json        (info + financials Apple)
│   ├── NVDA.json        (info + financials Nvidia)
│   ├── BBCA.JK.json    (info + financials Bank Central Asia)
│   └── _summary.json    (ringkasan semua perusahaan)
├── ohlcv/
│   ├── AAPL.json       (780 candle 15-menitan)
│   ├── IDX_GSPC.json   (S&P 500 index)
│   └── _summary.json
├── news/
│   ├── us_news.json    (100 artikel US)
│   └── id_news.json    (81 artikel Indonesia)
├── macro/
│   └── us_macro.json    (event kalender ekonomi US)
└── forex/
    ├── usd_idr.json     (USD/IDR rate)
    └── usd_jpy.json     (USD/JPY rate)
```

#### Baca File JSON

```python
# ipc_main.py — baca dari direktori data
def read_cache_file(category, filename):
    path = get_data_path(category, filename)   # → data/company_info/AAPL.json
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)                  # JSON string → dict Python
    return None
```

#### Simpan File JSON

```python
# company_info_scraper.py — scrape lalu simpan
filepath = os.path.join(output_dir, filename)  # e.g. data/company_info/AAPL.json
with open(filepath, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, default=str, ensure_ascii=False)

# ohlcv_scraper.py —同样的 pattern
def save_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  [OK] Saved: {os.path.basename(path)}")
```

#### SQLite Cache (bukan JSON)

```python
# cache_db.py — SQLite untuk data sementara (cache cepat)
CACHE_DB = os.path.join(APP_DIR, 'cache.db')   # → backend/cache.db
conn = sqlite3.connect(CACHE_DB)

# Cache menyimpan JSON sebagai TEXT
cache_set("company:AAPL", {"ticker": "AAPL", "info": {...}})
# Ekuivalen SQL:
# INSERT OR REPLACE INTO cache (key, data, updated_at)
# VALUES ('company:AAPL', '{"ticker":"AAPL",...}', '2026-04-13T08:00:00')
```

---

## 2. Keterkaitan Konsep dengan Fitur

### Alur Fitur: "Tampilkan Info & Grafik Saham AAPL"

#### Langkah 1 — User Input
```
User membuka halaman Screener, klik StockCard "AAPL"
```

#### Langkah 2 — Data Masuk ke Fungsi
```python
# React (frontend/src/components/StockCard.jsx)
onClick={() => setSelectedTicker(ticker)}  // ticker = "AAPL"

# StockDetailModal.jsx
window.api.fetchCompany('AAPL').then(d => {  # IPC call
    setData(d)
})

# preload.js → ipcRenderer.invoke('fetchCompany', 'AAPL')
```

#### Langkah 3 — Disimpan di List/Dictionary
```python
# ipc_main.py — handle_command dispatcher
req = {"id": "abc123", "cmd": "company", "params": {"ticker": "AAPL"}}

# handle_company(ticker) menggunakan:
fname = to_filename("AAPL") + ".json"  # → "AAPL.json"

# Data dari file JSON dibaca sebagai dict:
data = read_cache_file("company_info", "AAPL.json")
# Returns:
# {
#   "ticker": "AAPL",
#   "info": {"identity": {...}, "price": {...}, "dividend": {...}},
#   "financials": {"income_statement": {...}}
# }
```

#### Langkah 4 — Diproses
```python
# Kalau cache/file miss, jalankan scraper:
if not data:
    company_info_scraper.run(os.path.join(DATA_DIR, "company_info"))
    data = read_cache_file("company_info", "AAPL.json")

# Scraper menggunakan:
# - List: MARKETS = {"US": [...40 ticker...], "ID": [...10...]}
# - Dict: INFO_FIELDS = {"identity": [...], "price": [...]}
# - Function: extract_info(raw_info) → grouping ke dict
# - File I/O: json.dump(data, filepath)
```

#### Langkah 5 — Ditampilkan ke UI
```python
# StockDetailModal.jsx — render data
data.info?.identity?.longName   → "Apple Inc."
data.info?.price?.currentPrice  → "$255.92"
data.info?.dividend?.dividendYield → "0.41%"
```

---

### Alur Fitur: "Portfolio — Hitung PnL"

```python
# User add posisi: beli 10 saham AAPL @ $150
# Data disimpan di SQLite (bukan JSON file):
add_position({
    "ticker": "AAPL",
    "company": "Apple Inc.",
    "shares": 10,
    "buyPrice": 150.0,
    "buyDate": "2026-01-15",
    "currency": "USD"
})

# Insert SQL:
# INSERT INTO positions (ticker, company, shares, buyPrice, buyDate, currency)
# VALUES ('AAPL', 'Apple Inc.', 10, 150.0, '2026-01-15', 'USD')

# Ketika calculate PnL:
tickers = [p['ticker'] for p in positions]    # List comprehension
prices = yf.download(tickers, period="1d")    # Download semua harga

# Hitung return per posisi:
stock_return = (current_price - buy_price) * shares
forex_return = shares * buy_price * (curr_fx - buy_fx)

# Return hasil:
{
    "positions": [
        {"ticker": "AAPL", "shares": 10, "buyPrice": 150.0,
         "currentPrice": 255.92, "stockReturn": 1059.2, "forexReturn": 0}
    ],
    "total": {"totalPnL": 1059.2, "stockReturn": 1059.2, "forexReturn": 0}
}
```

---

## 3. System Design / Desain Program

### a. Flow Program

```
┌──────────────────────────────────────────────────────────────┐
│  USER ACTION                                                  │
│  Klik StockCard / Buka halaman / Add posisi portofolio        │
└──────────────────────────┬─────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (React)                                             │
│  window.api.fetchCompany('AAPL')                              │
│  window.api.fetchOHLCV('AAPL')                               │
│  window.api.getPositions()                                   │
└──────────────────────────┬─────────────────────────────────────┘
                           ↓ IPC (invoke)
┌──────────────────────────────────────────────────────────────┐
│  ELECTRON MAIN PROCESS (main.js)                              │
│  ipcMain.handle('fetchCompany', ...) → sendToPython(...)    │
│  pythonProcess.stdin.write(JSON message)  ← STDIN            │
└──────────────────────────┬─────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  PYTHON BACKEND (ipc_main.py)                               │
│  main() — infinite loop: read STDIN → handle_command()      │
│  handle_company(ticker) / handle_ohlcv(ticker) / ...          │
│      ├─ cache_get()     ← SQLite cache                       │
│      ├─ read_cache_file() ← JSON file                        │
│      └─ scraper.run()   ← fetch dari internet (jika miss)   │
└──────────────────────────┬─────────────────────────────────────┘
                           ↓ STDOUT
┌──────────────────────────────────────────────────────────────┐
│  ELECTRON → PYTHON RESPONSE → React setState → Render UI     │
└──────────────────────────────────────────────────────────────┘
```

### b. Struktur Kode / Modularisasi

```
backend/src/
├── ipc_main.py          # Entry point + IPC dispatcher (787 baris)
│   • main() — loop STDIN/STDOUT
│   • handle_command() — router utama
│   • handle_company/handle_ohlcv/handle_news/... — 15+ handler
│   • cache_get/cache_set — SQLite wrapper
│   • read_cache_file — baca JSON dari disk
├── cache_db.py          # SQLite wrapper (124 baris)
│   • cache_get/set/delete — operasi cache
│   • get_positions/add_position/edit/delete — CRUD portfolio
└── scrapers/             # 1 scraper per jenis data
    ├── ohlcv_scraper.py        # Harga 15-menitan via yfinance
    ├── company_info_scraper.py  # Info + keuangan via yfinance
    ├── news_scraper.py          # Berita via RSS Google News
    ├── forex_scraper.py         # Kurs via yfinance
    └── macro_scraper.py         # Kalender ekonomi via Playwright

frontend/
├── electron/
│   ├── main.js          # Spawn Python, IPC bridge, window control
│   └── preload.js       # contextBridge → window.api
└── src/
    ├── pages/
    │   ├── GlobeView.jsx       # Peta dunia + index countries
    │   ├── ScreenerView.jsx    # Grid stock cards
    │   ├── CompareView.jsx     # Bandingkan 2 index + heatmap
    │   └── PortfolioView.jsx    # CRUD posisi + PnL
    └── components/
        ├── StockDetailModal.jsx  # Overview/Chart/Financials/About
        ├── CandlestickChart.jsx  # Grafik OHLCV
        ├── MarketHeatmap.jsx    # Heatmap perubahan harga
        └── EconomicCalendar.jsx, MacroNewsPanel.jsx, dll.
```

### c. Alur Data

```
DATA DARI USER (ticker = "AAPL")
    │
    ▼
window.api.fetchCompany('AAPL')
    │ (preload.js → ipcRenderer.invoke)
    ▼
Electron main.js: sendToPython('company', {ticker:'AAPL'})
    │ (tulis JSON ke STDIN Python process)
    ▼
ipc_main.py: handle_company('AAPL')
    │
    ├─► cache_get('company:AAPL')
    │       (SQLite query: SELECT data FROM cache WHERE key='company:AAPL')
    │       Kalau ada → langsung return (CACHE HIT)
    │
    ├─► read_cache_file('company_info', 'AAPL.json')
    │       (open() → json.load() → dict)
    │       Kalau file ada → return (FILE HIT)
    │
    └─► company_info_scraper.run()
            (yfinance.Ticker('AAPL').info → json.dump())

DATA DISIMPAN DI MANA?
┌─────────────────┬──────────────────────────────────────┐
│ Jenis Data      │ Lokasi                                │
├─────────────────┼──────────────────────────────────────┤
│ Cache sementara  │ SQLite: backend/cache.db            │
│ Data perusahaan │ JSON: data/company_info/AAPL.json    │
│ Data OHLCV      │ JSON: data/ohlcv/AAPL.json          │
│ Berita           │ JSON: data/news/us_news.json        │
│ Kurs forex       │ JSON: data/forex/usd_idr.json      │
│ Kalender ekonomi │ JSON: data/macro/us_macro.json      │
└─────────────────┴──────────────────────────────────────┘
```

### d. Alasan Desain

| Keputusan Desain | Alasan |
|----------------|--------|
| **Pakai banyak function kecil?** | Tiap fungsi punya 1 job (`handle_company` = hanya soal data perusahaan). Kalau digabung 1 file besar, susah di-test dan debug. Fungsi kecil = reusable. |
| **Pakai dictionary untuk data perusahaan?** | Data perusahaan AAPL punya 8 grup berbeda (identity, price, valuation, dividend, analyst, ownership, profitability, financials). Dictionary dengan key string paling natural untuk struktur data yang kompleks ini. |
| **Pisah file scraper?** | `ohlcv_scraper.py` bisa jalan sendiri untuk update harga saja. `company_info_scraper.py` bisa jalan sendiri. Kalau digabung 1 file besar (5000+ baris), susah maintenance. |
| **Pakai SQLite untuk cache?** | Request `handle_company('AAPL')` dipanggil berkali-kali (GlobeView + CompareView + StockCard). Baca dari SQLite (1 query, ~1ms) jauh lebih cepat dari `json.load()` dari file (~10ms). |
| **Procedural bukan class/OOP?** | Scraper bersifat stateless — input → proses → output. Tidak butuh class untuk menyimpan state antar pemanggilan. Function lebih simpel. |
| **IPC via STDIN/STDOUT?** | Electron ↔ Python di same machine. TCP socket = overkill. Pipe STDIN/STDOUT = simple, cepat, tidak perlu network. |
| **JSON untuk persistent storage?** | Data scraped dari internet (company info, OHLCV) strukturnya kompleks dan bervariasi. SQLite (relational) tidak cocok untuk JSON bersarang. JSON = readable, mudah di-debug. |
| **Cache TTL (Time To Live)?** | OHLCV TTL = 1 jam (harga berubah terus). Company info TTL = 24 jam (laporan keuangan mingguan). economicsCalendar TTL = 6 jam. Ini mencegah data outdated tanpa harus fetch terus-terusan. |

---

## 4. Ringkasan

| Konsep | Penggunaan di MAPRO |
|--------|-------------------|
| **Fungsi (def)** | 74 fungsi — handle request, scrappe data, baca/tulis file, cache management |
| **Class** | 1 class saja (`OGParser`) untuk parsing HTML |
| **List** | Menyimpan ticker (40 saham), candles OHLCV (780 per saham) |
| **Dictionary** | Data perusahaan (8 grup), config scraper, API response |
| **Tuple** | SQL parameterized queries |
| **File JSON** | Persistent storage untuk data scraped |
| **SQLite** | Fast cache untuk data yang sering diakses |
| **IPC STDIN/STDOUT** | Komunikasi Electron ↔ Python |
