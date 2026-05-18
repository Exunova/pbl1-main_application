# Test Cases — Aplikasi MAPRO
> **MAPRO** — Multimarket Analytics Portfolio Tracker  
> Dokumen ini mencakup seluruh test case untuk pengujian fungsional, integrasi, performa, dan edge case aplikasi MAPRO.

---

## Konvensi Dokumen

| Kolom | Keterangan |
|---|---|
| **TC-ID** | ID unik test case (e.g., `SCR-001`) |
| **Prioritas** | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |
| **Tipe** | Unit / Integrasi / E2E / Performa / Negatif |
| **Expected Result** | Hasil yang diharapkan jika sistem bekerja benar |
| **Status** | ⬜ Belum Diuji |

---

## Daftar Modul

1. [Scraping Engine](#1-scraping-engine)
2. [Caching & TTL](#2-caching--ttl)
3. [IPC (Inter-Process Communication)](#3-ipc-inter-process-communication)
4. [Manajemen Portofolio — CRUD](#4-manajemen-portofolio--crud)
5. [Kalkulasi PnL](#5-kalkulasi-pnl-profit-and-loss)
6. [Frontend — Halaman & Komponen](#6-frontend--halaman--komponen)
7. [Background Worker](#7-background-worker)
8. [Integrasi End-to-End](#8-integrasi-end-to-end)
9. [Performa & Stabilitas](#9-performa--stabilitas)
10. [Edge Case & Skenario Negatif](#10-edge-case--skenario-negatif)
11. [Keamanan & Keandalan Data](#11-keamanan--keandalan-data)

---

## 1. Scraping Engine

### 1.1 OHLCV Scraper (`ohlcv_scraper.py`)

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| SCR-001 | Scrape OHLCV ticker saham US valid | Jalankan scraper dengan ticker `AAPL` | Mengembalikan list dict berisi `timestamp, open, high, low, close, volume`; jumlah candle ≈ 780 (30 hari × interval 15 menit) | 🔴 Critical | Unit | ⬜ |
| SCR-002 | Scrape OHLCV ticker saham Indonesia valid | Jalankan scraper dengan ticker `BBCA.JK` | Data OHLCV ter-return dengan benar sesuai format | 🔴 Critical | Unit | ⬜ |
| SCR-003 | Scrape OHLCV ticker saham Asia valid | Jalankan scraper dengan ticker `9984.T` (SoftBank/Tokyo) | Data OHLCV ter-return dengan benar | 🟠 High | Unit | ⬜ |
| SCR-004 | Validasi format output OHLCV | Periksa setiap dict pada output scraper | Setiap entry memiliki semua 6 key: `timestamp, open, high, low, close, volume`; tidak ada nilai `None` atau `NaN` | 🔴 Critical | Unit | ⬜ |
| SCR-005 | Validasi tipe data OHLCV | Periksa tipe data tiap field | `timestamp` bertipe string/datetime, numerik fields bertipe `float`, `volume` bertipe `int` | 🟠 High | Unit | ⬜ |
| SCR-006 | Scrape ticker tidak valid/tidak ada | Jalankan scraper dengan ticker `XYZXYZ999` | Mengembalikan error yang terdefinisi (exception tertangkap) atau list kosong; aplikasi tidak crash | 🔴 Critical | Negatif | ⬜ |
| SCR-007 | Scrape ticker kosong/null | Jalankan scraper dengan ticker `""` atau `None` | Mengembalikan error validasi yang jelas; tidak crash | 🔴 Critical | Negatif | ⬜ |
| SCR-008 | Scraper berjalan saat tidak ada internet | Simulasikan offline, jalankan scraper | Scraper melempar exception yang tertangkap, tidak hang/freeze | 🟠 High | Negatif | ⬜ |
| SCR-009 | Jumlah candle sesuai rentang waktu | Bandingkan jumlah candle hasil scraping dengan ekspektasi (30 hari × 26 jam trading × 4 candle/jam) | Jumlah candle dalam toleransi ±10% dari 780 | 🟡 Medium | Unit | ⬜ |
| SCR-010 | Urutan timestamp ascending | Periksa urutan `timestamp` pada output | Setiap `timestamp[i] < timestamp[i+1]` (tidak ada loncat atau balik) | 🟠 High | Unit | ⬜ |
| SCR-011 | Scrape saat market tutup (weekend) | Jalankan scraper pada hari Sabtu/Minggu | Tetap mengembalikan data historis yang tersedia; tidak error | 🟡 Medium | Unit | ⬜ |
| SCR-012 | Scrape multiple ticker secara berurutan | Panggil scraper untuk `AAPL`, `NVDA`, `BBCA.JK` | Ketiga ticker mengembalikan data yang benar tanpa saling menimpa | 🟠 High | Integrasi | ⬜ |

### 1.2 Company Info Scraper (`company_info_scraper.py`)

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| SCR-013 | Scrape profil perusahaan US valid | Jalankan dengan ticker `MSFT` | Data ter-return dan terbagi ke 8 kategori: `identity, price, valuation, profitability, dividend, analyst, ownership, financials` | 🔴 Critical | Unit | ⬜ |
| SCR-014 | Kelengkapan 8 kategori output | Periksa keys output company info | Semua 8 kategori hadir sebagai keys dalam output dict | 🔴 Critical | Unit | ⬜ |
| SCR-015 | Scrape income statement | Periksa isi kategori `financials` | Terdapat data income statement dengan minimal field: revenue, net income, operating income | 🟠 High | Unit | ⬜ |
| SCR-016 | Scrape balance sheet | Periksa isi balance sheet dalam `financials` | Terdapat data aset, liabilitas, dan ekuitas | 🟠 High | Unit | ⬜ |
| SCR-017 | Scrape cash flow statement | Periksa isi cashflow dalam `financials` | Terdapat data operating/investing/financing cash flow | 🟠 High | Unit | ⬜ |
| SCR-018 | Scrape saham tanpa dividen | Jalankan dengan ticker perusahaan tanpa dividen (e.g., `AMZN`) | Kategori `dividend` ter-return dengan nilai `null` atau `0`; tidak error | 🟡 Medium | Unit | ⬜ |
| SCR-019 | Scrape data analis (rekomendasi) | Periksa kategori `analyst` | Terdapat data rekomendasi (buy/hold/sell) dengan jumlah analis | 🟡 Medium | Unit | ⬜ |
| SCR-020 | Validasi PE ratio reasonable | Periksa nilai PE ratio untuk perusahaan profitabel | PE ratio bernilai positif dan dalam kisaran wajar (1–1000) | 🟡 Medium | Unit | ⬜ |
| SCR-021 | Scrape perusahaan tidak terdaftar di market | Ticker `INVALID123` | Error tertangkap, response berisi pesan error; tidak crash | 🔴 Critical | Negatif | ⬜ |

### 1.3 News Scraper (`news_scraper.py`)

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| SCR-022 | Scrape berita region US | Jalankan news scraper dengan region `US` | Mengembalikan list artikel berita pasar US | 🔴 Critical | Unit | ⬜ |
| SCR-023 | Scrape berita region ID | Jalankan news scraper dengan region `ID` | Mengembalikan list artikel berita pasar Indonesia | 🔴 Critical | Unit | ⬜ |
| SCR-024 | Kelengkapan field per artikel | Periksa setiap artikel pada output | Setiap artikel memiliki minimal: `title`, `link`, `published`, dan `thumbnail` (atau null jika tidak ada) | 🟠 High | Unit | ⬜ |
| SCR-025 | Ekstraksi og:image thumbnail | Periksa apakah thumbnail/og:image ter-scrape | Field `thumbnail` berisi URL gambar valid atau `null` | 🟡 Medium | Unit | ⬜ |
| SCR-026 | Scrape region tidak valid | Jalankan dengan region `ZZ` atau `""` | Error tertangkap; tidak crash | 🟠 High | Negatif | ⬜ |
| SCR-027 | Berita ter-sort berdasarkan waktu terbaru | Periksa urutan field `published` | Artikel diurutkan dari yang terbaru ke terlama | 🟡 Medium | Unit | ⬜ |
| SCR-028 | Ketahanan saat RSS feed tidak tersedia | Mock respons RSS kosong/gagal | Mengembalikan list kosong; tidak crash | 🟠 High | Negatif | ⬜ |

### 1.4 Forex Scraper (`forex_scraper.py`)

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| SCR-029 | Scrape kurs USD/IDR | Jalankan dengan pair `USDIDR=X` | Mengembalikan kurs saat ini dan history 30 hari | 🔴 Critical | Unit | ⬜ |
| SCR-030 | Scrape kurs USD/JPY | Jalankan dengan pair `USDJPY=X` | Data kurs ter-return dengan benar | 🟠 High | Unit | ⬜ |
| SCR-031 | Validasi nilai kurs wajar | Periksa nilai kurs USD/IDR | Nilai berada dalam kisaran 14.000 – 20.000 (sanity check) | 🟡 Medium | Unit | ⬜ |
| SCR-032 | Scrape pair tidak valid | Jalankan dengan pair `ABCDEF=X` | Error tertangkap; tidak crash | 🟠 High | Negatif | ⬜ |
| SCR-033 | Kelengkapan history 30 hari | Hitung jumlah data poin history | Terdapat ≥ 20 data poin (hari trading, bukan kalender) | 🟡 Medium | Unit | ⬜ |

### 1.5 Macro Scraper (`macro_scraper.py`)

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| SCR-034 | Scrape kalender ekonomi US | Jalankan macro scraper untuk negara `US` | Mengembalikan list event ekonomi dengan field: `event_name, date, impact, actual, forecast, previous` | 🔴 Critical | Unit | ⬜ |
| SCR-035 | Playwright browser terbuka headless | Jalankan macro scraper | Tidak ada window browser yang muncul di layar; proses berjalan di background | 🟠 High | Unit | ⬜ |
| SCR-036 | Filter tanggal berjalan dengan benar | Verifikasi bahwa events ter-filter sesuai range tanggal | Events yang dikembalikan berada dalam range tanggal yang di-request | 🟠 High | Unit | ⬜ |
| SCR-037 | Validasi nilai `impact` | Periksa field `impact` pada setiap event | Nilai hanya berisi `low`, `medium`, atau `high` | 🟡 Medium | Unit | ⬜ |
| SCR-038 | Timeout saat investing.com tidak responsif | Mock timeout jaringan saat Playwright membuka halaman | Scraper timeout dengan grace (bukan hang selamanya); exception tertangkap | 🔴 Critical | Negatif | ⬜ |
| SCR-039 | DOM structure berubah di investing.com | Mock perubahan struktur tabel HTML | Scraper melempar exception yang informatif; tidak mengembalikan data korup | 🟠 High | Negatif | ⬜ |
| SCR-040 | Scrape kalender saat tidak ada event | Mock halaman tanpa event | Mengembalikan list kosong; tidak crash | 🟡 Medium | Negatif | ⬜ |

---

## 2. Caching & TTL

### 2.1 SQLite Cache (`cache_db.py`)

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| CAC-001 | Cache write — data tersimpan ke SQLite | Simpan data untuk key `company:AAPL` | Data tersimpan di tabel `cache` dengan key, data JSON, dan `updated_at` yang benar | 🔴 Critical | Unit | ⬜ |
| CAC-002 | Cache read — data terbaca dari SQLite | Baca key `company:AAPL` yang sudah ada | Mengembalikan data JSON yang sama persis seperti yang disimpan | 🔴 Critical | Unit | ⬜ |
| CAC-003 | Cache hit — data masih segar (dalam TTL) | Simpan data, baca sebelum TTL habis | Cache hit: data ter-return, scraper TIDAK dipanggil | 🔴 Critical | Integrasi | ⬜ |
| CAC-004 | Cache miss — data sudah expired | Simpan data, set `updated_at` ke waktu lampau, baca | Cache miss: scraper DIPANGGIL untuk refresh data | 🔴 Critical | Integrasi | ⬜ |
| CAC-005 | Cache miss — key tidak ada | Baca key yang belum pernah disimpan | Mengembalikan `None` atau indikasi "tidak ada"; tidak error | 🔴 Critical | Unit | ⬜ |
| CAC-006 | Update cache (overwrite) | Simpan data baru untuk key yang sudah ada | Data lama tertimpa; `updated_at` diperbarui | 🟠 High | Unit | ⬜ |
| CAC-007 | TTL OHLCV = 1 jam | Simpan data OHLCV, cek status setelah >1 jam (simulasi) | Cache expired; trigger scraping ulang | 🔴 Critical | Unit | ⬜ |
| CAC-008 | TTL Company Info = 24 jam | Simpan data company, cek status setelah >24 jam (simulasi) | Cache expired; trigger scraping ulang | 🔴 Critical | Unit | ⬜ |
| CAC-009 | TTL Macro & News = 6 jam | Simpan data macro/news, cek setelah >6 jam (simulasi) | Cache expired; trigger scraping ulang | 🔴 Critical | Unit | ⬜ |
| CAC-010 | TTL Forex = 1 jam | Simpan data forex, cek setelah >1 jam (simulasi) | Cache expired; trigger scraping ulang | 🔴 Critical | Unit | ⬜ |
| CAC-011 | Cache tidak terpengaruh TTL yang salah | Set `updated_at` ke masa depan | Cache dianggap masih segar; data dikembalikan | 🟡 Medium | Unit | ⬜ |
| CAC-012 | Performa query SQLite | Ukur waktu query read untuk 1000 key di cache | Waktu query < 100ms untuk single read | 🟡 Medium | Performa | ⬜ |
| CAC-013 | Integritas data JSON tersimpan | Simpan JSON kompleks (nested dict/list), baca kembali | JSON yang dibaca identik dengan yang disimpan (no data loss) | 🟠 High | Unit | ⬜ |
| CAC-014 | SQLite file tidak ada | Hapus `cache.db`, jalankan aplikasi | Aplikasi membuat `cache.db` baru otomatis; tidak crash | 🔴 Critical | Negatif | ⬜ |

### 2.2 File JSON Backup (`data/` folder)

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| CAC-015 | Data disimpan ke file JSON setelah scraping | Jalankan scraping AAPL, periksa `data/ohlcv/AAPL.json` | File JSON ter-buat/ter-update dengan data terbaru | 🟠 High | Integrasi | ⬜ |
| CAC-016 | Fallback ke file JSON saat SQLite expired | Set cache expired, hapus koneksi scraper (mock offline), baca data | Data diambil dari file JSON; tidak error | 🟠 High | Integrasi | ⬜ |
| CAC-017 | Alur lengkap: Request → SQLite → JSON → Scraper | Hapus cache dan file JSON, request data AAPL | Sistem menjalankan scraper, menyimpan ke SQLite DAN file JSON | 🔴 Critical | Integrasi | ⬜ |
| CAC-018 | Struktur folder `data/` terbentuk otomatis | Hapus folder `data/`, jalankan scraping | Folder dan subfolder (`company_info/`, `ohlcv/`, dll.) ter-buat otomatis | 🟠 High | Unit | ⬜ |
| CAC-019 | Nama file JSON sesuai ticker/key | Scrape ticker `NVDA`, cek nama file | File tersimpan sebagai `data/ohlcv/NVDA.json` | 🟡 Medium | Unit | ⬜ |

---

## 3. IPC (Inter-Process Communication)

### 3.1 Komunikasi Frontend ↔ Backend

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| IPC-001 | Request format JSON valid ke Python | Kirim `{"id":"t1","cmd":"company","params":{"ticker":"AAPL"}}` ke STDIN Python | Python menerima, memproses, dan menulis response JSON ke STDOUT | 🔴 Critical | Integrasi | ⬜ |
| IPC-002 | Response ID cocok dengan request ID | Kirim request dengan `id: "abc123"`, terima response | Response berisi `"id":"abc123"` yang sama | 🔴 Critical | Integrasi | ⬜ |
| IPC-003 | Format response JSON valid | Periksa output STDOUT dari Python | Response selalu valid JSON: `{"id":"...","type":"response","data":{...}}` | 🔴 Critical | Integrasi | ⬜ |
| IPC-004 | Command `ohlcv` berjalan | Kirim `{"cmd":"ohlcv","params":{"ticker":"AAPL"}}` | Data OHLCV ter-return di field `data` | 🔴 Critical | E2E | ⬜ |
| IPC-005 | Command `news` berjalan | Kirim `{"cmd":"news","params":{"region":"US"}}` | Data berita US ter-return | 🔴 Critical | E2E | ⬜ |
| IPC-006 | Command `macro` berjalan | Kirim `{"cmd":"macro","params":{"country":"US"}}` | Data kalender ekonomi ter-return | 🔴 Critical | E2E | ⬜ |
| IPC-007 | Command `forex` berjalan | Kirim `{"cmd":"forex","params":{"pair":"USDIDR=X"}}` | Data kurs ter-return | 🔴 Critical | E2E | ⬜ |
| IPC-008 | Command `company` berjalan | Kirim `{"cmd":"company","params":{"ticker":"TSLA"}}` | Data profil perusahaan ter-return | 🔴 Critical | E2E | ⬜ |
| IPC-009 | Command `companies` (batch) berjalan | Kirim `{"cmd":"companies","params":{"tickers":["AAPL","NVDA"]}}` | Data kedua ticker ter-return dalam satu response | 🟠 High | E2E | ⬜ |
| IPC-010 | Command tidak dikenal | Kirim `{"cmd":"nonexistent","params":{}}` | Python mengembalikan error yang terdefinisi; tidak crash | 🔴 Critical | Negatif | ⬜ |
| IPC-011 | Request JSON malformed | Kirim string bukan JSON ke STDIN Python | Python menangkap parse error; tidak crash; mengembalikan error response | 🔴 Critical | Negatif | ⬜ |
| IPC-012 | Request tanpa field `cmd` | Kirim `{"id":"t1","params":{}}` | Error response yang jelas; tidak crash | 🟠 High | Negatif | ⬜ |
| IPC-013 | Request tanpa field `params` | Kirim `{"id":"t1","cmd":"company"}` | Error response atau default params; tidak crash | 🟠 High | Negatif | ⬜ |
| IPC-014 | Concurrent request (multiple sekaligus) | Kirim 5 request bersamaan dari frontend | Semua 5 response ter-return dengan `id` yang benar; tidak ada data tercampur | 🟠 High | Integrasi | ⬜ |
| IPC-015 | Latency IPC pipe | Ukur waktu dari kirim request hingga terima response (data dari cache) | Latency < 500ms untuk request yang hit cache | 🟡 Medium | Performa | ⬜ |
| IPC-016 | Python backend crash/restart | Kill proses Python saat aplikasi berjalan | Electron mendeteksi dan menampilkan error kepada user; tidak freeze | 🟠 High | Negatif | ⬜ |

---

## 4. Manajemen Portofolio — CRUD

### 4.1 Tambah Posisi

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| POR-001 | Tambah posisi saham US valid | Tambah `{ticker:"AAPL", shares:10, buyPrice:150.0, date:"2024-01-15", currency:"USD"}` | Posisi tersimpan di tabel `positions`; muncul di list | 🔴 Critical | E2E | ⬜ |
| POR-002 | Tambah posisi saham Indonesia | Tambah `{ticker:"BBCA.JK", shares:100, buyPrice:9500, date:"2024-03-01", currency:"IDR"}` | Posisi tersimpan dengan benar | 🔴 Critical | E2E | ⬜ |
| POR-003 | Tambah posisi dengan shares desimal | Tambah `{shares:0.5}` (fractional shares) | Tersimpan dengan benar jika didukung; atau error jelas jika tidak didukung | 🟡 Medium | E2E | ⬜ |
| POR-004 | Tambah posisi ticker duplikat | Tambah `AAPL` dua kali | Dua posisi terpisah muncul (bukan overwrite); atau error jika duplikat tidak diizinkan | 🟠 High | E2E | ⬜ |
| POR-005 | Tambah posisi dengan ticker kosong | Kirim `{ticker:"", shares:10, buyPrice:150}` | Error validasi; data tidak tersimpan | 🔴 Critical | Negatif | ⬜ |
| POR-006 | Tambah posisi dengan shares negatif | Kirim `{shares:-5}` | Error validasi; data tidak tersimpan | 🔴 Critical | Negatif | ⬜ |
| POR-007 | Tambah posisi dengan buyPrice nol | Kirim `{buyPrice:0}` | Error validasi atau data tersimpan sesuai kebijakan | 🟠 High | Negatif | ⬜ |
| POR-008 | Tambah posisi dengan buyPrice negatif | Kirim `{buyPrice:-100}` | Error validasi; data tidak tersimpan | 🔴 Critical | Negatif | ⬜ |
| POR-009 | Tambah posisi dengan tanggal masa depan | Kirim `{date:"2099-12-31"}` | Error validasi atau warning; tidak crash | 🟡 Medium | Negatif | ⬜ |
| POR-010 | Tambah posisi dengan format tanggal salah | Kirim `{date:"31-01-2024"}` | Error validasi format tanggal | 🟠 High | Negatif | ⬜ |
| POR-011 | Tambah posisi dengan mata uang tidak valid | Kirim `{currency:"XYZ"}` | Error validasi atau default ke USD | 🟡 Medium | Negatif | ⬜ |

### 4.2 Edit/Ubah Posisi

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| POR-012 | Edit shares posisi yang ada | Ubah shares AAPL dari 10 → 15 | Nilai tersimpan diperbarui; PnL otomatis menggunakan nilai baru | 🔴 Critical | E2E | ⬜ |
| POR-013 | Edit buyPrice posisi yang ada | Ubah harga beli dari 150 → 160 | Nilai tersimpan diperbarui | 🔴 Critical | E2E | ⬜ |
| POR-014 | Edit posisi yang tidak ada | Kirim edit untuk ID posisi yang tidak ada di DB | Error "not found" yang jelas; tidak crash | 🟠 High | Negatif | ⬜ |
| POR-015 | Edit tanpa mengubah nilai apapun | Kirim request edit dengan nilai sama | Operasi berhasil (no-op atau update timestamp); tidak error | 🟡 Medium | E2E | ⬜ |
| POR-016 | Edit shares menjadi nol | Ubah shares → 0 | Error validasi; atau posisi dianggap "ditutup" sesuai kebijakan | 🟠 High | Negatif | ⬜ |

### 4.3 Hapus Posisi

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| POR-017 | Hapus posisi yang ada | Hapus posisi AAPL berdasarkan ID | Posisi hilang dari tabel `positions` dan dari UI | 🔴 Critical | E2E | ⬜ |
| POR-018 | Hapus posisi yang tidak ada | Kirim delete untuk ID yang tidak ada | Error "not found"; tidak crash | 🟠 High | Negatif | ⬜ |
| POR-019 | Hapus semua posisi sekaligus | Hapus semua posisi satu per satu | DB tabel `positions` kosong; UI menampilkan empty state | 🟡 Medium | E2E | ⬜ |

### 4.4 List Posisi

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| POR-020 | Tampilkan semua posisi | Panggil `portfolio_list` dengan 3 posisi tersimpan | Mengembalikan list 3 posisi dengan semua field lengkap | 🔴 Critical | E2E | ⬜ |
| POR-021 | Tampilkan portofolio kosong | Panggil `portfolio_list` saat DB kosong | Mengembalikan list kosong `[]`; tidak error | 🔴 Critical | E2E | ⬜ |
| POR-022 | Data posisi lengkap pada list | Periksa field setiap posisi di list | Setiap posisi berisi: `id, ticker, company, shares, buyPrice, date, currency` | 🟠 High | Unit | ⬜ |

### 4.5 Import & Export Portofolio

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| POR-023 | Export portofolio | Klik export dengan 3 posisi aktif | File ter-download dengan semua posisi dalam format yang benar (CSV/JSON) | 🟠 High | E2E | ⬜ |
| POR-024 | Export portofolio kosong | Klik export saat tidak ada posisi | File kosong atau pesan "tidak ada data" yang sesuai | 🟡 Medium | E2E | ⬜ |
| POR-025 | Import portofolio valid | Upload file export yang valid | Semua posisi ter-import dan muncul di UI | 🟠 High | E2E | ⬜ |
| POR-026 | Import file format salah | Upload file `.txt` sembarang | Error validasi format file; data DB tidak terkorupsi | 🔴 Critical | Negatif | ⬜ |
| POR-027 | Import file dengan data parsial tidak lengkap | Upload file dengan field yang hilang | Error per-baris atau skip baris invalid; posisi valid tetap ter-import | 🟠 High | Negatif | ⬜ |
| POR-028 | Import file kosong | Upload file kosong | Pesan "tidak ada data untuk diimpor"; tidak crash | 🟡 Medium | Negatif | ⬜ |
| POR-029 | Round-trip: export lalu import | Export portofolio, import kembali | Semua data identik setelah round-trip | 🔴 Critical | Integrasi | ⬜ |

---

## 5. Kalkulasi PnL (Profit and Loss)

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| PNL-001 | Kalkulasi stockReturn untuk saham US | Tambah posisi `AAPL` 10 shares @ $150; mock harga sekarang $170 | `stockReturn = (170-150) × 10 = $200` | 🔴 Critical | Unit | ⬜ |
| PNL-002 | Kalkulasi stockReturn negatif (rugi) | Tambah posisi `AAPL` 10 shares @ $200; mock harga sekarang $180 | `stockReturn = (180-200) × 10 = -$200` | 🔴 Critical | Unit | ⬴ |
| PNL-003 | Kalkulasi forexReturn untuk saham luar negeri | Tambah posisi saham US dengan mata uang IDR; mock perubahan kurs | `forexReturn` dihitung berdasarkan selisih kurs × nilai beli | 🔴 Critical | Unit | ⬜ |
| PNL-004 | totalPnL = stockReturn + forexReturn | Kalkulasi dengan posisi lintas mata uang | `totalPnL` tepat = sum keduanya | 🔴 Critical | Unit | ⬜ |
| PNL-005 | PnL portofolio saham IDR (tidak ada forex impact) | Posisi `BBCA.JK` dengan currency `IDR` | `forexReturn = 0`; `totalPnL = stockReturn` saja | 🟠 High | Unit | ⬜ |
| PNL-006 | Grand total lintas semua posisi | 3 posisi berbeda; hitung grand total | Grand total = sum semua `totalPnL` per posisi | 🔴 Critical | Unit | ⬜ |
| PNL-007 | PnL saat harga saham tidak bisa diambil | Mock yfinance gagal untuk salah satu ticker | Posisi yang gagal menampilkan error/null; posisi lain tetap terhitung | 🟠 High | Negatif | ⬜ |
| PNL-008 | PnL saat kurs forex tidak bisa diambil | Mock forex scraper gagal | Error ditampilkan; tidak crash; data yang tersedia tetap tampil | 🟠 High | Negatif | ⬜ |
| PNL-009 | PnL dengan posisi shares sangat besar | Posisi `1,000,000 shares` | Kalkulasi numerik tidak overflow; hasil benar | 🟡 Medium | Unit | ⬜ |
| PNL-010 | PnL dengan harga saham sangat kecil (penny stock) | Posisi dengan `buyPrice:0.001` | Kalkulasi numerik presisi tidak loss; hasil benar | 🟡 Medium | Unit | ⬜ |
| PNL-011 | Konsistensi kalkulasi saat dipanggil berulang | Panggil `portfolio_pnl` 3× berturut-turut dengan data sama | Ketiga hasil identik; tidak ada variasi akibat race condition | 🟠 High | Integrasi | ⬜ |
| PNL-012 | PnL portofolio kosong | Panggil `portfolio_pnl` saat tidak ada posisi | Mengembalikan grand total `0`; tidak error | 🟠 High | E2E | ⬜ |

---

## 6. Frontend — Halaman & Komponen

### 6.1 GlobeView

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| UI-001 | Render peta dunia (D3.js + topojson) | Buka halaman GlobeView | Peta dunia interaktif ter-render tanpa error konsol | 🔴 Critical | E2E | ⬜ |
| UI-002 | Warna negara sesuai performa indeks | Buka GlobeView dengan data pasar | Negara dengan indeks naik berwarna hijau; turun berwarna merah | 🔴 Critical | E2E | ⬜ |
| UI-003 | Hover pada negara menampilkan info | Arahkan kursor ke negara di peta | Tooltip/info muncul dengan nama negara dan performa indeks | 🟠 High | E2E | ⬜ |
| UI-004 | Klik negara memicu aksi | Klik pada suatu negara di peta | Memunculkan detail market atau navigasi ke screener negara tersebut | 🟠 High | E2E | ⬜ |
| UI-005 | GlobeView responsif saat resize window | Ubah ukuran window aplikasi | Peta menyesuaikan ukuran tanpa distorsi | 🟡 Medium | E2E | ⬜ |
| UI-006 | Render GlobeView saat data pasar belum tersedia | Buka GlobeView sebelum data selesai dimuat | Loading state atau placeholder ter-tampil; tidak crash | 🟠 High | Negatif | ⬜ |

### 6.2 ScreenerView

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| UI-007 | Render grid kartu saham | Buka ScreenerView | Grid kartu saham ter-render; setiap kartu menampilkan ticker, harga, perubahan | 🔴 Critical | E2E | ⬜ |
| UI-008 | Klik kartu saham membuka detail | Klik kartu `AAPL` | `StockDetailModal` terbuka dengan data AAPL | 🔴 Critical | E2E | ⬜ |
| UI-009 | Grid menampilkan perubahan harga (+ / -) | Periksa tampilan perubahan pada kartu | Harga naik tampil hijau dengan tanda `+`; turun tampil merah dengan tanda `-` | 🟠 High | E2E | ⬜ |
| UI-010 | ScreenerView saat data kosong | Buka ScreenerView sebelum scraping selesai | Loading indicator atau empty state tampil dengan benar | 🟠 High | Negatif | ⬜ |

### 6.3 CompareView

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| UI-011 | Bandingkan 2 indeks saham | Pilih indeks `S&P 500` dan `IHSG` untuk dibandingkan | Grafik kedua indeks ter-overlay pada satu canvas | 🔴 Critical | E2E | ⬜ |
| UI-012 | Heatmap perubahan harga ter-render | Buka CompareView | Heatmap warna ter-render untuk perubahan harga saham konstituen | 🟠 High | E2E | ⬜ |
| UI-013 | Pemilihan indeks yang sama dua kali | Pilih indeks yang sama untuk kedua slot | Warning atau auto-switch ke indeks berbeda | 🟡 Medium | Negatif | ⬜ |

### 6.4 PortfolioView

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| UI-014 | Tampilkan daftar posisi portofolio | Buka PortfolioView dengan posisi yang ada | Semua posisi tampil dengan ticker, shares, harga beli, PnL | 🔴 Critical | E2E | ⬜ |
| UI-015 | Form tambah posisi | Isi dan submit form tambah posisi | Posisi baru muncul di list; form ter-reset | 🔴 Critical | E2E | ⬜ |
| UI-016 | Validasi form di frontend | Submit form dengan field kosong | Error validasi tampil di UI; request tidak dikirim ke backend | 🟠 High | E2E | ⬜ |
| UI-017 | Tampilkan PnL per posisi | Buka PortfolioView dengan posisi aktif | Setiap baris menampilkan PnL (rugi/untung) dengan warna sesuai | 🔴 Critical | E2E | ⬜ |
| UI-018 | Tampilkan grand total PnL | Periksa area summary di PortfolioView | Grand total PnL ditampilkan dengan jelas | 🔴 Critical | E2E | ⬜ |
| UI-019 | Tombol hapus posisi berfungsi | Klik hapus pada salah satu posisi | Konfirmasi muncul; setelah konfirmasi, posisi hilang dari list | 🔴 Critical | E2E | ⬜ |

### 6.5 StockDetailModal

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| UI-020 | Modal terbuka dengan data lengkap | Klik saham di ScreenerView | Modal menampilkan tab: Overview, Grafik, Laporan Keuangan, Tentang | 🔴 Critical | E2E | ⬜ |
| UI-021 | Candlestick chart ter-render | Buka tab grafik di StockDetailModal | Grafik candlestick 30-hari ter-render dengan Recharts; sumbu X = waktu, Y = harga | 🔴 Critical | E2E | ⬜ |
| UI-022 | Tab laporan keuangan menampilkan data | Buka tab financial di modal | Income statement, balance sheet, cashflow ter-tampil dalam tabel | 🟠 High | E2E | ⬜ |
| UI-023 | Modal dapat ditutup | Klik tombol tutup atau klik di luar modal | Modal tertutup; halaman kembali normal | 🔴 Critical | E2E | ⬜ |
| UI-024 | Modal untuk saham tanpa data keuangan | Buka modal untuk ticker yang datanya kosong | Pesan "data tidak tersedia" tampil; modal tidak crash | 🟠 High | Negatif | ⬜ |

### 6.6 Komponen Lain

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| UI-025 | MarketHeatmap ter-render | Buka komponen heatmap | Heatmap warna ter-render sesuai data perubahan harga | 🟠 High | E2E | ⬜ |
| UI-026 | EconomicCalendar menampilkan events | Buka kalender ekonomi | Tabel events ter-render dengan kolom: event, tanggal, impact, actual, forecast | 🟠 High | E2E | ⬜ |
| UI-027 | Filter impact pada EconomicCalendar | Filter event dengan impact `high` saja | Hanya event high-impact yang tampil | 🟡 Medium | E2E | ⬜ |
| UI-028 | MacroNewsPanel menampilkan berita | Buka panel berita | Artikel berita terbaru tampil dengan thumbnail, judul, dan link | 🟠 High | E2E | ⬜ |
| UI-029 | Link berita bisa diklik | Klik judul artikel di MacroNewsPanel | Browser atau webview membuka URL artikel yang benar | 🟠 High | E2E | ⬜ |
| UI-030 | StockCard menampilkan chart mini | Lihat kartu saham di ScreenerView | Mini chart ter-render di dalam kartu | 🟡 Medium | E2E | ⬜ |

---

## 7. Background Worker

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| BG-001 | Trigger background scraping | Kirim command `scrape` dari frontend | Thread baru ter-spawn; scraping berjalan di background | 🔴 Critical | Integrasi | ⬜ |
| BG-002 | Frontend tidak freeze saat background scraping | Trigger scraping; coba interaksi UI bersamaan | UI tetap responsif; tidak freeze/lag | 🔴 Critical | E2E | ⬜ |
| BG-003 | Status scraping dilacak di SQLite | Cek tabel `scrape_status` sebelum, selama, sesudah scraping | Status berubah: `pending` → `running` → `done` (atau `failed`) | 🟠 High | Integrasi | ⬜ |
| BG-004 | Daemon thread tidak menghalangi app close | Jalankan background scraping; tutup aplikasi | Aplikasi bisa ditutup tanpa perlu menunggu scraping selesai | 🔴 Critical | E2E | ⬜ |
| BG-005 | Background scraping gagal tidak crash aplikasi | Mock scraper gagal saat berjalan di background | Status di DB diperbarui ke `failed`; aplikasi tetap berjalan normal | 🔴 Critical | Negatif | ⬜ |
| BG-006 | Tidak ada duplicate thread untuk key yang sama | Trigger scraping key yang sama 2× berturut-turut | Thread kedua tidak dijalankan jika thread pertama masih aktif | 🟠 High | Integrasi | ⬜ |
| BG-007 | Data ter-update di UI setelah background scraping selesai | Tunggu scraping selesai, refresh view | UI menampilkan data terbaru tanpa perlu restart aplikasi | 🟠 High | E2E | ⬜ |

---

## 8. Integrasi End-to-End

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| E2E-001 | Alur lengkap: buka app → lihat peta → klik negara → lihat saham | Jalankan aplikasi baru; klik US di GlobeView; klik saham; lihat detail | Setiap langkah berpindah view dengan benar; data tampil di setiap layar | 🔴 Critical | E2E | ⬜ |
| E2E-002 | Alur lengkap: tambah posisi → hitung PnL | Tambah posisi AAPL; buka PortfolioView; lihat PnL | PnL ter-hitung dengan data harga terbaru dari yfinance | 🔴 Critical | E2E | ⬜ |
| E2E-003 | Alur lengkap: scraping → cache → tampil ke UI | First launch tanpa cache; buka ScreenerView | Data ter-scrape, ter-cache di SQLite, dan tampil di UI dalam satu flow | 🔴 Critical | E2E | ⬜ |
| E2E-004 | Alur data forex dalam PnL lintas mata uang | Tambah posisi AAPL (USD) dari akun IDR; lihat PnL | PnL menampilkan komponen stockReturn (USD) dan forexReturn (IDR) secara terpisah | 🔴 Critical | E2E | ⬜ |
| E2E-005 | Alur export-import portofolio antar sesi | Export portofolio; restart aplikasi; import kembali | Semua posisi identik setelah restart + import | 🔴 Critical | E2E | ⬜ |
| E2E-006 | Berita terbaru tampil di panel | Buka MacroNewsPanel | Artikel yang tampil sesuai dengan yang di-scrape dari Google News RSS | 🟠 High | E2E | ⬜ |
| E2E-007 | Kalender ekonomi sesuai data investing.com | Buka EconomicCalendar | Event yang tampil di UI sesuai dengan yang di-parse dari Playwright | 🟠 High | E2E | ⬜ |

---

## 9. Performa & Stabilitas

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| PERF-001 | Waktu cold start aplikasi | Ukur waktu dari launch hingga UI siap | Aplikasi siap digunakan dalam < 5 detik | 🟠 High | Performa | ⬜ |
| PERF-002 | Waktu load ScreenerView dari cache | Buka ScreenerView dengan semua data cached | View siap dalam < 2 detik | 🟠 High | Performa | ⬜ |
| PERF-003 | Waktu scraping OHLCV (cold) | Ukur waktu scraping AAPL tanpa cache | Scraping selesai dalam < 10 detik | 🟡 Medium | Performa | ⬜ |
| PERF-004 | Waktu kalkulasi PnL untuk 20 posisi | Tambah 20 posisi; ukur waktu hitung PnL | Kalkulasi selesai dalam < 5 detik | 🟠 High | Performa | ⬜ |
| PERF-005 | Render candlestick chart 780 candle | Buka grafik saham dengan data penuh 30 hari | Chart ter-render dalam < 3 detik; tidak laggy saat scroll | 🟠 High | Performa | ⬜ |
| PERF-006 | Memory usage saat idle | Monitor memory setelah aplikasi idle 10 menit | Memory usage stabil; tidak ada memory leak yang signifikan | 🟡 Medium | Performa | ⬜ |
| PERF-007 | Memory usage saat scraping masif | Jalankan scraping semua jenis data sekaligus | Memory usage tidak melebihi 500MB | 🟡 Medium | Performa | ⬜ |
| PERF-008 | Stress test: concurrent scraping 10 ticker | Request data 10 ticker berbeda hampir bersamaan | Semua request selesai tanpa deadlock atau crash | 🟡 Medium | Performa | ⬜ |
| PERF-009 | Stabilitas long-running (app buka 8 jam) | Biarkan aplikasi berjalan 8 jam; gunakan secara berkala | Tidak ada crash; performa tidak menurun signifikan | 🟡 Medium | Performa | ⬜ |
| PERF-010 | Ukuran DB cache setelah pemakaian intensif | Gunakan aplikasi intensif selama 1 minggu | `cache.db` tidak tumbuh tanpa batas; ada mekanisme cleanup expired entries | 🟡 Medium | Performa | ⬜ |

---

## 10. Edge Case & Skenario Negatif

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| EDGE-001 | Aplikasi pertama kali dijalankan (no data, no cache) | Delete semua data; jalankan aplikasi | Aplikasi berjalan; UI menampilkan empty/loading state; scraping dipicu otomatis atau on-demand | 🔴 Critical | E2E | ⬜ |
| EDGE-002 | Tidak ada koneksi internet | Cabut internet; gunakan aplikasi | Data dari cache/file JSON masih tampil; error yang jelas untuk operasi yang butuh internet | 🔴 Critical | Negatif | ⬜ |
| EDGE-003 | Koneksi internet lambat/tidak stabil | Throttle jaringan ke 1 Kbps; coba scraping | Scraping timeout dengan grace; loading indicator tampil di UI; tidak crash | 🟠 High | Negatif | ⬜ |
| EDGE-004 | Yahoo Finance down/unavailable | Mock yfinance endpoint error | Mengembalikan data cache yang ada; pesan error yang jelas | 🟠 High | Negatif | ⬜ |
| EDGE-005 | Google News RSS berubah format | Mock RSS feed dengan format berbeda | Error tertangkap; news panel menampilkan pesan error | 🟠 High | Negatif | ⬜ |
| EDGE-006 | investing.com memblokir Playwright (bot detection) | Mock response 403/CAPTCHA dari investing.com | Error tertangkap; macro calendar menampilkan data cache atau pesan error | 🟠 High | Negatif | ⬜ |
| EDGE-007 | Disk penuh (tidak bisa tulis ke JSON/SQLite) | Simulasikan disk full; coba simpan data | Error yang jelas; tidak crash; tidak terjadi korupsi data | 🔴 Critical | Negatif | ⬜ |
| EDGE-008 | SQLite DB ter-korup | Rusak file `cache.db`; jalankan aplikasi | Aplikasi membuat DB baru; pesan error/warning yang sesuai | 🔴 Critical | Negatif | ⬜ |
| EDGE-009 | Ticker dengan karakter khusus | Input ticker `B&B`, `A.B/C` | Error validasi atau escaped dengan benar; tidak terjadi SQL injection | 🔴 Critical | Negatif | ⬜ |
| EDGE-010 | Input ticker sangat panjang | Input ticker 500 karakter | Error validasi panjang input; tidak crash | 🟠 High | Negatif | ⬜ |
| EDGE-011 | Perubahan timezone sistem | Ubah timezone OS; jalankan kalkulasi TTL | TTL dihitung dengan benar; tidak ada cache invalidation yang salah | 🟠 High | Negatif | ⬜ |
| EDGE-012 | Saham suspend/delisting | Request data untuk saham yang sudah di-delist | Error informatif ("ticker tidak aktif"); tidak crash | 🟡 Medium | Negatif | ⬜ |
| EDGE-013 | Market libur nasional | Cek data OHLCV pada hari libur (Christmas) | Data historical tetap tersedia; tidak ada candle untuk hari libur | 🟡 Medium | Negatif | ⬜ |
| EDGE-014 | Nilai NaN/Infinity dari yfinance | Mock yfinance mengembalikan `NaN` untuk harga | NaN difilter/diganti; tidak muncul di UI; tidak menyebabkan kalkulasi error | 🔴 Critical | Negatif | ⬜ |
| EDGE-015 | Response JSON dari Python sangat besar (>10MB) | Request data `companies` untuk 100 ticker | Frontend menerima dan memproses tanpa memory error atau truncation | 🟡 Medium | Negatif | ⬜ |

---

## 11. Keamanan & Keandalan Data

| TC-ID | Deskripsi | Langkah Uji | Expected Result | Prioritas | Tipe | Status |
|---|---|---|---|---|---|---|
| SEC-001 | SQL Injection via ticker input | Input ticker `'; DROP TABLE positions; --` | Input di-escape; DB tidak termodifikasi; tidak crash | 🔴 Critical | Negatif | ⬜ |
| SEC-002 | SQL Injection via param lain | Input `shares: "1; DELETE FROM cache"` | Input divalidasi; tidak ada perubahan DB yang tidak diinginkan | 🔴 Critical | Negatif | ⬜ |
| SEC-003 | IPC Injection — command tidak terdaftar | Kirim command yang tidak ada di daftar handler | Handler tidak dieksekusi; error response dikembalikan | 🔴 Critical | Negatif | ⬜ |
| SEC-004 | Path traversal pada nama file JSON | Ticker `../../../etc/passwd` | Nama file di-sanitize; tidak ada file yang dibuat di luar folder `data/` | 🔴 Critical | Negatif | ⬜ |
| SEC-005 | Integritas data cache setelah crash | Kill proses paksa saat sedang menulis ke SQLite | DB tidak corrupt setelah restart; WAL/journal SQLite bekerja | 🔴 Critical | Negatif | ⬜ |
| SEC-006 | Tidak ada credential/API key hardcoded | Inspect source code di `backend/src/` | Tidak ada credential, secret, atau API key yang hardcoded dalam kode | 🔴 Critical | Unit | ⬜ |
| SEC-007 | Data portofolio tidak terekspos ke jaringan | Monitor traffic jaringan saat menggunakan PortfolioView | Tidak ada request jaringan yang mengandung data posisi portofolio user | 🔴 Critical | Integrasi | ⬜ |

---

## Ringkasan Test Case

| Modul | Jumlah TC | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| Scraping Engine | 40 | 17 | 14 | 9 | 0 |
| Caching & TTL | 19 | 10 | 6 | 3 | 0 |
| IPC | 16 | 10 | 5 | 1 | 0 |
| Portofolio CRUD | 29 | 14 | 10 | 5 | 0 |
| PnL | 12 | 7 | 4 | 1 | 0 |
| Frontend | 30 | 14 | 13 | 3 | 0 |
| Background Worker | 7 | 4 | 3 | 0 | 0 |
| End-to-End | 7 | 5 | 2 | 0 | 0 |
| Performa | 10 | 0 | 5 | 5 | 0 |
| Edge Case | 15 | 6 | 6 | 3 | 0 |
| Keamanan | 7 | 7 | 0 | 0 | 0 |
| **TOTAL** | **192** | **94** | **68** | **30** | **0** |

---

> **Catatan Pengujian:**
> - Test Case dengan prioritas 🔴 Critical harus lulus 100% sebelum rilis ke production.
> - Seluruh skenario negatif harus diuji untuk memastikan aplikasi tidak crash dan selalu memberikan feedback yang informatif kepada user.
> - Performa diukur pada mesin dengan spesifikasi minimum yang ditargetkan.
> - Untuk pengujian TTL, gunakan teknik *time mocking* (patch `datetime.now()`) daripada menunggu waktu nyata.
