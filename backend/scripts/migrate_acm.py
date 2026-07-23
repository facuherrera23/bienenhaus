"""
migrate_acm.py — Crea/migra tablas ACM (appraisals, comparables, appraisal_logs)
en la base de datos de producción.

Uso: python scripts/migrate_acm.py
"""
import sys, os
import logging
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger(__name__)

from flask import Flask
from extensions import db
from sqlalchemy import inspect, text

from models import Appraisal, Comparable, AppraisalLog

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

    # ── 1. Crear tablas que falten (appraisals, comparables, appraisal_logs) ──
    db.create_all()
    logger.info("Tablas creadas/verificadas.")

    # ── 2. Agregar columnas faltantes a appraisals ──
    existing_cols = {c['name'] for c in inspector.get_columns('appraisals')}
    model_cols = {c.name for c in Appraisal.__table__.columns}
    missing = model_cols - existing_cols

    if missing:
        logger.info("Agregando %s columnas a appraisals...", len(missing))
        conn = db.engine.connect()
        for col_name in sorted(missing):
            col = Appraisal.__table__.columns[col_name]
            col_type = col.type.compile(db.engine.dialect)
            nullable = 'NULL' if col.nullable else 'NOT NULL'
            default = ''
            if col.default is not None:
                dv = col.default.arg
                if isinstance(dv, bool):
                    default = f" DEFAULT {'TRUE' if dv else 'FALSE'}"
                elif isinstance(dv, (int, float)):
                    default = f" DEFAULT {dv}"
                elif isinstance(dv, str):
                    default = f" DEFAULT '{dv}'"
            sql = f'ALTER TABLE appraisals ADD COLUMN "{col_name}" {col_type} {nullable}{default}'
            try:
                conn.execute(text(sql))
                logger.info("  + %s", col_name)
            except Exception as e:
                logger.warning("  ! %s: %s", col_name, e)
        conn.commit()
        conn.close()
    else:
        logger.info("appraisals: todas las columnas presentes.")

    # ── 3. Verificar estado final ──
    for table in ['appraisals', 'comparables', 'appraisal_logs']:
        if inspector.has_table(table):
            cols = [c['name'] for c in inspector.get_columns(table)]
            logger.info("  ✓ %s: %s columnas", table, len(cols))
        else:
            logger.warning("  ✗ %s: NO EXISTE", table)

logger.info("Migración ACM completada.")
