/**
 * Stats Counter Component
 * Animated counters that trigger on scroll
 */

import { config } from '@/utils/config.js';

/**
 * Initialize stats counter animation
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
 * Set stat values from API data
 */
export function setStatsFromData(data, agents) {
  const sp = document.getElementById('statProps');
  const sa = document.getElementById('statAgents');
  const sy = document.getElementById('statYears');

  const heroYearsSetting = config.site?.hero_years;
  const yearsVal = heroYearsSetting ? parseInt(heroYearsSetting) : (agents.length ? Math.max(...agents.map(a => a.years || 0)) : 0);

  if (sp) {
    sp.dataset.count = data.available_total > 0 ? data.available_total : 
      (data.properties ? data.properties.filter(p => p.status === 'disponible').length : 0);
    sp.textContent = '—';
  }
  if (sa) { sa.dataset.count = agents.length; sa.textContent = '—'; }
  if (sy) { sy.dataset.count = yearsVal; sy.textContent = '—'; }

  // Re-initialize counter after setting values
  setTimeout(initStatsCounter, 200);
}

export default { initStatsCounter, setStatsFromData };