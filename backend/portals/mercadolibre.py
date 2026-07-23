"""
portals/mercadolibre.py — Adaptador para MercadoLibre.

Usa la API pública de MercadoLibre (https://api.mercadolibre.com)
con OAuth 2.0 para publicar, actualizar y despublicar propiedades.

Config esperada en el portal:
  client_id: str       → App ID de MercadoLibre
  client_secret: str   → App Secret
  refresh_token: str   → Refresh token para obtener access token
  access_token: str    → Token directo (alternativa a refresh)
  user_id: int         → ID de usuario vendedor de ML
  site_id: str         → MLA, MLB, MLM, etc. (default: MLA)
  listing_type: str    → Tipo de publicación (gold, gold_premium,
                          silver, bronze, free). Default: gold
  state_id: str        → ID de provincia ML (ej: AR-X). Default: AR-X
  city_id: str         → ID de ciudad ML (ej: TUxBQ0NBUGNiZGQx).
                          Default: TUxBQ0NBUGNiZGQx (Córdoba Capital)
"""
import json
import os
import random
import time
import logging
from typing import Any
from urllib.parse import urlencode

import requests
from flask import request
from sqlalchemy import text
from extensions import db
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


API_BASE = 'https://api.mercadolibre.com'
TOKEN_URL = f'{API_BASE}/oauth/token'
MAX_RETRIES = 3
RETRY_BACKOFF = [1, 4, 10]
_TOKEN_BUFFER = 60
_TOKEN_LIFETIME = 21600


class MercadoLibreAdapter(PortalBase):
    """Adaptador para MercadoLibre mediante API REST."""

    slug = 'mercadolibre'

    LISTING_TYPES = {
        'gold_premium': 'gold_premium',
        'gold': 'gold',
        'silver': 'silver',
        'bronze': 'bronze',
        'free': 'free',
    }

    TIPO_MAP = {
        'casa': 'MLA1466',
        'departamento': 'MLA1472',
        'finca': 'MLA50547',
        'terreno': 'MLA1493',
        'local': 'MLA79242',
        'cochera': 'MLA50541',
        'oficina': 'MLA50538',
        'ph': 'MLA105179',
        'otro': 'MLA1892',
    }

    REAL_ESTATE_CATEGORIES = set(TIPO_MAP.values())

    def __init__(self, portal):
        super().__init__(portal)
        self._access_token = None
        self._token_expires = 0

    # ── OAuth ──────────────────────────────────────────────────────────

    def _acquire_refresh_lock(self, portal_id):
        bind = db.session.bind
        if bind is not None and bind.dialect.name == 'postgresql':
            lock_key = hash(f'ml_oauth_refresh_{portal_id}') % (2**31 - 1)
            db.session.execute(text("SELECT pg_advisory_lock(:key)"),
                               {'key': lock_key})

    def _release_refresh_lock(self, portal_id):
        bind = db.session.bind
        if bind is not None and bind.dialect.name == 'postgresql':
            lock_key = hash(f'ml_oauth_refresh_{portal_id}') % (2**31 - 1)
            db.session.execute(text("SELECT pg_advisory_unlock(:key)"),
                               {'key': lock_key})

    def _get_access_token(self, force_refresh=False):
        now = time.time()
        if not force_refresh:
            if self._access_token and now < self._token_expires - _TOKEN_BUFFER:
                return self._access_token
            stored = self.config.get('access_token', '')
            if stored:
                self._access_token = stored
                self._token_expires = now + _TOKEN_LIFETIME
                return self._access_token

        refresh_token = self.config.get('refresh_token', '')
        if not refresh_token:
            raise ValueError('MercadoLibre requiere refresh_token o access_token en la config.')

        portal_id = self.portal.id if self.portal else 0
        self._acquire_refresh_lock(portal_id)
        try:
            resp = requests.post(TOKEN_URL, data={
                'grant_type': 'refresh_token',
                'client_id': self.config.get('client_id', ''),
                'client_secret': self.config.get('client_secret', ''),
                'refresh_token': refresh_token,
            }, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            self._access_token = data['access_token']
            self._token_expires = now + data.get('expires_in', _TOKEN_LIFETIME)

            new_config = dict(self.config)
            new_config['access_token'] = data['access_token']
            if data.get('refresh_token'):
                new_config['refresh_token'] = data['refresh_token']
            self.portal.config = new_config
            self.config = new_config
            db.session.commit()

            logger.info('Token ML renovado para portal %d, expires in %ds',
                         portal_id, data.get('expires_in', 0))
        except requests.exceptions.RequestException as e:
            logger.error('Error renovando token ML para portal %d: %s', portal_id, e)
            _capture('Error renovando token MercadoLibre', extra={
                'portal_id': portal_id, 'error': str(e)[:500],
            })
            raise
        finally:
            self._release_refresh_lock(portal_id)
        return self._access_token

    def _api_headers(self):
        token = self._get_access_token()
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

    def _request(self, method, url, **kwargs):
        kwargs.setdefault('timeout', 30)
        last_resp = None
        for attempt in range(MAX_RETRIES):
            last_resp = requests.request(method, url, headers=self._api_headers(), **kwargs)
            if last_resp.status_code == 429:
                wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                jitter = random.uniform(0.5, 1.5)
                logger.warning('ML 429 rate limited, retrying in %.1fs (attempt %d/%d)',
                               wait * jitter, attempt + 1, MAX_RETRIES)
                time.sleep(wait * jitter)
                continue
            if last_resp.status_code == 401:
                logger.info('ML 401, forzando refresh token...')
                self._get_access_token(force_refresh=True)
                if attempt < MAX_RETRIES - 1:
                    continue
            if last_resp.status_code >= 500:
                wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                jitter = random.uniform(0.5, 1.5)
                logger.warning('ML %d server error, retrying in %.1fs (attempt %d/%d)',
                               last_resp.status_code, wait * jitter, attempt + 1, MAX_RETRIES)
                time.sleep(wait * jitter)
                continue
            return last_resp
        return last_resp

    # ── Mapeo de datos ─────────────────────────────────────────────────

    def _is_real_estate(self, category_id):
        return category_id in self.REAL_ESTATE_CATEGORIES

    def _build_item_data(self, property_data):
        user_id = self.config.get('user_id', '')
        category_id = self.TIPO_MAP.get(property_data.get('type', ''), 'MLA1459')
        images = property_data.get('images', [])

        is_rental = property_data.get('operation') == 'alquiler' or property_data.get('price_ars') is not None
        currency_id = 'ARS' if is_rental else 'USD'
        price = float(property_data.get('price_ars' if is_rental else 'price', 0) or 0)

        listing_type_id = property_data.get('listing_type_id') or self.LISTING_TYPES.get(
            self.config.get('listing_type', 'gold').lower(), 'gold'
        )

        item = {
            'title': property_data.get('title', ''),
            'category_id': category_id,
            'price': price,
            'currency_id': currency_id,
            'available_quantity': 1,
            'buying_mode': 'classified' if self._is_real_estate(category_id) else 'buy_it_now',
            'listing_type_id': listing_type_id,
            'condition': 'not_specified',
            'description': {'plain_text': property_data.get('description', '')},
            'pictures': [{'source': img} for img in images[:10]],
            'location': {
                'state_id': self.config.get('state_id', 'AR-X'),
                'city_id': self.config.get('city_id', 'TUxBQ0NBUGNiZGQx'),
            },
            'attributes': [],
        }

        if user_id:
            item['seller_id'] = int(user_id)

        for attr_id, field in (
            ('ROOMS', 'beds'), ('BATHROOMS', 'baths'),
            ('SQUARE_METER', 'sqm'), ('SQUARE_TOTAL', 'sqm_total'),
            ('PARKINGS', 'parkings'),
        ):
            val = property_data.get(field, 0)
            if val:
                item['attributes'].append({'id': attr_id, 'value_name': str(val)})
        for attr_id, field in (('AGE', 'antiquity'), ('FLOOR', 'floor')):
            val = property_data.get(field, '')
            if val:
                item['attributes'].append({'id': attr_id, 'value_name': val})
        loc = (property_data.get('location') or '').strip()
        if loc:
            item['attributes'].append({'id': 'ADDRESS', 'value_name': loc})

        return item

    # ── Operaciones CRUD ──────────────────────────────────────────────

    def publish(self, property_data):
        try:
            self._get_access_token()
            data = self._build_item_data(property_data)
            resp = self._request('POST', f'{API_BASE}/items', json=data)
            if resp is None:
                return (False, '', 'No se obtuvo respuesta de MercadoLibre')
            if resp.status_code == 201:
                result = resp.json()
                ext_id = result.get('id', '')
                permalink = result.get('permalink', '')
                self._log('publish', 'info',
                          f'Publicado en ML: {ext_id} | {permalink}',
                          property_id=property_data.get('id'))
                return (True, ext_id, '')
            else:
                return (False, '', self._error_msg(resp, 'publish', property_data.get('id')))
        except requests.exceptions.Timeout:
            return (False, '', 'Timeout al conectar con MercadoLibre API')
        except requests.exceptions.RequestException as e:
            return (False, '', f'Error de conexión: {str(e)[:500]}')
        except Exception as e:
            return (False, '', f'Error inesperado: {str(e)[:500]}')

    def _error_msg(self, resp, operation, property_id=None):
        error_body = resp.text[:2000]
        try:
            error_json = resp.json()
            error_msg = error_json.get('message', error_body)
            cause = error_json.get('cause', [])
            if cause:
                error_msg += f' | {cause}'
                if 'category_id.invalid' in error_msg:
                    error_msg = (
                        'La cuenta de MercadoLibre no está habilitada '
                        'para publicar inmuebles. Requiere: '
                        '1) Configurar cuenta como inmobiliaria en ML, '
                        '2) Contratar un paquete de publicaciones. '
                        'Contactar a soporte de ML developers.'
                    )
        except Exception:
            error_msg = error_body
        self._log(operation, 'error', error_msg,
                  property_id=property_id or 0,
                  raw_response=error_body)
        return error_msg

    def update(self, external_id, property_data):
        try:
            close = property_data.get('status') in ('closed', 'vendida')
            if close:
                return self.unpublish(external_id)
            data = self._build_item_data(property_data)
            resp = self._request('PUT', f'{API_BASE}/items/{external_id}', json=data)
            if resp is None:
                return (False, 'No se obtuvo respuesta de MercadoLibre')
            if resp.status_code == 200:
                self._log('update', 'info',
                          f'Actualizado en ML: {external_id}',
                          property_id=property_data.get('id'))
                return (True, '')
            else:
                return (False, self._error_msg_body(resp))
        except requests.exceptions.RequestException as e:
            return (False, f'Error de conexión: {str(e)[:500]}')
        except Exception as e:
            return (False, f'Error inesperado: {str(e)[:500]}')

    def _error_msg_body(self, resp):
        error_body = resp.text[:2000]
        try:
            error_json = resp.json()
            return error_json.get('message', error_body)
        except Exception:
            return error_body

    def unpublish(self, external_id):
        try:
            resp = self._request('PUT', f'{API_BASE}/items/{external_id}',
                                 json={'status': 'closed'})
            if resp is None:
                return (False, 'No se obtuvo respuesta de MercadoLibre')
            if resp.status_code == 200:
                self._log('unpublish', 'info',
                          f'Despublicado de ML: {external_id}')
                return (True, '')
            else:
                return (False, self._error_msg_body(resp))
        except requests.exceptions.RequestException as e:
            return (False, f'Error de conexión: {str(e)[:500]}')
        except Exception as e:
            return (False, f'Error inesperado: {str(e)[:500]}')

    def validate(self, property_data):
        errors = []
        if not property_data.get('title'):
            errors.append('Falta título')
        if not property_data.get('price') and not property_data.get('price_ars'):
            errors.append('Falta precio')
        if not property_data.get('type'):
            errors.append('Falta tipo de propiedad')
        images = property_data.get('images', [])
        if not images:
            errors.append('MercadoLibre requiere al menos 1 imagen')
        return (len(errors) == 0, errors)


# ── Helpers OAuth ──────────────────────────────────────────────────────

AUTH_DOMAIN = 'https://auth.mercadolibre.com.ar'


def get_ml_redirect_uri() -> str:
    """
    Única fuente de verdad para el redirect_uri de MercadoLibre.
    Usa SITE_URL del entorno; en local sin SITE_URL usa request.url_root.
    Se llama desde /login y /callback — DEBEN coincidir exactamente.
    """
    base = os.getenv('SITE_URL', '').rstrip('/')
    if not base:
        base = request.url_root.rstrip('/')
    return f'{base}/api/portals/ml/callback'


def build_ml_auth_url(client_id: str) -> str:
    """
    Construye la URL de autorización de MercadoLibre.
    Usa get_ml_redirect_uri() internamente + urlencode para los params.
    """
    params = urlencode({
        'response_type': 'code',
        'client_id': client_id,
        'redirect_uri': get_ml_redirect_uri(),
    })
    return f'{AUTH_DOMAIN}/authorization?{params}'
