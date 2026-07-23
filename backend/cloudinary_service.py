"""
cloudinary_service.py — Subida y eliminación de imágenes vía Cloudinary
Fallback a disco local si no está configurado.
"""
import os
import io
import uuid
import logging

logger = logging.getLogger(__name__)

_CLOUDINARY_CONFIGURED = False


def init_cloudinary():
    """Inicializa Cloudinary si CLOUDINARY_URL está definida."""
    global _CLOUDINARY_CONFIGURED
    url = os.getenv('CLOUDINARY_URL', '').strip()
    if not url:
        _CLOUDINARY_CONFIGURED = False
        return

    # cloudinary lee CLOUDINARY_URL desde os.environ automáticamente,
    # pero importamos y configuramos explícitamente
    try:
        import cloudinary
        cloudinary.config(cloudinary_url=url)
        _CLOUDINARY_CONFIGURED = True
        logger.info('Cloudinary configurado correctamente.')
    except Exception as e:
        logger.error('Error de configuración de Cloudinary: %s', e)
        _CLOUDINARY_CONFIGURED = False


def is_configured():
    return _CLOUDINARY_CONFIGURED


def upload(file_obj, public_id=None, max_width=1200):
    """
    Sube un archivo a Cloudinary.
    Recibe un file object (Werkzeug FileStorage o similar).
    max_width: dimensión máxima (px) — usar 400 para avatares.
    Retorna dict con 'url' y 'public_id', o None si falla.
    """
    if not _CLOUDINARY_CONFIGURED:
        return None

    try:
        import cloudinary.uploader
        if public_id is None:
            public_id = uuid.uuid4().hex

        result = cloudinary.uploader.upload(
            file_obj,
            public_id=public_id,
            folder='bienenhaus',
            overwrite=True,
            resource_type='image',
            # Transformaciones por defecto
            quality='auto:best',
            fetch_format='auto',
            width=max_width,
            crop='limit',
        )
        return {
            'url': result['secure_url'],
            'public_id': result['public_id'],
        }
    except Exception as e:
        logger.exception('Error al subir imagen a Cloudinary: %s', e)
        return None


def delete(public_id):
    """
    Elimina una imagen de Cloudinary por su public_id.
    Retorna True si se eliminó correctamente, False si falla o no configurado.
    """
    if not _CLOUDINARY_CONFIGURED:
        return False

    try:
        import cloudinary.uploader
        result = cloudinary.uploader.destroy(public_id, resource_type='image')
        return result.get('result') == 'ok'
    except Exception as e:
        logger.exception('Error al eliminar %s de Cloudinary: %s', public_id, e)
        return False


def url_to_public_id(url):
    """
    Convierte una URL de Cloudinary a su public_id.
    Ej: https://res.cloudinary.com/.../bienenhaus/abc.jpg → bienenhaus/abc
    """
    if not url or '/bienenhaus/' not in url:
        return None
    try:
        # La URL tiene formato: .../bienenhaus/public_id.ext
        after_folder = url.split('/bienenhaus/')[1]
        parts = after_folder.rsplit('.', 1)
        return f'bienenhaus/{parts[0]}'
    except Exception:
        return None
