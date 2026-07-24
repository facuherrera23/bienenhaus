const ICON_BED  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 012 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>';
const ICON_BATH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3v2.25"/><path d="M4 21l1-1.5"/><path d="M20 21l-1-1.5"/></svg>';
const ICON_SQM  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>';
const ICON_TYPE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';

function esc(v) { return String(v ?? '').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
const $ = id => document.getElementById(id);

// Support direct query params: propiedad.html?id=123 or propiedad.html?alquiler=456
const _qp = new URLSearchParams(window.location.search);
if (_qp.get('id') && !sessionStorage.getItem('gh_redirect')) {
  sessionStorage.setItem('gh_redirect', '/venta/' + _qp.get('id'));
} else if (_qp.get('alquiler') && !sessionStorage.getItem('gh_redirect')) {
  sessionStorage.setItem('gh_redirect', '/alquiler/' + _qp.get('alquiler'));
}

const _pathRaw = sessionStorage.getItem('gh_redirect') || window.location.pathname;
sessionStorage.removeItem('gh_redirect');
// Strip GH Pages repo prefix (e.g. /bienenhaus) if present
const _path = _pathRaw.replace(/^\/[^/]+\/(venta|alquiler)\//, '/$1/');
const _ghBase = _path === _pathRaw ? '' : '/' + _pathRaw.split('/')[1];
const _isRental = _path.startsWith('/alquiler/');
const _isSale   = _path.startsWith('/venta/');
const _itemId = parseInt(_path.split('/').pop());

window._whatsapp2 = '';
function _wa() {
  const nums = [window._whatsapp || '5493514110000'];
  if (window._whatsapp2) nums.push(window._whatsapp2);
  return nums[Math.floor(Math.random() * nums.length)];
}
const _catalogPath = _isRental ? '/alquiler' : '/venta';
document.getElementById('backBtn')?.setAttribute('href', _catalogPath);
document.getElementById('backBtnMobile')?.setAttribute('href', _catalogPath);
document.getElementById('navVenta')?.classList.toggle('active', _isSale);
document.getElementById('navAlquiler')?.classList.toggle('active', _isRental);
document.getElementById('mNavVenta')?.classList.toggle('active', _isSale);
document.getElementById('mNavAlquiler')?.classList.toggle('active', _isRental);

let _images       = [];
let _lbIndex      = 0;
let _lbPlayInterval = null;
let _lbScale      = 1;
let _lbPinchDist  = 0;

// ── Galería hero premium ─────────────────────────────────────────────
function buildGaleria(item) {
  const hero = $('galeriaHero');
  const images = item.images || [];
  if (!images.length) {
    hero.innerHTML = `<div style="height:320px;display:flex;align-items:center;justify-content:center;color:var(--g4)">Sin imágenes</div>`;
    return;
  }
  const n = images.length;
  const isRental = 'price_ars' in item;
  const statusBadgeCls = isRental
    ? (item.status === 'alquilada' ? 'gh-badge--status-sold' : 'gh-badge--status')
    : (item.status === 'vendida' ? 'gh-badge--status-sold' : 'gh-badge--status');
  const statusLabel = isRental
    ? (item.status === 'alquilada' ? 'Alquilada' : 'Disponible')
    : (item.status === 'vendida' ? 'Vendida' : 'Disponible');
  const priceHtml = isRental
    ? `AR$ ${Number(item.price_ars).toLocaleString('es-AR')}<span style="font-size:0.4em;font-family:var(--font-sub);font-weight:400;color:rgba(255,255,255,0.5);margin-left:6px">/mes</span>`
    : fmtPriceARS(item.price);
  const priceLabel = isRental ? '' : (item.status === 'vendida' ? 'Precio de venta' : 'Precio de lista');
  const locationIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  const badges = `
    <span class="gh-badge gh-badge--type">${esc(item.type)}</span>
    <span class="gh-badge ${statusBadgeCls}">${statusLabel}</span>
    ${item.featured ? '<span class="gh-badge gh-badge--featured">★ Destacado</span>' : ''}`;

  const countBadge = n > 1
    ? `<div class="gh-counter">
       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
       ${n} fotos</div>`
    : '';

  const thumbs = n > 1 ? images.map((url, i) =>
    `<div class="gh-thumb${i === 0 ? ' active' : ''}" onclick="openLightbox(${i})">
      <img ${imgAttrs(url, [160])} alt="Foto ${i+1}" loading="${i < 2 ? 'eager' : 'lazy'}"/>
    </div>`
  ).join('') + (n > 8 ? `<div class="gh-thumb-more" onclick="openLightbox(8)">+${n - 8}</div>` : '') : '';

  hero.innerHTML = `
    <div class="gh-main" onclick="openLightbox(0)">
      <img ${imgAttrs(images[0], [600, 1200, 1800])} alt="${esc(item.title)}" loading="eager"/>
      <div class="gh-overlay">
        <div class="gh-badges">${badges}</div>
        <div class="gh-title">${esc(item.title)}</div>
        <div class="gh-location">${locationIcon} ${esc(item.location)}</div>
        <div class="gh-price">${priceHtml}</div>
        ${priceLabel ? `<div class="gh-price-label">${priceLabel}</div>` : ''}
      </div>
      ${countBadge}
      <button class="gh-fullscreen-btn" onclick="event.stopPropagation();openLightbox(0)" title="Pantalla completa" aria-label="Pantalla completa">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
      </button>
    </div>
    ${thumbs ? `<div class="gh-thumbs-wrap"><div class="gh-thumbs">${thumbs}</div></div>` : ''}`;
}

function syncHeroThumb(idx) {
  document.querySelectorAll('.gh-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });
}

function buildThumbs(images) {
  const wrap = $('dThumbs');
  if (!images.length || images.length < 2) { wrap.style.display = 'none'; return; }
  wrap.innerHTML = images.slice(0, 8).map((url, i) =>
    `<div class="detalle-thumb${i === 0 ? ' active' : ''}" id="thumb-${i}" onclick="openLightbox(${i})">
       <img ${imgAttrs(url, [160])} alt="Foto ${i+1}" loading="lazy"/>
     </div>`).join('');
}

function renderAgentCard(agent) {
  const wrap = $('dAgentSection');
  if (!wrap) return;
  const avatarHtml = agent?.avatar
    ? `<img src="${esc(agent.avatar)}" alt="${esc(agent.name)}" loading="lazy"/>`
    : `${(agent?.name?.[0] || 'B')}${(agent?.last?.[0] || 'H')}`;
  const waNumber = agent?.whatsapp || _wa();
  const waMsg = encodeURIComponent('Hola Bienenhaus! Quisiera recibir asesoramiento sobre una propiedad.');
  wrap.innerHTML = `
    <div class="agent-card">
      <div class="agent-avatar">${avatarHtml}</div>
      <div class="agent-info">
        <div class="agent-name">${esc(agent ? `${agent.name} ${agent.last}` : 'Equipo Bienenhaus')}</div>
        <div class="agent-license">${agent?.license_number ? `Matrícula CPI N° ${esc(agent.license_number)}` : 'Asesores expertos'}</div>
        <div class="agent-specialty">${agent?.specialty ? esc(agent.specialty) : 'Propiedades residenciales y comerciales'}</div>
        <div class="agent-contacts">
          <a href="https://wa.me/${waNumber}?text=${waMsg}" target="_blank" class="agent-contact-btn agent-contact-btn--wa">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
            WhatsApp
          </a>
          <a href="mailto:${esc(agent?.email || 'info@bienenhaus.com.ar')}" class="agent-contact-btn agent-contact-btn--email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email
          </a>
        </div>
        <a href="https://wa.me/${waNumber}?text=${waMsg}" target="_blank" class="agent-main-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
          Contactar Asesor
        </a>
      </div>
    </div>`;
}

function buildCtaFinal(item) {
  const wrap = $('dCtaFinal');
  if (!wrap) return;
  const waMsg = encodeURIComponent(`Hola Bienenhaus! Me interesa la propiedad *${item.title}* en ${item.location}.\n${window.location.origin}${_ghBase}${_path}`);
  wrap.innerHTML = `
    <div class="cta-final">
      <div class="cta-final-title">¿Te interesa esta propiedad?</div>
      <div class="cta-final-sub">Nuestro equipo está listo para ayudarte con todos los detalles.</div>
      <div class="cta-final-btns">
        <a href="https://wa.me/${_wa()}?text=${waMsg}" target="_blank" class="cta-final-btn cta-final-btn--primary">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
          Solicitar información
        </a>
        <a href="https://wa.me/${_wa()}?text=${encodeURIComponent('Hola Bienenhaus! Quisiera coordinar una visita para la propiedad ' + item.title + '.')}" target="_blank" class="cta-final-btn cta-final-btn--outline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Coordinar visita
        </a>
        <a href="/#tasacion" class="cta-final-btn cta-final-btn--outline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          Tasar mi propiedad
        </a>
      </div>
    </div>`;
}

// ── Lightbox ─────────────────────────────────────────────────────────
function openLightbox(idx) {
  _lbIndex = idx; _lbScale = 1;
  $('lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  updateLightbox(true);
  stopAutoPlay();
}

function closeLightbox() {
  $('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
  stopAutoPlay(); resetZoom();
}

function updateLightbox(instant = false) {
  const img  = $('lbImg');
  const next = $('lbImgNext');
  if (!_images.length) return;
  if (instant) {
    img.src = _images[_lbIndex];
    next.classList.add('hidden');
    next.src = '';
  } else {
    next.src = _images[(_lbIndex + 1) % _images.length];
    next.classList.remove('hidden');
    next.style.opacity = '0';
    void next.offsetWidth;
    img.style.transition = 'opacity .35s ease';
    img.style.opacity = '0';
    next.style.transition = 'opacity .35s ease';
    next.style.opacity = '1';
    setTimeout(() => {
      img.src = _images[_lbIndex];
      img.style.transition = 'none';
      img.style.opacity = '1';
      next.classList.add('hidden');
      next.style.opacity = '';
    }, 380);
  }
  $('lbCounter').textContent = `${_lbIndex + 1} / ${_images.length}`;
  resetZoom();
  syncThumb();
}

function lbNav(dir) {
  _lbIndex = (_lbIndex + dir + _images.length) % _images.length;
  updateLightbox();
  stopAutoPlay();
}

function toggleAutoPlay() {
  if (_lbPlayInterval) { stopAutoPlay(); return; }
  const btn = $('lbPlay');
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  btn.classList.add('lb-play--active');
  _lbPlayInterval = setInterval(() => {
    _lbIndex = (_lbIndex + 1) % _images.length;
    updateLightbox();
  }, 3500);
}

function stopAutoPlay() {
  if (_lbPlayInterval) {
    clearInterval(_lbPlayInterval);
    _lbPlayInterval = null;
  }
  const btn = $('lbPlay');
  if (btn) {
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    btn.classList.remove('lb-play--active');
  }
}

function resetZoom() {
  _lbScale = 1;
  const img = $('lbImg');
  img.style.transform = ''; img.style.cursor = '';
}

function applyZoom() {
  const img = $('lbImg');
  _lbScale = Math.max(1, Math.min(5, _lbScale));
  img.style.transform = `scale(${_lbScale})`;
  img.style.cursor = _lbScale > 1 ? 'grab' : '';
}

function syncThumb() {
  const active = document.querySelector('.detalle-thumb.active');
  if (active) active.classList.remove('active');
  const thumb = $(`thumb-${_lbIndex}`);
  if (thumb) {
    thumb.classList.add('active');
    thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
  syncHeroThumb(_lbIndex);
}

document.addEventListener('keydown', e => {
  if ($('lightbox').classList.contains('hidden')) return;
  if (e.key === 'ArrowRight') lbNav(1);
  if (e.key === 'ArrowLeft')  lbNav(-1);
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === ' ' || e.key === 'Space') { e.preventDefault(); toggleAutoPlay(); }
});

// ── Render ───────────────────────────────────────────────────────────
function renderItem(item) {
  window._detailItem = item;
  if (_isRental) {
    $('dBreadParent').href = '/alquiler';
    $('dBreadParent').textContent = 'Alquileres';
  } else {
    $('dBreadParent').href = '/#venta';
    $('dBreadParent').textContent = 'Venta';
  }
  _images = item.images || [];
  const siteUrl = document.querySelector('meta[name="site-url"]')?.getAttribute('content') || '';
  const pageUrl = `${siteUrl}${_path}`;
  const desc = `${item.title} — ${item.location}. ${(item.desc || item.description || '').slice(0, 120)}`;
  const ogImageUrl = _images[0] || '/images/logo-bienenhaus.png';

  document.title = `${item.title} · Bienenhaus`;
  document.querySelector('meta[name="description"]').content = desc;
  const canon = document.getElementById('canonicalLink');
  if (canon) canon.href = pageUrl;
  const ogUrl = document.getElementById('ogUrl');
  if (ogUrl) ogUrl.content = pageUrl;
  const ogTitle = document.getElementById('ogTitle');
  if (ogTitle) ogTitle.content = `${item.title} · Bienenhaus`;
  const ogDesc = document.getElementById('ogDesc');
  if (ogDesc) ogDesc.content = desc;
  const ogImage = document.getElementById('ogImage');
  if (ogImage) ogImage.content = ogImageUrl;
  const twTitle = document.getElementById('twTitle');
  if (twTitle) twTitle.content = `${item.title} · Bienenhaus`;
  const twDesc = document.getElementById('twDesc');
  if (twDesc) twDesc.content = desc;
  const twImage = document.getElementById('twImage');
  if (twImage) twImage.content = ogImageUrl;

  buildGaleria(item);
  buildThumbs(_images);

  // Video embed
  const videoUrl = item.video_url;
  const videoSection = $('dVideoSection');
  const videoEmbed = $('dVideoEmbed');
  if (videoUrl && videoSection && videoEmbed) {
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    const isMp4 = /\.mp4(?:$|\?)/i.test(videoUrl);
    let embedHtml = '';
    if (youtubeMatch) {
      embedHtml = `<iframe src="https://www.youtube.com/embed/${youtubeMatch[1]}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
    } else if (vimeoMatch) {
      embedHtml = `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe>`;
    } else if (isMp4) {
      embedHtml = `<video controls playsinline preload="metadata" style="width:100%;border-radius:8px"><source src="${esc(videoUrl)}" type="video/mp4"></video>`;
    }
    if (embedHtml) {
      videoEmbed.innerHTML = `<div class="d-video-wrap">${embedHtml}</div>`;
      videoSection.style.display = '';
    } else {
      videoSection.style.display = 'none';
    }
  } else if (videoSection) {
    videoSection.style.display = 'none';
  }

  // Zoom on hover for hero main image
  const ghMain = document.querySelector('.gh-main img');
  if (ghMain && _images.length > 0) {
    ghMain.style.transition = 'transform .5s ease';
    ghMain.parentElement.addEventListener('mousemove', e => {
      const rect = ghMain.parentElement.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      ghMain.style.transformOrigin = `${x * 100}% ${y * 100}%`;
      ghMain.style.transform = 'scale(1.25)';
    });
    ghMain.parentElement.addEventListener('mouseleave', () => { ghMain.style.transform = ''; });
  }

  $('dBreadTitle').textContent = item.title;

  // Badges
  if (_isRental) {
    const statusMap = { disponible: 'd-badge-disponible', alquilada: 'd-badge-vendida', oculta: '' };
    $('dBadges').innerHTML = `
      <span class="d-badge d-badge-type">${esc(item.type)}</span>
      <span class="d-badge ${statusMap[item.status] || ''}">${esc(item.status)}</span>
      ${item.featured ? '<span class="d-badge d-badge-featured">★ Destacado</span>' : ''}`;
  } else {
    const statusMap = { disponible: 'd-badge-disponible', vendida: 'd-badge-vendida', oculta: '' };
    $('dBadges').innerHTML = `
      <span class="d-badge d-badge-type">${esc(item.type)}</span>
      <span class="d-badge ${statusMap[item.status] || ''}">${esc(item.status)}</span>
      ${item.featured ? '<span class="d-badge d-badge-featured">★ Destacada</span>' : ''}`;
  }

  $('dTitle').textContent = item.title;
  $('dLocationText').textContent = item.location;

  // Specs
  const specIcon = [ICON_BED, ICON_BATH, ICON_SQM, ICON_TYPE];
  $('dSpecs').innerHTML = [
    { n: item.beds,  l: 'Dormitorios' },
    { n: item.baths, l: 'Baños' },
    { n: `${item.sqm}m²`, l: 'Superficie' },
    { n: esc(item.type?.[0]?.toUpperCase?.() + item.type?.slice?.(1) || item.type || '—'), l: 'Tipo' },
  ].map((s, i) => `
    <div class="dspec">
      ${specIcon[i]}
      <div class="dspec-n">${s.n}</div>
      <div class="dspec-l">${s.l}</div>
    </div>`).join('');

  $('dDesc').textContent = (item.desc || item.description || 'Sin descripción disponible.');

  // Price
  if (_isRental) {
    $('dPrice').textContent = `ARS ${Number(item.price_ars).toLocaleString('es-AR')}`;
    $('dPriceLabel').textContent = 'Por mes';
    const exp = item.expenses > 0 ? `+ ARS ${Number(item.expenses).toLocaleString('es-AR')} expensas` : '';
    $('dExpenses').textContent = exp;
    const features = [];
    if (item.furnished) features.push('<span class="card-feature-chip furnished">Amoblado</span>');
    if (item.min_months > 0) features.push(`<span class="card-feature-chip">Mín. ${item.min_months} meses</span>`);
    $('dFeatures').innerHTML = features.join('');
  } else {
    const isSold = item.status === 'vendida';
    $('dPrice').textContent = fmtPriceARS(item.price);
    $('dPriceLabel').textContent = isSold ? 'Precio de venta' : 'Precio de lista';
    $('dExpenses').textContent = '';
    $('dFeatures').innerHTML = '';
  }

  // WhatsApp
  const waLabel = _isRental ? 'alquiler' : 'propiedad';
  const waMsg = encodeURIComponent(`Hola Bienenhaus! Me interesa ${_isRental ? 'el alquiler' : 'la propiedad'} *${item.title}* en ${item.location}.\n${window.location.origin}${_ghBase}${_path}`);
  const waUrl = `https://wa.me/${_wa()}?text=${waMsg}`;
  $('dWhatsapp').href = waUrl;
  $('waFloat').href   = waUrl;

  // Map
  const mapQ = encodeURIComponent((item.location || 'Córdoba Capital') + ', Argentina');
  $('dMap').innerHTML = `<iframe
    src="https://maps.google.com/maps?q=${mapQ}&hl=es&z=14&output=embed"
    loading="lazy" allowfullscreen title="Ubicación ${esc(item.title)}"></iframe>`;

  $('loadingState').classList.add('hidden');
  $('detalleMain').classList.remove('hidden');

  // CTA Final
  buildCtaFinal(item);

  // Scroll reveal
  document.querySelectorAll('.detalle-section, .detalle-price-card, .detalle-share-card, .detalle-card, .detalle-specs, .agent-section, .cta-final').forEach((el, i) => {
    el.classList.add('reveal');
    if (i > 0) el.style.transitionDelay = `${Math.min(i * 0.06, 0.4)}s`;
  });
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  // View tracking
  const viewUrl = _isRental ? `/api/rentals/${_itemId}/view` : `/api/properties/${_itemId}/view`;
  fetch(viewUrl, { method: 'POST' }).catch(() => {});

  // Load agent
  loadAgent();

  // Similar properties
  loadSimilares(item);
}

async function loadAgent() {
  try {
    const res = await fetch('/api/agents');
    const agents = await res.json();
    const agent = Array.isArray(agents) ? agents[0] : null;
    renderAgentCard(agent);
  } catch {
    renderAgentCard(null);
  }
}

let _simInterval = null;

function renderSimilarCard(prop) {
  const thumb = prop.images?.[0];
  const thumbHtml = thumb
    ? `<img class="sim-card-img" ${imgAttrs(thumb, [400, 800])} alt="${esc(prop.title)}" loading="lazy"/>`
    : `<div class="sim-card-img sim-card-img--empty">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
       </div>`;
  const isRental = 'price_ars' in prop;
  const price = isRental
    ? `AR$ ${Number(prop.price_ars).toLocaleString('es-AR')}/mes`
    : fmtPriceARS(prop.price, true);
  const link = isRental ? `/alquiler/${prop.id}` : `/venta/${prop.id}`;
  return `<div class="carousel-slide">
    <a href="${link}" class="sim-card">
      ${thumbHtml}
      <div class="sim-card-body">
        <div class="sim-card-title">${esc(prop.title)}</div>
        <div class="sim-card-loc">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${esc(prop.location)}
        </div>
        <div class="sim-card-price">${price}</div>
      </div>
    </a>
  </div>`;
}

function simCarouselScroll() {
  const track = $('similaresGrid');
  if (!track) return;
  const slide = track.querySelector('.carousel-slide');
  if (!slide) return;
  const slideW = slide.offsetWidth + 16;
  const maxScroll = track.scrollWidth - track.clientWidth;
  let next = track.scrollLeft + slideW;
  if (next >= maxScroll - 10) next = 0;
  track.scrollTo({ left: next, behavior: 'smooth' });
  simUpdateDots(track);
}

function simUpdateDots(track) {
  const dots = document.querySelectorAll('.carousel-dot');
  if (!dots.length) return;
  const slideW = (track.querySelector('.carousel-slide')?.offsetWidth || 300) + 16;
  const idx = Math.round(track.scrollLeft / slideW);
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

function simBuildDots(count) {
  const wrap = $('simDots');
  if (!wrap) return;
  wrap.innerHTML = Array.from({ length: count }, (_, i) =>
    `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-idx="${i}" aria-label="Ir a slide ${i+1}"></button>`
  ).join('');
  wrap.addEventListener('click', e => {
    const dot = e.target.closest('.carousel-dot');
    if (!dot) return;
    const track = $('similaresGrid');
    if (!track) return;
    const slideW = (track.querySelector('.carousel-slide')?.offsetWidth || 300) + 16;
    track.scrollTo({ left: parseInt(dot.dataset.idx) * slideW, behavior: 'smooth' });
    simUpdateDots(track);
  });
}

function simStartAutoPlay() {
  if (_simInterval) clearInterval(_simInterval);
  _simInterval = setInterval(simCarouselScroll, 4500);
}

async function loadSimilares(item) {
  const grid = $('similaresGrid');
  if (!grid) return;
  try {
    const similares = _isRental
      ? await API.getRentalSimilares(item.id, 8)
      : await API.getSimilares(item.id, 8);
    if (!similares || !similares.length) {
      const section = grid.closest('.similares-section');
      if (section) section.style.display = 'none';
      return;
    }
    grid.innerHTML = similares.map(renderSimilarCard).join('');
    simBuildDots(Math.min(similares.length, 8));

    const carousel = $('similaresCarousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', () => { if (_simInterval) clearInterval(_simInterval); _simInterval = null; });
      carousel.addEventListener('mouseleave', simStartAutoPlay);
    }

    grid.addEventListener('scroll', () => simUpdateDots(grid));

    $('simPrev')?.addEventListener('click', () => {
      const track = $('similaresGrid');
      const slideW = (track.querySelector('.carousel-slide')?.offsetWidth || 300) + 16;
      track.scrollBy({ left: -slideW, behavior: 'smooth' });
      setTimeout(() => simUpdateDots(track), 400);
    });
    $('simNext')?.addEventListener('click', () => {
      const track = $('similaresGrid');
      const slideW = (track.querySelector('.carousel-slide')?.offsetWidth || 300) + 16;
      track.scrollBy({ left: slideW, behavior: 'smooth' });
      setTimeout(() => simUpdateDots(track), 400);
    });

    simStartAutoPlay();
  } catch {
    const section = grid.closest('.similares-section');
    if (section) section.style.display = 'none';
  }
}

// ── Property inquiry modal ──────────────────────────────────────────
let _inquiryItem = null;

function openInquiry(item) {
  _inquiryItem = item;
  $('inquiryRef').textContent = item.title || 'Propiedad';
  $('iq_message').value = `Hola, me interesa esta propiedad: ${item.title}\nhttps://bienenhaus.com.ar${_path}`;
  $('iq_ts').value = Date.now();
  $('iq_motivo').value = 'Consulta sobre esta propiedad';
  $('iq_property_id').value = item.id || '';
  $('iqMsg').classList.add('hidden');
  $('inquiryModal').classList.remove('hidden');
}

function closeInquiry() {
  $('inquiryModal').classList.add('hidden');
}

$('inquiryForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (document.getElementById('iq_website').value) return;
  const name = $('iq_name').value.trim();
  const message = $('iq_message').value.trim();
  if (!name || !message) {
    $('iqMsg').textContent = 'Completá nombre y mensaje.';
    $('iqMsg').className = 'cf-msg cf-msg--err';
    return;
  }
  $('iqSubmit').disabled = true;
  $('iqSubmit').textContent = 'Enviando...';
  try {
    const res = await API.sendContact({
      name,
      email: $('iq_email').value.trim(),
      phone: $('iq_phone').value.trim(),
      message,
      motivo: $('iq_motivo').value,
      property_id: $('iq_property_id').value,
      _ts: $('iq_ts').value,
      _website: $('iq_website').value,
    });
    if (res) {
      $('iqMsg').textContent = '✓ Consulta enviada. Te contactaremos pronto.';
      $('iqMsg').className = 'cf-msg cf-msg--ok';
      $('inquiryForm').reset();
      $('iq_ts').value = Date.now();
      setTimeout(closeInquiry, 2500);
    }
  } catch {
    $('iqMsg').textContent = 'Error de conexión.';
    $('iqMsg').className = 'cf-msg cf-msg--err';
  } finally {
    $('iqSubmit').disabled = false;
    $('iqSubmit').textContent = 'Enviar consulta';
  }
});

$('inquiryModal')?.addEventListener('click', e => {
  if (e.target === $('inquiryModal')) closeInquiry();
});

// ── Share ────────────────────────────────────────────────────────────
function shareWA() {
  const url = encodeURIComponent(window.location.origin + _ghBase + _path);
  window.open(`https://wa.me/?text=${url}`, '_blank');
}

function copyLink() {
  navigator.clipboard.writeText(window.location.origin + _ghBase + _path).then(() => {
    $('copyMsg').classList.remove('hidden');
    setTimeout(() => $('copyMsg').classList.add('hidden'), 2500);
  });
}

// ── Init ─────────────────────────────────────────────────────────────
document.getElementById('footerYear').textContent = new Date().getFullYear();

window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
  document.getElementById('backToTop')?.classList.toggle('visible', window.scrollY > 400);
});

document.getElementById('backToTop')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.addEventListener('DOMContentLoaded', async () => {
  $('shareWABtn')?.addEventListener('click', shareWA);
  $('copyLinkBtn')?.addEventListener('click', copyLink);
  $('dInquiry')?.addEventListener('click', () => openInquiry(window._detailItem));

  $('hamburger')?.addEventListener('click', () => {
    $('mobileMenu')?.classList.toggle('open');
  });

  $('lbClose').addEventListener('click', closeLightbox);
  $('lbPrev').addEventListener('click',  () => lbNav(-1));
  $('lbNext').addEventListener('click',  () => lbNav(1));
  $('lightbox').addEventListener('click', e => {
    if (e.target === $('lightbox') || e.target === $('lbImg')) closeLightbox();
  });
  $('lbPlay').addEventListener('click', toggleAutoPlay);
  $('lbFullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) $('lbImgWrap').requestFullscreen?.();
    else document.exitFullscreen?.();
  });

  $('lbImgWrap').addEventListener('wheel', e => {
    if (e.deltaY < 0) _lbScale = Math.min(5, _lbScale + 0.25);
    else              _lbScale = Math.max(1, _lbScale - 0.25);
    applyZoom();
    e.preventDefault();
  }, { passive: false });

  $('lbImgWrap').addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      _lbPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  }, { passive: true });

  $('lbImgWrap').addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const delta = dist - _lbPinchDist;
      if (Math.abs(delta) > 5) {
        _lbScale = Math.max(1, Math.min(5, _lbScale + delta * 0.01));
        applyZoom();
        _lbPinchDist = dist;
      }
    }
  }, { passive: true });

  let touchStartX = 0;
  let isSwiping   = false;
  $('lightbox').addEventListener('touchstart', e => {
    if (e.touches.length === 1) { touchStartX = e.touches[0].clientX; isSwiping = _lbScale <= 1; }
  }, { passive: true });
  $('lightbox').addEventListener('touchmove', e => {
    if (e.touches.length === 1 && isSwiping) {
      const dx = e.touches[0].clientX - touchStartX;
      $('lbImg').style.transform = `scale(${_lbScale}) translateX(${dx * 0.3}px)`;
    }
  }, { passive: true });
  $('lightbox').addEventListener('touchend', e => {
    if (isSwiping) {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) lbNav(diff > 0 ? 1 : -1);
      else applyZoom();
    }
  }, { passive: true });

  // Load settings for WhatsApp number + footer
  try {
    const s = await API.getPublicSettings();
    window._siteSettings = s;
    window._whatsapp  = s.whatsapp  || '5493514110000';
    window._whatsapp2 = s.whatsapp2 || '';
    if ($('sitePhoneFooter'))   $('sitePhoneFooter').textContent   = s.phone   || '';
    if ($('siteEmailFooter'))   $('siteEmailFooter').textContent   = s.email   || '';
    if ($('siteAddressFooter')) $('siteAddressFooter').textContent = s.address || '';
    const defMsg = encodeURIComponent('Hola Bienenhaus, quisiera recibir información sobre esta propiedad.');
    document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
      try {
        const url = new URL(a.href);
        const text = url.searchParams.get('text') || defMsg;
        a.href = `https://wa.me/${_wa()}${text ? '?text=' + encodeURIComponent(text) : ''}`;
      } catch {
        a.href = `https://wa.me/${_wa()}?text=${defMsg}`;
      }
    });
  } catch {}

  // Set dynamic labels for rental vs property
  if (_isRental) {
    $('loadingText').textContent = 'Cargando alquiler...';
    $('errorTitle').textContent = 'Alquiler no encontrado';
    $('errorBackBtn').href = '/alquiler';
    $('errorBackBtn').textContent = 'Volver al listado';
  }

  if (!_itemId || isNaN(_itemId)) {
    $('loadingState').classList.add('hidden');
    $('errorState').classList.remove('hidden');
    return;
  }

  try {
    let item;
    if (_isRental) {
      item = await API.getRental(_itemId);
    } else if (_isSale) {
      item = await API.getProperty(_itemId);
    }
    renderItem(item);
  } catch {
    $('loadingState').classList.add('hidden');
    $('errorState').classList.remove('hidden');
  }
});

window.openLightbox  = openLightbox;
window.closeLightbox = closeLightbox;
window.shareWA       = shareWA;
window.copyLink      = copyLink;
window.openInquiry   = openInquiry;
window.closeInquiry  = closeInquiry;
