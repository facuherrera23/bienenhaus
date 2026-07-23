"""Seed demo appraisals with management data (comments, timeline) for Módulo 12."""
from datetime import datetime, timezone, timedelta
from extensions import db
from models import Appraisal, AppraisalComment, AppraisalTimeline, Agent


def run(app):
    with app.app_context():
        existing = AppraisalComment.query.first()
        if existing:
            print('Appraisals v2 already seeded, skipping.')
            return

        agents = Agent.query.all()
        agent = agents[0] if agents else None
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        appraisals = Appraisal.query.limit(5).all()
        user_id = 1

        if not appraisals:
            print('No appraisals found. Run seed-demo-acm first.')
            return

        comments_data = [
            (0, 'Cliente llamó para consultar sobre el avance de la tasación. Se le informó que está en proceso.'),
            (0, 'Se agendó visita para el jueves 15 a las 10:00 hs.'),
            (1, 'Propiedad revisada. Faltan datos de escrituración.'),
            (1, 'Se contactó al cliente para solicitar la documentación faltante.'),
            (2, 'Informe preliminar generado. Pendiente de revisión final.'),
            (3, 'Tasación completada. Se envió el informe al cliente.'),
            (4, 'Cliente solicita copia adicional del informe.'),
        ]

        timeline_data = [
            (0, 'asignacion', f'Agente asignado: {agent.name} {agent.last}' if agent else 'Agente asignado'),
            (0, 'estado', 'Estado cambiado: borrador → en_proceso'),
            (1, 'asignacion', f'Agente asignado: {agent.name} {agent.last}' if agent else 'Agente asignado'),
            (1, 'estado', 'Estado cambiado: borrador → en_proceso'),
            (2, 'estado', 'Estado cambiado: en_proceso → completada'),
            (2, 'comentario', 'Informe final aprobado'),
            (3, 'asignacion', f'Agente asignado: {agent.name} {agent.last}' if agent else 'Agente asignado'),
            (3, 'estado', 'Estado cambiado: borrador → completada'),
            (4, 'estado', 'Estado cambiado: borrador → en_proceso'),
            (4, 'comentario', 'Se solicitó documentación adicional'),
        ]

        for i, (aidx, content) in enumerate(comments_data):
            a = appraisals[aidx % len(appraisals)]
            c = AppraisalComment(
                appraisal_id=a.id,
                user_id=user_id,
                content=content,
                created_at=now - timedelta(hours=len(comments_data) - i),
            )
            db.session.add(c)

        for i, (aidx, event_type, description) in enumerate(timeline_data):
            a = appraisals[aidx % len(appraisals)]
            t = AppraisalTimeline(
                appraisal_id=a.id,
                event_type=event_type,
                description=description,
                user_id=user_id,
                created_at=now - timedelta(hours=len(timeline_data) - i),
            )
            db.session.add(t)

        seed_agents = Agent.query.all()
        for i, a in enumerate(appraisals):
            if seed_agents:
                a.assigned_agent_id = seed_agents[i % len(seed_agents)].id
            a.priority = ['media', 'alta', 'baja', 'urgente', 'media'][i % 5]

        db.session.commit()
        print(f'Seeded {len(comments_data)} comments and {len(timeline_data)} timeline entries for {len(appraisals)} appraisals.')
