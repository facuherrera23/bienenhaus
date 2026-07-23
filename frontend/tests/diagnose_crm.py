"""CRM diagnosis: login, lead list (table), side panel, KPIs, filters."""
import sys, os
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5000"
ADMIN_USER = "admin"
ADMIN_PASS = os.environ.get("ADMIN_PASSWORD", "Admin123!")
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

errors = []

def handle_console(msg):
    if msg.type == "error":
        errors.append(msg.text)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            ignore_https_errors=True
        )
        page = context.new_page()
        page.on("console", handle_console)

        # 1. Login
        page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
        page.wait_for_selector("#doLogin", timeout=10000)
        page.wait_for_timeout(500)
        print("[OK] Login page loaded")

        page.fill("#loginUser", ADMIN_USER)
        page.fill("#loginPass", ADMIN_PASS)
        page.click("#doLogin")
        page.wait_for_timeout(3000)
        page.wait_for_load_state("networkidle")
        page.wait_for_selector(".admin-screen", timeout=10000)
        print("[OK] Login successful")

        # 2. CRM tab
        page.locator('[data-tab="crm"]').click()
        page.wait_for_timeout(3000)
        page.wait_for_selector("#crmLeadList", timeout=10000)
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "10-crm-list.png"), full_page=True)
        print("[OK] Screenshot 10-crm-list.png")

        # 3. KPIs
        print(f"  KPI Total: {page.text_content('#crmKpiTotal')}")
        print(f"  KPI Nuevos: {page.text_content('#crmKpiNuevo')}")
        print(f"  KPI Ganados: {page.text_content('#crmKpiGanados')}")
        print(f"  KPI Perdidos: {page.text_content('#crmKpiPerdidos')}")

        # 4. Check rendered elements
        elements = {
            "KPI bar": page.query_selector(".crm-kpi-bar"),
            "Filter group": page.query_selector(".admin-filter-group"),
            "Header row": page.query_selector(".crm-header-row"),
            "Lead rows": page.query_selector_all(".crm-row"),
            "Side panel": page.query_selector("#crmSidePanel"),
            "Followup filter": page.query_selector(".crm-followup-filter-label"),
            "Priority badges": page.query_selector_all(".crm-priority"),
            "Status badges": page.query_selector_all(".crm-status-badge"),
            "Client avatars": page.query_selector_all(".crm-client-avatar"),
            "Prop thumbs": page.query_selector_all(".crm-prop-thumb"),
            "Agent avatars": page.query_selector_all(".crm-agent-avatar"),
            "View detail btns": page.query_selector_all('[data-action="viewLead"]'),
            "Activity dots": page.query_selector_all(".crm-activity-dot"),
        }
        for name, el in elements.items():
            if isinstance(el, list):
                print(f"  {name}: {len(el)} found")
            else:
                print(f"  {name}: {'FOUND' if el else 'MISSING'}")

        # 5. Click first lead row to open side panel
        rows = page.query_selector_all(".crm-row")
        if rows:
            rows[0].click()
            page.wait_for_timeout(2000)
            
            # Check if side panel opened
            sp = page.query_selector("#crmSidePanel.open")
            if sp:
                print("[OK] Side panel opened")
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, "11-crm-side-panel.png"), full_page=True)
                print("[OK] Screenshot 11-crm-side-panel.png")

                # Check side panel sections
                sections = page.query_selector_all(".crm-side-section")
                print(f"  Side sections: {len(sections)}")

                # Close side panel
                close_btn = page.query_selector(".crm-side-close")
                if close_btn:
                    close_btn.click()
                    page.wait_for_timeout(500)
                    print("[OK] Side panel closed")
            else:
                print("[WARN] Side panel did not open")
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, "11-crm-side-error.png"), full_page=True)

        # 6. Filter by status
        st = page.query_selector("#crmStatusFilter")
        if st:
            st.select_option("nuevo")
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "12-crm-filtered.png"), full_page=True)
            print("[OK] Screenshot 12-crm-filtered.png")

        # 7. Console errors
        filtered = [e for e in errors if "favicon" not in e.lower() and "source map" not in e.lower()]
        if filtered:
            print(f"[WARN] Console errors ({len(filtered)}):")
            for e in filtered[:5]:
                print(f"  • {e}")
        else:
            print("[OK] No console errors")

        browser.close()
        print(f"\n[DONE] Screenshots in {SCREENSHOT_DIR}/")

if __name__ == "__main__":
    main()
