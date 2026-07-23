"""Check font loading on deployed admin page"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.on('console', lambda msg: print(f"[{msg.type}] {msg.text[:200]}"))
    page.on('response', lambda resp: print(f"  {resp.status} {resp.url}") if 'font' in resp.url.lower() or 'css' in resp.url.lower() else None)
    
    page.goto('https://facuherrera23.github.io/bienenhaus-landing/admin.html')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)
    
    # Check if fonts loaded
    fonts_loaded = page.evaluate("""
        () => {
            return document.fonts.ready.then(() => {
                return document.fonts.check('12px Anton') || document.fonts.check('12px Poppins');
            });
        }
    """)
    print(f"\nFont loaded: {fonts_loaded}")
    
    # Check computed style
    body_font = page.evaluate("getComputedStyle(document.body).fontFamily")
    print(f"Body font-family: {body_font}")
    
    page.screenshot(path='C:\\Users\\facuh\\Desktop\\Dlicias APP\\bienenhaus\\audit_screenshots\\deployed_fonts.png')
    browser.close()
