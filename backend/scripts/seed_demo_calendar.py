"""
seed_demo_calendar.py — Carga eventos demo para el módulo Agenda y Recordatorios.
"""
from datetime import datetime, timezone, timedelta
import random


def run(app):
    from extensions import db
    from models import CalendarEvent, EventComment, Agent

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today = now.replace(hour=9, minute=0, second=0, microsecond=0)

    if CalendarEvent.query.count() > 0:
        print('[seed] Calendar events already exist, skipping.')
        return

    agents = Agent.query.all()
    agent_ids = [a.id for a in agents] if agents else [None]

    events_data = [
        {
            'event_type': 'visita',
            'title': 'Visita a PH en Nueva Córdoba',
            'client_name': 'Martín Rodríguez',
            'client_phone': '+54 351 555-0101',
            'description': 'Cliente interesado en PH de 2 dormitorios. Confirmar disponibilidad.',
            'start_at': today + timedelta(hours=10),
            'end_at': today + timedelta(hours=11),
            'status': 'confirmado',
            'priority': 'alta',
            'location': 'Nueva Córdoba, Córdoba',
        },
        {
            'event_type': 'visita',
            'title': 'Departamento en Cerro de las Rosas',
            'client_name': 'Laura Gentile',
            'client_phone': '+54 351 555-0202',
            'description': 'Departamento de 3 ambientes con cochera. Cliente muy calificado.',
            'start_at': today + timedelta(hours=15),
            'end_at': today + timedelta(hours=16, minutes=30),
            'status': 'confirmado',
            'priority': 'alta',
            'location': 'Cerro de las Rosas, Córdoba',
        },
        {
            'event_type': 'reunion',
            'title': 'Reunión de equipo semanal',
            'description': 'Review de propiedades, asignación de visitas y seguimiento de leads.',
            'start_at': today + timedelta(hours=9),
            'end_at': today + timedelta(hours=10),
            'status': 'confirmado',
            'priority': 'media',
            'location': 'Oficina Bienenhaus',
        },
        {
            'event_type': 'llamada',
            'title': 'Llamada con propietario',
            'client_name': 'Carlos Méndez',
            'client_phone': '+54 351 555-0303',
            'description': 'Hablar sobre condiciones de venta del departamento en Centro.',
            'start_at': today + timedelta(hours=11),
            'end_at': today + timedelta(hours=11, minutes=30),
            'status': 'pendiente',
            'priority': 'media',
        },
        {
            'event_type': 'tasacion',
            'title': 'Tasación casa en Barrio Jardín',
            'client_name': 'Silvia Martínez',
            'client_phone': '+54 351 555-0404',
            'description': 'Casa de 4 dormitorios con pileta. Tomar medidas y fotos.',
            'start_at': today + timedelta(hours=14),
            'end_at': today + timedelta(hours=16),
            'status': 'confirmado',
            'priority': 'alta',
            'location': 'Barrio Jardín, Córdoba',
        },
        {
            'event_type': 'recordatorio',
            'title': 'Firmar contrato de alquiler',
            'description': 'Recordatorio para firmar contrato con inquilinos de Belgrano 123.',
            'start_at': today + timedelta(days=1, hours=10),
            'status': 'pendiente',
            'priority': 'urgente',
        },
        {
            'event_type': 'tarea',
            'title': 'Actualizar fotos de propiedades',
            'description': 'Subir nuevas fotos de las propiedades en venta a la web y portales.',
            'start_at': today + timedelta(days=2, hours=9),
            'end_at': today + timedelta(days=2, hours=12),
            'status': 'pendiente',
            'priority': 'media',
        },
        {
            'event_type': 'visita',
            'title': 'Casa en Villa Allende',
            'client_name': 'Pedro y Ana López',
            'client_phone': '+54 351 555-0505',
            'description': 'Familia busca casa con jardín. Mostrar propiedad en Villa Allende.',
            'start_at': today + timedelta(days=3, hours=11),
            'end_at': today + timedelta(days=3, hours=12, minutes=30),
            'status': 'pendiente',
            'priority': 'media',
            'location': 'Villa Allende, Córdoba',
        },
        {
            'event_type': 'evento',
            'title': 'Capacitación: CRM Avanzado',
            'description': 'Taller interno sobre uso avanzado del CRM para agentes.',
            'start_at': today + timedelta(days=5, hours=10),
            'end_at': today + timedelta(days=5, hours=13),
            'status': 'confirmado',
            'priority': 'baja',
            'location': 'Sala de reuniones',
        },
        {
            'event_type': 'reunion',
            'title': 'Reunión con inversor',
            'client_name': 'Roberto Chiesa',
            'client_phone': '+54 351 555-0606',
            'description': 'Presentar cartera de propiedades de inversión. Cliente potencial importante.',
            'start_at': today + timedelta(days=7, hours=16),
            'end_at': today + timedelta(days=7, hours=17, minutes=30),
            'status': 'pendiente',
            'priority': 'alta',
            'location': 'Oficina Bienenhaus',
        },
        {
            'event_type': 'recordatorio',
            'title': 'Vencimiento publicación MercadoLibre',
            'description': 'Renovar publicaciones de propiedades destacadas en ML.',
            'start_at': today + timedelta(days=4, hours=8),
            'status': 'pendiente',
            'priority': 'media',
        },
        {
            'event_type': 'llamada',
            'title': 'Seguimiento lead WhatsApp',
            'client_name': 'Florencia Torres',
            'client_phone': '+54 351 555-0707',
            'description': 'Hizo consulta por departamento en Güemes. Hacer seguimiento.',
            'start_at': today + timedelta(hours=12),
            'end_at': today + timedelta(hours=12, minutes=20),
            'status': 'pendiente',
            'priority': 'media',
        },
    ]

    created = []
    for data in events_data:
        agent_id = random.choice(agent_ids) if agent_ids else None
        event = CalendarEvent(
            event_type=data['event_type'],
            title=data['title'],
            description=data.get('description', ''),
            client_name=data.get('client_name', ''),
            client_phone=data.get('client_phone', ''),
            start_at=data['start_at'],
            end_at=data.get('end_at'),
            status=data.get('status', 'pendiente'),
            priority=data.get('priority', 'media'),
            location=data.get('location', ''),
            agent_id=agent_id,
            created_by_id=None,
        )
        db.session.add(event)
        created.append(event)

    db.session.flush()

    comments_data = [
        (0, 'Cliente llegó 10 min antes, muy puntual.'),
        (0, 'Gustó mucho la propiedad, quiere traer a su esposa.'),
        (1, 'Confirmó visita para el viernes.'),
        (1, 'Cliente muy interesado, posible oferta.'),
        (2, 'Todos confirmados. Orden del día: métricas del mes.'),
        (4, 'Propiedad en buen estado. Estimar alrededor de 180.000 USD.'),
    ]
    for idx, text in comments_data:
        if idx < len(created):
            c = EventComment(
                event_id=created[idx].id,
                content=text,
                created_by_id=None,
            )
            db.session.add(c)

    db.session.commit()
    print(f'[seed] Created {len(created)} calendar events with comments.')
