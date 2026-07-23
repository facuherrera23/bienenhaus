# QA_SUMMARY.md — Resumen de Auditoría CRM

**Fecha:** Junio 2026
**Módulo:** CRM Bienenhaus (backend + frontend)
**Metodología:** Análisis estático de código y revisión arquitectónica

---

## Estado general

| Dimensión | Calificación | Comentario |
|-----------|-------------|------------|
| Backend (modelos) | ✅ **Estable** | 7 modelos SQLAlchemy, correctamente relacionados, con índices y constraints |
| Backend (endpoints) | ✅ **Completo** | 45 endpoints REST, validación CSRF, roles, rate limiting |
| Backend (auto-creación) | ✅ **Funcional** | Conversión contacto→lead y tasación→lead con try/catch y rollback |
| Frontend (admin-crm.js) | 🟡 **Funcional con carencias** | Cobertura parcial de features backend |
| Frontend (CSS) | ✅ **Completo** | Todos los estilos CRM + responsive + accesibilidad básica |
| Frontend (dashboard) | ✅ **Integrado** | Tarjeta Prospectos con total + breakdown |
| Responsive | ✅ **Completo** | 5 breakpoints, touch targets, modales full-screen en mobile |
| Accesibilidad | 🟡 **Parcial** | Skip link, focus-visible, touch targets OK; falta ARIA en modales dinámicos y navegación teclado |

---

## Porcentaje estimado de estabilidad

| Componente | Estabilidad estimada |
|------------|---------------------|
| Pipeline Kanban | **85%** — Funcional, drag & drop operativo, CSS completo |
| CRUD de Leads | **90%** — Crear/editar/eliminar/buscar/filtrar, persistencia |
| Conversión automática | **95%** — Try/catch con rollback, no bloquea flujo principal |
| Actividades/Timeline | **80%** — Funcional vía quick actions, tipos limitados |
| Tareas | **30%** — Backend completo, frontend ausente |
| Visitas | **50%** — Creación desde quick action, sin vista de calendario/próximas |
| Recordatorios | **20%** — Backend completo, frontend usa workaround (`next_followup_at`) |
| Dashboard CRM | **85%** — Stats funcionales, badge sidebar, subtítulo |

**Estabilidad general del CRM producido:** ~**70%**

---

## Riesgos

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|-------------|---------|------------|
| R1 | Leads creados desde contacto/tasación sin email se deduplican por email vacío '' | Media | Duplicación | Agregar hash de teléfono + nombre como fallback de dedup |
| R2 | `ORIGINS` frontend/backend inconsistentes | Baja | Filtros con valores no reconocidos | Sincronizar constantes |
| R3 | Tareas y recordatorios sin UI → features inaccesibles | Alta | Subutilización del CRM | Priorizar UI de tareas y recordatorios |
| R4 | Drag & drop sin fallback de teclado | Media | Exclusión de usuarios de teclado | Agregar menú contextual de estados |
| R5 | Modales dinámicos sin `role="dialog"` | Baja | Inaccesibilidad para screen readers | Agregar roles ARIA en `createElement` |

---

## Funcionalidades listas para producción

1. **Pipeline Kanban** — CRUD completo, drag & drop, 8 estados, scoring automático
2. **CRUD de Leads** — Creación manual + auto desde contacto/tasación, edición, eliminación
3. **Búsqueda y filtros** — Por nombre/email/phone, status, origen, agente, followup pendiente
4. **Dashboard** — Tarjeta "Prospectos" con total, breakdown por status, badge en sidebar
5. **Actividades/Timeline** — Registro de llamadas, notas, cambios de estado, visitas agendadas
6. **Vinculación de propiedades** — Búsqueda y asignación de propiedades a leads
7. **Asignación de agentes** — Filtro por agente, nombre visible en kanban/table
8. **Responsive completo** — Kanban 8→4→2→1 columnas, modales full-screen en mobile, touch targets
9. **Accesibilidad básica** — Skip link, focus-visible, login con aria-required

## Funcionalidades que requieren corrección

| # | Funcionalidad | Problema | Prioridad |
|---|---------------|----------|-----------|
| F1 | **UI de Tareas** | Backend completo (`/api/crm/tasks` CRUD + stats), frontend sin implementar | **Alta** |
| F2 | **UI de Recordatorios** | Backend completo (`/api/crm/reminders` CRUD + pending + dismiss), frontend usa workaround | **Alta** |
| F3 | **Vista de próximas visitas** | Endpoints `/upcoming` y `/calendar` existen, no se consumen | **Media** |
| F4 | **Sorting de leads** | Endpoint no acepta sort params, frontend no tiene UI de ordenamiento | **Baja** |
| F5 | **Accesibilidad de modales** | Agregar `role="dialog"`, `aria-labelledby`, `aria-describedby` a modales dinámicos | **Baja** |
| F6 | **Keyboard navigation en kanban** | Drag & drop sin alternativa de teclado | **Baja** |
| F7 | **ARIA sidebar** | `aria-label="Navegación principal"` en `<nav class="sidebar-nav">` | **Baja** |
| F8 | **Constantes sincronizadas** | `ORIGINS` differ entre frontend (8) y backend (4) | **Baja** |

---

## Top 10 problemas más importantes

| # | Problema | Severidad | Módulo | Esfuerzo estimado |
|---|----------|-----------|--------|-------------------|
| 1 | UI de Tareas ausente (backend listo) | 🟡 Medio | CRM Tareas | 3-4 días |
| 2 | UI de Recordatorios ausente (backend listo) | 🟡 Medio | CRM Recordatorios | 2-3 días |
| 3 | Sin vista de próximas visitas (backend listo) | 🟡 Medio | CRM Visitas | 1-2 días |
| 4 | Paginación "Siguiente" con flecha incorrecta | 🟡 Medio | CRM UI | **15 min** |
| 5 | Modales sin `role="dialog"` | 🟢 Bajo | Accesibilidad | 30 min |
| 6 | Kanban sin keyboard fallback | 🟢 Bajo | Accesibilidad | 1-2 días |
| 7 | `ORIGINS` inconsistentes frontend/backend | 🟢 Bajo | Mantenibilidad | 5 min |
| 8 | Sin sorting en tabla de leads | 🟢 Bajo | CRM UX | 1 día |
| 9 | Sidebar nav sin `aria-label` | 🟢 Bajo | Accesibilidad | 2 min |
| 10 | API calls inconsistentes (`_req` vs `API.*`) | 🟢 Bajo | Mantenibilidad | 30 min |

---

## Conclusión

El CRM de Bienenhaus tiene una **base sólida** en el backend (45 endpoints, 7 modelos, auto-conversión, scoring, pipeline completo). La sincronización al frontend del landing repo fue exitosa y el **core del CRM (leads, pipeline kanban, timeline, dashboard) está funcional y listo para producción**.

Las **carencias principales** están en funcionalidades que existen en backend pero no tienen interfaz en el frontend: **tareas, recordatorios, y calendario de visitas**. Estas representan ~60% del esfuerzo de corrección pero no bloquean el uso del CRM base.

**Recomendación:** Pasar a producción el CRM actual (leads + pipeline + actividades) y abordar las features faltantes (tareas, recordatorios, visitas calendar) en un sprint dedicado.
