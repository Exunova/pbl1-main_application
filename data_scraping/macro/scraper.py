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
import re
import time
from datetime import datetime

from playwright.sync_api import sync_playwright

COUNTRY_CONFIG = {
    "US": {"name": "United States", "html_name": "UnitedStates", "currency": "USD"},
    "ID": {"name": "Indonesia", "html_name": "Indonesia", "currency": "IDR"},
    "JP": {"name": "Japan", "html_name": "Japan", "currency": "JPY"},
    "GB": {"name": "United Kingdom", "html_name": "UnitedKingdom", "currency": "GBP"},
}

IMPACT_MAP = {1: "low", 2: "medium", 3: "high"}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../data/macro")
COOKIES_FILE = os.path.join(os.path.dirname(__file__), "cookies.txt")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def load_cookies():
    cookies = []
    if not os.path.exists(COOKIES_FILE):
        print(f"  Cookies file not found: {COOKIES_FILE}")
        return cookies
    with open(COOKIES_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) >= 7:
                domain, _, path, secure, expiration, name, value = parts[:7]
                cookies.append(
                    {
                        "domain": domain,
                        "path": path,
                        "secure": secure == "TRUE",
                        "name": name,
                        "value": value,
                    }
                )
    print(f"  Loaded {len(cookies)} cookies from {COOKIES_FILE}")
    return cookies


def save_json(data, filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved: {filename}")


def parse_impact(row):
    stars = row.query_selector_all('svg use[href*="star-filled"]')
    if not stars:
        return "low"
    filled = 0
    for star in stars:
        parent = star.evaluate_handle("node => node.parentElement")
        style = parent.get_attribute("style") or ""
        if "opacity-60" in style or "opacity-80" in style:
            filled += 1
        elif "opacity-20" not in style and "opacity-0" not in style:
            filled += 1
    return IMPACT_MAP.get(min(filled, 3), "low")


def scrape_all(page):
    current_date = str(datetime.now().date())
    page.goto(
        "https://www.investing.com/economic-calendar/",
        wait_until="domcontentloaded",
        timeout=30000,
    )
    time.sleep(5)

    for selector in [
        '[id="onetrust-accept-btn-handler"]',
        '[id="cookie-banner"]',
        "text=Accept",
        "text=I Accept",
        '[class*="cookie"]',
    ]:
        try:
            page.click(selector, timeout=3000)
            time.sleep(1)
            break
        except:
            pass

    for _ in range(10):
        try:
            page.wait_for_selector(".datatable-v2_body__8TXQk", timeout=5000)
            break
        except:
            time.sleep(2)
    else:
        print("  Warning: datatable body not found, trying alternate selector")

    rows = page.query_selector_all("tr.datatable-v2_row__hkEus")
    print(f"  Total rows: {len(rows)}")

    all_events = {}
    for code, cfg in COUNTRY_CONFIG.items():
        all_events[code] = []

    for row in rows:
        try:
            row_id = row.get_attribute("id") or ""

            country_found = None
            for code, cfg in COUNTRY_CONFIG.items():
                if cfg["html_name"] in row_id:
                    country_found = code
                    break
            if not country_found:
                continue

            if "Holiday" in row.inner_text():
                continue

            time_div = row.query_selector("td div.text-sm")
            time_text = time_div.inner_text().strip() if time_div else ""

            event_link = row.query_selector("td a.text-link")
            name = event_link.inner_text().strip() if event_link else ""
            if not name:
                continue

            all_tds = row.query_selector_all("td")

            actual = ""
            forecast = ""
            previous = ""

            if len(all_tds) > 5:
                td5 = all_tds[5]
                span = td5.query_selector("span")
                if span:
                    actual = span.inner_text().strip()
                else:
                    actual = td5.inner_text().strip()

            if len(all_tds) > 6:
                td6 = all_tds[6]
                span = td6.query_selector("span")
                if span:
                    forecast = span.inner_text().strip()
                else:
                    forecast = td6.inner_text().strip()

            if len(all_tds) > 7:
                td7 = all_tds[7]
                div = td7.query_selector("div")
                if div:
                    previous = div.inner_text().strip()
                else:
                    previous = td7.inner_text().strip()

            impact = parse_impact(row)
            cfg = COUNTRY_CONFIG[country_found]

            all_events[country_found].append(
                {
                    "name": name,
                    "date": current_date,
                    "time": time_text,
                    "impact": impact,
                    "actual": actual,
                    "forecast": forecast,
                    "previous": previous,
                    "currency": cfg["currency"],
                }
            )
        except:
            continue

    return all_events


def main():
    print("=" * 50)
    print("MAPRO Scraper — Macroeconomic Events")
    print(f"Started: {datetime.now()}")
    print("=" * 50)

    summary = {"scraped_at": str(datetime.now()), "countries": {}}

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path="/usr/bin/chromium"
            if os.path.exists("/usr/bin/chromium")
            else None,
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )
        cookies = load_cookies()
        if cookies:
            context.add_cookies(cookies)
        page = context.new_page()

        all_events = scrape_all(page)

        for code, cfg in COUNTRY_CONFIG.items():
            events = all_events[code]
            print(f"\n[{code}] Parsed: {len(events)} events")
            save_json(
                {
                    "country": code,
                    "name": cfg["name"],
                    "currency": cfg["currency"],
                    "scraped_at": str(datetime.now()),
                    "event_count": len(events),
                    "events": events,
                },
                f"{code.lower()}_macro.json",
            )
            summary["countries"][code] = {
                "name": cfg["name"],
                "event_count": len(events),
            }

        browser.close()

    save_json(summary, "_summary.json")
    print(f"\n[DONE] {datetime.now()}")


if __name__ == "__main__":
    main()
