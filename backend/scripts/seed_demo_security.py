"""Seed demo data for the Security module (Módulo 18)."""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from extensions import db
from models import User, SecurityEvent, ApiKey, Webhook, Device, SystemEvent


def run(app):
    with app.app_context():
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            print('[seed-security] Admin user not found, skipping')
            return
        uid = admin.id

        # ── API Keys ──
        if ApiKey.query.count() == 0:
            keys = [
                ApiKey(user_id=uid, name='Producción API', key_prefix='bh_pr_01',
                       key_hash='a'*64, scopes='["read","write"]',
                       last_used=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=2)),
                ApiKey(user_id=uid, name='Desarrollo Local', key_prefix='bh_dev_01',
                       key_hash='b'*64, scopes='["read"]', active=False),
                ApiKey(user_id=uid, name='Integración ML', key_prefix='bh_ml_01',
                       key_hash='c'*64, scopes='["read","write","admin"]',
                       expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=60)),
            ]
            db.session.add_all(keys)

        # ── Webhooks ──
        if Webhook.query.count() == 0:
            whs = [
                Webhook(user_id=uid, name='Notificar a Slack', url='https://hooks.slack.com/services/T00/B00/key',
                        events='["property.created","property.updated"]', active=True,
                        last_status='ok', last_called_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=5)),
                Webhook(user_id=uid, name='Webhook de respaldo', url='https://ejemplo.com/webhook',
                        events='[]', active=False),
            ]
            db.session.add_all(whs)

        # ── Devices ──
        if Device.query.count() == 0:
            devices = [
                Device(user_id=uid, name='MacBook Pro M3', device_type='desktop',
                       os='macOS 15.0', browser='Chrome 130',
                       ip='192.168.1.10', fingerprint='fp_macbook_001',
                       trusted=True, last_seen=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=30)),
                Device(user_id=uid, name='iPhone 16 Pro', device_type='mobile',
                       os='iOS 19.0', browser='Safari',
                       ip='192.168.1.20', fingerprint='fp_iphone_001',
                       trusted=True, last_seen=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)),
                Device(user_id=uid, name='PC Escritorio Oficina', device_type='desktop',
                       os='Windows 11', browser='Firefox 132',
                       ip='10.0.0.50', fingerprint='fp_pc_office',
                       trusted=False, last_seen=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=10)),
            ]
            db.session.add_all(devices)

        # ── Security Events ──
        if SecurityEvent.query.count() == 0:
            events = [
                SecurityEvent(user_id=uid, event_type='login_failure', severity='medium',
                              title='Múltiples intentos fallidos de login',
                              details='5 intentos fallidos consecutivos desde IP 203.0.113.42',
                              ip='203.0.113.42', geo_city='Buenos Aires', geo_country='AR',
                              resolved=True, resolved_by=uid,
                              resolved_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=12)),
                SecurityEvent(user_id=None, event_type='suspicious_ip', severity='high',
                              title='Acceso desde ubicación inusual',
                              details='Login desde Moscow, RU que no coincide con ubicación habitual',
                              ip='198.51.100.7', geo_city='Moscow', geo_country='RU',
                              resolved=False),
                SecurityEvent(user_id=uid, event_type='password_changed', severity='low',
                              title='Contraseña cambiada',
                              details='El usuario admin cambió su contraseña',
                              ip='192.168.1.10', resolved=True, resolved_by=uid,
                              resolved_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=2)),
                SecurityEvent(user_id=None, event_type='brute_force', severity='critical',
                              title='Ataque de fuerza bruta detectado',
                              details='120 intentos en 5 minutos desde 45.33.32.156',
                              ip='45.33.32.156', resolved=False),
            ]
            db.session.add_all(events)

        # ── System Events ──
        if SystemEvent.query.count() == 0:
            sys_events = [
                SystemEvent(event_type='deployment', severity='info', source='Render',
                            title='Deploy completado', details='v2.4.1 desplegado correctamente',
                            resolved=True),
                SystemEvent(event_type='database', severity='warning', source='PostgreSQL',
                            title='Alta latencia en DB',
                            details='Tiempo de respuesta promedio > 500ms durante 3 minutos',
                            resolved=True),
                SystemEvent(event_type='error', severity='critical', source='Sentry',
                            title='Error de conexión con MercadoLibre',
                            details='Timeout al obtener publicaciones activas',
                            resolved=False),
                SystemEvent(event_type='queue', severity='medium', source='PortalWorker',
                            title='Cola de portales bloqueada',
                            details='3 ítems stuck en estado "processing" por más de 30 minutos',
                            resolved=True,
                            created_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)),
            ]
            db.session.add_all(sys_events)

        # ── Audit Logs (already seeded by RBAC: 15 entries) ──

        db.session.commit()
        print(f'[seed-security] Demo data seeded: '
              f'{ApiKey.query.count()} keys, '
              f'{Webhook.query.count()} webhooks, '
              f'{Device.query.count()} devices, '
              f'{SecurityEvent.query.count()} security events, '
              f'{SystemEvent.query.count()} system events')


if __name__ == '__main__':
    from app import create_app
    app = create_app()
    run(app)
