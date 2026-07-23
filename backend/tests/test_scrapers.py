"""
Tests para scrapers: extract() de cada portal + base + validacion de listing.
Usa HTML estatico para evitar dependencia de red.
"""
from datetime import datetime
from bs4 import BeautifulSoup
from scrapers.base import BaseScraper
from scrapers.zonaprop import ZonaPropScraper
from scrapers.argenprop import ArgenpropScraper
from scrapers.mercadolibre import MercadoLibreScraper

# ── Helpers ───────────────────────────────────────────────────────────

def _soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, 'lxml')


# ── BaseScraper ───────────────────────────────────────────────────────

class TestBaseScraper:

    def test_match_domain(self):
        class TestScraper(BaseScraper):
            DOMAINS = ['mercadolibre.com.ar']
        s = TestScraper()
        assert s.match('https://www.mercadolibre.com.ar/something')
        assert not s.match('https://www.zonaprop.com.ar')

    def test_parse_ar_number_simple(self):
        s = BaseScraper()
        assert s._parse_ar_number('237.000') == 237000.0
        assert s._parse_ar_number('1.234,56') == 1234.56
        assert s._parse_ar_number('237') == 237.0

    def test_parse_ar_number_with_symbol(self):
        s = BaseScraper()
        assert s._parse_ar_number('USD 189.000') == 189000.0
        assert s._parse_ar_number('$ 150.500') == 150500.0

    def test_parse_ar_number_millions(self):
        s = BaseScraper()
        assert s._parse_ar_number('1.500.000') == 1500000.0

    def test_parse_ar_number_decimal_comma(self):
        s = BaseScraper()
        assert s._parse_ar_number('120,5') == 120.5

    def test_parse_ar_number_empty(self):
        s = BaseScraper()
        assert s._parse_ar_number('') is None
        assert s._parse_ar_number(None) is None

    def test_parse_int(self):
        s = BaseScraper()
        assert s._parse_int('3 dormitorios') == 3
        assert s._parse_int('') == 0
        assert s._parse_int(None) == 0

    def test_parse_float(self):
        s = BaseScraper()
        assert s._parse_float('2,5') == 2.5
        assert s._parse_float('') == 0.0

    def test_parse_price_usd(self):
        s = BaseScraper()
        assert s._parse_price_usd('USD 237.000') == 237000.0
        assert s._parse_price_usd(None) is None

    def test_text_selector(self):
        s = BaseScraper()
        html = '<div class="title">Mi propiedad</div>'
        soup = _soup(html)
        assert s._text(soup, '.title') == 'Mi propiedad'
        assert s._text(soup, '.no-existe') == ''

    def test_meta(self):
        s = BaseScraper()
        html = '<meta name="description" content="test"/>'
        soup = _soup(html)
        assert s._meta(soup, 'description') == 'test'

    def test_json_ld_skips_website(self):
        s = BaseScraper()
        html = """
        <script type="application/ld+json">
        {"@type":"WebSite","name":"Test"}
        </script>
        <script type="application/ld+json">
        {"@type":"Apartment","name":"Depto","address":{"streetAddress":"Av Siempre Viva 742"}}
        </script>
        """
        soup = _soup(html)
        ld = s._json_ld(soup)
        assert ld is not None
        assert ld['@type'] == 'Apartment'

    def test_json_ld_list_skips_breadcrumb(self):
        s = BaseScraper()
        html = """
        <script type="application/ld+json">
        [{"@type":"BreadcrumbList"},{"@type":"Apartment","name":"Depto","offers":{"price":150000}}]
        </script>
        """
        soup = _soup(html)
        ld = s._json_ld(soup)
        assert ld is not None
        assert ld['@type'] == 'Apartment'
        assert ld['offers']['price'] == 150000

    def test_es_listing_valido_devuelve_true_con_precio_y_calle(self):
        s = BaseScraper()
        assert s.es_listing_valido({'precio_usd': 50000, 'calle': 'Av Siempre Viva'})

    def test_es_listing_valido_devuelve_true_con_precio_y_superficie(self):
        s = BaseScraper()
        assert s.es_listing_valido({'precio_usd': 50000, 'superficie_cubierta': 100})

    def test_es_listing_valido_devuelve_false_sin_precio(self):
        s = BaseScraper()
        assert not s.es_listing_valido({'calle': 'Av Siempre Viva'})
        assert not s.es_listing_valido({'superficie_cubierta': 100})

    def test_es_listing_valido_devuelve_false_con_calle_corta(self):
        s = BaseScraper()
        assert not s.es_listing_valido({'precio_usd': 50000, 'calle': 'Av'})

    def test_es_listing_valido_devuelve_false_vacio(self):
        s = BaseScraper()
        assert not s.es_listing_valido({})

    def test_parse_street_address_simple(self):
        s = BaseScraper()
        calle, numero = s._parse_street_address('Av Corrientes 1234')
        assert calle == 'Av Corrientes'
        assert numero == '1234'

    def test_parse_street_address_no_number(self):
        s = BaseScraper()
        calle, numero = s._parse_street_address('Av Corrientes')
        assert calle == 'Av Corrientes'
        assert numero == ''

    def test_parse_street_address_empty(self):
        s = BaseScraper()
        calle, numero = s._parse_street_address('')
        assert calle == ''
        assert numero == ''

    def test_parse_street_address_multiple_words(self):
        s = BaseScraper()
        calle, numero = s._parse_street_address('San Martin 1234')
        assert calle == 'San Martin'
        assert numero == '1234'

    def test_parse_street_address_ordinal_number(self):
        s = BaseScraper()
        calle, numero = s._parse_street_address('Av 9 de Julio 1500')
        assert calle == 'Av 9 de Julio'
        assert numero == '1500'


# ── ZonaProp ──────────────────────────────────────────────────────────

class TestZonaPropScraper:

    def test_extract_completo(self):
        html = """
        <html><body>
        <div class="price-value">USD 189.000</div>
        <h1>Libertad 567, Palermo</h1>
        <ul>
        <li class="icon-feature"><i class="icon-dormitorio"></i>2 dorm</li>
        <li class="icon-feature"><i class="icon-bano"></i>1 baño</li>
        <li class="icon-feature"><i class="icon-scubierta"></i>65 m²</li>
        <li class="icon-feature"><i class="icon-cochera"></i></li>
        <li class="icon-feature"><i class="icon-antiguedad"></i>10 años</li>
        </ul>
        </body></html>
        """
        s = ZonaPropScraper()
        data = s.extract(_soup(html), 'https://www.zonaprop.com.ar/test')
        assert data['precio_usd'] == 189000.0
        assert 'Libertad' in data['calle']
        assert data['dormitorios'] == 2
        assert data['banios'] == 1.0
        assert data['superficie_cubierta'] == 65.0
        assert data['tiene_garage'] is True
        assert data['tipo_operacion'] == 'venta'

    def test_extract_from_initial_state(self):
        html = """
        <html><body>
        <script>window.__INITIAL_STATE__ = {"listing":{"price":155000,"title":"Av Corrientes 1234","neighborhood":"Centro","bedrooms":3,"bathrooms":2,"covered_area":80}};</script>
        </body></html>
        """
        s = ZonaPropScraper()
        data = s.extract(_soup(html), 'https://www.zonaprop.com.ar/test')
        assert data['precio_usd'] == 155000.0
        assert 'Corrientes' in data['calle']
        assert data['barrio'] == 'Centro'
        assert data['dormitorios'] == 3
        assert data['banios'] == 2.0

    def test_extract_json_ld(self):
        html = """
        <html><body>
        <script type="application/ld+json">
        {"@type":"Apartment","name":"Depto en Venta","address":{"streetAddress":"Santa Fe 1234","addressLocality":"Recoleta"},"numberOfBedrooms":2,"numberOfBathroomsTotal":1,"floorSize":{"value":70}}
        </script>
        </body></html>
        """
        s = ZonaPropScraper()
        data = s.extract(_soup(html), 'https://www.zonaprop.com.ar/test')
        assert data['calle'] == 'Santa Fe'
        assert data['numero_calle'] == '1234'
        assert data['barrio'] == 'Recoleta'
        # localidad not set when addressLocality has single part
        assert data['dormitorios'] == 2
        assert data['banios'] == 1.0
        assert data['superficie_cubierta'] == 70.0

    def test_extract_alquiler_detecta_cotizacion(self):
        html = """
        <html><body>
        <div class="price-value">$ 80.000</div>
        </body></html>
        """
        s = ZonaPropScraper()
        data = s.extract(_soup(html), 'https://www.zonaprop.com.ar/alquiler/test')
        assert data['tipo_operacion'] == 'cotizacion'

    def test_extract_html_fallback_price(self):
        html = """
        <html><body>
        <div data-price="125000"></div>
        </body></html>
        """
        s = ZonaPropScraper()
        data = s.extract(_soup(html), 'https://www.zonaprop.com.ar/test')
        assert data['precio_usd'] == 125000.0

    def test_extract_age_to_year_conversion(self):
        html = """
        <html><body>
        <div class="price-value">USD 100.000</div>
        <h1>Test</h1>
        <ul>
        <li class="icon-feature"><i class="icon-antiguedad"></i>30 años</li>
        </ul>
        </body></html>
        """
        s = ZonaPropScraper()
        data = s.extract(_soup(html), 'https://www.zonaprop.com.ar/test')
        expected_year = datetime.now().year - 30
        assert data['anio_construccion'] == expected_year

    def test_es_listing_valido(self):
        s = ZonaPropScraper()
        assert s.es_listing_valido({'precio_usd': 50000, 'calle': 'Test'})
        # Sin precio = invalido
        assert not s.es_listing_valido({'calle': 'Test'})


# ── Argenprop ─────────────────────────────────────────────────────────

class TestArgenpropScraper:

    def test_extract_completo(self):
        html = """
        <html><body>
        <div class="precio">USD 237.000</div>
        <h1 class="titulo">Lavalleja 1234, CABA</h1>
        <div class="direccion">Lavalleja 1234, Villa Crespo, CABA</div>
        <ul class="features">
        <li>3 dormitorios</li>
        <li>2 baños</li>
        <li>Cubierta 120 m²</li>
        <li>Total 150 m²</li>
        <li>Cochera</li>
        <li>Antigüedad 15 años</li>
        </ul>
        </body></html>
        """
        s = ArgenpropScraper()
        data = s.extract(_soup(html), 'https://www.argenprop.com/test')
        assert data['precio_usd'] == 237000.0
        assert 'Lavalleja' in data['calle']
        assert data['barrio'] == 'Villa Crespo'
        assert data['dormitorios'] == 3
        assert data['banios'] == 2.0
        assert data['superficie_cubierta'] == 120.0
        assert data['superficie_terreno'] == 150.0
        assert data['tiene_garage'] is True
        expected_year = datetime.now().year - 15
        assert data['anio_construccion'] == expected_year

    def test_extract_json_ld(self):
        html = """
        <html><body>
        <script type="application/ld+json">
        {"@type":"Apartment","name":"Depto Venta","offers":{"price":180000},"address":{"streetAddress":"Av Cabildo 2000","addressLocality":"Belgrano"}}
        </script>
        </body></html>
        """
        s = ArgenpropScraper()
        data = s.extract(_soup(html), 'https://www.argenprop.com/test')
        assert data['precio_usd'] == 180000.0
        assert 'Cabildo' in data['calle']
        assert data['barrio'] == 'Belgrano'

    def test_extract_alquiler_detecta_cotizacion(self):
        s = ArgenpropScraper()
        data = s.extract(_soup('<html><body></body></html>'), 'https://www.argenprop.com/alquiler/test')
        assert data['tipo_operacion'] == 'cotizacion'

    def test_banos_con_enie(self):
        html = """
        <html><body>
        <div class="precio">USD 100.000</div>
        <ul class="features">
        <li>1 baño</li>
        </ul>
        </body></html>
        """
        s = ArgenpropScraper()
        data = s.extract(_soup(html), 'https://www.argenprop.com/test')
        assert data['banios'] == 1.0

    def test_banos_con_enie_texto(self):
        html = """
        <html><body>
        <div class="precio">USD 100.000</div>
        <ul class="features">
        <li>2 baños</li>
        </ul>
        </body></html>
        """
        s = ArgenpropScraper()
        data = s.extract(_soup(html), 'https://www.argenprop.com/test')
        assert data['banios'] == 2.0

    def test_age_to_year_conversion(self):
        html = """
        <html><body>
        <div class="precio">USD 100.000</div>
        <ul class="features">
        <li>Antigüedad 25 años</li>
        </ul>
        </body></html>
        """
        s = ArgenpropScraper()
        data = s.extract(_soup(html), 'https://www.argenprop.com/test')
        expected_year = datetime.now().year - 25
        assert data['anio_construccion'] == expected_year

    def test_price_selectors_order(self):
        """Verifica que selectores especificos se usen antes que [class*=price]."""
        html = """
        <html><body>
        <div class="precio">USD 300.000</div>
        <div class="card-price">USD 200.000</div>
        <div class="otro-price">USD 100.000</div>
        </body></html>
        """
        s = ArgenpropScraper()
        data = s.extract(_soup(html), 'https://www.argenprop.com/test')
        # Debe tomar .precio (el primero en la lista)
        assert data['precio_usd'] == 300000.0

    def test_es_listing_valido(self):
        s = ArgenpropScraper()
        assert s.es_listing_valido({'precio_usd': 50000, 'calle': 'Test'})
        assert not s.es_listing_valido({'calle': 'Test'})


# ── MercadoLibre ──────────────────────────────────────────────────────

class TestMercadoLibreScraper:

    def test_extract_completo(self):
        html = """
        <html><body>
        <meta property="og:title" content="Departamento en Venta en Palermo"/>
        <meta property="og:url" content="https://www.mercadolibre.com.ar/MLA-123"/>
        <meta property="product:price:amount" content="175000"/>
        <div class="ui-pdp-header__title-container"><h1 class="ui-pdp-title">Lavalleja 1234</h1></div>
        <table class="andes-table">
        <tr class="andes-table__row"><th>Dormitorios</th><td>3</td></tr>
        <tr class="andes-table__row"><th>Banos</th><td>2</td></tr>
        <tr class="andes-table__row"><th>Superficie cubierta</th><td>80 m²</td></tr>
        <tr class="andes-table__row"><th>Cochera</th><td>1</td></tr>
        <tr class="andes-table__row"><th>Antigüedad</th><td>10 años</td></tr>
        </table>
        </body></html>
        """
        s = MercadoLibreScraper()
        data = s.extract(_soup(html), 'https://www.mercadolibre.com.ar/MLA-123')
        assert data['precio_usd'] == 175000.0
        assert data['calle'] == 'Lavalleja 1234'
        assert data['dormitorios'] == 3
        assert data['banios'] == 2.0
        assert data['superficie_cubierta'] == 80.0
        assert data['tiene_garage'] is True
        expected_year = datetime.now().year - 10
        assert data['anio_construccion'] == expected_year

    def test_extract_og_tags(self):
        html = """
        <html><body>
        <meta property="og:title" content="Casa en Venta"/>
        <meta property="og:url" content="https://www.mercadolibre.com.ar/MLA-456"/>
        <meta property="product:price:amount" content="250000"/>
        </body></html>
        """
        s = MercadoLibreScraper()
        data = s.extract(_soup(html), 'https://www.mercadolibre.com.ar/MLA-456')
        assert data['precio_usd'] == 250000.0
        assert 'Casa' in data['calle']

    def test_extract_sin_datos_devuelve_calle_del_titulo(self):
        html = """
        <html><body>
        <meta property="og:title" content="Depto en Venta"/>
        <meta property="og:url" content="https://www.mercadolibre.com.ar/MLA-789"/>
        </body></html>
        """
        s = MercadoLibreScraper()
        data = s.extract(_soup(html), 'https://www.mercadolibre.com.ar/MLA-789')
        assert data['calle'] == 'Depto en Venta'
        assert data.get('precio_usd') is None

    def test_es_listing_valido(self):
        s = MercadoLibreScraper()
        assert s.es_listing_valido({'precio_usd': 50000, 'calle': 'Test'})
        assert not s.es_listing_valido({'calle': 'Test'})
