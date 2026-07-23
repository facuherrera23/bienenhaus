"""
diagnose_calendar.py — Playwright diagnosis for Módulo 15: Agenda y Recordatorios
Usage: python tests/diagnose_calendar.py
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5000'
ADMIN_USER = 'admin'
ADMIN_PASS = 'Admin123!'
SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'screenshots')

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

errors = []

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={'width': 1440, 'height': 900},
            ignore_https_errors=True,
        )
        page = ctx.new_page()

        page.on('console', lambda msg: errors.append(f'CONSOLE:{msg.type}:{msg.text}') if msg.type == 'error' else None)
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR:{err}'))

        # Login
        page.goto(f'{BASE}/admin', wait_until='networkidle')
        page.fill('#loginUser', ADMIN_USER)
        page.fill('#loginPass', ADMIN_PASS)
        page.click('#doLogin')
        page.wait_for_timeout(2000)

        # Click Agenda tab
        cal_link = page.query_selector('.sidebar-link[data-tab="calendar"]')
        if not cal_link:
            print('[FAIL] Sidebar calendar link not found')
            browser.close()
            return
        cal_link.click()
        page.wait_for_timeout(2000)

        # Screenshot: Dashboard
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm15-dashboard.png'), full_page=True)
        print('[OK] Screenshot: dashboard')

        # KPI bar
        kpi = page.query_selector('#calKpiBar')
        if kpi:
            cards = kpi.query_selector_all('.cal-kpi-card')
            print(f'  KPI cards: {len(cards)} found')
        else:
            print('[WARN] KPI bar not found')

        # Calendar grid
        grid = page.query_selector('#calGridWrap')
        if grid:
            days = grid.query_selector_all('.cal-day')
            print(f'  Calendar days: {len(days)} found')
        else:
            print('[WARN] Calendar grid not found')

        # Activity list
        activity = page.query_selector('#calActivityList')
        if activity:
            items = activity.query_selector_all('.cal-activity-item')
            print(f'  Activity items: {len(items)} found')
        else:
            print('[WARN] Activity list not found')

        # View switching
        week_btn = page.query_selector('.cal-view-btn[data-cal-view="week"]')
        if week_btn:
            week_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm15-week.png'), full_page=True)
            print('[OK] Screenshot: week view')

        day_btn = page.query_selector('.cal-view-btn[data-cal-view="day"]')
        if day_btn:
            day_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm15-day.png'), full_page=True)
            print('[OK] Screenshot: day view')

        # Month view back
        month_btn = page.query_selector('.cal-view-btn[data-cal-view="month"]')
        if month_btn:
            month_btn.click()
            page.wait_for_timeout(1000)

        # Activity subtabs
        for subtab in ['overdue', 'completed']:
            btn = page.query_selector(f'.cal-subtab[data-cal-tab="{subtab}"]')
            if btn:
                btn.click()
                page.wait_for_timeout(1000)
                print(f'[OK] Activity subtab: {subtab}')

        # New event form modal
        new_btn = page.query_selector('#newCalEventBtn')
        if new_btn:
            new_btn.click()
            page.wait_for_timeout(500)
            modal = page.query_selector('#calEventFormModal')
            if modal and not modal.is_hidden():
                print('[OK] Event form modal opens')
                modal.query_selector('.modal-close').click()
            else:
                print('[WARN] Event form modal did not open')

        # Side panel
        first_event = page.query_selector('.cal-day-event')
        if first_event:
            first_event.click()
            page.wait_for_timeout(1000)
            panel = page.query_selector('#calPanel')
            if panel and 'open' in (panel.get_attribute('class') or ''):
                print('[OK] Side panel opens on event click')
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm15-panel.png'), full_page=True)
                close_btn = page.query_selector('#closeCalPanel')
                if close_btn:
                    close_btn.click()
                    page.wait_for_timeout(500)
            else:
                print('[WARN] Side panel did not open')

        # Console errors
        if errors:
            print(f'\n  Console errors ({len(errors)}):')
            for e in errors[:5]:
                print(f'    {e}')
        else:
            print('\n  No console errors.')

        browser.close()
        print('\n[OK] Diagnosis complete.')


if __name__ == '__main__':
    main()
