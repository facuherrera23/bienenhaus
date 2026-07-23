"""
Tests for CRM module — leads, tasks, visits, reminders, pipeline, automation.
"""
import json
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta
from models import (
    Lead, LeadPropertyInterest, LeadActivity, Task, Visit, Reminder,
    AutomationRule, Agent, Property, ContactMessage, AppraisalRequest
)
from extensions import db


# ── Helpers ──────────────────────────────────────────────────────────────────

def _login(client):
    with client.session_transaction() as sess:
        sess['admin'] = True
        sess['user_id'] = 1
        sess['username'] = 'admin'
        sess['role'] = 'admin'


def _post_json(client, url, data):
    return client.post(url, json=data, headers={'Content-Type': 'application/json'})


def _patch_json(client, url, data):
    return client.patch(url, json=data, headers={'Content-Type': 'application/json'})


def _delete_req(client, url):
    return client.delete(url, headers={'Content-Type': 'application/json'})


def _create_lead(client, **overrides):
    data = {'name': 'Test Lead', 'email': 'test@test.com', 'phone': '3511234567'}
    data.update(overrides)
    resp = _post_json(client, '/api/crm/leads', data)
    return resp.get_json()['data']


def _create_property(app):
    p = Property(title='Test Property', price=100000, type='casa',
                 location='Córdoba')
    db.session.add(p)
    db.session.commit()
    return p


def _create_agent(app):
    a = Agent(name='Test', last='Agent', email='agent@test.com')
    db.session.add(a)
    db.session.commit()
    return a


# ═══════════════════════════════════════════════════════════════════════════════
#  AUTH / VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmAuth:

    def test_list_leads_requires_auth(self, client):
        resp = client.get('/api/crm/leads')
        assert resp.status_code == 401

    def test_create_lead_requires_auth(self, client):
        resp = _post_json(client, '/api/crm/leads', {'name': 'Test'})
        assert resp.status_code == 401

    def test_create_lead_requires_name(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/leads', {'name': ''})
        assert resp.status_code == 400
        assert 'obligatorio' in resp.get_json()['error']


# ═══════════════════════════════════════════════════════════════════════════════
#  LEAD CRUD
# ═══════════════════════════════════════════════════════════════════════════════

class TestLeadCrud:

    def test_create_lead_minimal(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/leads', {'name': 'Juan Pérez'})
        assert resp.status_code == 201
        data = resp.get_json()['data']
        assert data['name'] == 'Juan Pérez'
        assert data['status'] == 'nuevo'
        assert data['origin'] == 'manual'

    def test_create_lead_full(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/leads', {
            'name': 'María García',
            'email': 'maria@test.com',
            'phone': '3517654321',
            'whatsapp': '3517654321',
            'preferred_contact_method': 'whatsapp',
            'origin': 'contacto',
            'status': 'contactado',
            'estimated_value': 150000,
            'conversion_probability': 70,
            'lead_score': 85,
            'budget_min': 100000,
            'budget_max': 200000,
            'source_detail': 'Web form',
            'utm_source': 'google',
            'utm_medium': 'cpc',
            'utm_campaign': 'campania1',
            'source_url': 'https://example.com',
            'notes': 'Interesado en zonacentro',
        })
        assert resp.status_code == 201
        data = resp.get_json()['data']
        assert data['name'] == 'María García'
        assert data['email'] == 'maria@test.com'
        assert data['estimated_value'] == 150000
        assert data['conversion_probability'] == 70
        assert data['lead_score'] == 85

    def test_create_lead_with_properties(self, admin_session, app):
        prop = _create_property(app)
        resp = _post_json(admin_session, '/api/crm/leads', {
            'name': 'Lead con props',
            'property_ids': [prop.id],
        })
        assert resp.status_code == 201
        lid = resp.get_json()['data']['id']
        interests = LeadPropertyInterest.query.filter_by(lead_id=lid).all()
        assert len(interests) == 1
        assert interests[0].property_id == prop.id

    def test_list_leads_pagination(self, admin_session):
        for i in range(5):
            _create_lead(admin_session, name=f'Lead {i}')
        resp = admin_session.get('/api/crm/leads?per_page=3')
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert len(data['leads']) <= 3
        assert data['total'] >= 5
        assert data['pages'] >= 2

    def test_list_leads_filter_by_status(self, admin_session):
        _create_lead(admin_session, name='Nuevo Lead', status='nuevo')
        _create_lead(admin_session, name='Contactado Lead', status='contactado')
        resp = admin_session.get('/api/crm/leads?status=contactado')
        data = resp.get_json()['data']
        for l in data['leads']:
            assert l['status'] == 'contactado'

    def test_list_leads_search(self, admin_session):
        _create_lead(admin_session, name='Buscar Este', email='buscar@test.com')
        resp = admin_session.get('/api/crm/leads?search=Buscar')
        data = resp.get_json()['data']
        assert any('Buscar' in l['name'] for l in data['leads'])

    def test_get_lead(self, admin_session):
        created = _create_lead(admin_session, name='Get Test')
        lid = created['id']
        resp = admin_session.get(f'/api/crm/leads/{lid}')
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert data['name'] == 'Get Test'
        assert 'activity_count' in data

    def test_get_lead_404(self, admin_session):
        resp = admin_session.get('/api/crm/leads/99999')
        assert resp.status_code == 404

    def test_update_lead(self, admin_session):
        created = _create_lead(admin_session, name='Before')
        lid = created['id']
        resp = _patch_json(admin_session, f'/api/crm/leads/{lid}', {
            'name': 'After', 'email': 'after@test.com', 'notes': 'Updated note',
        })
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert data['name'] == 'After'
        assert data['email'] == 'after@test.com'
        assert data['notes'] == 'Updated note'

    def test_update_lead_status_tracks_activity(self, admin_session):
        created = _create_lead(admin_session, name='Status Test')
        lid = created['id']
        _patch_json(admin_session, f'/api/crm/leads/{lid}', {'status': 'contactado'})
        activities = LeadActivity.query.filter_by(lead_id=lid).all()
        status_changes = [a for a in activities if a.activity_type == 'status_change']
        assert len(status_changes) >= 1

    def test_delete_lead(self, admin_session):
        created = _create_lead(admin_session, name='Delete Me')
        lid = created['id']
        resp = _delete_req(admin_session, f'/api/crm/leads/{lid}')
        assert resp.status_code == 200
        assert db.session.get(Lead, lid) is None

    def test_change_lead_status_endpoint(self, admin_session):
        created = _create_lead(admin_session, name='Status Change')
        lid = created['id']
        resp = _patch_json(admin_session, f'/api/crm/leads/{lid}/status', {'status': 'contactado'})
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert data['status'] == 'contactado'

    def test_change_lead_status_invalid(self, admin_session):
        created = _create_lead(admin_session, name='Invalid Status')
        lid = created['id']
        resp = _patch_json(admin_session, f'/api/crm/leads/{lid}/status', {'status': 'inventado'})
        assert resp.status_code == 400

    def test_change_lead_status_loss_reason(self, admin_session):
        created = _create_lead(admin_session, name='Lost Lead')
        lid = created['id']
        _patch_json(admin_session, f'/api/crm/leads/{lid}/status',
                    {'status': 'cerrado_perdido', 'loss_reason': 'No le gustó'})
        lead = db.session.get(Lead, lid)
        assert lead.loss_reason == 'No le gustó'

    def test_pipeline_order(self, admin_session):
        created = _create_lead(admin_session, name='Order Test')
        lid = created['id']
        resp = _patch_json(admin_session, f'/api/crm/leads/{lid}/pipeline-order', {'pipeline_order': 5})
        assert resp.status_code == 200
        assert resp.get_json()['data']['pipeline_order'] == 5

    def test_schedule_followup(self, admin_session):
        created = _create_lead(admin_session, name='Followup')
        lid = created['id']
        future = (datetime.now(timezone.utc) + timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/followup', {
            'next_followup_at': future, 'note': 'Call tomorrow',
        })
        assert resp.status_code == 200

    def test_schedule_followup_missing_date(self, admin_session):
        created = _create_lead(admin_session, name='No Date')
        lid = created['id']
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/followup', {})
        assert resp.status_code == 400

    def test_add_lead_note(self, admin_session):
        created = _create_lead(admin_session, name='Note Test')
        lid = created['id']
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/notes', {'note': 'Nota de prueba'})
        assert resp.status_code == 200
        lead = db.session.get(Lead, lid)
        assert any(n['text'] == 'Nota de prueba' for n in lead.interactions_list)


# ═══════════════════════════════════════════════════════════════════════════════
#  LEAD PROPERTIES
# ═══════════════════════════════════════════════════════════════════════════════

class TestLeadProperties:

    def test_add_lead_property(self, admin_session, app):
        prop = _create_property(app)
        created = _create_lead(admin_session, name='Prop Lead')
        lid = created['id']
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/properties', {'property_id': prop.id})
        assert resp.status_code == 201

    def test_add_lead_property_duplicate(self, admin_session, app):
        prop = _create_property(app)
        created = _create_lead(admin_session, name='Dup Prop')
        lid = created['id']
        _post_json(admin_session, f'/api/crm/leads/{lid}/properties', {'property_id': prop.id})
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/properties', {'property_id': prop.id})
        assert resp.status_code == 200

    def test_list_lead_properties(self, admin_session, app):
        prop = _create_property(app)
        created = _create_lead(admin_session, name='List Prop')
        lid = created['id']
        _post_json(admin_session, f'/api/crm/leads/{lid}/properties', {'property_id': prop.id})
        resp = admin_session.get(f'/api/crm/leads/{lid}/properties')
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert len(data['properties']) >= 1

    def test_remove_lead_property(self, admin_session, app):
        prop = _create_property(app)
        created = _create_lead(admin_session, name='Remove Prop')
        lid = created['id']
        added = _post_json(admin_session, f'/api/crm/leads/{lid}/properties', {'property_id': prop.id})
        lpid = added.get_json()['data']['id']
        resp = _delete_req(admin_session, f'/api/crm/leads/{lid}/properties/{lpid}')
        assert resp.status_code == 200

    def test_add_lead_property_invalid(self, admin_session):
        created = _create_lead(admin_session, name='Bad Prop')
        lid = created['id']
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/properties', {'property_id': 99999})
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
#  ACTIVITIES / TIMELINE
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmActivities:

    def test_get_timeline_has_system_activity(self, admin_session):
        created = _create_lead(admin_session, name='Act Test')
        lid = created['id']
        resp = admin_session.get(f'/api/crm/leads/{lid}/timeline')
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert len(data['timeline']) >= 1
        assert data['timeline'][0]['activity_type'] == 'system'

    def test_create_activity_call(self, admin_session):
        created = _create_lead(admin_session, name='Call Act')
        lid = created['id']
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/activities', {
            'activity_type': 'call', 'description': 'Called client',
        })
        assert resp.status_code == 201
        data = resp.get_json()['data']
        assert data['activity_type'] == 'call'
        assert data['description'] == 'Called client'

    def test_create_activity_note(self, admin_session):
        created = _create_lead(admin_session, name='Note Act')
        lid = created['id']
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/activities', {
            'activity_type': 'note', 'description': 'A note',
        })
        assert resp.status_code == 201

    def test_create_activity_invalid_type(self, admin_session):
        created = _create_lead(admin_session, name='Bad Act')
        lid = created['id']
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/activities', {
            'activity_type': 'invalid_type',
        })
        assert resp.status_code == 400

    def test_get_timeline_with_filter(self, admin_session):
        created = _create_lead(admin_session, name='Filter Act')
        lid = created['id']
        _post_json(admin_session, f'/api/crm/leads/{lid}/activities', {
            'activity_type': 'call', 'description': 'First call',
        })
        resp = admin_session.get(f'/api/crm/leads/{lid}/timeline?type=email')
        data = resp.get_json()['data']
        assert len(data['timeline']) == 0

    def test_delete_activity(self, admin_session):
        created = _create_lead(admin_session, name='Del Act')
        lid = created['id']
        act = _post_json(admin_session, f'/api/crm/leads/{lid}/activities', {
            'activity_type': 'note', 'description': 'Delete me',
        })
        aid = act.get_json()['data']['id']
        resp = _delete_req(admin_session, f'/api/crm/leads/{lid}/activities/{aid}')
        assert resp.status_code == 200

    def test_delete_system_activity_forbidden(self, admin_session):
        created = _create_lead(admin_session, name='Sys Act')
        lid = created['id']
        # system activities are created on lead creation, can't be deleted
        sys_act = LeadActivity.query.filter_by(lead_id=lid, activity_type='system').first()
        if sys_act:
            resp = _delete_req(admin_session, f'/api/crm/leads/{lid}/activities/{sys_act.id}')
            assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
#  TASKS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmTasks:

    def test_create_task(self, admin_session):
        created = _create_lead(admin_session, name='Task Lead')
        lid = created['id']
        resp = _post_json(admin_session, '/api/crm/tasks', {
            'lead_id': lid, 'title': 'Test task', 'priority': 'alta',
        })
        assert resp.status_code == 201
        data = resp.get_json()['data']
        assert data['title'] == 'Test task'
        assert data['priority'] == 'alta'

    def test_create_task_missing_title(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/tasks', {'lead_id': 1, 'title': ''})
        assert resp.status_code == 400

    def test_create_task_invalid_lead(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/tasks', {'lead_id': 99999, 'title': 'No lead'})
        assert resp.status_code == 400

    def test_list_tasks_by_lead(self, admin_session):
        created = _create_lead(admin_session, name='Task List')
        lid = created['id']
        _post_json(admin_session, '/api/crm/tasks', {'lead_id': lid, 'title': 'Task A'})
        _post_json(admin_session, '/api/crm/tasks', {'lead_id': lid, 'title': 'Task B'})
        resp = admin_session.get(f'/api/crm/tasks?lead_id={lid}')
        data = resp.get_json()['data']
        assert len(data['tasks']) >= 2

    def test_update_task(self, admin_session):
        created = _create_lead(admin_session, name='Task Upd')
        lid = created['id']
        t = _post_json(admin_session, '/api/crm/tasks', {'lead_id': lid, 'title': 'Before'})
        tid = t.get_json()['data']['id']
        resp = _patch_json(admin_session, f'/api/crm/tasks/{tid}', {
            'title': 'After', 'priority': 'urgente',
        })
        assert resp.status_code == 200
        assert resp.get_json()['data']['title'] == 'After'
        assert resp.get_json()['data']['priority'] == 'urgente'

    def test_complete_task(self, admin_session):
        created = _create_lead(admin_session, name='Task Cmp')
        lid = created['id']
        t = _post_json(admin_session, '/api/crm/tasks', {'lead_id': lid, 'title': 'Complete me'})
        tid = t.get_json()['data']['id']
        resp = _patch_json(admin_session, f'/api/crm/tasks/{tid}/complete', {})
        assert resp.status_code == 200
        task = db.session.get(Task, tid)
        assert task.status == 'completada'
        assert task.completed_at is not None

    def test_delete_task(self, admin_session):
        created = _create_lead(admin_session, name='Task Del')
        lid = created['id']
        t = _post_json(admin_session, '/api/crm/tasks', {'lead_id': lid, 'title': 'Delete me'})
        tid = t.get_json()['data']['id']
        resp = _delete_req(admin_session, f'/api/crm/tasks/{tid}')
        assert resp.status_code == 200
        assert db.session.get(Task, tid) is None

    def test_task_stats(self, admin_session):
        resp = admin_session.get('/api/crm/tasks/stats')
        assert resp.status_code == 200
        data = resp.get_json()['data']
        for key in ('pendientes', 'en_progreso', 'vencidas', 'proximas_48h'):
            assert key in data

    def test_task_filter_by_priority(self, admin_session):
        created = _create_lead(admin_session, name='Task Prio')
        lid = created['id']
        _post_json(admin_session, '/api/crm/tasks', {'lead_id': lid, 'title': 'Urgent', 'priority': 'urgente'})
        resp = admin_session.get(f'/api/crm/tasks?lead_id={lid}&priority=urgente')
        data = resp.get_json()['data']
        assert all(t['priority'] == 'urgente' for t in data['tasks'])


# ═══════════════════════════════════════════════════════════════════════════════
#  VISITS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmVisits:

    def test_create_visit(self, admin_session):
        created = _create_lead(admin_session, name='Visit Lead')
        lid = created['id']
        future = (datetime.now(timezone.utc) + timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')
        resp = _post_json(admin_session, '/api/crm/visits', {
            'lead_id': lid, 'scheduled_at': future, 'notes': 'Show property',
        })
        assert resp.status_code == 201

    def test_create_visit_missing_date(self, admin_session):
        created = _create_lead(admin_session, name='No Date')
        lid = created['id']
        resp = _post_json(admin_session, '/api/crm/visits', {'lead_id': lid})
        assert resp.status_code == 400

    def test_create_visit_invalid_lead(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/visits', {
            'lead_id': 99999, 'scheduled_at': '2026-01-01T10:00:00',
        })
        assert resp.status_code == 400

    def test_list_visits(self, admin_session):
        created = _create_lead(admin_session, name='Visit List')
        lid = created['id']
        future = (datetime.now(timezone.utc) + timedelta(days=2)).strftime('%Y-%m-%dT%H:%M:%S')
        _post_json(admin_session, '/api/crm/visits', {'lead_id': lid, 'scheduled_at': future})
        resp = admin_session.get(f'/api/crm/visits?lead_id={lid}')
        data = resp.get_json()['data']
        assert len(data['visits']) >= 1

    def test_update_visit_status(self, admin_session):
        created = _create_lead(admin_session, name='Visit Upd')
        lid = created['id']
        future = (datetime.now(timezone.utc) + timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')
        v = _post_json(admin_session, '/api/crm/visits', {'lead_id': lid, 'scheduled_at': future})
        vid = v.get_json()['data']['id']
        resp = _patch_json(admin_session, f'/api/crm/visits/{vid}', {'status': 'realizada', 'feedback': 'Great!'})
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert data['status'] == 'realizada'
        assert data['feedback'] == 'Great!'

    def test_delete_visit(self, admin_session):
        created = _create_lead(admin_session, name='Visit Del')
        lid = created['id']
        future = (datetime.now(timezone.utc) + timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')
        v = _post_json(admin_session, '/api/crm/visits', {'lead_id': lid, 'scheduled_at': future})
        vid = v.get_json()['data']['id']
        resp = _delete_req(admin_session, f'/api/crm/visits/{vid}')
        assert resp.status_code == 200
        assert db.session.get(Visit, vid) is None

    def test_visit_calendar(self, admin_session):
        resp = admin_session.get('/api/crm/visits/calendar')
        assert resp.status_code == 200
        assert 'events' in resp.get_json()['data']

    def test_upcoming_visits(self, admin_session):
        resp = admin_session.get('/api/crm/visits/upcoming')
        assert resp.status_code == 200
        assert 'visits' in resp.get_json()['data']

    def test_visit_with_property_and_agent(self, admin_session, app):
        prop = _create_property(app)
        agent = _create_agent(app)
        created = _create_lead(admin_session, name='Visit Full')
        lid = created['id']
        future = (datetime.now(timezone.utc) + timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')
        resp = _post_json(admin_session, '/api/crm/visits', {
            'lead_id': lid, 'scheduled_at': future,
            'property_id': prop.id, 'agent_id': agent.id,
            'notes': 'Full visit',
        })
        assert resp.status_code == 201


# ═══════════════════════════════════════════════════════════════════════════════
#  REMINDERS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmReminders:

    def test_create_reminder(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/reminders', {
            'title': 'Test reminder', 'reminder_type': 'custom',
            'reminder_at': '2026-07-01T10:00:00',
        })
        assert resp.status_code == 201
        data = resp.get_json()['data']
        assert data['title'] == 'Test reminder'
        assert data['reminder_type'] == 'custom'

    def test_create_reminder_missing_title(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/reminders', {
            'reminder_at': '2026-07-01T10:00:00',
        })
        assert resp.status_code == 400

    def test_create_reminder_missing_date(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/reminders', {'title': 'No date'})
        assert resp.status_code == 400

    def test_create_reminder_for_lead(self, admin_session):
        created = _create_lead(admin_session, name='Rem Lead')
        lid = created['id']
        resp = _post_json(admin_session, '/api/crm/reminders', {
            'lead_id': lid, 'title': 'Follow up',
            'reminder_at': '2026-07-01T10:00:00',
        })
        assert resp.status_code == 201
        # Should create activity linked to lead
        acts = LeadActivity.query.filter_by(lead_id=lid).all()
        assert any('Recordatorio' in (a.title or '') for a in acts)

    def test_list_reminders(self, admin_session):
        _post_json(admin_session, '/api/crm/reminders', {
            'title': 'Rem A', 'reminder_at': '2026-07-01T10:00:00',
        })
        resp = admin_session.get('/api/crm/reminders')
        data = resp.get_json()['data']
        assert len(data['reminders']) >= 1

    def test_update_reminder(self, admin_session):
        r = _post_json(admin_session, '/api/crm/reminders', {
            'title': 'Before', 'reminder_at': '2026-07-01T10:00:00',
        })
        rid = r.get_json()['data']['id']
        resp = _patch_json(admin_session, f'/api/crm/reminders/{rid}', {
            'title': 'After', 'reminder_type': 'followup',
        })
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert data['title'] == 'After'
        assert data['reminder_type'] == 'followup'

    def test_dismiss_reminder(self, admin_session):
        r = _post_json(admin_session, '/api/crm/reminders', {
            'title': 'Dismiss', 'reminder_at': '2020-01-01T10:00:00',
        })
        rid = r.get_json()['data']['id']
        resp = _post_json(admin_session, f'/api/crm/reminders/{rid}/dismiss', {})
        assert resp.status_code == 200
        reminder = db.session.get(Reminder, rid)
        assert reminder.notified == True

    def test_pending_reminders(self, admin_session):
        resp = admin_session.get('/api/crm/reminders/pending')
        assert resp.status_code == 200
        assert 'reminders' in resp.get_json()['data']

    def test_delete_reminder(self, admin_session):
        r = _post_json(admin_session, '/api/crm/reminders', {
            'title': 'Delete', 'reminder_at': '2026-07-01T10:00:00',
        })
        rid = r.get_json()['data']['id']
        resp = _delete_req(admin_session, f'/api/crm/reminders/{rid}')
        assert resp.status_code == 200
        assert db.session.get(Reminder, rid) is None


# ═══════════════════════════════════════════════════════════════════════════════
#  PIPELINE / FUNNEL / STATS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmPipeline:

    def test_pipeline(self, admin_session):
        _create_lead(admin_session, name='Pipe Lead', status='nuevo')
        _create_lead(admin_session, name='Pipe Lead 2', status='contactado')
        resp = admin_session.get('/api/crm/pipeline')
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert 'columns' in data
        cols = {c['status']: c for c in data['columns']}
        assert 'nuevo' in cols
        assert cols['nuevo']['count'] >= 1

    def test_funnel(self, admin_session):
        resp = admin_session.get('/api/crm/funnel')
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert 'stages' in data
        for stage in data['stages']:
            assert 'status' in stage
            assert 'conversion_rate' in stage

    def test_stats(self, admin_session):
        resp = admin_session.get('/api/crm/stats')
        assert resp.status_code == 200
        data = resp.get_json()['data']
        for key in ('total', 'by_status', 'by_origin', 'pipeline_value',
                     'new_this_week', 'visits_today', 'overdue_tasks', 'pending_reminders'):
            assert key in data


# ═══════════════════════════════════════════════════════════════════════════════
#  AUTOMATION RULES
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmAutomation:

    def test_create_rule(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/automation-rules', {
            'name': 'Test Rule', 'trigger_type': 'status_change',
            'action_type': 'send_email', 'enabled': True, 'priority': 10,
        })
        assert resp.status_code == 201
        data = resp.get_json()['data']
        assert data['name'] == 'Test Rule'
        assert data['enabled'] is True

    def test_create_rule_missing_name(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/automation-rules', {'name': ''})
        assert resp.status_code == 400

    def test_list_rules(self, admin_session):
        _post_json(admin_session, '/api/crm/automation-rules', {
            'name': 'Rule A', 'trigger_type': 'status_change', 'action_type': 'notify',
        })
        resp = admin_session.get('/api/crm/automation-rules')
        data = resp.get_json()['data']
        assert len(data['rules']) >= 1

    def test_update_rule(self, admin_session):
        r = _post_json(admin_session, '/api/crm/automation-rules', {
            'name': 'Before', 'trigger_type': 'status_change', 'action_type': 'notify',
        })
        rid = r.get_json()['data']['id']
        resp = _patch_json(admin_session, f'/api/crm/automation-rules/{rid}', {
            'name': 'After', 'enabled': False,
        })
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert data['name'] == 'After'
        assert data['enabled'] is False

    def test_delete_rule(self, admin_session):
        r = _post_json(admin_session, '/api/crm/automation-rules', {
            'name': 'To Delete', 'trigger_type': 'status_change', 'action_type': 'notify',
        })
        rid = r.get_json()['data']['id']
        resp = _delete_req(admin_session, f'/api/crm/automation-rules/{rid}')
        assert resp.status_code == 200
        assert db.session.get(AutomationRule, rid) is None


# ═══════════════════════════════════════════════════════════════════════════════
#  CONVERSION FROM CONTACT / REQUEST
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmConversions:

    def test_from_contact(self, admin_session, app):
        msg = ContactMessage(name='Contact', email='contact@test.com', phone='3511111111',
                             message='Quiero info', read=False)
        with app.app_context():
            db.session.add(msg)
            db.session.commit()
            mid = msg.id
        resp = _post_json(admin_session, f'/api/crm/from-contact/{mid}', {})
        assert resp.status_code == 201
        data = resp.get_json()['data']
        assert data['name'] == 'Contact'
        assert data['origin'] == 'contacto'

    def test_from_contact_duplicate(self, admin_session, app):
        _create_lead(admin_session, name='Existing', email='dup@test.com')
        msg = ContactMessage(name='Dup', email='dup@test.com', phone='3512222222',
                             message='Duplicate', read=False)
        with app.app_context():
            db.session.add(msg)
            db.session.commit()
            mid = msg.id
        resp = _post_json(admin_session, f'/api/crm/from-contact/{mid}', {})
        assert resp.status_code == 400

    def test_from_request(self, admin_session, app):
        req = AppraisalRequest(name='Requestor', email='req@test.com', phone='3513333333',
                               property_type='casa', city='Córdoba', status='pendiente')
        with app.app_context():
            db.session.add(req)
            db.session.commit()
            rid = req.id
        resp = _post_json(admin_session, f'/api/crm/from-request/{rid}', {})
        assert resp.status_code == 201
        data = resp.get_json()['data']
        assert data['name'] == 'Requestor'
        assert data['origin'] == 'tasacion'

    def test_from_request_duplicate(self, admin_session, app):
        _create_lead(admin_session, name='Existing', email='reqdup@test.com')
        req = AppraisalRequest(name='ReqDup', email='reqdup@test.com', phone='3514444444',
                               property_type='depto', city='Córdoba', status='pendiente')
        with app.app_context():
            db.session.add(req)
            db.session.commit()
            rid = req.id
        resp = _post_json(admin_session, f'/api/crm/from-request/{rid}', {})
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmAgents:

    def test_list_agents(self, admin_session, app):
        with app.app_context():
            a = Agent(name='John', last='Doe', email='john@test.com')
            db.session.add(a)
            db.session.commit()
        resp = admin_session.get('/api/crm/agents')
        assert resp.status_code == 200
        data = resp.get_json()['data']
        assert len(data['agents']) >= 1
        assert any(a['name'] == 'John Doe' for a in data['agents'])


# ═══════════════════════════════════════════════════════════════════════════════
#  SEND EMAIL (mocked)
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmSendEmail:

    @patch('email_service.is_configured', return_value=True)
    @patch('email_service._get_config')
    @patch('email_service._send', return_value=True)
    def test_send_email_ok(self, mock_send, mock_cfg, mock_is_configured, admin_session):
        created = _create_lead(admin_session, name='Email Lead', email='lead@test.com')
        lid = created['id']
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/send-email', {
            'subject': 'Hello', 'body': 'Test body',
        })
        assert resp.status_code == 200

    def test_send_email_no_subject(self, admin_session):
        created = _create_lead(admin_session, name='No Subj', email='nosubj@test.com')
        lid = created['id']
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/send-email', {
            'subject': '', 'body': 'Body',
        })
        assert resp.status_code == 400

    def test_send_email_no_recipient(self, admin_session):
        created = _create_lead(admin_session, name='No Email')
        lid = created['id']
        resp = _post_json(admin_session, f'/api/crm/leads/{lid}/send-email', {
            'subject': 'Hi', 'body': 'Body',
        })
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
#  HTML STRIPPING (XSS protection)
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmXss:

    def test_lead_name_strips_html(self, admin_session):
        resp = _post_json(admin_session, '/api/crm/leads', {
            'name': '<script>alert("xss")</script>Juan',
        })
        assert resp.status_code == 201
        data = resp.get_json()['data']
        assert '<script>' not in data['name']
        assert 'Juan' in data['name']

    def test_lead_notes_strips_html(self, admin_session):
        created = _create_lead(admin_session, name='XSS Test')
        lid = created['id']
        _patch_json(admin_session, f'/api/crm/leads/{lid}', {
            'notes': '<script>evil()</script>Nota segura',
        })
        lead = db.session.get(Lead, lid)
        assert '<script>' not in (lead.notes or '')


# ═══════════════════════════════════════════════════════════════════════════════
#  LEAD FILTERS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCrmFilters:

    def test_filter_by_agent(self, admin_session, app):
        with app.app_context():
            a = Agent(name='Agent', last='Filter', email='agentf@test.com')
            db.session.add(a)
            db.session.commit()
            agent_id = a.id
        _create_lead(admin_session, name='Assigned', agent_id=agent_id)
        _create_lead(admin_session, name='Unassigned')
        resp = admin_session.get(f'/api/crm/leads?agent_id={agent_id}')
        data = resp.get_json()['data']
        for l in data['leads']:
            assert l['agent_id'] == agent_id

    def test_filter_by_origin(self, admin_session):
        _create_lead(admin_session, name='From Contact', origin='contacto')
        resp = admin_session.get('/api/crm/leads?origin=contacto')
        data = resp.get_json()['data']
        for l in data['leads']:
            assert l['origin'] == 'contacto'

    def test_filter_by_followup(self, admin_session):
        _create_lead(admin_session, name='Has Followup')
        resp = admin_session.get('/api/crm/leads?has_followup=1')
        assert resp.status_code == 200
