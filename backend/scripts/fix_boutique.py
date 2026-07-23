"""
fix_boutique.py — Elimina 'boutique' de settings en la DB (formato clave/valor)
Usar:  DATABASE_URL=<url> python fix_boutique.py
"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from flask import Flask
from extensions import db
from models import Settings

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    keys = ('about_eyebrow', 'seo_description')
    changed = False
    for key in keys:
        row = Settings.query.filter_by(key=key).first()
        if row and 'boutique' in row.value:
            old = row.value
            row.value = row.value.replace('boutique ', '').replace('boutique', '')
            changed = True
            print(f"  Fixed {key}: {old} -> {row.value}")
    if changed:
        db.session.commit()
        print("Settings actualizados")
    else:
        print("No habia 'boutique' en settings")
