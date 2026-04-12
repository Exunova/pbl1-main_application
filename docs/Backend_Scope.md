Menjawab pertanyaan: **"Ini scope backend nya ngapain?"**

Secara sederhana, ruang lingkup (*scope*) kerja backend di aplikasi MAPRO adalah sebagai "mesin di balik layar" yang bertugas melakukan 5 hal utama:

1. **Pengumpul Data Otomatis (Data Fetcher & Scraper):** Bertugas berkeliling internet (seperti ke Yahoo Finance, portal berita, dan situs finansial) untuk mengambil data harga saham, nilai tukar mata uang, berita makroekonomi, dan kalender ekonometrik. Pengambilan ini diatur agar berjalan otomatis secara berkala (ada yang tiap aplikasi buka, tiap beberapa jam, atau harian).

2. **Pengelola Ruang Penyimpanan Lokal:** Menyimpan semua data yang sudah ditarik dari internet ke dalam "brankas" database di komputer pengguna secara lokal. Tujuannya supaya aplikasi terasa sangat cepat saat pengguna berpindah-pindah menu atau melihat grafik, karena tidak harus menunggu internet terus-menerus.

3. **Mesin Pengolah & Kalkulator Portofolio:** Menangani semua proses perhitungan "di belakang kasir". Ketika pengguna mencatat pembelian saham, backend bertugas menyimpan data tersebut, menghitung total valuasi terkini, persentase untung/rugi (di mana backend otomatis menghitung selisih harga saham sekaligus perbedaan kurs mata uang yang berubah-ubah), dan merapikan datanya.

4. **Pengatur Sinkronisasi & Backup File:** Menangani proses mengubah seluruh data portofolio pengguna menjadi sebuah file utuh untuk diunduh sebagai cadangan (ekspor/backup), serta menyedut kembali data dari file tersebut jika pengguna ingin memasukkannya kembali (impor/restore).

5. **Pelayan Data ke Tampilan Depan (Antarmuka):** Menjadi jembatan yang bertugas melayani permintaan layar antarmuka. Misalnya, saat peta dunia berubah warna, atau saat pengguna mengubah pilihan kalender ekonomi negara tertentu, backend-lah yang langsung mencari dan mengirimkan potong data yang pas ke layar agar bisa memanjakan mata penggunanya.

Singkatnya: Backend ngurusin ambil data dari luar, nyimpen dengan rapi di laptop pengguna, nge-hitung-hitung untung ruginya portofolio, dan siapin datanya supaya bisa dipajang cantik di layar depan.
