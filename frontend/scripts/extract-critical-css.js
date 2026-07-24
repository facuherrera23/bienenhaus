const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cssDir = path.join(__dirname, '..', 'css');
const htmlFile = path.join(__dirname, '..', 'index.html');

// Critical CSS selectors for hero, nav, and stats section
const CRITICAL_SELECTORS = [
  // Hero section
  '#hero',
  '.hero-bg',
  '.hero-video',
  '.hero-overlay',
  '.hero-content',
  '.logo-3d-wrap',
  '.hero-logo',
  '.hero-badge',
  '.hero-badge-line',
  '.hero-badge-text',
  '.hero-sub',
  '.hero-btns',
  '.btn',
  '.hero-stats',
  '.hero-stat',
  '.hero-stat-icon',
  '.hero-stat-icon svg',
  '.stat',
  '.stat-n',
  '.stat-l',
  '.hero-title-deco-line',
  '.hero-scroll-indicator',
  
  // Navigation
  '#navbar',
  '.nav-inner',
  '.brand',
  '.nav-logo',
  '.nav-links',
  '.nav-link',
  '.nav-cta',
  '.hamburger',
  '.mobile-menu',
  
  // Stats section
  '.hero-stats',
  '.hero-stat',
  '.hero-stat-icon',
  '.hero-stat-icon svg',
  '.stat',
  '.stat-n',
  '.stat-l',
  
  // Global/base styles that affect above-the-fold
  ':root',
  '.sr-only',
  '.skip-link',
  '.skip-link:focus',
  'body::before',
  '.hzone',
  '.page',
  
  // Utility classes used above fold
  '.hidden',
  '.container',
  '.section',
  '.section-heading',
  '.eyebrow',
  '.sh-title',
  '.sh-sub',
  '.sh-line',
  
  // Animations used above fold
  '.reveal',
  '.reveal.visible',
  '.reveal-left',
  '.reveal-right',
  '.reveal-center',
  '.reveal-scale',
  '.reveal-card',
];

// CSS content that should be inlined (we'll extract from styles.min.css)
const CRITICAL_CSS_FILE = path.join(__dirname, '..', 'css', 'styles.min.css');
const OUTPUT_CSS = path.join(__dirname, '..', 'css', 'critical.min.css');

function extractCriticalCSS() {
  console.log('Extracting critical CSS...');
  
  if (!fs.existsSync(CRITICAL_CSS_FILE)) {
    console.error('Critical CSS source file not found:', CRITICAL_CSS_FILE);
    return;
  }
  
  const css = fs.readFileSync(CRITICAL_CSS_FILE, 'utf-8');
  
  // Simple extraction: find rules that match our critical selectors
  // This is a simplified approach - for production use a tool like 'critical' or 'penthouse'
  const criticalRules = [];
  const rules = css.split('}');
  
  for (const rule of rules) {
    const trimmed = rule.trim();
    if (!trimmed) continue;
    
    // Check if rule matches any critical selector
    const selectorPart = rule.split('{')[0];
    if (!selectorPart) continue;
    
    const isCritical = CRITICAL_SELECTORS.some(selector => {
      // Check if selector matches or is a parent of critical selector
      return selectorPart.includes(selector.replace('#', '').replace('.', '')) ||
             selectorPart.startsWith(selector) ||
             selector.includes(selectorPart.trim());
    });
    
    if (isCritical) {
      criticalRules.push(rule + '}');
    }
  }
  
  // Always include :root, body, html, and base styles
  const baseRules = css.split('}').filter(r => {
    const selector = r.split('{')[0].trim();
    return selector === ':root' || 
           selector === 'html' || 
           selector === 'body' ||
           selector === '*::before' ||
           selector === '*::after' ||
           selector === '*, *::before, *::after' ||
           selector === 'a' ||
           selector === 'button' ||
           selector === 'img';
  }).join('}') + '}';
  
  const criticalCSS = baseRules + '\n' + criticalRules.join('\n');
  
  // Minify
  const minified = criticalCSS
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around punctuation
    .replace(/\s+}/g, '}') // Remove space before }
    .replace(/{\s+/g, '{'); // Remove space after {
  
  fs.writeFileSync(OUTPUT_CSS, criticalCSS);
  console.log(`Critical CSS written to ${OUTPUT_CSS} (${criticalCSS.length} chars)`);
  
  return criticalCSS;
}

// Run if called directly
if (require.main === module) {
  extractCriticalCSS();
}

module.exports = { extractCriticalCSS };