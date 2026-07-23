/**
 * admin-dashboard.js — Estadísticas y gráficos del panel
 */

let _topPage = 1;
let _rTopPage = 1;
const PER_PAGE = 5;

function _paginate(items, page) {
  const from = (page - 1) * PER_PAGE;
  return items.slice(from, from + PER_PAGE);
}

function _pageCount(items) {
  return Math.max(1, Math.ceil(items.length / PER_PAGE));
}

function _paginationHtml(page, total, prefix) {
  if (total <= 1) return '';
  let html = '<div class="pagination"><div class="page-numbers">';
  html += `<button class="page-btn page-btn--nav" data-${prefix}-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>&laquo; Anterior</button>`;
  for (let i = 1; i <= total; i++) {
    if (total > 7 && i > 2 && i < total - 1 && Math.abs(i - page) > 1) {
      if (i === 3 || i === total - 2) html += '<span class="page-dots">...</span>';
      continue;
    }
    html += `<button class="page-btn ${i === page ? 'page-btn--active' : ''}" data-${prefix}-page="${i}">${i}</button>`;
  }
  html += `<button class="page-btn page-btn--nav" data-${prefix}-page="${page + 1}" ${page >= total ? 'disabled' : ''}>Siguiente &raquo;</button>`;
  html += '</div></div>';
  return html;
}

function _topCard(p, i, maxViews, statusClass, fmtPriceFn, trendHtml) {
  const viewsPct = Math.round(p.views / maxViews * 100);
  return `
    <div class="dash-top-card">
      <span class="dash-top-rank">${i + 1}</span>
      ${p.image
        ? `<img class="dash-top-thumb" src="${p.image}" alt="" loading="lazy" onerror="this.style.display='none'"/>`
        : `<div class="dash-top-thumb dash-top-thumb--placeholder"></div>`}
      <div class="dash-top-info">
        <div class="dash-top-title">${p.title} ${trendHtml(p.views_last_7, p.views_prev_7)}</div>
        <div class="dash-top-meta">
          <span class="dash-top-loc">${p.location || ''}</span>
          <span class="dash-top-price">${fmtPriceFn(p)}</span>
        </div>
        <div class="dash-top-bar">
          <div class="dash-top-bar-fill" style="width:${viewsPct}%"></div>
        </div>
      </div>
      <div class="dash-top-views-wrap">
        <div class="dash-top-views">${p.views}</div>
        <div class="dash-top-views-label">vistas</div>
        <span class="dash-top-status ${statusClass[p.status] || ''}">${p.status}</span>
      </div>
    </div>`;
}

function _sparkline(data, w, h) {
  const vals = Object.values(data).map(Number);
  if (!vals.length) return '';
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1 || 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = vals[vals.length - 1] >= vals[0] ? 'var(--accent)' : '#cc4444';
  return `<svg class="dash-sparkline" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <polyline fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" points="${pts}" opacity=".7"/>
  </svg>`;
}

function _trendBadge(current, previous) {
  if (current == null || previous == null) return '';
  const diff = current - previous;
  if (diff === 0) return '<span class="dash-trend trend-flat">— 0%</span>';
  const pct = previous ? Math.round(diff / previous * 100) : 100;
  const cls = diff > 0 ? 'trend-up' : 'trend-down';
  const arr = diff > 0 ? '▲' : '▼';
  return `<span class="dash-trend ${cls}">${arr} ${Math.abs(pct)}%</span>`;
}

function crmSub(s) {
  if (!s.leads_total) return 'Sin prospectos aún';
  const parts = [];
  if (s.leads_by_status?.nuevo) parts.push(`${s.leads_by_status.nuevo} nuevos`);
  if (s.leads_unassigned) parts.push(`${s.leads_unassigned} sin agente`);
  return parts.join(' · ');
}

async function loadDashboard() {
  const wrap = $('dashboardContent');
  if (!wrap) return;
  wrap.innerHTML = '<div class="loading-state">Cargando estadísticas...</div>';

  try {
    const from = $('df')?.value || '';
    const to   = $('dt')?.value || '';
    const qs   = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to)   qs.set('to', to);
    const url  = '/api/stats' + (qs.toString() ? '?' + qs : '');

    const res = await fetch(url, { credentials: 'same-origin' });
    const d   = await res.json();
    if (!d.ok) throw new Error(d.error);
    const s = d.data;
    wrap.innerHTML = '';

    // ── TARJETAS SUPERIORES ──────────────────────────────────────────
    const cards = [
      { label: 'Propiedades',     n: s.total,       sub: `${s.disponible} disponibles · ${s.vendida} vendidas`, accent: false },
      { label: 'Disponibles',     n: s.disponible,  sub: 'En el mercado ahora',            accent: true  },
      { label: 'Vendidas',        n: s.vendida,      sub: 'Operaciones cerradas',           accent: false },
      { label: 'Visitas totales', n: s.total_views,  sub: `${s.avg_views} prom. por prop.`, accent: true  },
      { label: 'Precio promedio',  n: fmtPrice(s.avg_price), sub: 'Valor de mercado medio', accent: false },
      { label: 'Mensajes',        n: s.total_msgs,   sub: `${s.unread_msgs} sin leer · ${s.msgs_this_month} este mes`, accent: true  },
      { label: 'Conv. vistas→msgs', n: `${s.conversion_rate}%`, sub: 'Tasa de conversión', accent: false },
      { label: 'Agentes',      n: s.agents,       sub: 'En el equipo',                  accent: true  },
      { label: 'Prospectos',   n: s.leads_total || 0, sub: crmSub(s), accent: true  },
    ];

    const rCards = [
      { label: 'Alquileres',     n: s.rentals_total,   sub: `${s.rentals_disponible} disponibles · ${s.rentals_alquilada} alquiladas`, accent: false },
      { label: 'Disponibles',    n: s.rentals_disponible, sub: 'Para alquilar ahora',      accent: true  },
      { label: 'Alquiladas',     n: s.rentals_alquilada,  sub: 'Contratos activos',         accent: false },
      { label: 'Visitas alq.',   n: s.rentals_total_views, sub: `En todas las propiedades`, accent: true  },
      { label: 'Alq. promedio',  n: fmtAR(s.rentals_avg_price), sub: 'Precio de mercado medio', accent: false },
      { label: 'Expensas prom.', n: fmtAR(s.rentals_expenses_avg), sub: 'Gasto mensual promedio', accent: true  },
      { label: 'Amoblados',      n: s.rentals_furnished, sub: `${s.rentals_total ? Math.round(s.rentals_furnished/s.rentals_total*100) : 0}% del total`, accent: false },
      { label: 'Destacados',     n: s.rentals_featured, sub: `${s.rentals_total ? Math.round(s.rentals_featured/s.rentals_total*100) : 0}% destacados`, accent: true  },
    ];

    const cardsHtml = cards.map((card, i) => `
      <div class="dash-card">
        <div class="dash-card-label">${card.label} ${i === 3 ? _sparkline(s.views_by_day, 48, 16) : ''}</div>
        <div class="dash-card-number${card.accent ? ' accent' : ''}">${typeof card.n === 'string' ? card.n : card.n.toLocaleString('es-AR')}</div>
        <div class="dash-card-sub">
          ${card.sub}
          ${i === 3 ? _trendBadge(s.trends?.views_week, s.trends?.views_prev_week) : ''}
          ${i === 5 ? _trendBadge(s.trends?.msgs_week, s.trends?.msgs_prev_week) : ''}
        </div>
      </div>`).join('');

    const rCardsHtml = rCards.map((card, i) => `
      <div class="dash-card">
        <div class="dash-card-label">${card.label} ${i === 3 ? _sparkline(s.rentals_views_by_day, 48, 16) : ''}</div>
        <div class="dash-card-number${card.accent ? ' accent' : ''}">${typeof card.n === 'string' ? card.n : card.n.toLocaleString('es-AR')}</div>
        <div class="dash-card-sub">
          ${card.sub}
          ${i === 3 ? _trendBadge(s.trends?.r_views_week, s.trends?.r_views_prev_week) : ''}
        </div>
      </div>`).join('');

    // ── GRÁFICO DE BARRAS (reutilizable) ─────────────────────────────
    function barChart(id, data, options = {}) {
      const entries = Object.entries(data);
      if (!entries.length) return `<div class="dash-empty">Sin datos aún</div>`;
      const max = Math.max(...entries.map(([, v]) => v), 1);
      const h = 120, w = entries.length * 32 + 20;
      const bars = entries.map(([k, v], i) => {
        const x = i * 32 + 10;
        const bh = Math.max(2, (v / max) * (h - 20));
        const y = h - 10 - bh;
        return `<rect class="${options.barClass || 'chart-bar'}" x="${x}" y="${y}" width="18" height="${bh}" rx="2"
                     onmouseenter="showChartTip(event,'${v}','${k}')"
                     onmouseleave="hideChartTip()"/>`;
      }).join('');
      const labels = entries.map(([k], i) => {
        const x = i * 32 + 19;
        return `<text class="chart-x-label" x="${x}" y="${h - 2}">${k.length > 7 ? k.slice(0, 6) : k}</text>`;
      }).join('');
      return `
        <div class="dash-chart-wrap">
          <svg class="chart-svg" viewBox="0 0 ${w} ${h}">${bars}${labels}</svg>
          <div class="chart-tooltip" id="chartTip"></div>
        </div>`;
    }

    // ── BARRAS HORIZONTALES ─────────────────────────────────────────
    function horizBars(data, max, color) {
      const entries = Object.entries(data);
      if (!entries.length) return '<div class="dash-empty">Sin datos</div>';
      const m = max || Math.max(...entries.map(([, v]) => v), 1);
      return entries.map(([k, v]) => `
        <div class="dash-type-row">
          <span class="dash-type-label">${k}</span>
          <div class="dash-type-bar-wrap">
            <div class="dash-type-bar" style="width:${Math.round(v / m * 100)}%;background:${color || 'var(--accent)'}"></div>
          </div>
          <span class="dash-type-count">${v}</span>
        </div>`).join('');
    }

    // ── POR TIPO ────────────────────────────────────────────────────
    const maxType = Math.max(...Object.values(s.by_type), 1);
    const tipoNames = { casa:'Casa', departamento:'Departamento', finca:'Finca', terreno:'Terreno', local:'Local', otro:'Otro' };
    const typesHtml = Object.entries(s.by_type)
      .sort((a,b) => b[1]-a[1])
      .map(([tipo, n]) => `
        <div class="dash-type-row">
          <span class="dash-type-label">${tipoNames[tipo]||tipo}</span>
          <div class="dash-type-bar-wrap">
            <div class="dash-type-bar" style="width:${Math.round(n/maxType*100)}%"></div>
          </div>
          <span class="dash-type-count">${n}</span>
        </div>`).join('') || '<div class="dash-empty">Sin propiedades aún</div>';

    // ── TOP VISITAS ─────────────────────────────────────────────────
    const maxViews = Math.max(...s.top_viewed.map(p => p.views), 1);
    const statusClass = { disponible:'s-disponible', vendida:'s-vendida', oculta:'s-oculta' };
    function trendHtml(l7, p7) {
      if (l7 == null || p7 == null) return '';
      if (l7 === 0 && p7 === 0) return '';
      const diff = l7 - p7;
      const pct  = p7 ? Math.round(diff / p7 * 100) : 100;
      const cls  = diff > 0 ? 'trend-up' : diff < 0 ? 'trend-down' : '';
      const arr  = diff > 0 ? '▲' : diff < 0 ? '▼' : '—';
      return `<span class="dash-trend ${cls}">${arr} ${Math.abs(pct)}%</span>`;
    }

    function _renderTopSection(items, maxViews, statusClass, page, fmtPriceFn) {
      if (!items.length) return '<div class="dash-empty">Las visitas aparecerán aquí cuando alguien abra una propiedad.</div>';
      const total = _pageCount(items);
      if (page > total) page = total;
      const pageItems = _paginate(items, page);
      const cards = pageItems.map((p, i) => _topCard(p, (page - 1) * PER_PAGE + i, maxViews, statusClass, fmtPriceFn, trendHtml)).join('');
      return `<div class="dash-top-grid">${cards}</div>${_paginationHtml(page, total, 'top')}`;
    }

    const topHtml = _renderTopSection(s.top_viewed, maxViews, statusClass, _topPage, p => fmtPrice(p.price));

    // ── ESTADO DEL PORTFOLIO ────────────────────────────────────────
    const pct = s.total ? Math.round(s.disponible / s.total * 100) : 0;
    const estadoHtml = `
      <div class="dash-progress-section">
        <div class="dash-progress-head">
          <span class="dash-progress-label">Disponibles</span>
          <span class="dash-progress-value">${pct}%</span>
        </div>
        <div class="dash-progress-track">
          <div class="dash-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label">Disponibles</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar" style="width:${s.total?s.disponible/s.total*100:0}%"></div></div>
        <span class="dash-type-count">${s.disponible}</span>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label dash-label-sold">Vendidas</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-sold" style="width:${s.total?s.vendida/s.total*100:0}%"></div></div>
        <span class="dash-type-count">${s.vendida}</span>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label dash-label-hidden">Ocultas</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-hidden" style="width:${s.total?s.oculta/s.total*100:0}%"></div></div>
        <span class="dash-type-count">${s.oculta}</span>
      </div>
      <div class="dash-progress-sep">
        <div class="dash-type-row">
          <span class="dash-type-label">Destacadas</span>
          <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-featured" style="width:${s.total?s.featured/s.total*100:0}%"></div></div>
          <span class="dash-type-count">${s.featured}</span>
        </div>
      </div>`;

    // ── CHARTS: meses, ventas, visitas ──────────────────────────────
    const byMonthKeys = Object.keys(s.by_month || {}).sort();
    const byMonthSorted = {};
    byMonthKeys.forEach(k => { byMonthSorted[k] = s.by_month[k]; });

    const salesKeys = Object.keys(s.monthly_sales || {}).sort();
    const salesSorted = {};
    salesKeys.forEach(k => { salesSorted[k] = s.monthly_sales[k]; });

    const chartsHtml = `
      <div class="dash-charts">
        <div class="dash-chart-card">
          <div class="dash-chart-title">Publicadas por mes</div>
          ${barChart('chartMonth', byMonthSorted, { barClass: 'chart-bar' })}
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-title">Ventas mensuales</div>
          ${barChart('chartSales', salesSorted, { barClass: 'chart-bar bar-sale' })}
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-title">Visitas por día (30 días)</div>
          ${barChart('chartViews', s.views_by_day || {}, { barClass: 'chart-bar bar-view' })}
        </div>
      </div>`;

    // ── UBICACIONES ────────────────────────────────────────────────
    const maxLoc = Math.max(...Object.values(s.by_location || {}), 1);
    const locationsHtml = horizBars(s.by_location, maxLoc, 'var(--accent)');

    // ── PRECIO POR RANGO ────────────────────────────────────────────
    const maxPriceRange = Math.max(...Object.values(s.price_ranges || {}), 1);
    const priceHtml = horizBars(s.price_ranges, maxPriceRange, '#c9a84c');

    // ── MENSAJES POR MES ────────────────────────────────────────────
    const msgsKeys = Object.keys(s.msgs_by_month || {}).sort();
    const msgsSorted = {};
    msgsKeys.forEach(k => { msgsSorted[k] = s.msgs_by_month[k]; });

    // ── AGENTES ────────────────────────────────────────────────────
    const maxAgentProps = Math.max(...(s.agents_detail || []).map(a => a.properties), 1);
    const agentsHtml = (s.agents_detail || []).length
      ? (s.agents_detail || []).map(a => `
        <div class="dash-type-row">
          ${a.avatar
            ? `<img class="dash-agent-avatar" src="${a.avatar}" alt="${a.name}"/>`
            : `<div class="dash-agent-avatar dash-agent-avatar--empty">${(a.name[0] || '?').toUpperCase()}</div>`}
          <span class="dash-type-label dash-agent-name">${a.name}</span>
          <div class="dash-type-bar-wrap dash-agent-bar-wrap">
            <div class="dash-type-bar" style="width:${Math.round(a.properties / maxAgentProps * 100)}%"></div>
          </div>
          <span class="dash-type-count">${a.properties}</span>
        </div>`).join('')
      : '<div class="dash-empty">Sin agentes</div>';

    // ── RENTAL: tipo ──────────────────────────────────────────────
    const rMaxType = Math.max(...Object.values(s.rentals_by_type || {}), 1);
    const rTypesHtml = Object.entries(s.rentals_by_type || {})
      .sort((a,b) => b[1]-a[1])
      .map(([tipo, n]) => `
        <div class="dash-type-row">
          <span class="dash-type-label">${tipoNames[tipo]||tipo}</span>
          <div class="dash-type-bar-wrap">
            <div class="dash-type-bar rental-bar" style="width:${Math.round(n/rMaxType*100)}%"></div>
          </div>
          <span class="dash-type-count">${n}</span>
        </div>`).join('') || '<div class="dash-empty">Sin alquileres aún</div>';

    // ── RENTAL: portfolio ──────────────────────────────────────────
    const rPct = s.rentals_total ? Math.round(s.rentals_disponible / s.rentals_total * 100) : 0;
    const rEstadoHtml = `
      <div class="dash-progress-section">
        <div class="dash-progress-head">
          <span class="dash-progress-label">Disponibles</span>
          <span class="dash-progress-value">${rPct}%</span>
        </div>
        <div class="dash-progress-track">
          <div class="dash-progress-fill" style="width:${rPct}%"></div>
        </div>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label">Disponibles</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar rental-bar" style="width:${s.rentals_total?s.rentals_disponible/s.rentals_total*100:0}%"></div></div>
        <span class="dash-type-count">${s.rentals_disponible}</span>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label dash-label-sold">Alquiladas</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-sold" style="width:${s.rentals_total?s.rentals_alquilada/s.rentals_total*100:0}%"></div></div>
        <span class="dash-type-count">${s.rentals_alquilada}</span>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label dash-label-hidden">Ocultas</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-hidden" style="width:${s.rentals_total?s.rentals_oculta/s.rentals_total*100:0}%"></div></div>
        <span class="dash-type-count">${s.rentals_oculta}</span>
      </div>
      <div class="dash-progress-sep">
        <div class="dash-type-row">
          <span class="dash-type-label">Destacados</span>
          <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-featured" style="width:${s.rentals_total?s.rentals_featured/s.rentals_total*100:0}%"></div></div>
          <span class="dash-type-count">${s.rentals_featured}</span>
        </div>
      </div>`;

    // ── RENTAL: charts ────────────────────────────────────────────
    const rByMonthKeys = Object.keys(s.rentals_by_month || {}).sort();
    const rByMonthSorted = {};
    rByMonthKeys.forEach(k => { rByMonthSorted[k] = s.rentals_by_month[k]; });

    const rRentedKeys = Object.keys(s.rentals_monthly_rented || {}).sort();
    const rRentedSorted = {};
    rRentedKeys.forEach(k => { rRentedSorted[k] = s.rentals_monthly_rented[k]; });

    const rChartsHtml = `
      <div class="dash-charts">
        <div class="dash-chart-card">
          <div class="dash-chart-title">Alquileres publicados por mes</div>
          ${barChart('rChartMonth', rByMonthSorted, { barClass: 'chart-bar bar-rental' })}
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-title">Alquileres mensuales</div>
          ${barChart('rChartRented', rRentedSorted, { barClass: 'chart-bar bar-rented' })}
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-title">Visitas a alquileres por día (30 días)</div>
          ${barChart('rChartViews', s.rentals_views_by_day || {}, { barClass: 'chart-bar bar-rview' })}
        </div>
      </div>`;

    // ── RENTAL: ubicaciones ───────────────────────────────────────
    const rMaxLoc = Math.max(...Object.values(s.rentals_by_location || {}), 1);
    const rLocationsHtml = horizBars(s.rentals_by_location, rMaxLoc, '#e67e22');

    // ── RENTAL: top viewed ────────────────────────────────────────
    const rMaxViews = Math.max(...(s.rentals_top_viewed || []).map(p => p.views), 1);
    const rStatusClass = { disponible:'s-disponible', alquilada:'s-vendida', oculta:'s-oculta' };
    function _renderRentalsTopSection(items, maxViews, statusClass, page) {
      if (!items.length) return '<div class="dash-empty">Las visitas aparecerán aquí cuando alguien abra un alquiler.</div>';
      const total = _pageCount(items);
      if (page > total) page = total;
      const pageItems = _paginate(items, page);
      const cards = pageItems.map((p, i) => _topCard(p, (page - 1) * PER_PAGE + i, maxViews, statusClass, p => fmtAR(p.price_ars), trendHtml)).join('');
      return `<div class="dash-top-grid">${cards}</div>${_paginationHtml(page, total, 'rtop')}`;
    }
    const rTopHtml = _renderRentalsTopSection(s.rentals_top_viewed || [], rMaxViews, rStatusClass, _rTopPage);

    // ── Date filter bar ─────────────────────────────────────────────
    const filterHtml = `
      <div class="dash-filter-bar">
        <label class="dash-filter-label">Desde</label>
        <input id="df" type="date" class="dash-filter-input" value="${from}"/>
        <label class="dash-filter-label">Hasta</label>
        <input id="dt" type="date" class="dash-filter-input" value="${to}"/>
        <button class="btn btn-primary btn-sm" onclick="loadDashboard()">Filtrar</button>
        ${from || to ? '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'df\').value=\'\';document.getElementById(\'dt\').value=\'\';loadDashboard()">Limpiar</button>' : ''}
      </div>`;

    // ── MONTAR ──────────────────────────────────────────────────────
    wrap.innerHTML = filterHtml + `
      <div class="dash-section-title">Ventas</div>
      <div class="dash-cards dash-cards--8">${cardsHtml}</div>
      ${chartsHtml}
      <div class="dash-grid-3">
        <div class="dash-panel">
          <div class="dash-panel-title">Por tipo de propiedad</div>
          ${typesHtml}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Estado del portfolio</div>
          ${estadoHtml}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Precio por rango</div>
          ${priceHtml}
        </div>
      </div>
      <div class="dash-grid-2">
        <div class="dash-panel">
          <div class="dash-panel-title">Ubicaciones</div>
          ${locationsHtml}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Mensajes por mes</div>
          ${barChart('chartMsgs', msgsSorted, { barClass: 'chart-bar bar-msg' })}
        </div>
      </div>
      <div class="dash-grid-2">
        <div class="dash-panel">
          <div class="dash-panel-title">Rendimiento de agentes</div>
          ${agentsHtml}
        </div>
        <div class="dash-panel" id="topViewedPanel">
          <div class="dash-panel-title">Propiedades más vistas</div>
          ${topHtml}
        </div>
      </div>

      <div class="dash-divider"></div>
      <div class="dash-section-title">Alquileres</div>
      <div class="dash-cards dash-cards--8">${rCardsHtml}</div>
      ${rChartsHtml}
      <div class="dash-grid-3">
        <div class="dash-panel">
          <div class="dash-panel-title">Por tipo de alquiler</div>
          ${rTypesHtml}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Estado del portfolio</div>
          ${rEstadoHtml}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Ubicaciones</div>
          ${rLocationsHtml}
        </div>
      </div>
      <div class="dash-panel" id="rTopViewedPanel">
        <div class="dash-panel-title">Alquileres más vistos</div>
        ${rTopHtml}
      </div>`;

    // Evitar acumulación de listeners
    wrap.removeEventListener('click', wrap._onPageClick);
    wrap._onPageClick = function _onPageClick(e) {
      const btn = e.target.closest('.page-btn[data-top-page]');
      if (btn && !btn.disabled) {
        const page = parseInt(btn.dataset.topPage);
        if (isNaN(page) || page < 1) return;
        _topPage = page;
        const panel = $('topViewedPanel');
        if (panel) {
          panel.innerHTML = `<div class="dash-panel-title">Propiedades m&aacute;s vistas</div>` + _renderTopSection(s.top_viewed, maxViews, statusClass, _topPage, p => fmtPrice(p.price));
        }
        return;
      }
      const rBtn = e.target.closest('.page-btn[data-rtop-page]');
      if (rBtn && !rBtn.disabled) {
        const page = parseInt(rBtn.dataset.rtopPage);
        if (isNaN(page) || page < 1) return;
        _rTopPage = page;
        const panel = $('rTopViewedPanel');
        if (panel) {
          panel.innerHTML = `<div class="dash-panel-title">Alquileres m&aacute;s vistos</div>` + _renderRentalsTopSection(s.rentals_top_viewed || [], rMaxViews, rStatusClass, _rTopPage);
        }
        return;
      }
    };
    wrap.addEventListener('click', wrap._onPageClick);

  } catch(e) {
    wrap.innerHTML = '<div class="loading-state"></div>'; wrap.firstChild.textContent = 'Error al cargar estadísticas: ' + (e.message || '');
  }
}
