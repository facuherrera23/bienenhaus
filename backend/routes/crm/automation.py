import json
from flask import request
from models import AutomationRule
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err
from . import bp


@bp.route('/api/crm/automation-rules', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_automation_rules():
    rules = AutomationRule.query.order_by(AutomationRule.priority.desc()).all()
    return _ok({'rules': [r.to_dict() for r in rules]})


@bp.route('/api/crm/automation-rules', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_automation_rule():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    if not name:
        return _err('El nombre es obligatorio.')
    rule = AutomationRule(
        name=name,
        description=data.get('description', ''),
        enabled=data.get('enabled', False),
        trigger_type=data.get('trigger_type', ''),
        trigger_config=json.dumps(data.get('trigger_config', {})),
        action_type=data.get('action_type', ''),
        action_config=json.dumps(data.get('action_config', {})),
        priority=data.get('priority', 0),
        max_actions=data.get('max_actions', 0),
        cooldown_minutes=data.get('cooldown_minutes', 0),
    )
    from extensions import db
    db.session.add(rule)
    db.session.commit()
    return _ok(rule.to_dict(), 201)


@bp.route('/api/crm/automation-rules/<int:rid>', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_automation_rule(rid):
    rule = AutomationRule.query.get_or_404(rid)
    data = request.get_json(silent=True) or {}
    for f in ('name', 'description', 'trigger_type', 'action_type'):
        if f in data:
            setattr(rule, f, data[f])
    if 'enabled' in data:
        rule.enabled = data['enabled']
    if 'trigger_config' in data:
        rule.trigger_config = json.dumps(data['trigger_config'])
    if 'action_config' in data:
        rule.action_config = json.dumps(data['action_config'])
    if 'priority' in data:
        rule.priority = data['priority']
    if 'max_actions' in data:
        rule.max_actions = data['max_actions']
    if 'cooldown_minutes' in data:
        rule.cooldown_minutes = data['cooldown_minutes']
    from extensions import db
    db.session.commit()
    return _ok(rule.to_dict())


@bp.route('/api/crm/automation-rules/<int:rid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_automation_rule(rid):
    rule = AutomationRule.query.get_or_404(rid)
    from extensions import db
    db.session.delete(rule)
    db.session.commit()
    return _ok({'deleted': rid})
