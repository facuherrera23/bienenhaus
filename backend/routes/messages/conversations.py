from datetime import datetime, timezone
from flask import request, session
from extensions import db
from models import Conversation, Message, Lead
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err, _strip_html
from . import bp


@bp.route('/api/messages/conversations', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_conversations():
    from sqlalchemy import func, and_
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    per_page = min(per_page, 200)
    channel = request.args.get('channel', '')
    status = request.args.get('status', '')
    search = request.args.get('search', '')

    query = Conversation.query.order_by(Conversation.last_message_at.desc().nullslast(), Conversation.updated_at.desc())
    if channel:
        query = query.filter(Conversation.channel == channel)
    if status:
        query = query.filter(Conversation.status == status)
    if search:
        like = f'%{search}%'
        query = query.join(Lead).filter(
            db.or_(Lead.name.ilike(like), Lead.email.ilike(like), Lead.phone.ilike(like),
                   Conversation.subject.ilike(like))
        )

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    conversations = pagination.items
    total_unread = db.session.query(db.func.sum(Conversation.unread)).scalar() or 0

    conv_ids = [c.id for c in conversations]
    if conv_ids:
        last_msg_subq = db.session.query(
            Message.conversation_id,
            func.max(Message.created_at).label('max_created')
        ).filter(Message.conversation_id.in_(conv_ids)).group_by(Message.conversation_id).subquery()
        last_msgs = {
            m.conversation_id: m
            for m in Message.query.join(last_msg_subq, and_(
                Message.conversation_id == last_msg_subq.c.conversation_id,
                Message.created_at == last_msg_subq.c.max_created,
            )).all()
        }
        msg_counts = dict(db.session.query(
            Message.conversation_id, func.count(Message.id)
        ).filter(Message.conversation_id.in_(conv_ids)).group_by(Message.conversation_id).all())
    else:
        last_msgs = {}
        msg_counts = {}

    result = []
    for c in conversations:
        last = last_msgs.get(c.id)
        result.append({
            'id': c.id,
            'lead_id': c.lead_id,
            'lead_name': c.lead.name if c.lead else None,
            'lead_email': c.lead.email if c.lead else None,
            'lead_phone': c.lead.phone if c.lead else None,
            'lead_status': c.lead.status if c.lead else None,
            'agent_id': c.agent_id,
            'agent_name': c.agent.name + ' ' + c.agent.last if c.agent else None,
            'channel': c.channel,
            'subject': c.subject,
            'status': c.status,
            'unread': c.unread,
            'last_message_preview': last.content[:120] if last else '',
            'last_message_at': str(c.last_message_at) if c.last_message_at else None,
            'last_sender': last.sender if last else None,
            'message_count': msg_counts.get(c.id, 0),
            'created_at': str(c.created_at) if c.created_at else None,
            'updated_at': str(c.updated_at) if c.updated_at else None,
        })

    return _ok({
        'conversations': result,
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'total_unread': total_unread,
    })


@bp.route('/api/messages/conversations/<int:cid>', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_conversation(cid):
    conv = Conversation.query.get_or_404(cid)
    return _ok(conv.to_dict())


@bp.route('/api/messages/conversations/<int:cid>/mark-read', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def mark_conversation_read(cid):
    conv = Conversation.query.get_or_404(cid)
    unread = conv.unread
    conv.unread = 0
    Message.query.filter_by(conversation_id=cid, read=False, sender='client').update({'read': True})
    db.session.commit()
    return _ok({'unread_cleared': unread})


@bp.route('/api/messages/conversations/<int:cid>/status', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_conversation_status(cid):
    conv = Conversation.query.get_or_404(cid)
    data = request.get_json(silent=True) or {}
    status = data.get('status', '')
    if status in ('activa', 'pendiente', 'resuelta', 'archivada'):
        conv.status = status
        db.session.commit()
    return _ok(conv.to_dict())


@bp.route('/api/messages/conversations', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_conversation():
    data = request.get_json(silent=True) or {}
    lead_id = data.get('lead_id')
    if not lead_id:
        return _err('lead_id es obligatorio')
    lead = db.session.get(Lead, lead_id)
    if not lead:
        return _err('Lead no encontrado')
    conv = Conversation(
        lead_id=lead_id,
        agent_id=data.get('agent_id', session.get('user_id')),
        channel=data.get('channel', 'whatsapp'),
        subject=_strip_html(data.get('subject', '')),
        status='activa',
    )
    db.session.add(conv)
    db.session.commit()
    return _ok(conv.to_dict(), 201)
