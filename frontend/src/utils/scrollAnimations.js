/**
 * Scroll Animations Utility
 * IntersectionObserver-based reveal animations
 */

/**
 * Initialize scroll reveal animations
 */
export function initScrollAnimations() {
  // Add reveal classes to sections
  document.querySelectorAll('.section-heading, .section-alt, .about-cards, .value-cards, .contact-grid').forEach(el => {
    el.classList.add('reveal');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/**
 * Reveal property cards with stagger
 */
export function revealCards() {
  document.querySelectorAll('.prop-card').forEach((card, i) => {
    card.classList.add('reveal-card');
    const dirs = ['reveal-left', 'reveal-right', 'reveal-center'];
    card.classList.add(dirs[i % 3]);
    card.style.transitionDelay = `${Math.min(i * 0.08, 0.6)}s`;
    setTimeout(() => card.classList.add('visible'), 30);
  });
}

/**
 * Initialize counter animation for stats
 */
export function initStatsCounter() {
  const stats = document.querySelectorAll('.stat-n[data-count]');
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        if (!isNaN(target)) animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
}

/**
 * Animate counter from 0 to target
 */
function animateCounter(el, target) {
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

/**
 * Set stats from API data
 */
export function setStatsFromData(data, agents) {
  const sp = document.getElementById('statProps');
  const sa = document.getElementById('statAgents');
  const sy = document.getElementById('statYears');

  const yearsVal = agents.length ? Math.max(...agents.map(a => a.years || 0)) : 0;

  if (sp) { sp.dataset.count = data.available_total > 0 ? data.available_total : (data.properties ? data.properties.filter(p => p.status === 'disponible').length : 0); sp.textContent = '—'; }
  if (sa) { sa.dataset.count = agents.length; sa.textContent = '—'; }
  if (sy) { sy.dataset.count = yearsVal; sy.textContent = '—'; }

  setTimeout(initStatsCounter, 200);
}

export { initScrollAnimations as default, initScrollAnimations, revealCards, initStatsCounter, setStatsFromData };