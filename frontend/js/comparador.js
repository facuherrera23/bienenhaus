(function() {
'use strict';

const MAX   = 2;
let _selected = [];

function esc(v) { return String(v ?? '').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtCmp(n) { return window.formatPrice ? window.formatPrice(n, 'ARS') : 'ARS ' + Number(n).toLocaleString('es-AR'); }
const $ = id => document.getElementById(id);

const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const ICON_TIE   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
const ICON_CROWN = '<svg class="crown" viewBox="0 0 24 24" fill="currentColor"><path d="M2 19h20v3H2v-3zM3.3 7.4L7 13.2l4.3-8.5c.2-.4.5-.7.7-.7.2 0 .5.3.7.7l4.3 8.5 3.7-5.8c.3-.5.8-.4.8.2l1.5 9.5H1.5L3 7.6c.1-.6.5-.7.3-.2z"/></svg>';

const WIN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="#20b8ab" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';

function toggleCompare(propId) {
  const idx = _selected.findIndex(p => p.id === propId);
  if (idx !== -1) {
    _selected.splice(idx, 1);
  } else {
    if (_selected.length >= MAX) _selected.shift();
    const prop = window._allProps?.find(p => p.id === propId);
    if (prop) _selected.push(prop);
  }
  updateButtons();
  updateTray();
}

function updateButtons() {
  document.querySelectorAll('[data-compare-id]').forEach(btn => {
    const id = parseInt(btn.dataset.compareId);
    const active = _selected.some(p => p.id === id);
    btn.classList.toggle('selected', active);
    btn.textContent = active ? 'Comparando' : 'Comparar';
  });
}

function updateTray() {
  const tray = $('compareTray');
  if (!tray) return;

  if (_selected.length === 0) {
    tray.classList.remove('visible');
    return;
  }
  tray.classList.add('visible');

  renderSlot('compareSlot1', _selected[0] || null);
  renderSlot('compareSlot2', _selected[1] || null);

  const btnCmp = $('btnOpenCompare');
  if (btnCmp) {
    const ready = _selected.length >= 2;
    btnCmp.disabled = !ready;
    btnCmp.style.opacity = ready ? '1' : '.35';
    btnCmp.textContent = ready ? 'Comparar ahora' : 'Elegí otra';
  }

  const count = $('compareTrayCount');
  if (count) {
    count.innerHTML = '<span class="count-num">' + _selected.length + '</span> / ' + MAX + ' seleccionadas';
  }
}

function renderSlot(slotId, prop) {
  const slot = $(slotId);
  if (!slot) return;

  if (!prop) {
    slot.classList.remove('filled');
    slot.innerHTML = '<span class="compare-slot-number">' + (slotId === 'compareSlot1' ? '1' : '2') + '</span><span class="compare-slot-empty-label">Seleccioná una propiedad</span>';
    return;
  }

  slot.classList.add('filled');
  const thumb = prop.images?.[0] || '';
  const eTitle = esc(prop.title);
  slot.innerHTML = '<span class="compare-slot-number">' + (slotId === 'compareSlot1' ? '1' : '2') + '</span>'
    + (thumb ? '<img class="compare-slot-thumb" src="' + thumb + '" alt="' + eTitle + '" loading="lazy"/>' : '<div class="compare-slot-thumb" style="background:var(--s3);border-radius:6px"></div>')
    + '<div class="compare-slot-info"><div class="compare-slot-title">' + eTitle + '</div><div class="compare-slot-price">' + fmtCmp(prop.price) + '</div></div>'
    + '<button class="compare-slot-remove" onclick="removeFromCompare(' + prop.id + ')" title="Quitar">&#10005;</button>';
}

window.removeFromCompare = function(id) {
  _selected = _selected.filter(p => p.id !== id);
  updateButtons();
  updateTray();
};

window.clearCompare = function() {
  _selected = [];
  updateButtons();
  updateTray();
};

// ══════════════════════════════════════════════════════════════════════
// MODAL — Spec-sheet face-off
// ══════════════════════════════════════════════════════════════════════
window.openCompare = function() {
  if (_selected.length < 2) return;

  const [a, b] = _selected;
  const modal  = $('compareModal');
  const body   = $('compareBody');

  const winPrice = a.price <= b.price ? 'a' : 'b';
  const winBeds  = a.beds  >= b.beds  ? 'a' : 'b';
  const winBaths = a.baths >= b.baths ? 'a' : 'b';
  const winSqm   = a.sqm   >= b.sqm   ? 'a' : 'b';
  const metrics = ['price', 'beds', 'baths', 'sqm'];

  function cell(m, side) {
    const wins = { price: winPrice, beds: winBeds, baths: winBaths, sqm: winSqm };
    const w = wins[m];
    if (!w) return '';
    const aV = side === 'a' ? a[m] : b[m];
    const bV = side === 'a' ? b[m] : a[m];
    if (aV === bV) return 'tie';
    return side === w ? 'winner' : 'loser';
  }

  function icon(m, side) { const c = cell(m, side); return c === 'winner' ? WIN_ICON : c === 'loser' ? ICON_CROSS : c === 'tie' ? ICON_TIE : ''; }

  const winsA = metrics.filter(m => cell(m, 'a') === 'winner').length;
  const winsB = metrics.filter(m => cell(m, 'b') === 'winner').length;
  const ties  = metrics.filter(m => cell(m, 'a') === 'tie').length;

  function fmtCap(s) { return s ? s[0].toUpperCase() + s.slice(1) : '—'; }

  function specValue(prop, m, side) {
    const c = cell(m, side);
    const cls = c === 'winner' ? 'is-winner' : c === 'loser' ? 'is-loser' : '';
    const ic = c === 'winner' ? WIN_ICON : c === 'loser' ? ICON_CROSS : c === 'tie' ? ICON_TIE : '';
    let val;
    switch (m) {
      case 'price': val = fmtCmp(prop.price); break;
      case 'type':  val = fmtCap(prop.type); break;
      case 'beds':  val = prop.beds ?? '—'; break;
      case 'baths': val = prop.baths ?? '—'; break;
      case 'sqm':   val = (prop.sqm ?? '—') + ' m²'; break;
    }
    return '<div class="compare-spec-value ' + cls + '">' + ic + (ic ? ' ' : '') + val + '</div>';
  }

  function specRow(label, iconSvg, m, side) {
    const prop = side === 'a' ? a : b;
    return '<div class="compare-spec"><div class="compare-spec-label">' + iconSvg + label + '</div>' + specValue(prop, m, side) + '</div>';
  }

  const specIcon = {
    price: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    type: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    beds: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 012 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>',
    baths: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3v2.25"/><path d="M4 21l1-1.5"/><path d="M20 21l-1-1.5"/></svg>',
    sqm: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>',
  };

  function buildPropCard(prop, side) {
    const idx = side === 'a' ? 0 : 1;
    const eTitle = esc(prop.title);
    const eLoc   = esc(prop.location || '');
    const wTotal = side === 'a' ? winsA : winsB;
    const isWinner = (side === 'a' && winsA > winsB) || (side === 'b' && winsB > winsA) || (winsA === winsB && wTotal > 0);

    return '<div class="compare-prop-card' + (isWinner && winsA !== winsB ? ' is-winner' : '') + '">'
      + '<div class="compare-card-img-wrap">'
      + (prop.images?.[0]
          ? '<img class="compare-card-img" src="' + prop.images[0] + '" alt="' + eTitle + '" loading="lazy"/>'
          : '<div style="aspect-ratio:16/10;background:var(--s3)"></div>')
      + '<span class="compare-card-tag">Propiedad ' + (idx + 1) + '</span>'
      + (isWinner && winsA !== winsB ? '<span class="compare-card-winner-badge">' + ICON_CROWN + ' Ganadora</span>' : '')
      + '</div>'
      + '<div class="compare-card-body">'
      + '<div class="compare-card-title">' + eTitle + '</div>'
      + '<div class="compare-card-location">' + eLoc + '</div>'
      + '<div class="compare-specs">'
      + specRow('Precio', specIcon.price, 'price', side)
      + specRow('Tipo', specIcon.type, 'type', side)
      + specRow('Dorm.', specIcon.beds, 'beds', side)
      + specRow('Baños', specIcon.baths, 'baths', side)
      + specRow('Sup.', specIcon.sqm, 'sqm', side)
      + '</div>'
      + '</div></div>';
  }

  const waMsg = (prop) => encodeURIComponent('Hola Bienenhaus! Me interesa la propiedad *' + prop.title + '* en ' + prop.location + '.');

  body.innerHTML = ''

    // Face-off cards
    + '<div class="compare-faceoff">'
    + buildPropCard(a, 'a')
    + buildPropCard(b, 'b')
    + '</div>'

    // Score bar
    + '<div class="compare-score-banner">'
    + '<div class="compare-score-item ' + (winsA > winsB ? 'is-winner' : '') + '">' + WIN_ICON + '<span class="score-num">' + winsA + '</span> aciertos</div>'
    + '<div class="compare-score-divider"></div>'
    + '<div class="compare-score-item">' + ICON_TIE + '<span class="score-num">' + ties + '</span> empates</div>'
    + '<div class="compare-score-divider"></div>'
    + '<div class="compare-score-item ' + (winsB > winsA ? 'is-winner' : '') + '">' + WIN_ICON + '<span class="score-num">' + winsB + '</span> aciertos</div>'
    + '</div>'

    // Winner announcement
    + '<div class="compare-winner-banner">'
    + (winsA > winsB ? '' + ICON_CROWN + '<span class="compare-winner-text">' + esc(a.title) + ' es la mejor opción</span>' : '')
    + (winsB > winsA ? '' + ICON_CROWN + '<span class="compare-winner-text">' + esc(b.title) + ' es la mejor opción</span>' : '')
    + (winsA === winsB ? '' + ICON_TIE + '<span class="compare-winner-text draw">Resultado empatado — depende de tus prioridades</span>' : '')
    + '</div>'

    // CTA
    + '<div class="compare-cta-section">'
    + [a, b].map(p => '<div class="compare-cta-col">'
      + '<a href="/venta/' + p.id + '" class="btn btn-ghost" style="width:100%;padding:12px;font-size:10px;display:flex;align-items:center;justify-content:center;gap:6px">'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
      + 'Ver detalle</a>'
      + '<a href="https://wa.me/' + (window._wa ? window._wa() : '5491130110101') + '?text=' + waMsg(p) + '" target="_blank" class="btn btn-wapp" style="width:100%;padding:12px;font-size:10px;display:flex;align-items:center;justify-content:center;gap:6px">'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
      + 'WhatsApp</a>'
      + '</div>').join('')
    + '</div>';

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.body.style.height = '100%';
};

// ══════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  // Tray
  var tray = document.createElement('div');
  tray.id = 'compareTray';
  tray.className = 'compare-tray';
  tray.innerHTML = '<div class="compare-tray-slots">'
    + '<div class="compare-slot" id="compareSlot1"><span class="compare-slot-number">1</span><span class="compare-slot-empty-label">Seleccioná una propiedad</span></div>'
    + '<div class="compare-slot" id="compareSlot2"><span class="compare-slot-number">2</span><span class="compare-slot-empty-label">Seleccioná otra propiedad</span></div>'
    + '</div>'
    + '<div class="compare-tray-actions">'
    + '<span class="compare-tray-count" id="compareTrayCount"><span class="count-num">0</span> / 2 seleccionadas</span>'
    + '<button class="btn btn-primary btn-sm" id="btnOpenCompare" onclick="openCompare()" disabled style="opacity:.35">Elegí otra</button>'
    + '<button class="compare-tray-close" onclick="clearCompare()" title="Limpiar">&#10005;</button>'
    + '</div>';
  document.body.appendChild(tray);

  // Modal
  var modal = document.createElement('div');
  modal.id = 'compareModal';
  modal.className = 'compare-modal hidden';
  modal.innerHTML = '<div class="compare-box">'
    + '<div class="compare-box-header">'
    + '<div class="compare-box-title">'
    + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="9" height="18" rx="1"/><rect x="13" y="6" width="9" height="15" rx="1"/><line x1="2" y1="9" x2="11" y2="9"/><line x1="13" y1="12" x2="22" y2="12"/><line x1="2" y1="15" x2="11" y2="15"/><line x1="13" y1="18" x2="22" y2="18"/></svg>'
    + 'Comparar propiedades</div>'
    + '<button class="compare-box-close" onclick="closeCompare()">&#10005;</button>'
    + '</div>'
    + '<div id="compareBody"></div>'
    + '</div>';
  modal.addEventListener('click', function(e) { if (e.target === modal) closeCompare(); });
  document.body.appendChild(modal);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !$('compareModal').classList.contains('hidden')) closeCompare();
  });
});

window.closeCompare = function() {
  var m = $('compareModal');
  if (m) m.classList.add('hidden');
  document.body.style.overflow = '';
  document.body.style.height = '';
};

// ── Hook ──────────────────────────────────────────────────────────────
var _origRender = window.renderProperties;
window.renderProperties = function(props, pagination) {
  window._allProps = props;
  _origRender(props, pagination);
  injectCompareButtons();
  updateButtons();
};

function injectCompareButtons() {
  document.querySelectorAll('.prop-card').forEach(function(card) {
    if (card.querySelector('.btn-compare')) return;
    var link = card.querySelector('a[href^="/venta/"]');
    if (!link) return;
    var pid = parseInt(link.getAttribute('href').split('/').pop());
    if (!pid || isNaN(pid)) return;

    var btn = document.createElement('button');
    btn.className = 'btn-compare';
    btn.textContent = 'Comparar';
    btn.dataset.compareId = pid;
    btn.onclick = function(e) { e.stopPropagation(); toggleCompare(pid); };

    var wrap = card.querySelector('.card-img-wrap');
    if (wrap) wrap.appendChild(btn);
  });
}

window.toggleCompare = toggleCompare;

})();
