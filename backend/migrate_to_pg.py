"""
migrate_to_pg.py — Migración de datos desde SQLite a PostgreSQL

Uso:
  1. Asegurate de tener PostgreSQL corriendo y la base creada.
  2. Seteá DATABASE_URL en .env apuntando a tu PostgreSQL.
  3. Ejecutá:  python migrate_to_pg.py

  La migración respeta el orden y las dependencias entre tablas.
  Al final muestra un resumen de filas migradas.
"""
import os
import sys
import json

# ── Asegurar que el directorio raíz esté en el path ────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from flask import Flask
from extensions import db
from models import Property, Agent, Settings, ContactMessage
from sqlalchemy import inspect, text


def create_sqlite_app():
    """App temporal conectada al SQLite existente."""
    app = Flask(__name__)
    sqlite_path = os.path.join(os.path.dirname(__file__), 'bienenhaus.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{sqlite_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app


def create_pg_app():
    """App temporal conectada a PostgreSQL vía DATABASE_URL."""
    pg_url = os.getenv('DATABASE_URL')
    if not pg_url:
        user = os.getenv('PGUSER', 'postgres')
        pw   = os.getenv('PGPASSWORD', 'postgres')
        host = os.getenv('PGHOST', 'localhost')
        port = os.getenv('PGPORT', '5432')
        name = os.getenv('PGDATABASE', 'bienenhaus')
        pg_url = f'postgresql://{user}:{pw}@{host}:{port}/{name}'
    if pg_url.startswith('postgres://'):
        pg_url = pg_url.replace('postgres://', 'postgresql://', 1)

    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = pg_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app


def copy_table(src, dst, model, transform=None):
    """Copia todas las filas de src a dst usando el modelo SQLAlchemy."""
    rows = model.query.all()
    count = 0
    for row in rows:
        data = row.to_dict() if hasattr(row, 'to_dict') else {c.name: getattr(row, c.name) for c in row.__table__.columns}
        if transform:
            data = transform(data, row)
        new = model()
        for col in model.__table__.columns:
            if col.name in data:
                setattr(new, col.name, data[col.name])
        db.session.add(new)
        count += 1
    db.session.commit()
    return count


def main():
    print('═' * 60)
    print('  Migración SQLite → PostgreSQL — Bienenhaus Propiedades')
    print('═' * 60)

    # ── 1. Leer desde SQLite ──────────────────────────────────────────
    print('\n[1/3] Leyendo datos desde SQLite...')
    sqlite_app = create_sqlite_app()
    sqlite_data = {}

    with sqlite_app.app_context():
        inspector = inspect(db.engine)
        tables = [
    t[0]
    for t in inspector.get_sorted_table_and_fkc_names()
    if t[0] in ('settings', 'properties', 'agents', 'contact_messages')
]
    
        print(f'  Tablas encontradas: {", ".join(tables)}')

        for table in tables:
            result = db.session.execute(text(f'SELECT * FROM {table}'))
            rows = [dict(r._mapping) for r in result]
            sqlite_data[table] = rows
            print(f'  → {table}: {len(rows)} filas')

    # ── 2. Escribir en PostgreSQL ─────────────────────────────────────
    print('\n[2/3] Conectando a PostgreSQL...')
    pg_app = create_pg_app()

    with pg_app.app_context():
        # Crear tablas si no existen
        db.create_all()
        print('  Tablas creadas/verificadas.')

        # Vaciar tablas existentes (en orden inverso por claves foráneas)
        for table in reversed(['contact_messages', 'agents', 'properties', 'settings']):
            db.session.execute(text(f'DELETE FROM {table}'))
        db.session.commit()

        # ── Settings ────────────────────────────────────────────────
        print('\n  Migrando settings...')
        for row in sqlite_data.get('settings', []):
            s = Settings(key=row['key'], value=row.get('value', ''))
            db.session.add(s)
        db.session.commit()
        print(f'  ✓ {len(sqlite_data.get("settings", []))} settings')

        # ── Properties ──────────────────────────────────────────────
        print('  Migrando properties...')
        for row in sqlite_data.get('properties', []):
            p = Property(
                title       = row['title'],
                type        = row.get('type', 'casa'),
                location    = row.get('location', ''),
                price       = float(row.get('price', 0)),
                beds        = int(row.get('beds', 0)),
                baths       = int(row.get('baths', 0)),
                sqm         = float(row.get('sqm', 0)),
                status      = row.get('status', 'disponible'),
                featured    = bool(row.get('featured', False)),
                description = row.get('description', '') or '',
                views       = int(row.get('views', 0)),
                created_at  = row.get('created_at') if row.get('created_at') else None,
            )
            # Manejar images_json y daily_views_json
            if 'images_json' in row:
                p.images_json = row['images_json'] or '[]'
            if 'daily_views_json' in row:
                p.daily_views_json = row['daily_views_json'] or '{}'
            db.session.add(p)
        db.session.commit()
        print(f'  ✓ {len(sqlite_data.get("properties", []))} properties')

        # ── Agents ──────────────────────────────────────────────────
        print('  Migrando agents...')
        for row in sqlite_data.get('agents', []):
            a = Agent(
                name      = row.get('name', ''),
                last      = row.get('last', ''),
                years     = int(row.get('years', 0)),
                specialty = row.get('specialty', ''),
                phone     = row.get('phone', ''),
                whatsapp  = row.get('whatsapp', ''),
                email     = row.get('email', ''),
                avatar    = row.get('avatar', ''),
            )
            db.session.add(a)
        db.session.commit()
        print(f'  ✓ {len(sqlite_data.get("agents", []))} agents')

        # ── ContactMessages ─────────────────────────────────────────
        print('  Migrando contact_messages...')
        for row in sqlite_data.get('contact_messages', []):
            msg = ContactMessage(
                name       = row.get('name', ''),
                email      = row.get('email', ''),
                phone      = row.get('phone', ''),
                message    = row.get('message', ''),
                read       = bool(row.get('read', False)),
                created_at = row.get('created_at') if row.get('created_at') else None,
            )
            db.session.add(msg)
        db.session.commit()
        print(f'  ✓ {len(sqlite_data.get("contact_messages", []))} messages')

    # ── 3. Resumen ───────────────────────────────────────────────────
    print('\n' + '═' * 60)
    total = sum(len(v) for v in sqlite_data.values())
    print(f'  Migración completada. {total} filas migradas a PostgreSQL.')
    print('  ¡Ya podés usar PostgreSQL en desarrollo!')
    print('═' * 60)


if __name__ == '__main__':
    main()
