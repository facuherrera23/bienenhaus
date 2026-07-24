"""
cloudinary_service.py — Subida y eliminación de imágenes vía Cloudinary
Fallback a disco local si no está configurado.
"""
import os
import io
import uuid
import logging
import time
import hashlib
import re
import tempfile

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
    # Verificar si CLOUDINARY_URL está configurada en el entorno
    url = os.getenv('CLOUDINARY_URL', '').strip()
    return bool(url)


def upload(file_obj, public_id=None, max_width=1200):
    """
    Sube un archivo a Cloudinary usando API REST directa (evita bugs del SDK).
    Recibe un file object (Werkzeug FileStorage o similar) o bytes.
    max_width: dimensión máxima (px) — usar 400 para avatares.
    Retorna dict con 'url' y 'public_id', o None si falla.
    """
    if not _CLOUDINARY_CONFIGURED:
        logger.warning('Cloudinary no configurado (CLOUDINARY_URL no seteada)')
        return None

    import tempfile
    import os
    import requests
    import hashlib
    import re
    import time

    try:
        if public_id is None:
            public_id = uuid.uuid4().hex

        # Leer contenido a bytes
        if hasattr(file_obj, 'read'):
            pos = file_obj.tell()
            file_obj.seek(0)
            content = file_obj.read()
            file_obj.seek(pos)
        elif isinstance(file_obj, bytes):
            content = file_obj
        else:
            content = file_obj

        # Guardar en archivo temporal
        with tempfile.NamedTemporaryFile(suffix='.webp', delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Usar API REST directa de Cloudinary (evita bugs del SDK)
            url = os.getenv('CLOUDINARY_URL', '').strip()
            if not url:
                raise ValueError('CLOUDINARY_URL no configurada')

            # Parsear CLOUDINARY_URL: cloudinary://api_key:api_secret@cloud_name
            match = re.match(r'cloudinary://([^:]+):([^@]+)@(.+)', url)
            if not match:
                raise ValueError('Formato CLOUDINARY_URL inválido')
            api_key, api_secret, cloud_name = match.groups()

            # Parámetros para la subida (incluye api_key para la firma)
            timestamp = str(int(time.time()))
            data = {
                'public_id': public_id,
                'folder': 'bienenhaus',
                'overwrite': 'true',
                'resource_type': 'image',
                'quality': 'auto:best',
                'fetch_format': 'auto',
                'width': str(max_width),
                'crop': 'limit',
                'timestamp': timestamp,
                'api_key': api_key,
            }

            # Firma: parámetros ordenados alfabéticamente + api_secret
            sorted_params = sorted([(k, str(v)) for k, v in data.items()])
            to_sign = '&'.join(f'{k}={v}' for k, v in sorted_params) + api_secret
            signature = hashlib.sha1(to_sign.encode()).hexdigest()
            data['signature'] = signature

            # Subir usando API REST
            with open(tmp_path, 'rb') as f:
                files = {'file': (os.path.basename(tmp_path), f, 'image/webp')}
                response = requests.post(
                    f'https://api.cloudinary.com/v1_1/{cloud_name}/image/upload',
                    files=files,
                    data=data,
                    timeout=30
                )

            if response.status_code != 200:
                logger.error('Cloudinary API error: %s - %s', response.status_code, response.text)
                raise Exception(f'Cloudinary API error: {response.text}')

            result = response.json()
            return {
                'url': result['secure_url'],
                'public_id': result['public_id'],
            }

        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    except Exception as e:
        logger.exception('Error al subir imagen a Cloudinary: %s', e)
        raise


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
