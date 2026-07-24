"""
routes/uploads.py — Subida y gestión de imágenes
Soporta Cloudinary (cuando está configurado) y disco local como fallback.
"""
import os
import uuid
import io
import logging
from flask import Blueprint, request, jsonify, send_from_directory
from csrf import csrf_protect
from cloudinary_service import is_configured, upload as cloud_upload, delete as cloud_delete, url_to_public_id
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err
from PIL import Image

# Ruta a la carpeta frontend (donde Flask sirve estáticos)
_FRONTEND = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'frontend'
)

bp = Blueprint('uploads', __name__)

# Extensiones permitidas (pre-filtro)
ALLOWED = {'jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'}
MAX_SIZE_MB = 8
MAX_IMAGE_DIMENSION = 5000
MAX_IMAGE_PIXELS = 25000000
MIN_AVATAR_DIMENSION = 300

# Cacheamos esto por request para evitar consultas repetidas
_USE_CLOUDINARY = None

def use_cloudinary():
    global _USE_CLOUDINARY
    if _USE_CLOUDINARY is None:
        _USE_CLOUDINARY = is_configured()
    return _USE_CLOUDINARY


def allowed(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED


def uploads_dir():
    """Carpeta donde se guardan las imágenes subidas (dentro de frontend/)."""
    path = os.path.join(_FRONTEND, 'static', 'uploads')
    os.makedirs(path, exist_ok=True)
    return path


def _process_image(file_obj, max_width=1200, quality=78, min_dimension=0):
    """
    Valida contenido, re-encodea a WebP (seguro, sin metadatos) y devuelve
    (nombre_archivo, bytes_seguros).
    - Lee todo a memoria antes de validar (NUNCA escribe al disco sin validar)
    - Verifica que sea una imagen real con PIL
    - Convierte a RGB (strip EXIF, alpha, metadatos)
    - Redimensiona si supera max_width; rechaza si es menor a min_dimension
    - Re-encodea a WebP (excepto GIF animados que se preservan)
    - El nombre generado usa UUID + extensión real del contenido
    """
    raw = file_obj.read()
    if not raw:
        raise ValueError('Archivo vacío.')

    # Validar que sea una imagen real (magic bytes + estructura)
    try:
        img = Image.open(io.BytesIO(raw))
        img.verify()
    except Exception as e:
        raise ValueError(f'El archivo no es una imagen válida: {e}')

    # Re-abrir después de verify (verify consume el archivo)
    img = Image.open(io.BytesIO(raw))
    fmt = (img.format or '').upper()

    # Decompression bomb check: rechazar dimensiones absurdas
    # (se hace ANTES de cualquier asignación de píxeles en memoria)
    if img.width > MAX_IMAGE_DIMENSION or img.height > MAX_IMAGE_DIMENSION:
        raise ValueError(
            f'Dimensiones máximas: {MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION}px. '
            f'La imagen mide {img.width}x{img.height}px.'
        )
    if img.width * img.height > MAX_IMAGE_PIXELS:
        raise ValueError(
            f'La imagen supera el máximo de {MAX_IMAGE_PIXELS // 1000000}MP. '
            f'Tiene {img.width * img.height // 1000000}MP.'
        )

    # GIF animado: preservar tal cual (validación por magic bytes)
    if fmt == 'GIF':
        if raw[:6] not in (b'GIF87a', b'GIF89a'):
            raise ValueError('Formato GIF inválido.')
        fname = f'{uuid.uuid4().hex}.gif'
        return fname, raw

    # Validar formato soportado
    if fmt not in ('JPEG', 'JPG', 'PNG', 'WEBP', 'AVIF'):
        raise ValueError(f'Formato de imagen no soportado: {fmt}')

    # Convertir a RGB (elimina canal alpha, perfiles ICC, EXIF, metadatos)
    if img.mode in ('RGBA', 'P', 'LA'):
        bg = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        bg.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
        img = bg
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    # Redimensionar si excede el ancho máximo
    if img.width > max_width:
        ratio = max_width / img.width
        img = img.resize(
            (int(img.width * ratio), int(img.height * ratio)),
            Image.LANCZOS
        )

    # Rechazar si no alcanza la dimensión mínima
    if min_dimension > 0 and (img.width < min_dimension or img.height < min_dimension):
        raise ValueError(
            f'La imagen es demasiado pequeña. '
            f'Mínimo: {min_dimension}x{min_dimension}px. '
            f'La imagen mide {img.width}x{img.height}px.'
        )

    # Re-encodear a WebP (formato seguro, sin metadatos, amplio soporte)
    out = io.BytesIO()
    img.save(out, 'WEBP', quality=quality, method=4)
    fname = f'{uuid.uuid4().hex}.webp'
    return fname, out.getvalue()


# ── POST /api/upload ──────────────────────────────────────────────────
@bp.route('/api/upload', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def upload():
    if 'images' not in request.files:
        return _err('No se recibieron archivos. Usá el campo "images".')

    files  = request.files.getlist('images')
    if not files or all(f.filename == '' for f in files):
        return _err('No seleccionaste ningún archivo.')

    img_type = request.args.get('type', '')  # 'avatar' o vacío
    is_avatar = img_type == 'avatar'
    max_width = 400 if is_avatar else 1200
    quality   = 85   if is_avatar else 78

    urls = []
    errors = []

    for f in files:
        if f.filename == '':
            continue

        # Pre-filtro rápido por extensión
        if not allowed(f.filename):
            errors.append(f'{f.filename}: extensión no permitida (jpg/jpeg/png/webp/gif).')
            continue

        # Validar tamaño
        f.stream.seek(0, 2)
        size_mb = f.stream.tell() / (1024 * 1024)
        f.stream.seek(0)
        if size_mb > MAX_SIZE_MB:
            errors.append(f'{f.filename}: supera los {MAX_SIZE_MB} MB permitidos.')
            continue

        # Validar contenido y re-encodear a formato seguro
        # (lee a memoria, verifica con PIL, re-encodea — NUNCA escribe al disco sin validar)
        try:
            safe_name, safe_bytes = _process_image(
                f, max_width=max_width, quality=quality,
                min_dimension=MIN_AVATAR_DIMENSION if is_avatar else 0,
            )
        except ValueError as e:
            errors.append(f'{f.filename}: {e}')
            continue

        if use_cloudinary():
            # ── Subir a Cloudinary ──────────────────────────────────
            try:
                # Pasar bytes directamente a Cloudinary (evita bugs con BytesIO)
                result = cloud_upload(safe_bytes, max_width=max_width)
                if result:
                    urls.append(result['url'])
                else:
                    errors.append(f'{f.filename}: Cloudinary no retornó URL.')
            except Exception as e:
                # Incluir el mensaje real del error de Cloudinary
                errors.append(f'{f.filename}: Cloudinary error: {str(e)}')
        else:
            # ── Subir a disco local ─────────────────────────────────
            savepath = os.path.join(uploads_dir(), safe_name)
            with open(savepath, 'wb') as f_out:
                f_out.write(safe_bytes)
            urls.append(f'/static/uploads/{safe_name}')

    if not urls and errors:
        return _err(' | '.join(errors), 422)

    return _ok({'urls': urls, 'errors': errors}, 201)


# ── DELETE /api/upload ────────────────────────────────────────────────
@bp.route('/api/upload', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_upload():
    data     = request.get_json(silent=True) or {}
    filename = data.get('filename', '').strip()
    is_url   = filename.startswith('http')

    if not filename:
        return _err('Falta el nombre del archivo.')

    if is_url and use_cloudinary():
        # ── Eliminar de Cloudinary ──────────────────────────────────
        public_id = url_to_public_id(filename)
        if not public_id:
            return _err('No se pudo determinar el public_id de Cloudinary.')
        cloud_delete(public_id)
        return _ok({'deleted': filename})

    # ── Eliminar de disco local ──────────────────────────────────────
    filename = os.path.basename(filename)
    filepath = os.path.join(uploads_dir(), filename)

    if not os.path.exists(filepath):
        return _err('Archivo no encontrado.', 404)

    os.remove(filepath)
    return _ok({'deleted': filename})


# ── GET /api/upload/list ──────────────────────────────────────────────
@bp.route('/api/upload/list', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_uploads():
    if use_cloudinary():
        # En Cloudinary no listamos archivos remotos por simplicidad;
        # los URLs están guardados en las propiedades.
        return _ok({'urls': [], 'count': 0, 'note': 'Cloudinary: los archivos se listan desde las propiedades.'})

    files = sorted(os.listdir(uploads_dir()), reverse=True)
    urls  = [f'/static/uploads/{f}' for f in files if allowed(f)]
    return _ok({'urls': urls, 'count': len(urls)})


# ── Servir archivos subidos (solo para URLs locales) ──────────────────
@bp.route('/static/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(uploads_dir(), filename)



