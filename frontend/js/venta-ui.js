const PER_PAGE = 6;

let _filters = { search: '', type: 'all', priceMin: '', priceMax: '', beds: 'all', status: 'all' };
let _sort = 'default';
let _page = 1;
let _filterTimer = null;

window._whatsapp2 = '';
function _wa() {
  const nums = [window._whatsapp || '5493510000000'];
  if (window._whatsapp2) nums.push(window._whatsapp2);
  return nums[Math.floor(Math.random() * nums.length)];
}
function goToPage(n) { _page = n; applyFilters(); }
window.goToPage = goToPage;

function applyFilters() {
  clearTimeout(_filterTimer);
  _filterTimer = setTimeout(async () => {
    showSkeletons();
    try {
      const filters = { ..._filters, page: _page, sort: _sort, per_page: PER_PAGE };
      const data = await API.getProperties(filters);
      const props = data.properties;
      renderProperties(props, { page: data.page, pages: data.pages, total: data.total, has_prev: data.has_prev, has_next: data.has_next });
      if (props.length) setTimeout(revealCards, 50);
      updateFilterChips();
    } catch {
      document.getElementById('propsGrid').innerHTML = '<div class="loading-state">Error al cargar propiedades.</div>';
    }
  }, 350);
}

function bindFilter(id, key, event) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener(event || 'input', () => { _filters[key] = el.value; _page = 1; applyFilters(); });
}

bindFilter('fSearch', 'search');
bindFilter('fType', 'type', 'change');
bindFilter('fBeds', 'beds', 'change');
bindFilter('fStatus', 'status', 'change');

document.getElementById('fSort')?.addEventListener('change', e => {
  _sort = e.target.value; _page = 1; applyFilters();
});

const FILTER_LABELS = {
  type: { casa: 'Casa', departamento: 'Depto', finca: 'Finca', terreno: 'Terreno', local: 'Local', otro: 'Otro' },
  beds: { 1: '1 dorm.', 2: '2 dorm.', 3: '3 dorm.', 4: '4+ dorm.' },
  status: { disponible: 'Disponible', vendida: 'Vendida' },
};

const CHIP_CONFIG = [
  { key: 'search', label: v => `"${v}"` },
  { key: 'type', label: v => FILTER_LABELS.type[v] || v },
  { key: 'beds', label: v => FILTER_LABELS.beds[v] || v },
  { key: 'status', label: v => FILTER_LABELS.status[v] || v },
];

function updateFilterChips() {
  const wrap = document.getElementById('activeChips');
  if (!wrap) return;
  const chips = CHIP_CONFIG
    .filter(c => _filters[c.key] && _filters[c.key] !== 'all')
    .map(c => {
      const label = typeof c.label === 'function' ? c.label(_filters[c.key]) : _filters[c.key];
      return `<span class="filter-chip" data-key="${c.key}">
        <span>${label}</span>
        <button class="filter-chip-remove" data-key="${c.key}" title="Quitar filtro">×</button>
      </span>`;
    });
  const hasPrice = _filters.priceMin || _filters.priceMax;
  if (hasPrice) {
    const min = _filters.priceMin || '0';
    const max = _filters.priceMax || '∞';
    chips.push(`<span class="filter-chip">
      <span>USD ${Number(min).toLocaleString('es-AR')}–${max === '∞' ? 'sin límite' : Number(max).toLocaleString('es-AR')}</span>
      <button class="filter-chip-remove" data-key="price" title="Quitar filtro">×</button>
    </span>`);
  }
  wrap.innerHTML = chips.join('');
  wrap.querySelectorAll('.filter-chip-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (key === 'price') {
        clearPriceFilter();
      } else {
        _filters[key] = 'all';
        const el = document.getElementById(key === 'search' ? 'fSearch' : 'f' + key.charAt(0).toUpperCase() + key.slice(1));
        if (el) el.value = key === 'search' ? '' : 'all';
      }
      _page = 1;
      applyFilters();
    });
  });
}

function clearPriceFilter() {
  _filters.priceMin = '';
  _filters.priceMax = '';
  const sm = document.getElementById('sliderMin');
  const sx = document.getElementById('sliderMax');
  if (sm) sm.value = 0;
  if (sx) sx.value = 500000;
  updateSlider();
}

document.getElementById('fReset')?.addEventListener('click', () => {
  _filters = { search: '', type: 'all', priceMin: '', priceMax: '', beds: 'all', status: 'all' };
  _sort = 'default'; _page = 1;
  const sid = id => { const e = document.getElementById(id); if (e) e.value = ''; };
  sid('fSearch');
  ['fType', 'fBeds', 'fStatus'].forEach(id => { const e = document.getElementById(id); if (e) e.value = 'all'; });
  const s = document.getElementById('fSort'); if (s) s.value = 'default';
  const sm = document.getElementById('sliderMin'); if (sm) sm.value = 0;
  const sx = document.getElementById('sliderMax'); if (sx) sx.value = 500000;
  updateSlider();
  applyFilters();
});

const PRICE_MAX = 500000;
function fmtSlider(v) { return v >= PRICE_MAX ? 'Sin límite' : `USD ${Number(v).toLocaleString('es-AR')}`; }

function updateSlider() {
  const sm = document.getElementById('sliderMin');
  const sx = document.getElementById('sliderMax');
  if (!sm || !sx) return;
  let min = parseInt(sm.value);
  let max = parseInt(sx.value);
  if (min > max - 5000) { min = max - 5000; sm.value = min; }

  const minL = document.getElementById('sliderMinLabel');
  const maxL = document.getElementById('sliderMaxLabel');
  const rangeL = document.getElementById('sliderRangeLabel');
  const range = document.getElementById('sliderRange');
  if (minL) minL.textContent = fmtSlider(min);
  if (maxL) maxL.textContent = fmtSlider(max);
  if (rangeL) rangeL.textContent = fmtSlider(min) + ' — ' + fmtSlider(max);
  if (range) {
    const pMin = (min / PRICE_MAX) * 100;
    const pMax = (max / PRICE_MAX) * 100;
    range.style.left = pMin + '%';
    range.style.width = (pMax - pMin) + '%';
  }
  _filters.priceMin = min > 0 ? min : '';
  _filters.priceMax = max < PRICE_MAX ? max : '';
  applyFilters();
}

document.getElementById('sliderMin')?.addEventListener('input', updateSlider);
document.getElementById('sliderMax')?.addEventListener('input', updateSlider);

function showSkeletons(n) {
  n = n || PER_PAGE;
  const grid = document.getElementById('propsGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: n }, () =>
    `<div class="skeleton-card">
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
    card.classList.add('reveal-card');
    const dirs = ['reveal-left', 'reveal-right', 'reveal-center'];
    card.classList.add(dirs[i % 3]);
    card.style.transitionDelay = `${Math.min(i * 0.08, 0.6)}s`;
    setTimeout(() => card.classList.add('visible'), 30);
  });
}

function showVentaMap() {
  document.getElementById('propsGrid').style.display = 'none';
  document.getElementById('filterBar').style.display = 'none';
  const mc = document.getElementById('mapContainer');
  mc.style.display = 'block';
  document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('viewMap').classList.add('active');
  initMapa('mapContainer', 'venta');
}
function showVentaList() {
  document.getElementById('propsGrid').style.display = '';
  document.getElementById('filterBar').style.display = '';
  document.getElementById('mapContainer').style.display = 'none';
  document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('viewList').classList.add('active');
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    const btn = document.getElementById('backToTop');
    if (btn) btn.classList.toggle('visible', window.scrollY > 400);
  });

  document.getElementById('backToTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('open');
  });

  const ft = document.getElementById('filterToggle');
  const fi = document.getElementById('filterInner');
  if (ft && fi) {
    ft.addEventListener('click', () => {
      fi.classList.toggle('open');
      ft.classList.toggle('open');
    });
  }

  document.getElementById('viewList')?.addEventListener('click', showVentaList);
  document.getElementById('viewMap')?.addEventListener('click', showVentaMap);

  try {
    const s = await API.getPublicSettings();
    window._siteSettings = s;
    window._whatsapp  = s.whatsapp  || '5493510000000';
    window._whatsapp2 = s.whatsapp2 || '';

    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
    set('sitePhoneFooter', s.phone);
    set('siteEmailFooter', s.email);
    set('siteAddressFooter', s.address);

    const defMsg = encodeURIComponent('Hola Bienenhaus, quisiera recibir información sobre una propiedad.');
    document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
      try {
        const url = new URL(a.href);
        const text = url.searchParams.get('text') || defMsg;
        a.href = `https://wa.me/${_wa()}${text ? '?text=' + encodeURIComponent(text) : ''}`;
      } catch { a.href = `https://wa.me/${_wa()}?text=${defMsg}`; }
    });
  } catch {}

  showSkeletons();
  try {
    const data = await API.getProperties({ ..._filters, page: _page, sort: _sort, per_page: PER_PAGE });
    const props = data.properties;
    renderProperties(props, { page: data.page, pages: data.pages, total: data.total, has_prev: data.has_prev, has_next: data.has_next });
    if (props.length) setTimeout(revealCards, 100);
  } catch {}
});

window.showVentaMap = showVentaMap;
window.showVentaList = showVentaList;
