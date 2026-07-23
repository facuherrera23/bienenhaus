/**
 * admin-requests.js — Gestión de Solicitudes Inmobiliarias
 * KPIs, lista enriquecida, panel lateral, timeline, comentarios
 */

let _requests = [];
let _activeReqId = null;
let _reqOpen = false;

const REQ_TYPE_ICONS = { consulta: '📋', tasacion: '💰', visita: '🔑', informacion: 'ℹ️', propuesta: '📄', reclamo: '⚠️', otro: '📌' };
const REQ_TYPE_LABELS = { consulta: 'Consulta', tasacion: 'Tasación', visita: 'Visita', informacion: 'Información', propuesta: 'Propuesta', reclamo: 'Reclamo', otro: 'Otro' };

// ── LOAD ─────────────────────────────────────────────────────────────
async function loadRequests() {
  const list = $('reqList');
  if (!list) return;
  list.innerHTML = '<div class="loading-state">Cargando solicitudes...</div>';
  try {
    const [data, stats] = await Promise.all([
      API.getRequests(),
      API.getRequestStats(),
    ]);
    _requests = data.requests || [];
    _renderStats(stats);
    _renderList();
    if (_requests.length && !_activeReqId) {
      _activeReqId = _requests[0].id;
      _openRequest(_activeReqId);
    }
    $('reqSubtitle').textContent = `${_requests.length} solicitud${_requests.length !== 1 ? 'es' : ''}`;
  } catch (e) {
    list.innerHTML = '<div class="error-state">Error al cargar solicitudes.</div>';
  }
}

function _renderStats(stats) {
  const bar = $('reqKpiBar');
  if (!bar) return;
  if (!stats) { bar.innerHTML = ''; return; }
  const avg = stats.avg_response_hours != null ? `${stats.avg_response_hours}h` : '—';
  bar.innerHTML = `
    <div class="req-kpi-card">
      <span class="req-kpi-label">Nuevas</span>
      <span class="req-kpi-number">${stats.nuevas || 0}</span>
    </div>
    <div class="req-kpi-card">
      <span class="req-kpi-label">En revisión</span>
      <span class="req-kpi-number">${stats.en_revision || 0}</span>
    </div>
    <div class="req-kpi-card">
      <span class="req-kpi-label">Respondidas</span>
      <span class="req-kpi-number">${stats.respondidas || 0}</span>
    </div>
    <div class="req-kpi-card">
      <span class="req-kpi-label">Cerradas</span>
      <span class="req-kpi-number">${stats.cerradas || 0}</span>
    </div>
    <div class="req-kpi-card">
      <span class="req-kpi-label">Tiempo promedio</span>
      <span class="req-kpi-number">${avg}</span>
      <div class="req-kpi-sub">respuesta</div>
    </div>`;
}

function _renderList() {
  const list = $('reqList');
  if (!list) return;
  if (!_requests.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No hay solicitudes todavía.</div></div>';
    return;
  }
  list.innerHTML = _requests.map(r => `
    <div class="req-item${r.id === _activeReqId ? ' active' : ''}" data-req-id="${r.id}" onclick="selectRequest(${r.id})">
      <div class="req-item-type">${REQ_TYPE_ICONS[r.request_type] || '📋'}</div>
      <div class="req-item-info">
        <div class="req-item-client">${esc(r.client_name)}</div>
        <div class="req-item-subject">${esc(r.subject || REQ_TYPE_LABELS[r.request_type] || r.request_type)}</div>
      </div>
      <div class="req-item-meta">
        <span class="req-item-priority priority-${r.priority || 'media'}">${r.priority || 'media'}</span>
        <span class="req-item-status status-${r.status}">${_statusLabel(r.status)}</span>
        <span class="req-item-time">${_fmtDate(r.updated_at)}</span>
        ${r.assigned_agent_name ? `<span class="req-item-agent">${esc(r.assigned_agent_name.split(' ')[0])}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function _statusLabel(s) {
  const map = { nueva: 'Nueva', en_revision: 'Revisión', respondida: 'Respondida', cerrada: 'Cerrada' };
  return map[s] || s;
}

function _fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

// ── SELECT REQUEST ───────────────────────────────────────────────────
window.selectRequest = async function selectRequest(id) {
  _activeReqId = id;
  document.querySelectorAll('.req-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.req-item[data-req-id="${id}"]`)?.classList.add('active');
  await _openRequest(id);
  _showPanel();
};

async function _openRequest(id) {
  try {
    const data = await API.getRequest(id);
    _renderSidePanel(data);
    _reqOpen = true;
  } catch (e) {
    toast('Error al cargar detalle', 'error');
  }
}

function _showPanel() {
  const panel = $('reqPanel');
  const overlay = $('reqOverlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('show');
}

window.closeRequestPanel = function closeRequestPanel() {
  _reqOpen = false;
  const panel = $('reqPanel');
  const overlay = $('reqOverlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
};

// ── SIDE PANEL ──────────────────────────────────────────────────────
function _renderSidePanel(data) {
  const body = $('reqPanelBody');
  if (!body) return;
  const r = data;
  const comments = data.comments || [];
  const files = data.files || [];
  const statusOpts = ['nueva', 'en_revision', 'respondida', 'cerrada'].map(s =>
    `<option value="${s}"${s === r.status ? ' selected' : ''}>${_statusLabel(s)}</option>`
  ).join('');
  const priorityOpts = ['baja', 'media', 'alta', 'urgente'].map(p =>
    `<option value="${p}"${p === r.priority ? ' selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`
  ).join('');

  $('reqPanelTitle').textContent = `#${r.id} · ${esc(r.client_name)}`;

  body.innerHTML = `
    <div class="req-panel-section">
      <div class="req-panel-section-title">Estado y prioridad</div>
      <div class="req-panel-row">
        <span class="req-panel-label">Estado</span>
        <select class="field-input field-input--select req-select-sm" onchange="updateRequestField(${r.id}, 'status', this.value)">${statusOpts}</select>
      </div>
      <div class="req-panel-row">
        <span class="req-panel-label">Prioridad</span>
        <select class="field-input field-input--select req-select-sm" onchange="updateRequestField(${r.id}, 'priority', this.value)">${priorityOpts}</select>
      </div>
    </div>

    <div class="req-panel-section">
      <div class="req-panel-section-title">Cliente</div>
      <div class="req-panel-row"><span class="req-panel-label">Nombre</span><span class="req-panel-value">${esc(r.client_name)}</span></div>
      ${r.client_email ? `<div class="req-panel-row"><span class="req-panel-label">Email</span><span class="req-panel-value"><a href="mailto:${esc(r.client_email)}" class="req-link">${esc(r.client_email)}</a></span></div>` : ''}
      ${r.client_phone ? `<div class="req-panel-row"><span class="req-panel-label">Teléfono</span><span class="req-panel-value"><a href="tel:${esc(r.client_phone)}" class="req-link">${esc(r.client_phone)}</a></span></div>` : ''}
    </div>

    <div class="req-panel-section">
      <div class="req-panel-section-title">Detalle</div>
      <div class="req-panel-row"><span class="req-panel-label">Tipo</span><span class="req-panel-value">${REQ_TYPE_LABELS[r.request_type] || r.request_type}</span></div>
      ${r.property_title ? `<div class="req-panel-row"><span class="req-panel-label">Propiedad</span><span class="req-panel-value">${esc(r.property_title)}</span></div>` : ''}
      ${r.assigned_agent_name ? `<div class="req-panel-row"><span class="req-panel-label">Responsable</span><span class="req-panel-value">${esc(r.assigned_agent_name)}</span></div>` : ''}
      <div class="req-panel-row"><span class="req-panel-label">Origen</span><span class="req-panel-value">${r.source || 'web'}</span></div>
      <div class="req-panel-row"><span class="req-panel-label">Creado</span><span class="req-panel-value">${_fmtDateFull(r.created_at)}</span></div>
      ${r.response_time_hours != null ? `<div class="req-panel-row"><span class="req-panel-label">Tiempo respuesta</span><span class="req-panel-value">${r.response_time_hours}h</span></div>` : ''}
      ${r.description ? `<div class="req-panel-desc">${esc(r.description)}</div>` : ''}
    </div>

    <div class="req-panel-section">
      <div class="req-panel-section-title">Comentarios (${comments.length})</div>
      <div class="req-comments" id="reqComments">
        ${comments.length ? comments.map(c => `
          <div class="req-comment">
            <div class="req-comment-header">
              <span class="req-comment-author">${esc(c.author_name || c.author)}</span>
              <span class="req-comment-time">${_fmtDateTime(c.created_at)}</span>
            </div>
            <div class="req-comment-content">${esc(c.content)}</div>
          </div>
        `).join('') : '<div class="req-empty-text">Sin comentarios</div>'}
      </div>
      <div class="req-comment-input">
        <textarea id="reqCommentInput" rows="2" placeholder="Agregar comentario..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();addRequestComment(${r.id})}"></textarea>
        <button class="btn btn-primary btn-sm req-send-btn" onclick="addRequestComment(${r.id})">Enviar</button>
      </div>
    </div>

    <div class="req-panel-section">
      <div class="req-panel-section-title">Archivos (${files.length})</div>
      ${files.length ? `<div class="req-files">${files.map(f => `<a href="${esc(f.url)}" target="_blank" class="req-file-chip">📎 ${esc(f.filename)}</a>`).join('')}</div>` : '<div class="req-empty-text">Sin archivos</div>'}
    </div>

    <div class="req-panel-section">
      <div class="req-panel-section-title">Acciones rápidas</div>
      <div class="req-actions">
        <button class="req-action-btn" onclick="assignAgent(${r.id})">👤 Asignar agente</button>
        ${!r.lead_id ? `<button class="req-action-btn" onclick="convertToLead(${r.id})">🔄 Convertir en lead</button>` : '<button class="req-action-btn" disabled>✅ Ya convertido a lead</button>'}
        <button class="req-action-btn" onclick="closeRequestPanel()">✕ Cerrar panel</button>
      </div>
    </div>`;
}

function _fmtDateFull(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function _fmtDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── ACTIONS ──────────────────────────────────────────────────────────
window.updateRequestField = async function updateRequestField(id, field, value) {
  try {
    const updated = await API.updateRequest(id, { [field]: value });
    const idx = _requests.findIndex(r => r.id === id);
    if (idx !== -1) _requests[idx] = updated;
    _renderList();
    if (_activeReqId === id && _reqOpen) _openRequest(id);
    toast('Actualizado', 'success');
  } catch (e) {
    toast('Error al actualizar', 'error');
  }
};

window.addRequestComment = async function addRequestComment(id) {
  const input = $('reqCommentInput');
  const content = (input?.value || '').trim();
  if (!content) return;
  try {
    await API.addRequestComment(id, content);
    input.value = '';
    if (_activeReqId === id) _openRequest(id);
  } catch (e) {
    toast('Error al agregar comentario', 'error');
  }
};

window.convertToLead = async function convertToLead(id) {
  if (!await confirmModal('¿Convertir esta solicitud en un lead de CRM?')) return;
  try {
    const result = await API.convertRequestToLead(id);
    const idx = _requests.findIndex(r => r.id === id);
    if (idx !== -1) _requests[idx] = result.request;
    _renderList();
    if (_activeReqId === id && _reqOpen) _openRequest(id);
    toast('Convertido a lead correctamente', 'success');
  } catch (e) {
    toast('Error al convertir: ' + e.message, 'error');
  }
};

window.assignAgent = async function assignAgent(id) {
  try {
    const data = await API.getRequestAgents();
    const agents = data.agents || [];
    const current = _requests.find(r => r.id === id)?.assigned_agent_id;
    const names = {};
    agents.forEach(a => { names[a.id] = a.name; });

    const opts = agents.map(a =>
      `<option value="${a.id}"${a.id === current ? ' selected' : ''}>${esc(a.name)}</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:2000;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = `
      <div class="req-assign-modal">
        <h3 class="req-assign-title">Asignar agente</h3>
        <select id="assignAgentSelect" class="field-input field-input--select req-assign-select">${opts}</select>
        <div class="req-assign-actions">
          <button class="btn btn-primary req-assign-btn" onclick="assignAgentConfirm(${id})">Asignar</button>
          <button class="btn btn-ghost req-assign-btn" onclick="this.closest('.admin-modal-overlay').remove()">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  } catch (e) {
    toast('Error al cargar agentes', 'error');
  }
};

window.assignAgentConfirm = async function assignAgentConfirm(id) {
  const sel = $('assignAgentSelect');
  if (!sel) return;
  const agentId = parseInt(sel.value);
  const overlay = sel.closest('.admin-modal-overlay');
  if (overlay) overlay.remove();
  await updateRequestField(id, 'assigned_agent_id', agentId);
};

// ── FILTERS ─────────────────────────────────────────────────────────
window.filterRequests = function filterRequests() {
  const status = $('reqFilterStatus')?.value || '';
  const type = $('reqFilterType')?.value || '';
  const priority = $('reqFilterPriority')?.value || '';

  document.querySelectorAll('.req-item').forEach(el => {
    const id = parseInt(el.dataset.reqId);
    const r = _requests.find(x => x.id === id);
    if (!r) { el.style.display = 'none'; return; }
    const matchStatus = !status || r.status === status;
    const matchType = !type || r.request_type === type;
    const matchPriority = !priority || r.priority === priority;
    el.style.display = (matchStatus && matchType && matchPriority) ? '' : 'none';
  });
};

// ── EXPORTS ─────────────────────────────────────────────────────────
window.loadRequests = loadRequests;
window.closeRequestPanel = closeRequestPanel;
window.filterRequests = filterRequests;
window.addRequestComment = addRequestComment;
