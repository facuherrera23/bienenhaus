import pytest
from auth_helper import seed_admin_user
from models import User, ActivityLog
from extensions import db


def test_seed_admin_creates_when_missing(app):
    """seed_admin_user() crea el admin si no existe."""
    with app.app_context():
        # Clear any existing admin first - delete activity_logs first due to FK
        admin = User.query.filter_by(username='admin').first()
        if admin:
            ActivityLog.query.filter_by(user_id=admin.id).delete()
            User.query.filter_by(username='admin').delete()
            db.session.commit()
        assert User.query.filter_by(username='admin').first() is None
        seed_admin_user()
        assert User.query.filter_by(username='admin').first() is not None


def test_seed_admin_idempotent(app):
    """seed_admin_user() NO toca el password si el admin ya existe."""
    from flask_bcrypt import Bcrypt
    
    bcrypt = Bcrypt(app)
    with app.app_context():
        # 1. Crear admin
        seed_admin_user()
        
        # 2. Cambiar password manualmente (simula admin que cambió su clave)
        new_hash = bcrypt.generate_password_hash('NuevaPass123!').decode('utf-8')
        user = User.query.filter_by(username='admin').first()
        user.password_hash = new_hash
        db.session.commit()
        
        # 3. Llamar seed_admin_user de nuevo
        seed_admin_user()
        
        # 4. Verificar que el password sigue siendo el cambiado manualmente
        user2 = User.query.filter_by(username='admin').first()
        assert user2.password_hash == new_hash