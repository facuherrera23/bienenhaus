"""
conftest.py — Fixtures compartidos para tests
"""
import os
import sys
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

@pytest.fixture(scope='session')
def app():
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    os.environ['SECRET_KEY'] = 'test-secret'
    os.environ['FLASK_DEBUG'] = 'false'
    os.environ['ADMIN_PASSWORD'] = 'Admin2026!'
    os.environ['RATELIMIT_ENABLED'] = 'false'
    from app import create_app
    application = create_app()
    with application.app_context():
        from extensions import db
        db.create_all()
        from auth_helper import seed_admin_user
        seed_admin_user()
        yield application
        db.drop_all()

@pytest.fixture
def client(app):
    with app.app_context():
        from extensions import db
        from models import User
        db.session.query(User).update({User.login_attempts: 0, User.locked_until: None})
        db.session.commit()
    return app.test_client()

@pytest.fixture
def db(app):
    from extensions import db
    return db
