"""
scrapers/metrics.py — Métricas de extracción por portal.
Contador en memoria de éxito/fracaso/tiempo por scraper.
"""
import time
import logging
from threading import Lock

logger = logging.getLogger(__name__)

_stats: dict[str, dict] = {}
_lock = Lock()

_RESET_INTERVAL = 3600  # 1 hora


def _ensure(scraper_name: str):
    now = time.time()
    s = _stats.get(scraper_name)
    if not s or (now - s['_since']) > _RESET_INTERVAL:
        _stats[scraper_name] = {
            '_since': now,
            'ok': 0,
            'fail': 0,
            'total_ms': 0,
            'timeout': 0,
            'invalid_listing': 0,
            'last_error': '',
        }


def record_ok(scraper_name: str, duration_ms: int):
    with _lock:
        _ensure(scraper_name)
        s = _stats[scraper_name]
        s['ok'] += 1
        s['total_ms'] += duration_ms


def record_fail(scraper_name: str, duration_ms: int, error: str):
    with _lock:
        _ensure(scraper_name)
        s = _stats[scraper_name]
        s['fail'] += 1
        s['total_ms'] += duration_ms
        s['last_error'] = error[:200]


def record_timeout(scraper_name: str, duration_ms: int):
    with _lock:
        _ensure(scraper_name)
        s = _stats[scraper_name]
        s['timeout'] += 1
        s['fail'] += 1
        s['total_ms'] += duration_ms


def record_invalid_listing(scraper_name: str, duration_ms: int):
    with _lock:
        _ensure(scraper_name)
        s = _stats[scraper_name]
        s['invalid_listing'] += 1
        s['fail'] += 1
        s['total_ms'] += duration_ms


def get_stats() -> dict:
    with _lock:
        now = time.time()
        result = {}
        for name, s in _stats.items():
            total = s['ok'] + s['fail']
            result[name] = {
                'since': s['_since'],
                'uptime_hours': round((now - s['_since']) / 3600, 2),
                'ok': s['ok'],
                'fail': s['fail'],
                'total': total,
                'success_rate_pct': round(s['ok'] / total * 100, 1) if total else 0,
                'avg_ms': round(s['total_ms'] / total, 1) if total else 0,
                'timeout': s['timeout'],
                'invalid_listing': s['invalid_listing'],
                'last_error': s['last_error'],
            }
        return result


def reset():
    with _lock:
        _stats.clear()
