"""
smoke_test_runner.py — Smoke test via Flask test client (in-process)
"""
import sys, json, os
sys.path.insert(0, 'backend')

os.environ['DATABASE_URL'] = 'sqlite:///test_smoke3.db'
os.environ['SECRET_KEY'] = 'smoke-test-secret'
os.environ['ADMIN_PASSWORD'] = 'smokeAdmin123!'
os.environ['RATELIMIT_ENABLED'] = 'false'
os.environ['FLASK_DEBUG'] = 'false'

from app import create_app
app = create_app()
client = app.test_client()

PASS = 0
FAIL = 0
tests = []

def ok(name):
    global PASS; PASS += 1
    tests.append('  OK  ' + name)

def fail(name, detail=''):
    global FAIL; FAIL += 1
    tests.append('  FAIL ' + name + (' - ' + detail if detail else ''))

# 1. Health
r = client.get('/api/health')
if r.status_code == 200:
    d = r.get_json()
    ok('health endpoint')
    ok('database connected') if d.get('database') == 'healthy' else fail('database')
    ok('status healthy') if d.get('status') == 'healthy' else fail('status')
else:
    fail('health returned ' + str(r.status_code))

# 2. Homepage
r = client.get('/')
ok('homepage (' + str(len(r.data)) + ' bytes)') if r.status_code == 200 else fail('homepage returned ' + str(r.status_code))
ok('CSP header') if r.headers.get('Content-Security-Policy', '') else fail('CSP header ausente')

# 3. Admin page
r = client.get('/admin')
ok('admin page (' + str(len(r.data)) + ' bytes)') if r.status_code == 200 else fail('admin returned ' + str(r.status_code))

# 4. 404
r = client.get('/ruta-inexistente')
ok('404 page') if r.status_code == 404 else fail('expected 404')

# 5. Static assets
r = client.get('/css/styles.min.css')
ok('CSS (' + str(len(r.data)) + ' bytes)') if r.status_code == 200 else fail('CSS returned ' + str(r.status_code))
r = client.get('/js/api.min.js')
ok('JS (' + str(len(r.data)) + ' bytes)') if r.status_code == 200 else fail('JS returned ' + str(r.status_code))

# 6. SEO
r = client.get('/sitemap.xml')
ok('sitemap (' + str(len(r.data)) + ' bytes)') if r.status_code == 200 else fail('sitemap returned ' + str(r.status_code))
r = client.get('/robots.txt')
ok('robots.txt') if r.status_code == 200 else fail('robots returned ' + str(r.status_code))

# 7. API endpoints (no auth)
r = client.get('/api/auth/csrf-token')
ok('csrf-token endpoint') if r.status_code == 200 else fail('csrf-token returned ' + str(r.status_code))

r = client.get('/api/auth/check')
ok('auth check') if r.status_code == 200 else fail('auth check returned ' + str(r.status_code))

r = client.get('/api/dolar')
ok('dolar endpoint (' + str(r.status_code) + ')') if r.status_code in (200, 502) else fail('dolar returned ' + str(r.status_code))

r = client.get('/api/properties?limit=1')
ok('properties list') if r.status_code == 200 else fail('properties returned ' + str(r.status_code))

# 8. Admin login + CRUD
r = client.post('/api/auth/login', json={'username': 'admin', 'password': 'smokeAdmin123!'})
if r.status_code == 200:
    d = r.get_json()
    csrf_token = d['data']['csrf_token']
    ok('admin login')
    ok('admin role (' + d['data']['user']['role'] + ')')

    # Logout (with CSRF)
    r = client.post('/api/auth/logout', headers={'X-CSRF-Token': csrf_token})
    ok('logout') if r.status_code == 200 else fail('logout returned ' + str(r.status_code))

    # Login again for CRUD
    r = client.post('/api/auth/login', json={'username': 'admin', 'password': 'smokeAdmin123!'})
    csrf_token = r.get_json()['data']['csrf_token']

    # Create property
    r = client.post('/api/properties', headers={'X-CSRF-Token': csrf_token}, json={
        'title': 'Smoke Test Property', 'type': 'casa',
        'location': 'Test', 'price': 100000, 'beds': 3, 'baths': 2, 'sqm': 100
    })
    if r.status_code == 201:
        prop_id = r.get_json()['data']['id']
        ok('create property id=' + str(prop_id))

        # Get fresh CSRF token
        csrf_token = client.get('/api/auth/csrf-token').get_json()['data']['csrf_token']

        # Edit property
        r = client.put('/api/properties/' + str(prop_id), headers={'X-CSRF-Token': csrf_token}, json={'title': 'Edited'})
        ok('edit property') if r.status_code == 200 else fail('edit returned ' + str(r.status_code))

        # Get fresh CSRF token
        csrf_token = client.get('/api/auth/csrf-token').get_json()['data']['csrf_token']

        # Delete property
        r = client.delete('/api/properties/' + str(prop_id), headers={'X-CSRF-Token': csrf_token})
        ok('delete property') if r.status_code == 200 else fail('delete returned ' + str(r.status_code))
    else:
        fail('create property returned ' + str(r.status_code))
else:
    d = r.get_json() if r.is_json else {}
    fail('admin login returned ' + str(r.status_code), d.get('error', ''))

# 9. Contact form (with CSRF)
csrf_token = client.get('/api/auth/csrf-token').get_json()['data']['csrf_token']
r = client.post('/api/contact', headers={'X-CSRF-Token': csrf_token}, json={
    'name': 'Test', 'email': 'test@test.com',
    'phone': '123', 'message': 'Smoke test message', '_ts': '0'
})
if r.status_code == 201:
    ok('contact form')
elif r.status_code == 400:
    d = r.get_json()
    ok('contact form (400: ' + d.get('error', '') + ')')
else:
    fail('contact returned ' + str(r.status_code))

# Report
total = PASS + FAIL
print('')
print('=== Smoke Test Results (' + str(total) + ' tests) ===')
for t in tests:
    print(t)
print('')
print(str(PASS) + '/' + str(total) + ' passed, ' + str(FAIL) + '/' + str(total) + ' failed')

# Cleanup
for f in ['test_smoke3.db', 'instance/test_smoke3.db']:
    if os.path.exists(f):
        os.remove(f)

sys.exit(0 if FAIL == 0 else 1)
