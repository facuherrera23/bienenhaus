/**
 * API Client - Centralized fetch wrapper with CSRF handling
 */

const API_BASE = '/api';
let _csrfToken = null;

/**
 * Get CSRF token from cookie or meta tag
 */
function getCsrfToken() {
  if (_csrfToken) return _csrfToken;

  // Try cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token') return _csrfToken = value;
  }

  // Try meta tag
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) return _csrfToken = meta.content;

  return null;
}

/**
 * Ensure CSRF token is set
 */
async function ensureCsrfToken() {
  if (_csrfToken) return;
  try {
    const res = await fetch(`${API_BASE}/auth/csrf-token`, { credentials: 'include' });
    const data = await res.json();
    if (data.ok && data.data?.csrf_token) _csrfToken = data.data.csrf_token;
  } catch {
    console.warn('[API] Could not fetch CSRF token');
  }
}

/**
 * Core request function
 */
async function request(method, endpoint, data = null, options = {}) {
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutation) await ensureCsrfToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const csrfToken = getCsrfToken();
  if (csrfToken && isMutation) headers['X-CSRF-Token'] = csrfToken;

  const config = {
    method,
    headers,
    credentials: 'include',
    ...options
  };

  if (data) config.body = JSON.stringify(data);

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, config);

  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`Server error (${res.status}). Is the server running?`);
  }

  const data = await res.json();

  // Handle CSRF token refresh
  if (!data.ok && data.error?.includes('CSRF')) {
    _csrfToken = null;
    if (!options._csrfRetry) {
      await ensureCsrfToken();
      return request(method, endpoint, data, { ...options, _csrfRetry: true });
    }
  }

  if (!data.ok) throw new Error(data.error || 'Unknown error');

  if (data.data?.csrf_token) _csrfToken = data.data.csrf_token;

  return data.data;
}

/**
 * API methods
 */
export const API = {
  // Properties
  getProperties: async (params = {}) => {
    const search = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    const data = await request('GET', `/properties${search ? '?' + search : ''}`);
    return Array.isArray(data) ? { properties: data, total: data.length, page: 1, pages: 1, has_prev: false, has_next: false } : data;
  },

  getProperty: (id) => request('GET', `/properties/${id}`),
  createProperty: (data) => request('POST', '/properties', data),
  updateProperty: (id, data) => request('PUT', `/properties/${id}`, data),
  setPropertyStatus: (id, status) => request('PATCH', `/properties/${id}/status`, { status }),
  deleteProperty: (id) => request('DELETE', `/properties/${id}`),
  getSimilar: (id, limit) => request('GET', `/properties/${id}/similares${limit ? '?limit=' + limit : ''}`),

  // Rentals
  getRentals: async (params = {}) => {
    const search = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    const data = await request('GET', `/rentals${search ? '?' + search : ''}`);
    return Array.isArray(data) ? { rentals: data, total: data.length, page: 1, pages: 1, has_prev: false, has_next: false } : data;
  },

  getRental: (id) => request('GET', `/rentals/${id}`),

  // Agents
  getAgents: () => request('GET', '/agents'),
  createAgent: (data) => request('POST', '/agents', data),
  updateAgent: (id, data) => request('PUT', `/agents/${id}`, data),
  deleteAgent: (id) => request('DELETE', `/agents/${id}`),

  // Contact
  sendContact: (data) => request('POST', '/contact', data),
  sendTasacion: (data) => request('POST', '/tasacion', data),

  // Tasaciones
  getTasaciones: (params) => request('GET', `/tasaciones${params ? '?' + new URLSearchParams(params) : ''}`),
  getTasacion: (id) => request('GET', `/tasaciones/${id}`),
  createTasacion: (data) => request('POST', '/tasaciones', data),
  updateTasacion: (id, data) => request('PUT', `/tasaciones/${id}`, data),
  deleteTasacion: (id) => request('DELETE', `/tasaciones/${id}`),

  // Settings
  getSettings: () => request('GET', '/settings'),
  getPublicSettings: () => request('GET', '/settings?public=true'),
  updateSettings: (data) => request('PUT', '/settings', data),

  // Auth
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  logout: () => request('POST', '/auth/logout'),
  checkAuth: () => request('GET', '/auth/check'),

  // Upload
  uploadImages: async (files, type = '') => {
    const formData = new FormData();
    for (const file of files) formData.append('images', file);

    await ensureCsrfToken();
    const headers = {};
    const csrfToken = getCsrfToken();
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    const url = `/api/upload${type ? '?type=' + encodeURIComponent(type) : ''}`;
    const res = await fetch(url, { method: 'POST', headers, credentials: 'include', body: formData });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Error uploading images');
    if (data.data?.csrf_token) _csrfToken = data.data.csrf_token;
    return data.data;
  },

  deleteImage: (filename) => request('DELETE', '/api/upload', { filename }),
  listImages: () => request('GET', '/api/upload/list'),

  // Appraisals
  getAppraisals: (params) => request('GET', `/appraisals${params ? '?' + new URLSearchParams(params) : ''}`),

  // CRM
  getLeads: (params) => request('GET', `/crm/leads${params ? '?' + new URLSearchParams(params) : ''}`),
  getLead: (id) => request('GET', `/crm/leads/${id}`),
  createLead: (data) => request('POST', '/crm/leads', data),

  // Messages
  getConversations: (params) => request('GET', `/messages/conversations${params ? '?' + new URLSearchParams(params) : ''}`),

  // Requests
  getRequests: (params) => request('GET', `/requests${params ? '?' + new URLSearchParams(params) : ''}`),

  // Portal
  getPortals: () => request('GET', '/portals'),
  getQueueItems: (params) => request('GET', `/portals/queue${params ? '?' + new URLSearchParams(params) : ''}`),
  getQueueCount: () => request('GET', '/portals/queue/count'),

  // Calendar
  getCalendarEvents: (params) => request('GET', `/calendar/events${params ? '?' + new URLSearchParams(params) : ''}`),

  // Marketing
  getMarketingDashboard: () => request('GET', '/marketing/dashboard'),

  // Client errors
  logClientError: (data) => request('POST', '/client-errors', data),

  // Utils
  getDolar: async () => {
    try {
      const data = await request('GET', '/dolar');
      return data.venta;
    } catch {
      return 1200;
    }
  },

  // CSRF helpers
  getCsrfToken: () => _csrfToken,
  setCsrfToken: (token) => { _csrfToken = token; },
  refreshCsrfToken: async () => {
    try {
      const data = await request('GET', '/auth/csrf-token');
      if (data.csrf_token) _csrfToken = data.csrf_token;
    } catch {}
  }
};

export default API;