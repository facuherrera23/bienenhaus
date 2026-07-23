"""
portal_worker.py — Worker de línea de comandos para la cola de portales.

Uso:
    python portal_worker.py              # Una iteración (ideal para cron)
    python portal_worker.py --watch       # Loop continuo cada N segundos
    python portal_worker.py --interval 30 # Poll cada 30 segundos (default)

En producción (Render Cron Job):
    python portal_worker.py
"""
import argparse
import time
import sys
import logging

try:
    import sentry_sdk
    _has_sentry = True
except ImportError:
    _has_sentry = False

logger = logging.getLogger(__name__)


def _capture(msg, extra=None):
    if _has_sentry:
        with sentry_sdk.push_scope() as scope:
            if extra:
                for k, v in extra.items():
                    scope.set_extra(k, v)
            sentry_sdk.capture_message(msg, level='error')


def process_batch(app, limit=5):
    """Procesa un lote de items de la cola. Luego ejecuta sync bidireccional ML."""
    with app.app_context():
        from portals import QueueService, ADAPTER_REGISTRY, sync_bidirectional
        from models import Portal

        recovered = QueueService.recover_stuck(limit=limit)
        if recovered:
            logger.info('Recuperados %d items stuck en processing', recovered)

        portal_map = {}
        for portal in QueueService.get_available_portals():
            if portal.slug in ADAPTER_REGISTRY:
                AdapterClass = ADAPTER_REGISTRY[portal.slug]
                portal_map[portal.slug] = AdapterClass(portal)

        processed, errors = QueueService.process_next_batch(
            portal_map=portal_map, limit=limit)

        try:
            result = sync_bidirectional()
            if result['created'] or result['updated'] or result['exported']:
                logger.info(
                    'ML sync bidi: %d creadas, %d actualizadas, %d exportadas, %d conflictos',
                    result['created'], result['updated'],
                    result['exported'], result['conflicts_ml_wins'],
                )
        except Exception as e:
            logger.exception('ML sync bidi falló: %s', e)
            errors.append(f'ML sync bidi: {str(e)[:200]}')

        return processed, errors


def run_once():
    from app import create_app
    app = create_app()
    processed, errors = process_batch(app)
    logger.info('Procesados: %s, Errores: %s', processed, len(errors))
    for e in errors:
        logger.error('Error en portal worker: %s', e)
    return len(errors) == 0


def run_watch(interval):
    from app import create_app
    app = create_app()
    while True:
        try:
            processed, errors = process_batch(app)
            ts = time.strftime('%Y-%m-%d %H:%M:%S')
            logger.info('[%s] Procesados: %s, Errores: %s', ts, processed, len(errors))
            for e in errors:
                logger.error('Error en portal worker: %s', e)
        except Exception as ex:
            logger.exception('Error inesperado en portal worker: %s', ex)
            _capture('Error inesperado en portal worker', extra={
                'error': str(ex)[:1000],
            })
        time.sleep(interval)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Portal Queue Worker')
    parser.add_argument('--watch', action='store_true', help='Loop continuo')
    parser.add_argument('--interval', type=int, default=30,
                        help='Intervalo en segundos (default: 30)')
    args = parser.parse_args()

    if args.watch:
        run_watch(args.interval)
    else:
        ok = run_once()
        sys.exit(0 if ok else 1)
