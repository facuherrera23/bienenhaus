"""Test login con ambas contraseñas posibles."""
import sys, os, json
from playwright.sync_api import sync_playwright

BASE = 'https://bienenhaus.onrender.com'

passwords = [
    ('pzTSPEuPPTb8DjZKajCaRMrv', 'from .env'),
    ('Admin123!', 'default fallback'),
]

results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(ignore_https_errors=True, viewport={'width': 1280, 'height': 900})

    for pw, label in passwords:
        page = ctx.new_page()
        page.goto(f'{BASE}/admin', wait_until='networkidle', timeout=30000)
        page.fill('#loginUser', 'admin')
        page.fill('#loginPass', pw)
        page.click('#doLogin')
        page.wait_for_timeout(5000)

        login_screen = page.query_selector('#loginScreen')
        if login_screen and login_screen.is_visible():
            error_el = page.query_selector('#loginError')
            err_text = error_el.text_content().strip() if error_el else 'unknown'
            results[pw] = f'FAIL: {err_text}'
        else:
            results[pw] = 'OK: logged in'
            # Take screenshot to confirm
            page.screenshot(path=f'_prod_login_{label.replace(" ", "_")}.png')

        page.close()

    browser.close()

print(json.dumps(results, indent=2))
