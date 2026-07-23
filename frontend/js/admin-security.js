/* ════════════════════════════════════════════════
   BIENENHAUS ADMIN — Security & Audit Module
   8 subtabs reusing Design System exclusively.
   ════════════════════════════════════════════════ */

const SEC_SUBTABS = ['dashboard', 'api-keys', 'webhooks', 'devices', 'events', 'login-attempts', 'system-events', 'audit-logs'];
const SEC_LABELS = ['Dashboard', 'API Keys', 'Webhooks', 'Dispositivos', 'Eventos de seguridad', 'Intentos de login', 'Eventos del sistema', 'Auditoría'];

window.renderSecurity = async function renderSecurity() {
  const wrap = document.getElementById('securityContent');
  if (!wrap) return;
  const tabsEl = document.getElementById('securitySubtabs');
  if (!tabsEl) return;

  let activeSub = sessionStorage.getItem('securitySubTab') || 'dashboard';
  if (!SEC_SUBTABS.includes(activeSub)) activeSub = 'dashboard';

  tabsEl.innerHTML = SEC_SUBTABS.map((s, i) =>
    `<button class="rbac-subtab${s === activeSub ? ' active' : ''}" data-sec-tab="${s}">${SEC_LABELS[i]}</button>`
  ).join('');

  tabsEl.querySelectorAll('[data-sec-tab]').forEach(btn => {
    btn.onclick = () => {
      sessionStorage.setItem('securitySubTab', btn.dataset.secTab);
      renderSecurity();
    };
  });

  wrap.innerHTML = '<div class="loading-state">Cargando...</div>';

  switch (activeSub) {
    case 'dashboard':      await loadSecDashboard(wrap); break;
    case 'api-keys':       await loadSecApiKeys(wrap); break;
    case 'webhooks':       await loadSecWebhooks(wrap); break;
    case 'devices':        await loadSecDevices(wrap); break;
    case 'events':         await loadSecEvents(wrap); break;
    case 'login-attempts': await loadSecLoginAttempts(wrap); break;
    case 'system-events':  await loadSecSystemEvents(wrap); break;
    case 'audit-logs':     await loadSecAuditLogs(wrap); break;
  }
};

/* ── Helpers ───────────────────────────────────── */

function secApi(path, method, body) {
  return window._rawReq('/api/security' + path, method, body);
}

function secFilterRow(content) {
  return `<div class="admin-filter-row">${content}</div>`;
}

function secTable(headers, rows, cls) {
  const h = headers.map(h => `<th>${h}</th>`).join('');
  const r = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<table class="${cls || 'admin-table'}"><thead><tr>${h}</tr></thead><tbody>${r || '<tr><td colspan="99" class="empty-state">Sin datos</td></tr>'}</tbody></table>`;
}

function secSeverityDot(sev) {
  const cls = sev === 'critical' ? 'security-dot--critical' : sev === 'high' ? 'security-dot--high' : sev === 'medium' ? 'security-dot--medium' : 'security-dot--low';
  return `<span class="security-dot ${cls}" title="${sev}"></span>`;
}

/* ── 1. Dashboard ───────────────────────────────── */

async function loadSecDashboard(wrap) {
  const res = await secApi('/dashboard');
  if (!res.ok) { wrap.innerHTML = `<div class="error-state">${res.error || 'Error'}</div>`; return; }
  const d = res.data;

  const kpis = [
    { label: 'API Keys activas', value: d.active_keys, icon: '🔑' },
    { label: 'Webhooks activos', value: d.active_webhooks, icon: '🔗' },
    { label: 'Eventos hoy', value: d.events_today, icon: '⚠️' },
    { label: 'No resueltos', value: d.unresolved_events, icon: '🚨' },
    { label: 'Eventos sistema', value: d.system_events_today, icon: '⚙️' },
    { label: 'Dispositivos', value: d.total_devices, icon: '💻' },
  ];

  wrap.innerHTML = `
    <div class="cal-kpi-bar">
      ${kpis.map(k => `<div class="cal-kpi-item"><span class="cal-kpi-label">${k.icon} ${k.label}</span><span class="cal-kpi-value">${k.value}</span></div>`).join('')}
    </div>
    <div class="sec-grid-2">
      <div class="admin-card"><div class="admin-card-header">Eventos de seguridad recientes</div><div class="admin-card-body" id="secRecentEvents"></div></div>
      <div class="admin-card"><div class="admin-card-header">Eventos del sistema recientes</div><div class="admin-card-body" id="secRecentSystem"></div></div>
    </div>`;

  const evWrap = document.getElementById('secRecentEvents');
  const sysWrap = document.getElementById('secRecentSystem');

  if (d.recent_events && d.recent_events.length) {
    evWrap.innerHTML = d.recent_events.map(e =>
      `<div class="security-audit-row">
        ${secSeverityDot(e.severity)}
        <div class="sec-event-content">
          <div class="sec-event-title">${esc(e.title)}</div>
          <div class="sec-event-meta">${e.username} · ${e.created_at}</div>
        </div>
        ${!e.resolved ? '<span class="badge badge-warning">Pendiente</span>' : '<span class="badge badge-success">Resuelto</span>'}
      </div>`
    ).join('');
  } else {
    evWrap.innerHTML = '<div class="empty-state">Sin eventos recientes</div>';
  }

  if (d.recent_system_events && d.recent_system_events.length) {
    sysWrap.innerHTML = d.recent_system_events.map(e =>
      `<div class="security-audit-row">
        ${secSeverityDot(e.severity)}
        <div class="sec-event-content">
          <div class="sec-event-title">${esc(e.title)}</div>
          <div class="sec-event-meta">${e.source || ''} · ${e.created_at}</div>
        </div>
        ${!e.resolved ? '<span class="badge badge-warning">Pendiente</span>' : '<span class="badge badge-success">Resuelto</span>'}
      </div>`
    ).join('');
  } else {
    sysWrap.innerHTML = '<div class="empty-state">Sin eventos recientes</div>';
  }
}

/* ── 2. API Keys ────────────────────────────────── */

async function loadSecApiKeys(wrap) {
  const res = await secApi('/api-keys');
  if (!res.ok) { wrap.innerHTML = `<div class="error-state">${res.error || 'Error'}</div>`; return; }

  const keys = res.data || [];
  wrap.innerHTML = `
    <div class="admin-filter-row">
      <button class="btn btn-primary btn-sm" onclick="secShowApiKeyForm()">+ Nueva API Key</button>
    </div>
    ${secTable(
      ['Nombre', 'Prefijo', 'Creado por', 'Scopes', 'Expira', 'Estado', 'Último uso', 'Acciones'],
      keys.map(k => [
        esc(k.name),
        `<code class="security-key-value">${esc(k.key_prefix)}...</code>`,
        esc(k.username || '-'),
        (k.scopes || []).slice(0, 2).join(', ') + ((k.scopes || []).length > 2 ? '...' : '') || '<span class="text-muted">sin scopes</span>',
        k.expires_at || '<span class="text-muted">Nunca</span>',
        k.active
          ? '<span class="badge badge-success">Activa</span>'
          : '<span class="badge badge-muted">Inactiva</span>',
        k.last_used || '<span class="text-muted">Nunca</span>',
        `<button class="btn btn-ghost btn-xs" onclick="secDeleteApiKey(${k.id})">Eliminar</button>
         <button class="btn btn-ghost btn-xs" onclick="secToggleApiKey(${k.id}, ${!k.active})">${k.active ? 'Desactivar' : 'Activar'}</button>`
      ]),
      'admin-table'
    )}`;
}

window.secShowApiKeyForm = async function secShowApiKeyForm() {
  const usersRes = await secApi('/users');
  const users = usersRes.ok ? (usersRes.data || []) : [];
  const opts = users.map(u => `<option value="${u.id}">${esc(u.display_name || u.username)}</option>`).join('');

  const html = `
    <div class="modal-form-content">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input class="field-input" id="secAkName" placeholder="Ej: Producción API" />
      </div>
      <div class="form-group">
        <label class="form-label">Usuario</label>
        <select class="field-input field-input--select" id="secAkUser">${opts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Scopes (separados por coma)</label>
        <input class="field-input" id="secAkScopes" placeholder="read, write, admin" />
      </div>
      <div class="form-group">
        <label class="form-label">Expira en (días, opcional)</label>
        <input class="field-input" id="secAkExpires" type="number" min="1" placeholder="90" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="secCreateApiKey()">Crear</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      </div>
    </div>`;

  showModal('Nueva API Key', html);
};

window.secCreateApiKey = async function secCreateApiKey() {
  const name = document.getElementById('secAkName')?.value?.trim();
  if (!name) { toast('Nombre requerido', 'error'); return; }
  const userEl = document.getElementById('secAkUser');
  const scopesEl = document.getElementById('secAkScopes');
  const expiresEl = document.getElementById('secAkExpires');
  const body = {
    name,
    user_id: userEl ? parseInt(userEl.value) : undefined,
    scopes: scopesEl?.value ? scopesEl.value.split(',').map(s => s.trim()).filter(Boolean) : [],
    expires_in_days: expiresEl?.value ? parseInt(expiresEl.value) : undefined,
  };
  const res = await secApi('/api-keys', 'POST', body);
  if (res.ok) {
    const key = res.data;
    closeModal();
    toast('API Key creada. Copiala ahora — no se mostrará de nuevo.', 'success', 8000);
    setTimeout(() => {
      showModal('API Key creada', `<div class="modal-form-content">
        <p class="sec-modal-text">Guardá esta clave en un lugar seguro. No podrá ser recuperada luego.</p>
        <div class="form-group">
          <label class="form-label">Clave</label>
          <div class="security-key-value">${esc(key.raw_key || '')}</div>
        </div>
        <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal(); renderSecurity();">Listo</button></div>
      </div>`);
    }, 300);
  } else {
    toast(res.error || 'Error al crear', 'error');
  }
};

window.secDeleteApiKey = async function secDeleteApiKey(id) {
  if (!await confirmModal('¿Eliminar esta API Key? Esta acción no se puede deshacer.')) return;
  const res = await secApi('/api-keys/' + id, 'DELETE');
  if (res.ok) { toast('API Key eliminada', 'success'); renderSecurity(); }
  else { toast(res.error || 'Error', 'error'); }
};

window.secToggleApiKey = async function secToggleApiKey(id, active) {
  const res = await secApi('/api-keys/' + id, 'PUT', { active });
  if (res.ok) { toast(active ? 'API Key activada' : 'API Key desactivada', 'success'); renderSecurity(); }
  else { toast(res.error || 'Error', 'error'); }
};

/* ── 3. Webhooks ────────────────────────────────── */

async function loadSecWebhooks(wrap) {
  const res = await secApi('/webhooks');
  if (!res.ok) { wrap.innerHTML = `<div class="error-state">${res.error || 'Error'}</div>`; return; }

  const whs = res.data || [];
  wrap.innerHTML = `
    <div class="admin-filter-row">
      <button class="btn btn-primary btn-sm" onclick="secShowWebhookForm()">+ Nuevo Webhook</button>
    </div>
    ${secTable(
      ['Nombre', 'URL', 'Eventos', 'Estado', 'Última llamada', 'Fallos', 'Acciones'],
      whs.map(w => [
        esc(w.name),
        `<code class="sec-cell-url">${esc(w.url)}</code>`,
        (w.events || []).join(', ') || '<span class="text-muted">todos</span>',
        `<span class="badge ${w.active ? 'badge-success' : 'badge-muted'}">${w.active ? 'Activo' : 'Inactivo'}</span>`,
        w.last_called_at || '<span class="text-muted">Nunca</span>',
        w.failure_count || 0,
        `<button class="btn btn-ghost btn-xs" onclick="secTestWebhook(${w.id})">Test</button>
         <button class="btn btn-ghost btn-xs" onclick="secEditWebhook(${w.id})">Editar</button>
         <button class="btn btn-ghost btn-xs" onclick="secDeleteWebhook(${w.id})">Eliminar</button>`
      ]),
      'admin-table'
    )}`;
}

window.secShowWebhookForm = function secShowWebhookForm(data) {
  const d = data || {};
  const html = `
    <div class="modal-form-content">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input class="field-input" id="secWhName" value="${esc(d.name || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">URL *</label>
        <input class="field-input" id="secWhUrl" value="${esc(d.url || '')}" placeholder="https://ejemplo.com/webhook" />
      </div>
      <div class="form-group">
        <label class="form-label">Eventos (separados por coma, vacío = todos)</label>
        <input class="field-input" id="secWhEvents" value="${esc((d.events || []).join(', '))}" placeholder="property.created, property.updated" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="secCreateWebhook(${d.id || ''})">${d.id ? 'Guardar' : 'Crear'}</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      </div>
    </div>`;
  showModal(d.id ? 'Editar Webhook' : 'Nuevo Webhook', html);
};

window.secCreateWebhook = async function secCreateWebhook(id) {
  const name = document.getElementById('secWhName')?.value?.trim();
  const url = document.getElementById('secWhUrl')?.value?.trim();
  if (!name || !url) { toast('Nombre y URL requeridos', 'error'); return; }
  const eventsStr = document.getElementById('secWhEvents')?.value || '';
  const events = eventsStr ? eventsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  const body = { name, url, events };
  const res = id
    ? await secApi('/webhooks/' + id, 'PUT', body)
    : await secApi('/webhooks', 'POST', body);
  if (res.ok) { closeModal(); toast(id ? 'Webhook actualizado' : 'Webhook creado', 'success'); renderSecurity(); }
  else { toast(res.error || 'Error', 'error'); }
};

window.secEditWebhook = async function secEditWebhook(id) {
  const res = await secApi('/webhooks');
  if (!res.ok) return;
  const wh = (res.data || []).find(w => w.id === id);
  if (wh) secShowWebhookForm(wh);
};

window.secDeleteWebhook = async function secDeleteWebhook(id) {
  if (!await confirmModal('¿Eliminar este webhook?')) return;
  const res = await secApi('/webhooks/' + id, 'DELETE');
  if (res.ok) { toast('Webhook eliminado', 'success'); renderSecurity(); }
  else { toast(res.error || 'Error', 'error'); }
};

window.secTestWebhook = async function secTestWebhook(id) {
  const res = await secApi('/webhooks/' + id + '/test', 'POST');
  if (res.ok) {
    toast('Webhook probado. Estado: ' + (res.data?.last_status || 'ok'), res.data?.last_status === 'ok' ? 'success' : 'warn');
    renderSecurity();
  } else {
    toast(res.error || 'Error', 'error');
  }
};

/* ── 4. Devices ─────────────────────────────────── */

async function loadSecDevices(wrap) {
  const res = await secApi('/devices');
  if (!res.ok) { wrap.innerHTML = `<div class="error-state">${res.error || 'Error'}</div>`; return; }

  const devices = res.data || [];
  wrap.innerHTML = secTable(
    ['', 'Nombre', 'Usuario', 'Tipo', 'OS / Browser', 'IP', 'Confianza', 'Visto', 'Acciones'],
    devices.map(d => [
      `<div class="security-device-icon">${d.device_type === 'mobile' ? '📱' : d.device_type === 'tablet' ? '📟' : '💻'}</div>`,
      esc(d.name || '-'),
      esc(d.username || ''),
      esc(d.device_type || '-'),
      `${esc(d.os || '')} / ${esc(d.browser || '')}`,
      `<code class="sec-cell-ip">${esc(d.ip || '-')}</code>`,
      d.trusted
        ? '<span class="badge badge-success">Confiable</span>'
        : '<span class="badge badge-warning">No confiable</span>',
      d.last_seen || '<span class="text-muted">Nunca</span>',
      `<button class="btn btn-ghost btn-xs" onclick="secToggleDevice(${d.id}, ${!d.trusted})">${d.trusted ? 'No confiar' : 'Confiar'}</button>
       <button class="btn btn-ghost btn-xs" onclick="secDeleteDevice(${d.id})">Eliminar</button>`
    ]),
    'admin-table'
  );
}

window.secToggleDevice = async function secToggleDevice(id, trusted) {
  const res = await secApi('/devices/' + id, 'PUT', { trusted });
  if (res.ok) { toast(trusted ? 'Dispositivo marcado como confiable' : 'Confianza removida', 'success'); renderSecurity(); }
  else { toast(res.error || 'Error', 'error'); }
};

window.secDeleteDevice = async function secDeleteDevice(id) {
  if (!await confirmModal('¿Eliminar este dispositivo?')) return;
  const res = await secApi('/devices/' + id, 'DELETE');
  if (res.ok) { toast('Dispositivo eliminado', 'success'); renderSecurity(); }
  else { toast(res.error || 'Error', 'error'); }
};

/* ── 5. Security Events ─────────────────────────── */

async function loadSecEvents(wrap) {
  const res = await secApi('/events?per_page=50');
  if (!res.ok) { wrap.innerHTML = `<div class="error-state">${res.error || 'Error'}</div>`; return; }

  const events = res.data?.items || [];
  wrap.innerHTML = secTable(
    ['', 'Tipo', 'Título', 'Usuario', 'IP', 'Estado', 'Creado', 'Acciones'],
    events.map(e => [
      secSeverityDot(e.severity),
      `<span class="badge badge-info">${esc(e.event_type)}</span>`,
      esc(e.title),
      esc(e.username || 'Sistema'),
      `<code class="sec-cell-ip">${esc(e.ip || '-')}</code>`,
      e.resolved
        ? '<span class="badge badge-success">Resuelto</span>'
        : '<span class="badge badge-warning">Pendiente</span>',
      e.created_at || '',
      !e.resolved
        ? `<button class="btn btn-ghost btn-xs" onclick="secResolveEvent(${e.id})">Resolver</button>`
        : '<span class="text-muted">—</span>'
    ]),
    'admin-table'
  );
}

window.secResolveEvent = async function secResolveEvent(id) {
  const res = await secApi('/events/' + id + '/resolve', 'POST');
  if (res.ok) { toast('Evento resuelto', 'success'); renderSecurity(); }
  else { toast(res.error || 'Error', 'error'); }
};

/* ── 6. Login Attempts ──────────────────────────── */

async function loadSecLoginAttempts(wrap) {
  const res = await secApi('/login-attempts?per_page=50');
  if (!res.ok) { wrap.innerHTML = `<div class="error-state">${res.error || 'Error'}</div>`; return; }

  const attempts = res.data?.items || [];
  wrap.innerHTML = secTable(
    ['Usuario', 'Intentos fallidos', 'Bloqueado hasta', 'Último login', 'Última IP', 'Activo', 'Acciones'],
    attempts.map(a => [
      `${esc(a.display_name)}<br><span class="sec-user-meta">@${esc(a.username)}</span>`,
      a.login_attempts > 0
        ? `<span class="badge ${a.login_attempts >= 5 ? 'badge-danger' : 'badge-warning'}">${a.login_attempts}</span>`
        : '<span class="text-muted">0</span>',
      a.locked_until
        ? `<span class="badge badge-danger">${a.locked_until}</span>`
        : '<span class="text-muted">—</span>',
      a.last_login || '<span class="text-muted">Nunca</span>',
      `<code class="sec-cell-ip">${esc(a.last_ip || '-')}</code>`,
      a.is_active
        ? '<span class="badge badge-success">Activo</span>'
        : '<span class="badge badge-muted">Inactivo</span>',
      a.locked_until
        ? `<button class="btn btn-ghost btn-xs" onclick="secUnlockUser(${a.user_id})">Desbloquear</button>`
        : '<span class="text-muted">—</span>'
    ]),
    'admin-table'
  );
}

window.secUnlockUser = async function secUnlockUser(uid) {
  const res = await secApi('/login-attempts/' + uid + '/unlock', 'POST');
  if (res.ok) { toast('Usuario desbloqueado', 'success'); renderSecurity(); }
  else { toast(res.error || 'Error', 'error'); }
};

/* ── 7. System Events ───────────────────────────── */

async function loadSecSystemEvents(wrap) {
  const res = await secApi('/system-events?per_page=50');
  if (!res.ok) { wrap.innerHTML = `<div class="error-state">${res.error || 'Error'}</div>`; return; }

  const events = res.data?.items || [];
  wrap.innerHTML = secTable(
    ['', 'Tipo', 'Título', 'Fuente', 'Estado', 'Creado', 'Acciones'],
    events.map(e => [
      secSeverityDot(e.severity),
      `<span class="badge badge-info">${esc(e.event_type)}</span>`,
      esc(e.title),
      esc(e.source || '-'),
      e.resolved
        ? '<span class="badge badge-success">Resuelto</span>'
        : '<span class="badge badge-warning">Pendiente</span>',
      e.created_at || '',
      !e.resolved
        ? `<button class="btn btn-ghost btn-xs" onclick="secResolveSystemEvent(${e.id})">Resolver</button>`
        : '<span class="text-muted">—</span>'
    ]),
    'admin-table'
  );
}

window.secResolveSystemEvent = async function secResolveSystemEvent(id) {
  const res = await secApi('/system-events/' + id + '/resolve', 'POST');
  if (res.ok) { toast('Evento resuelto', 'success'); renderSecurity(); }
  else { toast(res.error || 'Error', 'error'); }
};

/* ── 8. Audit Logs ──────────────────────────────── */

async function loadSecAuditLogs(wrap) {
  const res = await secApi('/audit-logs?per_page=50');
  if (!res.ok) { wrap.innerHTML = `<div class="error-state">${res.error || 'Error'}</div>`; return; }

  const logs = res.data?.items || [];
  wrap.innerHTML = secTable(
    ['Acción', 'Usuario', 'Detalles', 'IP', 'Fecha'],
    logs.map(l => [
      `<span class="badge badge-info">${esc(l.action)}</span>`,
      esc(l.username || 'Sistema'),
      esc(l.details || ''),
      `<code class="sec-cell-ip">${esc(l.ip || '-')}</code>`,
      l.created_at || ''
    ]),
    'admin-table'
  );
}

/* ── Exports ────────────────────────────────────── */

window.secApi          = secApi;
