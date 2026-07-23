"""
routes/client_errors.py — Captura de errores del frontend (Sentry lightweight)
"""
import logging
from flask import Blueprint, request, session
from extensions import limiter, db
from flask import make_response, jsonify
from utils import _ok, _err
from models.client_error import ClientError

logger = logging.getLogger(__name__)
bp = Blueprint('client_errors', __name__)


@bp.route('/api/client-errors', methods=['POST'])
@limiter.limit("30 per minute")
def report_client_error():
    data = request.get_json(silent=True) or {}
    msg = data.get('message', 'Sin mensaje')
    source = data.get('source', '')
    lineno = data.get('lineno', 0)
    colno = data.get('colno', 0)
    error = data.get('error', '')
    url = data.get('url', '')
    user_agent = data.get('userAgent', '')
    ip = request.remote_addr or ''

    logger.warning(
        'Cliente Error | %s | %s:%s:%s | %s | URL: %s | UA: %s',
        msg, source, lineno, colno, error[:200], url, user_agent
    )

    try:
        ce = ClientError(
            message=msg,
            source=source,
            lineno=lineno,
            colno=colno,
            error=error[:2000],
            url=url,
            user_agent=user_agent[:500],
            ip=ip,
        )
        db.session.add(ce)
        db.session.commit()
    except Exception:
        db.session.rollback()
        logger.exception('Failed to save client error')

    return make_response(jsonify({'ok': True}), 204)


@bp.route('/api/client-errors', methods=['GET'])
def list_client_errors():
    if not session.get('admin'):
        return _err('Unauthorized', 401)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)

    query = ClientError.query.order_by(ClientError.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return _ok({
        'data': [i.to_dict() for i in items],
        'total': total,
        'page': page,
        'per_page': per_page,
    })
