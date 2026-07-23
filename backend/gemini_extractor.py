"""
gemini_extractor.py — Legacy re-export. Toda la lógica está en extraction/gemini.py.
Mantenido para compatibilidad con imports existentes.
"""
from extraction.gemini import (
    extraer_con_gemini,
    is_configured,
    prefers_gemini,
    prefers_scraper,
    PORTALS_PREFER_GEMINI,
    PORTALS_PREFER_SCRAPER,
    RESPONSE_SCHEMA,
    PROMPT_TEMPLATE,
    _normalize,
)

__all__ = [
    'extraer_con_gemini',
    'is_configured',
    'prefers_gemini',
    'prefers_scraper',
    'PORTALS_PREFER_GEMINI',
    'PORTALS_PREFER_SCRAPER',
    'RESPONSE_SCHEMA',
    'PROMPT_TEMPLATE',
    '_normalize',
]
