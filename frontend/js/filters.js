// ── Venta filter state ────────────────────────────────────────────
let _filters     = { search:'', type:'all', priceMin:'', priceMax:'', beds:'all', status:'all' };
let _sort        = 'default';
let _allLoadedProps = [];
let _filterTimer = null;
let _page        = 1;

// Rental filter state
let _rFilters    = { search:'', type:'all', priceMin:'', priceMax:'', beds:'all', furnished:'' };
let _rSort       = 'default';
let _rFilterTimer = null;
let _rPage       = 1;

function goToPage(n) {
  _page = n;
  applyFilters();
}
window.goToPage = goToPage;

function goToRentalPage(n) {
  _rPage = n;
  applyRentalFilters();
}
window.goToRentalPage = goToRentalPage;

function currentFilters() { return { ..._filters }; }
window.currentFilters = currentFilters;

// ── PRICE SLIDER ──────────────────────────────────────────────────
const PRICE_MAX = 500000;
const sliderMin = document.getElementById('sliderMin');
const sliderMax = document.getElementById('sliderMax');

function fmtSlider(v) {
  if (v >= PRICE_MAX) return 'Sin límite';
  return `USD ${Number(v).toLocaleString('es-AR')}`;
}

function updateSlider() {
  if (!sliderMin || !sliderMax) return;
  let min = parseInt(sliderMin.value);
  let max = parseInt(sliderMax.value);
  if (min > max - 5000) { min = max - 5000; sliderMin.value = min; }

  const minLbl = document.getElementById('sliderMinLabel');
  const maxLbl = document.getElementById('sliderMaxLabel');
  const rangeLbl = document.getElementById('sliderRangeLabel');
  const range  = document.getElementById('sliderRange');
  if (minLbl) minLbl.textContent = fmtSlider(min);
  if (maxLbl) maxLbl.textContent = fmtSlider(max);
  if (rangeLbl) rangeLbl.textContent = fmtSlider(min) + ' — ' + fmtSlider(max);

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

// ── SORT ──────────────────────────────────────────────────────────
document.getElementById('fSort')?.addEventListener('change', e => {
  _sort = e.target.value;
  _page = 1;
  applyFilters();
});

// ── VENTA FILTERS ─────────────────────────────────────────────────
function applyFilters() {
  clearTimeout(_filterTimer);
  _filterTimer = setTimeout(async () => {
    showSkeletons();
    try {
      const filters = { ..._filters, page: _page, sort: _sort, per_page: PER_PAGE };
      const data = await API.getProperties(filters);
      const props = data.properties;
      _allLoadedProps = props;
      renderProperties(props, { page: data.page, pages: data.pages, total: data.total, has_prev: data.has_prev, has_next: data.has_next });
      if (props.length) setTimeout(revealCards, 50);
      updateFilterChips();
    } catch (err) {
      showError('propsGrid', 'Error al cargar propiedades. ¿Está corriendo el servidor?');
    }
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

document.getElementById('fReset')?.addEventListener('click', () => {
  _filters = { search:'', type:'all', priceMin:'', priceMax:'', beds:'all', status:'all' };
  _sort    = 'default';
  _page    = 1;
  ['fSearch'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  ['fType','fBeds','fStatus','fSort'].forEach(id => { const el = document.getElementById(id); if(el) el.value = id==='fSort'?'default':'all'; });
  if (sliderMin) sliderMin.value = 0;
  if (sliderMax) sliderMax.value = PRICE_MAX;
  updateSlider();
  applyFilters();
});

// ── RENTAL FILTERS ────────────────────────────────────────────────
function applyRentalFilters() {
  clearTimeout(_rFilterTimer);
  _rFilterTimer = setTimeout(async () => {
    showRentalSkeletons();
    try {
      const filters = { ..._rFilters, page: _rPage, sort: _rSort, per_page: PER_PAGE };
      const data = await API.getRentals(filters);
      const rlist = data.rentals || [];
      renderRentalsIndex(rlist);
      renderRentalPagination(data);
      if (rlist.length) setTimeout(revealCards, 50);
      updateFilterChips();
    } catch (err) {
      const rg = document.getElementById('rentalsGridIndex');
      if (rg) rg.innerHTML = '<div class="loading-state">Error al cargar alquileres.</div>';
    }
  }, 350);
}

function updateFilterChips() {
  const wrap = document.getElementById('activeChips');
  if (!wrap) return;
  const isRent = _activeTab === 'alquiler';
  const f = isRent ? _rFilters : _filters;
  const sorter = isRent ? _rSort : _sort;
  const chips = [];

  if (f.search)
    chips.push('<span class="filter-chip" data-key="search">"' + f.search + '"<button class="filter-chip-remove" data-key="search">&times;</button></span>');

  if (f.type && f.type !== 'all') {
    const labels = { casa:'Casa', departamento:'Depto', finca:'Finca', terreno:'Terreno', local:'Local', otro:'Otro' };
    chips.push('<span class="filter-chip" data-key="type">' + (labels[f.type] || f.type) + '<button class="filter-chip-remove" data-key="type">&times;</button></span>');
  }

  if (f.beds && f.beds !== 'all')
    chips.push('<span class="filter-chip" data-key="beds">' + f.beds + ' dorm.<button class="filter-chip-remove" data-key="beds">&times;</button></span>');

  if (f.status && f.status !== 'all') {
    const slabel = f.status === 'alquilada' ? 'Alquilada' : f.status === 'vendida' ? 'Vendida' : 'Disponible';
    chips.push('<span class="filter-chip" data-key="status">' + slabel + '<button class="filter-chip-remove" data-key="status">&times;</button></span>');
  }

  if (f.furnished === 'true')
    chips.push('<span class="filter-chip" data-key="furnished">Amoblado<button class="filter-chip-remove" data-key="furnished">&times;</button></span>');

  if (f.priceMin || f.priceMax) {
    const min = f.priceMin || '0';
    const max = f.priceMax || '\u221e';
    chips.push('<span class="filter-chip" data-key="price">USD ' + Number(min).toLocaleString('es-AR') + '\u2013' + (max === '\u221e' ? 'sin l\u00edmite' : Number(max).toLocaleString('es-AR')) + '<button class="filter-chip-remove" data-key="price">&times;</button></span>');
  }

  if (sorter && sorter !== 'default') {
    const sortLabels = {price_asc:'Menor precio',price_desc:'Mayor precio',newest:'M\u00e1s nuevos',oldest:'M\u00e1s antiguos'};
    chips.push('<span class="filter-chip" data-key="sort">' + (sortLabels[sorter] || sorter) + '<button class="filter-chip-remove" data-key="sort">&times;</button></span>');
  }

  wrap.innerHTML = chips.join('');

  wrap.querySelectorAll('.filter-chip-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const key = btn.dataset.key;
      const ff = _activeTab === 'alquiler' ? _rFilters : _filters;
      if (key === 'price') {
        ff.priceMin = ''; ff.priceMax = '';
        if (sliderMin) sliderMin.value = 0;
        if (sliderMax) sliderMax.value = PRICE_MAX;
        if (typeof updateSlider === 'function') updateSlider();
      } else if (key === 'search') {
        ff.search = '';
        const el = document.getElementById('fSearch');
        if (el) el.value = '';
      } else if (key === 'furnished') {
        ff.furnished = '';
        const el = document.getElementById('fFurnished');
        if (el) el.checked = false;
      } else if (key === 'sort') {
        if (_activeTab === 'alquiler') { _rSort = 'default'; } else { _sort = 'default'; }
        const sel = document.getElementById('fSort');
        if (sel) sel.value = 'default';
      } else {
        ff[key] = 'all';
        const mid = key === 'type' ? 'fType' : key === 'beds' ? 'fBeds' : 'fStatus';
        const el = document.getElementById(mid);
        if (el) el.value = 'all';
      }
      if (_activeTab === 'alquiler') { _rPage = 1; applyRentalFilters(); }
      else { _page = 1; applyFilters(); }
    });
  });
}
