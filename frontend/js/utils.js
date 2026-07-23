/**
 * utils.js — Shared helpers for Bienenhaus frontend
 * Load before all other scripts.
 */

function _esc(v) {
  return String(v ?? '').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.formatPrice = function(val, currency) {
  var n = Number(val);
  if (isNaN(n) || n === 0) return '—';
  var code = currency === 'ARS' ? 'ARS' : 'USD';
  return code + ' ' + n.toLocaleString('es-AR');
};

window.formatPriceShort = function(val, currency) {
  var n = Number(val);
  if (isNaN(n) || n === 0) return '—';
  var sym = currency === 'ARS' ? '$' : 'USD';
  return sym + ' ' + n.toLocaleString('es-AR');
};

window.formatDate = function(val, opts) {
  if (!val) return '—';
  opts = opts || {};
  try {
    var d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    var dateOpts = opts.short
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : { day: '2-digit', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('es-AR', dateOpts);
  } catch {
    return String(val);
  }
};

window.formatDateShort = function(val) {
  return window.formatDate(val, { short: true });
};

window.formatDateTime = function(val) {
  if (!val) return '—';
  try {
    var d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(val);
  }
};

window.emptyStateHTML = function(msg, sub) {
  msg = msg || 'Sin contenido';
  sub = sub || '';
  return '<div class="empty-state"><div class="empty-icon">'
    + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity=".4"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>'
    + '<div class="empty-title">' + _esc(msg) + '</div>'
    + (sub ? '<div class="empty-sub">' + _esc(sub) + '</div>' : '')
    + '</div>';
};

window.errorStateHTML = function(msg, retryLabel, retryFn) {
  msg = msg || 'Error al cargar datos.';
  var btn = '';
  if (retryLabel && typeof retryFn === 'function') {
    var fnName = '__retry_' + Math.random().toString(36).slice(2, 6);
    window[fnName] = retryFn;
    btn = '<button class="btn btn-ghost btn-sm" onclick="window.' + fnName + '()" style="margin-top:12px">' + _esc(retryLabel) + '</button>';
  }
  return '<div class="empty-state"><div class="empty-icon">'
    + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="1.2" opacity=".6"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>'
    + '<div class="empty-title" style="color:#e74c3c">' + _esc(msg) + '</div>'
    + '</div>' + btn;
};

window.skeletonGrid = function(count) {
  count = count || 6;
  var cards = '';
  for (var i = 0; i < count; i++) {
    cards += '<div class="skeleton-card"><div class="skeleton-card-img"></div><div class="skeleton-card-body">'
      + '<div class="skeleton-line skeleton-line--w80 skeleton-line--lg"></div>'
      + '<div class="skeleton-line skeleton-line--w60"></div>'
      + '<div class="skeleton-line skeleton-line--w40 skeleton-line--sm"></div>'
      + '<div class="skeleton-specs"><div class="skeleton-line skeleton-line--spec"></div><div class="skeleton-line skeleton-line--spec"></div><div class="skeleton-line skeleton-line--spec"></div></div>'
      + '</div></div>';
  }
  return '<div class="skeleton-grid">' + cards + '</div>';
};

window.skeletonDetail = function() {
  return '<div class="skeleton-detail"><div class="skeleton-detail-gallery"></div><div class="skeleton-detail-info">'
    + '<div class="skeleton-detail-line skeleton-detail-line--w50 skeleton-detail-line--badge"></div>'
    + '<div class="skeleton-detail-line skeleton-detail-line--w70 skeleton-detail-line--xl"></div>'
    + '<div class="skeleton-detail-line skeleton-detail-line--w50 skeleton-detail-line--lg"></div>'
    + '<div class="skeleton-detail-line skeleton-detail-line--w70"></div>'
    + '<div class="skeleton-detail-specs"><div class="skeleton-detail-spec"></div><div class="skeleton-detail-spec"></div><div class="skeleton-detail-spec"></div><div class="skeleton-detail-spec"></div></div>'
    + '<div class="skeleton-detail-line skeleton-detail-line--block"></div>'
    + '<div class="skeleton-detail-line skeleton-detail-line--w30"></div>'
    + '</div></div>';
};

window.showSkeleton = function(containerId, type, count) {
  var el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el) return;
  type = type || 'grid';
  if (type === 'grid') {
    el.innerHTML = window.skeletonGrid(count);
  } else if (type === 'detail') {
    el.innerHTML = window.skeletonDetail();
  }
};

window.hideSkeleton = function(containerId, showContent) {
  var el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el) return;
  if (showContent) {
    el.querySelector('.skeleton-grid')?.remove();
    el.querySelector('.skeleton-detail')?.remove();
  } else {
    el.innerHTML = '';
  }
};

window.showEmpty = function(containerId, msg, sub) {
  var el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el) return;
  el.innerHTML = window.emptyStateHTML(msg, sub);
};

/* showError is provided by api.js — do not redefine here */
