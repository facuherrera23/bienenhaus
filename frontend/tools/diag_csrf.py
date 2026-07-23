"""
Server-side diagnostic: monkey-patch csrf.validate_token to log session state.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import create_app

app = create_app()

# Monkey-patch validate_token to log
import csrf
_orig_validate = csrf.validate_token
def _patched_validate(token):
    from flask import session
    stored = session.get('csrf_tokens', [])
    cookie = ''
    from flask import request
    result = _orig_validate(token)
    print(f'[CSRF] validate_token(token={token[:20]}...) stored={stored} len={len(stored)} cookie_has_session={"session" in str(request.cookies)} result={result}', file=sys.stderr)
    return result

csrf.validate_token = _patched_validate

# Also monkey-patch generate_token
_orig_generate = csrf.generate_token
def _patched_generate():
    result = _orig_generate()
    from flask import session
    stored = session.get('csrf_tokens', [])
    print(f'[CSRF] generate_token() -> {result[:20]}... stored now has {len(stored)} tokens', file=sys.stderr)
    return result

csrf.generate_token = _patched_generate

print('[DIAG] Server CSRF diagnostic started', file=sys.stderr)
app.run(port=5001, debug=False)
