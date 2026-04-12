import sys, os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from cache_db import cache_get, cache_set, set_scrape_status

import json
import time
import logging
from datetime import datetime, timedelta

from playwright.sync_api import sync_playwright

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

ALL_COUNTRIES = {
    "AU": {"name": "Australia", "currency": "AUD"},
    "CA": {"name": "Canada", "currency": "CAD"},
    "CH": {"name": "Switzerland", "currency": "CHF"},
    "CN": {"name": "China", "currency": "CNY"},
    "DE": {"name": "Germany", "currency": "EUR"},
    "FR": {"name": "France", "currency": "EUR"},
    "HK": {"name": "Hong Kong", "currency": "HKD"},
    "ID": {"name": "Indonesia", "currency": "IDR"},
    "IN": {"name": "India", "currency": "INR"},
    "IT": {"name": "Italy", "currency": "EUR"},
    "JP": {"name": "Japan", "currency": "JPY"},
    "KR": {"name": "South Korea", "currency": "KRW"},
    "MX": {"name": "Mexico", "currency": "MXN"},
    "NZ": {"name": "New Zealand", "currency": "NZD"},
    "RU": {"name": "Russia", "currency": "RUB"},
    "SG": {"name": "Singapore", "currency": "SGD"},
    "ES": {"name": "Spain", "currency": "EUR"},
    "UK": {"name": "United Kingdom", "currency": "GBP"},
    "US": {"name": "United States", "currency": "USD"},
    "ZA": {"name": "South Africa", "currency": "ZAR"},
    "BR": {"name": "Brazil", "currency": "BRL"},
    "EU": {"name": "Euro Zone", "currency": "EUR"},
}

COUNTRY_CODES = {
    "Australia": "AU",
    "Canada": "CA",
    "Switzerland": "CH",
    "China": "CN",
    "Germany": "DE",
    "France": "FR",
    "HongKong": "HK",
    "Indonesia": "ID",
    "India": "IN",
    "Italy": "IT",
    "Japan": "JP",
    "SouthKorea": "KR",
    "Mexico": "MX",
    "NewZealand": "NZ",
    "Russia": "RU",
    "Singapore": "SG",
    "Spain": "ES",
    "UnitedKingdom": "UK",
    "UnitedStates": "US",
    "SouthAfrica": "ZA",
    "Brazil": "BR",
    "EuroZone": "EU",
}

COUNTRY_CONFIG = {
    "US": {"name": "United States", "currency": "USD"},
    "ID": {"name": "Indonesia", "currency": "IDR"},
    "JP": {"name": "Japan", "currency": "JPY"},
    "UK": {"name": "United Kingdom", "currency": "GBP"},
    "DE": {"name": "Germany", "currency": "EUR"},
}

MACRO_TTL_SECONDS = 86400  # 24 hours


def load_cookies():
    """Load cookies from Netscape format cookies.txt file."""
    cookies = []
    if not os.path.exists(COOKIES_FILE):
        logger.warning(f"Cookies file not found: {COOKIES_FILE}")
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
    logger.info(f"Loaded {len(cookies)} cookies")
    return cookies


def save_json(data, filename, output_dir):
    """Save data to JSON file in output directory."""
    path = os.path.join(output_dir, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved: {filename}")


def click_show_filters(page):
    try:
        btn = page.query_selector('button:has-text("Show Filters")')
        if btn:
            btn.click()
            time.sleep(1)
            return True
        btn = page.query_selector('button:has-text("Hide Filters")')
        if btn:
            return True
        return False
    except:
        return False


def open_custom_dates(page):
    try:
        btn = page.query_selector('button:has-text("Custom dates")')
        if btn:
            btn.click()
            time.sleep(2)
            return True
        return False
    except:
        return False


def set_dates(page, from_date, to_date):
    month, day, year = from_date.split("/")
    start_input = page.query_selector("#date-picker-start-day")
    if start_input:
        start_input.click()
        start_input.fill("")
        time.sleep(0.2)
        start_input.type(f"{month}/{day}/{year}")
        time.sleep(0.3)

    month, day, year = to_date.split("/")
    end_input = page.query_selector("#date-picker-end-day")
    if end_input:
        end_input.click()
        end_input.fill("")
        time.sleep(0.2)
        end_input.type(f"{month}/{day}/{year}")
        time.sleep(0.3)


def apply_dates(page):
    try:
        page.click('button:has-text("Apply")', timeout=5000)
        time.sleep(3)
        return True
    except:
        return False


def find_country_code(row_id):
    for html_name, code in COUNTRY_CODES.items():
        if html_name in row_id:
            return code
    return None


def parse_impact(row):
    stars = row.query_selector_all('svg use[href*="star-filled"]')
    if not stars:
        return "low"
    filled = 0
    for star in stars:
        svg_handle = star.evaluate_handle("node => node.parentElement")
        if svg_handle:
            svg_el = svg_handle.as_element()
            if svg_el:
                cls = svg_el.get_attribute("class") or ""
                if "opacity-60" in cls or "opacity-80" in cls:
                    filled += 1
    if filled >= 2:
        return "high"
    elif filled >= 1:
        return "medium"
    return "low"


def scrape_calendar(from_date, to_date, countries=None, output_dir=None):
    if output_dir is None:
        output_dir = OUTPUT_DIR

    with sync_playwright() as p:
        executable_path = (
            "/usr/bin/chromium" if os.path.exists("/usr/bin/chromium") else None
        )
        browser = p.chromium.launch(
            headless=True,
            executable_path=executable_path,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )
        cookies = load_cookies()
        if cookies:
            context.add_cookies(cookies)
        page = context.new_page()

        logger.info("Loading economic calendar...")
        page.goto(
            "https://www.investing.com/economic-calendar/",
            timeout=120000,
            wait_until="domcontentloaded",
        )
        time.sleep(10)

        logger.info("Opening filters and setting dates...")
        if not click_show_filters(page):
            logger.error("Could not open filters panel")
            return []
        time.sleep(1)

        if not open_custom_dates(page):
            logger.error("Could not open custom dates")
            return []
        time.sleep(2)

        set_dates(page, from_date, to_date)
        time.sleep(1)

        if not apply_dates(page):
            logger.error("Could not apply dates")
            return []

        logger.info("Waiting for data to load...")
        time.sleep(8)

        rows = page.query_selector_all("tr.datatable-v2_row__hkEus")
        logger.info(f"Found {len(rows)} rows")

        events = []
        for row in rows:
            try:
                row_id = row.get_attribute("id") or ""
                if not row_id or "--" in row_id:
                    continue

                country_code = find_country_code(row_id)
                if not country_code:
                    continue

                if countries and country_code not in countries:
                    continue

                text = row.inner_text()
                if "Holiday" in text or "holiday" in text:
                    continue

                time_div = row.query_selector("td > div")
                time_text = ""
                if time_div:
                    t = time_div.inner_text().strip()
                    if t and t not in ["All Day"]:
                        time_text = t

                event_link = row.query_selector("td a.text-link")
                name = event_link.inner_text().strip() if event_link else ""
                if not name:
                    continue

                all_tds = row.query_selector_all("td")
                actual, forecast, previous = "", "", ""

                if len(all_tds) >= 8:
                    actual = all_tds[5].inner_text().strip()
                    forecast = all_tds[6].inner_text().strip()
                    previous = all_tds[7].inner_text().strip()

                impact = parse_impact(row)
                cfg = ALL_COUNTRIES.get(country_code, {"currency": "UNK"})

                events.append(
                    {
                        "name": name,
                        "date": from_date,
                        "time": time_text,
                        "impact": impact,
                        "actual": actual,
                        "forecast": forecast,
                        "previous": previous,
                        "currency": cfg.get("currency", "UNK"),
                    }
                )
                logger.info(f"  [{country_code}] {time_text} - {name}")

            except Exception as e:
                logger.debug(f"Error: {e}")
                continue

        browser.close()
        return events


def is_cache_fresh(key, ttl_seconds):
    """Check if cache entry exists and is within TTL."""
    data = cache_get(key)
    if data is None:
        return False, None
    updated_at_str = data.get("updated_at") or data.get("scraped_at")
    if not updated_at_str:
        return False, None
    try:
        updated_at = datetime.fromisoformat(updated_at_str)
        age = datetime.now() - updated_at
        if age.total_seconds() < ttl_seconds:
            return True, data
    except Exception:
        pass
    return False, None


def run(output_dir):
    """
    Main entry point for the Macro Economic Events scraper.

    Args:
        output_dir: Directory to write JSON files to

    Returns:
        Summary dict with scraped_at timestamp and country event counts
    """
    global COOKIES_FILE, OUTPUT_DIR
    COOKIES_FILE = os.path.join(os.path.dirname(__file__), "cookies.txt")
    OUTPUT_DIR = output_dir

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    logger.info("=" * 50)
    logger.info("Macro Economic Events Scraper")
    logger.info(f"Started: {datetime.now()}")
    logger.info("=" * 50)

    target_countries = ["US", "ID", "JP", "UK", "DE"]

    today = datetime.now()
    from_date = today.strftime("%m/%d/%Y")
    to_date = (today + timedelta(days=7)).strftime("%m/%d/%Y")

    logger.info(f"Scraping {from_date} to {to_date} for: {target_countries}")

    # Check cache for each country first
    events_by_country = {}
    for code in target_countries:
        fresh, cached_data = is_cache_fresh(f"macro:{code}", MACRO_TTL_SECONDS)
        if fresh and cached_data:
            logger.info(f"[CACHE] Using cached data for {code}")
            events_by_country[code] = cached_data.get("events", [])
        else:
            # Need to scrape - but macro scraper scrapes all countries at once
            # So we check if any country is missing cache and scrape all
            pass

    # If any country is missing cache, scrape all
    any_missing = any(
        is_cache_fresh(f"macro:{code}", MACRO_TTL_SECONDS)[0] is False
        for code in target_countries
    )

    if any_missing:
        events = scrape_calendar(from_date, to_date, target_countries, OUTPUT_DIR)

        events_by_country = {}
        for event in events:
            currency = event.get("currency", "")
            country = "US"
            if "IDR" in currency:
                country = "ID"
            elif "JPY" in currency:
                country = "JP"
            elif "EUR" in currency:
                country = "DE"

            event.pop("currency", None)
            if country not in events_by_country:
                events_by_country[country] = []
            events_by_country[country].append(event)
    else:
        logger.info("All countries found in cache, skipping scrape.")

    summary = {"scraped_at": str(datetime.now()), "countries": {}}

    for code in target_countries:
        cfg = COUNTRY_CONFIG.get(code, {"name": code, "currency": "UNK"})
        events_list = events_by_country.get(code, [])
        logger.info(f"[{code}] Found: {len(events_list)} events")

        # Check cache for this specific country
        fresh, cached_data = is_cache_fresh(f"macro:{code}", MACRO_TTL_SECONDS)
        if fresh and cached_data:
            macro_data = cached_data
        else:
            macro_data = {
                "country": code,
                "name": cfg["name"],
                "currency": cfg["currency"],
                "scraped_at": str(datetime.now()),
                "updated_at": datetime.now().isoformat(),
                "event_count": len(events_list),
                "events": events_list,
            }
            cache_set(f"macro:{code}", macro_data)

        save_json(macro_data, f"{code.lower()}_macro.json", OUTPUT_DIR)

        summary["countries"][code] = {
            "name": cfg["name"],
            "event_count": len(events_list),
        }

    save_json(summary, "_summary.json", OUTPUT_DIR)
    logger.info(f"\nDONE: {datetime.now()}")

    return summary


if __name__ == "__main__":
    # Default output dir when run directly
    DATA_DIR = "/home/reiyo/Project/PBL1/pbl1-main_application/data"
    run(DATA_DIR)
