"""
MAPRO Scraper — Macroeconomic Events (Investing.com)
Jalankan: python scraper.py
Output  : ../data/macro/

SETUP AWAL (wajib sebelum jalankan):
    pip install playwright
    playwright install chromium
"""

import json
import os
import time
from datetime import datetime
from playwright.sync_api import sync_playwright

COUNTRY_CONFIG = {
    "US": {"name": "United States", "country_id": "5",  "currency": "USD"},
    "ID": {"name": "Indonesia",     "country_id": "48", "currency": "IDR"},
    "JP": {"name": "Japan",         "country_id": "35", "currency": "JPY"},
    "GB": {"name": "United Kingdom","country_id": "4",  "currency": "GBP"},
}

IMPACT_MAP = {"1": "low", "2": "medium", "3": "high"}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../data/macro")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def save_json(data, filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved: {filename}")


def scrape_calendar(page, country_code, cfg):
    print(f"  Scraping {cfg['name']}...")
    events = []
    try:
        page.goto("https://www.investing.com/economic-calendar/",
                  wait_until="networkidle", timeout=30000)
        time.sleep(2)

        # Tutup popup/cookie banner kalau muncul
        for selector in ['[id="onetrust-accept-btn-handler"]', "text=Accept", "text=I Accept"]:
            try:
                page.click(selector, timeout=2000)
                break
            except:
                pass

        page.wait_for_selector("#economicCalendarData", timeout=15000)
        rows = page.query_selector_all("#economicCalendarData tr.js-event-item")
        print(f"    Total rows found: {len(rows)}")

        for row in rows:
            try:
                if row.get_attribute("data-country-id") != cfg["country_id"]:
                    continue

                name_el  = row.query_selector(".event")
                time_el  = row.query_selector(".time")
                date_el  = row.query_selector(".theDate")
                act_el   = row.query_selector(".act")
                fore_el  = row.query_selector(".fore")
                prev_el  = row.query_selector(".prev")
                bulls    = row.query_selector_all(".grayFullBullishIcon")

                name = name_el.inner_text().strip() if name_el else ""
                if not name:
                    continue

                events.append({
                    "name":     name,
                    "date":     date_el.inner_text().strip() if date_el else str(datetime.now().date()),
                    "time":     time_el.inner_text().strip() if time_el else "",
                    "impact":   IMPACT_MAP.get(str(len(bulls)), "low"),
                    "actual":   act_el.inner_text().strip()  if act_el  else "",
                    "forecast": fore_el.inner_text().strip()  if fore_el else "",
                    "previous": prev_el.inner_text().strip()  if prev_el else "",
                    "currency": cfg["currency"]
                })
            except:
                continue

    except Exception as e:
        print(f"  [ERROR] {country_code}: {e}")

    print(f"    Parsed: {len(events)} events")
    return events


def main():
    print("=" * 50)
    print("MAPRO Scraper — Macroeconomic Events")
    print(f"Started: {datetime.now()}")
    print("=" * 50)

    summary = {"scraped_at": str(datetime.now()), "countries": {}}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()

        for code, cfg in COUNTRY_CONFIG.items():
            print(f"\n[Country: {code}]")
            events = scrape_calendar(page, code, cfg)

            save_json({
                "country":     code,
                "name":        cfg["name"],
                "currency":    cfg["currency"],
                "scraped_at":  str(datetime.now()),
                "event_count": len(events),
                "events":      events
            }, f"{code.lower()}_macro.json")

            summary["countries"][code] = {
                "name":        cfg["name"],
                "event_count": len(events)
            }
            time.sleep(2)

        browser.close()

    save_json(summary, "_summary.json")
    print(f"\n[DONE] {datetime.now()}")


if __name__ == "__main__":
    main()
