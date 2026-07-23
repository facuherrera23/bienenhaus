"""Test producción detallado: login + Tasaciones."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'))

BASE = 'https://bienenhaus.onrender.com'
PASSWORD = os.getenv('ADMIN_PASSWORD', 'Admin123!')

results = {'ok': True, 'steps': [], 'errors': [], 'console_errors': [], 'api_errors': []}

def step(name, ok, detail=''):
    results['steps'].append({'name': name, 'ok': ok, 'detail': detail})
    if not ok:
        results['ok'] = False
        results['errors'].append(f"{name}: {detail}")

api_urls = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        ignore_https_errors=True,
        viewport={'width': 1280, 'height': 900}
    )
    page = ctx.new_page()

    # Capturar requests fallidos
    page.on('response', lambda resp: (
        results['api_errors'].append(f"{resp.status} {resp.url}")
        if resp.status >= 400 else None
    ))

    # Capturar console errors
    page.on('console', lambda msg: (
        results['console_errors'].append(f"[{msg.type}] {msg.text}")
        if msg.type in ('error', 'warning') else None
    ))

    # 1. Admin page load
    try:
        r = page.goto(f'{BASE}/admin', wait_until='networkidle', timeout=30000)
        step('admin_page_load', r.ok, f"status={r.status}")
    except Exception as e:
        step('admin_page_load', False, str(e))

    # 2. Fill login
    try:
        page.fill('#loginUser', 'admin')
        page.fill('#loginPass', PASSWORD)
        step('fill_login', True)
    except Exception as e:
        step('fill_login', False, str(e))

    # 3. Click login
    try:
        page.click('#doLogin')
        page.wait_for_timeout(5000)
        # Check if we're still on login screen
        login_screen = page.query_selector('#loginScreen')
        if login_screen and login_screen.is_visible():
            error_el = page.query_selector('#loginError')
            err_text = error_el.text_content() if error_el else 'unknown'
            step('login', False, f"Login failed: {err_text}")
        else:
            step('login', True, "Dashboard visible")
    except Exception as e:
        step('login', False, str(e))

    # 4. Screenshot after login
    page.screenshot(path='_prod_after_login.png')

    # 5. Check sidebar visibility
    sidebar = page.query_selector('.sidebar, .admin-sidebar, nav.sidebar')
    if sidebar:
        visible = sidebar.is_visible()
        step('sidebar_visible', visible, f"sidebar visible={visible}")
    else:
        step('sidebar_visible', False, "No sidebar element found")

    # 6. Try clicking Tasaciones tab
    tas_btn = page.query_selector('button[data-tab="tasaciones"]')
    if tas_btn:
        visible = tas_btn.is_visible()
        step('tasaciones_tab_found', visible, f"tab visible={visible}, text='{tas_btn.text_content()}'")
        if visible:
            tas_btn.click()
            page.wait_for_timeout(3000)
            step('tasaciones_tab_clicked', True)
        else:
            # Try to use JS click
            try:
                page.evaluate('document.querySelector("button[data-tab=\'tasaciones\']").click()')
                page.wait_for_timeout(3000)
                step('tasaciones_tab_js_click', True, "Clicked via JS")
            except Exception as e:
                step('tasaciones_tab_js_click', False, str(e))
    else:
        step('tasaciones_tab_found', False, "No button[data-tab='tasaciones']")

    # 7. Check section visibility
    tas_section = page.query_selector('#section-tasaciones, .section-tasaciones, [data-section="tasaciones"]')
    if tas_section:
        visible = tas_section.is_visible()
        step('tasaciones_section', visible, f"section visible={visible}")
    else:
        step('tasaciones_section', False, "No tasaciones section found")

    # 8. Screenshot final
    page.screenshot(path='_prod_tasaciones_final.png')

    browser.close()

print(json.dumps(results, indent=2, ensure_ascii=False))
sys.exit(0 if results['ok'] else 1)
