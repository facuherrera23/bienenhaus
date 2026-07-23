"""
migrate_views.py — Migra daily_views_json → tablas property_views / rental_views
y crea las tablas si no existen.

Uso: python scripts/migrate_views.py
"""
import sys, os, json
import logging
from datetime import datetime, timezone
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger(__name__)

from flask import Flask
from extensions import db
from sqlalchemy import inspect, text

DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    logger.error("DATABASE_URL no configurada. Definir en variables de entorno.")
    sys.exit(1)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DB_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    inspector = inspect(db.engine)

    # ── 1. Crear tablas ──
    from models import PropertyView, RentalView
    db.create_all()
    logger.info("Tablas creadas/verificadas.")

    # ── 2. Migrar property_views ──
    if inspector.has_table('properties'):
        rows = db.session.execute(text(
            "SELECT id, daily_views_json FROM properties WHERE daily_views_json IS NOT NULL AND daily_views_json != '{}'"
        )).fetchall()
        migrated = 0
        for prop_id, dv_json in rows:
            if not dv_json:
                continue
            try:
                dv = json.loads(dv_json)
            except Exception:
                continue
            for date_str, count in dv.items():
                try:
                    date_obj = datetime.strptime(date_str.strip(), '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    continue
                existing = db.session.execute(text(
                    "SELECT id, views FROM property_views WHERE property_id = :pid AND date = :d"
                ), {'pid': prop_id, 'd': date_obj}).fetchone()
                if existing:
                    db.session.execute(text(
                        "UPDATE property_views SET views = views + :cnt WHERE id = :vid"
                    ), {'cnt': count, 'vid': existing[0]})
                else:
                    db.session.execute(text(
                        "INSERT INTO property_views (property_id, date, views, created_at) VALUES (:pid, :d, :cnt, NOW())"
                    ), {'pid': prop_id, 'd': date_obj, 'cnt': count})
                migrated += 1
        db.session.commit()
        logger.info("property_views: %s registros migrados", migrated)
    else:
        logger.warning("properties: tabla no existe")

    # ── 3. Migrar rental_views ──
    if inspector.has_table('rentals'):
        rows = db.session.execute(text(
            "SELECT id, daily_views_json FROM rentals WHERE daily_views_json IS NOT NULL AND daily_views_json != '{}'"
        )).fetchall()
        migrated = 0
        for rental_id, dv_json in rows:
            if not dv_json:
                continue
            try:
                dv = json.loads(dv_json)
            except Exception:
                continue
            for date_str, count in dv.items():
                try:
                    date_obj = datetime.strptime(date_str.strip(), '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    continue
                existing = db.session.execute(text(
                    "SELECT id, views FROM rental_views WHERE rental_id = :rid AND date = :d"
                ), {'rid': rental_id, 'd': date_obj}).fetchone()
                if existing:
                    db.session.execute(text(
                        "UPDATE rental_views SET views = views + :cnt WHERE id = :vid"
                    ), {'cnt': count, 'vid': existing[0]})
                else:
                    db.session.execute(text(
                        "INSERT INTO rental_views (rental_id, date, views, created_at) VALUES (:rid, :d, :cnt, NOW())"
                    ), {'rid': rental_id, 'd': date_obj, 'cnt': count})
                migrated += 1
        db.session.commit()
        logger.info("rental_views: %s registros migrados", migrated)
    else:
        logger.warning("rentals: tabla no existe")

    # ── 4. Verificar ──
    for table in ['property_views', 'rental_views']:
        if inspector.has_table(table):
            cols = [c['name'] for c in inspector.get_columns(table)]
            count = db.session.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            logger.info("  ✓ %s: %s columnas, %s registros", table, len(cols), count)
        else:
            logger.warning("  ✗ %s: NO EXISTE", table)

logger.info("Migración de vistas completada.")
