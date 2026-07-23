async function loadBajas() {
  const list = $('bajaReqList');
  list.innerHTML = '<div class="loading-state">Cargando solicitudes...</div>';
  try {
    const data = await API.getBajas({ per_page: 100 });
    const reqs = data.requests || [];
    const stats = await API.getBajaStats().catch(() => ({}));

    $('sidebarBajaCount').textContent = stats.pendientes ?? reqs.filter(r => r.status === 'pendiente').length;
    const sub = $('bajaSubtitle');
    if (sub) {
      const total = stats.total ?? reqs.length;
      const pend = stats.pendientes ?? reqs.filter(r => r.status === 'pendiente').length;
      sub.textContent = `${total} total · ${pend} pendiente${pend !== 1 ? 's' : ''}`;
    }

    renderBajaKpi(stats);
    if (!reqs.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🛡️</div>
          <div class="empty-state-text">No hay solicitudes de baja de datos.</div>
        </div>`;
      return;
    }
    list.innerHTML = reqs.map(r => buildBajaCard(r)).join('');
  } catch (e) {
    list.innerHTML = '<div class="loading-state">Error al cargar solicitudes.</div>';
  }
}

function renderBajaKpi(stats) {
  const bar = $('bajaKpiBar');
  if (!bar) return;
  if (!stats || !stats.total) { bar.innerHTML = ''; return; }
  bar.innerHTML = [
    { label: 'Pendientes', num: stats.pendientes || 0, sub: 'Sin atender' },
    { label: 'En Proceso', num: stats.en_proceso || 0, sub: 'En revisión' },
    { label: 'Completadas', num: stats.completadas || 0, sub: 'Finalizadas' },
    { label: 'Total', num: stats.total || 0, sub: 'Solicitudes' },
  ].map(c => `
    <div class="appr-kpi-card">
      <span class="appr-kpi-label">${c.label}</span>
      <span class="appr-kpi-number">${c.num}</span>
      <span class="appr-kpi-sub">${c.sub}</span>
    </div>
  `).join('');
}

function buildBajaCard(r) {
  const date = r.created_at ? window.formatDateTime(r.created_at) : '';
  const statusColors = { pendiente: '#e67e22', en_proceso: '#3498db', completada: '#27ae60', rechazada: '#e74c3c' };
  const statusColor = statusColors[r.status] || '#95a5a6';
  const motivoLabels = { supresion: 'Supresión', rectificacion: 'Rectificación', oposicion: 'Oposición', limitacion: 'Limitación', portabilidad: 'Portabilidad' };
  const motivoLabel = motivoLabels[r.motivo] || r.motivo || '—';

  return `
    <div class="msg-card" id="baja-${r.id}">
      <div class="msg-header">
        <div class="msg-header-left">
          <div>
            <div class="msg-name">${esc(r.name) || '—'}</div>
            <div class="msg-date">${date}</div>
          </div>
        </div>
        <div class="msg-header-right">
          <select class="field-input field-input--select field-input--select-sm"
                  onchange="updateBajaStatus(${r.id}, this.value)">
            <option value="pendiente"  ${r.status === 'pendiente'  ? 'selected' : ''}>Pendiente</option>
            <option value="en_proceso" ${r.status === 'en_proceso' ? 'selected' : ''}>En proceso</option>
            <option value="completada" ${r.status === 'completada' ? 'selected' : ''}>Completada</option>
            <option value="rechazada" ${r.status === 'rechazada' ? 'selected' : ''}>Rechazada</option>
          </select>
          <span class="status-dot" style="background:${statusColor}" title="${r.status}"></span>
          <button class="btn btn-danger btn-sm" onclick="deleteBajaRequest(${r.id})" title="Eliminar">×</button>
        </div>
      </div>

      <div class="msg-contacts">
        <span class="msg-contact-chip msg-contact-chip--motivo">🎯 ${esc(motivoLabel)}</span>
        ${r.email ? `<a href="mailto:${esc(r.email)}" class="msg-contact-chip">✉ ${esc(r.email)}</a>` : ''}
        ${r.phone ? `<a href="tel:${(r.phone).replace(/\D/g, '')}" class="msg-contact-chip">📞 ${esc(r.phone)}</a>` : ''}
        ${r.read ? '<span class="msg-contact-chip msg-contact-chip--read">✓ Leído</span>' : '<span class="msg-contact-chip msg-contact-chip--unread">○ No leído</span>'}
      </div>

      ${r.message ? `<div class="msg-body">${esc(r.message)}</div>` : ''}

      <div class="msg-actions">
        ${r.email ? `<a href="mailto:${esc(r.email)}?subject=Bienenhaus%20-%20Solicitud%20de%20baja&body=Hola ${encodeURIComponent(r.name)},%0A%0ARecibimos tu solicitud de baja de datos personales." class="btn btn-outline btn-sm">Responder por email</a>` : ''}
        ${r.phone ? `<a href="https://wa.me/${(r.phone).replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + r.name + ', te contactamos desde Bienenhaus por tu solicitud de baja de datos.')}" target="_blank" class="btn btn-wapp btn-sm">Responder por WhatsApp</a>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="updateBajaRead(${r.id})">${r.read ? 'Marcar no leído' : 'Marcar leído'}</button>
      </div>
    </div>`;
}

async function updateBajaStatus(id, status) {
  if (!await confirmModal(`¿Cambiar estado a "${status}"?`)) return;
  try {
    await API.updateBaja(id, { status });
    loadBajas();
  } catch (e) { toast(e.message, 'error'); }
}

async function updateBajaRead(id) {
  try {
    const data = await API.getBajas({ per_page: 1 });
    const req = data.requests?.find(r => r.id === id);
    if (!req) return;
    await API.updateBaja(id, { read: !req.read });
    loadBajas();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteBajaRequest(id) {
  if (!confirm('¿Eliminar esta solicitud de baja?')) return;
  try {
    await API.deleteBaja(id);
    loadBajas();
  } catch (e) { toast(e.message, 'error'); }
}

/* ── Exports ──────────────────────────────────────────────────── */
window.loadBajas = loadBajas;
window.updateBajaStatus = updateBajaStatus;
window.updateBajaRead = updateBajaRead;
window.deleteBajaRequest = deleteBajaRequest;
