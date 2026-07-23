"""
diagnose_users_rbac.py — Playwright diagnosis for Módulo 17: RBAC
Usage: python tests/diagnose_users_rbac.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5000'
ADMIN_USER = 'admin'
ADMIN_PASS = 'Admin123!'
SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'screenshots')

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

errors = []

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={'width': 1440, 'height': 900}, ignore_https_errors=True)
        page = ctx.new_page()
        page.on('console', lambda msg: errors.append(f'CONSOLE:{msg.type}:{msg.text}') if msg.type == 'error' else None)
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR:{err}'))
        page.on('response', lambda resp: errors.append(f'HTTP:{resp.status}:{resp.url}') if resp.status >= 400 else None)

        # Login
        page.goto(f'{BASE}/admin', wait_until='networkidle')
        page.fill('#loginUser', ADMIN_USER)
        page.fill('#loginPass', ADMIN_PASS)
        page.click('#doLogin')
        page.wait_for_timeout(2000)

        # Click Users tab
        users_link = page.query_selector('.sidebar-link[data-tab="users"]')
        if not users_link:
            print('[FAIL] Sidebar users link not found')
            browser.close()
            return
        users_link.click()
        page.wait_for_timeout(2000)

        # Screenshot: Dashboard
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm17-dashboard.png'), full_page=True)
        print('[OK] Screenshot: dashboard tab')

        # Subtabs
        subtabs = page.query_selector_all('.rbac-subtab')
        if subtabs:
            print(f'  Subtabs found: {len(subtabs)}')
            for st in subtabs:
                print(f'    - {st.text_content().strip()}')
        else:
            print('[WARN] No subtabs found')

        # KPIs
        kpis = page.query_selector_all('.rbac-kpi-card')
        print(f'  KPI cards: {len(kpis)}')

        # Dashboard content
        stg_cards = page.query_selector_all('#rbacContent .stg-card')
        print(f'  Dashboard cards: {len(stg_cards)}')

        # ── Usuarios subtab ──
        usr_btn = page.query_selector('.rbac-subtab[data-rbac-tab="usuarios"]')
        if usr_btn:
            usr_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm17-usuarios.png'), full_page=True)
            print('[OK] Screenshot: usuarios tab')
            user_rows = page.query_selector_all('.rbac-user-row')
            print(f'  User rows: {len(user_rows)}')
            # Test user form modal
            new_user_btn = page.query_selector('button[onclick*="rbacOpenUserForm"]')
            if new_user_btn:
                new_user_btn.click()
                page.wait_for_timeout(500)
                modal = page.query_selector('#rbacUserFormModal')
                if modal and not modal.is_hidden():
                    print('[OK] User form modal opens')
                    modal.query_selector('.modal-close').click()
                else:
                    print('[WARN] User form modal did not open')
            # Test side panel
            first_user = page.query_selector('.rbac-user-row')
            if first_user:
                first_user.click()
                page.wait_for_timeout(1000)
                panel = page.query_selector('#rbacPanel')
                if panel and 'open' in (panel.get_attribute('class') or ''):
                    print('[OK] Side panel opens on user click')
                    page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm17-user-panel.png'), full_page=True)
                    close_btn = page.query_selector('#rbacPanel .rbac-panel-close')
                    if close_btn:
                        close_btn.click()
                        page.wait_for_timeout(500)
                else:
                    print('[WARN] Side panel did not open')
        else:
            print('[WARN] Usuarios subtab not found')

        # ── Roles subtab ──
        roles_btn = page.query_selector('.rbac-subtab[data-rbac-tab="roles"]')
        if roles_btn:
            roles_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm17-roles.png'), full_page=True)
            print('[OK] Screenshot: roles tab')
            role_cards = page.query_selector_all('.rbac-role-card')
            print(f'  Role cards: {len(role_cards)}')
            # Test role form modal
            new_role_btn = page.query_selector('button[onclick*="rbacOpenRoleForm"]')
            if new_role_btn:
                new_role_btn.click()
                page.wait_for_timeout(500)
                modal = page.query_selector('#rbacRoleFormModal')
                if modal and not modal.is_hidden():
                    print('[OK] Role form modal opens')
                    modal.query_selector('.modal-close').click()
                else:
                    print('[WARN] Role form modal did not open')
        else:
            print('[WARN] Roles subtab not found')

        # ── Permisos subtab ──
        perms_btn = page.query_selector('.rbac-subtab[data-rbac-tab="permisos"]')
        if perms_btn:
            perms_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm17-permisos.png'), full_page=True)
            print('[OK] Screenshot: permisos tab')
            perm_modules = page.query_selector_all('.rbac-perm-module')
            print(f'  Permission modules: {len(perm_modules)}')
            perm_items = page.query_selector_all('.rbac-perm-item')
            print(f'  Permission items: {len(perm_items)}')
        else:
            print('[WARN] Permisos subtab not found')

        # ── Invitaciones subtab ──
        inv_btn = page.query_selector('.rbac-subtab[data-rbac-tab="invitaciones"]')
        if inv_btn:
            inv_btn.click()
            page.wait_for_timeout(1000)
            print('[OK] Invitaciones tab loaded')
            invite_rows = page.query_selector_all('.rbac-invite-row')
            print(f'  Invite rows: {len(invite_rows)}')
        else:
            print('[WARN] Invitaciones subtab not found')

        # ── Sesiones subtab ──
        sess_btn = page.query_selector('.rbac-subtab[data-rbac-tab="sesiones"]')
        if sess_btn:
            sess_btn.click()
            page.wait_for_timeout(1000)
            print('[OK] Sesiones tab loaded')
            session_rows = page.query_selector_all('.rbac-session-row')
            print(f'  Session rows: {len(session_rows)}')
        else:
            print('[WARN] Sesiones subtab not found')

        # ── Auditoría subtab ──
        aud_btn = page.query_selector('.rbac-subtab[data-rbac-tab="auditoria"]')
        if aud_btn:
            aud_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'm17-auditoria.png'), full_page=True)
            print('[OK] Screenshot: auditoría tab')
            audit_items = page.query_selector_all('.rbac-audit-item')
            print(f'  Audit items: {len(audit_items)}')
        else:
            print('[WARN] Auditoría subtab not found')

        # Console errors
        if errors:
            print(f'\n  Console errors ({len(errors)}):')
            for e in errors[:5]:
                print(f'    {e}')
        else:
            print('\n  No console errors.')

        browser.close()
        print('\n[OK] RBAC diagnosis complete.')

if __name__ == '__main__':
    main()
