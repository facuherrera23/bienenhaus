async function loadTasacionRequests() {
  const list = $('tasacionReqList');
  list.innerHTML = '<div class="loading-state">Cargando solicitudes...</div>';
  try {
    const res = await API.getTasacionRequests();
    const reqs = res.requests || [];
    const stats = await API.getTasacionStats().catch(() => ({}));

    $('sidebarTasacionCount').textContent = (stats.pendientes ?? reqs.filter(r => r.status === 'pendiente').length) || reqs.length;
    $('tasacionReqSubtitle').textContent = `${reqs.length} solicitud${reqs.length !== 1 ? 'es' : ''} · ${stats.pendientes ?? reqs.filter(r => r.status === 'pendiente').length} pendiente${(stats.pendientes ?? 0) !== 1 ? 's' : ''}`;

    if (!reqs.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">No hay solicitudes de tasación todavía.</div>
        </div>`;
      return;
    }

    const bar = `
      <div class="treq-toolbar">
        <label class="acm-chip">
          <input type="checkbox" class="acm-chip-input" id="treqSelectAll">
          <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Seleccionar todo</span></span>
        </label>
        <button class="btn btn-ghost btn-sm treq-btn-sm" onclick="batchTasacionAction('archive')">📦 Archivar seleccionadas</button>
        <button class="btn btn-ghost btn-sm treq-btn-sm" onclick="batchTasacionAction('unarchive')">📂 Desarchivar seleccionadas</button>
        <button class="btn btn-danger btn-sm treq-btn-sm" onclick="batchTasacionAction('delete')">🗑 Eliminar seleccionadas</button>
        <span id="treqSelectedCount" class="treq-selected-count">0 seleccionadas</span>
      </div>`;

    list.innerHTML = bar + reqs.map(r => buildTasacionCard(r)).join('');

    // Select-all toggle
    const selAll = $('treqSelectAll');
    if (selAll) {
      selAll.onclick = () => {
        document.querySelectorAll('.treq-checkbox').forEach(cb => cb.checked = selAll.checked);
        updateTreqCount();
      };
      document.querySelectorAll('.treq-checkbox').forEach(cb => {
        cb.onchange = updateTreqCount;
      });
    }
  } catch (e) {
    list.innerHTML = `<div class="loading-state">Error al cargar solicitudes.</div>`;
  }
}

function _safeMailto(str) {
  if (!str || typeof str !== 'string') return '#';
  const cleaned = str.replace(/["'`<>]/g, '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleaned)) return '#';
  return 'mailto:' + cleaned;
}

function _safeTel(str) {
  if (!str || typeof str !== 'string') return '#';
  const digits = str.replace(/\D/g, '');
  return digits ? 'tel:' + digits : '#';
}

const _PROPERTY_TYPE_LABELS = {
  casa: 'Casa', departamento: 'Departamento', terreno: 'Terreno',
  local: 'Local comercial', oficina: 'Oficina', galpon: 'Galpón',
  campo: 'Campo', otro: 'Otro',
};

const _MOTIVO_LABELS = {
  vender: 'Quiero vender mi propiedad',
  particular: 'Tasación particular',
  judicial: 'Tasación Judicial',
};

function buildTasacionCard(r) {
  const date = r.created_at
    ? window.formatDateTime(r.created_at)
    : '';

  const propLabel = _PROPERTY_TYPE_LABELS[r.property_type] || r.property_type || '—';
  const motivoLabel = _MOTIVO_LABELS[r.motivo] || r.motivo || '';

  const waMsg  = encodeURIComponent(`Hola ${r.name}, te contactamos desde Bienenhaus. Recibimos tu solicitud de tasación para ${propLabel} en ${r.city}.`);
  const waNum  = (r.phone || '').replace(/\D/g, '');
  const waLink = waNum ? `https://wa.me/${waNum}?text=${waMsg}` : '';

  const clientWaLink = r.email
    ? `https://wa.me/${window.WHATSAPP_NUMBER || '5493510000000'}?text=${encodeURIComponent('Hola, envié una solicitud de tasación desde Bienenhaus.')}`
    : '';

  const statusColors = { pendiente: '#e67e22', contactado: '#3498db', completado: '#27ae60', archivado: '#95a5a6' };
  const statusColor = statusColors[r.status] || '#95a5a6';

  const emailStatusIcon = r.email_delivery_status === 'sent'
    ? '<span class="treq-email-sent" title="Email enviado">✓</span>'
    : r.email_delivery_status === 'failed'
    ? '<span class="treq-email-failed" title="Error al enviar email">✗</span>'
    : '<span class="treq-email-pending" title="Pendiente de envío">○</span>';

  return `
    <div class="msg-card" id="treq-${r.id}">
      <div class="msg-header">
        <label class="acm-chip" title="Seleccionar">
          <input type="checkbox" class="acm-chip-input treq-checkbox" value="${r.id}">
          <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text"></span></span>
        </label>
        <div class="msg-header-left">
          <div>
            <div class="msg-name">${esc(r.name) || '—'}</div>
            <div class="msg-date">${date}</div>
          </div>
        </div>
        <div class="msg-header-right">
          <select class="field-input field-input--select field-input--select-sm"
                  onchange="updateTasacionStatus(${r.id}, this.value)">
            <option value="pendiente"  ${r.status === 'pendiente'  ? 'selected' : ''}>Pendiente</option>
            <option value="contactado" ${r.status === 'contactado' ? 'selected' : ''}>Contactado</option>
            <option value="completado" ${r.status === 'completado' ? 'selected' : ''}>Completado</option>
            <option value="archivado"  ${r.status === 'archivado'  ? 'selected' : ''}>Archivado</option>
          </select>
          <span class="status-dot" style="background:${statusColor}" title="${r.status}"></span>
          ${emailStatusIcon}
          <button class="btn btn-danger btn-sm" onclick="deleteTasacionRequest(${r.id})" title="Eliminar">×</button>
        </div>
      </div>

      <div class="msg-contacts">
        <span class="msg-contact-chip msg-contact-chip--motivo">🏷 ${propLabel}</span>
        ${motivoLabel ? `<span class="msg-contact-chip msg-contact-chip--motivo">🎯 ${esc(motivoLabel)}</span>` : ''}
        ${r.city ? `<span class="msg-contact-chip msg-contact-chip--motivo">📍 ${esc(r.city)}</span>` : ''}
        ${r.email ? `<a href="${_safeMailto(r.email)}" class="msg-contact-chip">✉ ${esc(r.email)}</a>` : ''}
        ${r.phone ? `<a href="${_safeTel(r.phone)}" class="msg-contact-chip">📞 ${esc(r.phone)}</a>` : ''}
      </div>

      ${r.address ? `<div class="treq-address">🏠 ${esc(r.address)}</div>` : ''}

      ${r.comments ? `<div class="msg-body">${esc(r.comments)}</div>` : ''}

      <div class="msg-actions">
        ${r.appraisal_id
          ? `<button class="btn btn-outline btn-sm treq-view-appraisal" onclick="openAppraisalFromRequest(${r.appraisal_id})">
              📋 Ver tasación: ${esc(r.appraisal_titulo || '#' + r.appraisal_id)}
            </button>`
          : `<button class="btn btn-primary btn-sm treq-create-appraisal" onclick="createAppraisalFromRequest(${r.id})">
              + Crear tasación
            </button>`}
        ${r.email && _safeMailto(r.email) !== '#'
          ? `<a href="mailto:${esc(r.email)}?subject=Bienenhaus%20-%20Tasaci%C3%B3n%20de%20${encodeURIComponent(propLabel)}&body=Hola ${encodeURIComponent(r.name)},%0A%0ARecibimos tu solicitud de tasación." class="btn btn-outline btn-sm">Responder por email</a>`
          : ''}
        ${waLink
          ? `<a href="${waLink}" target="_blank" class="btn btn-wapp btn-sm">Responder por WhatsApp</a>`
          : ''}
        ${clientWaLink
          ? `<a href="${clientWaLink}" target="_blank" class="btn btn-ghost btn-sm treq-btn-sm" title="Enlace de WhatsApp enviado al cliente">🔗 WhatsApp cliente</a>`
          : ''}
      </div>
    </div>`;
}

function openAppraisalFromRequest(appraisalId) {
  switchTab('appraisals');
  setTimeout(() => openAppraisalDetail(appraisalId), 300);
}

async function createAppraisalFromRequest(requestId) {
  try {
    const res = await _req('POST', `/api/appraisals/from-request/${requestId}`, null);
    const a = res.appraisal;
    if (!a) { toast('Error al crear tasación', 'error'); return; }
    if (res.existing) {
      toast(`Ya existe una tasación desde esta solicitud.`, 'info');
    } else {
      toast('Tasación creada correctamente', 'ok');
    }
    switchTab('appraisals');
    setTimeout(() => openAppraisalDetail(a.id), 300);
  } catch (e) {
    toast(e.message || 'Error al crear tasación', 'error');
  }
}

async function updateTasacionStatus(id, status) {
  if (!await confirmModal(`¿Cambiar estado a "${status}"?`)) return;
  try {
    await API.updateTasacionStatus(id, { status });
    loadTasacionRequests();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteTasacionRequest(id) {
  if (!confirm('¿Eliminar esta solicitud?')) return;
  try {
    await API.deleteTasacionRequest(id);
    const card = $(`treq-${id}`);
    if (card) card.remove();
    loadTasacionRequests();
  } catch (e) { toast(e.message, 'error'); }
}

function updateTreqCount() {
  const checked = document.querySelectorAll('.treq-checkbox:checked').length;
  const el = $('treqSelectedCount');
  if (el) el.textContent = `${checked} seleccionada${checked !== 1 ? 's' : ''}`;
}

async function batchTasacionAction(action) {
  const checked = Array.from(document.querySelectorAll('.treq-checkbox:checked'));
  const ids = checked.map(cb => parseInt(cb.value)).filter(n => !isNaN(n));
  if (!ids.length) { toast('Seleccioná al menos una solicitud.', 'warn'); return; }

  const labels = { delete: 'eliminar', archive: 'archivar', unarchive: 'desarchivar' };
  const label = labels[action] || action;
  if (!await confirmModal(`¿${label} ${ids.length} solicitud${ids.length !== 1 ? 'es' : ''}?`)) return;

  try {
    const data = await _req('POST', '/api/tasacion/batch', { action, ids });
    toast(`${data.affected} solicitud${data.affected !== 1 ? 'es' : ''} ${label}das`, 'ok');
    loadTasacionRequests();
  } catch (e) { toast(e.message, 'error'); }
}

/* ── Exports ──────────────────────────────────────────────────── */
window.loadTasacionRequests = loadTasacionRequests;
window.updateTasacionStatus = updateTasacionStatus;
window.deleteTasacionRequest = deleteTasacionRequest;
window.createAppraisalFromRequest = createAppraisalFromRequest;
window.batchTasacionAction = batchTasacionAction;
