# AGENTS.md — Bienenhaus Propiedades

## Stack
- **Backend**: Python 3.12, Flask 3.0, SQLAlchemy 3.1, PostgreSQL/SQLite
- **Frontend**: Vanilla JS (sin framework), CSS puro responsive, PWA
- **Testing**: pytest (backend), Playwright (E2E frontend)
- **Build**: npm (terser para JS, postcss para CSS)
- **Infra**: Render.com, GitHub Actions, Docker

## Convenciones

### Backend
- Blueprints en `backend/routes/`, cada uno con su `bp = Blueprint(...)`
- Modelos en `backend/models.py` (18 modelos SQLAlchemy)
- Usar `_ok(data)` y `_err(msg, code)` de `utils.py` para respuestas JSON
- CSRF: enviar `X-CSRF-Token` header en toda mutación (GET excluido)
- Sesión: `session['admin']`, `session['role']`, `session['user_id']`
- Seed de admin: `ADMIN_PASSWORD` env var → `seed_admin_user()` en `auth_helper.py`

### Frontend
- `admin.html` es SPA: toda la navegación es JS, sin recarga de página
- Los formularios del admin se generan dinámicamente vía JS (innerHTML en modales)
- Cada tab del admin tiene un loader (ej: `loadMessages()`, `renderSettings()`)
- `switchTab()` mapea data-tab → ID de sección (actualizar mapa al agregar tabs)
- Los filtros del admin usan `data-action` para event delegation

### CSS
- Sistema de variables CSS en `:root` (ver `styles.css` o `admin.css`)
- Prefijo `admin-` para clases del panel admin
- Responsive mobile-first: breakpoints en 768, 600, 480, 414, 360, 320
- No usar `!important` salvo excepciones documentadas
- Preferir clases a inline styles (especialmente en `admin.html`)

### Testing — 3 suites obligatorias
```bash
# Suite 1: Backend (303 tests)
cd backend && python -m pytest

# Suite 2: Frontend E2E dynamic (39 tests) — requiere Flask corriendo
cd frontend && python tests/test_pages.py

# Suite 3: Frontend admin audit (17 checks) — require Flask corriendo
cd frontend && python tests/test_admin_audit.py

# Build assets (después de cambios en JS/CSS)
cd frontend && npm run build
```

**Regla**: después de cualquier cambio en JS/CSS del admin, correr las 3 suites completas. El audit de 17 checks (visibilidad estática) + pages E2E 39 (contenido dinámico) dan cobertura complementaria: audit detecta errores de consola/API, E2E detecta loaders rotos y formularios rotos.

### Admin Credentials (desarrollo)
- Usuario: `admin`
- Pass: `Admin123!` (configurable vía `ADMIN_PASSWORD`)

### Base de datos
- Producción: PostgreSQL (configurado en `.env` como `DATABASE_URL`)
- Tests: SQLite (`test_e2e.db`)
- Reset: `flask db-clean` (borra todo y recrea con admin por defecto)
- Migraciones: `flask db migrate` + `flask db upgrade`
- Backup automático: 3am UTC via Render Cron Job (`render.yaml`)
- Backup manual: `flask db-backup` (descubre automáticamente los 54 modelos via SQLAlchemy registry)
- Módulo Bajas (baja_request.py + test_baja.py) está WIP: 16 tests excluidos de la suite. Pendiente de registrar modelo en `models/__init__.py` + commit de archivos trackeados. Se espera que vuelva en próximo sprint.
- Restore: `flask db-restore` con topological sort por FK dependencies
- Almacenamiento: Cloudinary (raw), retención 30 días
- Verificación: `flask db-backup-verify <url>` comprueba integridad + mapeo de modelos

### CLI Útil
```bash
flask db-clean          # Reset completo + seed admin
flask db-setup          # Migraciones + seed
flask db-backup         # Backup completo (54 modelos) a Cloudinary
flask db-backup --no-upload  # Backup local sin subir
flask db-restore <url>  # Restaurar desde Cloudinary URL
flask db-restore --dry-run <file>  # Previsualizar restauración
flask db-backup-verify <url>  # Verificar integridad de un backup
flask ml-sync           # Sincronizar MercadoLibre
python portal_worker.py # Worker de cola de portales
python start_social_worker.py  # Worker de redes sociales
```

## Estructura Clave
```
backend/
├── app.py              # Factory + CLI + health check
├── models.py           # Todos los modelos SQLAlchemy
├── routes/             # 21 blueprints (auth, properties, appraisals, crm, etc.)
├── portals/            # Adaptadores ML/ZonaProp + queue
├── social/             # Facebook/Instagram + worker
├── scrapers/           # ML, ZonaProp, Argenprop
└── tests/              # 154 tests

frontend/
├── admin.html          # SPA del panel de administración
├── js/
│   ├── admin-core.js   # Init, login/logout, tab switching, settings
│   ├── admin-crud.js   # CRUD propiedades, alquileres, agentes
│   ├── admin-crm.js    # CRM pipeline (kanban + tabla)
│   ├── admin-appraisals.js  # Tasaciones ACM
│   ├── admin-messages.js    # Mensajes de contacto
│   ├── admin-portals.js     # Portales + publicaciones
│   ├── admin-users.js       # Gestión de usuarios
│   ├── admin-settings.js    # Configuración del sitio
│   ├── admin-shared.js      # Funciones compartidas (renderComparableCardsShared)
│   └── admin-bundle.min.js  # Bundle minificado
├── css/
│   ├── admin.css        # Estilos del panel admin
│   ├── styles.css       # Estilos del sitio público
│   └── *.min.css        # Versiones minificadas
└── tests/
    └── test_pages.py    # 39 tests E2E Playwright

## Bugs — Historial de fixes

| Estado | Bug | Fix | Fecha |
|--------|-----|-----|-------|
| ✅ Cerrado | PDF crash | `const c` → `tipoCfg`, `disclaimer` → `.join(' ')` | Jul 2026 |
| ✅ Cerrado | `_currentTasacion` null + doble listener | Script duplicado removido + clases únicas + guards de visibilidad | Jul 2026 |
| ✅ Cerrado | `_currentAppraisal` contaminado | `_currentAppraisal = null` en `openTasacionDetail` (line 246) + bundle regenerado | Jul 2026 |
| ✅ Cerrado | TDZ `setVal` en bundle | `const setVal` → `function setVal` (hoisted) en ambos archivos + bundle regenerado | Jul 2026 |
| ✅ Cerrado | Bootstrap frágil — seed_admin_user solo corría en DB vacía | `app.py`: `seed_admin_user()` ahora corre siempre al iniciar, no solo si no hay tablas. `auth_helper.py`: logging en exception handler | Jul 2026 |
| ✅ Cerrado | Sin test CSRF | Nuevo `backend/tests/test_csrf_flow.py` (6 tests: login devuelve token, endpoint refresca, POST sin token → 403, POST con token → OK, token reusado → 403, GET sin token → OK) | Jul 2026 |
| ✅ Cerrado | Sin monitoreo de errores frontend | Nuevo `backend/models/client_error.py` (tabla `client_errors`), POST `/api/client-errors` persiste en DB, GET `/api/client-errors` paginado (admin), sección "Errores del Frontend" en tab Actividad | Jul 2026 |
| ✅ Cerrado | Duplicación renderComparableCards | Nuevo `frontend/js/admin-shared.js` con `renderComparableCardsShared()`. Appraisals y Tasaciones ahora delegan a la misma función con config (prefix, getTipoFn). ~80 líneas eliminadas de cada archivo | Jul 2026 |

### P3 — Listener frágil e.target.id (baja prioridad — pendiente)
Uso de `e.target.id` en event delegation sin verificar que `e.target` existe.

### Notas
- `admin-shared.js` se concatena en el bundle ANTES de `admin-appraisals.js` y `admin-tasaciones.js`
- Para agregar la tabla `client_errors` en PostgreSQL: `flask db migrate -m "add client_errors table"` + `flask db upgrade`
- `seed_admin_user()` se ejecuta siempre al iniciar la app (no solo en DB vacía)
```
