"""
Tests para métricas de scrapers, timeout configurable y health check.
"""
import os
from unittest.mock import patch, MagicMock
from scrapers.metrics import record_ok, record_fail, get_stats, reset


class TestScraperMetrics:

    def setup_method(self):
        reset()

    def test_record_ok(self):
        record_ok('TestScraper', 100)
        stats = get_stats()
        assert stats['TestScraper']['ok'] == 1
        assert stats['TestScraper']['total'] == 1
        assert stats['TestScraper']['success_rate_pct'] == 100.0

    def test_record_fail(self):
        record_fail('TestScraper', 200, 'error')
        stats = get_stats()
        assert stats['TestScraper']['fail'] == 1
        assert stats['TestScraper']['total'] == 1
        assert stats['TestScraper']['success_rate_pct'] == 0.0
        assert 'error' in stats['TestScraper']['last_error']

    def test_mixed_results(self):
        record_ok('S1', 150)
        record_ok('S1', 200)
        record_fail('S1', 300, 'timeout')
        stats = get_stats()
        s = stats['S1']
        assert s['ok'] == 2
        assert s['fail'] == 1
        assert s['total'] == 3
        assert s['success_rate_pct'] == 66.7
        assert s['avg_ms'] == 216.7

    def test_multiple_scrapers(self):
        record_ok('ML', 100)
        record_fail('ZP', 500, 'error')
        stats = get_stats()
        assert 'ML' in stats
        assert 'ZP' in stats
        assert stats['ML']['ok'] == 1
        assert stats['ZP']['fail'] == 1

    def test_empty_stats(self):
        stats = get_stats()
        assert stats == {}

    def test_auto_reset_after_interval(self):
        """Verifica que el contador se resetee después del intervalo."""
        record_ok('S1', 100)
        # Simular que pasó el intervalo modificando _since
        from scrapers.metrics import _stats
        _stats['S1']['_since'] = 0
        record_fail('S1', 200, 'error')
        stats = get_stats()
        # Después del reset debería tener solo la última entrada
        assert stats['S1']['ok'] == 0
        assert stats['S1']['fail'] == 1


class TestScraperTimeoutConfig:

    def test_default_timeout(self):
        """El timeout default debe ser 30 si no hay env."""
        if 'SCRAPER_TIMEOUT' in os.environ:
            del os.environ['SCRAPER_TIMEOUT']
        from scrapers import _DEFAULT_TIMEOUT
        assert _DEFAULT_TIMEOUT == 30

    def test_env_timeout(self):
        """Debe respetar SCRAPER_TIMEOUT env var."""
        os.environ['SCRAPER_TIMEOUT'] = '15'
        # Recargar el módulo para que tome el nuevo env
        import importlib
        import scrapers
        importlib.reload(scrapers)
        assert scrapers._DEFAULT_TIMEOUT == 15
        # Restaurar
        os.environ['SCRAPER_TIMEOUT'] = '30'
        importlib.reload(scrapers)


class TestScraperStatsEndpoint:

    def test_scraper_stats_requires_auth(self, client):
        resp = client.get('/api/appraisals/scraper-stats')
        assert resp.status_code == 401

    def test_scraper_stats_returns_json(self, admin_session):
        resp = admin_session.get('/api/appraisals/scraper-stats')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['ok'] is True
        assert isinstance(data['data'], dict)
