# Configurar Cloudflare Page Rules para cachear assets estáticos

## Por qué

Hoy los assets (CSS, JS, imágenes) tienen `Cache-Control: public, max-age=31536000`, pero Cloudflare los marca como `cf-cache-status: DYNAMIC`. Esto significa que **Cloudflare no cachea en su edge** — cada primer request de cada usuario viaja hasta Render.

Con Page Rules, Cloudflare guarda el asset en sus servidores globales y responde desde ahí:
- **Latencia 0** para el origin (Render)
- **Respuesta ~10-30ms** en vez de ~200-500ms (depende de dónde esté el usuario)
- **Cero carga** en el servidor por assets

## Paso a paso

### 1. Ir a Cloudflare Dashboard

https://dash.cloudflare.com/ → seleccionar `bienenhaus.com.ar`

### 2. Navegar a Rules → Page Rules

Sidebar: **Rules** → **Page Rules**

### 3. Crear Page Rule para CSS

Botón **Create Page Rule**

- **URL:** `bienenhaus.com.ar/css/*`
- **Settings:**
  - ✅ **Cache Level:** `Standard` (usa el Cache-Control del origin)
  - ✅ **Edge Cache TTL:** `1 year`
  - ✅ **Bypass Cache on Cookie:** (no agregar — dejarlo vacío)

→ **Save and Deploy**

### 4. Repetir para cada tipo de asset

| URL | Edge TTL | Cache Level |
|-----|----------|-------------|
| `bienenhaus.com.ar/css/*` | 1 año | Standard |
| `bienenhaus.com.ar/js/*` | 1 año | Standard |
| `bienenhaus.com.ar/images/*` | 1 año | Standard |
| `bienenhaus.com.ar/fonts/*` | 1 año | Standard |
| `bienenhaus.com.ar/manifest.json` | 1 día | Standard |

### 5. Verificar

```bash
curl -I https://bienenhaus.com.ar/css/styles.min.css
```

Buscar:
```
cf-cache-status: HIT   ← antes decía DYNAMIC
Cache-Control: public, max-age=31536000
```

## Importante

- **Cloudflare Free plan permite 3 Page Rules.** Las 5 de arriba no entran. Combiná:
  - Regla 1: `bienenhaus.com.ar/css/*` + `bienenhaus.com.ar/js/*` + `bienenhaus.com.ar/fonts/*` (un solo rule con múltiples settings)
  - Regla 2: `bienenhaus.com.ar/images/*`
  - Regla 3: `bienenhaus.com.ar/manifest.json`
- **No crear regla para HTML** (`/`, `/venta`, `/admin`) — esas deben ser dinámicas
- **No crear regla para `/api/*`** — necesitan sesión
- **No crear regla para `/service-worker.js`** — ya tiene `Cache-Control: no-cache`

## Comprobación post-configuración

```bash
# Debería mostrar: cf-cache-status: HIT (después de 2 requests)
curl -sI https://bienenhaus.com.ar/css/styles.min.css | grep cf-cache
curl -sI https://bienenhaus.com.ar/js/utils.min.js | grep cf-cache
```
