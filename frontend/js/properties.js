/**
 * properties.js — Renderizado del catálogo de propiedades
 */

const AVATAR_BG = ['#0b131e','#0b1a0d','#1a0b0b','#181808','#0b1818'];

function esc(v) { return String(v ?? '').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function fmt(n) {
  const usd = Number(n);
  return usd ? `USD ${usd.toLocaleString('es-AR')}` : '—';
}

// ── Carousel per card ────────────────────────────────────────────────
function initCarousel(card) {
  const imgs   = JSON.parse(card.dataset.images || '[]');
  const imgEl  = card.querySelector('.card-img');
  const dots   = card.querySelectorAll('.carousel-dot');
  const arrows = card.querySelectorAll('.carousel-arrow');
  let idx = 0;

  function goTo(i) {
    idx = (i + imgs.length) % imgs.length;
    const url = imgs[idx];
    const r = imgResponsive(url, [400, 800]);
    if (imgEl) {
      imgEl.src = r.src;
      if (r.srcset) imgEl.srcset = r.srcset;
    }
    dots.forEach((d, di) => d.classList.toggle('active', di === idx));
  }

  arrows.forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      goTo(idx + (btn.dataset.dir === '1' ? 1 : -1));
    });
  });
  dots.forEach((dot, di) => {
    dot.addEventListener('click', e => { e.stopPropagation(); goTo(di); });
  });
}

// ── Build single card HTML (rediseño premium) ─────────────────────────
function buildPropCard(prop) {
  const images   = prop.images || [];
  const hasImgs  = images.length > 0;
  const isSold   = prop.status === 'vendida';
  const n        = images.length;

  const statusMap = {
    disponible: { cls: 'badge-disponible', label: 'Disponible' },
    vendida:    { cls: 'badge-vendida',    label: 'Vendida' },
    oculta:     { cls: 'badge-oculta',     label: 'Oculta' },
  };
  const sd = statusMap[prop.status] || statusMap.disponible;

  const dotsHtml = n > 1
    ? `<div class="carousel-dots">${images.map((_, i) =>
        `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-i="${i}"></button>`).join('')}</div>`
    : '';
  const arrowsHtml = n > 1
    ? `<button class="carousel-arrow left" data-dir="-1">&#8249;</button>
       <button class="carousel-arrow right" data-dir="1">&#8250;</button>`
    : '';
  const featuredBadge = (prop.featured && !isSold)
    ? `<div class="badge badge-featured">Destacada</div>` : '';

  // Price badge on image
  const priceBadge = isSold
    ? '<span class="badge-price sold">Vendida</span>'
    : `<span class="badge-price">${fmt(prop.price)}</span>`;

  const etitle = esc(prop.title);
  const eloc   = esc(prop.location);
  const edesc  = esc(prop.desc || '');
  const etype  = esc(prop.type);

  const whatsappLink = !isSold
    ? `<a href="https://wa.me/${_wa()}?text=Hola%20Bienenhaus%2C%20me%20interesa%20la%20propiedad%20${encodeURIComponent(prop.title)}"
         target="_blank" class="btn btn-outline btn-sm">Consultar</a>`
    : '';

  return `
    <div class="prop-card${isSold ? ' sold' : ''}"
         data-images='${JSON.stringify(images)}'>
      <div class="card-img-wrap">
        ${hasImgs
          ? `<img class="card-img" ${imgAttrs(images[0], [400, 800])} alt="${etitle}" loading="lazy" decoding="async"
               onerror="this.src='https://picsum.photos/seed/fallback/900/600'"/>`
          : `<div class="card-no-img">Sin imagen</div>`}
        <div class="card-gradient"></div>
        <div class="badge badge-status ${sd.cls}">${sd.label}</div>
        <div class="badge badge-type">${etype}</div>
        ${featuredBadge}
        ${priceBadge}
        ${arrowsHtml}
        ${dotsHtml}
      </div>
      <div class="card-body">
        <div class="card-location">${eloc}</div>
        <a href="/venta/${prop.id}" class="card-title-link"><h3 class="card-title">${etitle}</h3></a>
        <p class="card-desc">${edesc}</p>
        <div class="card-specs">
          <div class="spec"><div class="spec-n">${prop.beds}</div><div class="spec-l">dorms.</div></div>
          <div class="spec"><div class="spec-n">${prop.baths}</div><div class="spec-l">baños</div></div>
          <div class="spec"><div class="spec-n">${prop.sqm}m²</div><div class="spec-l">sup.</div></div>
        </div>
        <div class="card-footer">
          <a href="/venta/${prop.id}" class="btn btn-ghost btn-sm">Ver detalle</a>
          ${whatsappLink}
        </div>
      </div>
    </div>`;
}

// ── Render grid ───────────────────────────────────────────────────────
function renderProperties(props, pagination) {
  const grid = document.getElementById('propsGrid');

  if (!props.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7"/>
          <path d="M21 21l-4.35-4.35"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </div>
      <div class="empty-title">Sin resultados</div>
      <div class="empty-sub">Probá con otros filtros o ampliá el rango de búsqueda.</div>
    </div>`;
    renderPagination(null);
    return;
  }

  grid.innerHTML = props.map(buildPropCard).join('');

  renderPagination(pagination);

  // Init carousels
  grid.querySelectorAll('.prop-card').forEach(initCarousel);
}

// ── Pagination UI ─────────────────────────────────────────────────────
function renderPagination(pag) {
  const wrap = document.getElementById('pagination');
  if (!wrap) return;
  if (!pag || pag.pages <= 1) { wrap.innerHTML = ''; return; }

  const prev = pag.has_prev
    ? `<button class="pag-btn" onclick="goToPage(${pag.page - 1})">‹ Anterior</button>`
    : `<span class="pag-btn pag-disabled">‹ Anterior</span>`;

  let nums = '';
  for (let i = 1; i <= pag.pages; i++) {
    if (i === pag.page) {
      nums += `<span class="pag-num pag-active">${i}</span>`;
    } else if (i === 1 || i === pag.pages || Math.abs(i - pag.page) <= 2) {
      nums += `<button class="pag-num" onclick="goToPage(${i})">${i}</button>`;
    } else if (nums.endsWith('…') === false) {
      nums += `<span class="pag-dots">…</span>`;
    }
  }

  const next = pag.has_next
    ? `<button class="pag-btn" onclick="goToPage(${pag.page + 1})">Siguiente ›</button>`
    : `<span class="pag-btn pag-disabled">Siguiente ›</span>`;

  wrap.innerHTML = `<div class="pag-inner">${prev}${nums}${next}</div>`;
}

// ── Load & filter ─────────────────────────────────────────────────────
async function loadProperties(filters = {}) {
  try {
    const data = await API.getProperties(filters);
    const props = data.properties;
    renderProperties(props, { page: data.page, pages: data.pages, total: data.total, has_prev: data.has_prev, has_next: data.has_next });
    return props;
  } catch (err) {
    document.getElementById('propsGrid').innerHTML =
      `<div class="loading-state">Error al cargar propiedades. ¿Está corriendo el backend?</div>`;
    console.warn(err);
    return [];
  }
}

window.loadProperties  = loadProperties;
window.buildPropCard   = buildPropCard;
window.renderProperties = renderProperties;
window.fmtPrice = fmt;
window.AVATAR_BG = AVATAR_BG;
