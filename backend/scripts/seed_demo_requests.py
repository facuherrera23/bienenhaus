"""Seed demo requests for testing the requests management module."""
from datetime import datetime, timezone, timedelta
from extensions import db
from models import Request, RequestComment, Property, Agent


def run(app):
    with app.app_context():
        existing = Request.query.first()
        if existing:
            print('Requests already seeded, skipping.')
            return

        props = Property.query.limit(3).all()
        agents = Agent.query.all()
        agent = agents[0] if agents else None
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        requests_data = [
            {
                'client_name': 'María García', 'client_email': 'maria@email.com', 'client_phone': '+54 351 111-2222',
                'request_type': 'consulta', 'subject': 'Consulta por financiación',
                'description': 'Quisiera saber si tienen planes de financiación propia o trabajan con bancos.',
                'status': 'nueva', 'priority': 'alta', 'property_id': props[0].id if props else None,
                'assigned_agent_id': agent.id if agent else None,
            },
            {
                'client_name': 'Carlos López', 'client_email': 'carlos@email.com', 'client_phone': '+54 351 333-4444',
                'request_type': 'tasacion', 'subject': 'Tasación de casa en Cerro',
                'description': 'Necesito tasar mi casa en Cerro de las Rosas para ponerla en venta.',
                'status': 'en_revision', 'priority': 'urgente',
                'assigned_agent_id': agent.id if agent else None,
            },
            {
                'client_name': 'Ana Martínez', 'client_email': 'ana@email.com', 'client_phone': '+54 351 555-6666',
                'request_type': 'visita', 'subject': 'Visita a departamento',
                'description': 'Quiero visitar el departamento de 2 dormitorios en Nueva Córdoba.',
                'status': 'respondida', 'priority': 'media',
                'property_id': props[1].id if props and len(props) > 1 else None,
                'assigned_agent_id': agent.id if agent else None,
                'comments': [
                    'Hola Ana! Agendamos la visita para el viernes a las 17hs. Te parece bien?',
                    'Perfecto! Estaré allí. Gracias.',
                ],
            },
            {
                'client_name': 'Pedro Fernández', 'client_email': 'pedro@email.com',
                'request_type': 'informacion', 'subject': 'Info sobre zonas',
                'description': 'Estoy buscando información sobre los precios promedio en barrio General Paz.',
                'status': 'cerrada', 'priority': 'baja',
            },
            {
                'client_name': 'Laura Sánchez', 'client_email': 'laura@email.com', 'client_phone': '+54 351 777-8888',
                'request_type': 'propuesta', 'subject': 'Propuesta de inversión',
                'description': 'Soy inversor y busco propiedades en pozo con buena proyección.',
                'status': 'en_revision', 'priority': 'alta',
                'assigned_agent_id': agent.id if agent else None,
            },
        ]

        for i, rd in enumerate(requests_data):
            comments = rd.pop('comments', [])
            req = Request(
                client_name=rd['client_name'],
                client_email=rd.get('client_email', ''),
                client_phone=rd.get('client_phone', ''),
                request_type=rd.get('request_type', 'consulta'),
                subject=rd.get('subject', ''),
                description=rd.get('description', ''),
                property_id=rd.get('property_id'),
                status=rd.get('status', 'nueva'),
                priority=rd.get('priority', 'media'),
                assigned_agent_id=rd.get('assigned_agent_id'),
                source='web',
                created_at=now - timedelta(hours=(len(requests_data) - i) * 3),
                updated_at=now - timedelta(hours=(len(requests_data) - i)),
            )
            if rd.get('status') in ('respondida', 'cerrada'):
                req.first_response_at = req.created_at + timedelta(hours=2)
            if rd.get('status') == 'cerrada':
                req.resolved_at = req.created_at + timedelta(days=2)
            db.session.add(req)
            db.session.flush()

            for j, c in enumerate(comments):
                comment = RequestComment(
                    request_id=req.id,
                    author='agent' if j % 2 == 0 else 'client',
                    author_name='Agente Bienenhaus' if j % 2 == 0 else req.client_name,
                    content=c,
                    created_at=req.created_at + timedelta(hours=1 + j),
                )
                db.session.add(comment)

        db.session.commit()
        count = Request.query.count()
        comment_count = RequestComment.query.count()
        print(f'Seeded {count} requests with {comment_count} comments.')
