"""Seed demo conversations and messages for testing."""
from datetime import datetime, timezone, timedelta
from extensions import db
from models import Lead, Conversation, Message, Agent


def run(app):
    with app.app_context():
        existing = Conversation.query.first()
        if existing:
            print('Conversations already seeded, skipping.')
            return

        leads = Lead.query.limit(5).all()
        if not leads:
            print('No leads found, skipping message seed.')
            return

        agent = Agent.query.first()

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        conversations_data = [
            {'lead_idx': 0, 'channel': 'whatsapp', 'subject': 'Consulta por propiedad', 'status': 'activa',
             'messages': [
                 ('client', 'Hola! Vi la propiedad de 3 dormitorios en Nueva Córdoba. Sigue disponible?'),
                 ('agent', 'Hola! Sí, está disponible. Te paso más info por WhatsApp.'),
                 ('client', 'Genial! Me interesa mucho. Podría visitarla este finde?'),
                 ('agent', 'Claro! Te agendo una visita para el sábado a las 11. Te parece?'),
             ]},
            {'lead_idx': 1 if len(leads) > 1 else 0, 'channel': 'instagram', 'subject': 'Consulta IG', 'status': 'activa',
             'messages': [
                 ('client', 'Hola! Vi el departamento en Alberdi. Tiene cochera?'),
                 ('agent', 'Hola! Sí, tiene cochera cubierta para 1 auto. Querés venir a verlo?'),
             ]},
            {'lead_idx': 2 if len(leads) > 2 else 0, 'channel': 'facebook', 'subject': '', 'status': 'resuelta',
             'messages': [
                 ('client', 'Buen día. Estoy interesada en alquilar un monoambiente por el centro. Tienen algo?'),
                 ('agent', 'Buen día! Sí, tenemos varias opciones. Te envío el listado.'),
                 ('client', 'Gracias! Me sirve. Ya lo vi en la web.'),
                 ('agent', 'Genial! Cualquier consulta me decís.'),
             ]},
            {'lead_idx': 3 if len(leads) > 3 else 0, 'channel': 'email', 'subject': 'Cotización tasación', 'status': 'activa',
             'messages': [
                 ('client', 'Necesito una tasación para mi casa en Cerro de las Rosas. Podrían cotizarme?'),
                 ('agent', 'Hola! Sí, podemos hacer una tasación profesional. Te contacto para coordinar una visita.'),
             ]},
            {'lead_idx': 4 if len(leads) > 4 else 0, 'channel': 'web', 'subject': 'Formulario de contacto', 'status': 'activa',
             'messages': [
                 ('client', 'Quiero invertir en propiedades para alquilar. Que zonas recomiendan?'),
                 ('agent', 'Hola! Te recomiendo Nueva Córdoba y Cerro de las Rosas. Tenemos excelentes opciones.'),
             ]},
        ]

        for cd in conversations_data:
            lead = leads[cd['lead_idx']]
            conv = Conversation(
                lead_id=lead.id,
                agent_id=agent.id if agent else None,
                channel=cd['channel'],
                subject=cd['subject'],
                status=cd['status'],
                last_message_at=now - timedelta(hours=len(cd['messages'])),
            )
            db.session.add(conv)
            db.session.flush()

            for i, (sender, content) in enumerate(cd['messages']):
                msg = Message(
                    conversation_id=conv.id,
                    sender=sender,
                    content=content,
                    content_type='text',
                    read=(sender == 'agent'),
                    created_at=now - timedelta(hours=len(cd['messages']) - i),
                )
                db.session.add(msg)

            conv.unread = sum(1 for s, c in cd['messages'] if s == 'client')
            conv.last_message_at = now

        db.session.commit()
        count = Conversation.query.count()
        msg_count = Message.query.count()
        print(f'Seeded {count} conversations with {msg_count} messages.')
