/**
 * Geo Recommendations Component
 * Shows properties near user's location
 */

export class GeoRecommendations {
  constructor() {
    this.section = null;
    this.grid = null;
    this.loading = null;
    this.recTitle = null;
    this.recSub = null;
  }

  render(container) {
    if (!container) return;
    container.innerHTML = this.getHTML();
    this.bindElements();
  }

  getHTML() {
    return `
<section id="recomendaciones" class="section section-recom hidden">
  <div class="container">
    <div class="section-heading">
      <p class="eyebrow">Recomendados para vos</p>
      <h2 class="sh-title" id="recTitle">Propiedades cerca de tu zona</h2>
      <p class="sh-sub" id="recSub">Encontrá propiedades cercanas a tu ubicación</p>
      <div class="sh-line"></div>
    </div>
    <div id="recGrid" class="props-grid">
      <div class="loading-state" id="recLoading">Detectando ubicación...</div>
    </div>
  </div>
</section>
`;
  }

  bindElements() {
    this.section = document.getElementById('recomendaciones');
    this.grid = document.getElementById('recGrid');
    this.loading = document.getElementById('recLoading');
    this.recTitle = document.getElementById('recTitle');
    this.recSub = document.getElementById('recSub');
  }

  async init() {
    if (!this.section || !this.grid) return;

    if (!navigator.geolocation) {
      this.section.classList.add('hidden');
      return;
    }

    let lat, lng;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000, enableHighAccuracy: false
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (err) {
      console.warn('Geolocation error:', err.message || err);
      this.showLocationError();
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&accept-language=es`,
        { headers: { 'User-Agent': 'Bienenhaus/1.0' } }
      );
      const geo = await res.json();
      const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || '';
      const neighborhood = geo.address?.suburb || geo.address?.neighbourhood || geo.address?.quarter || '';
      const place = neighborhood || city;

      if (!place) {
        this.section.classList.add('hidden');
        return;
      }

      if (this.loading) this.loading.textContent = 'Buscando propiedades...';

      try {
        const data = await window.API.getProperties({ search: place, per_page: 6, sort: 'default' });
        const props = data.properties || [];

        if (!props.length) {
          this.section.classList.add('hidden');
          return;
        }

        this.recTitle?.textContent = `Propiedades cerca de ${place}`;
        this.recSub?.textContent = 'Recomendadas según tu ubicación';
        this.section.classList.remove('hidden');
        this.grid.innerHTML = props.map(this.buildPropCard).join('');
        this.grid.querySelectorAll('.prop-card').forEach(card => this.initCarousel(card));
      } catch {
        this.section.classList.add('hidden');
      }
    } catch {
      this.section.classList.add('hidden');
    }
  }

  showLocationError() {
    if (this.loading) {
      this.loading.textContent = 'No pudimos detectar tu ubicación. Usá los filtros para buscar.';
      this.loading.style.color = 'var(--color-accent)';
    }
    setTimeout(() => this.section?.classList.add('hidden'), 3000);
  }

  buildPropCard(prop) {
    const images = prop.images || [];
    const hasImages = images.length > 0;
    const isSold = prop.status === 'vendida';
    const status = { disponible: { cls: 'badge-disponible', label: 'Disponible' }, vendida: { cls: 'badge-vendida', label: 'Vendida' } };
    const sd = status[prop.status] || status.disponible;

    const imagesJson = JSON.stringify(images).replace(/"/g, '"');
    const dotsHtml = images.length > 1 ? `<div class="carousel-dots">${images.map((_, i) => `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-i="${i}"></button>`).join('')}</div>` : '';
    const arrowsHtml = images.length > 1 ? '<button class="carousel-arrow left" data-dir="-1">&#8249;</button><button class="carousel-arrow right" data-dir="1">&#8250;</button>' : '';
    const featuredBadge = prop.featured && !isSold ? '<div class="badge badge-featured">Destacada</div>' : '';
    const priceBadge = isSold ? '<span class="badge-price sold">Vendida</span>' : `<span class="badge-price">${prop.price ? 'USD ' + Number(prop.price).toLocaleString('es-AR') : '—'}</span>`;
    const etitle = esc(prop.title);
    const eloc = esc(prop.location);
    const edesc = esc(prop.desc || prop.description || '');
    const etype = esc(prop.type || '');

    return `
<article class="prop-card${isSold ? ' sold' : ''}" data-images='${imagesJson}'>
  <div class="card-img-wrap">
    ${hasImages
      ? `<img class="card-img" src="${images[0]}" alt="${esc(prop.title)}" loading="lazy" decoding="async" onerror="if(this.src !== '/images/placeholder-property.svg'){ this.src='/images/placeholder-property.svg'; this.onerror=null; }"/>`
      : '<div class="card-no-img">Sin imagen</div>'}
    <div class="card-gradient"></div>
    <div class="badge badge-status ${sd.cls}">${sd.label}</div>
    <div class="badge badge-type">${etype}</div>
    ${prop.featured && !isSold ? '<div class="badge badge-featured">Destacada</div>' : ''}
    ${priceBadge}
    ${arrowsHtml}
    ${dotsHtml}
  </div>
  <div class="card-body">
    <div class="card-location">${eloc}</div>
    <a href="/venta/${prop.id}" class="card-title-link"><h3 class="card-title">${etitle}</h3></a>
    <p class="card-desc">${edesc}</p>
    <div class="card-specs">
      <div class="spec"><div class="spec-n">${prop.beds || '—'}</div><div class="spec-l">dorms.</div></div>
      <div class="spec"><div class="spec-n">${prop.baths || '—'}</div><div class="spec-l">baños</div></div>
      <div class="spec"><div class="spec-n">${prop.sqm || ''}m²</div><div class="spec-l">sup.</div></div>
    </div>
    <div class="card-footer">
      <a href="/venta/${prop.id}" class="btn btn-ghost btn-sm">Ver detalle</a>
      <a href="https://wa.me/5493514110000?text=Hola%20Bienenhaus%2C%20me%20interesa%20la%20propiedad%20${encodeURIComponent(prop.title)}" target="_blank" class="btn btn-outline btn-sm">Consultar</a>
    </div>
  </div>
</article>`;
  }

  initCarousel(card) {
    const images = JSON.parse(card.dataset.images || '[]');
    const img = card.querySelector('.card-img');
    const dots = card.querySelectorAll('.carousel-dot');
    const arrows = card.querySelectorAll('.carousel-arrow');
    let current = 0;

    function showSlide(index) {
      current = (index + images.length) % images.length;
      const src = images[current];
      if (img && src) img.src = src;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
    }

    arrows.forEach(arrow => arrow.addEventListener('click', e => { e.stopPropagation(); showSlide(current + (arrow.dataset.dir === '1' ? 1 : -1)); }));
    dots.forEach((dot, i) => dot.addEventListener('click', e => { e.stopPropagation(); showSlide(i); }));
  }

  init() {
    if (!this.section || !this.grid) return;
    this.init();
  }
}

export default GeoRecommendations;