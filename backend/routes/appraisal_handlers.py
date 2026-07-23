# backend/routes/appraisal_handlers.py
from flask import request, current_app
from services import AppraisalService
from utils import _ok, _err


def handle_appraisal(tid, tipo):
    method = request.method
    data = request.get_json() if method in ('POST', 'PUT', 'PATCH') else None

    try:
        if method == 'GET':
            return _ok(AppraisalService.get_by_id_and_tipo(tid, tipo).to_dict())
        elif method == 'POST':
            return _ok(AppraisalService.create(data, tipo).to_dict(), 201)
        elif method == 'PUT':
            return _ok(AppraisalService.update(tid, data, tipo).to_dict())
        elif method == 'PATCH':
            return _ok(AppraisalService.patch(tid, data, tipo).to_dict())
        elif method == 'DELETE':
            AppraisalService.delete(tid, tipo)
            return _ok({'deleted': tid})
    except Exception as e:
        current_app.logger.error(f"Appraisal handler error: {e}")
        return _err(str(e), 500)