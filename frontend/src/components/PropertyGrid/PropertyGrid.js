/**
 * Property Grid Component
 */

import { API } from '@/utils/api.js';
import { buildPropertyCard, renderProperties, initCarousel } from './PropertyCard/PropertyCard.js';
import { config } from '@/utils/config.js';

/**
 * PropertyGrid Component
 * Handles loading, filtering, and rendering property cards
 */
export class PropertyGrid {
  constructor(options = {}) {
    this.gridId = options.gridId || 'propsGrid';
    this.paginationId = options.paginationId || 'pagination';
    this.type = options.type || 'venta';
    this.perPage = options.perPage || 6;
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
    this.filterTimer = null;
    this.allLoadedProps = [];
  }

  /**
   * Initialize the grid
   */
  async init() {
    await this.loadProperties();
    this.bindFilterEvents();
    this.bindPaginationEvents();
  }

  /**
   * Load properties from API
   */
  async loadProperties() {
    this.showSkeletons();

    try {
      const filters = {
        ...this.filters,
        page: this.page,
        sort: this.sort,
        per_page: this.perPage
      };

      const data = await API.getProperties(filters);
      const props = data.properties || [];

      // Merge with demo data for fallback
      const mergedProps = this.mergeWithDemo(props);

      this.allLoadedProps = mergedProps;
      renderProperties(this.gridId, mergedProps, {
        page: data.page,
        pages: data.pages,
        total: data.total,
        has_prev: data.has_prev,
        has_next: data.has_next
      });

      // Reveal cards with animation
      if (mergedProps.length) {
        setTimeout(() => this.revealCards(), 50);
      }

      this.renderPagination(data);
    } catch (err) {
      console.error('[PropertyGrid] Error loading properties:', err);
      this.showError();
    }
  }

  /**
   * Merge API data with demo data
   */
  mergeWithDemo(apiProps) {
    if (!apiProps || !apiProps.length) {
      return this.getDemoProperties();
    }

    const apiIds = new Set(apiProps.map(p => p.id));
    const uniqueDemo = this.getDemoProperties().filter(p => !apiIds.has(p.id));
    return [...apiProps, ...uniqueDemo];
  }

  /**
   * Get demo properties
   */
  getDemoProperties() {
    return window.DEMO_PROPERTIES || [];
  }

  /**
   * Show skeleton loaders
   */
  showSkeletons(count = 6) {
    const grid = document.getElementById(this.gridId);
    if (!grid) return;

    grid.innerHTML = Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line w-60"></div>
          <div class="skeleton skeleton-line w-80 h-20"></div>
          <div class="skeleton skeleton-line w-80"></div>
          <div class="skeleton-specs">
            <div class="skeleton"></div>
            <div class="skeleton"></div>
            <div class="skeleton"></div>
          </div>
          <div class="skeleton skeleton-line w-100"></div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Show error state
   */
  showError() {
    const grid = document.getElementById(this.gridId);
    if (!grid) return;

    grid.innerHTML = `
      <div class="error-state">
        <p>Error al cargar propiedades.</p>
        <button class="btn btn-primary" onclick="window.propertyGrid?.loadProperties()">Reintentar</button>
      </div>`;
  }

  /**
   * Reveal cards with animation
   */
  revealCards() {
    const grid = document.getElementById(this.gridId);
    if (!grid) return;

    grid.querySelectorAll('.prop-card').forEach((card, i) => {
      card.classList.add('reveal-card');
      const dirs = ['reveal-left', 'reveal-right', 'reveal-center'];
      card.classList.add(dirs[i % 3]);
      card.style.transitionDelay = `${Math.min(i * 0.08, 0.6)}s`;
      setTimeout(() => card.classList.add('visible'), 30);
    });
  }

  /**
   * Render pagination
   */
  renderPagination(pagination) {
    const wrap = document.getElementById(this.paginationId);
    if (!wrap) return;

    if (!pagination || pagination.pages <= 1) {
      wrap.innerHTML = '';
      return;
    }

    wrap.setAttribute('aria-label', 'Paginación');
    const page = pagination.page;
    const pages = pagination.pages;

    let html = '<div class="pag-inner">';

    // Previous
    html += `<button class="pag-btn" onclick="window.propertyGrid?.goToPage(${page - 1})" ${pagination.has_prev ? '' : 'disabled'}>‹ Anterior</button>`;

    // Page numbers
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(pages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      html += `<button class="pag-num" onclick="window.propertyGrid?.goToPage(1)">1</button>`;
      if (start > 2) html += '<span class="pag-dots">…</span>';
    }

    for (let i = start; i <= end; i++) {
      html += `<button class="pag-num${i === page ? ' pag-active' : ''}" onclick="window.propertyGrid?.goToPage(${i})"${i === page ? ' aria-current="page"' : ''}>${i}</button>`;
    }

    if (end < pages) {
      if (end < pages - 1) html += '<span class="pag-dots">…</span>';
      html += `<button class="pag-num" onclick="window.propertyGrid?.goToPage(${pages})">${pages}</button>`;
    }

    // Next
    html += `<button class="pag-btn" onclick="window.propertyGrid?.goToPage(${page + 1})" ${pagination.has_next ? '' : 'disabled'}>Siguiente ›</button>`;

    html += '</div>';
    wrap.innerHTML = html;
  }

  /**
   * Go to specific page
   */
  goToPage(page) {
    this.page = page;
    this.loadProperties();
  }

  /**
   * Bind filter events
   */
  bindFilterEvents() {
    // Search
    const search = document.getElementById('fSearch');
    if (search) {
      search.addEventListener('input', this.debounce(() => {
        this.filters.search = search.value;
        this.page = 1;
        this.loadProperties();
      }, 300));
    }

    // Type filter
    const type = document.getElementById('fType');
    if (type) {
      type.addEventListener('change', () => {
        this.filters.type = type.value;
        this.page = 1;
        this.loadProperties();
      });
    }

    // Beds filter
    const beds = document.getElementById('fBeds');
    if (beds) {
      beds.addEventListener('change', () => {
        this.filters.beds = beds.value;
        this.page = 1;
        this.loadProperties();
      });
    }

    // Status filter
    const status = document.getElementById('fStatus');
    if (status) {
      status.addEventListener('change', () => {
        this.filters.status = status.value;
        this.page = 1;
        this.loadProperties();
      });
    }

    // Sort
    const sort = document.getElementById('fSort');
    if (sort) {
      sort.addEventListener('change', () => {
        this.sort = sort.value;
        this.page = 1;
        this.loadProperties();
      });
    }

    // Price slider
    const sliderMin = document.getElementById('sliderMin');
    const sliderMax = document.getElementById('sliderMax');
    if (sliderMin && sliderMax) {
      const updateSlider = () => {
        let min = parseInt(sliderMin.value);
        let max = parseInt(sliderMax.value);
        if (min > max - 5000) {
          min = max - 5000;
          sliderMin.value = min;
        }
        this.filters.priceMin = min > 0 ? min : '';
        this.filters.priceMax = max < 500000 ? max : '';
        this.loadProperties();
      };

      sliderMin.addEventListener('input', updateSlider);
      sliderMax.addEventListener('input', updateSlider);
    }

    // Reset button
    const reset = document.getElementById('fReset');
    if (reset) {
      reset.addEventListener('click', () => {
        this.filters = { search: '', type: 'all', priceMin: '', priceMax: '', beds: 'all', status: 'all' };
        this.sort = 'default';
        this.page = 1;

        const searchEl = document.getElementById('fSearch');
        if (searchEl) searchEl.value = '';

        ['fType', 'fBeds', 'fStatus', 'fSort'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = id === 'fSort' ? 'default' : 'all';
        });

        const sliderMin = document.getElementById('sliderMin');
        const sliderMax = document.getElementById('sliderMax');
        if (sliderMin) sliderMin.value = 0;
        if (sliderMax) sliderMax.value = 500000;

        this.loadProperties();
      });
    }
  }

  /**
   * Bind pagination events
   */
  bindPaginationEvents() {
    // Handled by inline onclick in renderPagination
  }

  /**
   * Debounce utility
   */
  debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }
}

/**
 * Initialize property grid
 */
export function initPropertyGrid(options) {
  const grid = new PropertyGrid(options);
  window.propertyGrid = grid;
  grid.init();
  return grid;
}

export default PropertyGrid;