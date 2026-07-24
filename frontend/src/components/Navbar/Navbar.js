/**
 * Navbar Component
 * Single source of truth for navigation - desktop + mobile in one component
 */

import { WHATSAPP_NUMBER } from '@utils/config';
import './Navbar.css';

/**
 * Navigation links configuration
 */
const NAV_LINKS = [
  { href: '/', label: 'Inicio', scroll: 'hero' },
  { href: '/#quienes', label: 'Nosotros', scroll: 'quienes' },
  { href: '/venta', label: 'Comprar', scroll: 'propiedades', tab: 'venta' },
  { href: '/alquiler', label: 'Alquilar', scroll: 'propiedades', tab: 'alquiler' },
  { href: '/#agents', label: 'Equipo', scroll: 'agents' },
  { href: '/#contact', label: 'Contacto', scroll: 'contact' },
  { href: '/#contact', label: 'Tasá tu propiedad', scroll: 'contact', motivo: 'tasacion' }
];

/**
 * Build WhatsApp URL
 */
function buildWhatsAppUrl(text = '') {
  const encodedText = encodeURIComponent(text || 'Hola Bienenhaus!');
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;
}

/**
 * Create nav link element
 */
function createNavLink(link, isMobile = false) {
  const a = document.createElement('a');
  a.href = link.href;
  a.className = `nav-link${isMobile ? '' : ''}`;
  a.textContent = link.label;

  if (link.scroll) {
    a.dataset.scroll = link.scroll;
  }
  if (link.tab) {
    a.dataset.tab = link.tab;
  }
  if (link.motivo) {
    a.dataset.motivo = link.motivo;
  }

  return a;
}

/**
 * Create WhatsApp CTA button
 */
function createWhatsAppCTA(text = 'WhatsApp', isMobile = false) {
  const a = document.createElement('a');
  a.href = buildWhatsAppUrl('Hola Bienenhaus!');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = `btn btn-outline${isMobile ? '' : ' nav-cta hide-mobile'}`;
  a.textContent = text;
  if (isMobile) {
    a.style.marginTop = '8px';
  }
  return a;
}

/**
 * Navbar Component
 */
export class Navbar {
  constructor() {
    this.mobileMenu = null;
    this.hamburger = null;
    this.overlay = null;
    this.isOpen = false;
  }

  /**
   * Render the navbar into a container
   */
  render(container) {
    if (!container) {
      console.error('[Navbar] Container not provided');
      return;
    }

    container.innerHTML = this.getHTML();
    this.bindElements(container);
    this.bindEvents();
  }

  /**
   * Generate HTML template
   */
  getHTML() {
    const desktopLinks = NAV_LINKS.map(l => createNavLink(l, false)).map(el => el.outerHTML).join('');
    const mobileLinks = NAV_LINKS.map(l => createNavLink(l, true)).map(el => el.outerHTML).join('');
    const whatsappDesktop = createWhatsAppCTA('WhatsApp', false).outerHTML;
    const whatsappMobile = createWhatsAppCTA('WhatsApp', true).outerHTML;

    return `
<header>
  <nav id="navbar" class="navbar">
    <div class="nav-inner">
      <div class="brand">
        <a href="/" class="logo-3d-wrap" aria-label="Bienenhaus Propiedades - Inicio">
          <img src="/images/BienenhausBHBlanco512x512.png"
               alt="Bienenhaus Propiedades"
               class="nav-logo logo-3d"
               fetchpriority="high"
               width="48"
               height="48"/>
        </a>
      </div>

      <div class="nav-links" id="navLinks">
        ${desktopLinks}
        ${whatsappDesktop}
      </div>

      <button class="hamburger" id="hamburger" aria-label="Menú" aria-expanded="false" aria-controls="mobileMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <div class="mobile-menu-overlay" id="mobileMenuOverlay" aria-hidden="true"></div>

    <div class="mobile-menu" id="mobileMenu" role="navigation" aria-label="Menú móvil">
      ${mobileLinks}
      ${whatsappMobile}
    </div>
  </nav>
</header>
<a href="#main-content" class="skip-link">Saltar al contenido principal</a>
`;
  }

  /**
   * Cache DOM elements
   */
  bindElements(container) {
    this.navbar = container.querySelector('#navbar');
    this.hamburger = container.querySelector('#hamburger');
    this.mobileMenu = container.querySelector('#mobileMenu');
    this.overlay = container.querySelector('#mobileMenuOverlay');
    this.navLinks = container.querySelectorAll('.nav-link[data-scroll]');
  }

  /**
   * Attach event listeners
   */
  bindEvents() {
    // Hamburger toggle
    this.hamburger?.addEventListener('click', () => this.toggleMobileMenu());

    // Overlay click closes menu
    this.overlay?.addEventListener('click', () => this.closeMobileMenu());

    // Close on nav link click
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => this.closeMobileMenu());
    });

    // ESC key closes menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMobileMenu();
      }
    });

    // Smooth scroll for data-scroll links
    document.querySelectorAll('[data-scroll]').forEach(el => {
      el.addEventListener('click', (e) => this.handleSmoothScroll(e));
    });
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    this.isOpen = !this.isOpen;
    this.hamburger?.setAttribute('aria-expanded', this.isOpen);
    this.mobileMenu?.classList.toggle('open', this.isOpen);
    this.overlay?.classList.toggle('visible', this.isOpen);
    document.body.style.overflow = this.isOpen ? 'hidden' : '';
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    if (this.isOpen) {
      this.isOpen = false;
      this.hamburger?.setAttribute('aria-expanded', 'false');
      this.mobileMenu?.classList.remove('open');
      this.overlay?.classList.remove('visible');
      document.body.style.overflow = '';
    }
  }

  /**
   * Handle smooth scroll for data-scroll links
   */
  handleSmoothScroll(e) {
    const targetId = e.currentTarget.dataset.scroll;
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Handle tab switch if present
    const tab = e.currentTarget.dataset.tab;
    if (tab && typeof window.switchTab === 'function') {
      window.switchTab(tab);
    }

    // Handle motivo for contact form
    const motivo = e.currentTarget.dataset.motivo;
    if (motivo) {
      const motivoSel = document.getElementById('cf_motivo');
      if (motivoSel) {
        motivoSel.value = motivo;
        motivoSel.dispatchEvent(new Event('change'));
      }
    }
  }

  /**
   * Initialize component
   */
  init() {
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      this.navbar?.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Back to top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 400);
      });
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }
}

/**
 * Auto-initialize if container exists
 */
export function initNavbar(containerSelector = 'header') {
  const container = document.querySelector(containerSelector);
  if (container) {
    const navbar = new Navbar();
    navbar.render(container);
    navbar.init();
    return navbar;
  }
  return null;
}

// Auto-init on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
  });
}

export default Navbar;