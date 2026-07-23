"""
routes/backup.py — Backup de base de datos vía API o cron
"""
import os
from flask import Blueprint, request, jsonify, session
from csrf import validate_token

bp = Blueprint('backup', __name__)


@bp.route('/api/admin/db-backup', methods=['POST'])
def api_db_backup():
    """Backup vía API. Requiere sesión admin o X-Backup-Key."""
    from flask import current_app
    backup_key = os.getenv('BACKUP_API_KEY', '')
    if backup_key:
        req_key = request.headers.get('X-Backup-Key', '')
        if req_key == backup_key:
            from scripts.db_backup import run_backup
            try:
                result = run_backup(current_app._get_current_object(), upload=True)
                return jsonify({'ok': True, 'url': result['url'], 'size': result['size']})
            except Exception as e:
                return jsonify({'ok': False, 'error': str(e)}), 500
    if session.get('admin'):
        token = request.headers.get('X-CSRF-Token', '')
        if not validate_token(token):
            return jsonify({'ok': False, 'error': 'Token CSRF inválido.'}), 403
        from scripts.db_backup import run_backup
        try:
            result = run_backup(current_app._get_current_object(), upload=True)
            return jsonify({'ok': True, 'url': result['url'], 'size': result['size']})
        except Exception as e:
            return jsonify({'ok': False, 'error': str(e)}), 500
    return jsonify({'ok': False, 'error': 'No autorizado'}), 401
