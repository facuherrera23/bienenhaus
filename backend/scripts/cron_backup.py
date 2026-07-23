#!/usr/bin/env python3
"""
cron_backup.py — Entry point para Render Cron Job.
Dispara backup via POST a la API interna del web service.
Usa solo stdlib (sin dependencias externas).
"""
import os
import sys
import json
import urllib.request
import urllib.error

BACKUP_URL = os.environ.get('BACKUP_API_URL', 'https://bienenhaus.onrender.com') + '/api/admin/db-backup'
BACKUP_KEY = os.environ.get('BACKUP_API_KEY', '')

if not BACKUP_KEY:
    print('[cron-backup] ERROR: BACKUP_API_KEY no configurada')
    sys.exit(1)

req = urllib.request.Request(
    BACKUP_URL,
    data=b'',
    headers={'X-Backup-Key': BACKUP_KEY},
    method='POST',
)

try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode())
        if result.get('ok'):
            print(f"[cron-backup] OK — URL: {result.get('url')}")
            print(f"[cron-backup] Size: {result.get('size', 0):,} bytes")
        else:
            print(f"[cron-backup] Error: {result.get('error', 'desconocido')}")
            sys.exit(1)
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f'[cron-backup] HTTP {e.code}: {body}')
    sys.exit(1)
except Exception as e:
    print(f'[cron-backup] Exception: {e}')
    sys.exit(1)
