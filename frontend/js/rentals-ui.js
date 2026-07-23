/**
 * rentals-ui.js — UI interactiva de la página de alquileres
 * (filtros, scroll, hamburger, footer año, settings, chips, map toggle)
 */

window._whatsapp  = '5493510000000';
window._whatsapp2 = '';
function _wa() {
  const nums = [window._whatsapp || '5493510000000'];
  if (window._whatsapp2) nums.push(window._whatsapp2);
  return nums[Math.floor(Math.random() * nums.length)];
}
let _filters     = { search:'', type:'all', priceMin:'', priceMax:'', beds:'all', status:'all', furnished:'' };
let _sort        = 'default';
let _filterTimer = null;
let _page        = 1;

const PRICE_MAX = 2000000;

function goToPage(n) {
  _page = n;
  applyFilters();
}
window.goToPage = goToPage;

document.getElementById('footerYear').textContent = new Date().getFullYear();

window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
  document.getElementById('backToTop')?.classList.toggle('visible', window.scrollY > 400);
});

document.getElementById('backToTop')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('mobileMenu')?.classList.toggle('open');
});

document.getElementById('filterToggle')?.addEventListener('click', () => {
  document.getElementById('filterInner')?.classList.toggle('open');
  document.getElementById('filterToggle')?.classList.toggle('open');
});

const sliderMin = document.getElementById('sliderMin');
const sliderMax = document.getElementById('sliderMax');

function fmtSlider(v) {
  return v >= PRICE_MAX ? 'Sin límite' : `ARS ${Number(v).toLocaleString('es-AR')}`;
}

function updateSlider() {
  if (!sliderMin || !sliderMax) return;
  let min = parseInt(sliderMin.value);
  let max = parseInt(sliderMax.value);
  if (min > max - 10000) { min = max - 10000; sliderMin.value = min; }

  const minLbl = document.getElementById('sliderMinLabel');
  const maxLbl = document.getElementById('sliderMaxLabel');
  const range  = document.getElementById('sliderRange');
  if (minLbl) minLbl.textContent = fmtSlider(min);
  if (maxLbl) maxLbl.textContent = fmtSlider(max);

  if (range) {
    const pMin = (min / PRICE_MAX) * 100;
    const pMax = (max / PRICE_MAX) * 100;
    range.style.left  = pMin + '%';
    range.style.width = (pMax - pMin) + '%';
  }

  _filters.priceMin = min > 0         ? min : '';
  _filters.priceMax = max < PRICE_MAX ? max : '';
  applyFilters();
}

sliderMin?.addEventListener('input', updateSlider);
sliderMax?.addEventListener('input', updateSlider);
if (sliderMin && sliderMax) updateSlider();

document.getElementById('fSort')?.addEventListener('change', e => {
  _sort = e.target.value;
  _page = 1;
  applyFilters();
});

function applyFilters() {
  clearTimeout(_filterTimer);
  _filterTimer = setTimeout(async () => {
    showSkeletons();
    try {
      const filters = { ..._filters, page: _page, sort: _sort };
      const data = await API.getRentals(filters);
      const rentals = data.rentals;
      renderRentals(rentals, { page: data.page, pages: data.pages, total: data.total, has_prev: data.has_prev, has_next: data.has_next });
      if (rentals.length) setTimeout(revealCards, 50);
    } catch (err) {
      showError('rentalsGrid', 'Error al cargar alquileres.');
    }
    updateFilterChips();
  }, 350);
}

function bindFilter(id, key, event = 'input') {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener(event, () => { _filters[key] = el.value; applyFilters(); });
}
bindFilter('fSearch', 'search');
bindFilter('fType',   'type',   'change');
bindFilter('fBeds',   'beds',   'change');
bindFilter('fStatus', 'status', 'change');

document.getElementById('fFurnished')?.addEventListener('change', e => {
  _filters.furnished = e.target.checked ? 'true' : '';
  applyFilters();
});

document.getElementById('fReset')?.addEventListener('click', () => {
  _filters = { search:'', type:'all', priceMin:'', priceMax:'', beds:'all', status:'all', furnished:'' };
  _sort    = 'default';
  _page    = 1;
  ['fSearch'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  ['fType','fBeds','fStatus','fSort'].forEach(id => { const el = document.getElementById(id); if(el) el.value = id==='fSort'?'default':'all'; });
  const f = document.getElementById('fFurnished');
  if (f) f.checked = false;
  if (sliderMin) sliderMin.value = 0;
  if (sliderMax) sliderMax.value = PRICE_MAX;
  updateSlider();
  applyFilters();
});

function showSkeletons(n = 6) {
  const grid = document.getElementById('rentalsGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({length: n}, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line w-30"></div>
        <div class="skeleton skeleton-line w-80 h-20"></div>
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton-specs">
          <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
        </div>
        <div class="skeleton skeleton-line w-100"></div>
      </div>
    </div>`).join('');
}

function revealCards() {
  document.querySelectorAll('.prop-card').forEach((card, i) => {
    card.classList.add('reveal');
    card.style.transitionDelay = `${Math.min(i * 0.06, 0.4)}s`;
    setTimeout(() => card.classList.add('visible'), 30);
  });
}

// ── Filter chips ──────────────────────────────────────────────────────
function updateFilterChips() {
  const container = document.getElementById('activeChips');
  const countBadge = document.getElementById('filterActiveCount');
  if (!container) return;
  const chips = [];

  if (_filters.search)
    chips.push({ label: `"${_filters.search}"`, key:'search', reset(){_filters.search=''; const e=document.getElementById('fSearch'); if(e)e.value='';} });
  if (_filters.type && _filters.type !== 'all')
    chips.push({ label: ({casa:'Casa',departamento:'Depto',finca:'Finca',terreno:'Terreno',local:'Local',otro:'Otro'})[_filters.type]||_filters.type, key:'type' });
  if (_filters.beds && _filters.beds !== 'all')
    chips.push({ label: `${_filters.beds} dorm.`, key:'beds' });
  if (_filters.status && _filters.status !== 'all')
    chips.push({ label: _filters.status === 'alquilada' ? 'Alquilada' : 'Disponible', key:'status' });
  if (_filters.furnished === 'true')
    chips.push({ label:'Amoblado', key:'furnished', reset(){_filters.furnished=''; const e=document.getElementById('fFurnished'); if(e)e.checked=false;} });
  if (_filters.priceMin)
    chips.push({ label:`Desde ARS ${Number(_filters.priceMin).toLocaleString('es-AR')}`, key:'priceMin', reset(){_filters.priceMin='';sliderMin.value=0;updateSlider();} });
  if (_filters.priceMax)
    chips.push({ label:`Hasta ARS ${Number(_filters.priceMax).toLocaleString('es-AR')}`, key:'priceMax', reset(){_filters.priceMax='';sliderMax.value=PRICE_MAX;updateSlider();} });
  if (_sort && _sort !== 'default')
    chips.push({ label:({price_asc:'Menor precio',price_desc:'Mayor precio',newest:'Más nuevos',oldest:'Más antiguos'})[_sort]||_sort, key:'sort', reset(){_sort='default';const e=document.getElementById('fSort');if(e)e.value='default';} });

  container.innerHTML = chips.map(c =>
    `<span class="filter-chip" data-key="${c.key}">${c.label}<button class="filter-chip-remove" data-key="${c.key}" aria-label="Quitar filtro">&times;</button></span>`
  ).join('');

  if (countBadge) countBadge.textContent = chips.length ? `(${chips.length})` : '';

  container.querySelectorAll('.filter-chip-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const key = btn.dataset.key;
      const found = chips.find(c => c.key === key);
      if (found?.reset) found.reset();
      else { _filters[key] = (key==='type'||key==='beds'||key==='status') ? 'all' : ''; }
      _page = 1; applyFilters();
    });
  });
}

// ── Map view toggle ──────────────────────────────────────────────────
function showAlqMap() {
  document.getElementById('rentalsGrid').style.display = 'none';
  document.getElementById('pagination').style.display = 'none';
  document.getElementById('mapContainer').style.display = 'block';
  document.getElementById('viewList')?.classList.remove('active');
  document.getElementById('viewMap')?.classList.add('active');
  initMapa('mapContainer', 'alquiler');
}
function showAlqList() {
  document.getElementById('rentalsGrid').style.display = '';
  document.getElementById('pagination').style.display = '';
  document.getElementById('mapContainer').style.display = 'none';
  document.getElementById('viewList')?.classList.add('active');
  document.getElementById('viewMap')?.classList.remove('active');
}
document.getElementById('viewMap')?.addEventListener('click', showAlqMap);
document.getElementById('viewList')?.addEventListener('click', showAlqList);

async function applySettings() {
  let s;
  try { s = await API.getPublicSettings(); } catch (e) { return; }
  window._siteSettings = s;
  window._whatsapp  = s.whatsapp  || '5493510000000';
  window._whatsapp2 = s.whatsapp2 || '';

  const $ = id => document.getElementById(id);
  if ($('sitePhoneFooter'))   $('sitePhoneFooter').textContent   = s.phone   || '';
  if ($('siteEmailFooter'))   $('siteEmailFooter').textContent   = s.email   || '';
  if ($('siteAddressFooter')) $('siteAddressFooter').textContent = s.address || '';
  if ($('siteHoursFooter'))   $('siteHoursFooter').textContent   = s.hours   || '';

  const defMsg = encodeURIComponent('Hola Bienenhaus, quisiera recibir información sobre un alquiler.');
  document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
    try {
      const url  = new URL(a.href);
      const text = url.searchParams.get('text') || defMsg;
      a.href = `https://wa.me/${_wa()}${text ? '?text=' + encodeURIComponent(text) : ''}`;
    } catch {
      a.href = `https://wa.me/${_wa()}?text=${defMsg}`;
    }
  });
}

async function init() {
  showSkeletons();
  applySettings();
  updateFilterChips();
  try {
    const data  = await API.getRentals({ ..._filters, page: _page, sort: _sort });
    const rentals = data.rentals;
    renderRentals(rentals, { page: data.page, pages: data.pages, total: data.total, has_prev: data.has_prev, has_next: data.has_next });
    if (rentals.length) setTimeout(revealCards, 100);
  } catch (err) {
    console.warn('Error al cargar alquileres:', err);
    const grid = document.getElementById('rentalsGrid');
    if (grid) grid.innerHTML = '<div class="loading-state">Error al conectar. ¿Está corriendo el servidor?</div>';
  }
}

init();
