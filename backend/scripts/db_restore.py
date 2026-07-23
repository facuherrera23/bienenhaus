"""
db_restore.py — Restaura la base de datos desde un backup de db_backup.py.

Uso:
    flask db-restore <url_o_path>          # desde URL de Cloudinary o archivo local
    flask db-restore --dry-run <url>       # solo muestra lo que se restauraria
"""
import os
import json
import gzip
import io
import requests
import click
from datetime import datetime
from flask import current_app
from extensions import db


LEGACY_TABLE_MAP = {
    'messages': 'contact_messages',
    'publications': 'portal_publications',
    'logs': 'portal_logs',
    'queue': 'portal_queue',
}


def get_all_models():
    """Auto-descubre todos los modelos SQLAlchemy registrados."""
    models = {}
    for mapper in db.Model.registry.mappers:
        model = mapper.class_
        if hasattr(model, '__tablename__') and model.__tablename__:
            models[model.__tablename__] = model
    return models


def _resolve_order(table_names):
    """Topological sort basado en FK dependencies (sin dependencias primero)."""
    models = get_all_models()
    deps = {}
    for name in table_names:
        model = models.get(name)
        if not model:
            deps[name] = set()
            continue
        deps[name] = set()
        for col in model.__table__.columns:
            for fk in col.foreign_keys:
                ref_table = fk.column.table.name
                if ref_table in table_names:
                    deps[name].add(ref_table)

    result = []
    remaining = set(table_names)
    while remaining:
        ready = [n for n in remaining if not deps.get(n, set()) & remaining]
        if not ready:
            result.extend(remaining)
            break
        ready.sort()
        for n in ready:
            result.append(n)
            remaining.remove(n)

    return result


def load_backup(source):
    """Descarga/lee el backup y retorna el dict descomprimido."""
    if source.startswith('http://') or source.startswith('https://'):
        click.echo(f'[restore] Descargando {source}...')
        resp = requests.get(source, timeout=120)
        resp.raise_for_status()
        raw = resp.content
    else:
        if not os.path.exists(source):
            raise FileNotFoundError(f'No se encuentra: {source}')
        with open(source, 'rb') as f:
            raw = f.read()

    with gzip.GzipFile(fileobj=io.BytesIO(raw), mode='rb') as f:
        return json.loads(f.read().decode('utf-8'))


def _parse_date_cols(model, row_data):
    """Convierte columnas date/datetime de string a objeto date/datetime."""
    from datetime import date as date_type
    date_cols = {
        col.name: col.type.python_type
        for col in model.__table__.columns
        if hasattr(col.type, 'python_type') and col.type.python_type in (datetime, date_type)
    }
    cols = dict(row_data)
    for col_name, py_type in date_cols.items():
        if col_name in cols and isinstance(cols[col_name], str):
            try:
                parsed = datetime.fromisoformat(cols[col_name])
                cols[col_name] = parsed if py_type is datetime else parsed.date()
            except (ValueError, TypeError):
                pass
    return cols


def restore(app, data, dry_run=False):
    """Restaura datos en la DB. Retorna dict con resultado."""
    models = get_all_models()
    tables = data.get('tables', {})
    summary = {}

    # Resolver nombres legacy de backups v1.0
    resolved_tables = {}
    for key, rows in tables.items():
        actual_name = LEGACY_TABLE_MAP.get(key, key)
        resolved_tables[actual_name] = rows

    # Ordenar por dependencias FK
    table_names = _resolve_order(
        [k for k in resolved_tables.keys() if k in models]
    )

    with app.app_context():
        for table_name in table_names:
            rows = resolved_tables[table_name]
            summary[table_name] = len(rows)
            if not rows:
                continue
            model = models.get(table_name)
            if not model:
                click.echo(f'[restore] Modelo no encontrado para tabla: {table_name}')
                continue

            if dry_run:
                click.echo(f'  [dry-run] {table_name}: {len(rows)} filas')
                continue

            click.echo(f'[restore] {table_name}: {len(rows)} filas...')
            model.query.delete()
            db.session.flush()

            for row_data in rows:
                cols = {k: v for k, v in row_data.items() if hasattr(model, k)}
                cols = _parse_date_cols(model, cols)
                instance = model(**cols)
                db.session.add(instance)

            db.session.commit()
            click.echo(f'  ✓ {table_name}')

    return summary


def run_restore(app, source, dry_run=False):
    """Ejecuta restauración completa."""
    click.echo(f'[restore] Cargando backup desde: {source}')
    data = load_backup(source)

    version = data.get('version', '?')
    created = data.get('created_at', '?')
    tables  = data.get('tables', {})
    total_rows = sum(len(v) for v in tables.values())

    click.echo(f'[restore] Backup v{version} del {created}')
    click.echo(f'[restore] {len(tables)} tablas, {total_rows} filas totales')

    if dry_run:
        click.echo('\n[restore] -- DRY RUN --')
        restore(app, data, dry_run=True)
        click.echo('[restore] -- Fin dry run (nada se modifico) --')
        return {'dry_run': True, 'tables': {k: len(v) for k, v in tables.items()}}

    click.echo('\n[restore] -- Restaurando --')
    summary = restore(app, data)
    click.echo('[restore] -- Restauracion completa --')
    return summary
