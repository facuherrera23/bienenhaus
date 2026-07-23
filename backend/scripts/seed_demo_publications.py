"""Seed demo portal publications with varied statuses for Módulo 14."""
from datetime import datetime, timezone, timedelta
from extensions import db
from models import Portal, PortalPublication, PortalLog, Property, Rental, Agent
from portals.queue import QueueService


def run(app):
    with app.app_context():
        existing = PortalPublication.query.count()
        if existing > 5:
            print(f'Publications already seeded ({existing}), skipping.')
            return

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        portals = Portal.query.all()
        if not portals:
            print('No portals found. Create portals first.')
            return

        properties = Property.query.limit(10).all()
        rentals = Rental.query.limit(5).all()
        agents = Agent.query.limit(3).all()

        statuses = ['published', 'published', 'published', 'pending', 'error',
                    'published', 'paused', 'published', 'pending', 'error',
                    'published', 'published', 'synced', 'error', 'published']

        count = 0
        for i, prop in enumerate(properties):
            portal = portals[i % len(portals)]
            status = statuses[i % len(statuses)]
            agent = agents[i % len(agents)] if agents else None
            pub = PortalPublication(
                portal_id=portal.id,
                property_id=prop.id,
                status=status,
                external_id=f'EXT-{portal.slug}-{prop.id}',
                attempts=1 if status in ('published', 'synced') else 3 if status == 'error' else 0,
                last_error='Error de conexión: timeout' if status == 'error' else '',
                published_at=now - timedelta(days=i * 2) if status in ('published', 'synced') else None,
                created_at=now - timedelta(days=i * 3 + 5),
                updated_at=now - timedelta(hours=i),
                last_synced_at=now - timedelta(hours=i * 4) if status in ('published', 'synced') else None,
                assigned_agent_id=agent.id if agent else None,
            )
            if status == 'paused':
                pub.paused_at = now - timedelta(days=1)
            db.session.add(pub)

            # Log de creación
            db.session.add(PortalLog(
                portal_id=portal.id, property_id=prop.id,
                action='publish', level='info',
                message=f'Publicación creada para {prop.title} en {portal.name}',
                created_at=pub.created_at,
            ))
            count += 1

        for i, rental in enumerate(rentals):
            portal = portals[(i + 2) % len(portals)]
            status = statuses[(i + 5) % len(statuses)]
            pub = PortalPublication(
                portal_id=portal.id,
                rental_id=rental.id,
                status=status,
                external_id=f'EXT-{portal.slug}-R{rental.id}',
                published_at=now - timedelta(days=i * 3) if status in ('published', 'synced') else None,
                created_at=now - timedelta(days=i * 4 + 2),
                updated_at=now - timedelta(hours=i * 3),
                last_synced_at=now - timedelta(hours=i * 5) if status in ('published', 'synced') else None,
            )
            if status == 'paused':
                pub.paused_at = now - timedelta(days=2)
            db.session.add(pub)
            db.session.add(PortalLog(
                portal_id=portal.id, property_id=None,
                action='publish', level='info',
                message=f'Publicación creada para alquiler {rental.title} en {portal.name}',
            ))
            count += 1

        db.session.commit()
        print(f'Seeded {count} publications with logs.')
