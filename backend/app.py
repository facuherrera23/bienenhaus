"""
app.py — Aplicación principal Flask · Bienenhaus Propiedades
"""
import os
import sys
import time
import re
import logging
import click
from datetime import timedelta

sys.setrecursionlimit(3000)  # Aumentar límite de recursión para evitar RecursionError en extracción JSON
from flask import Flask, redirect, send_from_directory, session, jsonify, request, g
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv
from extensions import db, bcrypt, limiter
from flask_migrate import Migrate
from routes import properties as props_bp
from routes import agents    as agents_bp
from routes import contact   as contact_bp
from routes import uploads   as uploads_bp
from routes import rentals   as rentals_bp
from routes import auth      as auth_bp
from routes import client_errors as client_errors_bp
from csrf import csrf_protect
from auth_helper import require_role, ROLE_ADMIN, ROLE_VIEWER, ROLE_EDITOR
from cloudinary_service import init_cloudinary
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

_env = os.getenv('ENVIRONMENT', 'development')
if _env == 'production':
    import json as _json_log
    class _JsonFormatter(logging.Formatter):
        def format(self, record):
            return _json_log.dumps({
                'ts': self.formatTime(record, '%Y-%m-%dT%H:%M:%S'),
                'level': record.levelname,
                'logger': record.name,
                'msg': record.getMessage(),
                'module': record.module,
                'line': record.lineno,
            }, ensure_ascii=False)
    _handler = logging.StreamHandler()
    _handler.setFormatter(_JsonFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[_handler])
else:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s"
    )
logger = logging.getLogger(__name__)

# Cargar .env (entorno local)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Ruta absoluta al frontend — funciona en local y en Render
FRONTEND_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'frontend'
)


def _get_version():
    """Retorna short hash del commit (7 chars) para cache busting.

    Fuentes, en orden de prioridad:
      1. RENDER_GIT_COMMIT (Render inyecta el SHA completo)
      2. git rev-parse --short HEAD (local/dev)
      3. BUILD_VERSION env var
      4. mtime de este archivo (fallback absoluto)
    El resultado se cachea en una variable de módulo.
    """
    ver = getattr(_get_version, '_cached', None)
    if ver is not None:
        return ver

    candidate = os.environ.get('RENDER_GIT_COMMIT', '')
    if candidate and candidate.strip():
        ver = candidate.strip()[:7]
        _get_version._cached = ver
        return ver

    try:
        import subprocess
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            capture_output=True, text=True, timeout=3,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )
        if result.returncode == 0:
            ver = result.stdout.strip()[:7]
            _get_version._cached = ver
            return ver
    except Exception:
        pass

    candidate = os.environ.get('BUILD_VERSION', '')
    if candidate and candidate.strip():
        ver = candidate.strip()[:7]
        _get_version._cached = ver
        return ver

    try:
        ver = hex(int(os.path.getmtime(__file__)))[2:]
    except Exception:
        ver = 'dev'
    # Append build timestamp from admin bundle ensures cache-bust on every rebuild
    try:
        bundle = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            '..', 'frontend', 'js', 'admin-bundle.min.js',
        )
        ver += '-' + hex(int(os.path.getmtime(bundle)))[2:]
    except Exception:
        pass
    _get_version._cached = ver
    return ver


def _default_db_url():
    """Retorna la URL de PostgreSQL para desarrollo local.
    Sobrescribir con DATABASE_URL en .env o Render."""
    user = os.getenv('PGUSER', 'postgres')
    pw   = os.getenv('PGPASSWORD', 'postgres')
    host = os.getenv('PGHOST', 'localhost')
    port = os.getenv('PGPORT', '5432')
    name = os.getenv('PGDATABASE', 'bienenhaus')
    return f'postgresql://{user}:{pw}@{host}:{port}/{name}'


def create_app():
    app = Flask(__name__, static_folder=None)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1, x_for=1)

    # ── Configuración ─────────────────────────────────────────────────
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    if not app.config['SECRET_KEY']:
        raise RuntimeError("SECRET_KEY no configurada — definir en variables de entorno")

    _env = os.getenv('ENVIRONMENT', 'development')
    _db_url = os.getenv('DATABASE_URL')
    if not _db_url:
        if _env in ('development', 'testing'):
            _db_url = _default_db_url()
        else:
            raise RuntimeError(
                "DATABASE_URL no configurada. "
                "Definir variable de entorno DATABASE_URL para conectar a la base de datos."
            )
    if _db_url.startswith('postgres://'):
        _db_url = _db_url.replace('postgres://', 'postgresql://', 1)
    if 'sslmode' not in _db_url and 'localhost' not in _db_url and '127.0.0.1' not in _db_url:
        _db_url += '?sslmode=require' if '?' not in _db_url else '&sslmode=require'
    app.config['SQLALCHEMY_DATABASE_URI'] = _db_url

    # ── Validate required env vars in production ────────────────
    if _env == 'production':
        _required = {
            'SECRET_KEY': 'Se usa para firmar sesiones y encriptar datos sensibles',
            'DATABASE_URL': 'Conexión a la base de datos PostgreSQL',
            'ADMIN_PASSWORD': 'Contraseña del usuario admin por defecto',
        }
        for _var, _purpose in _required.items():
            if not os.getenv(_var):
                logger.warning('Variable de entorno requerida no definida: %s — %s', _var, _purpose)
        if not os.getenv('CLOUDINARY_URL'):
            logger.warning('CLOUDINARY_URL no definida — subida de imágenes no disponible')

    import urllib.parse
    _parsed = urllib.parse.urlparse(_db_url)
    _dialect = _parsed.scheme
    if 'sqlite' in _dialect:
        _db_log = f"SQLite at {_parsed.path or ':memory:'}"
    else:
        _netloc = _parsed.hostname or 'localhost'
        _db_log = f"PostgreSQL at {_netloc}"
    logger.info("Connected to %s", _db_log)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    if 'sqlite' not in _db_url:
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            'pool_size': 10,
            'max_overflow': 10,
            'pool_pre_ping': True,
            'pool_recycle': 600,
        }

    _is_deployed = os.getenv('RENDER_EXTERNAL_URL') is not None
    app.config['SQLALCHEMY_POOL_SIZE'] = app.config['SQLALCHEMY_ENGINE_OPTIONS'].get('pool_size', 5) if 'sqlite' not in _db_url else None
    app.config['SQLALCHEMY_MAX_OVERFLOW'] = app.config['SQLALCHEMY_ENGINE_OPTIONS'].get('max_overflow', 5) if 'sqlite' not in _db_url else None

    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)
    app.config['SESSION_COOKIE_SAMESITE']    = 'None' if _is_deployed else 'Lax'
    app.config['SESSION_COOKIE_HTTPONLY']    = True
    app.config['SESSION_COOKIE_SECURE']      = _is_deployed  # True solo en produccion (necesario para SameSite=None)
    app.config['MAX_CONTENT_LENGTH']         = 40 * 1024 * 1024
    app.config['INACTIVITY_TIMEOUT']         = int(os.getenv('INACTIVITY_TIMEOUT', '1800'))  # 30 min default

    app.config['RATELIMIT_ENABLED'] = os.getenv('RATELIMIT_ENABLED', 'true').lower() == 'true'
    _storage_uri = os.getenv('RATELIMIT_STORAGE_URI') or os.getenv('REDIS_URL', '')
    app.config['RATELIMIT_STORAGE_URI'] = _storage_uri or 'memory://'

    # ── Extensiones ───────────────────────────────────────────────────
    db.init_app(app)
    limiter.init_app(app)
    if app.config['RATELIMIT_ENABLED']:
        _backend = 'in-memory'
        if app.config.get('RATELIMIT_STORAGE_URI'):
            _scheme = app.config['RATELIMIT_STORAGE_URI'].split('://')[0]
            _backend = 'Redis' if _scheme.startswith('redis') else _scheme
        logger.info('Rate limiting: enabled, storage=%s', _backend)
    else:
        logger.info('Rate limiting: disabled')

    # Pool event listeners (diagnóstico)
    import logging as _diag_log
    _pool_log = _diag_log.getLogger('db.pool')
    _pool_log.setLevel(_diag_log.INFO)
    import sqlalchemy as _sa
    @_sa.event.listens_for(_sa.pool.Pool, 'connect')
    def _on_pool_connect(dbapi_con, con_record):
        _pool_log.info('POOL_CONNECT new DB connection created')
    @_sa.event.listens_for(_sa.pool.Pool, 'checkout')
    def _on_pool_checkout(dbapi_con, con_record, con_proxy):
        _pool_log.debug('POOL_CHECKOUT connection checked out from pool')
    @_sa.event.listens_for(_sa.pool.Pool, 'checkin')
    def _on_pool_checkin(dbapi_con, con_record):
        _pool_log.debug('POOL_CHECKIN connection returned to pool')
    @_sa.event.listens_for(_sa.pool.Pool, 'invalidate')
    def _on_pool_invalidate(dbapi_con, con_record, exception):
        _pool_log.warning(f'POOL_INVALIDATE connection invalidated: {exception}')

    _pool_log.info('DB pool config active: size=5 overflow=5 pre_ping=True recycle=300 sslmode=require')

    bcrypt.init_app(app)
    _migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations')
    Migrate(app, db, directory=_migrations_dir)
    _site_url = os.getenv('SITE_URL', 'https://bienenhaus.onrender.com')
    _landing_urls = [
        'https://facuherrera23.github.io',
        'https://bienenhaus.com.ar',
    ]
    CORS(app, resources={r"/api/*": {"supports_credentials": True, "origins": [
        'http://localhost:5000', 'http://127.0.0.1:5000',
        'http://localhost:5500', 'http://127.0.0.1:5500',
        _site_url,
        *_landing_urls,
    ]}})

    # ── Sentry (error tracking + performance + logs) ──────────────────
    _sentry_dsn = os.getenv('SENTRY_DSN')
    if _sentry_dsn:
        _env = os.getenv('ENVIRONMENT', 'development')
        sentry_sdk.init(
            dsn=_sentry_dsn,
            integrations=[
                FlaskIntegration(),
                SqlalchemyIntegration(),
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.ERROR,
                ),
            ],
            environment=_env,
            release=os.getenv('RELEASE_VERSION'),
            traces_sample_rate=0.5 if _env == 'production' else 0.1,
            profiles_sample_rate=0.5 if _env == 'production' else 0,
            send_default_pii=False,
            max_request_body_size='always',
            attach_stacktrace=True,
        )

    # ── CSP ─────────────────────────────────────────────────────────
    @app.after_request
    def add_security_headers(resp):
        _site = os.getenv('SITE_URL', 'https://bienenhaus.onrender.com')
        resp.headers['X-Frame-Options']        = 'DENY'
        resp.headers['X-Content-Type-Options']  = 'nosniff'
        resp.headers['X-XSS-Protection']        = '0'
        resp.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        resp.headers['Referrer-Policy']          = 'strict-origin-when-cross-origin'
        resp.headers['Permissions-Policy']       = 'camera=(), microphone=(), geolocation=(self)'
        deployed = os.getenv('RENDER_EXTERNAL_URL', '')
        connect_src_parts = [
            "'self'",
            "http://localhost:5000", "http://127.0.0.1:5000",
            "http://localhost:5500", "http://127.0.0.1:5500",
            _site,
            "https://*.onrender.com",
            "https://facuherrera23.github.io",
            "https://bienenhaus.com.ar",
            "https://dolarapi.com",
            "https://nominatim.openstreetmap.org",
            "https://fonts.googleapis.com", "https://fonts.gstatic.com",
            "https://api.mercadolibre.com", "https://auth.mercadolibre.com.ar",
            "https://www.google-analytics.com", "https://analytics.google.com",
            "https://www.googletagmanager.com",
            "https://res.cloudinary.com", "https://picsum.photos",
            "https://unpkg.com",
            "https://cdnjs.cloudflare.com",
        ]
        if deployed:
            connect_src_parts.append(deployed)
        connect_src = ' '.join(connect_src_parts)
        resp.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://www.googletagmanager.com https://unpkg.com https://cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; "
            "img-src 'self' data: blob: https:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "frame-src https://www.google.com https://maps.google.com; "
            f"connect-src {connect_src}; "
            "form-action 'self'; "
            "upgrade-insecure-requests; "
            "block-all-mixed-content"
        )
        return resp

    # ── Gzip compression (solo text-based > 500 bytes) ─────────────
    import io as _io, gzip as _gzip
    _GZIP_TYPES = frozenset(['text/', 'application/json', 'application/javascript',
                             'application/xml', 'image/svg+xml'])
    _STATIC_RE = re.compile(r'^/(css|js|images|fonts|uploads)/')

    @app.after_request
    def _clean_static_headers(resp):
        """Quita headers que bloquean el caching en Cloudflare para assets."""
        if resp.status_code >= 400:
            return resp
        path = request.path
        if _STATIC_RE.match(path) or path in ('/manifest.json', '/favicon.ico', '/robots.txt'):
            resp.headers.pop('Set-Cookie', None)
            resp.headers.pop('access-control-allow-credentials', None)
            vary = resp.headers.get('Vary', '')
            if vary:
                parts = [v.strip() for v in vary.split(',') if v.strip().lower() not in ('origin', 'cookie')]
                if parts:
                    resp.headers['Vary'] = ', '.join(parts)
                else:
                    resp.headers.pop('Vary', None)
        return resp

    @app.after_request
    def _compress_response(resp):
        if resp.status_code < 200 or resp.status_code >= 300:
            return resp
        if resp.direct_passthrough:
            return resp
        if len(resp.data) < 500:
            return resp
        ct = resp.content_type or ''
        if not any(ct.startswith(t) for t in _GZIP_TYPES):
            return resp
        encodings = request.accept_encodings
        if not encodings or 'gzip' not in encodings:
            return resp
        buf = _io.BytesIO()
        with _gzip.GzipFile(fileobj=buf, mode='wb', compresslevel=6) as f:
            f.write(resp.data)
        resp.data = buf.getvalue()
        resp.headers['Content-Encoding'] = 'gzip'
        resp.headers['Content-Length'] = len(resp.data)
        resp.headers['Vary'] = 'Accept-Encoding'
        return resp

    # ── CSP nonce por request ────────────────────────────────────────
    @app.before_request
    def set_csp_nonce():
        import secrets as _secrets
        g.csp_nonce = _secrets.token_urlsafe(16)

    # ── HTTPS redirect (producción) + inactividad ────────────────────
    @app.before_request
    def redirect_to_https():
        if _is_deployed and not request.is_secure:
            url = request.url.replace('http://', 'https://', 1)
            return redirect(url, 301)

    @app.before_request
    def check_inactivity():
        if not session.get('admin'):
            return
        if request.path.startswith('/api/'):
            now = time.time()
            last = session.get('last_activity')
            if last and (now - last) > app.config['INACTIVITY_TIMEOUT']:
                session.clear()
                return jsonify({'ok': False, 'error': 'Sesión expirada por inactividad. Iniciá sesión de nuevo.'}), 401
            session['last_activity'] = now
        else:
            if not session.get('last_activity'):
                session['last_activity'] = time.time()
                return
            now = time.time()
            last = session['last_activity']
            if last and (now - last) > app.config['INACTIVITY_TIMEOUT']:
                session.clear()
                return redirect('/admin/login')
            session['last_activity'] = now

    # ── Blueprints ────────────────────────────────────────────────────
    app.register_blueprint(props_bp.bp)
    app.register_blueprint(agents_bp.bp)
    app.register_blueprint(contact_bp.bp)
    app.register_blueprint(auth_bp.bp)
    app.register_blueprint(uploads_bp.bp)
    app.register_blueprint(rentals_bp.bp)
    import routes.users as users_bp
    app.register_blueprint(users_bp.bp)
    import routes.portals as portals_bp
    app.register_blueprint(portals_bp.bp)
    import routes.push as push_bp
    app.register_blueprint(push_bp.bp)
    import routes.map as map_bp
    app.register_blueprint(map_bp.bp)
    import routes.appraisals as appraisals_bp
    app.register_blueprint(appraisals_bp.bp)
    import routes.stats as stats_bp
    app.register_blueprint(stats_bp.bp)
    import routes.settings as settings_bp
    app.register_blueprint(settings_bp.bp)
    import routes.backup as backup_bp
    app.register_blueprint(backup_bp.bp)
    import routes.views as views_bp
    app.register_blueprint(views_bp.bp)
    import routes.empresa as empresa_bp
    app.register_blueprint(empresa_bp.bp)
    import routes.tasacion as tasacion_bp
    app.register_blueprint(tasacion_bp.bp)
    import routes.tasaciones as tasaciones_bp
    app.register_blueprint(tasaciones_bp.bp)
    import routes.social as social_bp
    app.register_blueprint(social_bp.bp)
    import routes.marketing as marketing_bp
    app.register_blueprint(marketing_bp.bp)
    import routes.crm as crm_bp
    app.register_blueprint(crm_bp.bp)
    import routes.messages as messages_bp
    app.register_blueprint(messages_bp.bp)
    import routes.requests as requests_bp
    app.register_blueprint(requests_bp.bp)
    import routes.calendar as calendar_bp
    app.register_blueprint(calendar_bp.bp)
    import routes.settings_center as settings_center_bp
    app.register_blueprint(settings_center_bp.bp)
    import routes.users_rbac as users_rbac_bp
    app.register_blueprint(users_rbac_bp.bp)
    import routes.security as security_bp
    app.register_blueprint(security_bp.bp)
    import routes.baja as baja_bp
    app.register_blueprint(baja_bp.bp)
    app.register_blueprint(client_errors_bp.bp)

     # ── Proxy de imágenes (CORS) ──────────────────────────────────────
    @app.route('/api/proxy-image')
    @require_role(ROLE_EDITOR)
    def proxy_image():
        url = request.args.get('url', '')
        if not url:
            return jsonify({'ok': False, 'error': 'URL requerida'}), 400
        if url.startswith('/'):
            url = request.host_url.rstrip('/') + url
        import requests as _req
        try:
            resp = _req.get(url, stream=True, timeout=10)
            resp.raise_for_status()
            ct = resp.headers.get('content-type', '')
            if not ct.startswith('image/'):
                return jsonify({'ok': False, 'error': 'No es una imagen'}), 400
            from flask import Response as _Resp
            return _Resp(resp.iter_content(chunk_size=16384),
                         content_type=ct,
                         headers={'Cache-Control': 'public, max-age=86400'})
        except Exception:
            return jsonify({'ok': False, 'error': 'Error al obtener la imagen'}), 502

    # Cache-Control para assets estáticos
    # Solo actúa como fallback para assets que NO pasan por las rutas
    # explícitas (ej: /uploads/). Las rutas explícitas ya asignan directo.
    STATIC_PREFIXES = ('/css/', '/js/', '/images/', '/fonts/', '/uploads/')
    @app.after_request
    def _add_cache_headers(resp):
        if resp.status_code >= 400:
            return resp
        path = request.path
        if resp.headers.get('Cache-Control') is None:
            if any(path.startswith(p) for p in STATIC_PREFIXES):
                resp.headers['Cache-Control'] = 'public, max-age=86400'
        return resp

    # ── Health check ──────────────────────────────────────────────────
    @app.route('/api/health')
    def health_check():
        from sqlalchemy import text
        try:
            db.session.execute(text('SELECT 1'))
            db_status = 'healthy'
        except Exception as _db_err:
            db_status = f'unhealthy: {_db_err}'
        pool_info = {}
        try:
            engine = db.engine
            pool = engine.pool
            checkedin = pool.checkedin()
            checkedout = pool.checkedout()
            overflow = pool.overflow()
            size = pool.size()
            pool_info = {
                'size': size,
                'checkedin': checkedin,
                'checkedout': checkedout,
                'overflow': overflow,
                'total': size + overflow,
            }
        except Exception as _pe:
            pool_info = {'error': str(_pe)}
        from portals.queue import QueueService
        queue_metrics = {
            'pending': QueueService.pending_count(),
            'processing': QueueService.processing_count(),
            'failed': QueueService.failed_count(),
        }
        from social.models import SocialPost
        social_stats = {
            'pending': SocialPost.query.filter(SocialPost.status.in_(['draft', 'scheduled'])).count(),
            'published': SocialPost.query.filter_by(status='published').count(),
            'failed': SocialPost.query.filter_by(status='failed').count(),
        }
        redis_status = 'not_configured'
        _redis_url = os.getenv('REDIS_URL', '')
        if _redis_url:
            try:
                import redis as _redis
                _r = _redis.from_url(_redis_url, socket_connect_timeout=2, socket_timeout=2)
                _r.ping()
                redis_status = 'healthy'
            except Exception as _re:
                redis_status = f'unhealthy: {_re}'
        return jsonify({
            'ok': True,
            'status': 'healthy',
            'database': db_status,
            'pool': pool_info,
            'redis': redis_status,
            'queue': queue_metrics,
            'social': social_stats,
            'timestamp': time.time(),
        })

    @app.route('/health')
    def health_simple():
        return jsonify({'ok': True, 'status': 'healthy'})

    @app.route('/api/_debug/db-info')
    @require_role(ROLE_ADMIN)
    def db_info():
        from urllib.parse import urlparse
        url = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        parsed = urlparse(url)
        dialect = parsed.scheme
        if 'sqlite' in dialect:
            return jsonify({'ok': True, 'dialect': 'sqlite', 'database': parsed.path or ':memory:'})
        host = parsed.hostname or 'unknown'
        port = parsed.port or 5432
        dbname = (parsed.path or '').lstrip('/') or 'unknown'
        return jsonify({
            'ok': True,
            'dialect': 'postgresql',
            'host': host,
            'port': port,
            'database': dbname,
            'url_safe': f'postgresql://{parsed.username or "?"}:***@{host}:{port}/{dbname}',
        })

    # ── Rutas explícitas para archivos estáticos ───────────────────────
    # Lee el archivo en memoria en vez de send_from_directory para evitar
    # Transfer-Encoding: chunked (sin Content-Length) que bloquea el
    # caching de Cloudflare (cf-cache-status: DYNAMIC).
    # Cache: 1 año, público, SIN immutable (no hay content-hash).
    _MIME_MAP = {
        '.css': 'text/css', '.js': 'application/javascript',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
        '.webp': 'image/webp', '.woff2': 'font/woff2',
        '.json': 'application/json', '.txt': 'text/plain',
    }

    def _static_file(filepath, content_type, cache_seconds=31536000):
        """Sirve un archivo estático con Content-Length explícito."""
        full = os.path.join(FRONTEND_DIR, filepath)
        if not os.path.isfile(full):
            return ('', 404)
        with open(full, 'rb') as f:
            data = f.read()
        resp = app.make_response(data)
        resp.headers['Content-Type'] = content_type
        resp.headers['Content-Length'] = len(data)
        resp.headers['Cache-Control'] = f'public, max-age={cache_seconds}'
        return resp

    @app.route('/css/<path:filename>')
    @limiter.exempt
    def serve_css(filename):
        ext = os.path.splitext(filename)[1].lower()
        ct = _MIME_MAP.get(ext, 'text/css')
        return _static_file(os.path.join('css', filename), ct, 31536000)

    @app.route('/js/<path:filename>')
    @limiter.exempt
    def serve_js(filename):
        ext = os.path.splitext(filename)[1].lower()
        ct = _MIME_MAP.get(ext, 'application/javascript')
        return _static_file(os.path.join('js', filename), ct, 31536000)

    @app.route('/images/<path:filename>')
    @limiter.exempt
    def serve_images(filename):
        ext = os.path.splitext(filename)[1].lower()
        ct = _MIME_MAP.get(ext, 'image/png')
        return _static_file(os.path.join('images', filename), ct, 31536000)

    @app.route('/fonts/<path:filename>')
    @limiter.exempt
    def serve_fonts(filename):
        ext = os.path.splitext(filename)[1].lower()
        ct = _MIME_MAP.get(ext, 'font/woff2')
        return _static_file(os.path.join('fonts', filename), ct, 31536000)

    @app.route('/manifest.json')
    @limiter.exempt
    def serve_manifest():
        return _static_file('manifest.json', 'application/json', 3600)

    @app.route('/service-worker.js')
    @limiter.exempt
    def serve_sw():
        sw_path = os.path.join(FRONTEND_DIR, 'service-worker.js')
        with open(sw_path, 'r', encoding='utf-8') as f:
            sw = f.read()
        sw = sw.replace('__VERSION__', _get_version())
        data = sw.encode('utf-8')
        resp = app.make_response(data)
        resp.headers['Content-Type'] = 'application/javascript'
        resp.headers['Content-Length'] = len(data)
        resp.headers['Cache-Control'] = 'no-cache'
        return resp

    @app.route('/favicon.ico')
    @limiter.exempt
    def serve_favicon():
        for p in ('favicon.ico', 'images/favicon.ico'):
            full = os.path.join(FRONTEND_DIR, p)
            if os.path.exists(full):
                return _static_file(p, 'image/x-icon', 31536000)
        return ('', 204)

    @app.route('/robots.txt')
    @limiter.exempt
    def serve_robots():
        return _static_file('robots.txt', 'text/plain', 86400)


    from defaults import SETTINGS_DEFAULTS

    # ── USD/ARS exchange rate (cached) ──────────────────────────────
    _dolar_cache = {'rate': None, 'updated': 0}

    @app.route('/api/dolar', methods=['GET'])
    @limiter.limit("10 per minute")
    def get_dolar():
        import time as _time
        now = _time.time()
        if _dolar_cache['rate'] is not None and (now - _dolar_cache['updated']) < 300:
            return jsonify({'ok': True, 'data': {
                'venta': _dolar_cache['rate'], 'compra': _dolar_cache.get('compra'),
                'source': 'cache'
            }})
        try:
            import urllib.request as _ur
            import json as _json
            req = _ur.Request('https://dolarapi.com/v1/dolares/blue',
                              headers={'User-Agent': 'Bienenhaus/1.0'})
            with _ur.urlopen(req, timeout=5) as r:
                d = _json.loads(r.read().decode())
            _dolar_cache['rate'] = d['venta']
            _dolar_cache['compra'] = d.get('compra')
            _dolar_cache['updated'] = _time.time()
            return jsonify({'ok': True, 'data': {
                'venta': d['venta'], 'compra': d.get('compra'),
                'source': 'api'
            }})
        except Exception as e:
            if _dolar_cache['rate'] is not None:
                return jsonify({'ok': True, 'data': {
                    'venta': _dolar_cache['rate'], 'compra': _dolar_cache.get('compra'),
                    'source': 'stale'
                }})
            return jsonify({'ok': False, 'error': f'No se pudo obtener el tipo de cambio: {e}'}), 502

    # ── Log de actividad admin ────────────────────────────────────────
    @app.route('/api/activity', methods=['GET'])
    @require_role(ROLE_VIEWER)
    def get_activity():
        from models import ActivityLog
        page = request.args.get('page', 1, type=int)
        per  = request.args.get('per_page', 50, type=int)
        q    = ActivityLog.query.order_by(ActivityLog.id.desc())
        total = q.count()
        items = q.offset((page - 1) * per).limit(per).all()
        return jsonify({'ok': True, 'data': {
            'items': [a.to_dict() for a in items],
            'total': total,
            'page': page,
            'per_page': per,
        }})

    # ── Tracking de visitas (extraído a routes/views.py) ─────────────

    # ── Helper para servir HTML con variables dinámicas ────────────────
    def _serve_html(filename, cache_max_age=600, no_cache=False):
        """Lee un HTML, reemplaza variables y lo sirve."""
        html_path = os.path.join(FRONTEND_DIR, filename)
        with open(html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        site_url = os.getenv('SITE_URL', 'https://bienenhaus.onrender.com')
        html = html.replace('__SITE_URL__', site_url)
        html = html.replace('__SITE_NAME__', os.getenv('SITE_NAME', 'Bienenhaus'))
        html = html.replace('__VERSION__', _get_version())
        if no_cache:
            html = html.replace('<script>', f'<script nonce="{getattr(g, "csp_nonce", "")}">')
            html = html.replace('__VAPID_PUBLIC_KEY__', os.getenv('VAPID_PUBLIC_KEY', ''))
        resp = app.make_response(html)
        if no_cache:
            resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            resp.headers['Pragma'] = 'no-cache'
            resp.headers['Expires'] = '0'
        else:
            resp.headers['Cache-Control'] = f'max-age={cache_max_age}, public'
        return resp

    # ── Páginas HTML ───────────────────────────────────────────────────
    @app.route('/')
    def index():
        return _serve_html('index.html')

    @app.route('/admin')
    def admin_panel():
        return _serve_html('admin.html', no_cache=True)

    @app.route('/tasacion')
    def tasacion_page():
        return redirect('/#tasacion', 301)

    @app.route('/tasacion2')
    def tasacion2_page():
        return _serve_html('tasacion2.html')

    @app.route('/venta')
    def venta_page():
        return _serve_html('venta.html')

    @app.route('/alquiler')
    def alquiler_page():
        return _serve_html('alquiler.html')

    # Redirect viejas rutas /propiedad/ → /venta/ y /propiedad/alquiler/ → /alquiler/
    @app.route('/propiedad/<int:pid>')
    def old_property_redirect(pid):
        return redirect(f'/venta/{pid}', 301)

    @app.route('/propiedad/alquiler/<int:rid>')
    def old_rental_redirect(rid):
        return redirect(f'/alquiler/{rid}', 301)

    def _detail_response(item, pid, base_url, s, currency, url_prefix):
        """Genera HTML con OG tags para propiedad o alquiler."""
        import html as _html
        nonce = g.get('csp_nonce', '')
        def esc(val): return _html.escape(str(val or ''), quote=True)

        if item:
            tipo = 'Casa' if item.type == 'casa' else 'Departamento' if item.type == 'departamento' else 'Propiedad'
            seccion = 'Venta' if url_prefix == 'venta' else 'Alquiler'
            loc_str = f'en {item.location}' if item.location else ''
            title = f"{tipo} en {seccion} {loc_str} · {s.get('seo_site_name','Bienenhaus')}"
            parts = [tipo, seccion]
            if item.location: parts.append(item.location)
            if item.beds: parts.append(f'{item.beds} dorm.')
            if item.baths: parts.append(f'{item.baths} baños')
            if item.sqm: parts.append(f'{item.sqm} m²')
            desc  = ' — '.join(parts) + '. ' + (item.description[:150] if item.description else '')
            img   = (item.images[0] if item.images else None) or s.get('seo_image','')
            url   = f"{base_url}/{url_prefix}/{pid}"
        else:
            title = s.get('seo_site_name','Bienenhaus Propiedades')
            desc  = s.get('seo_description','')
            img   = s.get('seo_image','')
            url   = f"{base_url}/{url_prefix}/{pid}"

        price_str = f"{currency} {int(item.price_ars if hasattr(item, 'price_ars') else item.price or 0):,}".replace(',','.') if item else ''
        etitle = esc(title); edesc = esc(desc); eimg = esc(img)
        eurl   = esc(url);   esite = esc(s.get('seo_site_name','Bienenhaus'))
        ename  = esc(item.title if item else title)
        eprice = esc(price_str)

        if item:
            ebeds = item.beds or 0
            ebaths = item.baths or 0
            esqm_val = item.sqm or 0
            elat = item.latitude if item.latitude else 'null'
            elng = item.longitude if item.longitude else 'null'
            eloc = esc(item.location)
        else:
            ebeds = ebaths = 0
            esqm_val = 0
            elat = elng = 'null'
            eloc = ''

        section_name = 'Venta' if url_prefix == 'venta' else 'Alquiler'

        og_tags = f"""
  <!-- SEO + Open Graph -->
  <link rel="canonical" href="{eurl}"/>
  <meta name="description" content="{edesc}"/>
  <meta name="keywords" content="{esc('propiedades, ' + (item.type or '') + ', ' + (item.location or '') + ', ' + s.get('seo_site_name','Bienenhaus'))}"/>
  <meta name="robots" content="index, follow"/>
  <meta property="og:type"        content="website"/>
  <meta property="og:url"         content="{eurl}"/>
  <meta property="og:title"       content="{etitle}"/>
  <meta property="og:description" content="{edesc}"/>
  <meta property="og:image"       content="{eimg}"/>
  <meta property="og:locale"      content="es_AR"/>
  <meta property="og:site_name"   content="{esite}"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="{etitle}"/>
  <meta name="twitter:description" content="{edesc}"/>
  <meta name="twitter:image"       content="{eimg}"/>
  <script type="application/ld+json" nonce="{nonce}">
  {{
    "@context":"https://schema.org",
    "@type":"RealEstateListing",
    "name":"{ename}",
    "description":"{edesc}",
    "url":"{eurl}",
    "image":"{eimg}",
    "offers":{{"@type":"Offer","price":"{eprice}","priceCurrency":"{currency}"}},
    "bedrooms":{ebeds},
    "bathrooms":{ebaths},
    "floorSize":{{"@type":"QuantitativeValue","value":{esqm_val},"unitCode":"MTK"}},
    "address":{{"@type":"PostalAddress","addressLocality":"{eloc}","addressCountry":"AR"}},
    "geo":{{"@type":"GeoCoordinates","latitude":{elat},"longitude":{elng}}}
  }}
  </script>
  <script type="application/ld+json" nonce="{nonce}">
  {{
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {{"@type":"ListItem","position":1,"name":"Inicio","item":"{base_url}/"}},
      {{"@type":"ListItem","position":2,"name":"{section_name}","item":"{base_url}/{url_prefix}"}},
      {{"@type":"ListItem","position":3,"name":"{ename}"}}
    ]
  }}
  </script>"""

        html_path = os.path.join(FRONTEND_DIR, 'propiedad.html')
        with open(html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        html = html.replace('__VERSION__', _get_version())
        html = html.replace('<title id="pageTitle">Propiedad · Bienenhaus</title>', f'<title>{title}</title>')
        html = html.replace('</head>', og_tags + '\n</head>')
        return html

    @app.route('/venta/<int:pid>')
    def property_detail(pid):
        from models import Property, Settings as SettingsModel
        from defaults import SETTINGS_DEFAULTS
        prop = db.session.get(Property, pid)
        s    = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
        base_url = os.getenv('SITE_URL', 'https://bienenhaus.onrender.com')
        return _detail_response(prop, pid, base_url, s, 'USD', 'venta')

    @app.route('/alquiler/<int:rid>')
    def rental_detail(rid):
        from models import Rental, Settings as SettingsModel
        from defaults import SETTINGS_DEFAULTS
        rental = db.session.get(Rental, rid)
        s      = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
        base_url = os.getenv('SITE_URL', 'https://bienenhaus.onrender.com')
        return _detail_response(rental, rid, base_url, s, 'ARS', 'alquiler')

    @app.route('/sitemap.xml')
    @limiter.limit("12 per minute")
    def sitemap():
        from models import Property, Rental
        import xml.etree.ElementTree as ET
        from datetime import datetime, timezone

        base = os.getenv('SITE_URL', 'https://bienenhaus.onrender.com')
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')

        urls = [
            ('/', today, 'daily', '1.0'),
            ('/venta', today, 'weekly', '0.8'),
            ('/alquiler', today, 'weekly', '0.8'),
        ]

        props = Property.query.filter(~Property.status.in_(('oculta', 'listo_para_publicar'))).order_by(Property.created_at.desc()).all()
        for p in props:
            lastmod = p.created_at.strftime('%Y-%m-%d') if p.created_at else today
            urls.append((f'/venta/{p.id}', lastmod, 'weekly', '0.8'))

        rentals = Rental.query.filter(~Rental.status.in_(('oculta', 'listo_para_publicar'))).order_by(Rental.created_at.desc()).all()
        for r in rentals:
            lastmod = r.created_at.strftime('%Y-%m-%d') if r.created_at else today
            urls.append((f'/alquiler/{r.id}', lastmod, 'weekly', '0.7'))

        root = ET.Element('urlset', xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
        for loc, lastmod, changefreq, priority in urls:
            u = ET.SubElement(root, 'url')
            ET.SubElement(u, 'loc').text = base + loc
            ET.SubElement(u, 'lastmod').text = lastmod
            ET.SubElement(u, 'changefreq').text = changefreq
            ET.SubElement(u, 'priority').text = priority

        xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding='unicode')
        return xml, 200, {'Content-Type': 'application/xml'}

    @app.route('/offline.html')
    def offline_page():
        return _serve_html('offline.html')

    @app.route('/baja')
    def baja_page():
        return _serve_html('boton-baja.html')

    @app.route('/robots.txt')
    def robots_txt():
        base = os.getenv('SITE_URL', 'https://bienenhaus.onrender.com')
        return f"""User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: {base}/sitemap.xml
""", 200, {'Content-Type': 'text/plain'}

    # ── DB Clean (1 llamado POST, solo admin) ─────────────────────────
    @app.route('/api/db-clean', methods=['POST'])
    @require_role(ROLE_ADMIN)
    def api_db_clean():
        """Elimina todas las tablas y las recrea con admin por defecto."""
        from auth_helper import seed_admin_user
        from sqlalchemy import text as _text
        _is_pg = 'postgresql' in str(db.engine.url)
        try:
            if _is_pg:
                db.session.execute(_text('DROP SCHEMA public CASCADE'))
                db.session.execute(_text('CREATE SCHEMA public'))
                db.session.execute(_text('GRANT ALL ON SCHEMA public TO public'))
                db.session.commit()
            else:
                db.drop_all()
            db.create_all()
            _seed()
            os.environ.setdefault('ADMIN_PASSWORD', 'Admin123!')
            seed_admin_user()
            return jsonify({'ok': True, 'message': 'DB limpiada. Admin recreado con la contraseña configurada en ADMIN_PASSWORD.'}), 200
        except Exception as _e:
            db.session.rollback()
            logger.exception('db-clean failed')
            return jsonify({'ok': False, 'error': str(_e)}), 500

    # ── Liberar sesión DB al finalizar request ──────────────────────
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        if exception:
            db.session.rollback()
        db.session.remove()

    # ── Error handlers ──────────────────────────────────────────────
    def _accepts_html():
        accept = request.headers.get('Accept', '')
        return 'text/html' in accept and 'application/json' not in accept

    def _error_page(status_code, title, message, template=None):
        """Sirve HTML dedicado para browsers, JSON para APIs."""
        if _accepts_html() and template:
            try:
                return _serve_html(template), status_code
            except Exception:
                pass
        return jsonify({'ok': False, 'error': message}), status_code

    @app.errorhandler(400)
    def bad_request(e):
        return _error_page(400, 'Solicitud inválida', 'La solicitud no pudo ser procesada.', '400.html')

    @app.errorhandler(403)
    def forbidden(e):
        return _error_page(403, 'Acceso denegado', 'No tenés permiso para acceder a esta página.', '403.html')

    @app.errorhandler(404)
    def not_found(e):
        req_path = getattr(e, 'description', '') or ''
        real_files = ['.css','.js','.png','.jpg','.ico','.svg','.webp','.json']
        if any(ext in str(req_path) for ext in real_files):
            return jsonify({'error': 'Not found'}), 404
        if _accepts_html():
            return send_from_directory(FRONTEND_DIR, '404.html'), 404
        return jsonify({'ok': False, 'error': 'Página no encontrada.'}), 404

    @app.errorhandler(429)
    def ratelimit_error(e):
        if _accepts_html():
            return _error_page(429, 'Demasiadas solicitudes', 'Demasiadas solicitudes. Intentá de nuevo en unos segundos.', '429.html')
        resp = jsonify({'ok': False, 'error': 'Demasiadas solicitudes. Intentá de nuevo en unos segundos.'})
        resp.status_code = 429
        resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        resp.headers['Pragma'] = 'no-cache'
        resp.headers['Expires'] = '0'
        return resp

    @app.errorhandler(500)
    def internal_error(e):
        return _error_page(500, 'Error del servidor', 'Error interno del servidor.', '500.html')

    @app.errorhandler(502)
    def bad_gateway(e):
        return _error_page(502, 'Error de conexión', 'Error de gateway externo.', '502.html')

    # ── Cloudinary ───────────────────────────────────────────────────
    init_cloudinary()

    # ── CLI: flask db commands ────────────────────────────────────────
    @app.cli.command('db-init')
    def db_init():
        """Inicializa Alembic (primera vez)."""
        from flask_migrate import init
        init()

    @app.cli.command('db-migrate')
    def db_migrate():
        """Crea una nueva migración."""
        from flask_migrate import migrate
        migrate()

    @app.cli.command('db-check')
    def db_check():
        """Verifica que haya un solo head de migración."""
        from alembic.config import Config as _AConfig
        from alembic.script import ScriptDirectory
        _cfg = _AConfig()
        _cfg.set_main_option('script_location', _migrations_dir)
        _script = ScriptDirectory.from_config(_cfg)
        _heads = _script.get_heads()
        if len(_heads) == 0:
            click.echo('OK — 0 heads (tree vacío).')
        elif len(_heads) == 1:
            click.echo(f'OK — 1 head: {_heads[0]}')
        else:
            click.echo(f'ERROR — {len(_heads)} heads encontrados: {", ".join(_heads)}')
            raise click.ClickException(
                f'Se encontraron {len(_heads)} heads. '
                'Ejecutá "flask db merge" para unificarlos.'
            )

    @app.cli.command('db-upgrade')
    def db_upgrade():
        """Aplica migraciones pendientes."""
        from flask_migrate import upgrade
        upgrade(revision='heads')

    @app.cli.command('portal-worker')
    @click.option('--watch', is_flag=True, help='Loop continuo')
    @click.option('--interval', default=30, help='Intervalo en segundos')
    def portal_worker_cmd(watch, interval):
        """Procesa la cola de portales (publish/update/unpublish)."""
        from portal_worker import process_batch
        if watch:
            import time
            while True:
                processed, errors = process_batch(app)
                ts = time.strftime('%Y-%m-%d %H:%M:%S')
                click.echo(f'[{ts}] Procesados: {processed}, Errores: {len(errors)}')
                for e in errors:
                    click.echo(f'  ERROR: {e}')
                time.sleep(interval)
        else:
            processed, errors = process_batch(app)
            click.echo(f'Procesados: {processed}, Errores: {len(errors)}')
            for e in errors:
                click.echo(f'  ERROR: {e}')

    @app.cli.command('db-backup')
    @click.option('--no-upload', is_flag=True, help='Solo guardar localmente')
    @click.option('--local-dir', default=None, help='Directorio para guardar local')
    def db_backup_cmd(no_upload, local_dir):
        """
        Backup de todas las tablas a Cloudinary.

        Descubre automaticamente los 54 modelos y serializa todas las filas
        como JSON comprimido. Sube a Cloudinary (raw) con retencion de 30 dias.

        Ejemplos:
          flask db-backup                    # backup + subida a Cloudinary
          flask db-backup --no-upload        # solo archivo local
          flask db-backup --local-dir ./mis-backups
        """
        from scripts.db_backup import run_backup
        run_backup(app, upload=not no_upload, local_dir=local_dir or os.getcwd())

    @app.cli.command('db-restore')
    @click.argument('source')
    @click.option('--dry-run', is_flag=True, help='Solo muestra lo que se restauraria')
    def db_restore_cmd(source, dry_run):
        """
        Restaura la DB desde un backup.

        1. Descarga o lee el archivo .json.gz
        2. Resuelve orden de tablas por dependencias FK (topological sort)
        3. Limpia cada tabla y re-inserta filas

        Compatible con backups v1.0 (legacy) y v2.0.

        Antes de restaurar, revisa:
          - Source puede ser URL de Cloudinary o ruta local
          - Usa --dry-run para previsualizar sin modificar
          - La DB debe estar vacia o los datos se reemplazan

        Ejemplos:
          flask db-restore --dry-run backup-20260704.json.gz
          flask db-restore https://res.cloudinary.com/.../backup-20260704.json.gz
        """
        from scripts.db_restore import run_restore
        run_restore(app, source, dry_run)

    @app.cli.command('db-backup-verify')
    @click.argument('source')
    def db_backup_verify_cmd(source):
        """
        Verifica integridad de un backup.

        Comprueba que el archivo se descomprime correctamente, que el JSON
        es valido, y que todas las tablas tienen un modelo en el codigo actual.

        Ejemplos:
          flask db-backup-verify backup-20260704.json.gz
          flask db-backup-verify https://res.cloudinary.com/.../backup.json.gz
        """
        from scripts.db_restore import load_backup, get_all_models
        try:
            data = load_backup(source)
        except Exception as e:
            click.echo(f'[verify] ERROR: No se pudo cargar el backup: {e}')
            return

        version = data.get('version', '?')
        created = data.get('created_at', '?')
        tables = data.get('tables', {})
        total_rows = sum(len(v) for v in tables.values())
        total_tables = len(tables)

        click.echo(f'[verify] Backup v{version} del {created}')
        click.echo(f'[verify] {total_tables} tablas, {total_rows} filas totales')

        models = get_all_models()
        missing = 0
        for table_name in tables:
            actual = {'messages': 'contact_messages', 'publications': 'portal_publications',
                       'logs': 'portal_logs', 'queue': 'portal_queue'}.get(table_name, table_name)
            if actual not in models:
                click.echo(f'[verify]  ⚠ Tabla "{table_name}" no tiene modelo en código actual')
                missing += 1

        if missing:
            click.echo(f'[verify] ADVERTENCIA: {missing} tabla(s) sin modelo asociado')
        else:
            click.echo(f'[verify] OK — todas las tablas tienen modelo')

    @app.cli.command('seed-demo-acm')
    def seed_demo_acm():
        """Carga una tasación demo para presentación."""
        from scripts.seed_demo_acm import run
        run(app)

    @app.cli.command('seed-demo-requests')
    def seed_demo_requests():
        """Carga solicitudes demo para presentación."""
        from scripts.seed_demo_requests import run
        run(app)

    @app.cli.command('seed-demo-appraisals-v2')
    def seed_demo_appraisals_v2():
        """Carga comentarios y timeline demo para tasaciones."""
        from scripts.seed_demo_appraisals_v2 import run
        run(app)

    @app.cli.command('seed-demo-marketing')
    def seed_demo_marketing():
        """Carga campañas demo y métricas de marketing."""
        from scripts.seed_demo_marketing import run
        run(app)

    @app.cli.command('seed-demo-publications')
    def seed_demo_publications():
        """Carga publicaciones demo en portales."""
        from scripts.seed_demo_publications import run
        run(app)

    @app.cli.command('seed-demo-calendar')
    def seed_demo_calendar():
        """Carga eventos demo en la agenda."""
        from scripts.seed_demo_calendar import run
        run(app)

    @app.cli.command('seed-demo-offices')
    def seed_demo_offices():
        """Carga oficinas demo."""
        from scripts.seed_demo_offices import run
        run(app)

    @app.cli.command('seed-demo-rbac')
    def seed_demo_rbac():
        """Carga roles, permisos, sesiones demo."""
        from scripts.seed_demo_rbac import run
        run(app)

    @app.cli.command('seed-demo-security')
    def seed_demo_security():
        """Carga datos demo del módulo de seguridad."""
        from scripts.seed_demo_security import run
        run(app)

    @app.cli.command('ml-sync')
    @click.option('--dry-run', is_flag=True, help='Solo muestra lo que se importaria')
    @click.option('--bidirectional', is_flag=True, help='Sincronización bidireccional (import + export)')
    def ml_sync_cmd(dry_run, bidirectional):
        """Importa propiedades desde MercadoLibre a Bienenhaus. Con --bidirectional también exporta cambios locales."""
        from portals.sync import sync_bidirectional
        if not dry_run:
            result = sync_bidirectional(app)
            mode = 'Bidireccional' if bidirectional else 'Solo import'
            click.echo(f'ML Sync {mode} completado:')
            click.echo(f'  Creadas:   {result["created"]}')
            click.echo(f'  Actualizadas: {result["updated"]}')
            if bidirectional:
                click.echo(f'  Exportadas:   {result["exported"]}')
            click.echo(f'  Saltadas:  {result["skipped"]}')
            if bidirectional:
                click.echo(f'  Conflictos (ML gana): {result["conflicts_ml_wins"]}')
            click.echo(f'  Total ML:  {result["total_ml"]}')
            if result['errors']:
                click.echo(f'  Errores ({len(result["errors"])}):')
                for e in result['errors'][:5]:
                    click.echo(f'    - {e}')
        else:
            click.echo('[dry-run] No se ejecutó la sincronización.')

    @app.cli.command('db-setup')
    def db_setup():
        """Aplica migraciones, seed de portales y usuario admin."""
        from flask_migrate import upgrade
        upgrade(revision='heads')
        _seed()
        from auth_helper import seed_admin_user
        seed_admin_user()
        click.echo('DB setup completo: migraciones aplicadas, seed ejecutado.')

    @app.cli.command('db-clean')
    def db_clean():
        """Elimina todas las tablas, las recrea y crea admin con contraseña ADMIN_PASSWORD."""
        click.echo('Eliminando todas las tablas...')
        db.drop_all()
        click.echo('Recreando tablas...')
        db.create_all()
        click.echo('Sembrando portales por defecto...')
        _seed()
        os.environ.setdefault('ADMIN_PASSWORD', 'Admin123!')
        from auth_helper import seed_admin_user
        seed_admin_user()
        click.echo('DB limpia: solo admin con la contraseña configurada en ADMIN_PASSWORD.')

    @app.cli.command('social-worker')
    def social_worker_cmd():
        """Procesa posts programados en redes sociales (un ciclo)."""
        from social.worker import run_once
        run_once()

    @app.cli.command('social-worker-daemon')
    def social_worker_daemon_cmd():
        """Worker daemon continuo para redes sociales (SIGTERM graceful)."""
        from social.worker import run_forever
        run_forever()

    with app.app_context():
        _db_url = str(db.engine.url)
        if _db_url.startswith('sqlite'):
            try:
                from sqlalchemy import inspect as _sa_inspect
                _inspector = _sa_inspect(db.engine)
                _has_tables = _inspector.get_table_names()
                if not _has_tables:
                    app.logger.info('DB vacía (SQLite) — usando db.create_all()')
                    db.create_all()
            except Exception:
                pass
        else:
            try:
                from alembic.config import Config as _AC
                from alembic.script import ScriptDirectory
                _acfg = _AC()
                _acfg.set_main_option('script_location', _migrations_dir)
                _ascript = ScriptDirectory.from_config(_acfg)
                _aheads = _ascript.get_heads()
                if len(_aheads) != 1:
                    app.logger.warning(
                        f'Migración: {len(_aheads)} heads encontrados '
                        f'({", ".join(_aheads)}). '
                        'Ejecutá: flask db-check && flask db merge'
                    )
                else:
                    from flask_migrate import upgrade
                    upgrade(revision='head')
                    app.logger.info('Migraciones aplicadas correctamente.')
            except Exception as _mig_err:
                import traceback as _tb
                app.logger.warning(
                    f'Error al migrar DB: {_mig_err}\n'
                    f'{_tb.format_exc()}'
                )
                app.logger.info('Fallback: creando tablas/columnas faltantes con db.create_all()...')
                try:
                    db.create_all()
                    app.logger.info('db.create_all() completado.')
                    from sqlalchemy import inspect as _sa_inspect, text as _sa_text
                    _inspector = _sa_inspect(db.engine)
                    _tables = set(_inspector.get_table_names())
                    _added = 0
                    for _mapper in db.Model.registry.mappers:
                        _cls = _mapper.class_
                        _tbl_name = _cls.__tablename__
                        if _tbl_name not in _tables:
                            app.logger.warning(f'Tabla {_tbl_name} ausente incluso tras create_all — puede requerir flask db-setup')
                            continue
                        _existing_cols = {c['name'] for c in _inspector.get_columns(_tbl_name)}
                        for _col_prop in _mapper.column_attrs:
                            _col = _col_prop.columns[0]
                            if _col.name not in _existing_cols:
                                _col_type_str = _col.type.as_generic().__class__.__name__
                                _type_map = {
                                    'String': 'VARCHAR(500)',
                                    'Text': 'TEXT',
                                    'Integer': 'INTEGER',
                                    'Float': 'FLOAT',
                                    'Boolean': 'BOOLEAN',
                                    'DateTime': 'TIMESTAMP',
                                    'Date': 'DATE',
                                }
                                _sql_type = _type_map.get(_col_type_str, 'VARCHAR(500)')
                                app.logger.info(f'Agregando columna {_tbl_name}.{_col.name} ({_sql_type})...')
                                try:
                                    db.session.execute(_sa_text(
                                        f'ALTER TABLE {_tbl_name} ADD COLUMN {_col.name} {_sql_type} DEFAULT NULL'
                                    ))
                                    db.session.commit()
                                    _added += 1
                                except Exception as _ce:
                                    db.session.rollback()
                                    app.logger.warning(f'  No se pudo agregar {_tbl_name}.{_col.name}: {_ce}')
                    app.logger.info(f'Columnas agregadas via ALTER TABLE: {_added}')
                except Exception as _fb_err:
                    app.logger.warning(f'Error en fallback create_all: {_fb_err}')

    with app.app_context():
        os.environ.setdefault('ADMIN_PASSWORD', 'Admin123!')
        from auth_helper import seed_admin_user
        seed_admin_user()

    # Social worker daemon thread (auto)
    if os.getenv('SOCIAL_WORKER_AUTO'):
        import threading
        def _run_social_worker():
            from social.worker import process_scheduled_posts
            import time
            interval = int(os.getenv('SOCIAL_WORKER_INTERVAL', '60'))
            while True:
                try:
                    with app.app_context():
                        processed, errors = process_scheduled_posts()
                        if processed or errors:
                            app.logger.info('[social-worker] Publicados: %s, Errores: %s', processed, errors)
                except Exception:
                    pass
                time.sleep(interval)
        t = threading.Thread(target=_run_social_worker, daemon=True)
        t.start()

    # Worker en segundo plano (solo si se pide explícitamente, no en Render — allí hay cron)
    if os.getenv('PORTAL_WORKER_AUTO'):
        import threading
        def _run_worker():
            import time
            from portal_worker import process_batch
            while True:
                try:
                    with app.app_context():
                        processed, errors = process_batch(app)
                        if processed or errors:
                            app.logger.info('[portal-worker] Procesados: %s, Errores: %s', processed, len(errors))
                except Exception:
                    pass
                time.sleep(60)
        t = threading.Thread(target=_run_worker, daemon=True)
        t.start()

    # ── WSGI middleware: quita Vary: Cookie de assets estáticos ──
    # Flask añade Vary: Cookie en save_session después de todos los
    # after_request. Cloudflare rechaza cachear si ve Vary: Cookie.
    class _StaticCacheMiddleware:
        def __init__(self, wsgi_app):
            self.wsgi_app = wsgi_app
            self._static_re = re.compile(r'^/(css|js|images|fonts|uploads)/')
            self._static_exact = frozenset(['/manifest.json', '/favicon.ico', '/robots.txt'])

        def __call__(self, environ, start_response):
            def _start_response(status, headers, exc_info=None):
                path = environ.get('PATH_INFO', '')
                if self._static_re.match(path) or path in self._static_exact:
                    new_headers = [(k, v) for k, v in headers
                                   if k.lower() not in ('set-cookie',
                                                         'access-control-allow-credentials')]
                    headers = new_headers
                    vary_found = None
                    for i, (k, v) in enumerate(headers):
                        if k.lower() == 'vary':
                            parts = [p.strip() for p in v.split(',')
                                     if p.strip().lower() not in ('origin', 'cookie')]
                            if parts:
                                headers[i] = ('Vary', ', '.join(parts))
                            else:
                                headers.pop(i)
                            break
                return start_response(status, headers, exc_info)
            return self.wsgi_app(environ, _start_response)

    app.wsgi_app = _StaticCacheMiddleware(app.wsgi_app)
    return app


def _seed():
    """Crea los portales por defecto si no existen y migra credenciales desde .env."""
    try:
        from models import Portal
        from extensions import db

        defaults = [
            {'name': 'ZonaProp', 'slug': 'zonaprop', 'active': False,
             'config_json': '{}'},
            {'name': 'MercadoLibre', 'slug': 'mercadolibre', 'active': False,
             'config_json': '{}'},
        ]
        for data in defaults:
            if not Portal.query.filter_by(slug=data['slug']).first():
                db.session.add(Portal(**data))
        db.session.commit()

        # Migrar ML_CLIENT_ID / ML_CLIENT_SECRET del .env al portal config si faltan
        ml = Portal.query.filter_by(slug='mercadolibre').first()
        if ml:
            cfg = ml.config
            changed = False
            env_client_id = os.getenv('ML_CLIENT_ID', '')
            env_client_secret = os.getenv('ML_CLIENT_SECRET', '')
            if env_client_id and not cfg.get('client_id'):
                cfg['client_id'] = env_client_id
                changed = True
            if env_client_secret and not cfg.get('client_secret'):
                cfg['client_secret'] = env_client_secret
                changed = True
            if changed:
                ml.config = cfg
                db.session.commit()
    except Exception:
        pass  # las tablas aún no existen (migración pendiente)


application = create_app()

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    application.run(debug=debug_mode, port=5000, host='0.0.0.0')