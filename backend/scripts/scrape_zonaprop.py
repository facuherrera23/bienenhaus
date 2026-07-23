#!/usr/bin/env python3
"""Scrape ZonaProp desde IP local (residencial) y exporta JSON.
Uso:
    python scripts/scrape_zonaprop.py <URL>
    python scripts/scrape_zonaprop.py <URL> --post https://bienenhaus.onrender.com/api/appraisals/<aid>/comparables
"""
import argparse
import json
import logging
import os
import sys

logger = logging.getLogger(__name__)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from scrapers.zonaprop import ZonaPropScraper
from bs4 import BeautifulSoup
import requests

_session = requests.Session()
_session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept-Language': 'es-AR,es;q=0.9',
})


def scrape(url, timeout=15):
    scraper = ZonaPropScraper()
    if not scraper.match(url):
        return None, 'URL no es de ZonaProp'

    # Warm session visitando homepage
    try:
        _session.get('https://www.zonaprop.com.ar/', timeout=10)
    except Exception as e:
        logger.warning('Warm falló: %s', e)

    try:
        resp = _session.get(url, timeout=timeout)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'lxml')
        data = scraper.extract(soup, url)
        if data:
            data['link_fuente'] = url
        return data, None
    except requests.RequestException as e:
        if hasattr(e, 'response') and e.response is not None:
            return None, f'HTTP {e.response.status_code}: {e.response.reason}'
        return None, str(e)
    except Exception as e:
        return None, str(e)


def main():
    parser = argparse.ArgumentParser(description='Scrapea ZonaProp desde IP local')
    parser.add_argument('url', help='URL de ZonaProp')
    parser.add_argument('--post', help='URL para POSTear el resultado (ej: Render API)')
    parser.add_argument('--cookie', help='Cookie de sesión admin (si se usa --post)')
    args = parser.parse_args()

    data, error = scrape(args.url)
    if error:
        logger.error('ERROR: %s', error)
        sys.exit(1)

    print(json.dumps(data, indent=2, ensure_ascii=False))

    if args.post:
        headers = {'Content-Type': 'application/json'}
        if args.cookie:
            headers['Cookie'] = args.cookie
        try:
            resp = requests.post(args.post, json={'precio_usd': data.get('precio_usd'),
                                                   'calle': data.get('calle'),
                                                   'numero_calle': data.get('numero_calle'),
                                                   'barrio': data.get('barrio'),
                                                   'localidad': data.get('localidad'),
                                                   'superficie_cubierta': data.get('superficie_cubierta'),
                                                   'superficie_terreno': data.get('superficie_terreno'),
                                                   'dormitorios': data.get('dormitorios'),
                                                   'banios': data.get('banios'),
                                                   'tiene_garage': data.get('tiene_garage'),
                                                   'anio_construccion': data.get('anio_construccion'),
                                                   'link_fuente': data.get('link_fuente')},
                                 headers=headers, timeout=10)
            print(f'POST {resp.status_code} {resp.text[:200]}')
        except Exception as e:
            print(f'POST falló: {e}')


if __name__ == '__main__':
    main()
