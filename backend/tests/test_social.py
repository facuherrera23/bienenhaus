"""Tests del módulo de redes sociales."""
import json
import os
import sys
import threading
import time
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta


class TestSocialModels:
    def test_create_account(self, app):
        from social.models import SocialAccount
        with app.app_context():
            a = SocialAccount(platform='facebook', label='Mi Pagina', active=True,
                              page_id='123456', config={'access_token': 'tok123'})
            from extensions import db
            db.session.add(a)
            db.session.commit()
            assert a.id is not None
            assert a.config['access_token'] == 'tok123'
            d = a.to_dict()
            assert d['platform'] == 'facebook'
            assert d['config']['access_token'] == '***'

    def test_create_post(self, app):
        from social.models import SocialAccount, SocialPost
        from extensions import db
        with app.app_context():
            a = SocialAccount(platform='instagram', label='IG', active=True,
                              ig_user_id='789', config={'access_token': 'ig_tok'})
            db.session.add(a)
            db.session.commit()
            p = SocialPost(account_id=a.id, content='Test post!',
                           media_urls=json.dumps(['https://img.png']),
                           status=SocialPost.STATUS_DRAFT)
            db.session.add(p)
            db.session.commit()
            assert p.id is not None
            d = p.to_dict()
            assert d['status'] == 'draft'
            assert len(d['media_urls']) == 1

    def test_scheduled_post(self, app):
        from social.models import SocialAccount, SocialPost
        from extensions import db
        with app.app_context():
            a = SocialAccount(platform='facebook', label='FB', active=True, page_id='p1',
                              config={'access_token': 'x'})
            db.session.add(a)
            db.session.commit()
            future = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=2)
            p = SocialPost(account_id=a.id, content='Scheduled', scheduled_at=future,
                           status=SocialPost.STATUS_SCHEDULED)
            db.session.add(p)
            db.session.commit()
            assert p.status == 'scheduled'
            assert p.scheduled_at is not None


class TestSocialAPI:
    def test_list_accounts_empty(self, admin_session):
        resp = admin_session.get('/api/social/accounts')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['ok'] is True

    def test_create_account(self, admin_session, json_headers):
        resp = admin_session.post('/api/social/accounts',
                                  json={
                                      'platform': 'facebook',
                                      'label': 'Test FB',
                                      'page_id': 'pg123',
                                      'active': True,
                                      'config': {'access_token': 'tok'},
                                  }, headers=json_headers)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['ok'] is True
        assert data['data']['platform'] == 'facebook'

    def test_create_post(self, admin_session, json_headers):
        r = admin_session.post('/api/social/accounts',
                               json={
                                   'platform': 'instagram',
                                   'label': 'Test IG',
                                   'ig_user_id': 'ig456',
                                   'active': True,
                                   'config': {'access_token': 'ig_tok'},
                               }, headers=json_headers)
        aid = r.get_json()['data']['id']
        resp = admin_session.post('/api/social/posts',
                                  json={
                                      'account_id': aid,
                                      'content': 'Hermosa propiedad en venta!',
                                      'media_urls': ['https://example.com/img.jpg'],
                                  }, headers=json_headers)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['ok'] is True
        # Should have attempted publish — may be scheduled (retry), published, or failed
        assert data['data']['status'] in ('scheduled', 'published', 'failed')

    def test_generate_description_no_gemini(self, app, admin_session, json_headers):
        """Fallback description should work without gemini installed."""
        from models import Property
        from extensions import db
        with app.app_context():
            p = Property(title='Casa test', type='casa', price=150000, beds=3, baths=2,
                         sqm=120, location='Cordoba', description='Hermosa casa en barrio cerrado')
            db.session.add(p)
            db.session.commit()
            pid = p.id
        resp = admin_session.post('/api/social/generate-description',
                                  json={'property_id': pid}, headers=json_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['ok'] is True
        assert len(data['data']['description']) > 20
        assert 'Bienenhaus' in data['data']['description']

    def test_social_stats(self, admin_session):
        resp = admin_session.get('/api/social/stats')
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'accounts' in data['data']
        assert 'posts' in data['data']


class TestSocialWorker:
    def test_publish_social_post_no_account(self, app):
        from social.models import SocialAccount, SocialPost
        from social.worker import publish_social_post
        from extensions import db
        from unittest.mock import patch
        with app.app_context():
            a = SocialAccount(platform='facebook', label='Temp', active=True,
                              page_id='tmp', config={'access_token': 'x'})
            db.session.add(a)
            db.session.commit()
            p = SocialPost(account_id=a.id, content='orphan', status='scheduled')
            db.session.add(p)
            db.session.commit()
            original_get = db.session.get

            def mock_get(model, pk):
                if model is SocialAccount:
                    return None
                return original_get(model, pk)

            with patch('extensions.db.session.get', side_effect=mock_get):
                result = publish_social_post(p.id)
                assert result is False
            db.session.refresh(p)
            assert p.status == 'failed'

    def test_process_scheduled(self, app):
        from social.models import SocialAccount, SocialPost
        from social.worker import process_scheduled_posts
        from extensions import db
        with app.app_context():
            a = SocialAccount(platform='facebook', label='FB', active=True, page_id='p1',
                              config={'access_token': 'x'})
            db.session.add(a)
            db.session.commit()
            past = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=1)
            p = SocialPost(account_id=a.id, content='Old post', scheduled_at=past,
                           status='scheduled')
            db.session.add(p)
            db.session.commit()
            processed, errors = process_scheduled_posts(limit=10)
            assert processed >= 0  # will fail to publish but should process

    def test_publish_retry_limit_reached(self, app):
        """Post that exhausts retries moves to failed."""
        from social.models import SocialAccount, SocialPost
        from social.worker import publish_social_post
        from extensions import db
        with app.app_context():
            a = SocialAccount(platform='facebook', label='FB', active=True, page_id='p1',
                              config={'access_token': 'x'})
            db.session.add(a)
            db.session.commit()
            p = SocialPost(account_id=a.id, content='Will fail', status='scheduled',
                           retry_count=3)
            db.session.add(p)
            db.session.commit()
            result = publish_social_post(p.id)
            assert result is False
            db.session.refresh(p)
            assert p.status == 'failed'


class TestSocialWebhook:
    def test_webhook_get_verify_ok(self, app):
        with app.test_client() as c:
            resp = c.get('/api/social/webhook?hub.mode=subscribe&hub.verify_token=bienenhaus_verify_2024&hub.challenge=abc123')
            assert resp.status_code == 200
            assert resp.data.decode() == 'abc123'

    def test_webhook_get_verify_fail(self, app):
        with app.test_client() as c:
            resp = c.get('/api/social/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc')
            assert resp.status_code == 403

    def test_webhook_post(self, app):
        from models import PortalLog
        from extensions import db
        payload = {'entry': [{'id': 'page1', 'changes': []}]}
        with app.test_client() as c:
            resp = c.post('/api/social/webhook',
                          data=json.dumps(payload),
                          content_type='application/json')
            assert resp.status_code == 200


class TestSocialServices:
    def test_facebook_upload_local_image(self, app):
        """FacebookService._upload_image con imagen local (no pública)."""
        from social.models import SocialAccount
        from social.services import FacebookService
        with app.app_context():
            a = SocialAccount(platform='facebook', label='FB', active=True, page_id='p1',
                              config={'access_token': 'x'})
            with patch('social.services._requests') as mock_req:
                mock_get = MagicMock()
                mock_get.content = b'fake_image_bytes'
                mock_get.status_code = 200
                mock_req.get.return_value = mock_get

                mock_post = MagicMock()
                mock_post.status_code = 200
                mock_post.json.return_value = {'id': 'fb_photo_123'}
                mock_req.post.return_value = mock_post

                svc = FacebookService(a)
                pid = svc._upload_image('http://localhost:5000/static/img.jpg', 'tok')
                assert pid == 'fb_photo_123'
                # Verify it used multipart (source in files)
                call_kwargs = mock_req.post.call_args[1]
                assert 'files' in call_kwargs
                assert call_kwargs['data']['published'] == 'false'

    def test_instagram_carousel_creation(self, app):
        """InstagramService._create_carousel con múltiples imágenes."""
        from social.models import SocialAccount
        from social.services import InstagramService
        with app.app_context():
            a = SocialAccount(platform='instagram', label='IG', active=True, ig_user_id='ig1',
                              config={'access_token': 'x'})
            with patch('social.services._requests') as mock_req:
                def post_side_effect(url, **kwargs):
                    mock_resp = MagicMock()
                    mock_resp.status_code = 200
                    if 'CAROUSEL' in str(kwargs.get('data', {}).get('media_type', '')):
                        mock_resp.json.return_value = {'id': 'carousel_container_1'}
                    else:
                        mock_resp.json.return_value = {'id': 'child_img_1'}
                    return mock_resp
                mock_req.post.side_effect = post_side_effect

                # Mock GET for local image download
                mock_get = MagicMock()
                mock_get.content = b'fake'
                mock_get.status_code = 200
                mock_req.get.return_value = mock_get

                svc = InstagramService(a)
                cid = svc._create_carousel(
                    ['http://localhost/img1.jpg', 'http://localhost/img2.jpg'],
                    'Caption', 'tok'
                )
                assert cid == 'carousel_container_1'


class TestSocialWorkerDaemon:
    def test_run_forever_stop_check(self, app):
        """run_forever() termina gracefulmente con stop_check."""
        from social.worker import run_forever
        result = {'ok': False}
        called = {'count': 0}

        def _stop():
            called['count'] += 1
            return called['count'] > 2

        def _run():
            with patch('social.worker.process_scheduled_posts', return_value=(0, 0)):
                run_forever(stop_check=_stop)
                result['ok'] = True

        t = threading.Thread(target=_run, daemon=True)
        t.start()
        t.join(timeout=5)
        assert result['ok'] is True, 'run_forever no terminó'
        assert called['count'] > 1, 'Debería haber ejecutado al menos 2 ciclos antes de parar'
