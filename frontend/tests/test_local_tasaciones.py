"""Test local: login + Tasaciones + Agregar comparable flow."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'))

BASE = 'http://localhost:5000'
PASSWORD = os.getenv('ADMIN_PASSWORD', 'Admin123!')
print(f'[DEBUG] Using password: [{PASSWORD}]', flush=True)

results = {'ok': True, 'steps': [], 'errors': [], 'console_errors': [], 'api_errors': []}

def step(name, ok, detail=''):
    results['steps'].append({'name': name, 'ok': ok, 'detail': detail})
    if not ok:
        results['ok'] = False
        results['errors'].append(f"{name}: {detail}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = ctx.new_page()

    page.on('response', lambda resp: (
        results['api_errors'].append(f"{resp.status} {resp.url}")
        if resp.status >= 400 else None
    ))
    page.on('console', lambda msg: (
        results['console_errors'].append(f"[{msg.type}] {msg.text}")
        if msg.type in ('error', 'warning') else None
    ))

    # 1. Admin page load
    try:
        r = page.goto(f'{BASE}/admin', wait_until='networkidle', timeout=15000)
        step('admin_page_load', r.ok, f"status={r.status}")
    except Exception as e:
        step('admin_page_load', False, str(e))

    # 2. Login
    try:
        page.fill('#loginUser', 'admin')
        page.fill('#loginPass', PASSWORD)
        page.click('#doLogin')
        page.wait_for_timeout(3000)
        login_screen = page.query_selector('#loginScreen')
        if login_screen and login_screen.is_visible():
            error_el = page.query_selector('#loginError')
            err_text = error_el.text_content().strip() if error_el else 'unknown'
            step('login', False, f"Login failed: {err_text}")
        else:
            step('login', True)
    except Exception as e:
        step('login', False, str(e))

    # 3. Click Tasaciones 2 tab
    try:
        page.evaluate('document.querySelector("button[data-tab=\'tasaciones\']").click()')
        page.wait_for_timeout(3000)
        step('tasaciones_tab', True)
    except Exception as e:
        step('tasaciones_tab', False, str(e))

    # 4. Verify list loaded
    try:
        list_el = page.query_selector('#tasacionesAdminList')
        if list_el:
            html = list_el.inner_html()
            has_items = 'admin-message-item' in html
            step('tasaciones_list_loaded', has_items, f"items found: {has_items}")
        else:
            step('tasaciones_list_loaded', False, "no list element")
    except Exception as e:
        step('tasaciones_list_loaded', False, str(e))

    # 5. Click first tasacion to open panel
    try:
        page.evaluate('''() => {
            const item = document.querySelector('#tasacionesAdminList .admin-message-item');
            if (item) item.click();
        }''')
        page.wait_for_timeout(3000)
        panel = page.query_selector('#tasPanel.open')
        step('open_panel', panel is not None)
    except Exception as e:
        step('open_panel', False, str(e))

    # 6. Click "Abrir ACM" to open full detail
    try:
        page.evaluate('''() => {
            const btn = document.querySelector('.tas-action-btn');
            if (btn) btn.click();
        }''')
        page.wait_for_timeout(3000)
        detail = page.query_selector('#tasacionDetailView:not(.hidden)')
        add_btn = page.query_selector('#tas_addComparableBtn')
        step('open_detail', detail is not None, f"detail_visible={detail is not None}, add_btn={add_btn is not None}")
    except Exception as e:
        step('open_detail', False, str(e))

    # 7. Click "+Agregar comparable"
    if results['steps'][-1]['ok']:
        try:
            page.click('#tas_addComparableBtn')
            page.wait_for_timeout(2000)
            form_modal = page.query_selector('#comparableFormModal')
            is_visible = form_modal and form_modal.is_visible()
            step('click_agregar_comparable', is_visible, f"modal_visible={is_visible}")
        except Exception as e:
            step('click_agregar_comparable', False, str(e))

    # 8. Screenshot
    page.screenshot(path='_local_tasaciones.png')
    step('screenshot', True)

    browser.close()

print(json.dumps(results, indent=2, ensure_ascii=False))
sys.exit(0 if results['ok'] else 1)
