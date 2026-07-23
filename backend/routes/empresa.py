"""
routes/empresa.py — Configuración de la inmobiliaria para informes ACM
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from extensions import db
from models import Empresa
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err

bp = Blueprint('empresa', __name__, url_prefix='/api/empresa')


@bp.route('', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_empresa():
    emp = Empresa.query.first()
    if not emp:
        emp = Empresa()
        db.session.add(emp)
        db.session.commit()
    return _ok(emp.to_dict())


@bp.route('', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_empresa():
    emp = Empresa.query.first()
    if not emp:
        emp = Empresa()
        db.session.add(emp)
    data = request.get_json(silent=True) or {}
    for k, v in data.items():
        if hasattr(emp, k):
            setattr(emp, k, v)
    db.session.commit()
    return _ok(emp.to_dict())
