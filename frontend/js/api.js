/**
 * api.js — Cliente HTTP para la API Flask de Bienenhaus
 */
const API_BASE = window.__API_BASE__ || '';

let _csrfToken = null;

function setCsrfToken(token) { _csrfToken = token; }
function getCsrfToken() { return _csrfToken; }

function showError(el, msg) {
  const container = typeof el === 'string' ? document.getElementById(el) : el;
  if (!container) return;
  container.innerHTML = '<div class="loading-state"></div>';
  container.firstChild.textContent = msg || 'Error al cargar datos.';
}
window.showError = showError;

async function _req(method, path, body = null, _retried = false) {
  if (method !== 'GET') {
    await _ensureCsrfToken();
  }

  const headers = { 'Content-Type': 'application/json' };
  if (_csrfToken && method !== 'GET') {
    headers['X-CSRF-Token'] = _csrfToken;
  }

  const opts = {
    method,
    headers,
    credentials: 'include',
  };
  if (body !== null) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Error del servidor (${res.status}). ¿Está corriendo Flask?`);
  }

  const json = await res.json();

  if (!json.ok && !_retried && json.error && json.error.includes('CSRF')) {
    _csrfToken = null;
    await _ensureCsrfToken();
    if (_csrfToken) {
      return _req(method, path, body, true);
    }
  }

  if (!json.ok) throw new Error(json.error || 'Error desconocido');

  if (json.data && json.data.csrf_token) {
    _csrfToken = json.data.csrf_token;
  }

  return json.data;
}

async function _ensureCsrfToken() {
  try {
    const r = await fetch(`${API_BASE}/api/auth/csrf-token`, { credentials: 'include' });
    const j = await r.json();
    if (j.ok && j.data?.csrf_token) _csrfToken = j.data.csrf_token;
  } catch { console.warn('getCsrfToken falló'); }
}

async function _reqUpload(method, path, formData) {
  if (method !== 'GET') {
    await _ensureCsrfToken();
  }
  const headers = {};
  if (_csrfToken && method !== 'GET') {
    headers['X-CSRF-Token'] = _csrfToken;
  }
  const opts = {
    method,
    headers,
    credentials: 'include',
    body: formData,
  };
  const res = await fetch(`${API_BASE}${path}`, opts);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Error de servidor');
  return json.data;
}

// ── Properties ─────────────────────────────────────────────────────
const API = {
  getProperties : async (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    ).toString();
    const data = await _req('GET', `/api/properties${qs ? '?' + qs : ''}`);
    // Paginado: devuelve {properties, page, total, ...}
    // No paginado: devuelve array directamente
    if (Array.isArray(data)) {
      return { properties: data, total: data.length, page: 1, pages: 1, has_prev: false, has_next: false };
    }
    return data;
  },
  getProperty    : (id) => _req('GET', `/api/properties/${id}`),
  createProperty : (data) => _req('POST',   '/api/properties',        data),
  updateProperty : (id, data) => _req('PUT', `/api/properties/${id}`,  data),
  setStatus      : (id, status) => _req('PATCH', `/api/properties/${id}/status`, { status }),
  deleteProperty : (id) => _req('DELETE', `/api/properties/${id}`),
  getSimilares   : (id, limit) => _req('GET', `/api/properties/${id}/similares${limit ? '?limit='+limit : ''}`),

  // Rentals similares
  getRentalSimilares: (id, limit) => _req('GET', `/api/rentals/${id}/similares${limit ? '?limit='+limit : ''}`),

  // Agentes
  getAgents  : ()         => _req('GET',    '/api/agents'),
  createAgent: (data)     => _req('POST',   '/api/agents',      data),
  updateAgent: (id, data) => _req('PUT',    `/api/agents/${id}`, data),
  deleteAgent: (id)       => _req('DELETE', `/api/agents/${id}`),

  // Contacto
  sendContact: (data) => _req('POST', '/api/contact', data),

  // Tasación pública
  sendTasacion: (data) => _req('POST', '/api/tasacion', data),
  getTasacionRequests: (params) => _req('GET', '/api/tasacion' + (params ? '?' + new URLSearchParams(params) : '')),
  getTasacionStats: () => _req('GET', '/api/tasacion/stats'),
  updateTasacionStatus: (id, data) => _req('PATCH', `/api/tasacion/${id}`, data),
  deleteTasacionRequest: (id) => _req('DELETE', `/api/tasacion/${id}`),

  // Auth
  login  : (username, password) => _req('POST', '/api/auth/login',  { username, password }),
  logout : ()         => _req('POST', '/api/auth/logout'),
  checkAuth: ()       => _req('GET',  '/api/auth/check'),

  // Usuarios
  getUsers:    ()     => _req('GET', '/api/admin/users'),
  createUser:  (data) => _req('POST', '/api/admin/users', data),
  updateUser:  (id, data) => _req('PUT', `/api/admin/users/${id}`, data),
  deleteUser:  (id)   => _req('DELETE', `/api/admin/users/${id}`),

  // Portales
  getPortals:    ()     => _req('GET', '/api/portals'),
  createPortal:  (data) => _req('POST', '/api/portals', data),
  updatePortal:  (id, data) => _req('PUT', `/api/portals/${id}`, data),
  deletePortal:  (id)   => _req('DELETE', `/api/portals/${id}`),
  getPortalLogs: (params) => _req('GET', '/api/portals/logs' + (params ? '?' + new URLSearchParams(params) : '')),
  getPublications: (params) => _req('GET', '/api/portals/publications' + (params ? '?' + new URLSearchParams(params) : '')),
  getQueueItems: (params) => _req('GET', '/api/portals/queue' + (params ? '?' + new URLSearchParams(params) : '')),
  getQueueCount: () => _req('GET', '/api/portals/queue/count'),
  enqueuePortal: (data) => _req('POST', '/api/portals/queue', data),
  retryQueueItem: (id) => _req('POST', `/api/portals/queue/${id}/retry`),

  // Ajustes del sitio
  getSettings:    ()     => _req('GET', '/api/settings'),
  getPublicSettings: ()  => _req('GET', '/api/settings?public=true'),
  updateSettings: (data) => _req('PUT', '/api/settings', data),

  // Rentals
  getRentals : async (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    ).toString();
    const data = await _req('GET', `/api/rentals${qs ? '?' + qs : ''}`);
    if (Array.isArray(data)) {
      return { rentals: data, total: data.length, page: 1, pages: 1, has_prev: false, has_next: false };
    }
    return data;
  },
  getRental    : (id)       => _req('GET',   `/api/rentals/${id}`),
  createRental : (data)     => _req('POST',   '/api/rentals',        data),
  updateRental : (id, data) => _req('PUT',    `/api/rentals/${id}`,  data),
  setRentalStatus : (id, s) => _req('PATCH',  `/api/rentals/${id}/status`, { status: s }),
  deleteRental : (id)       => _req('DELETE', `/api/rentals/${id}`),

  // Upload de imágenes
  uploadImages: async (files, type = '') => {
    const form = new FormData();
    for (const file of files) form.append('images', file);

    await _ensureCsrfToken();
    const headers = {};
    if (_csrfToken) headers['X-CSRF-Token'] = _csrfToken;

    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    const res  = await fetch(`/api/upload${qs}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: form,
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Error al subir imágenes');

    if (json.data && json.data.csrf_token) {
      _csrfToken = json.data.csrf_token;
    }

    return json.data;
  },

  deleteImage: (filename) => _req('DELETE', '/api/upload', { filename }),
  listImages : ()         => _req('GET', '/api/upload/list'),

  // Raw request (for internal use by modules)
  _rawReq: (method, path, body) => _req(method, path, body),

  // CSRF
  refreshCsrfToken: async () => {
    try {
      const d = await _req('GET', '/api/auth/csrf-token');
      if (d.csrf_token) _csrfToken = d.csrf_token;
    } catch { /* si no hay sesión, ignorar */ }
  },

  // Appraisals (tasaciones / ACM)
  getAppraisals:    (params) => _req('GET', '/api/appraisals' + (params ? '?' + new URLSearchParams(params) : '')),

  // Tasaciones (módulo clonado de ACM Tool)
  getTasaciones:       (params) => _req('GET', '/api/tasaciones' + (params ? '?' + new URLSearchParams(params) : '')),
  getTasacion:         (id) => _req('GET', `/api/tasaciones/${id}`),
  createTasacion:      (data) => _req('POST', '/api/tasaciones', data),
  updateTasacion:      (id, data) => _req('PUT', `/api/tasaciones/${id}`, data),
  deleteTasacion:      (id) => _req('DELETE', `/api/tasaciones/${id}`),
  archiveTasacion:     (id) => _req('POST', `/api/tasaciones/${id}/archive`),
  restoreTasacion:     (id) => _req('POST', `/api/tasaciones/${id}/restore`),
  getTasacionesStats:  () => _req('GET', '/api/tasaciones/stats'),
  calculateTasacion:   (id) => _req('GET', `/api/tasaciones/${id}/calculate`),
  getTasacionLogs:     (id) => _req('GET', `/api/tasaciones/${id}/logs`),
  getTasacionAgents:   () => _req('GET', '/api/tasaciones/agents'),
  getTasacionTimeline: (id) => _req('GET', `/api/tasaciones/${id}/timeline`),
  addTasacionTimeline: (id, data) => _req('POST', `/api/tasaciones/${id}/timeline`, data),
  getTasacionComments: (id) => _req('GET', `/api/tasaciones/${id}/comments`),
  addTasacionComment:  (id, data) => _req('POST', `/api/tasaciones/${id}/comments`, data),
  getTasacionFiles:    (id) => _req('GET', `/api/tasaciones/${id}/files`),
  uploadTasacionFile:  (id, formData) => _reqUpload('POST', `/api/tasaciones/${id}/files`, formData),
  deleteTasacionFile:  (id, fid) => _req('DELETE', `/api/tasaciones/${id}/files/${fid}`),
  assignTasacionAgent: (id, data) => _req('POST', `/api/tasaciones/${id}/assign`, data),
  changeTasacionStatus:(id, data) => _req('POST', `/api/tasaciones/${id}/status`, data),
  convertTasacionToProperty: (id, data) => _req('POST', `/api/tasaciones/${id}/convert-property`, data),

  // Tasacion Comparables
  getTasacionComparables:   (aid) => _req('GET', `/api/tasaciones/${aid}/comparables`),
  createTasacionComparable: (aid, data) => _req('POST', `/api/tasaciones/${aid}/comparables`, data),
  updateTasacionComparable: (aid, cid, data) => _req('PUT', `/api/tasaciones/${aid}/comparables/${cid}`, data),
  deleteTasacionComparable: (aid, cid) => _req('DELETE', `/api/tasaciones/${aid}/comparables/${cid}`),
  previewTasacionComparable: (aid, data) => _req('POST', `/api/tasaciones/${aid}/comparables/preview`, data),

  // Completar valuación
  completarTasacion: (id) => _req('POST', `/api/tasaciones/${id}/completar`),

  // Versiones (snapshots históricos)
  getTasacionVersions: (aid) => _req('GET', `/api/tasaciones/${aid}/versions`),
  getTasacionVersion:  (aid, version) => _req('GET', `/api/tasaciones/${aid}/versions/${version}`),
  createNewTasacionVersion: (aid) => _req('POST', `/api/tasaciones/${aid}/new-version`),

  // Extraer datos desde URL de portal
  extraerURLTasacion: (url) => _req('POST', '/api/tasaciones/extract-url', { url }),
  getAppraisal:     (id) => _req('GET', `/api/appraisals/${id}`),
  createAppraisal:  (data) => _req('POST',  '/api/appraisals', data),
  updateAppraisal:  (id, data) => _req('PUT', `/api/appraisals/${id}`, data),
  deleteAppraisal:  (id) => _req('DELETE', `/api/appraisals/${id}`),
  archiveAppraisal: (id) => _req('POST', `/api/appraisals/${id}/archive`),
  restoreAppraisal: (id) => _req('POST', `/api/appraisals/${id}/restore`),
  getAppraisalStats: () => _req('GET', '/api/appraisals/stats'),
  calculateAppraisal: (id) => _req('GET', `/api/appraisals/${id}/calculate`),
  getAppraisalLogs: (id) => _req('GET', `/api/appraisals/${id}/logs`),
  getAppraisalAgents:  () => _req('GET', '/api/appraisals/agents'),
  getAppraisalTimeline: (id) => _req('GET', `/api/appraisals/${id}/timeline`),
  addAppraisalTimeline: (id, data) => _req('POST', `/api/appraisals/${id}/timeline`, data),
  getAppraisalComments: (id) => _req('GET', `/api/appraisals/${id}/comments`),
  addAppraisalComment: (id, data) => _req('POST', `/api/appraisals/${id}/comments`, data),
  getAppraisalFiles: (id) => _req('GET', `/api/appraisals/${id}/files`),
  uploadAppraisalFile: (id, formData) => _reqUpload('POST', `/api/appraisals/${id}/files`, formData),
  deleteAppraisalFile: (id, fid) => _req('DELETE', `/api/appraisals/${id}/files/${fid}`),
  assignAppraisalAgent: (id, data) => _req('POST', `/api/appraisals/${id}/assign`, data),
  changeAppraisalStatus: (id, data) => _req('POST', `/api/appraisals/${id}/status`, data),
  convertAppraisalToProperty: (id, data) => _req('POST', `/api/appraisals/${id}/convert-property`, data),

  // Comparables
  getComparables:   (aid) => _req('GET', `/api/appraisals/${aid}/comparables`),
  createComparable: (aid, data) => _req('POST', `/api/appraisals/${aid}/comparables`, data),
  updateComparable: (aid, cid, data) => _req('PUT', `/api/appraisals/${aid}/comparables/${cid}`, data),
  deleteComparable: (aid, cid) => _req('DELETE', `/api/appraisals/${aid}/comparables/${cid}`),
  previewComparable: (aid, data) => _req('POST', `/api/appraisals/${aid}/comparables/preview`, data),

  // Completar valuación
  completarAppraisal: (id) => _req('POST', `/api/appraisals/${id}/completar`),

  // Versiones (snapshots históricos)
  getAppraisalVersions: (aid) => _req('GET', `/api/appraisals/${aid}/versions`),
  getAppraisalVersion: (aid, version) => _req('GET', `/api/appraisals/${aid}/versions/${version}`),
  createNewVersion: (aid) => _req('POST', `/api/appraisals/${aid}/new-version`),

  // Extraer datos desde URL de portal
  extraerURL: (url) => _req('POST', '/api/appraisals/extract-url', { url }),

  // Empresa (config inmobiliaria)
  getEmpresa: () => _req('GET', '/api/empresa'),
  updateEmpresa: (data) => _req('PUT', '/api/empresa', data),

  // Dólar
  _dolarRate: null,
  _dolarPromise: null,
  getDolar: async () => {
    if (API._dolarRate !== null) return API._dolarRate;
    if (API._dolarPromise) return API._dolarPromise;
    API._dolarPromise = (async () => {
      try {
        const d = await _req('GET', '/api/dolar');
        API._dolarRate = d.venta;
        return d.venta;
      } catch {
        return 1200; // fallback conservador
      } finally {
        API._dolarPromise = null;
      }
    })();
    return API._dolarPromise;
  },
  invalidateDolar: () => { API._dolarRate = null; },

  // CRM / Leads
  getLeads:          (params) => _req('GET', '/api/crm/leads' + (params ? '?' + new URLSearchParams(params) : '')),
  getLead:           (id) => _req('GET', `/api/crm/leads/${id}`),
  createLead:        (data) => _req('POST', '/api/crm/leads', data),
  updateLead:        (id, data) => _req('PATCH', `/api/crm/leads/${id}`, data),
  deleteLead:        (id) => _req('DELETE', `/api/crm/leads/${id}`),
  addLeadNote:       (id, data) => _req('POST', `/api/crm/leads/${id}/notes`, data),
  sendLeadEmail:     (id, data) => _req('POST', `/api/crm/leads/${id}/send-email`, data),
  getCrmStats:       () => _req('GET', '/api/crm/stats'),
  convertToLead:     (type, id) => _req('POST', `/api/crm/from-${type}/${id}`),
  getCrmAgents:      () => _req('GET', '/api/crm/agents'),

  // Messages / Conversations
  getConversations:     (params) => _req('GET', '/api/messages/conversations' + (params ? '?' + new URLSearchParams(params) : '')),
  getConversation:      (id) => _req('GET', `/api/messages/conversations/${id}`),
  getConversationMessages: (id, params) => _req('GET', `/api/messages/conversations/${id}/messages` + (params ? '?' + new URLSearchParams(params) : '')),
  sendMessage:          (convId, content, contentType = 'text', attachmentUrl = '', attachmentName = '') => _req('POST', `/api/messages/conversations/${convId}/messages`, { content, content_type: contentType, attachment_url: attachmentUrl, attachment_name: attachmentName }),
  markConversationRead: (id) => _req('POST', `/api/messages/conversations/${id}/mark-read`),
  updateConversationStatus: (id, status) => _req('PATCH', `/api/messages/conversations/${id}/status`, { status }),
  createConversation:   (data) => _req('POST', '/api/messages/conversations', data),
  getConversationLinks: (id) => _req('GET', `/api/messages/conversations/${id}/links`),
  addConversationLink:  (id, linkType, linkId) => _req('POST', `/api/messages/conversations/${id}/links`, { type: linkType, id: linkId }),
  removeConversationLink: (id, linkType, linkId) => _req('DELETE', `/api/messages/conversations/${id}/links/${linkType}/${linkId}`),

  // Requests / Solicitudes
  getRequests:          (params) => _req('GET', '/api/requests' + (params ? '?' + new URLSearchParams(params) : '')),
  getRequest:           (id) => _req('GET', `/api/requests/${id}`),
  getRequestStats:      () => _req('GET', '/api/requests/stats'),
  createRequest:        (data) => _req('POST', '/api/requests', data),
  updateRequest:        (id, data) => _req('PATCH', `/api/requests/${id}`, data),
  addRequestComment:    (id, content) => _req('POST', `/api/requests/${id}/comments`, { content }),
  convertRequestToLead: (id) => _req('POST', `/api/requests/${id}/convert-to-lead`),
  getRequestAgents:     () => _req('GET', '/api/requests/agents'),

  // Portales Management
  getPortalKpis:        () => _req('GET', '/api/portals/kpi'),
  getPortalPlatforms:   () => _req('GET', '/api/portals/platforms'),
  getPortalAgents:      () => _req('GET', '/api/portals/agents'),
  getPublicationsEnhanced: (params) => _req('GET', '/api/portals/publications/enhanced' + (params ? '?' + new URLSearchParams(params) : '')),
  getPublicationDetail: (id) => _req('GET', `/api/portals/publications/${id}`),
  publicationAction:    (id, action) => _req('POST', `/api/portals/publications/${id}/action`, { action }),

  // Calendar / Agenda
  getCalendarKpi:      () => _req('GET', '/api/calendar/kpi'),
  getCalendarEvents:   (params) => _req('GET', '/api/calendar/events' + (params ? '?' + new URLSearchParams(params) : '')),
  getCalendarEvent:    (id) => _req('GET', `/api/calendar/events/${id}`),
  createCalendarEvent: (data) => _req('POST', '/api/calendar/events', data),
  updateCalendarEvent: (id, data) => _req('PUT', `/api/calendar/events/${id}`, data),
  deleteCalendarEvent: (id) => _req('DELETE', `/api/calendar/events/${id}`),
  calendarEventAction: (id, action) => _req('POST', `/api/calendar/events/${id}/action`, { action }),
  addCalendarComment:  (id, content) => _req('POST', `/api/calendar/events/${id}/comments`, { content }),
  getCalendarAgents:   () => _req('GET', '/api/calendar/agents'),
  getCalendarProperties: () => _req('GET', '/api/calendar/properties'),
  getCalendarLeads:    () => _req('GET', '/api/calendar/leads'),

  // Marketing
  getMarketingDashboard: () => _req('GET', '/api/marketing/dashboard'),
  getMarketingPosts:     () => _req('GET', '/api/marketing/posts'),
  getMarketingPlatforms: () => _req('GET', '/api/marketing/platforms'),
  getMarketingCampaigns:   () => _req('GET', '/api/marketing/campaigns'),
  createMarketingCampaign: (data) => _req('POST', '/api/marketing/campaigns', data),
  updateMarketingCampaign: (id, data) => _req('PUT', `/api/marketing/campaigns/${id}`, data),
  deleteMarketingCampaign: (id) => _req('DELETE', `/api/marketing/campaigns/${id}`),
  getMarketingCalendar:  (params) => _req('GET', '/api/marketing/calendar' + (params ? '?' + new URLSearchParams(params) : '')),
  getMarketingMetrics:   (days) => _req('GET', `/api/marketing/metrics${days ? '?days='+days : ''}`),

  // Bajas de datos (Ley 25.326)
  sendBaja:             (data) => _req('POST', '/api/baja', data),
  getBajas:             (params) => _req('GET', '/api/baja' + (params ? '?' + new URLSearchParams(params) : '')),
  getBajaStats:         () => _req('GET', '/api/baja/stats'),
  updateBaja:           (id, data) => _req('PATCH', `/api/baja/${id}`, data),
  deleteBaja:           (id) => _req('DELETE', `/api/baja/${id}`),
};

window.API = API;
window.setCsrfToken = setCsrfToken;

// ── Proxy para imágenes externas con CORS ─────────────────────────
function proxyImgUrl(url) {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith(location.origin)) return url;
  if (url.includes('res.cloudinary.com')) return url;
  if (url.startsWith('/')) return url; // same-origin relative, no proxy needed
  return `${API_BASE}/api/proxy-image?url=` + encodeURIComponent(url);
}

// ── Imágenes responsivas (Cloudinary srcset) ─────────────────────────
function imgResponsive(url, widths = [400, 800, 1200]) {
  if (!url || !url.includes('res.cloudinary.com')) {
    return { src: proxyImgUrl(url) || '' };
  }
  const parts = url.split('/upload/');
  if (parts.length !== 2) return { src: url };
  const base = parts[0] + '/upload/';
  const path = parts[1].replace(/^v\d+\//, ''); // strip version
  // Extract cloud name from URL
  const srcset = widths
    .map(w => `${base}w_${w},c_scale,f_auto,q_auto/${path} ${w}w`)
    .join(', ');
  const src = `${base}w_${widths[widths.length - 1]},f_auto,q_auto/${path}`;
  return { src, srcset };
}

function imgAttrs(url, widths = [400, 800, 1200]) {
  const r = imgResponsive(url, widths);
  return r.srcset
    ? `src="${r.src}" srcset="${r.srcset}" sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, ${widths[widths.length-1]}px"`
    : `src="${r.src}"`;
}

// ── Formateo de precio con ARS (dólar blue) ─────────────────────────
let _fmtArsRate = null;
let _fmtArsPromise = null;

async function _loadDolarRate() {
  if (_fmtArsRate !== null) return;
  if (_fmtArsPromise) return _fmtArsPromise;
  _fmtArsPromise = (async () => {
    try {
      const d = await _req('GET', '/api/dolar');
      _fmtArsRate = d.venta;
    } catch {
      _fmtArsRate = 1200;
    }
  })();
  await _fmtArsPromise;
  _fmtArsPromise = null;
}

function fmtPriceARS(usd, compact = false) {
  const n = Number(usd);
  if (!n) return '—';
  const usdStr = `USD ${n.toLocaleString('es-AR')}`;
  if (_fmtArsRate === null) return usdStr;
  const ars = Math.round(n * _fmtArsRate);
  if (compact) return `${usdStr} ≈ $${ars.toLocaleString('es-AR')}`;
  const arsStr = `$${ars.toLocaleString('es-AR')} ARS`;
  return `${usdStr} (${arsStr})`;
}

// Inicializar tasa al cargar el script (no bloqueante)
_loadDolarRate();
// Refrescar cada 5 minutos
setInterval(() => { _fmtArsRate = null; _loadDolarRate(); }, 300000);

// Cleanup: eliminar cualquier residuo del modo oscuro anterior
localStorage.removeItem('bienenhaus_theme');
document.documentElement.removeAttribute('data-theme');

