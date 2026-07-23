# backend/scripts/check_id_collision.py
"""Verify no ID collision between appraisals and tasaciones before migration."""
from backend.app import create_app
from backend.extensions import db
from backend.models.appraisal import Appraisal
from backend.models.tasacion import Tasacion

app = create_app()
with app.app_context():
    appraisal_ids = {r[0] for r in db.session.query(Appraisal.id).all()}
    tasacion_ids = {r[0] for r in db.session.query(Tasacion.id).all()}
    
    collision = appraisal_ids & tasacion_ids
    
    print(f"Appraisal IDs: {len(appraisal_ids)} (range: {min(appraisal_ids) if appraisal_ids else 'N/A'} - {max(appraisal_ids) if appraisal_ids else 'N/A'})")
    print(f"Tasacion IDs:  {len(tasacion_ids)} (range: {min(tasacion_ids) if tasacion_ids else 'N/A'} - {max(tasacion_ids) if tasacion_ids else 'N/A'})")
    print(f"Colisión de IDs: {len(collision)}")
    
    if collision:
        print(f"IDs en conflicto: {sorted(collision)}")
        raise SystemExit(1)
    else:
        print("✅ Sin colisiones — preservar PK es seguro")