# backend/scripts/migrate_snapshots.py
"""Safe snapshot migration: 'tasacion' key -> 'appraisal' key in version snapshots."""
from backend.app import create_app
from backend.extensions import db
from backend.models.appraisal import AppraisalVersion
from backend.models.tasacion import TasacionVersion
import json

app = create_app()
with app.app_context():
    tas_versions = TasacionVersion.query.all()
    migrated = 0
    
    for tv in tas_versions:
        if not tv.snapshot_json:
            continue
        
        try:
            snapshot = json.loads(tv.snapshot_json)
        except json.JSONDecodeError:
            print(f"WARNING: Invalid JSON in TasacionVersion {tv.id}, skipping")
            continue
        
        # Safe key rename at root level only
        if 'tasacion' in snapshot:
            snapshot['appraisal'] = snapshot.pop('tasacion')
        
        # Also normalize comparable snapshots if they reference 'tasacion'
        if 'comparables' in snapshot:
            for comp in snapshot['comparables']:
                # Comparables don't have 'tasacion' key, but normalize any reference
                pass
        
        av = AppraisalVersion(
            id=tv.id,
            appraisal_id=tv.tasacion_id,
            version=tv.version,
            snapshot_json=json.dumps(snapshot, ensure_ascii=False),
            pdf_path=tv.pdf_path,
            created_at=tv.created_at,
            created_by=tv.created_by
        )
        db.session.merge(av)
        migrated += 1
    
    db.session.commit()
    print(f"Migrated {migrated} version snapshots safely")