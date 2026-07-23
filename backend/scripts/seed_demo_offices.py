"""
seed_demo_offices.py — Carga oficinas demo para el Centro de Configuración.
"""
def run(app):
    from extensions import db
    from models import Office

    if Office.query.count() > 0:
        print('[seed] Offices already exist, skipping.')
        return

    offices = [
        {
            'name': 'Oficina Central · Nueva Córdoba',
            'address': 'Av. Vélez Sarsfield 1234',
            'city': 'Córdoba',
            'province': 'Córdoba',
            'country': 'Argentina',
            'phone': '+54 351 411-0001',
            'manager': 'Martín Bianchi',
            'schedule': 'Lun–Vie 9:00–18:00 · Sáb 9:00–13:00',
            'latitude': -31.4201,
            'longitude': -64.1888,
            'active': True,
            'sort_order': 0,
        },
        {
            'name': 'Sucursal Cerro de las Rosas',
            'address': 'Av. Rafael Núñez 4567',
            'city': 'Córdoba',
            'province': 'Córdoba',
            'country': 'Argentina',
            'phone': '+54 351 411-0002',
            'manager': 'Laura Castellano',
            'schedule': 'Lun–Vie 10:00–19:00 · Sáb 10:00–14:00',
            'latitude': -31.3969,
            'longitude': -64.2456,
            'active': True,
            'sort_order': 1,
        },
    ]

    for data in offices:
        office = Office(**data)
        db.session.add(office)

    db.session.commit()
    print(f'[seed] Created {len(offices)} offices.')
