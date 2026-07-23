/**
 * inject-partials.js — Inyecta navbar y footer compartidos en HTML
 *
 * Lee los marcadores <!-- #NAVBAR --> y <!-- #FOOTER --> de cada HTML
 * y los reemplaza con el contenido de los parciales correspondientes.
 * Se ejecuta durante `npm run build`.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PARTIALS = path.join(ROOT, 'partials');

const partials = {
  navbar:     fs.readFileSync(path.join(PARTIALS, 'navbar.html'), 'utf-8'),
  propiedadNavbar: fs.readFileSync(path.join(PARTIALS, 'navbar-propiedad.html'), 'utf-8'),
  footer:     fs.readFileSync(path.join(PARTIALS, 'footer.html'), 'utf-8'),
};

const pages = [
  { file: 'index.html',     navbar: 'navbar',           footer: true },
  { file: 'propiedad.html', navbar: 'propiedadNavbar',   footer: true },
];

let count = 0;
for (const page of pages) {
  const filePath = path.join(ROOT, page.file);
  let html = fs.readFileSync(filePath, 'utf-8');

  const navContent = partials[page.navbar];
  html = html.replace('<!-- #NAVBAR -->', () => { count++; return navContent; });
  if (page.footer) {
    html = html.replace('<!-- #FOOTER -->', () => { count++; return partials.footer; });
  }
  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`  ✓ ${page.file} — ${count > 0 ? 'injected' : 'no markers found'}`);
}

console.log(`\n  Total replacements: ${count}`);
