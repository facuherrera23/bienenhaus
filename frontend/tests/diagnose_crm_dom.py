"""Quick DOM inspection of CRM tab after load."""
import os
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5000"
ADMIN_PASS = os.environ.get("ADMIN_PASSWORD", "Admin123!")

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
    
    page.locator('[data-tab="crm"]').click()
    page.wait_for_timeout(3000)

    # Inspect key elements
    elements = {
        "KPI bar": page.query_selector(".crm-kpi-bar"),
        "KPI cards": page.query_selector_all(".crm-kpi-card"),
        "Filter group": page.query_selector(".admin-filter-group"),
        "View toggle": page.query_selector(".crm-view-toggle"),
        "Kanban board": page.query_selector(".kanban-board"),
        "Kanban columns": page.query_selector_all(".kanban-column"),
        "Kanban cards": page.query_selector_all(".kanban-card"),
        "Followup filter": page.query_selector(".crm-followup-filter-label"),
        "Status dots": page.query_selector_all(".crm-status-dot"),
        "Lead list": page.query_selector("#crmLeadList"),
    }

    print("=== CRM DOM Inspection ===")
    for name, el in elements.items():
        if isinstance(el, list):
            print(f"  {name}: {len(el)} found")
        else:
            print(f"  {name}: {'✓' if el else '✗'}")

    # Check for console errors
    errors = []
    def handler(msg):
        if msg.type == "error":
            errors.append(msg.text)
    page.on("console", handler)
    page.wait_for_timeout(500)

    filtered = [e for e in errors if "favicon" not in e.lower() and "source map" not in e.lower()]
    if filtered:
        print(f"\n  Console errors ({len(filtered)}):")
        for e in filtered[:5]:
            print(f"    • {e}")

    browser.close()
