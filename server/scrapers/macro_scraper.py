import json
import os
import time
import logging
from datetime import datetime
from playwright.sync_api import sync_playwright

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

COOKIES_FILE = os.path.join(os.path.dirname(__file__), "../../data_scraping/macro/cookies.txt")
ALL_COUNTRIES = {
    "AU":"Australia","CA":"Canada","CH":"Switzerland","CN":"China","DE":"Germany","FR":"France",
    "HK":"Hong Kong","ID":"Indonesia","IN":"India","IT":"Italy","JP":"Japan","KR":"South Korea",
    "MX":"Mexico","NZ":"New Zealand","RU":"Russia","SG":"Singapore","ES":"Spain","UK":"United Kingdom",
    "US":"United States","ZA":"South Africa","BR":"Brazil","EU":"Euro Zone"
}
COUNTRY_CODES = {
    "Australia":"AU","Canada":"CA","Switzerland":"CH","China":"CN","Germany":"DE","France":"FR",
    "HongKong":"HK","Indonesia":"ID","India":"IN","Italy":"IT","Japan":"JP","SouthKorea":"KR",
    "Mexico":"MX","NewZealand":"NZ","Russia":"RU","Singapore":"SG","Spain":"ES","UnitedKingdom":"UK",
    "UnitedStates":"US","SouthAfrica":"ZA","Brazil":"BR","EuroZone":"EU"
}
COUNTRY_CONFIG = {
    "US": {"name":"United States","currency":"USD"},
    "ID": {"name":"Indonesia","currency":"IDR"},
    "JP": {"name":"Japan","currency":"JPY"},
}

def load_cookies():
    cookies = []
    if not os.path.exists(COOKIES_FILE):
        return cookies
    with open(COOKIES_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) >= 7:
                domain, _, path, secure, expiration, name, value = parts[:7]
                cookies.append({"domain":domain,"path":path,"secure":secure=="TRUE","name":name,"value":value})
    logger.info(f"Loaded {len(cookies)} cookies")
    return cookies

def find_country_code(row_id):
    for html_name, code in COUNTRY_CODES.items():
        if html_name in row_id:
            return code
    return None

def parse_impact(row):
    stars = row.query_selector_all('svg use[href*="star-filled"]')
    if not stars:
        return "low"
    filled = sum(1 for star in stars if "opacity-60" in (star.evaluate_handle("node => node.parentElement").get_attribute("class") or "") or "opacity-80" in "")
    if filled >= 2:
        return "high"
    elif filled >= 1:
        return "medium"
    return "low"

def run(output_dir):
    os.makedirs(output_dir, exist_ok=True)

    from_date = "04/07/2026"
    to_date = "04/07/2026"
    target_countries = ["US", "ID", "JP", "DE"]

    events = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36")
            cookies = load_cookies()
            if cookies:
                context.add_cookies(cookies)
            page = context.new_page()
            page.goto("https://www.investing.com/economic-calendar/", timeout=120000, wait_until="domcontentloaded")
            time.sleep(10)

            try:
                btn = page.query_selector('button:has-text("Show Filters")')
                if btn:
                    btn.click()
                    time.sleep(1)
            except:
                pass

            try:
                btn = page.query_selector('button:has-text("Custom dates")')
                if btn:
                    btn.click()
                    time.sleep(2)
                start_input = page.query_selector("#date-picker-start-day")
                if start_input:
                    start_input.click()
                    start_input.fill("")
                    time.sleep(0.2)
                    start_input.type(from_date)
                    time.sleep(0.3)
                end_input = page.query_selector("#date-picker-end-day")
                if end_input:
                    end_input.click()
                    end_input.fill("")
                    time.sleep(0.2)
                    end_input.type(to_date)
                    time.sleep(0.3)
                page.click('button:has-text("Apply")', timeout=5000)
                time.sleep(8)
            except Exception as e:
                logger.info(f"Date filter error (may already be set): {e}")

            rows = page.query_selector_all("tr.datatable-v2_row__hkEus")
            logger.info(f"Found {len(rows)} rows")

            for row in rows:
                try:
                    row_id = row.get_attribute("id") or ""
                    if not row_id or "--" in row_id:
                        continue
                    country_code = find_country_code(row_id)
                    if not country_code or country_code not in target_countries:
                        continue
                    text = row.inner_text()
                    if "Holiday" in text or "holiday" in text:
                        continue
                    time_div = row.query_selector("td > div")
                    time_text = time_div.inner_text().strip() if time_div and time_div.inner_text().strip() not in ["All Day"] else ""
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
                    events.append({"name":name,"date":from_date,"time":time_text,"impact":impact,"actual":actual,"forecast":forecast,"previous":previous})
                except:
                    continue
            browser.close()
    except Exception as e:
        logger.error(f"Playwright error: {e}")

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

    summary = {"scraped_at": str(datetime.now()), "countries": {}}
    for code in target_countries:
        cfg = COUNTRY_CONFIG.get(code, {"name": code})
        events_list = events_by_country.get(code, [])
        with open(os.path.join(output_dir, f"{code.lower()}_macro.json"), "w", encoding="utf-8") as f:
            json.dump({"country": code, "name": cfg["name"], "scraped_at": str(datetime.now()), "event_count": len(events_list), "events": events_list}, f, indent=2, ensure_ascii=False)
        summary["countries"][code] = {"name": cfg["name"], "event_count": len(events_list)}

    with open(os.path.join(output_dir, "_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    return summary
