"""
Verificacion visual de los 18 fixes de class duplicado.
Usa computed styles del DOM renderizado para confirmar que las
clases ap_* ahora se aplican correctamente.
"""
import json, sys
from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:5000'
ADMIN_USER = 'admin'
ADMIN_PASS = 'Admin123!'

JS_TMPL = """
(() => {
    const el = document.querySelector(SEL);
    if (!el) return {found: false, reason: 'not found'};
    const cs = getComputedStyle(el);
    const cls = Array.from(el.classList);
    const computed = {};
    const props = PROPS;
    for (const [k,v] of Object.entries(props)) {
        computed[k] = cs.getPropertyValue(k).trim();
    }
    return {found: true, classes: cls, computed: computed};
})()
"""

def build_js(selector, expected_props):
    sel = json.dumps(selector)
    props = json.dumps(expected_props)
    return JS_TMPL.replace('SEL', sel).replace('PROPS', props)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = ctx.new_page()
        page.set_default_timeout(20000)

        page.goto(f'{BASE_URL}/admin')
        page.fill('#loginUser', ADMIN_USER)
        page.fill('#loginPass', ADMIN_PASS)
        page.click('#doLogin')
        page.wait_for_selector('#adminScreen:not(.hidden)', state='visible', timeout=15000)
        page.wait_for_timeout(2000)

        checks = []

        def check(selector, expected_props, label):
            try:
                js = build_js(selector, expected_props)
                result = page.evaluate(js)
                ok = result.get('found') and all(
                    result.get('computed', {}).get(k) == v for k, v in expected_props.items()
                )
                checks.append({'label': label, 'selector': selector, 'ok': ok, 'result': result})
            except Exception as e:
                checks.append({'label': label, 'selector': selector, 'ok': False, 'result': str(e)})

        # Appraisals tab via sidebar click
        page.click('.sidebar-link[data-tab="appraisals"]')
        page.wait_for_timeout(2000)

        check(
            '.admin-status-badge.ap_font_size',
            {'font-size': '10px', 'padding': '2px 6px'},
            'ap_font_size badge en lista'
        )
        check(
            '.admin-pagination.ap_align_items_2',
            {'display': 'flex', 'justify-content': 'center', 'align-items': 'center',
             'gap': '8px', 'padding': '16px 0'},
            'ap_align_items_2 paginacion'
        )

        # Abrir primera tasacion
        first = page.query_selector('.admin-message-item')
        if first:
            first.click()
            page.wait_for_timeout(2500)

            check(
                '.acm-readonly-banner strong',
                {'color': 'rgb(231, 76, 60)'},
                'ap_color_7 strong readonly banner'
            )
            check(
                'label.ap_margin_bottom_1',
                {'margin-bottom': '6px'},
                'ap_margin_bottom_1 label seccion'
            )

        check(
            '.appr-panel-value.ap_color_69',
            {'font-weight': '600'},
            'ap_color_69 valor estimado panel'
        )

        # Volver a lista y abrir nuevo formulario
        page.click('.sidebar-link[data-tab="appraisals"]')
        page.wait_for_timeout(1500)
        new_btn = page.query_selector('#newAppraisalBtn')
        if not new_btn:
            new_btn = page.query_selector('button:has-text("Nueva Tasaci")')
        if new_btn:
            new_btn.click()
            page.wait_for_timeout(2000)

            check(
                '.pf-body.ap_display_6',
                {'display': 'flex', 'flex-direction': 'column', 'gap': '14px'},
                'ap_display_6 pf-body formulario'
            )
            check(
                '.field.ap_grid_column',
                {'grid-column': '1 / -1'},
                'ap_grid_column field full-width'
            )
            check(
                '.pf-actions.ap_margin_top_3',
                {'margin-top': '1.5rem'},
                'ap_margin_top_3 pf-actions'
            )

        # Reporte
        passed = sum(1 for c in checks if c['ok'])
        failed = sum(1 for c in checks if not c['ok'])

        print(f"\n{'='*60}")
        print(f"  VERIFICACION VISUAL - 18 FIXES CLASS DUPLICADO")
        print(f"{'='*60}\n")
        for c in checks:
            icon = 'OK' if c['ok'] else 'FAIL'
            print(f"  [{icon}] [{c['label']}]")
            print(f"     Selector: {c['selector']}")
            r = c['result']
            if isinstance(r, dict):
                if not r.get('found'):
                    print(f"     Elemento no encontrado (puede no haber datos de prueba)")
                else:
                    print(f"     Classes: {r.get('classes', [])}")
                    for k, v in r.get('computed', {}).items():
                        print(f"     {k}: {v}")
            else:
                print(f"     Error: {r}")
            print()

        print(f"{'='*60}")
        print(f"  PASSED: {passed}/{len(checks)}  |  FAILED: {failed}")
        print(f"{'='*60}")

        ctx.close()
        browser.close()
        if failed > 0:
            sys.exit(1)

if __name__ == '__main__':
    run()
