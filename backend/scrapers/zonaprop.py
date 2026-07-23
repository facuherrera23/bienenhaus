import re
from datetime import datetime
from enums import TipoOperacion
from .base import BaseScraper


class ZonaPropScraper(BaseScraper):
    DOMAINS = ['zonaprop.com.ar']

    def extract(self, soup, url):
        data = {}

        # JSON-LD (now skips WebSite/Organization blocks via _json_ld)
        ld = self._json_ld(soup)
        if ld and isinstance(ld, dict):
            addr = ld.get('address', {}) or {}
            if addr.get('streetAddress'):
                calle, numero = self._parse_street_address(addr['streetAddress'])
                data['calle'] = calle
                if numero:
                    data['numero_calle'] = numero
            if not data.get('calle'):
                data['calle'] = (ld.get('name', '') or '').replace(' - Zonaprop', '').strip()
            loc = addr.get('addressLocality', '')
            if loc:
                parts = [p.strip() for p in loc.split(',')]
                data['barrio'] = parts[0]
                if len(parts) > 1 and not data.get('localidad'):
                    data['localidad'] = parts[-1]
            if 'numberOfBedrooms' in ld:
                data['dormitorios'] = self._parse_int(str(ld['numberOfBedrooms']))
            if 'numberOfBathroomsTotal' in ld:
                data['banios'] = self._parse_float(str(ld['numberOfBathroomsTotal']))
            floorsize = ld.get('floorSize', {})
            if floorsize and floorsize.get('value'):
                data['superficie_cubierta'] = self._parse_float(str(floorsize['value']))

        # Structured data from script tags
        for script in soup.select('script'):
            if not script.string:
                continue
            s = script.string.strip()
            if '__INITIAL_STATE__' in s:
                try:
                    import json
                    match = re.search(r'__INITIAL_STATE__\s*=\s*(\{.*?\});', s, re.DOTALL)
                    if not match:
                        match = re.search(r'({.*})', s, re.DOTALL)
                    if match:
                        state = json.loads(match.group(1))
                        props = state.get('listing', {}) or state.get('property', {}) or state
                        if not data.get('precio_usd'):
                            data['precio_usd'] = self._parse_price_usd(str(props.get('price', '')))
                        if not data.get('calle'):
                            data['calle'] = props.get('title', '')
                        if not data.get('barrio'):
                            data['barrio'] = props.get('neighborhood', '')
                        if not data.get('superficie_cubierta'):
                            data['superficie_cubierta'] = self._parse_float(str(props.get('covered_area', '')))
                        if not data.get('superficie_terreno'):
                            data['superficie_terreno'] = self._parse_float(str(props.get('total_area', '')))
                        if not data.get('dormitorios'):
                            data['dormitorios'] = self._parse_int(str(props.get('bedrooms', '')))
                        if not data.get('banios'):
                            data['banios'] = self._parse_float(str(props.get('bathrooms', '')))
                        garage = props.get('garages', '')
                        if garage and data.get('tiene_garage') is None:
                            data['tiene_garage'] = self._parse_int(str(garage)) > 0
                        if not data.get('anio_construccion'):
                            data['anio_construccion'] = self._parse_int(str(props.get('year', '')))
                except Exception:
                    pass
                break

        # HTML fallback for price
        if not data.get('precio_usd'):
            for sel in ['.price-value', '.price']:
                el = soup.select_one(sel)
                if el:
                    val = self._parse_price_usd(el.get_text(strip=True))
                    if val:
                        data['precio_usd'] = val
                        break
            if not data.get('precio_usd'):
                for attr in ['data-price', 'data-price-usd']:
                    el = soup.select_one(f'[{attr}]')
                    if el:
                        val = self._parse_price_usd(el.get(attr, ''))
                        if val:
                            data['precio_usd'] = val
                            break

        # HTML fallback for calle
        if not data.get('calle'):
            el = soup.select_one('h1')
            if el:
                data['calle'] = el.get_text(strip=True)
            elif soup.title:
                data['calle'] = soup.title.get_text(strip=True).replace(' - Zonaprop', '').strip()

        # HTML features by icon class
        icon_map = {
            'icon-stotal':       'superficie_terreno',
            'icon-scubierta':    'superficie_cubierta',
            'icon-dormitorio':   'dormitorios',
            'icon-bano':         'banios',
            'icon-cochera':      'tiene_garage',
            'icon-antiguedad':   'anio_construccion',
        }
        for li in soup.select('li.icon-feature'):
            icon = li.select_one('i')
            if not icon:
                continue
            cls = icon.get('class', [])
            cls_str = ' '.join(cls) if cls else ''
            field = icon_map.get(cls_str)
            if not field:
                for key, val in icon_map.items():
                    if any(key in c for c in cls):
                        field = val
                        break
            if not field:
                continue
            if data.get(field) is not None and field not in ('superficie_terreno', 'superficie_cubierta'):
                continue
            full_text = li.get_text(strip=True)
            num_text = re.sub(r'[^\d.,]', '', full_text)
            if field in ('dormitorios', 'anio_construccion'):
                val = self._parse_int(num_text)
            elif field == 'tiene_garage':
                val = True
            else:
                val = self._parse_ar_number(num_text)
            if val is not None and val != 0:
                data[field] = val

        # Convert antiguedad (age in years) to construction year
        if data.get('anio_construccion') and data['anio_construccion'] < 1900:
            data['anio_construccion'] = datetime.now().year - data['anio_construccion']

        # Tipo de operacion: check price label first, then URL
        data['tipo_operacion'] = TipoOperacion.VENTA
        price_el = soup.select_one('.price-value')
        if price_el:
            pt = price_el.get_text(strip=True).lower()
            if 'alquiler' in pt:
                data['tipo_operacion'] = TipoOperacion.COTIZACION
        if 'alquiler' in url.lower() and data['tipo_operacion'] == TipoOperacion.VENTA:
            data['tipo_operacion'] = TipoOperacion.COTIZACION

        return data
