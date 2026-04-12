# MAPRO — Konteks Lengkap Aplikasi

> Dokumen ini adalah konteks komprehensif tentang aplikasi MAPRO untuk digunakan
> sebagai referensi LLM. Dibuat berdasarkan sesi diskusi perancangan. Terakhir
> diperbarui: April 2026.

---

## 1. Identitas Aplikasi

| Atribut             | Detail                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| **Nama**            | MAPRO (Market Analytics Pro / Multimarket Analytics Pro)                 |
| **Jenis**           | Desktop application                                                      |
| **Tujuan**          | Personal Investment Intelligence Dashboard untuk tugas kuliah            |
| **Target pengguna** | Investor retail / mahasiswa yang ingin memantau pasar saham multi-region |
| **Institusi**       | POLBAN (Politeknik Negeri Bandung)                                       |

**Pitch satu kalimat:**

> _"MAPRO adalah dashboard investasi personal yang mengintegrasikan data
> makroekonomi global, equity screening multi-region, dan portfolio management —
> dengan arsitektur data yang dirancang extensible dari free provider ke
> commercial API."_

---

## 2. Tech Stack

| Layer                   | Teknologi                                            |
| ----------------------- | ---------------------------------------------------- |
| **Desktop shell**       | Electron (Chromium-based)                            |
| **Frontend**            | HTML/CSS/JS atau React + Vite (renderer process)     |
| **Styling**             | Tailwind CSS                                         |
| **Backend / scripting** | Python                                               |
| **Database lokal**      | SQLite (via `better-sqlite3` atau Python `sqlite3`)  |
| **Charting**            | Recharts / lightweight-charts                        |
| **Globe / Map**         | D3.js choropleth (2D) — bukan Three.js 3D            |
| **Data fetching**       | `yfinance`, `feedparser`, web scraping Investing.com |

**Design system:**

- Dark theme only. Background: `#0d0f14`. Surface: `#141720`. Card: `#1c2030`.
- Accent: `#3b82f6` (blue). Green: `#22c55e`. Red: `#ef4444`.
- Aesthetic: Bloomberg Terminal modern — dense, minimal, profesional.
- Frameless window dengan custom titlebar.

---

## 3. Fitur & Tab Aplikasi

### Tab 1 — World Map (Globe View)

- Menampilkan bukan 3D globe
- Setiap negara diberi warna **hijau–merah** berdasarkan performa closing
  index-nya:
  - Hijau = index positif, merah = negatif
  - Semakin pekat warnanya, semakin besar pergerakannya
  - Putih keabuan = tidak mengalami kenaikan harga
- Negara **clickable**: saat diklik, muncul panel list event makroekonomi negara
  tersebut
- Inspirasi visual: Kaspersky Cyberattack Map (pulse/beacon effect)
- Data warna di-refresh **harian**

### Tab 2 — Stock Screener

- Menampilkan **10 ticker saham** dari region yang dipilih user saat registrasi
- Setiap saham ditampilkan dengan **grafik line harga**
- Klik grafik → membuka tab baru dengan:
  - **Grafik candlestick** (ala TradingView)
  - **Panel overview perusahaan** di sebelah kanan (dari yfinance): PE ratio,
    market cap, sector, dividen, rekomendasi analis, dll.
- Fitur opsional: filter/sort by % change hari ini atau by sector

### Tab 3 — Compare Index

- Terdapat **2 bilah selector** untuk memilih index yang ingin dibandingkan
- Konten halaman:
  - Grafik perbandingan kedua index
  - **Market heatmap** (dari curated list top 10 by market cap, diberi label
    eksplisit)
  - **News feed** terkait index tersebut (dari Google News RSS)

### Tab 4 — Portfolio Tracker

- User bisa menambahkan posisi saham secara manual: ticker, harga beli, jumlah
  lot, tanggal beli
- Tampilan: tabel holdings dengan kolom unrealized P&L, % return, valuasi saat
  ini
- Klik baris → expand detail: info transaksi + grafik valuasi dari tanggal beli
  hingga hari ini
- Data disimpan lokal di **SQLite**
- Harga current di-fetch tiap buka app (batch, bukan serial)

### Fitur Tambahan (Opsional)

- **LLM Integration**: Tombol "Analyze" di halaman detail saham atau compare
  index
  - LLM menerima konteks berupa data yang sudah ada di layar (harga, % change,
    news headlines)
  - Output: ringkasan kondisi pasar dalam bahasa natural (3 kalimat)
  - **Bukan** rekomendasi beli/jual — posisinya sebagai AI summarizer konteks
  - Implementasi via Anthropic API

---

## 4. Sumber Data

### 4.1 Yahoo Finance (`yfinance`)

Library Python. Bukan official API — scraping endpoint Yahoo Finance.

**Untuk Globe (Index):**

| Data                 | Field                                |
| -------------------- | ------------------------------------ |
| Harga current index  | `info["regularMarketPrice"]`         |
| % perubahan hari ini | `info["regularMarketChangePercent"]` |

**Untuk Stock Screener & Detail:**

| Data                                    | Field                                                   | Frekuensi              |
| --------------------------------------- | ------------------------------------------------------- | ---------------------- |
| Harga current                           | `info["currentPrice"]`                                  | Tiap buka app          |
| Price stats (open, high, low, bid, ask) | `info[...]`                                             | Tiap buka app          |
| 52W range, MA50, MA200                  | `fiftyTwoWeekHigh`, `fiftyDayAverage`, dll.             | Harian                 |
| Volume                                  | `volume`, `averageVolume`                               | Harian                 |
| Valuasi (PE, PB, EV, EPS)               | `trailingPE`, `priceToBook`, dll.                       | Mingguan               |
| Profitabilitas (margin, ROE, ROA)       | `profitMargins`, `returnOnEquity`, dll.                 | Mingguan               |
| Dividen                                 | `dividendRate`, `dividendYield`, `payoutRatio`          | Mingguan               |
| Rekomendasi analis                      | `recommendationKey`, `targetMeanPrice`, dll.            | Mingguan               |
| Profil perusahaan                       | `longName`, `sector`, `industry`, `longBusinessSummary` | Sekali saat add ticker |
| OHLCV historis                          | `ticker.history(period="60d", interval="15m")`          | Tiap buka app          |

**Catatan batas OHLCV:**

| Interval | Batas historis                                  |
| -------- | ----------------------------------------------- |
| 1 menit  | 7 hari (hard limit Yahoo)                       |
| 15 menit | ~60 hari (tidak dijamin penuh, bisa 45–55 hari) |
| 1 hari   | Tersedia bertahun-tahun                         |

### 4.2 Google News RSS (`feedparser`)

| Data            | Field                    | Frekuensi    |
| --------------- | ------------------------ | ------------ |
| Headline        | `entries[].title`        | Tiap 1–2 jam |
| Link artikel    | `entries[].link`         | Tiap 1–2 jam |
| Publisher       | `entries[].source.title` | Tiap 1–2 jam |
| Waktu publikasi | `entries[].published`    | Tiap 1–2 jam |

**Keyword query per region:**

```
Indonesia  → "IHSG OR saham Indonesia"
US         → "S&P 500 OR Wall Street"
Japan      → "Nikkei OR Tokyo Stock Exchange"
```

### 4.3 Investing.com (Web Scraping)

| Data                             | Frekuensi |
| -------------------------------- | --------- |
| Nama event ekonomi               | Harian    |
| Tanggal & waktu event            | Harian    |
| Tingkat impact (low/medium/high) | Harian    |
| Nilai aktual/forecast/previous   | Harian    |

**Catatan:** Tidak ada official API. Scraping HTML dari `/economic-calendar`.
Library `investpy` sudah deprecated.

### 4.4 Data Hardcode / Statis

| Data                           | Keterangan                                   |
| ------------------------------ | -------------------------------------------- |
| Curated ticker list per region | 10–15 ticker top market cap per index        |
| Mapping ticker index → negara  | `^JKSE` → ID, `^GSPC` → US, dll.             |
| GeoJSON negara                 | Dari `unpkg.com/world-atlas`, disimpan lokal |
| Keyword news per negara        | Mapping statis                               |

---

## 6. Jadwal Fetch

| Frekuensi                  | Data                                         | Sumber          |
| -------------------------- | -------------------------------------------- | --------------- |
| **Tiap buka app**          | Current price semua ticker (batch)           | yfinance        |
| **Tiap buka app**          | Current price & % change semua index (globe) | yfinance        |
| **Tiap buka app**          | OHLCV 60d/15m per ticker di screener         | yfinance        |
| **Tiap 1–2 jam**           | News per region (10 artikel teratas)         | Google News RSS |
| **Harian**                 | Economic calendar semua negara               | Investing.com   |
| **Harian**                 | % change index untuk globe color refresh     | yfinance        |
| **Mingguan**               | Fundamentals, valuasi, dividen, analis       | yfinance        |
| **Sekali saat add ticker** | Profil, sektor, industri, manajemen          | yfinance        |

**Strategi batch fetch (aman dari rate limiting):**

```python
import yfinance as yf

tickers = ["BBCA.JK", "TLKM.JK", "AAPL", ...]  # 40 ticker

# 1 request untuk semua ticker sekaligus — jauh lebih aman dari serial loop
df = yf.download(
    tickers=" ".join(tickers),
    period="60d",
    interval="15m",
    group_by="ticker",
    auto_adjust=True,
    threads=True
)
```

**Catatan 40 ticker × 60 hari × 15m:**

- Volume data: ~62.400 candle — ringan secara ukuran
- Risiko rate limit: rendah jika pakai batch download
- 60 hari adalah batas maksimum, tidak dijamin penuh (bisa 45–55 hari)
- Wajib cache ke SQLite segera setelah fetch

---

## 8. Data scraping di Cache di SQLite

## 10. Limitasi yang Diketahui

| Limitasi                | Keterangan                                       |
| ----------------------- | ------------------------------------------------ |
| OHLCV 1m                | Hanya 7 hari terakhir (hard limit Yahoo)         |
| OHLCV 15m               | ~60 hari, tidak dijamin penuh                    |
| Investing.com           | Tidak ada official API, scraping bisa berubah    |
| yfinance rate limit     | HTTP 429 jika fetch serial terlalu cepat         |
| Data IDX `.JK`          | Terkadang ada gap/delay karena re-feed dari IDX  |
| yfinance bukan official | Yahoo bisa mengubah endpoint tanpa pemberitahuan |
