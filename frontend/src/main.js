/**
 * Main entry point - SPA bootstrap
 * Initializes core components and routing
 */

import './styles/main.css';
import { initNavbar } from '@components/Navbar/Navbar.js';
import { initFooter } from '@components/Footer/Footer.js';
import { initHero } from '@components/Hero/Hero.js';
import { initPropertyGrid } from '@components/PropertyGrid/PropertyGrid.js';
import { initFilterBar } from '@components/FilterBar/FilterBar.js';
import { initContactForm } from '@components/ContactForm/ContactForm.js';
import { initAgentGrid } from '@components/AgentGrid/AgentGrid.js';
import { initGeoRecommendations } from '@components/GeoRecommendations/GeoRecommendations.js';
import { initStatsCounter } from '@components/StatsCounter/StatsCounter.js';
import { initWhatsAppFloat } from '@components/WhatsAppFloat/WhatsAppFloat.js';
import { initScrollAnimations } from '@utils/scrollAnimations.js';
import { API } from '@utils/api.js';

// Global API instance
window.API = API;

// Page-specific initialization
function initPage() {
  const page = document.body.dataset.page || 'home';

  // Initialize components based on page
  switch (page) {
    case 'home':
      initHomePage();
      break;
    case 'venta':
      initVentaPage();
      break;
    case 'alquiler':
      initAlquilerPage();
      break;
    case 'propiedad':
      initPropiedadPage();
      break;
    case 'tasacion':
      initTasacionPage();
      break;
    default:
      initHomePage();
  }
}

function initHomePage() {
  // Initialize all home page components
  initHero();
  initStatsCounter();
  initFilterBar();
  initPropertyGrid('venta');
  initPropertyGrid('alquiler');
  initAgentGrid();
  initGeoRecommendations();
  initContactForm();
  initWhatsAppFloat();
  initScrollAnimations();
}

function initVentaPage() {
  initHero();
  initFilterBar();
  initPropertyGrid('venta');
  initScrollAnimations();
  initWhatsAppFloat();
}

function initAlquilerPage() {
  initHero();
  initFilterBar();
  initPropertyGrid('alquiler');
  initScrollAnimations();
  initWhatsAppFloat();
}

function initPropiedadPage() {
  // Detail page init
  initScrollAnimations();
  initWhatsAppFloat();
}

function initTasacionPage() {
  initHero();
  initContactForm();
  initScrollAnimations();
  initWhatsAppFloat();
}

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navbar first (shared across all pages)
  initNavbar();

  // Initialize footer
  initFooter();

  // Initialize page-specific components
  initPage();

  // Initialize WhatsApp float (shared)
  initWhatsAppFloat();
});

// Handle visibility change for animations
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Re-trigger stats counter if in view
    const stats = document.querySelectorAll('.stat-n[data-count]');
    stats.forEach(el => {
      if (el.dataset.count && !el.classList.contains('animated')) {
        const target = parseFloat(el.dataset.count);
        animateCounter(el, target);
      }
    });
  }
});

// Counter animation
function animateCounter(el, target) {
  el.classList.add('animated');
  const duration = 1800;
  const start = performance.now();
  const isFloat = target % 1 !== 0;

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * target;
    el.textContent = isFloat ? current.toFixed(1) : Math.round(current).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Export for module usage
export { initPage, initHomePage };