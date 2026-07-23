# TASK_ACCEPTANCE_CRITERIA.md

## 1. Flujo completo

### Creación
1. Usuario abre lead detail modal.
2. Click en botón "+ Nueva tarea" dentro de la sección Tareas.
3. Se abre modal con formulario: título (requerido), descripción, prioridad (select), fecha vencimiento (datetime-local), asignado a (select agentes).
4. Usuario completa campos y click "Guardar".
5. `POST /api/crm/tasks` → backend crea Task + LeadActivity `task_created`.
6. Modal se cierra, se refresca la lista de tareas y el timeline.
7. Toast "Tarea creada".

### Edición
1. Usuario click en tarea existente dentro del lead detail modal.
2. Se abre modal pre-poblado con datos actuales.
3. Usuario modifica campos y click "Guardar".
4. `PATCH /api/crm/tasks/:id` → backend actualiza + crea LeadActivity si cambia status.
5. Modal se cierra, se refresca la lista de tareas.
6. Toast "Tarea actualizada".

### Completado
1. Usuario click en checkbox junto a título de tarea pendiente/en_progreso.
2. Confirmación visual inmediata (checkbox checked, card atenuada).
3. `PATCH /api/crm/tasks/:id/complete` → backend setea status='completada', completed_at=now, crea LeadActivity `task_completed`.
4. Card se actualiza para mostrar estado completada (no editable).
5. Timeline se refresca.
6. Toast "Tarea completada".

### Eliminación
1. Usuario click botón ✕ en tarea existente.
2. `confirmModal("¿Eliminar esta tarea?")` se muestra.
3. Si confirma → `DELETE /api/crm/tasks/:id` → backend elimina Task + LeadActivity asociada.
4. Card se remueve de la lista, timeline se refresca.
5. Toast "Tarea eliminada".
6. Si cancela → no ocurre nada.

## 2. Estados permitidos
| Estado | Backend | Frontend |
|--------|---------|----------|
| `pendiente` | Default al crear | Badge gris, checkbox disponible |
| `en_progreso` | Manual via PATCH | Badge azul, checkbox disponible |
| `completada` | Via PATCH o /complete | Badge verde, card atenuada, checkbox checked, no editable |
| `cancelada` | Manual via PATCH | Badge gris oscuro, card atenuada |

## 3. Campos obligatorios y validaciones

| Campo | Tipo | Requerido | Validación Frontend | Validación Backend |
|-------|------|-----------|---------------------|--------------------|
| title | string | Sí | `trim()`, min 1 char | `_strip_html`, not empty |
| lead_id | int | Sí | Siempre pasa desde contexto del lead | Lead.query.get(lid) |
| description | string | No | — | `_strip_html` |
| priority | string | No (default 'media') | Select con opciones válidas | `in_ TASK_PRIORITIES` |
| due_at | datetime | No | input datetime-local | `_parse_dt` |
| assigned_to_id | int | No | Select de `_agents` | FK a Agent |

## 4. Relación exacta con Lead
- **Cada Task pertenece a exactamente un Lead** (lead_id FK, CASCADE, not null).
- Se accede via `GET /api/crm/tasks?lead_id=:id`.
- Se crean desde el contexto del lead detail modal.
- Al crear tarea, backend genera automáticamente `LeadActivity` tipo `task_created`.
- Al completar tarea, backend genera `LeadActivity` tipo `task_completed`.
- Al eliminar tarea, backend elimina `LeadActivity` asociada.
- **No se crean tareas sin lead** — no hay vista global de tareas en esta fase.

## 5. Comportamiento esperado en desktop y mobile

### Desktop (>768px)
- Sección de tareas dentro del lead detail modal en columna derecha.
- Task cards con layout horizontal: checkbox, título, prioridad badge, fecha, acciones.
- Modal de formulario centrado, ancho fijo ~400px.

### Mobile (<768px)
- Modal de lead detail ocupa todo el ancho.
- Sección de tareas fluye naturalmente debajo de otras secciones.
- Task cards apilan elementos verticalmente.
- Modal de formulario ocupa todo el ancho + padding 16px.
- Touch targets mínimos 44×44px (botones).
- Scroll vertical habilitado en modal y lista.

### Muy pequeño (<480px)
- Igual que mobile, con padding reducido.
- Botones de acciones se apilan si es necesario.

## 6. Comportamiento ante errores de API

| Escenario | Código esperado |
|-----------|-----------------|
| Network error (fetch falla) | Toast "Error de conexión" |
| 400 Bad Request | Toast con mensaje del backend |
| 403 CSRF | Reintento automático vía `_req` |
| 404 Task no encontrada | Toast "Tarea no encontrada" |
| 422 lead_id inválido | Toast "Error: lead_id inválido" |
| Timeout | Toast "Error de conexión" |
| Respuesta no-JSON | Toast "Error del servidor" |

## 7. Estados vacíos
- **Lead sin tareas:** mostrar "Sin tareas aún. Creá la primera tarea para este prospecto." + botón "+ Nueva tarea".
- **Lead con tareas todas completadas:** mostrar normalmente, sin mensaje especial.

## 8. Estados de carga (skeletons/spinners)
- Al abrir lead detail modal, la sección de tareas muestra `<div class="loading-state" style="font-size:11px">Cargando tareas...</div>`.
- Al guardar formulario, botón "Guardar" muestra "Guardando..." y se deshabilita.
- Al completar inline, checkbox se deshabilita momentáneamente.

## 9. Accesibilidad (ARIA, teclado, focus)

| Elemento | Requisito |
|----------|-----------|
| Task card | `role="listitem"`, `tabindex="0"` si clickable |
| Checkbox completar | `<input type="checkbox">` nativo con `aria-label="Marcar tarea como completada"` |
| Botón eliminar | `aria-label="Eliminar tarea"` |
| Botón nueva tarea | Texto visible "+ Nueva tarea" |
| Modal formulario | Focus en primer input al abrirse, `Escape` para cerrar |
| Estados de carga | `aria-live="polite"` o `role="status"` |
| Toasts | `role="alert"` (ya implementado en toast()) |
| Focus trap | Modal backdrop ya maneja `Escape` global |
| Skip link | Ya existe en admin.html |
| focus-visible | Ya existe en admin.css |

## 10. Casos límite

| Caso | Comportamiento esperado |
|------|------------------------|
| Título con solo whitespace | Se rechaza con toast "El título es obligatorio." |
| Título con HTML/scripts | `esc()` sanitiza output; backend `_strip_html` sanitiza input |
| lead_id no numérico | Backend devuelve 404; toast genérico |
| Fecha vencimiento en el pasado | Permitido (tarea ya vencida) |
| Prioridad inválida | Backend la rechaza; frontend no permite por ser select |
| Estado inválido | Backend lo rechaza; frontend no permite |
| Asignar a agente que no existe | Backend FK constraint; toast de error |
| Asignar a agente null | Permitido (desasignar) |
| Tarea completada intentar editar | No se permite editar tareas completadas |
| Tarea completada intentar eliminar | Permitido |
| Múltiples clicks en "Guardar" | Botón se deshabilita tras primer click |
| Múltiples tareas para mismo lead | Scroll en la sección de tareas |
| Crear tarea y lead se elimina | CASCADE en BD elimina tareas automáticamente |
| Tarea sin due_at | Permitido, mostrar "—" en fecha |
| Agentes no cargados | Select muestra "Sin agente" solamente |
| Property_ID en tarea | Se incluye en el modelo pero frontend no lo expone (excede alcance) |
