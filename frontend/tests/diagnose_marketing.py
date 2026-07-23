"""DOM inspection + screenshots of Marketing tab (Módulo 13)."""
import os, sys, time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5000"
ADMIN_PASS = os.environ.get("ADMIN_PASSWORD", "Admin123!")
SS_DIR = os.path.join(os.path.dirname(__file__), "screenshots")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
    page.fill("#loginUser", "admin")
    page.fill("#loginPass", ADMIN_PASS)
    page.click("#doLogin")
    page.wait_for_timeout(3000)
    page.wait_for_load_state("networkidle")
    page.wait_for_selector(".admin-screen")

    # Collect console errors
    errors = []
    def on_console(msg):
        if msg.type == "error":
            errors.append(msg.text)
    page.on("console", on_console)

    # Navigate to Marketing tab
    page.locator('[data-tab="marketing"]').click()
    page.wait_for_timeout(4000)
    page.wait_for_load_state("networkidle")

    # Screenshot 1: Dashboard subtab
    os.makedirs(SS_DIR, exist_ok=True)
    page.screenshot(path=os.path.join(SS_DIR, "m13-dashboard.png"), full_page=False)
    print("[OK] Screenshot: dashboard")

    # Inspect Dashboard elements
    dash_els = {
        "mktKpiBar": page.query_selector("#mktKpiBar"),
        "mktPlatformsGrid": page.query_selector("#mktPlatformsGrid"),
        "mktPostsList": page.query_selector("#mktPostsList"),
        "mktStatsCharts": page.query_selector("#mktStatsCharts"),
    }
    print("=== Dashboard DOM ===")
    for name, el in dash_els.items():
        print(f"  {name}: {'[OK]' if el else '✗'}")

    # Switch to Campaigns subtab
    page.locator('[data-marketing-subtab="campaigns"]').click()
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(SS_DIR, "m13-campaigns.png"), full_page=False)
    print("[OK] Screenshot: campaigns")

    camp_els = {
        "mktCampStats": page.query_selector("#mktCampStats"),
        "mktCampaignList": page.query_selector("#mktCampaignList"),
    }
    print("=== Campaigns DOM ===")
    for name, el in camp_els.items():
        print(f"  {name}: {'[OK]' if el else '✗'}")

    # Switch to Accounts subtab (existing)
    page.locator('[data-marketing-subtab="accounts"]').click()
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(SS_DIR, "m13-accounts.png"), full_page=False)
    print("[OK] Screenshot: accounts")

    # Switch to Posts subtab (existing)
    page.locator('[data-marketing-subtab="posts"]').click()
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(SS_DIR, "m13-posts.png"), full_page=False)
    print("[OK] Screenshot: posts")

    # Switch to Calendar (existing)
    page.locator('[data-marketing-subtab="calendar"]').click()
    page.wait_for_timeout(2000)
    page.screenshot(path=os.path.join(SS_DIR, "m13-calendar.png"), full_page=False)
    print("[OK] Screenshot: calendar")

    # Filter console errors
    filtered = [e for e in errors if "favicon" not in e.lower() and "source map" not in e.lower()]
    if filtered:
        print(f"\n  Console errors ({len(filtered)}):")
        for e in filtered[:10]:
            print(f"    • {e}")
    else:
        print("\n  No console errors.")

    browser.close()
    print("\n[OK] Diagnosis complete.")
