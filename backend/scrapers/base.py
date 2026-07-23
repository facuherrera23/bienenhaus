import json
import re


class BaseScraper:
    DOMAINS = []

    LISTING_TYPES = {
        'Apartment', 'House', 'Product', 'RealEstateListing',
        'SingleFamilyResidence', 'MultiFamilyResidence',
        'Residence', 'Accommodation', 'Place',
    }

    @classmethod
    def match(cls, url):
        return any(d in url for d in cls.DOMAINS)

    def extract(self, soup, url):
        raise NotImplementedError

    def es_listing_valido(self, data: dict) -> bool:
        """Valida que los datos extraídos correspondan a un listing real.
        Retorna True si al menos tiene precio + calle o precio + superficie."""
        precio = data.get('precio_usd') or data.get('precio_ars')
        calle = data.get('calle')
        sup = data.get('superficie_cubierta') or data.get('superficie_terreno')
        dorm = data.get('dormitorios')
        banios = data.get('banios')
        if not precio:
            return False
        if calle and len(calle) > 3:
            return True
        if sup or dorm or banios is not None:
            return True
        return False

    def _text(self, soup, selector, default=''):
        el = soup.select_one(selector)
        return el.get_text(strip=True) if el else default

    def _meta(self, soup, name):
        el = soup.find('meta', attrs={'name': name}) or soup.find('meta', attrs={'property': name})
        return el.get('content', '') if el else ''

    def _json_ld(self, soup):
        """Return first JSON-LD block. Skips site-level WebSite/Organization blocks."""
        for script in soup.select('script[type="application/ld+json"]'):
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') in ('WebSite', 'Organization'):
                    continue
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and item.get('@type') not in ('WebSite', 'Organization', 'BreadcrumbList'):
                            return item
                    continue
                return data
            except Exception:
                continue
        return None

    def _json_ld_all(self, soup):
        """Return all JSON-LD blocks as a list."""
        results = []
        for script in soup.select('script[type="application/ld+json"]'):
            try:
                data = json.loads(script.string)
                if isinstance(data, list):
                    results.extend(data)
                else:
                    results.append(data)
            except Exception:
                continue
        return results

    def _parse_price_usd(self, text):
        if not text:
            return None
        return self._parse_ar_number(text)

    def _parse_int(self, text, default=0):
        if not text:
            return default
        nums = re.findall(r'\d+', text)
        return int(nums[0]) if nums else default

    def _parse_float(self, text, default=0.0):
        if not text:
            return default
        return self._parse_ar_number(text) or default

    def _parse_ar_number(self, text):
        """Parse a number in Argentine format (dot=thousands, comma=decimal).
        Examples: '237.000' -> 237000, '1.234,56' -> 1234.56, '237' -> 237.0
        """
        if not text or not text.strip():
            return None
        cleaned = re.sub(r'[^\d.,]', '', text)
        if not cleaned:
            return None
        has_dot = '.' in cleaned
        has_comma = ',' in cleaned
        if has_dot and has_comma:
            cleaned = cleaned.replace('.', '').replace(',', '.')
        elif has_comma:
            cleaned = cleaned.replace(',', '.')
        elif has_dot:
            parts = cleaned.split('.')
            if len(parts) > 2 or (len(parts) == 2 and len(parts[1]) == 3):
                cleaned = cleaned.replace('.', '')
        try:
            return float(cleaned)
        except ValueError:
            return None

    def _parse_street_address(self, street):
        """Split 'Av Corrientes 1234' into (calle, numero_calle).
        Returns (calle, numero_calle) where calle is the street name portion."""
        if not street:
            return ('', '')
        street = street.strip()
        # Try to extract the last numeric token as street number
        match = re.match(r'^(.*?)\s+(\d+)\s*$', street)
        if match:
            calle = match.group(1).strip()
            numero = match.group(2)
            return (calle, numero)
        return (street, '')

    def _has_word(self, text, words):
        if not text:
            return False
        t = text.lower()
        return any(w in t for w in words)
