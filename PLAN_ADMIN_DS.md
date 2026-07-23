# Bienenhaus Admin — Design System & CSS Architecture Plan

## ═══════════════════════════════════════════
## 1. DESIGN TOKENS
## ═══════════════════════════════════════════

### Color System
```
--admin-bg:              #050505     (fondo principal, más profundo que public site)
--admin-bg-secondary:    #090909     (sidebar, paneles secundarios)
--admin-surface:         #101010     (cards, modales, contenedores)
--admin-surface-hover:   #151515     (hover states)
--admin-surface-elevated:#1a1a1a     (dropdowns, popovers)

--admin-primary:         #20B8AB     (teal — acento principal)
--admin-primary-hover:   #31D3C5     (hover)
--admin-primary-dark:    #13968C     (active, focus ring)
--admin-primary-glow:    rgba(32,184,171,0.15)  (glow sutile)

--admin-text:            #FFFFFF
--admin-text-secondary:  #BDBDBD
--admin-text-muted:      #7A7A7A
--admin-text-disabled:   #3a3a3a

--admin-border:          rgba(255,255,255,0.06)
--admin-border-medium:   rgba(255,255,255,0.10)
--admin-border-strong:   rgba(255,255,255,0.16)

--admin-success:         #39D98A
--admin-warning:         #FFB432
--admin-danger:          #CC3535
--admin-purple:          #8C64DC
--admin-info:            #20B8AB

--admin-overlay:         rgba(0,0,0,0.85)     (modal backdrop)
```

### Typography Scale
```
--admin-font-display:   'Anton', Impact, sans-serif      → títulos hero, page-title
--admin-font-body:      'Poppins', sans-serif             → UI, labels, paragraphs
--admin-font-num:       'Montserrat', sans-serif          → precios, KPIs, métricas

--admin-text-2xs:       10px   (badges, timestamps)
--admin-text-xs:        11px   (subtabs, helper)
--admin-text-sm:        12px   (table cells, metadata)
--admin-text-base:      13px   (body)
--admin-text-md:        14px   (button text, inputs)
--admin-text-lg:        18px   (card titles)
--admin-text-xl:        22px   (page titles, modal titles)
--admin-text-2xl:       28px   (KPI values)
--admin-text-3xl:       36px   (hero KPI)
```

### Spacing (4px base)
```
--admin-space-1:  4px
--admin-space-2:  8px
--admin-space-3:  12px
--admin-space-4:  16px
--admin-space-5:  24px
--admin-space-6:  32px
--admin-space-7:  48px
--admin-space-8:  64px
```

### Radii
```
--admin-radius-sm:   4px       (badges, inputs)
--admin-radius-md:   8px       (cards, modals, buttons)
--admin-radius-lg:   12px      (dashboard cards)
--admin-radius-xl:   16px      (login card)
--admin-radius-full: 9999px    (avatars, pills)
```

### Shadows
```
--admin-shadow-sm:  0 1px 2px rgba(0,0,0,0.5)                    (inputs)
--admin-shadow-md:  0 4px 12px rgba(0,0,0,0.4)                   (cards)
--admin-shadow-lg:  0 8px 32px rgba(0,0,0,0.5)                   (modals)
--admin-shadow-xl:  0 16px 48px rgba(0,0,0,0.6)                  (dropdown)
--admin-shadow-glow: 0 0 20px rgba(32,184,171,0.12)              (primary glow)
```

### Transitions
```
--admin-transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1)
--admin-transition-slow: all 350ms cubic-bezier(0.22, 0.61, 0.36, 1)
```

---

## ═══════════════════════════════════════════
## 2. COMPONENT LIBRARY
## ═══════════════════════════════════════════

### 2.1 KPI / StatCard
```
┌──────────────────────┐
│  ↑ 34.2%     $2.4M   │  ← trend + value (Montserrat)
│  Ingresos del mes     │  ← label
│  vs mes anterior      │  ← subtitle
└──────────────────────┘
```
**Classes**: `.dash-card`, `.dash-card-value`, `.dash-card-label`, `.dash-card-sub`, `.dash-card-trend`

### 2.2 DashboardCard (panel con contenido)
```
┌──────────────────────────────┐
│ Propiedades Recientes   [→]  │  ← header with action
├──────────────────────────────┤
│ Prop 1  ·  $120K  ·  Hoy     │
│ Prop 2  ·  $250K  ·  Ayer    │
│ Prop 3  ·  $90K   ·  ʀ     │
└──────────────────────────────┘
```
**Classes**: `.dash-panel`, `.dash-panel-header`, `.dash-panel-title`, `.dash-panel-action`, `.dash-panel-body`

### 2.3 Property Card (admin)
```
┌────────────────────┐
│ 🖼️ thumbnail       │
├────────────────────┤
│ CASA EN VENTA      │  ← status + type badge
│ Prop Title         │  ← Anton
│ $ 250,000          │  ← Montserrat price
│ 🛏️3 🚿2 🚗1 120m²│  ← specs
│ [Editar] [Eliminar]│  ← actions
└────────────────────┘
```
**Classes**: `.prop-card`, `.prop-card-thumb`, `.prop-card-body`, `.prop-card-title`, `.prop-card-price`, `.prop-card-specs`, `.prop-card-actions`

### 2.4 Agent Card
```
┌──────────────────────┐
│   (avatar circular)   │
│   MARÍA GARCÍA        │  ← Anton
│   Especialista        │  ← tag
│   8 años experiencia  │
│   [Contactar] [Ver]   │
└──────────────────────┘
```
**Classes**: `.agent-admin-card`, `.agent-admin-avatar-wrap`, `.agent-admin-photo`, `.agent-admin-name`, `.agent-admin-specialty`, `.agent-admin-years`, `.agent-admin-actions`

### 2.5 Button System
```
[Primary] [Secondary] [Ghost] [Danger] [Success] [Warning]

Size variants: default · .btn-sm · .btn-xs · .btn-full
```
**Classes**: `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-outline`, `.btn-danger`, `.btn-success`, `.btn-warn`, `.btn-sm`, `.btn-xs`, `.btn-full`, `.btn-icon`

### 2.6 Input System
```
┌─────────────────────────────┐
│ LABEL                       │
│ ┌─────────────────────────┐ │
│ │ value              👁️   │ │  ← optional icon/action
│ └─────────────────────────┘ │
│ helper text / error msg      │
└─────────────────────────────┘

Variants: .field-input (default), .filter-input (rounded search), 
          textarea, .field--float (floating label)
```
**Classes**: `.field`, `.field-label`, `.field-input`, `.field-input--select`, `.field--float`, `.field-label-float`, `.field-focus-ring`, `.field-error`, `.filter-input`, `.filter-select`

### 2.7 Search + Filter Bar
```
┌──────────────────────────────────────────────┐
│ 🔍 Buscar...      [Tipo ▼] [Estado ▼] [⟳]  │
│   □ Venta  □ Alquiler                        │
└──────────────────────────────────────────────┘
```
**Classes**: `.prop-search-bar`, `.prop-search-input`, `.prop-search-clear`, `.admin-filter-bar`, `.admin-filter-group`, `.admin-filter-check`, `.admin-filters-row`

### 2.8 Badge System
```
[Disponible]  [Vendida]  [Oculta]  [Destacada]
[Activo]  [Inactivo]  [Pendiente]

Small: .admin-status-badge (.status-disponible, .status-vendida, .status-oculta)
Marketing: .mk-badge (.mk-badge-active, .mk-badge-inactive)
```
**Classes**: `.badge`, `.admin-status-badge`, `.status-disponible/vendida/oculta`, `.mk-badge`, `.mk-badge-active/inactive`, `.admin-prop-featured`

### 2.9 Modal
```
┌──────────────────────────────────┐
│ Modal Title              [✕]    │  ← header
├──────────────────────────────────┤
│ Content (scrollable)             │
│                                  │
├──────────────────────────────────┤
│ [Cancel]              [Save]     │  ← footer
└──────────────────────────────────┘

Variants: .modal-box (default), .modal-form-box (narrower, 520px)
Max-width helpers: .admin-modal-max-w-{580|650|700|800}
```
**Classes**: `.modal-backdrop`, `.modal-box`, `.modal-form-box`, `.modal-header`, `.modal-title`, `.modal-sub`, `.modal-form-content`, `.modal-close`, `.modal-footer`

### 2.10 Table
```
┌──────────────────────────────────────────┐
│ NAME      STATUS     PRICE      ACTIONS  │  ← uppercase label
├──────────────────────────────────────────┤
│ Prop 1  [Disp]    $250K    [✎] [✕]     │  ← hover row
│ Prop 2  [Vend]    $180K    [✎] [✕]     │
│ Prop 3  [Ocult]   $320K    [✎] [✕]     │
└──────────────────────────────────────────┘

```
**Classes**: `.admin-table-wrap`, `.admin-table`, `.admin-table-header`, `.admin-table-row`, `.admin-table-cell`, `.admin-table-actions`

### 2.11 Pagination
```
[‹]  1  2  3  ...  12  [›]
```
**Classes**: `.pagination`, `.page-numbers`, `.page-btn`, `.page-btn--active`, `.page-btn--nav`, `.page-dots`

### 2.12 Toast
```
┌──────────────────────┐
│ ✓ Propiedad creada   │  ← info/success/error/warn
│ con éxito            │
└──────────────────────┘
```
**Classes**: `.admin-toast`, `.admin-toast--visible`, `.admin-toast--info/success/error/warn`

### 2.13 Empty State
```
┌──────────────────────────┐
│                          │
│    📭 icon (SVG)         │
│    No hay propiedades    │  ← title
│    Crea la primera       │  ← description
│    [Crear Propiedad]     │  ← CTA
│                          │
└──────────────────────────┘
```
**Classes**: `.empty-state`, `.empty-state-icon`, `.empty-state-title`, `.empty-state-text`, `.empty-state-action`

### 2.14 Loading State / Skeleton
```
┌──────────────────────────────┐
│ ━━━━━━━━━━━━  ████████████   │  ← shimmer animation
│ ━━━━━━━━━  ████████████████  │
│ ━━━━━━━━━━━━━━━━  █████████  │
└──────────────────────────────┘
```
**Classes**: `.loading-state`, `.skeleton`, `.skeleton-line`, `.skeleton-block`, `.skeleton-circle`, `.admin-loading-pulse`

### 2.15 CRM Kanban
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ NUEVO    │ │ CONTACTO │ │ VISITA   │ │ CERRADO  │
│    3     │ │    5     │ │    2     │ │    7     │
├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤
│ Card 1   │ │ Card 4   │ │ Card 7   │ │ Card 9   │
│ Card 2   │ │ Card 5   │ │          │ │ Card 10  │
│ Card 3   │ │ Card 6   │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```
**Classes**: `.kanban-board`, `.kanban-column`, `.kanban-column-header`, `.kanban-count`, `.kanban-column-body`, `.kanban-card`, `.kanban-card-name`, `.kanban-card-props`, `.kanban-card-value`, `.kanban-card-agent`, `.crm-status-dot`

### 2.16 CRM Timeline
```
┌──────────────────────────────────────┐
│ ─── timeline line ───                │
│  ● Llamada realizada     hace 2h     │  ← dot + event
│    Cliente interesado en...          │  ← details
│  ● Email enviado         hace 1d     │
│    Propuesta comercial...            │
│  ● Visita agendada       3d          │
└──────────────────────────────────────┘
```
**Classes**: `.crm-timeline`, `.crm-interaction`, `.crm-interaction-dot`, `.crm-interaction-body`, `.crm-interaction-text`, `.crm-interaction-date`

---

## ═══════════════════════════════════════════
## 3. FILE ARCHITECTURE
## ═══════════════════════════════════════════

```
css/
├── admin.css                     ← ENTRY: solo @import statements
├── admin/
│   ├── 0-tokens.css              ← Admin design tokens (numbered for order)
│   ├── 1-base.css                ← Reset, layout, admin-body/screen/main
│   ├── 2-login.css               ← Login screen (.login-*)
│   ├── 3-sidebar.css             ← Sidebar (.sidebar-*, compact-toggle)
│   ├── 4-topbar.css              ← Top bar, user bar, tabs, subtabs
│   ├── 5-dashboard.css           ← Dashboard (.dash-card, .dash-panel, .dash-chart)
│   ├── 6-property-cards.css      ← Prop cards (.prop-*), agent cards (.agent-admin-*)
│   ├── 7-crud-forms.css          ← Property form (.pf-*), agent form (.af-*), settings (.cfg-*), users
│   ├── 8-messages.css            ← Messages (.msg-*), appraisals/ACM (.acm-*)
│   ├── 9-crm.css                ← CRM kanban (.kanban-*), CRM table (.crm-*), timeline
│   ├── 10-marketing.css          ← Marketing (.mk-*), social posts
│   ├── 11-portals.css            ← Portals, publications, wizard (.ps-*)
│   ├── 12-buttons.css            ← Button system (.btn-*)
│   ├── 13-forms.css              ← Inputs, selects, checkboxes, toggles (.field-*, .filter-*)
│   ├── 14-modals.css             ← Modal system (.modal-*)
│   ├── 15-tables.css             ← Tables, filters, sort bar, batch, search
│   ├── 16-badges.css             ← Status badges, marketing badges
│   ├── 17-toasts.css             ← Toast notifications
│   ├── 18-states.css             ← Loading, empty, error, skeleton, pagination
│   ├── 19-activity.css           ← Activity section
│   └── 20-responsive.css         ← ALL responsive breakpoints (single source)
```

### Import chain (admin.css)
```css
@import url('admin/0-tokens.css');
@import url('admin/1-base.css');
@import url('admin/2-login.css');
@import url('admin/3-sidebar.css');
@import url('admin/4-topbar.css');
@import url('admin/5-dashboard.css');
@import url('admin/6-property-cards.css');
@import url('admin/7-crud-forms.css');
@import url('admin/8-messages.css');
@import url('admin/9-crm.css');
@import url('admin/10-marketing.css');
@import url('admin/11-portals.css');
@import url('admin/12-buttons.css');
@import url('admin/13-forms.css');
@import url('admin/14-modals.css');
@import url('admin/15-tables.css');
@import url('admin/16-badges.css');
@import url('admin/17-toasts.css');
@import url('admin/18-states.css');
@import url('admin/19-activity.css');
@import url('admin/20-responsive.css');
```

### Build pipeline (unchanged)
```bash
postcss css/admin.css -o css/admin.min.css   # postcss-import inlines everything
```

### admin.html change
Add tokens.css explicitly before admin.css (for clarity):
```html
<link rel="stylesheet" href="/css/fonts.css"/>
<link rel="stylesheet" href="/css/styles.min.css"/>
<link rel="stylesheet" href="/css/tokens.css"/>       # ← ADD
<link rel="stylesheet" href="/css/admin.css?v=3A"/>   # new version
```

---

## ═══════════════════════════════════════════
## 4. PAGE TEMPLATES (Visual Layouts)
## ═══════════════════════════════════════════

### 4.1 Dashboard
```
┌──────────────────────────────────────────────────┐
│ Panel Admin                               👤 JG │  ← topbar
├──────────────────────────────────────────────────┤
│ [Dashboard] [Props] [Agents] [CRM] [MK] ...      │  ← tabs
├──────────────────────────────────────────────────┤
│                                                    │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│ │$2.4M │ │ 142  │ │ 89%  │ │ $12K │  ← KPI row  │
│ │  ingresos │ props│ tasa  │ gastos│              │
│ └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                    │
│ ┌─────────────┐ ┌─────────────────────┐           │
│ │ Actividad   │ │ Prop. Destacadas    │           │
│ │ Reciente    │ │ [Thumb] [Thumb]     │           │
│ │             │ │ [Thumb] [Thumb]     │           │
│ └─────────────┘ └─────────────────────┘           │
│                                                    │
│ ┌─────────────────────────────────┐                │
│ │ Gráfico: Consultas últimos 30d  │                │
│ └─────────────────────────────────┘                │
└──────────────────────────────────────────────────┘
```

### 4.2 Properties
```
┌──────────────────────────────────────────────────┐
│ Propiedades               [+ Nueva] [⟳ Sinc.]  │  ← header
├──────────────────────────────────────────────────┤
│ 🔍 Buscar...  [Tipo ▼] [Estado ▼] [Precio ▼]   │  ← filters
│ □ Venta  □ Alquiler  □ Destacados               │
├──────────────────────────────────────────────────┤
│ Prop Grid or Table View                          │
│ ┌────────┐ ┌────────┐ ┌────────┐                 │
│ │ Card 1 │ │ Card 2 │ │ Card 3 │                 │
│ └────────┘ └────────┘ └────────┘                 │
│ ┌────────┐ ┌────────┐ ┌────────┐                 │
│ │ Card 4 │ │ Card 5 │ │ Card 6 │                 │
│ └────────┘ └────────┘ └────────┘                 │
├──────────────────────────────────────────────────┤
│ [‹] 1 2 3 … 12 [›]                              │  ← pagination
└──────────────────────────────────────────────────┘
```

### 4.3 CRM
```
┌──────────────────────────────────────────────────┐
│ CRM Pipeline                    [+ Nuevo Lead]   │
├──────────────────────────────────────────────────┤
│ 🔍 Buscar lead...  [Origen ▼] [Agente ▼]        │
├──────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ NUEVO   │ │CONTACTO │ │ VISITA  │ │CERRADO  ││
│ │    3    │ │    5    │ │    2    │ │    7    ││
│ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤│
│ │ Lead 1  │ │ Lead 4  │ │ Lead 7  │ │ Lead 9  ││
│ │ Lead 2  │ │ Lead 5  │ │ Lead 8  │ │ Lead 10 ││
│ │ Lead 3  │ │ Lead 6  │ │         │ │         ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
└──────────────────────────────────────────────────┘
```

---

## ═══════════════════════════════════════════
## 5. INTERACTION PATTERNS
## ═══════════════════════════════════════════

### Hover States
- Cards: `translateY(-2px)`, border glow, shadow elevation
- Buttons: `translateY(-1px)`, color shift
- Table rows: subtle background tint
- Sidebar links: left border accent, background shift

### Focus States
- All interactive: `outline: 2px solid var(--admin-primary)` via `:focus-visible`
- Inputs: box-shadow glow ring

### Transitions (all elements)
```css
transition: var(--admin-transition);  /* 200ms ease-out cubic */
```

### Micro-interactions
- Sidebar collapse: smooth width transition
- Modal open: scale(0.96 → 1) + fade (250ms)
- Toast enter: translateY + fade (250ms)
- Tab switch: content crossfade (150ms)
- Kanban card: subtle lift on hover + border accent

---

## ═══════════════════════════════════════════
## 6. STRICT RULES
## ═══════════════════════════════════════════

1. **ONE definition per class** — no redeclarations across files or sections
2. **Zero `!important`** — exceptions must be documented with comment
3. **Zero `::before`/`::after` decoration** — only structural uses (tooltips, indicators)
4. **Flat backgrounds** — gradients only for accent elements (sidebar active indicator, button overlays, login orbs)
5. **All values via CSS variables** — no hardcoded colors, radii, shadows, fonts
6. **Mobile-first responsive** — base = mobile, media queries override up
7. **Keep ALL existing class names** — HTML, JS, and templates must not change
8. **Each file scoped** — no cross-file style dependencies (each file includes its own variables)

---

## ═══════════════════════════════════════════
## 7. EXECUTION ORDER
## ═══════════════════════════════════════════

1. Backup current `admin.css` → `admin.css.bak`
2. Create `admin/` directory with all 21 module files
3. Write `admin.css` entry point with imports
4. Build: `postcss css/admin.css -o css/admin.min.css` → verify no errors
5. Compare minified output with `admin.min.css` to verify all classes present
6. Run backend tests: `cd backend && python -m pytest`
7. Run frontend tests: `cd frontend && python tests/test_pages.py`
8. Manual check: load admin panel, verify all sections render correctly

---

## ═══════════════════════════════════════════
## 8. CLASS INVENTORY (preserved from existing code)
## ═══════════════════════════════════════════

All ~200+ existing class names preserved across 21 module files.
Full inventory extracted from `admin.html` and verified against all JS files.
