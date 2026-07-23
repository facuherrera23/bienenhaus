/*
 * admin-shared.js — Funciones compartidas entre Appraisals y Tasaciones
 * Se concatena ANTES de admin-appraisals.js y admin-tasaciones.js en el bundle.
 */

/**
 * Renderiza tarjetas de comparables (compartido entre ACM y Tasaciones).
 * @param {Object} a        - Appraisal o Tasacion con .comparables[]
 * @param {Object} cfg      - { prefix, getTipoFn }
 *   prefix: prefijo de clases CSS ej 'tas-' o ''
 *   getTipoFn: función que retorna el tipo de propiedad ej () => a.tipo_propiedad || 'casa'
 */
function renderComparableCardsShared(a, cfg) {
  const pfx = cfg.prefix || '';
  const getTipo = cfg.getTipoFn || (() => a.tipo_propiedad || 'casa');
  const comps = a.comparables || [];
  if (!comps.length) {
    return '<div class="ap-empty-card">No hay comparables cargados. Agregá al menos 2 para obtener una valuación.</div>';
  }
  const isReadOnly = a.estado === 'completada' || a.estado === 'archivada';

  function chip(label, value, color) {
    return `<div class="ap-label-chip">
      <div class="ap-overline-compact">${label}</div>
      <div style="color:${color||'var(--white)'};font-size:13px;font-weight:600;font-family:var(--font-title)">${value}</div>
    </div>`;
  }

  return comps.map(c => {
    const coef = _calcCoef(c);
    const pp = c.precio_por_m2 || (c.precio_usd && c.superficie_cubierta ? round(c.precio_usd / c.superficie_cubierta, 2) : null);
    const ajustado = _ajustado(c) || (pp && coef ? round(pp * coef, 2) : null);

    function attrBadge(attr, label) {
      const val = c[attr] || 'equivalente';
      const icon = val === 'superior' ? '↑' : val === 'inferior' ? '↓' : '=';
      const clr = val === 'superior' ? 'var(--accent)' : val === 'inferior' ? '#e74c3c' : 'var(--g3)';
      return `<span style="color:${clr};font-size:10px;font-weight:600">${icon} ${label}</span>`;
    }

    const isExcluded = c.excluido === true;
    const cardStyle = isExcluded ? 'opacity:0.5;filter:grayscale(1)' : '';

    return `<div class="acm-comparable-item" style="display:block;padding:16px;${cardStyle}">
      <div class="ap-flex-row-between-sm">
        <div>
          <strong class="ap-btn-text-light">C${c.numero}</strong>
          ${isExcluded ? '<span class="ap-inline-hint">[excluido]</span>' : ''}
          <span class="ap-inline-note">${esc((c.calle||'') + ' ' + (c.numero_calle||''))}</span>
          ${c.barrio ? `<span class="ap-inline-hint">· ${esc(c.barrio)}</span>` : ''}
        </div>
        ${isReadOnly ? '' : `<div class="ap-flex-row-tight">
          <button class="btn btn-ghost btn-sm ${pfx}editComparableBtn ap-btn-icon-sm" data-aid="${a.id}" data-cid="${c.id}">✎</button>
          <button class="btn btn-ghost btn-sm ${pfx}toggleExclusionBtn ap-btn-icon-sm" data-aid="${a.id}" data-cid="${c.id}" title="${isExcluded ? 'Incluir' : 'Excluir del cálculo'}">${isExcluded ? '◉' : '◎'}</button>
          <button class="btn btn-danger btn-sm ${pfx}deleteComparableBtn ap-btn-icon-sm" data-aid="${a.id}" data-cid="${c.id}">×</button>
        </div>`}
      </div>
      <div class="ap-four-col-grid">
        ${chip('Precio', _fmtUSD(c.precio_usd), 'var(--accent)')}
        ${chip('Precio/m²', pp ? _fmtUSD(pp) : '—', 'var(--white)')}
        ${chip('Coeficiente', coef.toFixed(4), coef > 1 ? '#e74c3c' : coef < 1 ? 'var(--accent)' : 'var(--g3)')}
        ${chip('$/m² Ajustado', ajustado ? _fmtUSD(ajustado) : '—', 'var(--accent)')}
      </div>
      <div class="ap-flex-wrap">
        ${(() => {
          const tipo = getTipo();
          const attrs = getTypeAttrs(tipo);
          return attrs.map(a => attrBadge(a[0], a[1])).join('');
        })()}
        <span class="ap-meta-right">${c.tipo_operacion === 'venta' ? 'Venta' : 'Cotización'}</span>
      </div>
    </div>`;
  }).join('');
}
