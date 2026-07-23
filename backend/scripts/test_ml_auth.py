"""
test_ml_auth.py — Prueba real de autenticacion contra API de MercadoLibre.

Verifica que:
1. El config del portal ML se desencripta correctamente (con la SECRET_KEY actual)
2. El access_token es valido (o se refresca exitosamente contra la API real)
3. Se puede hacer una llamada autenticada a la API de ML

Uso (dentro del contenedor staging):
  cd /app/backend && python scripts/test_ml_auth.py

Exit codes:
  0 = autenticacion OK
  1 = error de configuracion
  2 = error de autenticacion contra ML
"""
import sys
import os
import logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
log = logging.getLogger(__name__)

# ── Inicializar Flask app ────────────────────────────────────────────
os.environ.setdefault('FLASK_APP', 'app.py')
from app import create_app
app = create_app()

with app.app_context():
    from models import Portal
    from portals.mercadolibre import MercadoLibreAdapter, TOKEN_URL
    import requests

    # Buscar portal ML activo
    portal = Portal.query.filter_by(slug='mercadolibre', active=True).first()
    if not portal:
        portal = Portal.query.filter_by(slug='mercadolibre').first()
    if not portal:
        log.error('Portal MercadoLibre no encontrado en la DB')
        sys.exit(1)

    log.info('Portal encontrado: id=%d name=%s active=%s', portal.id, portal.name, portal.active)

    # Leer config (trigger desencriptado con SECRET_KEY actual)
    cfg = portal.config
    has_token = bool(cfg.get('access_token'))
    has_refresh = bool(cfg.get('refresh_token'))
    has_client = bool(cfg.get('client_secret'))
    has_client_id = bool(cfg.get('client_id'))
    log.info('Config cargada: access_token=%s refresh_token=%s client_secret=%s client_id=%s',
             'SI' if has_token else 'NO',
             'SI' if has_refresh else 'NO',
             'SI' if has_client else 'NO',
             'SI' if has_client_id else 'NO')

    if not has_token and not has_refresh:
        log.error('No hay access_token ni refresh_token en la config')
        sys.exit(2)
    if not has_client_id or not has_client:
        log.error('Faltan client_id o client_secret en la config')
        sys.exit(2)

    # Instanciar adapter y probar autenticacion
    try:
        adapter = MercadoLibreAdapter(portal)
        token = adapter._get_access_token()
        log.info('Access token obtenido: si (longitud %d)', len(token))
    except ValueError as e:
        log.error('Error de configuracion ML: %s', e)
        sys.exit(2)
    except requests.exceptions.RequestException as e:
        log.error('Error de conexion con ML API: %s', e)
        sys.exit(2)
    except Exception as e:
        log.error('Error inesperado: %s: %s', type(e).__name__, e)
        sys.exit(2)

    # Hacer una llamada real a la API de ML para verificar que el token funciona
    try:
        headers = adapter._api_headers()
        me_resp = requests.get('https://api.mercadolibre.com/users/me',
                               headers=headers, timeout=10)
        if me_resp.status_code == 200:
            user_data = me_resp.json()
            log.info('API ML responde OK: user=%s id=%s',
                     user_data.get('nickname', '?'), user_data.get('id', '?'))
            print('\n=== AUTENTICACION ML VERIFICADA EXITOSAMENTE ===')
            sys.exit(0)
        else:
            log.error('API ML respondio HTTP %d: %s',
                      me_resp.status_code, me_resp.text[:200])
            sys.exit(2)
    except requests.exceptions.RequestException as e:
        log.error('Error llamando API ML: %s', e)
        sys.exit(2)
