import logging
import os
import threading
import time
from urllib.parse import urlparse, urlunparse
from bs4 import BeautifulSoup
from .mercadolibre import MercadoLibreScraper
from .zonaprop import ZonaPropScraper
from .argenprop import ArgenpropScraper
from .metrics import record_ok, record_fail, record_timeout, record_invalid_listing, get_stats, reset as reset_metrics

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = int(os.getenv('SCRAPER_TIMEOUT', '30'))

# ── Caché thread-safe ────────────────────────────────────────────────
_CACHE: dict = {}
_CACHE_LOCK = threading.Lock()
_CACHE_TTL = 300

def _cache_get(clean_url):
    now = time.time()
    with _CACHE_LOCK:
        entry = _CACHE.get(clean_url)
        if entry and (now - entry[2]) < _CACHE_TTL:
            logger.debug('Cache hit for %s', clean_url)
            return entry[0], entry[1]
    return None, None

def _cache_set(clean_url, data, error):
    now = time.time()
    with _CACHE_LOCK:
        _CACHE[clean_url] = (data, error, now)
        if len(_CACHE) > 500:
            stale = [k for k, (_, _, ts) in _CACHE.items() if (now - ts) > _CACHE_TTL * 2]
            for k in stale:
                del _CACHE[k]

# Usar cloudscraper para bypassear Cloudflare (ZonaProp, Argenprop)
# Fallback a requests si no está disponible
try:
    import cloudscraper as _cs
    _session = _cs.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'windows',
            'mobile': False,
            'desktop': True,
        },
        delay=15,
    )
    _session.headers.update({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    })
except ImportError:
    import logging as _log
    _log.getLogger(__name__).warning('cloudscraper no instalado, usando requests (fallará con Cloudflare)')
    import requests as _req
    _session = _req.Session()
    _session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'es-AR,es;q=0.9',
    })


def _clean_url(url):
    """Strip query params and trailing garbage that may trigger bot detection."""
    parsed = urlparse(url)
    path = parsed.path.rstrip('/')
    return urlunparse((parsed.scheme, parsed.netloc, path, '', '', ''))

SCRAPERS = [
    MercadoLibreScraper(),
    ZonaPropScraper(),
    ArgenpropScraper(),
]


def detectar_scraper(url):
    for s in SCRAPERS:
        if s.match(url):
            return s
    return None


def _should_retry(attempt: int, status: int | None, e: Exception) -> tuple[bool, int]:
    """Determina si debe reintentar y cuántos segundos esperar. Retorna (reintentar, sleep_seconds)."""
    if status == 429 or (status and status >= 500):
        if attempt < 2:
            return True, 2 ** attempt
    if status == 403 and attempt < 1:
        return True, 3
    if attempt < 2:
        return True, 2
    return False, 0


def _handle_scrape_error(e: Exception, attempt: int, scraper_name: str, clean: str, url: str, start: float):
    """Procesa un error de scraping. Retorna (data, error, should_retry)."""
    elapsed = int((time.time() - start) * 1000)
    status = getattr(e, 'response', None) and e.response.status_code
    is_timeout = (
        status == 410
        or 'Timeout' in type(e).__name__
        or 'timeout' in str(e).lower()
    )
    if is_timeout:
        record_timeout(scraper_name, elapsed)
        _cache_set(clean, None, 'Tiempo de espera agotado al cargar la página.')
        return None, 'Tiempo de espera agotado al cargar la página.', False
    should, wait = _should_retry(attempt, status, e)
    if should:
        logger.warning('Intento %d falló (status %s), re-intentando en %ds', attempt + 1, status or '?', wait)
        time.sleep(wait)
        return None, None, True
    logger.exception('Error scraping %s', url)
    record_fail(scraper_name, elapsed, str(e))
    err_msg = f'Error al acceder a la URL: {str(e)}'
    _cache_set(clean, None, err_msg)
    return None, err_msg, False


def extraer_desde_url(url: str, timeout: int | None = None) -> tuple:
    if timeout is None:
        timeout = _DEFAULT_TIMEOUT
    scraper = detectar_scraper(url)
    if not scraper:
        return None, 'Portal no soportado. Usá MercadoLibre, ZonaProp o Argenprop.'
    clean = _clean_url(url)
    logger.info('Scraping %s (cleaned from %s)', clean, url)
    start = time.time()
    scraper_name = type(scraper).__name__

    cached_data, cached_error = _cache_get(clean)
    if cached_data is not None or cached_error is not None:
        return cached_data, cached_error

def extraer_desde_url(url: str, timeout: int | None = None) -> tuple:
    if timeout is None:
        timeout = _DEFAULT_TIMEOUT
    scraper = detectar_scraper(url)
    if not scraper:
        return None, 'Portal no soportado. Usá MercadoLibre, ZonaProp o Argenprop.'
    clean = _clean_url(url)
    logger.info('Scraping %s (cleaned from %s)', clean, url)
    start = time.time()
    scraper_name = type(scraper).__name__

    cached_data, cached_error = _cache_get(clean)
    if cached_data is not None or cached_error is not None:
        return cached_data, cached_error

    for attempt in range(3):
        try:
            resp = _session.get(clean, timeout=timeout)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'lxml')
            data = scraper.extract(soup, clean)
            elapsed = int((time.time() - start) * 1000)
            if data and not scraper.es_listing_valido(data):
                logger.warning('Scraping completado pero no parece un listing válido para %s', url)
                record_invalid_listing(scraper_name, elapsed)
                data['link_fuente'] = url
                _cache_set(clean, data, None)
                return None, 'La página no contiene un listing de propiedad válido (search/404?).'
            if data:
                data['link_fuente'] = url
            record_ok(scraper_name, elapsed)
            _cache_set(clean, data, None)
            return data, None
        except RecursionError:
            logger.exception('RecursionError en extraer_desde_url para %s', url)
            return None, 'RecursionError en scraper (límite de recursión excedido)'
        except Exception as e:
            data, err, should = _handle_scrape_error(e, attempt, scraper_name, clean, url, start)
            if not should:
                return data, err

    elapsed = int((time.time() - start) * 1000)
    record_fail(scraper_name, elapsed, 'portal bloqueó acceso')
    err_msg = 'El portal bloqueó el acceso automatizado. Ingresá los datos manualmente.'
    _cache_set(clean, None, err_msg)
    return None, err_msg
