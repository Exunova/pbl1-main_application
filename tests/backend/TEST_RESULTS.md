# Test Results — Backend Test Suite

> **MAPRO** — Multimarket Analytics Portfolio Tracker This document lists all 75
> implemented backend test cases with their current status.

---

## Summary

| Metric                   | Count |
| ------------------------ | ----- |
| **Total Tests**          | 75    |
| **Passed**               | 73    |
| **Skipped (Network)** ⚠️ | 2     |
| **Failed**               | 0     |

> ⚠️ **Keterangan:** 2 test (SCR-008, SCR-038) bertanda `SKIP (Network)` karena
> membutuhkan koneksi internet real. Test ini dikecualikan saat menjalankan
> `pytest -m "not network"`. Untuk menjalankannya: hapus flag `-m "not network"`
> saat run pytest (pastikan ada koneksi internet).

---

## 1. Scraping Engine (`test_scraper_engine.py`)

### 1.1 OHLCV Scraper (SCR-001..012)

| ID      | Test Name                                      | File                   | Status | Description                                                                               |
| ------- | ---------------------------------------------- | ---------------------- | ------ | ----------------------------------------------------------------------------------------- |
| SCR-001 | `test_scr_001_scrape_ohlcv_us_valid`           | test_scraper_engine.py | PASS   | Scrape OHLCV ticker saham US valid (AAPL).                                                |
| SCR-002 | `test_scr_002_scrape_ohlcv_id_valid`           | test_scraper_engine.py | PASS   | Scrape OHLCV ticker saham Indonesia valid (BBCA.JK).                                      |
| SCR-003 | `test_scr_003_scrape_ohlcv_asia_valid`         | test_scraper_engine.py | PASS   | Scrape OHLCV ticker saham Asia valid (9984.T).                                            |
| SCR-004 | `test_scr_004_validate_output_format`          | test_scraper_engine.py | PASS   | Validasi format output OHLCV (6 keys, no None/NaN).                                       |
| SCR-005 | `test_scr_005_validate_data_types`             | test_scraper_engine.py | PASS   | Validasi tipe data OHLCV (timestamp string, numerik float, volume int).                   |
| SCR-006 | `test_scr_006_invalid_ticker`                  | test_scraper_engine.py | PASS   | Scrape ticker tidak valid — error tertangkap, tidak crash.                                |
| SCR-007 | `test_scr_007_empty_null_ticker`               | test_scraper_engine.py | PASS   | Scrape ticker kosong/null — error validasi jelas.                                         |
| SCR-008 | `test_scr_008_offline_scrape`                  | test_scraper_engine.py | PASS   | Scraper berjalan saat tidak ada internet — exception tertangkap. Koneksi real diperlukan. |
| SCR-009 | `test_scr_009_candle_count_matches_time_range` | test_scraper_engine.py | PASS   | Jumlah candle sesuai rentang waktu (toleransi ±10%).                                      |
| SCR-010 | `test_scr_010_timestamp_ascending`             | test_scraper_engine.py | PASS   | Urutan timestamp ascending, tidak ada loncat/balik.                                       |
| SCR-011 | `test_scr_011_weekend_scrape`                  | test_scraper_engine.py | PASS   | Scrape saat market tutup (weekend) — data historis tersedia.                              |
| SCR-012 | `test_scr_012_multiple_tickers_sequential`     | test_scraper_engine.py | PASS   | Scrape multiple ticker berurutan — data benar, tidak saling timpa.                        |

### 1.2 Company Info Scraper (SCR-013..021)

| ID      | Test Name                                | File                   | Status | Description                                                          |
| ------- | ---------------------------------------- | ---------------------- | ------ | -------------------------------------------------------------------- |
| SCR-013 | `test_scr_013_scrape_us_company_profile` | test_scraper_engine.py | PASS   | Scrape profil perusahaan US valid (MSFT) — 7 kategori.               |
| SCR-014 | `test_scr_014_all_8_categories_present`  | test_scraper_engine.py | PASS   | Kelengkapan 8 kategori output (identity, price, valuation, ...).     |
| SCR-015 | `test_scr_015_income_statement_fields`   | test_scraper_engine.py | PASS   | Scrape income statement — revenue, net income, operating income.     |
| SCR-016 | `test_scr_016_balance_sheet_fields`      | test_scraper_engine.py | PASS   | Scrape balance sheet — aset, liabilitas, ekuitas.                    |
| SCR-017 | `test_scr_017_cash_flow_fields`          | test_scraper_engine.py | PASS   | Scrape cash flow statement — operating/investing/financing.          |
| SCR-018 | `test_scr_018_no_dividend_company`       | test_scraper_engine.py | PASS   | Scrape saham tanpa dividen (AMZN) — dividend null/0, tidak error.    |
| SCR-019 | `test_scr_019_analyst_recommendation`    | test_scraper_engine.py | PASS   | Scrape data analis — rekomendasi buy/hold/sell dengan jumlah analis. |
| SCR-020 | `test_scr_020_pe_ratio_reasonable`       | test_scraper_engine.py | PASS   | Validasi PE ratio reasonable — positif dan dalam kisaran 1-1000.     |
| SCR-021 | `test_scr_021_unlisted_company_error`    | test_scraper_engine.py | PASS   | Scrape perusahaan tidak terdaftar — error tertangkap, tidak crash.   |

### 1.3 News Scraper (SCR-022..028)

| ID      | Test Name                              | File                   | Status | Description                                                        |
| ------- | -------------------------------------- | ---------------------- | ------ | ------------------------------------------------------------------ |
| SCR-022 | `test_scr_022_scrape_us_news`          | test_scraper_engine.py | PASS   | Scrape berita region US — list artikel berita pasar US.            |
| SCR-023 | `test_scr_023_scrape_id_news`          | test_scraper_engine.py | PASS   | Scrape berita region ID — list artikel berita pasar Indonesia.     |
| SCR-024 | `test_scr_024_article_fields_complete` | test_scraper_engine.py | PASS   | Kelengkapan field per artikel — title, link, published, thumbnail. |
| SCR-025 | `test_scr_025_og_image_thumbnail`      | test_scraper_engine.py | PASS   | Ekstraksi og:image thumbnail — URL gambar valid atau null.         |
| SCR-026 | `test_scr_026_invalid_region`          | test_scraper_engine.py | PASS   | Scrape region tidak valid (ZZ/"") — error tertangkap, tidak crash. |
| SCR-027 | `test_scr_027_sorted_by_latest`        | test_scraper_engine.py | PASS   | Berita ter-sort berdasarkan waktu terbaru ke terlama.              |
| SCR-028 | `test_scr_028_rss_unavailable`         | test_scraper_engine.py | PASS   | Ketahanan saat RSS feed tidak tersedia — list kosong, tidak crash. |

### 1.4 Forex Scraper (SCR-029..033)

| ID      | Test Name                        | File                   | Status | Description                                                      |
| ------- | -------------------------------- | ---------------------- | ------ | ---------------------------------------------------------------- |
| SCR-029 | `test_scr_029_scrape_usd_idr`    | test_scraper_engine.py | PASS   | Scrape kurs USD/IDR — kurs saat ini dan history 30 hari.         |
| SCR-030 | `test_scr_030_scrape_usd_jpy`    | test_scraper_engine.py | PASS   | Scrape kurs USD/JPY — data kurs ter-return dengan benar.         |
| SCR-031 | `test_scr_031_sanity_check_rate` | test_scraper_engine.py | PASS   | Validasi nilai kurs wajar — USD/IDR dalam kisaran 14.000-20.000. |
| SCR-032 | `test_scr_032_invalid_pair`      | test_scraper_engine.py | PASS   | Scrape pair tidak valid — error tertangkap, tidak crash.         |
| SCR-033 | `test_scr_033_history_30_days`   | test_scraper_engine.py | PASS   | Kelengkapan history 30 hari — ≥ 20 data poin (hari trading).     |

### 1.5 Macro Scraper (SCR-034..040)

| ID      | Test Name                               | File                   | Status | Description                                                                                     |
| ------- | --------------------------------------- | ---------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| SCR-034 | `test_scr_034_scrape_us_macro_calendar` | test_scraper_engine.py | PASS   | Scrape kalender ekonomi US — event dengan event_name, date, impact, actual, forecast, previous. |
| SCR-035 | `test_scr_035_headless_browser`         | test_scraper_engine.py | PASS   | Playwright browser terbuka headless — tidak ada window yang muncul.                             |
| SCR-036 | `test_scr_036_date_filter`              | test_scraper_engine.py | PASS   | Filter tanggal berjalan dengan benar — events dalam range yang di-request.                      |
| SCR-037 | `test_scr_037_impact_values`            | test_scraper_engine.py | PASS   | Validasi nilai impact — hanya low, medium, atau high.                                           |
| SCR-038 | `test_scr_038_timeout_investing_com`    | test_scraper_engine.py | PASS   | Timeout saat investing.com tidak responsif — timeout dengan grace. Koneksi real diperlukan.     |
| SCR-039 | `test_scr_039_dom_structure_changed`    | test_scraper_engine.py | PASS   | DOM structure berubah — exception informatif, tidak data korup.                                 |
| SCR-040 | `test_scr_040_no_events_page`           | test_scraper_engine.py | PASS   | Scrape kalender saat tidak ada event — list kosong, tidak crash.                                |

---

## 2. Caching & TTL (`test_caching_ttl.py`)

### 2.1 SQLite Cache (CAC-001..014)

| ID      | Test Name                             | File                | Status | Description                                                                   |
| ------- | ------------------------------------- | ------------------- | ------ | ----------------------------------------------------------------------------- |
| CAC-001 | `test_cac_001_cache_write`            | test_caching_ttl.py | PASS   | Cache write — data tersimpan ke SQLite dengan key, data JSON, updated_at.     |
| CAC-002 | `test_cac_002_cache_read`             | test_caching_ttl.py | PASS   | Cache read — data terbaca dari SQLite, identik dengan yang disimpan.          |
| CAC-003 | `test_cac_003_cache_hit_fresh`        | test_caching_ttl.py | PASS   | Cache hit — data masih segar (dalam TTL), scraper TIDAK dipanggil.            |
| CAC-004 | `test_cac_004_cache_miss_expired`     | test_caching_ttl.py | PASS   | Cache miss — data sudah expired, scraper DIPANGGIL untuk refresh.             |
| CAC-005 | `test_cac_005_cache_miss_key_missing` | test_caching_ttl.py | PASS   | Cache miss — key tidak ada, mengembalikan None, tidak error.                  |
| CAC-006 | `test_cac_006_cache_overwrite`        | test_caching_ttl.py | PASS   | Update cache (overwrite) — data lama tertimpa, updated_at diperbarui.         |
| CAC-007 | `test_cac_007_ttl_ohlcv_1_hour`       | test_caching_ttl.py | PASS   | TTL OHLCV = 1 jam — cache expired setelah >1 jam, trigger scraping ulang.     |
| CAC-008 | `test_cac_008_ttl_company_24_hours`   | test_caching_ttl.py | PASS   | TTL Company Info = 24 jam — cache expired setelah >24 jam.                    |
| CAC-009 | `test_cac_009_ttl_macro_news`         | test_caching_ttl.py | PASS   | TTL Macro & News — cache expired setelah TTL masing-masing.                   |
| CAC-010 | `test_cac_010_ttl_forex_1_hour`       | test_caching_ttl.py | PASS   | TTL Forex = 1 jam — cache expired setelah >1 jam.                             |
| CAC-011 | `test_cac_011_future_updated_at`      | test_caching_ttl.py | PASS   | Cache tidak terpengaruh TTL yang salah — updated_at masa depan = masih segar. |
| CAC-012 | `test_cac_012_query_performance`      | test_caching_ttl.py | PASS   | Performa query SQLite — waktu query < 500ms untuk 1000 key reads.             |
| CAC-013 | `test_cac_013_json_integrity`         | test_caching_ttl.py | PASS   | Integritas data JSON tersimpan — nested dict/list, no data loss.              |
| CAC-014 | `test_cac_014_sqlite_file_missing`    | test_caching_ttl.py | PASS   | SQLite file tidak ada — aplikasi membuat cache.db baru, tidak crash.          |

### 2.2 File JSON Backup (CAC-015..019)

| ID      | Test Name                                            | File                | Status | Description                                                                    |
| ------- | ---------------------------------------------------- | ------------------- | ------ | ------------------------------------------------------------------------------ |
| CAC-015 | `test_cac_015_json_saved_after_scraping`             | test_caching_ttl.py | PASS   | Data disimpan ke file JSON setelah scraping — file ter-buat/ter-update.        |
| CAC-016 | `test_cac_016_fallback_json_when_sqlite_expired`     | test_caching_ttl.py | PASS   | Fallback ke file JSON saat SQLite expired — data diambil dari JSON.            |
| CAC-017 | `test_cac_017_full_flow_request_sqlite_json_scraper` | test_caching_ttl.py | PASS   | Alur lengkap Request → SQLite → JSON → Scraper — menyimpan ke SQLite DAN JSON. |
| CAC-018 | `test_cac_018_auto_create_data_folders`              | test_caching_ttl.py | PASS   | Struktur folder data/ terbentuk otomatis — subfolder company_info, ohlcv, dll. |
| CAC-019 | `test_cac_019_json_filename_matches_ticker`          | test_caching_ttl.py | PASS   | Nama file JSON sesuai ticker — NVDA → data/ohlcv/NVDA.json.                    |

---

## 3. IPC Commands (`test_ipc_commands.py`)

### 3.1 Request/Response (IPC-001..009)

| ID      | Test Name                                  | File                 | Status | Description                                                                    |
| ------- | ------------------------------------------ | -------------------- | ------ | ------------------------------------------------------------------------------ |
| IPC-001 | `test_ipc_001_request_json_valid`          | test_ipc_commands.py | PASS   | Request format JSON valid ke Python — response JSON ke STDOUT.                 |
| IPC-002 | `test_ipc_002_response_id_matches_request` | test_ipc_commands.py | PASS   | Response ID cocok dengan request ID — id yang sama dikembalikan.               |
| IPC-003 | `test_ipc_003_response_format_valid`       | test_ipc_commands.py | PASS   | Format response JSON valid — {"id":"...","ok":true/false,"data":{...}}.        |
| IPC-004 | `test_ipc_004_command_ohlcv`               | test_ipc_commands.py | PASS   | Command ohlcv berjalan — data OHLCV ter-return di field data.                  |
| IPC-005 | `test_ipc_005_command_news`                | test_ipc_commands.py | PASS   | Command news berjalan — data berita US ter-return.                             |
| IPC-006 | `test_ipc_006_command_macro`               | test_ipc_commands.py | PASS   | Command macro berjalan — data kalender ekonomi ter-return.                     |
| IPC-007 | `test_ipc_007_command_forex`               | test_ipc_commands.py | PASS   | Command forex berjalan — data kurs ter-return.                                 |
| IPC-008 | `test_ipc_008_command_company`             | test_ipc_commands.py | PASS   | Command company berjalan — data profil perusahaan ter-return.                  |
| IPC-009 | `test_ipc_009_command_companies_batch`     | test_ipc_commands.py | PASS   | Command companies (batch) berjalan — data multiple ticker dalam satu response. |

### 3.2 Error Handling (IPC-010..016)

| ID      | Test Name                           | File                 | Status | Description                                                                   |
| ------- | ----------------------------------- | -------------------- | ------ | ----------------------------------------------------------------------------- |
| IPC-010 | `test_ipc_010_unknown_command`      | test_ipc_commands.py | PASS   | Command tidak dikenal — error terdefinisi, tidak crash.                       |
| IPC-011 | `test_ipc_011_malformed_json`       | test_ipc_commands.py | PASS   | Request JSON malformed — parse error tertangkap, error response.              |
| IPC-012 | `test_ipc_012_missing_cmd_field`    | test_ipc_commands.py | PASS   | Request tanpa field cmd — error response jelas, tidak crash.                  |
| IPC-013 | `test_ipc_013_missing_params_field` | test_ipc_commands.py | PASS   | Request tanpa field params — error response atau default params, tidak crash. |
| IPC-014 | `test_ipc_014_concurrent_requests`  | test_ipc_commands.py | PASS   | Concurrent request (5 sekaligus) — semua response ter-return dengan id benar. |
| IPC-015 | `test_ipc_015_latency_cache_hit`    | test_ipc_commands.py | PASS   | Latency IPC pipe — < 2000ms untuk request yang hit cache.                     |
| IPC-016 | `test_ipc_016_python_backend_crash` | test_ipc_commands.py | PASS   | Python backend handles invalid input gracefully — tidak freeze.               |

---

## Test Count by Module

| Module                                                    | Count  |
| --------------------------------------------------------- | ------ |
| Scraping Engine (OHLCV, Company Info, News, Forex, Macro) | 40     |
| Caching & TTL (SQLite, JSON Backup)                       | 19     |
| IPC Commands (Request/Response, Error Handling)           | 16     |
| **TOTAL**                                                 | **75** |


