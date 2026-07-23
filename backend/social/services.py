"""
social/services.py — Servicios de publicación en Facebook e Instagram Graph API
"""
import os
import json
import logging
from urllib.parse import urlparse
import requests as _requests

logger = logging.getLogger(__name__)

_FB_GRAPH_BASE = 'https://graph.facebook.com/v21.0'
_LOCAL_HOSTNAMES = frozenset({'localhost', '127.0.0.1', '0.0.0.0', 'host.docker.internal'})


def _resolve_image_url(image_url):
    if not image_url:
        return image_url
    parsed = urlparse(image_url)
    if parsed.scheme or parsed.netloc:
        return image_url
    site = os.getenv('SITE_URL', 'http://localhost:5000').rstrip('/')
    return f'{site}{image_url}'


def _is_public_url(url):
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            return False
        hostname = parsed.hostname or ''
        return hostname not in _LOCAL_HOSTNAMES
    except Exception:
        return False


def _upload_image_to_fb(api_url, image_url, token, timeout=30):
    """Sube una imagen a Facebook/IG via URL pública o multipart."""
    resolved = _resolve_image_url(image_url)
    public = _is_public_url(resolved)
    if public:
        resp = _requests.post(api_url, data={
            'url': resolved,
            'published': 'false',
            'access_token': token,
        }, timeout=timeout)
    else:
        img_resp = _requests.get(resolved, timeout=15)
        img_resp.raise_for_status()
        files = {'source': ('image.jpg', img_resp.content, 'image/jpeg')}
        resp = _requests.post(api_url, data={
            'published': 'false',
            'access_token': token,
        }, files=files, timeout=60)
    if resp.status_code != 200:
        logger.warning('Error subiendo imagen: %s %s', resp.status_code, resp.text[:200])
        return None
    return resp.json().get('id', '')


def _get_page_token(account):
    config = account.config
    user_token = config.get('access_token', '')
    if not user_token:
        raise ValueError(f'No hay access_token configurado para {account.platform}/{account.label}')

    page_id = account.page_id
    if not page_id:
        return user_token

    url = f'{_FB_GRAPH_BASE}/{page_id}'
    params = {
        'fields': 'access_token',
        'access_token': user_token,
    }
    try:
        resp = _requests.get(url, params=params, timeout=15)
        if resp.status_code != 200:
            logger.warning('Page token exchange falló, usando raw token: %s %s', resp.status_code, resp.text[:200])
            return user_token
        data = resp.json()
        return data.get('access_token', user_token)
    except Exception as e:
        logger.warning('Excepción en page token exchange: %s', e)
        return user_token


class FacebookService:
    """Publicación en Facebook Page feed con upload de imágenes."""

    def __init__(self, account):
        self.account = account
        self.page_id = account.page_id

    def publish(self, content, media_urls=None):
        page_token = _get_page_token(self.account)
        if media_urls and len(media_urls) > 0:
            return self._publish_with_media(content, media_urls, page_token)
        return self._publish_text(content, page_token)

    def _upload_image(self, image_url, token):
        pub_url = f'{_FB_GRAPH_BASE}/{self.page_id}/photos'
        return _upload_image_to_fb(pub_url, image_url, token)

    def _publish_text(self, content, token):
        url = f'{_FB_GRAPH_BASE}/{self.page_id}/feed'
        resp = _requests.post(url, data={
            'message': content,
            'access_token': token,
        }, timeout=15)
        if resp.status_code != 200:
            raise RuntimeError(f'Error publicando en FB: {resp.status_code} {resp.text[:500]}')
        return resp.json().get('id', '')

    def _publish_with_media(self, content, media_urls, token):
        """Publica múltiples imágenes como publicación (sube al CDN de FB primero)."""
        attached_ids = []
        for url in media_urls[:10]:
            pid = self._upload_image(url, token)
            if pid:
                attached_ids.append(pid)

        if not attached_ids:
            return self._publish_text(content, token)

        feed_url = f'{_FB_GRAPH_BASE}/{self.page_id}/feed'
        params = {
            'message': content,
            'access_token': token,
            'attached_media': json.dumps([{'media_fbid': pid} for pid in attached_ids]),
        }
        resp = _requests.post(feed_url, data=params, timeout=20)
        if resp.status_code != 200:
            raise RuntimeError(f'Error publicando album FB: {resp.status_code} {resp.text[:500]}')
        return resp.json().get('id', '')


class InstagramService:
    """Publicación en Instagram Business Account (imagen única + carrusel)."""

    def __init__(self, account):
        self.account = account
        self.ig_user_id = account.ig_user_id

    def publish(self, content, media_urls=None):
        token = _get_page_token(self.account)

        if not media_urls or len(media_urls) == 0:
            raise ValueError('Instagram requiere al menos una imagen')

        if len(media_urls) == 1:
            creation_id = self._create_media(media_urls[0], content, token)
        else:
            creation_id = self._create_carousel(media_urls, content, token)

        return self._publish_media(creation_id, token)

    def _post_ig_media(self, image_url, token, **extra):
        """Envía una imagen al endpoint /media de IG Business Account."""
        url = f'{_FB_GRAPH_BASE}/{self.ig_user_id}/media'
        resolved = _resolve_image_url(image_url)
        public = _is_public_url(resolved)
        if public:
            resp = _requests.post(url, data={
                'image_url': resolved,
                'access_token': token,
                **extra,
            }, timeout=30)
        else:
            img_resp = _requests.get(resolved, timeout=15)
            img_resp.raise_for_status()
            files = {'source': ('image.jpg', img_resp.content, 'image/jpeg')}
            resp = _requests.post(url, data={
                'access_token': token,
                **extra,
            }, files=files, timeout=60)
        return resp

    def _upload_image(self, image_url, token):
        """Sube imagen a IG (para carrusel). Retorna el container id."""
        resp = self._post_ig_media(image_url, token, is_carousel_item='true')
        if resp.status_code != 200:
            logger.warning('Error subiendo imagen a IG: %s %s', resp.status_code, resp.text[:200])
            return None
        return resp.json().get('id', '')

    def _create_media(self, image_url, caption, token):
        """Crea un media container para IG (imagen única)."""
        resp = self._post_ig_media(image_url, token, caption=caption[:2200])
        if resp.status_code != 200:
            raise RuntimeError(f'Error creando media IG: {resp.status_code} {resp.text[:500]}')
        return resp.json().get('id', '')

    def _create_carousel(self, image_urls, caption, token):
        """Crea un carrusel IG con hasta 10 imágenes."""
        children = []
        for url in image_urls[:10]:
            cid = self._upload_image(url, token)
            if cid:
                children.append(cid)

        if not children:
            raise ValueError('No se pudo subir ninguna imagen para el carrusel')

        url = f'{_FB_GRAPH_BASE}/{self.ig_user_id}/media'
        resp = _requests.post(url, data={
            'media_type': 'CAROUSEL',
            'children': json.dumps(children),
            'caption': caption[:2200],
            'access_token': token,
        }, timeout=30)
        if resp.status_code != 200:
            raise RuntimeError(f'Error creando carrusel IG: {resp.status_code} {resp.text[:500]}')
        return resp.json().get('id', '')

    def _publish_media(self, creation_id, token):
        """Publica un media container en IG."""
        url = f'{_FB_GRAPH_BASE}/{self.ig_user_id}/media_publish'
        resp = _requests.post(url, data={
            'creation_id': creation_id,
            'access_token': token,
        }, timeout=20)
        if resp.status_code != 200:
            raise RuntimeError(f'Error publicando IG: {resp.status_code} {resp.text[:500]}')
        return resp.json().get('id', '')
