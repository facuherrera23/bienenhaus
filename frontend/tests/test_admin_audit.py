"""
test_admin_audit.py — Auditoría completa del panel admin
Navega TODOS los tabs del sidebar automáticamente, captura errores de consola,
verifica visibilidad de cada sección. Falla si algún tab no carga su contenido.
"""
import os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / 'backend'))
from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:5000'
ADMIN_USER = 'admin'
# Leer contraseña desde .env, fallback a Admin123!
_env_file = Path(__file__).resolve().parent.parent.parent / '.env'
if _env_file.exists():
    for _line in _env_file.read_text(encoding='utf-8').splitlines():
        if _line.strip().startswith('ADMIN_PASSWORD='):
            ADMIN_PASS = _line.split('=', 1)[1].strip()
            break
    else:
        ADMIN_PASS = 'Admin123!'
else:
    ADMIN_PASS = 'Admin123!'

results = []

def log(mod, status, msg):
    results.append({'module': mod, 'status': status, 'message': msg})

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = ctx.new_page()
        page.set_default_timeout(20000)

        # Capture console errors + failed HTTP responses
        console_errors = []
        api_errors = []
        page.on('console', lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ('error', 'warning') else None)
        page.on('response', lambda resp: api_errors.append(f"FAIL {resp.status} {resp.url}") if resp.status >= 400 else None)

        # ── Login ──
        print("Logging in...")
        page.goto(f'{BASE_URL}/admin')
        page.wait_for_load_state('networkidle')
        page.fill('#loginUser', ADMIN_USER)
        page.fill('#loginPass', ADMIN_PASS)
        page.click('#doLogin')
        page.wait_for_selector('#adminScreen:not(.hidden)', state='visible', timeout=15000)
        page.wait_for_timeout(3000)
        log('login', 'OK', 'Login exitoso, admin panel visible')

        # ── Validate no duplicate class attributes in rendered HTML ──
        dup_classes = page.evaluate(r'''() => {
            const all = document.querySelectorAll('#adminScreen *');
            const dupes = [];
            const re = /class="[^"]*"\s{2,}class="/;
            for (const el of all) {
                if (re.test(el.outerHTML)) dupes.push(el.tagName + (el.id ? '#' + el.id : '') + ('.' + Array.from(el.classList).join('.')));
            }
            return dupes;
        }''')
        if dup_classes:
            print(f"\n⚠ DUPLICATE CLASS ATTRIBUTES DETECTED ({len(dup_classes)}):")
            for d in dup_classes:
                print(f"  - {d}")
            log('duplicate-classes', 'FAIL', f'{len(dup_classes)} elementos con class duplicado: {", ".join(dup_classes[:5])}')
        else:
            log('duplicate-classes', 'OK', 'Sin atributos class duplicados en el DOM renderizado')

        # ── Auto-discover tabs from sidebar ──
        tabs = page.evaluate('''() => {
            const links = document.querySelectorAll('.sidebar-link[data-tab]');
            return Array.from(links).map(el => ({
                tab: el.dataset.tab,
                sectionId: 'tab' + el.dataset.tab
                    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
                    .replace(/^[a-z]/, c => c.toUpperCase()),
                visible: el.offsetParent !== null,
                role: el.dataset.role || 'all'
            }));
        }''')
        print(f"Discovered {len(tabs)} tabs from sidebar")

        # ── Test each tab ──
        passed = 0
        failed = 0
        for t in tabs:
            tab_name = t['tab']
            section_id = t['sectionId']
            print(f"\n  [{tab_name}] ", end='')

            if not t['visible']:
                log(tab_name, 'SKIP', f'Tab oculto (sidebar link no visible, role={t["role"]})')
                print('SKIP (hidden)')
                continue

            tab_console_before = len(console_errors)
            tab_api_before = len(api_errors)

            try:
                link = page.locator(f'.sidebar-link[data-tab="{tab_name}"]')
                link.first.click()
                page.wait_for_timeout(3000)
                page.wait_for_load_state('networkidle', timeout=15000)
            except Exception as e:
                log(tab_name, 'FAIL', f'Error al hacer click en tab: {e}')
                print('FAIL (click error)')
                failed += 1
                continue

            # Check if section is visible
            section = page.locator(f'#{section_id}')
            try:
                section.wait_for(state='visible', timeout=10000)
            except:
                pass

            section_visible = section.is_visible()
            content_text = section.text_content() or ''
            has_content = len(content_text.strip()) > 50

            tab_errors = console_errors[tab_console_before:]
            tab_api_fails = api_errors[tab_api_before:]

            if not section_visible:
                log(tab_name, 'FAIL', f'Seccion #{section_id} no visible')
                print('FAIL (not visible)')
                failed += 1
            elif tab_errors or tab_api_fails:
                issues = []
                for e in tab_errors[:3]:
                    issues.append(e)
                for f in tab_api_fails[:3]:
                    issues.append(f)
                log(tab_name, 'WARN', f'Cargo pero con {len(tab_errors)} errores de consola y {len(tab_api_fails)} fallos de API. {"; ".join(issues[:3])}')
                print('WARN')
                passed += 1
            elif not has_content:
                log(tab_name, 'EMPTY', f'Seccion visible pero vacia (sin datos)')
                print('EMPTY')
                passed += 1
            else:
                log(tab_name, 'OK', f'Cargo correctamente con contenido visible')
                print('OK')
                passed += 1

        # ── Summary ──
        print("\n" + "="*60)
        print("           AUDIT REPORT - ADMIN PANEL          ")
        print("="*60)
        ok = sum(1 for r in results if r['status'] == 'OK')
        warn = sum(1 for r in results if r['status'] == 'WARN')
        fail = sum(1 for r in results if r['status'] == 'FAIL')
        empty = sum(1 for r in results if r['status'] == 'EMPTY')
        skip = sum(1 for r in results if r['status'] == 'SKIP')
        print(f"OK: {ok} | WARN: {warn} | FAIL: {fail} | EMPTY: {empty} | SKIP: {skip}")
        print()
        for r in results:
            print(f"  [{r['status']}] [{r['module']}] {r['message']}")

        print(f"\nTotal console errors: {len(console_errors)}")
        print(f"Total API failures: {len(api_errors)}")

        relevant_errors = [e for e in console_errors if 'favicon' not in e.lower() and 'extension' not in e.lower()]
        if relevant_errors:
            print(f"\nRelevant console errors ({len(relevant_errors)}):")
            for e in relevant_errors[:20]:
                print(f"  - {e}")

        ctx.close()
        browser.close()

        # Exit with error code if any tab failed
        if fail > 0:
            sys.exit(1)

if __name__ == '__main__':
    run()
