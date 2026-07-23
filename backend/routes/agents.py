"""
routes/agents.py — CRUD de agentes
"""
from flask import Blueprint, request, jsonify
from extensions import db
from models import Agent
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from log_activity import log_activity
from utils import _ok, _err

bp = Blueprint('agents', __name__, url_prefix='/api/agents')


# ── GET /api/agents ───────────────────────────────────────────────────
@bp.route('', methods=['GET'])
def list_agents():
    agents = Agent.query.order_by(Agent.id).all()
    return _ok([a.to_dict() for a in agents])


# ── POST /api/agents ──────────────────────────────────────────────────
@bp.route('', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_agent():
    data = request.get_json(silent=True) or {}
    if not data.get('name'):
        return _err('El nombre es obligatorio.')
    agent = Agent.from_dict(data)
    db.session.add(agent)
    db.session.commit()
    log_activity('created', 'agent', agent.id, f'{agent.name} {agent.last}')
    return _ok(agent.to_dict(), 201)


# ── PUT /api/agents/<id> ──────────────────────────────────────────────
@bp.route('/<int:aid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_agent(aid):
    agent = Agent.query.get_or_404(aid)
    data  = request.get_json(silent=True) or {}
    agent.update_from_dict(data)
    db.session.commit()
    log_activity('updated', 'agent', agent.id, f'{agent.name} {agent.last}')
    return _ok(agent.to_dict())


# ── DELETE /api/agents/<id> ───────────────────────────────────────────
@bp.route('/<int:aid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_agent(aid):
    agent = Agent.query.get_or_404(aid)
    log_activity('deleted', 'agent', agent.id, f'{agent.name} {agent.last}')
    db.session.delete(agent)
    db.session.commit()
    return _ok({'deleted': aid})
