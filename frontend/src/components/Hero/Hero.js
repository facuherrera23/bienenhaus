/**
 * Hero Component
 */

export class Hero {
  constructor() {
    this.video = null;
    this.overlay = null;
  }

  render(container) {
    if (!container) return;
    container.innerHTML = this.getHTML();
    this.bindElements();
    this.initVideo();
  }

  getHTML() {
    return `
<section id="hero" class="hero">
  <div class="hero-bg" id="heroBg">
    <video
      id="heroVideo"
      class="hero-video hidden"
      autoplay muted loop playsinline
      preload="metadata"
      poster="/images/hero-bg.webp"
    ></video>
    <div class="hero-overlay" id="heroOverlay"></div>
  </div>

  <div class="hero-content">
    <h1 class="sr-only">Bienenhaus Propiedades · Inmobiliaria en Córdoba</h1>

    <div class="logo-3d-wrap a1">
      <picture>
        <source srcset="/images/logo-bienenhaus.webp" type="image/webp">
        <img src="/images/logo-bienenhaus.png"
             alt="Bienenhaus Propiedades"
             class="hero-logo logo-3d"
             fetchpriority="high" width="400" height="400"/>
      </picture>
    </div>

    <div class="hero-badge a2">
      <span class="hero-badge-line"></span>
      <span class="hero-badge-text" id="siteCity">Córdoba Capital</span>
      <span class="hero-badge-line"></span>
    </div>

    <p class="hero-sub a3">Casas, departamentos y terrenos seleccionados por expertos en el mercado inmobiliario de Córdoba.</p>

    <div class="hero-btns a4">
      <a href="#" class="btn btn-primary" data-scroll="contact" data-motivo="tasacion">Tasá tu propiedad</a>
      <a href="/venta" class="btn btn-primary" data-scroll="propiedades">Explorar propiedades</a>
      <button class="btn btn-primary" data-scroll="contact">Contactar</button>
    </div>
  </div>

  <div class="hero-stats">
    <div class="hero-stat">
      <span class="hero-stat-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </span>
      <div class="stat"><span class="stat-n" id="statProps" data-count="0">—</span><span class="stat-l">propiedades</span></div>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
      </span>
      <div class="stat"><span class="stat-n" id="statAgents" data-count="0">—</span><span class="stat-l">agentes</span></div>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </span>
      <div class="stat"><span class="stat-n" id="statYears" data-count="0">—</span><span class="stat-l">años</span></div>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </span>
      <div class="stat"><span class="stat-n">100%</span><span class="stat-l">confianza</span></div>
    </div>
  </div>
</section>
`;
  }

  bindElements() {
    this.video = document.getElementById('heroVideo');
    this.overlay = document.getElementById('heroOverlay');
  }

  initVideo() {
    if (!this.video) return;

    // Try to load video from settings
    const videoUrl = document.body.dataset.heroVideo || '';
    if (videoUrl) {
      this.video.src = videoUrl;
      this.video.classList.remove('hidden');
      this.video.load();
      this.video.play().catch(() => {
        // Autoplay blocked, show fallback
        this.video.classList.add('hidden');
      });
    }
  }
}

export default Hero;