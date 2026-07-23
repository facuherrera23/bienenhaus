"""
extensions.py — Instancias compartidas de extensiones Flask.
Se importan aquí para evitar importaciones circulares.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db: SQLAlchemy = SQLAlchemy()
bcrypt: Bcrypt = Bcrypt()
migrate: Migrate = Migrate()
limiter: Limiter = Limiter(key_func=get_remote_address, default_limits=["300 per minute"])
