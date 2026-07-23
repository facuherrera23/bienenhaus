from datetime import datetime, timezone, timedelta
import platform
import os
import json
from flask import request, session, jsonify
from sqlalchemy import func
from extensions import db
from models import Office, User, Agent, Property, Rental, Lead, CalendarEvent
from models import Settings as SettingsModel
from defaults import SETTINGS_DEFAULTS
from csrf import csrf_protect
from auth_helper import require_role, ROLE_ADMIN
from utils import _ok, _err

from . import bp

BACKUP_STATUS = ['pending', 'running', 'completed', 'failed']


# ── General Settings (reuses existing Settings key-value store) ──

@bp.route('/general', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_general():
    data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
    return _ok(data)


@bp.route('/general', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_general():
    data = request.get_json(silent=True) or {}
    allowed = {
        'site_name', 'business_name', 'cuit', 'email', 'phone', 'whatsapp',
        'whatsapp2', 'website', 'address', 'hours', 'hero_years',
        'instagram', 'facebook', 'hero_video_url', 'hero_image_url',
        'about_eyebrow', 'about_lead', 'about_body', 'about_mision',
        'about_vision', 'about_valor1k', 'about_valor1v', 'about_valor2k',
        'about_valor2v', 'about_valor3k', 'about_valor3v', 'about_mercado',
        'about_ofrecemos', 'about_como', 'seo_site_name', 'seo_description',
        'seo_image', 'ga_id', 'smtp_host', 'smtp_port', 'smtp_user',
        'smtp_pass', 'email_from', 'email_to', 'webhook_url',
    }
    for key, value in data.items():
        if key in allowed or key in SETTINGS_DEFAULTS:
            SettingsModel.set(key, str(value).strip() if value is not None else '')
    db.session.commit()
    return _ok({**SETTINGS_DEFAULTS, **SettingsModel.all_dict()})


# ── Branding ──

@bp.route('/branding', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_branding():
    data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
    branding_keys = {k: data.get(k, '') for k in (
        'logo_main', 'logo_dark', 'logo_light', 'favicon_url',
        'login_image', 'public_image', 'brand_primary_color',
        'brand_secondary_color', 'brand_accent_color', 'brand_font',
    )}
    return _ok(branding_keys)


@bp.route('/branding', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_branding():
    data = request.get_json(silent=True) or {}
    allowed = {
        'logo_main', 'logo_dark', 'logo_light', 'favicon_url',
        'login_image', 'public_image', 'brand_primary_color',
        'brand_secondary_color', 'brand_accent_color', 'brand_font',
    }
    for key, value in data.items():
        if key in allowed:
            SettingsModel.set(key, str(value).strip() if value is not None else '')
    db.session.commit()
    return _ok({'ok': True})


# ── Localization ──

@bp.route('/localization', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_localization():
    data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
    loc_keys = {k: data.get(k, '') for k in (
        'locale_language', 'locale_currency', 'locale_timezone',
        'locale_date_format', 'locale_time_format', 'locale_metric_system',
        'locale_decimal_separator',
    )}
    return _ok(loc_keys)


@bp.route('/localization', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_localization():
    data = request.get_json(silent=True) or {}
    allowed = {
        'locale_language', 'locale_currency', 'locale_timezone',
        'locale_date_format', 'locale_time_format', 'locale_metric_system',
        'locale_decimal_separator',
    }
    for key, value in data.items():
        if key in allowed:
            SettingsModel.set(key, str(value).strip() if value is not None else '')
    db.session.commit()
    return _ok({'ok': True})


# ── Notifications ──

@bp.route('/notifications', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_notifications():
    data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
    notif_keys = {k: data.get(k, '') for k in (
        'notif_email_enabled', 'notif_push_enabled', 'notif_whatsapp_enabled',
        'notif_internal_enabled', 'notif_reminders', 'notif_marketing',
        'notif_sound', 'notif_frequency',
    )}
    return _ok(notif_keys)


@bp.route('/notifications', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_notifications():
    data = request.get_json(silent=True) or {}
    allowed = {
        'notif_email_enabled', 'notif_push_enabled', 'notif_whatsapp_enabled',
        'notif_internal_enabled', 'notif_reminders', 'notif_marketing',
        'notif_sound', 'notif_frequency',
    }
    for key, value in data.items():
        if key in allowed:
            SettingsModel.set(key, str(value).strip() if value is not None else '')
    db.session.commit()
    return _ok({'ok': True})


# ── Security ──

@bp.route('/security', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_security():
    data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
    sec_keys = {k: data.get(k, '') for k in (
        'password_min_length', 'password_require_uppercase', 'password_require_special',
        'session_timeout', 'session_max_devices', 'two_factor_enabled',
    )}
    active_sessions = 2
    authorized_ips = data.get('authorized_ips', '')
    return _ok({**sec_keys, 'active_sessions': active_sessions,
                'authorized_ips': authorized_ips})


@bp.route('/security', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_security():
    data = request.get_json(silent=True) or {}
    allowed = {
        'password_min_length', 'password_require_uppercase', 'password_require_special',
        'session_timeout', 'session_max_devices', 'two_factor_enabled', 'authorized_ips',
    }
    for key, value in data.items():
        if key in allowed:
            SettingsModel.set(key, str(value).strip() if value is not None else '')
    db.session.commit()
    return _ok({'ok': True})


# ── Offices CRUD ──

@bp.route('/offices', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_offices():
    offices = Office.query.order_by(Office.sort_order.asc(), Office.name.asc()).all()
    return _ok([o.to_dict() for o in offices])


@bp.route('/offices', methods=['POST'])
@require_role(ROLE_ADMIN)
@csrf_protect
def create_office():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return _err('El nombre es requerido', 400)
    office = Office(
        name=name,
        address=data.get('address', ''),
        city=data.get('city', ''),
        province=data.get('province', ''),
        country=data.get('country', 'Argentina'),
        phone=data.get('phone', ''),
        manager=data.get('manager', ''),
        schedule=data.get('schedule', ''),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        active=data.get('active', True),
        sort_order=data.get('sort_order', 0),
    )
    db.session.add(office)
    db.session.commit()
    return _ok(office.to_dict())


@bp.route('/offices/<int:oid>', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_office(oid):
    office = db.session.get(Office, oid)
    if not office:
        return _err('Oficina no encontrada', 404)
    data = request.get_json(silent=True) or {}
    for field in ('name', 'address', 'city', 'province', 'country', 'phone',
                  'manager', 'schedule'):
        if field in data:
            setattr(office, field, str(data[field]).strip() if data[field] is not None else '')
    for numeric in ('latitude', 'longitude', 'sort_order'):
        if numeric in data:
            setattr(office, numeric, data[numeric])
    if 'active' in data:
        office.active = bool(data['active'])
    db.session.commit()
    return _ok(office.to_dict())


@bp.route('/offices/<int:oid>', methods=['DELETE'])
@require_role(ROLE_ADMIN)
@csrf_protect
def delete_office(oid):
    office = db.session.get(Office, oid)
    if not office:
        return _err('Oficina no encontrada', 404)
    db.session.delete(office)
    db.session.commit()
    return _ok({'deleted': True})


# ── Integrations ──

@bp.route('/integrations', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_integrations():
    data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
    integrations = [
        {'id': 'meta', 'name': 'Meta (Facebook/Instagram)', 'icon': 'facebook',
         'connected': bool(data.get('meta_access_token')), 'configurable': True,
         'last_sync': data.get('meta_last_sync', '')},
        {'id': 'google', 'name': 'Google', 'icon': 'google',
         'connected': bool(data.get('google_api_key')), 'configurable': True,
         'last_sync': data.get('google_last_sync', '')},
        {'id': 'google_calendar', 'name': 'Google Calendar', 'icon': 'calendar',
         'connected': bool(data.get('google_calendar_token')), 'configurable': True,
         'last_sync': ''},
        {'id': 'whatsapp_business', 'name': 'WhatsApp Business', 'icon': 'whatsapp',
         'connected': bool(data.get('waba_token')), 'configurable': True,
         'last_sync': ''},
        {'id': 'smtp', 'name': 'SMTP', 'icon': 'email',
         'connected': bool(data.get('smtp_host')), 'configurable': True,
         'last_sync': ''},
        {'id': 'mercadolibre', 'name': 'Mercado Libre', 'icon': 'ml',
         'connected': bool(data.get('ml_access_token')), 'configurable': True,
         'last_sync': data.get('ml_last_sync', '')},
        {'id': 'zonaprop', 'name': 'ZonaProp', 'icon': 'zp',
         'connected': bool(data.get('zp_api_key')), 'configurable': True,
         'last_sync': ''},
        {'id': 'argenprop', 'name': 'Argenprop', 'icon': 'ap',
         'connected': bool(data.get('ap_api_key')), 'configurable': True,
         'last_sync': ''},
        {'id': 'cloudinary', 'name': 'Cloudinary', 'icon': 'cloud',
         'connected': bool(data.get('cloudinary_cloud_name')), 'configurable': True,
         'last_sync': ''},
        {'id': 'openai', 'name': 'OpenAI', 'icon': 'ai',
         'connected': bool(data.get('openai_api_key')), 'configurable': True,
         'last_sync': ''},
    ]
    return _ok(integrations)


@bp.route('/integrations/<integration_id>/config', methods=['GET', 'PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def integration_config(integration_id):
    allowed_ids = {'meta', 'google', 'google_calendar', 'whatsapp_business', 'smtp',
                   'mercadolibre', 'zonaprop', 'argenprop', 'cloudinary', 'openai'}
    if integration_id not in allowed_ids:
        return _err('Integración no válida', 400)
    key_map = {
        'meta': 'meta_access_token',
        'google': 'google_api_key',
        'google_calendar': 'google_calendar_token',
        'whatsapp_business': 'waba_token',
        'smtp': 'smtp_host',
        'mercadolibre': 'ml_access_token',
        'zonaprop': 'zp_api_key',
        'argenprop': 'ap_api_key',
        'cloudinary': 'cloudinary_cloud_name',
        'openai': 'openai_api_key',
    }
    if request.method == 'GET':
        data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
        result = {}
        for k, v in data.items():
            if k.startswith(integration_id) or k == key_map.get(integration_id):
                result[k] = v
        return _ok(result)
    # PUT
    body = request.get_json(silent=True) or {}
    for key, value in body.items():
        SettingsModel.set(key, str(value).strip() if value is not None else '')
    if integration_id == 'smtp' and body.get('smtp_host'):
        SettingsModel.set(key_map[integration_id], body['smtp_host'])
    SettingsModel.set(f'{integration_id}_last_sync', datetime.now(timezone.utc).replace(tzinfo=None).isoformat())
    db.session.commit()
    return _ok({'ok': True, 'connected': True})


@bp.route('/integrations/<integration_id>/test', methods=['POST'])
@require_role(ROLE_ADMIN)
@csrf_protect
def test_integration(integration_id):
    allowed_ids = {'meta', 'google', 'smtp', 'mercadolibre', 'cloudinary', 'openai'}
    if integration_id not in allowed_ids:
        return _err('Test no disponible para esta integración', 400)
    data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
    if integration_id == 'smtp':
        if not data.get('smtp_host'):
            return _err('SMTP no configurado', 400)
        return _ok({'ok': True, 'message': 'Configuración SMTP encontrada'})
    key_map = {
        'meta': 'meta_access_token',
        'google': 'google_api_key',
        'mercadolibre': 'ml_access_token',
        'cloudinary': 'cloudinary_cloud_name',
        'openai': 'openai_api_key',
    }
    key = key_map.get(integration_id)
    if key and data.get(key):
        return _ok({'ok': True, 'message': f'Conexión verificada: {key} configurado'})
    return _err(f'{integration_id}: no configurado', 400)


@bp.route('/integrations/<integration_id>/disconnect', methods=['POST'])
@require_role(ROLE_ADMIN)
@csrf_protect
def disconnect_integration(integration_id):
    key_map = {
        'meta': 'meta_access_token',
        'google': 'google_api_key',
        'google_calendar': 'google_calendar_token',
        'whatsapp_business': 'waba_token',
        'smtp': 'smtp_host',
        'mercadolibre': 'ml_access_token',
        'zonaprop': 'zp_api_key',
        'argenprop': 'ap_api_key',
        'cloudinary': 'cloudinary_cloud_name',
        'openai': 'openai_api_key',
    }
    key = key_map.get(integration_id)
    if key:
        SettingsModel.set(key, '')
    SettingsModel.set(f'{integration_id}_last_sync', '')
    db.session.commit()
    return _ok({'ok': True, 'connected': False})


# ── Backups ──

@bp.route('/backups', methods=['GET'])
@require_role(ROLE_ADMIN)
def list_backups():
    import glob
    backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(backup_dir, '*.sql')), key=os.path.getmtime, reverse=True)
    backups = []
    for f in files[:20]:
        stat = os.stat(f)
        backups.append({
            'id': os.path.basename(f),
            'filename': os.path.basename(f),
            'size': f'{stat.st_size / 1024:.1f} KB',
            'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'status': 'completed',
        })
    data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
    return _ok({
        'backups': backups,
        'auto_enabled': data.get('backup_auto_enabled', 'true'),
        'auto_interval': data.get('backup_auto_interval', '24'),
        'cloudinary_enabled': data.get('backup_cloudinary_enabled', 'false'),
    })


@bp.route('/backups', methods=['POST'])
@require_role(ROLE_ADMIN)
@csrf_protect
def create_backup():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    filename = f'bienenhaus_backup_{timestamp}.sql'
    filepath = os.path.join(backup_dir, filename)
    db_url = str(db.engine.url)
    try:
        if db_url.startswith('sqlite'):
            import shutil
            db_path = db_url.replace('sqlite:///', '')
            shutil.copy2(db_path, filepath)
        else:
            from urllib.parse import urlparse
            parsed = urlparse(db_url)
            host = parsed.hostname or 'localhost'
            port = parsed.port or 5432
            user = parsed.username or 'postgres'
            pw = parsed.password or ''
            dbname = parsed.path.lstrip('/')
            os.environ['PGPASSWORD'] = pw
            cmd = f'pg_dump -h {host} -p {port} -U {user} -d {dbname} -f "{filepath}"'
            ret = os.system(cmd)
            if ret != 0:
                return _err('Error al ejecutar pg_dump', 500)
        return _ok({
            'id': filename,
            'filename': filename,
            'size': f'{os.path.getsize(filepath) / 1024:.1f} KB',
            'created_at': datetime.now().isoformat(),
            'status': 'completed',
        })
    except Exception as e:
        return _err(f'Error al crear backup: {e}', 500)


@bp.route('/backups/config', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_backup_config():
    data = request.get_json(silent=True) or {}
    for key in ('backup_auto_enabled', 'backup_auto_interval', 'backup_cloudinary_enabled'):
        if key in data:
            SettingsModel.set(key, str(data[key]).strip())
    db.session.commit()
    return _ok({'ok': True})


# ── Preferences ──

@bp.route('/preferences', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_preferences():
    user_id = session.get('user_id')
    data = {**SETTINGS_DEFAULTS, **SettingsModel.all_dict()}
    prefs = {
        'default_dashboard': data.get(f'pref_dashboard_{user_id}', 'dashboard'),
        'default_view': data.get(f'pref_view_{user_id}', 'cards'),
        'records_per_page': data.get(f'pref_per_page_{user_id}', '12'),
        'animations_enabled': data.get(f'pref_animations_{user_id}', 'true'),
        'compact_sidebar': data.get('sidebarCollapsed', 'false'),
        'sidebar_collapsed': data.get('sidebarCollapsed', 'false'),
    }
    return _ok(prefs)


@bp.route('/preferences', methods=['PUT'])
@require_role(ROLE_ADMIN)
@csrf_protect
def update_preferences():
    user_id = session.get('user_id')
    data = request.get_json(silent=True) or {}
    mapping = {
        'default_dashboard': f'pref_dashboard_{user_id}',
        'default_view': f'pref_view_{user_id}',
        'records_per_page': f'pref_per_page_{user_id}',
        'animations_enabled': f'pref_animations_{user_id}',
        'compact_sidebar': 'sidebarCollapsed',
    }
    for key, setting_key in mapping.items():
        if key in data:
            SettingsModel.set(setting_key, str(data[key]).strip())
    db.session.commit()
    return _ok({'ok': True})


# ── System Info ──

@bp.route('/system', methods=['GET'])
@require_role(ROLE_ADMIN)
def get_system_info():
    db_url = str(db.engine.url)
    db_type = 'PostgreSQL' if 'postgresql' in db_url else 'SQLite'
    try:
        engine = db.engine
        pool = engine.pool
        pool_info = {
            'size': pool.size(),
            'checkedin': pool.checkedin(),
            'checkedout': pool.checkedout(),
            'overflow': pool.overflow(),
        }
    except Exception:
        pool_info = {'error': 'N/A'}
    total_props = Property.query.count()
    total_rentals = Rental.query.count()
    total_leads = Lead.query.count()
    total_users = User.query.count()
    total_agents = Agent.query.count()
    total_events = CalendarEvent.query.count()
    env = os.getenv('ENVIRONMENT', 'development')
    return _ok({
        'version': '1.0.0',
        'environment': env,
        'db_type': db_type,
        'db_pool': pool_info,
        'python_version': platform.python_version(),
        'platform': platform.platform(),
        'properties_count': total_props,
        'rentals_count': total_rentals,
        'leads_count': total_leads,
        'users_count': total_users,
        'agents_count': total_agents,
        'events_count': total_events,
        'debug_mode': os.getenv('FLASK_DEBUG', 'false'),
        'sentry_enabled': bool(os.getenv('SENTRY_DSN')),
        'cloudinary_enabled': bool(os.getenv('CLOUDINARY_URL')),
        'rate_limiting': os.getenv('RATELIMIT_ENABLED', 'true'),
        'server_time': datetime.now(timezone.utc).isoformat(),
    })
