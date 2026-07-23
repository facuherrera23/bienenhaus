/**
 * admin-portals.js — Módulo 14: Portales Management Center
 * Reusa Design System existente. Sin duplicación de componentes.
 */

let _portals = [];
let _portalLogs = [];
let _publications = [];
let _queueItems = [];
let _prtPubs = [];
let _prtCurrentPub = null;

const PRT_STATUS_MAP = { published: 'Publicado', pending: 'Pendiente', synced: 'Sincronizado', error: 'Error', paused: 'Pausado', archived: 'Archivado' };
const PRT_STATUS_CLS = { published: 'status-disponible', pending: 'status-oculta', synced: 'status-disponible', error: 'status-vendida', paused: 'admin-prop-featured', archived: 'status-oculta' };

/* ── Inicialización ──────────────────────────────────────────── */
function loadPortals() {
  API.getPortals().then(portals => {
    _portals = portals;
    renderPortals();
    loadPortalLogs();
    loadPortalQueueCount();
    if (typeof loadPortalManagement === 'function') loadPortalManagement();
  }).catch(() => {
    $('portalsAdminList').innerHTML = '<div class="loading-state">Sin permisos para ver portales.</div>';
  });
}

function loadPortalLogs() {
  API.getPortalLogs().then(logs => {
    _portalLogs = logs.items || logs;
    renderPortalLogs();
  }).catch(() => {});
}

/* ── Subtabs ─────────────────────────────────────────────────── */
document.addEventListener('click', function (e) {
  const btn = e.target.closest('[data-portal-subtab]');
  if (!btn) return;
  document.querySelectorAll('#portalSubtabs .admin-subtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const tab = btn.dataset.portalSubtab;
  ['dashboard', 'portals', 'publications', 'queue'].forEach(t => {
    const el = $('portalSubtab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (el) el.classList.toggle('hidden', t !== tab);
  });
  if (tab === 'dashboard') loadPortalManagement();
  if (tab === 'publications') loadPublicationsEnhanced();
  if (tab === 'queue') loadQueue('pending');
});

/* ── MANAGEMENT: DASHBOARD ───────────────────────────────────── */

async function loadPortalManagement() {
  try {
    const kpis = await _portalReq('GET', '/api/portals/kpi');
    renderPrtKpiBar(kpis);
    const platforms = await _portalReq('GET', '/api/portals/platforms');
    renderPrtPlatforms(platforms);
    const pubs = await _portalReq('GET', '/api/portals/publications/enhanced?per_page=20');
    _prtPubs = pubs.items || pubs;
    renderPrtPubs($('portalDashboardPubs'));
  } catch {
    $('portalDashboardPubs').innerHTML = '<div class="loading-state">Error al cargar</div>';
  }
}

function renderPrtKpiBar(kpis) {
  const container = $('prtKpiBar');
  if (!container) return;
  const items = [
    { label: 'Publicadas', num: kpis.published, sub: 'activas' },
    { label: 'Pendientes', num: kpis.pending, sub: 'por publicar' },
    { label: 'Con errores', num: kpis.errors, sub: 'requieren atención' },
    { label: 'Sincronizadas', num: kpis.synced, sub: 'al día' },
    { label: 'Actualizadas hoy', num: kpis.updated_today, sub: 'hoy' },
    { label: 'Portales conectados', num: kpis.portals_connected, sub: 'activos' },
    { label: 'Publicaciones activas', num: kpis.active, sub: 'en portales' },
    { label: 'Publicaciones pausadas', num: kpis.paused, sub: 'temporalmente' },
  ];
  container.innerHTML = items.map(i => `
    <div class="prt-kpi-card">
      <span class="prt-kpi-label">${i.label}</span>
      <span class="prt-kpi-number">${i.num}</span>
      <span class="prt-kpi-sub">${i.sub}</span>
    </div>
  `).join('');
}

function renderPrtPlatforms(platforms) {
  const container = $('prtPlatformsGrid');
  if (!container) return;
  const icons = { zonaprop: '🔵', argenprop: '🔴', mercadolibre: '🟡', properati: '🟢', propio: '⚪' };
  container.innerHTML = platforms.map(p => `
    <div class="prt-platform-card">
      <div class="prt-platform-icon">${icons[p.slug] || '🔌'}</div>
      <div class="prt-platform-info">
        <div class="prt-platform-name">${esc(p.name)}</div>
        <div class="prt-platform-count">${p.publications_count} publicaciones · ${p.active ? 'Activo' : 'Inactivo'}</div>
      </div>
      <span class="admin-status-badge ${p.active ? 'status-disponible' : 'status-oculta'} prt-badge-tiny">${p.active ? '✓' : '—'}</span>
    </div>
  `).join('');
}

function renderPrtPubs(container) {
  if (!container) return;
  if (!_prtPubs.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Sin publicaciones</div></div>';
    return;
  }
  container.innerHTML = _prtPubs.map(p => {
    const thumb = p.property_images?.[0];
    const statusCls = PRT_STATUS_CLS[p.status] || 'status-oculta';
    return `
      <div class="prt-pub-item" onclick="openPrtPanel(${p.id})">
        ${thumb ? `<img src="${proxyImgUrl(thumb)}" class="prt-pub-thumb" onerror="this.className='prt-pub-thumb--empty';this.textContent='🏠'">` : '<div class="prt-pub-thumb--empty">🏠</div>'}
        <div class="prt-pub-body">
          <div class="prt-pub-address">${esc(p.property_address || p.property_title || '—')}</div>
          <div class="prt-pub-meta">
            <span class="admin-status-badge ${statusCls} prt-badge-tiny">${PRT_STATUS_MAP[p.status] || p.status}</span>
            <span class="prt-pub-meta-item">${esc(p.portal_name)}</span>
            <span class="prt-pub-meta-item">${p.operation === 'alquiler' ? 'Alquiler' : 'Venta'}</span>
          </div>
        </div>
        <div class="prt-pub-right">
          <span class="prt-pub-date">${p.published_at ? formatDateShort(p.published_at) : '—'}</span>
          <span class="prt-pub-date">${p.last_synced_at ? '↻ ' + formatDateShort(p.last_synced_at) : ''}</span>
        </div>
      </div>
    `;
  }).join('');
}

/* ── MANAGEMENT: ENHANCED PUBLICATIONS LIST ──────────────────── */

async function loadPublicationsEnhanced() {
  const container = $('publicationsEnhancedList');
  if (!container) return;
  container.innerHTML = '<div class="loading-state">Cargando publicaciones...</div>';
  try {
    const data = await _portalReq('GET', '/api/portals/publications/enhanced?per_page=200');
    _prtPubs = data.items || [];
    renderPublicationsEnhanced('');
  } catch {
    container.innerHTML = '<div class="loading-state">Error al cargar</div>';
  }
}

function renderPublicationsEnhanced(filter) {
  const container = $('publicationsEnhancedList');
  if (!container) return;
  const f = (filter || '').toLowerCase();
  let items = _prtPubs;
  if (f) items = items.filter(p => (p.property_address || p.property_title || '').toLowerCase().includes(f));
  if (!items.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Sin resultados</div></div>';
    return;
  }
  container.innerHTML = items.map(p => {
    const thumb = p.property_images?.[0];
    const statusCls = PRT_STATUS_CLS[p.status] || 'status-oculta';
    return `
      <div class="prt-pub-item" onclick="openPrtPanel(${p.id})">
        ${thumb ? `<img src="${proxyImgUrl(thumb)}" class="prt-pub-thumb" onerror="this.className='prt-pub-thumb--empty';this.textContent='🏠'">` : '<div class="prt-pub-thumb--empty">🏠</div>'}
        <div class="prt-pub-body">
          <div class="prt-pub-address">${esc(p.property_address || p.property_title || '—')}</div>
          <div class="prt-pub-meta">
            <span class="admin-status-badge ${statusCls} prt-badge-tiny">${PRT_STATUS_MAP[p.status] || p.status}</span>
            <span class="prt-pub-meta-item">${esc(p.portal_name)}</span>
            <span class="prt-pub-meta-item">${p.operation === 'alquiler' ? 'Alquiler' : 'Venta'}</span>
            <span class="prt-pub-meta-item">${p.property_beds ? p.property_beds + ' dorm' : ''}</span>
          </div>
        </div>
        <div class="prt-pub-right">
          <span class="prt-pub-date">${p.published_at ? formatDateShort(p.published_at) : '—'}</span>
          ${p.last_synced_at ? `<span class="prt-pub-date">↻ ${formatDateShort(p.last_synced_at)}</span>` : ''}
        </div>
        <div class="prt-pub-actions">
          <button class="btn btn-ghost btn-sm prt-icon-btn" onclick="event.stopPropagation();openPrtPanel(${p.id})" title="Ver detalle" >👁</button>
          <button class="btn btn-ghost btn-sm prt-icon-btn" onclick="event.stopPropagation();prtQuickAction(${p.id},'pause')" title="Pausar" >⏸</button>
          <button class="btn btn-ghost btn-sm prt-icon-btn" onclick="event.stopPropagation();prtQuickAction(${p.id},'delete')" title="Eliminar" >🗑</button>
        </div>
      </div>
    `;
  }).join('');
}

window.filterPublications = function (v) {
  if ($('portalSubtabPublications')?.classList.contains('hidden')) return;
  renderPublicationsEnhanced(v);
};

/* ── SIDE PANEL ──────────────────────────────────────────────── */

async function openPrtPanel(id) {
  try {
    const p = await _portalReq('GET', `/api/portals/publications/${id}`);
    _prtCurrentPub = p;
    $('prtPanelTitle').textContent = esc(p.property_address || p.property_title || 'Publicación');
    const body = $('prtPanelBody');
    const thumb = p.property_images?.[0];
    const statusCls = PRT_STATUS_CLS[p.status] || 'status-oculta';
    const history = p.sync_history || [];

    body.innerHTML = `
      <div class="prt-panel-header">
        ${thumb ? `<img src="${proxyImgUrl(thumb)}" class="prt-panel-thumb" onerror="this.style.display='none'">` : ''}
        <div class="prt-panel-title">${esc(p.property_address || p.property_title || '—')}</div>
      </div>

      <div class="prt-panel-section">
        <div class="prt-panel-section-title">Detalles</div>
        <div class="prt-panel-row"><span class="prt-panel-label">Estado</span><span class="admin-status-badge ${statusCls}">${PRT_STATUS_MAP[p.status] || p.status}</span></div>
        <div class="prt-panel-row"><span class="prt-panel-label">Portal</span><span class="prt-panel-value">${esc(p.portal_name)}</span></div>
        <div class="prt-panel-row"><span class="prt-panel-label">Operación</span><span class="prt-panel-value">${p.operation === 'alquiler' ? 'Alquiler' : 'Venta'}</span></div>
        ${p.property_price ? `<div class="prt-panel-row"><span class="prt-panel-label">Precio</span><span class="prt-panel-value prt-price-value" >$ ${Number(p.property_price).toLocaleString('es-AR')}</span></div>` : ''}
        ${p.property_beds ? `<div class="prt-panel-row"><span class="prt-panel-label">Dormitorios</span><span class="prt-panel-value">${p.property_beds}</span></div>` : ''}
        ${p.property_baths ? `<div class="prt-panel-row"><span class="prt-panel-label">Baños</span><span class="prt-panel-value">${p.property_baths}</span></div>` : ''}
        ${p.property_sqm ? `<div class="prt-panel-row"><span class="prt-panel-label">Superficie</span><span class="prt-panel-value">${p.property_sqm} m²</span></div>` : ''}
        ${p.external_id ? `<div class="prt-panel-row"><span class="prt-panel-label">ID externo</span><span class="prt-panel-value prt-mono-value" >${esc(p.external_id)}</span></div>` : ''}
        ${p.assigned_agent_name ? `<div class="prt-panel-row"><span class="prt-panel-label">Responsable</span><span class="prt-panel-value">${esc(p.assigned_agent_name)}</span></div>` : ''}
      </div>

      ${p.published_at ? `<div class="prt-panel-section"><div class="prt-panel-section-title">Fechas</div>
        <div class="prt-panel-row"><span class="prt-panel-label">Publicación</span><span class="prt-panel-value">${formatDateShort(p.published_at)}</span></div>
        ${p.last_synced_at ? `<div class="prt-panel-row"><span class="prt-panel-label">Última sinc.</span><span class="prt-panel-value">${formatDateShort(p.last_synced_at)}</span></div>` : ''}
        ${p.paused_at ? `<div class="prt-panel-row"><span class="prt-panel-label">Pausada</span><span class="prt-panel-value">${formatDateShort(p.paused_at)}</span></div>` : ''}
      </div>` : ''}

      ${p.last_error ? `<div class="prt-panel-section"><div class="prt-panel-section-title">Error</div>
        <div class="prt-error-box">${esc(p.last_error)}</div>
      </div>` : ''}

      <div class="prt-panel-section">
        <div class="prt-panel-section-title">Acciones rápidas</div>
        <div class="prt-actions">
          ${p.status !== 'published' && p.status !== 'synced' ? `<button class="btn btn-primary btn-sm prt-action-btn" onclick="prtAction(${p.id},'publish')">Publicar</button>` : ''}
          <button class="btn btn-ghost btn-sm prt-action-btn" onclick="prtAction(${p.id},'pause')">Pausar</button>
          ${p.paused_at ? `<button class="btn btn-ghost btn-sm prt-action-btn" onclick="prtAction(${p.id},'resume')">Reanudar</button>` : ''}
          ${p.status === 'error' ? `<button class="btn btn-ghost btn-sm prt-action-btn" onclick="prtAction(${p.id},'retry')">Reintentar</button>` : ''}
          ${p.archived_at ? `<button class="btn btn-ghost btn-sm prt-action-btn" onclick="prtAction(${p.id},'unarchive')">Restaurar</button>` : `<button class="btn btn-ghost btn-sm prt-action-btn" onclick="prtAction(${p.id},'archive')">Archivar</button>`}
          <button class="btn btn-danger btn-sm prt-action-btn" onclick="prtConfirmDelete(${p.id})">Eliminar</button>
        </div>
      </div>

      <div class="prt-panel-section">
        <div class="prt-panel-section-title">Historial de sincronización (${history.length})</div>
        ${history.length ? history.map(h => {
          const lvlColor = h.level === 'error' ? 'var(--admin-danger)' : h.level === 'info' ? 'var(--admin-primary)' : 'var(--admin-text-muted)';
          return `<div class="prt-history-item">
            <div class="prt-history-level" style="background:${lvlColor}"></div>
            <div class="prt-history-body">
              <div class="prt-history-action">${esc(h.action)}</div>
              <div class="prt-history-msg">${esc(h.message)}</div>
            </div>
            <div class="prt-history-date">${h.created_at ? formatDateTime(h.created_at) : ''}</div>
          </div>`;
        }).join('') : '<div class="prt-no-history">Sin historial</div>'}
      </div>
    `;
    $('prtOverlay').classList.add('show');
    $('prtPanel').classList.add('open');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

function closePrtPanel() {
  $('prtOverlay').classList.remove('show');
  $('prtPanel').classList.remove('open');
  _prtCurrentPub = null;
}

/* ── QUICK ACTIONS ───────────────────────────────────────────── */

async function prtAction(id, action) {
  try {
    const result = await _portalReq('POST', `/api/portals/publications/${id}/action`, { action });
    const actionLabels = { publish: 'Publicada', pause: 'Pausada', resume: 'Reanudada', retry: 'Reintentando', archive: 'Archivada', unarchive: 'Restaurada' };
    toast(actionLabels[action] || 'Acción completada', 'success');
    closePrtPanel();
    loadPortalManagement();
    if (!$('portalSubtabDashboard')?.classList.contains('hidden')) loadPortalManagement();
    if (!$('portalSubtabPublications')?.classList.contains('hidden')) loadPublicationsEnhanced();
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

async function prtQuickAction(id, action) {
  const labels = { pause: 'pausar', delete: 'eliminar' };
  if (!await confirmModal(`¿${labels[action] || action} esta publicación?`)) return;
  try {
    const result = await _portalReq('POST', `/api/portals/publications/${id}/action`, { action });
    const actionLabels = { pause: 'Pausada', delete: 'Eliminada' };
    toast(actionLabels[action] || 'OK', 'success');
    if (!$('portalSubtabDashboard')?.classList.contains('hidden')) loadPortalManagement();
    if (!$('portalSubtabPublications')?.classList.contains('hidden')) loadPublicationsEnhanced();
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

async function prtConfirmDelete(id) {
  if (!await confirmModal('¿Eliminar esta publicación definitivamente?')) return;
  try {
    await _portalReq('POST', `/api/portals/publications/${id}/action`, { action: 'delete' });
    toast('Publicación eliminada', 'success');
    closePrtPanel();
    if (!$('portalSubtabDashboard')?.classList.contains('hidden')) loadPortalManagement();
    if (!$('portalSubtabPublications')?.classList.contains('hidden')) loadPublicationsEnhanced();
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

/* ── HTTP HELPER ─────────────────────────────────────────────── */

async function _portalReq(method, path, body) {
  const api = window.API;
  if (!api) throw new Error('API no disponible');
  return api._rawReq ? api._rawReq(method, path, body) : _req(method, path, body);
}

/* ── EXISTING CODE (preserved) ───────────────────────────────── */
/* ── Dashboard (legacy per-portal health) ────────────────────── */
async function loadPortalDashboard() {
  const list = $('portalDashboardList');
  if (!list) return;
  list.innerHTML = '<div class="loading-state">Cargando dashboard...</div>';
  try {
    const data = await _portalReq('GET', '/api/portals/dashboard');
    const portals = data.data || [];
    if (!portals.length) {
      list.innerHTML = '<div class="empty-state">No hay portales configurados.</div>';
      return;
    }
    let h = '<div class="prt-portal-grid">';
    portals.forEach(p => {
      const healthColors = { ok: 'var(--success)', warning: '#c9a84c', error: '#e65b5b', inactive: 'var(--g4)' };
      const healthLabels = { ok: 'Saludable', warning: 'Atención', error: 'Error', inactive: 'Inactivo' };
      const color = healthColors[p.health] || 'var(--g4)';
      const label = healthLabels[p.health] || p.health;
      h += '<div style="background:var(--s2);border:1px solid var(--b);border-radius:10px;padding:18px;border-left:3px solid ' + color + '">';
      h += '<div class="prt-card-header">';
      h += '<span style="width:10px;height:10px;border-radius:50%;background:' + color + '"></span>';
      h += '<strong class="prt-card-title">' + esc(p.name) + '</strong>';
      h += '<span style="font-size:10px;color:' + color + ';font-weight:600;background:rgba(0,0,0,0.2);padding:2px 8px;border-radius:4px">' + label + '</span>';
      h += '</div>';
      h += '<div class="prt-stats-grid">';
      h += '<div><span class="prt-stat-label">Publicadas</span><br><span class="prt-stat-value">' + p.publications_published + '/' + p.publications_total + '</span></div>';
      h += '<div><span class="prt-stat-label">Errores</span><br><span style="color:' + (p.publications_errors > 0 ? '#e65b5b' : 'var(--g3)') + ';font-weight:600">' + p.publications_errors + '</span></div>';
      h += '<div><span class="prt-stat-label">Cola pendiente</span><br><span class="prt-stat-value">' + p.queue_pending + '</span></div>';
      h += '<div><span class="prt-stat-label">Cola fallida</span><br><span style="color:' + (p.queue_failed > 0 ? '#e65b5b' : 'var(--g3)') + ';font-weight:600">' + p.queue_failed + '</span></div>';
      h += '</div>';
      if (p.last_sync_at) {
        h += '<div class="prt-last-activity">Última actividad: ' + new Date(p.last_sync_at).toLocaleString() + '</div>';
      }
      h += '<div class="prt-actions-row">';
      if (p.queue_failed > 0) {
        h += '<button class="btn btn-ghost btn-sm prt-action-btn" onclick="retryAllFailed()">Reintentar fallidos</button>';
      }
      h += '<button class="btn btn-ghost btn-sm prt-action-btn" onclick="loadPortalLogsForPortal(' + p.id + ',\'' + esc(p.name) + '\')">Ver logs</button>';
      h += '</div></div>';
    });
    h += '</div>';
    list.innerHTML = h;
  } catch (e) {
    list.innerHTML = '<div class="error-state">Error: ' + e.message + '</div>';
  }
}

async function loadPortalLogsForPortal(portalId, portalName) {
  const title = document.getElementById('portalLogsModalTitle');
  const body = document.getElementById('portalLogsModalBody');
  if (title) title.textContent = 'Logs: ' + portalName;
  if (body) body.innerHTML = '<div class="loading-state">Cargando logs...</div>';
  document.getElementById('portalLogsModal').classList.remove('hidden');
  try {
    const res = await _portalReq('GET', '/api/portals/logs?portal_id=' + portalId + '&per_page=100');
    const logs = res.data?.items || [];
    if (body) {
      if (!logs.length) {
        body.innerHTML = '<div class="empty-state">Sin registros.</div>';
      } else {
        body.innerHTML = logs.map(l => `
          <div class="admin-message-item prt-msg-item" style="border-left:3px solid ${l.level === 'error' ? '#e65b5b' : l.level === 'info' ? 'var(--accent)' : 'var(--g4)'}">
            <div class="prt-log-row-inline">
              <span class="prt-level-badge-v2">${esc(l.level)}</span>
              <code class="prt-log-action">${esc(l.action)}</code>
              <span class="prt-msg-text">${esc(l.message)}</span>
              <span class="prt-log-time-sm">${l.created_at ? new Date(l.created_at).toLocaleString() : ''}</span>
            </div>
          </div>`).join('');
      }
    }
  } catch (e) {
    if (body) body.innerHTML = '<div class="error-state">' + e.message + '</div>';
  }
}

async function retryAllFailed() {
  try {
    const res = await _portalReq('POST', '/api/portals/bulk/retry');
    toast('Reintentando ' + (res.data?.retried || 0) + ' items fallidos', 'info');
    loadPortalDashboard();
    loadPortalQueueCount();
  } catch (e) { toast(e.message, 'error'); }
}

async function bulkPublishToPortals(propertyIds, rentalIds) {
  if (!propertyIds.length && !rentalIds.length) return;
  const count = propertyIds.length + rentalIds.length;
  if (!await confirmModal(`¿Publicar ${count} item${count !== 1 ? 's' : ''} en portales activos?`)) return;
  const portals = _portals.filter(p => p.active);
  if (!portals.length) { toast('No hay portales activos', 'warn'); return; }
  const portalIds = portals.map(p => p.id);
  try {
    const res = await _portalReq('POST', '/api/portals/bulk/publish', { property_ids: propertyIds, rental_ids: rentalIds, portal_ids: portalIds });
    toast(res.data?.enqueued + ' items encolados', 'success');
    loadPortalQueueCount();
  } catch (e) { toast(e.message, 'error'); }
}

async function bulkUnpublishFromPortals(propertyIds, rentalIds) {
  if (!propertyIds.length && !rentalIds.length) return;
  const count = propertyIds.length + rentalIds.length;
  if (!await confirmModal(`¿Despublicar ${count} item${count !== 1 ? 's' : ''} de los portales?`)) return;
  const portals = _portals.filter(p => p.active);
  if (!portals.length) { toast('No hay portales activos', 'warn'); return; }
  const portalIds = portals.map(p => p.id);
  try {
    const res = await _portalReq('POST', '/api/portals/bulk/unpublish', { property_ids: propertyIds, rental_ids: rentalIds, portal_ids: portalIds });
    toast(res.data?.enqueued + ' items encolados', 'success');
    loadPortalQueueCount();
  } catch (e) { toast(e.message, 'error'); }
}

window.loadPortalDashboard = loadPortalDashboard;
window.retryAllFailed = retryAllFailed;
window.bulkPublishToPortals = bulkPublishToPortals;
window.bulkUnpublishFromPortals = bulkUnpublishFromPortals;

/* ── Sidebar badge ────────────────────────────────────────────── */
function loadPortalQueueCount() {
  API.getQueueCount().then(r => {
    const n = r.pending || 0;
    const badge = $('sidebarPortalCount');
    const qBadge = $('queueCountBadge');
    if (badge) badge.textContent = n;
    if (badge) badge.style.display = n > 0 ? '' : 'none';
    if (qBadge) { qBadge.textContent = n; qBadge.style.display = n > 0 ? '' : 'none'; }
  }).catch(() => {});
}

/* ── Portales list ────────────────────────────────────────────── */
function renderPortals() {
  const list = $('portalsAdminList');
  if (!_portals.length) {
    list.innerHTML = '<div class="loading-state">No hay portales configurados.</div>';
    return;
  }
  list.innerHTML = _portals.map(p => `
    <div class="admin-prop-card portal-card">
      <div class="admin-prop-info">
        <div class="prt-flex-row">
          <span style="width:8px;height:8px;border-radius:50%;background:${p.active ? 'var(--success)' : 'var(--g3)'}"></span>
          <strong class="prt-detail-name">${esc(p.name)}</strong>
          <code class="prt-detail-slug">${esc(p.slug)}</code>
        </div>
      </div>
      <div class="admin-agent-actions prt-actions-gap8">
        <label class="toggle-switch" title="${p.active ? 'Desactivar' : 'Activar'}">
          <input type="checkbox" ${p.active ? 'checked' : ''} onchange="togglePortal(${p.id}, this.checked)"/>
          <span class="toggle-slider"></span>
        </label>
        <button class="btn btn-ghost btn-sm" onclick="editPortal(${p.id})">Editar</button>
        <button class="btn btn-ghost btn-sm" onclick="viewPortalLogs(${p.id})">Logs</button>
        ${p.slug === 'mercadolibre' ? `
          <button class="btn btn-ghost btn-sm" onclick="syncFromML()">↻ ML Import</button>
          <button class="btn btn-ghost btn-sm" onclick="syncBidiML()">⟷ ML Sync</button>
        ` : ''}
        <button class="btn btn-danger btn-sm" onclick="confirmDeletePortal(${p.id})">Eliminar</button>
      </div>
    </div>`).join('');
}

function renderPortalLogs() {
  const list = $('portalLogsList');
  if (!list) return;
  if (!_portalLogs.length) {
    list.innerHTML = '<div class="loading-state">Sin actividad aún.</div>';
    return;
  }
  list.innerHTML = _portalLogs.slice(0, 50).map(l => `
    <div class="admin-message-item prt-msg-item">
      <span class="admin-status-badge ${l.level === 'error' ? 'status-vendida' : l.level === 'info' ? 'status-disponible' : ''} prt-level-badge"
            >${l.level}</span>
       <span class="prt-action-code">${esc(l.action)}</span>
      <span class="prt-log-msg-ellipsis">${esc(l.message)}</span>
      <span class="prt-log-time">${l.created_at ? new Date(l.created_at).toLocaleString() : ''}</span>
    </div>`).join('');
}

/* ── Publications (legacy) ─────────────────────────────────────── */
function loadPublications() {
  $('publicationsList').innerHTML = '<div class="loading-state">Cargando publicaciones...</div>';
  API.getPublications().then(pubs => {
    _publications = pubs.items || pubs;
    renderPublications('');
  }).catch(() => {
    $('publicationsList').innerHTML = '<div class="loading-state">Error al cargar publicaciones.</div>';
  });
}

function renderPublications(filter) {
  const list = $('publicationsList');
  const f = (filter || '').toLowerCase();
  let items = _publications;
  if (f) items = items.filter(p => (p.property_title || p.rental_title || '').toLowerCase().includes(f));
  if (!items.length) {
    list.innerHTML = '<div class="loading-state">Sin publicaciones.</div>';
    return;
  }
  list.innerHTML = items.map(p => {
    const title = esc(p.property_title || p.rental_title || '—');
    const type = p.property_id ? 'Venta' : 'Alquiler';
    const statusCls = p.status === 'published' ? 'status-disponible' : p.status === 'error' ? 'status-vendida' : '';
    const statusLabel = p.status === 'published' ? 'Publicado' : p.status === 'error' ? 'Error' : p.status === 'unpublished' ? 'Despublicado' : 'Pendiente';
    return `<div class="admin-message-item prt-msg-lg">
      <div class="prt-msg-flex">
        <span class="prt-portal-name">${esc(p.portal_name || '?')}</span>
        <span class="admin-status-badge ${statusCls} prt-level-badge" >${statusLabel}</span>
        <span class="prt-prop-title-text">${title}</span>
        <code class="prt-type-code">${type}</code>
        ${p.external_id ? `<span class="prt-ext-id">ID: ${esc(p.external_id)}</span>` : ''}
        ${p.last_error ? `<span class="prt-error-msg" title="${esc(p.last_error)}">${esc(p.last_error)}</span>` : ''}
      </div>
      <span class="prt-log-time">${p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</span>
    </div>`;
  }).join('');
}

/* ── Queue ────────────────────────────────────────────────────── */
let _queueMode = 'pending';

function loadQueue(mode) {
  _queueMode = mode || 'pending';
  document.querySelectorAll('#btnQueuePending, #btnQueueAll').forEach(b => b.classList.remove('btn-primary'));
  const btn = mode === 'all' ? $('btnQueueAll') : $('btnQueuePending');
  if (btn) btn.classList.add('btn-primary');
  $('queueList').innerHTML = '<div class="loading-state">Cargando cola...</div>';
  const params = mode === 'pending' ? { processed: 'false' } : {};
  API.getQueueItems(params).then(items => {
    _queueItems = items.items || items;
    renderQueue();
  }).catch(() => {
    $('queueList').innerHTML = '<div class="loading-state">Error al cargar cola.</div>';
  });
}

function renderQueue() {
  const list = $('queueList');
  if (!_queueItems.length) {
    list.innerHTML = '<div class="loading-state">Sin items en la cola.</div>';
    return;
  }
  list.innerHTML = _queueItems.map(q => {
    const title = [];
    if (q.property_id) title.push('Prop #' + q.property_id);
    if (q.rental_id) title.push('Alq #' + q.rental_id);
    const actionLabel = q.action === 'publish' ? 'Publicar' : q.action === 'update' ? 'Actualizar' : 'Despublicar';
    const portalName = _portals.find(p => p.id === q.portal_id)?.name || '?';
    const hasError = !!q.error;
    return `<div class="admin-message-item prt-msg-lg">
      <div class="prt-msg-flex">
        <span class="prt-queue-portal">${esc(portalName)}</span>
        <span class="prt-queue-action">${actionLabel}</span>
        <span class="prt-queue-title">${title.join(' / ')}</span>
        <span class="admin-status-badge ${q.processed ? (hasError ? 'status-vendida' : 'status-disponible') : ''} prt-level-badge"
              >${q.processed ? (hasError ? 'Error' : 'OK') : 'Pendiente'}</span>
        ${q.error ? `<span class="prt-error-msg" title="${esc(q.error)}">${esc(q.error)}</span>` : ''}
      </div>
      <div class="prt-queue-row">
        <span class="prt-queue-date">${q.created_at ? new Date(q.created_at).toLocaleString() : ''}</span>
        ${q.processed && hasError ? `<button class="btn btn-ghost btn-sm" onclick="retryQueueItem(${q.id})" title="Reintentar">↻ Reintentar</button>` : ''}
        ${!q.processed ? `<button class="btn btn-ghost btn-sm" onclick="cancelQueueItem(${q.id})" title="Cancelar">✕</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function retryQueueItem(id) {
  try {
    await API.retryQueueItem(id);
    toast('Reintentando...', 'info');
    loadQueue(_queueMode);
    loadPortalQueueCount();
  } catch (e) { toast(e.message, 'error'); }
}

async function cancelQueueItem(id) {
  toast('Usá el panel de portales para eliminar el item.', 'warn');
}

function refreshQueue() {
  loadQueue(_queueMode);
  loadPortalQueueCount();
}
window.refreshQueue = refreshQueue;

/* ── Portal CRUD ──────────────────────────────────────────────── */
function openPortalForm(data) {
  $('portalFormTitle').textContent = data ? 'Editar Portal' : 'Nuevo Portal';
  const p = data || {};
  $('portalFormContent').innerHTML = `
    <div class="pf-body">
      <div class="field">
        <label class="field-label">Nombre *</label>
        <input id="pf_name" class="field-input" value="${esc(p.name || '')}" placeholder="ZonaProp"/>
      </div>
      <div class="field">
        <label class="field-label">Slug *</label>
        <input id="pf_slug" class="field-input" value="${esc(p.slug || '')}" placeholder="zonaprop"/>
      </div>
      <div class="field">
        <label class="field-label">Configuración (JSON)</label>
        <textarea id="pf_config" class="field-input prt-config-area" rows="4"
          placeholder='{"api_key": "", "endpoint": "https://..."}'
          >${p.config ? JSON.stringify(p.config, null, 2) : ''}</textarea>
      </div>
      <div class="field prt-config-row">
        <label class="toggle-switch">
          <input type="checkbox" id="pf_active" ${p.active !== false ? 'checked' : ''}/>
          <span class="toggle-slider"></span>
        </label>
        <span class="prt-active-label">Portal activo</span>
      </div>
      ${data && data.slug === 'mercadolibre' ? `
      <div class="prt-sync-info">
        <p class="prt-sync-text">
          Vinculá tu cuenta de MercadoLibre para empezar a publicar:
        </p>
        <button class="btn btn-outline btn-sm" onclick="connectMercadoLibre()" id="mlConnectBtn">
          🔗 Conectar con MercadoLibre
        </button>
        <span id="mlConnectedBadge" class="prt-ml-badge">✓ Conectado</span>
      </div>` : ''}
      <div class="prt-btn-row-mt20">
        <button class="btn btn-primary btn-full" id="savePortalBtn">${data ? 'Guardar cambios' : 'Crear portal'}</button>
        <button class="btn btn-ghost" onclick="closePortalForm()">Cancelar</button>
      </div>
    </div>`;
  $('portalFormModal').classList.remove('hidden');
  $('savePortalBtn').onclick = () => savePortalForm(data?.id);
  if (data && data.slug === 'mercadolibre') {
    const cfg = data.config || {};
    if (cfg.refresh_token || cfg.access_token) {
      const badge = $('mlConnectedBadge');
      const btn = $('mlConnectBtn');
      if (badge) badge.style.display = '';
      if (btn) btn.textContent = '🔄 Reconectar con MercadoLibre';
    }
  }
}

function closePortalForm() { $('portalFormModal').classList.add('hidden'); }

async function savePortalForm(id) {
  const name = $('pf_name').value.trim();
  const slug = $('pf_slug').value.trim().toLowerCase().replace(/\s+/g, '_');
  const active = $('pf_active').checked;
  let config = {};
  try {
    const raw = $('pf_config').value.trim();
    if (raw) config = JSON.parse(raw);
  } catch { toast('La configuración no es un JSON válido.', 'warn'); return; }
  if (!name || !slug) { toast('Nombre y slug son obligatorios.', 'warn'); return; }
  try {
    let saved;
    if (id) {
      saved = await API.updatePortal(id, { name, slug, active, config });
      _portals = _portals.map(p => p.id === id ? saved : p);
    } else {
      saved = await API.createPortal({ name, slug, active, config });
      _portals.push(saved);
    }
    renderPortals();
    closePortalForm();
  } catch (e) { toast(e.message, 'error'); }
}

async function togglePortal(id, active) {
  if (!await confirmModal(`¿${active ? 'Activar' : 'Desactivar'} este portal?`)) return;
  try {
    const updated = await API.updatePortal(id, { active });
    _portals = _portals.map(p => p.id === id ? updated : p);
    renderPortals();
  } catch (e) { toast(e.message, 'error'); }
}

function editPortal(id) { const p = _portals.find(p => p.id === id); if (p) openPortalForm(p); }

async function confirmDeletePortal(id) {
  const p = _portals.find(p => p.id === id);
  if (!confirm(`¿Eliminar el portal "${p?.name}"?\nTambién se eliminarán sus publicaciones y logs.`)) return;
  try {
    await API.deletePortal(id);
    _portals = _portals.filter(p => p.id !== id);
    renderPortals();
  } catch (e) { toast(e.message, 'error'); }
}

/* ── Logs modal ───────────────────────────────────────────────── */
function viewPortalLogs(portalId) {
  const p = _portals.find(p => p.id === portalId);
  const logs = _portalLogs.filter(l => l.portal_id === portalId);
  $('portalLogsModalTitle').textContent = p ? `Logs: ${p.name}` : 'Logs';
  const list = $('portalLogsModalBody');
  if (!logs.length) {
    list.innerHTML = '<div class="loading-state">Sin registros.</div>';
  } else {
    list.innerHTML = logs.map(l => `
      <div class="admin-message-item prt-msg-item">
        <span class="admin-status-badge ${l.level === 'error' ? 'status-vendida' : l.level === 'info' ? 'status-disponible' : ''} prt-level-badge"
              >${l.level}</span>
        <code class="prt-log-action-lg">${esc(l.action)}</code>
        <span class="prt-log-msg">${esc(l.message)}</span>
        <span class="prt-log-time">${l.created_at ? new Date(l.created_at).toLocaleString() : ''}</span>
      </div>`).join('');
  }
  $('portalLogsModal').classList.remove('hidden');
}

function closePortalLogsModal() { $('portalLogsModal').classList.add('hidden'); }

/* ── MercadoLibre OAuth ───────────────────────────────────────── */
async function connectMercadoLibre() {
  const btn = $('mlConnectBtn');
  if (!btn) return;
  btn.disabled = true; btn.textContent = 'Conectando...';
  try {
    const data = await _portalReq('GET', '/api/portals/ml/auth-url');
    if (data.auth_url) {
      const popup = window.open(data.auth_url, 'ml_oauth', 'width=600,height=700,left=200,top=100');
      if (!popup) { toast('Bloqueador de ventanas emergentes. Permití popups para este sitio.', 'warn'); return; }
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          btn.textContent = '🔗 Conectar con MercadoLibre';
          btn.disabled = false;
          toast('Cuenta vinculada correctamente.', 'ok');
        }
      }, 500);
    }
  } catch (e) {
    btn.textContent = '🔗 Conectar con MercadoLibre';
    btn.disabled = false;
    toast(e.message, 'error');
  }
}

/* ── ML Sync ────────────────────────────────────────────────── */
async function syncFromML() { return syncBidiML(); }

function showSyncProgressModal() {
  const existing = $('mlSyncModal');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'mlSyncModal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  el.innerHTML = `
    <div class="prt-sync-dialog">
      <h3 class="prt-sync-title">Sincronizando con MercadoLibre…</h3>
      <p id="mlSyncPhase" class="prt-sync-phase">Iniciando…</p>
      <div class="prt-progress-track">
        <div id="mlSyncBar" class="prt-progress-bar"></div>
      </div>
      <p id="mlSyncCount" class="prt-sync-count">0 / 0</p>
      <div id="mlSyncErrors" class="prt-sync-errors"></div>
      <div class="prt-sync-actions">
        <button class="btn btn-ghost btn-sm" onclick="closeSyncProgressModal()">Cerrar</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

function closeSyncProgressModal() {
  const el = $('mlSyncModal');
  if (el) el.remove();
}

function updateSyncProgress() {
  _portalReq('GET', '/api/portals/ml/sync/progress').then(p => {
    const phase = $('mlSyncPhase');
    const bar = $('mlSyncBar');
    const count = $('mlSyncCount');
    const errDiv = $('mlSyncErrors');
    if (!phase) return;
    phase.textContent = p.phase || 'Sincronizando…';
    const pct = p.total > 0 ? Math.round((p.current / p.total) * 100) : 0;
    if (bar) bar.style.width = pct + '%';
    if (count) count.textContent = `${p.current} / ${p.total}`;
    if (errDiv && p.errors && p.errors.length) errDiv.textContent = p.errors.join('\n');
    if (!p.running) {
      setTimeout(closeSyncProgressModal, 1500);
      loadPortals();
    }
  }).catch(() => {});
  if ($('mlSyncModal')) setTimeout(updateSyncProgress, 800);
}

async function syncBidiML() {
  showSyncProgressModal();
  updateSyncProgress();
  try {
    await _portalReq('POST', '/api/portals/ml/sync');
  } catch (e) {
    const phase = $('mlSyncPhase');
    if (phase) phase.textContent = 'Error: ' + e.message;
  }
}

/* ── Utilities ────────────────────────────────────────────────── */
function formatDateShort(d) {
  if (!d) return '—';
  try { const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00')); return dt.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' }); }
  catch { return d; }
}

function formatDateTime(d) {
  if (!d) return '—';
  try { return new Date(d + 'Z').toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
  catch { return d; }
}

/* ── Exports ──────────────────────────────────────────────────── */
window.loadPortals = loadPortals;
window.loadPortalManagement = loadPortalManagement;
window.loadPublicationsEnhanced = loadPublicationsEnhanced;
window.openPrtPanel = openPrtPanel;
window.closePrtPanel = closePrtPanel;
window.prtAction = prtAction;
window.prtConfirmDelete = prtConfirmDelete;
window.editPortal = editPortal;
window.openPortalForm = openPortalForm;
window.closePortalForm = closePortalForm;
window.confirmDeletePortal = confirmDeletePortal;
window.togglePortal = togglePortal;
window.viewPortalLogs = viewPortalLogs;
window.closePortalLogsModal = closePortalLogsModal;
window.closeSyncProgressModal = closeSyncProgressModal;
window.syncFromML = syncFromML;
window.syncBidiML = syncBidiML;
window.loadQueue = loadQueue;
window.retryQueueItem = retryQueueItem;
window.connectMercadoLibre = connectMercadoLibre;
window.cancelQueueItem = cancelQueueItem;
