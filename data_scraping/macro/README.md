# Macro Data Scraper

Scraper untuk mengambil data peristiwa makroekonomi dari [Investing.com](https://www.investing.com/economic-calendar/).

## Apa Itu Scraper Ini?

Scraper adalah program yang secara otomatis mengambil data dari website Investing.com. Data yang diambil meliputi:

- **Nama peristiwa** (misal: "ISM Non-Manufacturing Prices")
- **Waktu occurrence** (misal: "21:00")
- **Tingkat impact** (high/medium/low - penting atau tidak)
- **Nilai actual** (data aktual yang dirilis)
- **Nilai forecast** (estimasi/catatan konsensus)
- **Nilai previous** (data dari periode sebelumnya)

Data macro ekonomi ini digunakan untuk analisis fundamental dalam trading.

## Negara yang Ditargetkan

| Kode | Negara | Mata Uang |
|------|--------|-----------|
| US | United States | USD |
| ID | Indonesia | IDR |
| JP | Japan | JPY |
| DE | Germany | EUR |

## Cara Penggunaan

### Prerequisites

```bash
pip install playwright
playwright install chromium
```

### Menjalankan Scraper

```bash
cd /home/reiyo/Project/PBL1/pbl1-main_application/data_scraping
python -m macro.scraper
```

Scraper akan:
1. Membuka browser Chromium
2. Login ke Investing.com menggunakan cookies
3. Mengatur filter tanggal
4. Mengambil semua data peristiwa ekonomi
5. Menyimpan hasil ke file JSON

### Menggunakan Sebagai Module (untuk programmer)

```python
from macro import scrape_calendar

events = scrape_calendar("04/07/2026", "04/07/2026", ["US", "ID", "JP", "DE"])
```

## Format Output

File JSON di `../data/macro/`:

### `us_macro.json` (Contoh)

```json
{
  "country": "US",
  "name": "United States",
  "currency": "USD",
  "scraped_at": "2026-04-12 16:59:49",
  "event_count": 12,
  "events": [
    {
      "name": "Durable Goods Orders (MoM) (Feb)",
      "date": "04/07/2026",
      "time": "19:30",
      "impact": "high",
      "actual": "-1.4%",
      "forecast": "-1.1%",
      "previous": "-0.5%"
    }
  ]
}
```

### File yang Dihasilkan

| File | Deskripsi |
|------|----------|
| `us_macro.json` | Data peristiwa ekonomi US |
| `id_macro.json` | Data peristiwa ekonomi Indonesia |
| `jp_macro.json` | Data peristiwa ekonomi Jepang |
| `de_macro.json` | Data peristiwa ekonomi Jerman |
| `_summary.json` | Ringkasan jumlah peristiwa per negara |

## Penjelasan Field Data

| Field | Contoh | Deskripsi |
|-------|--------|-----------|
| `name` | "Durable Goods Orders (MoM) (Feb)" | Nama peristiwa ekonomi |
| `date` | "04/07/2026" | Tanggal peristiwa (MM/DD/YYYY) |
| `time` | "19:30" | Waktu rilis (timezone website) |
| `impact` | "high" | High/Medium/Low - seberapa penting |
| `actual` | "-1.4%" | Nilai aktual yang dirilis |
| `forecast` | "-1.1%" | Estimasi konsensus pasar |
| `previous` | "-0.5%" | Nilai dari periode sebelumnya |

### Tentang Impact Level

- **High** ⭐⭐⭐: Peristiwa sangat penting, bisa menggerakkan market signifikan
- **Medium** ⭐⭐: Peristiwa moderat, dampak terbatas pada mata uang terkait
- **Low** ⭐: Peristiwa kurang signifikan, dampak minimal

## Cookie Authentication

Investing.com membutuhkan authentication agar bisa mengakses data penuh. Scraper menggunakan sistem cookies yang sudah tersimpan.

**Jika cookies expired:**
1. Buka browser (Chrome/Firefox)
2. Login ke [investing.com/economic-calendar](https://www.investing.com/economic-calendar/)
3. Install extension "EditThisCookie"
4. Export cookies dalam format Netscape
5. Ganti isi file `cookies.txt` dengan hasil export

**Catatan:** Cookies harus di-refresh secara berkala karena akan expire.

## Diagram Alur Kerja

```
┌─────────────────────────────────────────────────────────┐
│                    MULAI SCRAPER                        │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 1. LOAD COOKIES                                         │
│    Baca cookies dari cookies.txt                        │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 2. LAUNCH BROWSER                                       │
│    Buka Chromium dengan cookies (tersimpan login)       │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 3. NAVIGASI KE WEBSITE                                  │
│    Buka investing.com/economic-calendar                 │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 4. SET FILTER                                           │
│    - Klik "Show Filters"                                │
│    - Klik "Custom dates"                                │
│    - Isi tanggal mulai & selesai                        │
│    - Klik "Apply"                                       │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 5. PARSE DATA                                           │
│    Untuk setiap baris tabel:                            │
│    - Ambil nama peristiwa                               │
│    - Ambil waktu                                        │
│    - Hitung impact (stars)                              │
│    - Ambil actual/forecast/previous                     │
│    - Filter berdasarkan negara (US/ID/JP/DE)            │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 6. SIMPAN HASIL                                         │
│    Export ke JSON files: us_macro.json, dll.            │
└─────────────────────────────────────────────────────────┘
```

## Struktur HTML (Untuk Developer)

Bagian ini menjelaskan struktur HTML website untuk keperluan maintenance.

### Row ID Format

Setiap baris peristiwa memiliki ID dengan format:

```
{event_id}-{internal_number}-{CountryName}-{row_num}
```

Contoh: `1049-544268-UnitedStates-23`

### Nama Negara di HTML

Spasi dihilangkan dalam ID:

| Negara | Di HTML |
|--------|---------|
| United States | `UnitedStates` |
| United Kingdom | `UnitedKingdom` |
| Indonesia | `Indonesia` |
| Japan | `Japan` |
| Germany | `Germany` |

### Kolom Tabel

| Index | Konten |
|-------|--------|
| TD[5] | Nilai Actual |
| TD[6] | Nilai Forecast |
| TD[7] | Nilai Previous |

### Impact Stars

Impact ditentukan oleh jumlah star yang terisi:
- 2-3 star terisi = High
- 1 star terisi = Medium
- 0 star terisi = Low

## Troubleshooting

### Scraper mengembalikan 0 events

1. **Cek cookies** - mungkin expired, perlu refresh
2. **Cek tanggal** - pastikan format MM/DD/YYYY
3. **Cek network** - koneksi internet stable?

### Error "Could not open filters panel"

1. Kemungkinan website berubah struktur
2. Cek apakah masih bisa手动 click "Show Filters"
3. Update selector di code jika perlu

### File JSON kosong

Kemungkinan tidak ada peristiwa ekonomi di tanggal yang dipilih. Coba tanggal lain.

## Dependencies

- Python 3.14+
- playwright
- chromium browser

## Lisensi

Project internal - PBL1 Main Application
