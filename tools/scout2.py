"""Scout 2: inspect CRM DOM after full load"""
from playwright.sync_api import sync_playwright
import os, time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.set_default_timeout(15000)
    
    page.goto('http://127.0.0.1:5000/admin')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    
    # Login
    if 'password' in page.content().lower():
        page.fill('input[type="password"]', 'pzTSPEuPPTb8DjZKajCaRMrv')
        page.click('button[type="submit"]')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
    
    # Click CRM tab
    crm_tab = page.query_selector('#tabCrm')
    if crm_tab:
        crm_tab.click()
    else:
        for t in page.query_selector_all('.tab'):
            if 'CRM' in t.inner_text():
                t.click(); break
    
    # Wait for CRM to fully load
    page.wait_for_timeout(5000)
    
    # Take screenshot
    page.screenshot(path=r'C:\Users\facuh\Desktop\Dlicias APP\bienenhaus\audit_screenshots\scout2.png', full_page=True)
    
    # Dump inner text of CRM section
    crm_el = page.query_selector('#tabCrm')
    if crm_el:
        print("=== CRM TAB INNER TEXT (first 2000 chars) ===")
        print(crm_el.inner_text()[:2000])
    
    # Search for any selectors
    for sel in ['[class*="kanban"]', '[class*="lead"]', '[class*="card"]', 'button:has-text("Nuevo")', '.crm-', '[data-lead]', '[data-id]']:
        els = page.query_selector_all(sel)
        if els:
            print(f"\n=== {sel}: {len(els)} elements ===")
            for e in els[:5]:
                cls = e.get_attribute('class') or ''
                tid = e.get_attribute('id') or ''
                txt = e.inner_text()[:60]
                print(f"  class='{cls[:50]}' id='{tid[:20]}' text='{txt}'")
    
    # Check if there's a refresh button
    refresh = page.query_selector('button:has-text("Actualizar")')
    if refresh:
        print("\nFound refresh button, clicking...")
        refresh.click()
        page.wait_for_timeout(3000)
        page.screenshot(path=r'C:\Users\facuh\Desktop\Dlicias APP\bienenhaus\audit_screenshots\scout2_after_refresh.png')
        crm_el2 = page.query_selector('#tabCrm')
        if crm_el2:
            print("=== AFTER REFRESH ===")
            print(crm_el2.inner_text()[:2000])
    
    browser.close()
