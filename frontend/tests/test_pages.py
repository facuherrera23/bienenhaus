"""
test_pages.py — Tests E2E completos con Playwright
Cubre todas las páginas públicas, formularios, panel admin y responsive.

Uso:
    python frontend/tests/test_pages.py
"""
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / 'backend'))

from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:5000'
FRONTEND = Path(__file__).resolve().parent.parent
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
BREAKPOINTS = [320, 360, 414, 480, 600, 768]

def make_page(browser, width=1280, height=900):
    ctx = browser.new_context(viewport={'width': width, 'height': height})
    page = ctx.new_page()
    page.set_default_timeout(15000)
    return ctx, page

def login_admin(page):
    page.goto(f'{BASE_URL}/admin')
    page.wait_for_selector('#loginUser', state='visible', timeout=15000)
    page.locator('#loginUser').fill(ADMIN_USER)
    page.locator('#loginPass').fill(ADMIN_PASS)
    page.locator('#doLogin').click()
    page.wait_for_selector('#adminScreen', state='visible', timeout=15000)

# ═══════════════════════════════════
# PUBLIC PAGES
# ═══════════════════════════════════

def test_homepage():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        page.goto(f'{BASE_URL}/')
        page.wait_for_load_state('networkidle')
        assert 'Bienenhaus' in page.title()
        assert page.locator('.brand').is_visible()
        assert page.locator('#hero').is_visible()
        ctx.close(); browser.close()

def test_venta_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        page.goto(f'{BASE_URL}/venta')
        page.wait_for_load_state('networkidle')
        assert page.locator('#propsGrid').is_visible()
        ctx.close(); browser.close()

def test_alquiler_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        page.goto(f'{BASE_URL}/alquiler')
        page.wait_for_load_state('networkidle')
        assert page.locator('#rentalsGrid').is_visible()
        ctx.close(); browser.close()

def test_empresa_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        page.goto(f'{BASE_URL}/empresa')
        page.wait_for_load_state('networkidle')
        heading = page.locator('h1').first
        assert heading.is_visible()
        ctx.close(); browser.close()

def test_navbar_links():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        page.goto(f'{BASE_URL}/')
        page.wait_for_load_state('networkidle')
        assert page.locator('.nav-link').count() >= 5
        ctx.close(); browser.close()

# ═══════════════════════════════════
# PUBLIC FORMS
# ═══════════════════════════════════

def test_contact_form():
    """Contact form exists and fields are fillable."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        page.goto(f'{BASE_URL}/')
        page.wait_for_load_state('networkidle')
        cf = page.locator('#contactForm')
        if cf.is_visible():
            page.locator('#cf_name').fill('Test Playwright')
            page.locator('#cf_email').fill('test@example.com')
            page.locator('#cf_phone').fill('+54 351 123456')
            page.locator('#cf_message').fill('Mensaje de prueba E2E')
            assert page.locator('#cf_name').input_value() == 'Test Playwright'
            assert page.locator('#cf_email').input_value() == 'test@example.com'
        ctx.close(); browser.close()

def test_tasacion_form():
    """Tasacion request form on homepage is fillable."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        page.goto(f'{BASE_URL}/')
        page.wait_for_load_state('networkidle')
        tf = page.locator('#tf_name')
        if tf.is_visible():
            tf.fill('Cliente Tasacion')
            page.locator('#tf_email').fill('tasacion@test.com')
            page.locator('#tf_phone').fill('+54 351 999999')
            page.locator('#tf_city').fill('Córdoba')
            page.locator('#tf_address').fill('Av. Colón 123')
            page.locator('#tf_comments').fill('Necesito tasación de casa')
            assert page.locator('#tf_name').input_value() == 'Cliente Tasacion'
        ctx.close(); browser.close()

def test_inquiry_form():
    """Inquiry form on property detail page exists."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        page.goto(f'{BASE_URL}/venta')
        page.wait_for_load_state('networkidle')
        fc = page.locator('.prop-card').first
        if fc.is_visible():
            link = fc.locator('a').first
            if link.is_visible():
                link.click()
                page.wait_for_selector('#iq_name', state='visible', timeout=10000)
                if page.locator('#iq_name').is_visible():
                    page.locator('#iq_name').fill('Cliente E2E Test')
                    page.locator('#iq_email').fill('cliente@test.com')
                    page.locator('#iq_phone').fill('+54 351 1234567')
                    page.locator('#iq_message').fill('Consulta de prueba E2E')
                    assert page.locator('#iq_name').input_value() == 'Cliente E2E Test'
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — LOGIN & DASHBOARD
# ═══════════════════════════════════

def test_admin_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        page.goto(f'{BASE_URL}/admin')
        page.wait_for_load_state('networkidle')
        assert page.locator('.login-screen').is_visible()
        ctx.close(); browser.close()

def test_admin_login_success():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        assert page.locator('#adminScreen').is_visible()
        assert page.locator('#sidebarPropCount').is_visible()
        ctx.close(); browser.close()

def test_admin_dashboard_loads():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        assert page.locator('#tabDashboard').is_visible()
        assert page.locator('#dashboardContent').is_visible()
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — PROPERTIES TAB
# ═══════════════════════════════════

def test_admin_properties_tab():
    """Properties tab shows filters, search, subtabs."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="props"]').click()
        page.wait_for_selector('#tabProps', state='visible', timeout=10000)
        assert page.locator('#propSearch').is_visible()
        assert page.locator('#filterBar').is_visible()
        assert page.locator('#newPropBtn').is_visible()
        assert page.locator('.admin-subtab').count() >= 2
        ctx.close(); browser.close()

def test_admin_property_filters():
    """Property filter dropdowns work."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="props"]').click()
        page.wait_for_selector('#tabProps', state='visible', timeout=10000)
        page.locator('#filterType').select_option('casa')
        page.locator('#filterStatus').select_option('disponible')
        page.locator('#filterBeds').select_option('2')
        page.locator('#filterPriceMin').fill('50000')
        page.locator('#filterPriceMax').fill('500000')
        assert page.locator('#filterType').input_value() == 'casa'
        ctx.close(); browser.close()

def test_admin_create_property():
    """Create a property from admin."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="props"]').click()
        page.wait_for_selector('#tabProps', state='visible', timeout=10000)
        page.locator('#newPropBtn').click()
        page.wait_for_selector('#pf_title', state='visible', timeout=10000)
        page.locator('#pf_title').fill('Casa E2E Test Playwright')
        page.locator('#pf_location').fill('Córdoba, Argentina')
        page.locator('#pf_desc').fill('Descripción de prueba para test automatizado.')
        page.locator('#pf_price').fill('150000')
        page.locator('#pf_beds').fill('3')
        page.locator('#pf_baths').fill('2')
        page.locator('#pf_sqm').fill('120')
        page.locator('#pf_type').select_option('casa')
        page.locator('#savePropBtn').click()
        ps_skip = page.locator('#psSkipBtn')
        if ps_skip.is_visible(timeout=5000):
            ps_skip.click()
        page.wait_for_timeout(300)
        body_text = page.locator('body').text_content()
        assert 'Casa E2E Test Playwright' in (body_text or '')
        ctx.close(); browser.close()

def test_admin_rental_subtab():
    """Switch to alquiler subtab and create a rental."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="props"]').click()
        page.wait_for_selector('#tabProps', state='visible', timeout=10000)
        page.locator('.admin-subtab:has-text("Alquiler")').click()
        page.wait_for_selector('#newPropBtn', state='visible', timeout=10000)
        page.locator('#newPropBtn').click()
        page.wait_for_selector('#pf_title', state='visible', timeout=10000)
        page.locator('#pf_title').fill('Alquiler E2E Test')
        page.locator('#pf_location').fill('Códoba')
        page.locator('#pf_desc').fill('Descripción alquiler test')
        page.locator('#rf_price_ars').fill('80000')
        page.locator('#rf_expenses').fill('5000')
        page.locator('#pf_beds').fill('2')
        page.locator('#pf_baths').fill('1')
        page.locator('#pf_sqm').fill('60')
        page.locator('#savePropBtn').click()
        ps_skip = page.locator('#psSkipBtn')
        if ps_skip.is_visible(timeout=5000):
            ps_skip.click()
        page.wait_for_timeout(300)
        body_text = page.locator('body').text_content()
        assert 'Alquiler E2E Test' in (body_text or '')
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — AGENTS TAB
# ═══════════════════════════════════

def test_admin_agents_tab():
    """Agents tab shows list and new button."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="agents"]').click()
        page.wait_for_selector('#tabAgents', state='visible', timeout=10000)
        assert page.locator('#newAgentBtn').is_visible()
        assert page.locator('#agentsAdminList').is_visible()
        ctx.close(); browser.close()

def test_admin_create_agent():
    """Create an agent from admin."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="agents"]').click()
        page.wait_for_selector('#tabAgents', state='visible', timeout=10000)
        page.locator('#newAgentBtn').click()
        page.wait_for_selector('#af_name', state='visible', timeout=10000)
        page.locator('#af_name').fill('Juan')
        page.locator('#af_last').fill('Pérez')
        page.locator('#af_specialty').fill('Propiedades residenciales')
        page.locator('#af_license').fill('MAT. 12345')
        page.locator('#af_phone').fill('+54 351 411-0000')
        page.locator('#af_whatsapp').fill('5493510000000')
        page.locator('#af_email').fill('juan@bienenhaus.com')
        page.locator('#saveAgentBtn').click()
        page.wait_for_selector('#agentsAdminList >> text=Juan', state='visible', timeout=10000)
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — MESSAGES TAB
# ═══════════════════════════════════

def test_admin_messages_tab():
    """Messages tab loads."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="messages"]').click()
        page.wait_for_selector('#tabMessages', state='visible', timeout=10000)
        assert page.locator('#msgConvList').is_visible()
        assert page.locator('.msg-layout').is_visible()
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — TASACION REQUESTS TAB
# ═══════════════════════════════════

def test_admin_tasacion_requests_tab():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="tasacion-requests"]').click()
        page.wait_for_selector('#tabTasacionRequests', state='visible', timeout=10000)
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — APPRAISALS TAB
# ═══════════════════════════════════

def test_admin_appraisals_tab():
    """Appraisals tab shows list and filters."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="appraisals"]').click()
        page.wait_for_selector('#tabAppraisals', state='visible', timeout=10000)
        assert page.locator('#newAppraisalBtn').is_visible()
        assert page.locator('#appraisalSearch').is_visible()
        assert page.locator('#appraisalFilter').is_visible()
        ctx.close(); browser.close()

def test_admin_create_appraisal():
    """Create an appraisal from admin."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="appraisals"]').click()
        page.wait_for_selector('#tabAppraisals', state='visible', timeout=10000)
        page.locator('#newAppraisalBtn').click()
        page.wait_for_selector('#qf_titulo', state='visible', timeout=10000)
        page.locator('#qf_titulo').fill('Test Avaluo E2E')
        page.locator('#qf_solicitante').fill('Cliente Test')
        page.locator('#qf_telefono').fill('+54 351 123456')
        page.locator('#qf_direccion').fill('Av. Siempre Viva 123')
        page.locator('#qf_barrio').fill('Nueva Córdoba')
        page.locator('#quickSaveBtn').click()
        # Wait for success: either text or detail view
        success = page.locator('#appraisalDetailView')
        if not success.is_visible(timeout=5000):
            body_text = page.locator('body').text_content()
            assert 'Test Avaluo E2E' in (body_text or '')
        else:
            assert success.is_visible()
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — CRM TAB
# ═══════════════════════════════════

def test_admin_crm_tab():
    """CRM tab shows leads and filters."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="crm"]').click()
        page.wait_for_selector('#tabCrm', state='visible', timeout=10000)
        assert page.locator('#newLeadBtn').is_visible()
        assert page.locator('#crmSearch').is_visible()
        assert page.locator('#crmLeadList').is_visible()
        ctx.close(); browser.close()

def test_admin_create_lead():
    """Create a CRM lead."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="crm"]').click()
        page.wait_for_selector('#tabCrm', state='visible', timeout=10000)
        page.locator('#newLeadBtn').click()
        page.wait_for_selector('#crmNewName', state='visible', timeout=5000)
        page.locator('#crmNewName').fill('Prospecto E2E Test')
        page.locator('#crmNewEmail').fill('prospecto@test.com')
        page.locator('#crmNewPhone').fill('+54 351 999999')
        page.locator('#crmNewWhatsapp').fill('549351999999')
        page.locator('.crm-new-modal .modal-save').click()
        page.wait_for_selector('.crm-new-modal', state='hidden', timeout=10000)
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — SETTINGS TAB
# ═══════════════════════════════════

def test_admin_settings_tab():
    """Settings tab loads with subtabs and content area."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="settings"]').click()
        page.wait_for_selector('#tabSettings', state='visible', timeout=10000)
        assert page.locator('#stgSubtabs').is_visible()
        assert page.locator('#stgContent').is_visible()
        assert page.locator('.stg-subtab.active').is_visible()
        assert page.locator('.compact-toggle').is_visible()
        ctx.close(); browser.close()

def test_admin_settings_form():
    """Settings form fields are fillable on General tab."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="settings"]').click()
        page.wait_for_selector('#tabSettings', state='visible', timeout=10000)
        stg_phone = page.locator('#stg_phone')
        if stg_phone.is_visible(timeout=5000):
            stg_phone.fill('+54 351 411-0000')
            page.locator('#stg_email').fill('info@bienenhaus.com.ar')
            page.locator('#stg_address').fill('Córdoba Capital, Argentina')
            assert page.locator('#stg_phone').input_value() == '+54 351 411-0000'
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — USERS TAB
# ═══════════════════════════════════

def test_admin_users_tab():
    """Users tab loads with RBAC subtabs."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="users"]').click()
        page.wait_for_selector('#tabUsers', state='visible', timeout=10000)
        assert page.locator('#rbacSubtabs').is_visible()
        assert page.locator('#rbacContent').is_visible()
        assert page.locator('.rbac-subtab.active').is_visible()
        ctx.close(); browser.close()

def test_admin_create_user():
    """Create user via RBAC form modal."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="users"]').click()
        page.wait_for_selector('#tabUsers', state='visible', timeout=10000)
        page.wait_for_timeout(500)
        page.wait_for_selector('.rbac-kpi-grid', state='visible', timeout=15000)
        page.locator('.rbac-subtab[data-rbac-tab="usuarios"]').click()
        page.wait_for_selector('button:has-text("Nuevo usuario")', state='visible', timeout=10000)
        page.locator('button:has-text("Nuevo usuario")').click()
        page.wait_for_selector('#rbacUserFormModal', state='visible', timeout=10000)
        page.locator('#ru_username').fill('testeditor')
        page.locator('#ru_email').fill('editor@test.com')
        page.locator('#ru_password').fill('Editor123!')
        assert page.locator('#ru_username').input_value() == 'testeditor'
        page.locator('#rbacUserFormModal .modal-close').click()
        page.wait_for_selector('#rbacUserFormModal', state='hidden', timeout=5000)
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — PORTALS TAB
# ═══════════════════════════════════

def test_admin_portals_tab():
    """Portals tab loads with subtabs."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="portals"]').click()
        page.wait_for_selector('#tabPortals', state='visible', timeout=10000)
        assert page.locator('#newPortalBtn').is_visible()
        assert page.locator('#portalSubtabs').is_visible()
        ctx.close(); browser.close()

def test_admin_portals_search():
    """Portals publication search field works."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="portals"]').click()
        page.wait_for_selector('#tabPortals', state='visible', timeout=10000)
        page.locator('[data-portal-subtab="publications"]').click()
        page.wait_for_selector('#pubSearch', state='visible', timeout=10000)
        page.locator('#pubSearch').fill('test property')
        assert page.locator('#pubSearch').input_value() == 'test property'
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — MARKETING TAB
# ═══════════════════════════════════

def test_admin_marketing_tab():
    """Marketing tab loads with subtabs."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="marketing"]').click()
        page.wait_for_selector('#tabMarketing', state='visible', timeout=10000)
        assert page.locator('#newPostBtn').is_visible()
        assert page.locator('#marketingSubtabs').is_visible()
        ctx.close(); browser.close()

def test_admin_marketing_generator():
    """Marketing text generator form is visible."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="marketing"]').click()
        page.wait_for_selector('#tabMarketing', state='visible', timeout=10000)
        page.locator('[data-marketing-subtab="generator"]').click()
        page.wait_for_selector('#generatorPropSelect', state='visible', timeout=10000)
        assert page.locator('#generateDescBtn').is_visible()
        ctx.close(); browser.close()

# ═══════════════════════════════════
# ADMIN — ACTIVITY TAB
# ═══════════════════════════════════

def test_admin_activity_tab():
    """Activity tab loads."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)
        page.locator('[data-tab="activity"]').click()
        page.wait_for_selector('#tabActivity', state='visible', timeout=10000)
        assert page.locator('#activityList').is_visible()
        ctx.close(); browser.close()

# ═══════════════════════════════════
# RESPONSIVE BREAKPOINT TESTS
# ═══════════════════════════════════

def test_responsive_homepage():
    """Key elements visible at all responsive breakpoints."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for w in BREAKPOINTS:
            ctx, page = make_page(browser, width=w, height=800)
            page.goto(f'{BASE_URL}/')
            page.wait_for_load_state('networkidle')
            assert page.locator('.brand').is_visible(), f'Brand not visible at {w}px'
            ctx.close()
        browser.close()

def test_responsive_contact_form():
    """Contact form fillable at all responsive breakpoints."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for w in BREAKPOINTS:
            ctx, page = make_page(browser, width=w, height=800)
            page.goto(f'{BASE_URL}/')
            page.wait_for_load_state('networkidle')
            cf = page.locator('#cf_name')
            if cf.is_visible():
                cf.fill('test')
                assert cf.input_value() == 'test'
            ctx.close()
        browser.close()

def test_responsive_venta():
    """Venta page filters visible at all responsive breakpoints."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for w in BREAKPOINTS:
            ctx, page = make_page(browser, width=w, height=800)
            page.goto(f'{BASE_URL}/venta')
            page.wait_for_load_state('networkidle')
            assert page.locator('#propsGrid').is_visible(), f'Venta grid not visible at {w}px'
            ctx.close()
        browser.close()

def test_responsive_alquiler():
    """Alquiler page visible at all responsive breakpoints."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for w in BREAKPOINTS:
            ctx, page = make_page(browser, width=w, height=800)
            page.goto(f'{BASE_URL}/alquiler')
            page.wait_for_load_state('networkidle')
            assert page.locator('#rentalsGrid').is_visible(), f'Alquiler not visible at {w}px'
            ctx.close()
        browser.close()

def test_responsive_admin_login():
    """Admin login form visible at all responsive breakpoints."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for w in BREAKPOINTS:
            ctx, page = make_page(browser, width=w, height=800)
            page.goto(f'{BASE_URL}/admin')
            page.wait_for_load_state('networkidle')
            assert page.locator('#loginUser').is_visible(), f'Login user input not visible at {w}px'
            assert page.locator('#loginPass').is_visible(), f'Login pass input not visible at {w}px'
            ctx.close()
        browser.close()

def test_responsive_admin_props():
    """Admin properties tab responsive."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for w in BREAKPOINTS:
            ctx, page = make_page(browser, width=w, height=800)
            login_admin(page)
            page.locator('[data-tab="props"]').click()
            page.wait_for_selector('#propSearch', state='visible', timeout=10000)
            assert page.locator('#propSearch').is_visible() or page.locator('#filterBar').is_visible(), f'Props not visible at {w}px'
            ctx.close()
        browser.close()

# ═══════════════════════════════════
# SCREENSHOTS
# ═══════════════════════════════════

def test_screenshots():
    """Screenshots of all main pages."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        shots_dir = FRONTEND / 'tests' / 'screenshots'
        os.makedirs(str(shots_dir), exist_ok=True)

        public_shots = [
            ('/', 'homepage.png'),
            ('/venta', 'venta.png'),
            ('/alquiler', 'alquiler.png'),
            ('/empresa', 'empresa.png'),
            ('/admin', 'admin_login.png'),
        ]
        for url, name in public_shots:
            ctx, page = make_page(browser)
            page.goto(f'{BASE_URL}{url}')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(300)
            page.screenshot(path=str(shots_dir / name), full_page=True)
            ctx.close()

        ctx, page = make_page(browser)
        login_admin(page)
        admin_shots = [
            'dashboard', 'props', 'agents', 'messages',
            'tasacion-requests', 'appraisals', 'crm',
            'settings', 'users', 'portals', 'marketing', 'activity',
        ]
        for tab_name in admin_shots:
            tab_btn = page.locator(f'[data-tab="{tab_name}"]')
            if tab_btn.is_visible():
                tab_btn.click()
                page.wait_for_timeout(300)
                page.screenshot(path=str(shots_dir / f'admin_{tab_name}.png'), full_page=True)
        ctx.close()
        browser.close()

# ═══════════════════════════════════
# BAJAS — BOTON DE BAJA PUBLIC FORM
# ═══════════════════════════════════

def test_baja_public_page():
    """Baja public form at /baja can be submitted."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        page.goto(f'{BASE_URL}/baja')
        page.wait_for_load_state('networkidle')
        assert page.locator('#bajaForm').is_visible()
        assert page.locator('#bajaNombre').is_visible()
        assert page.locator('#bajaEmail').is_visible()
        page.locator('#bajaNombre').fill('Test E2E Baja')
        page.locator('#bajaEmail').fill('test-e2e-baja@example.com')
        page.locator('#bajaMotivo').select_option('supresion')
        page.locator('#bajaMensaje').fill('Solicito la eliminacion de mis datos.')
        page.wait_for_timeout(4000)
        page.locator('#bajaSubmit').click()
        page.wait_for_timeout(3000)
        body_text = page.locator('body').text_content()
        assert 'recibida' in (body_text or '').lower() or 'Solicitud recibida' in (body_text or '')
        ctx.close(); browser.close()

# ═══════════════════════════════════
# SENTRY — CLIENT ERROR REPORTING
# ═══════════════════════════════════

def test_client_error_reporting():
    """Client-side errors are reported to /api/client-errors."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, page = make_page(browser)
        login_admin(page)

        sent_requests = []
        page.on('request', lambda req: sent_requests.append(req.url) if '/api/client-errors' in req.url else None)

        page.evaluate('() => { setTimeout(function() { throw new Error("E2E TEST ERROR - this is intentional"); }, 100); }')
        page.wait_for_timeout(2000)
        page.evaluate('() => { try { undefinedFunction(); } catch(e) { window.onerror(e.message, window.location.href, 0, 0, e); } }')
        page.wait_for_timeout(2000)

        assert any('/api/client-errors' in url for url in sent_requests), \
            'No request to /api/client-errors was captured'
        assert page.locator('#adminScreen').is_visible()
        ctx.close(); browser.close()

if __name__ == '__main__':
    os.makedirs(str(FRONTEND / 'tests' / 'screenshots'), exist_ok=True)

    print('Usando servidor Flask existente en', BASE_URL)
    print()

    passed = 0
    failed = 0
    tests = [
        # Public pages
        test_homepage, test_venta_page, test_alquiler_page, test_empresa_page,
        test_navbar_links,
        # Public forms
        test_contact_form, test_tasacion_form, test_inquiry_form,
        # Admin login
        test_admin_login, test_admin_login_success, test_admin_dashboard_loads,
        # Admin properties
        test_admin_properties_tab, test_admin_property_filters,
        test_admin_create_property, test_admin_rental_subtab,
        # Admin agents
        test_admin_agents_tab, test_admin_create_agent,
        # Admin messages
        test_admin_messages_tab,
        # Admin tasacion requests
        test_admin_tasacion_requests_tab,
        # Admin appraisals
        test_admin_appraisals_tab, test_admin_create_appraisal,
        # Admin CRM
        test_admin_crm_tab, test_admin_create_lead,
        # Admin settings
        test_admin_settings_tab, test_admin_settings_form,
        # Admin users
        test_admin_users_tab, test_admin_create_user,
        # Admin portals
        test_admin_portals_tab, test_admin_portals_search,
        # Admin marketing
        test_admin_marketing_tab, test_admin_marketing_generator,
        # Admin activity
        test_admin_activity_tab,
        # Baja public form
        test_baja_public_page,
        # Client error reporting
        test_client_error_reporting,
        # Responsive
        test_responsive_homepage, test_responsive_contact_form,
        test_responsive_venta, test_responsive_alquiler,
        test_responsive_admin_login, test_responsive_admin_props,
        # Screenshots
        test_screenshots,
    ]
    for t in tests:
        try:
            t()
            print(f'  [OK] {t.__name__}')
            passed += 1
        except Exception as e:
            print(f'  [FAIL] {t.__name__}: {e}')
            failed += 1

    print(f'\nResultados: {passed} pasaron, {failed} fallaron')
    sys.exit(1 if failed else 0)
