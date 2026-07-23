"""
portals/zonaprop.py — Adaptador para ZonaProp / Argenprop.

ZonaProp no expone API pública en tiempo real; la integración se realiza
generando un feed XML que se sube vía SFTP o se sirve en una URL accesible
para que ellos lo indexen periódicamente.

Config esperada en el portal:
  sftp_host: str     → Host SFTP (ej: sftp.zonaprop.com)
  sftp_port: int     → Puerto SFTP (default: 22)
  sftp_user: str     → Usuario SFTP
  sftp_pass: str     → Contraseña SFTP
  sftp_path: str     → Ruta remota del archivo (ej: /feed/inmuebles.xml)
  feed_url: str      → URL pública del feed (opcional, para logging)
"""
import os
import json
import logging
from datetime import datetime, timezone
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom
from extensions import db
from models import Settings
from .base import PortalBase

try:
    import sentry_sdk
    _has_sentry = True
except ImportError:
    _has_sentry = False

logger = logging.getLogger(__name__)


def _capture(msg, extra=None):
    if _has_sentry:
        with sentry_sdk.push_scope() as scope:
            if extra:
                for k, v in extra.items():
                    scope.set_extra(k, v)
            sentry_sdk.capture_message(msg, level='error')


FEED_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'static', 'feeds')
FEED_FILENAME = 'zonaprop_feed.xml'
FEED_VERSION_KEY = 'zonaprop_feed_version'


class ZonaPropAdapter(PortalBase):
    """Adaptador para ZonaProp mediante feed XML + SFTP opcional."""

    slug = 'zonaprop'

    def __init__(self, portal):
        super().__init__(portal)
        os.makedirs(FEED_DIR, exist_ok=True)
        self._dirty = False

    # ── Contacto desde Settings ────────────────────────────────────────

    def _get_contact_info(self):
        s = Settings.all_dict()
        return {
            'name': s.get('seo_site_name', 'Bienenhaus Propiedades'),
            'phone': s.get('phone', ''),
            'whatsapp': s.get('whatsapp', ''),
            'email': s.get('email', ''),
        }

    # ── Conversión a XML ───────────────────────────────────────────────

    def _property_to_zonaprop(self, prop, contact):
        tipo_map = {
            'casa': 'Casa',
            'departamento': 'Departamento',
            'local': 'Local',
            'oficina': 'Oficina',
            'terreno': 'Terreno',
            'ph': 'PH',
            'galpon': 'Galpón',
            'quinta': 'Quinta',
        }
        operacion = 'Venta'
        tipo = tipo_map.get(prop.type, prop.type.capitalize())
        moneda = 'USD'
        precio = str(int(prop.price)) if prop.price else '0'

        inmueble = Element('inmueble')
        SubElement(inmueble, 'operacion').text = operacion
        SubElement(inmueble, 'titulo').text = prop.title or ''
        SubElement(inmueble, 'descripcion').text = prop.description or ''
        SubElement(inmueble, 'precio').text = precio
        SubElement(inmueble, 'moneda').text = moneda
        SubElement(inmueble, 'tipo').text = tipo
        SubElement(inmueble, 'dormitorios').text = str(int(prop.beds)) if prop.beds else '0'
        SubElement(inmueble, 'banos').text = str(int(prop.baths)) if prop.baths else '0'
        SubElement(inmueble, 'superficie').text = str(int(prop.sqm)) if prop.sqm else '0'
        SubElement(inmueble, 'estado').text = prop.status or 'disponible'

        ubicacion = SubElement(inmueble, 'ubicacion')
        SubElement(ubicacion, 'direccion').text = ''
        SubElement(ubicacion, 'localidad').text = prop.location or ''

        imagenes = SubElement(inmueble, 'imagenes')
        for img in (prop.images or []):
            img_elem = SubElement(imagenes, 'imagen')
            img_elem.text = img

        contacto = SubElement(inmueble, 'contacto')
        SubElement(contacto, 'nombre').text = contact['name']
        SubElement(contacto, 'telefono').text = contact['phone']
        SubElement(contacto, 'email').text = contact['email']

        return inmueble

    def _rental_to_zonaprop(self, rental, contact):
        tipo_map = {
            'casa': 'Casa',
            'departamento': 'Departamento',
            'local': 'Local',
            'oficina': 'Oficina',
            'terreno': 'Terreno',
            'ph': 'PH',
            'galpon': 'Galpón',
            'quinta': 'Quinta',
        }
        tipo = tipo_map.get(rental.type, rental.type.capitalize())
        moneda = 'ARS'
        precio = str(int(rental.price_ars)) if rental.price_ars else '0'

        inmueble = Element('inmueble')
        SubElement(inmueble, 'operacion').text = 'Alquiler'
        SubElement(inmueble, 'titulo').text = rental.title or ''
        SubElement(inmueble, 'descripcion').text = rental.description or ''
        SubElement(inmueble, 'precio').text = precio
        SubElement(inmueble, 'moneda').text = moneda
        SubElement(inmueble, 'tipo').text = tipo
        SubElement(inmueble, 'dormitorios').text = str(int(rental.beds)) if rental.beds else '0'
        SubElement(inmueble, 'banos').text = str(int(rental.baths)) if rental.baths else '0'
        SubElement(inmueble, 'superficie').text = str(int(rental.sqm)) if rental.sqm else '0'
        SubElement(inmueble, 'estado').text = rental.status or 'disponible'

        if rental.expenses:
            SubElement(inmueble, 'expensas').text = str(int(rental.expenses))
        SubElement(inmueble, 'amoblado').text = 'Si' if rental.furnished else 'No'
        if rental.min_months:
            SubElement(inmueble, 'minimo_meses').text = str(rental.min_months)

        ubicacion = SubElement(inmueble, 'ubicacion')
        SubElement(ubicacion, 'direccion').text = ''
        SubElement(ubicacion, 'localidad').text = rental.location or ''

        imagenes = SubElement(inmueble, 'imagenes')
        for img in (rental.images or []):
            img_elem = SubElement(imagenes, 'imagen')
            img_elem.text = img

        contacto = SubElement(inmueble, 'contacto')
        SubElement(contacto, 'nombre').text = contact['name']
        SubElement(contacto, 'telefono').text = contact['phone']
        SubElement(contacto, 'email').text = contact['email']

        return inmueble

    # ── Feed XML ───────────────────────────────────────────────────────

    def _generate_feed_xml(self):
        """Genera el XML del feed con todas las propiedades activas.
        Retorna (xml_str: str, count: int)."""
        from models import Property, Rental

        root = Element('lista')
        contact = self._get_contact_info()

        props = Property.query.filter(
            Property.status.in_(['disponible', 'vendida'])
        ).all()
        for p in props:
            root.append(self._property_to_zonaprop(p, contact))

        rentals = Rental.query.filter(
            Rental.status.in_(['disponible', 'alquilada'])
        ).all()
        for r in rentals:
            root.append(self._rental_to_zonaprop(r, contact))

        xml_str = minidom.parseString(
            tostring(root, encoding='unicode')
        ).toprettyxml(indent='  ')

        return xml_str, len(props) + len(rentals)

    def _write_local_feed(self, xml_str):
        """Escribe el feed XML a disco. Retorna el path absoluto."""
        feed_path = os.path.join(FEED_DIR, FEED_FILENAME)
        with open(feed_path, 'w', encoding='utf-8') as f:
            f.write(xml_str)
        return feed_path

    def _upload_sftp(self, xml_str):
        """Sube el feed XML por SFTP si hay configuración.
        Retorna True si se configuró SFTP y se subió OK.
        Lanza excepción si falla la subida."""
        host = self.config.get('sftp_host', '').strip()
        if not host:
            return False

        port = int(self.config.get('sftp_port', 22))
        user = self.config.get('sftp_user', '').strip()
        password = self.config.get('sftp_pass', '').strip()
        remote_path = self.config.get('sftp_path', '').strip()

        if not remote_path:
            remote_path = f'/upload/{FEED_FILENAME}'

        import paramiko
        transport = paramiko.Transport((host, port))
        try:
            transport.connect(username=user, password=password)
            sftp = paramiko.SFTPClient.from_transport(transport)
            try:
                with sftp.open(remote_path, 'w') as f:
                    f.write(xml_str)
            finally:
                sftp.close()
        finally:
            transport.close()
        return True

    def _sync_feed(self):
        """Genera el feed, lo guarda local y lo sube por SFTP.
        Retorna (feed_version: str, count: int)."""
        xml_str, count = self._generate_feed_xml()
        self._write_local_feed(xml_str)

        feed_version = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')

        try:
            uploaded = self._upload_sftp(xml_str)
            if uploaded:
                self._log('sftp', 'info',
                          f'Feed subido por SFTP a {self.config.get("sftp_host")} '
                          f'({count} propiedades)')
        except Exception as e:
            self._log('sftp', 'error',
                      f'Error SFTP: {str(e)[:500]}',
                      raw_response=str(e))
            _capture('Error SFTP feed ZonaProp', extra={
                'host': self.config.get('sftp_host'),
                'error': str(e)[:500],
            })

        return feed_version, count

    # ── Dirty flag (sync diferido) ─────────────────────────────────────

    def _mark_dirty(self):
        """Marca el feed como sucio para regenerarlo al final del batch."""
        self._dirty = True

    def sync_if_dirty(self):
        """Regenera y sube el feed SOLO si hubo cambios.
        Diseñado para llamarse UNA vez al final del batch.
        El flag _dirty solo se limpia si la sincronización fue exitosa."""
        if not self._dirty:
            return
        try:
            feed_version, count = self._sync_feed()
            self._dirty = False
            logger.info('Feed ZonaProp sincronizado (versión %s, %d props)',
                         feed_version, count)
        except Exception as e:
            logger.error('Error sincronizando feed ZonaProp: %s', e)
            _capture('Error sync ZonaProp feed', extra={
                'error': str(e)[:500],
            })
            raise

    # ── Operaciones CRUD ───────────────────────────────────────────────

    def publish(self, property_data):
        try:
            self._mark_dirty()
            feed_version = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')
            return (True, feed_version, '')
        except Exception as e:
            error = str(e)[:500]
            self._log('publish', 'error', error,
                      property_id=property_data.get('id'))
            return (False, '', error)

    def update(self, external_id, property_data):
        try:
            self._mark_dirty()
            return (True, '')
        except Exception as e:
            error = str(e)[:500]
            self._log('update', 'error', error,
                      property_id=property_data.get('id'))
            return (False, error)

    def unpublish(self, external_id):
        try:
            self._mark_dirty()
            return (True, '')
        except Exception as e:
            error = str(e)[:500]
            self._log('unpublish', 'error', error)
            return (False, error)
