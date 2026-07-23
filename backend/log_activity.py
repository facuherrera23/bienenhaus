"""
log_activity.py — Helper para registrar actividad admin en ActivityLog
"""
from __future__ import annotations
from typing import Any
from flask import session, request
from extensions import db
from models import ActivityLog


def log_activity(action: str, entity_type: str, entity_id: Any = None, entity_title: str = '', details: str = '') -> None:
    user_id = session.get('user_id')
    user_name = session.get('username', '')
    ip = request.remote_addr or ''
    log = ActivityLog(
        user_id=user_id,
        user_name=user_name,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_title=entity_title,
        details=details,
        ip_address=ip,
    )
    db.session.add(log)
    db.session.commit()
