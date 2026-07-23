"""
db_backup.py — Backup de la base de datos a Cloudinary.

Uso:
    flask db-backup                         # backup + subir a Cloudinary
    flask db-backup --no-upload             # solo guardar localmente
"""
import os
import json
import gzip
import io
from datetime import datetime, timedelta, timezone
from flask import current_app
import click


def _serialize_value(v):
    if hasattr(v, 'isoformat'):
        return v.isoformat()
    return v


def _serialize_model(rows):
    if not rows:
        return []
    cols = rows[0].__table__.columns.keys()
    return [{c: _serialize_value(getattr(r, c)) for c in cols} for r in rows]


def _safe_query(model):
    """Retorna filas serializadas de un modelo, o [] si la tabla no existe."""
    try:
        return _serialize_model(model.query.all())
    except Exception as e:
        click.echo(f'[backup] Tabla {model.__tablename__} no disponible, omitida: {e}')
        return []


def get_all_models():
    """Auto-descubre todos los modelos SQLAlchemy registrados."""
    from extensions import db
    models = {}
    for mapper in db.Model.registry.mappers:
        model = mapper.class_
        if hasattr(model, '__tablename__') and model.__tablename__:
            models[model.__tablename__] = model
    return models


def dump_all(app):
    """Retorna bytes gzip del JSON con todas las tablas."""
    with app.app_context():
        all_models = get_all_models()
        tables = {}
        for table_name, model in sorted(all_models.items()):
            tables[table_name] = _safe_query(model)

        data = {
            'version': '2.0',
            'created_at': datetime.utcnow().isoformat(),
            'tables': tables,
        }

    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode='wb') as f:
        f.write(json.dumps(data, ensure_ascii=False, default=str).encode('utf-8'))
    return buf.getvalue()


def _cleanup_old_backups(retention_days=30):
    """Elimina backups en Cloudinary más antiguos que retention_days."""
    try:
        import cloudinary.api
        import cloudinary.uploader
        cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
        result = cloudinary.api.resources(
            type='upload',
            prefix='backups/',
            resource_type='raw',
            max_results=100,
        )
        deleted = 0
        for resource in result.get('resources', []):
            created = resource.get('created_at')
            if created:
                if isinstance(created, str):
                    created = datetime.fromisoformat(created.replace('Z', '+00:00'))
                if created < cutoff:
                    cloudinary.uploader.destroy(resource['public_id'], resource_type='raw')
                    deleted += 1
        if deleted:
            click.echo(f'[backup] Limpieza: {deleted} backup(s) antiguo(s) eliminado(s)')
    except Exception as e:
        click.echo(f'[backup] Error en limpieza de backups antiguos: {e}')


def upload_to_cloudinary(data_bytes):
    """Sube los bytes como archivo raw a Cloudinary. Retorna URL o None."""
    try:
        import sys
        sys.setrecursionlimit(10000)
        import cloudinary.uploader
        filename = f'backup-{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json.gz'
        result = cloudinary.uploader.upload(
            io.BytesIO(data_bytes),
            public_id=f'backups/{filename.rsplit(".", 1)[0]}',
            resource_type='raw',
            overwrite=True,
        )
        return result.get('secure_url')
    except Exception as e:
        click.echo(f'[backup] Error al subir a Cloudinary: {e}')
        return None


def save_local(data_bytes, directory='.'):
    """Guarda backup localmente. Retorna la ruta."""
    os.makedirs(directory, exist_ok=True)
    filename = f'backup-{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json.gz'
    path = os.path.join(directory, filename)
    with open(path, 'wb') as f:
        f.write(data_bytes)
    return path


def run_backup(app, upload=True, local_dir=None):
    """Ejecuta backup completo. Retorna dict con resultado."""
    click.echo('[backup] Dumpando base de datos...')
    data = dump_all(app)
    total_size = len(data)
    click.echo(f'[backup] {total_size:,} bytes comprimidos')

    result = {'size': total_size, 'url': None, 'local_path': None}

    if upload:
        click.echo('[backup] Subiendo a Cloudinary...')
        url = upload_to_cloudinary(data)
        if url:
            result['url'] = url
            click.echo(f'[backup] OK -> {url}')
            _cleanup_old_backups(retention_days=30)
        else:
            click.echo('[backup] Falló subida a Cloudinary')

    if local_dir:
        path = save_local(data, local_dir)
        result['local_path'] = path
        click.echo(f'[backup] Guardado local -> {path}')

    return result
