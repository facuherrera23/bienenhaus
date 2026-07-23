import json
import re
import os
from datetime import datetime
from enums import TipoOperacion
from .base import BaseScraper


class MercadoLibreScraper(BaseScraper):
    DOMAINS = ['mercadolibre.com.ar', 'mercadolibre.com', 'ml.com.ar']

    def extract(self, soup, url):
        data = {}

        # Extract item ID from URL for API fallback
        item_id = self._extract_item_id(url)

        # Method 1: Try ML API if token is available
        if item_id:
            token = os.environ.get('ML_ACCESS_TOKEN', '')
            if token:
                api_data = self._fetch_api(item_id, token)
                if api_data:
                    return api_data

        # Method 2: JSON-LD structured data
        ld = self._json_ld(soup)
        if ld and isinstance(ld, dict):
            offers = ld.get('offers', {})
            if offers:
                data['precio_usd'] = self._parse_price_usd(str(offers.get('price', '')))
            addr = ld.get('address', {})
            if addr and addr.get('streetAddress'):
                calle, numero = self._parse_street_address(addr['streetAddress'])
                data['calle'] = calle
                if numero:
                    data['numero_calle'] = numero
            if not data.get('calle'):
                name = ld.get('name', '')
                if name:
                    data['calle'] = name

        # Method 3: __INITIAL_STATE__ or __PRELOADED_STATE__
        for script in soup.select('script'):
            if not script.string:
                continue
            s = script.string.strip()
            if s.startswith('window.__INITIAL_STATE__') or s.startswith('window.__PRELOADED_STATE__'):
                try:
                    match = re.search(r'(?:window\.__INITIAL_STATE__|window\.__PRELOADED_STATE__)\s*=\s*(\{.*?\});\s*$', s, re.DOTALL)
                    if match:
                        state = json.loads(match.group(1))
                        item = state.get('initial_state', {}) or state
                        listing = item.get('item', {}) or item
                        if not data.get('precio_usd'):
                            price = listing.get('price') or 0
                            data['precio_usd'] = float(price) if price else None
                        if not data.get('calle'):
                            data['calle'] = listing.get('title', '')
                        attrs = listing.get('attributes', []) or []
                        for attr in attrs:
                            name = attr.get('name', '').lower()
                            val = attr.get('value_name', '')
                            if 'dormitorio' in name and not data.get('dormitorios'):
                                data['dormitorios'] = self._parse_int(val)
                            elif ('banio' in name or 'bano' in name) and not data.get('banios'):
                                data['banios'] = self._parse_float(val)
                            elif 'superficie' in name and not data.get('superficie_cubierta'):
                                data['superficie_cubierta'] = self._parse_float(val)
                            elif ('garage' in name or 'cochera' in name) and data.get('tiene_garage') is None:
                                data['tiene_garage'] = val and 'no' not in val.lower()
                            elif ('antig' in name or 'ano' in name) and not data.get('anio_construccion'):
                                data['anio_construccion'] = self._parse_int(val)
                            elif (attr.get('id', '').lower() == 'floor' or name == 'piso') and not data.get('piso_depto'):
                                data['piso_depto'] = val
                        loc = listing.get('location', {}) or item.get('address', {})
                        if loc and not data.get('calle'):
                            calle_line = loc.get('address_line', '')
                            calle, numero = self._parse_street_address(calle_line)
                            data['calle'] = calle
                            if numero:
                                data['numero_calle'] = numero
                        if not data.get('barrio'):
                            data['barrio'] = loc.get('neighborhood', {}).get('name', '')
                        if not data.get('localidad'):
                            data['localidad'] = loc.get('city', {}).get('name', '')
                        if not data.get('provincia'):
                            data['provincia'] = loc.get('state', {}).get('name', '')
                except Exception:
                    pass
                break

        # Method 4: Open Graph / meta tags (only as fallback)
        if not data.get('precio_usd'):
            price_val = self._meta(soup, 'product:price:amount')
            if price_val:
                data['precio_usd'] = self._parse_price_usd(price_val)

        # Method 5: HTML fallback
        if not data.get('precio_usd'):
            for sel in ['.andes-money-amount--cents-superscript',
                        '.ui-pdp-price__second-line .andes-money-amount__fraction',
                        '[data-testid="price-fraction"]',
                        '.andes-money-amount__fraction']:
                el = soup.select_one(sel)
                if el:
                    val = self._parse_price_usd(el.get_text(strip=True))
                    if val:
                        data['precio_usd'] = val
                        break

        if not data.get('calle'):
            for sel in ['.ui-pdp-header__title-container h1', '.ui-pdp-title', 'h1']:
                el = soup.select_one(sel)
                if el:
                    data['calle'] = el.get_text(strip=True)
                    break
            if not data.get('calle'):
                og_title = self._meta(soup, 'og:title')
                if og_title:
                    data['calle'] = og_title
            if not data.get('calle') and soup.title:
                data['calle'] = soup.title.get_text(strip=True)

        # Attributes from HTML table
        if not data.get('dormitorios') or not data.get('banios'):
            for row in soup.select('.ui-pdp-specs__table tr, .andes-table__row'):
                cells = row.select('th, td')
                if len(cells) >= 2:
                    label = cells[0].get_text(strip=True).lower()
                    val = cells[1].get_text(strip=True)
                    if 'dormitorio' in label and not data.get('dormitorios'):
                        data['dormitorios'] = self._parse_int(val)
                    elif ('banio' in label or 'bano' in label or 'bañ' in label) and not data.get('banios'):
                        data['banios'] = self._parse_float(val)
                    elif 'superficie' in label and 'cubierta' in label and not data.get('superficie_cubierta'):
                        data['superficie_cubierta'] = self._parse_float(val)
                    elif 'superficie' in label and 'total' in label and not data.get('superficie_terreno'):
                        data['superficie_terreno'] = self._parse_float(val)
                    elif ('garage' in label or 'cochera' in label) and data.get('tiene_garage') is None:
                        data['tiene_garage'] = 'no' not in val.lower()
                    elif ('antig' in label or 'ano' in label) and not data.get('anio_construccion'):
                        data['anio_construccion'] = self._parse_int(val)

        # Convert antiguedad (age in years) to construction year
        if data.get('anio_construccion') and data['anio_construccion'] < 1900:
            data['anio_construccion'] = datetime.now().year - data['anio_construccion']

        # Tipo de operacion from subtitle or URL
        data['tipo_operacion'] = TipoOperacion.VENTA
        tipo = self._text(soup, '.ui-pdp-subtitle')
        if tipo and 'alquiler' in tipo.lower():
            data['tipo_operacion'] = TipoOperacion.COTIZACION
        elif 'alquiler' in url.lower():
            data['tipo_operacion'] = TipoOperacion.COTIZACION

        return data

    def _extract_item_id(self, url):
        match = re.search(r'MLA[-\s]?(\d+)', url, re.IGNORECASE)
        if match:
            return 'MLA' + match.group(1)
        return None

    def _fetch_api(self, item_id, token):
        """Fetch item data from ML API using access token."""
        try:
            import requests
            url = f'https://api.mercadolibre.com/items/{item_id}'
            headers = {
                'Authorization': f'Bearer {token}',
                'Accept': 'application/json',
            }
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code != 200:
                return None
            item = resp.json()
            if not item or item.get('error'):
                return None
            data = {}
            data['precio_usd'] = float(item.get('price', 0)) if item.get('price') else None
            data['calle'] = item.get('title', '')
            data['barrio'] = ''
            data['localidad'] = ''
            if item.get('location'):
                data['barrio'] = item['location'].get('neighborhood', {}).get('name', '') or ''
                data['localidad'] = item['location'].get('city', {}).get('name', '') or ''
                data['provincia'] = item['location'].get('state', {}).get('name', '') or ''
            if item.get('listing_address'):
                addr = item['listing_address']
                if addr.get('street_name'):
                    data['calle'] = addr['street_name'].strip()
                    if addr.get('street_number'):
                        data['numero_calle'] = str(addr['street_number'])
            for attr in item.get('attributes', []):
                aid = attr.get('id', '')
                vname = attr.get('value_name', '')
                if aid in ('BEDROOMS', 'ROOMS') and not data.get('dormitorios'):
                    data['dormitorios'] = self._parse_int(vname)
                elif aid == 'BATHROOMS' and not data.get('banios'):
                    data['banios'] = self._parse_float(vname)
                elif aid in ('SQUARE_METER', 'TOTAL_SQUARE_METER') and not data.get('superficie_cubierta'):
                    data['superficie_cubierta'] = self._parse_float(vname)
                elif aid in ('GARAGE', 'PARKING') and data.get('tiene_garage') is None:
                    data['tiene_garage'] = 'no' not in (vname or '').lower()
                elif aid == 'YEAR_BUILT' and not data.get('anio_construccion'):
                    data['anio_construccion'] = self._parse_int(vname)
                elif aid == 'PROPERTY_TYPE' and not data.get('tipo_propiedad'):
                    data['tipo_propiedad'] = vname.lower() if vname else ''
                elif aid == 'FLOOR' and not data.get('piso_depto'):
                    data['piso_depto'] = vname
            data['tipo_operacion'] = TipoOperacion.VENTA
            data['link_fuente'] = item.get('permalink', '')
            data['_source'] = 'api'
            return data
        except Exception:
            return None
