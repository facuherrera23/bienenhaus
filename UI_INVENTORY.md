# UI INVENTORY · Bienenhaus Propiedades

> Inventario completo de todas las vistas, componentes, variantes y estados en la aplicación.

---

## 1. Vistas principales

### 1.1 Landing (`index.html`)
| Aspecto | Detalle |
|---------|---------|
| **Secciones** | Hero (title + CTA + background image) → Propiedades en venta (scroll horizontal) → Servicios (grid 3 cards) → Propiedades en alquiler (scroll horizontal) → WhatsApp CTA → Footer |
| **Componentes** | Property card (2 variantes: venta/alquiler), service card, hero overlay, scroll buttons, footer links |
| **Estados** | Carga (skeleton), vacío, error, datos |
| **Estados faltantes** | 🔴 Sin skeleton, sin error state, sin empty state |

### 1.2 Listado (`listado.html`)
| Aspecto | Detalle |
|---------|---------|
| **Secciones** | Hero (barra de búsqueda + tags de tipo) → Grid de cards → "Ver más" button → Footer |
| **Componentes** | Property card, search bar, type tags, pagination (ver más), back-to-top FAB |
| **Estados** | Carga, vacío, error, resultados, fin de resultados |
| **Estados faltantes** | 🔴 Sin skeleton, sin empty state, sin mensaje de "fin de resultados" |

### 1.3 Detalle (`propiedad.html`)
| Aspecto | Detalle |
|---------|---------|
| **Secciones** | Breadcrumbs → Galería (hero image + thumbnails) → Info general → Características → Precio → Descripción → Ubicación (mapa) → Contacto (form) → Propiedades relacionadas → Footer |
| **Componentes** | Image gallery, thumbnails, feature list, price badge, contact form (inline + modal), mini-map, related cards |
| **Estados** | Carga, error, datos completos, datos incompletos |
| **Estados faltantes** | 🟡 Sin skeleton, sin error state |

### 1.4 Comparador (`comparador.html`)
| Aspecto | Detalle |
|---------|---------|
| **Secciones** | Selector de propiedades (2 inputs) → Tabla comparativa → Footer |
| **Componentes** | Property selector, comparison table, property cards in selector |
| **Estados** | Vacío (sin propiedades seleccionadas), comparando (2 propiedades), error |
| **Estados faltantes** | 🟡 Sin skeleton, sin empty state más allá de "selecciona" |

### 1.5 Mapa (`mapa.html`)
| Aspecto | Detalle |
|---------|---------|
| **Secciones** | Mapa full-width → Footer |
| **Componentes** | Leaflet map, markers, popups con info de propiedad |
| **Estados** | Carga, mapa cargado, error, vacío (sin propiedades) |
| **Estados faltantes** | 🟡 Sin skeleton, sin error state |

### 1.6 Nosotros (`nosotros.html`)
| Aspecto | Detalle |
|---------|---------|
| **Secciones** | Hero → Quiénes somos → Equipo (grid agentes) → Valores → Footer |
| **Componentes** | Agent card, value item |
| **Estados** | Estático (sin carga dinámica excepto agentes) |
| **Estados faltantes** | 🟡 Sin skeleton para grid de agentes |

### 1.7 Tasación (`tasacion.html`)
| Aspecto | Detalle |
|---------|---------|
| **Secciones** | Hero → Formulario de tasación (steps?) → Footer |
| **Componentes** | Form inputs, submit button |
| **Estados** | Form idle, submitting, success, error |
| **Estados faltantes** | 🟡 Sin toast de éxito/error post-submit |

### 1.8 Contacto (`contacto.html`)
| Aspecto | Detalle |
|---------|---------|
| **Secciones** | Hero → Formulario contacto → Info oficina → Mapa → Footer |
| **Componentes** | Form, office info card, mini-map |
| **Estados** | Form idle, submitting, success, error |
| **Estados faltantes** | 🟡 Sin validación inline, sin toast feedback |

### 1.9 Login Admin (`login.html`)
| Aspecto | Detalle |
|---------|---------|
| **Secciones** | Brand panel (izquierdo) + Login form (derecho) |
| **Componentes** | Login form, brand logo/text, social login (Google) |
| **Estados** | Idle, loading, error (credenciales), success (redirect) |
| **Estados faltantes** | 🟢 Sin error state visual (usa alert()) |

### 1.10 Admin SPA (`admin.html`)
| Aspecto | Detalle |
|---------|---------|
| **Secciones** | Sidebar (11 items) + Top bar (breadcrumb + usuario + notificaciones) + Content area (swappable) |
| **Vistas dentro del admin** | Dashboard, Propiedades (tabla), Propiedad (form), Leads (tabla + Kanban), Agentes (tabla + form), Usuarios (tabla), Tareas, Visitas, Marketing (redes), Portales, Tasaciones, Activity Log, Configuración |
| **Componentes compartidos** | DataTable, FormBuilder, Modal, Toast, KanbanBoard, StatsCard, FilterBar, SearchInput |
| **Estados** | Loading, empty, error, datos, editing, creating |
| **Estados faltantes** | 🟡 Sin skeleton transitions entre secciones, sin empty states en varias tablas |

---

## 2. Componentes por tipo

### 2.1 Navegación
| Componente | Variantes | Estado actual |
|------------|-----------|---------------|
| Navbar pública | Sticky top, links + logo | Funcional |
| Navbar hamburger | Menú mobile overlay | Funcional |
| Admin sidebar | Expandido/colapsado (11 secciones) | 🟡 Sin transición suave |
| Admin top bar | Breadcrumb + usuario + notif | Funcional |
| Footer | Links + copyright + redes | Funcional, estático |
| Breadcrumbs | Solo en propiedad.html | 🟢 Faltante en resto |

### 2.2 Cards
| Componente | Variantes | Estado actual |
|------------|-----------|---------------|
| Property card (público) | Venta / Alquiler, con/sin badge | 🟡 Badge de operación inconsistente |
| Property card (admin) | Con checkboxes, edit button | Funcional |
| Service card | Landing, 3 columnas | Funcional |
| Agent card | Nosotros, admin | Funcional |
| Stats card | Dashboard, métricas | 🟡 Sin indicadores de tendencia |
| Kanban card | Drag & drop, 4 estados | 🟡 Sin feedback de drag |

### 2.3 Formularios
| Componente | Variantes | Estado actual |
|------------|-----------|---------------|
| Input text | Varios tamaños | 🟡 Sin validación inline |
| Textarea | Descripciones | 🟡 Sin validación inline |
| Select | Categorías, estados | 🟡 Sin validación inline |
| Switch | Activo/inactivo | Funcional |
| Image uploader | Galería de propiedades | Funcional |
| Date picker | Fechas de propiedad | Funcional |
| Rich text input | Descripciones | Funcional |
| Form section (admin) | 30+ campos sin agrupar | 🟡 Sin tabs/accordion |

### 2.4 Feedback
| Componente | Variantes | Estado actual |
|------------|-----------|---------------|
| Toast | Success / Error (admin) | 🟠 No global, no warning/info |
| Confirm modal | Promise-based (admin) | 🟡 No estilizado uniforme |
| Loading spinner | Cards, admin sections | 🟡 No unificado |
| Skeleton | **No existe** | 🔴 Ausente en toda la app |
| Error state inline | **No existe** | 🟡 Ausente |
| Empty state | **No existe** | 🟡 Ausente |

### 2.5 Tablas
| Componente | Variantes | Estado actual |
|------------|-----------|---------------|
| Propiedades | 9 columnas | 🟡 Sin scroll, sin sticky |
| Leads | 7 columnas | 🟡 Sin scroll, sin sticky |
| Agentes | 6 columnas | 🟡 Sin scroll, sin sticky |
| Usuarios | 7 columnas | 🟡 Sin scroll, sin sticky |
| Tareas | 6 columnas | 🟡 Sin scroll, sin sticky |
| Visitas | 8 columnas | 🟡 Sin scroll, sin sticky |
| Tasaciones | 6 columnas | 🟡 Sin scroll, sin sticky |

### 2.6 Gráficos / DataViz
| Componente | Variantes | Estado actual |
|------------|-----------|---------------|
| Dashboard chart | Barras (Chart.js) | Funcional |
| Dashboard stats | 4-6 cards numéricas | 🟡 Sin tendencias |
| Kanban pipeline | 4 columnas: nuevo/contactado/visita/cerrado | 🟡 Sin indicadores |
| Map markers | Leaflet popups | Funcional |

### 2.7 Multimedia
| Componente | Variantes | Estado actual |
|------------|-----------|---------------|
| Image gallery | Hero + thumbnails | 🟢 Sin lazy loading |
| Carousel | Flechas + dots | Funcional |
| Image upload | Drag & drop + preview | Funcional |

---

## 3. Inconsistencias detectadas

| # | Inconsistencia | Dónde |
|---|----------------|-------|
| 1 | Color `--accent-warm: #c8a96e` definido pero sobrescrito/no usado | `tokens.css` |
| 2 | CSS legacy `--*` coexiste con `--ds-*` sin fallback claro | `styles.css`, `tokens.css` |
| 3 | `--g3` (#666) y `--g4` (#2a2a2a) son demasiado oscuros para texto sobre fondo negro | `tokens.css` |
| 4 | Botones usan diferentes alturas en público vs admin | Varios CSS |
| 5 | Modales con diferentes animaciones y estilos de overlay | Varios HTML |
| 6 | Inputs con diferentes border-radius, heights, focus styles | Varios CSS |
| 7 | Fechas en ISO sin formatear en admin | `admin.js` |
| 8 | Precios sin separador de miles en varios lugares | `main.js`, `admin.js` |
| 9 | Toast positions diferentes (top-right admin, center otros) | `admin.js` |
| 10 | Sidebar labels sin tooltips en modo colapsado | `admin.html` |
| 11 | Faltan breadcrumbs en listado, detalle, comparador, mapa | HTML pages |
| 12 | Admin sections cambian abruptamente sin transición | `admin.html` |
| 13 | Kanban usa IDs legacy sin estilos `--ds-*` | `admin.html` |
| 14 | Dashboard métricas sin unidades/contexto | `admin.html` |
| 15 | Property cards en público vs admin visualmente diferentes | Comparación CSS |

---

## 4. Oportunidades de mejora

| # | Oportunidad | Impacto |
|---|-------------|---------|
| 1 | Sistema de filtros compartido (público + admin) | Alto |
| 2 | Componente de tabla genérico reutilizable (TableManager) | Alto |
| 3 | Modal unificado con `showModal()` global | Alto |
| 4 | Sistema de skeleton screens automático por tipo de contenido | Alto |
| 5 | Komponente de precios formateados global `formatPrice()` | Medio |
| 6 | Helper de fechas global `formatDate()` | Medio |
| 7 | Sistema de notificaciones toast singleton | Alto |
| 8 | Image lazy loading automático vía IntersectionObserver | Medio |
| 9 | Componente de búsqueda con debounce reutilizable | Medio |
| 10 | Property form dividido en tabs con progreso | Alto |
