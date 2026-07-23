"""
extraction/gemini.py — Extracción de propiedades vía Gemini API con responseSchema nativo.

Usa responseMimeType: "application/json" + responseSchema para forzar
JSON estructurado desde el modelo, eliminando el parsing frágil.
Google Search Grounding (googleSearch tool) permite navegar URLs reales.
"""

import json
import logging
import os
from urllib.parse import urlparse

from enums import TipoOperacion, TipoPropiedad, EstadoConservacion
from typing import Any

logger = logging.getLogger(__name__)

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "calle":                       {"type": "string"},
        "numero_calle":                {"type": "string"},
        "piso_depto":                  {"type": "string"},
        "barrio":                      {"type": "string"},
        "localidad":                   {"type": "string"},
        "provincia":                   {"type": "string"},
        "precio_usd":                  {"type": "number"},
        "precio_ars":                  {"type": "number"},
        "moneda":                      {"type": "string"},
        "superficie_cubierta":         {"type": "number"},
        "superficie_terreno":          {"type": "number"},
        "dormitorios":                 {"type": "integer"},
        "banios":                      {"type": "number"},
        "tiene_garage":                {"type": "boolean"},
        "anio_construccion":           {"type": "integer"},
        "tipo_operacion":              {"type": "string"},
        "tipo_propiedad":              {"type": "string"},
        "estado_conservacion":         {"type": "string"},
        "inmobiliaria":                {"type": "string"},
        "telefono_inmobiliaria":       {"type": "string"},
        "descripcion":                 {"type": "string"},
    },
    "required": ["calle", "precio_usd", "tipo_operacion", "tipo_propiedad"],
}

PORTALS_PREFER_GEMINI = ['zonaprop.com.ar', 'argenprop.com']
PORTALS_PREFER_SCRAPER = ['mercadolibre.com.ar', 'mercadolibre.com']


def is_configured() -> bool:
    return bool(os.getenv('GEMINI_API_KEY'))


def prefers_gemini(url: str) -> bool:
    domain = _extract_domain(url)
    return any(p in domain for p in PORTALS_PREFER_GEMINI)


def prefers_scraper(url: str) -> bool:
    domain = _extract_domain(url)
    return any(p in domain for p in PORTALS_PREFER_SCRAPER)


def _extract_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except Exception:
        return ''


PROMPT_TEMPLATE = (
    "Visitá esta URL de un portal inmobiliario argentino y extraé los datos de la propiedad publicada.\n\n"
    "URL: {url}\n\n"
    "Reglas:\n"
    "- Precios: número entero sin símbolos ni puntos de miles. Ej: 'USD 237.000' → 237000.\n"
    "- Si el precio está en pesos, poné precio_ars y dejá precio_usd en 0.\n"
    "- anio_construccion: si dice '10 años de antigüedad', calculá el año actual menos la antigüedad.\n"
    "- tipo_operacion: 'venta' si se vende, 'cotizacion' si se alquila.\n"
    "- Devolvé SOLO el objeto JSON según el schema definido. No incluyas texto adicional."
)


def extraer_con_gemini(url: str) -> tuple[dict | None, str | None]:
    """
    Extrae datos de una URL usando Gemini con googleSearch + responseSchema.

    Retorna (data, None) o (None, mensaje_error).
    """
    logger.info('Iniciando extracción con Gemini: %s', url)

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return None, 'GEMINI_API_KEY no configurada.'

    try:
        import requests
    except ImportError:
        return None, 'requests no está instalado.'

    prompt = PROMPT_TEMPLATE.format(url=url)
    model = 'gemini-2.5-flash'

    body = {
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {
            'temperature': 0.1,
            'maxOutputTokens': 4096,
            'responseMimeType': 'application/json',
            'responseSchema': RESPONSE_SCHEMA,
        },
        'tools': [{'googleSearch': {}}],
    }

    api_url = (
        f'https://generativelanguage.googleapis.com/v1beta/models/{model}'
        f':generateContent'
    )

    try:
        headers = {'X-Goog-Api-Key': api_key}
        resp = requests.post(api_url, json=body, headers=headers, timeout=30)
        if resp.status_code != 200:
            err_data = resp.json()
            err_msg = err_data.get('error', {}).get('message', resp.text)[:200]
            logger.warning('Gemini HTTP %s: %s', resp.status_code, err_msg)
            return None, f'HTTP {resp.status_code}: {err_msg}'

        data = resp.json()
        candidates = data.get('candidates', [])
        if not candidates:
            return None, 'Gemini no devolvió candidatos'

        parts = candidates[0].get('content', {}).get('parts', [])
        raw = ''.join(p.get('text', '') for p in parts)
        if not raw:
            return None, 'Gemini devolvió respuesta vacía'

        logger.debug('Respuesta raw Gemini: %s', raw[:300])
        parsed = json.loads(raw)
        result = _normalize(parsed)
        result['link_fuente'] = url

        calle = result.get('calle', '')
        precio = result.get('precio_usd', 0)
        logger.info('Extracción exitosa con %s: %s, USD %s', model, calle, precio)
        return result, None

    except RecursionError:
        logger.exception('RecursionError en extraer_con_gemini para %s', url)
        return None, 'RecursionError en Gemini (límite de recursión excedido)'
    except json.JSONDecodeError:
        logger.error('Gemini no devolvió JSON válido')
        return None, 'Gemini no devolvió JSON válido'
    except requests.exceptions.Timeout:
        logger.warning('Timeout Gemini')
        return None, 'Timeout al conectar con Gemini'
    except Exception as e:
        err_msg = f'{type(e).__name__}: {e}'
        logger.error('Gemini falló: %s', err_msg)
        return None, err_msg


VALID_TIPOS_OPERACION = {e.value for e in TipoOperacion}
VALID_TIPOS_PROPIEDAD = {e.value for e in TipoPropiedad}
VALID_ESTADOS_CONSERVACION = {e.value for e in EstadoConservacion}

_STRING_FIELDS = ('calle', 'numero_calle', 'piso_depto', 'barrio', 'localidad',
                  'provincia', 'moneda', 'tipo_operacion', 'tipo_propiedad',
                  'estado_conservacion', 'inmobiliaria', 'telefono_inmobiliaria', 'descripcion')
_FLOAT_FIELDS = ('precio_usd', 'precio_ars', 'superficie_cubierta', 'superficie_terreno', 'banios')
_INT_FIELDS = ('dormitorios', 'anio_construccion')
_BOOL_FIELDS = ('tiene_garage',)


def _normalize(raw: dict) -> dict:
    """Limpieza y validación de tipos post-Gemini (capa de seguridad)."""
    result: dict[str, Any] = {}
    for key in _STRING_FIELDS:
        val = raw.get(key)
        result[key] = val.strip() if isinstance(val, str) else ''
    for key in _FLOAT_FIELDS:
        val = raw.get(key)
        if val is None:
            result[key] = 0.0
        else:
            try:
                result[key] = max(float(val), 0.0)
            except (ValueError, TypeError):
                result[key] = 0.0
    for key in _INT_FIELDS:
        val = raw.get(key)
        if val is None:
            result[key] = 0
        else:
            try:
                result[key] = max(int(val), 0)
            except (ValueError, TypeError):
                result[key] = 0
    for key in _BOOL_FIELDS:
        val = raw.get(key)
        if isinstance(val, bool):
            result[key] = val
        elif isinstance(val, str):
            result[key] = val.lower() in ('true', '1', 'yes', 'sí', 'si')
        else:
            result[key] = bool(val)

    if result['tipo_operacion'] == 'alquiler':
        result['tipo_operacion'] = TipoOperacion.COTIZACION
    elif result['tipo_operacion'] not in VALID_TIPOS_OPERACION:
        logger.warning('tipo_operacion inválido "%s" → default "venta"', result['tipo_operacion'])
        result['tipo_operacion'] = TipoOperacion.VENTA
    if result['tipo_propiedad'] not in VALID_TIPOS_PROPIEDAD:
        logger.warning('tipo_propiedad inválido "%s" → default "casa"', result['tipo_propiedad'])
        result['tipo_propiedad'] = TipoPropiedad.CASA
    if result['estado_conservacion'] not in VALID_ESTADOS_CONSERVACION:
        logger.warning('estado_conservacion inválido "%s" → default "bueno"', result['estado_conservacion'])
        result['estado_conservacion'] = EstadoConservacion.BUENO

    return result
