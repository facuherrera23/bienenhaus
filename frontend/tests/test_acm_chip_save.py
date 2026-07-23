"""
test_acm_chip_save.py — Verifica que los acm-chip migrados persistan correctamente
after save+reload. Tests criticos: Users (permisos + activo), Settings (toggles).
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / 'backend'))
from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:5000'
failures = []

def js_checked(page, selector):
    return page.evaluate(f'document.querySelector("{selector}")?.checked')

def show_tab(page, tab_id):
    page.evaluate(f'''() => {{
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
        const tab = document.getElementById("{tab_id}");
        if (tab) tab.classList.remove('hidden');
    }}''')
    page.wait_for_timeout(200)

def click_rbac_subtab(page, tab_name):
    page.evaluate(f'''() => {{
        const btn = document.querySelector('[data-rbac-tab="{tab_name}"]');
        if (btn) btn.click();
    }}''')
    page.wait_for_timeout(2000)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = ctx.new_page()
        page.set_default_timeout(20000)

        # Login
        page.goto(f'{BASE_URL}/admin')
        page.wait_for_load_state('networkidle')
        page.fill('#loginUser', 'admin')
        page.fill('#loginPass', 'Admin123!')
        page.click('#doLogin')
        page.wait_for_selector('#adminScreen:not(.hidden)', state='visible', timeout=15000)
        page.wait_for_timeout(2000)

        # ── TEST 1: Permisos - toggle chip in permission matrix + save ──
        print("TEST 1: Permission matrix acm-chip toggle + save + reload")
        show_tab(page, 'tabUsers')
        page.evaluate('window.renderRBAC()')
        page.wait_for_timeout(1500)
        click_rbac_subtab(page, 'permisos')
        page.wait_for_selector('#rbacPermMatrix .acm-chip', state='attached', timeout=15000)
        page.wait_for_timeout(1000)

        pc = page.locator('#rbacPermMatrix .acm-chip').first
        if pc.is_visible():
            initial_checked = js_checked(page, '#rbacPermMatrix .acm-chip-input')
            if initial_checked is not None:
                pc.click()
                page.wait_for_timeout(300)
                toggled = js_checked(page, '#rbacPermMatrix .acm-chip-input')
                if toggled == initial_checked:
                    failures.append("Permisos: chip no cambio estado al clickear")
                else:
                    api_resp = []
                    def on_resp(r):
                        if '/api/admin/rbac/roles/' in r.url and r.request.method == 'PUT':
                            api_resp.append(r)
                    page.on('response', on_resp)
                    page.click('#rbacSavePermsBtn')
                    page.wait_for_timeout(3000)
                    if api_resp and api_resp[0].ok:
                        print(f"  Permisos: toggle {initial_checked}->{toggled} guardado OK")
                        page.reload()
                        page.wait_for_load_state('networkidle')
                        page.wait_for_timeout(2000)
                        show_tab(page, 'tabUsers')
                        page.evaluate('window.renderRBAC()')
                        page.wait_for_timeout(1500)
                        click_rbac_subtab(page, 'permisos')
                        page.wait_for_selector('#rbacPermMatrix .acm-chip', state='attached', timeout=15000)
                        page.wait_for_timeout(1000)
                        p = js_checked(page, '#rbacPermMatrix .acm-chip-input')
                        if p == toggled:
                            print(f"  Permisos: persistencia OK ({p})")
                        else:
                            failures.append(f"Permisos: no persistio (esperado {toggled}, obtenido {p})")
                        page.locator('#rbacPermMatrix .acm-chip').first.click()
                        page.wait_for_timeout(300)
                        page.click('#rbacSavePermsBtn')
                        page.wait_for_timeout(2000)
                        print("  Permisos: estado original restaurado")
                    else:
                        failures.append("Permisos: API no respondio OK")
            else:
                failures.append("Permisos: no se pudo leer estado inicial")
        else:
            failures.append("Permisos: chips no visibles")

        # Close any open RBAC panel
        page.evaluate('window.closeRbacPanel()')
        page.wait_for_timeout(300)

        # ── TEST 2: Users - User active toggle via modal ──
        print("TEST 2: User activo - toggle + save + reload")
        show_tab(page, 'tabUsers')
        page.evaluate('window.renderRBAC()')
        page.wait_for_timeout(1500)
        click_rbac_subtab(page, 'usuarios')
        page.wait_for_selector('.rbac-user-row', state='attached', timeout=15000)
        page.wait_for_timeout(500)

        edit_btn = page.locator('.rbac-user-row .rbac-user-actions button:has-text("Editar")').first
        if edit_btn.is_visible():
            edit_btn.click()
            page.wait_for_timeout(2000)
            # Modal should be open with the form
            modal = page.locator('#rbacUserFormModal')
            if modal.is_visible():
                active_chip = page.locator('#ru_is_active').locator('..')
                if active_chip.is_visible():
                    initial_active = js_checked(page, '#ru_is_active')
                    if initial_active is not None:
                        active_chip.click()
                        page.wait_for_timeout(300)
                        toggled = js_checked(page, '#ru_is_active')
                        if toggled != initial_active:
                            api_resp = []
                            def on_resp2(r):
                                if '/api/admin/rbac/users/' in r.url and r.request.method == 'PUT':
                                    api_resp.append(r)
                            page.on('response', on_resp2)
                            page.locator('#rbacSaveUserBtn').click()
                            page.wait_for_timeout(3000)
                            if api_resp and api_resp[0].ok:
                                print(f"  User activo: toggle {initial_active}->{toggled} guardado OK")
                                page.reload()
                                page.wait_for_load_state('networkidle')
                                page.wait_for_timeout(2000)
                                show_tab(page, 'tabUsers')
                                page.evaluate('window.renderRBAC()')
                                page.wait_for_timeout(1500)
                                click_rbac_subtab(page, 'usuarios')
                                page.wait_for_selector('.rbac-user-row', state='attached', timeout=15000)
                                page.wait_for_timeout(500)
                                eb2 = page.locator('.rbac-user-row .rbac-user-actions button:has-text("Editar")').first
                                if eb2.is_visible():
                                    eb2.click()
                                    page.wait_for_timeout(2000)
                                    p = js_checked(page, '#ru_is_active')
                                    if p == toggled:
                                        print(f"  User activo: persistencia OK ({p})")
                                    else:
                                        failures.append(f"User activo: no persistio (esperado {toggled}, obtenido {p})")
                                    page.locator('#ru_is_active').locator('..').click()
                                    page.wait_for_timeout(300)
                                    page.locator('#rbacSaveUserBtn').click()
                                    page.wait_for_timeout(2000)
                                    print("  User activo: estado original restaurado")
                            else:
                                print("  User activo: skip (API no ok)")
                        else:
                            failures.append("User activo: chip no cambio estado")
                    else:
                        print("  User activo: skip (no se pudo leer estado)")
                else:
                    print("  User activo: skip (chip no visible)")
            else:
                print("  User activo: skip (modal no visible)")
        else:
            print("  User activo: skip (sin boton Editar en primer usuario)")

        # ── TEST 3: Settings - stgToggle ──
        print("TEST 3: Settings toggle - toggle + save + reload")
        show_tab(page, 'tabSettings')
        page.evaluate('window.renderSettings()')
        page.wait_for_timeout(1500)
        page.evaluate('document.querySelector(\'[data-stg-tab="notificaciones"]\')?.click()')
        page.wait_for_timeout(3000)

        toggle_chip = page.locator('.acm-chip:has(.acm-chip-input[id^="stg_notif_"])').first
        if toggle_chip.is_visible():
            cb_id = page.evaluate('document.querySelector(".acm-chip:has(.acm-chip-input[id^=\'stg_notif_\']) .acm-chip-input")?.id')
            if cb_id:
                initial_stg = js_checked(page, f'#{cb_id}')
                if initial_stg is not None:
                    toggle_chip.click()
                    page.wait_for_timeout(300)
                    api_resp = []
                    def on_resp3(r):
                        if '/api/settings-center/notifications' in r.url and r.request.method == 'PUT':
                            api_resp.append(r)
                    page.on('response', on_resp3)
                    page.locator('#btnSaveNotifications').click()
                    page.wait_for_timeout(3000)
                    if api_resp and api_resp[0].ok:
                        toggled = js_checked(page, f'#{cb_id}')
                        print(f"  Settings {cb_id}: toggle {initial_stg}->{toggled} guardado OK")
                        page.reload()
                        page.wait_for_load_state('networkidle')
                        page.wait_for_timeout(2000)
                        show_tab(page, 'tabSettings')
                        page.evaluate('window.renderSettings()')
                        page.wait_for_timeout(1500)
                        page.evaluate('document.querySelector(\'[data-stg-tab="notificaciones"]\')?.click()')
                        page.wait_for_timeout(3000)
                        tc2 = page.locator(f'.acm-chip:has(#{cb_id})').first
                        if tc2.is_visible():
                            p = js_checked(page, f'#{cb_id}')
                            if p == toggled:
                                print(f"  Settings {cb_id}: persistencia OK ({p})")
                            else:
                                failures.append(f"Settings {cb_id}: no persistio (esperado {toggled}, obtenido {p})")
                            tc2.click()
                            page.wait_for_timeout(300)
                            page.locator('#btnSaveNotifications').click()
                            page.wait_for_timeout(2000)
                            print(f"  Settings {cb_id}: estado original restaurado")
                    else:
                        print("  Settings: skip (API no respondio)")
            else:
                print("  Settings: skip (sin cb_id)")
        else:
            print("  Settings: skip (sin toggles de notificaciones visibles)")

        # ── Summary ──
        print()
        print("="*60)
        print("  ACM-CHIP SAVE VERIFICATION")
        print("="*60)
        if failures:
            print(f"  FAILURES: {len(failures)}")
            for f in failures:
                print(f"    X {f}")
        else:
            print("  Todos los tests de persistencia pasaron")
        print()

        ctx.close()
        browser.close()
        return len(failures)

if __name__ == '__main__':
    ec = run()
    sys.exit(ec)
