# Analisis Metodologi Pengujian Backend MAPRO

## Ringkasan

| Aspek | Keterangan |
|---|---|
| **Pendekatan** | **Whitebox / Graybox — dominan whitebox** |
| **Tipe** | Unit & Integration Testing |
| **File scope** | 3 file test: `test_scraper_engine.py`, `test_caching_ttl.py`, `test_ipc_commands.py` |
| **Total test** | 75 (73 passing + 2 network-skipped) |
| **Mocking** | Semua dependensi eksternal (yfinance, feedparser, Playwright, requests) di-mock agar tidak bergantung koneksi internet. Kecuali 2 test network-marked (SCR-008, SCR-038) untuk validasi skenario real. |
| **Framework** | pytest 9.x + unittest.mock |

---

## Mengapa Bukan Blackbox Murni?

Blackbox testing menguji sistem melalui *external interface* tanpa mengetahui implementasi internal — idealnya melalui UI (Electron) atau HTTP API. Sementara test yang diimplementasikan di sini mengakses kode internal secara langsung.

### Perincian per Modul

| Modul | Akses ke Kode Internal? | Kategorisasi |
|---|---|---|
| **test_scraper_engine.py** | ✅ Ya — mengimpor dan memanggil langsung fungsi seperti `scrape_15m()`, `extract_info()`, `parse_feed()` dari modul source. Semua dependensi eksternal di-mock. | **Whitebox** |
| **test_caching_ttl.py** | ✅ Ya — memanggil `CacheDatabase().cache_set/get()`, `BaseScraper.is_cache_fresh()` langsung. Mengetahui struktur class dan method internal. | **Whitebox** |
| **test_ipc_commands.py** | ⚠️ Sebagian — mengirim JSON via stdin/stdout (external interface), tapi tetap menggunakan subprocess `ipc_main.py` langsung tanpa layer frontend. | **Graybox** |

---

## Analisis Detail

### 1. `test_scraper_engine.py` — Whitebox

Mengapa whitebox:
- Mengimpor fungsi internal dari modul source (`scrape_15m`, `extract_info`, `parse_feed`, dll.)
- Memanggil fungsi secara langsung, bukan melalui interface eksternal
- Mengetahui struktur data internal (key names, tipe data, klasifikasi kategori)
- Dependency injection dengan monkeypatch untuk mock yfinance, feedparser, Playwright

Contoh kode:
```python
from ohlcv_scraper import scrape_15m, safe_float

def test_scr_001(self, mock_yfinance):
    result = scrape_15m("AAPL")  # panggil langsung fungsi internal
    assert len(result) > 0
    assert "timestamp" in result[0]
```

### 2. `test_caching_ttl.py` — Whitebox

Mengapa whitebox:
- Memanggil method `CacheDatabase` dan `BaseScraper.is_cache_fresh()` secara langsung
- Mengetahui skema tabel SQLite (`cache.key`, `cache.data`, `cache.updated_at`)
- Manipulasi internal state untuk test TTL (set `updated_at` ke masa lalu/masa depan)
- Memanfaatkan fixture `tmp_cache_db` yang mengarahkan path DB internal

Contoh kode:
```python
from backend.src.db.cache_database import CacheDatabase

def test_cac_001(self, tmp_cache_db):
    db = CacheDatabase()
    db.cache_set("test:key", {"data": 123})
    result = db.cache_get("test:key")
    assert result["data"] == 123
```

### 3. `test_ipc_commands.py` — Graybox

Mengapa graybox (bukan whitebox penuh):
- Komunikasi melalui stdin/stdout JSON — ini external interface
- Tidak memanggil `handle_command()` langsung, tapi melalui subprocess
- **Tapi** tetap menjalankan `ipc_main.py` sebagai subprocess langsung, bukan melalui Electron
- Mock tetap digunakan untuk cache dan scraping

Yang diperlukan untuk menjadikannya blackbox murni:
- Test harus melalui frontend Electron (ipcRenderer.invoke)
- Menggunakan Playwright atau Selenium untuk automation UI
- Tidak ada mock pada layer Python

---

## Kesimpulan

| Kriteria | Kondisi Saat Ini | Blackbox Murni |
|---|---|---|
| Mengakses kode internal | ✅ Ya (explicit import) | ❌ Tidak |
| Mock dependensi eksternal | ✅ Ya | ❌ Tidak (pakai real network) |
| Test via UI (Electron) | ❌ Tidak | ✅ Ya |
| Test via IPC pipe | ✅ Ya (stdin/stdout) | ✅ Ya |
| Mengetahui skema DB | ✅ Ya | ❌ Tidak |

**Verdik: Whitebox/Graybox — bukan blackbox testing.**

Untuk mencapai blackbox murni, perlu:
1. Test automation via Electron (Playwright)
2. Tanpa mocking — koneksi real ke Yahoo Finance, Google News, Investing.com
3. Validasi melalui UI, bukan melalui fungsi internal

---

> **Dibuat:** 2026-05-18
> **File terkait:** `tests/backend/test_scraper_engine.py`, `tests/backend/test_caching_ttl.py`, `tests/backend/test_ipc_commands.py`, `tests/backend/TEST_RESULTS.md`
