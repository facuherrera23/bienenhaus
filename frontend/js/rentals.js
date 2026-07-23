/**
 * rentals.js — Catálogo de alquileres
 */

const AVATAR_BG = ['#0b131e','#0b1a0d','#1a0b0b','#181808','#0b1818'];

function esc(v) { return String(v ?? '').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function fmtAR(n) {
  return `ARS ${Number(n).toLocaleString('es-AR')}`;
}

function fmtExp(n) {
  if (!n || n === 0) return '';
  return `Expensas: ${fmtAR(n)}`;
}

function initCarousel(card) {
  const imgs   = JSON.parse(card.dataset.images || '[]');
  const imgEl  = card.querySelector('.card-img');
  const dots   = card.querySelectorAll('.carousel-dot');
  const arrows = card.querySelectorAll('.carousel-arrow');
  let idx = 0;

  function goTo(i) {
    idx = (i + imgs.length) % imgs.length;
    const url = imgs[idx];
    const r = window.imgResponsive ? window.imgResponsive(url, [400, 800]) : { src: url };
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

function buildRentalCard(rental) {
  const images   = rental.images || [];
  const hasImgs  = images.length > 0;
  const isRented = rental.status === 'alquilada';
  const n        = images.length;

  const statusMap = {
    disponible: { cls: 'badge-disponible', label: 'Disponible' },
    alquilada:  { cls: 'rental-badge-alquilada', label: 'Alquilada' },
    oculta:     { cls: 'badge-oculta', label: 'Oculta' },
  };
  const sd = statusMap[rental.status] || statusMap.disponible;

  const dotsHtml = n > 1
    ? `<div class="carousel-dots">${images.map((_, i) =>
        `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-i="${i}"></button>`).join('')}</div>`
    : '';
  const arrowsHtml = n > 1
    ? `<button class="carousel-arrow left" data-dir="-1">&#8249;</button>
       <button class="carousel-arrow right" data-dir="1">&#8250;</button>`
    : '';
  const featuredBadge = (rental.featured && !isRented)
    ? `<div class="badge badge-featured">Destacado</div>` : '';

  const etitle   = esc(rental.title);
  const eloc     = esc(rental.location);
  const edesc    = esc(rental.desc || '');
  const etype    = esc(rental.type);
  const expHtml  = rental.expenses > 0 ? `<div class="card-expenses">+ ${fmtAR(rental.expenses)} expensas</div>` : '';
  const furnishChip = rental.furnished ? '<span class="card-feature-chip furnished">&#9679; Amoblado</span>' : '';
  const monthsText  = rental.min_months > 0 ? `<span class="card-feature-chip">Mín. ${rental.min_months} meses</span>` : '';

  return `
    <div class="prop-card${isRented ? ' sold' : ''}"
         data-images='${JSON.stringify(images)}'>
      <div class="card-img-wrap">
        ${hasImgs
          ? `<img class="card-img" ${window.imgAttrs ? window.imgAttrs(images[0], [400, 800]) : `src="${images[0]}"`} alt="${etitle}" loading="lazy" decoding="async"
               onerror="this.src='https://picsum.photos/seed/fallback/900/600'"/>`
          : `<div class="card-no-img">Sin imagen</div>`}
        <div class="card-gradient"></div>
        <div class="badge badge-status ${sd.cls}">${sd.label}</div>
        <div class="badge badge-type">${etype}</div>
        ${featuredBadge}
        ${arrowsHtml}
        ${dotsHtml}
      </div>
      <div class="card-body">
        <div class="card-location">${eloc}</div>
        <a href="/alquiler/${rental.id}" class="card-title-link"><h3 class="card-title">${etitle}</h3></a>
        <p class="card-desc">${edesc}</p>
        <div class="card-specs">
          <div class="spec"><div class="spec-n">${rental.beds}</div><div class="spec-l">dorms.</div></div>
          <div class="spec"><div class="spec-n">${rental.baths}</div><div class="spec-l">baños</div></div>
          <div class="spec"><div class="spec-n">${rental.sqm}m²</div><div class="spec-l">sup.</div></div>
        </div>
        <div class="card-features">${furnishChip}${monthsText}</div>
        <div class="card-footer">
          <div>
            <div class="card-price-ars${isRented ? ' sold' : ''}">
              ${fmtAR(rental.price_ars)} <small>/mes</small>
            </div>
            ${expHtml}
          </div>
          <a href="/alquiler/${rental.id}" class="btn btn-ghost btn-sm">Ver detalle</a>
          ${!isRented
            ? `<a href="https://wa.me/${_wa()}?text=Hola%20Bienenhaus%2C%20me%20interesa%20el%20alquiler%20${encodeURIComponent(rental.title)}"
                 target="_blank" class="btn btn-outline btn-sm">Consultar</a>`
            : ''}
        </div>
      </div>
    </div>`;
}

function renderRentals(rentals, pagination) {
  const grid = document.getElementById('rentalsGrid');
  const counter = document.getElementById('rentalCount');

  if (!rentals.length) {
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
    counter.textContent = '0 alquileres encontrados';
    renderPagination(null);
    return;
  }

  const label = rentals.length === 1 ? 'alquiler encontrado' : 'alquileres encontrados';
  counter.textContent = `${pagination?.total ?? rentals.length} ${label}`;
  grid.innerHTML = rentals.map(buildRentalCard).join('');

  renderPagination(pagination);

  grid.querySelectorAll('.prop-card').forEach(initCarousel);
}

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

async function loadRentals(filters = {}) {
  try {
    const data = await API.getRentals(filters);
    const rentals = data.rentals;
    renderRentals(rentals, { page: data.page, pages: data.pages, total: data.total, has_prev: data.has_prev, has_next: data.has_next });
    return rentals;
  } catch (err) {
    document.getElementById('rentalsGrid').innerHTML =
      `<div class="loading-state">Error al cargar alquileres. ¿Está corriendo el backend?</div>`;
    console.warn(err);
    return [];
  }
}

window.loadRentals  = loadRentals;
window.buildRentalCard = buildRentalCard;
window.renderRentals  = renderRentals;
window.fmtAR = fmtAR;
window.AVATAR_BG = AVATAR_BG;
