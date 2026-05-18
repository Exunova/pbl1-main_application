# Blackbox Test Cases — Aplikasi MAPRO

> **MAPRO** — Multimarket Analytics Portfolio Tracker  
> **Dokumen ini berisi test case blackbox untuk pengujian end-to-end melalui UI aplikasi.**
>
> Berbeda dengan test case di `MAPRO_Test_Cases.md` yang mencakup unit/integration test (whitebox),
> dokumen ini **hanya** berisi test case yang menguji sistem melalui external interface (UI Electron)
> tanpa mengetahui implementasi internal. Semua langkah uji adalah aksi yang terlihat user di layar.

---

## Konvensi Dokumen

| Kolom | Keterangan |
|---|---|
| **TC-ID** | ID unik test case: `BB-{MODULE}-{SEQ}` |
| **Deskripsi** | Apa yang diuji dalam satu kalimat |
| **Pre-kondisi** | State yang harus dipenuhi sebelum menjalankan test |
| **Langkah Uji** | Aksi user di UI (klik, ketik, scroll, hover) — bukan panggilan fungsi |
| **Expected Result** | Perilaku yang terlihat di layar — bukan response JSON |
| **Prioritas** | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |
| **Tipe** | E2E / Negatif / Input Validation |

### Kode Modul

| Kode | Modul |
|---|---|
| GLO | Globe View — Peta Dunia & Makroekonomi |
| SCR | Screener View — Grid Saham & Pencarian |
| CMP | Compare View — Perbandingan Indeks |
| SDP | Stock Detail Panel — Detail Saham & Grafik |
| POR | Portfolio View — Manajemen Posisi |
| PNL | PnL Calculation — Kalkulasi Laba/Rugi |
| IPC | IPC Full-Stack — Data Fetching via UI |
| PRF | Profile View — Pengaturan & Ekspor/Impor |
| BGW | Background Worker — Scraping & Status |
| EDG | Edge Cases — Skenario Batas |
| SEC | Security — Input Validation |
| E2E | End-to-End Flows — Alur Lengkap |

---

## Prerequisites

### Environment
- Aplikasi MAPRO berjalan (Electron window terbuka)
- Koneksi internet aktif (data real dari Yahoo Finance, Google News, Investing.com)
- Cache database dalam keadaan bersih atau wajar (tidak ada manipulasi)
- Window size: minimal 1280×800 (resolusi standar)

### Test Data yang Digunakan

| Jenis | Data |
|---|---|
| US Stock Ticker | AAPL, MSFT, NVDA, TSLA, AMZN |
| ID Stock Ticker | BBCA.JK, BBRI.JK, TLKM.JK |
| JP Stock Ticker | 9984.T (SoftBank) |
| UK Stock Ticker | HSBA.L (HSBC) |
| Forex Pairs | USDIDR=X, USDJPY=X, USDGBP=X |
| News Regions | US, ID, JP |
| Macro Countries | US, ID, JP |
| Index Symbols | ^GSPC (S&P 500), ^JKSE (IHSG), ^N225 (Nikkei 225) |

---

## Daftar Isi

1. [Globe View](#1-globe-view-bb-glo)
2. [Screener View](#2-screener-view-bb-scr)
3. [Compare View](#3-compare-view-bb-cmp)
4. [Stock Detail Panel](#4-stock-detail-panel-bb-sdp)
5. [Portfolio View — CRUD](#5-portfolio-view--crud-bb-por)
6. [PnL Calculation](#6-pnl-calculation-bb-pnl)
7. [IPC Full-Stack — Data Fetching](#7-ipc-full-stack--data-fetching-bb-ipc)
8. [Profile View](#8-profile-view-bb-prf)
9. [Background Worker](#9-background-worker-bb-bgw)
10. [Edge Cases](#10-edge-cases-bb-edg)
11. [Security — Input Validation](#11-security--input-validation-bb-sec)
12. [End-to-End Flows](#12-end-to-end-flows-bb-e2e)
13. [Coverage Matrix & Ringkasan](#13-coverage-matrix--ringkasan)

---

## 1. Globe View (BB-GLO)

### 1.1 Render & Tampilan Awal

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-GLO-001 | Peta dunia ter-render saat GlobeView dibuka | App baru launch, tab Globe aktif | 1. Buka aplikasi<br>2. Tab Globe aktif secara default | 1. Peta dunia interaktif terlihat di tengah layar<br>2. Setiap negara memiliki warna (hijau/merah) dengan intensitas bervariasi<br>3. Tidak ada error konsol yang muncul | 🔴 Critical | E2E |
| BB-GLO-002 | Legend warna indeks terlihat | GlobeView terbuka dengan data | 1. Perhatikan pojok kanan atas/bawah peta | 1. Legend warna muncul: hijau untuk indeks positif, merah untuk negatif<br>2. Terdapat indikator skala intensitas warna | 🟠 High | E2E |
| BB-GLO-003 | Judul tab Globe sesuai | App terbuka | 1. Lihat sidebar navigasi<br>2. Lihat tab Globe | Tab Globe aktif/terpilih dengan ikon globe atau teks yang sesuai | 🟡 Medium | E2E |

### 1.2 Interaksi Peta

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-GLO-004 | Hover di atas negara menampilkan tooltip | GlobeView terbuka dengan data indeks termuat | 1. Arahkan kursor ke negara US<br>2. Arahkan kursor ke negara Jepang | 1. Tooltip muncul dengan nama negara (United States)<br>2. Tooltip menampilkan performa indeks (positif/negatif)<br>3. Tooltip untuk negara berbeda menampilkan data berbeda | 🔴 Critical | E2E |
| BB-GLO-005 | Klik negara menampilkan panel detail | GlobeView terbuka, data indeks termuat | 1. Klik negara US di peta | 1. Panel atau informasi detail muncul di sisi kanan/bawah<br>2. Panel menampilkan data makroekonomi US<br>3. Panel menampilkan tabel kurs forex (USD/IDR dll.) | 🔴 Critical | E2E |
| BB-GLO-006 | Klik negara kedua mengganti panel | GlobeView terbuka, panel US sedang aktif | 1. Klik negara Indonesia (ID) di peta | 1. Panel berganti menampilkan data makro Indonesia<br>2. Tabel forex berganti ke pasangan mata uang terkait IDR<br>3. Data dari US tidak tercampur | 🔴 Critical | E2E |
| BB-GLO-007 | Klik negara yang sama dua kali toggle tidak terjadi masalah | Panel negara sedang terbuka | 1. Klik negara yang sama (US) lagi | Panel negara tetap terbuka, tidak terjadi crash atau duplikasi | 🟠 High | E2E |

### 1.3 Panel Detail & Data Makro

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-GLO-008 | Panel makro menampilkan daftar event ekonomi | Negara US sudah diklik, panel terbuka | 1. Scroll panel makro ke bawah | 1. Daftar event ekonomi terlihat dengan nama event, tanggal, dan impact<br>2. Setiap event memiliki label impact (Low/Medium/High)<br>3. Data tidak kosong untuk negara major (US) | 🔴 Critical | E2E |
| BB-GLO-009 | Tabel forex menampilkan kurs beberapa pasangan | Panel negara terbuka | 1. Lihat tabel forex di panel | 1. Minimal 3 pasangan mata uang terlihat<br>2. Setiap baris menampilkan: pasangan, kurs saat ini, perubahan<br>3. Kurs ditampilkan sebagai angka dengan format yang sesuai | 🟠 High | E2E |
| BB-GLO-010 | Panel dapat ditutup | Panel detail sedang terbuka | 1. Klik tombol close (X) pada panel | 1. Panel detail tertutup<br>2. Peta kembali ke tampilan penuh<br>3. Tidak ada error | 🟠 High | E2E |

### 1.4 Search Bar

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-GLO-011 | Search bar dapat di-toggle | GlobeView terbuka | 1. Klik ikon/tombol search | 1. Search bar input muncul<br>2. Placeholder text "Search country..." atau sejenisnya terlihat | 🟡 Medium | E2E |
| BB-GLO-012 | Pencarian negara menampilkan autocomplete | Search bar aktif | 1. Ketik "Indo" di search bar | 1. Dropdown autocomplete muncul dengan saran negara<br>2. "Indonesia" muncul dalam daftar saran | 🟠 High | E2E |
| BB-GLO-013 | Klik hasil pencarian menavigasi ke negara | Search bar menampilkan hasil | 1. Klik "Indonesia" dari hasil pencarian | 1. Peta memusat ke Indonesia/Asia Tenggara<br>2. Panel detail Indonesia muncul | 🟠 High | E2E |
| BB-GLO-014 | Pencarian negara tidak ditemukan | Search bar aktif | 1. Ketik "Zyzzyva" (negara tidak ada) | 1. Dropdown autocomplete menampilkan "No results" atau kosong<br>2. Tidak ada error | 🟡 Medium | Negatif |

### 1.5 Chart & Resize

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-GLO-015 | Bottom chart menampilkan history indeks negara | Negara sudah diklik, panel terbuka | 1. Lihat bagian bawah GlobeView | 1. Line chart history indeks terlihat<br>2. Sumbu X = waktu, sumbu Y = harga indeks<br>3. Data chart merespon terhadap negara yang dipilih | 🟠 High | E2E |
| BB-GLO-016 | Globe responsif saat window di-resize | GlobeView terbuka | 1. Resize window menjadi lebih kecil (1024×768)<br>2. Resize window kembali besar (1920×1080) | 1. Peta menyesuaikan ukuran secara proporsional<br>2. Tidak ada elemen yang overlap atau terpotong<br>3. Panel tetap dapat di-scroll jika perlu | 🟡 Medium | E2E |
| BB-GLO-017 | Globe responsif saat panel dibuka/tutup | GlobeView terbuka | 1. Klik negara — panel terbuka<br>2. Tutup panel | 1. Peta tidak terdistorsi saat panel terbuka (menyesuaikan ruang)<br>2. Peta kembali ke ukuran penuh saat panel ditutup | 🟡 Medium | E2E |

### 1.6 Loading & Empty State

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-GLO-018 | Loading state saat data indeks dimuat | Koneksi lambat / first load | 1. Buka GlobeView (atau refresh) | 1. Loading indicator atau skeleton muncul saat data sedang dimuat<br>2. Setelah muat, peta muncul dengan warna negara | 🟠 High | E2E |
| BB-GLO-019 | Negara tanpa data indeks tetap terlihat | Ada negara minor tanpa data | 1. Perhatikan negara kecil (contoh: negara Pasifik) | 1. Negara tetap terlihat di peta (bentuknya ada)<br>2. Warna negara netral/abu-abu jika data tidak tersedia | 🟡 Medium | E2E |

---

## 2. Screener View (BB-SCR)

### 2.1 Render Grid Saham

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SCR-001 | Grid kartu saham ter-render untuk region US | ScreenerView dibuka pertama kali | 1. Klik tab Screener di sidebar<br>2. Pilih region US di sidebar | 1. Grid kartu saham terlihat (2-5 kolom)<br>2. Setiap kartu menampilkan: ticker, nama perusahaan, harga, perubahan %<br>3. Jumlah kartu > 5 untuk region US | 🔴 Critical | E2E |
| BB-SCR-002 | Perubahan harga ditampilkan dengan ikon +/- dan warna | Region US dipilih, kartu terlihat | 1. Perhatikan perubahan harga pada kartu saham | 1. Perubahan positif (naik): warna hijau, ikon TrendingUp/panah atas, tanda +<br>2. Perubahan negatif (turun): warna merah, ikon TrendingDown/panah bawah, tanda -<br>3. Format perubahan: angka dengan 2 desimal dan % | 🔴 Critical | E2E |
| BB-SCR-003 | Sparkline chart mini terlihat di kartu | Region US dipilih, kartu terlihat | 1. Perhatikan chart mini di dalam setiap kartu saham | 1. Setiap kartu memiliki sparkline chart<br>2. Warna line senada dengan perubahan harga (hijau/merah)<br>3. Chart tidak kosong | 🟡 Medium | E2E |

### 2.2 Region Selector

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SCR-004 | Region selector menampilkan daftar region | ScreenerView terbuka | 1. Lihat sidebar region di sebelah kiri | 1. Daftar region terlihat: US, ID, JP (dan lainnya)<br>2. Region yang aktif ter-highlight | 🔴 Critical | E2E |
| BB-SCR-005 | Ganti region mengubah grid saham | Region US aktif, kartu US terlihat | 1. Klik region ID (Indonesia) di sidebar | 1. Grid berganti menampilkan saham Indonesia<br>2. Ticker yang muncul: BBCA.JK, BBRI.JK, TLKM.JK dll.<br>3. Data harga dalam format IDR (Rp) | 🔴 Critical | E2E |
| BB-SCR-006 | Ganti region ke JP menampilkan saham Jepang | Region ID aktif | 1. Klik region JP (Japan) | 1. Grid berganti menampilkan saham Jepang<br>2. Ticker dengan suffix .T (contoh: 9984.T)<br>3. Data harga dalam format JPY (¥) | 🔴 Critical | E2E |
| BB-SCR-007 | Region selector highlight berubah | Region US aktif | 1. Klik ID<br>2. Klik JP<br>3. Klik kembali US | 1. Highlight pindah setiap kali region di-klik<br>2. Grid kembali menampilkan data region yang sesuai | 🟠 High | E2E |

### 2.3 Search & Filter

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SCR-008 | Search input dapat digunakan untuk filter saham | Region US aktif, grid terlihat | 1. Klik search input di header<br>2. Ketik "Apple" | 1. Grid terfilter menampilkan hanya saham dengan nama mengandung "Apple"<br>2. Kartu AAPL terlihat, saham lain tersembunyi | 🟠 High | E2E |
| BB-SCR-009 | Search dengan ticker | Region US aktif | 1. Ketik "MSFT" di search | 1. Grid menampilkan hanya MSFT<br>2. Nama "Microsoft" terlihat di kartu | 🟠 High | E2E |
| BB-SCR-010 | Search tidak ditemukan | Region US aktif | 1. Ketik "ZZZZZ" di search | 1. Grid kosong atau menampilkan "No results found"<br>2. Tidak ada error | 🟡 Medium | Negatif |
| BB-SCR-011 | Search input dapat di-clear | Search aktif dengan kata "Apple" | 1. Klik tombol clear (X) pada search input | 1. Search input kosong<br>2. Grid kembali menampilkan semua saham | 🟡 Medium | E2E |
| BB-SCR-012 | Search persisten saat ganti region | Search "BBCA" di region ID | 1. Ketik "BBCA" di region ID — hasil terfilter<br>2. Klik region US | 1. Search input tetap berisi "BBCA"<br>2. Grid US menampilkan hasil filter "BBCA" (mungkin kosong)<br>3. Tidak crash | 🟡 Medium | E2E |

### 2.4 Interaksi Kartu

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SCR-013 | Klik kartu saham membuka StockDetailPanel | Region US aktif, kartu terlihat | 1. Klik kartu AAPL | 1. StockDetailPanel terbuka (full-screen/overlay)<br>2. Panel menampilkan data AAPL: nama, harga, chart | 🔴 Critical | E2E |
| BB-SCR-014 | Hover di kartu menampilkan efek visual | Region US aktif | 1. Hover cursor di atas kartu saham AAPL | 1. Kartu memiliki efek hover (brightness naik, border, atau scale)<br>2. Cursor berubah menjadi pointer | 🟡 Medium | E2E |

### 2.5 Loading & Empty State

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SCR-015 | Loading indicator saat data dimuat | Koneksi lambat, ganti region | 1. Pilih region yang belum di-cache | 1. Loading spinner/skeleton muncul saat data sedang dimuat<br>2. Grid muncul setelah selesai | 🟠 High | E2E |
| BB-SCR-016 | Sektor/industry terlihat di kartu | Region US aktif | 1. Perhatikan kartu saham | 1. Setiap kartu menampilkan sektor atau industri perusahaan<br>2. Contoh: AAPL → Technology/Consumer Electronics | 🟡 Medium | E2E |
| BB-SCR-017 | Nama Indonesian company tampil benar | Region ID dipilih | 1. Klik region ID<br>2. Lihat kartu BBCA.JK | 1. Nama perusahaan Indonesia tampil dengan benar<br>2. Contoh: PT Bank Central Asia Tbk | 🟡 Medium | E2E |

---

## 3. Compare View (BB-CMP)

### 3.1 Index Selector

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-CMP-001 | Dua selector indeks tersedia | CompareView dibuka | 1. Klik tab Compare di sidebar | 1. Dua dropdown/selector indeks terlihat (Index 1 dan Index 2)<br>2. Masing-masing memiliki daftar indeks yang bisa dipilih | 🔴 Critical | E2E |
| BB-CMP-002 | Pilih indeks yang berbeda untuk perbandingan | CompareView terbuka | 1. Pilih "S&P 500" di selector 1<br>2. Pilih "IHSG" di selector 2 | 1. Line chart dengan 2 garis muncul (overlay)<br>2. Warna garis berbeda untuk masing-masing indeks<br>3. Legend menunjukkan mana S&P 500 dan mana IHSG | 🔴 Critical | E2E |
| BB-CMP-003 | Ganti indeks di selector memperbarui chart | S&P 500 dan IHSG sedang tampil | 1. Ganti selector 2 dari IHSG ke Nikkei 225 | 1. Chart memperbarui garis untuk Nikkei 225<br>2. Legend berubah sesuai indeks baru | 🔴 Critical | E2E |
| BB-CMP-004 | Pilih indeks yang sama di kedua selector | S&P 500 dipilih di selector 1 | 1. Pilih "S&P 500" juga di selector 2 | 1. Warning atau notifikasi muncul (contoh: "Pilih indeks yang berbeda")<br>2. Atau selector 2 otomatis berganti ke indeks berbeda | 🟠 High | Negatif |

### 3.2 Chart & Visualisasi

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-CMP-005 | Overlay chart menampilkan history 2 indeks | 2 indeks dipilih | 1. Lihat area chart utama | 1. Chart time-series dengan 2 garis ter-overlay<br>2. Sumbu X = waktu, sumbu Y = harga/poin indeks<br>3. Tooltip muncul saat hover di chart | 🔴 Critical | E2E |
| BB-CMP-006 | Tooltip chart menampilkan data kedua indeks | 2 indeks di-chart, hover | 1. Hover cursor di atas chart | 1. Tooltip muncul dengan timestamp<br>2. Tooltip menampilkan harga kedua indeks pada titik tersebut | 🟠 High | E2E |
| BB-CMP-007 | Market heatmap ter-render | CompareView terbuka | 1. Scroll ke bawah dari chart utama | 1. Market heatmap (treemap) terlihat<br>2. Setiap cell mewakili saham konstituen indeks<br>3. Warna cell: hijau (naik) dan merah (turun)<br>4. Ukuran cell proporsional terhadap market cap | 🟠 High | E2E |

### 3.3 News Panel

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-CMP-008 | News panel dapat dibuka | CompareView dengan indeks terpilih | 1. Klik tombol/ikon News | 1. Panel berita slide-out dari samping<br>2. Panel menampilkan daftar artikel berita<br>3. Setiap artikel: judul, publisher, timestamp, thumbnail | 🔴 Critical | E2E |
| BB-CMP-009 | Berita relevan dengan indeks yang dipilih | S&P 500 dipilih, news panel terbuka | 1. Lihat judul-judul artikel | 1. Artikel berkaitan dengan pasar US/S&P 500<br>2. Artikel tidak dalam bahasa asing yang tidak relevan | 🟠 High | E2E |
| BB-CMP-010 | News panel dapat ditutup | News panel terbuka | 1. Klik tombol close (X) | 1. Panel tertutup<br>2. Tampilan kembali ke CompareView penuh | 🟠 High | E2E |
| BB-CMP-011 | Link artikel dapat diklik | News panel terbuka | 1. Klik judul artikel | 1. External browser/webview terbuka dengan URL artikel<br>2. URL yang terbuka sesuai dengan sumber artikel | 🟠 High | E2E |

---

## 4. Stock Detail Panel (BB-SDP)

### 4.1 Overview Tab

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SDP-001 | StockDetailPanel terbuka dengan data lengkap | ScreenerView, klik kartu AAPL | 1. Klik kartu AAPL di ScreenerView | 1. Panel terbuka dengan tampilan full-screen/overlay<br>2. Header menampilkan: AAPL, Apple Inc., harga saat ini, perubahan<br>3. Tab navigasi terlihat: Overview, Chart, Financials, About | 🔴 Critical | E2E |
| BB-SDP-002 | Overview tab menampilkan info perusahaan | Panel AAPL terbuka | 1. Tab Overview aktif (default)<br>2. Lihat grid informasi | 1. Informasi perusahaan terlihat: PE ratio, Market Cap, Dividend Yield<br>2. Harga, day range, 52-week range<br>3. Data tidak ada yang kosong untuk saham major (AAPL) | 🔴 Critical | E2E |
| BB-SDP-003 | Overview menampilkan rekomendasi analis | Panel AAPL terbuka | 1. Lihat section rekomendasi analis | 1. Jumlah rating: Buy, Hold, Sell terlihat<br>2. Target price analyst terlihat jika tersedia | 🟠 High | E2E |
| BB-SDP-004 | Tanggal dividen terakhir terlihat | Panel AAPL terbuka | 1. Lihat section dividend | 1. Ex-dividend date dan dividend yield terlihat | 🟡 Medium | E2E |

### 4.2 Chart Tab

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SDP-005 | Chart tab menampilkan candlestick/chart | Panel AAPL terbuka | 1. Klik tab "Chart" atau "Grafik" | 1. Candlestick chart ter-render<br>2. Sumbu X = waktu, sumbu Y = harga<br>3. Volume bar terlihat di bawah candlestick | 🔴 Critical | E2E |
| BB-SDP-006 | Timeframe selector berfungsi | Chart tab aktif | 1. Pilih timeframe "15m"<br>2. Pilih "1h" | 1. Chart memperbarui granularitas data sesuai timeframe<br>2. Jumlah candle berubah (lebih banyak untuk interval lebih pendek) | 🟠 High | E2E |
| BB-SDP-007 | Mode chart toggle: Candle / Line | Chart tab aktif, mode Candle | 1. Klik toggle Line | 1. Chart berganti dari candlestick ke line chart<br>2. Data tetap konsisten (harga sama, representasi berbeda) | 🟠 High | E2E |
| BB-SDP-008 | Y-scale toggle log/linear | Chart tab aktif | 1. Klik toggle Y-scale | 1. Scale sumbu Y berubah dari linear ke log (atau sebaliknya)<br>2. Chart tidak rusak atau kosong | 🟡 Medium | E2E |
| BB-SDP-009 | Chart dapat di-scroll/drag untuk melihat history | Chart tab aktif | 1. Klik dan drag chart ke kiri | 1. Chart bergeser ke data yang lebih lama<br>2. Dapat di-scroll kembali ke posisi awal | 🟡 Medium | E2E |
| BB-SDP-010 | MA50 line terlihat di chart | Chart tab aktif | 1. Perhatikan chart | 1. Moving Average line (MA50 atau indikator lain) ter-overlay di chart<br>2. Warna berbeda dari candlestick | 🟡 Medium | E2E |

### 4.3 Financials Tab

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SDP-011 | Financials tab menampilkan laporan keuangan | Panel AAPL terbuka | 1. Klik tab "Financials" atau "Laporan Keuangan" | 1. Tabel income statement terlihat (Revenue, Net Income, Operating Income)<br>2. Tabel balance sheet terlihat (Assets, Liabilities, Equity)<br>3. Tabel cash flow terlihat (Operating, Investing, Financing) | 🔴 Critical | E2E |
| BB-SDP-012 | Data financial untuk tahun yang berbeda | Financials tab aktif | 1. Perhatikan kolom header tabel | 1. Terdapat multiple columns untuk tahun berbeda (contoh: 2023, 2024)<br>2. Nilai numerik konsisten antar tahun | 🟠 High | E2E |
| BB-SDP-013 | Saham tanpa dividen menampilkan data kosong | Buka panel AMZN (tidak ada dividen) | 1. Kembali ke ScreenerView<br>2. Klik AMZN<br>3. Lihat tab Overview | 1. Informasi dividen menampilkan "N/A" atau "0" atau "Tidak ada dividen"<br>2. Tidak ada error | 🟠 High | Negatif |

### 4.4 About Tab & Navigation

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SDP-014 | About tab menampilkan deskripsi perusahaan | Panel AAPL terbuka | 1. Klik tab "About" atau "Tentang" | 1. Deskripsi bisnis perusahaan terlihat (paragraf atau beberapa baris)<br>2. Sector, industry, employee count jika tersedia | 🟠 High | E2E |
| BB-SDP-015 | Tab navigasi berfungsi — pindah antar tab | Panel AAPL terbuka | 1. Klik Overview → Chart → Financials → About | 1. Konten berganti setiap kali tab di-klik<br>2. Tab yang aktif ter-highlight<br>3. Tidak ada loading ulang panel | 🟠 High | E2E |
| BB-SDP-016 | Panel dapat ditutup dengan tombol close | Panel AAPL terbuka | 1. Klik tombol Back/Close | 1. Panel tertutup<br>2. Kembali ke ScreenerView dengan grid saham | 🔴 Critical | E2E |
| BB-SDP-017 | Panel dapat ditutup dengan klik di luar (jika modal) | Panel sebagai modal/overlay | 1. Klik area gelap di luar panel | 1. Panel tertutup<br>2. Kembali ke tampilan sebelumnya | 🟠 High | E2E |

### 4.5 Empty & Error State

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SDP-018 | Panel untuk ticker tanpa data keuangan tetap aman | Buka ticker dengan data terbatas | 1. Buka panel untuk ticker yang datanya terbatas | 1. Tab Financials menampilkan "Data tidak tersedia" atau tabel kosong<br>2. Panel tidak crash<br>3. Tab lain tetap berfungsi | 🟠 High | Negatif |
| BB-SDP-019 | Loading state saat chart dimuat | Koneksi lambat | 1. Buka tab Chart | 1. Loading indicator muncul sementara data chart dimuat<br>2. Chart ter-render setelah selesai | 🟡 Medium | E2E |

---

## 5. Portfolio View — CRUD (BB-POR)

### 5.1 Tampilan Daftar Posisi

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-POR-001 | PortfolioView menampilkan daftar posisi | Memiliki 1+ posisi tersimpan | 1. Klik tab Portfolio di sidebar | 1. Tabel posisi terlihat dengan kolom: Ticker, Company, SHARES (Lot), Buy Price, PnL, Actions<br>2. Setiap baris berisi data posisi yang tersimpan<br>3. Header metrics (Total PnL, Stock Return, Forex Return) terlihat | 🔴 Critical | E2E |
| BB-POR-002 | PortfolioView kosong menampilkan empty state | Tidak ada posisi tersimpan | 1. Pastikan DB kosong<br>2. Buka PortfolioView | 1. Tabel muncul dengan header tapi tanpa data baris<br>2. Atau teks "Belum ada posisi"<br>3. Metrics menampilkan 0 atau dash<br>4. Tidak ada error | 🔴 Critical | E2E |
| BB-POR-003 | Tombol "Add Position" terlihat | PortfolioView terbuka | 1. Lihat header PortfolioView | 1. Tombol "Add Position" atau "+" terlihat<br>2. Tombol dapat diklik | 🔴 Critical | E2E |

### 5.2 Add Position

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-POR-004 | Modal Add Position terbuka | PortfolioView terbuka | 1. Klik tombol "Add Position" | 1. Modal dengan form muncul<br>2. Form fields: Ticker (dengan dropdown), Company, SHARES (Lot), Buy Price, Buy Date, Currency<br>3. Tombol Save dan Cancel terlihat | 🔴 Critical | E2E |
| BB-POR-005 | Tambah posisi saham US valid (AAPL) | Modal Add Position terbuka | 1. Ketik "AAPL" di field Ticker<br>2. Pilih AAPL dari dropdown<br>3. Company auto-terisi "Apple Inc."<br>4. Isi SHARES: "10"<br>5. Isi Buy Price: "150"<br>6. Isi Buy Date: pilih tanggal (contoh: 2026-01-15)<br>7. Klik Save | 1. Modal tertutup<br>2. Posisi baru muncul di tabel<br>3. Ticker: AAPL, Company: Apple Inc., SHARES: 10, Buy Price: 150<br>4. PnL terhitung (angka positif/negatif tergantung harga saat ini)<br>5. Metrics memperbarui | 🔴 Critical | E2E |
| BB-POR-006 | Tambah posisi saham Indonesia (BBCA.JK) | Modal Add Position terbuka | 1. Ketik "BBCA"<br>2. Pilih BBCA.JK dari dropdown<br>3. Company auto-terisi<br>4. Currency otomatis IDR<br>5. SHARES: 100, Buy Price: 9500, Buy Date: hari ini<br>6. Klik Save | 1. Posisi BBCA.JK muncul di tabel<br>2. Currency kolom: IDR<br>3. PnL terhitung dalam Rupiah (Rp) | 🔴 Critical | E2E |
| BB-POR-007 | Tambah posisi saham Jepang (9984.T) | Modal Add Position terbuka | 1. Ketik "9984.T"<br>2. Pilih dari dropdown<br>3. Currency otomatis JPY<br>4. SHARES: 10, Buy Price: 9000, Buy Date: hari ini<br>5. Klik Save | 1. Posisi 9984.T muncul di tabel<br>2. Currency: JPY<br>3. PnL terhitung dengan komponen forex JPY→IDR | 🟠 High | E2E |
| BB-POR-008 | Tambah posisi dengan ticker dari dropdown | Modal Add Position terbuka | 1. Klik field Ticker<br>2. Pilih ticker dari dropdown (tanpa mengetik) | 1. Ticker terisi sesuai pilihan<br>2. Company auto-terisi<br>3. Currency auto-terisi sesuai suffix ticker | 🟠 High | E2E |

### 5.3 Edit Position

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-POR-009 | Edit shares posisi yang ada | Posisi AAPL ada di tabel | 1. Klik tombol Edit (ikon pensil) di baris AAPL<br>2. Modal terbuka dengan data pre-filled<br>3. Ubah SHARES dari 10 → 15<br>4. Klik Update/Save | 1. Modal tertutup<br>2. SHARES baris AAPL berubah menjadi 15<br>3. PnL dan metrics memperbarui | 🔴 Critical | E2E |
| BB-POR-010 | Edit buy price posisi | Posisi AAPL ada | 1. Edit posisi AAPL<br>2. Ubah Buy Price dari 150 → 160<br>3. Save | 1. Buy Price berubah menjadi 160<br>2. PnL berubah karena harga beli baru | 🔴 Critical | E2E |
| BB-POR-011 | Edit posisi tanpa mengubah nilai | Posisi AAPL ada | 1. Edit posisi AAPL<br>2. Save tanpa mengubah apapun | 1. Operasi berhasil (no-error)<br>2. Data posisi tidak berubah | 🟡 Medium | E2E |
| BB-POR-012 | Cancel edit tidak mengubah data | Modal edit AAPL terbuka | 1. Ubah SHARES menjadi 999<br>2. Klik Cancel | 1. Modal tertutup<br>2. Data posisi AAPL tetap seperti sebelum edit | 🟠 High | E2E |

### 5.4 Delete Position

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-POR-013 | Delete posisi dengan konfirmasi | Posisi ada di tabel | 1. Klik tombol Delete (ikon sampah) di baris posisi<br>2. Modal konfirmasi muncul dengan teks "Hapus [Ticker]?" | 1. Modal konfirmasi terlihat<br>2. Tombol "Batal" (Cancel) dan "Hapus" (Delete) tersedia | 🔴 Critical | E2E |
| BB-POR-014 | Konfirmasi delete menghapus posisi | Modal konfirmasi terbuka | 1. Klik "Hapus" | 1. Modal tertutup<br>2. Posisi hilang dari tabel<br>3. Metrics memperbarui<br>4. Jumlah posisi berkurang 1 | 🔴 Critical | E2E |
| BB-POR-015 | Batal delete tidak menghapus posisi | Modal konfirmasi terbuka | 1. Klik "Batal" | 1. Modal tertutup<br>2. Posisi tetap ada di tabel<br>3. Tidak ada perubahan data | 🟠 High | E2E |
| BB-POR-016 | Tombol delete berwarna merah/danger | Modal konfirmasi terbuka | 1. Perhatikan tombol "Hapus" | 1. Tombol "Hapus" berwarna merah<br>2. Tombol "Batal" warna netral/ab-abu | 🟡 Medium | E2E |

### 5.5 Visual Status & Format

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-POR-017 | PnL positif berwarna hijau, negatif merah | PortfolioView dengan posisi | 1. Amati PnL di tabel dan metrics | 1. PnL positif: teks hijau, dengan tanda +<br>2. PnL negatif: teks merah, dengan tanda -<br>3. Format: "Rp X.XXX.XXX" atau "USD X,XXX.XX" | 🔴 Critical | E2E |
| BB-POR-018 | Format angka menggunakan pemisah ribuan | Posisi dengan nilai > 999 | 1. Lihat Buy Price atau PnL di tabel | 1. Angka menggunakan pemisah ribuan (titik atau koma)<br>2. Contoh: "Rp 1.500.000" atau "1,500,000" | 🟡 Medium | E2E |
| BB-POR-019 | Row hover effect | PortfolioView dengan tabel | 1. Hover cursor di atas baris posisi | 1. Baris berubah warna (highlight/lebih terang)<br>2. Tombol aksi (edit/delete) terlihat lebih jelas | 🟡 Medium | E2E |

### 5.6 Import & Export

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-POR-020 | Export portofolio CSV berhasil | Minimal 1 posisi tersimpan | 1. Buka ProfileView (Settings)<br>2. Klik tombol "Export Portfolio" atau "Export CSV" | 1. File ter-download (CSV format)<br>2. File berisi header: ticker, company, shares, buyPrice, buyDate, currency<br>3. Data posisi yang ada tercantum di file | 🟠 High | E2E |
| BB-POR-021 | Import portofolio dari CSV valid | File CSV valid siap diupload | 1. Buka ProfileView<br>2. Klik "Import Portfolio"<br>3. Pilih file CSV yang valid<br>4. Konfirmasi | 1. Posisi baru muncul di PortfolioView<br>2. Semua posisi dari CSV ter-import dengan benar | 🟠 High | E2E |
| BB-POR-022 | Import file format salah ditolak | File .txt sembarang siap | 1. Klik "Import"<br>2. Pilih file .txt | 1. Error message: "Format file tidak valid" atau sejenisnya<br>2. Data portofolio yang ada tidak terpengaruh | 🔴 Critical | Negatif |
| BB-POR-023 | Import file kosong memberikan feedback | File CSV kosong siap | 1. Import file CSV kosong | 1. Notifikasi "Tidak ada data untuk diimport" atau sejenisnya<br>2. Tidak crash | 🟡 Medium | Negatif |
| BB-POR-024 | Round-trip: export → import hasil identik | 2+ posisi tersimpan | 1. Export portofolio → simpan file<br>2. Hapus semua posisi<br>3. Import file hasil export | 1. Semua posisi kembali muncul<br>2. Data (ticker, shares, buyPrice, dll) identik dengan sebelum dihapus | 🔴 Critical | E2E |

---

## 6. PnL Calculation (BB-PNL)

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-PNL-001 | PnL saham IDR (tanpa forex) | Posisi BBCA.JK dengan currency IDR | 1. Tambah posisi BBCA.JK: 100 shares @ 9500<br>2. Buka PortfolioView | 1. PnL baris BBCA.JK menampilkan angka (positif/negatif)<br>2. Forex Return = 0 (atau tidak ada komponen forex)<br>3. Total PnL = Stock Return (dalam IDR) | 🔴 Critical | E2E |
| BB-PNL-002 | PnL saham USD (dengan forex) | Posisi AAPL dengan currency USD | 1. Tambah posisi AAPL: 10 shares @ 150<br>2. Buka PortfolioView | 1. PnL menampilkan Stock Return dalam USD/IDR<br>2. Forex Return terhitung (nilai bisa positif/negatif)<br>3. Total PnL ≠ Stock Return saja (ada komponen forex) | 🔴 Critical | E2E |
| BB-PNL-003 | PnL negatif menampilkan warna merah | Posisi dengan harga beli di atas harga saat ini | 1. Tambah posisi dengan buyPrice tinggi (contoh: saham yang sedang turun)<br>2. Buka PortfolioView | 1. PnL menampilkan angka negatif dengan tanda -<br>2. Warna merah<br>3. Total PnL juga negatif | 🔴 Critical | E2E |
| BB-PNL-004 | Total PnL = stockReturn + forexReturn | Portfolio dengan beberapa posisi multi-currency | 1. Tambah BBCA.JK (IDR) + AAPL (USD)<br>2. Buka PortfolioView | 1. Total PnL di metrics = sum PnL semua posisi<br>2. Stock Return dan Forex Return ditampilkan secara terpisah<br>3. Angka konsisten | 🔴 Critical | E2E |
| BB-PNL-005 | Grand total lintas semua posisi | 3 posisi berbeda (IDR, USD, JPY) | 1. Tambah 3 posisi dengan currency berbeda<br>2. Buka PortfolioView | 1. Metrics menampilkan angka grand total<br>2. Grand total = sum totalPnL semua posisi<br>3. Tidak ada pembulatan yang tidak konsisten | 🔴 Critical | E2E |
| BB-PNL-006 | PnL portofolio kosong = 0 | Tidak ada posisi | 1. Buka PortfolioView saat kosong | 1. Metrics menampilkan 0 atau dash<br>2. Tidak ada error | 🟠 High | E2E |
| BB-PNL-007 | Kalkulasi ulang setelah edit posisi | Posisi AAPL ada dengan PnL terlihat | 1. Edit shares AAPL (10 → 20)<br>2. Save<br>3. Amati PnL | 1. PnL baris AAPL berubah (karena shares berbeda)<br>2. Total PnL berubah sesuai<br>3. Kalkulasi selesai dalam beberapa detik | 🟠 High | E2E |
| BB-PNL-008 | PnL dalam Rp untuk semua posisi | Portfolio dengan multi-currency | 1. Lihat kolom PnL di tabel | 1. Semua PnL ditampilkan dalam Rupiah (Rp)<br>2. Format konsisten untuk semua baris | 🟠 High | E2E |
| BB-PNL-009 | Label Stock Return dan Forex Return terlihat | PortfolioView dengan posisi USD | 1. Lihat metrics cards | 1. Tiga card terlihat: Total P&L, Stock Return, Forex Return<br>2. Masing-masing dengan angka yang sesuai<br>3. Forex Return menampilkan 0 untuk posisi IDR saja | 🟡 Medium | E2E |
| BB-PNL-010 | PnL dengan buyPrice jauh di atas current price | Posisi dengan loss besar | 1. Tambah posisi dengan buyPrice sangat tinggi (contoh: 500 untuk saham yang saat ini 150)<br>2. Buka PortfolioView | 1. PnL menampilkan angka negatif besar<br>2. Format angka masih rapi (tidak overflow)<br>3. Warna merah | 🟡 Medium | E2E |

---

## 7. IPC Full-Stack — Data Fetching (BB-IPC)

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-IPC-001 | Data OHLCV tampil di StockDetailPanel via UI | App running, internet aktif | 1. Buka ScreenerView<br>2. Klik kartu AAPL<br>3. Buka tab Chart | 1. Candlestick chart muncul dengan data harga<br>2. Data real dari Yahoo Finance (bukan mock)<br>3. Harga sesuai dengan market real | 🔴 Critical | E2E |
| BB-IPC-002 | Data news tampil di Globe panel | App running | 1. Buka GlobeView<br>2. Klik negara US<br>3. Lihat berita di panel | 1. Artikel berita US muncul di panel<br>2. Judul dan timestamp real dari Google News | 🔴 Critical | E2E |
| BB-IPC-003 | Data macro tampil setelah klik negara | App running | 1. Klik negara US di Globe<br>2. Lihat kalender ekonomi | 1. Event ekonomi US muncul (dari Investing.com)<br>2. Impact, actual, forecast, previous terlihat | 🔴 Critical | E2E |
| BB-IPC-004 | Data forex tampil di panel Globe | App running | 1. Klik negara di Globe<br>2. Lihat tabel forex | 1. Kurs forex real tampil<br>2. Minimal 3 pasangan mata uang | 🔴 Critical | E2E |
| BB-IPC-005 | Data company info tampil di StockDetailPanel | App running | 1. Buka ScreenerView<br>2. Klik kartu MSFT<br>3. Buka tab Overview | 1. Info perusahaan MSFT real tampil<br>2. PE ratio, market cap sesuai data real | 🔴 Critical | E2E |
| BB-IPC-006 | Data index history tampil di CompareView | App running | 1. Buka CompareView<br>2. Pilih S&P 500 dan IHSG | 1. Chart history real untuk kedua indeks tampil<br>2. Data time series dari Yahoo Finance | 🔴 Critical | E2E |
| BB-IPC-007 | Data portofolio tersimpan dan terbaca setelah restart | Posisi tersimpan | 1. Tambah posisi AAPL<br>2. Tutup app<br>3. Buka app kembali<br>4. Buka PortfolioView | 1. Posisi AAPL masih ada di tabel<br>2. Data persisten (tersimpan di SQLite) | 🔴 Critical | E2E |
| BB-IPC-008 | Fetch company info untuk multiple ticker di CompareView | App running | 1. Buka CompareView<br>2. Pilih 2 indeks | 1. Data multiple ticker muncul<br>2. Semua data real, tidak ada yang kosong untuk indeks major | 🟠 High | E2E |
| BB-IPC-009 | Concurrent data fetch stabil | App running | 1. Buka CompareView (fetch multiple data)<br>2. Cepat ganti ke PortfolioView (fetch portfolio)<br>3. Cepat ganti ke GlobeView (fetch indices) | 1. Semua view menampilkan data masing-masing<br>2. Tidak ada data tercampur antar view<br>3. Tidak ada crash | 🟠 High | E2E |
| BB-IPC-010 | Error response tampil untuk ticker invalid | App running | 1. Buka ScreenerView<br>2. Arahkan ke halaman/ticker yang tidak valid | 1. Error message yang user-friendly tampil<br>2. Tidak crash<br>3. Data view lainnya tidak terpengaruh | 🔴 Critical | Negatif |
| BB-IPC-011 | Data index tunggal tampil benar | App running | 1. Buka CompareView<br>2. Pilih 1 indeks saja (biarkan selector 2 kosong jika memungkinkan) | 1. Chart untuk indeks yang dipilih tampil<br>2. Tidak ada error | 🟠 High | E2E |

---

## 8. Profile View (BB-PRF)

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-PRF-001 | ProfileView dapat dibuka | App running | 1. Buka halaman Profile/Settings | 1. Pengaturan tampil: theme toggle, export/import<br>2. Judul halaman: "Settings" atau "Profile" | 🟠 High | E2E |
| BB-PRF-002 | Theme toggle berfungsi | ProfileView terbuka | 1. Klik toggle theme (dark/light) | 1. Tema aplikasi berubah<br>2. Semua view konsisten dengan tema baru<br>3. Toggle kembali ke tema semula berfungsi | 🟡 Medium | E2E |
| BB-PRF-003 | Export portofolio CSV dari ProfileView | 1+ posisi ada | 1. Buka ProfileView<br>2. Klik "Export Portfolio" | 1. File CSV ter-download<br>2. Header sesuai format: ticker, company, shares, buyPrice, buyDate, currency | 🟠 High | E2E |
| BB-PRF-004 | Import portofolio dengan partial error | File CSV dengan 1 baris valid + 1 baris invalid | 1. Upload file partial invalid<br>2. Klik Import | 1. Baris valid ter-import<br>2. Baris invalid dilewati dengan laporan error<br>3. Data yang valid tetap muncul | 🟠 High | Negatif |
| BB-PRF-005 | Import file dengan field hilang | File CSV tanpa field shares | 1. Upload CSV tanpa kolom shares<br>2. Klik Import | 1. Error validasi (baris tanpa shares ditolak)<br>2. Data DB tidak terkorupsi | 🟠 High | Negatif |

---

## 9. Background Worker (BB-BGW)

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-BGW-001 | Scraping berjalan di background | App running, data belum di-cache | 1. Buka ScreenerView untuk region baru (first load) | 1. UI tetap responsif saat scraping berjalan<br>2. Loading indicator muncul<br>3. Data muncul setelah selesai | 🔴 Critical | E2E |
| BB-BGW-002 | UI tidak freeze saat background scraping | Scraping berlangsung | 1. Trigger scraping (ganti region)<br>2. Selagi loading, klik tab lain (Globe, Compare, Portfolio) | 1. Tab navigasi berfungsi normal<br>2. View lain tetap interaktif<br>3. Tidak ada freeze/lag yang signifikan | 🔴 Critical | E2E |
| BB-BGW-003 | Data dari scraping muncul di UI | Scraping selesai | 1. Tunggu scraping selesai<br>2. Navigasi ke view yang datanya baru di-scrape | 1. Data real tampil<br>2. Data tidak kosong | 🟠 High | E2E |
| BB-BGW-004 | App bisa ditutup saat scraping berjalan | Scraping berlangsung | 1. Trigger scraping<br>2. Langsung tutup aplikasi | 1. App tertutup tanpa hang<br>2. Tidak perlu menunggu scraping selesai | 🔴 Critical | E2E |
| BB-BGW-005 | Scraping tidak duplikat untuk key yang sama | Scraping region US sedang berlangsung | 1. Cepat klik region US 2 kali berturut-turut | 1. Hanya 1 proses scraping yang berjalan<br>2. Tidak ada double request | 🟠 High | E2E |

---

## 10. Edge Cases (BB-EDG)

### 10.1 Network Related

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-EDG-001 | App jalan dengan cache saat offline | Data sudah di-cache sebelumnya | 1. Putuskan koneksi internet<br>2. Buka ScreenerView (region yang sudah di-cache)<br>3. Buka PortfolioView | 1. Data dari cache masih tampil<br>2. Error yang jelas untuk operasi yang butuh internet<br>3. Tidak crash | 🔴 Critical | Negatif |
| BB-EDG-002 | Aplikasi pertama kali tanpa data/cache | App fresh install, no data | 1. Hapus folder data/ dan cache.db<br>2. Jalankan app<br>3. Buka setiap tab | 1. App berjalan tanpa error<br>2. Loading state di setiap view<br>3. Scraping berjalan on-demand saat tab dibuka | 🔴 Critical | Negatif |
| BB-EDG-003 | Koneksi lambat — timeout tidak crash | Koneksi internet lambat | 1. Throttle koneksi (contoh: 3G slow)<br>2. Buka ScreenerView<br>3. Buka StockDetailPanel | 1. Loading indicator tampil<br>2. Timeout/error message yang jelas jika data gagal dimuat<br>3. Tidak freeze selamanya | 🟠 High | Negatif |

### 10.2 Concurrent Operations

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-EDG-004 | Double-click Add Position tidak duplikat | PortfolioView terbuka | 1. Klik Add Position<br>2. Isi form<br>3. Klik Save 2 kali cepat | 1. Hanya 1 posisi yang tersimpan<br>2. Tidak ada duplikasi | 🟠 High | Negatif |
| BB-EDG-005 | Tambah posisi sementara posisi lain sedang di-load | PortfolioView dengan data | 1. Buka PortfolioView (loading PnL)<br>2. Segera klik Add Position | 1. Modal Add Position tetap terbuka<br>2. Form berfungsi normal<br>3. Data bisa di-save | 🟠 High | Negatif |
| BB-EDG-006 | Ganti tab saat StockDetailPanel terbuka | StockDetailPanel AAPL terbuka | 1. Klik tab Portfolio di sidebar (tanpa menutup panel) | 1. Pindah ke PortfolioView<br>2. Kembali ke ScreenerView<br>3. StockDetailPanel tidak lagi terbuka (atau tertutup otomatis) | 🟡 Medium | E2E |

### 10.3 Data Display

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-EDG-007 | Saham tanpa dividen (AMZN) tidak error | App running | 1. Buka ScreenerView<br>2. Klik AMZN<br>3. Lihat tab Overview | 1. Data dividen menampilkan "N/A" atau "Tidak ada dividen"<br>2. Data lain (PE, market cap) tetap tampil | 🟠 High | E2E |
| BB-EDG-008 | Saham dengan harga sangat kecil (penny stock) | App running | 1. Cari ticker penny stock<br>2. Buka detail | 1. Harga tampil dengan desimal yang sesuai<br>2. Tidak ada pembulatan yang salah | 🟡 Medium | E2E |
| BB-EDG-009 | Portfolio dengan 10+ posisi | 10+ posisi tersimpan | 1. Buka PortfolioView | 1. Semua posisi tampil di tabel<br>2. Scroll table berfungsi<br>3. Metrics akurat | 🟡 Medium | E2E |
| BB-EDG-010 | Format angka Rp dan USD yang benar | Posisi IDR dan USD | 1. Tambah posisi IDR (BBCA.JK)<br>2. Tambah posisi USD (AAPL)<br>3. Lihat Buy Price dan PnL | 1. Format IDR menggunakan "Rp" prefix<br>2. Format USD menggunakan "$" prefix<br>3. Pemisah ribuan rapi | 🟡 Medium | E2E |

### 10.4 Market Related

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-EDG-011 | Data historis masih tersedia saat market tutup | Weekend/holiday | 1. Buka ScreenerView saat Sabtu/Minggu | 1. Data harga dari hari trading terakhir masih tampil<br>2. Chart historis masih bisa diakses | 🟡 Medium | E2E |
| BB-EDG-012 | Ticker yang di-delist menampilkan error informatif | Ticker yang sudah tidak aktif | 1. Cari ticker yang sudah di-delist | 1. Error message yang jelas ("Ticker tidak aktif" atau "Data tidak tersedia")<br>2. Tidak crash | 🟡 Medium | Negatif |

---

## 11. Security — Input Validation (BB-SEC)

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-SEC-001 | XSS di field Ticker — script tidak dieksekusi | Modal Add Position terbuka | 1. Ketik `<script>alert('xss')</script>` di field Ticker<br>2. Klik Save | 1. Error validasi: "Ticker tidak valid"<br>2. Script tidak dieksekusi (no alert popup)<br>3. Tidak ada perubahan di halaman | 🔴 Critical | Input Validation |
| BB-SEC-002 | SQL injection analog di field input | Modal Add Position terbuka | 1. Ketik `'; DROP TABLE positions; --` di field Ticker<br>2. Klik Save | 1. Error validasi tampil<br>2. Data portofolio tetap aman (tidak terhapus)<br>3. Setelah test, PortfolioView masih menampilkan data yang ada | 🔴 Critical | Input Validation |
| BB-SEC-003 | Character special di ticker | Modal Add Position terbuka | 1. Ketik `A.B/C` atau `B&B` di field Ticker<br>2. Klik Save | 1. Error validasi: "Ticker format tidak valid"<br>2. Ticker tidak tersimpan | 🔴 Critical | Input Validation |
| BB-SEC-004 | Input ticker sangat panjang (500 karakter) | Modal Add Position terbuka | 1. Paste/ketik 500 karakter "A" di field Ticker<br>2. Klik Save | 1. Error validasi input terlalu panjang<br>2. Aplikasi tidak crash atau freeze | 🟠 High | Input Validation |
| BB-SEC-005 | Shares negatif ditolak | Modal Add Position terbuka | 1. Isi SHARES dengan "-5"<br>2. Isi field lain valid<br>3. Klik Save | 1. Error validasi: "Shares harus lebih dari 0"<br>2. Data tidak tersimpan | 🔴 Critical | Input Validation |
| BB-SEC-006 | Shares 0 ditolak | Modal Add Position terbuka | 1. Isi SHARES dengan "0"<br>2. Klik Save | 1. Error validasi: "Shares harus lebih dari 0"<br>2. Data tidak tersimpan | 🟠 High | Input Validation |
| BB-SEC-007 | Buy Price negatif ditolak | Modal Add Position terbuka | 1. Isi Buy Price dengan "-100"<br>2. Klik Save | 1. Error validasi: "Buy Price harus lebih dari 0"<br>2. Data tidak tersimpan | 🔴 Critical | Input Validation |
| BB-SEC-008 | Buy Price 0 ditolak | Modal Add Position terbuka | 1. Isi Buy Price dengan "0"<br>2. Klik Save | 1. Error validasi tampil<br>2. Data tidak tersimpan | 🟠 High | Input Validation |
| BB-SEC-009 | Tanggal masa depan ditolak | Modal Add Position terbuka | 1. Isi Buy Date dengan tanggal 1 tahun ke depan<br>2. Klik Save | 1. Error validasi: "Buy date tidak boleh melebihi hari ini"<br>2. Data tidak tersimpan | 🔴 Critical | Input Validation |
| BB-SEC-010 | Format tanggal salah ditolak | Modal Add Position terbuka | 1. Isi Buy Date dengan "01-15-2024" (format salah)<br>2. Klik Save | 1. Error validasi format tanggal<br>2. Data tidak tersimpan | 🟠 High | Input Validation |
| BB-SEC-011 | Ticker kosong ditolak | Modal Add Position terbuka | 1. Kosongkan field Ticker<br>2. Isi field lain valid<br>3. Klik Save | 1. Error: "Ticker harus diisi!"<br>2. Data tidak tersimpan | 🔴 Critical | Input Validation |
| BB-SEC-012 | Semua field dikosongkan — validasi komprehensif | Modal Add Position terbuka | 1. Klik Save tanpa mengisi apapun | 1. Error multiple validasi muncul (ticker, shares, buy price, date)<br>2. Tidak ada data yang tersimpan | 🔴 Critical | Input Validation |

---

## 12. End-to-End Flows (BB-E2E)

| TC-ID | Deskripsi | Pre-kondisi | Langkah Uji | Expected Result | Prioritas | Tipe |
|---|---|---|---|---|---|---|
| BB-E2E-001 | Alur lengkap: Buka app → Globe → klik negara → lihat makro | App fresh launch | 1. Buka aplikasi<br>2. Tab Globe aktif — peta muncul<br>3. Klik negara US<br>4. Panel detail terbuka dengan data makro<br>5. Klik negara Indonesia<br>6. Panel berganti ke data Indonesia | 1. Peta dunia ter-render<br>2. Negara bisa di-klik<br>3. Panel menampilkan data makro dan forex<br>4. Berganti negara mengubah data panel<br>5. Tidak ada error di setiap langkah | 🔴 Critical | E2E |
| BB-E2E-002 | Alur lengkap: Screener → detail saham → chart | App running | 1. Buka ScreenerView<br>2. Pilih region US — grid saham muncul<br>3. Klik kartu AAPL<br>4. StockDetailPanel terbuka<br>5. Lihat tab Overview — info perusahaan<br>6. Buka tab Chart — candlestick muncul<br>7. Ganti timeframe ke 1h | 1. Grid saham menampilkan data real<br>2. Detail panel terbuka dengan data lengkap<br>3. Chart candlestick real ter-render<br>4. Timeframe berfungsi<br>5. Tutup panel kembali ke grid | 🔴 Critical | E2E |
| BB-E2E-003 | Alur lengkap: Tambah posisi → lihat PnL | App running | 1. Buka PortfolioView — empty state<br>2. Klik Add Position<br>3. Isi: AAPL, 10 shares, @ 150, hari ini<br>4. Klik Save<br>5. Posisi AAPL muncul di tabel<br>6. PnL terhitung (positif/negatif)<br>7. Edit shares ke 15 — PnL berubah<br>8. Hapus posisi — kosong kembali | 1. Posisi berhasil ditambah<br>2. PnL muncul dengan warna sesuai<br>3. Edit berhasil — data berubah<br>4. Delete dengan konfirmasi berhasil<br>5. Semua state transisi mulus | 🔴 Critical | E2E |
| BB-E2E-004 | Alur lengkap: Compare 2 indeks → chart overlay | App running | 1. Buka CompareView<br>2. Pilih S&P 500 di selector 1<br>3. Pilih IHSG di selector 2<br>4. Chart overlay muncul<br>5. Hover di chart — tooltip muncul<br>6. Buka news panel — berita terlihat<br>7. Ganti Nikkei 225 di selector 2 | 1. Dua garis indeks ter-overlay<br>2. Tooltip menampilkan data kedua indeks<br>3. News panel relevan<br>4. Ganti indeks memperbarui chart | 🔴 Critical | E2E |
| BB-E2E-005 | Alur lengkap: Export → clear → import round-trip | 3 posisi di portofolio | 1. Export portofolio ke CSV<br>2. Hapus semua 3 posisi satu per satu<br>3. Verifikasi tabel kosong<br>4. Import file CSV yang di-export<br>5. 3 posisi muncul kembali | 1. File CSV valid<br>2. Semua posisi terhapus<br>3. Import berhasil — 3 posisi kembali<br>4. Data posisi identik dengan sebelum dihapus | 🔴 Critical | E2E |
| BB-E2E-006 | Alur multi-currency: Tambah IDR + USD + JPY | App running | 1. Tambah BBCA.JK (IDR) — 100 shares @ 9500<br>2. Tambah AAPL (USD) — 10 shares @ 150<br>3. Tambah 9984.T (JPY) — 10 shares @ 9000<br>4. Buka PortfolioView | 1. Semua 3 posisi tampil dengan currency masing-masing<br>2. PnL IDR tanpa forex<br>3. PnL USD dan JPY dengan forex<br>4. Grand total akurat (IDR conversion)<br>5. Stock Return dan Forex Return terpisah | 🔴 Critical | E2E |
| BB-E2E-007 | Alur lengkap: Navigasi semua tab | App running | 1. Globe → klik negara<br>2. Pindah ke Screener → ganti region → klik saham → detail<br>3. Tutup detail → CompareView → pilih indeks<br>4. PortfolioView → tambah posisi<br>5. ProfileView → export | 1. Setiap tab terbuka dengan benar<br>2. Data dari tab sebelumnya tidak tercampur<br>3. Tidak ada error di setiap transisi<br>4. Semua data real tampil | 🟠 High | E2E |

---

## 13. Coverage Matrix & Ringkasan

### Ringkasan Test Case

| Modul | Kode | Jumlah TC | 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low |
|---|---|---|---|---|---|---|
| Globe View | GLO | 19 | 5 | 8 | 6 | 0 |
| Screener View | SCR | 17 | 7 | 7 | 3 | 0 |
| Compare View | CMP | 11 | 5 | 4 | 2 | 0 |
| Stock Detail Panel | SDP | 19 | 6 | 8 | 5 | 0 |
| Portfolio View — CRUD | POR | 24 | 13 | 8 | 3 | 0 |
| PnL Calculation | PNL | 10 | 6 | 3 | 1 | 0 |
| IPC Full-Stack | IPC | 11 | 9 | 2 | 0 | 0 |
| Profile View | PRF | 5 | 0 | 4 | 1 | 0 |
| Background Worker | BGW | 5 | 3 | 2 | 0 | 0 |
| Edge Cases | EDG | 12 | 2 | 5 | 5 | 0 |
| Security — Input Validation | SEC | 12 | 9 | 3 | 0 | 0 |
| End-to-End Flows | E2E | 7 | 6 | 1 | 0 | 0 |
| **TOTAL** | | **152** | **71** | **55** | **26** | **0** |

### Coverage Matrix

| Modul / Tipe Test | E2E (Happy Path) | Negatif (Error Handling) | Input Validation |
|---|---|---|---|
| Globe View | 14 | 3 | 0 |
| Screener View | 13 | 2 | 0 |
| Compare View | 9 | 1 | 0 |
| Stock Detail Panel | 16 | 2 | 0 |
| Portfolio View — CRUD | 18 | 2 | 4 |
| PnL Calculation | 10 | 0 | 0 |
| IPC Full-Stack | 10 | 1 | 0 |
| Profile View | 3 | 2 | 0 |
| Background Worker | 4 | 1 | 0 |
| Edge Cases | 4 | 8 | 0 |
| Security — Input Validation | 0 | 0 | 12 |
| End-to-End Flows | 7 | 0 | 0 |
| **TOTAL** | **108** | **22** | **16** |

### Catatan Pengujian

1. **Real Network**: Seluruh test case blackbox ini mengasumsikan koneksi internet aktif dan menggunakan data real dari Yahoo Finance, Google News RSS, dan Investing.com. Hasil data (harga, kurs, berita) bersifat dinamis dan tidak dapat diprediksi secara tepat.

2. **Expected Result Dinamis**: Karena data real, assertions cukup memverifikasi bahwa data tampil (tidak null, format benar, warna sesuai) — bukan memverifikasi nilai spesifik.

3. **Cakupan**: Test case ini mencakup 4 main view plus cross-cutting concerns. Tidak mencakup unit testing, performance testing, atau accessibility testing — fokus pada blackbox E2E.

4. **Prioritas**: Test case dengan prioritas 🔴 Critical harus lulus 100% sebelum rilis. Test case 🟠 High harus diusahakan lulus.

5. **Skenario Negatif**: Test case negatif memastikan aplikasi memberikan feedback yang jelas saat terjadi error, bukan crash.

6. **Eksekusi**: Test case dapat dijalankan secara manual dengan mengikuti langkah uji, atau otomatis menggunakan Playwright/Cypress melalui selector UI.

---

> **Dibuat:** 2026-05-18  
> **File terkait:** `MAPRO_Test_Cases.md`, `tests/backend/TEST_RESULTS.md`, `TESTING_ANALYSIS.md`  
> **Dokumen ini hanya berisi test case blackbox — tidak ada referensi ke kode internal aplikasi.**
