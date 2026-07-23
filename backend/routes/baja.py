"""
routes/baja.py — Solicitudes de baja de datos personales (Ley 25.326)
"""
import time
import logging
from flask import Blueprint, request
from extensions import db, limiter
from models import BajaRequest
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err, _strip_html

logger = logging.getLogger(__name__)
bp = Blueprint('baja', __name__)


@bp.route('/api/baja', methods=['POST'])
@limiter.limit("5 per minute")
@csrf_protect
def submit_baja():
    data = request.get_json(silent=True) or {}

    if data.get('_website'):
        return _err('Spam detectado.')

    ts = data.get('_ts')
    if ts:
        try:
            if time.time() - int(ts) < 3:
                return _err('Demasiado rápido.')
        except (ValueError, TypeError):
            pass

    name = _strip_html(data.get('name', ''))
    if not name:
        return _err('El nombre es obligatorio.')
    email = data.get('email', '').strip()
    if not email:
        return _err('El email es obligatorio.')

    req = BajaRequest(
        name    = name,
        email   = email,
        phone   = _strip_html(data.get('phone', '')),
        motivo  = data.get('motivo', ''),
        message = _strip_html(data.get('message', '')),
        status  = 'pendiente',
    )
    db.session.add(req)
    db.session.commit()

    return _ok({
        'id': req.id,
        'message': 'Solicitud recibida. Procesaremos tu pedido en un m\u00e1ximo de 10 d\u00edas h\u00e1biles.',
    }, 201)


@bp.route('/api/baja', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_baja():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    per_page = min(per_page, 200)

    query = BajaRequest.query.order_by(BajaRequest.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return _ok({
        'requests': [r.to_dict() for r in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
    })


@bp.route('/api/baja/stats', methods=['GET'])
@require_role(ROLE_EDITOR)
def stats():
    total = BajaRequest.query.count()
    pendientes = BajaRequest.query.filter_by(status='pendiente').count()
    return _ok({'total': total, 'pendientes': pendientes})


@bp.route('/api/baja/<int:rid>', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_baja(rid):
    req = BajaRequest.query.get_or_404(rid)
    data = request.get_json(silent=True) or {}
    if 'status' in data:
        req.status = data['status']
    if 'read' in data:
        req.read = data['read']
    db.session.commit()
    return _ok(req.to_dict())


@bp.route('/api/baja/<int:rid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_baja(rid):
    req = BajaRequest.query.get_or_404(rid)
    db.session.delete(req)
    db.session.commit()
    return _ok({'deleted': rid})
