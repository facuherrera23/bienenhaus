# DEPENDENCY_CHECK.md — utils.js

## 1. Orden de carga en todos los HTML

### landing repo (`bienenhaus-landing/`)

| Página | Orden de scripts |
|--------|------------------|
| `index.html` | `utils.js` → `api.min.js` → `properties.js` → `agents.min.js` → `comparador.min.js` → `main.min.js` |
| `venta.html` | `utils.js` → `api.min.js` → `properties.js` → `comparador.min.js` → `venta-ui.min.js` → `mapa.min.js` |
| `propiedad.html` | `utils.js` → `api.min.js` → `detalle.js` |
| `alquiler.html` | `utils.js` → `api.min.js` → `rentals.js` → `rentals-ui.min.js` → `mapa.min.js` |
| `admin.html` | `utils.js` → `admin-bundle.min.js` (incluye `api.js`, `admin-core.js`, etc.) → `pdf-brochure.js` → `pdf-appraisal.js` |
| `404.html` | `utils.js` → `api.min.js` → `main.min.js` |
| `offline.html` | `utils.js` → `offline.min.js` |

### backend repo (`bienenhaus/frontend/`)

Mismo orden, pero usando `utils.min.js` en lugar de `utils.js` y rutas `/js/` en lugar de `/bienenhaus-landing/js/`.

**✅ utils.js SIEMPRE carga primero**, antes de cualquier script que consuma sus funciones.

## 2. Funciones expuestas y dependencias detectadas

### `window.formatPrice(val, currency)`

| Archivo consumidor | Línea | Código | Páginas |
|-------------------|-------|--------|---------|
| `comparador.js` (ambos) | 8 | `window.formatPrice(n, 'ARS')` en `fmtCmp()` | index, venta |
| `main.js` (ambos) | 11 | `window.formatPrice(n, 'ARS')` en `fmtPriceARS()` | index |
| `detalle.js` (backend) | 55, 390, 400 | `window.formatPrice(item.price_ars, 'ARS')` | propiedad |

### `window.formatDateShort(val)`

| Archivo consumidor | Línea | Código | Páginas |
|-------------------|-------|--------|---------|
| `admin-appraisals.js` (ambos) | 79/80 | `window.formatDateShort(a.updated_at)` | admin |

### `window.formatDateTime(val)`

| Archivo consumidor | Línea | Código | Páginas |
|-------------------|-------|--------|---------|
| `admin-tasacion-requests.js` (ambos) | 54/77 | `window.formatDateTime(r.created_at)` | admin |

### `window.showSkeleton(containerId, type, count)`

| Archivo consumidor | Línea | Código | Páginas |
|-------------------|-------|--------|---------|
| `detalle.js` (landing) | 604 | `window.showSkeleton($('detalleLoading'), 'detail')` | propiedad |

### `window.emptyStateHTML(msg, sub)`

| Archivo consumidor | Línea | Código | Páginas |
|-------------------|-------|--------|---------|
| `main.js` (landing) | ~160 | `window.emptyStateHTML('Sin resultados', '...')` | index |

### `window.skeletonGrid(count)` y `window.skeletonDetail()`

Definidas en `utils.js` pero consumidas indirectamente por `showSkeleton()`.

## 3. Funciones NO consumidas actualmente

| Función | Estado |
|---------|--------|
| `formatPriceShort` | Definida, sin consumidores actuales |
| `formatDate` (directa) | No se llama directo; se usan `formatDateShort` y `formatDateTime` |
| `errorStateHTML` | Definida, sin consumidores actuales |
| `hideSkeleton` | Definida, sin consumidores actuales |
| `showEmpty` | Definida, sin consumidores actuales |
| `showError` | **Eliminada de utils.js** — `api.js` es el único proveedor |

## 4. Dependencia `_esc()` — corregida

### Problema detectado
`emptyStateHTML()` y `errorStateHTML()` usaban `esc()` (función global). `esc()` no está garantizada como global — en `detalle.js` es `const esc`, en `comparador.js` está dentro de una IIFE.

### Solución
`utils.js` ahora define su propia `_esc()` privada:
```js
function _esc(v) {
  return String(v ?? '').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
```
Todas las referencias internas usan `_esc()` en lugar de `esc()`.

**✅ utils.js no depende de nada externo.**

## 5. Conflicto `showError` — resuelto

`api.js` define `window.showError()` que sobrescribe cualquier definición previa. Como siempre carga después de `utils.js`, la versión de `api.js` gana. Se eliminó la definición duplicada de `showError` de `utils.js` para eliminar la ambigüedad.

**✅ `showError` es provisto únicamente por `api.js`.**

## 6. Resumen de validación

| Verificación | Resultado |
|-------------|-----------|
| utils.js carga primero en todos los HTML | ✅ |
| `_esc()` es autónoma (sin dep externa) | ✅ |
| `showError` sin conflicto (solo en api.js) | ✅ |
| `formatPrice` usado en 3 archivos, disponible en todas las páginas necesarias | ✅ |
| `formatDateShort`/`formatDateTime` usado en admin, disponible vía utils.js | ✅ |
| `showSkeleton` usado en detalle.js (landing), utils.js carga primero | ✅ |
| `emptyStateHTML` usado en main.js, utils.js carga primero | ✅ |
| Minified files regenerados y sincronizados | ✅ |

**No hay riesgos de carga ni dependencias rotas.**
