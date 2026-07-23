# ROADMAP — Bienenhaus Propiedades

Basado en el estado actual del código, la deuda técnica detectada y los módulos parciales/no implementados.

---

## Corto Plazo (1-2 meses)

### CRM Básico

| Aspecto | Detalle |
|---------|---------|
| Impacto | Alto |
| Esfuerzo | Medio (2-3 semanas) |
| Prioridad | **Crítica** |

**Motivación:** Los formularios de contacto y solicitudes de tasación son leads sin seguimiento estructurado. No hay pipeline de ventas ni asignación a agentes.

**Qué implementar:**
- Modelo `Lead` con campos: nombre, email, teléfono, origen (contacto/tasacion/propiedad), propiedad_id, agente_asignado, estado (nuevo/contactado/en_seguimiento/cerrado/perdido), notas, historial de interacciones
- Migración + endpoints CRUD
- Panel en admin para gestionar leads (kanban o tabla)
- Notificación al agente asignado vía email/webpush
- Conversión automated: cuando llega un contacto o tasación, se crea un Lead automáticamente

### Notificación de Dead Letter Queue

| Aspecto | Detalle |
|---------|---------|
| Impacto | Alto |
| Esfuerzo | Bajo (2-3 días) |
| Prioridad | **Alta** |

**Motivación:** Items en DLQ quedan invisibles hasta que alguien revisa la UI. Se pierden propiedades no publicadas.

**Qué implementar:**
- Webhook/email alert cuando un item alcanza max_retries
- Resaltar visualmente items en DLQ en el panel de colas

### Sincronización ML Bidireccional

| Aspecto | Detalle |
|---------|---------|
| Impacto | Alto |
| Esfuerzo | Medio (1-2 semanas) |
| Prioridad | **Alta** |

**Motivación:** Actualmente `sync_bidirectional()` importa de ML a Bienenhaus, pero sin `--bidirectional` los cambios en Bienenhaus no se reflejan automáticamente en ML.

**Qué implementar:**
- Cron job o worker programado para sync automático (ej. cada 30 min)
- Detección de cambios: comparar `updated_at` local vs ML
- Sincronización inversa: cambios locales → ML API
- Reconciliación de conflictos (gana el más reciente)

---

## Mediano Plazo (3-6 meses)

### Tests Faltantes

| Aspecto | Detalle |
|---------|---------|
| Impacto | Alto |
| Esfuerzo | Medio (2-3 semanas) |
| Prioridad | **Alta** |

**Motivación:** ~50% del código backend no tiene tests. Properties CRUD, Rentals CRUD, Auth, Uploads, Settings, Stats, Map, Backup no están cubiertos.

**Qué implementar:**
- Tests para routes de properties y rentals (CRUD, filtros, status change)
- Tests para auth (login, lockout, roles, CSRF)
- Tests para uploads y settings
- Tests para stats endpoint
- Tests para map y backup

### Type Hints

| Aspecto | Detalle |
|---------|---------|
| Impacto | Medio |
| Esfuerzo | Alto (1-2 meses completo, 1 semana parcial) |
| Prioridad | **Media** |

**Motivación:** El código backend carece de type hints. Dificulta mantenimiento, detección temprana de errores y DX.

**Qué implementar:**
- Agregar type hints progresivamente, empezando por models y routes principales
- Configurar myr ou pyright en CI

### Cache Distribuida

| Aspecto | Detalle |
|---------|---------|
| Impacto | Medio |
| Esfuerzo | Bajo (3-5 días) |
| Prioridad | **Media** |

**Motivación:** La cache de scrapers en memoria es inconsistente entre workers de gunicorn.

**Qué implementar:**
- Migrar scraper cache de dict in-process a Redis
- Usar Redis también para rate limiting (actualmente memory por defecto)

### Argenprop Adapter (Publicación)

| Aspecto | Detalle |
|---------|---------|
| Impacto | Alto (si se necesita publicar allí) |
| Esfuerzo | Alto (3-4 semanas) |
| Prioridad | **Baja** (depende de necesidad comercial) |

**Motivación:** Actualmente solo hay scraper para Argenprop. No hay adapter de publicación.

**Qué implementar:**
- Investigar API de Argenprop o mecanismo de feed
- Implementar `ArgenpropAdapter` similar a `ZonaPropAdapter` o `MercadoLibreAdapter`
- Integrar con queue service

---

## Largo Plazo (6-12 meses)

### Automatizaciones y Reglas de Negocio

| Aspecto | Detalle |
|---------|---------|
| Impacto | Alto |
| Esfuerzo | Alto (2-3 meses) |
| Prioridad | **Media** |

**Motivación:** No hay automatizaciones. Todo es manual.

**Qué implementar:**
- Motor de reglas configurables (ej. "si propiedad lleva 30 días publicada y tiene >100 vistas, aumentar precio 5%")
- Recordatorios automáticos (ej. "seguimiento a lead si no hubo contacto en 7 días")
- Campañas de email automáticas (reactivación de leads, propiedades similares)
- Workflows: al cambiar estado de propiedad → acciones automáticas (publicar en redes, notificar leads interesados, etc.)

### Panel de Insights de Mercado

| Aspecto | Detalle |
|---------|---------|
| Impacto | Medio |
| Esfuerzo | Alto (2-3 meses) |
| Prioridad | **Baja** |

**Motivación:** No hay análisis de mercado más allá de las tasaciones ACM.

**Qué implementar:**
- Precio promedio por barrio/tipo con histórico
- Tendencias de oferta y demanda
- Alertas de mercado (subidas/ bajadas significativas)
- Reportes exportables

### App Móvil para Agentes

| Aspecto | Detalle |
|---------|---------|
| Impacto | Alto |
| Esfuerzo | Muy alto (4-6 meses) |
| Prioridad | **Baja** |

**Motivación:** La PWA es funcional pero los agentes en campo necesitan app nativa.

**Qué implementar:**
- App Flutter o React Native
- Notificaciones push
- Cámara para fotos de propiedades
- GPS para geolocalización
- Offline-first

### SaaS / Multi-tenant

| Aspecto | Detalle |
|---------|---------|
| Impacto | Alto |
| Esfuerzo | Muy alto (4-6 meses) |
| Prioridad | **Baja** |

**Motivación:** Si se planea ofrecer Bienenhaus como servicio a múltiples inmobiliarias, se necesita multi-tenant.

**Qué implementar:**
- Aislación por tenant (esquema separado o `tenant_id` en cada tabla)
- Panel de administración multi-tenant
- Facturación y planes
- Onboarding automatizado

---

## Resumen de Prioridades

| Prioridad | Item | Esfuerzo |
|-----------|------|----------|
| 🔴 Crítica | CRM básico | 2-3 semanas |
| 🔴 Alta | Notificación DLQ | 2-3 días |
| 🔴 Alta | Sync ML bidireccional | 1-2 semanas |
| 🟡 Alta | Tests faltantes | 2-3 semanas |
| 🟡 Media | Type hints | 1-2 meses |
| 🟡 Media | Cache Redis | 3-5 días |
| 🟢 Baja | Argenprop adapter | 3-4 semanas |
| 🟢 Baja | Automatizaciones | 2-3 meses |
| 🟢 Baja | Insights mercado | 2-3 meses |
| 🟢 Baja | App móvil | 4-6 meses |
| 🟢 Baja | SaaS multi-tenant | 4-6 meses |
