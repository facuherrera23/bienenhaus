/**
 * Property Card Component
 */

import { config } from '@/utils/config.js';

/**
 * Escape HTML to prevent XSS
 */
function esc(v) {
  return String(v ?? '').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');
}

/**
 * Format price
 */
function fmtPrice(price) {
  const n = Number(price);
  return n ? `USD ${n.toLocaleString('es-AR')}` : '—';
}

/**
 * Build responsive image attributes
 */
function imgAttrs(src, widths = [400, 800, 1200]) {
  if (!src || !src.includes('res.cloudinary.com')) {
    return `src="${src || '/images/placeholder-property.svg'}"`;
  }
  const parts = src.split('/upload/');
  if (parts.length !== 2) return `src="${src}"`;
  const base = parts[0] + '/upload/';
  const path = parts[1].replace(/^v\d+\//, '');
  const srcset = widths.map(w => `${base}w_${w},c_scale,f_auto,q_auto/${path} ${w}w`).join(', ');
  return `src="${base}w_${widths[widths.length-1]},f_auto,q_auto/${path}" srcset="${srcset}" sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, ${widths[widths.length-1]}px"`;
}

/**
 * Status badge configuration
 */
const STATUS_BADGES = {
  disponible: { cls: 'badge-disponible', label: 'Disponible' },
  vendida: { cls: 'badge-vendida', label: 'Vendida' },
  alquilada: { cls: 'badge-vendida', label: 'Alquilada' },
  oculta: { cls: 'badge-oculta', label: 'Oculta' }
};

/**
 * Build property card HTML
 */
export function buildPropertyCard(prop) {
  const images = prop.images || [];
  const hasImages = images.length > 0;
  const isSold = prop.status === 'vendida' || prop.status === 'alquilada';

  const status = STATUS_BADGES[prop.status] || STATUS_BADGES.disponible;

  const carouselDots = images.length > 1
    ? `<div class="carousel-dots">${images.map((_, i) =>
      `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-i="${i}"></button>`
    ).join('')}</div>`
    : '';

  const carouselArrows = images.length > 1
    ? `<button class="carousel-arrow left" data-dir="-1">&#8249;</button>
       <button class="carousel-arrow right" data-dir="1">&#8250;</button>`
    : '';

  const featuredBadge = prop.featured && !isSold
    ? '<div class="badge badge-featured">Destacada</div>'
    : '';

  const priceBadge = isSold
    ? '<span class="badge-price sold">Vendida</span>'
    : `<span class="badge-price">${fmtPrice(prop.price)}</span>`;

  const etitle = esc(prop.title);
  const eloc = esc(prop.location);
  const edesc = esc(prop.desc || prop.description || '');
  const etype = esc(prop.type || '');

  return `
<article class="prop-card${isSold ? ' sold' : ''}" data-images='${JSON.stringify(images)}'>
  <div class="card-img-wrap">
    ${hasImages
      ? `<img class="card-img" ${imgAttrs(images[0])} alt="${etitle}" loading="lazy" decoding="async"
           onerror="if(this.src !== '/images/placeholder-property.svg'){ this.src='/images/placeholder-property.svg'; this.onerror=null; }"/>`
      : '<div class="card-no-img">Sin imagen</div>'}
    <div class="card-gradient"></div>
    <div class="badge badge-status ${status.cls}">${status.label}</div>
    <div class="badge badge-type">${etype}</div>
    ${featuredBadge}
    ${priceBadge}
    ${carouselArrows}
    ${carouselDots}
  </div>

  <div class="card-body">
    <div class="card-location">${eloc}</div>
    <a href="/${prop.type === 'alquiler' ? 'alquiler' : 'venta'}/${prop.id}" class="card-title-link">
      <h3 class="card-title">${etitle}</h3>
    </a>
    <p class="card-desc">${edesc}</p>

    <div class="card-specs">
      <div class="spec"><div class="spec-n">${prop.beds || '—'}</div><div class="spec-l">dorms.</div></div>
      <div class="spec"><div class="spec-n">${prop.baths || '—'}</div><div class="spec-l">baños</div></div>
      <div class="spec"><div class="spec-n">${prop.sqm || ''}m²</div><div class="spec-l">sup.</div></div>
    </div>

    <div class="card-footer">
      <a href="/${prop.type === 'alquiler' ? 'alquiler' : 'venta'}/${prop.id}" class="btn btn-ghost btn-sm">Ver detalle</a>
      <a href="https://wa.me/${config.getWhatsAppNumber() || '5493514110000'}?text=Hola%20Bienenhaus%2C%20me%20interesa%20la%20propiedad%20${encodeURIComponent(prop.title)}"
         target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Consultar</a>
    </div>
  </div>
</article>`;
}

/**
 * Initialize carousel for a card
 */
export function initCarousel(card) {
  const images = JSON.parse(card.dataset.images || '[]');
  const img = card.querySelector('.card-img');
  const dots = card.querySelectorAll('.carousel-dot');
  const arrows = card.querySelectorAll('.carousel-arrow');
  let current = 0;

  function showSlide(index) {
    current = (index + images.length) % images.length;
    const src = images[current];
    if (img && src) {
      img.src = src;
    }
    dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  arrows.forEach(arrow => {
    arrow.addEventListener('click', e => {
      e.stopPropagation();
      showSlide(current + (arrow.dataset.dir === '1' ? 1 : -1));
    });
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', e => {
      e.stopPropagation();
      showSlide(i);
    });
  });
}

/**
 * Render properties to grid
 */
export function renderProperties(gridId, properties) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  if (!properties.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7"/>
            <path d="M21 21l-4.35-4.35"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
        <div class="empty-title">Sin resultados</div>
        <div class="empty-sub">Probá con otros filtros o amplíá el rango de búsqueda.</div>
      </div>`;
    return;
  }

  grid.innerHTML = properties.map(buildPropertyCard).join('');
  grid.querySelectorAll('.prop-card').forEach(initCarousel);
}

export default { buildPropertyCard, renderProperties, initCarousel };