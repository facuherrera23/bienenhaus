"""
extraction/__init__.py — Orquestador centralizado de extracción de propiedades.

Flujo de decisión:
  extract_property(url)
    ├── Portal conocido con scraper (ML)
    │     ├── Scraper → éxito → retorna datos
    │     └── Scraper falla → Gemini fallback → éxito / error
    ├── Portal con Gemini preferido (ZP/AP)
    │     ├── Gemini → éxito → retorna datos
    │     └── Gemini falla → scraper fallback → éxito / error
    └── Portal desconocido
          └── Gemini (si configurado) → éxito / error
"""

import logging
import sys
import time
from urllib.parse import urlparse

from scrapers import detectar_scraper, extraer_desde_url
from extraction.gemini import extraer_con_gemini, is_configured as gemini_configured

logger = logging.getLogger(__name__)

PORTALS_PREFER_SCRAPER = ['mercadolibre.com.ar', 'mercadolibre.com']
PORTALS_PREFER_GEMINI = ['zonaprop.com.ar', 'argenprop.com']


def extract_property(url: str, timeout: int = 30) -> tuple[dict | None, str | None]:
    """
    Punto de entrada único para extraer datos de una URL de propiedad.

    Retorna (data, None) en éxito, (None, error_msg) en fallo.
    data incluye 'link_fuente' y '_source' indicando el método usado.
    """
    start = time.time()
    portal_category = _categorize_portal(url)

    try:
        if portal_category == 'scraper':
            data, error = _via_scraper_first(url, timeout)
        elif portal_category == 'gemini':
            data, error = _via_gemini_first(url, timeout)
        else:
            data, error = _via_gemini_only(url, timeout)
    except RecursionError:
        logger.exception('RecursionError en extract_property para %s', url)
        return None, 'Error interno: estructura de datos demasiado profunda. Intentá con otra URL.'
    except Exception as e:
        logger.exception('Error inesperado en extract_property para %s: %s', url, e)
        return None, f'Error interno: {type(e).__name__}'

    _log_extraction(url, portal_category, data, error, time.time() - start)
    return data, error


def _categorize_portal(url: str) -> str | None:
    """Clasifica la URL. Retorna 'scraper', 'gemini', o None."""
    try:
        domain = urlparse(url).netloc.lower()
    except Exception:
        return None
    if any(p in domain for p in PORTALS_PREFER_SCRAPER):
        return 'scraper'
    if any(p in domain for p in PORTALS_PREFER_GEMINI):
        return 'gemini'
    return None


def _via_scraper_first(url: str, timeout: int) -> tuple[dict | None, str | None]:
    """Portal tipo MercadoLibre: scraper primario, Gemini como fallback."""
    try:
        data, error = extraer_desde_url(url, timeout=timeout)
    except RecursionError:
        logger.exception('RecursionError en extraer_desde_url para %s', url)
        return None, 'RecursionError: estructura de datos demasiado profunda en el scraper'
    except Exception as e:
        logger.exception('Error en extraer_desde_url para %s: %s', url, e)
        return None, f'Scraper: {type(e).__name__}'

    if data:
        data['_source'] = 'scraper'
        data['link_fuente'] = url
        return data, None

    if gemini_configured():
        logger.warning('Scraper falló para %s — probando Gemini', url)
        try:
            data, gemini_err = extraer_con_gemini(url)
        except RecursionError:
            logger.exception('RecursionError en extraer_con_gemini para %s', url)
            gemini_err = 'RecursionError en extracción Gemini (límite de recursión excedido)'
        if data:
            data['_source'] = 'gemini'
            return data, None
        return None, f'Scraper: {error} | Gemini: {gemini_err}'

    return None, error


def _via_gemini_first(url: str, timeout: int) -> tuple[dict | None, str | None]:
    """Portal tipo ZonaProp/Argenprop: Gemini primario, scraper fallback."""
    gemini_error = None
    if gemini_configured():
        try:
            data, gemini_error = extraer_con_gemini(url)
        except RecursionError:
            logger.exception('RecursionError en extraer_con_gemini para %s', url)
            gemini_error = 'RecursionError en extracción Gemini (límite de recursión excedido)'
        if data:
            data['_source'] = 'gemini'
            return data, None
        logger.warning('Gemini falló para %s — probando scraper', url)

    try:
        data, scraper_error = extraer_desde_url(url, timeout=timeout)
    except RecursionError:
        logger.exception('RecursionError en extraer_desde_url (fallback) para %s', url)
        scraper_error = 'RecursionError en scraper (límite de recursión excedido)'
    except Exception as e:
        logger.exception('Error en extraer_desde_url (fallback) para %s: %s', url, e)
        scraper_error = f'Scraper: {type(e).__name__}'

    if data:
        data['_source'] = 'scraper'
        return data, None

    msg = ''
    if gemini_error:
        msg = f'Gemini: {gemini_error}. '
    if scraper_error:
        msg += f'Scraper: {scraper_error}'
    if not msg:
        msg = 'No se pudo extraer la propiedad.'
    return None, msg


def _via_gemini_only(url: str, timeout: int) -> tuple[dict | None, str | None]:
    """Portal desconocido: solo Gemini (sin scraper especializado)."""
    if gemini_configured():
        try:
            data, error = extraer_con_gemini(url)
        except RecursionError:
            logger.exception('RecursionError en extraer_con_gemini para %s', url)
            return None, 'RecursionError en extracción Gemini (límite de recursión excedido)'
        except Exception as e:
            logger.exception('Error en extraer_con_gemini para %s: %s', url, e)
            return None, f'{type(e).__name__}: {e}'
        if data:
            data['_source'] = 'gemini'
            return data, None
        return None, f'Gemini: {error}'

    try:
        data, error = extraer_desde_url(url, timeout=timeout)
    except RecursionError:
        logger.exception('RecursionError en extraer_desde_url (fallback) para %s', url)
        return None, 'RecursionError en extracción fallback (límite de recursión excedido)'
    except Exception as e:
        logger.exception('Error en extraer_desde_url (fallback) para %s: %s', url, e)
        return None, f'Scraper: {type(e).__name__}'

    if data:
        data['_source'] = 'scraper'
        return data, None
    return None, error or 'Portal no soportado. Usá MercadoLibre, ZonaProp o Argenprop.'


def _log_extraction(url: str, portal: str | None, data: dict | None, error: str | None, duration: float):
    """Logging estructurado con métricas de extracción."""
    ms = int(duration * 1000)
    source = data.get('_source') if data else None
    if data:
        logger.info(
            'extract_url success  url=%s portal=%s source=%s duration=%dms',
            url, portal or 'unknown', source, ms,
        )
    else:
        logger.warning(
            'extract_url failure  url=%s portal=%s duration=%dms error=%s',
            url, portal or 'unknown', ms, error,
        )