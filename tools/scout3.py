"""Scout 3: check console logs and wait for CRM data"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.set_default_timeout(20000)
    
    # Capture console
    page.on('console', lambda msg: print(f"CONSOLE [{msg.type}]: {msg.text[:200]}"))
    page.on('pageerror', lambda err: print(f"PAGE ERROR: {err}"))
    
    page.goto('http://127.0.0.1:5000/admin')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    
    if 'password' in page.content().lower():
        page.fill('input[type="password"]', 'pzTSPEuPPTb8DjZKajCaRMrv')
        page.click('button[type="submit"]')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
    
    # Click CRM tab
    page.click('#tabCrm')
    page.wait_for_timeout(8000)
    
    # Check if any error is visible in the UI
    error_els = page.query_selector_all('.error, [class*="error"], [class*="alert"], [role="alert"]')
    for e in error_els:
        if e.is_visible():
            print(f"ERROR UI: {e.inner_text()[:200]}")
    
    # Check what's rendered
    content = page.query_selector('#tabCrm')
    if content:
        print(f"\nCRM content:\n{content.inner_text()[:1000]}")
    
    browser.close()
