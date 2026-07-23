import json
import logging
from datetime import datetime, timezone
from flask import session
from extensions import db
from models import LeadPropertyInterest, Property, LeadActivity

logger = logging.getLogger(__name__)

LEAD_STATUSES = [
    'nuevo', 'contactado', 'calificado', 'visita_agendada',
    'visita_realizada', 'negociacion', 'cerrado_ganado', 'cerrado_perdido',
    'propietario',
]
LEAD_ORIGINS = ['manual', 'contacto', 'tasacion', 'propiedad']
ACTIVITY_TYPES = [
    'call', 'note', 'email', 'whatsapp', 'status_change',
    'visit_scheduled', 'visit_completed', 'visit_cancelled',
    'task_created', 'task_completed', 'followup_scheduled', 'system', 'automation',
]
TASK_STATUSES = ['pendiente', 'en_progreso', 'completada', 'cancelada']
TASK_PRIORITIES = ['baja', 'media', 'alta', 'urgente']
VISIT_STATUSES = ['pendiente', 'confirmada', 'realizada', 'cancelada', 'no_asistio']
REMINDER_TYPES = ['followup', 'task_due', 'visit', 'custom']


def _create_activity(lead_id, activity_type, title='', description='',
                     from_status=None, to_status=None, email_subject=None,
                     email_to=None, duration_minutes=None, visit_id=None,
                     task_id=None, reminder_id=None, metadata=None):
    user_id = session.get('user_id')
    act = LeadActivity(
        lead_id=lead_id, activity_type=activity_type, title=title,
        description=description, from_status=from_status, to_status=to_status,
        email_subject=email_subject, email_to=email_to,
        duration_minutes=duration_minutes, visit_id=visit_id,
        task_id=task_id, reminder_id=reminder_id,
        created_by_id=user_id,
        metadata_json=json.dumps(metadata or {}),
    )
    db.session.add(act)
    return act


def _asignar_propiedades(lead, property_ids):
    LeadPropertyInterest.query.filter_by(lead_id=lead.id).delete()
    for pid in (property_ids or []):
        if pid and db.session.get(Property, pid):
            db.session.add(LeadPropertyInterest(lead_id=lead.id, property_id=pid))


def _parse_dt(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    for fmt in ('%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%f',
                '%Y-%m-%d %H:%M:%S', '%Y-%m-%d'):
        try:
            return datetime.strptime(str(val)[:26], fmt)
        except ValueError:
            continue
    return None


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)
