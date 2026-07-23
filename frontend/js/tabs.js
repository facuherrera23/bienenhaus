// ── TABS ──────────────────────────────────────────────────────────
function switchTab(tab) {
  _activeTab = tab;
  document.querySelectorAll('.prop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

  const saleGrid = document.getElementById('propsGrid');
  const rentGrid = document.getElementById('rentalsGridIndex');
  const salePag  = document.getElementById('pagination');
  const rentPag  = document.getElementById('rentalPaginationIndex');

  if (tab === 'venta') {
    saleGrid.classList.remove('hidden');
    rentGrid.classList.add('hidden');
    salePag.classList.remove('hidden');
    rentPag.classList.add('hidden');
    if (!saleGrid.querySelector('.prop-card')) applyFilters();
  } else {
    saleGrid.classList.add('hidden');
    rentGrid.classList.remove('hidden');
    salePag.classList.add('hidden');
    rentPag.classList.remove('hidden');
    if (!rentGrid.querySelector('.prop-card')) applyRentalFilters();
  }
}
window.switchTab = switchTab;

function initTabs() {
  document.querySelectorAll('.prop-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  const rentGrid = document.getElementById('rentalsGridIndex');
  const rentPag  = document.getElementById('rentalPaginationIndex');
  const salePag  = document.getElementById('pagination');
  if (rentGrid) rentGrid.classList.add('hidden');
  if (rentPag) rentPag.classList.add('hidden');
  if (salePag) salePag.classList.remove('hidden');
}
window.initTabs = initTabs;

// ── RENTAL helpers for index ──────────────────────────────────────
function fmtAR(n) {
  return `AR$ ${Number(n).toLocaleString('es-AR')}/mes`;
}

function buildRentalCard(rental) {
  const images   = rental.images || [];
  const hasImgs  = images.length > 0;
  const isRented = rental.status === 'alquilada';

  const statusMap = {
    disponible: { cls: 'badge-disponible', label: 'Disponible' },
    alquilada:  { cls: 'badge-vendida', label: 'Alquilada' },
  };
  const sd = statusMap[rental.status] || statusMap.disponible;

  const n = images.length;
  const dotsHtml = n > 1
    ? `<div class="carousel-dots">${images.map((_, i) =>
        `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-i="${i}"></button>`).join('')}</div>`
    : '';
  const arrowsHtml = n > 1
    ? `<button class="carousel-arrow left" data-dir="-1">&#8249;</button>
       <button class="carousel-arrow right" data-dir="1">&#8250;</button>`
    : '';

  const etitle = esc(rental.title);
  const eloc   = esc(rental.location);
  const edesc  = esc(rental.desc || '');
  const priceBadge = isRented
    ? '<span class="badge-price sold">Alquilada</span>'
    : `<span class="badge-price">${fmtAR(rental.price_ars)}</span>`;

  return `
    <div class="prop-card${isRented ? ' sold' : ''}"
         data-images='${JSON.stringify(images)}'>
      <div class="card-img-wrap">
        ${hasImgs
          ? `<img class="card-img" ${imgAttrs(images[0], [400, 800])} alt="${etitle}" loading="lazy" decoding="async"
               onerror="this.src='https://picsum.photos/seed/fallback/900/600'"/>`
          : `<div class="card-no-img">Sin imagen</div>`}
        <div class="card-gradient"></div>
        <div class="badge badge-status ${sd.cls}">${sd.label}</div>
        <div class="badge badge-type">${esc(rental.type||'')}</div>
        ${rental.featured ? '<div class="badge badge-featured">Destacado</div>' : ''}
        ${priceBadge}
        ${arrowsHtml}
        ${dotsHtml}
      </div>
      <div class="card-body">
        <div class="card-location">${eloc}</div>
        <a href="/alquiler/${rental.id}" class="card-title-link"><h3 class="card-title">${etitle}</h3></a>
        <p class="card-desc">${edesc}</p>
        <div class="card-specs">
          <div class="spec"><div class="spec-n">${rental.beds||'—'}</div><div class="spec-l">dorms.</div></div>
          <div class="spec"><div class="spec-n">${rental.baths||'—'}</div><div class="spec-l">baños</div></div>
          <div class="spec"><div class="spec-n">${rental.sqm||''}m²</div><div class="spec-l">sup.</div></div>
        </div>
        <div class="card-footer">
          <a href="/alquiler/${rental.id}" class="btn btn-ghost btn-sm">Ver detalle</a>
           <a href="https://wa.me/${_wa()}?text=Hola%20Bienenhaus%2C%20me%20interesa%20el%20alquiler%20${encodeURIComponent(rental.title)}"
             target="_blank" class="btn btn-outline btn-sm">Consultar</a>
        </div>
      </div>
    </div>`;
}

function renderRentalsIndex(rentals) {
  const grid = document.getElementById('rentalsGridIndex');
  if (!grid) return;
  if (!rentals.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-title">Sin resultados</div><div class="empty-sub">Proximamente más alquileres.</div></div>`;
    return;
  }
  grid.innerHTML = rentals.map(buildRentalCard).join('');
  grid.querySelectorAll('.prop-card').forEach(initCarousel);
}

// ── RENTAL PAGINATION ─────────────────────────────────────────────
function renderRentalPagination(pag) {
  const wrap = document.getElementById('rentalPaginationIndex');
  if (!wrap) return;
  if (!pag || pag.pages <= 1) { wrap.innerHTML = ''; return; }

  const p = pag.page, pages = pag.pages;
  let html = '<div class="pag-inner">';

  html += `<button class="pag-btn" onclick="goToRentalPage(${p - 1})" ${pag.has_prev ? '' : 'disabled'}>‹ Anterior</button>`;

  const maxVisible = 5;
  let start = Math.max(1, p - Math.floor(maxVisible / 2));
  let end   = Math.min(pages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  if (start > 1) { html += `<button class="pag-num" onclick="goToRentalPage(1)">1</button>`; if (start > 2) html += '<span class="pag-dots">…</span>'; }
  for (let i = start; i <= end; i++) html += `<button class="pag-num${i === p ? ' pag-active' : ''}" onclick="goToRentalPage(${i})">${i}</button>`;
  if (end < pages) { if (end < pages - 1) html += '<span class="pag-dots">…</span>'; html += `<button class="pag-num" onclick="goToRentalPage(${pages})">${pages}</button>`; }

  html += `<button class="pag-btn" onclick="goToRentalPage(${p + 1})" ${pag.has_next ? '' : 'disabled'}>Siguiente ›</button>`;
  html += '</div>';
  wrap.innerHTML = html;
}
