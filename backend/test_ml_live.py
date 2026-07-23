"""
test_ml_live.py — Prueba del adapter de MercadoLibre contra API real.

Uso:
    set ML_ACCESS_TOKEN=tu_token
    set ML_USER_ID=123456789
    python test_ml_live.py

Si no se setean las vars, el script las pide por teclado.
"""
import os
import sys
import json
import requests


def main():
    token = os.getenv('ML_ACCESS_TOKEN') or input('ML Access Token: ').strip()
    user_id = os.getenv('ML_USER_ID') or input('ML User ID (opcional, Enter para omitir): ').strip()

    if not token:
        print('ERROR: Se necesita un access_token')
        sys.exit(1)

    # ── 1) Verificar que el token sea válido ──
    print('\n=== 1. Verificando access_token...')
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    r = requests.get('https://api.mercadolibre.com/users/me', headers=headers, timeout=10)
    if r.status_code == 200:
        me = r.json()
        user_id = user_id or str(me.get('id', ''))
        print(f'  [OK] Token valido - Usuario: {me.get("nickname", "?")} (id={me.get("id")})')
        print(f'  Site: {me.get("site_id", "?")} - Email: {me.get("email", "?")}')
    else:
        print(f'  [ERR] Token invalido - HTTP {r.status_code}: {r.text[:300]}')
        sys.exit(1)

    # ── 2) Verificar categorías inmobiliarias ──
    print('\n=== 2. Verificando categorías inmobiliarias del usuario...')
    for slug, cat_id in [('casa', 'MLA1466'), ('departamento', 'MLA1472')]:
        r = requests.get(
            f'https://api.mercadolibre.com/users/{user_id}/items/search',
            headers=headers,
            params={'category': cat_id, 'limit': 1},
            timeout=10,
        )
        if r.status_code == 200:
            print(f'  [OK] Categoria {cat_id} ({slug}) accesible')
        else:
            print(f'  [WARN] Categoria {cat_id} ({slug}): HTTP {r.status_code}')

    # ── 3) Mostrar JSON que se enviaría a ML ──
    print('\n=== 3. Simulación: JSON que se enviaría a ML ===')
    test_data = {
        'title': 'Casa en Córdoba - Test Bienenhaus NO COMPRAR',
        'category_id': 'MLA1466',
        'price': 85000,
        'currency_id': 'USD',
        'available_quantity': 1,
        'buying_mode': 'classified',
        'listing_type_id': 'free',
        'condition': 'not_specified',
        'description': {'plain_text': 'Propiedad de prueba — NO COMPRAR'},
        'pictures': [],
        'attributes': [
            {'id': 'ROOMS', 'value_name': '3'},
            {'id': 'BATHROOMS', 'value_name': '2'},
            {'id': 'SQUARE_METER', 'value_name': '120'},
        ],
    }
    print(json.dumps(test_data, indent=2, ensure_ascii=False))

    # ── 4) Preguntar si publicar de verdad ──
    print()
    confirm = input('¿Publicar en ML realmente? (s/N): ').strip().lower()
    if confirm != 's':
        print('\nPrueba cancelada. No se publicó nada.')
        return

    print('\n=== 4. Publicando en MercadoLibre...')
    try:
        resp = requests.post(
            'https://api.mercadolibre.com/items',
            headers={**headers, 'Content-Type': 'application/json'},
            json=test_data,
            timeout=30,
        )

        if resp.status_code == 201:
            result = resp.json()
            print(f'  [OK] PUBLICADO con exito!')
            print(f'  ID:    {result.get("id")}')
            print(f'  URL:   {result.get("permalink")}')
            print(f'  State: {result.get("status")}')
        else:
            print(f'  [ERR] Error HTTP {resp.status_code}')
            try:
                error = resp.json()
                msg = error.get('message', '')
                cause = error.get('cause', [])
                print(f'  Message: {msg}')
                if cause:
                    print(f'  Cause: {json.dumps(cause, indent=4)}')

                if 'category_id.invalid' in str(error):
                    print('\n  [INFO] La cuenta no esta habilitada para publicar inmuebles.')
                    print('     Pasos:')
                    print('     1. Ir a developers.mercadolibre.com.ar')
                    print('     2. Configurar la app como "Inmobiliaria"')
                    print('     3. Contratar paquete de publicaciones en ML')
                    print('     4. Esperar 24-48hs hasta que ML habilite la categoría')
            except Exception:
                print(f'  Raw: {resp.text[:1000]}')
    except requests.exceptions.Timeout:
        print('  [ERR] Timeout - La API de ML no respondio en 30 segundos')
    except requests.exceptions.RequestException as e:
        print(f'  [ERR] Error de conexion: {e}')

    # ── 5) Si se publicó, preguntar si despublicar ──
    if resp.status_code == 201:
        ext_id = result.get('id')
        print(f'\n=== 5. Item publicado: {ext_id}')
        unpub = input('¿Despublicarlo ahora? (s/N): ').strip().lower()
        if unpub == 's':
            r = requests.put(
                f'https://api.mercadolibre.com/items/{ext_id}',
                headers={**headers, 'Content-Type': 'application/json'},
                json={'status': 'closed'},
                timeout=15,
            )
            if r.status_code == 200:
                print(f'  [OK] Item {ext_id} cerrado (despublicado)')
            else:
                print(f'  [ERR] Error al cerrar: HTTP {r.status_code} - {r.text[:300]}')


if __name__ == '__main__':
    main()
