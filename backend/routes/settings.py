"""
routes/settings.py — Settings de la aplicación
"""
from flask import Blueprint, request, jsonify, session
from extensions import db
from models import Settings as SettingsModel
from defaults import SETTINGS_DEFAULTS
from csrf import csrf_protect
from auth_helper import require_role, ROLE_ADMIN
from utils import _ok, _err

bp = Blueprint('settings', __name__)


@bp.route('/api/settings', methods=['GET'])
def get_settings():
    public = request.args.get('public', '').lower() == 'true'
    if not public and not session.get('admin'):
        return jsonify({'ok': False, 'error': 'No autorizado'}), 401
    data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
    if public:
        sensitive = {'smtp_host','smtp_port','smtp_user','smtp_pass','email_from','email_to','webhook_url','admin_password_hash'}
        data = {k: v for k, v in data.items() if k not in sensitive}
    return jsonify({'ok': True, 'data': data})


@bp.route('/api/settings', methods=['PUT'])
@csrf_protect
@require_role(ROLE_ADMIN)
def update_settings():
    data = request.get_json(silent=True) or {}
    for key, value in data.items():
        if key in SETTINGS_DEFAULTS:
            SettingsModel.set(key, str(value).strip())
    db.session.commit()
    return jsonify({'ok': True, 'data': {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}})
