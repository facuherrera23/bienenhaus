import os
import pytest

# Set env vars at module level so any import of app.py (even during collection)
# sees the test-friendly values. Monkeypatch in no_env_deps also overrides
# per-test-function for extra safety.
# Use setdefault to allow CI env vars to take precedence
os.environ.setdefault('SECRET_KEY', 'test-secret-key-not-for-prod')
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('CSRF_BYPASS', '1')
os.environ.setdefault('RATELIMIT_ENABLED', 'false')


@pytest.fixture
def rate_limit_enabled(app):
    """Enable rate limiting for tests that need it."""
    app.config['RATELIMIT_ENABLED'] = True
    yield
    app.config['RATELIMIT_ENABLED'] = False

from extensions import db as _db


@pytest.fixture(scope='session')
def app():
    from app import create_app
    _app = create_app()
    with _app.app_context():
        _db.create_all()
        yield _app
        _db.session.rollback()
        _db.session.remove()
        _db.drop_all()
        _db.engine.dispose()


@pytest.fixture
def client(app):
    with app.test_client() as c:
        yield c


@pytest.fixture
def admin_session(app, client):
    """Simula sesión de admin autenticado."""
    with client.session_transaction() as sess:
        sess['admin'] = True
        sess['user_id'] = 1
        sess['username'] = 'admin'
        sess['role'] = 'admin'
    yield client


@pytest.fixture
def json_headers(admin_session):
    """Headers para requests JSON."""
    return {'Content-Type': 'application/json'}
