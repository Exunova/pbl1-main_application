# MAPRO - Multimarket Analytics Portfolio Tracker

MAPRO adalah aplikasi desktop investasi personal yang mengintegrasikan data makroekonomi global, equity screening multi-region, dan portfolio management dalam satu dashboard. Dirancang sebagai tugas kuliah di POLBAN (Politeknik Negeri Bandung).

---

## Fitur Utama

### Tab 1 - World Map (Globe View)
- Pemetaan negara dengan warna hijau-merah berdasarkan performa closing index
- Warna hijau = index positif, warna merah = index negatif
- Intensitas warna menunjukkan besarnya pergerakan harga
- Negara dapat diklik untuk menampilkan panel event makroekonomi negara tersebut
- Data warna di-refresh setiap hari

### Tab 2 - Stock Screener
- Menampilkan 10 ticker saham dari region yang dipilih
- Grafik line harga untuk setiap saham
- Klik grafik untuk membuka tab detail dengan grafik candlestick
- Panel overview perusahaan (PE ratio, market cap, dividen, rekomendasi analis)
- Filter dan sort berdasarkan perubahan hari ini atau sektor

### Tab 3 - Compare Index
- 2 bilah selector untuk memilih index yang ingin dibandingkan
- Grafik perbandingan kedua index
- Market heatmap dari curated list top 10 by market cap
- News feed terkait index dari Google News RSS

### Tab 4 - Portfolio Tracker
- Tambah posisi saham secara manual (ticker, harga beli, jumlah lot, tanggal beli)
- Tabel holdings dengan unrealized PnL, presentase return, valuasi saat ini
- Klik baris untuk expand detail dan grafik valuasi
- Data disimpan lokal di SQLite
- Harga current di-fetch setiap buka aplikasi

---

## Tech Stack

| Layer                   | Teknologi                                       |
| ----------------------- | ----------------------------------------------- |
| Desktop shell           | Electron (Chromium-based)                      |
| Frontend                | React + Vite                                    |
| Styling                 | Tailwind CSS                                    |
| Backend / scripting     | Python                                          |
| Database lokal          | SQLite                                          |
| Charting                | Recharts, lightweight-charts                    |
| Globe / Map             | D3.js (choropleth 2D)                           |
| Data fetching           | yfinance, feedparser, Playwright (Investing.com) |

---

## Persyaratan Sistem

### Umum
- Node.js 20.x atau lebih baru
- Python 3.10 atau lebih baru
- npm atau yarn

### Untuk Development
- Git
- Terminal bash (Linux/macOS) atau Git Bash / WSL (Windows)

### Untuk Running
- 4GB RAM minimum
- Koneksi internet untuk fetching data awal
- OS: Windows 10+, macOS 10.15+, atau Linux (Ubuntu 20.04+)

---

## Struktur Proyek

```
pbl1-main_application/
|-- backend/                  # Backend Python
|   |-- src/
|   |   |-- scrapers/       # Modul scraping (yfinance, feedparser, Playwright)
|   |   |-- cache_db.py     # Database SQLite dan cache management
|   |   |-- ipc_main.py     # IPC bridge (stdin/stdout)
|   |   |-- requirements.txt
|   |   |-- venv/           # Virtual environment Python
|-- frontend/               # Frontend Electron + React
|   |-- src/
|   |   |-- pages/         # Halaman utama (GlobeView, ScreenerView, dll)
|   |   |-- components/    # Komponen UI (Chart, Globe, Sidebar, dll)
|   |   |-- contexts/      # React contexts
|   |   |-- hooks/         # Custom hooks
|   |   |-- utils/         # Utility functions
|-- data/                   # Data JSON hasil scraping
|-- scripts/                # Script bash untuk install dan test
|-- tests/                  # Test files
|-- docs/                   # Dokumentasi internal
|-- package.json            # Konfigurasi npm utama
```

---

## Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd pbl1-main_application
```

### 2. Install Dependencies

#### Frontend (Node.js)
```bash
npm run install:frontend
```

#### Backend (Python)
```bash
npm run install:backend
```

#### Atau install semua sekaligus
```bash
npm run install:all
```

### 3. Verifikasi Instalasi
```bash
npm run test:backend   # Test Python dependencies
npm run test:frontend  # Test frontend
```

---

## Cara Menjalankan

### Development Mode
```bash
npm run dev
```

### Build untuk Production
```bash
npm run build
```

### Menjalankan Aplikasi (setelah build)
File executable akan berada di `frontend/out/main/`

---

## Sumber Data

### Yahoo Finance (yfinance)
Mengambil data harga saham, valuta asing, dan info perusahaan.
- Harga current dan perubahan harian
- Data OHLCV historis (15 menit interval, maksimal 60 hari)
- Valuasi, dividen, rekomendasi analis

### Google News RSS (feedparser)
Mengambil berita terkini dari Google News per region.
- Indonesia: "IHSG OR saham Indonesia"
- US: "S&P 500 OR Wall Street"
- Japan: "Nikkei OR Tokyo Stock Exchange"

### Investing.com (Playwright)
Scraping kalender ekonomi makro.
- Nama event ekonomi
- Tanggal dan waktu event
- Tingkat impact (low/medium/high)
- Nilai aktual, forecast, dan previous

---

## Cache dan Database

### SQLite Tables

| Tabel             | Fungsi                                                      |
| ----------------- | ----------------------------------------------------------- |
| `positions`       | Menyimpan riwayat transaksi posisi aset user                |
| `cache`           | Menyimpan hasil response API untuk caching dengan TTL       |
| `scrape_status`   | Menyimpan status aktivitas scraper                           |

### File JSON Backup

| Folder         | Isi                                                        |
| -------------- | ---------------------------------------------------------- |
| `data/ohlcv/`  | Riwayat harga candlestick per ticker                       |
| `data/news/`   | Arsip berita Google News per region                        |
| `data/macro/`  | Kalender event ekonomi per negara                          |
| `data/forex/`  | Kurs valuta asing dan fluktuasi pasangan mata uang         |
| `data/company_info/` | Info fundamental perusahaan per emiten               |

---

## Arsitektur

### IPC (Inter-Process Communication)
Aplikasi menggunakan arsitektur dua proses:
1. **Node.js/Electron**: Menangani UI dan interaksi user
2. **Python**: Menangani data fetching, processing, dan database

Komunikasi dilakukan melalui stdin/stdout dengan format JSON.

### Data Flow
1. Ekstraktor data menarik dari Yahoo Finance, Google News RSS, dan Investing.com
2. Data disimpan ke SQLite (metadata) dan file JSON (data mentah)
3. IPC bridge menerima request dari frontend dan mengembalikan data
4. Frontend me-render data ke komponen visual (chart, globe, tabel)

---

## Design System

### Tema Warna
- Background: `#0d0f14`
- Surface: `#141720`
- Card: `#1c2030`
- Accent Blue: `#3b82f6`
- Green (positif): `#22c55e`
- Red (negatif): `#ef4444`

### Gaya Visual
- Dark theme only
- Bloomberg Terminal aesthetic - dense, minimal, profesional
- Frameless window dengan custom titlebar

---

## Catatan Teknis

| Aspek                    | Keterangan                                             |
| ------------------------ | ------------------------------------------------------ |
| OHLCV 1 menit            | Maksimal 7 hari (batas Yahoo Finance)                  |
| OHLCV 15 menit           | Maksimal 60 hari (tidak dijamin penuh, bisa 45-55 hari)|
| Batch fetch              | Menggunakan thread untuk menghindari rate limiting     |
| Cache TTL                | Tergantung jenis data (1-24 jam)                       |

---

## Lisensi

Private - Tugas Kuliah POLBAN
