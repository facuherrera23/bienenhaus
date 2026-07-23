"""Scout: inspect admin page DOM structure for CRM tasks"""
from playwright.sync_api import sync_playwright
import json, sys, time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    
    # Login
    page.goto('http://127.0.0.1:5000/admin')
    page.wait_for_load_state('networkidle')
    print("=== PAGE TITLE:", page.title())
    print("=== CURRENT URL:", page.url)
    
    # Check if login form or already logged in
    content = page.content()
    if 'password' in content.lower() or 'login' in content.lower():
        print("=== LOGIN PAGE ===")
        page.fill('input[type="password"], #password, [name="password"]', 'pzTSPEuPPTb8DjZKajCaRMrv')
        page.click('button[type="submit"], input[type="submit"]')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        print("=== AFTER LOGIN URL:", page.url)
    
    # Now we should be on admin page
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    
    # Save screenshot
    page.screenshot(path='C:\\Users\\facuh\\Desktop\\Dlicias APP\\bienenhaus\\audit_screenshots\\admin_main.png', full_page=True)
    
    # Find CRM-related elements
    for sel in ['#tabCrm', '#sidebarCrm', '[href*="crm"]', '[data-section="crm"]', '.crm-section']:
        els = page.query_selector_all(sel)
        print(f"=== SELECTOR '{sel}': {len(els)} found")
        for e in els[:3]:
            print(f"  tag={e.evaluate('el=>el.tagName')} text='{e.inner_text()[:80]}' visible={e.is_visible()}")
    
    # Find all tab buttons
    tabs = page.query_selector_all('.tab-btn, [class*="tab"], [role="tab"], nav a, .sidebar a')
    print(f"\n=== NAV/TAB elements: {len(tabs)}")
    for t in tabs[:15]:
        if t.is_visible():
            print(f"  text='{t.inner_text()[:60]}' href='{t.get_attribute('href') or ''}'")
    
    browser.close()
