# CHANGELOG — Bienenhaus Propiedades

---

## Versión Actual — 2.0.0 (Junio 2026)

### Agregado

- **Tasaciones ACM v10/10**: Unique constraint `appraisal_request_id`, PDF export con columnas correctas (`coeficiente_ajuste`, `valor_m2_ajustado`), `destino_map` extendido, filtro de búsqueda con debounce 300ms en frontend + backend `ilike` en 5 campos
- **23 tests nuevos**: Tasacion routes, extract-url, from-request, CSV export, appraisal search. Total: 193 tests, 0 failures.
- **Health check scraper**: Script CLI `scripts/check_scrapers.py` con alerta webhook, endpoint métricas `/api/appraisals/scraper-stats` con auto-reset 1h
- **Timeout configurable**: `SCRAPER_TIMEOUT` env var (default 30s)
- **Métricas de scraper**: Éxito/fracaso/timeout/listing_invalid por scraper con thread lock
- **Extracción Gemini unificada**: responseSchema nativo en `extraction/gemini.py`, API key via header `X-Goog-Api-Key`
- **Validación listing**: `es_listing_valido()` en `BaseScraper` rechaza search/404

### Mejoras

- **Auto-atributos**: Ya no sobreescriben valores manuales (solo auto-calcula si el campo está vacío o `equivalente`)
- **CSV export**: columnas ahora usan `coeficiente_ajuste`/`valor_m2_ajustado` (no `_coef`/`_ajustado`)
- **ZonaProp/ML regex**: `__INITIAL_STATE__` anclada al nombre de variable + `;`
- **CSRF monkeypatch fix**: `test_homologacion.py` usa import diferido para no capturar `csrf_protect` original durante colección pytest
- **MercadoLibre scraper**: OG tags como fallback, age→year, baños con ñ
- **Argenprop scraper**: age→year, baños con ñ, selectores precio reordenados

### Integraciones

- **MercadoLibre OAuth**: Botón "Conectar con MercadoLibre" en admin + endpoint `/api/portals/ml/auth-url`
- **Solicitudes → Tasaciones**: FK `appraisal_request_id`, endpoint `POST /api/appraisals/from-request/<rid>`, botón "Crear tasación" en solicitudes
- **Webhooks**: Slack/Telegram/Discord en fallo de publicación y posteo social agotado
- **Social**: Facebook e Instagram, AI describer, worker daemon, webhook Meta

### Fixes

- Paso 2: eliminar doble publicación, ocultar social en rentals, errores por nombre
- Video URL: YouTube, Vimeo, mp4 directo en formulario + detalle
- Stuck items en `processing` >5 min se recuperan automáticamente
- `_enqueue_to_active_portals` con try/except por portal + logging + webhook

---

## 1.0.0 — Producción Inicial (Mayo 2025)

### Agregado

- **ACM (Análisis Comparativo de Mercado)**: Sistema completo de tasaciones con comparables, 6 factores de homologación (ubicación, mantenimiento, antigüedad, habitaciones, estacionamiento, comodidades), cálculo automático con coeficiente [0.70, 1.30], valor estimado USD/ARS/UVAs
- **Extracción automática de URLs**: Scrapers para MercadoLibre, ZonaProp, Argenprop con gemini-2.5-flash como fallback
- **Portal publishing**: Adaptador MercadoLibre (REST API + OAuth 2.0) y ZonaProp (XML feed + SFTP), cola con retry exponencial y DLQ
- **Dashboard admin**: Estadísticas con cache 5 min, propiedades por estado, top vistas, tendencias 30 días
- **PWA**: Service Worker con 4 caches, manifest, offline fallback, push notifications (VAPID)
- **SEO**: OG tags + Twitter Cards server-side, JSON-LD, sitemap dinámico, robots.txt
- **Seguridad**: CSP con nonces, CSRF multi-token, rate limiting, session timeout 30min, roles (admin/editor/viewer), bcrypt passwords, SSRF validation, Fernet encryption, mass-assignment protection
- **Notificaciones**: Email SMTP (contacto + auto-reply + tasación), Web Push, Webhooks (Slack/Telegram/Discord)
- **CRM básico**: Contact messages + Appraisal Requests con seguimiento
- **CI/CD**: GitHub Actions + Render auto-deploy + Playwright E2E tests
- **Docker**: Dockerfile multi-stage + docker-compose (Redis + PostgreSQL + App)

### Mejoras

- Refactor: SQLAlchemy 2.0 `Session.get()`, eliminados `datetime.utcnow` warnings
- Refactor: auth routes a `routes/auth.py`, view tracking a `routes/views.py`, backup a `routes/backup.py`
- Refactor: admin SPA con bundle concatenado (11 JS files → `admin-bundle.min.js`)
- Performance: `load_only` en listados, índices DB, cache scraper 5min TTL
- Frontend: vanilla JS responsive, CSS component system (badge, button, card, grid, input, modal, table, toast)
- PDF: folleto descargable con jsPDF + html2canvas, reporte ACM profesional

---

## 0.9.0 — Beta (Marzo 2025)

### Agregado

- Cloudinary integration para imágenes
- Leaflet maps con geocoding
- Portal worker CLI + flask command
- Comparador de propiedades (hasta 3)
- Galería interactiva con lightbox
- Sitemap.xml dinámico
- PWA offline fallback
- Multi-usuario con roles
- CSRF multi-tab
- Redis rate limiting

### Fixes

- CSP connect-src para CDNs y mapas
- Login lockout y política de contraseñas
- Service Worker cache invalidation
- PostgreSQL migration con check de columnas existentes

---

## 0.5.0 — Alpha (Enero 2025)

### Agregado

- Flask factory + SQLAlchemy ORM + Alembic migrations
- CRUD propiedades (venta) y alquileres
- Panel admin con login
- Formulario de contacto + email notifications
- Agentes inmobiliarios
- Dashboard básico
- Hosting en Render

### Fixes

- Migraciones reales con Flask-Migrate
- Imágenes responsivas con srcset
- Anti-spam (honeypot + timestamp + rate limit)

---

## 0.1.0 — Inicial (Diciembre 2024)

- Setup inicial del proyecto Flask
- Modelos: Property, Agent, Rental, Settings
- Frontend: index.html básico, admin.html mínimo
- Despliegue manual en Render
