# Dokumentasi Fungsi Aplikasi MAPRO

Dokumen ini memuat analisis dan dokumentasi seluruh fungsi yang ada di dalam aplikasi percobaan MAPRO, di kategorikan berdasarkan peran dan fungsinya di dalam struktur aplikasi (bukan sekedar berdasarkan folder, namun berdasarkan fungsi bisnis utamanya).

---

## 1. Data Scraping Engine (Sumber Data)

Bagian ini bertanggung jawab untuk berinteraksi dengan API eksternal (terutama `yfinance` dan `feedparser` khusus Google News, serta Playwright) untuk menarik berbagai macam data ke lokal. 

### yfinance (Pergerakan Harga/Profil/Forex)
Berisi fungsi-fungsi spesifik dalam menarik data finansial:

#### `scrape_15m(ticker)`
*   **Parameter Input:**
    *   `ticker` (String): Kode saham atau indeks dari berbagai bursa pasar dunia menurut notasi API `yfinance` (misal: "AAPL" untuk Apple, "^N225" untuk indeks Nikkei).  
*   **Return/Final State:**
    *   List of dictionaries yang merepresentasikan lilin harga (OHLCV: Open, High, Low, Close, Volume) interval 15 menit, biasanya meliputi periode 30 hari kebelakang. Apabila error, maka akan nge-return array kosong `[]`.

#### `extract_info(raw)`
*   **Parameter Input:**
    *   `raw` (Dictionary): Serangkaian data mentah berisi sangat banyak properti (informasi perusahaan) yang ditarik via objek `Ticker.info` dari `yfinance`.
*   **Return / Final State:** 
    *   Dictionary dari properti-properti yang sudah dikelompokkan ke dalam kategori tertentu (`identity`, `price`, `valuation`, `profitability`, `dividend`, `analyst`, `ownership`), semua null atau data float tak dikenali difilter.

#### `scrape_financials(tk)`
*   **Parameter Input:**
    *   `tk` (object yf.Ticker): Instansiasi dari Ticker saham spesifik lewat module `yfinance`.
*   **Return / Final State:** 
    *   Mengembalikan dictionary berisi data json-parsed dari laporan keuangan perusahaan (`income_stmt`, `balance_sheet`, `cashflow`). Return mapping value ke kosong (`{}`) jika data tidak didapatkan.

#### `scrape_pair(pair_key, config)`
*   **Parameter Input:**
    *   `pair_key` (String): ID pengidentifikasi yang digunakan dalam cache secara lokal (contoh: "IDR_USD").
    *   `config` (Dictionary): Konfigurasi untuk pasangan mata uang, yang mana setidaknya harus memiliki key `ticker`, `base`, `quote`, dan `label`.
*   **Return/Final State:**
    *   Dictionary berisikan data valuta asing (kurs, persentase perubahan harian, history 30 hari yang merupakan array harga tutup tiap harinya). Bila ada error, maka tetap mengembalikan data dengan nilai numerik di *set* ke `None` serta disematkan sebuah property `"error"`.

---
### Scraping Google News RSS 

#### `parse_feed(market, config)`
*   **Parameter Input:**
    *   `market` (String): Akronim pasar target pencarian (Contoh: "US", "ID").  Sebagai penanda untuk print logging di internal fungsi jika ada error.
    *   `config` (Dictionary): Konfigurasi berisi key `url` yaitu URL valid dari Google News RSS yang mengandung keyword parameter yang relevan dengan `market` tersebut.
*   **Return / Final State:**
    *   List berupa array berisikan dictionary struktur artikel berita, melingkupi judul, original link origin, publisher (sumber berita), ringkasan/summary, dan sebuah object URL referensi ke gambar muka dan favicon source. 

#### `get_thumbnail(url, timeout=10)`
*   **Parameter Input:**
    *   `url` (String): Original site URL dari artikel berita.
    *   `timeout` (Integer, default `10`): Batas toleransi menunggu respon request (HTTP session get).
*   **Return/Final State:**
    *   Dictionary kecil berisi `type` ("og_image", "favicon", "none") serta sebuah `url` menuju gambar relevan yang dapat mendeskripsikan muka di UI client-side nantinya. Algoritmanya bekerja dengan menguraikan custom meta property bernama `og:image`.

---
### Playwright Web Scraping (Kalender Ekonomi)

Data ini mengekstrak event-event terjadwal pergerakan Ekonomi Makro dunia lewat DOM crawling situs web luar.

#### `click_show_filters(page)`, `open_custom_dates(page)`, `apply_dates(page)`
*   **Parameter input (rata-rata):** 
    *   `page` (Playwright Page Object): Refeerensi DOM pada tab browser virtual untuk dapat di simulatif.
*   **Return / Final State:** 
    *   Bolehan (True jika aksi berhasil dijalankan seperti button click, False jika terjadi *timeout* ataupun *exception*/gagal).

#### `set_dates(page, from_date, to_date)`
*   **Parameter input:**
    *   `page` (Playwright Page Object): Reference frame.
    *   `from_date`, `to_date` (String): Limit batas tanggal dengan string berformat `"MM/DD/YYYY"`. 
*   **Return / Final State:**
    *   Tidak mereturn sesuatu (`None`), hanya memberikan serangkaian instruksi pada *Page object* untuk mengirim input event (*typing/filling* form) tanggal mulai hingga tanggal selesai ke filter kalender.

#### `parse_impact(row)`
*   **Parameter Input**: 
    *   `row` (Playwright ElementHandle Object): Sebuah elemen Baris dalam list `tr` yang dibungkus oleh tabel event macro dalam situs.
*   **Return / Final State**:
    *   String yang mendeskripsikan intensitas impact efek dalam dunia riil ("`low`", "`medium`", atau "`high`") diukur berdasarkan ikon bintang SVG di DOM yang memiliki intensitas transparency di atribut per-bintang nya.
    
#### `scrape_calendar(from_date, to_date, countries=None, output_dir=None)`
*   **Parameter Input:**
    *   `from_date`, `to_date`: Tanggal awal dan akhir (*string* pola bulan/hari/tahun).
    *   `countries` (List of Strings, Optional): Jika disupply, scraper hanya memuat baris element jika dan hanya jika nama negara sinkron dengan kode array tsb.
    *   `output_dir` (String, Optional): Tempat fallback variabel global `OUTPUT_DIR` jika tidak disuplai sebelum fungsi dipanggil. (*Walaupun sebenarnya variabel ini tidak digunakan di baris fungsi internalnya*).
*   **Return / Final State:**
    *   List of dictionaries berupa struktur JSON event makro per event, berisikan: Nama event, date, timpaan waktu, impact level skala bintang, nilai aktual saat event dirilis, nilai ramalan (*forecast*), serta rekam nilai sebelumnya.


---

## 2. Scraping Orchestrators (Runner)

Kelompok file di `backend/src/scrapers/` yang masing-masing punya sebuah fungsi utama `run(output_dir)`. Ini dipergunakan baik untuk pemicu *background threading* yang sinkron secara jadwal, maupun dieksekusi secara stand-alone lewat script.

### `run(output_dir)` (di berbagai scraper)
Fungsi `run` secara fundamental digunakan sebagai trigger *entry-point* program utama per domain scraper (`forex`, `ohlcv`, `news`, `company_info`, `macro`).
*   **Parameter Input:**
    *   `output_dir` (String): Jalur Absolute mendefinisikan lokasi file output JSON dari data yang hendak di dump/write setelah sukses dijalankan.
*   **Return / Final State:**
    *   Mengembalikan sebuah *summary* dalam wujud *Dictionary*, yang merepresentasikan jejak rekapan dari kapan program dipanggil, berapa banyak total entity (*stock*, *article*, *events* dlsb), dan info meta masing-masing domain nya, sehingga Front-End Electron dapat mengawasi status.
    *   Juga memiliki Side Affect lain yait mengubah state dari Cache Database.

---

## 3. Storage dan IPC Bridge Pipeline

Kumpulan operasi dalam `ipc_main.py` yang menyediakan sarana jembatan (*bridge*) lewat protokol standard Linux/Unix I/O (`stdin` dan `stdout`) sebagai REST-substitute pengganti `Flask`.  Lalu digabung pengatur database sederhana `SQLite3` (dalam `cache_db.py` dan module spesifik `ipc_main.py`).

### Manajemen Database & File
#### `init_db()`
*   **Parameter Input:** None.
*   **Return / Final State:**
    *   Menyetel schema tabel Database minimal dengan `sqlite3` jika belum diinisiasi untuk mengamankan rekam jejak operasi (Data persisten offline `cache`, `positions`, `scrape_status`).

#### `cache_get(key)`, `cache_set(key, data)`, `cache_delete(key)`
*   **Parameter Input Utama:** `key` (String identitas item), `data` (Dictionary/Value item cache JSON-string serializable). 
*   **Return / Final State:**
    *   `cache_get`: mengembalikan value JSON (hasil _deserialization_) jika `key` valid dan ada, atau mereturn `None`.
    *   `cache_set` dan `cache_delete`: Void operasional (Insert/Update & Delete record `sqlite3` table `cache`).

#### `is_cache_fresh(key, ttl_seconds)` (Fungsi Bawaan File Scrapper)
*   **Parameter input**: `key` (String format domain misal *ohlcv:US*), `ttl_seconds` (nilai _Time-To-Live_ per domain data yang dizinkan dalam hitungan detik).
*   **Return/Final state**: 
    *   Mengembalikan persisnya dua nilai: sebuah Boolean (_True_ jika belum expired berdasarkan time difference `updated_at` ke waktu sekarang), dan Dictionary konten JSON aslinya (jika memang fresh di bawah limit `ttl_seconds`), atau `(False, None)`. 

### Operasi Porftolio

Ke-enam fungsi CRUD (*Create, Retrieve, Update, Delete*) serta sistem agregat PnL investasi personal di lokal user sqlite3:

#### `get_positions()` / `handle_portfolio_list()`
*   **Parameter Input:** None.
*   **Return / Final State:** List dictionaries (semua baris rekaman pada DB tabel `positions`).

#### `handle_portfolio_add(params)` 
*   **Parameter Input:** `params` (Dictionary wajib ada komponen `ticker`, `company`, jumlah lot `shares`, harga pembelian `buyPrice`, `buyDate`).
*   **Return / Final State:** Membuat row baru ber-ID *autoincrement*. Me-return nilai dictionary yang barusan di push plus *Inserted ID* nya. Jika ada input kunci yang hilang, retun dictionary `"error"`.

#### `handle_portfolio_edit(params)`
*   **Parameter Input:** `params` (Wajib menampung `id`, dan minimal satubaris keys param lain yang bisa diubah mis: `shares`).
*   **Return / Final State:** Me-run query SQL Update yang presisi via *list comprehension* update fields. Menghasilkan returan dictionary berisikan nilai yang telah berhasil di perbaharui. Mengembalikan Error dictionary apabila `id` tidak dijumpai.

#### `handle_portfolio_delete(params)`
*   **Parameter Input:** `params` (hanya memuat spesifik satu properti numerik `id`).
*   **Return / Final State:** Record dari tabel SQLite3 musnah. Return object Status `{ "status": "ok" }`.

#### `handle_portfolio_pnl()`
*   **Parameter Input:** None.
*   **Return / Final State:** 
    *   (Operasi Berat) Agregat Kalkulasi. Mengekstrak dan Menghitung kalkulasi Unrealized Net Profit per masing-masing posisi Portofolio milik user.  Fungsi ini melakukan fetch (mendownload live `yfinance` history harian valuta matauang, seperti membedakan saham yang dibeli kurs JPY atau kurs Rp. IDR). 
    *   Berakhir pada output kompleks (Dictionary) berupa rincian lengkap saham tersebut, kompilasi selisih valuta (jika harga valuta tidak beda antara pas beli dengan sekarang, `0`), jumlah profit dalam representasi Base IDR, dan rangkuman grand total portfolio user (`totalPnL`, `stockReturn`, `forexReturn`).

#### `handle_portfolio_import(params)`, `handle_portfolio_export()`
*   **Parameter Input:** Array of Position object untuk di inject via Bulk Insert SQLite (terkhusus buat `import`).
*   **Return / Final state:** Export melintarkan data utuh posisi persis sama layaknya call `handle_portfolio_list`. Adapun Import, menambahkan rekords-rekords tersebut lalu ditutup dengan mereturn status kuantitas `imported` dan `total` saham akhir yang dipunya.

### Terminal IPC & Background Worker
#### `handle_command(req)`
*   **Parameter Input:** `req` (Dictionary komando yang merujuk pada standar format yang dibaca per JSON dari terminal Shell oleh Electron backend. Harus mempunyai setidaknya "objek `cmd`" dan `params`).
*   **Return / Final State:**
    *   Merupakan fungsi penengah (Router Switch-Case logic ala API `express.js` atau `Flask`). Merespon panggilan untuk mengekstrak logic-logic data seperti `ohlcv`, `news`, `index`, dll dalam arsitektur maping command, dan akan membuang response nya ke `main()`.

#### `trigger_scrape_in_bg(scraper_key)`
*   **Parameter Input:** `scraper_key` (String identitas spesifik misal `"news"` )
*   **Return / Final State:**  Menjalankan scraper runner dalam `threading.Thread` yang bersifat daemon secara _asyncronous_ (di backgrund Python tidak membekukan IO) serta memanajemen flag label stasenya dalam tabel `scrape_status`. Return value tak ada.

#### `main()` (IPC Listen Server)
*   **Parameter input**: None (Sifatnya System Execution Main Script).
*   **Return / Final state**: 
    *   Fungsi Abadi (`while(True)` tersembunyi via For-stdin Loop). Menahan process memory Python selalu nyala sembari mendengarkan input `sys.stdin` (Standard Input), dan melepaskan stream `print()` *json stringified* ke `stdout` sebagai bentuk merespons API balik ke Node/Electron.  Apabila process string mati, barulah proses tertutup.

---
*(Dokumen ini dihasilkan dari ekstraktur kode inti yang ada di direktori `backend/src/` pada project MAPRO)*
