from datetime import datetime, timezone
from flask import request, session
from extensions import db
from models import Conversation, Message
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from utils import _ok, _err, _strip_html
from . import bp


@bp.route('/api/messages/conversations/<int:cid>/messages', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_messages(cid):
    conv = Conversation.query.get_or_404(cid)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 100, type=int)
    per_page = min(per_page, 500)

    query = conv.messages.order_by(Message.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    messages = list(reversed(pagination.items))

    return _ok({
        'messages': [m.to_dict() for m in messages],
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages,
        'conversation_id': cid,
    })


@bp.route('/api/messages/conversations/<int:cid>/messages', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def send_message(cid):
    conv = Conversation.query.get_or_404(cid)
    data = request.get_json(silent=True) or {}
    content = _strip_html(data.get('content', ''))
    if not content and not data.get('attachment_url'):
        return _err('El contenido del mensaje no puede estar vacío.')

    sender = data.get('sender', 'agent')
    msg = Message(
        conversation_id=cid,
        sender=sender,
        content=content,
        content_type=data.get('content_type', 'text'),
        attachment_url=data.get('attachment_url', ''),
        attachment_name=_strip_html(data.get('attachment_name', '')),
        read=(sender != 'client'),
    )
    db.session.add(msg)

    conv.last_message_at = datetime.now(timezone.utc).replace(tzinfo=None)
    if sender == 'client':
        conv.unread = (conv.unread or 0) + 1
    elif sender == 'agent':
        Message.query.filter_by(conversation_id=cid, read=False, sender='client').update({'read': True})
        conv.unread = 0

    db.session.commit()
    return _ok(msg.to_dict(), 201)
