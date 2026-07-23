"""
warmup.py — Render Cron Job: keep the web service warm to avoid cold starts.

Pings /health every 4 minutes (schedule in render.yaml).
Uses only stdlib — no dependencies beyond Python.
"""
import os
import sys
import logging
from urllib.request import Request, urlopen
from urllib.error import URLError

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
)
logger = logging.getLogger('warmup')

SITE_URL = os.environ.get('SITE_URL', 'https://bienenhaus.onrender.com')
HEALTH_URL = f'{SITE_URL}/health'
TIMEOUT = 15


def warmup():
    req = Request(HEALTH_URL, method='GET')
    try:
        with urlopen(req, timeout=TIMEOUT) as resp:
            body = resp.read().decode()
            status = resp.status
            logger.info('Ping %s → %d %s', HEALTH_URL, status, body[:100])
            if status != 200:
                logger.error('Health check returned %d', status)
                return False
            return True
    except URLError as e:
        logger.error('Ping %s failed: %s', HEALTH_URL, e)
        return False
    except Exception as e:
        logger.error('Ping %s unexpected error: %s', HEALTH_URL, e)
        return False


if __name__ == '__main__':
    ok = warmup()
    sys.exit(0 if ok else 1)
