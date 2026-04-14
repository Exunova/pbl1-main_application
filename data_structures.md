# Struktur Penyimpanan Data Aplikasi MAPRO

Berdasarkan analisis file SQLite dan Data Scraper (`backend/src/cache_db.py`, `backend/src/ipc_main.py`, dan Folder Data `data/`), terdapat dua metode struktur data utama di project ini:

## 1. Database Relasional (SQLite)
Digunakan untuk data lokal user yang persisten (tidak akan kedaluwarsa oleh cache) serta tabel pemantauan kondisi cache. Berada di file `cache.db`. Memiliki tiga buah tabel:

### A. Tabel `positions` (Manajemen Portofolio)
Menyimpan riwayat dan data transaksi posisi aset personal pengguna.
- **Kunci**: `id` (*INTEGER, Primary Key, Autoincrement*) - sebagai penanda unik baris aset saham yang dibeli.
- **Nilai yang Disimpan**:
  - `ticker` (TEXT): Kode lambang Saham (Mis: "AAPL" / "BBCA.JK")
  - `company` (TEXT): Nama panjang Perusahaan
  - `shares` (REAL): Jumlah lembar nilai unit yang dibeli user
  - `buyPrice` (REAL): Harga modal awal beli
  - `buyDate` (TEXT): Rekam historis tanggal pembelian
  - `currency` (TEXT): Mata uang asal pembelian saham (IDR, USD, GBP, JPY).

### B. Tabel `cache` (Cache Data JSON)
Menyimpan hasil response _scraping API_ lengkap menjadi teks JSON panjang, ini dipakai agar aplikasi tidak mengirim request berulang-ulang ketika ada di bawah TTL (Time to Live).
- **Kunci**: `key` (TEXT, Primary Key) - contohnya `"ohlcv:US"`, `"news:ID"`, atau `"macro:JP"`.
- **Nilai yang Disimpan**:
  - `data` (TEXT): Keseluruhan Object JSON yang di dumps menjadi string panjang. Memuat data utuh API (misal data 10 candlestick beserta harganya).
  - `updated_at` (TEXT): Timestamp batas waktu penarikan cache.

### C. Tabel `scrape_status`
Menyimpan indikator rekam status aktivitas scraper (apakah scraper tertentu sukses ditarik barusan, error, atau timeout).
- **Kunci**: `key` (TEXT, Primary Key) - contohnya `"news"`, `"forex"`.
- **Nilai yang Disimpan**:
  - `updated_at` (TEXT): Waktu penarikan record status ini dibuat.
  - `status` (TEXT): Keterangan info, bisa berisi waktu status beres atau teks string error `error: TimeOutException`.

---

## 2. Flat-File Penyimpanan Data (File Terstruktur `.json`)
Selain SQLite, aplikasi mem-*backup*/menyimpan hasil *scrape* API ke dalam wujud file `json` per-entitas, di organisasi spesifik ke dalam direktori `/data/` sebagai duplikasi fisik persisten jika database dikosongkan. 
Terdapat 5 sub-folder struktur penyimpanan file data: 

*   `data/ohlcv/`: Berisi riwayat harga candlestick (`open`, `high`, `low`, `close`, `volume`) tiap 15 menit. File dinamai dengan ticker misal `AAPL.json`.
*   `data/news/`: Berisi arsip tangkapan Google News per-Region (`us_news.json`, `id_news.json`). Di dalamnya memuat array of dictionary per artikel (judul, asal link, penerbit, tgl rilis).
*   `data/macro/`: Menyimpan jadwal rilis agenda kalender Ekonomi (*Event name*, *date*, *High/Low impact indicator*, *forecast/actual stat*). Dipecah berdasar dua digit kode negara mis: `us_macro.json`.
*   `data/forex/`: Menyimpan Kurs rate dan array data fluktuasi pasangan nilai tukar uang asing. Contoh: `usd_idr.json` menyimpan rasio penukaran _Dollar to Rupiah_.
*   `data/company_info/`: Menyimpan sangat banyak key-values tentang info satu emiten. Di dalam file (misal `META.json`), terdapat profil fundamental perseroan (`marketCap`, `PE ratio`, `devidendYield`, `EPS` dll).
