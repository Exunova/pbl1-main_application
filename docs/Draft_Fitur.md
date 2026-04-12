Fitur-fitur
Modul Peta Pasar 
Structure Chart


Nomor
1
Modul
Peta Pasar
Nama
Tampilan World Map
Fungsi
Menampilkan peta dunia interaktif yang menggambarkan performa indeks utama tiap negara menggunakan kode warna merah dan hijau
Pre-Condition
Aplikasi sudah terbuka
Cara Penggunaan
	•	Pengguna membuka halaman World Map
	•	Peta dunia ditampilkan secara otomatis dengan tiap negara diwarnai berdasarkan performa indeks utamanya
	•	Pengguna dapat mengklik negara untuk melihat berita makro ekonominya
Data yang Dipakai
	•	Data harga terkini indeks utama keempat pasar yang didukung: S&P 500 (US), LQ45 (ID), Nikkei 225 (JP), FTSE 100 (UK)
	•	Data harga penutupan kemarin tiap indeks
Validasi
	•	Data performa indeks per negara harus tersedia dari sumber data
Initial State
Peta dunia belum ditampilkan dan semua negara belum diwarnai
Process
1. Sistem membaca data harga terkini dan harga penutupan kemarin dari indeks utama tiap negara dari database lokal (Yahoo Finance)
2. Untuk tiap negara, sistem menghitung performa indeks: Persentase Perubahan (%) = ((Harga Hari Ini - Harga Kemarin) / Harga Kemarin) x 100
3. Sistem menentukan warna tiap negara: hijau jika persentase positif, merah jika negatif, intensitas warna sebanding dengan besar persentase perubahan
4. Peta dunia dirender dengan warna-warna tersebut pada tiap negara yang tersedia datanya
Final State
Peta dunia interaktif ditampilkan dengan tiap negara telah diwarnai sesuai performa indeks utamanya
Flowchart


Nomor
2
Modul
Peta Pasar
Nama
Cari Region
Fungsi
Memungkinkan pengguna memilih salah satu dari empat pasar yang didukung: US (S&P 500), ID (LQ45), JP (Nikkei 225), UK (FTSE 100)
Pre-Condition
Aplikasi sudah terbuka
Cara Penggunaan
	•	Pengguna menekan tombol atau kolom pencarian region di halaman utama 
	•	Pengguna mengetikkan nama negara atau region yang ingin dicari
	•	Aplikasi menampilkan daftar hasil pencarian yang sesuai
Data yang Dipakai
	•	Kata kunci pencarian yang diketik pengguna
	•	Daftar empat pasar yang didukung: US, ID, JP, UK
Validasi
Pencarian hanya menampilkan hasil dari empat pasar yang didukung (US, ID, JP, UK)
Initial State
Region yang ditampilkan masih berdasarkan default (negara asal pengguna atau region sebelumnya)
Process
1. Pengguna mengetikkan kata kunci (minimal 1 karakter) di kolom pencarian region
2. Sistem memfilter daftar region yang tersedia secara real-time berdasarkan kata kunci (case-insensitive matching)
3. Hasil pencarian yang cocok ditampilkan sebagai daftar pilihan
4. Pengguna memilih region dari daftar hasil pencarian
5. Sistem memuat ulang data halaman utama sesuai region yang baru dipilih
Final State
Halaman utama menampilkan data pasar sesuai region yang baru dipilih pengguna

Nomor
3
Modul
Peta Pasar
Nama
Berita Makro ekonomi Negara
Fungsi
Menampilkan panel berita makro ekonomi dari negara yang dipilih saat pengguna mengklik negara di halaman World Map
Pre-Condition
Pengguna berada di halaman World Map
Cara Penggunaan
	•	 Pengguna mengklik salah satu negara di peta dunia
	•	Panel berita makroekonomi negara tersebut muncul di sisi kanan layar
Data yang Dipakai
	•	Negara yang diklik pengguna
	•	Data berita makroekonomi per negara dari database lokal (investing.com)
Validasi
	•	Data berita negara yang diklik harus tersedia dari sumber data
Initial State
Panel berita belum ditampilkan, tidak ada negara yang sedang dipilih
Process
1. Pengguna mengklik negara di peta dunia
2. Sistem mengidentifikasi negara yang diklik
3. Sistem membaca data berita makro ekonomi negara tersebut dari database lokal (investing.com)
4. Panel berita muncul di sisi kanan layar menampilkan daftar berita terkini yang relevan dengan negara tersebut
Final State
Panel berita makroekonomi negara yang diklik ditampilkan di sisi kanan halaman World Map

Nomor
4
Modul
Peta Pasar
Nama
Tabel Kurs Valas
Fungsi
Menampilkan nilai tukar mata uang asing (USD, EUR, RMB) terhadap mata uang region yang dipilih pengguna
Pre-Condition
Aplikasi sudah terbuka
Cara Penggunaan
	•	Pengguna membuka halaman utama
	•	Tabel kurs valas ditampilkan otomatis sesuai region yang dipilih pengguna
Data yang Dipakai
	•	Kurs mata uang
	•	Region yang dipilih pengguna
Validasi
Data kurs harus tersedia dari sumber data
Initial State
Tabel nilai tukar mata uang asing belum ditampilkan
Process
1. Sistem membaca data nilai tukar mata uang asing (USD, EUR, RMB) dari database lokal (investing.com)
2. Sistem menentukan mata uang lokal berdasarkan region yang dipilih pengguna (contoh: IDR untuk Indonesia)
3. Data kurs ditampilkan dalam format tabel: kolom mata uang asing di kiri dan nilai ekuivalennya dalam mata uang lokal di kanan
Final State
Tabel nilai tukar mata uang asing (USD, EUR, RMB) terhadap mata uang lokal sesuai region yang dipilih ditampilkan di halaman utama

Nomor
5
Modul
Peta Pasar
Nama
Kalender Ekonomi
Fungsi
Menampilkan jadwal rilis data ekonomi yang disesuaikan dengan region yang dipilih pengguna
Pre-Condition
Pengguna sudah memilih region
Cara Penggunaan
	•	Pengguna membuka halaman utama
	•	Pengguna memilih region
	•	Kalender ekonomi ditampilkan otomatis sesuai region
	•	Pengguna dapat melihat detail setiap event ekonomi
Data yang Dipakai
	•	Data jadwal rilis ekonomi sesuai region
Validasi
Data kalender harus tersedia dari sumber data sesuai region yang dipilih
Initial State
Kalender ekonomi belum ditampilkan
Process
1. Sistem membaca data jadwal rilis ekonomi dari database lokal (investing.com) (mencakup event seminggu ke depan)
2. Sistem memfilter event berdasarkan region yang dipilih pengguna
3. Event kalender ditampilkan dalam format tabel secara kronologis (nama event, tanggal, dan waktu rilis)
Final State
Kalender ekonomi menampilkan jadwal rilis data ekonomi yang relevan sesuai region yang dipilih


Grafik & Analisis

Structure Chart


Nomor
6
Modul
Grafik & Analisis
Nama
Grafik Indeks & Top Saham
Fungsi
Menampilkan grafik harga historis indeks utama dari pasar yang dipilih (S&P 500, LQ45, Nikkei 225, atau FTSE 100) beserta daftar 10 saham dengan kapitalisasi terbesar dalam indeks tersebut
Pre-Condition
Pengguna sudah memilih region
Cara Penggunaan
	•	Pengguna membuka halaman utama
	•	Pengguna memilih region
	•	Aplikasi otomatis menampilkan grafik line chart indeks utama
	•	Aplikasi menampilkan 10 grafik saham terbesar dalam indeks tersebut
Data yang Dipakai
	•	Data harga historis indeks yang dipilih (S&P 500 / LQ45 / Nikkei 225 / FTSE 100)
	•	Data harga 10 saham dengan kapitalisasi terbesar dalam indeks yang dipilih
Validasi
Data harga harus tersedia dari sumber data
Initial State
Grafik indeks dan grafik saham belum ditampilkan di halaman utama
Process
1. Sistem membaca data harga historis indeks utama dari database lokal (Yahoo Finance) (data OHLC: Open, High, Low, Close dengan timeframe default H1, 100–500 candle)
2. Sistem merender grafik line chart untuk indeks utama
3. Sistem membaca daftar 10 saham dengan kapitalisasi pasar terbesar dari file key statistics hasil pipeline scraping Yahoo Finance
4. Untuk masing-masing dari 10 saham tersebut, sistem membaca data harga historis dari database lokal (Yahoo Finance)
5. Sistem merender 10 grafik harga saham (line chart by default)
6. Semua grafik ditampilkan di halaman utama
Final State
Grafik line chart indeks utama dan 10 grafik saham dengan kapitalisasi terbesar ditampilkan di halaman utama

Nomor
7
Modul
Grafik & Analisis
Nama
Dukungan Multi-Indeks
Fungsi
Mendukung tampilan grafik dan data untuk keempat indeks utama yang didukung aplikasi: S&P 500 (US), LQ45 (ID), Nikkei 225 (JP), dan FTSE 100 (UK). Pengguna dapat berpindah antar indeks dari halaman utama grafik
Pre-Condition
Pengguna berada di halaman utama grafik
Cara Penggunaan
	•	1. Pengguna membuka halaman grafik
	•	2. Pengguna memilih salah satu dari empat indeks: S&P 500, LQ45, Nikkei 225, atau FTSE 100
	•	3. Grafik dan data top saham diperbarui sesuai indeks yang dipilih
Data yang Dipakai
	•	Daftar empat indeks yang didukung: S&P 500 (US), LQ45 (ID), Nikkei 225 (JP), FTSE 100 (UK)
	•	Data harga historis dan komposisi saham tiap indeks dari database lokal (Yahoo Finance)
Validasi
Hanya empat indeks yang dapat dipilih: S&P 500, LQ45, Nikkei 225, FTSE 100
Initial State
Hanya satu indeks yang ditampilkan, belum ada dukungan untuk region dengan beberapa indeks utama
Process
1. Pengguna memilih indeks dari daftar yang tersedia (S&P 500 / LQ45 / Nikkei 225 / FTSE 100)
2. Sistem membaca data harga historis indeks yang dipilih dari database lokal (Yahoo Finance)
3. Sistem merender ulang grafik dan daftar top saham sesuai indeks yang dipilih
Final State
Grafik dan data top saham ditampilkan sesuai indeks yang dipilih pengguna

Nomor
8
Modul
Grafik & Analisis
Nama
Kustomisasi Grafik
Fungsi
Memungkinkan pengguna untuk memilih jenis tampilan grafik
Pre-Condition
Pengguna berada di halaman utama
Cara Penggunaan
	•	Pengguna menekan slider untuk memilih jenis tampilan antara line atau candlestick
Data yang Dipakai
	•	Jenis grafik yang dipilih
Validasi

Initial State
Grafik ditampilkan dalam mode default yaitu line chart
Process
1. Pengguna menekan slider/toggle untuk memilih jenis grafik (line atau candlestick)
2. Sistem menyimpan preferensi jenis grafik sementara
3. Untuk mode candlestick, sistem menggunakan data OHLC (Open, High, Low, Close) dari database lokal (Yahoo Finance)
4. Untuk mode line, sistem hanya menggunakan data harga Close dari database lokal
5. Sistem merender ulang seluruh grafik yang ditampilkan dengan jenis tampilan yang dipilih
Final State
Seluruh grafik saham yang ditampilkan berubah sesuai jenis yang dipilih pengguna (line chart atau candlestick)

Nomor
9
Modul
Grafik & Analisis
Nama
Pilihan Timeframe & Data Historis
Fungsi
Menyediakan pilihan timeframe dari M1 hingga 1M dan mengambil data historis sesuai timeframe yang dipilih
Pre-Condition
Grafik sudah ditampilkan
Cara Penggunaan
	•	Pengguna memilih timeframe dari pilihan yang tersedia: M15, M30, H1 (default), atau H4
	•	Sistem menentukan jumlah candle historis yang akan dimuat berdasarkan timeframe yang dipilih
	•	Sistem membaca data harga historis dari database lokal (Yahoo Finance) sesuai timeframe yang dipilih
	•	Sistem merender ulang grafik dengan data historis yang baru
Data yang Dipakai
	•	Timeframe yang dipilih
	•	Data harga historis
Validasi
Timeframe harus salah satu dari M15, M30, H1, H4
Initial State
Grafik menampilkan data dengan timeframe default H1
Process
1. Pengguna memilih timeframe dari pilihan yang tersedia (M15, M30, H1 (default), atau H4)
2. Sistem menentukan jumlah candle historis yang akan dimuat berdasarkan timeframe yang dipilih
3. Sistem membaca data harga historis dari database lokal (Yahoo Finance) sesuai timeframe dan jumlah candle yang ditentukan
4. Sistem merender ulang grafik dengan data historis yang baru
Final State
Grafik diperbarui menampilkan data historis sesuai timeframe yang dipilih pengguna

Nomor
10
Modul
Grafik & Analisis
Nama
Market Heatmap
Fungsi
Menampilkan visualisasi heatmap pasar saham yang ditempatkan di bawah grafik indeks
Pre-Condition
Pengguna berada di halaman utama
Cara Penggunaan
	•	Pengguna membuka halaman utama
	•	Pengguna memilih region
	•	Heatmap ditampilkan otomatis di bawah grafik indeks
	•	Jika negara memiliki multi-indeks, heatmap tersedia untuk tiap indeks
Data yang Dipakai
	•	Data performa saham dalam indeks yang sedang aktif (S&P 500 / LQ45 / Nikkei 225 / FTSE 100) dari database lokal (Yahoo Finance)
Validasi
Data heatmap harus tersedia dari sumber data
Initial State
Heatmap untuk indeks yang dipilih belum ditampilkan
Process
1. Sistem membaca data performa saham dalam indeks dari database lokal (Yahoo Finance)
2. Untuk setiap saham, sistem membandingkan harga penutupan (Close) hari ini dengan harga penutupan hari sebelumnya: Persentase Perubahan (%) = ((Harga Hari Ini − Harga Kemarin) / Harga Kemarin) × 100
3. Sistem menentukan warna tiap kotak: hijau jika harga naik, merah jika harga turun; intensitas warna sebanding dengan besar persentase perubahan
4. Ukuran kotak tiap saham dibuat proporsional terhadap nilai kapitalisasi pasar (market cap) saham tersebut
5. Semua kotak disusun dan dirender dalam tampilan heatmap di bawah grafik indeks
Final State
Heatmap untuk indeks yang dipilih ditampilkan ke layar di bawah grafik indeks


Emiten & Saham

Structure Chart


Nomor
11
Modul
Emiten & Saham
Nama
Cari Emiten
Fungsi
Memungkinkan pengguna mencari saham atau emiten tertentu untuk ditampilkan datanya
Pre-Condition
Aplikasi sudah terbuka
Cara Penggunaan
	•	Pengguna menekan tombol atau kolom pencarian emiten
	•	Pengguna mengetikkan nama atau simbol saham yang ingin dicari
	•	Aplikasi menampilkan daftar hasil pencarian yang sesuai
Data yang Dipakai
	•	Kata kunci pencarian (nama atau simbol saham) 
	•	Daftar emiten
Validasi
Kata kunci minimal 1 karakter, emiten yang dipilih harus tersedia di sumber data (investing.com / Yahoo Finance)
Initial State
Belum ada emiten yang dicari atau dipilih pengguna
Process
1. Pengguna mengetikkan nama atau simbol saham (minimal 1 karakter) di kolom pencarian emiten
2. Sistem memfilter daftar emiten yang tersedia dari sumber data (Yahoo Finance / investing.com) secara real-time berdasarkan kata kunci (case-insensitive matching)
3. Hasil pencarian yang cocok ditampilkan sebagai daftar pilihan
Final State
Daftar emiten yang sesuai dengan kata kunci pencarian ditampilkan kepada pengguna

Nomor
12
Modul
Emiten & Saham
Nama
View Emiten
Fungsi
Menampilkan detail emiten, berisi grafik harga dan data fundamental saham tersebut
Pre-Condition
Pengguna menekan salah satu emiten (dari hasil pencarian, heatmap, atau list top emiten)
Cara Penggunaan
	•	Pengguna menekan/mengklik emiten yang ingin dilihat
	•	Aplikasi menampilkan data terkait emiten tersebut
Data yang Dipakai
	•	Simbol / nama emiten
	•	Data harga (grafik) 
	•	Volume
	•	Avg. Volume
	•	Market Cap (intraday)
	•	Beta (5Y Monthly)
	•	PE Ratio (TTM)
	•	EPS (TTM)
Validasi
Data emiten harus tersedia di sumber data
Initial State
Detail data emiten belum ditampilkan
Process
1. Pengguna mengklik emiten yang diinginkan (dari hasil pencarian, heatmap, atau daftar top saham)
2. Sistem membaca data harga historis emiten dari database lokal (Yahoo Finance) (data OHLC dengan timeframe default H1)
3. Sistem membaca data key statistics emiten dari database lokal (Yahoo Finance): Volume, Avg. Volume, Market Cap (intraday), Beta (5Y Monthly), PE Ratio (TTM), EPS (TTM)
4. Sistem merender grafik harga emiten
5. Data fundamental ditampilkan bersama grafik di halaman detail emiten
Final State
Grafik harga dan data fundamental emiten (Volume, Avg. Volume, Market Cap, Beta, PE Ratio, EPS) ditampilkan ke layar

Nomor
13
Modul
Emiten & Saham
Nama
Halaman Daftar Saham & Grafik
Fungsi
Menyediakan halaman dedicated yang menampilkan daftar saham beserta grafik harganya; pengguna dapat mencari saham menggunakan fitur Cari Emiten (#11)
Pre-Condition
Aplikasi sudah terbuka
Cara Penggunaan
	•	Pengguna membuka halaman Daftar Saham & Grafik
	•	Daftar saham ditampilkan beserta grafik harga masing-masing
	•	Pengguna dapat menggunakan fitur Cari Emiten (#11) untuk mencari saham tertentu
	•	Pengguna dapat mengklik saham untuk melihat detailnya menggunakan fitur View Emiten (#12)
Data yang Dipakai
	•	Daftar saham dari indeks yang aktif (S&P 500 / LQ45 / Nikkei 225 / FTSE 100)
	•	Data harga historis tiap saham dari database lokal (Yahoo Finance)
Validasi
	•	Data saham harus tersedia dari sumber data
Initial State
Halaman Daftar Saham & Grafik belum dibuka, pengguna berada di halaman lain
Process
1. Pengguna membuka halaman Daftar Saham & Grafik
2. Sistem membaca daftar saham yang tersedia dari database lokal (Yahoo Finance)
3. Sistem membaca data harga historis masing-masing saham (OHLC: Open, High, Low, Close) dari database lokal (Yahoo Finance) (timeframe default H1)
4. Sistem merender daftar saham beserta grafik harga masing-masing (line chart by default)
Final State
Halaman Daftar Saham & Grafik terbuka menampilkan daftar saham beserta grafik harganya


Comparison

Structure Chart


Nomor
14
Modul
Comparison
Nama
Halaman Comparison
Fungsi
Memungkinkan pengguna membandingkan dua indeks berbeda, dilengkapi informasi statistik tiap indeks, grafik overlay ternormalisasi, tabel top 10 mover (No, Name, MCap), serta market heatmap untuk masing-masing indeks
Pre-Condition
Aplikasi sudah terbuka
Cara Penggunaan
	•	Pengguna membuka halaman Comparison
	•	Pengguna memilih indeks pertama dan indeks kedua yang ingin dibandingkan
	•	Informasi statistik tiap indeks (High, Low, Market Cap, Volume, dll) ditampilkan di bagian atas
	•	Grafik overlay kedua indeks ditampilkan dalam satu canvas
	•	Tabel top 10 mover tiap indeks (kolom: No, Name, MCap) ditampilkan di bawah grafik overlay
	•	Market heatmap untuk masing-masing indeks ditampilkan di bawah tabel top 10 mover
Data yang Dipakai
	•	Daftar empat indeks yang tersedia: S&P 500 (US), LQ45 (ID), Nikkei 225 (JP), FTSE 100 (UK)
	•	Data harga historis kedua indeks yang dipilih dari database lokal (Yahoo Finance)
	•	Statistik tiap indeks: High/Low 52-week, Market Cap, Volume dari database lokal (Yahoo Finance)
	•	Data 10 saham top mover tiap indeks (nama, MCap) dari database lokal (Yahoo Finance)
	•	Data performa saham dalam tiap indeks untuk heatmap dari database lokal (Yahoo Finance)
Validasi
	•	Hanya empat indeks yang dapat dipilih (S&P 500, LQ45, Nikkei 225, FTSE 100)
	•	Kedua indeks yang dipilih tidak boleh sama
Initial State
Halaman Comparison belum dibuka, tidak ada indeks yang dipilih
Process
1. Pengguna membuka halaman Comparison dan memilih dua indeks yang ingin dibandingkan
2. Sistem membaca statistik tiap indeks dari database lokal (Yahoo Finance): High/Low 52-week, Market Cap, Volume, dan indikator kunci lainnya; kemudian menampilkannya di bagian atas halaman
3. Sistem membaca data harga historis kedua indeks dari database lokal (Yahoo Finance) (OHLC, timeframe default H1)
4. Sistem menormalisasi skala harga kedua indeks agar dapat ditampilkan dalam satu grafik overlay menggunakan rumus: Nilai Normalisasi(t) = (Harga(t) / Harga(t_awal)) x 100, sehingga titik awal kedua indeks dimulai dari nilai 100
5. Sistem merender grafik overlay dengan dua garis berbeda warna (satu garis per indeks) dalam satu canvas
6. Sistem membaca data 10 saham dengan pergerakan harga terbesar (top mover) untuk tiap indeks dari database lokal (Yahoo Finance), kemudian merender tabel dengan kolom: No, Name, MCap
7. Untuk masing-masing indeks, sistem membaca data performa saham dari database lokal (Yahoo Finance) dan merender market heatmap: harga tiap saham dibandingkan dengan kemarin, warna hijau jika naik dan merah jika turun, ukuran kotak proporsional terhadap market cap
Final State
Statistik tiap indeks, grafik overlay dua indeks (ternormalisasi), tabel top 10 mover (No, Name, MCap), dan dua market heatmap (satu per indeks) ditampilkan di halaman Comparison

Nomor
15
Modul
Comparison
Nama
Berita per Indeks di Comparison
Fungsi
Menampilkan berita yang berkaitan dengan masing-masing indeks yang sedang dibandingkan di halaman Comparison
Pre-Condition
Pengguna berada di halaman Comparison, dan sudah memilih dua indeks
Cara Penggunaan
	•	Setelah pengguna memilih dua indeks di halaman Comparison
	•	Panel berita untuk masing-masing indeks ditampilkan secara otomatis di samping grafik
Data yang Dipakai
	•	Indeks yang dipilih pengguna (dari S&P 500, LQ45, Nikkei 225, FTSE 100)
	•	Data berita per indeks dari database lokal (investing.com)
Validasi
	•	Data berita untuk indeks yang dipilih harus tersedia dari sumber data
Initial State
Panel berita belum ditampilkan di halaman Comparison
Process
1. Setelah pengguna memilih dua indeks, sistem mengidentifikasi negara/pasar yang terkait dengan masing-masing indeks
2. Sistem membaca data berita yang berkaitan dengan tiap indeks dari database lokal (investing.com)
3. Panel berita untuk masing-masing indeks ditampilkan di samping grafik overlay, menampilkan daftar berita terkini yang relevan
Final State
Panel berita yang relevan untuk masing-masing indeks yang dibandingkan ditampilkan di samping grafik pada halaman Comparison


Manajemen Portofolio

Structure Chart


Nomor
16
Modul
Manajemen Portofolio
Nama
Tampilan Portofolio
Fungsi
Menampilkan daftar seluruh saham yang dimiliki pengguna dari keempat pasar yang didukung (ID/IDR, US/USD, JP/JPY, UK/GBP), beserta total nilai portofolio yang dikonversi ke IDR menggunakan kurs terkini
Pre-Condition
Aplikasi sudah terbuka
Cara Penggunaan
	•	Pengguna membuka halaman Portofolio
	•	Aplikasi menampilkan daftar saham dari semua pasar beserta nilai terkini tiap saham dalam mata uang asalnya
	•	Total nilai portofolio ditampilkan dalam IDR
Data yang Dipakai
	•	Data portofolio (simbol saham, harga beli, jumlah lembar, mata uang asal, tanggal pembelian)
	•	Harga pasar terkini tiap saham dari database lokal (Yahoo Finance)
	•	Kurs mata uang asal (USD/JPY/GBP) terhadap IDR terkini dari database lokal (investing.com)
Validasi
-
Initial State
Daftar saham portofolio belum ditampilkan
Process
1. Sistem membaca seluruh data portofolio dari database lokal
2. Untuk tiap saham, sistem membaca harga pasar terkini dari database lokal (Yahoo Finance)
3. Sistem membaca kurs mata uang asal tiap saham terhadap IDR dari database lokal (investing.com)
4. Sistem menghitung nilai terkini tiap saham dalam IDR: Nilai IDR = Harga Terkini x Jumlah Lembar x Kurs IDR
5. Sistem menjumlahkan seluruh nilai IDR untuk mendapatkan total portofolio
6. Sistem menampilkan daftar saham (nilai dalam mata uang asal dan IDR) beserta total portofolio dalam IDR
Final State
Daftar saham portofolio ditampilkan lengkap dengan nilai tiap aset dalam mata uang asal dan IDR, serta total nilai portofolio dalam IDR

Nomor
17
Modul
Manajemen Portofolio
Nama
Pelacakan Valuasi
Fungsi
Menghitung dan menampilkan keuntungan/kerugian (PnL) portofolio dalam IDR, dengan memisahkan komponen Stock Return (kinerja saham) dan Forex Return (pengaruh pergerakan nilai tukar). Mendukung saham dari empat pasar: ID (IDR), US (USD), JP (JPY), UK (GBP)
Pre-Condition
Pengguna sudah menginput data saham di portofolio
Cara Penggunaan
	•	Pengguna membuka halaman portofolio
	•	Aplikasi menampilkan nilai terkini tiap saham berdasarkan harga pasar saat ini
Data yang Dipakai
	•	Data saham di portofolio: simbol, harga beli, jumlah lembar, mata uang asal, tanggal pembelian
	•	Harga pasar terkini tiap saham dari database lokal (Yahoo Finance)
	•	Kurs mata uang asal saat pembelian terhadap IDR dari database lokal (investing.com)
	•	Kurs mata uang asal terkini terhadap IDR dari database lokal (investing.com)
Validasi
Kurs saat pembelian dan kurs terkini harus tersedia; jika tidak, tampilkan peringatan data kurs tidak lengkap
Initial State
Data portofolio sudah ada, PnL belum dihitung
Process
1. Sistem membaca data portofolio: simbol, harga beli, jumlah lembar, mata uang asal, tanggal pembelian
2. Sistem membaca harga pasar terkini tiap saham dari database lokal (Yahoo Finance)
3. Sistem membaca kurs mata uang asal tiap saham terhadap IDR: kurs saat pembelian dan kurs terkini, dari database lokal (investing.com)
4. Sistem menghitung modal awal dalam IDR: Modal IDR = Harga Beli x Jumlah Lembar x Kurs Saat Beli
5. Sistem menghitung nilai terkini dalam IDR: Nilai IDR = Harga Terkini x Jumlah Lembar x Kurs Terkini
6. Sistem menghitung komponen PnL:
   - Total PnL (IDR) = Nilai IDR Terkini - Modal IDR
   - Stock Return = (Harga Terkini - Harga Beli) x Jumlah Lembar x Kurs Terkini
   - Forex Return = Total PnL - Stock Return
7. Sistem menampilkan ringkasan PnL per saham dan total portofolio: Total PnL, Stock Return, Forex Return (nominal IDR dan persentase)
Final State
PnL (Profit and Loss) portofolio ditampilkan dalam IDR dengan breakdown per saham maupun total:
- Total PnL = perubahan total nilai portofolio dalam IDR
- Stock Return = kontribusi dari kinerja harga saham
- Forex Return = kontribusi dari pergerakan nilai tukar

Nomor
18
Modul
Manajemen Portofolio
Nama
Pencatatan Transaksi Portofolio
Fungsi
Memungkinkan pengguna mencatat pembelian saham dari empat pasar yang didukung (ID/US/JP/UK). Mata uang input ditentukan otomatis berdasarkan pasar asal emiten (ID -> IDR, US -> USD, JP -> JPY, UK -> GBP)
Pre-Condition
Pengguna berada di halaman portofolio
Cara Penggunaan
	•	Pengguna menekan tombol tambah transaksi di halaman portofolio
	•	Pengguna mengisi simbol saham
	•	Sistem mendeteksi pasar asal emiten dan menentukan mata uang input secara otomatis
	•	Pengguna mengisi harga beli (dalam mata uang asal yang terdeteksi), jumlah lembar/lot, dan tanggal pembelian
	•	Pengguna menekan tombol simpan
Data yang Dipakai
	•	Simbol saham (harus terdaftar di salah satu dari empat indeks yang didukung)
	•	Harga beli dalam mata uang asal emiten (IDR / USD / JPY / GBP)
	•	Mata uang asal emiten (ditentukan otomatis dari pasar listing: LQ45→IDR, S&P 500→USD, Nikkei 225→JPY, FTSE 100→GBP)
	•	Jumlah lembar/lot
	•	Tanggal pembelian (format dd/mm/yyyy)
Validasi
	•	Simbol saham harus valid dan terdaftar di salah satu indeks yang didukung (S&P 500, LQ45, Nikkei 225, FTSE 100)
	•	Harga beli harus bernilai positif
	•	Jumlah lembar/lot harus bernilai positif
	•	Tanggal pembelian tidak boleh melebihi hari ini
Initial State
Form pencatatan transaksi kosong
Process
1. Pengguna menekan tombol tambah transaksi dan mengisi simbol saham
2. Sistem mendeteksi pasar asal emiten dan menentukan mata uang input (IDR/USD/JPY/GBP) secara otomatis
3. Pengguna melengkapi form: harga beli, jumlah lembar/lot, tanggal pembelian
4. Sistem memvalidasi seluruh input
5. Sistem menyimpan data transaksi ke database lokal beserta informasi mata uang asal
Final State
Data transaksi (simbol, harga beli, mata uang asal, jumlah lembar, tanggal) tersimpan di portofolio

Nomor
19
Modul
Manajemen Portofolio
Nama
View Detail Data Portofolio
Fungsi
Menampilkan detail transaksi dari saham yang dipilih pengguna di dalam portofolio
Pre-Condition
Pengguna memiliki data saham di portofolio
Cara Penggunaan
	•	Pengguna mengklik data saham di daftar portofolio
	•	Aplikasi menampilkan detail transaksi saham tersebut
Data yang Dipakai
	•	Simbol saham
	•	Harga beli dalam mata uang asal emiten
	•	Mata uang asal emiten
	•	Jumlah lembar/lot
	•	Tanggal pembelian
	•	Harga pasar terkini dan kurs terkini (untuk menampilkan PnL dalam IDR)
Validasi
-
Initial State
Detail transaksi saham yang dipilih belum ditampilkan, pengguna melihat daftar portofolio
Process
	•	Pengguna mengklik data saham di daftar portofolio
2. Sistem membaca detail transaksi saham tersebut dari penyimpanan lokal (SQLite)
3. Sistem menampilkan detail transaksi: simbol saham, harga beli, jumlah lembar/lot, dan tanggal pembelian
Final State
Detail transaksi saham ditampilkan beserta PnL terkini dalam IDR (Total PnL, Stock Return, Forex Return)

Nomor
20
Modul
Manajemen Portofolio
Nama
Edit Data Portofolio
Fungsi
Memungkinkan pengguna mengubah jumlah lembar/lot dan harga beli dari data saham yang ada di portofolio
Pre-Condition
Pengguna sedang melihat detail data saham di portofolio
Cara Penggunaan
	•	Pengguna memilih opsi edit pada detail saham
	•	Pengguna mengubah jumlah lembar/lot dan/atau harga beli
	•	Pengguna menekan tombol simpan
Data yang Dipakai
	•	Harga beli dalam mata uang asal emiten (dapat diedit)
	•	Jumlah lembar/lot (dapat diedit)
Validasi
	•	Harga beli dan jumlah yang diedit harus bernilai positif
Initial State
Data transaksi saham di portofolio masih menyimpan nilai lama (jumlah/harga beli yang belum diperbarui)
Process
1. Pengguna memilih opsi edit pada halaman detail saham
2. Form edit ditampilkan dengan nilai jumlah lembar/lot dan harga beli yang sudah terisi dari data sebelumnya
3. Pengguna mengubah nilai yang diinginkan
4. Sistem memvalidasi input: jumlah lembar/lot dan harga beli baru harus bernilai positif
5. Sistem memperbarui data transaksi di penyimpanan lokal (SQLite)
6. Sistem mensinkronisasi perubahan ke cloud
Final State
Data transaksi saham berhasil diperbarui di penyimpanan lokal dan cloud, tampilan portofolio di refresh dengan nilai terbaru

Nomor
21
Modul
Manajemen Portofolio
Nama
Hapus Data Portofolio
Fungsi
Memungkinkan pengguna menghapus data saham dari portofolio
Pre-Condition
Pengguna sedang melihat detail data saham di portofolio
Cara Penggunaan
	•	Pengguna memilih opsi hapus pada detail saham
	•	Pengguna mengkonfirmasi penghapusan
Data yang Dipakai
	•	Simbol saham yang akan dihapus
Validasi
-
Initial State
Data saham yang ingin dihapus masih ada di daftar portofolio
Process
1. Pengguna memilih opsi hapus pada halaman detail saham
2. Sistem menampilkan konfirmasi penghapusan kepada pengguna
3. Pengguna mengkonfirmasi penghapusan
4. Sistem menghapus data transaksi dari penyimpanan lokal (SQLite)
5. Sistem menyinkronisasi penghapusan ke cloud
Final State
Data saham berhasil dihapus dari penyimpanan lokal dan cloud, daftar portofolio diperbarui tanpa saham tersebut

Nomor
22
Modul
Manajemen Portofolio
Nama
Ekspor Portofolio
Fungsi
Memungkinkan pengguna mengekspor seluruh data portofolio (saham dari semua pasar yang didukung) ke file eksternal untuk keperluan backup
Pre-Condition
Pengguna berada di halaman portofolio dan memiliki data portofolio
Cara Penggunaan
	•	Pengguna menekan tombol ekspor di halaman portofolio
	•	Sistem menghasilkan file ekspor berisi seluruh data portofolio dari semua pasar
	•	File disimpan ke lokasi yang dipilih pengguna
Data yang Dipakai
	•	Data portofolio: simbol saham, harga beli, mata uang asal, jumlah lembar, tanggal pembelian
	•	Informasi pasar asal tiap saham (ID/US/JP/UK)
Validasi
	•	Data portofolio tidak boleh kosong saat melakukan ekspor
Initial State
Data portofolio masih tersimpan di dalam aplikasi, belum diekspor ke file eksternal
Process
	•	Pengguna menekan tombol ekspor di halaman portofolio
2. Sistem membaca seluruh data portofolio dari database lokal
3. Sistem mengonversi data ke format CSV atau JSON, menyertakan kolom mata uang asal dan pasar
4. File disimpan ke lokasi yang ditentukan pengguna
Final State
Data portofolio berhasil diekspor ke file eksternal yang dapat dibuka atau diimpor kembali ke aplikasi

Nomor
23
Modul
Manajemen Portofolio
Nama
Impor Portofolio
Fungsi
Memungkinkan pengguna mengimpor data portofolio dari file eksternal (hasil ekspor sebelumnya) ke dalam aplikasi
Pre-Condition
Pengguna berada di halaman portofolio dan memiliki file portofolio yang valid untuk diimpor
Cara Penggunaan
	•	Pengguna menekan tombol impor di halaman portofolio
	•	Pengguna memilih file portofolio yang ingin diimpor (CSV atau JSON)
	•	Sistem memvalidasi format dan isi file
	•	Data yang valid diimpor dan ditambahkan ke portofolio
	•	Sistem menampilkan ringkasan hasil impor (jumlah data berhasil/gagal)
Data yang Dipakai
	•	File portofolio csv
Validasi
	•	Format file harus sesuai (CSV atau JSON hasil ekspor MAPRO)
	•	Setiap data harus memiliki field lengkap: simbol, harga beli, mata uang asal, jumlah lembar, tanggal
	•	Mata uang asal harus salah satu dari: IDR, USD, JPY, GBP
	•	Harga beli dan jumlah lembar harus bernilai positif; tanggal tidak boleh melebihi hari ini
Initial State
Data portofolio dari file eksternal belum dimasukkan ke dalam aplikasi
Process
	•	Pengguna menekan tombol impor dan memilih file dari perangkat
	•	Sistem membaca dan memvalidasi format file (CSV atau JSON)
	•	Sistem memvalidasi tiap baris: simbol harus valid di indeks yang didukung, mata uang asal harus IDR/USD/JPY/GBP, nilai numerik positif, tanggal valid
	•	Sistem menambahkan data yang lolos validasi ke database lokal portofolio
	•	Sistem menampilkan ringkasan hasil impor: jumlah data berhasil dan gagal beserta alasannya
Final State
Data dari file eksternal berhasil ditambahkan ke portofolio; ringkasan hasil impor ditampilkan


Pengaturan

Structure Chart


Nomor
24
Modul
Pengaturan
Nama
Pilih Tema Visual
Fungsi
Memungkinkan pengguna memilih tema tampilan aplikasi
Pre-Condition
Pengguna berada di halaman Profil & Pengaturan
Cara Penggunaan
	•	Pengguna memilih tema yang diinginkan (light / dark / automatic)
	•	Pilihan tema langsung diterapkan
Data yang Dipakai
	•	Tema visual (light / dark / automatic)
Validasi
-
Initial State
Tema yang aktif adalah tema sebelumnya (tema default atau tema yang terakhir dipilih)
Process
	•	Pengguna memilih tema yang diinginkan dari opsi yang tersedia: light, dark, atau automatic 
	•	Sistem menyimpan preferensi tema ke database SQLite
	•	Sistem menerapkan tema ke seluruh komponen antarmuka (palet warna, ikon, dan gaya tampilan diperbarui)
	•	Jika pilihan "automatic", tema mengikuti pengaturan tema sistem operasi perangkat pengguna secara otomatis
Final State
Tema visual yang dipilih langsung diterapkan di seluruh tampilan aplikasi dan preferensi tersimpan untuk sesi berikutnya


