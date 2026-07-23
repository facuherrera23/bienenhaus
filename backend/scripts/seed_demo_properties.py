"""Seed 1 sale + 1 rental property for testing detail pages."""
import json
from extensions import db
from models import Property, Rental


def run(app):
    with app.app_context():
        seeded = 0

        # --- Sale property ---
        if not Property.query.filter_by(title='Casa en Nueva Córdoba - 3 Dormitorios').first():
            sale = Property(
                title='Casa en Nueva Córdoba - 3 Dormitorios',
                type='casa',
                location='Nueva Córdoba, Córdoba Capital',
                price=185000,
                beds=3,
                baths=2,
                sqm=120,
                sqm_total=180,
                parkings=2,
                antiquity='10 años',
                status='disponible',
                featured=True,
                description=(
                    'Hermosa casa ubicada en el corazón de Nueva Córdoba, '
                    'a metros de la Ciudad Universitaria. Cuenta con amplio living comedor, '
                    'cocina integrada con anafe, horno y campana. Tres dormitorios con '
                    'placares incorporados, el principal con baño en suite. Patio con parrilla '
                    'y jardín. Cochera cubierta para dos autos. Excelente iluminación natural '
                    'y ventilación cruzada.'
                ),
                images_json=json.dumps([]),
                video_url='',
                latitude=-31.4216,
                longitude=-64.1888,
            )
            db.session.add(sale)
            seeded += 1

        # --- Rental property ---
        if not Rental.query.filter_by(title='Departamento en Centro - 2 Ambientes').first():
            rental = Rental(
                title='Departamento en Centro - 2 Ambientes',
                type='departamento',
                location='Centro, Córdoba Capital',
                price_ars=320000,
                expenses=25000,
                beds=2,
                baths=1,
                sqm=55,
                status='disponible',
                featured=True,
                min_months=6,
                furnished=True,
                description=(
                    'Moderno departamento en el centro de la ciudad, totalmente amoblado. '
                    'Living comedor con cocina tipo americana, balcón con vista a la calle. '
                    'Dormitorio con cama queen y placard. Baño completo con artefactos '
                    'nuevos. Aire acondicionado frío/calor. A pasos de peatonal, '
                    'supermercados y transporte público. Expensas incluyen agua y '
                    'mantenimiento de espacios comunes.'
                ),
                images_json=json.dumps([
                    '/static/images/propiedades/depto-centro-1.webp',
                    '/static/images/propiedades/depto-centro-2.webp',
                    '/static/images/propiedades/depto-centro-3.webp',
                ]),
                video_url='',
                latitude=-31.4135,
                longitude=-64.1810,
            )
            db.session.add(rental)
            seeded += 1

        db.session.commit()
        props = Property.query.count()
        rentals = Rental.query.count()
        print(f'Seeded {seeded} properties ({props} total properties, {rentals} total rentals).')
