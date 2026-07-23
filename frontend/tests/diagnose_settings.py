"""
diagnose_settings.py — Playwright diagnosis for Módulo 16: Centro de Configuración
Usage: python tests/diagnose_settings.py
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

        # Click Settings tab
        settings_link = page.query_selector('.sidebar-link[data-tab="settings"]')
        if not settings_link:
            print('[FAIL] Sidebar settings link not found')
            browser.close()
            return
        settings_link.click()
        page.wait_for_timeout(2000)

        # Screenshot: General tab
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm16-general.png'), full_page=True)
        print('[OK] Screenshot: general tab')

        # Subtabs
        subtabs = page.query_selector_all('.stg-subtab')
        if subtabs:
            print(f'  Subtabs found: {len(subtabs)}')
            for st in subtabs:
                print(f'    - {st.text_content().strip()}')
            active_subtab = page.query_selector('.stg-subtab.active')
            if active_subtab:
                print(f'  Active subtab: {active_subtab.text_content().strip()}')
        else:
            print('[WARN] No subtabs found')

        # Content area
        content = page.query_selector('#stgContent')
        if content:
            stg_cards = content.query_selector_all('.stg-card')
            print(f'  STG cards: {len(stg_cards)}')
        else:
            print('[WARN] #stgContent not found')

        # Branding subtab
        branding_btn = page.query_selector('.stg-subtab[data-stg-tab="branding"]')
        if branding_btn:
            branding_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm16-branding.png'), full_page=True)
            print('[OK] Screenshot: branding tab')
            branding_cards = page.query_selector_all('#stgContent .stg-card')
            print(f'  Branding cards: {len(branding_cards)}')
        else:
            print('[WARN] Branding subtab not found')

        # Oficinas subtab
        oficinas_btn = page.query_selector('.stg-subtab[data-stg-tab="oficinas"]')
        if oficinas_btn:
            oficinas_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm16-oficinas.png'), full_page=True)
            print('[OK] Screenshot: oficinas tab')
            office_cards = page.query_selector_all('.stg-office-card')
            print(f'  Office cards: {len(office_cards)}')
            # Test office form modal
            new_office_btn = page.query_selector('button[onclick*="stgOpenOfficeForm"]')
            if new_office_btn:
                new_office_btn.click()
                page.wait_for_timeout(500)
                modal = page.query_selector('#stgOfficeFormModal')
                if modal and not modal.is_hidden():
                    print('[OK] Office form modal opens')
                    modal_close = modal.query_selector('.modal-close')
                    if modal_close:
                        modal_close.click()
                else:
                    print('[WARN] Office form modal did not open')
        else:
            print('[WARN] Oficinas subtab not found')

        # Localizacion subtab
        loc_btn = page.query_selector('.stg-subtab[data-stg-tab="localizacion"]')
        if loc_btn:
            loc_btn.click()
            page.wait_for_timeout(1000)
            print('[OK] Localización tab loaded')
        else:
            print('[WARN] Localización subtab not found')

        # Notificaciones subtab
        notif_btn = page.query_selector('.stg-subtab[data-stg-tab="notificaciones"]')
        if notif_btn:
            notif_btn.click()
            page.wait_for_timeout(1000)
            print('[OK] Notificaciones tab loaded')
        else:
            print('[WARN] Notificaciones subtab not found')

        # Integraciones subtab
        intg_btn = page.query_selector('.stg-subtab[data-stg-tab="integraciones"]')
        if intg_btn:
            intg_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm16-integraciones.png'), full_page=True)
            print('[OK] Screenshot: integraciones tab')
            int_cards = page.query_selector_all('.stg-int-card')
            print(f'  Integration cards: {len(int_cards)}')
            # Test integration config modal
            config_btn = page.query_selector('button[onclick*="stgConfigIntegration"]')
            if config_btn:
                config_btn.click()
                page.wait_for_timeout(500)
                modal = page.query_selector('#stgIntegrationModal')
                if modal and not modal.is_hidden():
                    print('[OK] Integration config modal opens')
                    modal_close = modal.query_selector('.modal-close')
                    if modal_close:
                        modal_close.click()
                else:
                    print('[WARN] Integration config modal did not open')
        else:
            print('[WARN] Integraciones subtab not found')

        # Seguridad subtab
        seg_btn = page.query_selector('.stg-subtab[data-stg-tab="seguridad"]')
        if seg_btn:
            seg_btn.click()
            page.wait_for_timeout(1000)
            print('[OK] Seguridad tab loaded')
        else:
            print('[WARN] Seguridad subtab not found')

        # Backups subtab
        bk_btn = page.query_selector('.stg-subtab[data-stg-tab="backups"]')
        if bk_btn:
            bk_btn.click()
            page.wait_for_timeout(1000)
            print('[OK] Backups tab loaded')
        else:
            print('[WARN] Backups subtab not found')

        # Preferencias subtab
        pref_btn = page.query_selector('.stg-subtab[data-stg-tab="preferencias"]')
        if pref_btn:
            pref_btn.click()
            page.wait_for_timeout(1000)
            print('[OK] Preferencias tab loaded')
        else:
            print('[WARN] Preferencias subtab not found')

        # Sistema subtab
        sys_btn = page.query_selector('.stg-subtab[data-stg-tab="sistema"]')
        if sys_btn:
            sys_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm16-sistema.png'), full_page=True)
            print('[OK] Screenshot: sistema tab')
            sys_items = page.query_selector_all('.stg-sys-item')
            print(f'  System info items: {len(sys_items)}')
            # Test health check
            health_btn = page.query_selector('#stgHealthResult')
            if health_btn:
                run_btn = page.query_selector('button[onclick*="stgRunHealthCheck"]')
                if run_btn:
                    run_btn.click()
                    page.wait_for_timeout(1000)
                    print('[OK] Health check triggered')
        else:
            print('[WARN] Sistema subtab not found')

        # Console errors
        if errors:
            print(f'\n  Console errors ({len(errors)}):')
            for e in errors[:5]:
                print(f'    {e}')
        else:
            print('\n  No console errors.')

        browser.close()
        print('\n[OK] Settings Center diagnosis complete.')


if __name__ == '__main__':
    main()
