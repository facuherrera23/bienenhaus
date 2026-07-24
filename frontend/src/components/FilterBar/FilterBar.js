/**
 * FilterBar Component
 */

import { config } from '@/utils/config.js';

export class FilterBar {
  constructor() {
    this.filters = {
      search: '',
      type: 'all',
      priceMin: '',
      priceMax: '',
      beds: 'all',
      status: 'all',
      sort: 'default'
    };
    this.page = 1;
    this.sort = 'default';
  }

  render(container) {
    if (!container) return;
    container.innerHTML = this.getHTML();
    this.bindElements();
    this.bindEvents();
  }

  getHTML() {
    return `
<div id="filterBar" class="filter-bar">
  <button class="filter-toggle" id="filterToggle" aria-label="Mostrar filtros">
    <span class="filter-toggle-text">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 21v-7"/><path d="M4 10V3"/>
        <path d="M12 21v-9"/><path d="M12 8V3"/>
        <path d="M20 21v-5"/><path d="M20 12V3"/>
        <path d="M2 14h4"/><path d="M10 8h4"/>
        <path d="M18 16h4"/>
      </svg>
      Filtros
      <span class="filter-toggle-count" id="filterActiveCount"></span>
    </span>
    <svg class="toggle-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  </button>

  <div class="filter-inner--card" id="filterInner">
    <div class="filter-header">
      <span class="filter-title">Buscar propiedades</span>
      <span class="filter-subtitle">Encontrá el hogar ideal</span>
    </div>

    <div class="filter-search-wrap">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
        <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <input type="text" id="fSearch" class="filter-input search-input"
             placeholder="Buscar propiedades, barrios o ubicaciones..."
             aria-label="Buscar propiedades"/>
    </div>

    <div class="filter-row">
      <div class="filter-field">
        <span class="filter-field-label">Tipo</span>
        <div class="filter-select-wrap">
          <select id="fType" class="filter-select" aria-label="Tipo de propiedad">
            <option value="all">Todos</option>
            <option value="casa">Casa</option>
            <option value="departamento">Depto</option>
            <option value="finca">Finca</option>
            <option value="terreno">Terreno</option>
            <option value="local">Local</option>
            <option value="otro">Otro</option>
          </select>
          <svg class="select-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M2 2l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <div class="filter-field">
        <span class="filter-field-label">Dorm.</span>
        <div class="filter-select-wrap">
          <select id="fBeds" class="filter-select" aria-label="Cantidad de dormitorios">
            <option value="all">Cualquier</option>
            <option value="1">1 dorm.</option>
            <option value="2">2 dorm.</option>
            <option value="3">3 dorm.</option>
            <option value="4">4+ dorm.</option>
          </select>
          <svg class="select-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M2 2l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <div class="filter-field">
        <span class="filter-field-label">Estado</span>
        <div class="filter-select-wrap">
          <select id="fStatus" class="filter-select" aria-label="Estado de la propiedad">
            <option value="all">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="vendida">Vendida</option>
          </select>
          <svg class="select-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M2 2l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <div class="filter-field">
        <span class="filter-field-label">Orden</span>
        <div class="filter-select-wrap">
          <select id="fSort" class="filter-select" aria-label="Ordenar por">
            <option value="default">Destacadas</option>
            <option value="price_asc">Menor precio</option>
            <option value="price_desc">Mayor precio</option>
            <option value="newest">Más nuevas</option>
            <option value="oldest">Más antiguas</option>
          </select>
          <svg class="select-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M2 2l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    <div class="price-slider-section">
      <div class="price-slider-header">
        <span class="price-slider-title">Precio</span>
        <div class="price-slider-header-right">
          <span class="price-slider-range-label" id="sliderRangeLabel">USD 0 — Sin límite</span>
          <button class="btn btn-ghost btn-sm" id="fReset">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
            </svg>
            Limpiar
          </button>
        </div>
      </div>
      <div class="price-slider-track">
        <div class="price-slider-range" id="sliderRange"></div>
        <input type="range" class="price-slider-input" id="sliderMin" aria-label="Precio mínimo"
               min="0" max="500000" step="5000" value="0"/>
        <input type="range" class="price-slider-input" id="sliderMax" aria-label="Precio máximo"
               min="0" max="500000" step="5000" value="500000"/>
      </div>
      <div class="price-slider-labels">
        <span class="price-slider-label" id="sliderMinLabel">USD 0</span>
        <span class="price-slider-label" id="sliderMaxLabel">Sin límite</span>
      </div>
    </div>
  </div>
</div>
`;
  }

  bindElements() {
    this.filterInner = document.getElementById('filterInner');
    this.filterToggle = document.getElementById('filterToggle');
    this.sliderMin = document.getElementById('sliderMin');
    this.sliderMax = document.getElementById('sliderMax');
    this.sliderRange = document.getElementById('sliderRange');
    this.sliderMinLabel = document.getElementById('sliderMinLabel');
    this.sliderMaxLabel = document.getElementById('sliderMaxLabel');
    this.sliderRangeLabel = document.getElementById('sliderRangeLabel');
    this.resetBtn = document.getElementById('fReset');
  }

  bindEvents() {
    // Toggle filter panel
    this.filterToggle?.addEventListener('click', () => {
      this.filterInner?.classList.toggle('open');
      this.filterToggle?.classList.toggle('open');
    });

    // Price slider
    const PRICE_MAX = 500000;
    const updateSlider = () => {
      if (!this.sliderMin || !this.sliderMax) return;

      let min = parseInt(this.sliderMin.value);
      let max = parseInt(this.sliderMax.value);

      if (min > max - 5000) {
        min = max - 5000;
        this.sliderMin.value = min;
      }

      const pMin = (min / 500000) * 100;
      const pMax = (max / 500000) * 100;
      this.sliderRange.style.left = pMin + '%';
      this.sliderRange.style.width = (pMax - pMin) + '%';

      this.sliderMinLabel.textContent = min > 0 ? `USD ${min.toLocaleString('es-AR')}` : 'USD 0';
      this.sliderMaxLabel.textContent = max >= 500000 ? 'Sin límite' : `USD ${max.toLocaleString('es-AR')}`;
      this.sliderRangeLabel.textContent = this.sliderMinLabel.textContent + ' — ' + this.sliderMaxLabel.textContent;

      // Update filters
      this.filters.priceMin = min > 0 ? min : '';
      this.filters.priceMax = max < 500000 ? max : '';
    };

    this.sliderMin?.addEventListener('input', updateSlider);
    this.sliderMax?.addEventListener('input', updateSlider);
    updateSlider();

    // Reset button
    this.resetBtn?.addEventListener('click', () => {
      this.resetFilters();
    });
  }

  resetFilters() {
    this.filters = { search: '', type: 'all', priceMin: '', priceMax: '', beds: 'all', status: 'all' };
    this.sort = 'default';
    this.page = 1;

    // Reset UI
    const search = document.getElementById('fSearch');
    if (search) search.value = '';

    ['fType', 'fBeds', 'fStatus', 'fSort'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = id === 'fSort' ? 'default' : 'all';
    });

    this.sliderMin.value = 0;
    this.sliderMax.value = 500000;
    this.updateSlider();
  }

  debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }
}

export default FilterBar;