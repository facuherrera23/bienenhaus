# PROJECT STATUS — Bienenhaus Propiedades

**Fecha:** Junio 2026
**Head:** `8c6bee1`
**Tests:** 193/193 passing
**Database:** PostgreSQL (prod) / SQLite (dev)
**Migraciones:** 22, head único: `b8c9d0e1f2a3`

---

## Estado General

| Indicador | Valor |
|-----------|-------|
| Avance estimado global | **85%** |
| Madurez del proyecto | **Producción empresarial** |
| Riesgos principales | Argenprop solo scraping (sin publicación), ML sync unilateral, sin CRM |
| Propiedades en base | Gestionable via admin |
| Portales activos | MercadoLibre (REST OAuth), ZonaProp (XML + SFTP) |
| Extracción funcional | ML, ZonaProp, Argenprop |
| Tests | 193, 0 failures |
| Cobertura funcional estimada | **~80%** del core inmobiliario |

---

## Módulos

### 1. Gestión de Propiedades (Venta)

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | CRUD completo, imágenes (Cloudinary), geolocalización, video, vistas diarias/totales, similares, imprimir, archivar, status workflow (disponible/vendida/oculta) |
| Pendientes | — |
| Dependencias | Cloudinary, Leaflet/OSM |
| Riesgos | Bajo |

### 2. Gestión de Alquileres

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | CRUD completo, mismas capacidades que propiedades + precio ARS, expensas, amoblado, meses mínimos |
| Pendientes | — |
| Riesgos | Bajo |

### 3. Agentes Inmobiliarios

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | CRUD, licencia, especialidad, WhatsApp, avatar |
| Pendientes | — |
| Riesgos | Bajo |

### 4. Dashboard y Estadísticas

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | Propiedades por estado, precio promedio, días en mercado, top vistas, price range, por ubicación, por tipo, tendencias 30 días, stats agentes, conversiones contacto, rentals stats. Cache 5 min |
| Pendientes | — |
| Riesgos | Bajo |

### 5. Autenticación y Roles

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | Login con rate-limit y lockout, logout, session check, CSRF token, cambio password, 3 roles (admin/editor/viewer) con jerarquía, seed admin |
| Pendientes | — |
| Riesgos | Bajo |

### 6. Gestión de Usuarios

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | CRUD usuarios, protección self-delete y último admin |
| Pendientes | — |
| Riesgos | Bajo |

### 7. Publicación MercadoLibre

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | OAuth 2.0 completo, publish/update/unpublish via REST API, refresh token con advisory lock, categorización, imágenes, atributos, listing types, manejo de errores con Sentry |
| Pendientes | — |
| Dependencias | MercadoLibre API |
| Riesgos | Medio — dependencia externa, cambios en API de ML |

### 8. Publicación ZonaProp

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | Feed XML generado dinámicamente, SFTP upload via paramiko, dirty flag, endpoint público de feed con rate-limit |
| Pendientes | — |
| Dependencias | SFTP server de ZonaProp |
| Riesgos | Medio — SFTP puede cambiar, feed XML depende de especificación ZonaProp |

### 9. Colas y Dead Letter Queue

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | Enqueue multientity, dequeue con `SELECT FOR UPDATE SKIP LOCKED`, retry exponencial (5 máx), DLQ, recuperación de stuck items, worker CLI con watch mode, métricas de cola |
| Pendientes | — |
| Riesgos | Bajo |

### 10. Tasaciones ACM

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | Creación con 60+ campos (propiedad, construcción, barrio, instalaciones, servicios, comodidades), comparables con 6 factores de homologación, cálculo automático, CSV export, PDF-ready report, versionado con snapshots, logs de auditoría, geolocalización, archivar/restaurar, crear desde solicitud pública |
| Pendientes | — |
| Riesgos | Bajo |

### 11. Extracción Automática de Datos

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | 3 scrapers (ML, ZonaProp, Argenprop) con validación de listing, fallback Gemini IA con responseSchema y Google Search Grounding, cache en memoria (5 min, 500 entries), retry 3 intentos, timeout configurable, métricas de éxito/fracaso, health check script |
| Pendientes | — |
| Dependencias | Gemini API, Cloudscraper |
| Riesgos | Medio — scrapers HTML frágiles a cambios de portal |

### 12. Redes Sociales (Facebook/Instagram)

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | Publicación en Facebook Page e Instagram Business (single + carrusel), programación de posts, descripciones IA (Gemini), worker daemon, webhook Meta Platform, retry con DLQ |
| Pendientes | — |
| Dependencias | Facebook Graph API v21.0, Gemini API |
| Riesgos | Medio — cambios en Graph API, rate limits de Meta |

### 13. Notificaciones

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | Email SMTP (contacto, auto-reply, tasación), Web Push VAPID (auto-limpieza 410), Webhooks Slack/Telegram/Discord (auto-detección plataforma), Push navegador para nuevas solicitudes |
| Pendientes | — |
| Riesgos | Bajo |

### 14. PWA

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | Service Worker con 4 caches, precarga 16 assets, stale-while-revalidate, offline.html, manifest standalone, iconos |
| Pendientes | — |
| Riesgos | Bajo |

### 15. SEO

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | OG tags + Twitter Cards server-side, JSON-LD por propiedad/alquiler, sitemap.xml dinámico, robots.txt |
| Pendientes | — |
| Riesgos | Bajo |

### 16. Seguridad

| Aspecto | Valor |
|---------|-------|
| Estado | **Completo** |
| Avance | 100% |
| Funcionalidades | CSP con nonces, CSRF multi-token, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy, bcrypt passwords, rate limiting, session timeout 30min, SSRF validation, Fernet encryption para credenciales, mass-assignment protection, CSV injection prevention |
| Pendientes | Auditoría de seguridad externa, pentest |
| Riesgos | Bajo — buenas prácticas implementadas |

### 17. Sincronización MercadoLibre

| Aspecto | Valor |
|---------|-------|
| Estado | **Parcial** |
| Avance | ~70% |
| Funcionalidades | Importa propiedades desde ML a DB local (paginación, mapeo categorías), manejo de token expirado |
| Pendientes | Sincronización bidireccional completa (ML → Bienenhaus + Bienenhaus → ML), reconciliación de cambios, sync automático programado |
| Dependencias | ML API, Portal config |
| Riesgos | Medio — importación unilateral, no hay sync inverso automático |

### 18. CRM / Prospectos

| Aspecto | Valor |
|---------|-------|
| Estado | **No implementado** |
| Avance | 0% |
| Funcionalidades | — |
| Pendientes | Pipeline de prospectos, seguimiento de leads, historial de interacciones, asignación a agentes, automatizaciones de seguimiento |
| Riesgos | Alto — no hay CRM, los leads de contacto/tasación no tienen seguimiento |

### 19. Automatizaciones

| Aspecto | Valor |
|---------|-------|
| Estado | **No implementado** |
| Avance | 0% |
| Funcionalidades | — |
| Pendientes | Recordatorios automáticos, campañas de email, follow-ups programados, reglas de negocio configurables |
| Riesgos | Medio |

---

## Problemas Detectados

### Riesgos Técnicos

1. **Scrapers frágiles** — Los 3 scrapers dependen de HTML/JSON estructurado de los portales. Cambios en el markup de ML, ZonaProp o Argenprop pueden romper la extracción. Mitigación: Gemini como fallback, métricas de monitoreo, health check script.

2. **Argenprop sin API de publicación** — Solo hay scraper, no hay adapter para publicar propiedades en Argenprop. Si se necesita publicar allí, hay que desarrollar el adapter desde cero.

3. **Sincronización ML unilateral** — `sync_bidirectional()` importa de ML a Bienenhaus, pero sin `--bidirectional` no hay proceso inverso automático. Si se modifica una propiedad en Bienenhaus, no se refleja automáticamente en ML (solo via queue manual).

4. **Sin CRM** — No hay pipeline de ventas. Los formularios de contacto y solicitudes de tasación caen en bandejas sin seguimiento estructurado. No hay asignación a agentes ni historial de interacciones.

5. **Sin logging estructurado centralizado** — Los logs van a stdout. Sentry captura excepciones, pero no hay agregación de logs de aplicación (no hay Loki, DataDog, etc.).

6. **Cache de scrapers en memoria** — La cache de 5 min con 500 entries está en memoria del proceso. Con múltiples workers de gunicorn, cada worker tiene su propia cache (inconsistente entre workers). Para producción con >2 workers, convendría Redis.

7. **Dead Letter Queue sin notificación automática** — Los items que llegan a DLQ (5 retries fallidos) quedan en la cola pero no disparan una alerta. Solo se ven en la UI de admin.

### Deuda Técnica

1. **Falta de type hints** — El código backend no usa type hints de forma consistente. Dificulta el mantenimiento y la detección de errores.

2. **Vanilla JS sin framework** — El frontend admin es una SPA hecha con vanilla JS. Funciona, pero es difícil de mantener a medida que crece. La bundle manual (concat + terser) es frágil.

3. **admin-bundle.js en VCS** — El bundle generado se commitea. Debería generarse en CI.

4. **CSV injection prevention por prefijo `'`** — Aunque funcional, usar tabulador (`\t`) es más estándar.

5. **Test coverage incompleto** — Faltan tests para routes de properties, rentals, auth, uploads, settings, stats, map, backup, push. Los 193 tests existentes cubren principalmente seguridad, scrapers, colas, homologación y tasación.

### Cobertura de Tests

| Área | Tests |
|------|-------|
| Seguridad (SSRF, XSS, mass assignment, encryption) | ~25 |
| Colas / DLQ / OAuth ML / ZP feed | ~25 |
| Scrapers (ML, ZP, AP) | ~25 |
| Homologación ACM | ~8 |
| Tasación / extract-url / from-request / CSV / search | ~23 |
| Métricas scraper | ~10 |
| Social (models, services, worker, webhook) | ~15 |
| Varios (CSV safe, Gemini key, startup) | ~9 |
| **Sin cobertura** | Properties CRUD, Rentals CRUD, Auth, Uploads, Settings, Stats, Map, Backup, Portal publications, Push subscriptions |

---

## Próximos Pasos Recomendados

### Prioridad Alta (Impacto crítico)

1. **CRM básico** — Pipeline de prospectos con seguimiento desde formulario de contacto y solicitudes de tasación. Asignación a agentes, historial de interacciones, estados (nuevo/contactado/en seguimiento/cerrado/perdido).

2. **Sync ML bidireccional** — Sincronización automática programada entre Bienenhaus y ML (cambios en Bienenhaus → ML, cambios en ML → Bienenhaus).

3. **Notificación DLQ** — Alerta vía webhook/email cuando un item llega a DLQ.

### Prioridad Media (Mejora continua)

4. **Cobertura de tests** — Agregar tests para los módulos sin cobertura (properties, rentals, auth, uploads, settings, stats, map).

5. **Type hints** — Agregar type hints al backend.

6. **Migrar cache a Redis** — Para consistencia entre workers de gunicorn.

### Prioridad Baja (Calidad de vida)

7. **Build frontend en CI** — Generar admin-bundle.min.js en CI en vez de committearlo.

8. **Argenprop adapter** — Si se necesita publicar en Argenprop.

9. **App mobile** — PWA actual es funcional, pero una app nativa (Flutter/React Native) podría ser necesaria para agentes en campo.
