#!/usr/bin/env python3
"""Health check de scrapers: prueba cada portal con URLs reales.

Uso:
    python scripts/check_scrapers.py
    python scripts/check_scrapers.py --timeout 20

Salida: JSON con estado de cada scraper.
Exit code: 0 si todos OK, 1 si alguno falló.
"""
import argparse
import json
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
logging.basicConfig(level=logging.WARNING, format='%(levelname)s:%(name)s:%(message)s')

from scrapers import extraer_desde_url
from webhook_service import _build_payload

TEST_URLS = {
    'MercadoLibreScraper': [
        'https://inmuebles.mercadolibre.com.ar/departamentos/venta/',
    ],
    'ZonaPropScraper': [
        'https://www.zonaprop.com.ar/departamentos-venta.html',
    ],
    'ArgenpropScraper': [
        'https://www.argenprop.com/departamentos/venta',
    ],
}


def check_portal(name: str, urls: list[str], timeout: int) -> dict:
    """Prueba un scraper con la primera URL que responda."""
    result = {'scraper': name, 'status': 'unknown', 'error': '', 'data_fields': []}
    for url in urls:
        data, error = extraer_desde_url(url, timeout=timeout)
        if data:
            result['status'] = 'ok'
            result['data_fields'] = sorted(k for k, v in data.items() if v and k not in ('link_fuente', '_source'))
            return result
        result['error'] = error or 'sin respuesta'
    result['status'] = 'fail'
    return result


def main():
    parser = argparse.ArgumentParser(description='Health check de scrapers')
    parser.add_argument('--timeout', type=int, default=15, help='Timeout por scraper (s)')
    parser.add_argument('--webhook', action='store_true', help='Enviar alerta si algún scraper falla')
    args = parser.parse_args()

    results = []
    all_ok = True
    for name, urls in TEST_URLS.items():
        r = check_portal(name, urls, args.timeout)
        results.append(r)
        if r['status'] != 'ok':
            all_ok = False
            print(f"❌ {name}: {r['error']}", file=sys.stderr)
        else:
            print(f"✅ {name}: {len(r['data_fields'])} campos extraídos")

    summary = {
        'timestamp': __import__('datetime').datetime.now().isoformat(),
        'all_ok': all_ok,
        'results': results,
    }

    print(json.dumps(summary, indent=2, ensure_ascii=False))

    # Webhook alert on failure
    if args.webhook and not all_ok:
        try:
            from models import Settings
            from urllib.request import Request, urlopen
            url = Settings.get('webhook_url', '')
            if url:
                failures = [r for r in results if r['status'] != 'ok']
                text = '🚨 *Health Check Scrapers*\n'
                for f in failures:
                    text += f"❌ *{f['scraper']}*: {f['error'][:100]}\n"
                payload = _build_payload(url, text)
                data = json.dumps(payload).encode('utf-8')
                req = Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
                urlopen(req, timeout=5)
        except Exception as e:
            print(f"Webhook alert falló: {e}", file=sys.stderr)

    sys.exit(0 if all_ok else 1)


if __name__ == '__main__':
    main()
