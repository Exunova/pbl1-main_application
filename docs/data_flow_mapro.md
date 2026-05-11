# Flow Data dan Architecture Rendering Data MAPRO

Dokumen ini menjelaskan rancangan komprehensif tentang bagaimana data bermula dari API eksternal (sumber), mengalir melewati lapisan logik _backend_, dilindungi oleh lapis pelabelan caching, ditebarkan melalui sebuah pipa komunikasi, hingga sampai untuk di-render sedapandang di kanvas visual frontend MAPRO.

---

## 1. Lapisan Ekstraktor (Scraping & Data Fetching Module)
*   **Posisi Folder**: `backend/src/scrapers/`
*   **Libraries Utama**: `yfinance` (Python), `feedparser` (Python), `playwright` (Python/Node).

Pertama-tama, aplikasi dihidupi oleh proses penarikan data mentah berjadwal/manual:
1.  **Fundamental & Pergerakan Harga (`yfinance`)**: Logika di Python secara diam-diam memanggil API tidak resmi Yahoo Finance. Proses ini meraup ratusan parameter harga per tick historis, nilai konversi mata uang (FX rate), sampai riwayat P&L (Profit and Loss) emiten lintas negara (US, ID, JP, UK).
2.  **Berita Global (`feedparser`)**: Memparsing antarmuka RSS Feed dari Google News lalu disortir ulang per region pencarian yang divalidasi.
3.  **Makro Ekonomi (`playwright`)**: Sebuah browser maya tak kasat mata di-*launching* via Chromium. Ia memuat situs `investing.com/economic-calendar/`, mengeksekusi klik-isi dom kalender (tanggal From -> To) seolah itu pengguna, mengambil tabel DOM, dan "menerjemahkan" jumlah _star rating impact_ ke teks (`Low/Medium/High`).

## 2. Lapisan Penyokong Persistensi (The Local Brain)
*   **Posisi Folder**: `backend/src/cache_db.py` & Folder `data/`
*   **Libraries Utama**: `sqlite3`, `json` standar Python.

Daripada berulang kali nembak ke server luar yang bisa mendatangkan HTTP Error 429 *Too Many Request*, MAPRO mengandalkan otak caching.
1. Setiap ekstraktor tadi (poin 1) hanya boleh menyerahkan format raw ke format terstruktur (Python Dictionary / List). 
2.  Lalu, file `cache_db.py` dikerahkan. Data teks yang berat (seperti riwayat OHLCV 30 hari kebelakang per 15-menit yang totalnya ribuan node array) dilempar dalam wujud `.json` terpisah ke sub-direktori `data/`.
3.  Di waktu yang selaras, `SQLite3` (tabel database lokal) mengukir metadata indeks. Ia menyimpan **State Time-to-Live (TTL)**. Sehingga ke depan, ketika Frontend butuh laporan portofolio, database ini seketika menyuguhkan jawaban instan: *"Bentar, data indeks Nikkei ini usianya baru 2 jam (belum expired) ngapain download ulang, pake data yang lokal ini aja!"*.
4. Tidak luput, fungsi portofolio personal user (Tambah/Edit/Hapus rekam transaksi Lot harga saham) bertumpu mutlak 100% pada tabel DB spesifik SQLite.

## 3. Pipa Komunikasi Jembatan (Inter-Process Communication / IPC)
*   **Posisi Folder**: `backend/src/ipc_main.py` -> `frontend/electron/main/index.js`
*   **Libraries Utama**: `sys.stdin`/`sys.stdout` (Node-Python I/O pipe).

Karena MAPRO merupakan program bertransformasi desktop, ia punya dua jantung yang berjalan berbeda bahasa: _Node.js/Chromium_ untuk UI, dan _Python_ untuk Otakan Data/AI. 
1. `ipc_main.py` dibiarkan menyala permanen dalam wujud Sub-Process `while(true)`. 
2. Ketika User di FrontEnd mengeklik sesuatu (Misal: Membuka Tab Screener), Javascript dari UI membisikkan pesan via standar I/O (Input/Output). Misal berbisik: `{"cmd": "company", "params": {"ticker": "AAPL"}}`.
3.  Python mendengar, membedah instruksi itu dari string ke objek Dictionary, menjalaninya (termasuk mengecek DB jika perlu data mentah baru), lalu berteriak balik ke Standard-Output berupa String JSON murni.
4. _Electron Main Process_ menangkap JSON itu, mem-parsing-nya, lalu membuangnya turun ke _Electron Window Renderer_.

## 4. Lapisan Konsumen dan Rendering Visual (Front-End Layer)
*   **Posisi Folder**: `frontend/src/` & `frontend/src/pages/`
*   **Libraries Utama**: `React` (Core), `Lucide-React` (Ikon),  `d3` dan `topojson-client` (Peta), `recharts` (Grafik chart statistik), `Tailwind CSS` (Styling).

Begitu data JSON hasil tangkapan tadi utuh mendarat di teritori UI, proses visualisasi merombak seluruh _pixels_ kanvas DOM:

### Rendering Chart & Candlestick (Screener + Compare Index)
*   **Pelaksana Mutlak**: Menggunakan sub-modul library **`recharts`** (sebuah pembungkus SVG chart ringan berbasiskan React Component).
*   **Flow**: 
    1. Data riwayat OHLC (Ribuan array *Open, High, Low, Close, Timestamp*) di injeksi ke dalam State React (`useState`).
    2. React menyiramkan _State Array_ tsb sebagai nilai _Props_ dari `<LineChart>` atau  `<ComposedChart>` milik Recharts.
    3. Recharts mengambil-alih tugas berat kalkulasi matematika layar (segi _padding_, label absis/ordinat, tooltips sentuhan kursor) -> DOM berubah menjadi grafik harga garis atau candle saham yang proporsional layaknya _TradingView_. (Tercantum pada Skema #6 dan #8 Draft Fitur).

### Rendering Peta Interaktif (World Map / Globe)
*   **Pelaksana Mutlak**: Library gabung **`d3.js`** *(Data-Driven Documents)* dan **`topojson-client`**.
*   **Flow**:
    1. Tab awal (Globe View) membungkus kerangka geometri batas geografis seluruh daratan negara-negara ke dalam sebuah vektor format SVG raksasa secara statis (dari library `topojson-client`).
    2. Modul UI menyedot ringkasan indeks dari backend pipeline. Misal respons didapatkan: S&P500 US performa 1%, dan Nikkei JP performa -4% dlsb (Merujuk skema fitur #1).
    3. Script memanggil `d3` memanipulasinya untuk melakukan `color-mapping`. Script akan otomatis menyegarkan ulang (`refresh`) *Fill Color* warna objek `svg_path` yang memiliki ID "US" menjadi Hijau, dan ID rute "JP" menjadi Merah, intensitas warnanya juga dikonversi presisi lewat fungsionalitas turunan _scale_ bawaan D3.

### Rendering Standar
*   Pemeran tabel perbandingan PnL, teks berita makroekonomi, angka kalkulasi konversi kurs dan sejenisnya bertumpu pada `React.js` mutlak dengan bantuan class utility `Tailwind CSS` agar sedap dipandang mata sesuai panduan desain Sistem Terminal gelap ala _Bloomberg_.
