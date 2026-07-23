import re
from datetime import datetime
from enums import TipoOperacion
from .base import BaseScraper


class ArgenpropScraper(BaseScraper):
    DOMAINS = ['argenprop.com']

    def extract(self, soup, url):
        data = {}

        # JSON-LD (skips WebSite/Organization blocks via _json_ld)
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
                data['calle'] = ld.get('name', '')
            if addr:
                if not data.get('barrio'):
                    data['barrio'] = addr.get('addressLocality', '')
                if not data.get('localidad') and addr.get('addressRegion'):
                    data['localidad'] = addr.get('addressRegion', '')

        # HTML price fallback — selectores específicos primero, genéricos después
        is_alquiler = 'alquiler' in url.lower()
        price_raw = None
        if not data.get('precio_usd') and not data.get('precio_ars'):
            for sel in ['.precio', '.price-value', '[itemprop="price"]', '.precio-usd',
                        '.price-amount', '.card-price', '[class*=price]']:
                el = soup.select_one(sel)
                if el:
                    val = self._parse_price_usd(el.get_text(strip=True))
                    if val:
                        price_raw = val
                        break

        if price_raw is not None:
            if is_alquiler:
                data['precio_ars'] = price_raw
            else:
                data['precio_usd'] = price_raw

        # Calle from HTML fallback
        if not data.get('calle'):
            for sel in ['h1.titulo', 'h1.title', 'h1']:
                el = soup.select_one(sel)
                if el:
                    data['calle'] = el.get_text(strip=True)
                    break
            if not data.get('calle') and soup.title:
                data['calle'] = soup.title.get_text(strip=True)

        # Address / location from HTML
        addr_el = soup.select_one('.direccion, .location, .address')
        if addr_el:
            parts = [p.strip() for p in addr_el.get_text(strip=True).split(',')]
            if parts:
                if not data.get('calle'):
                    data['calle'] = parts[0]
            if len(parts) > 1:
                if not data.get('barrio'):
                    data['barrio'] = parts[-2] if len(parts) > 2 else parts[-1]

        if not data.get('barrio'):
            data['barrio'] = self._text(soup, '.barrio, .neighborhood')
        data['localidad'] = self._text(soup, '.localidad, .city, .location')

        # Features list - use icon classes similar to ZonaProp when possible
        for item in soup.select('ul.icons li, .features li, .datos li, .caracteristicas li, [class*="feature"] li'):
            text = self._clean_feature_text(item.get_text(strip=True))
            if not text:
                continue
            lower = text.lower()
            if 'dormitorio' in lower or 'habitacione' in lower:
                if not data.get('dormitorios'):
                    data['dormitorios'] = self._parse_int(text)
            elif 'bano' in lower or 'banio' in lower or 'bañ' in lower:
                if not data.get('banios'):
                    data['banios'] = self._parse_float(text)
            elif 'garage' in lower or 'cochera' in lower:
                if data.get('tiene_garage') is None:
                    data['tiene_garage'] = 'no' not in lower
            elif 'cubierta' in lower:
                if not data.get('superficie_cubierta'):
                    data['superficie_cubierta'] = self._parse_float(text)
            elif 'total' in lower:
                if not data.get('superficie_terreno'):
                    data['superficie_terreno'] = self._parse_float(text)
            elif not data.get('superficie_cubierta') and ('m2' in lower or 'mt' in lower):
                data['superficie_cubierta'] = self._parse_float(text)
            elif ('antig' in lower) and not data.get('anio_construccion'):
                data['anio_construccion'] = self._parse_int(text)

        # Tabla de atributos
        if not data.get('dormitorios') or not data.get('banios'):
            for row in soup.select('table.detalles tr, .tabla-atributos tr'):
                cells = row.select('th, td')
                if len(cells) >= 2:
                    label = cells[0].get_text(strip=True).lower()
                    val = cells[1].get_text(strip=True)
                    if 'dormitorio' in label and not data.get('dormitorios'):
                        data['dormitorios'] = self._parse_int(val)
                    elif 'bano' in label and not data.get('banios'):
                        data['banios'] = self._parse_float(val)
                    elif 'cubierta' in label and not data.get('superficie_cubierta'):
                        data['superficie_cubierta'] = self._parse_float(val)
                    elif 'terreno' in label and not data.get('superficie_terreno'):
                        data['superficie_terreno'] = self._parse_float(val)
                    elif ('garage' in label or 'cochera' in label) and data.get('tiene_garage') is None:
                        data['tiene_garage'] = self._parse_int(val) > 0
                    elif 'antig' in label and not data.get('anio_construccion'):
                        data['anio_construccion'] = self._parse_int(val)

        # Convert antiguedad (age in years) to construction year
        if data.get('anio_construccion') and data['anio_construccion'] < 1900:
            data['anio_construccion'] = datetime.now().year - data['anio_construccion']

            data['tipo_operacion'] = TipoOperacion.VENTA
        if 'alquiler' in url.lower():
            data['tipo_operacion'] = TipoOperacion.COTIZACION

        return data

    def _clean_feature_text(self, text):
        """Normalize whitespace in feature text."""
        return ' '.join(text.split())
