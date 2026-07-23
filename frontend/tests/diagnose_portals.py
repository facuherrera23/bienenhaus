"""DOM inspection + screenshots of Portales tab (Módulo 14)."""
import os, sys
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

    errors = []
    def on_console(msg):
        if msg.type == "error":
            errors.append(msg.text)
    page.on("console", on_console)

    # Navigate to Portales tab
    page.locator('[data-tab="portals"]').click()
    page.wait_for_timeout(5000)
    page.wait_for_load_state("networkidle")

    os.makedirs(SS_DIR, exist_ok=True)
    page.screenshot(path=os.path.join(SS_DIR, "m14-dashboard.png"), full_page=False)
    print("[OK] Screenshot: dashboard")

    # Inspect Dashboard elements
    dash_els = {
        "prtKpiBar": page.query_selector("#prtKpiBar"),
        "prtPlatformsGrid": page.query_selector("#prtPlatformsGrid"),
        "portalDashboardPubs": page.query_selector("#portalDashboardPubs"),
    }
    print("=== Dashboard DOM ===")
    for name, el in dash_els.items():
        print(f"  {name}: {'[OK]' if el else '[FAIL]'}")

    # Check KPI cards count
    kpi_cards = page.query_selector_all(".prt-kpi-card")
    print(f"  KPI cards: {len(kpi_cards)} found")

    # Check platform cards
    platform_cards = page.query_selector_all(".prt-platform-card")
    print(f"  Platform cards: {len(platform_cards)} found")

    # Check publication items
    pub_items = page.query_selector_all(".prt-pub-item")
    print(f"  Publication items: {len(pub_items)} found")

    # Switch to Publicaciones subtab
    page.locator('[data-portal-subtab="publications"]').click()
    page.wait_for_timeout(4000)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(SS_DIR, "m14-publications.png"), full_page=False)
    print("[OK] Screenshot: publications")

    pub_list = page.query_selector("#publicationsEnhancedList")
    print(f"  Enhanced pubs list: {'[OK]' if pub_list else '[FAIL]'}")

    # Switch to Portales (config) subtab
    page.locator('[data-portal-subtab="portals"]').click()
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(SS_DIR, "m14-portals-config.png"), full_page=False)
    print("[OK] Screenshot: portals config")

    portals_list = page.query_selector("#portalsAdminList")
    print(f"  Portals list: {'[OK]' if portals_list else '[FAIL]'}")

    # Switch to Queue subtab
    page.locator('[data-portal-subtab="queue"]').click()
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(SS_DIR, "m14-queue.png"), full_page=False)
    print("[OK] Screenshot: queue")

    # Filter console errors
    filtered = [e for e in errors if "favicon" not in e.lower() and "source map" not in e.lower()]
    if filtered:
        print(f"\n  Console errors ({len(filtered)}):")
        for e in filtered[:10]:
            print(f"    * {e}")
    else:
        print("\n  No console errors.")

    browser.close()
    print("\n[OK] Diagnosis complete.")
