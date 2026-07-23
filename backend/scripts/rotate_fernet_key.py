"""
rotate_fernet_key.py — Migracion de datos encriptados con Fernet al rotar SECRET_KEY

USO:
  # Paso 1: backup manual (hacelo vos antes)
  #   pg_dump ... > backup_bienenhaus_$(date +%F).sql

  # Paso 3: simular (solo decrypt + re-encrypt + verificar, no escribe)
  OLD_SECRET_KEY="vieja" NEW_SECRET_KEY="nueva" \
    python scripts/rotate_fernet_key.py

  # Paso 4: aplicar (UPDATE dentro de transaccion)
  OLD_SECRET_KEY="vieja" NEW_SECRET_KEY="nueva" \
    python scripts/rotate_fernet_key.py --apply

  # Ambiente de staging/testing:
  OLD_SECRET_KEY="v" NEW_SECRET_KEY="n" \
    DATABASE_URL="postgresql://..." \
    python scripts/rotate_fernet_key.py --apply

REQUISITOS:
  - Ejecutar con la app DENTRO del mismo entorno Python (mismas deps)
  - NO modifica SECRET_KEY del entorno — solo usa OLD_SECRET_KEY y
    NEW_SECRET_KEY del entorno
  - La DB debe ser accesible desde donde se corre
"""

import os
import sys
import json
import base64
import argparse
from datetime import datetime

from sqlalchemy import create_engine, text

# -- Fernet (identico a utils.py) -------------------------------------
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

_ENCRYPTION_SALT: bytes = b'bienenhaus-cfg-v1'
_SENSITIVE_CONFIG_KEYS: set[str] = {
    'access_token', 'refresh_token', 'client_secret', 'sftp_pass',
}


def _derive_fernet(secret_key: str) -> Fernet:
    """Deriva Fernet desde SECRET_KEY — copia exacta de utils.py:124-131."""
    if not secret_key:
        raise RuntimeError('SECRET_KEY vacia')
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_ENCRYPTION_SALT,
        info=b'portal-config-encryption',
    )
    f_key = base64.urlsafe_b64encode(hkdf.derive(secret_key.encode()))
    return Fernet(f_key)


def decrypt_config(config_json: str, old_fernet: Fernet) -> dict | None:
    """Desencripta SOLO los campos sensibles de un config_json.
    Identico a utils.py:150-163 — si no empieza con 'gAAAAA' lo deja pasar."""
    try:
        raw = json.loads(config_json)
    except Exception:
        return None
    if not isinstance(raw, dict):
        return None
    for k in _SENSITIVE_CONFIG_KEYS:
        v = raw.get(k)
        if v and isinstance(v, str):
            if not v.startswith('gAAAAA'):
                continue  # no encriptado, pasa sin cambios
            try:
                raw[k] = old_fernet.decrypt(v.encode()).decode()
            except Exception:
                raw[k] = f'__DECRYPT_FAILED__:{v[:40]}...'
    return raw


def encrypt_config(plain_config: dict, new_fernet: Fernet) -> str:
    """Re-encripta SOLO los campos sensibles de un config."""
    out = dict(plain_config)
    for k in _SENSITIVE_CONFIG_KEYS:
        v = out.get(k)
        if v and isinstance(v, str) and not v.startswith('gAAAAA'):
            out[k] = new_fernet.encrypt(v.encode()).decode()
    return json.dumps(out)


def verify_roundtrip(
    original_plain: dict,
    reencrypted_json: str,
    new_fernet: Fernet,
) -> bool:
    """Verifica que reencriptar+desencriptar con new_key da el mismo plaintext."""
    try:
        reencrypted = json.loads(reencrypted_json)
    except Exception:
        return False
    for k in _SENSITIVE_CONFIG_KEYS:
        orig = original_plain.get(k)
        enc = reencrypted.get(k)
        if orig and isinstance(orig, str):
            if not enc or not isinstance(enc, str):
                return False
            try:
                dec = new_fernet.decrypt(enc.encode()).decode()
            except Exception:
                return False
            if dec != orig:
                return False
        elif enc and isinstance(enc, str):
            return False
    return True


TABLES = [
    ('portals', 'id', 'name'),
    ('social_accounts', 'id', 'label'),
]


def step3_simulate(old_key: str, new_key: str, db_url: str, apply: bool = False):
    """Paso 3: decrypt + re-encrypt + verify. Paso 4: --apply escribe."""
    old_f = _derive_fernet(old_key)
    new_f = _derive_fernet(new_key)

    engine = create_engine(db_url)
    conn = engine.connect()
    results = []
    all_ok = True

    print(f'{"Tabla":<20} {"ID":>4} {"Nombre":<30} {"Status":<12} Detalle')
    print('-' * 80)

    for table, id_col, name_col in TABLES:
        try:
            rows = conn.execute(
                text(f'SELECT {id_col}, {name_col}, config_json FROM {table}')
            ).fetchall()
        except Exception as e:
            print(f'  {table:<20} {"-":>4} {"<sin tabla>":<30} {"SKIP":<12} {e}')
            continue

        for row in rows:
            rid = row[0]
            rname = row[1] or '-'
            config_json = row[2] or '{}'
            config_str = str(config_json) if not isinstance(config_json, str) else config_json

            if not any(k in config_str for k in _SENSITIVE_CONFIG_KEYS):
                results.append((table, rid, 'ok', 'sin datos sensibles'))
                print(f'  {table:<20} {rid:>4} {str(rname)[:28]:<30} {"OK":<12} sin datos sensibles')
                continue

            plain = decrypt_config(config_str, old_f)
            if plain is None:
                all_ok = False
                results.append((table, rid, 'fail', 'config_json invalido'))
                print(f'  {table:<20} {rid:>4} {str(rname)[:28]:<30} {"FAIL":<12} config_json invalido')
                continue

            decrypt_fails = [k for k, v in plain.items()
                             if isinstance(v, str) and v.startswith('__DECRYPT_FAILED__:')]
            if decrypt_fails:
                all_ok = False
                results.append((table, rid, 'fail',
                                f'decrypt fallo para: {",".join(decrypt_fails)}'))
                print(f'  {table:<20} {rid:>4} {str(rname)[:28]:<30} {"FAIL":<12} '
                      f'no se pudo desencriptar: {",".join(decrypt_fails)}')
                continue

            new_json = encrypt_config(plain, new_f)

            if not verify_roundtrip(plain, new_json, new_f):
                all_ok = False
                results.append((table, rid, 'fail', 'round-trip verification failed'))
                print(f'  {table:<20} {rid:>4} {str(rname)[:28]:<30} {"FAIL":<12} '
                      f'round-trip no coincide')
                continue

            results.append((table, rid, 'ok', 're-encrypt + verify OK'))
            print(f'  {table:<20} {rid:>4} {str(rname)[:28]:<30} {"OK":<12} '
                  f're-encrypt + verify OK')

            if apply:
                conn.execute(
                    text(f'UPDATE {table} SET config_json = :val WHERE {id_col} = :rid'),
                    {'val': new_json, 'rid': rid},
                )
                results[-1] = (table, rid, 'applied', 'UPDATE ejecutado')

    if apply:
        conn.commit()
        applied = sum(1 for r in results if r[2] == 'applied')
        print(f'Transaccion commiteada. {applied} registros actualizados.')
    else:
        print('Modo simulacion (--dry-run). Para aplicar: agregue --apply.')
        print('Rollback implicito (no se llamo a commit).')

    if all_ok:
        print('VERIFICACION: 100% de los registros pasaron round-trip.')
    else:
        print('HAY FALLOS. Revisar antes de continuar. No aplicar hasta resolver.')

    conn.close()
    engine.dispose()


def main():
    parser = argparse.ArgumentParser(
        description='Migrar datos encriptados con Fernet al rotar SECRET_KEY')
    parser.add_argument('--apply', action='store_true',
                        help='Ejecutar UPDATE en la DB (sin esto, solo simula)')
    parser.add_argument('--db-url', default=None,
                        help='URL de la base de datos. Por defecto usa DATABASE_URL del entorno.')
    args = parser.parse_args()

    old_key = os.environ.get('OLD_SECRET_KEY')
    new_key = os.environ.get('NEW_SECRET_KEY')
    if not old_key or not new_key:
        print('ERROR: OLD_SECRET_KEY y NEW_SECRET_KEY deben estar definidas en el entorno.')
        print('  OLD_SECRET_KEY="vieja" NEW_SECRET_KEY="nueva" python scripts/rotate_fernet_key.py')
        sys.exit(1)

    db_url = args.db_url or os.environ.get('DATABASE_URL')
    if not db_url:
        print('ERROR: DATABASE_URL requerida (--db-url o variable de entorno)')
        sys.exit(1)

    print('Migracion Fernet key')
    print(f'  DB: {db_url.split("@")[-1] if "@" in db_url else db_url}')
    print(f'  Modo: {"APLICAR (--apply)" if args.apply else "SIMULACION (--dry-run)"}')
    print(f'  Old key: {old_key[:8]}...{old_key[-4:]}')
    print(f'  New key: {new_key[:8]}...{new_key[-4:]}')
    print()

    step3_simulate(old_key, new_key, db_url, apply=args.apply)


if __name__ == '__main__':
    main()
