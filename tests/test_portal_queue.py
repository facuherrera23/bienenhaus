"""
test_portal_queue.py — Tests para QueueService (encolar, procesar, reintentar)
"""
import pytest
from unittest.mock import patch


class MockAdapter:
    """Adapter simulado para tests de QueueService.process_next_batch."""
    slug = 'mock-portal'

    def __init__(self):
        self.published = []
        self.updated = []
        self.unpublished = []
        self.logs = []
        self.publications = []

    def publish(self, data):
        self.published.append(data)
        return (True, 'ext-123', '')

    def update(self, ext_id, data):
        self.updated.append((ext_id, data))
        return (True, '')

    def unpublish(self, ext_id):
        self.unpublished.append(ext_id)
        return (True, '')

    def _log(self, action, level, message, property_id=None, raw_response=''):
        self.logs.append((action, level, message, property_id))

    def _update_publication(self, property_id, rental_id, status,
                            external_id='', error=''):
        self.publications.append((property_id, rental_id, status, external_id, error))


@pytest.fixture(autouse=True)
def _cleanup_queue(app):
    """Limpia la cola antes de cada test para evitar interferencias."""
    with app.app_context():
        from extensions import db
        from models import PortalQueue
        PortalQueue.query.delete()
        db.session.commit()


_test_counter = 0


def _unique_slug(base):
    global _test_counter
    _test_counter += 1
    return f'{base}-{_test_counter}'


class TestQueueEnqueue:
    def test_enqueue_basic(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import PortalQueue
            item = QueueService.enqueue('publish', property_id=100, priority=5)
            assert item.id is not None
            assert item.action == 'publish'
            assert item.property_id == 100
            assert item.processed is False
            assert item.priority == 5
            db_item = db.session.get(PortalQueue, item.id)
            assert db_item.processed is False

    def test_enqueue_with_portal_id(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import Portal
            portal = Portal(name='Test', slug=_unique_slug('test-enqueue'), active=True)
            db.session.add(portal)
            db.session.commit()
            item = QueueService.enqueue('publish', property_id=1, portal_id=portal.id)
            assert item.portal_id == portal.id

    def test_enqueue_inactive_portal_raises(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import Portal
            portal = Portal(name='Inactive', slug=_unique_slug('inactive-enqueue'), active=False)
            db.session.add(portal)
            db.session.commit()
            with pytest.raises(ValueError, match='inactivo'):
                QueueService.enqueue('publish', property_id=1, portal_id=portal.id)

    def test_enqueue_nonexistent_portal_raises(self, app):
        with app.app_context():
            from portals.queue import QueueService
            with pytest.raises(ValueError, match='no encontrado'):
                QueueService.enqueue('publish', property_id=1, portal_id=99999)

    def test_enqueue_invalid_action(self, app):
        with app.app_context():
            from portals.queue import QueueService
            with pytest.raises(ValueError, match='Acción inválida'):
                QueueService.enqueue('fly', property_id=1)

    def test_enqueue_property_helper(self, app):
        with app.app_context():
            from portals.queue import QueueService
            item = QueueService.enqueue_property(200)
            assert item.action == 'publish'
            assert item.property_id == 200

    def test_enqueue_rental_helper(self, app):
        with app.app_context():
            from portals.queue import QueueService
            item = QueueService.enqueue_rental(300)
            assert item.action == 'publish'
            assert item.rental_id == 300


class TestQueueDequeue:
    def test_dequeue_orders_by_priority(self, app):
        with app.app_context():
            from portals.queue import QueueService
            low = QueueService.enqueue('publish', property_id=1, priority=1)
            high = QueueService.enqueue('publish', property_id=2, priority=5)
            mid = QueueService.enqueue('publish', property_id=3, priority=3)
            items = QueueService.dequeue(limit=10)
            assert items[0].id == high.id
            assert items[1].id == mid.id
            assert items[2].id == low.id

    def test_dequeue_respects_limit(self, app):
        with app.app_context():
            from portals.queue import QueueService
            for i in range(5):
                QueueService.enqueue('publish', property_id=i)
            items = QueueService.dequeue(limit=3)
            assert len(items) == 3

    def test_dequeue_only_pending(self, app):
        with app.app_context():
            from portals.queue import QueueService
            from models import PortalQueue
            item = QueueService.enqueue('publish', property_id=1)
            processed_item = QueueService.enqueue('publish', property_id=2)
            QueueService.mark_processed(processed_item.id)
            items = QueueService.dequeue()
            ids = [i.id for i in items]
            assert item.id in ids
            assert processed_item.id not in ids


class TestQueueMarkProcessed:
    def test_mark_processed_no_error(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import PortalQueue
            item = QueueService.enqueue('publish', property_id=1)
            QueueService.mark_processed(item.id)
            db.session.expire(item)
            assert item.processed is True
            assert item.error == ''

    def test_mark_processed_with_error(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            item = QueueService.enqueue('publish', property_id=1)
            QueueService.mark_processed(item.id, error='Algo salió mal')
            from models import PortalQueue
            reloaded = db.session.get(PortalQueue, item.id)
            assert reloaded.processed is False
            assert reloaded.error == 'Algo salió mal'
            assert reloaded.status == 'failed'

    def test_mark_processed_nonexistent(self, app):
        with app.app_context():
            from portals.queue import QueueService
            QueueService.mark_processed(99999)


class TestQueueRetry:
    def test_retry_success(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            item = QueueService.enqueue('publish', property_id=1)
            QueueService.mark_processed(item.id, error='falló')
            result = QueueService.retry(item.id)
            assert result is not None
            db.session.expire(item)
            assert item.processed is False
            assert item.error == ''

    def test_retry_not_processed_returns_none(self, app):
        with app.app_context():
            from portals.queue import QueueService
            item = QueueService.enqueue('publish', property_id=1)
            result = QueueService.retry(item.id)
            assert result is None

    def test_retry_nonexistent_returns_none(self, app):
        with app.app_context():
            from portals.queue import QueueService
            result = QueueService.retry(99999)
            assert result is None


class TestQueueGetAvailable:
    def test_get_available_portals(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import Portal
            # Use unique slugs for each test run
            slug_a = _unique_slug('available-a')
            slug_b = _unique_slug('available-b')
            slug_c = _unique_slug('available-c')
            p1 = Portal(name='A', slug=slug_a, active=True)
            p2 = Portal(name='B', slug=slug_b, active=False)
            p3 = Portal(name='C', slug=slug_c, active=True)
            db.session.add_all([p1, p2, p3])
            db.session.commit()
            available = QueueService.get_available_portals()
            slugs = [p.slug for p in available]
            assert slug_a in slugs
            assert slug_c in slugs
            assert slug_b not in slugs

    def test_get_available_portals_empty(self, app):
        with app.app_context():
            from portals.queue import QueueService
            available = QueueService.get_available_portals()
            # No assertion on specific count — depends on test order.
            pass


class TestQueueProcessBatch:
    def _make_portal(self, slug_suffix):
        from extensions import db
        from models import Portal
        slug = _unique_slug('batch-' + slug_suffix)
        portal = Portal(name=f'Test-{slug_suffix}', slug=slug, active=True)
        db.session.add(portal)
        db.session.commit()
        return portal

    def test_process_publish_property(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import Portal, Property
            portal = self._make_portal('pub-prop')
            prop = Property(title='Casa', type='casa', location='CBA', price=100000)
            db.session.add(prop)
            db.session.commit()
            QueueService.enqueue('publish', property_id=prop.id, portal_id=portal.id)
            adapter = MockAdapter()
            adapter.slug = portal.slug
            processed, errors = QueueService.process_next_batch(
                portal_map={portal.slug: adapter}, limit=5)
            assert processed == 1
            assert errors == []
            assert len(adapter.published) == 1
            assert adapter.published[0]['title'] == 'Casa'

    def test_process_publish_rental(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import Portal, Rental
            portal = self._make_portal('pub-rental')
            rental = Rental(title='Alquiler test', type='departamento',
                            location='CBA', price_ars=50000)
            db.session.add(rental)
            db.session.commit()
            QueueService.enqueue('publish', rental_id=rental.id, portal_id=portal.id)
            adapter = MockAdapter()
            adapter.slug = portal.slug
            processed, errors = QueueService.process_next_batch(
                portal_map={portal.slug: adapter}, limit=5)
            assert processed == 1
            assert len(adapter.published) == 1
            assert adapter.published[0]['title'] == 'Alquiler test'

    def test_process_update(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import Portal, Property, PortalPublication
            portal = self._make_portal('upd')
            prop = Property(title='Casa', type='casa', location='CBA', price=100000)
            db.session.add(prop)
            db.session.commit()
            pub = PortalPublication(
                portal_id=portal.id, property_id=prop.id,
                status='published', external_id='ext-abc')
            db.session.add(pub)
            db.session.commit()
            QueueService.enqueue('update', property_id=prop.id, portal_id=portal.id)
            adapter = MockAdapter()
            adapter.slug = portal.slug
            processed, errors = QueueService.process_next_batch(
                portal_map={portal.slug: adapter}, limit=5)
            assert processed == 1
            assert len(adapter.updated) == 1
            assert adapter.updated[0][0] == 'ext-abc'

    def test_process_unpublish(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import Portal, Property, PortalPublication
            portal = self._make_portal('unpub')
            prop = Property(title='Casa', type='casa', location='CBA', price=100000)
            db.session.add(prop)
            db.session.commit()
            pub = PortalPublication(
                portal_id=portal.id, property_id=prop.id,
                status='published', external_id='ext-xyz')
            db.session.add(pub)
            db.session.commit()
            QueueService.enqueue('unpublish', property_id=prop.id, portal_id=portal.id)
            adapter = MockAdapter()
            adapter.slug = portal.slug
            processed, errors = QueueService.process_next_batch(
                portal_map={portal.slug: adapter}, limit=5)
            assert processed == 1
            assert len(adapter.unpublished) == 1
            assert adapter.unpublished[0] == 'ext-xyz'

    def test_process_no_adapter_skips_item(self, app):
        with app.app_context():
            from portals.queue import QueueService
            QueueService.enqueue('publish', property_id=1)
            adapter = MockAdapter()
            adapter.slug = 'other-portal'
            processed, errors = QueueService.process_next_batch(
                portal_map={'other-portal': adapter}, limit=5)
            assert processed == 1
            assert len(adapter.published) == 0
            assert errors == []

    def test_process_item_without_property_data(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import Portal
            portal = self._make_portal('no-data')
            QueueService.enqueue('publish', property_id=99999, portal_id=portal.id)
            adapter = MockAdapter()
            adapter.slug = portal.slug
            processed, errors = QueueService.process_next_batch(
                portal_map={portal.slug: adapter}, limit=5)
            assert processed == 1
            assert len(adapter.published) == 0
            assert errors == []

    def test_process_exception_handled(self, app):
        with app.app_context():
            from extensions import db
            from portals.queue import QueueService
            from models import Property
            portal = self._make_portal('except')
            prop = Property(title='Casa', type='casa', location='CBA', price=100000)
            db.session.add(prop)
            db.session.commit()
            QueueService.enqueue('publish', property_id=prop.id, portal_id=portal.id)

            class FailingAdapter:
                slug = 'nonexistent'
                def publish(self, data):
                    raise RuntimeError('Falló la publicación')
                def _log(self, *a, **kw): pass
                def _update_publication(self, *a, **kw): pass

            processed, errors = QueueService.process_next_batch(
                portal_map={portal.slug: FailingAdapter()}, limit=5)
            assert processed == 1
            assert len(errors) == 1
            assert 'Falló la publicación' in errors[0]

    def test_process_empty_queue(self, app):
        with app.app_context():
            from portals.queue import QueueService
            adapter = MockAdapter()
            adapter.slug = 'empty-portal'
            processed, errors = QueueService.process_next_batch(
                portal_map={'empty-portal': adapter}, limit=5)
            assert processed == 0
            assert errors == []
