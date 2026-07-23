"""Test login flow - see the actual error displayed in the UI."""
from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:5000'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = ctx.new_page()
    page.set_default_timeout(30000)
    
    errors = []
    page.on('console', lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type in ('error',) else None)
    
    page.goto(f'{BASE_URL}/admin')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    
    page.fill('#loginUser', 'admin')
    page.fill('#loginPass', 'Admin123!')
    page.click('#doLogin')
    page.wait_for_timeout(3000)
    
    # Check for login error message
    login_error = page.locator('#loginError')
    print(f"loginError visible: {login_error.is_visible()}")
    if login_error.is_visible():
        print(f"loginError text: {login_error.text_content()}")
        print(f"loginError class: {login_error.get_attribute('class')}")
    
    admin_screen = page.locator('#adminScreen')
    print(f"adminScreen visible: {admin_screen.is_visible()}")
    
    print(f"\nConsole errors:")
    for e in errors:
        print(f"  {e}")
    
    page.screenshot(path='/tmp/login_test.png')
    
    ctx.close()
    browser.close()
