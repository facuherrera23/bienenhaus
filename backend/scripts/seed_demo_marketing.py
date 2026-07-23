"""Seed demo marketing campaigns and metrics for Módulo 13."""
from datetime import datetime, timezone, timedelta, date
from extensions import db
from models import MarketingCampaign, MarketingMetric


def run(app):
    with app.app_context():
        existing = MarketingCampaign.query.first()
        if existing:
            print('Marketing data already seeded, skipping.')
            return

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        today = now.date()

        campaigns = [
            {
                'name': 'Lanzamiento Nueva Córdoba',
                'description': 'Campaña de lanzamiento de 15 departamentos en barrio Nueva Córdoba.',
                'budget': 25000, 'start_date': today - timedelta(days=45),
                'end_date': today - timedelta(days=15),
                'status': 'completed', 'platform': 'facebook',
                'roi': 3.5, 'leads_generated': 28,
                'results': 'Se generaron 28 leads calificados, 5 ventas concretadas.',
            },
            {
                'name': 'Propiedades Premium Cerro',
                'description': 'Campaña enfocada en propiedades de alta gama en Cerro de las Rosas.',
                'budget': 40000, 'start_date': today - timedelta(days=30),
                'end_date': today + timedelta(days=30),
                'status': 'active', 'platform': 'instagram',
                'roi': 2.1, 'leads_generated': 15,
                'results': '15 leads generados hasta el momento, buen engagement.',
            },
            {
                'name': 'Alquileres Temporarios',
                'description': 'Promoción de alquileres temporarios para la temporada.',
                'budget': 10000, 'start_date': today + timedelta(days=10),
                'end_date': today + timedelta(days=40),
                'status': 'draft', 'platform': 'facebook',
                'roi': 0, 'leads_generated': 0,
                'results': '',
            },
            {
                'name': 'Inversores Zona Norte',
                'description': 'Campaña orientada a inversores interesados en zona norte.',
                'budget': 18000, 'start_date': today - timedelta(days=60),
                'end_date': today - timedelta(days=30),
                'status': 'completed', 'platform': 'linkedin',
                'roi': 4.2, 'leads_generated': 22,
                'results': '22 leads de inversores, 3 propiedades vendidas.',
            },
            {
                'name': 'Descuentos por Temporada',
                'description': 'Campaña de descuentos en honorarios por temporada baja.',
                'budget': 8000, 'start_date': today - timedelta(days=20),
                'end_date': today + timedelta(days=10),
                'status': 'active', 'platform': 'instagram',
                'roi': 1.8, 'leads_generated': 10,
                'results': '10 leads, 2 operaciones en curso.',
            },
        ]

        for c_data in campaigns:
            c = MarketingCampaign(**c_data)
            db.session.add(c)

        metrics_data = []
        for i in range(30, -1, -1):
            d = today - timedelta(days=i)
            metrics_data.extend([
                {'date': d, 'platform': 'facebook', 'metric': 'reach', 'value': 500 + i * 20},
                {'date': d, 'platform': 'instagram', 'metric': 'reach', 'value': 300 + i * 15},
                {'date': d, 'platform': 'facebook', 'metric': 'clicks', 'value': 50 + i * 3},
                {'date': d, 'platform': 'instagram', 'metric': 'clicks', 'value': 30 + i * 2},
                {'date': d, 'platform': 'facebook', 'metric': 'leads', 'value': max(0, 5 - i // 7)},
                {'date': d, 'platform': 'instagram', 'metric': 'leads', 'value': max(0, 3 - i // 10)},
            ])

        for m_data in metrics_data:
            m = MarketingMetric(**m_data)
            db.session.add(m)

        db.session.commit()
        print(f'Seeded {len(campaigns)} campaigns and {len(metrics_data)} metrics.')
