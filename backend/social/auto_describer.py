"""
social/auto_describer.py — Generación automática de descripciones para redes sociales
"""
import logging
from typing import Any

from models import Property

logger = logging.getLogger(__name__)

_PROMPT_TEMPLATE = """Generá una descripción atractiva para una publicación de redes sociales (Facebook/Instagram) de una propiedad inmobiliaria.

Datos de la propiedad:
- Tipo: {tipo}
- Operación: {operacion}
- Precio: {precio}
- Dormitorios: {dormitorios}
- Baños: {banos}
- Superficie: {superficie}
- Ubicación: {ubicacion}
- Descripción original: {descripcion}

La descripción debe:
1. Ser atractiva y persuasiva (máximo 200 palabras)
2. Incluir emojis relevantes
3. Terminar con un llamado a la acción (contacto)
4. Mencionar los puntos clave destacados
5. Incluir hashtags relevantes al final (#Inmobiliaria #{tipo} #Córdoba)

No incluir información falsa. Solo usar los datos proporcionados."""

_genai_client = None


def _get_genai_client():
    global _genai_client
    if _genai_client is None:
        from google import genai
        _genai_client = genai.Client()
    return _genai_client


def _build_context(prop: Property) -> dict[str, Any]:
    tipo = prop.type or 'propiedad'
    operacion_raw: str | None = getattr(prop, 'operation', None) or getattr(prop, 'tipo_operacion', None)
    operacion = 'Venta' if not operacion_raw else ('Venta' if 'vent' in operacion_raw.lower() else 'Alquiler')
    precio = f'USD {prop.price:,.0f}' if prop.price else 'Consultar'
    ubicacion = prop.location or '—'
    desc = (prop.description or '')[:500]
    return {
        'tipo': tipo,
        'operacion': operacion,
        'precio': precio,
        'dormitorios': prop.beds or '—',
        'banos': prop.baths or '—',
        'superficie': f"{prop.sqm or '—'} m²",
        'ubicacion': ubicacion,
        'descripcion': desc,
    }


def generate_description(prop: Property) -> str:
    """Genera descripción para redes usando IA (Gemini 2.0 Flash)."""
    ctx = _build_context(prop)
    prompt = _PROMPT_TEMPLATE.format(**ctx)

    try:
        client = _get_genai_client()
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
        )
        text = response.text.strip()
        if text:
            return text
    except ImportError:
        logger.warning('google-genai no instalado, usando fallback')
    except Exception as e:
        logger.error('Error generando descripción con IA: %s', e)

    return _fallback_description(ctx)


_FALLBACK_TEMPLATE = """{emoji} ¡{operacion} {tipo} en {ubicacion}!

✨ {dormitorios} dorm. | {banos} baños | {superficie}
📍 {ubicacion}
💰 {precio}

{descripcion_breve}

📲 Consultanos por WhatsApp o visitanos en Bienenhaus Propiedades

#Bienenhaus #{tipo_tag} #{operacion_tag} #Córdoba #Inmobiliaria"""


def _fallback_description(ctx):
    tipo_tag = ctx['tipo'].replace(' ', '')
    operacion_tag = 'Venta' if ctx['operacion'] == 'Venta' else 'Alquiler'
    breve = ctx['descripcion'][:120] if len(ctx['descripcion']) > 120 else ctx['descripcion']
    return _FALLBACK_TEMPLATE.format(
        emoji='🏠' if 'casa' in ctx['tipo'].lower() else '🏢',
        operacion=ctx['operacion'],
        tipo=ctx['tipo'],
        ubicacion=ctx['ubicacion'],
        dormitorios=ctx['dormitorios'],
        banos=ctx['banos'],
        superficie=ctx['superficie'],
        precio=ctx['precio'],
        descripcion_breve=breve,
        tipo_tag=tipo_tag,
        operacion_tag=operacion_tag,
    )
