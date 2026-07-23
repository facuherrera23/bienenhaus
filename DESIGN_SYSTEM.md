# DESIGN SYSTEM · Bienenhaus Propiedades

> Sistema de diseño basado en `tokens.css` existente con refinamientos. Fuente de verdad única usando `--ds-*` tokens.

---

## 1. Tokens de color

### Neutral / Background
| Token | Valor actual | Refinado | Uso |
|-------|-------------|----------|-----|
| `--ds-color-bg` | `#000000` | `#000000` | Fondo principal |
| `--ds-color-surface-1` | — | `#0a0a0a` | Superficie nivel 1 (cards, sidebar) |
| `--ds-color-surface-2` | — | `#111111` | Superficie nivel 2 (inputs, tablas) |
| `--ds-color-surface-3` | — | `#1a1a1a` | Superficie nivel 3 (hover, selected) |
| `--ds-color-surface-4` | — | `#222222` | Superficie nivel 4 (bordes, separadores) |
| `--ds-color-border` | — | `#2a2a2a` | Bordes generales |
| `--ds-color-border-light` | — | `#333333` | Bordes hover/focus |

### Texto
| Token | Valor actual | Refinado | Uso |
|-------|-------------|----------|-----|
| `--ds-color-text-primary` | `#ffffff` | `#ffffff` | Texto principal |
| `--ds-color-text-secondary` | `--g1` → `#e0e0e0` | `#d4d4d4` | Texto secundario |
| `--ds-color-text-tertiary` | `--g2` → `#b0b0b0` | `#999999` | Texto terciario (metadata) |
| `--ds-color-text-muted` | `--g3` → `#666` | `#666666` | Muted (placeholders) |
| `--ds-color-text-disabled` | `--g4` → `#2a2a2a` | `#444444` | Disabled |

### Acento
| Token | Valor | Uso |
|-------|-------|-----|
| `--ds-color-primary` | `#20b8ab` | Botones, links, acentos activos |
| `--ds-color-primary-hover` | `#178c81` | Hover primary |
| `--ds-color-primary-active` | `#106b62` | Active/pressed |
| `--ds-color-primary-muted` | `#1a4a47` | Badge de alquiler, backgrounds sutiles |
| `--ds-color-primary-text` | `#20b8ab` | Texto con acento |

### Semántico
| Token | Valor | Uso |
|-------|-------|-----|
| `--ds-color-success` | `#3aaa55` | Éxito, disponible, activo |
| `--ds-color-success-bg` | `#1a3a22` | Background éxito |
| `--ds-color-warning` | `#f59e0b` | Advertencia, pendiente |
| `--ds-color-warning-bg` | `#2a2210` | Background warning |
| `--ds-color-danger` | `#cc3535` | Error, eliminar, inactivo |
| `--ds-color-danger-bg` | `#2a1515` | Background error |
| `--ds-color-info` | `#3b82f6` | Información |
| `--ds-color-info-bg` | `#151f2a` | Background info |

---

## 2. Tipografía

### Font families
| Token | Fuente | Weight CSS cargados | Uso |
|-------|--------|---------------------|-----|
| `--ds-font-display` | `Anton`, Impact, sans-serif | 400 | Hero, títulos display, números grandes |
| `--ds-font-body` | `Poppins`, sans-serif | 300, 400, 500, 600, 700 | Body, botones, inputs, UI |
| `--ds-font-mono` | `Geist Mono`, `JetBrains Mono`, monospace | 400, 500 | Código, datos, precios tabulares |
| `--ds-font-alt` | `Quicksand`, sans-serif | 400, 500 | Subheadings, descripciones |

### Font sizes (mobile-first)
| Token | Mobile | Tablet | Desktop | Uso |
|-------|--------|--------|---------|-----|
| `--ds-text-xs` | 11px | 11px | 12px | Tags, metadata, timestamps |
| `--ds-text-sm` | 13px | 13px | 14px | Body small, descripciones |
| `--ds-text-base` | 14px | 14px | 15px | Body principal |
| `--ds-text-lg` | 16px | 17px | 18px | Lead text |
| `--ds-text-xl` | 18px | 20px | 22px | Subtítulos, cards |
| `--ds-text-2xl` | 22px | 26px | 30px | Section titles |
| `--ds-text-3xl` | 28px | 34px | 40px | Hero, headings grandes |
| `--ds-text-4xl` | 36px | 44px | 52px | Hero display (Anton) |

### Line heights
| Token | Valor | Uso |
|-------|-------|-----|
| `--ds-leading-none` | 1 | Display (Anton) |
| `--ds-leading-tight` | 1.15 | Headings |
| `--ds-leading-normal` | 1.5 | Body |
| `--ds-leading-relaxed` | 1.75 | Descripciones largas |

### Font weights
| Token | Valor | Uso |
|-------|-------|-----|
| `--ds-weight-normal` | 400 | Body |
| `--ds-weight-medium` | 500 | Buttons, labels |
| `--ds-weight-semibold` | 600 | Subheadings, table headers |
| `--ds-weight-bold` | 700 | Headings |

### Letter spacing existente
Se preservan los 13 valores `--ls-*` actuales. Se establece tracking por defecto:
| Contexto | Tracking |
|----------|----------|
| Body | `normal` |
| Headings Anton | `1px` |
| Labels/Buttons | `0.5px` |
| Caps | `2px` |

---

## 3. Spacing (8px grid)

| Token | px | Uso |
|-------|----|-----|
| `--ds-space-1` | 4px | Íconos, gaps internos |
| `--ds-space-2` | 8px | Padding interno compacto |
| `--ds-space-3` | 12px | Input padding, gap pequeño |
| `--ds-space-4` | 16px | Gap default entre elementos |
| `--ds-space-5` | 20px | Padding cards |
| `--ds-space-6` | 24px | Padding sections |
| `--ds-space-8` | 32px | Margen entre secciones |
| `--ds-space-10` | 40px | Section spacing |
| `--ds-space-12` | 48px | Hero padding |
| `--ds-space-16` | 64px | Page margins, section separators |
| `--ds-space-20` | 80px | Top-level containers |

---

## 4. Border radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--ds-radius-none` | 0 | Botones rectos (menos usados) |
| `--ds-radius-sm` | 4px | Inputs, badges |
| `--ds-radius-md` | 8px | Cards, modales, dropdowns |
| `--ds-radius-lg` | 12px | Modales grandes, contenedores |
| `--ds-radius-xl` | 16px | Hero cards, imágenes destacadas |
| `--ds-radius-full` | 9999px | Avatares, pills, tags |

---

## 5. Shadows (minimales, sin pesadez)

| Token | Valor | Uso |
|-------|-------|-----|
| `--ds-shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Cards default |
| `--ds-shadow-md` | `0 2px 8px rgba(0,0,0,0.4)` | Dropdowns, modales |
| `--ds-shadow-lg` | `0 4px 16px rgba(0,0,0,0.5)` | Modales grandes, sidebar |
| `--ds-shadow-xl` | `0 8px 32px rgba(0,0,0,0.6)` | Toasts, tooltips |

Nota: Sin box-shadow en cards con background. Usar shadow solo para elevación contextual.

---

## 6. Animations / Transitions

| Token | Valor | Uso |
|-------|-------|-----|
| `--ds-transition-fast` | 100ms | Color, background |
| `--ds-transition-base` | 200ms | Opacity, transform, layout |
| `--ds-transition-slow` | 300ms | Modal, sidebar |
| `--ds-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Salidas |
| `--ds-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Entradas |
| `--ds-ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Movimiento natural |

---

## 7. Component tokens

### Button
| Token | Valor |
|-------|-------|
| `--ds-btn-height` | 40px (sm: 32px, lg: 48px) |
| `--ds-btn-padding` | 16px 24px |
| `--ds-btn-radius` | 8px |
| `--ds-btn-font` | Poppins 500, 14px |
| `--ds-btn-transition` | 150ms |

### Input
| Token | Valor |
|-------|-------|
| `--ds-input-height` | 42px |
| `--ds-input-padding` | 0 14px |
| `--ds-input-radius` | 6px |
| `--ds-input-bg` | `--ds-color-surface-2` |
| `--ds-input-border` | `--ds-color-border` |
| `--ds-input-border-focus` | `--ds-color-primary` |
| `--ds-input-text` | `--ds-color-text-primary` |
| `--ds-input-placeholder` | `--ds-color-text-muted` |

### Card
| Token | Valor |
|-------|-------|
| `--ds-card-bg` | `--ds-color-surface-1` |
| `--ds-card-radius` | 12px |
| `--ds-card-padding` | 20px |
| `--ds-card-border` | `1px solid --ds-color-border` |
| `--ds-card-shadow` | none (border only) |

### Modal
| Token | Valor |
|-------|-------|
| `--ds-modal-bg` | `--ds-color-surface-1` |
| `--ds-modal-radius` | 12px |
| `--ds-modal-padding` | 24px |
| `--ds-modal-overlay` | `rgba(0,0,0,0.6)` |
| `--ds-modal-width` | default 480px, lg 640px, xl 800px |

### Badge
| Token | Valor |
|-------|-------|
| `--ds-badge-height` | 22px |
| `--ds-badge-padding` | 4px 10px |
| `--ds-badge-radius` | 9999px |
| `--ds-badge-font` | Poppins 500, 11px, tracking 0.5px |

---

## 8. Layout

### Grid
| Contexto | Columnas |
|----------|----------|
| Property cards (público) | 1 (< 640px) / 2 (< 1024px) / 3 (≥ 1024px) |
| Admin dashboard | 1 (< 768px) / 2 (< 1024px) / 3 (≥ 1024px) |
| Admin tables | Single column, scrollable |
| Sidebar + contenido | 240px + 1fr (≥ 1024px) |

### Container max-width
| Contexto | Max-width |
|----------|-----------|
| Público (landing) | 1280px |
| Público (listado) | 1366px |
| Admin | 100% (padding 24px) |

### Breakpoints (preservados)
320, 360, 390, 414, 480, 500, 600, 700, 768, 900, 1024, 1100, 1366, 1920

---

## 9. Iconografía

| Formato | Uso |
|---------|-----|
| SVG inline con `stroke="currentColor"` | UI icons, buttons, sidebar |
| SVG personalizados | Brand, property types |
| Tamaños: 16px (inline), 20px (buttons), 24px (sidebar), 32px (section icons) |

---

## 10. Tabla / DataTable

| Token | Valor |
|-------|-------|
| `--ds-table-header-bg` | `--ds-color-surface-2` |
| `--ds-table-row-hover` | `--ds-color-surface-3` |
| `--ds-table-row-alt` | `--ds-color-surface-1` (striped) |
| `--ds-table-radius` | `--ds-radius-md` |
| `--ds-table-cell-padding` | `12px 16px` |
| `--ds-table-header-font` | `--ds-weight-semibold`, 12px, tracking 0.5px |
