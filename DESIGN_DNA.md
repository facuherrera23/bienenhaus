# DESIGN DNA · Bienenhaus Propiedades

## Producto

**Bienenhaus Propiedades** es una plataforma inmobiliaria completa compuesta por:
- **Portal público** (GitHub Pages) — catálogo de propiedades en venta y alquiler, detalle con galería, mapa interactivo, comparador, tasación online, contacto
- **Panel administrativo** (SPA embebida en frontend) — CRM con pipeline Kanban, dashboard con métricas, CRUD completo de propiedades/agentes/usuarios, marketing en redes sociales, publicación en portales externos, gestión de tasaciones, activity log
- **Backend API** (Flask + PostgreSQL en Render) — API RESTful con autenticación JWT, CSRF, endpoints para propiedades, alquileres, agentes, leads, CRM, marketing, portales, configuración

### Propuesta de valor
- Inmobiliaria boutique con curaduría de propiedades premium en Córdoba
- Digitalización avanzada: tasaciones online, CRM integrado, marketing automation
- Transparencia: datos reales, sin letra chica, asesoría legal integral

---

## Usuarios

| Perfil | Contexto | Necesidades |
|--------|----------|-------------|
| **Administrador** | Dueño/CEO de la inmobiliaria | Dashboard, métricas, control total, configuración |
| **Agente/Vendedor** | Operador diario | CRM, Kanban, leads, visitas, tareas, WhatsApp |
| **Cliente comprador** | Busca propiedad para comprar | Catálogo, filtros, detalle, comparador, contacto |
| **Cliente inquilino** | Busca propiedad para alquilar | Mismo + precio mensual visible |
| **Cliente tasación** | Quiere vender/tasar su propiedad | Formulario de tasación, seguimiento |

---

## Benchmark

| Aspecto | Attio | HubSpot | Linear | Notion | Salesforce | Zoho CRM |
|---------|-------|---------|--------|--------|------------|----------|
| **Estilo visual** | Minimalista, tipográfico, color blocking | Corporativo, denso, azul | Oscuro, clean, tipográfico | Blanco, editorial, airy | Legacy, denso | Funcional, básico |
| **Referencia para** | Diseño premium, tipografía | Patrones CRM, organización | Dashboard, dark mode | Layout editorial | Estructura de datos | N/A |
| **Qué tomar** | Espaciado, jerarquía visual | Organización de Kanban | Paleta oscura premium | Composición | Nada (estilo legacy) | Nada |

---

## Identidad actual detectada

### Paleta de colores
| Variable | Valor | Uso |
|----------|-------|-----|
| `--bg` | `#000000` | Fondo principal |
| `--s1` a `--s4` | `#080808` → `#1c1c1c` | Superficies |
| `--white` | `#ffffff` | Texto primario |
| `--g1` a `--g4` | `#e0e0e0` → `#2a2a2a` | Grises tipográficos y bordes |
| `--accent` | `#20b8ab` (teal) | Color corporativo principal |
| `--accent-dark` | `#178c81` | Hover/active del acento |
| `--accent-warm` | `#c8a96e` (gold, no usado) | Acento secundario definido pero sobrescrito |
| `--danger` | `#cc3535` | Errores |
| `--ds-color-success` | `#3aaa55` | Éxito |

### Tipografía
| Variable | Fuente | Uso |
|----------|--------|-----|
| `--font-body` | Poppins, sans-serif | Body, inputs, botones, UI general |
| `--font-title` | Anton, Impact, sans-serif | Headings, hero, títulos grandes |
| `--font-num` | Montserrat, sans-serif | Precios, números, stats |
| `--font-elegant` | Quicksand, sans-serif | Subheadings, descripciones |
| `--font-body-alt` | Open Sans, sans-serif | Descripciones extendidas |

### Branding
- Logotipo: abeja hexagonal estilizada + texto "Bienenhaus" en blanco
- Personalidad: premium, oscura, profesional, tecnológica
- Tono: serio pero accesible, copy en español argentino

### Variables CSS detectadas
- **Sistema legacy** (`--*` en `styles.css`): ~30 variables para colores, fuentes, espacios, radios
- **Sistema DS** (`--ds-*` en `tokens.css`): ~40 variables ref: legacy con fallbacks
- **Letter-spacing** (`--ls-*`): 13 valores de tracking
- **Breakpoints**: 320, 360, 390, 414, 480, 500, 600, 700, 768, 900, 1024, 1100, 1366, 1920

---

## Estrategia de preservación de identidad

1. **Colores**: Mantener `--bg: #000`, `--accent: #20b8ab` como ejes centrales. Crear variantes tonales del teal para jerarquía. El `--accent-warm: #c8a96e` (gold) se eliminará como variable aparte y se unificará bajo el teal.
2. **Tipografía**: Mantener Anton para títulos display (es distintivo). Poppins se mantiene para UI pero se optimizan pesos (solo 400, 500, 600, 700). Se introduce Geist Mono para código/datos tabulares.
3. **Branding**: No se toca. Logo, nombre, personalidad visual se mantienen intactos.
4. **Sistema oscuro**: Se preserva el dark mode como único tema. Se eliminan inconsistencias en valores de grises.
5. **Sistema de variables**: Se migra progresivamente de `--*` legacy a `--ds-*` como fuente de verdad única.

---

## Principios UX

1. **Claridad sobre creatividad** — Cada pantalla comunica su propósito en < 1 segundo
2. **Eficiencia del agente** — El CRM debe minimizar clicks para tareas repetitivas
3. **Confianza del cliente** — Datos visibles, precios claros, fotos reales
4. **Consistencia** — Mismos patrones en público y admin
5. **Feedback inmediato** — Cada acción tiene respuesta visual en < 300ms

## Principios UI

1. **Jerarquía tipográfica** — Anton para hero, Poppins 600 para títulos, Poppins 400 para body
2. **Una sola fuente de verdad** — `--ds-*` tokens, no hex hardcodeados
3. **8px grid** — Espaciados múltiplos de 8 (4, 8, 16, 24, 32, 40, 64, 80)
4. **Teal como único acento** — Sin gold, sin colores adicionales no semánticos
5. **Dark mode profundo** — Fondo `#000`, superficies `#0a0a0a` → `#1a1a1a`, texto `#fff` → `#888`

## Patrones de navegación

- **Portal público**: Navbar superior sticky → scroll sections + tabs (venta/alquiler)
- **Admin**: Sidebar izquierdo colapsable con 11 secciones + top bar con info de usuario
- **Login admin**: Split screen con brand panel izquierdo + formulario derecho
- **Modales**: Para CRUD, preview, confirmaciones — consistentes en toda la app
- **Deep linking**: 404.html + sessionStorage redirect para SPA en GitHub Pages

## Componentes críticos

- Property Card (público + admin)
- Kanban Pipeline (CRM)
- Dashboard Charts (admin)
- DataTable con filters (admin)
- Property Form (admin, ~30 campos)
- Modal system (unificado)
- Toast system (flotante, 4 tipos)
- Confirm modal (promesa)
- Image carousel (público)
- Compare tool (público)
- Map with markers (público)

## Componentes intocables

- Login/Auth flow
- API integration layer (`api.js`)
- CRM Kanban logic
- Database models / migrations
- All backend routes and endpoints

## Anti-patrones prohibidos

- Glassmorphism excesivo (usar solo en contextos específicos como login)
- Neumorphism
- Gradientes exagerados
- Sombras pesadas (`shadow-lg`, `shadow-xl`)
- Animaciones distractoras
- Layouts centrados simétricos forzados
- Cards con border + shadow + background

## Estrategia responsive

- Mobile-first con breakpoints consistentes
- Navbar → hamburger < 768px
- Property grid: 1 col < 640px, 2 col < 1024px, 3 col ≥ 1024px
- Admin sidebar: colapsable, overlay en mobile
- Tablas: horizontal scroll en mobile o card view
- Kanban: scroll horizontal en mobile
