"""
test_smoke_post_deploy.py — Smoke tests post-deploy.

Uso:
    python tests/test_smoke_post_deploy.py <base_url>
    python tests/test_smoke_post_deploy.py http://localhost:5000
    python tests/test_smoke_post_deploy.py https://bienenhaus.onrender.com
"""
import sys
import urllib.request
import urllib.error
import json
import time

PASS = 0
FAIL = 0


def ok(msg):
    global PASS
    PASS += 1
    print(f'  ✓ {msg}')


def fail(msg, detail=''):
    global FAIL
    FAIL += 1
    print(f'  ✗ {msg}' + (f' — {detail}' if detail else ''))


def get(url, expect_status=200):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=15) as r:
            status = r.status
            body = r.read()
            headers = dict(r.headers)
            return status, body, headers
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers)
    except Exception as e:
        return 0, str(e).encode(), {}


def main(base):
    base = base.rstrip('/')
    print(f'\nPost-deploy smoke tests → {base}')
    print('=' * 50)

    # ── Health ────────────────────────────────────────────────────
    print('\n[health]')
    status, body, _ = get(f'{base}/api/health')
    if status == 200:
        data = json.loads(body)
        if data.get('status') == 'healthy':
            ok('health endpoint: healthy')
        else:
            fail('health status not healthy', str(data.get('database', '')))
        if data.get('database') == 'healthy':
            ok('database: connected')
        else:
            fail('database not healthy', str(data.get('database', '')))
    else:
        fail(f'health endpoint returned {status}')

    # ── Homepage ──────────────────────────────────────────────────
    print('\n[homepage]')
    status, body, headers = get(f'{base}/')
    if status == 200:
        ok(f'homepage: {len(body)} bytes')
    else:
        fail(f'homepage returned {status}')
    csp = headers.get('Content-Security-Policy', headers.get('content-security-policy', ''))
    if csp:
        ok('CSP header presente')
    else:
        fail('CSP header ausente')
    if 'nosniff' in headers.get('X-Content-Type-Options', headers.get('x-content-type-options', '')):
        ok('X-Content-Type-Options: nosniff')
    else:
        fail('X-Content-Type-Options ausente')
    if 'DENY' in headers.get('X-Frame-Options', headers.get('x-frame-options', '')):
        ok('X-Frame-Options: DENY')
    else:
        fail('X-Frame-Options ausente')

    # ── Admin ─────────────────────────────────────────────────────
    print('\n[admin]')
    status, body, headers = get(f'{base}/admin')
    if status == 200:
        ok(f'admin page: {len(body)} bytes')
    else:
        fail(f'admin page returned {status}')
    if b'__VAPID_PUBLIC_KEY__' in body:
        fail('VAPID placeholder sin reemplazar (server no inyectó la key)')
    else:
        ok('VAPID key inyectada correctamente')

    # ── 404 ───────────────────────────────────────────────────────
    print('\n[404]')
    status, body, _ = get(f'{base}/ruta-inexistente-xyz', expect_status=404)
    if status == 404:
        ok('404 page for unknown route')
    else:
        fail(f'expected 404, got {status}')

    # ── Static assets ─────────────────────────────────────────────
    print('\n[static]')
    status, body, _ = get(f'{base}/css/styles.min.css')
    if status == 200:
        ok(f'CSS styles.min.css: {len(body)} bytes')
    else:
        fail(f'CSS styles.min.css returned {status}')
    status, body, _ = get(f'{base}/js/api.min.js')
    if status == 200:
        ok(f'JS api.min.js: {len(body)} bytes')
    else:
        fail(f'JS api.min.js returned {status}')

    # ── SEO ───────────────────────────────────────────────────────
    print('\n[seo]')
    status, body, _ = get(f'{base}/sitemap.xml')
    if status == 200:
        ok(f'sitemap.xml: {len(body)} bytes')
    else:
        fail(f'sitemap.xml returned {status}')
    status, body, _ = get(f'{base}/robots.txt')
    if status == 200:
        ok('robots.txt accesible')
    else:
        fail(f'robots.txt returned {status}')
    status, body, _ = get(f'{base}/manifest.json')
    if status == 200:
        ok('manifest.json accesible')
    else:
        fail(f'manifest.json returned {status}')

    # ── API endpoints ─────────────────────────────────────────────
    print('\n[api]')
    status, body, _ = get(f'{base}/api/auth/check')
    if status == 200:
        ok('auth check endpoint')
    else:
        fail(f'auth check returned {status}')
    status, body, _ = get(f'{base}/api/dolar')
    if status == 200:
        ok('dolar endpoint')
    elif status == 502:
        ok('dolar endpoint (stale cache)')
    else:
        fail(f'dolar returned {status}')
    status, body, _ = get(f'{base}/api/properties?limit=1')
    if status == 200:
        ok('properties list endpoint')
    else:
        fail(f'properties returned {status}')

    # ── Report ────────────────────────────────────────────────────
    print('\n' + '=' * 50)
    total = PASS + FAIL
    print(f'Resultados: {PASS}/{total} passed, {FAIL}/{total} failed')
    if FAIL == 0:
        print('TODO OK — smoke tests superados')
    else:
        print(f'{FAIL} fallos — revisar antes de dar por válido el deploy')
    return 0 if FAIL == 0 else 1


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Uso: python tests/test_smoke_post_deploy.py <base_url>')
        print('  python tests/test_smoke_post_deploy.py http://localhost:5000')
        sys.exit(1)
    sys.exit(main(sys.argv[1]))
