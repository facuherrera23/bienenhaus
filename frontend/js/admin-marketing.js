/**
 * admin-marketing.js — Módulo 13: Centro de Marketing
 * Management layer sobre la infraestructura social existente.
 * Dependencias: API (api.js), toast, confirmModal (admin.html)
 */

let _mkPosts = [];
let _mkCampaigns = [];
let _mkCurrentCampaign = null;
let _mkCurrentPost = null;

const MKT_POST_STATUS = { draft: 'Borrador', scheduled: 'Programado', publishing: 'Publicando', published: 'Publicado', failed: 'Fallido' };
const MKT_CAMP_STATUS = { draft: 'Borrador', active: 'Activa', paused: 'Pausada', completed: 'Completada' };
const MKT_STATUS_CLS = { draft: 'status-oculta', scheduled: 'status-disponible', publishing: 'admin-prop-featured', published: 'status-disponible', failed: 'status-vendida' };

function esc(v) { return String(v ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ── LOAD MARKETING (called from switchTab) ─────────────────────

async function loadMarketing() {
  try {
    const dash = await API.getMarketingDashboard();
    renderMktKpiBar(dash, $('mktKpiBar'));
    renderMktPlatforms($('mktPlatformsGrid'));
  } catch { /* silent */ }
  loadMarketingPosts();
  loadMarketingCampaigns();
  loadMarketingStats();
}

// ── KPI BAR ────────────────────────────────────────────────────

function renderMktKpiBar(stats, container) {
  if (!container) return;
  const cards = [
    { label: 'Publicaciones', num: stats.total_posts, sub: `${stats.published} publicadas` },
    { label: 'Programadas', num: stats.scheduled, sub: `${stats.drafts} borradores` },
    { label: 'Alcance', num: stats.reach ?? 0, sub: 'total' },
    { label: 'Leads', num: stats.leads ?? 0, sub: `${stats.leads_30d} en 30d` },
  ];
  container.innerHTML = cards.map(c => `
    <div class="req-kpi-card">
      <span class="req-kpi-label">${c.label}</span>
      <span class="req-kpi-number">${c.num}</span>
      <span class="req-kpi-sub">${c.sub}</span>
    </div>
  `).join('');
}

// ── PLATFORMS ──────────────────────────────────────────────────

async function renderMktPlatforms(container) {
  if (!container) return;
  try {
    const platforms = await API.getMarketingPlatforms();
    container.innerHTML = platforms.map(p => `
      <div class="mkt-platform-card">
        <div class="mkt-platform-icon">${_platformIcon(p.id)}</div>
        <div class="mkt-platform-info">
          <div class="mkt-platform-name">${esc(p.name)}</div>
          <div class="mkt-platform-status">${p.connected ? 'Conectada' : 'Sin conectar'}</div>
        </div>
        ${p.connected ? '<span class="admin-status-badge status-disponible mkt-badge-tiny">✓</span>' : '<span class="admin-status-badge status-oculta mkt-badge-tiny">—</span>'}
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<div class="loading-state">Error al cargar</div>';
  }
}

function _platformIcon(id) {
  const icons = {
    facebook: '📘', instagram: '📸', linkedin: '💼', google_business: '📍', whatsapp: '💬', email: '📧',
  };
  return icons[id] || '🔌';
}

// ── POSTS (enhanced) ───────────────────────────────────────────

async function loadMarketingPosts() {
  try {
    const posts = await API.getMarketingPosts();
    _mkPosts = posts || [];
    renderMktPosts($('mktPostsList'));
  } catch {
    const el = $('mktPostsList');
    if (el) el.innerHTML = '<div class="loading-state">Error al cargar</div>';
  }
}

function renderMktPosts(container) {
  if (!container) return;
  if (!_mkPosts.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Sin publicaciones</div></div>';
    return;
  }
  container.innerHTML = _mkPosts.map(p => {
    const statusCls = MKT_STATUS_CLS[p.status] || 'status-oculta';
    const hasMedia = p.media_urls && p.media_urls.length;
    const eng = p.engagement || {};
    return `
      <button type="button" class="mkt-post-item" data-mkt-post="${p.id}" onclick="openMktPostPanel(${p.id})">
        <div class="mkt-post-thumb${hasMedia ? '' : '--empty'}">
          ${hasMedia ? `<img src="${esc(p.media_urls[0])}" alt="" onerror="this.style.display='none';this.parentElement.classList.add('mkt-post-thumb--empty');this.parentElement.textContent='📷'">` : '📷'}
        </div>
        <div class="mkt-post-body">
          <div class="mkt-post-body-top">
            <span class="admin-status-badge ${statusCls} mkt-badge-tiny">${MKT_POST_STATUS[p.status] || p.status}</span>
            <span class="mkt-meta">${esc(p.account_platform || '')} · ${esc(p.account_label || '')}</span>
            ${p.property_title ? `<span class="mkt-prop-title">${esc(p.property_title)}</span>` : ''}
          </div>
          <div class="mkt-post-text">${esc(p.content || '')}</div>
        </div>
        <div class="mkt-post-stats">
          <div class="mkt-post-stat">
            <span class="mkt-post-stat-num">${eng.likes ?? 0}</span>
            likes
          </div>
          <div class="mkt-post-stat">
            <span class="mkt-post-stat-num">${eng.comments ?? 0}</span>
            comments
          </div>
          <div class="mkt-post-stat">
            <span class="mkt-post-stat-num">${eng.shares ?? 0}</span>
            shares
          </div>
        </div>
      </button>
    `;
  }).join('');
}

// ── POST SIDE PANEL ────────────────────────────────────────────

async function openMktPostPanel(id) {
  try {
    const posts = await API.getMarketingPosts();
    const p = posts.find(x => x.id === id);
    if (!p) { toast('Publicación no encontrada', 'error'); return; }
    _mkCurrentPost = p;
    $('mktPanelTitle').textContent = 'Publicación #' + p.id;
    const body = $('mktPanelBody');
    const eng = p.engagement || {};
    const hasMedia = p.media_urls && p.media_urls.length;
    const statusCls = MKT_STATUS_CLS[p.status] || 'status-oculta';
    body.innerHTML = `
      <div class="req-panel-section">
        <div class="req-panel-section-title">Vista Previa</div>
        ${hasMedia ? `<div class="mkt-media-grid">${p.media_urls.map(u => `<img src="${esc(u)}" class="mkt-media-img" onerror="this.style.display='none'">`).join('')}</div>` : ''}
        <div class="mkt-content-box">${esc(p.content || '')}</div>
      </div>
      <div class="req-panel-section">
        <div class="req-panel-section-title">Detalles</div>
        <div class="req-panel-row"><span class="req-panel-label">Estado</span><span class="admin-status-badge ${statusCls}">${MKT_POST_STATUS[p.status] || p.status}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Plataforma</span><span class="req-panel-value">${esc(p.account_platform || '—')}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Cuenta</span><span class="req-panel-value">${esc(p.account_label || '—')}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Propiedad</span><span class="req-panel-value">${esc(p.property_title || '—')}</span></div>
        ${p.scheduled_at ? `<div class="req-panel-row"><span class="req-panel-label">Programado</span><span class="req-panel-value">${formatDateShort(p.scheduled_at)}</span></div>` : ''}
        ${p.published_at ? `<div class="req-panel-row"><span class="req-panel-label">Publicado</span><span class="req-panel-value">${formatDateShort(p.published_at)}</span></div>` : ''}
      </div>
      <div class="req-panel-section">
        <div class="req-panel-section-title">Estadísticas</div>
        <div class="req-panel-row"><span class="req-panel-label">Likes</span><span class="req-panel-value mkt-num">${eng.likes ?? 0}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Comentarios</span><span class="req-panel-value mkt-num">${eng.comments ?? 0}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Compartidos</span><span class="req-panel-value mkt-num">${eng.shares ?? 0}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Guardados</span><span class="req-panel-value mkt-num">${eng.saved ?? 0}</span></div>
      </div>
      ${p.error ? `<div class="req-panel-section"><div class="req-panel-section-title">Error</div><div class="mkt-error-text">${esc(p.error)}</div></div>` : ''}
    `;
    $('mktOverlay').classList.add('show');
    $('mktPanel').classList.add('open');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

function closeMktPanel() {
  $('mktOverlay').classList.remove('show');
  $('mktPanel').classList.remove('open');
  if ($('mktCampPanel')) $('mktCampPanel').classList.remove('open');
  _mkCurrentPost = null;
  _mkCurrentCampaign = null;
}

// ── CAMPAIGNS ──────────────────────────────────────────────────

async function loadMarketingCampaigns() {
  try {
    const campaigns = await API.getMarketingCampaigns();
    _mkCampaigns = campaigns || [];
    renderMktCampaigns($('mktCampaignList'));
    renderMktCampaignStats($('mktCampStats'));
  } catch {
    const el = $('mktCampaignList');
    if (el) el.innerHTML = '<div class="loading-state">Error al cargar</div>';
  }
}

function renderMktCampaigns(container) {
  if (!container) return;
  if (!_mkCampaigns.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Sin campañas</div></div>';
    return;
  }
  const statusClsMap = { draft: 'status-oculta', active: 'status-disponible', paused: 'admin-prop-featured', completed: 'status-vendida' };
  container.innerHTML = _mkCampaigns.map(c => `
    <button type="button" class="mkt-campaign-item" onclick="openMktCampaignPanel(${c.id})">
      <div>
        <div class="mkt-campaign-name">${esc(c.name)}</div>
        <div class="mkt-campaign-desc">${esc(c.description || '')}</div>
        <div class="mkt-camp-status-wrap"><span class="admin-status-badge ${statusClsMap[c.status] || 'status-oculta'} mkt-badge-tiny">${MKT_CAMP_STATUS[c.status] || c.status}</span></div>
      </div>
      <div class="mkt-campaign-meta mkt-meta-col">
        <span class="mkt-meta">${c.platform || '—'}</span>
      </div>
      <div class="mkt-campaign-budget">$${(c.budget || 0).toLocaleString('es-AR')}</div>
      <div class="mkt-campaign-roi">${c.roi ? c.roi + 'x' : '—'}</div>
    </button>
  `).join('');
}

function renderMktCampaignStats(container) {
  if (!container) return;
  const active = _mkCampaigns.filter(c => c.status === 'active').length;
  const totalBudget = _mkCampaigns.reduce((s, c) => s + (c.budget || 0), 0);
  const totalLeads = _mkCampaigns.reduce((s, c) => s + (c.leads_generated || 0), 0);
  container.innerHTML = `
    <div class="mkt-stats-grid">
      <div class="req-kpi-card"><span class="req-kpi-label">Activas</span><span class="req-kpi-number">${active}</span><span class="req-kpi-sub">de ${_mkCampaigns.length}</span></div>
      <div class="req-kpi-card"><span class="req-kpi-label">Presupuesto</span><span class="req-kpi-number">$${totalBudget.toLocaleString('es-AR')}</span><span class="req-kpi-sub">total</span></div>
      <div class="req-kpi-card"><span class="req-kpi-label">Leads</span><span class="req-kpi-number">${totalLeads}</span><span class="req-kpi-sub">generados</span></div>
    </div>
  `;
}

// ── CAMPAIGN SIDE PANEL ────────────────────────────────────────

async function openMktCampaignPanel(id) {
  try {
    const c = _mkCampaigns.find(x => x.id === id);
    if (!c) { toast('Campaña no encontrada', 'error'); return; }
    _mkCurrentCampaign = c;
    $('mktCampPanelTitle').textContent = esc(c.name);
    const body = $('mktCampPanelBody');
    const statusClsMap = { draft: 'status-oculta', active: 'status-disponible', paused: 'admin-prop-featured', completed: 'status-vendida' };
    body.innerHTML = `
      <div class="req-panel-section">
        <div class="req-panel-section-title">Información</div>
        <div class="req-panel-row"><span class="req-panel-label">Estado</span><span class="admin-status-badge ${statusClsMap[c.status] || 'status-oculta'}">${MKT_CAMP_STATUS[c.status] || c.status}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Plataforma</span><span class="req-panel-value">${esc(c.platform || '—')}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Presupuesto</span><span class="req-panel-value mkt-budget-value">$${(c.budget || 0).toLocaleString('es-AR')}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">ROI</span><span class="req-panel-value mkt-roi-value">${c.roi ? c.roi + 'x' : '—'}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Leads</span><span class="req-panel-value mkt-num">${c.leads_generated || 0}</span></div>
        ${c.start_date ? `<div class="req-panel-row"><span class="req-panel-label">Inicio</span><span class="req-panel-value">${formatDateShort(c.start_date)}</span></div>` : ''}
        ${c.end_date ? `<div class="req-panel-row"><span class="req-panel-label">Fin</span><span class="req-panel-value">${formatDateShort(c.end_date)}</span></div>` : ''}
      </div>
      ${c.description ? `<div class="req-panel-section"><div class="req-panel-section-title">Descripción</div><div class="req-panel-desc">${esc(c.description)}</div></div>` : ''}
      ${c.results ? `<div class="req-panel-section"><div class="req-panel-section-title">Resultados</div><div class="req-panel-desc">${esc(c.results)}</div></div>` : ''}
      <div class="req-panel-section">
        <div class="req-panel-section-title">Acciones</div>
        <div class="req-actions">
          <button class="req-action-btn" onclick="editMktCampaign(${c.id})">✏️ Editar campaña</button>
          <button class="req-action-btn" onclick="deleteMktCampaign(${c.id})">🗑️ Eliminar campaña</button>
        </div>
      </div>
    `;
    $('mktOverlay').classList.add('show');
    $('mktCampPanel').classList.add('open');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

// ── CAMPAIGN CRUD ──────────────────────────────────────────────

function showNewCampaignForm() {
  _mkCurrentCampaign = null;
  const platforms = [
    ['', 'Seleccionar...'], ['facebook', 'Facebook'], ['instagram', 'Instagram'],
    ['linkedin', 'LinkedIn'], ['google_business', 'Google Business'],
    ['whatsapp', 'WhatsApp'], ['email', 'Email'],
  ];
  const STATUSES = [
    ['draft', 'Borrador'], ['active', 'Activa'], ['paused', 'Pausada'], ['completed', 'Completada'],
  ];
  showModal('Nueva Campaña', `
<div class="crm-form mkt-form-sm">
          <div class="crm-form-row"><label>Nombre *</label><input id="mktCampName" class="field-input" value="${esc(c.name || '')}"/>
          </div>
          <div class="crm-form-row"><label>Descripción</label><textarea id="mktCampDesc" class="field-input mkt-textarea-sm"></textarea></div>
      <div class="crm-form-inline">
        <div><label>Plataforma</label><select id="mktCampPlatform" class="field-input field-input--select">${platforms.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
        <div><label>Estado</label><select id="mktCampStatus" class="field-input field-input--select">${STATUSES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
      </div>
      <div class="crm-form-inline">
        <div><label>Presupuesto ($)</label><input type="number" id="mktCampBudget" class="field-input" min="0" step="100"></div>
        <div><label>ROI (x)</label><input type="number" id="mktCampRoi" class="field-input" min="0" step="0.1"></div>
      </div>
      <div class="crm-form-inline">
        <div><label>Inicio</label><input type="date" id="mktCampStart" class="field-input"></div>
        <div><label>Fin</label><input type="date" id="mktCampEnd" class="field-input"></div>
      </div>
      <div class="crm-form-row"><label>Leads generados</label><input type="number" id="mktCampLeads" class="field-input" min="0"></div>
      <div class="crm-form-row"><label>Resultados</label><textarea id="mktCampResults" class="field-input mkt-textarea-sm"></textarea></div>
    </div>
  `, `
    <button class="btn btn-primary" id="saveMktCampBtn">Crear campaña</button>
  `, null);
  $('saveMktCampBtn').onclick = saveMktCampaign;
}

async function saveMktCampaign() {
  const data = {
    name: $('mktCampName')?.value?.trim(),
    description: $('mktCampDesc')?.value?.trim(),
    platform: $('mktCampPlatform')?.value || '',
    status: $('mktCampStatus')?.value || 'draft',
    budget: parseFloat($('mktCampBudget')?.value) || 0,
    roi: parseFloat($('mktCampRoi')?.value) || 0,
    leads_generated: parseInt($('mktCampLeads')?.value) || 0,
    start_date: $('mktCampStart')?.value || null,
    end_date: $('mktCampEnd')?.value || null,
    results: $('mktCampResults')?.value?.trim() || '',
  };
  if (!data.name) { toast('El nombre es obligatorio', 'warn'); return; }
  try {
    await API.createMarketingCampaign(data);
    toast('Campaña creada', 'success');
    closeModal();
    loadMarketingCampaigns();
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

async function editMktCampaign(id) {
  const c = _mkCampaigns.find(x => x.id === id);
  if (!c) return;
  const platforms = [
    ['', 'Seleccionar...'], ['facebook', 'Facebook'], ['instagram', 'Instagram'],
    ['linkedin', 'LinkedIn'], ['google_business', 'Google Business'],
    ['whatsapp', 'WhatsApp'], ['email', 'Email'],
  ];
  const STATUSES = [
    ['draft', 'Borrador'], ['active', 'Activa'], ['paused', 'Pausada'], ['completed', 'Completada'],
  ];
  showModal('Editar Campaña', `
<div class="crm-form mkt-form-sm">
          <div class="crm-form-row"><label>Nombre</label><input id="mktCampName" class="field-input" value="${esc(c.name || '')}"/>
          </div>
          <div class="crm-form-row"><label>Descripción</label><textarea id="mktCampDesc" class="field-input mkt-textarea-sm">${esc(c.description || '')}</textarea></div>
      <div class="crm-form-inline">
        <div><label>Plataforma</label><select id="mktCampPlatform" class="field-input field-input--select">${platforms.map(([v, l]) => `<option value="${v}"${c.platform === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><label>Estado</label><select id="mktCampStatus" class="field-input field-input--select">${STATUSES.map(([v, l]) => `<option value="${v}"${c.status === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>
      <div class="crm-form-inline">
        <div><label>Presupuesto ($)</label><input type="number" id="mktCampBudget" class="field-input" value="${c.budget || 0}" min="0" step="100"></div>
        <div><label>ROI (x)</label><input type="number" id="mktCampRoi" class="field-input" value="${c.roi || 0}" min="0" step="0.1"></div>
      </div>
      <div class="crm-form-inline">
        <div><label>Inicio</label><input type="date" id="mktCampStart" class="field-input" value="${c.start_date || ''}"></div>
        <div><label>Fin</label><input type="date" id="mktCampEnd" class="field-input" value="${c.end_date || ''}"></div>
      </div>
      <div class="crm-form-row"><label>Leads generados</label><input type="number" id="mktCampLeads" class="field-input" value="${c.leads_generated || 0}" min="0"></div>
      <div class="crm-form-row"><label>Resultados</label><textarea id="mktCampResults" class="field-input mkt-textarea-sm">${esc(c.results || '')}</textarea></div>
    </div>
  `, `
    <button class="btn btn-primary" id="saveMktCampBtn">Guardar cambios</button>
  `, null);
  $('saveMktCampBtn').onclick = async () => {
    const data = {
      name: $('mktCampName')?.value?.trim(),
      description: $('mktCampDesc')?.value?.trim(),
      platform: $('mktCampPlatform')?.value || '',
      status: $('mktCampStatus')?.value || 'draft',
      budget: parseFloat($('mktCampBudget')?.value) || 0,
      roi: parseFloat($('mktCampRoi')?.value) || 0,
      leads_generated: parseInt($('mktCampLeads')?.value) || 0,
      start_date: $('mktCampStart')?.value || null,
      end_date: $('mktCampEnd')?.value || null,
      results: $('mktCampResults')?.value?.trim() || '',
    };
    if (!data.name) { toast('El nombre es obligatorio', 'warn'); return; }
    try {
      await API.updateMarketingCampaign(id, data);
      toast('Campaña actualizada', 'success');
      closeModal();
      closeMktPanel();
      loadMarketingCampaigns();
    } catch (e) {
      toast('Error: ' + e.message, 'error');
    }
  };
}

async function deleteMktCampaign(id) {
  if (!await confirmModal('¿Eliminar esta campaña definitivamente?')) return;
  try {
    await API.deleteMarketingCampaign(id);
    toast('Campaña eliminada', 'success');
    closeMktPanel();
    loadMarketingCampaigns();
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

// ── STATS ──────────────────────────────────────────────────────

async function loadMarketingStats() {
  const container = $('mktStatsCharts');
  if (!container) return;
  try {
    const data = await API.getMarketingMetrics('30');
    renderMktStats(container, data);
  } catch {
    container.innerHTML = '<div class="loading-state">Error al cargar estadísticas</div>';
  }
}

function renderMktStats(container, data) {
  if (!container) return;
  const dates = data.dates || [];
  const postsByDate = data.posts_by_date || {};
  const leadsByDate = data.leads_by_date || {};
  const metrics = data.metrics || [];

  const metricsByType = {};
  metrics.forEach(m => {
    if (!metricsByType[m.metric]) metricsByType[m.metric] = {};
    metricsByType[m.metric][m.date] = (metricsByType[m.metric][m.date] || 0) + m.value;
  });

  const reachData = metricsByType['reach'] || {};
  const clicksData = metricsByType['clicks'] || {};
  const leadsMetricData = metricsByType['leads'] || {};

  container.innerHTML = `
    <div class="mkt-dash-card mkt-dash-card-full">
      <div class="mkt-dash-card-header">
        <span>Publicaciones por día (últimos 30 días)</span>
      </div>
      <div class="mkt-chart-bar-container mkt-chart-bar-container--80">
        ${dates.map(d => {
          const val = postsByDate[d] || 0;
          const max = Math.max(...Object.values(postsByDate), 1);
          const pct = Math.max((val / max) * 100, 1);
          return `<div class="mkt-chart-bar-wrap">
            <span class="mkt-chart-bar-label">${val}</span>
            <div class="mkt-chart-bar mkt-chart-bar--posts" style="height:${pct}%"></div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="mkt-dash-card">
      <div class="mkt-dash-card-header">
        <span>Alcance</span>
        <span class="mkt-num">${Object.values(reachData).reduce((a, b) => a + b, 0).toLocaleString('es-AR')}</span>
      </div>
      <div class="mkt-chart-bar-container mkt-chart-bar-container--60">
        ${dates.map(d => {
          const val = reachData[d] || 0;
          const max = Math.max(...Object.values(reachData), 1);
          const pct = Math.max((val / max) * 100, 1);
          return `<div class="mkt-chart-bar-single mkt-chart-bar--reach" style="height:${pct}%"></div>`;
        }).join('')}
      </div>
    </div>
    <div class="mkt-dash-card">
      <div class="mkt-dash-card-header">
        <span>Leads por día</span>
        <span class="mkt-num">${Object.values(leadsByDate).reduce((a, b) => a + b, 0)}</span>
      </div>
      <div class="mkt-chart-bar-container mkt-chart-bar-container--60">
        ${dates.map(d => {
          const val = leadsByDate[d] || 0;
          const max = Math.max(...Object.values(leadsByDate), 1);
          const pct = Math.max((val / max) * 100, 1);
          return `<div class="mkt-chart-bar-single mkt-chart-bar--leads" style="height:${pct}%"></div>`;
        }).join('')}
      </div>
    </div>
  `;
}

// ── UTILITIES ──────────────────────────────────────────────────

function formatDateShort(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00'));
    return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d; }
}

// ── EXPOSE ─────────────────────────────────────────────────────

window.loadMarketing = loadMarketing;
window.loadMarketingPosts = loadMarketingPosts;
window.loadMarketingCampaigns = loadMarketingCampaigns;
window.loadMarketingStats = loadMarketingStats;
window.openMktPostPanel = openMktPostPanel;
window.openMktCampaignPanel = openMktCampaignPanel;
window.closeMktPanel = closeMktPanel;
window.showNewCampaignForm = showNewCampaignForm;
window.editMktCampaign = editMktCampaign;
window.deleteMktCampaign = deleteMktCampaign;
