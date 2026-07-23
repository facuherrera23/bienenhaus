import os
import pytest

# Set env vars at module level so any import of app.py (even during collection)
# sees the test-friendly values. Monkeypatch in no_env_deps also overrides
# per-test-function for extra safety.
# Force test-friendly values (override CI env-vars set at step level)
os.environ['SECRET_KEY'] = 'test-secret-key-not-for-prod'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['CSRF_BYPASS'] = '1'

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
