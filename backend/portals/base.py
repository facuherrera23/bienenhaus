"""
portals/base.py — Clase base abstracta para integración con portales inmobiliarios.

Cada portal concreto (ZonaProp, Argenprop, ML) debe heredar de PortalBase
e implementar los métodos de publicación, actualización y despublicación.
"""
from abc import ABC, abstractmethod
from extensions import db
from models import PortalLog, PortalPublication
from datetime import datetime, timezone


class PortalBase(ABC):
    """Clase base para integraciones de portales inmobiliarios."""

    def __init__(self, portal):
        self.portal = portal
        self.config = portal.config if portal else {}

    @property
    @abstractmethod
    def slug(self):
        ...

    @abstractmethod
    def publish(self, property_data):
        """Publica una propiedad en el portal.
        Retorna (success: bool, external_id: str, error: str).
        """
        ...

    @abstractmethod
    def update(self, external_id, property_data):
        """Actualiza una propiedad ya publicada.
        Retorna (success: bool, error: str).
        """
        ...

    @abstractmethod
    def unpublish(self, external_id):
        """Despublica/elimina una propiedad del portal.
        Retorna (success: bool, error: str).
        """
        ...

    def validate(self, property_data):
        """Valida que la propiedad tenga los campos mínimos para el portal.
        Retorna (valid: bool, errors: list).
        """
        required = ['title', 'type', 'price', 'location']
        errors = [f'Falta {f}' for f in required if not property_data.get(f)]
        return (len(errors) == 0, errors)

    def _log(self, action, level, message, property_id=None, raw_response=''):
        log = PortalLog(
            portal_id=self.portal.id,
            property_id=property_id,
            action=action,
            level=level,
            message=message,
            raw_response=str(raw_response)[:5000],
        )
        db.session.add(log)
        db.session.commit()

    def _update_publication(self, property_id, rental_id, status,
                            external_id='', error=''):
        pub = PortalPublication.query.filter_by(
            portal_id=self.portal.id,
            property_id=property_id,
            rental_id=rental_id,
        ).first()
        if not pub:
            pub = PortalPublication(
                portal_id=self.portal.id,
                property_id=property_id,
                rental_id=rental_id,
            )
            db.session.add(pub)
        pub.status = status
        pub.external_id = external_id or pub.external_id
        pub.attempts = (pub.attempts or 0) + 1
        pub.last_error = error
        if status == 'published':
            pub.published_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.session.commit()
        return pub
