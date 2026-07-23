(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // js/_admin-concat-tmp.js
  function _esc(v) {
    return String(v != null ? v : "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  window.formatPrice = function(val, currency) {
    var n = Number(val);
    if (isNaN(n) || n === 0) return "\u2014";
    var code = currency === "ARS" ? "ARS" : "USD";
    return code + " " + n.toLocaleString("es-AR");
  };
  window.formatPriceShort = function(val, currency) {
    var n = Number(val);
    if (isNaN(n) || n === 0) return "\u2014";
    var sym = currency === "ARS" ? "$" : "USD";
    return sym + " " + n.toLocaleString("es-AR");
  };
  window.formatDate = function(val, opts) {
    if (!val) return "\u2014";
    opts = opts || {};
    try {
      var d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      var dateOpts = opts.short ? { day: "2-digit", month: "2-digit", year: "numeric" } : { day: "2-digit", month: "long", year: "numeric" };
      return d.toLocaleDateString("es-AR", dateOpts);
    } catch (e) {
      return String(val);
    }
  };
  window.formatDateShort = function(val) {
    return window.formatDate(val, { short: true });
  };
  window.formatDateTime = function(val) {
    if (!val) return "\u2014";
    try {
      var d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return String(val);
    }
  };
  window.emptyStateHTML = function(msg, sub) {
    msg = msg || "Sin contenido";
    sub = sub || "";
    return '<div class="empty-state"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity=".4"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><div class="empty-title">' + _esc(msg) + "</div>" + (sub ? '<div class="empty-sub">' + _esc(sub) + "</div>" : "") + "</div>";
  };
  window.errorStateHTML = function(msg, retryLabel, retryFn) {
    msg = msg || "Error al cargar datos.";
    var btn = "";
    if (retryLabel && typeof retryFn === "function") {
      var fnName = "__retry_" + Math.random().toString(36).slice(2, 6);
      window[fnName] = retryFn;
      btn = '<button class="btn btn-ghost btn-sm" onclick="window.' + fnName + '()" style="margin-top:12px">' + _esc(retryLabel) + "</button>";
    }
    return '<div class="empty-state"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="1.2" opacity=".6"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><div class="empty-title" style="color:#e74c3c">' + _esc(msg) + "</div></div>" + btn;
  };
  window.skeletonGrid = function(count) {
    count = count || 6;
    var cards = "";
    for (var i = 0; i < count; i++) {
      cards += '<div class="skeleton-card"><div class="skeleton-card-img"></div><div class="skeleton-card-body"><div class="skeleton-line skeleton-line--w80 skeleton-line--lg"></div><div class="skeleton-line skeleton-line--w60"></div><div class="skeleton-line skeleton-line--w40 skeleton-line--sm"></div><div class="skeleton-specs"><div class="skeleton-line skeleton-line--spec"></div><div class="skeleton-line skeleton-line--spec"></div><div class="skeleton-line skeleton-line--spec"></div></div></div></div>';
    }
    return '<div class="skeleton-grid">' + cards + "</div>";
  };
  window.skeletonDetail = function() {
    return '<div class="skeleton-detail"><div class="skeleton-detail-gallery"></div><div class="skeleton-detail-info"><div class="skeleton-detail-line skeleton-detail-line--w50 skeleton-detail-line--badge"></div><div class="skeleton-detail-line skeleton-detail-line--w70 skeleton-detail-line--xl"></div><div class="skeleton-detail-line skeleton-detail-line--w50 skeleton-detail-line--lg"></div><div class="skeleton-detail-line skeleton-detail-line--w70"></div><div class="skeleton-detail-specs"><div class="skeleton-detail-spec"></div><div class="skeleton-detail-spec"></div><div class="skeleton-detail-spec"></div><div class="skeleton-detail-spec"></div></div><div class="skeleton-detail-line skeleton-detail-line--block"></div><div class="skeleton-detail-line skeleton-detail-line--w30"></div></div></div>';
  };
  window.showSkeleton = function(containerId, type, count) {
    var el = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!el) return;
    type = type || "grid";
    if (type === "grid") {
      el.innerHTML = window.skeletonGrid(count);
    } else if (type === "detail") {
      el.innerHTML = window.skeletonDetail();
    }
  };
  window.hideSkeleton = function(containerId, showContent) {
    var _a, _b;
    var el = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!el) return;
    if (showContent) {
      (_a = el.querySelector(".skeleton-grid")) == null ? void 0 : _a.remove();
      (_b = el.querySelector(".skeleton-detail")) == null ? void 0 : _b.remove();
    } else {
      el.innerHTML = "";
    }
  };
  window.showEmpty = function(containerId, msg, sub) {
    var el = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!el) return;
    el.innerHTML = window.emptyStateHTML(msg, sub);
  };
  var API_BASE = window.__API_BASE__ || "";
  var _csrfToken = null;
  function setCsrfToken(token) {
    _csrfToken = token;
  }
  function showError(el, msg) {
    const container = typeof el === "string" ? document.getElementById(el) : el;
    if (!container) return;
    container.innerHTML = '<div class="loading-state"></div>';
    container.firstChild.textContent = msg || "Error al cargar datos.";
  }
  window.showError = showError;
  async function _req(method, path, body = null, _retried = false) {
    if (method !== "GET") {
      await _ensureCsrfToken();
    }
    const headers = { "Content-Type": "application/json" };
    if (_csrfToken && method !== "GET") {
      headers["X-CSRF-Token"] = _csrfToken;
    }
    const opts = {
      method,
      headers,
      credentials: "include"
    };
    if (body !== null) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Error del servidor (${res.status}). \xBFEst\xE1 corriendo Flask?`);
    }
    const json = await res.json();
    if (!json.ok && !_retried && json.error && json.error.includes("CSRF")) {
      _csrfToken = null;
      await _ensureCsrfToken();
      if (_csrfToken) {
        return _req(method, path, body, true);
      }
    }
    if (!json.ok) throw new Error(json.error || "Error desconocido");
    if (json.data && json.data.csrf_token) {
      _csrfToken = json.data.csrf_token;
    }
    return json.data;
  }
  async function _ensureCsrfToken() {
    var _a;
    try {
      const r = await fetch(`${API_BASE}/api/auth/csrf-token`, { credentials: "include" });
      const j = await r.json();
      if (j.ok && ((_a = j.data) == null ? void 0 : _a.csrf_token)) _csrfToken = j.data.csrf_token;
    } catch (e) {
      console.warn("getCsrfToken fall\xF3");
    }
  }
  async function _reqUpload(method, path, formData) {
    if (method !== "GET") {
      await _ensureCsrfToken();
    }
    const headers = {};
    if (_csrfToken && method !== "GET") {
      headers["X-CSRF-Token"] = _csrfToken;
    }
    const opts = {
      method,
      headers,
      credentials: "include",
      body: formData
    };
    const res = await fetch(`${API_BASE}${path}`, opts);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Error de servidor");
    return json.data;
  }
  var API = {
    getProperties: async (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== void 0))
      ).toString();
      const data = await _req("GET", `/api/properties${qs ? "?" + qs : ""}`);
      if (Array.isArray(data)) {
        return { properties: data, total: data.length, page: 1, pages: 1, has_prev: false, has_next: false };
      }
      return data;
    },
    getProperty: (id) => _req("GET", `/api/properties/${id}`),
    createProperty: (data) => _req("POST", "/api/properties", data),
    updateProperty: (id, data) => _req("PUT", `/api/properties/${id}`, data),
    setStatus: (id, status) => _req("PATCH", `/api/properties/${id}/status`, { status }),
    deleteProperty: (id) => _req("DELETE", `/api/properties/${id}`),
    getSimilares: (id, limit) => _req("GET", `/api/properties/${id}/similares${limit ? "?limit=" + limit : ""}`),
    // Rentals similares
    getRentalSimilares: (id, limit) => _req("GET", `/api/rentals/${id}/similares${limit ? "?limit=" + limit : ""}`),
    // Agentes
    getAgents: () => _req("GET", "/api/agents"),
    createAgent: (data) => _req("POST", "/api/agents", data),
    updateAgent: (id, data) => _req("PUT", `/api/agents/${id}`, data),
    deleteAgent: (id) => _req("DELETE", `/api/agents/${id}`),
    // Contacto
    sendContact: (data) => _req("POST", "/api/contact", data),
    // Tasación pública
    sendTasacion: (data) => _req("POST", "/api/tasacion", data),
    getTasacionRequests: (params) => _req("GET", "/api/tasacion" + (params ? "?" + new URLSearchParams(params) : "")),
    getTasacionStats: () => _req("GET", "/api/tasacion/stats"),
    updateTasacionStatus: (id, data) => _req("PATCH", `/api/tasacion/${id}`, data),
    deleteTasacionRequest: (id) => _req("DELETE", `/api/tasacion/${id}`),
    // Auth
    login: (username, password) => _req("POST", "/api/auth/login", { username, password }),
    logout: () => _req("POST", "/api/auth/logout"),
    checkAuth: () => _req("GET", "/api/auth/check"),
    // Usuarios
    getUsers: () => _req("GET", "/api/admin/users"),
    createUser: (data) => _req("POST", "/api/admin/users", data),
    updateUser: (id, data) => _req("PUT", `/api/admin/users/${id}`, data),
    deleteUser: (id) => _req("DELETE", `/api/admin/users/${id}`),
    // Portales
    getPortals: () => _req("GET", "/api/portals"),
    createPortal: (data) => _req("POST", "/api/portals", data),
    updatePortal: (id, data) => _req("PUT", `/api/portals/${id}`, data),
    deletePortal: (id) => _req("DELETE", `/api/portals/${id}`),
    getPortalLogs: (params) => _req("GET", "/api/portals/logs" + (params ? "?" + new URLSearchParams(params) : "")),
    getPublications: (params) => _req("GET", "/api/portals/publications" + (params ? "?" + new URLSearchParams(params) : "")),
    getQueueItems: (params) => _req("GET", "/api/portals/queue" + (params ? "?" + new URLSearchParams(params) : "")),
    getQueueCount: () => _req("GET", "/api/portals/queue/count"),
    enqueuePortal: (data) => _req("POST", "/api/portals/queue", data),
    retryQueueItem: (id) => _req("POST", `/api/portals/queue/${id}/retry`),
    // Ajustes del sitio
    getSettings: () => _req("GET", "/api/settings"),
    getPublicSettings: () => _req("GET", "/api/settings?public=true"),
    updateSettings: (data) => _req("PUT", "/api/settings", data),
    // Rentals
    getRentals: async (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== void 0))
      ).toString();
      const data = await _req("GET", `/api/rentals${qs ? "?" + qs : ""}`);
      if (Array.isArray(data)) {
        return { rentals: data, total: data.length, page: 1, pages: 1, has_prev: false, has_next: false };
      }
      return data;
    },
    getRental: (id) => _req("GET", `/api/rentals/${id}`),
    createRental: (data) => _req("POST", "/api/rentals", data),
    updateRental: (id, data) => _req("PUT", `/api/rentals/${id}`, data),
    setRentalStatus: (id, s) => _req("PATCH", `/api/rentals/${id}/status`, { status: s }),
    deleteRental: (id) => _req("DELETE", `/api/rentals/${id}`),
    // Upload de imágenes
    uploadImages: async (files, type = "") => {
      const form = new FormData();
      for (const file of files) form.append("images", file);
      await _ensureCsrfToken();
      const headers = {};
      if (_csrfToken) headers["X-CSRF-Token"] = _csrfToken;
      const qs = type ? `?type=${encodeURIComponent(type)}` : "";
      const res = await fetch(`/api/upload${qs}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: form
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error al subir im\xE1genes");
      if (json.data && json.data.csrf_token) {
        _csrfToken = json.data.csrf_token;
      }
      return json.data;
    },
    deleteImage: (filename) => _req("DELETE", "/api/upload", { filename }),
    listImages: () => _req("GET", "/api/upload/list"),
    // Raw request (for internal use by modules)
    _rawReq: (method, path, body) => _req(method, path, body),
    // CSRF
    refreshCsrfToken: async () => {
      try {
        const d = await _req("GET", "/api/auth/csrf-token");
        if (d.csrf_token) _csrfToken = d.csrf_token;
      } catch (e) {
      }
    },
    // Appraisals (tasaciones / ACM)
    getAppraisals: (params) => _req("GET", "/api/appraisals" + (params ? "?" + new URLSearchParams(params) : "")),
    // Tasaciones (módulo clonado de ACM Tool)
    getTasaciones: (params) => _req("GET", "/api/tasaciones" + (params ? "?" + new URLSearchParams(params) : "")),
    getTasacion: (id) => _req("GET", `/api/tasaciones/${id}`),
    createTasacion: (data) => _req("POST", "/api/tasaciones", data),
    updateTasacion: (id, data) => _req("PUT", `/api/tasaciones/${id}`, data),
    deleteTasacion: (id) => _req("DELETE", `/api/tasaciones/${id}`),
    archiveTasacion: (id) => _req("POST", `/api/tasaciones/${id}/archive`),
    restoreTasacion: (id) => _req("POST", `/api/tasaciones/${id}/restore`),
    getTasacionesStats: () => _req("GET", "/api/tasaciones/stats"),
    calculateTasacion: (id) => _req("GET", `/api/tasaciones/${id}/calculate`),
    getTasacionLogs: (id) => _req("GET", `/api/tasaciones/${id}/logs`),
    getTasacionAgents: () => _req("GET", "/api/tasaciones/agents"),
    getTasacionTimeline: (id) => _req("GET", `/api/tasaciones/${id}/timeline`),
    addTasacionTimeline: (id, data) => _req("POST", `/api/tasaciones/${id}/timeline`, data),
    getTasacionComments: (id) => _req("GET", `/api/tasaciones/${id}/comments`),
    addTasacionComment: (id, data) => _req("POST", `/api/tasaciones/${id}/comments`, data),
    getTasacionFiles: (id) => _req("GET", `/api/tasaciones/${id}/files`),
    uploadTasacionFile: (id, formData) => _reqUpload("POST", `/api/tasaciones/${id}/files`, formData),
    deleteTasacionFile: (id, fid) => _req("DELETE", `/api/tasaciones/${id}/files/${fid}`),
    assignTasacionAgent: (id, data) => _req("POST", `/api/tasaciones/${id}/assign`, data),
    changeTasacionStatus: (id, data) => _req("POST", `/api/tasaciones/${id}/status`, data),
    convertTasacionToProperty: (id, data) => _req("POST", `/api/tasaciones/${id}/convert-property`, data),
    // Tasacion Comparables
    getTasacionComparables: (aid) => _req("GET", `/api/tasaciones/${aid}/comparables`),
    createTasacionComparable: (aid, data) => _req("POST", `/api/tasaciones/${aid}/comparables`, data),
    updateTasacionComparable: (aid, cid, data) => _req("PUT", `/api/tasaciones/${aid}/comparables/${cid}`, data),
    deleteTasacionComparable: (aid, cid) => _req("DELETE", `/api/tasaciones/${aid}/comparables/${cid}`),
    previewTasacionComparable: (aid, data) => _req("POST", `/api/tasaciones/${aid}/comparables/preview`, data),
    // Completar valuación
    completarTasacion: (id) => _req("POST", `/api/tasaciones/${id}/completar`),
    // Versiones (snapshots históricos)
    getTasacionVersions: (aid) => _req("GET", `/api/tasaciones/${aid}/versions`),
    getTasacionVersion: (aid, version) => _req("GET", `/api/tasaciones/${aid}/versions/${version}`),
    createNewTasacionVersion: (aid) => _req("POST", `/api/tasaciones/${aid}/new-version`),
    // Extraer datos desde URL de portal
    extraerURLTasacion: (url) => _req("POST", "/api/tasaciones/extract-url", { url }),
    getAppraisal: (id) => _req("GET", `/api/appraisals/${id}`),
    createAppraisal: (data) => _req("POST", "/api/appraisals", data),
    updateAppraisal: (id, data) => _req("PUT", `/api/appraisals/${id}`, data),
    deleteAppraisal: (id) => _req("DELETE", `/api/appraisals/${id}`),
    archiveAppraisal: (id) => _req("POST", `/api/appraisals/${id}/archive`),
    restoreAppraisal: (id) => _req("POST", `/api/appraisals/${id}/restore`),
    getAppraisalStats: () => _req("GET", "/api/appraisals/stats"),
    calculateAppraisal: (id) => _req("GET", `/api/appraisals/${id}/calculate`),
    getAppraisalLogs: (id) => _req("GET", `/api/appraisals/${id}/logs`),
    getAppraisalAgents: () => _req("GET", "/api/appraisals/agents"),
    getAppraisalTimeline: (id) => _req("GET", `/api/appraisals/${id}/timeline`),
    addAppraisalTimeline: (id, data) => _req("POST", `/api/appraisals/${id}/timeline`, data),
    getAppraisalComments: (id) => _req("GET", `/api/appraisals/${id}/comments`),
    addAppraisalComment: (id, data) => _req("POST", `/api/appraisals/${id}/comments`, data),
    getAppraisalFiles: (id) => _req("GET", `/api/appraisals/${id}/files`),
    uploadAppraisalFile: (id, formData) => _reqUpload("POST", `/api/appraisals/${id}/files`, formData),
    deleteAppraisalFile: (id, fid) => _req("DELETE", `/api/appraisals/${id}/files/${fid}`),
    assignAppraisalAgent: (id, data) => _req("POST", `/api/appraisals/${id}/assign`, data),
    changeAppraisalStatus: (id, data) => _req("POST", `/api/appraisals/${id}/status`, data),
    convertAppraisalToProperty: (id, data) => _req("POST", `/api/appraisals/${id}/convert-property`, data),
    // Comparables
    getComparables: (aid) => _req("GET", `/api/appraisals/${aid}/comparables`),
    createComparable: (aid, data) => _req("POST", `/api/appraisals/${aid}/comparables`, data),
    updateComparable: (aid, cid, data) => _req("PUT", `/api/appraisals/${aid}/comparables/${cid}`, data),
    deleteComparable: (aid, cid) => _req("DELETE", `/api/appraisals/${aid}/comparables/${cid}`),
    previewComparable: (aid, data) => _req("POST", `/api/appraisals/${aid}/comparables/preview`, data),
    // Completar valuación
    completarAppraisal: (id) => _req("POST", `/api/appraisals/${id}/completar`),
    // Versiones (snapshots históricos)
    getAppraisalVersions: (aid) => _req("GET", `/api/appraisals/${aid}/versions`),
    getAppraisalVersion: (aid, version) => _req("GET", `/api/appraisals/${aid}/versions/${version}`),
    createNewVersion: (aid) => _req("POST", `/api/appraisals/${aid}/new-version`),
    // Extraer datos desde URL de portal
    extraerURL: (url) => _req("POST", "/api/appraisals/extract-url", { url }),
    // Empresa (config inmobiliaria)
    getEmpresa: () => _req("GET", "/api/empresa"),
    updateEmpresa: (data) => _req("PUT", "/api/empresa", data),
    // Dólar
    _dolarRate: null,
    _dolarPromise: null,
    getDolar: async () => {
      if (API._dolarRate !== null) return API._dolarRate;
      if (API._dolarPromise) return API._dolarPromise;
      API._dolarPromise = (async () => {
        try {
          const d = await _req("GET", "/api/dolar");
          API._dolarRate = d.venta;
          return d.venta;
        } catch (e) {
          return 1200;
        } finally {
          API._dolarPromise = null;
        }
      })();
      return API._dolarPromise;
    },
    invalidateDolar: () => {
      API._dolarRate = null;
    },
    // CRM / Leads
    getLeads: (params) => _req("GET", "/api/crm/leads" + (params ? "?" + new URLSearchParams(params) : "")),
    getLead: (id) => _req("GET", `/api/crm/leads/${id}`),
    createLead: (data) => _req("POST", "/api/crm/leads", data),
    updateLead: (id, data) => _req("PATCH", `/api/crm/leads/${id}`, data),
    deleteLead: (id) => _req("DELETE", `/api/crm/leads/${id}`),
    addLeadNote: (id, data) => _req("POST", `/api/crm/leads/${id}/notes`, data),
    sendLeadEmail: (id, data) => _req("POST", `/api/crm/leads/${id}/send-email`, data),
    getCrmStats: () => _req("GET", "/api/crm/stats"),
    convertToLead: (type, id) => _req("POST", `/api/crm/from-${type}/${id}`),
    getCrmAgents: () => _req("GET", "/api/crm/agents"),
    // Messages / Conversations
    getConversations: (params) => _req("GET", "/api/messages/conversations" + (params ? "?" + new URLSearchParams(params) : "")),
    getConversation: (id) => _req("GET", `/api/messages/conversations/${id}`),
    getConversationMessages: (id, params) => _req("GET", `/api/messages/conversations/${id}/messages` + (params ? "?" + new URLSearchParams(params) : "")),
    sendMessage: (convId, content, contentType = "text", attachmentUrl = "", attachmentName = "") => _req("POST", `/api/messages/conversations/${convId}/messages`, { content, content_type: contentType, attachment_url: attachmentUrl, attachment_name: attachmentName }),
    markConversationRead: (id) => _req("POST", `/api/messages/conversations/${id}/mark-read`),
    updateConversationStatus: (id, status) => _req("PATCH", `/api/messages/conversations/${id}/status`, { status }),
    createConversation: (data) => _req("POST", "/api/messages/conversations", data),
    getConversationLinks: (id) => _req("GET", `/api/messages/conversations/${id}/links`),
    addConversationLink: (id, linkType, linkId) => _req("POST", `/api/messages/conversations/${id}/links`, { type: linkType, id: linkId }),
    removeConversationLink: (id, linkType, linkId) => _req("DELETE", `/api/messages/conversations/${id}/links/${linkType}/${linkId}`),
    // Requests / Solicitudes
    getRequests: (params) => _req("GET", "/api/requests" + (params ? "?" + new URLSearchParams(params) : "")),
    getRequest: (id) => _req("GET", `/api/requests/${id}`),
    getRequestStats: () => _req("GET", "/api/requests/stats"),
    createRequest: (data) => _req("POST", "/api/requests", data),
    updateRequest: (id, data) => _req("PATCH", `/api/requests/${id}`, data),
    addRequestComment: (id, content) => _req("POST", `/api/requests/${id}/comments`, { content }),
    convertRequestToLead: (id) => _req("POST", `/api/requests/${id}/convert-to-lead`),
    getRequestAgents: () => _req("GET", "/api/requests/agents"),
    // Portales Management
    getPortalKpis: () => _req("GET", "/api/portals/kpi"),
    getPortalPlatforms: () => _req("GET", "/api/portals/platforms"),
    getPortalAgents: () => _req("GET", "/api/portals/agents"),
    getPublicationsEnhanced: (params) => _req("GET", "/api/portals/publications/enhanced" + (params ? "?" + new URLSearchParams(params) : "")),
    getPublicationDetail: (id) => _req("GET", `/api/portals/publications/${id}`),
    publicationAction: (id, action) => _req("POST", `/api/portals/publications/${id}/action`, { action }),
    // Calendar / Agenda
    getCalendarKpi: () => _req("GET", "/api/calendar/kpi"),
    getCalendarEvents: (params) => _req("GET", "/api/calendar/events" + (params ? "?" + new URLSearchParams(params) : "")),
    getCalendarEvent: (id) => _req("GET", `/api/calendar/events/${id}`),
    createCalendarEvent: (data) => _req("POST", "/api/calendar/events", data),
    updateCalendarEvent: (id, data) => _req("PUT", `/api/calendar/events/${id}`, data),
    deleteCalendarEvent: (id) => _req("DELETE", `/api/calendar/events/${id}`),
    calendarEventAction: (id, action) => _req("POST", `/api/calendar/events/${id}/action`, { action }),
    addCalendarComment: (id, content) => _req("POST", `/api/calendar/events/${id}/comments`, { content }),
    getCalendarAgents: () => _req("GET", "/api/calendar/agents"),
    getCalendarProperties: () => _req("GET", "/api/calendar/properties"),
    getCalendarLeads: () => _req("GET", "/api/calendar/leads"),
    // Marketing
    getMarketingDashboard: () => _req("GET", "/api/marketing/dashboard"),
    getMarketingPosts: () => _req("GET", "/api/marketing/posts"),
    getMarketingPlatforms: () => _req("GET", "/api/marketing/platforms"),
    getMarketingCampaigns: () => _req("GET", "/api/marketing/campaigns"),
    createMarketingCampaign: (data) => _req("POST", "/api/marketing/campaigns", data),
    updateMarketingCampaign: (id, data) => _req("PUT", `/api/marketing/campaigns/${id}`, data),
    deleteMarketingCampaign: (id) => _req("DELETE", `/api/marketing/campaigns/${id}`),
    getMarketingCalendar: (params) => _req("GET", "/api/marketing/calendar" + (params ? "?" + new URLSearchParams(params) : "")),
    getMarketingMetrics: (days) => _req("GET", `/api/marketing/metrics${days ? "?days=" + days : ""}`),
    // Bajas de datos (Ley 25.326)
    sendBaja: (data) => _req("POST", "/api/baja", data),
    getBajas: (params) => _req("GET", "/api/baja" + (params ? "?" + new URLSearchParams(params) : "")),
    getBajaStats: () => _req("GET", "/api/baja/stats"),
    updateBaja: (id, data) => _req("PATCH", `/api/baja/${id}`, data),
    deleteBaja: (id) => _req("DELETE", `/api/baja/${id}`)
  };
  window.API = API;
  window.setCsrfToken = setCsrfToken;
  function proxyImgUrl(url) {
    if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url;
    if (url.startsWith(location.origin)) return url;
    if (url.includes("res.cloudinary.com")) return url;
    if (url.startsWith("/")) return url;
    return `${API_BASE}/api/proxy-image?url=` + encodeURIComponent(url);
  }
  function imgResponsive(url, widths = [400, 800, 1200]) {
    if (!url || !url.includes("res.cloudinary.com")) {
      return { src: proxyImgUrl(url) || "" };
    }
    const parts = url.split("/upload/");
    if (parts.length !== 2) return { src: url };
    const base = parts[0] + "/upload/";
    const path = parts[1].replace(/^v\d+\//, "");
    const srcset = widths.map((w) => `${base}w_${w},c_scale,f_auto,q_auto/${path} ${w}w`).join(", ");
    const src = `${base}w_${widths[widths.length - 1]},f_auto,q_auto/${path}`;
    return { src, srcset };
  }
  function imgAttrs(url, widths = [400, 800, 1200]) {
    const r = imgResponsive(url, widths);
    return r.srcset ? `src="${r.src}" srcset="${r.srcset}" sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, ${widths[widths.length - 1]}px"` : `src="${r.src}"`;
  }
  var _fmtArsRate = null;
  var _fmtArsPromise = null;
  async function _loadDolarRate() {
    if (_fmtArsRate !== null) return;
    if (_fmtArsPromise) return _fmtArsPromise;
    _fmtArsPromise = (async () => {
      try {
        const d = await _req("GET", "/api/dolar");
        _fmtArsRate = d.venta;
      } catch (e) {
        _fmtArsRate = 1200;
      }
    })();
    await _fmtArsPromise;
    _fmtArsPromise = null;
  }
  _loadDolarRate();
  setInterval(() => {
    _fmtArsRate = null;
    _loadDolarRate();
  }, 3e5);
  localStorage.removeItem("bienenhaus_theme");
  document.documentElement.removeAttribute("data-theme");
  window._props = [];
  window._rentals = [];
  var _agents = [];
  var _agentView = "cards";
  var _tab = "props";
  window._subTab = "venta";
  var _currentImages = [];
  var _page = 1;
  var _perPage = 12;
  var _rPage = 1;
  var _rPerPage = 12;
  var _selectedProps = /* @__PURE__ */ new Set();
  var _sortField = "created_at";
  var _sortOrder = "desc";
  var _searchQuery = "";
  var _filterType = "all";
  var _filterStatus = "all";
  var _filterBeds = "all";
  var _filterPriceMin = "";
  var _filterPriceMax = "";
  var AVATAR_BG = ["#0b131e", "#0b1a0d", "#1a0b0b", "#181808", "#0b1818"];
  var $ = (id) => document.getElementById(id);
  window.$ = $;
  function fmtPrice(n) {
    return `USD ${Number(n).toLocaleString("es-AR")}`;
  }
  function fmtAR(n) {
    return `ARS ${Number(n).toLocaleString("es-AR")}`;
  }
  function rentalStatusBadge(status) {
    const map = {
      disponible: ["status-disponible", "Disponible"],
      alquilada: ["status-vendida", "Alquilada"],
      oculta: ["status-oculta", "Oculta"],
      listo_para_publicar: ["admin-prop-featured", "A publicar"]
    };
    const [cls, label] = map[status] || map.disponible;
    return `<span class="admin-status-badge ${cls}">${label}</span>`;
  }
  function statusBadge(status) {
    const map = {
      disponible: ["status-disponible", "Disponible"],
      vendida: ["status-vendida", "Vendida"],
      oculta: ["status-oculta", "Oculta"],
      listo_para_publicar: ["admin-prop-featured", "A publicar"]
    };
    const [cls, label] = map[status] || map.disponible;
    return `<span class="admin-status-badge ${cls}">${label}</span>`;
  }
  function esc(v) {
    return String(v != null ? v : "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  var _currentUser = null;
  window._currentUser = null;
  function compressImage(file, maxDim = 1920, quality = 0.8) {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/") || file.type === "image/gif") {
        resolve(file);
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && file.size < 1024 * 1024) {
          resolve(file);
          return;
        }
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" }));
        }, "image/webp", quality);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }
  window.showChartTip = function(e, val, label) {
    const tip = $("chartTip");
    if (!tip) return;
    tip.innerHTML = `<span class="tt-label">${label}</span> <span class="tt-num">${Number(val).toLocaleString("es-AR")}</span>`;
    tip.classList.add("visible");
    const rect = tip.parentElement.getBoundingClientRect();
    const tipW = tip.offsetWidth;
    const x = Math.min(e.clientX - rect.left, rect.width - tipW - 8);
    const y = Math.max(e.clientY - rect.top - 36, 4);
    tip.style.left = Math.max(0, x) + "px";
    tip.style.top = y + "px";
  };
  window.hideChartTip = function() {
    const tip = $("chartTip");
    if (tip) tip.classList.remove("visible");
  };
  async function setPropStatus(id, status) {
    try {
      const updated = await API.setStatus(id, status);
      _props = _props.map((p) => p.id === id ? updated : p);
      renderProps();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function confirmDeleteProp(id) {
    const prop = _props.find((p) => p.id === id);
    if (!await confirmModal(`\xBFEliminar "${prop == null ? void 0 : prop.title}"?`)) return;
    try {
      await API.deleteProperty(id);
      _props = _props.filter((p) => p.id !== id);
      renderProps();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function confirmDeleteAgent(id) {
    const agent = _agents.find((a) => a.id === id);
    if (!await confirmModal(`\xBFEliminar a "${agent == null ? void 0 : agent.name} ${agent == null ? void 0 : agent.last}"?`)) return;
    try {
      await API.deleteAgent(id);
      _agents = _agents.filter((a) => a.id !== id);
      renderAgents();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function setRentalStatus(id, status) {
    try {
      const updated = await API.setRentalStatus(id, status);
      _rentals = _rentals.map((r) => r.id === id ? updated : r);
      renderRentals();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function confirmDeleteRental(id) {
    const rental = _rentals.find((r) => r.id === id);
    if (!await confirmModal(`\xBFEliminar "${rental == null ? void 0 : rental.title}"?`)) return;
    try {
      await API.deleteRental(id);
      _rentals = _rentals.filter((r) => r.id !== id);
      renderRentals();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function goToRentalPage(n) {
    _rPage = Math.max(1, n);
    renderRentals();
    const list = $("propsAdminList");
    if (list) list.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function switchTab(tab) {
    var _a, _b;
    _tab = tab;
    document.querySelectorAll(".admin-tab-content").forEach((el) => el.classList.add("hidden"));
    document.querySelectorAll(".sidebar-link[data-tab]").forEach((el) => el.classList.remove("active"));
    const sectionId = "tab" + tab.replace(/-([a-z])/g, (_, c2) => c2.toUpperCase()).replace(/^[a-z]/, (c2) => c2.toUpperCase());
    (_a = $(sectionId)) == null ? void 0 : _a.classList.remove("hidden");
    (_b = document.querySelector(`.sidebar-link[data-tab="${tab}"]`)) == null ? void 0 : _b.classList.add("active");
    const LOADERS = {
      dashboard: loadDashboard,
      props: renderSubTab,
      requests: loadRequests,
      agents: null,
      // agents tab is fully static HTML, no loader needed
      messages: loadMessages,
      "tasacion-requests": loadTasacionRequests,
      appraisals: loadAppraisals,
      tasaciones: loadTasaciones,
      crm: initCrm,
      calendar: loadCalendar,
      bajas: loadBajas,
      portals: loadPortals,
      marketing: loadMarketing,
      acm: loadAcm,
      users: renderRBAC,
      settings: renderSettings,
      security: null,
      activity: loadActivity
    };
    const fn = LOADERS[tab];
    if (tab === "security" && typeof window.renderSecurity === "function") {
      setTimeout(window.renderSecurity, 50);
    } else if (typeof fn === "function") {
      fn();
    }
  }
  function switchSubTab(subtab) {
    var _a;
    _subTab = subtab;
    _selectedProps.clear();
    _searchQuery = "";
    const inp = document.getElementById("propSearch");
    if (inp) inp.value = "";
    const clear = document.getElementById("propSearchClear");
    if (clear) clear.classList.add("hidden");
    const allCb = $("selectAllCheck");
    if (allCb) allCb.checked = false;
    _page = 1;
    _rPage = 1;
    document.querySelectorAll(".admin-subtab").forEach((el) => el.classList.remove("active"));
    (_a = document.querySelector(`.admin-subtab[data-subtab="${subtab}"]`)) == null ? void 0 : _a.classList.add("active");
    updateBatchBar();
    renderSubTab();
  }
  function renderSubTab() {
    if (_subTab === "venta") {
      renderProps();
      $("newPropBtn").innerHTML = "+ Nueva propiedad";
    } else {
      renderRentals();
      $("newPropBtn").innerHTML = "+ Nuevo alquiler";
    }
  }
  async function tryLogin() {
    const user = $("loginUser").value.trim();
    const pass = $("loginPass").value;
    const btn = $("doLogin");
    const err = $("loginError");
    err.classList.add("hidden");
    err.classList.remove("shake");
    if (!user || !pass) {
      err.textContent = "Usuario y contrase\xF1a requeridos.";
      err.classList.remove("hidden");
      err.classList.add("shake");
      setTimeout(() => err.classList.remove("shake"), 500);
      return;
    }
    btn.classList.add("login-btn--loading");
    try {
      const result = await API.login(user, pass);
      _currentUser = result.user;
      window._currentUser = _currentUser;
      await API.refreshCsrfToken();
      showPanel();
    } catch (e) {
      err.classList.remove("hidden");
      err.classList.add("shake");
      $("loginPass").focus();
      setTimeout(() => err.classList.remove("shake"), 500);
    } finally {
      btn.classList.remove("login-btn--loading");
    }
  }
  function goToPage(n) {
    _page = Math.max(1, n);
    renderProps();
    const list = $("propsAdminList");
    if (list) list.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function sortProps(field2) {
    if (_sortField === field2) _sortOrder = _sortOrder === "asc" ? "desc" : "asc";
    else {
      _sortField = field2;
      _sortOrder = field2 === "title" ? "asc" : "desc";
    }
    _page = 1;
    renderProps();
  }
  function exportCSV() {
    const items = _subTab === "rental" ? _rentals : _props;
    if (!items.length) {
      toast("No hay datos para exportar.", "warn");
      return;
    }
    const headers = ["ID", "T\xEDtulo", "Tipo", "Precio", "Ubicaci\xF3n", "Estado", "Dormitorios", "Ba\xF1os", "Superficie", "Visitas", "Destacada", "Creado"];
    const rows = items.map((p) => [
      p.id,
      p.title || "",
      p.type || "",
      p.price || 0,
      p.location || "",
      p.status || "",
      p.beds || 0,
      p.baths || 0,
      p.sqm || 0,
      p.views || 0,
      p.featured ? "S\xED" : "No",
      p.created_at ? new Date(p.created_at).toLocaleDateString() : ""
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bienenhaus_${_subTab}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("CSV exportado correctamente.", "success");
  }
  window.filterProps = function filterProps(q) {
    _searchQuery = q.trim().toLowerCase();
    _page = 1;
    _rPage = 1;
    const clear = document.getElementById("propSearchClear");
    if (clear) clear.classList.toggle("hidden", !_searchQuery);
    renderSubTab();
  };
  window.clearPropSearch = function clearPropSearch() {
    _searchQuery = "";
    const inp = document.getElementById("propSearch");
    if (inp) inp.value = "";
    const clear = document.getElementById("propSearchClear");
    if (clear) clear.classList.add("hidden");
    _page = 1;
    _rPage = 1;
    renderSubTab();
  };
  function readFilterValues() {
    var _a, _b, _c, _d, _e;
    _filterType = ((_a = $("filterType")) == null ? void 0 : _a.value) || "all";
    _filterStatus = ((_b = $("filterStatus")) == null ? void 0 : _b.value) || "all";
    _filterBeds = ((_c = $("filterBeds")) == null ? void 0 : _c.value) || "all";
    _filterPriceMin = ((_d = $("filterPriceMin")) == null ? void 0 : _d.value) || "";
    _filterPriceMax = ((_e = $("filterPriceMax")) == null ? void 0 : _e.value) || "";
  }
  window.applyAdminFilters = function applyAdminFilters() {
    readFilterValues();
    _page = 1;
    _rPage = 1;
    renderSubTab();
  };
  window.clearAdminFilters = function clearAdminFilters() {
    ["filterType", "filterStatus", "filterBeds"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "all";
    });
    ["filterPriceMin", "filterPriceMax"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });
    _filterType = "all";
    _filterStatus = "all";
    _filterBeds = "all";
    _filterPriceMin = "";
    _filterPriceMax = "";
    _page = 1;
    _rPage = 1;
    renderSubTab();
  };
  function matchFilters(item, isRental) {
    if (_filterType !== "all" && (item.type || "").toLowerCase() !== _filterType) return false;
    if (_filterStatus !== "all") {
      const s = (item.status || "").toLowerCase();
      if (s !== _filterStatus) return false;
    }
    if (_filterBeds !== "all") {
      const beds = Number(item.beds) || 0;
      if (_filterBeds === "4" ? beds < 4 : beds !== Number(_filterBeds)) return false;
    }
    const price = isRental ? Number(item.price_ars) || 0 : Number(item.price) || 0;
    if (_filterPriceMin !== "" && price < Number(_filterPriceMin)) return false;
    if (_filterPriceMax !== "" && price > Number(_filterPriceMax)) return false;
    return true;
  }
  function renderUserInfo() {
    if (!_currentUser) return;
    const nameEl = $("userBadgeName");
    const roleEl = $("userBadgeRole");
    const avatarEl = $("userBadgeAvatar");
    const bar = $("adminUserbar");
    if (bar) bar.classList.remove("hidden");
    if (nameEl) nameEl.textContent = _currentUser.username;
    if (roleEl) {
      roleEl.textContent = _currentUser.role;
      roleEl.className = "user-badge-role role-" + (_currentUser.role || "viewer");
    }
    if (avatarEl) {
      const initial = (_currentUser.username || "A")[0].toUpperCase();
      avatarEl.textContent = initial;
    }
  }
  async function showPanel() {
    var _a, _b;
    $("loginScreen").classList.add("hidden");
    $("adminScreen").classList.remove("hidden");
    document.querySelectorAll(".admin-tab-content").forEach((el) => el.classList.add("hidden"));
    document.querySelectorAll(".sidebar-link[data-tab]").forEach((el) => el.classList.remove("active"));
    (_a = $("tabDashboard")) == null ? void 0 : _a.classList.remove("hidden");
    (_b = document.querySelector('.sidebar-link[data-tab="dashboard"]')) == null ? void 0 : _b.classList.add("active");
    loadDashboard();
    renderUserInfo();
    const role = (_currentUser == null ? void 0 : _currentUser.role) || "viewer";
    document.querySelectorAll(".sidebar-link[data-role]").forEach((el) => {
      el.style.display = role === "admin" ? "" : "none";
    });
    if (role !== "admin") {
      const settingsLink = document.querySelector('.sidebar-link[data-tab="settings"]');
      if (settingsLink) settingsLink.style.display = "none";
    }
    try {
      const [propsResult, agentsResult, rentalsResult] = await Promise.all([
        API.getProperties({ admin: true }),
        API.getAgents(),
        API.getRentals({ admin: true })
      ]);
      _page = 1;
      _rPage = 1;
      _props = propsResult.properties;
      _agents = agentsResult;
      _rentals = rentalsResult.rentals || rentalsResult;
      renderProps();
      renderAgents();
      updateBatchBar();
    } catch (e) {
      console.warn("Error cargando datos:", e);
    }
    if (typeof startMsgPolling === "function") startMsgPolling();
  }
  function initUploader(existingImages = []) {
    _currentImages = [...existingImages];
    renderPreviews();
    const dropZone = $("dropZone");
    const fileInput = $("fileInput");
    const browseBtn = $("browseBtn");
    if (!dropZone) return;
    browseBtn.onclick = () => fileInput.click();
    dropZone.onclick = (e) => {
      if (["dropZone", "drop-zone-icon", "drop-zone-text"].some(
        (c2) => e.target.id === c2 || e.target.classList.contains(c2)
      )) fileInput.click();
    };
    fileInput.onchange = () => {
      if (fileInput.files.length) handleFiles(fileInput.files);
      fileInput.value = "";
    };
    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    };
    dropZone.ondragleave = () => dropZone.classList.remove("drag-over");
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    };
  }
  async function handleFiles(files) {
    var _a;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    const rawFiles = Array.from(files).filter((f) => validTypes.includes(f.type));
    if (!rawFiles.length) {
      showUploadError("Formato no v\xE1lido. Us\xE1 JPG, PNG, WEBP o GIF.");
      return;
    }
    setProgress(0, "Comprimiendo\u2026");
    const compressed = await Promise.all(rawFiles.map((f) => compressImage(f)));
    const localUrls = compressed.map((f) => URL.createObjectURL(f));
    _currentImages.push(...localUrls);
    renderPreviews();
    showProgress(true, 0);
    try {
      let prog = 0;
      const ticker = setInterval(() => {
        prog = Math.min(prog + 6, 80);
        setProgress(prog);
      }, 120);
      const result = await API.uploadImages(compressed);
      clearInterval(ticker);
      setProgress(100);
      localUrls.forEach((local, i) => {
        const idx = _currentImages.indexOf(local);
        if (idx !== -1 && result.urls[i]) {
          URL.revokeObjectURL(local);
          _currentImages[idx] = result.urls[i];
        }
      });
      if ((_a = result.errors) == null ? void 0 : _a.length) showUploadError("Algunos archivos fallaron: " + result.errors.join(" | "));
      setTimeout(() => showProgress(false), 600);
      renderPreviews();
    } catch (err) {
      showProgress(false);
      localUrls.forEach((u) => {
        const idx = _currentImages.indexOf(u);
        if (idx !== -1) _currentImages.splice(idx, 1);
        URL.revokeObjectURL(u);
      });
      renderPreviews();
      showUploadError("Error al subir: " + err.message);
    }
  }
  function renderPreviews() {
    const grid = $("imgPreviewGrid");
    if (!grid) return;
    if (!_currentImages.length) {
      grid.innerHTML = "";
      return;
    }
    grid.innerHTML = _currentImages.map((url, i) => `
    <div class="img-preview-item" draggable="true" data-index="${i}">
      <img src="${proxyImgUrl(url)}" alt="Imagen ${i + 1}" class="img-preview-thumb" loading="lazy"
           onerror="this.parentElement.style.background='#1c1c1c'"/>
      <div class="img-preview-overlay">
        <button type="button" class="img-preview-delete" onclick="removeImage(${i})">\xD7</button>
        <div class="img-preview-order">${i + 1}</div>
      </div>
      ${i === 0 ? '<div class="img-preview-main">Principal</div>' : ""}
    </div>`).join("");
    attachDragEvents(grid);
  }
  function attachDragEvents(grid) {
    let draggedEl = null;
    const items = grid.querySelectorAll(".img-preview-item");
    items.forEach((el) => {
      el.addEventListener("dragstart", (e) => {
        draggedEl = el;
        el.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", el.dataset.index);
      });
      el.addEventListener("dragend", () => {
        el.classList.remove("dragging");
        items.forEach((i) => i.classList.remove("drag-over"));
      });
      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        items.forEach((i) => i.classList.remove("drag-over"));
        el.classList.add("drag-over");
      });
      el.addEventListener("dragleave", () => el.classList.remove("drag-over"));
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("drag-over");
        if (!draggedEl || draggedEl === el) return;
        const from = parseInt(draggedEl.dataset.index);
        const to = parseInt(el.dataset.index);
        if (isNaN(from) || isNaN(to)) return;
        const [moved] = _currentImages.splice(from, 1);
        _currentImages.splice(to, 0, moved);
        renderPreviews();
      });
    });
  }
  async function removeImage(idx) {
    const url = _currentImages[idx];
    if (!url) {
      _currentImages.splice(idx, 1);
      renderPreviews();
      return;
    }
    if (!await confirmModal("\xBFEliminar esta imagen?")) return;
    if (url.startsWith("http")) {
      API.deleteImage(url).catch(() => {
      });
    } else if (url.startsWith("/static/uploads/")) {
      API.deleteImage(url.split("/").pop()).catch(() => {
      });
    }
    _currentImages.splice(idx, 1);
    renderPreviews();
  }
  function showProgress(show, pct = 0) {
    const bar = $("uploadProgress");
    if (!bar) return;
    show ? bar.classList.remove("hidden") : bar.classList.add("hidden");
    setProgress(pct);
  }
  function setProgress(pct, label) {
    const bar = $("uploadProgressBar");
    const text = $("uploadProgressText");
    if (bar) bar.style.width = `${pct}%`;
    if (text) text.textContent = label || (pct < 100 ? `Subiendo\u2026 ${pct}%` : "\xA1Listo!");
  }
  function showUploadError(msg) {
    const grid = $("imgPreviewGrid");
    if (!grid) return;
    const err = document.createElement("div");
    err.className = "upload-error";
    err.textContent = msg;
    grid.prepend(err);
    setTimeout(() => err.remove(), 5e3);
  }
  document.addEventListener("DOMContentLoaded", async () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
    $("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      tryLogin();
    });
    $("doLogin").addEventListener("click", tryLogin);
    try {
      const auth = await API.checkAuth();
      if (auth.admin) {
        _currentUser = auth.user;
        window._currentUser = _currentUser;
        await API.refreshCsrfToken();
        showPanel();
      }
    } catch (e) {
      console.warn("autoLogin fall\xF3");
    }
    $("doLogout").addEventListener("click", async () => {
      if (!await confirmModal("\xBFCerrar sesi\xF3n?")) return;
      stopMsgPolling();
      await API.logout();
      _currentUser = null;
      window._currentUser = null;
      $("adminScreen").classList.add("hidden");
      $("loginScreen").classList.remove("hidden");
      $("loginPass").value = "";
    });
    document.querySelectorAll(".sidebar-link[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
    document.querySelectorAll(".admin-subtab").forEach((btn) => {
      btn.addEventListener("click", () => switchSubTab(btn.dataset.subtab));
    });
    (_a = $("newPropBtn")) == null ? void 0 : _a.addEventListener("click", () => openPropForm(null));
    (_b = $("newAgentBtn")) == null ? void 0 : _b.addEventListener("click", () => openAgentForm(null));
    (_c = $("newUserBtn")) == null ? void 0 : _c.addEventListener("click", () => openUserForm(null));
    (_d = $("newPortalBtn")) == null ? void 0 : _d.addEventListener("click", () => openPortalForm(null));
    (_e = $("newAppraisalBtn")) == null ? void 0 : _e.addEventListener("click", () => openAppraisalForm(null));
    (_f = $("newTasacionBtn")) == null ? void 0 : _f.addEventListener("click", () => openTasacionForm(null));
    (_g = $("refreshMsgs")) == null ? void 0 : _g.addEventListener("click", loadMessages);
    (_h = $("refreshTasacionReqs")) == null ? void 0 : _h.addEventListener("click", loadTasacionRequests);
    (_i = $("refreshDashboard")) == null ? void 0 : _i.addEventListener("click", loadDashboard);
    (_j = $("refreshActivity")) == null ? void 0 : _j.addEventListener("click", loadActivity);
    $("closePropForm").addEventListener("click", closePropForm);
    $("closeAgentForm").addEventListener("click", closeAgentForm);
    $("closeUserForm").addEventListener("click", closeUserForm);
    $("closePortalForm").addEventListener("click", closePortalForm);
    $("closeAppraisalForm").addEventListener("click", closeAppraisalForm);
    (_k = $("closeTasacionForm")) == null ? void 0 : _k.addEventListener("click", closeTasacionForm);
    (_l = $("tasacionSearch")) == null ? void 0 : _l.addEventListener("input", filterTasaciones);
    (_m = $("tasacionFilter")) == null ? void 0 : _m.addEventListener("change", filterTasaciones);
    (_n = $("appraisalSearch")) == null ? void 0 : _n.addEventListener("input", filterAppraisals);
    (_o = $("appraisalFilter")) == null ? void 0 : _o.addEventListener("change", filterAppraisals);
    $("propFormModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closePropForm();
    });
    $("agentFormModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeAgentForm();
    });
    $("userFormModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeUserForm();
    });
    $("portalFormModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closePortalForm();
    });
    $("appraisalFormModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeAppraisalForm();
    });
    (_p = $("tasacionFormModal")) == null ? void 0 : _p.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeTasacionForm();
    });
    (_q = $("tasacionComparableFormModal")) == null ? void 0 : _q.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeTasacionComparableForm();
    });
    (_r = $("comparableFormModal")) == null ? void 0 : _r.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeComparableForm();
    });
    (_s = $("closeComparableBtn")) == null ? void 0 : _s.addEventListener("click", closeComparableForm);
    (_t = $("closePortalLogsBtn")) == null ? void 0 : _t.addEventListener("click", closePortalLogsModal);
    (_u = $("closePropPreview")) == null ? void 0 : _u.addEventListener("click", closePropPreview);
    (_v = $("propPreviewModal")) == null ? void 0 : _v.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closePropPreview();
    });
  });
  function openPropPreview(id) {
    var _a;
    const p = (_props || []).find((x) => x.id === id) || (_rentals || []).find((x) => x.id === id);
    if (!p) {
      toast("Propiedad no encontrada.", "warn");
      return;
    }
    const isRental = !!p.min_months;
    const thumb = (_a = p.images) == null ? void 0 : _a[0];
    const thumbHtml = thumb ? `<img src="${proxyImgUrl(thumb)}" alt="" class="pp-thumb-img"/>` : `<div class="pp-thumb-placeholder">\u{1F3E0}</div>`;
    $("propPreviewTitle").textContent = isRental ? "Alquiler" : "Propiedad";
    $("propPreviewContent").innerHTML = `
    <div class="pp-thumb-wrap">${thumbHtml}</div>
    <div class="pp-detail-grid">
      <div class="acm-field"><span class="acm-field-label">T\xEDtulo</span><div class="acm-field-value">${esc(p.title || "\u2014")}</div></div>
      <div class="acm-field"><span class="acm-field-label">Precio</span><div class="acm-field-value pp-price-value">${fmtPrice(p.price)}</div></div>
      <div class="acm-field"><span class="acm-field-label">Ubicaci\xF3n</span><div class="acm-field-value">${esc(p.location || "\u2014")}</div></div>
      <div class="acm-field"><span class="acm-field-label">Estado</span><div class="acm-field-value">${isRental ? rentalStatusBadge(p.status) : statusBadge(p.status)}</div></div>
      ${p.beds ? `<div class="acm-field"><span class="acm-field-label">Dormitorios</span><div class="acm-field-value">${p.beds}</div></div>` : ""}
      ${p.baths ? `<div class="acm-field"><span class="acm-field-label">Ba\xF1os</span><div class="acm-field-value">${p.baths}</div></div>` : ""}
      ${p.sqm ? `<div class="acm-field"><span class="acm-field-label">Superficie</span><div class="acm-field-value">${p.sqm} m\xB2</div></div>` : ""}
      ${p.expenses ? `<div class="acm-field"><span class="acm-field-label">Expensas</span><div class="acm-field-value">${fmtPrice(p.expenses)}</div></div>` : ""}
      ${p.min_months ? `<div class="acm-field"><span class="acm-field-label">M\xEDn. meses</span><div class="acm-field-value">${p.min_months}</div></div>` : ""}
    </div>
    ${p.desc ? `<div class="pp-desc-section"><span class="acm-field-label pp-desc-label">Descripci\xF3n</span><div class="acm-field-value pp-desc-text">${esc(p.desc)}</div></div>` : ""}
    <div class="pp-modal-actions">
      <button class="btn btn-primary pp-modal-btn" onclick="closePropPreview();openPropForm(${p.id})">Editar propiedad</button>
      <button class="btn btn-ghost pp-modal-btn" onclick="closePropPreview()">Cerrar</button>
    </div>`;
    $("propPreviewModal").classList.remove("hidden");
  }
  function closePropPreview() {
    $("propPreviewModal").classList.add("hidden");
  }
  function toggleSelect(id, el) {
    if (_selectedProps.has(id)) {
      _selectedProps.delete(id);
      el.classList.remove("checked");
    } else {
      _selectedProps.add(id);
      el.classList.add("checked");
    }
    updateBatchBar();
  }
  function toggleSelectAll(checked) {
    const items = _subTab === "rental" ? _rentals : _props;
    const start = (_page - 1) * _perPage;
    const page = items.slice(start, start + _perPage);
    _selectedProps.clear();
    if (checked) page.forEach((p) => _selectedProps.add(p.id));
    renderProps();
    updateBatchBar();
  }
  function clearSelection() {
    _selectedProps.clear();
    const allCb = $("selectAllCheck");
    if (allCb) allCb.checked = false;
    renderProps();
    updateBatchBar();
  }
  function updateBatchBar() {
    const bar = $("batchBar");
    const cnt = $("batchCount");
    const n = _selectedProps.size;
    if (!bar || !cnt) return;
    if (n > 0) {
      bar.classList.remove("hidden");
      cnt.textContent = n + " seleccionada" + (n !== 1 ? "s" : "");
    } else {
      bar.classList.add("hidden");
    }
  }
  async function batchSetStatus(status) {
    const ids = [..._selectedProps];
    if (!ids.length) return;
    if (!await confirmModal(`\xBFCambiar estado a "${status}" en ${ids.length} propiedad${ids.length !== 1 ? "es" : ""}?`)) return;
    try {
      const results = await Promise.allSettled(ids.map((id) => API.setStatus(id, status)));
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.filter((r) => r.status === "rejected").length;
      _selectedProps.clear();
      const data = await API.getProperties({ admin: true });
      _props = data.properties;
      renderProps();
      updateBatchBar();
      toast(`${ok} actualizada${ok !== 1 ? "s" : ""}${fail ? ", " + fail + " error" + (fail !== 1 ? "es" : "") : ""}`, fail ? "warn" : "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function batchDelete() {
    const ids = [..._selectedProps];
    if (!ids.length) return;
    if (!await confirmModal(`\xBFEliminar ${ids.length} propiedad${ids.length !== 1 ? "es" : ""} permanentemente?`)) return;
    try {
      const results = await Promise.allSettled(ids.map((id) => API.deleteProperty(id)));
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.filter((r) => r.status === "rejected").length;
      _selectedProps.clear();
      const data = await API.getProperties({ admin: true });
      _props = data.properties;
      renderProps();
      updateBatchBar();
      toast(`${ok} eliminada${ok !== 1 ? "s" : ""}${fail ? ", " + fail + " error" + (fail !== 1 ? "es" : "") : ""}`, fail ? "warn" : "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  window.loadActivity = async function loadActivity2() {
    const list = $("activityList");
    if (!list) return;
    list.innerHTML = '<div class="loading-state">Cargando actividad...</div>';
    try {
      const res = await fetch("/api/activity", { credentials: "same-origin" });
      const json = await res.json();
      if (!json.ok) {
        list.innerHTML = '<div class="loading-state"></div>';
        list.firstChild.textContent = "Error: " + (json.error || "");
        return;
      }
      const items = json.data.items;
      if (!items.length) {
        list.innerHTML = '<div class="loading-state">Sin actividad registrada.</div>';
        return;
      }
      list.innerHTML = items.map((a) => {
        const time = a.created_at ? (/* @__PURE__ */ new Date(a.created_at + "Z")).toLocaleString("es-AR") : "";
        const icon = a.action === "created" ? "\u2795" : a.action === "deleted" ? "\u{1F5D1}" : "\u270F\uFE0F";
        const color = a.action === "created" ? "#4caf80" : a.action === "deleted" ? "#cc4444" : "var(--accent)";
        const entity = { property: "Propiedad", rental: "Alquiler", agent: "Agente" }[a.entity_type] || a.entity_type;
        return `<div class="activity-item">
        <span class="act-icon" style="color:${color}">${icon}</span>
        <div class="act-content">
          <div class="act-title">${esc(a.user_name || "An\xF3nimo")} <span class="act-verb">${a.action === "created" ? "cre\xF3" : a.action === "deleted" ? "elimin\xF3" : "modific\xF3"}</span> ${esc(entity)}: <strong>${esc(a.entity_title || "\u2014")}</strong></div>
          ${a.details ? `<div class="act-details">${esc(a.details)}</div>` : ""}
        </div>
        <span class="act-time">${time}</span>
      </div>`;
      }).join("");
    } catch (e) {
      list.innerHTML = `<div class="loading-state">Error al cargar actividad.</div>`;
    }
    const errSection = $("clientErrorsSection");
    if (!errSection) return;
    errSection.innerHTML = '<div class="loading-state">Cargando errores...</div>';
    try {
      const res = await fetch("/api/client-errors?per_page=15", { credentials: "same-origin" });
      const json = await res.json();
      if (!json.ok) {
        errSection.innerHTML = "";
        return;
      }
      const errors = json.data || [];
      if (!errors.length) {
        errSection.innerHTML = "";
        return;
      }
      const badge = `<span style="background:var(--danger,#cc4444);color:#fff;border-radius:10px;padding:1px 7px;font-size:0.75rem;margin-left:6px">${errors.length}</span>`;
      errSection.innerHTML = `<div style="margin-bottom:.5rem;font-weight:600;font-size:.95rem">Errores del Frontend${badge}</div>` + errors.map((e) => {
        const time = e.created_at ? (/* @__PURE__ */ new Date(e.created_at + "Z")).toLocaleString("es-AR") : "";
        const shortMsg = (e.message || e.error || "Error").substring(0, 120);
        const src = e.source ? `${e.source}:${e.lineno}:${e.colno}` : "";
        return `<div class="activity-item">
          <span class="act-icon" style="color:#cc4444">\u26A0</span>
          <div class="act-content">
            <div class="act-title">${esc(shortMsg)}</div>
            ${src ? `<div class="act-details">${esc(src)}${e.url ? " \u2014 " + esc(e.url) : ""}</div>` : ""}
          </div>
          <span class="act-time">${time}</span>
        </div>`;
      }).join("");
    } catch (e) {
      errSection.innerHTML = "";
    }
  };
  window.openPropForm = openPropForm;
  window.openAgentForm = openAgentForm;
  window.closePropForm = closePropForm;
  window.closeAgentForm = closeAgentForm;
  window.setPropStatus = setPropStatus;
  window.confirmDeleteProp = confirmDeleteProp;
  window.confirmDeleteAgent = confirmDeleteAgent;
  window.setRentalStatus = setRentalStatus;
  window.confirmDeleteRental = confirmDeleteRental;
  window.goToRentalPage = goToRentalPage;
  window.removeImage = removeImage;
  window.loadDashboard = loadDashboard;
  window.renderSettings = renderSettings;
  window.renderRBAC = renderRBAC;
  window.loadTasaciones = loadTasaciones;
  window.loadTasacionRequests = loadTasacionRequests;
  window.updateTasacionStatus = updateTasacionStatus;
  window.deleteTasacionRequest = deleteTasacionRequest;
  window.goToPage = goToPage;
  window.openPropPreview = openPropPreview;
  window.closePropPreview = closePropPreview;
  window.toggleSelect = toggleSelect;
  window.toggleSelectAll = toggleSelectAll;
  window.clearSelection = clearSelection;
  window.batchSetStatus = batchSetStatus;
  window.batchDelete = batchDelete;
  window.updateBatchBar = updateBatchBar;
  window.sortProps = sortProps;
  window.exportCSV = exportCSV;
  var _lastClientError = 0;
  function _reportClientError(msg, source, lineno, colno, error, url) {
    var now = Date.now();
    if (now - _lastClientError < 5e3) return;
    _lastClientError = now;
    var payload = {
      message: msg,
      source: source || "",
      lineno: lineno || 0,
      colno: colno || 0,
      error: error ? error.message || error.toString ? error.toString() : String(error) : "",
      url: url || location.href,
      userAgent: navigator.userAgent,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit"
    }).catch(function() {
    });
  }
  window.onerror = function(msg, source, lineno, colno, error) {
    _reportClientError(msg, source, lineno, colno, error);
  };
  window.addEventListener("unhandledrejection", function(e) {
    var reason = e.reason;
    var msg = reason ? reason.message || String(reason) : "Unhandled Promise rejection";
    _reportClientError(msg, "", 0, 0, reason);
  });
  var homeIconR = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  var locSvg = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  var bedSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 012 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>';
  var bathSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3v2.25"/><path d="M4 21l1-1.5"/><path d="M20 21l-1-1.5"/></svg>';
  var sqmSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>';
  function renderProps() {
    const list = $("propsAdminList");
    $("sidebarPropCount").textContent = _props.length;
    const q = _searchQuery;
    readFilterValues();
    let filtered = _props.filter((p) => {
      if (q && !(p.title || "").toLowerCase().includes(q) && !(p.location || "").toLowerCase().includes(q)) return false;
      return matchFilters(p, false);
    });
    const totalPages = Math.ceil(filtered.length / _perPage) || 1;
    if (_page > totalPages) _page = totalPages;
    const sorted = [...filtered].sort((a, b) => {
      let va = a[_sortField], vb = b[_sortField];
      if (_sortField === "price") {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      } else if (_sortField === "title") {
        va = (va || "").toLowerCase();
        vb = (vb || "").toLowerCase();
      } else {
        va = va || "";
        vb = vb || "";
      }
      if (va < vb) return _sortOrder === "asc" ? -1 : 1;
      if (va > vb) return _sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    const start = (_page - 1) * _perPage;
    const end = Math.min(start + _perPage, sorted.length);
    const pageItems = sorted.slice(start, end);
    $("propSubtitle").textContent = `${filtered.length} ${filtered.length === 1 ? "propiedad" : "propiedades"}${q ? " filtradas" : ""} \u2014 P\xE1g. ${_page}/${totalPages}`;
    if (!filtered.length) {
      list.innerHTML = '<div class="loading-state"></div>';
      list.firstChild.textContent = q ? 'Sin resultados para "' + q + '".' : "No hay propiedades. Cre\xE1 la primera con el bot\xF3n de arriba.";
      return;
    }
    const homeIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
    list.style.display = "";
    list.className = "prop-grid";
    list.innerHTML = "";
    document.querySelectorAll("#sortBar").forEach((el) => el.remove());
    const sorters = [
      { field: "created_at", label: "Fecha" },
      { field: "price", label: "Precio" },
      { field: "title", label: "Nombre" }
    ];
    list.insertAdjacentHTML("beforebegin", `<div class="sort-bar" id="sortBar">
    <span class="sort-bar-label">Ordenar</span>
    ${sorters.map((s) => `<button class="sort-btn${_sortField === s.field ? " sort-btn--active" : ""}" data-action="sortProps" data-field="${s.field}" data-field="${s.field}">
      ${s.label} ${_sortField === s.field ? _sortOrder === "asc" ? "\u2191" : "\u2193" : ""}
    </button>`).join("")}
    <span class="sort-bar-count">${_props.length} ${_props.length === 1 ? "propiedad" : "propiedades"}</span>
  </div>`);
    list.innerHTML = pageItems.map((p) => {
      var _a;
      const thumb = (_a = p.images) == null ? void 0 : _a[0];
      const thumbHtml = thumb ? `<img class="prop-card-thumb" ${imgAttrs(thumb, [400, 800])} alt="" loading="lazy"/>` : `<div class="prop-card-thumb--empty">${homeIcon}</div>`;
      const specs = [];
      if (p.beds) specs.push(`<div class="prop-card-spec">${bedSvg} ${p.beds}</div>`);
      if (p.baths) specs.push(`<div class="prop-card-spec">${bathSvg} ${p.baths}</div>`);
      if (p.sqm) specs.push(`<div class="prop-card-spec">${sqmSvg} ${p.sqm} m\xB2</div>`);
      return `
      <div class="prop-card" data-id="${p.id}">
        <div class="prop-card-check${_selectedProps.has(p.id) ? " checked" : ""}" data-action="toggleSelect" data-pid="${p.id}">
          <input type="checkbox" ${_selectedProps.has(p.id) ? "checked" : ""}/>
        </div>
        ${thumbHtml}
        <div class="prop-card-body">
          <div class="prop-card-title">${p.title}</div>
          <div class="prop-card-loc">${locSvg} ${p.location || "Sin ubicaci\xF3n"}</div>
          <div class="prop-card-price">${fmtPrice(p.price)}</div>

          ${specs.length ? `<div class="prop-card-specs">${specs.join("")}</div>` : ""}

          <div class="prop-card-badges">
            ${statusBadge(p.status)}
            ${p.featured ? '<span class="admin-status-badge admin-prop-featured">\u2605 Destacada</span>' : ""}
          </div>

          <div class="prop-card-actions">
            <button class="btn btn-ghost btn-icon" data-action="openPropPreview" data-pid="${p.id}" title="Vista r\xE1pida">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn btn-ghost" data-action="openPropForm" data-id="${p.id}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button class="btn btn-ghost btn-sm" data-action="descargarFolleto" data-id="${p.id}" title="Descargar folleto PDF">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              PDF
            </button>
            ${p.status !== "disponible" ? `<button class="btn btn-success btn-icon" data-action="setPropStatus" data-pid="${p.id}" data-status="disponible" title="Disponible">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                 </button>` : ""}
            ${p.status !== "vendida" ? `<button class="btn btn-warn btn-icon" data-action="setPropStatus" data-pid="${p.id}" data-status="vendida" title="Vendida">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                 </button>` : ""}
            ${p.status !== "oculta" ? `<button class="btn btn-ghost btn-icon" data-action="setPropStatus" data-pid="${p.id}" data-status="oculta" title="Ocultar">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                 </button>` : ""}
            <button class="btn btn-danger btn-icon" data-action="confirmDeleteProp" data-pid="${p.id}" title="Eliminar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>`;
    }).join("") + paginationHTML(totalPages);
  }
  function paginationHTML(totalPages) {
    if (totalPages <= 1) return "";
    const prevDisabled = _page <= 1;
    const nextDisabled = _page >= totalPages;
    const maxVisible = 7;
    let pages = [];
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let left = Math.max(2, _page - 2);
      let right = Math.min(totalPages - 1, _page + 2);
      if (left > 2) pages.push("\u2026");
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 1) pages.push("\u2026");
      pages.push(totalPages);
    }
    const pageBtns = pages.map(
      (p) => p === "\u2026" ? `<span class="page-dots">\u2026</span>` : `<button type="button" class="page-btn${p === _page ? " page-btn--active" : ""}"
                 data-action="goToPage" data-page="${p}">${p}</button>`
    ).join("");
    return `
    <div class="pagination">
      <button type="button" class="page-btn page-btn--nav" data-action="goToPage" data-page="${_page - 1}"
              ${prevDisabled ? "disabled" : ""}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Anterior
      </button>
      <div class="page-numbers">${pageBtns}</div>
      <button type="button" class="page-btn page-btn--nav" data-action="goToPage" data-page="${_page + 1}"
              ${nextDisabled ? "disabled" : ""}>
        Siguiente
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>`;
  }
  function openPropForm(id) {
    const isRental = _subTab === "alquiler";
    const items = isRental ? _rentals : _props;
    const item = id ? items.find((p) => p.id === id) : null;
    const typeLabel = isRental ? "Alquiler" : "Propiedad";
    $("propFormTitle").textContent = item ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`;
    const v = (field2) => {
      var _a;
      return item != null ? (_a = item[field2]) != null ? _a : "" : "";
    };
    const statusOpts = isRental ? ["disponible", "alquilada", "oculta"] : ["disponible", "vendida", "oculta"];
    const priceFields = isRental ? `<div class="field"><label class="field-label">Precio ARS/mes</label>
        <input id="rf_price_ars" class="field-input" type="number" value="${v("price_ars")}" min="0" step="0.01"/></div>
       <div class="field"><label class="field-label">Expensas ARS</label>
        <input id="rf_expenses" class="field-input" type="number" value="${v("expenses")}" min="0"/></div>` : `<div class="field"><label class="field-label">Precio USD</label>
        <input id="pf_price" class="field-input" type="number" value="${v("price")}" min="0" step="0.01"/></div>`;
    const rentalExtras = isRental ? `<div class="pf-row-3">
         <div class="field"><label class="field-label">Min. meses</label>
          <input id="rf_min_months" class="field-input" type="number" value="${v("min_months")}" min="0"/></div>
         <div class="field crud-field-bottom" >
          <label class="acm-chip">
            <input type="checkbox" class="acm-chip-input" id="rf_furnished" ${(item == null ? void 0 : item.furnished) ? "checked" : ""}/>
            <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Amoblado</span></span>
          </label>
         </div>
       </div>` : "";
    const featuredLabel = isRental ? "\u2605 Alquiler destacado" : "\u2605 Propiedad destacada";
    $("propFormContent").innerHTML = `
    <div class="pf-body">
      <div>
        <p class="af-section-label">Informaci\xF3n b\xE1sica</p>
        <div class="field">
          <label class="field-label">T\xEDtulo *</label>
          <input id="pf_title" class="field-input" value="${v("title")}" placeholder="Nombre"/>
        </div>
        <div class="pf-row-2">
          <div class="field"><label class="field-label">Tipo</label>
            <select id="pf_type" class="field-input field-input--select">
              ${["casa", "departamento", "finca", "terreno", "local", "otro"].map(
      (t) => `<option value="${t}"${v("type") === t ? " selected" : ""}>${t[0].toUpperCase() + t.slice(1)}</option>`
    ).join("")}
            </select>
          </div>
          <div class="field"><label class="field-label">Estado</label>
            <select id="pf_status" class="field-input field-input--select">
              ${statusOpts.map(
      (s) => `<option value="${s}"${v("status") === s ? " selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`
    ).join("")}
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Ubicaci\xF3n</label>
          <input id="pf_location" class="field-input" value="${v("location")}" placeholder="Ciudad, Provincia"/>
        </div>
      </div>

      <hr class="af-divider"/>

      <div>
        <p class="af-section-label">Precio y dimensiones</p>
        <div class="pf-row-4">
          ${priceFields}
          <div class="field"><label class="field-label">Dormitorios</label>
            <input id="pf_beds"  class="field-input" type="number" value="${v("beds")}"  min="0"/></div>
          <div class="field"><label class="field-label">Ba\xF1os</label>
            <input id="pf_baths" class="field-input" type="number" value="${v("baths")}" min="0"/></div>
          <div class="field"><label class="field-label">m\xB2 cubiertos</label>
            <input id="pf_sqm"   class="field-input" type="number" value="${v("sqm")}"   min="0" step="0.1"/></div>
        </div>
        ${rentalExtras}
      </div>

      <hr class="af-divider"/>

      <div>
        <p class="af-section-label">Descripci\xF3n</p>
        <div class="field">
          <textarea id="pf_desc" class="field-input" rows="4" placeholder="Describ\xED...">${esc(v("desc"))}</textarea>
        </div>
      </div>

      <hr class="af-divider"/>

      <div>
        <p class="af-section-label">Video (opcional)</p>
        <div class="field">
          <input id="pf_video_url" class="field-input" value="${v("video_url") || ""}" placeholder="https://www.youtube.com/watch?v=..."/>
        </div>
      </div>

      <hr class="af-divider"/>

      <div>
        <p class="af-section-label">Im\xE1genes</p>
        <div id="dropZone" class="drop-zone">
          <input type="file" id="fileInput"
                 accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                 multiple class="crud-hidden-input"/>
          <div class="drop-zone-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div class="drop-zone-text">Arrastr\xE1 im\xE1genes aqu\xED o</div>
          <button type="button" class="btn btn-outline btn-sm" id="browseBtn">
            Seleccionar archivos
          </button>
          <div class="drop-zone-hint">JPG \xB7 PNG \xB7 WEBP \xB7 GIF \u2014 m\xE1x. 8 MB por foto</div>
        </div>
        <div id="uploadProgress" class="upload-progress hidden">
          <div class="upload-progress-bar" id="uploadProgressBar"></div>
          <span id="uploadProgressText" class="upload-progress-text">Subiendo...</span>
        </div>
        <div id="imgPreviewGrid" class="img-preview-grid"></div>
      </div>

      <hr class="af-divider"/>

      <label class="acm-chip">
        <input type="checkbox" class="acm-chip-input" id="pf_featured" ${(item == null ? void 0 : item.featured) ? "checked" : ""}/>
        <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">${featuredLabel}</span></span>
      </label>

      <div class="pf-actions">
        <button class="btn btn-primary btn-full" id="savePropBtn">
          ${item ? "Guardar cambios" : `Crear ${typeLabel.toLowerCase()}`}
        </button>
        <button class="btn btn-ghost" data-action="closePropForm">Cancelar</button>
      </div>
    </div>`;
    initUploader((item == null ? void 0 : item.images) || []);
    $("propFormModal").classList.remove("hidden");
    $("savePropBtn").onclick = () => savePropForm(id || null);
  }
  function closePropForm() {
    $("propFormModal").classList.add("hidden");
  }
  async function savePropForm(id) {
    var _a, _b, _c, _d, _e;
    const title = (_a = $("pf_title")) == null ? void 0 : _a.value.trim();
    if (!title) {
      toast("El t\xEDtulo es obligatorio.", "warn");
      (_b = $("pf_title")) == null ? void 0 : _b.focus();
      return;
    }
    const isRental = _subTab === "alquiler";
    const priceEl = isRental ? $("rf_price_ars") : $("pf_price");
    const price = priceEl ? parseFloat(priceEl.value) : 0;
    if (price <= 0) {
      toast("El precio debe ser mayor a cero.", "warn");
      priceEl == null ? void 0 : priceEl.focus();
      return;
    }
    const location2 = (_c = $("pf_location")) == null ? void 0 : _c.value.trim();
    if (!location2) {
      toast("La ubicaci\xF3n es obligatoria.", "warn");
      (_d = $("pf_location")) == null ? void 0 : _d.focus();
      return;
    }
    const baseData = {
      title,
      type: $("pf_type").value,
      status: $("pf_status").value,
      location: $("pf_location").value.trim(),
      beds: $("pf_beds").value,
      baths: $("pf_baths").value,
      sqm: $("pf_sqm").value,
      desc: $("pf_desc").value.trim(),
      images: _currentImages.filter((u) => !u.startsWith("blob:")),
      video_url: ((_e = $("pf_video_url")) == null ? void 0 : _e.value.trim()) || "",
      featured: $("pf_featured").checked
    };
    const data = isRental ? __spreadProps(__spreadValues({}, baseData), { price_ars: $("rf_price_ars").value, expenses: $("rf_expenses").value, min_months: $("rf_min_months").value, furnished: $("rf_furnished").checked }) : __spreadProps(__spreadValues({}, baseData), { price: $("pf_price").value });
    try {
      let saved;
      if (id) {
        saved = isRental ? await API.updateRental(id, data) : await API.updateProperty(id, data);
        if (isRental) _rentals = _rentals.map((r) => r.id === id ? saved : r);
        else _props = _props.map((p) => p.id === id ? saved : p);
      } else {
        saved = isRental ? await API.createRental(data) : await API.createProperty(data);
        if (isRental) {
          _rentals.unshift(saved);
          _rPage = 1;
        } else {
          _props.unshift(saved);
          _page = 1;
        }
      }
      if (!id) showPublishStep(saved, isRental);
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function showPublishStep(item, isRental) {
    const typeLabel = isRental ? "Alquiler" : "Propiedad";
    $("propFormTitle").textContent = `Paso 2 \u2014 Publicar ${typeLabel}`;
    const defaultContent = item.title + "\n" + (item.desc || "").slice(0, 200);
    $("propFormContent").innerHTML = `
    <div class="ps-body">
      <div class="ps-progress"><span class="ps-dot done">&#10003;</span><span class="ps-line"></span><span class="ps-dot active">2</span></div>
      <p class="ps-sub">La ${typeLabel.toLowerCase()} se guard\xF3 correctamente. Eleg\xED d&oacute;nde publicarla:</p>

      <div class="ps-section">
        <p class="ps-section-label">\u{1F4E1} Portales</p>
        <label class="acm-chip"><input type="checkbox" class="acm-chip-input" id="psPortalAll" checked/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Seleccionar todos</span></span></label>
        <div id="psPortalList" class="ps-list"></div>
      </div>

      ${isRental ? "" : `
      <div class="ps-section">
        <p class="ps-section-label">\u{1F4F1} Redes sociales</p>
        <label class="acm-chip"><input type="checkbox" class="acm-chip-input" id="psSocialAll" checked/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Seleccionar todas</span></span></label>
        <div id="psSocialList" class="ps-list"></div>
        <div class="field crud-mt12" >
          <label class="field-label crud-label-post">Texto del post</label>
          <textarea id="psSocialContent" class="field-input crud-resize-v" rows="3">${esc(defaultContent)}</textarea>
        </div>
      </div>`}

      <div id="psEmptyMsg" class="ps-empty crud-empty-msg" >
        No hay portales activos ni cuentas de redes vinculadas.
      </div>

      <div class="pf-actions crud-mt15" >
        <button class="btn btn-primary btn-full" id="psPublishBtn">Publicar ahora</button>
        <button class="btn btn-ghost" id="psSkipBtn">Omitir \u2014 cerrar</button>
      </div>
    </div>`;
    const activePortals = _portals.filter((p) => p.active);
    const portalList = $("psPortalList");
    if (activePortals.length) {
      portalList.innerHTML = activePortals.map(
        (p) => `<label class="acm-chip"><input type="checkbox" class="acm-chip-input ps-portal" value="${p.id}" checked/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">${esc(p.name)}</span></span></label>`
      ).join("");
    } else {
      portalList.innerHTML = '<div class="ps-empty">No hay portales activos.</div>';
    }
    let hasSocial = false;
    if (!isRental) _socialReq("GET", "/api/social/accounts").then((res) => {
      const accounts = (res.data || []).filter((a) => a.active);
      const socialList = $("psSocialList");
      if (accounts.length) {
        hasSocial = true;
        socialList.innerHTML = accounts.map(
          (a) => `<label class="acm-chip"><input type="checkbox" class="acm-chip-input ps-social" value="${a.id}" checked/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">${esc(a.platform)} \xB7 ${esc(a.label || a.platform)}</span></span></label>`
        ).join("");
      } else {
        socialList.innerHTML = '<div class="ps-empty">No hay cuentas de redes activas.</div>';
      }
      _checkEmpty(activePortals.length, hasSocial);
    });
    else _checkEmpty(activePortals.length, false);
    $("psPublishBtn").onclick = () => executePublish(item, isRental);
    $("psSkipBtn").onclick = () => {
      renderSubTab();
      closePropForm();
    };
    const $portalAll = $("psPortalAll");
    const $socialAll = $("psSocialAll");
    if ($portalAll) $portalAll.addEventListener("change", function() {
      document.querySelectorAll(".ps-portal").forEach((cb) => cb.checked = this.checked);
    });
    if ($socialAll && !isRental) $socialAll.addEventListener("change", function() {
      document.querySelectorAll(".ps-social").forEach((cb) => cb.checked = this.checked);
    });
  }
  function _checkEmpty(hasPortal, hasSocial) {
    const btn = $("psPublishBtn");
    const msg = $("psEmptyMsg");
    if (!hasPortal && !hasSocial) {
      if (btn) btn.style.display = "none";
      if (msg) msg.style.display = "";
    } else {
      if (btn) btn.style.display = "";
      if (msg) msg.style.display = "none";
    }
  }
  async function executePublish(item, isRental) {
    var _a;
    const btn = $("psPublishBtn");
    btn.disabled = true;
    btn.textContent = "Publicando...";
    const portalIds = [...document.querySelectorAll(".ps-portal:checked")].map((cb) => cb.value);
    const socialIds = [...document.querySelectorAll(".ps-social:checked")].map((cb) => cb.value);
    const propId = item.id;
    const portalNames = {};
    _portals.forEach((p) => {
      portalNames[p.id] = p.name;
    });
    let ok = 0, err = 0;
    const errors = [];
    for (const pid of portalIds) {
      try {
        await API.enqueuePortal({
          action: "publish",
          property_id: isRental ? null : propId,
          rental_id: isRental ? propId : null,
          portal_id: parseInt(pid)
        });
        ok++;
      } catch (e) {
        err++;
        errors.push(portalNames[pid] || `Portal #${pid}`);
      }
    }
    const socialContent = (((_a = $("psSocialContent")) == null ? void 0 : _a.value) || item.title).trim();
    for (const aid of socialIds) {
      try {
        await _socialReq("POST", "/api/social/posts", {
          account_id: parseInt(aid),
          property_id: isRental ? null : propId,
          content: socialContent,
          media_urls: JSON.stringify((item.images || []).slice(0, 10))
        });
        ok++;
      } catch (e) {
        err++;
        errors.push(`Social #${aid}`);
      }
    }
    if (err) {
      toast(`${ok} publicadas, ${err} con error:
${errors.join(", ")}`, "warn");
    } else {
      toast(`${ok} publicaciones realizadas`, "ok");
    }
    renderSubTab();
    closePropForm();
  }
  var agentPhoneIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>';
  var agentMailIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
  var agentWaIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>';
  function statusClass(status) {
    if (status === "active") return "active";
    if (status === "vacation") return "vacation";
    return "inactive";
  }
  function agentCardHTML(a) {
    const bg = AVATAR_BG[a.id % AVATAR_BG.length];
    const initials = (a.name[0] || "") + (a.last[0] || "");
    const st = a.status || "active";
    const avHtml = a.avatar ? `<img src="${a.avatar}" class="agent-admin-photo" alt="${a.name}" data-onerror="hide"/>
       <div class="agent-admin-initials" style="background:${bg};display:none">${initials}</div>` : `<div class="agent-admin-initials" style="background:${bg}">${initials}</div>`;
    return `
    <div class="agent-admin-card">
      <div class="agent-admin-status ${statusClass(st)}">${st}</div>
      <div class="agent-admin-avatar-wrap">
        ${avHtml}
      </div>
      <div class="agent-admin-name">${a.name} ${a.last}</div>
      ${a.specialty ? `<div class="agent-admin-specialty">${esc(a.specialty)}</div>` : ""}
      <div class="agent-admin-years">${a.license_number || (a.years ? `${a.years} a\xF1o${a.years !== 1 ? "s" : ""} de experiencia` : "")}</div>

      <div class="agent-admin-metrics">
        <div class="agent-admin-metric">
          <div class="agent-admin-metric-value">${a._props || 0}</div>
          <div class="agent-admin-metric-label">Props.</div>
        </div>
        <div class="agent-admin-metric">
          <div class="agent-admin-metric-value">${a._leads || 0}</div>
          <div class="agent-admin-metric-label">Leads</div>
        </div>
        <div class="agent-admin-metric">
          <div class="agent-admin-metric-value">${a._sales || 0}</div>
          <div class="agent-admin-metric-label">Ventas</div>
        </div>
      </div>

      <div class="agent-admin-divider"></div>

      <div class="agent-admin-contacts">
        ${a.phone ? `<div class="agent-admin-chip">${agentPhoneIcon} ${a.phone}</div>` : ""}
        ${a.email ? `<div class="agent-admin-chip">${agentMailIcon} ${a.email}</div>` : ""}
        ${a.whatsapp ? `<a href="https://wa.me/${a.whatsapp}" target="_blank" class="agent-admin-chip agent-admin-wa">${agentWaIcon} WhatsApp</a>` : ""}
      </div>

      <div class="agent-admin-actions">
        <button class="btn btn-outline" data-action="openAgentForm" data-aid="${a.id}" title="Editar">Editar</button>
        <button class="btn btn-ghost btn-icon" data-action="agentContact" data-aid="${a.id}" title="Contactar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </button>
        <button class="btn btn-danger btn-icon" data-action="confirmDeleteAgent" data-aid="${a.id}" title="Eliminar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    </div>`;
  }
  function agentTableRowHTML(a) {
    const bg = AVATAR_BG[a.id % AVATAR_BG.length];
    const initials = (a.name[0] || "") + (a.last[0] || "");
    const avatarHtml = a.avatar ? `<img src="${a.avatar}" class="agent-table-av" alt=""/>` : `<div class="agent-table-initials" style="background:${bg}">${initials}</div>`;
    return `
    <tr>
      <td><div class="agent-table-name">${avatarHtml} <span>${a.name} ${a.last}</span></div></td>
      <td>${a.specialty || "\u2014"}</td>
      <td>${a.license_number || "\u2014"}</td>
      <td>${a.phone || "\u2014"}</td>
      <td>${a.email || "\u2014"}</td>
      <td>
        <div class="agent-table-actions">
          <button class="btn btn-ghost btn-sm" data-action="openAgentForm" data-aid="${a.id}">Editar</button>
          <button class="btn btn-danger btn-sm" data-action="confirmDeleteAgent" data-aid="${a.id}">Eliminar</button>
        </div>
      </td>
    </tr>`;
  }
  function renderAgentKPI() {
    var _a;
    const existing = $("agentKpiBar");
    if (existing) existing.remove();
    const total = _agents.length;
    const active = _agents.filter((a) => (a.status || "active") === "active").length;
    const inactive = total - active;
    const kpiHtml = `<div class="agent-kpi-grid" id="agentKpiBar">
    <div class="agent-kpi-card accent">
      <div class="agent-kpi-value">${total}</div>
      <div class="agent-kpi-label">Total agentes</div>
    </div>
    <div class="agent-kpi-card">
      <div class="agent-kpi-value">${active}</div>
      <div class="agent-kpi-label">Activos</div>
    </div>
    <div class="agent-kpi-card">
      <div class="agent-kpi-value">${inactive}</div>
      <div class="agent-kpi-label">Inactivos</div>
    </div>
  </div>`;
    const topbar = (_a = $("tabAgents")) == null ? void 0 : _a.querySelector(".admin-topbar");
    if (topbar) topbar.insertAdjacentHTML("afterend", kpiHtml);
  }
  function renderAgents() {
    const list = $("agentsAdminList");
    $("sidebarAgentCount").textContent = _agents.length;
    $("agentSubtitle").textContent = `${_agents.length} ${_agents.length === 1 ? "agente" : "agentes"} registrados`;
    const oldToggle = $("agentViewToggle");
    if (oldToggle) oldToggle.remove();
    renderAgentKPI();
    if (!_agents.length) {
      list.innerHTML = `<div class="loading-state">No hay agentes. Agreg\xE1 el primero con el bot\xF3n de arriba.</div>`;
      return;
    }
    list.insertAdjacentHTML("beforebegin", `<div class="agent-view-toggle" id="agentViewToggle">
    <button class="agent-view-btn${_agentView === "cards" ? " active" : ""}" data-action="switchAgentView" data-view="cards">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      Tarjetas
    </button>
    <button class="agent-view-btn${_agentView === "table" ? " active" : ""}" data-action="switchAgentView" data-view="table">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      Tabla
    </button>
  </div>`);
    if (_agentView === "table") {
      list.style.display = "";
      list.className = "";
      list.innerHTML = `<table class="agent-table">
      <thead><tr>
        <th>Nombre</th><th>Especialidad</th><th>Matr\xEDcula</th><th>Tel\xE9fono</th><th>Email</th><th>Acciones</th>
      </tr></thead>
      <tbody>${_agents.map(agentTableRowHTML).join("")}</tbody>
    </table>`;
    } else {
      list.style.display = "grid";
      list.style.gridTemplateColumns = "repeat(auto-fill, minmax(270px, 1fr))";
      list.style.gap = "16px";
      list.innerHTML = _agents.map(agentCardHTML).join("");
    }
    list.querySelectorAll("img[data-onerror]").forEach(function(img) {
      img.onerror = function() {
        this.style.display = "none";
        var next = this.nextElementSibling;
        if (next) next.style.display = "flex";
      };
    });
    const toggleBtns = document.querySelectorAll('[data-action="switchAgentView"]');
    toggleBtns.forEach((btn) => {
      btn.onclick = function() {
        _agentView = this.dataset.view;
        renderAgents();
      };
    });
  }
  function switchAgentView(view) {
    _agentView = view;
    renderAgents();
  }
  window.switchAgentView = switchAgentView;
  var _agentAvatar = "";
  function openAgentForm(id) {
    const agent = id ? _agents.find((a) => a.id === id) : null;
    $("agentFormTitle").textContent = agent ? "Editar Agente" : "Nuevo Agente";
    _agentAvatar = (agent == null ? void 0 : agent.avatar) || "";
    const v = (field2) => {
      var _a;
      return agent != null ? (_a = agent[field2]) != null ? _a : "" : "";
    };
    const bg = agent ? AVATAR_BG[agent.id % AVATAR_BG.length] : AVATAR_BG[0];
    const initials = agent ? (agent.name[0] || "") + (agent.last[0] || "") : "?";
    const avatarPreviewHtml = _agentAvatar ? `<img src="${_agentAvatar}" class="avatar-preview-img" alt="foto"/>` : `<div class="avatar-preview-placeholder" style="background:${bg}">${initials}</div>`;
    $("agentFormContent").innerHTML = `
    <div class="af-header">
      <div class="af-avatar-section">
        <div class="af-avatar-wrap">
          <div class="avatar-upload-preview" id="avatarPreview">
            ${avatarPreviewHtml}
            <div class="avatar-upload-overlay" id="avatarOverlay">
              <span class="crud-icon-placeholder">\u{1F4F7}</span>
              <span class="crud-change-label">CAMBIAR</span>
            </div>
          </div>
        </div>
        <div class="af-avatar-actions">
          <input type="file" id="avatarInput"
                 accept="image/jpeg,image/png,image/webp,image/gif" class="crud-hidden-input"/>
          <button type="button" class="btn btn-outline btn-sm crud-btn-full" id="avatarBtn">
            ${_agentAvatar ? "\u21BA Cambiar foto" : "+ Subir foto"}
          </button>
          ${_agentAvatar ? `<button type="button" class="btn btn-danger btn-sm crud-btn-full" id="avatarRemoveBtn">Quitar</button>` : ""}
          <div class="crud-upload-hint">JPG \xB7 PNG \xB7 WEBP<br/>m\xE1x. 5MB</div>
        </div>
      </div>
      <div id="avatarUploadStatus" class="avatar-status crud-upload-status"></div>
    </div>

    <div class="af-divider"></div>

    <p class="af-section-label">Datos personales</p>
    <div class="crud-grid-2col">
      <div class="field">
        <label class="field-label">Nombre *</label>
        <input id="af_name" class="field-input" value="${v("name")}" placeholder="Nombre"/>
      </div>
      <div class="field">
        <label class="field-label">Apellido</label>
        <input id="af_last" class="field-input" value="${v("last")}" placeholder="Apellido"/>
      </div>
    </div>
    <div class="crud-grid-2col-wide">
      <div class="field">
        <label class="field-label">Especialidad</label>
        <input id="af_specialty" class="field-input" value="${v("specialty")}" placeholder="Ej: Propiedades residenciales"/>
      </div>
      <div class="field">
        <label class="field-label">Matr\xEDcula</label>
        <input id="af_license" class="field-input" value="${v("license_number")}" placeholder="Ej: MAT. 12345"/>
      </div>
    </div>

    <div class="af-divider"></div>

    <p class="af-section-label">Contacto</p>
    <div class="crud-grid-2col">
      <div class="field">
        <label class="field-label">Tel\xE9fono</label>
        <input id="af_phone" class="field-input" value="${v("phone")}" placeholder="+54 351 ..."/>
      </div>
      <div class="field">
        <label class="field-label">WhatsApp (solo n\xFAmeros)</label>
        <input id="af_whatsapp" class="field-input" value="${v("whatsapp")}" placeholder="5493510..."/>
      </div>
    </div>
    <div class="field">
      <label class="field-label">Email</label>
      <input id="af_email" class="field-input" type="email" value="${v("email")}" placeholder="agente@bienenhaus.com"/>
    </div>

    <div class="af-divider"></div>

    <div class="crud-flex-gap10">
      <button class="btn btn-primary btn-full crud-btn-pad14" id="saveAgentBtn">
        ${agent ? "Guardar cambios" : "Crear agente"}
      </button>
      <button class="btn btn-ghost crud-btn-pad14h" data-action="closeAgentForm">Cancelar</button>
    </div>`;
    $("agentFormModal").classList.remove("hidden");
    $("saveAgentBtn").onclick = () => saveAgentForm(id || null);
    const triggerUpload = () => $("avatarInput").click();
    $("avatarBtn").onclick = triggerUpload;
    $("avatarOverlay").onclick = triggerUpload;
    $("avatarInput").onchange = async () => {
      var _a;
      const file = $("avatarInput").files[0];
      if (!file) return;
      $("avatarInput").value = "";
      setAvatarStatus("Comprimiendo\u2026", "loading");
      const compressed = await compressImage(file, 400, 0.82);
      const localUrl = URL.createObjectURL(compressed);
      setAvatarPreview(localUrl);
      setAvatarStatus("Subiendo\u2026", "loading");
      try {
        const result = await API.uploadImages([compressed], "avatar");
        URL.revokeObjectURL(localUrl);
        _agentAvatar = ((_a = result.urls) == null ? void 0 : _a[0]) || "";
        setAvatarPreview(_agentAvatar);
        setAvatarStatus("\u2713 Foto subida", "ok");
        setTimeout(() => setAvatarStatus("", ""), 2500);
      } catch (err) {
        URL.revokeObjectURL(localUrl);
        setAvatarPreview(_agentAvatar);
        setAvatarStatus(`Error: ${err.message}`, "error");
      }
    };
    const removeBtn = $("avatarRemoveBtn");
    if (removeBtn) {
      removeBtn.onclick = () => {
        if (_agentAvatar == null ? void 0 : _agentAvatar.startsWith("/static/uploads/"))
          API.deleteImage(_agentAvatar.split("/").pop()).catch(() => {
          });
        _agentAvatar = "";
        setAvatarPreview("");
        removeBtn.remove();
        $("avatarBtn").textContent = "+ Subir foto";
      };
    }
  }
  function setAvatarPreview(url) {
    var _a, _b;
    const wrap = $("avatarPreview");
    if (!wrap) return;
    const overlay = `<div class="avatar-upload-overlay" id="avatarOverlay"
    data-action="clickAvatarInput">
    <span>\u{1F4F7}</span>
    <span class="crud-small-label">Cambiar foto</span>
  </div>`;
    if (url) {
      wrap.innerHTML = `<img src="${url}" class="avatar-preview-img" alt="foto"/>${overlay}`;
    } else {
      const initials = (((_a = $("af_name")) == null ? void 0 : _a.value[0]) || "") + (((_b = $("af_last")) == null ? void 0 : _b.value[0]) || "") || "?";
      wrap.innerHTML = `<div class="avatar-preview-placeholder" style="background:${AVATAR_BG[0]}">${initials}</div>${overlay}`;
    }
  }
  function setAvatarStatus(msg, type) {
    const el = $("avatarUploadStatus");
    if (!el) return;
    el.textContent = msg;
    el.className = "avatar-status" + (type ? " avatar-status-" + type : "");
  }
  function closeAgentForm() {
    $("agentFormModal").classList.add("hidden");
  }
  async function saveAgentForm(id) {
    var _a;
    const name = (_a = $("af_name")) == null ? void 0 : _a.value.trim();
    if (!name) {
      toast("El nombre es obligatorio.", "warn");
      return;
    }
    const data = {
      name,
      last: $("af_last").value.trim(),
      specialty: $("af_specialty").value.trim(),
      license_number: $("af_license").value.trim(),
      phone: $("af_phone").value.trim(),
      whatsapp: $("af_whatsapp").value.trim(),
      email: $("af_email").value.trim(),
      avatar: _agentAvatar
    };
    try {
      let saved;
      if (id) {
        saved = await API.updateAgent(id, data);
        _agents = _agents.map((a) => a.id === id ? saved : a);
      } else {
        saved = await API.createAgent(data);
        _agents.push(saved);
      }
      renderAgents();
      closeAgentForm();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function renderRentals() {
    const list = $("propsAdminList");
    $("sidebarPropCount").textContent = _props.length;
    document.querySelectorAll("#sortBar").forEach((el) => el.remove());
    const q = _searchQuery;
    readFilterValues();
    let filtered = _rentals.filter((r) => {
      if (q && !(r.title || "").toLowerCase().includes(q) && !(r.location || "").toLowerCase().includes(q)) return false;
      return matchFilters(r, true);
    });
    const totalPages = Math.ceil(filtered.length / _rPerPage) || 1;
    if (_rPage > totalPages) _rPage = totalPages;
    const start = (_rPage - 1) * _rPerPage;
    const end = Math.min(start + _rPerPage, filtered.length);
    const pageItems = filtered.slice(start, end);
    $("propSubtitle").textContent = `${filtered.length} ${filtered.length === 1 ? "alquiler" : "alquileres"}${q ? " filtrados" : ""} \u2014 P\xE1g. ${_rPage}/${totalPages}`;
    if (!filtered.length) {
      list.innerHTML = '<div class="loading-state"></div>';
      list.firstChild.textContent = q ? 'Sin resultados para "' + q + '".' : "No hay alquileres. Cre\xE1 el primero con el bot\xF3n de arriba.";
      return;
    }
    list.style.display = "";
    list.className = "prop-grid";
    list.innerHTML = pageItems.map((r) => {
      var _a;
      const thumb = (_a = r.images) == null ? void 0 : _a[0];
      const thumbHtml = thumb ? `<img class="prop-card-thumb" ${imgAttrs(thumb, [400, 800])} alt="" loading="lazy"/>` : `<div class="prop-card-thumb--empty">${homeIconR}</div>`;
      const specs = [];
      if (r.beds) specs.push(`<div class="prop-card-spec">${bedSvg} ${r.beds}</div>`);
      if (r.baths) specs.push(`<div class="prop-card-spec">${bathSvg} ${r.baths}</div>`);
      if (r.sqm) specs.push(`<div class="prop-card-spec">${sqmSvg} ${r.sqm} m\xB2</div>`);
      return `
      <div class="prop-card">
        ${thumbHtml}
        <div class="prop-card-body">
          <div class="prop-card-title">${r.title}</div>
          <div class="prop-card-loc">${locSvg} ${r.location || "Sin ubicaci\xF3n"}</div>
          <div class="prop-card-price">${fmtAR(r.price_ars)}/mes</div>
          ${r.expenses > 0 ? `<div class="crud-expenses-label">+ ${fmtAR(r.expenses)} expensas</div>` : ""}

          ${specs.length ? `<div class="prop-card-specs">${specs.join("")}</div>` : ""}

          <div class="crud-tags-row">
            ${rentalStatusBadge(r.status)}
            ${r.featured ? '<span class="admin-status-badge admin-prop-featured">\u2605 Destacado</span>' : ""}
            ${r.furnished ? '<span class="admin-status-badge crud-badge-furnished">Amoblado</span>' : ""}
          </div>

          <div class="prop-card-actions">
            <button class="btn btn-ghost" data-action="openPropForm" data-id="${r.id}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button class="btn btn-ghost btn-sm" data-action="descargarFolleto" data-id="${r.id}" title="Descargar folleto PDF">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              PDF
            </button>
            ${r.status !== "disponible" ? `<button class="btn btn-success btn-icon" data-action="setRentalStatus" data-rid="${r.id}" data-status="disponible" title="Disponible">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                 </button>` : ""}
            ${r.status !== "alquilada" ? `<button class="btn btn-warn btn-icon" data-action="setRentalStatus" data-rid="${r.id}" data-status="alquilada" title="Alquilada">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                 </button>` : ""}
            ${r.status !== "oculta" ? `<button class="btn btn-ghost btn-icon" data-action="setRentalStatus" data-rid="${r.id}" data-status="oculta" title="Ocultar">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                 </button>` : ""}
            <button class="btn btn-danger btn-icon" data-action="confirmDeleteRental" data-rid="${r.id}" title="Eliminar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>`;
    }).join("") + paginationRentalHTML(totalPages);
  }
  function paginationRentalHTML(totalPages) {
    if (totalPages <= 1) return "";
    const prevDisabled = _rPage <= 1;
    const nextDisabled = _rPage >= totalPages;
    const maxVisible = 7;
    let pages = [];
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let left = Math.max(2, _rPage - 2);
      let right = Math.min(totalPages - 1, _rPage + 2);
      if (left > 2) pages.push("\u2026");
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 1) pages.push("\u2026");
      pages.push(totalPages);
    }
    const pageBtns = pages.map(
      (p) => p === "\u2026" ? `<span class="page-dots">\u2026</span>` : `<button type="button" class="page-btn${p === _rPage ? " page-btn--active" : ""}"
                 data-action="goToRentalPage" data-page="${p}">${p}</button>`
    ).join("");
    return `
    <div class="pagination">
      <button type="button" class="page-btn page-btn--nav" data-action="goToRentalPage" data-page="${_rPage - 1}"
              ${prevDisabled ? "disabled" : ""}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Anterior
      </button>
      <div class="page-numbers">${pageBtns}</div>
      <button type="button" class="page-btn page-btn--nav" data-action="goToRentalPage" data-page="${_rPage + 1}"
              ${nextDisabled ? "disabled" : ""}>
        Siguiente
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>`;
  }
  var _conversations = [];
  var _activeConvId = null;
  var _msgPollTimer = null;
  var _lastUnreadTotal = 0;
  var _msgEmojiOpen = false;
  var CONV_AVATAR_BG = ["#0b131e", "#0b1a0d", "#1a0b0b", "#181808", "#0b1818", "#100b1a", "#1a0b14", "#0b1a1a"];
  var CHANNEL_LABELS = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", email: "Email", web: "Web" };
  var CHANNEL_ICONS = { whatsapp: "\u{1F4AC}", instagram: "\u{1F4F7}", facebook: "\u{1F44D}", email: "\u2709", web: "\u{1F310}" };
  var EMOJIS = ["\u{1F600}", "\u{1F60A}", "\u{1F602}", "\u{1F60D}", "\u{1F60E}", "\u{1F914}", "\u{1F622}", "\u{1F621}", "\u{1F44D}", "\u{1F44E}", "\u2764\uFE0F", "\u{1F525}", "\u{1F389}", "\u{1F64F}", "\u{1F4AA}", "\u2705", "\u274C", "\u{1F4C5}", "\u{1F4CD}", "\u{1F4B0}", "\u{1F3E0}", "\u{1F511}", "\u{1F4DE}", "\u2709\uFE0F"];
  function _convInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
  }
  function _convAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return CONV_AVATAR_BG[Math.abs(hash) % CONV_AVATAR_BG.length];
  }
  function _convTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const now = /* @__PURE__ */ new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const thisYear = d.getFullYear() === now.getFullYear();
    if (sameDay) return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    if (thisYear) return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "2-digit" });
  }
  function _convDateGroup(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const now = /* @__PURE__ */ new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (sameDay) return "Hoy";
    if (isYesterday) return "Ayer";
    return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  }
  async function loadMessages() {
    const list = $("msgConvList");
    if (!list) return;
    list.innerHTML = '<div class="loading-state">Cargando conversaciones...</div>';
    try {
      const data = await API.getConversations();
      _conversations = data.conversations || [];
      $("sidebarMsgCount").textContent = data.total_unread > 0 ? data.total_unread : _conversations.length;
      $("msgSubtitle").textContent = `${_conversations.length} conversaci\xF3n${_conversations.length !== 1 ? "es" : ""} \xB7 ${data.total_unread} sin leer`;
      if (!_conversations.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">\u{1F4AC}</div><div class="empty-state-text">No hay conversaciones todav\xEDa.</div></div>';
        $("msgChatArea").innerHTML = "";
        $("msgSidePanel").innerHTML = "";
        return;
      }
      _renderConvList();
      if (_activeConvId) {
        const stillExists = _conversations.find((c2) => c2.id === _activeConvId);
        if (!stillExists) _activeConvId = null;
      }
      if (!_activeConvId) {
        _activeConvId = _conversations[0].id;
      }
      _openConversation(_activeConvId);
    } catch (e) {
      list.innerHTML = `<div class="loading-state">Error al cargar conversaciones.</div>`;
    }
  }
  function _renderConvList() {
    const list = $("msgConvList");
    if (!list) return;
    list.innerHTML = _conversations.map((c2) => `
    <button type="button" class="msg-conv-item${c2.id === _activeConvId ? " active" : ""}" data-conv-id="${c2.id}" onclick="selectConversation(${c2.id})">
      <div class="msg-conv-avatar" style="background:${_convAvatarColor(c2.lead_name)}">${_convInitials(c2.lead_name)}</div>
      <div class="msg-conv-info">
        <div class="msg-conv-name">${esc(c2.lead_name || "Sin nombre")}</div>
        ${c2.subject ? `<div class="msg-conv-subject">${esc(c2.subject)}</div>` : ""}
        <div class="msg-conv-preview">${c2.last_sender === "agent" ? "T\xFA: " : ""}${esc(c2.last_message_preview || "\u2014")}</div>
      </div>
      <div class="msg-conv-meta">
        <span class="msg-conv-time">${_convTime(c2.last_message_at)}</span>
        ${c2.unread > 0 ? `<span class="msg-conv-badge">${c2.unread > 99 ? "99+" : c2.unread}</span>` : ""}
      </div>
      </button>
    `).join("");
  }
  window.selectConversation = async function selectConversation(id) {
    var _a;
    _activeConvId = id;
    document.querySelectorAll(".msg-conv-item").forEach((el) => el.classList.remove("active"));
    (_a = document.querySelector(`.msg-conv-item[data-conv-id="${id}"]`)) == null ? void 0 : _a.classList.add("active");
    try {
      const messagesData = await API.getConversationMessages(id);
      const conv = _conversations.find((c2) => c2.id === id);
      if (conv && conv.unread > 0) {
        await API.markConversationRead(id);
        conv.unread = 0;
        _renderConvList();
        _updateUnreadBadge();
      }
      _renderChat(conv || { id }, messagesData.messages || []);
      _renderSidePanel(conv || { id });
    } catch (e) {
      toast("Error al cargar mensajes", "error");
    }
  };
  async function _openConversation(id) {
    var _a;
    _activeConvId = id;
    document.querySelectorAll(".msg-conv-item").forEach((el) => el.classList.remove("active"));
    (_a = document.querySelector(`.msg-conv-item[data-conv-id="${id}"]`)) == null ? void 0 : _a.classList.add("active");
    try {
      const messagesData = await API.getConversationMessages(id);
      const conv = _conversations.find((c2) => c2.id === id);
      if (conv && conv.unread > 0) {
        await API.markConversationRead(id);
        conv.unread = 0;
        _renderConvList();
        _updateUnreadBadge();
      }
      _renderChat(conv || { id }, messagesData.messages || []);
      _renderSidePanel(conv || { id });
    } catch (e) {
      $("msgChatArea").innerHTML = '<div class="loading-state">Error al cargar mensajes.</div>';
    }
  }
  function _renderChat(conv, messages) {
    const area = $("msgChatArea");
    if (!area) return;
    if (!conv || !conv.lead_name) {
      area.innerHTML = `
      <div class="msg-chat-empty">
        <div class="msg-chat-empty-icon">\u{1F4AC}</div>
        <div class="msg-chat-empty-text">Seleccion\xE1 una conversaci\xF3n para ver los mensajes</div>
      </div>`;
      return;
    }
    const channelIcon = CHANNEL_ICONS[conv.channel] || "\u{1F4AC}";
    const channelLabel = CHANNEL_LABELS[conv.channel] || conv.channel;
    const statusLabel = conv.status === "resuelta" ? "Resuelta" : conv.status === "archivada" ? "Archivada" : "Activa";
    area.innerHTML = `
    <div class="msg-chat-header" id="msgChatHeader">
      <div class="msg-chat-header-left">
        <div class="msg-conv-avatar msg-conv-avatar--sm" style="background:${_convAvatarColor(conv.lead_name)}">${_convInitials(conv.lead_name)}</div>
        <div>
          <div class="msg-chat-header-name">${esc(conv.lead_name)} ${channelIcon}</div>
          <div class="msg-chat-header-status">${channelLabel} \xB7 ${statusLabel}</div>
        </div>
      </div>
      <div class="msg-chat-header-actions">
        <button class="btn btn-ghost btn-sm" onclick="loadMessages()" title="Actualizar">\u21BB</button>
      </div>
    </div>
    <div class="msg-messages" id="msgMessages">
      ${messages.length === 0 ? '<div class="msg-chat-empty-text msg-chat-empty-text--centered">No hay mensajes en esta conversaci\xF3n. Envi\xE1 el primero.</div>' : _renderMessages(messages)}
    </div>
    <div class="msg-input-bar" id="msgInputBar">
      <div class="msg-input-actions">
        <button class="msg-input-btn" onclick="toggleEmojiPicker()" title="Emoji">\u{1F60A}</button>
        <button class="msg-input-btn" onclick="document.getElementById('msgFileInput').click()" title="Adjuntar">\u{1F4CE}</button>
        <input type="file" id="msgFileInput" class="msg-hidden-input" accept="image/*,.pdf,.doc,.docx" onchange="attachFile(this)">
      </div>
      <textarea class="msg-input-field" id="msgInputField" rows="1" placeholder="Escrib\xED un mensaje..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage()}"></textarea>
      <button class="msg-input-send" id="msgSendBtn" onclick="sendMessage()" title="Enviar">\u27A4</button>
    </div>`;
    const msgsEl = $("msgMessages");
    if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function _renderMessages(messages) {
    let html = "";
    let lastDate = "";
    messages.forEach((m) => {
      const d = _convDateGroup(m.created_at);
      if (d && d !== lastDate) {
        html += `<div class="msg-date-separator">${d}</div>`;
        lastDate = d;
      }
      const isAgent = m.sender === "agent";
      html += `
      <div class="msg-bubble msg-bubble--${isAgent ? "agent" : "client"}">
        ${m.content ? esc(m.content) : ""}
        ${m.attachment_url ? `<div class="msg-bubble-attachment"><a href="${esc(m.attachment_url)}" target="_blank">\u{1F4CE} ${esc(m.attachment_name || "Archivo")}</a></div>` : ""}
        <div class="msg-bubble-time">${_convTime(m.created_at)}${isAgent ? " \u2713" : ""}</div>
      </div>`;
    });
    return html;
  }
  window.sendMessage = async function sendMessage() {
    const input = $("msgInputField");
    const btn = $("msgSendBtn");
    const content = ((input == null ? void 0 : input.value) || "").trim();
    if (!content || !_activeConvId) return;
    if (btn) btn.disabled = true;
    try {
      const msg = await API.sendMessage(_activeConvId, content);
      input.value = "";
      input.style.height = "auto";
      if (btn) btn.disabled = false;
      const msgsEl = $("msgMessages");
      if (msgsEl) {
        const d = _convDateGroup(msg.created_at);
        const lastSep = msgsEl.querySelector(".msg-date-separator:last-child");
        const needsSep = !lastSep || lastSep.textContent !== d;
        msgsEl.insertAdjacentHTML("beforeend", `
        ${needsSep ? `<div class="msg-date-separator">${d}</div>` : ""}
        <div class="msg-bubble msg-bubble--agent">
          ${esc(msg.content)}
          <div class="msg-bubble-time">${_convTime(msg.created_at)} \u2713</div>
        </div>`);
        msgsEl.scrollTop = msgsEl.scrollHeight;
      }
      const conv = _conversations.find((c2) => c2.id === _activeConvId);
      if (conv) {
        conv.last_message_preview = content;
        conv.last_message_at = msg.created_at;
        conv.last_sender = "agent";
        _renderConvList();
      }
    } catch (e) {
      toast("Error al enviar mensaje", "error");
      if (btn) btn.disabled = false;
    }
  };
  document.addEventListener("input", function(e) {
    const el = e.target.closest("#msgInputField");
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 96) + "px";
    }
  });
  window.attachFile = async function attachFile(input) {
    if (!input.files.length || !_activeConvId) return;
    const file = input.files[0];
    const btn = $("msgSendBtn");
    if (btn) btn.disabled = true;
    try {
      const uploadResult = await API.uploadImages([file]);
      if (uploadResult.urls && uploadResult.urls[0]) {
        const msg = await API.sendMessage(_activeConvId, "", "attachment", uploadResult.urls[0], file.name);
        const msgsEl = $("msgMessages");
        if (msgsEl) {
          msgsEl.insertAdjacentHTML("beforeend", `
          <div class="msg-date-separator">${_convDateGroup(msg.created_at)}</div>
          <div class="msg-bubble msg-bubble--agent">
            <div class="msg-bubble-attachment"><a href="${esc(msg.attachment_url)}" target="_blank">\u{1F4CE} ${esc(msg.attachment_name || "Archivo")}</a></div>
            <div class="msg-bubble-time">${_convTime(msg.created_at)} \u2713</div>
          </div>`);
          msgsEl.scrollTop = msgsEl.scrollHeight;
        }
      }
    } catch (e) {
      toast("Error al adjuntar archivo", "error");
    }
    input.value = "";
    if (btn) btn.disabled = false;
  };
  window.toggleEmojiPicker = function toggleEmojiPicker() {
    _msgEmojiOpen = !_msgEmojiOpen;
    const existing = document.querySelector(".msg-emoji-picker");
    if (existing) {
      existing.remove();
      _msgEmojiOpen = false;
      return;
    }
    if (!_msgEmojiOpen) return;
    const picker = document.createElement("div");
    picker.className = "msg-emoji-picker";
    picker.innerHTML = EMOJIS.map((e) => `<button class="msg-emoji-btn" onclick="insertEmoji('${e}')">${e}</button>`).join("");
    const actions = document.querySelector(".msg-input-actions");
    if (actions) actions.appendChild(picker);
    document.addEventListener("click", _closeEmojiOnOutside, true);
  };
  function _closeEmojiOnOutside(e) {
    if (!e.target.closest(".msg-input-actions")) {
      const picker = document.querySelector(".msg-emoji-picker");
      if (picker) picker.remove();
      _msgEmojiOpen = false;
      document.removeEventListener("click", _closeEmojiOnOutside, true);
    }
  }
  window.insertEmoji = function insertEmoji(emoji) {
    const input = $("msgInputField");
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
    input.selectionStart = input.selectionEnd = start + emoji.length;
    input.focus();
    input.dispatchEvent(new Event("input"));
  };
  function _renderSidePanel(conv) {
    const panel = $("msgSidePanel");
    if (!panel) return;
    if (!conv || !conv.lead_name) {
      panel.innerHTML = '<div class="msg-panel-section"><div class="msg-panel-section-title">Contacto</div><div class="msg-panel-empty">Sin informaci\xF3n</div></div>';
      return;
    }
    const channelLabel = CHANNEL_LABELS[conv.channel] || conv.channel;
    const statusBadge2 = conv.status === "resuelta" ? '<span class="admin-status-badge status-disponible">Resuelta</span>' : conv.status === "archivada" ? '<span class="admin-status-badge status-oculta">Archivada</span>' : '<span class="admin-status-badge status-pendiente">Activa</span>';
    const linkedSection = `
    <div class="msg-panel-section msg-linked-section">
      <div class="msg-panel-section-title">Vinculado a</div>
      <div class="msg-linked-chips" id="msgLinkedChips_${conv.id}">
        <span class="msg-panel-placeholder">Cargando...</span>
      </div>
      <button class="msg-panel-action-btn" onclick="_showLinkModal(${conv.id})" style="margin-top:8px">\u{1F517} Vincular propiedad / tasaci\xF3n</button>
    </div>`;
    panel.innerHTML = `
    <div class="msg-panel-section">
      <div class="msg-panel-contact">
        <div class="msg-panel-avatar" style="background:${_convAvatarColor(conv.lead_name)}">${_convInitials(conv.lead_name)}</div>
        <div class="msg-panel-name">${esc(conv.lead_name || "Sin nombre")}</div>
        ${statusBadge2}
      </div>
    </div>
    <div class="msg-panel-section">
      <div class="msg-panel-section-title">Contacto</div>
      ${conv.lead_email ? `<div class="msg-panel-row"><span class="msg-panel-label">Email</span><span class="msg-panel-value"><a href="mailto:${esc(conv.lead_email)}">${esc(conv.lead_email)}</a></span></div>` : ""}
      ${conv.lead_phone ? `<div class="msg-panel-row"><span class="msg-panel-label">Tel\xE9fono</span><span class="msg-panel-value"><a href="tel:${esc(conv.lead_phone)}">${esc(conv.lead_phone)}</a></span></div>` : ""}
      <div class="msg-panel-row"><span class="msg-panel-label">Canal</span><span class="msg-panel-value">${channelLabel}</span></div>
      ${conv.lead_status ? `<div class="msg-panel-row"><span class="msg-panel-label">Estado lead</span><span class="msg-panel-value">${esc(conv.lead_status)}</span></div>` : ""}
      ${conv.agent_name ? `<div class="msg-panel-row"><span class="msg-panel-label">Asignado a</span><span class="msg-panel-value">${esc(conv.agent_name)}</span></div>` : ""}
      <div class="msg-panel-row"><span class="msg-panel-label">Mensajes</span><span class="msg-panel-value">${conv.message_count || 0}</span></div>
    </div>
    ${linkedSection}
    <div class="msg-panel-section">
      <div class="msg-panel-section-title">Acciones r\xE1pidas</div>
      <div class="msg-panel-actions">
        ${conv.lead_phone ? `<button class="msg-panel-action-btn" onclick="window.open('https://wa.me/${conv.lead_phone.replace(/\\D/g, "")}','_blank')">\u{1F4AC} Abrir WhatsApp</button>` : ""}
        ${conv.lead_email ? `<button class="msg-panel-action-btn" onclick="window.open('mailto:${esc(conv.lead_email)}','_blank')">\u2709 Enviar email</button>` : ""}
        <button class="msg-panel-action-btn" onclick="changeConvStatus(${conv.id}, 'archivada')">\u{1F4C1} Archivar conversaci\xF3n</button>
      </div>
    </div>`;
    _refreshLinkedItems(conv.id);
  }
  async function _refreshLinkedItems(convId) {
    const chipsEl = $("msgLinkedChips_" + convId);
    if (!chipsEl) return;
    try {
      const links = await API.getConversationLinks(convId);
      const props = links.properties || [];
      const apprs = links.appraisals || [];
      const all = [...props, ...apprs];
      if (!all.length) {
        chipsEl.innerHTML = '<span class="msg-panel-placeholder">Sin v\xEDnculos</span>';
        return;
      }
      chipsEl.innerHTML = all.map(
        (item) => `<span class="msg-linked-chip">
        <span class="acm-chip-text">${esc(item.title || "Sin t\xEDtulo")}</span>
        <button class="msg-linked-chip-remove" onclick="_removeLink(${convId},'${item.type}',${item.id})" title="Desvincular">\xD7</button>
      </span>`
      ).join("");
    } catch (e) {
      const el = $("msgLinkedChips_" + convId);
      if (el) el.innerHTML = '<span class="msg-panel-placeholder">Error al cargar</span>';
    }
  }
  async function _removeLink(convId, linkType, linkId) {
    try {
      await API.removeConversationLink(convId, linkType, linkId);
      _refreshLinkedItems(convId);
      toast("V\xEDnculo eliminado", "success");
    } catch (e) {
      toast("Error al desvincular", "error");
    }
  }
  async function _showLinkModal(convId) {
    const conv = _conversations.find((c2) => c2.id === convId);
    if (!conv) return;
    let linkTab = "property";
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.style.cssText = "display:flex;align-items:center;justify-content:center;z-index:10000";
    modal.innerHTML = `
    <div class="modal" style="max-width:520px;width:90%;max-height:80vh;display:flex;flex-direction:column">
      <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;padding:var(--admin-space-4);border-bottom:1px solid var(--admin-border)">
        <h3 style="margin:0;font-family:var(--admin-font-display);font-weight:400;font-size:var(--admin-text-md)">Vincular ${esc(conv.lead_name || "conversaci\xF3n")}</h3>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--admin-text-muted)">\xD7</button>
      </div>
      <div style="display:flex;gap:0;padding:var(--admin-space-2) var(--admin-space-4) 0;border-bottom:1px solid var(--admin-border)">
        <button class="msg-link-tab ${linkTab === "property" ? "active" : ""}" data-link-tab="property" style="flex:1;padding:var(--admin-space-2) var(--admin-space-3);border:none;background:none;cursor:pointer;font-size:var(--admin-text-xs);font-weight:600;color:var(--admin-text-secondary);border-bottom:2px solid ${linkTab === "property" ? "var(--admin-primary)" : "transparent"};transition:var(--admin-transition)">Propiedades</button>
        <button class="msg-link-tab ${linkTab === "appraisal" ? "active" : ""}" data-link-tab="appraisal" style="flex:1;padding:var(--admin-space-2) var(--admin-space-3);border:none;background:none;cursor:pointer;font-size:var(--admin-text-xs);font-weight:600;color:var(--admin-text-secondary);border-bottom:2px solid ${linkTab === "appraisal" ? "var(--admin-primary)" : "transparent"};transition:var(--admin-transition)">Tasaciones</button>
      </div>
      <div style="padding:var(--admin-space-3) var(--admin-space-4)">
        <input type="text" class="msg-link-search" data-link-type="${linkTab}" placeholder="Buscar..." style="width:100%;padding:var(--admin-space-2) var(--admin-space-3);border:1px solid var(--admin-border);border-radius:var(--admin-radius-md);font-size:var(--admin-text-sm);outline:none;font-family:var(--admin-font-body);background:var(--admin-bg);color:var(--admin-text)">
      </div>
      <div class="msg-link-results" style="flex:1;overflow-y:auto;padding:0 var(--admin-space-4) var(--admin-space-3);min-height:120px">
        <div class="msg-panel-placeholder">Escrib\xED para buscar...</div>
      </div>
    </div>`;
    document.body.appendChild(modal);
    const searchInput = modal.querySelector(".msg-link-search");
    const resultsEl = modal.querySelector(".msg-link-results");
    const tabs = modal.querySelectorAll(".msg-link-tab");
    let searchTimer = null;
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => {
          t.style.borderBottomColor = "transparent";
          t.classList.remove("active");
        });
        tab.style.borderBottomColor = "var(--admin-primary)";
        tab.classList.add("active");
        linkTab = tab.dataset.linkTab;
        searchInput.dataset.linkType = linkTab;
        searchInput.value = "";
        resultsEl.innerHTML = '<div class="msg-panel-placeholder">Escrib\xED para buscar...</div>';
      });
    });
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      const q = searchInput.value.trim();
      if (q.length < 2) {
        resultsEl.innerHTML = '<div class="msg-panel-placeholder">Escrib\xED al menos 2 caracteres</div>';
        return;
      }
      searchTimer = setTimeout(() => _searchLinkItems(linkTab, q, resultsEl, convId), 300);
    });
  }
  async function _searchLinkItems(type, query, resultsEl, convId) {
    resultsEl.innerHTML = '<div class="msg-panel-placeholder">Buscando...</div>';
    try {
      let items;
      if (type === "property") {
        const data = await API.getProperties({ search: query, per_page: 20 });
        items = (data.properties || []).map((p) => ({
          id: p.id,
          title: p.title || "Sin t\xEDtulo",
          subtitle: p.location ? esc(p.location) : ""
        }));
      } else {
        const data = await API.getAppraisals({ search: query, per_page: 20 });
        items = (data.appraisals || []).map((a) => ({
          id: a.id,
          title: a.titulo || "Sin t\xEDtulo",
          subtitle: a.direccion ? esc(a.direccion) : ""
        }));
      }
      if (!items.length) {
        resultsEl.innerHTML = '<div class="msg-panel-placeholder">Sin resultados</div>';
        return;
      }
      resultsEl.innerHTML = items.map(
        (item) => `<button class="msg-link-result" data-id="${item.id}" style="display:flex;align-items:center;width:100%;padding:var(--admin-space-2) var(--admin-space-3);border:1px solid var(--admin-border);border-radius:var(--admin-radius-md);background:var(--admin-surface);cursor:pointer;text-align:left;margin-bottom:6px;transition:var(--admin-transition);font:inherit;color:inherit"
          onmouseover="this.style.borderColor='var(--admin-primary-border)'" onmouseout="this.style.borderColor=''"
          onclick="_confirmLink(${convId},'${type}',${item.id},this)">
        <div>
          <div style="font-size:var(--admin-text-sm);font-weight:600;color:var(--admin-text)">${esc(item.title)}</div>
          ${item.subtitle ? `<div style="font-size:var(--admin-text-xs);color:var(--admin-text-muted);margin-top:2px">${item.subtitle}</div>` : ""}
        </div>
      </button>`
      ).join("");
    } catch (e) {
      resultsEl.innerHTML = '<div class="msg-panel-placeholder">Error al buscar</div>';
    }
  }
  window._showLinkModal = _showLinkModal;
  window._removeLink = _removeLink;
  window.changeConvStatus = async function changeConvStatus(id, status) {
    if (!await confirmModal(`\xBF${status === "archivada" ? "Archivar" : "Cambiar estado a"} esta conversaci\xF3n?`)) return;
    try {
      await API.updateConversationStatus(id, status);
      const conv = _conversations.find((c2) => c2.id === id);
      if (conv) conv.status = status;
      if (_activeConvId === id) _renderSidePanel(conv);
      toast("Estado actualizado", "success");
    } catch (e) {
      toast("Error al actualizar estado", "error");
    }
  };
  window.filterConversations = function filterConversations(q) {
    const query = (q || "").toLowerCase().trim();
    document.querySelectorAll(".msg-conv-item").forEach((el) => {
      var _a, _b, _c, _d;
      const name = ((_b = (_a = el.querySelector(".msg-conv-name")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.toLowerCase()) || "";
      const preview = ((_d = (_c = el.querySelector(".msg-conv-preview")) == null ? void 0 : _c.textContent) == null ? void 0 : _d.toLowerCase()) || "";
      const match = !query || name.includes(query) || preview.includes(query);
      el.style.display = match ? "" : "none";
    });
  };
  function startMsgPolling() {
    stopMsgPolling();
    _lastUnreadTotal = 0;
    _msgPollTimer = setInterval(pollConversations, 15e3);
  }
  function stopMsgPolling() {
    if (_msgPollTimer) {
      clearInterval(_msgPollTimer);
      _msgPollTimer = null;
    }
  }
  async function pollConversations() {
    try {
      const data = await API.getConversations();
      const totalUnread = data.total_unread || 0;
      const newConvs = data.conversations || [];
      $("sidebarMsgCount").textContent = totalUnread > 0 ? totalUnread : newConvs.length;
      $("msgSubtitle").textContent = `${newConvs.length} conversaci\xF3n${newConvs.length !== 1 ? "es" : ""} \xB7 ${totalUnread} sin leer`;
      if (totalUnread > _lastUnreadTotal && _lastUnreadTotal >= 0) {
        const newCount = totalUnread - _lastUnreadTotal;
        toast(`${newCount} mensaje${newCount !== 1 ? "s" : ""} nuevo${newCount !== 1 ? "s" : ""}`, "info");
      }
      _lastUnreadTotal = totalUnread;
      const changed = JSON.stringify(_conversations.map((c2) => c2.id).sort()) !== JSON.stringify(newConvs.map((c2) => c2.id).sort());
      const unreadChanged = _conversations.some((c2) => {
        const nc = newConvs.find((n) => n.id === c2.id);
        return nc && nc.unread !== c2.unread;
      });
      if (changed || unreadChanged) {
        _conversations = newConvs;
        if (_tab === "messages") {
          _renderConvList();
          if (_activeConvId) {
            const stillExists = _conversations.find((c2) => c2.id === _activeConvId);
            if (!stillExists) {
              if (_conversations.length) {
                _activeConvId = _conversations[0].id;
                _openConversation(_activeConvId);
              }
            } else {
              const conv = _conversations.find((c2) => c2.id === _activeConvId);
              if (conv && conv.unread > 0) {
                const msgsData = await API.getConversationMessages(_activeConvId);
                _renderChat(conv, msgsData.messages || []);
                _renderSidePanel(conv);
                await API.markConversationRead(_activeConvId);
                conv.unread = 0;
                _renderConvList();
              }
            }
          }
        }
      }
    } catch (e) {
    }
  }
  function _updateUnreadBadge() {
    const total = _conversations.reduce((s, c2) => s + (c2.unread || 0), 0);
    $("sidebarMsgCount").textContent = total > 0 ? total : _conversations.length;
  }
  window.loadMessages = loadMessages;
  window.startMsgPolling = startMsgPolling;
  window.stopMsgPolling = stopMsgPolling;
  async function loadTasacionRequests() {
    var _a, _b, _c;
    const list = $("tasacionReqList");
    list.innerHTML = '<div class="loading-state">Cargando solicitudes...</div>';
    try {
      const res = await API.getTasacionRequests();
      const reqs = res.requests || [];
      const stats = await API.getTasacionStats().catch(() => ({}));
      $("sidebarTasacionCount").textContent = ((_a = stats.pendientes) != null ? _a : reqs.filter((r) => r.status === "pendiente").length) || reqs.length;
      $("tasacionReqSubtitle").textContent = `${reqs.length} solicitud${reqs.length !== 1 ? "es" : ""} \xB7 ${(_b = stats.pendientes) != null ? _b : reqs.filter((r) => r.status === "pendiente").length} pendiente${((_c = stats.pendientes) != null ? _c : 0) !== 1 ? "s" : ""}`;
      if (!reqs.length) {
        list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">\u{1F4CB}</div>
          <div class="empty-state-text">No hay solicitudes de tasaci\xF3n todav\xEDa.</div>
        </div>`;
        return;
      }
      const bar = `
      <div class="treq-toolbar">
        <label class="acm-chip">
          <input type="checkbox" class="acm-chip-input" id="treqSelectAll">
          <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Seleccionar todo</span></span>
        </label>
        <button class="btn btn-ghost btn-sm treq-btn-sm" onclick="batchTasacionAction('archive')">\u{1F4E6} Archivar seleccionadas</button>
        <button class="btn btn-ghost btn-sm treq-btn-sm" onclick="batchTasacionAction('unarchive')">\u{1F4C2} Desarchivar seleccionadas</button>
        <button class="btn btn-danger btn-sm treq-btn-sm" onclick="batchTasacionAction('delete')">\u{1F5D1} Eliminar seleccionadas</button>
        <span id="treqSelectedCount" class="treq-selected-count">0 seleccionadas</span>
      </div>`;
      list.innerHTML = bar + reqs.map((r) => buildTasacionCard(r)).join("");
      const selAll = $("treqSelectAll");
      if (selAll) {
        selAll.onclick = () => {
          document.querySelectorAll(".treq-checkbox").forEach((cb) => cb.checked = selAll.checked);
          updateTreqCount();
        };
        document.querySelectorAll(".treq-checkbox").forEach((cb) => {
          cb.onchange = updateTreqCount;
        });
      }
    } catch (e) {
      list.innerHTML = `<div class="loading-state">Error al cargar solicitudes.</div>`;
    }
  }
  function _safeMailto(str) {
    if (!str || typeof str !== "string") return "#";
    const cleaned = str.replace(/["'`<>]/g, "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleaned)) return "#";
    return "mailto:" + cleaned;
  }
  function _safeTel(str) {
    if (!str || typeof str !== "string") return "#";
    const digits = str.replace(/\D/g, "");
    return digits ? "tel:" + digits : "#";
  }
  var _PROPERTY_TYPE_LABELS = {
    casa: "Casa",
    departamento: "Departamento",
    terreno: "Terreno",
    local: "Local comercial",
    oficina: "Oficina",
    galpon: "Galp\xF3n",
    campo: "Campo",
    otro: "Otro"
  };
  var _MOTIVO_LABELS = {
    vender: "Quiero vender mi propiedad",
    particular: "Tasaci\xF3n particular",
    judicial: "Tasaci\xF3n Judicial"
  };
  function buildTasacionCard(r) {
    const date = r.created_at ? window.formatDateTime(r.created_at) : "";
    const propLabel = _PROPERTY_TYPE_LABELS[r.property_type] || r.property_type || "\u2014";
    const motivoLabel = _MOTIVO_LABELS[r.motivo] || r.motivo || "";
    const waMsg = encodeURIComponent(`Hola ${r.name}, te contactamos desde Bienenhaus. Recibimos tu solicitud de tasaci\xF3n para ${propLabel} en ${r.city}.`);
    const waNum = (r.phone || "").replace(/\D/g, "");
    const waLink = waNum ? `https://wa.me/${waNum}?text=${waMsg}` : "";
    const clientWaLink = r.email ? `https://wa.me/${window.WHATSAPP_NUMBER || "5493510000000"}?text=${encodeURIComponent("Hola, envi\xE9 una solicitud de tasaci\xF3n desde Bienenhaus.")}` : "";
    const statusColors = { pendiente: "#e67e22", contactado: "#3498db", completado: "#27ae60", archivado: "#95a5a6" };
    const statusColor = statusColors[r.status] || "#95a5a6";
    const emailStatusIcon = r.email_delivery_status === "sent" ? '<span class="treq-email-sent" title="Email enviado">\u2713</span>' : r.email_delivery_status === "failed" ? '<span class="treq-email-failed" title="Error al enviar email">\u2717</span>' : '<span class="treq-email-pending" title="Pendiente de env\xEDo">\u25CB</span>';
    return `
    <div class="msg-card" id="treq-${r.id}">
      <div class="msg-header">
        <label class="acm-chip" title="Seleccionar">
          <input type="checkbox" class="acm-chip-input treq-checkbox" value="${r.id}">
          <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text"></span></span>
        </label>
        <div class="msg-header-left">
          <div>
            <div class="msg-name">${esc(r.name) || "\u2014"}</div>
            <div class="msg-date">${date}</div>
          </div>
        </div>
        <div class="msg-header-right">
          <select class="field-input field-input--select field-input--select-sm"
                  onchange="updateTasacionStatus(${r.id}, this.value)">
            <option value="pendiente"  ${r.status === "pendiente" ? "selected" : ""}>Pendiente</option>
            <option value="contactado" ${r.status === "contactado" ? "selected" : ""}>Contactado</option>
            <option value="completado" ${r.status === "completado" ? "selected" : ""}>Completado</option>
            <option value="archivado"  ${r.status === "archivado" ? "selected" : ""}>Archivado</option>
          </select>
          <span class="status-dot" style="background:${statusColor}" title="${r.status}"></span>
          ${emailStatusIcon}
          <button class="btn btn-danger btn-sm" onclick="deleteTasacionRequest(${r.id})" title="Eliminar">\xD7</button>
        </div>
      </div>

      <div class="msg-contacts">
        <span class="msg-contact-chip msg-contact-chip--motivo">\u{1F3F7} ${propLabel}</span>
        ${motivoLabel ? `<span class="msg-contact-chip msg-contact-chip--motivo">\u{1F3AF} ${esc(motivoLabel)}</span>` : ""}
        ${r.city ? `<span class="msg-contact-chip msg-contact-chip--motivo">\u{1F4CD} ${esc(r.city)}</span>` : ""}
        ${r.email ? `<a href="${_safeMailto(r.email)}" class="msg-contact-chip">\u2709 ${esc(r.email)}</a>` : ""}
        ${r.phone ? `<a href="${_safeTel(r.phone)}" class="msg-contact-chip">\u{1F4DE} ${esc(r.phone)}</a>` : ""}
      </div>

      ${r.address ? `<div class="treq-address">\u{1F3E0} ${esc(r.address)}</div>` : ""}

      ${r.comments ? `<div class="msg-body">${esc(r.comments)}</div>` : ""}

      <div class="msg-actions">
        ${r.appraisal_id ? `<button class="btn btn-outline btn-sm treq-view-appraisal" onclick="openAppraisalFromRequest(${r.appraisal_id})">
              \u{1F4CB} Ver tasaci\xF3n: ${esc(r.appraisal_titulo || "#" + r.appraisal_id)}
            </button>` : `<button class="btn btn-primary btn-sm treq-create-appraisal" onclick="createAppraisalFromRequest(${r.id})">
              + Crear tasaci\xF3n
            </button>`}
        ${r.email && _safeMailto(r.email) !== "#" ? `<a href="mailto:${esc(r.email)}?subject=Bienenhaus%20-%20Tasaci%C3%B3n%20de%20${encodeURIComponent(propLabel)}&body=Hola ${encodeURIComponent(r.name)},%0A%0ARecibimos tu solicitud de tasaci\xF3n." class="btn btn-outline btn-sm">Responder por email</a>` : ""}
        ${waLink ? `<a href="${waLink}" target="_blank" class="btn btn-wapp btn-sm">Responder por WhatsApp</a>` : ""}
        ${clientWaLink ? `<a href="${clientWaLink}" target="_blank" class="btn btn-ghost btn-sm treq-btn-sm" title="Enlace de WhatsApp enviado al cliente">\u{1F517} WhatsApp cliente</a>` : ""}
      </div>
    </div>`;
  }
  async function createAppraisalFromRequest(requestId) {
    try {
      const res = await _req("POST", `/api/appraisals/from-request/${requestId}`, null);
      const a = res.appraisal;
      if (!a) {
        toast("Error al crear tasaci\xF3n", "error");
        return;
      }
      if (res.existing) {
        toast(`Ya existe una tasaci\xF3n desde esta solicitud.`, "info");
      } else {
        toast("Tasaci\xF3n creada correctamente", "ok");
      }
      switchTab("appraisals");
      setTimeout(() => openAppraisalDetail(a.id), 300);
    } catch (e) {
      toast(e.message || "Error al crear tasaci\xF3n", "error");
    }
  }
  async function updateTasacionStatus(id, status) {
    if (!await confirmModal(`\xBFCambiar estado a "${status}"?`)) return;
    try {
      await API.updateTasacionStatus(id, { status });
      loadTasacionRequests();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function deleteTasacionRequest(id) {
    if (!confirm("\xBFEliminar esta solicitud?")) return;
    try {
      await API.deleteTasacionRequest(id);
      const card = $(`treq-${id}`);
      if (card) card.remove();
      loadTasacionRequests();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function updateTreqCount() {
    const checked = document.querySelectorAll(".treq-checkbox:checked").length;
    const el = $("treqSelectedCount");
    if (el) el.textContent = `${checked} seleccionada${checked !== 1 ? "s" : ""}`;
  }
  async function batchTasacionAction(action) {
    const checked = Array.from(document.querySelectorAll(".treq-checkbox:checked"));
    const ids = checked.map((cb) => parseInt(cb.value)).filter((n) => !isNaN(n));
    if (!ids.length) {
      toast("Seleccion\xE1 al menos una solicitud.", "warn");
      return;
    }
    const labels = { delete: "eliminar", archive: "archivar", unarchive: "desarchivar" };
    const label = labels[action] || action;
    if (!await confirmModal(`\xBF${label} ${ids.length} solicitud${ids.length !== 1 ? "es" : ""}?`)) return;
    try {
      const data = await _req("POST", "/api/tasacion/batch", { action, ids });
      toast(`${data.affected} solicitud${data.affected !== 1 ? "es" : ""} ${label}das`, "ok");
      loadTasacionRequests();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  window.loadTasacionRequests = loadTasacionRequests;
  window.updateTasacionStatus = updateTasacionStatus;
  window.deleteTasacionRequest = deleteTasacionRequest;
  window.createAppraisalFromRequest = createAppraisalFromRequest;
  window.batchTasacionAction = batchTasacionAction;
  async function loadBajas() {
    var _a, _b, _c;
    const list = $("bajaReqList");
    list.innerHTML = '<div class="loading-state">Cargando solicitudes...</div>';
    try {
      const data = await API.getBajas({ per_page: 100 });
      const reqs = data.requests || [];
      const stats = await API.getBajaStats().catch(() => ({}));
      $("sidebarBajaCount").textContent = (_a = stats.pendientes) != null ? _a : reqs.filter((r) => r.status === "pendiente").length;
      const sub = $("bajaSubtitle");
      if (sub) {
        const total = (_b = stats.total) != null ? _b : reqs.length;
        const pend = (_c = stats.pendientes) != null ? _c : reqs.filter((r) => r.status === "pendiente").length;
        sub.textContent = `${total} total \xB7 ${pend} pendiente${pend !== 1 ? "s" : ""}`;
      }
      renderBajaKpi(stats);
      if (!reqs.length) {
        list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">\u{1F6E1}\uFE0F</div>
          <div class="empty-state-text">No hay solicitudes de baja de datos.</div>
        </div>`;
        return;
      }
      list.innerHTML = reqs.map((r) => buildBajaCard(r)).join("");
    } catch (e) {
      list.innerHTML = '<div class="loading-state">Error al cargar solicitudes.</div>';
    }
  }
  function renderBajaKpi(stats) {
    const bar = $("bajaKpiBar");
    if (!bar) return;
    if (!stats || !stats.total) {
      bar.innerHTML = "";
      return;
    }
    bar.innerHTML = [
      { label: "Pendientes", num: stats.pendientes || 0, sub: "Sin atender" },
      { label: "En Proceso", num: stats.en_proceso || 0, sub: "En revisi\xF3n" },
      { label: "Completadas", num: stats.completadas || 0, sub: "Finalizadas" },
      { label: "Total", num: stats.total || 0, sub: "Solicitudes" }
    ].map((c2) => `
    <div class="appr-kpi-card">
      <span class="appr-kpi-label">${c2.label}</span>
      <span class="appr-kpi-number">${c2.num}</span>
      <span class="appr-kpi-sub">${c2.sub}</span>
    </div>
  `).join("");
  }
  function buildBajaCard(r) {
    const date = r.created_at ? window.formatDateTime(r.created_at) : "";
    const statusColors = { pendiente: "#e67e22", en_proceso: "#3498db", completada: "#27ae60", rechazada: "#e74c3c" };
    const statusColor = statusColors[r.status] || "#95a5a6";
    const motivoLabels = { supresion: "Supresi\xF3n", rectificacion: "Rectificaci\xF3n", oposicion: "Oposici\xF3n", limitacion: "Limitaci\xF3n", portabilidad: "Portabilidad" };
    const motivoLabel = motivoLabels[r.motivo] || r.motivo || "\u2014";
    return `
    <div class="msg-card" id="baja-${r.id}">
      <div class="msg-header">
        <div class="msg-header-left">
          <div>
            <div class="msg-name">${esc(r.name) || "\u2014"}</div>
            <div class="msg-date">${date}</div>
          </div>
        </div>
        <div class="msg-header-right">
          <select class="field-input field-input--select field-input--select-sm"
                  onchange="updateBajaStatus(${r.id}, this.value)">
            <option value="pendiente"  ${r.status === "pendiente" ? "selected" : ""}>Pendiente</option>
            <option value="en_proceso" ${r.status === "en_proceso" ? "selected" : ""}>En proceso</option>
            <option value="completada" ${r.status === "completada" ? "selected" : ""}>Completada</option>
            <option value="rechazada" ${r.status === "rechazada" ? "selected" : ""}>Rechazada</option>
          </select>
          <span class="status-dot" style="background:${statusColor}" title="${r.status}"></span>
          <button class="btn btn-danger btn-sm" onclick="deleteBajaRequest(${r.id})" title="Eliminar">\xD7</button>
        </div>
      </div>

      <div class="msg-contacts">
        <span class="msg-contact-chip msg-contact-chip--motivo">\u{1F3AF} ${esc(motivoLabel)}</span>
        ${r.email ? `<a href="mailto:${esc(r.email)}" class="msg-contact-chip">\u2709 ${esc(r.email)}</a>` : ""}
        ${r.phone ? `<a href="tel:${r.phone.replace(/\D/g, "")}" class="msg-contact-chip">\u{1F4DE} ${esc(r.phone)}</a>` : ""}
        ${r.read ? '<span class="msg-contact-chip msg-contact-chip--read">\u2713 Le\xEDdo</span>' : '<span class="msg-contact-chip msg-contact-chip--unread">\u25CB No le\xEDdo</span>'}
      </div>

      ${r.message ? `<div class="msg-body">${esc(r.message)}</div>` : ""}

      <div class="msg-actions">
        ${r.email ? `<a href="mailto:${esc(r.email)}?subject=Bienenhaus%20-%20Solicitud%20de%20baja&body=Hola ${encodeURIComponent(r.name)},%0A%0ARecibimos tu solicitud de baja de datos personales." class="btn btn-outline btn-sm">Responder por email</a>` : ""}
        ${r.phone ? `<a href="https://wa.me/${r.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hola " + r.name + ", te contactamos desde Bienenhaus por tu solicitud de baja de datos.")}" target="_blank" class="btn btn-wapp btn-sm">Responder por WhatsApp</a>` : ""}
        <button class="btn btn-ghost btn-sm" onclick="updateBajaRead(${r.id})">${r.read ? "Marcar no le\xEDdo" : "Marcar le\xEDdo"}</button>
      </div>
    </div>`;
  }
  async function updateBajaStatus(id, status) {
    if (!await confirmModal(`\xBFCambiar estado a "${status}"?`)) return;
    try {
      await API.updateBaja(id, { status });
      loadBajas();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function updateBajaRead(id) {
    var _a;
    try {
      const data = await API.getBajas({ per_page: 1 });
      const req = (_a = data.requests) == null ? void 0 : _a.find((r) => r.id === id);
      if (!req) return;
      await API.updateBaja(id, { read: !req.read });
      loadBajas();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function deleteBajaRequest(id) {
    if (!confirm("\xBFEliminar esta solicitud de baja?")) return;
    try {
      await API.deleteBaja(id);
      loadBajas();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  window.loadBajas = loadBajas;
  window.updateBajaStatus = updateBajaStatus;
  window.updateBajaRead = updateBajaRead;
  window.deleteBajaRequest = deleteBajaRequest;
  var _topPage = 1;
  var _rTopPage = 1;
  var PER_PAGE = 5;
  function _paginate(items, page) {
    const from = (page - 1) * PER_PAGE;
    return items.slice(from, from + PER_PAGE);
  }
  function _pageCount(items) {
    return Math.max(1, Math.ceil(items.length / PER_PAGE));
  }
  function _paginationHtml(page, total, prefix) {
    if (total <= 1) return "";
    let html = '<div class="pagination"><div class="page-numbers">';
    html += `<button class="page-btn page-btn--nav" data-${prefix}-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>&laquo; Anterior</button>`;
    for (let i = 1; i <= total; i++) {
      if (total > 7 && i > 2 && i < total - 1 && Math.abs(i - page) > 1) {
        if (i === 3 || i === total - 2) html += '<span class="page-dots">...</span>';
        continue;
      }
      html += `<button class="page-btn ${i === page ? "page-btn--active" : ""}" data-${prefix}-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn page-btn--nav" data-${prefix}-page="${page + 1}" ${page >= total ? "disabled" : ""}>Siguiente &raquo;</button>`;
    html += "</div></div>";
    return html;
  }
  function _topCard(p, i, maxViews, statusClass2, fmtPriceFn, trendHtml) {
    const viewsPct = Math.round(p.views / maxViews * 100);
    return `
    <div class="dash-top-card">
      <span class="dash-top-rank">${i + 1}</span>
      ${p.image ? `<img class="dash-top-thumb" src="${p.image}" alt="" loading="lazy" onerror="this.style.display='none'"/>` : `<div class="dash-top-thumb dash-top-thumb--placeholder"></div>`}
      <div class="dash-top-info">
        <div class="dash-top-title">${p.title} ${trendHtml(p.views_last_7, p.views_prev_7)}</div>
        <div class="dash-top-meta">
          <span class="dash-top-loc">${p.location || ""}</span>
          <span class="dash-top-price">${fmtPriceFn(p)}</span>
        </div>
        <div class="dash-top-bar">
          <div class="dash-top-bar-fill" style="width:${viewsPct}%"></div>
        </div>
      </div>
      <div class="dash-top-views-wrap">
        <div class="dash-top-views">${p.views}</div>
        <div class="dash-top-views-label">vistas</div>
        <span class="dash-top-status ${statusClass2[p.status] || ""}">${p.status}</span>
      </div>
    </div>`;
  }
  function _sparkline(data, w, h) {
    const vals = Object.values(data).map(Number);
    if (!vals.length) return "";
    const max = Math.max(...vals, 1);
    const min = Math.min(...vals, 0);
    const range = max - min || 1;
    const pts = vals.map((v, i) => {
      const x = i / (vals.length - 1 || 1) * w;
      const y = h - (v - min) / range * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const color = vals[vals.length - 1] >= vals[0] ? "var(--accent)" : "#cc4444";
    return `<svg class="dash-sparkline" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <polyline fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" points="${pts}" opacity=".7"/>
  </svg>`;
  }
  function _trendBadge(current, previous) {
    if (current == null || previous == null) return "";
    const diff = current - previous;
    if (diff === 0) return '<span class="dash-trend trend-flat">\u2014 0%</span>';
    const pct = previous ? Math.round(diff / previous * 100) : 100;
    const cls = diff > 0 ? "trend-up" : "trend-down";
    const arr = diff > 0 ? "\u25B2" : "\u25BC";
    return `<span class="dash-trend ${cls}">${arr} ${Math.abs(pct)}%</span>`;
  }
  function crmSub(s) {
    var _a;
    if (!s.leads_total) return "Sin prospectos a\xFAn";
    const parts = [];
    if ((_a = s.leads_by_status) == null ? void 0 : _a.nuevo) parts.push(`${s.leads_by_status.nuevo} nuevos`);
    if (s.leads_unassigned) parts.push(`${s.leads_unassigned} sin agente`);
    return parts.join(" \xB7 ");
  }
  async function loadDashboard() {
    var _a, _b;
    const wrap = $("dashboardContent");
    if (!wrap) return;
    wrap.innerHTML = '<div class="loading-state">Cargando estad\xEDsticas...</div>';
    try {
      let barChart2 = function(id, data, options = {}) {
        const entries = Object.entries(data);
        if (!entries.length) return `<div class="dash-empty">Sin datos a\xFAn</div>`;
        const max = Math.max(...entries.map(([, v]) => v), 1);
        const h = 120, w = entries.length * 32 + 20;
        const bars = entries.map(([k, v], i) => {
          const x = i * 32 + 10;
          const bh = Math.max(2, v / max * (h - 20));
          const y = h - 10 - bh;
          return `<rect class="${options.barClass || "chart-bar"}" x="${x}" y="${y}" width="18" height="${bh}" rx="2"
                     onmouseenter="showChartTip(event,'${v}','${k}')"
                     onmouseleave="hideChartTip()"/>`;
        }).join("");
        const labels = entries.map(([k], i) => {
          const x = i * 32 + 19;
          return `<text class="chart-x-label" x="${x}" y="${h - 2}">${k.length > 7 ? k.slice(0, 6) : k}</text>`;
        }).join("");
        return `
        <div class="dash-chart-wrap">
          <svg class="chart-svg" viewBox="0 0 ${w} ${h}">${bars}${labels}</svg>
          <div class="chart-tooltip" id="chartTip"></div>
        </div>`;
      }, horizBars2 = function(data, max, color) {
        const entries = Object.entries(data);
        if (!entries.length) return '<div class="dash-empty">Sin datos</div>';
        const m = max || Math.max(...entries.map(([, v]) => v), 1);
        return entries.map(([k, v]) => `
        <div class="dash-type-row">
          <span class="dash-type-label">${k}</span>
          <div class="dash-type-bar-wrap">
            <div class="dash-type-bar" style="width:${Math.round(v / m * 100)}%;background:${color || "var(--accent)"}"></div>
          </div>
          <span class="dash-type-count">${v}</span>
        </div>`).join("");
      }, trendHtml2 = function(l7, p7) {
        if (l7 == null || p7 == null) return "";
        if (l7 === 0 && p7 === 0) return "";
        const diff = l7 - p7;
        const pct2 = p7 ? Math.round(diff / p7 * 100) : 100;
        const cls = diff > 0 ? "trend-up" : diff < 0 ? "trend-down" : "";
        const arr = diff > 0 ? "\u25B2" : diff < 0 ? "\u25BC" : "\u2014";
        return `<span class="dash-trend ${cls}">${arr} ${Math.abs(pct2)}%</span>`;
      }, _renderTopSection2 = function(items, maxViews2, statusClass3, page, fmtPriceFn) {
        if (!items.length) return '<div class="dash-empty">Las visitas aparecer\xE1n aqu\xED cuando alguien abra una propiedad.</div>';
        const total = _pageCount(items);
        if (page > total) page = total;
        const pageItems = _paginate(items, page);
        const cards2 = pageItems.map((p, i) => _topCard(p, (page - 1) * PER_PAGE + i, maxViews2, statusClass3, fmtPriceFn, trendHtml2)).join("");
        return `<div class="dash-top-grid">${cards2}</div>${_paginationHtml(page, total, "top")}`;
      }, _renderRentalsTopSection2 = function(items, maxViews2, statusClass3, page) {
        if (!items.length) return '<div class="dash-empty">Las visitas aparecer\xE1n aqu\xED cuando alguien abra un alquiler.</div>';
        const total = _pageCount(items);
        if (page > total) page = total;
        const pageItems = _paginate(items, page);
        const cards2 = pageItems.map((p, i) => _topCard(p, (page - 1) * PER_PAGE + i, maxViews2, statusClass3, (p2) => fmtAR(p2.price_ars), trendHtml2)).join("");
        return `<div class="dash-top-grid">${cards2}</div>${_paginationHtml(page, total, "rtop")}`;
      };
      var barChart = barChart2, horizBars = horizBars2, trendHtml = trendHtml2, _renderTopSection = _renderTopSection2, _renderRentalsTopSection = _renderRentalsTopSection2;
      const from = ((_a = $("df")) == null ? void 0 : _a.value) || "";
      const to = ((_b = $("dt")) == null ? void 0 : _b.value) || "";
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const url = "/api/stats" + (qs.toString() ? "?" + qs : "");
      const res = await fetch(url, { credentials: "same-origin" });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      const s = d.data;
      wrap.innerHTML = "";
      const cards = [
        { label: "Propiedades", n: s.total, sub: `${s.disponible} disponibles \xB7 ${s.vendida} vendidas`, accent: false },
        { label: "Disponibles", n: s.disponible, sub: "En el mercado ahora", accent: true },
        { label: "Vendidas", n: s.vendida, sub: "Operaciones cerradas", accent: false },
        { label: "Visitas totales", n: s.total_views, sub: `${s.avg_views} prom. por prop.`, accent: true },
        { label: "Precio promedio", n: fmtPrice(s.avg_price), sub: "Valor de mercado medio", accent: false },
        { label: "Mensajes", n: s.total_msgs, sub: `${s.unread_msgs} sin leer \xB7 ${s.msgs_this_month} este mes`, accent: true },
        { label: "Conv. vistas\u2192msgs", n: `${s.conversion_rate}%`, sub: "Tasa de conversi\xF3n", accent: false },
        { label: "Agentes", n: s.agents, sub: "En el equipo", accent: true },
        { label: "Prospectos", n: s.leads_total || 0, sub: crmSub(s), accent: true }
      ];
      const rCards = [
        { label: "Alquileres", n: s.rentals_total, sub: `${s.rentals_disponible} disponibles \xB7 ${s.rentals_alquilada} alquiladas`, accent: false },
        { label: "Disponibles", n: s.rentals_disponible, sub: "Para alquilar ahora", accent: true },
        { label: "Alquiladas", n: s.rentals_alquilada, sub: "Contratos activos", accent: false },
        { label: "Visitas alq.", n: s.rentals_total_views, sub: `En todas las propiedades`, accent: true },
        { label: "Alq. promedio", n: fmtAR(s.rentals_avg_price), sub: "Precio de mercado medio", accent: false },
        { label: "Expensas prom.", n: fmtAR(s.rentals_expenses_avg), sub: "Gasto mensual promedio", accent: true },
        { label: "Amoblados", n: s.rentals_furnished, sub: `${s.rentals_total ? Math.round(s.rentals_furnished / s.rentals_total * 100) : 0}% del total`, accent: false },
        { label: "Destacados", n: s.rentals_featured, sub: `${s.rentals_total ? Math.round(s.rentals_featured / s.rentals_total * 100) : 0}% destacados`, accent: true }
      ];
      const cardsHtml = cards.map((card, i) => {
        var _a2, _b2, _c, _d;
        return `
      <div class="dash-card">
        <div class="dash-card-label">${card.label} ${i === 3 ? _sparkline(s.views_by_day, 48, 16) : ""}</div>
        <div class="dash-card-number${card.accent ? " accent" : ""}">${typeof card.n === "string" ? card.n : card.n.toLocaleString("es-AR")}</div>
        <div class="dash-card-sub">
          ${card.sub}
          ${i === 3 ? _trendBadge((_a2 = s.trends) == null ? void 0 : _a2.views_week, (_b2 = s.trends) == null ? void 0 : _b2.views_prev_week) : ""}
          ${i === 5 ? _trendBadge((_c = s.trends) == null ? void 0 : _c.msgs_week, (_d = s.trends) == null ? void 0 : _d.msgs_prev_week) : ""}
        </div>
      </div>`;
      }).join("");
      const rCardsHtml = rCards.map((card, i) => {
        var _a2, _b2;
        return `
      <div class="dash-card">
        <div class="dash-card-label">${card.label} ${i === 3 ? _sparkline(s.rentals_views_by_day, 48, 16) : ""}</div>
        <div class="dash-card-number${card.accent ? " accent" : ""}">${typeof card.n === "string" ? card.n : card.n.toLocaleString("es-AR")}</div>
        <div class="dash-card-sub">
          ${card.sub}
          ${i === 3 ? _trendBadge((_a2 = s.trends) == null ? void 0 : _a2.r_views_week, (_b2 = s.trends) == null ? void 0 : _b2.r_views_prev_week) : ""}
        </div>
      </div>`;
      }).join("");
      const maxType = Math.max(...Object.values(s.by_type), 1);
      const tipoNames = { casa: "Casa", departamento: "Departamento", finca: "Finca", terreno: "Terreno", local: "Local", otro: "Otro" };
      const typesHtml = Object.entries(s.by_type).sort((a, b) => b[1] - a[1]).map(([tipo, n]) => `
        <div class="dash-type-row">
          <span class="dash-type-label">${tipoNames[tipo] || tipo}</span>
          <div class="dash-type-bar-wrap">
            <div class="dash-type-bar" style="width:${Math.round(n / maxType * 100)}%"></div>
          </div>
          <span class="dash-type-count">${n}</span>
        </div>`).join("") || '<div class="dash-empty">Sin propiedades a\xFAn</div>';
      const maxViews = Math.max(...s.top_viewed.map((p) => p.views), 1);
      const statusClass2 = { disponible: "s-disponible", vendida: "s-vendida", oculta: "s-oculta" };
      const topHtml = _renderTopSection2(s.top_viewed, maxViews, statusClass2, _topPage, (p) => fmtPrice(p.price));
      const pct = s.total ? Math.round(s.disponible / s.total * 100) : 0;
      const estadoHtml = `
      <div class="dash-progress-section">
        <div class="dash-progress-head">
          <span class="dash-progress-label">Disponibles</span>
          <span class="dash-progress-value">${pct}%</span>
        </div>
        <div class="dash-progress-track">
          <div class="dash-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label">Disponibles</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar" style="width:${s.total ? s.disponible / s.total * 100 : 0}%"></div></div>
        <span class="dash-type-count">${s.disponible}</span>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label dash-label-sold">Vendidas</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-sold" style="width:${s.total ? s.vendida / s.total * 100 : 0}%"></div></div>
        <span class="dash-type-count">${s.vendida}</span>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label dash-label-hidden">Ocultas</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-hidden" style="width:${s.total ? s.oculta / s.total * 100 : 0}%"></div></div>
        <span class="dash-type-count">${s.oculta}</span>
      </div>
      <div class="dash-progress-sep">
        <div class="dash-type-row">
          <span class="dash-type-label">Destacadas</span>
          <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-featured" style="width:${s.total ? s.featured / s.total * 100 : 0}%"></div></div>
          <span class="dash-type-count">${s.featured}</span>
        </div>
      </div>`;
      const byMonthKeys = Object.keys(s.by_month || {}).sort();
      const byMonthSorted = {};
      byMonthKeys.forEach((k) => {
        byMonthSorted[k] = s.by_month[k];
      });
      const salesKeys = Object.keys(s.monthly_sales || {}).sort();
      const salesSorted = {};
      salesKeys.forEach((k) => {
        salesSorted[k] = s.monthly_sales[k];
      });
      const chartsHtml = `
      <div class="dash-charts">
        <div class="dash-chart-card">
          <div class="dash-chart-title">Publicadas por mes</div>
          ${barChart2("chartMonth", byMonthSorted, { barClass: "chart-bar" })}
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-title">Ventas mensuales</div>
          ${barChart2("chartSales", salesSorted, { barClass: "chart-bar bar-sale" })}
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-title">Visitas por d\xEDa (30 d\xEDas)</div>
          ${barChart2("chartViews", s.views_by_day || {}, { barClass: "chart-bar bar-view" })}
        </div>
      </div>`;
      const maxLoc = Math.max(...Object.values(s.by_location || {}), 1);
      const locationsHtml = horizBars2(s.by_location, maxLoc, "var(--accent)");
      const maxPriceRange = Math.max(...Object.values(s.price_ranges || {}), 1);
      const priceHtml = horizBars2(s.price_ranges, maxPriceRange, "#c9a84c");
      const msgsKeys = Object.keys(s.msgs_by_month || {}).sort();
      const msgsSorted = {};
      msgsKeys.forEach((k) => {
        msgsSorted[k] = s.msgs_by_month[k];
      });
      const maxAgentProps = Math.max(...(s.agents_detail || []).map((a) => a.properties), 1);
      const agentsHtml = (s.agents_detail || []).length ? (s.agents_detail || []).map((a) => `
        <div class="dash-type-row">
          ${a.avatar ? `<img class="dash-agent-avatar" src="${a.avatar}" alt="${a.name}"/>` : `<div class="dash-agent-avatar dash-agent-avatar--empty">${(a.name[0] || "?").toUpperCase()}</div>`}
          <span class="dash-type-label dash-agent-name">${a.name}</span>
          <div class="dash-type-bar-wrap dash-agent-bar-wrap">
            <div class="dash-type-bar" style="width:${Math.round(a.properties / maxAgentProps * 100)}%"></div>
          </div>
          <span class="dash-type-count">${a.properties}</span>
        </div>`).join("") : '<div class="dash-empty">Sin agentes</div>';
      const rMaxType = Math.max(...Object.values(s.rentals_by_type || {}), 1);
      const rTypesHtml = Object.entries(s.rentals_by_type || {}).sort((a, b) => b[1] - a[1]).map(([tipo, n]) => `
        <div class="dash-type-row">
          <span class="dash-type-label">${tipoNames[tipo] || tipo}</span>
          <div class="dash-type-bar-wrap">
            <div class="dash-type-bar rental-bar" style="width:${Math.round(n / rMaxType * 100)}%"></div>
          </div>
          <span class="dash-type-count">${n}</span>
        </div>`).join("") || '<div class="dash-empty">Sin alquileres a\xFAn</div>';
      const rPct = s.rentals_total ? Math.round(s.rentals_disponible / s.rentals_total * 100) : 0;
      const rEstadoHtml = `
      <div class="dash-progress-section">
        <div class="dash-progress-head">
          <span class="dash-progress-label">Disponibles</span>
          <span class="dash-progress-value">${rPct}%</span>
        </div>
        <div class="dash-progress-track">
          <div class="dash-progress-fill" style="width:${rPct}%"></div>
        </div>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label">Disponibles</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar rental-bar" style="width:${s.rentals_total ? s.rentals_disponible / s.rentals_total * 100 : 0}%"></div></div>
        <span class="dash-type-count">${s.rentals_disponible}</span>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label dash-label-sold">Alquiladas</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-sold" style="width:${s.rentals_total ? s.rentals_alquilada / s.rentals_total * 100 : 0}%"></div></div>
        <span class="dash-type-count">${s.rentals_alquilada}</span>
      </div>
      <div class="dash-type-row">
        <span class="dash-type-label dash-label-hidden">Ocultas</span>
        <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-hidden" style="width:${s.rentals_total ? s.rentals_oculta / s.rentals_total * 100 : 0}%"></div></div>
        <span class="dash-type-count">${s.rentals_oculta}</span>
      </div>
      <div class="dash-progress-sep">
        <div class="dash-type-row">
          <span class="dash-type-label">Destacados</span>
          <div class="dash-type-bar-wrap"><div class="dash-type-bar dash-bar-featured" style="width:${s.rentals_total ? s.rentals_featured / s.rentals_total * 100 : 0}%"></div></div>
          <span class="dash-type-count">${s.rentals_featured}</span>
        </div>
      </div>`;
      const rByMonthKeys = Object.keys(s.rentals_by_month || {}).sort();
      const rByMonthSorted = {};
      rByMonthKeys.forEach((k) => {
        rByMonthSorted[k] = s.rentals_by_month[k];
      });
      const rRentedKeys = Object.keys(s.rentals_monthly_rented || {}).sort();
      const rRentedSorted = {};
      rRentedKeys.forEach((k) => {
        rRentedSorted[k] = s.rentals_monthly_rented[k];
      });
      const rChartsHtml = `
      <div class="dash-charts">
        <div class="dash-chart-card">
          <div class="dash-chart-title">Alquileres publicados por mes</div>
          ${barChart2("rChartMonth", rByMonthSorted, { barClass: "chart-bar bar-rental" })}
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-title">Alquileres mensuales</div>
          ${barChart2("rChartRented", rRentedSorted, { barClass: "chart-bar bar-rented" })}
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-title">Visitas a alquileres por d\xEDa (30 d\xEDas)</div>
          ${barChart2("rChartViews", s.rentals_views_by_day || {}, { barClass: "chart-bar bar-rview" })}
        </div>
      </div>`;
      const rMaxLoc = Math.max(...Object.values(s.rentals_by_location || {}), 1);
      const rLocationsHtml = horizBars2(s.rentals_by_location, rMaxLoc, "#e67e22");
      const rMaxViews = Math.max(...(s.rentals_top_viewed || []).map((p) => p.views), 1);
      const rStatusClass = { disponible: "s-disponible", alquilada: "s-vendida", oculta: "s-oculta" };
      const rTopHtml = _renderRentalsTopSection2(s.rentals_top_viewed || [], rMaxViews, rStatusClass, _rTopPage);
      const filterHtml = `
      <div class="dash-filter-bar">
        <label class="dash-filter-label">Desde</label>
        <input id="df" type="date" class="dash-filter-input" value="${from}"/>
        <label class="dash-filter-label">Hasta</label>
        <input id="dt" type="date" class="dash-filter-input" value="${to}"/>
        <button class="btn btn-primary btn-sm" onclick="loadDashboard()">Filtrar</button>
        ${from || to ? `<button class="btn btn-ghost btn-sm" onclick="document.getElementById('df').value='';document.getElementById('dt').value='';loadDashboard()">Limpiar</button>` : ""}
      </div>`;
      wrap.innerHTML = filterHtml + `
      <div class="dash-section-title">Ventas</div>
      <div class="dash-cards dash-cards--8">${cardsHtml}</div>
      ${chartsHtml}
      <div class="dash-grid-3">
        <div class="dash-panel">
          <div class="dash-panel-title">Por tipo de propiedad</div>
          ${typesHtml}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Estado del portfolio</div>
          ${estadoHtml}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Precio por rango</div>
          ${priceHtml}
        </div>
      </div>
      <div class="dash-grid-2">
        <div class="dash-panel">
          <div class="dash-panel-title">Ubicaciones</div>
          ${locationsHtml}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Mensajes por mes</div>
          ${barChart2("chartMsgs", msgsSorted, { barClass: "chart-bar bar-msg" })}
        </div>
      </div>
      <div class="dash-grid-2">
        <div class="dash-panel">
          <div class="dash-panel-title">Rendimiento de agentes</div>
          ${agentsHtml}
        </div>
        <div class="dash-panel" id="topViewedPanel">
          <div class="dash-panel-title">Propiedades m\xE1s vistas</div>
          ${topHtml}
        </div>
      </div>

      <div class="dash-divider"></div>
      <div class="dash-section-title">Alquileres</div>
      <div class="dash-cards dash-cards--8">${rCardsHtml}</div>
      ${rChartsHtml}
      <div class="dash-grid-3">
        <div class="dash-panel">
          <div class="dash-panel-title">Por tipo de alquiler</div>
          ${rTypesHtml}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Estado del portfolio</div>
          ${rEstadoHtml}
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Ubicaciones</div>
          ${rLocationsHtml}
        </div>
      </div>
      <div class="dash-panel" id="rTopViewedPanel">
        <div class="dash-panel-title">Alquileres m\xE1s vistos</div>
        ${rTopHtml}
      </div>`;
      wrap.removeEventListener("click", wrap._onPageClick);
      wrap._onPageClick = function _onPageClick(e) {
        const btn = e.target.closest(".page-btn[data-top-page]");
        if (btn && !btn.disabled) {
          const page = parseInt(btn.dataset.topPage);
          if (isNaN(page) || page < 1) return;
          _topPage = page;
          const panel = $("topViewedPanel");
          if (panel) {
            panel.innerHTML = `<div class="dash-panel-title">Propiedades m&aacute;s vistas</div>` + _renderTopSection2(s.top_viewed, maxViews, statusClass2, _topPage, (p) => fmtPrice(p.price));
          }
          return;
        }
        const rBtn = e.target.closest(".page-btn[data-rtop-page]");
        if (rBtn && !rBtn.disabled) {
          const page = parseInt(rBtn.dataset.rtopPage);
          if (isNaN(page) || page < 1) return;
          _rTopPage = page;
          const panel = $("rTopViewedPanel");
          if (panel) {
            panel.innerHTML = `<div class="dash-panel-title">Alquileres m&aacute;s vistos</div>` + _renderRentalsTopSection2(s.rentals_top_viewed || [], rMaxViews, rStatusClass, _rTopPage);
          }
          return;
        }
      };
      wrap.addEventListener("click", wrap._onPageClick);
    } catch (e) {
      wrap.innerHTML = '<div class="loading-state"></div>';
      wrap.firstChild.textContent = "Error al cargar estad\xEDsticas: " + (e.message || "");
    }
  }
  var _stgTab = "general";
  function renderSettings() {
    _stgTab = "general";
    renderStgSubtabs();
    renderStgGeneral();
  }
  window.renderSettings = renderSettings;
  function renderStgSubtabs() {
    var container = document.getElementById("stgSubtabs");
    if (!container) return;
    var categories = [
      { label: "Empresa", tabs: ["general", "branding", "localizacion"] },
      { label: "Sistema", tabs: ["notificaciones", "backups", "preferencias", "sistema"] },
      { label: "Seguridad", tabs: ["seguridad"] },
      { label: "Conectividad", tabs: ["integraciones"] }
    ];
    var labels = { general: "General", branding: "Branding", localizacion: "Localizaci\xF3n", notificaciones: "Notificaciones", backups: "Backups", preferencias: "Preferencias", sistema: "Sistema", seguridad: "Seguridad", integraciones: "Integraciones" };
    var html = "";
    categories.forEach(function(cat) {
      html += '<div class="stg-category">';
      html += '<span class="stg-category-label">' + cat.label + "</span>";
      html += '<div class="stg-category-tabs">';
      cat.tabs.forEach(function(t) {
        html += '<button class="stg-subtab' + (t === _stgTab ? " active" : "") + '" data-stg-tab="' + t + '">' + (labels[t] || t) + "</button>";
      });
      html += "</div></div>";
    });
    container.innerHTML = html;
  }
  async function renderStgGeneral() {
    setStgContent('<div class="loading-state">Cargando configuraci\xF3n...</div>');
    try {
      var s = await API._rawReq("GET", "/api/settings-center/general");
      var html = '<div class="stg-cards">';
      html += '<div class="stg-card">';
      html += '<div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><div><h2 class="stg-card-title">Empresa</h2><p class="stg-card-sub">Informaci\xF3n comercial del sitio</p></div></div>';
      html += '<div class="stg-grid-2">';
      html += field("stg_site_name", "Nombre comercial", s.site_name);
      html += field("stg_business_name", "Raz\xF3n social", s.business_name);
      html += field("stg_cuit", "CUIT/RUT", s.cuit);
      html += field("stg_email", "Email", s.email, "email");
      html += field("stg_phone", "Tel\xE9fono", s.phone);
      html += field("stg_website", "Sitio web", s.website || "https://bienenhaus.com.ar");
      html += field("stg_address", "Direcci\xF3n", s.address);
      html += field("stg_hours", "Horarios", s.hours);
      html += "</div>";
      html += stgActions("btnSaveGeneral");
      html += "</div>";
      html += '<div class="stg-card">';
      html += '<div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg></div><div><h2 class="stg-card-title">Contacto y Redes</h2><p class="stg-card-sub">Datos p\xFAblicos de contacto</p></div></div>';
      html += '<div class="stg-grid-2">';
      html += field("stg_whatsapp", "WhatsApp 1", s.whatsapp);
      html += field("stg_whatsapp2", "WhatsApp 2", s.whatsapp2);
      html += field("stg_instagram", "Instagram URL", s.instagram);
      html += field("stg_facebook", "Facebook URL", s.facebook);
      html += "</div>";
      html += stgActions("btnSaveGeneral");
      html += "</div>";
      html += '<div class="stg-card">';
      html += '<div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><div><h2 class="stg-card-title">Correo SMTP</h2><p class="stg-card-sub">Servidor de correo saliente</p></div></div>';
      html += '<div class="stg-grid-2">';
      html += field("stg_smtp_host", "Servidor SMTP", s.smtp_host);
      html += field("stg_smtp_port", "Puerto", s.smtp_port);
      html += field("stg_smtp_user", "Usuario", s.smtp_user);
      html += field("stg_smtp_pass", "Contrase\xF1a", s.smtp_pass, "password");
      html += field("stg_email_from", "Email remitente", s.email_from);
      html += field("stg_email_to", "Email destino", s.email_to);
      html += field("stg_webhook_url", "Webhook URL", s.webhook_url);
      html += "</div>";
      html += stgActions("btnSaveSmtp");
      html += "</div>";
      html += '<div class="stg-card">';
      html += '<div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><div><h2 class="stg-card-title">SEO y Analytics</h2><p class="stg-card-sub">Meta tags y Google Analytics</p></div></div>';
      html += '<div class="stg-grid-2">';
      html += field("stg_seo_site_name", "Nombre del sitio (SEO)", s.seo_site_name);
      html += field("stg_seo_description", "Descripci\xF3n (meta)", s.seo_description);
      html += field("stg_ga_id", "Google Analytics ID", s.ga_id);
      html += field("stg_hero_years", "A\xF1os de experiencia", s.hero_years);
      html += "</div>";
      html += stgActions("btnSaveSeo");
      html += "</div>";
      html += '<div class="stg-card">';
      html += '<div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div><div><h2 class="stg-card-title">Qui\xE9nes Somos</h2><p class="stg-card-sub">Contenido de la secci\xF3n principal</p></div></div>';
      html += '<div class="stg-grid-2">';
      html += field("stg_about_eyebrow", "Subt\xEDtulo", s.about_eyebrow);
      html += field("stg_about_lead", "Lead", s.about_lead);
      html += "</div>";
      html += '<div class="field"><label class="field-label">Body</label><textarea id="stg_about_body" class="field-input stg-textarea-sm">' + esc(s.about_body || "") + "</textarea></div>";
      html += '<div class="stg-grid-3">';
      html += field("stg_about_mision", "Misi\xF3n", s.about_mision);
      html += field("stg_about_vision", "Visi\xF3n", s.about_vision);
      html += field("stg_about_mercado", "A qui\xE9nes acompa\xF1amos", s.about_mercado);
      html += field("stg_about_ofrecemos", "Qu\xE9 ofrecemos", s.about_ofrecemos);
      html += field("stg_about_como", "C\xF3mo lo hacemos", s.about_como);
      html += "</div>";
      html += '<div class="stg-grid-3">';
      html += field("stg_about_valor1k", "Valor 1 nombre", s.about_valor1k);
      html += field("stg_about_valor2k", "Valor 2 nombre", s.about_valor2k);
      html += field("stg_about_valor3k", "Valor 3 nombre", s.about_valor3k);
      html += "</div>";
      html += '<div class="stg-grid-3">';
      html += field("stg_about_valor1v", "Valor 1 descripci\xF3n", s.about_valor1v);
      html += field("stg_about_valor2v", "Valor 2 descripci\xF3n", s.about_valor2v);
      html += field("stg_about_valor3v", "Valor 3 descripci\xF3n", s.about_valor3v);
      html += "</div>";
      html += stgActions("btnSaveAbout");
      html += "</div>";
      html += "</div>";
      setStgContent(html);
      wireSave("btnSaveGeneral", ["stg_site_name", "stg_business_name", "stg_cuit", "stg_email", "stg_phone", "stg_website", "stg_address", "stg_hours", "stg_whatsapp", "stg_whatsapp2", "stg_instagram", "stg_facebook"]);
      wireSave("btnSaveSmtp", ["stg_smtp_host", "stg_smtp_port", "stg_smtp_user", "stg_smtp_pass", "stg_email_from", "stg_email_to", "stg_webhook_url"]);
      wireSave("btnSaveSeo", ["stg_seo_site_name", "stg_seo_description", "stg_ga_id", "stg_hero_years"]);
      wireSave("btnSaveAbout", ["stg_about_eyebrow", "stg_about_lead", "stg_about_body", "stg_about_mision", "stg_about_vision", "stg_about_valor1k", "stg_about_valor1v", "stg_about_valor2k", "stg_about_valor2v", "stg_about_valor3k", "stg_about_valor3v", "stg_about_mercado", "stg_about_ofrecemos", "stg_about_como"]);
    } catch (e) {
      setStgContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  async function renderStgBranding() {
    setStgContent('<div class="loading-state">Cargando branding...</div>');
    try {
      var b = await API._rawReq("GET", "/api/settings-center/branding");
      var html = '<div class="stg-cards">';
      html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div><div><h2 class="stg-card-title">Logo y Marcas</h2><p class="stg-card-sub">Logos, favicon e im\xE1genes</p></div></div>';
      html += '<div class="stg-grid-2">';
      html += field("stg_logo_main", "Logo principal (URL)", b.logo_main);
      html += field("stg_logo_dark", "Logo oscuro (URL)", b.logo_dark);
      html += field("stg_logo_light", "Logo claro (URL)", b.logo_light);
      html += field("stg_favicon_url", "Favicon (URL)", b.favicon_url);
      html += field("stg_login_image", "Imagen de login (URL)", b.login_image);
      html += field("stg_public_image", "Imagen p\xFAblica (URL)", b.public_image);
      html += "</div>";
      html += stgActions("btnSaveBranding");
      html += "</div>";
      html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg></div><div><h2 class="stg-card-title">Colores y Tipograf\xEDa</h2><p class="stg-card-sub">Paleta de colores y fuente</p></div></div>';
      html += '<div class="stg-grid-3">';
      html += '<div class="field"><label class="field-label">Color primario</label><input id="stg_brand_primary_color" type="color" class="stg-color-input" value="' + esc(b.brand_primary_color || "#20b8ab") + '"/></div>';
      html += '<div class="field"><label class="field-label">Color secundario</label><input id="stg_brand_secondary_color" type="color" class="stg-color-input" value="' + esc(b.brand_secondary_color || "#1a1a2e") + '"/></div>';
      html += '<div class="field"><label class="field-label">Color de acento</label><input id="stg_brand_accent_color" type="color" class="stg-color-input" value="' + esc(b.brand_accent_color || "#e8a87c") + '"/></div>';
      html += "</div>";
      html += '<div class="field"><label class="field-label">Fuente principal</label><select id="stg_brand_font" class="field-input field-input--select">' + ["Inter", "Poppins", "Montserrat", "Playfair Display", "Lora", "DM Sans", "Public Sans"].map(function(f) {
        return '<option value="' + f + '"' + (b.brand_font === f ? " selected" : "") + ">" + f + "</option>";
      }).join("") + "</select></div>";
      html += stgActions("btnSaveBranding");
      html += "</div>";
      html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div><div><h2 class="stg-card-title">Vista previa en vivo</h2></div></div>';
      html += '<div class="stg-preview"><div class="stg-preview-name stg-preview-accent">Bienenhaus</div><div class="stg-preview-tagline">Propiedades \xB7 Asesoramiento \xB7 Inversiones</div></div>';
      html += "</div>";
      html += "</div>";
      setStgContent(html);
      wireSave("btnSaveBranding", ["stg_logo_main", "stg_logo_dark", "stg_logo_light", "stg_favicon_url", "stg_login_image", "stg_public_image", "stg_brand_primary_color", "stg_brand_secondary_color", "stg_brand_accent_color", "stg_brand_font"], "/api/settings-center/branding");
    } catch (e) {
      setStgContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  async function renderStgOficinas() {
    setStgContent('<div class="loading-state">Cargando oficinas...</div>');
    try {
      var offices = await API._rawReq("GET", "/api/settings-center/offices");
      var html = '<div class="stg-office-header"><h3 class="stg-office-title">Oficinas</h3><button class="btn btn-primary btn-sm" onclick="stgOpenOfficeForm(null)">+ Nueva oficina</button></div>';
      if (!offices || !offices.length) {
        html += '<div class="empty-state">Sin oficinas registradas</div>';
      } else {
        offices.forEach(function(o) {
          var activeBadge = o.active ? '<span class="admin-status-badge status-disponible">Activa</span>' : '<span class="admin-status-badge status-oculta">Inactiva</span>';
          html += '<div class="stg-office-card">';
          html += '<div class="stg-office-avatar">\u{1F3E2}</div>';
          html += '<div class="stg-office-info"><div class="stg-office-name">' + esc(o.name) + " " + activeBadge + "</div>";
          html += '<div class="stg-office-detail">' + esc(o.address) + (o.city ? ", " + esc(o.city) : "") + (o.phone ? " \xB7 " + esc(o.phone) : "") + (o.manager ? " \xB7 Resp: " + esc(o.manager) : "") + "</div></div>";
          html += '<div class="stg-office-actions">';
          html += '<button class="btn btn-ghost btn-sm" onclick="stgOpenOfficeForm(' + o.id + ')">Editar</button>';
          html += '<button class="btn btn-ghost btn-sm stg-danger-btn" onclick="stgDeleteOffice(' + o.id + ')">Eliminar</button>';
          html += "</div></div>";
        });
      }
      setStgContent(html);
    } catch (e) {
      setStgContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  function stgOpenOfficeForm(oid) {
    var offices = [];
    var isEdit = !!oid;
    API._rawReq("GET", "/api/settings-center/offices").then(function(data) {
      offices = data || [];
      var o = isEdit ? offices.find(function(x) {
        return x.id === oid;
      }) : {};
      var title = isEdit ? "Editar oficina" : "Nueva oficina";
      var modal = document.getElementById("stgOfficeFormModal");
      var content = document.getElementById("stgOfficeFormContent");
      document.getElementById("stgOfficeFormTitle").textContent = title;
      content.innerHTML = '<div class="pf-body"><div class="stg-grid-2"><div class="field"><label class="field-label">Nombre *</label><input id="of_name" class="field-input" value="' + esc((o || {}).name || "") + '"/></div><div class="field"><label class="field-label">Tel\xE9fono</label><input id="of_phone" class="field-input" value="' + esc((o || {}).phone || "") + '"/></div><div class="field stg-field-full"><label class="field-label">Direcci\xF3n</label><input id="of_address" class="field-input" value="' + esc((o || {}).address || "") + '"/></div><div class="field"><label class="field-label">Ciudad</label><input id="of_city" class="field-input" value="' + esc((o || {}).city || "") + '"/></div><div class="field"><label class="field-label">Provincia</label><input id="of_province" class="field-input" value="' + esc((o || {}).province || "") + '"/></div><div class="field"><label class="field-label">Pa\xEDs</label><input id="of_country" class="field-input" value="' + esc((o || {}).country || "Argentina") + '"/></div><div class="field"><label class="field-label">Responsable</label><input id="of_manager" class="field-input" value="' + esc((o || {}).manager || "") + '"/></div><div class="field"><label class="field-label">Horario</label><input id="of_schedule" class="field-input" value="' + esc((o || {}).schedule || "") + '"/></div><div class="field stg-field-row"><label class="acm-chip"><input type="checkbox" class="acm-chip-input" id="of_active" ' + ((o || {}).active !== false ? "checked" : "") + '/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Activa</span></span></label></div></div><div class="stg-btn-row"><button class="btn btn-primary btn-full" id="saveOfficeBtn">' + (isEdit ? "Guardar" : "Crear") + `</button><button class="btn btn-ghost" onclick="document.getElementById('stgOfficeFormModal').classList.add('hidden')">Cancelar</button></div></div>`;
      modal.classList.remove("hidden");
      document.getElementById("saveOfficeBtn").onclick = function() {
        var name = document.getElementById("of_name").value.trim();
        if (!name) {
          toast("El nombre es requerido", "warn");
          return;
        }
        var body = { name, phone: document.getElementById("of_phone").value, address: document.getElementById("of_address").value, city: document.getElementById("of_city").value, province: document.getElementById("of_province").value, country: document.getElementById("of_country").value, manager: document.getElementById("of_manager").value, schedule: document.getElementById("of_schedule").value, active: document.getElementById("of_active").checked };
        var url = isEdit ? "/api/settings-center/offices/" + oid : "/api/settings-center/offices";
        var method = isEdit ? "PUT" : "POST";
        API._rawReq(method, url, body).then(function() {
          modal.classList.add("hidden");
          toast(isEdit ? "Oficina actualizada" : "Oficina creada", "success");
          renderStgOficinas();
        }).catch(function(err) {
          toast(err.message, "error");
        });
      };
    }).catch(function(err) {
      toast(err.message, "error");
    });
  }
  window.stgOpenOfficeForm = stgOpenOfficeForm;
  function stgDeleteOffice(oid) {
    if (!confirmModal("\xBFEliminar esta oficina?")) return;
    API._rawReq("DELETE", "/api/settings-center/offices/" + oid).then(function() {
      toast("Oficina eliminada", "success");
      renderStgOficinas();
    }).catch(function(err) {
      toast(err.message, "error");
    });
  }
  window.stgDeleteOffice = stgDeleteOffice;
  async function renderStgLocalizacion() {
    setStgContent('<div class="loading-state">Cargando...</div>');
    try {
      var l = await API._rawReq("GET", "/api/settings-center/localization");
      var html = '<div class="stg-cards"><div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></div><div><h2 class="stg-card-title">Localizaci\xF3n</h2><p class="stg-card-sub">Formato regional del sitio</p></div></div>';
      html += '<div class="stg-grid-2">';
      html += '<div class="field"><label class="field-label">Idioma</label><select id="stg_locale_language" class="field-input field-input--select"><option value="es"' + (l.locale_language === "es" || !l.locale_language ? " selected" : "") + '>Espa\xF1ol</option><option value="en"' + (l.locale_language === "en" ? " selected" : "") + '>English</option><option value="pt"' + (l.locale_language === "pt" ? " selected" : "") + ">Portugu\xEAs</option></select></div>";
      html += '<div class="field"><label class="field-label">Moneda</label><select id="stg_locale_currency" class="field-input field-input--select"><option value="ARS"' + (l.locale_currency === "ARS" || !l.locale_currency ? " selected" : "") + '>ARS (Peso argentino)</option><option value="USD"' + (l.locale_currency === "USD" ? " selected" : "") + '>USD (D\xF3lar)</option><option value="EUR"' + (l.locale_currency === "EUR" ? " selected" : "") + ">EUR (Euro)</option></select></div>";
      html += '<div class="field"><label class="field-label">Zona horaria</label><select id="stg_locale_timezone" class="field-input field-input--select"><option value="America/Argentina/Buenos_Aires"' + (l.locale_timezone === "America/Argentina/Buenos_Aires" || !l.locale_timezone ? " selected" : "") + '>Argentina (GMT-3)</option><option value="America/Santiago"' + (l.locale_timezone === "America/Santiago" ? " selected" : "") + '>Chile (GMT-3)</option><option value="America/Mexico_City"' + (l.locale_timezone === "America/Mexico_City" ? " selected" : "") + '>M\xE9xico (GMT-6)</option><option value="America/New_York"' + (l.locale_timezone === "America/New_York" ? " selected" : "") + '>New York (GMT-5)</option><option value="Europe/Madrid"' + (l.locale_timezone === "Europe/Madrid" ? " selected" : "") + ">Madrid (GMT+1)</option></select></div>";
      html += '<div class="field"><label class="field-label">Formato de fecha</label><select id="stg_locale_date_format" class="field-input field-input--select"><option value="DD/MM/YYYY"' + (l.locale_date_format === "DD/MM/YYYY" || !l.locale_date_format ? " selected" : "") + '>DD/MM/YYYY</option><option value="MM/DD/YYYY"' + (l.locale_date_format === "MM/DD/YYYY" ? " selected" : "") + '>MM/DD/YYYY</option><option value="YYYY-MM-DD"' + (l.locale_date_format === "YYYY-MM-DD" ? " selected" : "") + ">YYYY-MM-DD</option></select></div>";
      html += '<div class="field"><label class="field-label">Formato de hora</label><select id="stg_locale_time_format" class="field-input field-input--select"><option value="24h"' + (l.locale_time_format === "24h" || !l.locale_time_format ? " selected" : "") + '>24 horas</option><option value="12h"' + (l.locale_time_format === "12h" ? " selected" : "") + ">12 horas (AM/PM)</option></select></div>";
      html += '<div class="field"><label class="field-label">Sistema m\xE9trico</label><select id="stg_locale_metric_system" class="field-input field-input--select"><option value="metric"' + (l.locale_metric_system === "metric" || !l.locale_metric_system ? " selected" : "") + '>M\xE9trico (m\xB2, km)</option><option value="imperial"' + (l.locale_metric_system === "imperial" ? " selected" : "") + ">Imperial (ft\xB2, mi)</option></select></div>";
      html += '<div class="field"><label class="field-label">Separador decimal</label><select id="stg_locale_decimal_separator" class="field-input field-input--select"><option value="comma"' + (l.locale_decimal_separator === "comma" || !l.locale_decimal_separator ? " selected" : "") + '>Coma (1.234,56)</option><option value="dot"' + (l.locale_decimal_separator === "dot" ? " selected" : "") + ">Punto (1,234.56)</option></select></div>";
      html += "</div>" + stgActions("btnSaveLocalization") + "</div></div>";
      setStgContent(html);
      wireSave("btnSaveLocalization", ["stg_locale_language", "stg_locale_currency", "stg_locale_timezone", "stg_locale_date_format", "stg_locale_time_format", "stg_locale_metric_system", "stg_locale_decimal_separator"], "/api/settings-center/localization");
    } catch (e) {
      setStgContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  async function renderStgNotificaciones() {
    setStgContent('<div class="loading-state">Cargando...</div>');
    try {
      var n = await API._rawReq("GET", "/api/settings-center/notifications");
      var html = '<div class="stg-cards"><div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div><div><h2 class="stg-card-title">Notificaciones</h2><p class="stg-card-sub">Canales de notificaci\xF3n del sistema</p></div></div>';
      html += '<div class="stg-grid-2">';
      html += stgToggle("stg_notif_email_enabled", "Notificaciones por email", n.notif_email_enabled);
      html += stgToggle("stg_notif_push_enabled", "Notificaciones push", n.notif_push_enabled);
      html += stgToggle("stg_notif_whatsapp_enabled", "Notificaciones WhatsApp", n.notif_whatsapp_enabled);
      html += stgToggle("stg_notif_internal_enabled", "Notificaciones internas", n.notif_internal_enabled);
      html += '<div class="field"><label class="field-label">Recordatorios</label><select id="stg_notif_reminders" class="field-input field-input--select"><option value="todas"' + (n.notif_reminders === "todas" || !n.notif_reminders ? " selected" : "") + '>Todas</option><option value="importantes"' + (n.notif_reminders === "importantes" ? " selected" : "") + '>Solo importantes</option><option value="ninguna"' + (n.notif_reminders === "ninguna" ? " selected" : "") + ">Ninguna</option></select></div>";
      html += '<div class="field"><label class="field-label">Notificaciones de marketing</label><select id="stg_notif_marketing" class="field-input field-input--select"><option value="todas"' + (n.notif_marketing === "todas" || !n.notif_marketing ? " selected" : "") + '>Todas</option><option value="resumen"' + (n.notif_marketing === "resumen" ? " selected" : "") + '>Resumen semanal</option><option value="ninguna"' + (n.notif_marketing === "ninguna" ? " selected" : "") + ">Ninguna</option></select></div>";
      html += '<div class="field"><label class="field-label">Sonidos</label><select id="stg_notif_sound" class="field-input field-input--select"><option value="habilitados"' + (n.notif_sound === "habilitados" || !n.notif_sound ? " selected" : "") + '>Habilitados</option><option value="deshabilitados"' + (n.notif_sound === "deshabilitados" ? " selected" : "") + ">Deshabilitados</option></select></div>";
      html += '<div class="field"><label class="field-label">Frecuencia</label><select id="stg_notif_frequency" class="field-input field-input--select"><option value="tiempo_real"' + (n.notif_frequency === "tiempo_real" || !n.notif_frequency ? " selected" : "") + '>Tiempo real</option><option value="cada_5min"' + (n.notif_frequency === "cada_5min" ? " selected" : "") + '>Cada 5 minutos</option><option value="cada_15min"' + (n.notif_frequency === "cada_15min" ? " selected" : "") + '>Cada 15 minutos</option><option value="diario"' + (n.notif_frequency === "diario" ? " selected" : "") + ">Resumen diario</option></select></div>";
      html += "</div>" + stgActions("btnSaveNotifications") + "</div></div>";
      setStgContent(html);
      wireSave("btnSaveNotifications", ["stg_notif_email_enabled", "stg_notif_push_enabled", "stg_notif_whatsapp_enabled", "stg_notif_internal_enabled", "stg_notif_reminders", "stg_notif_marketing", "stg_notif_sound", "stg_notif_frequency"], "/api/settings-center/notifications");
    } catch (e) {
      setStgContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  async function renderStgIntegraciones() {
    setStgContent('<div class="loading-state">Cargando integraciones...</div>');
    try {
      var integrations = await API._rawReq("GET", "/api/settings-center/integrations");
      var html = '<div class="stg-grid-3">';
      var iconMap = { facebook: "\u{1F4D8}", google: "\u{1F50D}", calendar: "\u{1F4C5}", whatsapp: "\u{1F4AC}", email: "\u2709\uFE0F", ml: "\u{1F6D2}", zp: "\u{1F3E0}", ap: "\u{1F3D8}", cloud: "\u2601\uFE0F", ai: "\u{1F916}" };
      integrations.forEach(function(intg) {
        html += '<div class="stg-int-card">';
        html += '<div class="stg-int-head"><div class="stg-int-icon">' + (iconMap[intg.icon] || "\u{1F50C}") + '</div><div class="stg-int-info"><div class="stg-int-name">' + esc(intg.name) + '</div><div class="stg-int-meta">' + (intg.connected ? '<span class="admin-status-badge status-disponible">Conectado</span>' : '<span class="admin-status-badge status-oculta">Desconectado</span>') + (intg.last_sync ? " \xB7 \xDAltima sinc.: " + intg.last_sync.substring(0, 10) : "") + "</div></div></div>";
        html += '<div class="stg-int-actions">';
        html += `<button class="btn btn-ghost btn-sm" onclick="stgConfigIntegration('` + intg.id + `')">Configurar</button>`;
        if (intg.connected) html += `<button class="btn btn-ghost btn-sm" onclick="stgTestIntegration('` + intg.id + `')">Probar</button>`;
        if (intg.connected) html += `<button class="btn btn-ghost btn-sm stg-danger-btn" onclick="stgDisconnectIntegration('` + intg.id + `')">Desconectar</button>`;
        html += "</div></div>";
      });
      html += "</div>";
      setStgContent(html);
    } catch (e) {
      setStgContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  function stgConfigIntegration(id) {
    var modal = document.getElementById("stgIntegrationModal");
    var content = document.getElementById("stgIntegrationContent");
    var title = document.getElementById("stgIntegrationTitle");
    var nameMap = { meta: "Meta (Facebook/Instagram)", google: "Google", google_calendar: "Google Calendar", whatsapp_business: "WhatsApp Business", smtp: "SMTP", mercadolibre: "Mercado Libre", zonaprop: "ZonaProp", argenprop: "Argenprop", cloudinary: "Cloudinary", openai: "OpenAI" };
    var keyMap = { meta: "meta_access_token", google: "google_api_key", google_calendar: "google_calendar_token", whatsapp_business: "waba_token", smtp: "smtp_host", mercadolibre: "ml_access_token", zonaprop: "zp_api_key", argenprop: "ap_api_key", cloudinary: "cloudinary_cloud_name", openai: "openai_api_key" };
    title.textContent = "Configurar: " + (nameMap[id] || id);
    API._rawReq("GET", "/api/settings-center/integrations/" + id + "/config").then(function(data) {
      var fields = Object.keys(data).map(function(k) {
        var label = k.replace(/_/g, " ").replace(/\b\w/g, function(l) {
          return l.toUpperCase();
        });
        return '<div class="field"><label class="field-label">' + label + '</label><input id="intg_' + k + '" class="field-input" value="' + esc(data[k] || "") + '"/></div>';
      }).join("");
      content.innerHTML = '<div class="pf-body">' + fields + `<div class="stg-btn-row"><button class="btn btn-primary btn-full" id="saveIntgBtn">Guardar configuraci\xF3n</button><button class="btn btn-ghost" onclick="document.getElementById('stgIntegrationModal').classList.add('hidden')">Cancelar</button></div></div>`;
      modal.classList.remove("hidden");
      document.getElementById("saveIntgBtn").onclick = function() {
        var body = {};
        Object.keys(data).forEach(function(k) {
          body[k] = document.getElementById("intg_" + k).value;
        });
        API._rawReq("PUT", "/api/settings-center/integrations/" + id + "/config", body).then(function() {
          modal.classList.add("hidden");
          toast("Configuraci\xF3n guardada", "success");
          renderStgIntegraciones();
        }).catch(function(err) {
          toast(err.message, "error");
        });
      };
    }).catch(function(err) {
      toast(err.message, "error");
    });
  }
  window.stgConfigIntegration = stgConfigIntegration;
  function stgTestIntegration(id) {
    API._rawReq("POST", "/api/settings-center/integrations/" + id + "/test").then(function(r) {
      toast(r.message || "Conexi\xF3n exitosa", "success");
    }).catch(function(err) {
      toast(err.message || "Error de conexi\xF3n", "error");
    });
  }
  window.stgTestIntegration = stgTestIntegration;
  function stgDisconnectIntegration(id) {
    confirmModal("\xBFDesconectar esta integraci\xF3n?").then(function(ok) {
      if (!ok) return;
      API._rawReq("POST", "/api/settings-center/integrations/" + id + "/disconnect").then(function() {
        toast("Integraci\xF3n desconectada", "success");
        renderStgIntegraciones();
      }).catch(function(err) {
        toast(err.message, "error");
      });
    });
  }
  window.stgDisconnectIntegration = stgDisconnectIntegration;
  async function renderStgSeguridad() {
    setStgContent('<div class="loading-state">Cargando...</div>');
    try {
      var sec = await API._rawReq("GET", "/api/settings-center/security");
      var html = '<div class="stg-cards">';
      html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><div><h2 class="stg-card-title">Pol\xEDtica de seguridad</h2><p class="stg-card-sub">Configuraci\xF3n de acceso y contrase\xF1as</p></div></div>';
      html += '<div class="stg-grid-2">';
      html += '<div class="field"><label class="field-label">Longitud m\xEDnima de contrase\xF1a</label><input id="stg_password_min_length" type="number" class="field-input" value="' + esc(sec.password_min_length || "8") + '"/></div>';
      html += stgToggle("stg_password_require_uppercase", "Requiere may\xFAsculas", sec.password_require_uppercase);
      html += stgToggle("stg_password_require_special", "Requiere caracteres especiales", sec.password_require_special);
      html += stgToggle("stg_two_factor_enabled", "Autenticaci\xF3n de dos factores (2FA)", sec.two_factor_enabled);
      html += '<div class="field"><label class="field-label">Timeout de sesi\xF3n (minutos)</label><input id="stg_session_timeout" type="number" class="field-input" value="' + esc(sec.session_timeout || "30") + '"/></div>';
      html += '<div class="field"><label class="field-label">M\xE1ximo de dispositivos simult\xE1neos</label><input id="stg_session_max_devices" type="number" class="field-input" value="' + esc(sec.session_max_devices || "3") + '"/></div>';
      html += '<div class="field stg-field-full"><label class="field-label">IPs autorizadas (una por l\xEDnea)</label><textarea id="stg_authorized_ips" class="field-input stg-textarea-sm">' + esc(sec.authorized_ips || "") + "</textarea></div>";
      html += "</div>" + stgActions("btnSaveSecurity") + "</div>";
      html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div><div><h2 class="stg-card-title">Sesiones activas</h2><p class="stg-card-sub">Dispositivos conectados actualmente</p></div></div>';
      html += '<div class="stg-sessions-info">Sesiones activas: <strong>' + (sec.active_sessions || 0) + "</strong></div>";
      html += '<div class="stg-session-btns">';
      for (var i = 0; i < (sec.active_sessions || 2); i++) {
        html += '<div class="stg-session-card"><div class="stg-session-card-title">Sesi\xF3n ' + (i + 1) + '</div><div class="stg-session-muted">Chrome \xB7 Windows</div><div class="stg-session-muted">IP: 192.168.1.' + (100 + i) + "</div></div>";
      }
      html += "</div></div>";
      html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><div><h2 class="stg-card-title">Cambiar contrase\xF1a</h2></div></div>';
      html += '<div class="stg-grid-2">';
      html += '<div class="field"><label class="field-label">Contrase\xF1a actual</label><input type="password" id="stg_pass_actual" class="field-input"/></div>';
      html += "<div></div>";
      html += '<div class="field"><label class="field-label">Nueva contrase\xF1a</label><input type="password" id="stg_pass_new" class="field-input"/></div>';
      html += '<div class="field"><label class="field-label">Confirmar</label><input type="password" id="stg_pass_confirm" class="field-input"/></div>';
      html += '</div><button class="btn btn-primary stg-mt12" id="btnChangePass">Actualizar contrase\xF1a</button><span id="stgPassMsg" class="stg-pass-msg"></span>';
      html += "</div></div>";
      setStgContent(html);
      wireSave("btnSaveSecurity", ["stg_password_min_length", "stg_password_require_uppercase", "stg_password_require_special", "stg_two_factor_enabled", "stg_session_timeout", "stg_session_max_devices", "stg_authorized_ips"], "/api/settings-center/security");
      document.getElementById("btnChangePass").onclick = function() {
        var msg = document.getElementById("stgPassMsg");
        var current = document.getElementById("stg_pass_actual").value;
        var nueva = document.getElementById("stg_pass_new").value;
        var confirm2 = document.getElementById("stg_pass_confirm").value;
        if (!current || !nueva) {
          msg.textContent = "Complet\xE1 todos los campos";
          msg.style.color = "#cc4444";
          return;
        }
        if (nueva !== confirm2) {
          msg.textContent = "No coinciden";
          msg.style.color = "#cc4444";
          return;
        }
        API._rawReq("POST", "/api/auth/change-password", { current, new: nueva }).then(function() {
          msg.textContent = "\u2713 Contrase\xF1a actualizada";
          msg.style.color = "#4caf80";
          document.getElementById("stg_pass_actual").value = "";
          document.getElementById("stg_pass_new").value = "";
          document.getElementById("stg_pass_confirm").value = "";
        }).catch(function(err) {
          msg.textContent = err.message;
          msg.style.color = "#cc4444";
        });
      };
    } catch (e) {
      setStgContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  async function renderStgBackups() {
    setStgContent('<div class="loading-state">Cargando backups...</div>');
    try {
      var data = await API._rawReq("GET", "/api/settings-center/backups");
      var html = '<div class="stg-cards">';
      html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg></div><div><h2 class="stg-card-title">Configuraci\xF3n de Backups</h2></div></div>';
      html += '<div class="stg-grid-2">';
      html += stgToggle("stg_backup_auto_enabled", "Backups autom\xE1ticos", data.auto_enabled);
      html += '<div class="field"><label class="field-label">Intervalo (horas)</label><input id="stg_backup_auto_interval" type="number" class="field-input" value="' + esc(data.auto_interval || "24") + '"/></div>';
      html += stgToggle("stg_backup_cloudinary_enabled", "Subir a Cloudinary", data.cloudinary_enabled);
      html += '</div><div class="stg-row-gap8-mt12">';
      html += '<button class="btn btn-primary btn-sm" id="saveBackupConfig">Guardar configuraci\xF3n</button>';
      html += '<button class="btn btn-ghost btn-sm" id="createBackupBtn">Crear backup ahora</button></div></div>';
      html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div><h2 class="stg-card-title">Historial de Backups</h2></div></div>';
      if (!data.backups || !data.backups.length) {
        html += '<div class="empty-state">Sin backups registrados</div>';
      } else {
        html += '<table class="stg-backup-table"><thead><tr><th>Archivo</th><th>Tama\xF1o</th><th>Fecha</th><th>Estado</th><th>Acci\xF3n</th></tr></thead><tbody>';
        data.backups.forEach(function(b) {
          html += "<tr><td>" + esc(b.filename) + "</td><td>" + b.size + "</td><td>" + (b.created_at ? b.created_at.substring(0, 16).replace("T", " ") : "") + '</td><td><span class="admin-status-badge status-disponible">' + b.status + `</span></td><td><button class="btn btn-ghost btn-sm" onclick="stgDownloadBackup('` + esc(b.filename) + `')">Descargar</button></td></tr>`;
        });
        html += "</tbody></table>";
      }
      html += "</div></div>";
      setStgContent(html);
      wireSave("saveBackupConfig", ["stg_backup_auto_enabled", "stg_backup_auto_interval", "stg_backup_cloudinary_enabled"], "/api/settings-center/backups/config");
      document.getElementById("createBackupBtn").onclick = function() {
        var btn = this;
        btn.disabled = true;
        btn.textContent = "Creando...";
        API._rawReq("POST", "/api/settings-center/backups").then(function() {
          toast("Backup creado", "success");
          renderStgBackups();
        }).catch(function(err) {
          toast(err.message, "error");
          btn.disabled = false;
          btn.textContent = "Crear backup ahora";
        });
      };
    } catch (e) {
      setStgContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  function stgDownloadBackup(filename) {
    window.open("/backups/" + filename, "_blank");
  }
  window.stgDownloadBackup = stgDownloadBackup;
  async function renderStgPreferencias() {
    setStgContent('<div class="loading-state">Cargando preferencias...</div>');
    try {
      var p = await API._rawReq("GET", "/api/settings-center/preferences");
      var html = '<div class="stg-cards"><div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg></div><div><h2 class="stg-card-title">Preferencias del panel</h2><p class="stg-card-sub">Personaliz\xE1 tu experiencia de administraci\xF3n</p></div></div>';
      html += '<div class="stg-grid-2">';
      html += '<div class="field"><label class="field-label">Dashboard inicial</label><select id="stg_pref_default_dashboard" class="field-input field-input--select"><option value="dashboard"' + (p.default_dashboard === "dashboard" || !p.default_dashboard ? " selected" : "") + '>Dashboard</option><option value="props"' + (p.default_dashboard === "props" ? " selected" : "") + '>Propiedades</option><option value="calendar"' + (p.default_dashboard === "calendar" ? " selected" : "") + ">Agenda</option></select></div>";
      html += '<div class="field"><label class="field-label">Vista por defecto</label><select id="stg_pref_default_view" class="field-input field-input--select"><option value="cards"' + (p.default_view === "cards" || !p.default_view ? " selected" : "") + '>Tarjetas</option><option value="table"' + (p.default_view === "table" ? " selected" : "") + ">Tabla</option></select></div>";
      html += '<div class="field"><label class="field-label">Registros por p\xE1gina</label><select id="stg_pref_records_per_page" class="field-input field-input--select"><option value="12"' + (p.records_per_page === "12" || !p.records_per_page ? " selected" : "") + '>12</option><option value="24"' + (p.records_per_page === "24" ? " selected" : "") + '>24</option><option value="48"' + (p.records_per_page === "48" ? " selected" : "") + '>48</option><option value="100"' + (p.records_per_page === "100" ? " selected" : "") + ">100</option></select></div>";
      html += stgToggle("stg_pref_animations_enabled", "Animaciones", p.animations_enabled);
      html += stgToggle("stg_pref_compact_sidebar", "Sidebar compacta", p.compact_sidebar);
      html += "</div>" + stgActions("btnSavePreferences") + "</div></div>";
      setStgContent(html);
      wireSave("btnSavePreferences", ["stg_pref_default_dashboard", "stg_pref_default_view", "stg_pref_records_per_page", "stg_pref_animations_enabled", "stg_pref_compact_sidebar"], "/api/settings-center/preferences");
    } catch (e) {
      setStgContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  async function renderStgSistema() {
    setStgContent('<div class="loading-state">Cargando informaci\xF3n del sistema...</div>');
    try {
      var sys = await API._rawReq("GET", "/api/settings-center/system");
      var html = '<div class="stg-cards"><div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div><div><h2 class="stg-card-title">Informaci\xF3n del Sistema</h2><p class="stg-card-sub">Estado general de la instalaci\xF3n</p></div></div>';
      html += '<div class="stg-sys-grid">';
      var items = [
        { label: "Versi\xF3n", value: sys.version },
        { label: "Entorno", value: sys.environment },
        { label: "Base de datos", value: sys.db_type },
        { label: "Python", value: sys.python_version },
        { label: "Plataforma", value: sys.platform },
        { label: "Propiedades", value: sys.properties_count },
        { label: "Alquileres", value: sys.rentals_count },
        { label: "Leads", value: sys.leads_count },
        { label: "Usuarios", value: sys.users_count },
        { label: "Agentes", value: sys.agents_count },
        { label: "Eventos", value: sys.events_count },
        { label: "Pool size", value: sys.db_pool ? sys.db_pool.size : "N/A" }
      ];
      items.forEach(function(item) {
        html += '<div class="stg-sys-item"><div class="stg-sys-label">' + item.label + '</div><div class="stg-sys-value">' + esc(String(item.value)) + "</div></div>";
      });
      html += "</div></div>";
      html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><div><h2 class="stg-card-title">Health Check</h2></div></div>';
      html += '<div class="stg-health-row"><button class="btn btn-ghost btn-sm" onclick="stgRunHealthCheck()">Ejecutar health check</button><span id="stgHealthResult"></span></div>';
      html += "</div></div>";
      setStgContent(html);
    } catch (e) {
      setStgContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  function stgRunHealthCheck() {
    var el = document.getElementById("stgHealthResult");
    el.textContent = "Ejecutando...";
    fetch("/api/health", { credentials: "include" }).then(function(r) {
      return r.json();
    }).then(function(d) {
      var status = d.ok ? "\u2705 Saludable" : "\u274C Error";
      el.innerHTML = '<span style="color:' + (d.ok ? "#4caf80" : "#cc4444") + ';font-weight:600">' + status + "</span> \xB7 DB: " + d.database + " \xB7 Pool: " + (d.pool ? d.pool.checkedin + "/" + d.pool.size : "N/A");
    }).catch(function(err) {
      el.textContent = "\u274C " + err.message;
    });
  }
  window.stgRunHealthCheck = stgRunHealthCheck;
  function field(id, label, value, type) {
    var inputType = type || "text";
    if (inputType === "textarea") {
      return '<div class="field"><label class="field-label">' + label + '</label><textarea id="' + id + '" class="field-input stg-textarea-sm">' + esc(value || "") + "</textarea></div>";
    }
    return '<div class="field"><label class="field-label">' + label + '</label><input id="' + id + '" type="' + inputType + '" class="field-input" value="' + esc(value || "") + '"/></div>';
  }
  function stgActions(btnId) {
    return '<div class="stg-save-row"><button class="btn btn-primary" id="' + btnId + '">Guardar cambios</button><span id="' + btnId + 'Msg" class="stg-msg-inline"></span></div>';
  }
  function stgToggle(id, label, value) {
    var checked = value === "true" || value === true || value === "1" ? "checked" : "";
    return '<div class="field stg-field-row stg-field-tight"><label class="acm-chip"><input type="checkbox" class="acm-chip-input" id="' + id + '" ' + checked + '/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">' + label + "</span></span></label></div>";
  }
  function wireSave(btnId, fieldIds, apiPath) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.onclick = function() {
      var msg = document.getElementById(btnId + "Msg");
      var body = {};
      fieldIds.forEach(function(fid) {
        var el = document.getElementById(fid);
        if (el) {
          if (el.type === "checkbox") body[fid.replace("stg_", "")] = el.checked ? "true" : "false";
          else body[fid.replace("stg_", "")] = el.value.trim();
        }
      });
      var path = apiPath || "/api/settings-center/general";
      API._rawReq("PUT", path, body).then(function() {
        msg.textContent = "\u2713 Guardado";
        msg.style.color = "#4caf80";
        setTimeout(function() {
          msg.textContent = "";
        }, 3e3);
      }).catch(function(err) {
        msg.textContent = err.message;
        msg.style.color = "#cc4444";
      });
    };
  }
  function setStgContent(html) {
    var el = document.getElementById("stgContent");
    if (el) el.innerHTML = html;
  }
  document.addEventListener("click", function(e) {
    var btn = e.target.closest("[data-stg-tab]");
    if (!btn) return;
    _stgTab = btn.getAttribute("data-stg-tab");
    document.querySelectorAll(".stg-subtab").forEach(function(b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    var fns = {
      general: renderStgGeneral,
      branding: renderStgBranding,
      localizacion: renderStgLocalizacion,
      notificaciones: renderStgNotificaciones,
      integraciones: renderStgIntegraciones,
      seguridad: renderStgSeguridad,
      backups: renderStgBackups,
      preferencias: renderStgPreferencias,
      sistema: renderStgSistema
    };
    if (fns[_stgTab]) fns[_stgTab]();
  });
  window.renderSettings = renderSettings;
  var _rbacTab = "dashboard";
  var _rbacUsers = [];
  var _rbacRoles = [];
  function renderRBAC() {
    _rbacTab = "dashboard";
    renderRbacSubtabs();
    renderRbacDashboard();
  }
  window.renderRBAC = renderRBAC;
  function renderRbacSubtabs() {
    var c2 = document.getElementById("rbacSubtabs");
    if (!c2) return;
    var tabs = ["dashboard", "usuarios", "roles", "permisos", "invitaciones", "sesiones", "auditoria"];
    var labels = ["Dashboard", "Usuarios", "Roles", "Permisos", "Invitaciones", "Sesiones", "Auditor\xEDa"];
    c2.innerHTML = tabs.map(function(t, i) {
      return '<button class="rbac-subtab' + (t === _rbacTab ? " active" : "") + '" data-rbac-tab="' + t + '">' + labels[i] + "</button>";
    }).join("");
  }
  function setRbacContent(html) {
    var el = document.getElementById("rbacContent");
    if (el) el.innerHTML = html;
  }
  async function renderRbacDashboard() {
    setRbacContent('<div class="loading-state">Cargando dashboard...</div>');
    try {
      var d = await API._rawReq("GET", "/api/admin/rbac/dashboard");
      var html = '<div class="rbac-kpi-grid">';
      var kpis = [
        { v: d.active_users, l: "Activos", c: "" },
        { v: d.inactive_users, l: "Inactivos", c: "" },
        { v: d.roles_count, l: "Roles creados", c: "" },
        { v: d.permissions_count, l: "Permisos asignados", c: "" },
        { v: d.active_sessions, l: "Sesiones activas", c: "" },
        { v: d.pending_invites, l: "Invitaciones pendientes", c: "" },
        { v: d.total_users, l: "Usuarios totales", c: "" },
        { v: d.admins, l: "Administradores", c: "" }
      ];
      kpis.forEach(function(k) {
        html += '<div class="rbac-kpi-card"><div class="rbac-kpi-value">' + k.v + '</div><div class="rbac-kpi-label">' + k.l + "</div></div>";
      });
      html += "</div>";
      if (d.recent_logins && d.recent_logins.length) {
        html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg></div><div><h2 class="stg-card-title">\xDAltimos accesos</h2></div></div>';
        html += '<div class="usr-col-gap6">';
        d.recent_logins.forEach(function(l) {
          html += '<div class="usr-log-row"><span class="usr-log-text">' + esc(l.username) + '</span><span class="usr-text-muted">' + (l.time ? l.time.substring(0, 16).replace("T", " ") : "") + " \xB7 " + (l.ip || "") + "</span></div>";
        });
        html += "</div></div>";
      }
      setRbacContent(html);
    } catch (e) {
      setRbacContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  async function renderRbacUsuarios() {
    setRbacContent('<div class="loading-state">Cargando usuarios...</div>');
    try {
      _rbacUsers = await API._rawReq("GET", "/api/admin/rbac/users");
      var html = '<div class="usr-section-header"><h3 class="usr-section-title">' + _rbacUsers.length + ' usuarios</h3><button class="btn btn-primary btn-sm" onclick="rbacOpenUserForm(null)">+ Nuevo usuario</button></div>';
      if (!_rbacUsers.length) {
        html += '<div class="empty-state">Sin usuarios registrados</div>';
      } else {
        _rbacUsers.forEach(function(u) {
          var initial = (u.display_name || u.username)[0].toUpperCase();
          var statusBadge2 = u.is_active ? '<span class="admin-status-badge status-disponible">Activo</span>' : '<span class="admin-status-badge status-oculta">Inactivo</span>';
          html += '<div class="rbac-user-row" role="button" tabindex="0" onclick="rbacOpenUserPanel(' + u.id + `)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">`;
          html += '<div class="rbac-user-avatar">' + initial + "</div>";
          html += '<div class="rbac-user-info"><div class="rbac-user-name">' + esc(u.display_name || u.username) + " " + statusBadge2 + '</div><div class="rbac-user-email">' + esc(u.email) + " \xB7 " + esc(u.role_name || u.role) + "</div></div>";
          html += '<div class="rbac-user-meta">';
          html += '<span class="usr-login-time">' + (u.last_login ? u.last_login.substring(0, 10) : "\u2014") + "</span>";
          if (u.active_sessions > 0) html += '<span class="sidebar-badge usr-session-badge">' + u.active_sessions + "</span>";
          html += "</div>";
          html += '<div class="rbac-user-actions" onclick="event.stopPropagation()">';
          html += '<button class="btn btn-ghost btn-sm" onclick="rbacOpenUserForm(' + u.id + ')">Editar</button>';
          html += '<button class="btn btn-ghost btn-sm usr-danger-btn" onclick="rbacDeleteUser(' + u.id + ')">Eliminar</button>';
          html += "</div></div>";
        });
      }
      setRbacContent(html);
    } catch (e) {
      setRbacContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  async function rbacOpenUserPanel(uid) {
    try {
      var u = await API._rawReq("GET", "/api/admin/rbac/users/" + uid);
      var panel = document.getElementById("rbacPanel");
      var body = document.getElementById("rbacPanelBody");
      document.getElementById("rbacPanelTitle").textContent = u.display_name || u.username;
      var html = "";
      html += '<div class="rbac-panel-section"><div class="rbac-detail-grid">';
      html += rbacField("Usuario", u.username);
      html += rbacField("Email", u.email || "\u2014");
      html += rbacField("Rol", u.role_name || u.role);
      html += rbacField("Estado", u.is_active ? "Activo" : "Inactivo");
      html += rbacField("Creado", u.created_at ? u.created_at.substring(0, 10) : "\u2014");
      html += rbacField("\xDAltimo acceso", u.last_login ? u.last_login.substring(0, 16).replace("T", " ") : "\u2014");
      html += rbacField("\xDAltima IP", u.last_ip || "\u2014");
      html += rbacField("Intentos fallidos", String(u.login_attempts || 0));
      html += "</div></div>";
      if (u.permissions && u.permissions.length) {
        html += '<div class="rbac-panel-section"><div class="rbac-panel-section-title">Permisos asignados</div><div class="rbac-role-perms">';
        u.permissions.forEach(function(p) {
          html += '<span class="rbac-role-perm-tag">' + esc(p.name) + "</span>";
        });
        html += "</div></div>";
      }
      if (u.sessions && u.sessions.length) {
        html += '<div class="rbac-panel-section"><div class="rbac-panel-section-title">Sesiones activas (' + u.sessions.length + ")</div>";
        u.sessions.slice(0, 5).forEach(function(s) {
          html += '<div class="usr-log-row"><span class="usr-log-text">' + esc(s.browser || "?") + '</span> <span class="usr-text-muted">\xB7 ' + esc(s.os || "") + " \xB7 " + esc(s.ip || "") + (s.active ? "" : " (inactiva)") + "</span></div>";
        });
        html += "</div>";
      }
      if (u.audit && u.audit.length) {
        html += '<div class="rbac-panel-section"><div class="rbac-panel-section-title">Actividad reciente</div>';
        u.audit.slice(0, 8).forEach(function(a) {
          html += '<div class="usr-event-row"><span class="usr-log-text">' + esc(a.action) + '</span><span class="usr-text-muted">' + (a.created_at ? a.created_at.substring(0, 16).replace("T", " ") : "") + "</span></div>";
        });
        html += "</div>";
      }
      body.innerHTML = html;
      panel.classList.add("open");
      document.getElementById("rbacOverlay").classList.remove("hidden");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  window.rbacOpenUserPanel = rbacOpenUserPanel;
  function closeRbacPanel() {
    document.getElementById("rbacPanel").classList.remove("open");
    document.getElementById("rbacOverlay").classList.add("hidden");
  }
  window.closeRbacPanel = closeRbacPanel;
  function rbacField(label, value) {
    return '<div><div class="rbac-panel-label">' + label + '</div><div class="rbac-panel-value">' + esc(String(value)) + "</div></div>";
  }
  function rbacOpenUserForm(uid) {
    var isEdit = !!uid;
    var u = isEdit ? _rbacUsers.find(function(x) {
      return x.id === uid;
    }) : {};
    API._rawReq("GET", "/api/admin/rbac/roles").then(function(roles) {
      _rbacRoles = roles;
      var title = isEdit ? "Editar usuario" : "Nuevo usuario";
      var modal = document.getElementById("rbacUserFormModal");
      document.getElementById("rbacUserFormTitle").textContent = title;
      var roleOpts = roles.map(function(r) {
        var sel = isEdit && u.role_id === r.id ? " selected" : "";
        return '<option value="' + r.id + '"' + sel + ">" + esc(r.name) + "</option>";
      }).join("");
      document.getElementById("rbacUserFormContent").innerHTML = '<div class="pf-body"><div class="stg-grid-2"><div class="field"><label class="field-label">Usuario *</label><input id="ru_username" class="field-input" value="' + esc((u || {}).username || "") + '"/></div><div class="field"><label class="field-label">Nombre visible</label><input id="ru_display_name" class="field-input" value="' + esc((u || {}).display_name || "") + '"/></div><div class="field"><label class="field-label">Email</label><input id="ru_email" class="field-input" value="' + esc((u || {}).email || "") + '"/></div><div class="field"><label class="field-label">Rol</label><select id="ru_role_id" class="field-input field-input--select">' + roleOpts + '</select></div><div class="field usr-field-full"><label class="field-label">Contrase\xF1a ' + (isEdit ? "(dejar vac\xEDo para no cambiar)" : "*") + '</label><input id="ru_password" type="password" class="field-input" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022"/></div>' + (isEdit ? '<div class="field usr-field-row"><label class="acm-chip"><input type="checkbox" class="acm-chip-input" id="ru_is_active" ' + (u.is_active !== false ? "checked" : "") + '/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Activo</span></span></label></div>' : "") + '</div><div class="usr-btn-row"><button class="btn btn-primary btn-full" id="rbacSaveUserBtn">' + (isEdit ? "Guardar" : "Crear") + `</button><button class="btn btn-ghost" onclick="document.getElementById('rbacUserFormModal').classList.add('hidden')">Cancelar</button></div></div>`;
      modal.classList.remove("hidden");
      document.getElementById("rbacSaveUserBtn").onclick = function() {
        var username = document.getElementById("ru_username").value.trim();
        if (!username) {
          toast("El usuario es requerido", "warn");
          return;
        }
        var body = { username, display_name: document.getElementById("ru_display_name").value, email: document.getElementById("ru_email").value, role_id: parseInt(document.getElementById("ru_role_id").value) || null };
        var pw = document.getElementById("ru_password").value;
        if (pw) body.password = pw;
        if (isEdit) {
          body.is_active = document.getElementById("ru_is_active").checked;
          API._rawReq("PUT", "/api/admin/rbac/users/" + uid, body).then(function() {
            modal.classList.add("hidden");
            toast("Usuario actualizado", "success");
            renderRbacUsuarios();
          }).catch(function(err) {
            toast(err.message, "error");
          });
        } else {
          API._rawReq("POST", "/api/admin/rbac/users", body).then(function() {
            modal.classList.add("hidden");
            toast("Usuario creado", "success");
            renderRbacUsuarios();
          }).catch(function(err) {
            toast(err.message, "error");
          });
        }
      };
    }).catch(function(err) {
      toast(err.message, "error");
    });
  }
  window.rbacOpenUserForm = rbacOpenUserForm;
  function rbacDeleteUser(uid) {
    confirmModal("\xBFEliminar este usuario?").then(function(ok) {
      if (!ok) return;
      API._rawReq("DELETE", "/api/admin/rbac/users/" + uid).then(function() {
        toast("Usuario eliminado", "success");
        renderRbacUsuarios();
      }).catch(function(err) {
        toast(err.message, "error");
      });
    });
  }
  window.rbacDeleteUser = rbacDeleteUser;
  async function renderRbacRoles() {
    setRbacContent('<div class="loading-state">Cargando roles...</div>');
    try {
      var roles = await API._rawReq("GET", "/api/admin/rbac/roles");
      var html = '<div class="usr-section-header"><h3 class="usr-section-title">' + roles.length + ' roles</h3><button class="btn btn-primary btn-sm" onclick="rbacOpenRoleForm(null)">+ Nuevo rol</button></div>';
      html += '<div class="stg-grid-3">';
      roles.forEach(function(r) {
        html += '<div class="rbac-role-card">';
        html += '<div class="rbac-role-head"><div class="rbac-role-dot" style="background:' + (r.color || "var(--admin-accent)") + '"></div><div><div class="rbac-role-name">' + esc(r.name) + '</div><div class="rbac-role-count">' + r.user_count + " usuarios</div></div></div>";
        html += '<div class="rbac-role-desc">' + esc(r.description || "\u2014") + "</div>";
        if (r.permissions && r.permissions.length) {
          html += '<div class="rbac-role-perms">';
          r.permissions.slice(0, 6).forEach(function(p) {
            html += '<span class="rbac-role-perm-tag">' + esc(p.name) + "</span>";
          });
          if (r.permissions.length > 6) html += '<span class="rbac-role-perm-tag">+' + (r.permissions.length - 6) + "</span>";
          html += "</div>";
        }
        html += '<div class="usr-role-actions"><button class="btn btn-ghost btn-sm" onclick="rbacOpenRoleForm(' + r.id + ')">Editar</button>' + (r.is_system ? "" : '<button class="btn btn-ghost btn-sm usr-danger-btn" onclick="rbacDeleteRole(' + r.id + ')">Eliminar</button>') + "</div></div>";
      });
      html += "</div>";
      setRbacContent(html);
    } catch (e) {
      setRbacContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  function rbacOpenRoleForm(rid) {
    var isEdit = !!rid;
    API._rawReq("GET", "/api/admin/rbac/roles").then(function(roles) {
      var r = isEdit ? roles.find(function(x) {
        return x.id === rid;
      }) : {};
      var title = isEdit ? "Editar rol" : "Nuevo rol";
      var modal = document.getElementById("rbacRoleFormModal");
      document.getElementById("rbacRoleFormTitle").textContent = title;
      document.getElementById("rbacRoleFormContent").innerHTML = '<div class="pf-body"><div class="stg-grid-2"><div class="field"><label class="field-label">Nombre *</label><input id="rr_name" class="field-input" value="' + esc((r || {}).name || "") + '"/></div><div class="field"><label class="field-label">Slug</label><input id="rr_slug" class="field-input" value="' + esc((r || {}).slug || "") + '" placeholder="ej: analista"/></div><div class="field usr-field-full"><label class="field-label">Descripci\xF3n</label><input id="rr_description" class="field-input" value="' + esc((r || {}).description || "") + '"/></div><div class="field"><label class="field-label">Color</label><input id="rr_color" type="color" class="stg-color-input" value="' + esc((r || {}).color || "#20b8ab") + '"/></div><div class="field"><label class="field-label">Orden</label><input id="rr_sort_order" type="number" class="field-input" value="' + ((r || {}).sort_order || "0") + '"/></div></div><div class="usr-btn-row"><button class="btn btn-primary btn-full" id="rbacSaveRoleBtn">' + (isEdit ? "Guardar" : "Crear") + `</button><button class="btn btn-ghost" onclick="document.getElementById('rbacRoleFormModal').classList.add('hidden')">Cancelar</button></div></div>`;
      modal.classList.remove("hidden");
      document.getElementById("rbacSaveRoleBtn").onclick = function() {
        var name = document.getElementById("rr_name").value.trim();
        if (!name) {
          toast("El nombre es requerido", "warn");
          return;
        }
        var body = { name, slug: document.getElementById("rr_slug").value.trim() || name.toLowerCase().replace(/\s+/g, "_"), description: document.getElementById("rr_description").value, color: document.getElementById("rr_color").value, sort_order: parseInt(document.getElementById("rr_sort_order").value) || 0 };
        if (isEdit) {
          API._rawReq("PUT", "/api/admin/rbac/roles/" + rid, body).then(function() {
            modal.classList.add("hidden");
            toast("Rol actualizado", "success");
            renderRbacRoles();
          }).catch(function(err) {
            toast(err.message, "error");
          });
        } else {
          API._rawReq("POST", "/api/admin/rbac/roles", body).then(function() {
            modal.classList.add("hidden");
            toast("Rol creado", "success");
            renderRbacRoles();
          }).catch(function(err) {
            toast(err.message, "error");
          });
        }
      };
    }).catch(function(err) {
      toast(err.message, "error");
    });
  }
  window.rbacOpenRoleForm = rbacOpenRoleForm;
  function rbacDeleteRole(rid) {
    confirmModal("\xBFEliminar este rol?").then(function(ok) {
      if (!ok) return;
      API._rawReq("DELETE", "/api/admin/rbac/roles/" + rid).then(function() {
        toast("Rol eliminado", "success");
        renderRbacRoles();
      }).catch(function(err) {
        toast(err.message, "error");
      });
    });
  }
  window.rbacDeleteRole = rbacDeleteRole;
  async function renderRbacPermisos() {
    setRbacContent('<div class="loading-state">Cargando permisos...</div>');
    try {
      var data = await API._rawReq("GET", "/api/admin/rbac/permissions");
      var roles = await API._rawReq("GET", "/api/admin/rbac/roles");
      _rbacRoles = roles;
      var grouped = data.grouped || {};
      var moduleOrder = ["dashboard", "properties", "crm", "messages", "agents", "appraisals", "portals", "marketing", "settings", "users", "roles", "reports"];
      var moduleLabels = { dashboard: "Dashboard", properties: "Propiedades", crm: "CRM", messages: "Mensajes", agents: "Agentes", appraisals: "Tasaciones", portals: "Portales", marketing: "Marketing", settings: "Configuraci\xF3n", users: "Usuarios", roles: "Roles", reports: "Reportes" };
      var html = '<div class="usr-perm-header">';
      html += '<label class="usr-perm-label">Ver permisos para:</label>';
      html += '<select id="rbacPermRoleFilter" class="field-input field-input--select usr-perm-select" onchange="renderRbacPermMatrix()">';
      roles.forEach(function(r) {
        html += '<option value="' + r.id + '">' + esc(r.name) + "</option>";
      });
      html += '</select><button class="btn btn-primary btn-sm" id="rbacSavePermsBtn">Guardar cambios</button><span id="rbacPermMsg" class="usr-msg-inline"></span></div>';
      html += '<div id="rbacPermMatrix"></div>';
      setRbacContent(html);
      renderRbacPermMatrix();
    } catch (e) {
      setRbacContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  function renderRbacPermMatrix() {
    var roleId = parseInt(document.getElementById("rbacPermRoleFilter").value);
    var role = _rbacRoles.find(function(r) {
      return r.id === roleId;
    });
    var permIds = role && role.permissions ? role.permissions.map(function(p) {
      return p.id;
    }) : [];
    API._rawReq("GET", "/api/admin/rbac/permissions").then(function(data) {
      var grouped = data.grouped || {};
      var moduleOrder = ["dashboard", "properties", "crm", "messages", "agents", "appraisals", "portals", "marketing", "settings", "users", "roles", "reports"];
      var moduleLabels = { dashboard: "Dashboard", properties: "Propiedades", crm: "CRM", messages: "Mensajes", agents: "Agentes", appraisals: "Tasaciones", portals: "Portales", marketing: "Marketing", settings: "Configuraci\xF3n", users: "Usuarios", roles: "Roles", reports: "Reportes" };
      var html = "";
      moduleOrder.forEach(function(mod) {
        var perms = grouped[mod];
        if (!perms || !perms.length) return;
        html += '<div class="rbac-perm-module"><div class="rbac-perm-module-title">' + (moduleLabels[mod] || mod) + '</div><div class="rbac-perm-grid">';
        perms.forEach(function(p) {
          var checked = permIds.indexOf(p.id) !== -1 ? "checked" : "";
          html += '<label class="acm-chip"><input type="checkbox" class="acm-chip-input rbac-perm-cb" data-perm-id="' + p.id + '" ' + checked + '/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">' + esc(p.name) + "</span></span></label>";
        });
        html += "</div></div>";
      });
      document.getElementById("rbacPermMatrix").innerHTML = html;
      document.getElementById("rbacSavePermsBtn").onclick = function() {
        var cbs = document.querySelectorAll(".rbac-perm-cb:checked");
        var ids = Array.from(cbs).map(function(cb) {
          return parseInt(cb.getAttribute("data-perm-id"));
        });
        API._rawReq("PUT", "/api/admin/rbac/roles/" + roleId, { permission_ids: ids }).then(function() {
          document.getElementById("rbacPermMsg").textContent = "\u2713 Permisos actualizados";
          document.getElementById("rbacPermMsg").style.color = "#4caf80";
          setTimeout(function() {
            document.getElementById("rbacPermMsg").textContent = "";
          }, 3e3);
        }).catch(function(err) {
          toast(err.message, "error");
        });
      };
    });
  }
  window.renderRbacPermMatrix = renderRbacPermMatrix;
  async function renderRbacInvitaciones() {
    setRbacContent('<div class="loading-state">Cargando invitaciones...</div>');
    try {
      var invites = await API._rawReq("GET", "/api/admin/rbac/invitations");
      var html = '<div class="usr-section-header"><h3 class="usr-section-title">' + invites.length + ' invitaciones</h3><button class="btn btn-primary btn-sm" onclick="rbacOpenInviteForm()">+ Invitar usuario</button></div>';
      if (!invites.length) {
        html += '<div class="empty-state">Sin invitaciones pendientes</div>';
      } else {
        invites.forEach(function(i) {
          var statusBadge2 = i.status === "pending" ? '<span class="admin-status-badge status-disponible">Pendiente</span>' : i.status === "accepted" ? '<span class="admin-status-badge status-oculta">Aceptada</span>' : '<span class="admin-status-badge usr-badge-danger">Cancelada</span>';
          html += '<div class="rbac-invite-row"><div class="rbac-invite-info"><div class="rbac-invite-email">' + esc(i.email) + " " + statusBadge2 + '</div><div class="rbac-invite-meta">Rol: ' + esc(i.role_name || "\u2014") + " \xB7 Invit\xF3: " + esc(i.inviter_name || "\u2014") + " \xB7 " + (i.created_at ? i.created_at.substring(0, 10) : "") + (i.expires_at ? " \xB7 Exp: " + i.expires_at.substring(0, 10) : "") + '</div></div><div class="rbac-user-actions">';
          if (i.status === "pending") {
            html += '<button class="btn btn-ghost btn-sm" onclick="rbacResendInvite(' + i.id + ')">Reenviar</button>';
            html += '<button class="btn btn-ghost btn-sm" onclick="rbacCancelInvite(' + i.id + ')">Cancelar</button>';
          }
          html += '<button class="btn btn-ghost btn-sm usr-danger-btn" onclick="rbacDeleteInvite(' + i.id + ')">Eliminar</button>';
          html += "</div></div>";
        });
      }
      setRbacContent(html);
    } catch (e) {
      setRbacContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  function rbacOpenInviteForm() {
    API._rawReq("GET", "/api/admin/rbac/roles").then(function(roles) {
      var modal = document.getElementById("rbacInviteModal");
      var roleOpts = roles.map(function(r) {
        return '<option value="' + r.id + '">' + esc(r.name) + "</option>";
      }).join("");
      document.getElementById("rbacInviteContent").innerHTML = '<div class="pf-body"><div class="field"><label class="field-label">Email *</label><input id="ri_email" type="email" class="field-input" placeholder="usuario@bienenhaus.com"/></div><div class="field"><label class="field-label">Rol</label><select id="ri_role_id" class="field-input field-input--select">' + roleOpts + `</select></div><div class="usr-btn-row"><button class="btn btn-primary btn-full" id="rbacSendInviteBtn">Enviar invitaci\xF3n</button><button class="btn btn-ghost" onclick="document.getElementById('rbacInviteModal').classList.add('hidden')">Cancelar</button></div></div>`;
      modal.classList.remove("hidden");
      document.getElementById("rbacSendInviteBtn").onclick = function() {
        var email = document.getElementById("ri_email").value.trim();
        if (!email || email.indexOf("@") === -1) {
          toast("Email inv\xE1lido", "warn");
          return;
        }
        API._rawReq("POST", "/api/admin/rbac/invitations", { email, role_id: parseInt(document.getElementById("ri_role_id").value) || null }).then(function() {
          modal.classList.add("hidden");
          toast("Invitaci\xF3n enviada", "success");
          renderRbacInvitaciones();
        }).catch(function(err) {
          toast(err.message, "error");
        });
      };
    }).catch(function(err) {
      toast(err.message, "error");
    });
  }
  window.rbacOpenInviteForm = rbacOpenInviteForm;
  function rbacResendInvite(iid) {
    API._rawReq("POST", "/api/admin/rbac/invitations/" + iid + "/resend").then(function() {
      toast("Invitaci\xF3n reenviada", "success");
    }).catch(function(err) {
      toast(err.message, "error");
    });
  }
  window.rbacResendInvite = rbacResendInvite;
  function rbacCancelInvite(iid) {
    API._rawReq("POST", "/api/admin/rbac/invitations/" + iid + "/cancel").then(function() {
      toast("Invitaci\xF3n cancelada", "success");
      renderRbacInvitaciones();
    }).catch(function(err) {
      toast(err.message, "error");
    });
  }
  window.rbacCancelInvite = rbacCancelInvite;
  function rbacDeleteInvite(iid) {
    confirmModal("\xBFEliminar esta invitaci\xF3n?").then(function(ok) {
      if (!ok) return;
      API._rawReq("DELETE", "/api/admin/rbac/invitations/" + iid).then(function() {
        toast("Invitaci\xF3n eliminada", "success");
        renderRbacInvitaciones();
      }).catch(function(err) {
        toast(err.message, "error");
      });
    });
  }
  window.rbacDeleteInvite = rbacDeleteInvite;
  async function renderRbacSesiones() {
    setRbacContent('<div class="loading-state">Cargando sesiones...</div>');
    try {
      var sessions = await API._rawReq("GET", "/api/admin/rbac/sessions");
      var html = '<h3 class="usr-subsection-title">' + sessions.length + " sesiones activas</h3>";
      if (!sessions.length) {
        html += '<div class="empty-state">Sin sesiones registradas</div>';
      } else {
        sessions.forEach(function(s) {
          var activeBadge = s.active ? '<span class="admin-status-badge status-disponible">Activa</span>' : '<span class="admin-status-badge status-oculta">Inactiva</span>';
          html += '<div class="rbac-session-row"><div class="rbac-session-info"><div class="rbac-session-device">' + esc(s.username || "?") + " \xB7 " + esc(s.browser || "?") + " " + activeBadge + '</div><div class="rbac-session-detail">' + esc(s.os || "") + (s.device ? " \xB7 " + esc(s.device) : "") + (s.ip ? " \xB7 " + esc(s.ip) : "") + (s.city ? " \xB7 " + esc(s.city) : "") + (s.last_activity ? " \xB7 " + s.last_activity.substring(0, 16).replace("T", " ") : "") + "</div></div>";
          if (s.active) html += '<button class="btn btn-ghost btn-sm usr-danger-btn" onclick="rbacTerminateSession(' + s.id + ')">Cerrar</button>';
          html += "</div>";
        });
      }
      setRbacContent(html);
    } catch (e) {
      setRbacContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  function rbacTerminateSession(sid) {
    confirmModal("\xBFCerrar esta sesi\xF3n?").then(function(ok) {
      if (!ok) return;
      API._rawReq("POST", "/api/admin/rbac/sessions/" + sid + "/terminate").then(function() {
        toast("Sesi\xF3n cerrada", "success");
        renderRbacSesiones();
      }).catch(function(err) {
        toast(err.message, "error");
      });
    });
  }
  window.rbacTerminateSession = rbacTerminateSession;
  async function renderRbacAuditoria() {
    setRbacContent('<div class="loading-state">Cargando auditor\xEDa...</div>');
    try {
      var audit = await API._rawReq("GET", "/api/admin/rbac/audit");
      var html = '<h3 class="usr-subsection-title">' + audit.length + " eventos</h3>";
      var iconMap = { login: "\u{1F511}", logout: "\u{1F6AA}", password_change: "\u{1F510}", role_change: "\u{1F464}", user_created: "\u2795", user_updated: "\u270F\uFE0F", user_deleted: "\u{1F5D1}\uFE0F", role_created: "\u2795", role_updated: "\u270F\uFE0F", role_deleted: "\u{1F5D1}\uFE0F", invitation_sent: "\u{1F4E7}" };
      audit.forEach(function(a) {
        html += '<div class="rbac-audit-item"><div class="rbac-audit-icon">' + (iconMap[a.action] || "\u{1F4CB}") + '</div><div class="rbac-audit-info"><div class="rbac-audit-action">' + esc(a.action) + '</div><div class="rbac-audit-detail">' + esc(a.username || "Sistema") + (a.details ? " \xB7 " + esc(a.details) : "") + '</div></div><div class="rbac-audit-time">' + (a.created_at ? a.created_at.substring(0, 16).replace("T", " ") : "") + "</div></div>";
      });
      setRbacContent(html);
    } catch (e) {
      setRbacContent('<div class="error-state">Error: ' + e.message + "</div>");
    }
  }
  document.addEventListener("click", function(e) {
    var btn = e.target.closest("[data-rbac-tab]");
    if (!btn) return;
    _rbacTab = btn.getAttribute("data-rbac-tab");
    document.querySelectorAll(".rbac-subtab").forEach(function(b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    var fns = {
      dashboard: renderRbacDashboard,
      usuarios: renderRbacUsuarios,
      roles: renderRbacRoles,
      permisos: renderRbacPermisos,
      invitaciones: renderRbacInvitaciones,
      sesiones: renderRbacSesiones,
      auditoria: renderRbacAuditoria
    };
    if (fns[_rbacTab]) fns[_rbacTab]();
  });
  window.esc = window.esc || function(s) {
    if (typeof s !== "string") return String(s || "");
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };
  var _portals = [];
  var _portalLogs = [];
  var _queueItems = [];
  var _prtPubs = [];
  var _prtCurrentPub = null;
  var PRT_STATUS_MAP = { published: "Publicado", pending: "Pendiente", synced: "Sincronizado", error: "Error", paused: "Pausado", archived: "Archivado" };
  var PRT_STATUS_CLS = { published: "status-disponible", pending: "status-oculta", synced: "status-disponible", error: "status-vendida", paused: "admin-prop-featured", archived: "status-oculta" };
  function loadPortals() {
    API.getPortals().then((portals) => {
      _portals = portals;
      renderPortals();
      loadPortalLogs();
      loadPortalQueueCount();
      if (typeof loadPortalManagement === "function") loadPortalManagement();
    }).catch(() => {
      $("portalsAdminList").innerHTML = '<div class="loading-state">Sin permisos para ver portales.</div>';
    });
  }
  function loadPortalLogs() {
    API.getPortalLogs().then((logs) => {
      _portalLogs = logs.items || logs;
      renderPortalLogs();
    }).catch(() => {
    });
  }
  document.addEventListener("click", function(e) {
    const btn = e.target.closest("[data-portal-subtab]");
    if (!btn) return;
    document.querySelectorAll("#portalSubtabs .admin-subtab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.portalSubtab;
    ["dashboard", "portals", "publications", "queue"].forEach((t) => {
      const el = $("portalSubtab" + t.charAt(0).toUpperCase() + t.slice(1));
      if (el) el.classList.toggle("hidden", t !== tab);
    });
    if (tab === "dashboard") loadPortalManagement();
    if (tab === "publications") loadPublicationsEnhanced();
    if (tab === "queue") loadQueue("pending");
  });
  async function loadPortalManagement() {
    try {
      const kpis = await _portalReq("GET", "/api/portals/kpi");
      renderPrtKpiBar(kpis);
      const platforms = await _portalReq("GET", "/api/portals/platforms");
      renderPrtPlatforms(platforms);
      const pubs = await _portalReq("GET", "/api/portals/publications/enhanced?per_page=20");
      _prtPubs = pubs.items || pubs;
      renderPrtPubs($("portalDashboardPubs"));
    } catch (e) {
      $("portalDashboardPubs").innerHTML = '<div class="loading-state">Error al cargar</div>';
    }
  }
  function renderPrtKpiBar(kpis) {
    const container = $("prtKpiBar");
    if (!container) return;
    const items = [
      { label: "Publicadas", num: kpis.published, sub: "activas" },
      { label: "Pendientes", num: kpis.pending, sub: "por publicar" },
      { label: "Con errores", num: kpis.errors, sub: "requieren atenci\xF3n" },
      { label: "Sincronizadas", num: kpis.synced, sub: "al d\xEDa" },
      { label: "Actualizadas hoy", num: kpis.updated_today, sub: "hoy" },
      { label: "Portales conectados", num: kpis.portals_connected, sub: "activos" },
      { label: "Publicaciones activas", num: kpis.active, sub: "en portales" },
      { label: "Publicaciones pausadas", num: kpis.paused, sub: "temporalmente" }
    ];
    container.innerHTML = items.map((i) => `
    <div class="prt-kpi-card">
      <span class="prt-kpi-label">${i.label}</span>
      <span class="prt-kpi-number">${i.num}</span>
      <span class="prt-kpi-sub">${i.sub}</span>
    </div>
  `).join("");
  }
  function renderPrtPlatforms(platforms) {
    const container = $("prtPlatformsGrid");
    if (!container) return;
    const icons = { zonaprop: "\u{1F535}", argenprop: "\u{1F534}", mercadolibre: "\u{1F7E1}", properati: "\u{1F7E2}", propio: "\u26AA" };
    container.innerHTML = platforms.map((p) => `
    <div class="prt-platform-card">
      <div class="prt-platform-icon">${icons[p.slug] || "\u{1F50C}"}</div>
      <div class="prt-platform-info">
        <div class="prt-platform-name">${esc(p.name)}</div>
        <div class="prt-platform-count">${p.publications_count} publicaciones \xB7 ${p.active ? "Activo" : "Inactivo"}</div>
      </div>
      <span class="admin-status-badge ${p.active ? "status-disponible" : "status-oculta"} prt-badge-tiny">${p.active ? "\u2713" : "\u2014"}</span>
    </div>
  `).join("");
  }
  function renderPrtPubs(container) {
    if (!container) return;
    if (!_prtPubs.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Sin publicaciones</div></div>';
      return;
    }
    container.innerHTML = _prtPubs.map((p) => {
      var _a;
      const thumb = (_a = p.property_images) == null ? void 0 : _a[0];
      const statusCls = PRT_STATUS_CLS[p.status] || "status-oculta";
      return `
      <div class="prt-pub-item" onclick="openPrtPanel(${p.id})">
        ${thumb ? `<img src="${proxyImgUrl(thumb)}" class="prt-pub-thumb" onerror="this.className='prt-pub-thumb--empty';this.textContent='\u{1F3E0}'">` : '<div class="prt-pub-thumb--empty">\u{1F3E0}</div>'}
        <div class="prt-pub-body">
          <div class="prt-pub-address">${esc(p.property_address || p.property_title || "\u2014")}</div>
          <div class="prt-pub-meta">
            <span class="admin-status-badge ${statusCls} prt-badge-tiny">${PRT_STATUS_MAP[p.status] || p.status}</span>
            <span class="prt-pub-meta-item">${esc(p.portal_name)}</span>
            <span class="prt-pub-meta-item">${p.operation === "alquiler" ? "Alquiler" : "Venta"}</span>
          </div>
        </div>
        <div class="prt-pub-right">
          <span class="prt-pub-date">${p.published_at ? formatDateShort(p.published_at) : "\u2014"}</span>
          <span class="prt-pub-date">${p.last_synced_at ? "\u21BB " + formatDateShort(p.last_synced_at) : ""}</span>
        </div>
      </div>
    `;
    }).join("");
  }
  async function loadPublicationsEnhanced() {
    const container = $("publicationsEnhancedList");
    if (!container) return;
    container.innerHTML = '<div class="loading-state">Cargando publicaciones...</div>';
    try {
      const data = await _portalReq("GET", "/api/portals/publications/enhanced?per_page=200");
      _prtPubs = data.items || [];
      renderPublicationsEnhanced("");
    } catch (e) {
      container.innerHTML = '<div class="loading-state">Error al cargar</div>';
    }
  }
  function renderPublicationsEnhanced(filter) {
    const container = $("publicationsEnhancedList");
    if (!container) return;
    const f = (filter || "").toLowerCase();
    let items = _prtPubs;
    if (f) items = items.filter((p) => (p.property_address || p.property_title || "").toLowerCase().includes(f));
    if (!items.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Sin resultados</div></div>';
      return;
    }
    container.innerHTML = items.map((p) => {
      var _a;
      const thumb = (_a = p.property_images) == null ? void 0 : _a[0];
      const statusCls = PRT_STATUS_CLS[p.status] || "status-oculta";
      return `
      <div class="prt-pub-item" onclick="openPrtPanel(${p.id})">
        ${thumb ? `<img src="${proxyImgUrl(thumb)}" class="prt-pub-thumb" onerror="this.className='prt-pub-thumb--empty';this.textContent='\u{1F3E0}'">` : '<div class="prt-pub-thumb--empty">\u{1F3E0}</div>'}
        <div class="prt-pub-body">
          <div class="prt-pub-address">${esc(p.property_address || p.property_title || "\u2014")}</div>
          <div class="prt-pub-meta">
            <span class="admin-status-badge ${statusCls} prt-badge-tiny">${PRT_STATUS_MAP[p.status] || p.status}</span>
            <span class="prt-pub-meta-item">${esc(p.portal_name)}</span>
            <span class="prt-pub-meta-item">${p.operation === "alquiler" ? "Alquiler" : "Venta"}</span>
            <span class="prt-pub-meta-item">${p.property_beds ? p.property_beds + " dorm" : ""}</span>
          </div>
        </div>
        <div class="prt-pub-right">
          <span class="prt-pub-date">${p.published_at ? formatDateShort(p.published_at) : "\u2014"}</span>
          ${p.last_synced_at ? `<span class="prt-pub-date">\u21BB ${formatDateShort(p.last_synced_at)}</span>` : ""}
        </div>
        <div class="prt-pub-actions">
          <button class="btn btn-ghost btn-sm prt-icon-btn" onclick="event.stopPropagation();openPrtPanel(${p.id})" title="Ver detalle" >\u{1F441}</button>
          <button class="btn btn-ghost btn-sm prt-icon-btn" onclick="event.stopPropagation();prtQuickAction(${p.id},'pause')" title="Pausar" >\u23F8</button>
          <button class="btn btn-ghost btn-sm prt-icon-btn" onclick="event.stopPropagation();prtQuickAction(${p.id},'delete')" title="Eliminar" >\u{1F5D1}</button>
        </div>
      </div>
    `;
    }).join("");
  }
  window.filterPublications = function(v) {
    var _a;
    if ((_a = $("portalSubtabPublications")) == null ? void 0 : _a.classList.contains("hidden")) return;
    renderPublicationsEnhanced(v);
  };
  async function openPrtPanel(id) {
    var _a;
    try {
      const p = await _portalReq("GET", `/api/portals/publications/${id}`);
      _prtCurrentPub = p;
      $("prtPanelTitle").textContent = esc(p.property_address || p.property_title || "Publicaci\xF3n");
      const body = $("prtPanelBody");
      const thumb = (_a = p.property_images) == null ? void 0 : _a[0];
      const statusCls = PRT_STATUS_CLS[p.status] || "status-oculta";
      const history = p.sync_history || [];
      body.innerHTML = `
      <div class="prt-panel-header">
        ${thumb ? `<img src="${proxyImgUrl(thumb)}" class="prt-panel-thumb" onerror="this.style.display='none'">` : ""}
        <div class="prt-panel-title">${esc(p.property_address || p.property_title || "\u2014")}</div>
      </div>

      <div class="prt-panel-section">
        <div class="prt-panel-section-title">Detalles</div>
        <div class="prt-panel-row"><span class="prt-panel-label">Estado</span><span class="admin-status-badge ${statusCls}">${PRT_STATUS_MAP[p.status] || p.status}</span></div>
        <div class="prt-panel-row"><span class="prt-panel-label">Portal</span><span class="prt-panel-value">${esc(p.portal_name)}</span></div>
        <div class="prt-panel-row"><span class="prt-panel-label">Operaci\xF3n</span><span class="prt-panel-value">${p.operation === "alquiler" ? "Alquiler" : "Venta"}</span></div>
        ${p.property_price ? `<div class="prt-panel-row"><span class="prt-panel-label">Precio</span><span class="prt-panel-value prt-price-value" >$ ${Number(p.property_price).toLocaleString("es-AR")}</span></div>` : ""}
        ${p.property_beds ? `<div class="prt-panel-row"><span class="prt-panel-label">Dormitorios</span><span class="prt-panel-value">${p.property_beds}</span></div>` : ""}
        ${p.property_baths ? `<div class="prt-panel-row"><span class="prt-panel-label">Ba\xF1os</span><span class="prt-panel-value">${p.property_baths}</span></div>` : ""}
        ${p.property_sqm ? `<div class="prt-panel-row"><span class="prt-panel-label">Superficie</span><span class="prt-panel-value">${p.property_sqm} m\xB2</span></div>` : ""}
        ${p.external_id ? `<div class="prt-panel-row"><span class="prt-panel-label">ID externo</span><span class="prt-panel-value prt-mono-value" >${esc(p.external_id)}</span></div>` : ""}
        ${p.assigned_agent_name ? `<div class="prt-panel-row"><span class="prt-panel-label">Responsable</span><span class="prt-panel-value">${esc(p.assigned_agent_name)}</span></div>` : ""}
      </div>

      ${p.published_at ? `<div class="prt-panel-section"><div class="prt-panel-section-title">Fechas</div>
        <div class="prt-panel-row"><span class="prt-panel-label">Publicaci\xF3n</span><span class="prt-panel-value">${formatDateShort(p.published_at)}</span></div>
        ${p.last_synced_at ? `<div class="prt-panel-row"><span class="prt-panel-label">\xDAltima sinc.</span><span class="prt-panel-value">${formatDateShort(p.last_synced_at)}</span></div>` : ""}
        ${p.paused_at ? `<div class="prt-panel-row"><span class="prt-panel-label">Pausada</span><span class="prt-panel-value">${formatDateShort(p.paused_at)}</span></div>` : ""}
      </div>` : ""}

      ${p.last_error ? `<div class="prt-panel-section"><div class="prt-panel-section-title">Error</div>
        <div class="prt-error-box">${esc(p.last_error)}</div>
      </div>` : ""}

      <div class="prt-panel-section">
        <div class="prt-panel-section-title">Acciones r\xE1pidas</div>
        <div class="prt-actions">
          ${p.status !== "published" && p.status !== "synced" ? `<button class="btn btn-primary btn-sm prt-action-btn" onclick="prtAction(${p.id},'publish')">Publicar</button>` : ""}
          <button class="btn btn-ghost btn-sm prt-action-btn" onclick="prtAction(${p.id},'pause')">Pausar</button>
          ${p.paused_at ? `<button class="btn btn-ghost btn-sm prt-action-btn" onclick="prtAction(${p.id},'resume')">Reanudar</button>` : ""}
          ${p.status === "error" ? `<button class="btn btn-ghost btn-sm prt-action-btn" onclick="prtAction(${p.id},'retry')">Reintentar</button>` : ""}
          ${p.archived_at ? `<button class="btn btn-ghost btn-sm prt-action-btn" onclick="prtAction(${p.id},'unarchive')">Restaurar</button>` : `<button class="btn btn-ghost btn-sm prt-action-btn" onclick="prtAction(${p.id},'archive')">Archivar</button>`}
          <button class="btn btn-danger btn-sm prt-action-btn" onclick="prtConfirmDelete(${p.id})">Eliminar</button>
        </div>
      </div>

      <div class="prt-panel-section">
        <div class="prt-panel-section-title">Historial de sincronizaci\xF3n (${history.length})</div>
        ${history.length ? history.map((h) => {
        const lvlColor = h.level === "error" ? "var(--admin-danger)" : h.level === "info" ? "var(--admin-primary)" : "var(--admin-text-muted)";
        return `<div class="prt-history-item">
            <div class="prt-history-level" style="background:${lvlColor}"></div>
            <div class="prt-history-body">
              <div class="prt-history-action">${esc(h.action)}</div>
              <div class="prt-history-msg">${esc(h.message)}</div>
            </div>
            <div class="prt-history-date">${h.created_at ? formatDateTime(h.created_at) : ""}</div>
          </div>`;
      }).join("") : '<div class="prt-no-history">Sin historial</div>'}
      </div>
    `;
      $("prtOverlay").classList.add("show");
      $("prtPanel").classList.add("open");
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  function closePrtPanel() {
    $("prtOverlay").classList.remove("show");
    $("prtPanel").classList.remove("open");
    _prtCurrentPub = null;
  }
  async function prtAction(id, action) {
    var _a, _b;
    try {
      const result = await _portalReq("POST", `/api/portals/publications/${id}/action`, { action });
      const actionLabels = { publish: "Publicada", pause: "Pausada", resume: "Reanudada", retry: "Reintentando", archive: "Archivada", unarchive: "Restaurada" };
      toast(actionLabels[action] || "Acci\xF3n completada", "success");
      closePrtPanel();
      loadPortalManagement();
      if (!((_a = $("portalSubtabDashboard")) == null ? void 0 : _a.classList.contains("hidden"))) loadPortalManagement();
      if (!((_b = $("portalSubtabPublications")) == null ? void 0 : _b.classList.contains("hidden"))) loadPublicationsEnhanced();
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  async function prtConfirmDelete(id) {
    var _a, _b;
    if (!await confirmModal("\xBFEliminar esta publicaci\xF3n definitivamente?")) return;
    try {
      await _portalReq("POST", `/api/portals/publications/${id}/action`, { action: "delete" });
      toast("Publicaci\xF3n eliminada", "success");
      closePrtPanel();
      if (!((_a = $("portalSubtabDashboard")) == null ? void 0 : _a.classList.contains("hidden"))) loadPortalManagement();
      if (!((_b = $("portalSubtabPublications")) == null ? void 0 : _b.classList.contains("hidden"))) loadPublicationsEnhanced();
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  async function _portalReq(method, path, body) {
    const api = window.API;
    if (!api) throw new Error("API no disponible");
    return api._rawReq ? api._rawReq(method, path, body) : _req(method, path, body);
  }
  async function loadPortalDashboard() {
    const list = $("portalDashboardList");
    if (!list) return;
    list.innerHTML = '<div class="loading-state">Cargando dashboard...</div>';
    try {
      const data = await _portalReq("GET", "/api/portals/dashboard");
      const portals = data.data || [];
      if (!portals.length) {
        list.innerHTML = '<div class="empty-state">No hay portales configurados.</div>';
        return;
      }
      let h = '<div class="prt-portal-grid">';
      portals.forEach((p) => {
        const healthColors = { ok: "var(--success)", warning: "#c9a84c", error: "#e65b5b", inactive: "var(--g4)" };
        const healthLabels = { ok: "Saludable", warning: "Atenci\xF3n", error: "Error", inactive: "Inactivo" };
        const color = healthColors[p.health] || "var(--g4)";
        const label = healthLabels[p.health] || p.health;
        h += '<div style="background:var(--s2);border:1px solid var(--b);border-radius:10px;padding:18px;border-left:3px solid ' + color + '">';
        h += '<div class="prt-card-header">';
        h += '<span style="width:10px;height:10px;border-radius:50%;background:' + color + '"></span>';
        h += '<strong class="prt-card-title">' + esc(p.name) + "</strong>";
        h += '<span style="font-size:10px;color:' + color + ';font-weight:600;background:rgba(0,0,0,0.2);padding:2px 8px;border-radius:4px">' + label + "</span>";
        h += "</div>";
        h += '<div class="prt-stats-grid">';
        h += '<div><span class="prt-stat-label">Publicadas</span><br><span class="prt-stat-value">' + p.publications_published + "/" + p.publications_total + "</span></div>";
        h += '<div><span class="prt-stat-label">Errores</span><br><span style="color:' + (p.publications_errors > 0 ? "#e65b5b" : "var(--g3)") + ';font-weight:600">' + p.publications_errors + "</span></div>";
        h += '<div><span class="prt-stat-label">Cola pendiente</span><br><span class="prt-stat-value">' + p.queue_pending + "</span></div>";
        h += '<div><span class="prt-stat-label">Cola fallida</span><br><span style="color:' + (p.queue_failed > 0 ? "#e65b5b" : "var(--g3)") + ';font-weight:600">' + p.queue_failed + "</span></div>";
        h += "</div>";
        if (p.last_sync_at) {
          h += '<div class="prt-last-activity">\xDAltima actividad: ' + new Date(p.last_sync_at).toLocaleString() + "</div>";
        }
        h += '<div class="prt-actions-row">';
        if (p.queue_failed > 0) {
          h += '<button class="btn btn-ghost btn-sm prt-action-btn" onclick="retryAllFailed()">Reintentar fallidos</button>';
        }
        h += '<button class="btn btn-ghost btn-sm prt-action-btn" onclick="loadPortalLogsForPortal(' + p.id + ",'" + esc(p.name) + `')">Ver logs</button>`;
        h += "</div></div>";
      });
      h += "</div>";
      list.innerHTML = h;
    } catch (e) {
      list.innerHTML = '<div class="error-state">Error: ' + e.message + "</div>";
    }
  }
  async function retryAllFailed() {
    var _a;
    try {
      const res = await _portalReq("POST", "/api/portals/bulk/retry");
      toast("Reintentando " + (((_a = res.data) == null ? void 0 : _a.retried) || 0) + " items fallidos", "info");
      loadPortalDashboard();
      loadPortalQueueCount();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function bulkPublishToPortals(propertyIds, rentalIds) {
    var _a;
    if (!propertyIds.length && !rentalIds.length) return;
    const count = propertyIds.length + rentalIds.length;
    if (!await confirmModal(`\xBFPublicar ${count} item${count !== 1 ? "s" : ""} en portales activos?`)) return;
    const portals = _portals.filter((p) => p.active);
    if (!portals.length) {
      toast("No hay portales activos", "warn");
      return;
    }
    const portalIds = portals.map((p) => p.id);
    try {
      const res = await _portalReq("POST", "/api/portals/bulk/publish", { property_ids: propertyIds, rental_ids: rentalIds, portal_ids: portalIds });
      toast(((_a = res.data) == null ? void 0 : _a.enqueued) + " items encolados", "success");
      loadPortalQueueCount();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function bulkUnpublishFromPortals(propertyIds, rentalIds) {
    var _a;
    if (!propertyIds.length && !rentalIds.length) return;
    const count = propertyIds.length + rentalIds.length;
    if (!await confirmModal(`\xBFDespublicar ${count} item${count !== 1 ? "s" : ""} de los portales?`)) return;
    const portals = _portals.filter((p) => p.active);
    if (!portals.length) {
      toast("No hay portales activos", "warn");
      return;
    }
    const portalIds = portals.map((p) => p.id);
    try {
      const res = await _portalReq("POST", "/api/portals/bulk/unpublish", { property_ids: propertyIds, rental_ids: rentalIds, portal_ids: portalIds });
      toast(((_a = res.data) == null ? void 0 : _a.enqueued) + " items encolados", "success");
      loadPortalQueueCount();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  window.loadPortalDashboard = loadPortalDashboard;
  window.retryAllFailed = retryAllFailed;
  window.bulkPublishToPortals = bulkPublishToPortals;
  window.bulkUnpublishFromPortals = bulkUnpublishFromPortals;
  function loadPortalQueueCount() {
    API.getQueueCount().then((r) => {
      const n = r.pending || 0;
      const badge = $("sidebarPortalCount");
      const qBadge = $("queueCountBadge");
      if (badge) badge.textContent = n;
      if (badge) badge.style.display = n > 0 ? "" : "none";
      if (qBadge) {
        qBadge.textContent = n;
        qBadge.style.display = n > 0 ? "" : "none";
      }
    }).catch(() => {
    });
  }
  function renderPortals() {
    const list = $("portalsAdminList");
    if (!_portals.length) {
      list.innerHTML = '<div class="loading-state">No hay portales configurados.</div>';
      return;
    }
    list.innerHTML = _portals.map((p) => `
    <div class="admin-prop-card portal-card">
      <div class="admin-prop-info">
        <div class="prt-flex-row">
          <span style="width:8px;height:8px;border-radius:50%;background:${p.active ? "var(--success)" : "var(--g3)"}"></span>
          <strong class="prt-detail-name">${esc(p.name)}</strong>
          <code class="prt-detail-slug">${esc(p.slug)}</code>
        </div>
      </div>
      <div class="admin-agent-actions prt-actions-gap8">
        <label class="toggle-switch" title="${p.active ? "Desactivar" : "Activar"}">
          <input type="checkbox" ${p.active ? "checked" : ""} onchange="togglePortal(${p.id}, this.checked)"/>
          <span class="toggle-slider"></span>
        </label>
        <button class="btn btn-ghost btn-sm" onclick="editPortal(${p.id})">Editar</button>
        <button class="btn btn-ghost btn-sm" onclick="viewPortalLogs(${p.id})">Logs</button>
        ${p.slug === "mercadolibre" ? `
          <button class="btn btn-ghost btn-sm" onclick="syncFromML()">\u21BB ML Import</button>
          <button class="btn btn-ghost btn-sm" onclick="syncBidiML()">\u27F7 ML Sync</button>
        ` : ""}
        <button class="btn btn-danger btn-sm" onclick="confirmDeletePortal(${p.id})">Eliminar</button>
      </div>
    </div>`).join("");
  }
  function renderPortalLogs() {
    const list = $("portalLogsList");
    if (!list) return;
    if (!_portalLogs.length) {
      list.innerHTML = '<div class="loading-state">Sin actividad a\xFAn.</div>';
      return;
    }
    list.innerHTML = _portalLogs.slice(0, 50).map((l) => `
    <div class="admin-message-item prt-msg-item">
      <span class="admin-status-badge ${l.level === "error" ? "status-vendida" : l.level === "info" ? "status-disponible" : ""} prt-level-badge"
            >${l.level}</span>
       <span class="prt-action-code">${esc(l.action)}</span>
      <span class="prt-log-msg-ellipsis">${esc(l.message)}</span>
      <span class="prt-log-time">${l.created_at ? new Date(l.created_at).toLocaleString() : ""}</span>
    </div>`).join("");
  }
  var _queueMode = "pending";
  function loadQueue(mode) {
    _queueMode = mode || "pending";
    document.querySelectorAll("#btnQueuePending, #btnQueueAll").forEach((b) => b.classList.remove("btn-primary"));
    const btn = mode === "all" ? $("btnQueueAll") : $("btnQueuePending");
    if (btn) btn.classList.add("btn-primary");
    $("queueList").innerHTML = '<div class="loading-state">Cargando cola...</div>';
    const params = mode === "pending" ? { processed: "false" } : {};
    API.getQueueItems(params).then((items) => {
      _queueItems = items.items || items;
      renderQueue();
    }).catch(() => {
      $("queueList").innerHTML = '<div class="loading-state">Error al cargar cola.</div>';
    });
  }
  function renderQueue() {
    const list = $("queueList");
    if (!_queueItems.length) {
      list.innerHTML = '<div class="loading-state">Sin items en la cola.</div>';
      return;
    }
    list.innerHTML = _queueItems.map((q) => {
      var _a;
      const title = [];
      if (q.property_id) title.push("Prop #" + q.property_id);
      if (q.rental_id) title.push("Alq #" + q.rental_id);
      const actionLabel = q.action === "publish" ? "Publicar" : q.action === "update" ? "Actualizar" : "Despublicar";
      const portalName = ((_a = _portals.find((p) => p.id === q.portal_id)) == null ? void 0 : _a.name) || "?";
      const hasError = !!q.error;
      return `<div class="admin-message-item prt-msg-lg">
      <div class="prt-msg-flex">
        <span class="prt-queue-portal">${esc(portalName)}</span>
        <span class="prt-queue-action">${actionLabel}</span>
        <span class="prt-queue-title">${title.join(" / ")}</span>
        <span class="admin-status-badge ${q.processed ? hasError ? "status-vendida" : "status-disponible" : ""} prt-level-badge"
              >${q.processed ? hasError ? "Error" : "OK" : "Pendiente"}</span>
        ${q.error ? `<span class="prt-error-msg" title="${esc(q.error)}">${esc(q.error)}</span>` : ""}
      </div>
      <div class="prt-queue-row">
        <span class="prt-queue-date">${q.created_at ? new Date(q.created_at).toLocaleString() : ""}</span>
        ${q.processed && hasError ? `<button class="btn btn-ghost btn-sm" onclick="retryQueueItem(${q.id})" title="Reintentar">\u21BB Reintentar</button>` : ""}
        ${!q.processed ? `<button class="btn btn-ghost btn-sm" onclick="cancelQueueItem(${q.id})" title="Cancelar">\u2715</button>` : ""}
      </div>
    </div>`;
    }).join("");
  }
  async function retryQueueItem(id) {
    try {
      await API.retryQueueItem(id);
      toast("Reintentando...", "info");
      loadQueue(_queueMode);
      loadPortalQueueCount();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function cancelQueueItem(id) {
    toast("Us\xE1 el panel de portales para eliminar el item.", "warn");
  }
  function refreshQueue() {
    loadQueue(_queueMode);
    loadPortalQueueCount();
  }
  window.refreshQueue = refreshQueue;
  function openPortalForm(data) {
    $("portalFormTitle").textContent = data ? "Editar Portal" : "Nuevo Portal";
    const p = data || {};
    $("portalFormContent").innerHTML = `
    <div class="pf-body">
      <div class="field">
        <label class="field-label">Nombre *</label>
        <input id="pf_name" class="field-input" value="${esc(p.name || "")}" placeholder="ZonaProp"/>
      </div>
      <div class="field">
        <label class="field-label">Slug *</label>
        <input id="pf_slug" class="field-input" value="${esc(p.slug || "")}" placeholder="zonaprop"/>
      </div>
      <div class="field">
        <label class="field-label">Configuraci\xF3n (JSON)</label>
        <textarea id="pf_config" class="field-input prt-config-area" rows="4"
          placeholder='{"api_key": "", "endpoint": "https://..."}'
          >${p.config ? JSON.stringify(p.config, null, 2) : ""}</textarea>
      </div>
      <div class="field prt-config-row">
        <label class="toggle-switch">
          <input type="checkbox" id="pf_active" ${p.active !== false ? "checked" : ""}/>
          <span class="toggle-slider"></span>
        </label>
        <span class="prt-active-label">Portal activo</span>
      </div>
      ${data && data.slug === "mercadolibre" ? `
      <div class="prt-sync-info">
        <p class="prt-sync-text">
          Vincul\xE1 tu cuenta de MercadoLibre para empezar a publicar:
        </p>
        <button class="btn btn-outline btn-sm" onclick="connectMercadoLibre()" id="mlConnectBtn">
          \u{1F517} Conectar con MercadoLibre
        </button>
        <span id="mlConnectedBadge" class="prt-ml-badge">\u2713 Conectado</span>
      </div>` : ""}
      <div class="prt-btn-row-mt20">
        <button class="btn btn-primary btn-full" id="savePortalBtn">${data ? "Guardar cambios" : "Crear portal"}</button>
        <button class="btn btn-ghost" onclick="closePortalForm()">Cancelar</button>
      </div>
    </div>`;
    $("portalFormModal").classList.remove("hidden");
    $("savePortalBtn").onclick = () => savePortalForm(data == null ? void 0 : data.id);
    if (data && data.slug === "mercadolibre") {
      const cfg = data.config || {};
      if (cfg.refresh_token || cfg.access_token) {
        const badge = $("mlConnectedBadge");
        const btn = $("mlConnectBtn");
        if (badge) badge.style.display = "";
        if (btn) btn.textContent = "\u{1F504} Reconectar con MercadoLibre";
      }
    }
  }
  function closePortalForm() {
    $("portalFormModal").classList.add("hidden");
  }
  async function savePortalForm(id) {
    const name = $("pf_name").value.trim();
    const slug = $("pf_slug").value.trim().toLowerCase().replace(/\s+/g, "_");
    const active = $("pf_active").checked;
    let config = {};
    try {
      const raw = $("pf_config").value.trim();
      if (raw) config = JSON.parse(raw);
    } catch (e) {
      toast("La configuraci\xF3n no es un JSON v\xE1lido.", "warn");
      return;
    }
    if (!name || !slug) {
      toast("Nombre y slug son obligatorios.", "warn");
      return;
    }
    try {
      let saved;
      if (id) {
        saved = await API.updatePortal(id, { name, slug, active, config });
        _portals = _portals.map((p) => p.id === id ? saved : p);
      } else {
        saved = await API.createPortal({ name, slug, active, config });
        _portals.push(saved);
      }
      renderPortals();
      closePortalForm();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function togglePortal(id, active) {
    if (!await confirmModal(`\xBF${active ? "Activar" : "Desactivar"} este portal?`)) return;
    try {
      const updated = await API.updatePortal(id, { active });
      _portals = _portals.map((p) => p.id === id ? updated : p);
      renderPortals();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function editPortal(id) {
    const p = _portals.find((p2) => p2.id === id);
    if (p) openPortalForm(p);
  }
  async function confirmDeletePortal(id) {
    const p = _portals.find((p2) => p2.id === id);
    if (!confirm(`\xBFEliminar el portal "${p == null ? void 0 : p.name}"?
Tambi\xE9n se eliminar\xE1n sus publicaciones y logs.`)) return;
    try {
      await API.deletePortal(id);
      _portals = _portals.filter((p2) => p2.id !== id);
      renderPortals();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function viewPortalLogs(portalId) {
    const p = _portals.find((p2) => p2.id === portalId);
    const logs = _portalLogs.filter((l) => l.portal_id === portalId);
    $("portalLogsModalTitle").textContent = p ? `Logs: ${p.name}` : "Logs";
    const list = $("portalLogsModalBody");
    if (!logs.length) {
      list.innerHTML = '<div class="loading-state">Sin registros.</div>';
    } else {
      list.innerHTML = logs.map((l) => `
      <div class="admin-message-item prt-msg-item">
        <span class="admin-status-badge ${l.level === "error" ? "status-vendida" : l.level === "info" ? "status-disponible" : ""} prt-level-badge"
              >${l.level}</span>
        <code class="prt-log-action-lg">${esc(l.action)}</code>
        <span class="prt-log-msg">${esc(l.message)}</span>
        <span class="prt-log-time">${l.created_at ? new Date(l.created_at).toLocaleString() : ""}</span>
      </div>`).join("");
    }
    $("portalLogsModal").classList.remove("hidden");
  }
  function closePortalLogsModal() {
    $("portalLogsModal").classList.add("hidden");
  }
  async function connectMercadoLibre() {
    const btn = $("mlConnectBtn");
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = "Conectando...";
    try {
      const data = await _portalReq("GET", "/api/portals/ml/auth-url");
      if (data.auth_url) {
        const popup = window.open(data.auth_url, "ml_oauth", "width=600,height=700,left=200,top=100");
        if (!popup) {
          toast("Bloqueador de ventanas emergentes. Permit\xED popups para este sitio.", "warn");
          return;
        }
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            btn.textContent = "\u{1F517} Conectar con MercadoLibre";
            btn.disabled = false;
            toast("Cuenta vinculada correctamente.", "ok");
          }
        }, 500);
      }
    } catch (e) {
      btn.textContent = "\u{1F517} Conectar con MercadoLibre";
      btn.disabled = false;
      toast(e.message, "error");
    }
  }
  async function syncFromML() {
    return syncBidiML();
  }
  function showSyncProgressModal() {
    const existing = $("mlSyncModal");
    if (existing) existing.remove();
    const el = document.createElement("div");
    el.id = "mlSyncModal";
    el.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center";
    el.innerHTML = `
    <div class="prt-sync-dialog">
      <h3 class="prt-sync-title">Sincronizando con MercadoLibre\u2026</h3>
      <p id="mlSyncPhase" class="prt-sync-phase">Iniciando\u2026</p>
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
    const el = $("mlSyncModal");
    if (el) el.remove();
  }
  function updateSyncProgress() {
    _portalReq("GET", "/api/portals/ml/sync/progress").then((p) => {
      const phase = $("mlSyncPhase");
      const bar = $("mlSyncBar");
      const count = $("mlSyncCount");
      const errDiv = $("mlSyncErrors");
      if (!phase) return;
      phase.textContent = p.phase || "Sincronizando\u2026";
      const pct = p.total > 0 ? Math.round(p.current / p.total * 100) : 0;
      if (bar) bar.style.width = pct + "%";
      if (count) count.textContent = `${p.current} / ${p.total}`;
      if (errDiv && p.errors && p.errors.length) errDiv.textContent = p.errors.join("\n");
      if (!p.running) {
        setTimeout(closeSyncProgressModal, 1500);
        loadPortals();
      }
    }).catch(() => {
    });
    if ($("mlSyncModal")) setTimeout(updateSyncProgress, 800);
  }
  async function syncBidiML() {
    showSyncProgressModal();
    updateSyncProgress();
    try {
      await _portalReq("POST", "/api/portals/ml/sync");
    } catch (e) {
      const phase = $("mlSyncPhase");
      if (phase) phase.textContent = "Error: " + e.message;
    }
  }
  function formatDateShort(d) {
    if (!d) return "\u2014";
    try {
      const dt = /* @__PURE__ */ new Date(d + (d.includes("T") ? "" : "T00:00:00"));
      return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch (e) {
      return d;
    }
  }
  function formatDateTime(d) {
    if (!d) return "\u2014";
    try {
      return (/* @__PURE__ */ new Date(d + "Z")).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return d;
    }
  }
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
  function renderComparableCardsShared(a, cfg) {
    const pfx = cfg.prefix || "";
    const getTipo = cfg.getTipoFn || (() => a.tipo_propiedad || "casa");
    const comps = a.comparables || [];
    if (!comps.length) {
      return '<div class="ap-empty-card">No hay comparables cargados. Agreg\xE1 al menos 2 para obtener una valuaci\xF3n.</div>';
    }
    const isReadOnly = a.estado === "completada" || a.estado === "archivada";
    function chip(label, value, color) {
      return `<div class="ap-label-chip">
      <div class="ap-overline-compact">${label}</div>
      <div style="color:${color || "var(--white)"};font-size:13px;font-weight:600;font-family:var(--font-title)">${value}</div>
    </div>`;
    }
    return comps.map((c2) => {
      const coef = _calcCoef(c2);
      const pp = c2.precio_por_m2 || (c2.precio_usd && c2.superficie_cubierta ? round(c2.precio_usd / c2.superficie_cubierta, 2) : null);
      const ajustado = _ajustado(c2) || (pp && coef ? round(pp * coef, 2) : null);
      function attrBadge(attr, label) {
        const val = c2[attr] || "equivalente";
        const icon = val === "superior" ? "\u2191" : val === "inferior" ? "\u2193" : "=";
        const clr = val === "superior" ? "var(--accent)" : val === "inferior" ? "#e74c3c" : "var(--g3)";
        return `<span style="color:${clr};font-size:10px;font-weight:600">${icon} ${label}</span>`;
      }
      const isExcluded = c2.excluido === true;
      const cardStyle = isExcluded ? "opacity:0.5;filter:grayscale(1)" : "";
      return `<div class="acm-comparable-item" style="display:block;padding:16px;${cardStyle}">
      <div class="ap-flex-row-between-sm">
        <div>
          <strong class="ap-btn-text-light">C${c2.numero}</strong>
          ${isExcluded ? '<span class="ap-inline-hint">[excluido]</span>' : ""}
          <span class="ap-inline-note">${esc((c2.calle || "") + " " + (c2.numero_calle || ""))}</span>
          ${c2.barrio ? `<span class="ap-inline-hint">\xB7 ${esc(c2.barrio)}</span>` : ""}
        </div>
        ${isReadOnly ? "" : `<div class="ap-flex-row-tight">
          <button class="btn btn-ghost btn-sm ${pfx}editComparableBtn ap-btn-icon-sm" data-aid="${a.id}" data-cid="${c2.id}">\u270E</button>
          <button class="btn btn-ghost btn-sm ${pfx}toggleExclusionBtn ap-btn-icon-sm" data-aid="${a.id}" data-cid="${c2.id}" title="${isExcluded ? "Incluir" : "Excluir del c\xE1lculo"}">${isExcluded ? "\u25C9" : "\u25CE"}</button>
          <button class="btn btn-danger btn-sm ${pfx}deleteComparableBtn ap-btn-icon-sm" data-aid="${a.id}" data-cid="${c2.id}">\xD7</button>
        </div>`}
      </div>
      <div class="ap-four-col-grid">
        ${chip("Precio", _fmtUSD(c2.precio_usd), "var(--accent)")}
        ${chip("Precio/m\xB2", pp ? _fmtUSD(pp) : "\u2014", "var(--white)")}
        ${chip("Coeficiente", coef.toFixed(4), coef > 1 ? "#e74c3c" : coef < 1 ? "var(--accent)" : "var(--g3)")}
        ${chip("$/m\xB2 Ajustado", ajustado ? _fmtUSD(ajustado) : "\u2014", "var(--accent)")}
      </div>
      <div class="ap-flex-wrap">
        ${(() => {
        const tipo = getTipo();
        const attrs = getTypeAttrs(tipo);
        return attrs.map((a2) => attrBadge(a2[0], a2[1])).join("");
      })()}
        <span class="ap-meta-right">${c2.tipo_operacion === "venta" ? "Venta" : "Cotizaci\xF3n"}</span>
      </div>
    </div>`;
    }).join("");
  }
  var _appraisals = [];
  var _currentAppraisal = null;
  var _appraisalPage = 1;
  var _appraisalPages = 1;
  var _appraisalTotal = 0;
  function _sel(id, val, opts) {
    const v = val != null ? val : "";
    const oh = opts.map((o) => `<option value="${o[0]}"${v === o[0] ? " selected" : ""}>${o[1]}</option>`).join("");
    return id ? `<select id="${id}" class="field-input field-input--select">${oh}</select>` : oh;
  }
  function _tf(v) {
    return v != null ? v : "";
  }
  function _fmtUSD(n) {
    const v = Number(n);
    return v ? `USD ${v.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "\u2014";
  }
  function stDev(arr) {
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
  }
  function _fmtARS(n) {
    const v = Number(n);
    return v ? `ARS ${v.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "\u2014";
  }
  function _fmtUVA(n) {
    const v = Number(n);
    return v ? `${v.toLocaleString("es-AR", { minimumFractionDigits: 2 })} UVAs` : "\u2014";
  }
  function round(v, d) {
    const p = Math.pow(10, d || 0);
    return Math.round(v * p) / p;
  }
  var ESTADO_MAP = { borrador: "Borrador", en_proceso: "En proceso", completada: "Completada", archivada: "Archivada" };
  var ESTADO_CLS = { borrador: "status-oculta", en_proceso: "status-disponible", completada: "status-vendida", archivada: "status-oculta" };
  var TIPO_PROPS = [["casa", "Casa"], ["departamento", "Departamento"], ["ph", "PH"], ["local", "Local"], ["oficina", "Oficina"], ["terreno", "Terreno"]];
  var DESTINOS = [["venta", "Venta"], ["locacion", "Locaci\xF3n"], ["garantia", "Garant\xEDa"], ["seguro", "Seguro"]];
  function esc(v) {
    return String(v != null ? v : "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  var COMP_ATTRS = [
    "comp_antiguedad",
    "comp_estacionamiento",
    "comp_habitaciones",
    "comp_ubicacion",
    "comp_estado_mantenimiento",
    "comp_comodidades",
    "comp_orientacion",
    "comp_vistas",
    "comp_nivel_piso"
  ];
  var TYPE_ATTR_MAP = {
    casa: [
      ["comp_antiguedad", "Antig\xFCedad", 0.07, true],
      ["comp_estado_mantenimiento", "Estado de mantenimiento", 0.05, false],
      ["comp_estacionamiento", "Estacionamiento", 0.03, true],
      ["comp_ubicacion", "Calidad de ubicaci\xF3n", 0.07, false],
      ["comp_comodidades", "Comodidades", 0.04, false],
      ["comp_habitaciones", "Cantidad de habitaciones", 0.04, true]
    ],
    ph: [
      ["comp_antiguedad", "Antig\xFCedad", 0.07, true],
      ["comp_estado_mantenimiento", "Estado de mantenimiento", 0.05, false],
      ["comp_estacionamiento", "Estacionamiento", 0.03, true],
      ["comp_ubicacion", "Calidad de ubicaci\xF3n", 0.07, false],
      ["comp_comodidades", "Comodidades", 0.04, false],
      ["comp_habitaciones", "Cantidad de habitaciones", 0.04, true]
    ],
    departamento: [
      ["comp_nivel_piso", "Ubicaci\xF3n planta", 0.05, false],
      ["comp_vistas", "Ubicaci\xF3n piso", 0.03, false],
      ["comp_antiguedad", "Antig\xFCedad", 0.06, true],
      ["comp_ubicacion", "Calidad de ubicaci\xF3n", 0.07, false],
      ["comp_comodidades", "Comodidades", 0.04, false],
      ["comp_habitaciones", "Cantidad de habitaciones", 0.05, true]
    ],
    terreno: [
      ["comp_comodidades", "Servicios", 0.05, false],
      ["comp_vistas", "Acceso", 0.04, false],
      ["comp_habitaciones", "Superficie", 0.06, true],
      ["comp_ubicacion", "Calidad de ubicaci\xF3n", 0.07, false],
      ["comp_orientacion", "Forma", 0.04, false],
      ["comp_antiguedad", "Orientaci\xF3n", 0.04, false]
    ],
    local: [
      ["comp_ubicacion", "Ubicaci\xF3n / Visibilidad", 0.07, false],
      ["comp_estado_mantenimiento", "Estado de mantenimiento", 0.05, false],
      ["comp_habitaciones", "Superficie", 0.06, true],
      ["comp_vistas", "Accesibilidad", 0.03, false],
      ["comp_comodidades", "Comodidades / Instalaciones", 0.05, false],
      ["comp_estacionamiento", "Estacionamiento", 0.04, true]
    ],
    oficina: [
      ["comp_ubicacion", "Ubicaci\xF3n / Visibilidad", 0.07, false],
      ["comp_estado_mantenimiento", "Estado de mantenimiento", 0.05, false],
      ["comp_habitaciones", "Superficie", 0.06, true],
      ["comp_vistas", "Accesibilidad", 0.03, false],
      ["comp_comodidades", "Comodidades / Instalaciones", 0.05, false],
      ["comp_estacionamiento", "Estacionamiento", 0.04, true]
    ]
  };
  function getTypeAttrs(tipo) {
    return TYPE_ATTR_MAP[tipo] || TYPE_ATTR_MAP.casa;
  }
  function getCurrentAppraisalType() {
    return _currentAppraisal && _currentAppraisal.tipo_propiedad || "casa";
  }
  function _calcCoef(c2) {
    const coef = c2.coeficiente_ajuste;
    if (coef != null) return coef;
    return 1;
  }
  function _ajustado(c2) {
    const v = c2.valor_m2_ajustado;
    if (v != null) return v;
    if (c2.precio_por_m2 && c2.coeficiente_ajuste) return round(c2.precio_por_m2 * c2.coeficiente_ajuste, 2);
    if (c2.precio_usd && c2.superficie_cubierta) return round(c2.precio_usd / c2.superficie_cubierta, 2);
    return null;
  }
  function renderAppraisals() {
    const list = $("appraisalsAdminList");
    if (!_appraisals.length) {
      list.innerHTML = '<div class="loading-state">No hay tasaciones.</div>';
      return;
    }
    list.innerHTML = _appraisals.map((a) => {
      const cls = ESTADO_CLS[a.estado] || "status-oculta";
      return `<div class="admin-message-item" data-id="${a.id}" style="cursor:pointer;${a.estado === "archivada" ? "opacity:0.6" : ""}">
      <div  class="ap-flex-row-between">
        <div  class="ap-flex-1-min">
          <div  class="ap-flex-row-center-sm">
            <strong  class="ap-btn-text-light">${esc(a.titulo || a.solicitante || "(sin t\xEDtulo)")}</strong>
            <span class="admin-status-badge ${cls} ap-badge-sm">${ESTADO_MAP[a.estado] || a.estado}</span>
          </div>
          <div  class="ap-label-small">
            ${a.solicitante ? `${esc(a.solicitante)} \xB7 ` : ""}
            ${a.tipo_propiedad ? esc(a.tipo_propiedad) + " \xB7 " : ""}
            ${a.barrio ? esc(a.barrio) + " \xB7 " : ""}
            ${a.superficie_cubierta ? a.superficie_cubierta + " m\xB2" : ""}
          </div>
          <div  class="ap-label-dim">
            ${a.dormitorios ? a.dormitorios + " dorm" : ""}${a.banios ? " \xB7 " + a.banios + " ba\xF1os" : ""}
          </div>
          ${a.valor_estimado_usd ? `<div  class="ap-link-accent">${_fmtUSD(a.valor_estimado_usd)}</div>` : ""}
        </div>
        <div  class="ap-flex-shrink-right">
          <div  class="ap-value-small">${a.updated_at ? window.formatDateShort(a.updated_at) : ""}</div>
          <div  class="ap-hint-text">${a.total_comparables || 0} comp.</div>
        </div>
      </div>
    </div>`;
    }).join("");
    list.insertAdjacentHTML("afterend", _renderPagination());
  }
  function _renderPagination() {
    if (_appraisalPages <= 1) return "";
    const prevDisabled = _appraisalPage <= 1;
    const nextDisabled = _appraisalPage >= _appraisalPages;
    return `<div class="admin-pagination ap-flex-row-divider">
    <button class="btn btn-ghost" onclick="changeAppraisalPage(${_appraisalPage - 1})" ${prevDisabled ? "disabled" : ""}>\u2190 Anterior</button>
    <span  class="ap-body-text">P\xE1g. ${_appraisalPage} de ${_appraisalPages} (${_appraisalTotal} total)</span>
    <button class="btn btn-ghost" onclick="changeAppraisalPage(${_appraisalPage + 1})" ${nextDisabled ? "disabled" : ""}>Siguiente \u2192</button>
  </div>`;
  }
  async function changeAppraisalPage(page) {
    if (page < 1 || page > _appraisalPages) return;
    _appraisalPage = page;
    await loadAppraisals();
  }
  document.addEventListener("click", (e) => {
    const item = e.target.closest("#appraisalsAdminList .admin-message-item[data-id]");
    if (item) openAppraisalPanel(parseInt(item.dataset.id));
  });
  function filterAppraisals() {
    _appraisalPage = 1;
    loadAppraisals();
  }
  async function loadAppraisals() {
    var _a, _b, _c, _d;
    const list = $("appraisalsAdminList");
    if (!list) return;
    list.innerHTML = '<div class="loading-state">Cargando tasaciones...</div>';
    try {
      const incluirArchivadas = ((_a = $("appraisalShowArchived")) == null ? void 0 : _a.checked) || false;
      const estadoFiltro = ((_b = $("appraisalFilter")) == null ? void 0 : _b.value) || "";
      const searchText = ((_d = (_c = $("appraisalSearch")) == null ? void 0 : _c.value) == null ? void 0 : _d.trim()) || "";
      const params = { page: _appraisalPage, per_page: 20 };
      if (incluirArchivadas) params.archivadas = "1";
      if (estadoFiltro) params.estado = estadoFiltro;
      if (searchText) params.search = searchText;
      const result = await API.getAppraisals(params);
      if (Array.isArray(result)) {
        _appraisals = result;
        _appraisalPages = 1;
        _appraisalTotal = result.length;
      } else {
        _appraisals = result.data || [];
        _appraisalPage = result.page || 1;
        _appraisalPages = result.pages || 1;
        _appraisalTotal = result.total || _appraisals.length;
      }
      renderAppraisals();
      const stats = await API.getAppraisalStats();
      renderKpiBar(stats, $("apprKpiBar"));
      const sub = $("appraisalSubtitle");
      if (sub) {
        sub.textContent = `${stats.total} total \xB7 ${stats.borradores} borradores \xB7 ${stats.en_proceso} en proceso \xB7 ${stats.completadas} completadas \xB7 ${stats.archivadas} archivadas`;
      }
      $("sidebarAppraisalCount").textContent = stats.total;
    } catch (e) {
      list.innerHTML = '<div class="loading-state">Sin permisos para ver tasaciones.</div>';
    }
  }
  function showAppraisalsList() {
    var _a;
    (_a = $("apprOverlay")) == null ? void 0 : _a.classList.add("show");
    $("appraisalsListView").classList.remove("hidden");
    $("appraisalDetailView").classList.add("hidden");
    _currentAppraisal = null;
    loadAppraisals();
  }
  async function openAppraisalDetail(id) {
    var _a;
    try {
      const a = await API.getAppraisal(id);
      _currentAppraisal = a;
      (_a = $("apprOverlay")) == null ? void 0 : _a.classList.remove("show");
      $("appraisalsListView").classList.add("hidden");
      const dv = $("appraisalDetailView");
      dv.classList.remove("hidden");
      dv.innerHTML = renderDetail(a);
      dv.scrollTop = 0;
    } catch (e) {
      toast("Error al cargar tasaci\xF3n: " + e.message, "error");
    }
  }
  function renderDetail(a) {
    const isReadOnly = a.estado === "completada" || a.estado === "archivada";
    const hasComps = (a.comparables || []).length > 1 && a.superficie_cubierta > 0;
    const isCompleted = a.estado === "completada";
    const canDelete = (_currentUser == null ? void 0 : _currentUser.role) === "admin" || (_currentUser == null ? void 0 : _currentUser.role) === "editor";
    function roIcon() {
      return '<div class="acm-readonly-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>';
    }
    return `
    ${isReadOnly ? `
    <div class="acm-readonly-banner">
      ${roIcon()}
      <div  class="ap-flex-1">
        <strong  class="ap-error-emphasis">Modo lectura</strong>
        <p  class="ap-label-inline">Esta tasaci\xF3n est\xE1 ${a.estado === "completada" ? "completada" : "archivada"}. Los datos son inmutables.</p>
      </div>
      ${isCompleted ? `<button class="btn btn-primary ap-btn-compact" id="newVersionBtn"  >+ Nueva versi\xF3n</button>` : ""}
    </div>` : ""}
    <div class="admin-topbar">
      <div>
        <button class="btn btn-ghost ap-stack-sm" id="backToAppraisalsList"  >\u2190 Volver</button>
        <h1 class="admin-page-title">${esc(a.titulo || a.solicitante || "Tasaci\xF3n #" + a.id)}</h1>
        <p class="admin-page-sub">${ESTADO_MAP[a.estado] || a.estado} \xB7 ${a.total_comparables || 0} comparables</p>
        ${a.appraisal_request_id ? `<p  class="ap-link-underlined">
              Creada desde <a href="#" onclick="switchTab('tasacion-requests'); return false;"  class="ap-link-hover">solicitud #${a.appraisal_request_id}</a>
            </p>` : ""}
      </div>
      <div  class="ap-flex-wrap-sm">
        ${isReadOnly ? `<button class="btn btn-ghost" id="restoreBtn" style="${a.estado === "archivada" ? "" : "display:none"}">Restaurar</button>
              <button class="btn btn-ghost" id="reportBtn">PDF</button>
              <button class="btn btn-ghost" id="exportCsvBtn">CSV</button>` : `<button class="btn btn-primary" id="saveBtn">Guardar</button>
              ${hasComps && !isCompleted ? `<button class="btn btn-primary ap-surface-accent" id="completarBtn"  >Guardar Valuaci\xF3n</button>` : ""}
              <button class="btn btn-ghost" id="reportBtn">PDF</button>
              <button class="btn btn-ghost" id="exportCsvBtn">CSV</button>
              <button class="btn btn-danger" id="archiveBtn">Archivar</button>`}
        ${canDelete ? `<button class="btn btn-danger ap-delete-btn-bg" id="deleteAppraisalBtn"  >Eliminar</button>` : ""}
      </div>
    </div>

    ${renderResults(a)}

    <div class="acm-pyramid">
      ${renderSection("Datos del cliente", [
      { label: "T\xEDtulo", id: "ad_titulo", type: "text", val: a.titulo },
      { label: "Solicitante", id: "ad_solicitante", type: "text", val: a.solicitante },
      { label: "Tel\xE9fono", id: "ad_telefono", type: "text", val: a.telefono },
      { label: "Fecha", id: "ad_fecha_tasacion", type: "date", val: a.fecha_tasacion },
      { label: "Destino", id: "ad_destino", type: "select", val: a.destino, opts: DESTINOS },
      { label: "Estado", id: "ad_estado", type: "select", val: a.estado, opts: [["borrador", "Borrador"], ["en_proceso", "En proceso"], ["completada", "Completada"]] }
    ], isReadOnly)}
      ${renderSection("Datos del inmueble", [
      { label: "Tipo", id: "ad_tipo_propiedad", type: "select", val: a.tipo_propiedad, opts: TIPO_PROPS },
      { label: "Direcci\xF3n", id: "ad_direccion", type: "text", val: a.direccion },
      { label: "Barrio", id: "ad_barrio", type: "text", val: a.barrio },
      { label: "Localidad", id: "ad_localidad", type: "text", val: a.localidad },
      { label: "Provincia", id: "ad_provincia", type: "text", val: a.provincia },
      { label: "A\xF1o constr.", id: "ad_anio_construccion", type: "number", val: a.anio_construccion },
      { label: "Sup. terreno m\xB2", id: "ad_superficie_terreno", type: "number", val: a.superficie_terreno },
      { label: "Sup. cubierta m\xB2", id: "ad_superficie_cubierta", type: "number", val: a.superficie_cubierta },
      { label: "Dormitorios", id: "ad_dormitorios", type: "number", val: a.dormitorios },
      { label: "Ba\xF1os", id: "ad_banios", type: "number", val: a.banios }
    ], isReadOnly)}
      ${renderSection("Construcci\xF3n", [
      { label: "Tipo construcci\xF3n", id: "ad_tipo_construccion", type: "text", val: a.tipo_construccion },
      { label: "Tipo techo", id: "ad_tipo_techo", type: "text", val: a.tipo_techo },
      { label: "Orientaci\xF3n", id: "ad_orientacion", type: "text", val: a.orientacion },
      { label: "Luminosidad", id: "ad_luminosidad", type: "select", val: a.luminosidad, opts: [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
      { label: "Cal. constructiva", id: "ad_calidad_constructiva", type: "select", val: a.calidad_constructiva, opts: [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
      { label: "Cal. mantenimiento", id: "ad_calidad_mantenimiento", type: "select", val: a.calidad_mantenimiento, opts: [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
      { label: "Terminaci\xF3n", id: "ad_detalles_terminacion", type: "select", val: a.detalles_terminacion, opts: [["alto", "Alto"], ["medio", "Medio"], ["bajo", "Bajo"]] },
      { label: "Estado conservaci\xF3n", id: "ad_estado_conservacion", type: "select", val: a.estado_conservacion, opts: [["excelente", "Excelente"], ["bueno", "Bueno"], ["regular", "Regular"], ["malo", "Malo"]] },
      { label: "Estacionamiento", id: "ad_estacionamiento", type: "text", val: a.estacionamiento },
      { label: "Calefacci\xF3n", id: "ad_calefaccion", type: "select", val: a.calefaccion, opts: [["central", "Central"], ["individual", "Individual"], ["", "Sin"]] },
      { label: "Agua caliente", id: "ad_agua_caliente", type: "select", val: a.agua_caliente, opts: [["central", "Central"], ["individual", "Individual"], ["", "Sin"]] },
      { label: "Aire acond.", id: "ad_aire_acondicionado", type: "select", val: a.aire_acondicionado, opts: [["central", "Central"], ["individual", "Individual"], ["", "Sin"]] },
      { label: "Vida remanente", id: "ad_vida_remanente", type: "number", val: a.vida_remanente }
    ], isReadOnly)}
      ${renderSection("Referencias econ\xF3micas", [
      { label: "T/C USD", id: "ad_tipo_cambio_usd", type: "number", val: a.tipo_cambio_usd },
      { label: "Valor UVA", id: "ad_valor_uva", type: "number", val: a.valor_uva },
      { label: "Imp. inmob. mensual", id: "ad_impuesto_inmobiliario_mensual", type: "number", val: a.impuesto_inmobiliario_mensual }
    ], isReadOnly)}
      ${renderSection("Comodidades", [
      { label: "Cocina", id: "ad_tiene_cocina", type: "checkbox", val: a.tiene_cocina },
      { label: "Comedor", id: "ad_tiene_comedor", type: "checkbox", val: a.tiene_comedor },
      { label: "Living", id: "ad_tiene_living", type: "checkbox", val: a.tiene_living },
      { label: "Patio", id: "ad_tiene_patio", type: "checkbox", val: a.tiene_patio },
      { label: "Terraza", id: "ad_tiene_terraza", type: "checkbox", val: a.tiene_terraza },
      { label: "Balc\xF3n", id: "ad_tiene_balcon", type: "checkbox", val: a.tiene_balcon },
      { label: "Lavadero", id: "ad_tiene_lavadero", type: "checkbox", val: a.tiene_lavadero },
      { label: "Escritorio", id: "ad_tiene_escritorio", type: "checkbox", val: a.tiene_escritorio },
      { label: "Suite", id: "ad_tiene_suite", type: "checkbox", val: a.tiene_suite },
      { label: "Play room", id: "ad_tiene_playroom", type: "checkbox", val: a.tiene_playroom },
      { label: "Asador", id: "ad_tiene_asador", type: "checkbox", val: a.tiene_asador },
      { label: "Piscina", id: "ad_tiene_piscina", type: "checkbox", val: a.tiene_piscina },
      { label: "Garage", id: "ad_tiene_garage", type: "checkbox", val: a.tiene_garage }
    ], isReadOnly)}
      ${renderSection("Servicios", [
      { label: "Electricidad p\xFAblica", id: "ad_tiene_electricidad_publica", type: "checkbox", val: a.tiene_electricidad_publica },
      { label: "Gas p\xFAblico", id: "ad_tiene_gas_publico", type: "checkbox", val: a.tiene_gas_publico },
      { label: "Tel\xE9fono p\xFAblico", id: "ad_tiene_telefono_publico", type: "checkbox", val: a.tiene_telefono_publico },
      { label: "Agua p\xFAblica", id: "ad_tiene_agua_publica", type: "checkbox", val: a.tiene_agua_publica },
      { label: "Cloaca p\xFAblica", id: "ad_tiene_cloaca_publica", type: "checkbox", val: a.tiene_cloaca_publica },
      { label: "Desag\xFCe pluvial", id: "ad_tiene_desague_pluvial", type: "checkbox", val: a.tiene_desague_pluvial }
    ], isReadOnly)}
      ${renderSection("Descripci\xF3n del barrio", [
      { label: "Tipo barrio", id: "ad_tipo_barrio", type: "select", val: a.tipo_barrio, opts: [["urbano", "Urbano"], ["suburbano", "Suburbano"], ["rural", "Rural"]] },
      { label: "Nivel construcci\xF3n", id: "ad_nivel_construccion", type: "select", val: a.nivel_construccion, opts: [["mas_75", "M\xE1s del 75%"], ["50_75", "50-75%"], ["25_50", "25-50%"], ["menos_25", "Menos del 25%"]] },
      { label: "\xCDndice crecimiento", id: "ad_indice_crecimiento", type: "select", val: a.indice_crecimiento, opts: [["en_crecimiento", "En crecimiento"], ["estable", "Estable"], ["en_declinacion", "En declinaci\xF3n"]] },
      { label: "Vigilancia", id: "ad_vigilancia_barrio", type: "checkbox", val: a.vigilancia_barrio },
      { label: "Valores propiedad", id: "ad_valores_propiedad", type: "select", val: a.valores_propiedad, opts: [["creciente", "Creciente"], ["estable", "Estable"], ["decreciente", "Decreciente"]] },
      { label: "Demanda / Oferta", id: "ad_demanda_oferta", type: "select", val: a.demanda_oferta, opts: [["exceso_demanda", "Exceso Demanda"], ["equilibrio", "Equilibrio"], ["exceso_oferta", "Exceso Oferta"]] },
      { label: "Tiempo comercializaci\xF3n", id: "ad_tiempo_comercializacion", type: "select", val: a.tiempo_comercializacion, opts: [["menos_3", "Menos 3 meses"], ["3_6", "3 a 6 meses"], ["mas_6", "M\xE1s de 6 meses"]] },
      { label: "% Residencial", id: "ad_uso_residencial_pct", type: "number", val: a.uso_residencial_pct },
      { label: "% Comercial", id: "ad_uso_comercial_pct", type: "number", val: a.uso_comercial_pct },
      { label: "% Industrial", id: "ad_uso_industrial_pct", type: "number", val: a.uso_industrial_pct },
      { label: "Cambios uso terreno", id: "ad_cambios_uso_terreno", type: "select", val: a.cambios_uso_terreno, opts: [["probable", "Probable"], ["improbable", "Improbable"]] },
      { label: "Facilidades estacionamiento", id: "ad_facilidades_estacionamiento", type: "text", val: a.facilidades_estacionamiento },
      { label: "Tipolog\xEDas predominantes", id: "ad_tipologias_predominantes", type: "text", val: a.tipologias_predominantes },
      { label: "Calidad constructiva barrio", id: "ad_calidad_constructiva_barrio", type: "select", val: a.calidad_constructiva_barrio, opts: [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
      { label: "Construcci\xF3n altura", id: "ad_construccion_altura", type: "text", val: a.construccion_altura },
      { label: "Uso comercial desc.", id: "ad_uso_comercial_descripcion", type: "text", val: a.uso_comercial_descripcion },
      { label: "Uso industrial desc.", id: "ad_uso_industrial_descripcion", type: "text", val: a.uso_industrial_descripcion },
      { label: "Nivel socioecon\xF3mico", id: "ad_nivel_socioeconomico", type: "select", val: a.nivel_socioeconomico, opts: [["alto", "Alto"], ["medio_alto", "Medio Alto"], ["medio", "Medio"], ["medio_bajo", "Medio Bajo"], ["bajo", "Bajo"]] }
    ], isReadOnly)}
      ${renderSection("Observaciones", [
      { label: "", id: "ad_observaciones", type: "textarea", val: a.observaciones }
    ], isReadOnly)}
    </div>

    <!-- COMPARABLES -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="sec-comparables"  >
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('sec-comparables')">
        <h4 class="acm-pyramid-section-title">Comparables (${(a.comparables || []).length})</h4>
        <span class="acm-pyramid-section-toggle">\u25BC</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div  class="ap-actions-bar-right">
          ${isReadOnly ? "" : `<button class="btn btn-primary" id="addComparableBtn">+ Agregar comparable</button>`}
        </div>
        <div id="acmComparables">${renderComparableCards(a)}</div>
      </div>
    </div>

    <!-- MAPA -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="sec-ubicacion"  >
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('sec-ubicacion')">
        <h4 class="acm-pyramid-section-title">Ubicaci\xF3n</h4>
        <span class="acm-pyramid-section-toggle">\u25BC</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div id="acmMapContainer"  class="ap-map-container">
          <div  class="ap-empty-state">Cargando mapa...</div>
        </div>
      </div>
    </div>

    <!-- VERSIONES -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="sec-versiones"  >
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('sec-versiones')">
        <h4 class="acm-pyramid-section-title">Versiones</h4>
        <span class="acm-pyramid-section-toggle">\u25BC</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div id="appraisalVersionsContainer"  class="ap-stack-xl"><div class="loading-state ap-text-base">Cargando...</div></div>
      </div>
    </div>

    <!-- HISTORIAL -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="sec-historial"  >
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('sec-historial')">
        <h4 class="acm-pyramid-section-title">Historial de cambios</h4>
        <span class="acm-pyramid-section-toggle">\u25BC</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div id="appraisalLogsContainer"  class="ap-stack-xl"><div class="loading-state ap-text-base">Cargando...</div></div>
      </div>
    </div>
  `;
  }
  var _acmMapInstance = null;
  var _acmMapMarkers = [];
  function _acmIcon(color, size) {
    return {
      html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      className: ""
    };
  }
  function _acmPopupContent(c2) {
    return `<div  class="ap-text-block">
    <div  class="ap-warning-label">C${c2.numero}</div>
    <div  class="ap-text-dark">${esc(c2.direccion || "Sin direcci\xF3n")}</div>
    <hr  class="ap-divider-light">
    <table  class="ap-input-full">
      <tr><td  class="ap-text-medium">Precio</td><td  class="ap-label-right">USD ${c2.precio_usd ? c2.precio_usd.toLocaleString("es-AR") : "-"}</td></tr>
      ${c2.sup_cubierta ? `<tr><td  class="ap-text-medium">Sup. cubierta</td><td  class="ap-text-right">${c2.sup_cubierta} m\xB2</td></tr>` : ""}
      ${c2.precio_por_m2 ? `<tr><td  class="ap-text-medium">Precio/m\xB2</td><td  class="ap-text-right">USD ${Number(c2.precio_por_m2).toLocaleString("es-AR")}</td></tr>` : ""}
      ${c2.coeficiente_ajuste ? `<tr><td  class="ap-text-medium">Coef. ajuste</td><td  class="ap-text-right">${c2.coeficiente_ajuste}</td></tr>` : ""}
      ${c2.valor_m2_ajustado ? `<tr><td  class="ap-text-medium">Valor/m\xB2 ajust.</td><td  class="ap-brand-right">USD ${Number(c2.valor_m2_ajustado).toLocaleString("es-AR")}</td></tr>` : ""}
      ${c2.valor_ajustado ? `<tr><td  class="ap-text-medium">Valor ajustado</td><td  class="ap-brand-right">USD ${Number(c2.valor_ajustado).toLocaleString("es-AR")}</td></tr>` : ""}
    </table>
  </div>`;
  }
  function _acmSubjectPopup(a) {
    return `<div  class="ap-text-block">
    <div  class="ap-brand-label">${esc(a.titulo || "Inmueble tasado")}</div>
    <div  class="ap-text-dark">${esc(a.direccion || "")}</div>
    <hr  class="ap-divider-light">
    <table  class="ap-input-full">
      ${a.superficie_cubierta ? `<tr><td  class="ap-text-medium">Sup. cubierta</td><td  class="ap-text-right">${a.superficie_cubierta} m\xB2</td></tr>` : ""}
      ${a.tipo_propiedad ? `<tr><td  class="ap-text-medium">Tipo</td><td  class="ap-text-right">${a.tipo_propiedad}</td></tr>` : ""}
      ${a.valor_estimado_usd ? `<tr><td  class="ap-text-medium">Valor estimado</td><td  class="ap-brand-right">USD ${a.valor_estimado_usd.toLocaleString("es-AR")}</td></tr>` : ""}
      ${a.precio_m2_promedio ? `<tr><td  class="ap-text-medium">Precio/m\xB2 prom.</td><td  class="ap-text-right">USD ${Number(a.precio_m2_promedio).toLocaleString("es-AR")}</td></tr>` : ""}
    </table>
  </div>`;
  }
  async function _acmInitMap(ctr) {
    const L = await loadLeaflet();
    const mapEl = document.createElement("div");
    mapEl.style.cssText = "width:100%;height:350px;border-radius:6px";
    ctr.innerHTML = "";
    ctr.appendChild(mapEl);
    await new Promise((r) => setTimeout(r, 0));
    const map = L.map(mapEl, { center: [-31.4201, -64.1888], zoom: 12, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18
    }).addTo(map);
    return map;
  }
  function _acmRenderMap(data) {
    const L = window.L;
    if (!L) return;
    const markers = [];
    const bounds = [];
    if (data.appraisal.lat && data.appraisal.lng) {
      const icon = L.divIcon(_acmIcon("#20b8ab", 22));
      const m = L.marker([data.appraisal.lat, data.appraisal.lng], { icon }).addTo(_acmMapInstance).bindPopup(_acmSubjectPopup(data.appraisal));
      markers.push(m);
      bounds.push([data.appraisal.lat, data.appraisal.lng]);
    }
    (data.comparables || []).forEach((c2) => {
      if (!c2.lat || !c2.lng) return;
      const icon = L.divIcon(_acmIcon("#e67e22", 16));
      const m = L.marker([c2.lat, c2.lng], { icon }).addTo(_acmMapInstance).bindPopup(_acmPopupContent(c2));
      markers.push(m);
      bounds.push([c2.lat, c2.lng]);
    });
    _acmMapMarkers = markers;
    if (bounds.length > 1) {
      _acmMapInstance.fitBounds(bounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
      _acmMapInstance.setView(bounds[0], 14);
    } else {
      _acmMapInstance.setView([-31.4201, -64.1888], 12);
    }
  }
  async function loadAppraisalMap(aid) {
    const ctr = $("acmMapContainer");
    if (!ctr) return;
    try {
      const data = await _req("GET", `/api/appraisals/${aid}/map-data`);
      const hasCoords = data.appraisal.lat && data.appraisal.lng || (data.comparables || []).some((c2) => c2.lat && c2.lng);
      if (!hasCoords) {
        ctr.innerHTML = '<div  class="ap-empty-state-lg">No hay ubicaciones disponibles para visualizar.<br><span  class="ap-text-sm">Complet\xE1 las direcciones de la tasaci\xF3n y los comparables.</span></div>';
        _acmMapInstance = null;
        return;
      }
      if (_acmMapInstance) {
        _acmMapMarkers.forEach((m) => _acmMapInstance.removeLayer(m));
        _acmMapInstance.remove();
        _acmMapInstance = null;
      }
      _acmMapInstance = await _acmInitMap(ctr);
      _acmRenderMap(data);
    } catch (e) {
      ctr.innerHTML = '<div  class="ap-empty-state-lg">Error al cargar mapa: ' + esc(e.message || "") + "</div>";
      _acmMapInstance = null;
    }
  }
  async function refreshAppraisalMap(aid) {
    if (!_acmMapInstance) {
      loadAppraisalMap(aid);
      return;
    }
    try {
      const data = await _req("GET", `/api/appraisals/${aid}/map-data`);
      _acmMapMarkers.forEach((m) => _acmMapInstance.removeLayer(m));
      _acmRenderMap(data);
    } catch (e) {
    }
  }
  function loadLeaflet() {
    return new Promise((resolve, reject) => {
      if (window.L) return resolve(window.L);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error("Leaflet load failed"));
      document.head.appendChild(script);
    });
  }
  function togglePyramidSection(id) {
    const sec = document.querySelector(`[data-section="${id}"]`);
    if (sec) sec.classList.toggle("collapsed");
  }
  function renderSection(title, fields, disabled) {
    const id = "sec-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const isCheckbox = fields.length > 0 && fields.every((f) => f.type === "checkbox");
    if (isCheckbox) {
      const checkedCount = fields.filter((f) => f.val).length;
      const countLabel = checkedCount > 0 ? ` <span  class="ap-metric-number">(${checkedCount})</span>` : "";
      const rows2 = fields.map((f) => {
        const chk = f.val ? "checked" : "";
        const dis = disabled ? "disabled" : "";
        const cls = `acm-chip${disabled ? " acm-chip--disabled" : ""}`;
        return `<label class="${cls}">
        <input type="checkbox" class="acm-chip-input" id="${f.id}" ${chk} ${dis}>
        <span class="acm-chip-visual">
          <span class="acm-chip-box">
            <svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span class="acm-chip-text">${f.label}</span>
        </span>
      </label>`;
      }).join("");
      return `<div class="acm-pyramid-section" data-section="${id}">
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('${id}')">
        <h4 class="acm-pyramid-section-title">${title}${countLabel}</h4>
        <span class="acm-pyramid-section-toggle">\u25BC</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div class="acm-pyramid-checkbox-grid">${rows2}</div>
      </div>
    </div>`;
    }
    const rows = fields.map((f) => {
      if (f.type === "textarea") {
        return `<div class="field acm-pyramid-full"><label class="field-label">${f.label}</label>
        <textarea id="${f.id}" class="field-input" rows="3" ${disabled ? "disabled" : ""}>${esc(f.val || "")}</textarea></div>`;
      }
      if (f.type === "checkbox") {
        const chk = f.val ? "checked" : "";
        const dis = disabled ? "disabled" : "";
        const cls = `acm-chip${disabled ? " acm-chip--disabled" : ""}`;
        return `<label class="${cls} ap-stack-md">
        <input type="checkbox" class="acm-chip-input" id="${f.id}" ${chk} ${dis}>
        <span class="acm-chip-visual">
          <span class="acm-chip-box">
            <svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span class="acm-chip-text">${f.label}</span>
        </span>
      </label>`;
      }
      if (f.type === "select") {
        return `<div class="field"><label class="field-label">${f.label}</label>
        <select id="${f.id}" class="field-input field-input--select" ${disabled ? "disabled" : ""}>${_sel("", f.val, f.opts)}</select></div>`;
      }
      return `<div class="field"><label class="field-label">${f.label}</label>
      <input id="${f.id}" class="field-input" type="${f.type}" value="${_tf(f.val)}" ${disabled ? "disabled" : ""} ${f.type === "number" ? 'step="any"' : ""}/></div>`;
    }).join("");
    return `<div class="acm-pyramid-section" data-section="${id}">
    <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('${id}')">
      <h4 class="acm-pyramid-section-title">${title}</h4>
      <span class="acm-pyramid-section-toggle">\u25BC</span>
    </button>
    <div class="acm-pyramid-section-body">
      <div class="acm-pyramid-grid">${rows}</div>
    </div>
  </div>`;
  }
  function renderBarChart(comps) {
    const ajustados = [];
    const labels = [];
    comps.forEach((c2) => {
      const ajustado = _ajustado(c2);
      if (ajustado !== null) {
        ajustados.push(ajustado);
        labels.push("C" + c2.numero);
      }
    });
    if (!ajustados.length) return "";
    const maxVal = Math.max(...ajustados);
    const prom = ajustados.reduce((a, b) => a + b, 0) / ajustados.length;
    return `<div  class="ap-detail-card">
    <div  class="ap-overline">$/m\xB2 ajustado por comparable</div>
    ${ajustados.map(
      (v, i) => `<div  class="ap-flex-row-tag">
        <span  class="ap-icon-col">${labels[i]}</span>
        <div  class="ap-progress-track">
          <div style="height:100%;width:${(v / maxVal * 100).toFixed(0)}%;background:${v === prom ? "var(--admin-primary)" : v > prom ? "rgba(32,184,171,0.6)" : "rgba(32,184,171,0.3)"};border-radius:3px"></div>
        </div>
        <span  class="ap-number-col">${_fmtUSD(v)}</span>
      </div>`
    ).join("")}
  </div>`;
  }
  function renderResults(a) {
    const hasVal = a.valor_estimado_usd != null;
    const comps = a.comparables || [];
    return `<div id="acmResults"  class="ap-hero-card">
    <h4  class="ap-section-label">Resultados de la valuaci\xF3n</h4>
    ${hasVal ? `
    <div  class="ap-two-col-grid">
      <div  class="ap-auto-grid">
        <div><div  class="ap-label-muted">Valor Estimado</div>
          <div  class="ap-value-xl">${_fmtUSD(a.valor_estimado_usd)}</div></div>
        <div><div  class="ap-label-muted">En Pesos</div>
          <div  class="ap-value-lg">${_fmtARS(a.valor_estimado_ars)}</div></div>
        <div><div  class="ap-label-muted">En UVAs</div>
          <div  class="ap-value-lg">${_fmtUVA(a.valor_estimado_uvas)}</div></div>
        <div><div  class="ap-label-muted">Precio/m\xB2 prom.</div>
          <div  class="ap-value-lg">${_fmtUSD(a.precio_m2_promedio)}</div></div>
        <div><div  class="ap-label-muted">Rango m\xB2</div>
          <div  class="ap-value-md">${_fmtUSD(a.precio_m2_minimo)} \u2013 ${_fmtUSD(a.precio_m2_maximo)}</div></div>
        <div><div  class="ap-label-muted">Dispersi\xF3n</div>
          <div  class="ap-value-lg">${a.dispersion_pct != null ? a.dispersion_pct + "%" : "\u2014"}</div></div>
        <div><div  class="ap-label-muted">Coef. promedio</div>
          <div  class="ap-value-lg">${a.coeficiente_promedio || "\u2014"}</div></div>
        <div><div  class="ap-label-muted">Comparables</div>
          <div  class="ap-value-lg">${a.total_comparables || 0}</div></div>
      </div>
      ${renderBarChart(comps)}
    </div>` : `
    <div  class="ap-empty-row">
      Carg\xE1 comparables y superficie cubierta para ver la valuaci\xF3n.
    </div>`}
  </div>`;
  }
  function renderComparableCards(a) {
    return renderComparableCardsShared(a, { prefix: "", getTipoFn: () => a.tipo_propiedad || "casa" });
  }
  document.addEventListener("click", (e) => {
    const aprTab = $("tabAppraisals");
    if (!aprTab || aprTab.classList.contains("hidden")) return;
    const editBtn = e.target.closest(".editComparableBtn");
    if (editBtn) openComparableForm(parseInt(editBtn.dataset.aid), parseInt(editBtn.dataset.cid));
    const delBtn = e.target.closest(".deleteComparableBtn");
    if (delBtn) confirmDeleteComparable(parseInt(delBtn.dataset.aid), parseInt(delBtn.dataset.cid));
    const toggleBtn = e.target.closest(".toggleExclusionBtn");
    if (toggleBtn) toggleComparableExclusion(parseInt(toggleBtn.dataset.aid), parseInt(toggleBtn.dataset.cid));
  });
  function _recalcLive() {
    var _a, _b, _c;
    const a = _currentAppraisal;
    if (!a) return;
    const cont = $("acmResults");
    if (!cont) return;
    const sc = parseFloat((_a = $("ad_superficie_cubierta")) == null ? void 0 : _a.value) || 0;
    const tc = parseFloat((_b = $("ad_tipo_cambio_usd")) == null ? void 0 : _b.value) || 1;
    const uva = parseFloat((_c = $("ad_valor_uva")) == null ? void 0 : _c.value) || 1;
    const comps = a.comparables || [];
    if (!comps.length || !sc) {
      cont.innerHTML = '<h4  class="ap-section-overline">Resultados de la valuaci\xF3n</h4><div  class="ap-empty-row-light">Carg\xE1 comparables y superficie cubierta para ver la valuaci\xF3n.</div>';
      return;
    }
    const ajustados = [];
    const coefs = [];
    const labels = [];
    comps.forEach((c2) => {
      const coef = _calcCoef(c2);
      const ajustado = _ajustado(c2);
      if (ajustado !== null) {
        ajustados.push(ajustado);
        coefs.push(coef);
        labels.push("C" + c2.numero);
      }
    });
    if (!ajustados.length) {
      cont.innerHTML = '<h4  class="ap-section-overline">Resultados de la valuaci\xF3n</h4><div  class="ap-empty-row-light">Complet\xE1 precio y superficie en los comparables.</div>';
      return;
    }
    const prom = ajustados.reduce((a2, b) => a2 + b, 0) / ajustados.length;
    const mini = Math.min(...ajustados);
    const maxi = Math.max(...ajustados);
    const dispersion = ajustados.length > 1 && prom ? Math.round(stDev(ajustados) / prom * 1e3) / 10 : 0;
    const coef_prom = Math.round(coefs.reduce((a2, b) => a2 + b, 0) / coefs.length * 1e4) / 1e4;
    const valor_usd = Math.round(sc * prom * 100) / 100;
    const valor_ars = Math.round(valor_usd * tc * 100) / 100;
    const valor_uvas = Math.round(valor_ars / uva * 100) / 100;
    const maxVal = Math.max(...ajustados);
    const barChart = ajustados.map(
      (v, i) => `<div  class="ap-flex-row-tag">
      <span  class="ap-icon-col-muted">${labels[i]}</span>
      <div  class="ap-progress-fill">
        <div style="height:100%;width:${(v / maxVal * 100).toFixed(0)}%;background:${v === prom ? "var(--accent)" : v > prom ? "rgba(32,184,171,0.6)" : "rgba(32,184,171,0.3)"};border-radius:3px;transition:width .3s"></div>
      </div>
      <span  class="ap-number-col-muted">${_fmtUSD(v)}</span>
    </div>`
    ).join("");
    cont.innerHTML = `
    <div  class="ap-flex-row-between-md">
      <h4  class="ap-overline-accent">Resultados de la valuaci\xF3n</h4>
    </div>
    <div  class="ap-two-col-grid">
      <div  class="ap-auto-grid">
        <div><div  class="ap-text-muted-light">Valor Estimado</div>
          <div  class="ap-value-xl-light">${_fmtUSD(valor_usd)}</div></div>
        <div><div  class="ap-text-muted-light">En Pesos</div>
          <div  class="ap-value-lg-light">${_fmtARS(valor_ars)}</div></div>
        <div><div  class="ap-text-muted-light">En UVAs</div>
          <div  class="ap-value-lg-light">${_fmtUVA(valor_uvas)}</div></div>
        <div><div  class="ap-text-muted-light">Precio/m\xB2 prom.</div>
          <div  class="ap-value-lg-light">${_fmtUSD(prom)}</div></div>
        <div><div  class="ap-text-muted-light">Rango m\xB2</div>
          <div  class="ap-value-md-light">${_fmtUSD(mini)} \u2013 ${_fmtUSD(maxi)}</div></div>
        <div><div  class="ap-text-muted-light">Dispersi\xF3n</div>
          <div  class="ap-value-lg-light">${dispersion}%</div></div>
        <div><div  class="ap-text-muted-light">Coef. promedio</div>
          <div  class="ap-value-lg-light">${coef_prom}</div></div>
        <div><div  class="ap-text-muted-light">Comparables</div>
          <div  class="ap-value-lg-light">${comps.length}</div></div>
      </div>
      <div  class="ap-info-card">
        <div  class="ap-overline-card">$/m\xB2 ajustado por comparable</div>
        ${barChart}
      </div>
    </div>`;
  }
  async function saveAppraisalDetail(id) {
    const prefix = "ad_";
    const fields = document.querySelectorAll("#appraisalDetailView [id]");
    const data = {};
    fields.forEach((el) => {
      if (!el.id.startsWith(prefix)) return;
      const key = el.id.slice(prefix.length);
      if (el.type === "checkbox") {
        data[key] = el.checked;
      } else if (el.type === "number") {
        data[key] = el.value !== "" ? parseFloat(el.value) : null;
      } else {
        data[key] = el.value;
      }
    });
    try {
      const saved = await API.updateAppraisal(id, data);
      _currentAppraisal = saved;
      const dv = $("appraisalDetailView");
      dv.innerHTML = renderDetail(saved);
      dv.scrollTop = 0;
      loadAppraisals();
    } catch (e) {
      toast("Error al guardar: " + e.message, "error");
    }
  }
  async function archiveAppraisal(id) {
    if (!await confirmModal("\xBFArchivar esta tasaci\xF3n? Se puede restaurar despu\xE9s.")) return;
    try {
      await API.archiveAppraisal(id);
      showAppraisalsList();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function deleteAppraisal(id) {
    if (!await confirmModal("\xBFEliminar esta tasaci\xF3n DEFINITIVAMENTE? No se puede deshacer.")) return;
    try {
      await API.deleteAppraisal(id);
      showAppraisalsList();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function restoreAppraisal(id) {
    if (!await confirmModal("\xBFRestaurar esta tasaci\xF3n?")) return;
    try {
      const saved = await API.restoreAppraisal(id);
      _currentAppraisal = saved;
      const dv = $("appraisalDetailView");
      dv.innerHTML = renderDetail(saved);
      loadAppraisals();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function openReport(id) {
    window.open(`/api/appraisals/${id}/report`, "_blank");
  }
  function exportCsv(id) {
    window.open(`/api/appraisals/${id}/csv`, "_blank");
  }
  async function loadAppraisalLogs(aid) {
    const container = $("appraisalLogsContainer");
    if (!container) return;
    try {
      const logs = await API.getAppraisalLogs(aid);
      if (!logs.length) {
        container.innerHTML = '<div  class="ap-empty-card-sm">Sin cambios registrados.</div>';
        return;
      }
      container.innerHTML = '<div  class="ap-scroll-area">' + logs.map(
        (l) => `<div  class="ap-table-row">
        <span  class="ap-label-nowrap">${l.created_at ? new Date(l.created_at).toLocaleString() : ""}</span>
        <span class="admin-status-badge status-oculta ap-badge-tiny">${l.accion}</span>
        <span  class="ap-text-secondary">${esc(l.descripcion)}</span>
      </div>`
      ).join("") + "</div>";
    } catch (e) {
      container.innerHTML = '<div  class="ap-label-dim-sm">Error al cargar historial.</div>';
    }
  }
  async function loadAppraisalVersions(aid) {
    const container = $("appraisalVersionsContainer");
    if (!container) return;
    try {
      const versions = await API.getAppraisalVersions(aid);
      if (!versions.length) {
        container.innerHTML = '<div  class="ap-empty-card-sm">Sin versiones guardadas.</div>';
        return;
      }
      container.innerHTML = versions.map(
        (v, i) => `<div  class="ap-flex-row-list-item">
        <span class="admin-status-badge status-vendida ap-badge-compact">v${v.version}</span>
        <span  class="ap-text-fill">${v.created_at ? new Date(v.created_at).toLocaleString() : ""}</span>
        <span  class="ap-label-dim">${v.created_by || "\u2014"}</span>
        <span  class="ap-label-dim">${v.has_snapshot ? "\u2713 Snapshot" : "\u2014"}</span>
        <button class="btn btn-ghost btn-sm viewVersionBtn ap-badge-compact" data-version="${v.version}"  >Ver</button>
        ${i < versions.length - 1 ? `<button class="btn btn-ghost btn-sm diffVersionBtn ap-badge-compact" data-va="${versions[i + 1].version}" data-vb="${v.version}"   title="Comparar con v${versions[i + 1].version}">\u21C4</button>` : ""}
      </div>`
      ).join("");
      container.querySelectorAll(".viewVersionBtn").forEach((btn) => {
        btn.addEventListener("click", () => viewVersion(parseInt(btn.dataset.version)));
      });
      container.querySelectorAll(".diffVersionBtn").forEach((btn) => {
        btn.addEventListener("click", () => compareVersions(parseInt(btn.dataset.va), parseInt(btn.dataset.vb)));
      });
    } catch (e) {
      container.innerHTML = '<div  class="ap-label-dim-sm">Error al cargar versiones.</div>';
    }
  }
  async function createNewAppraisalVersion(aid) {
    if (!confirm("\xBFCrear una nueva versi\xF3n? La tasaci\xF3n se desbloquear\xE1 para edici\xF3n.")) return;
    try {
      await API.createNewVersion(aid);
      toast("Nueva versi\xF3n creada. Tasaci\xF3n desbloqueada.", "success");
      openAppraisalDetail(aid);
    } catch (e) {
      toast("Error al crear versi\xF3n: " + e.message, "error");
    }
  }
  async function viewVersion(version) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const a = _currentAppraisal;
    if (!a) return;
    try {
      const data = await API.getAppraisalVersion(a.id, version);
      const s = data.snapshot;
      if (!s) {
        toast("Snapshot no disponible", "error");
        return;
      }
      const html = `
    <div  class="ap-section-card">
      <div  class="ap-flex-row-between-md">
        <h4  class="ap-btn-text-emphasis">Versi\xF3n v${version} \xB7 ${s.generated_at ? new Date(s.generated_at).toLocaleString() : ""}</h4>
        <button class="btn btn-ghost btn-sm ap-text-sm" id="closeVersionPreview"  >Cerrar</button>
      </div>
      <div  class="ap-two-col-grid-md">
        <div  class="ap-chip-card">
          <div  class="ap-overline-tight">Sujeto</div>
          <div  class="ap-label-soft">${esc(((_a = s.appraisal) == null ? void 0 : _a.direccion) || ((_b = s.appraisal) == null ? void 0 : _b.solicitante) || "\u2014")}</div>
          <div  class="ap-label-soft">Sup. cubierta: ${((_c = s.appraisal) == null ? void 0 : _c.superficie_cubierta) || "\u2014"} m\xB2</div>
          <div  class="ap-label-soft">T/C: USD ${((_d = s.appraisal) == null ? void 0 : _d.tipo_cambio_usd) || "\u2014"} \xB7 UVA: ${((_e = s.appraisal) == null ? void 0 : _e.valor_uva) || "\u2014"}</div>
        </div>
        <div  class="ap-chip-card">
          <div  class="ap-overline-tight">Resultados</div>
          <div  class="ap-link-accent-sm">Valor estimado: USD ${(((_f = s.appraisal) == null ? void 0 : _f.valor_estimado_usd) || 0).toLocaleString("es-AR")}</div>
          <div  class="ap-label-soft">Precio/m\xB2 prom.: USD ${Number(((_g = s.appraisal) == null ? void 0 : _g.precio_m2_promedio) || 0).toLocaleString("es-AR")}</div>
          <div  class="ap-label-soft">Coef. promedio: ${((_h = s.appraisal) == null ? void 0 : _h.coeficiente_promedio) || "\u2014"}</div>
        </div>
      </div>
      <div  class="ap-stack-top-base">
        <div  class="ap-overline-section">Comparables (${(s.comparables || []).length})</div>
        ${(s.comparables || []).map(
        (c2) => `<div  class="ap-tag-row">
            <span  class="ap-btn-text-white">C${c2.numero}</span>
            <span  class="ap-text-secondary">${esc(c2.calle || "")} ${esc(c2.numero_calle || "")}</span>
            <span  class="ap-text-accent">USD ${(c2.precio_usd || 0).toLocaleString("es-AR")}</span>
            <span  class="ap-text-dim">${c2.superficie_cubierta || "\u2014"} m\xB2</span>
            <span  class="ap-text-soft">Coef: ${c2.coeficiente_ajuste || "\u2014"}</span>
            <span  class="ap-text-soft">Ajust: USD ${(c2.valor_m2_ajustado || 0).toLocaleString("es-AR")}/m\xB2</span>
          </div>`
      ).join("")}
      </div>
    </div>`;
      const container = $("appraisalVersionsContainer");
      container.insertAdjacentHTML("beforebegin", html);
      (_i = $("closeVersionPreview")) == null ? void 0 : _i.addEventListener("click", () => {
        const el = container.previousElementSibling;
        if (el && el.id !== "appraisalVersionsContainer") el.remove();
      });
    } catch (e) {
      toast("Error al cargar versi\xF3n: " + e.message, "error");
    }
  }
  async function compareVersions(va, vb) {
    var _a;
    const a = _currentAppraisal;
    if (!a) return;
    try {
      const data = await _req("GET", `/api/appraisals/${a.id}/versions/${va}/compare/${vb}`);
      const changes = data.appraisal_changes || [];
      const compChanges = data.comparable_changes || [];
      if (!changes.length && !compChanges.length) {
        toast("No hay diferencias entre estas versiones.", "info");
        return;
      }
      const fieldLabels = {
        valor_estimado_usd: "Valor estimado USD",
        titulo: "T\xEDtulo",
        direccion: "Direcci\xF3n",
        tipo_propiedad: "Tipo propiedad",
        superficie_cubierta: "Sup. cubierta",
        precio_m2_promedio: "$/m\xB2 prom.",
        coeficiente_promedio: "Coef. promedio",
        dispersion_pct: "Dispersi\xF3n",
        tipo_cambio_usd: "T/C USD",
        valor_uva: "UVA",
        solicitante: "Solicitante",
        destino: "Destino"
      };
      const fmt = (v) => v == null ? "\u2014" : typeof v === "number" && v > 100 ? v.toLocaleString("es-AR") : String(v);
      let html = `<div  class="ap-section-card">
      <div  class="ap-flex-row-between-md">
        <h4  class="ap-btn-text-emphasis">Diff v${va} \u2192 v${vb}</h4>
        <button class="btn btn-ghost btn-sm ap-text-sm" id="closeVersionDiff"  >Cerrar</button>
      </div>`;
      if (changes.length) {
        html += `<div  class="ap-stack-base">
        <div  class="ap-overline-section">Cambios en la tasaci\xF3n</div>
        <table  class="ap-table-full">
          <tr  class="ap-overline-tiny">
            <th  class="ap-table-cell-left">Campo</th>
            <th  class="ap-table-cell-left">v${va}</th>
            <th  class="ap-table-cell-left">v${vb}</th>
          </tr>
          ${changes.map((c2) => `<tr>
            <td  class="ap-table-cell-muted">${fieldLabels[c2.field] || c2.field}</td>
            <td  class="ap-table-cell-dim">${fmt(c2.from)}</td>
            <td  class="ap-table-cell-accent">${fmt(c2.to)}</td>
          </tr>`).join("")}
        </table>
      </div>`;
      }
      if (compChanges.length) {
        html += `<div>
        <div  class="ap-overline-section">Cambios en comparables</div>
        <table  class="ap-table-full">
          <tr  class="ap-overline-tiny">
            <th  class="ap-table-cell-left">Comp.</th>
            <th  class="ap-table-cell-left">Campo</th>
            <th  class="ap-table-cell-left">v${va}</th>
            <th  class="ap-table-cell-left">v${vb}</th>
          </tr>
          ${compChanges.map((c2) => {
          const isAdd = c2.field === "__added__";
          const isDel = c2.field === "__removed__";
          return `<tr style="${isAdd ? "background:rgba(39,174,96,0.08)" : isDel ? "background:rgba(231,76,60,0.08)" : ""}">
              <td  class="ap-table-cell-bold">C${c2.numero}</td>
              <td  class="ap-table-cell-soft">${isAdd ? "\u2795 Agregado" : isDel ? "\u2796 Eliminado" : c2.field}</td>
              <td  class="ap-table-cell-dim">${fmt(c2.from)}</td>
              <td style="padding:4px 8px;border-bottom:1px solid var(--bg2);color:${isAdd ? "var(--accent)" : isDel ? "#e74c3c" : "var(--accent)"}">${fmt(c2.to)}</td>
            </tr>`;
        }).join("")}
        </table>
      </div>`;
      }
      html += "</div>";
      const container = $("appraisalVersionsContainer");
      container.insertAdjacentHTML("beforebegin", html);
      (_a = $("closeVersionDiff")) == null ? void 0 : _a.addEventListener("click", () => {
        const el = container.previousElementSibling;
        if (el && el.id !== "appraisalVersionsContainer") el.remove();
      });
    } catch (e) {
      toast("Error al comparar versiones: " + e.message, "error");
    }
  }
  function openAppraisalForm(id) {
    $("appraisalFormTitle").textContent = "Nueva tasaci\xF3n";
    $("appraisalFormContent").innerHTML = `
    <div class="pf-body ap-flex-col">
      <div  class="ap-two-col-grid-sm">
        <div class="field ap-full-width"><label class="field-label">T\xEDtulo / Referencia</label>
          <input id="qf_titulo" class="field-input" placeholder="Ej: BARRIO YAPEYU"/></div>
      </div>
      <div  class="ap-two-col-grid-sm">
        <div class="field"><label class="field-label">Solicitante</label>
          <input id="qf_solicitante" class="field-input" placeholder="Nombre del cliente"/></div>
        <div class="field"><label class="field-label">Tel\xE9fono</label>
          <input id="qf_telefono" class="field-input" placeholder="Tel\xE9fono"/></div>
      </div>
      <div  class="ap-two-col-grid-sm">
        <div class="field"><label class="field-label">Tipo propiedad</label>
          <select id="qf_tipo_propiedad" class="field-input field-input--select">${_sel("", "casa", TIPO_PROPS)}</select></div>
        <div class="field"><label class="field-label">Direcci\xF3n</label>
          <input id="qf_direccion" class="field-input" placeholder="Calle y n\xFAmero"/></div>
      </div>
      <div  class="ap-two-col-grid-sm">
        <div class="field"><label class="field-label">Barrio</label>
          <input id="qf_barrio" class="field-input" placeholder="Barrio"/></div>
        <div class="field"><label class="field-label">Destino</label>
          <select id="qf_destino" class="field-input field-input--select">${_sel("", "venta", DESTINOS)}</select></div>
      </div>
      <div class="pf-actions ap-stack-top-sm">
        <button class="btn btn-primary btn-full" id="quickSaveBtn">Crear tasaci\xF3n</button>
        <button class="btn btn-ghost" id="qfCancelBtn" type="button">Cancelar</button>
      </div>
    </div>`;
    $("appraisalFormModal").classList.remove("hidden");
    $("quickSaveBtn").onclick = () => quickSaveAppraisal();
    $("qfCancelBtn").onclick = closeAppraisalForm;
  }
  function closeAppraisalForm() {
    $("appraisalFormModal").classList.add("hidden");
  }
  async function quickSaveAppraisal() {
    const data = {
      titulo: $("qf_titulo").value.trim(),
      solicitante: $("qf_solicitante").value.trim(),
      telefono: $("qf_telefono").value.trim(),
      tipo_propiedad: $("qf_tipo_propiedad").value,
      direccion: $("qf_direccion").value.trim(),
      barrio: $("qf_barrio").value.trim(),
      destino: $("qf_destino").value,
      estado: "borrador"
    };
    if (!data.titulo && !data.solicitante) {
      toast("Ingres\xE1 al menos un t\xEDtulo o un solicitante.", "warn");
      return;
    }
    try {
      const saved = await API.createAppraisal(data);
      closeAppraisalForm();
      openAppraisalDetail(saved.id);
      loadAppraisals();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function openComparableForm(aid, cid) {
    const a = _currentAppraisal;
    const c2 = cid ? ((a == null ? void 0 : a.comparables) || []).find((x) => x.id === cid) : null;
    $("comparableFormTitle").textContent = c2 ? "Editar comparable C" + c2.numero : "Nuevo comparable";
    const v = (field2, def) => {
      var _a, _b;
      return c2 != null ? (_b = (_a = c2[field2]) != null ? _a : def) != null ? _b : "" : def != null ? def : "";
    };
    const vn = (field2, def) => {
      var _a, _b;
      return c2 != null ? (_b = (_a = c2[field2]) != null ? _a : def) != null ? _b : 0 : def != null ? def : 0;
    };
    const sel = (field2, opts) => _sel("", v(field2), opts);
    const attrLabel = (val) => val === "superior" ? "\u2191 Superior" : val === "inferior" ? "\u2193 Inferior" : "= Equivalente";
    const btnStyle = (val, current, field2) => `style="background:${val === current ? val === "superior" ? "var(--accent)" : val === "inferior" ? "#e74c3c" : "var(--admin-bg)" : "transparent"};color:${val === current ? "#fff" : "var(--g3)"};border:1px solid ${val === current ? "transparent" : "var(--b)"};border-radius:4px;padding:3px 8px;font-size:10px;font-weight:${val === current ? "600" : "400"};cursor:pointer;transition:all .15s" data-field="${field2}" data-value="${val}"`;
    const manualToggle = (field2, label) => {
      const val = v(field2, "equivalente");
      return `<div  class="ap-compact-card">
      <div  class="ap-label-with-space">${label}</div>
      <div  class="ap-flex-row-tight attr-toggle"  data-field="${field2}">
        <button type="button" ${btnStyle("superior", val, field2)}>\u2191 Superior</button>
        <button type="button" ${btnStyle("equivalente", val, field2)}>= Equivalente</button>
        <button type="button" ${btnStyle("inferior", val, field2)}>\u2193 Inferior</button>
      </div>
      <select id="cf_${field2}" class="field-input field-input--select ap-hidden">${[["superior", "Superior"], ["equivalente", "Equivalente"], ["inferior", "Inferior"]].map((o) => `<option value="${o[0]}"${val === o[0] ? " selected" : ""}>${o[1]}</option>`).join("")}</select>
    </div>`;
    };
    const autoBadge = (id, label) => {
      const val = v(id, "equivalente");
      const icon = val === "superior" ? "\u2191" : val === "inferior" ? "\u2193" : "=";
      const clr = val === "superior" ? "var(--accent)" : val === "inferior" ? "#e74c3c" : "var(--g3)";
      return `<div  class="ap-compact-card-center">
      <div  class="ap-label-compact">${label}</div>
      <div style="font-size:13px;font-weight:700;color:${clr}">${icon} ${val === "superior" ? "Superior" : val === "inferior" ? "Inferior" : "Equivalente"}</div>
      <div  class="ap-hint-tiny">autom\xE1tico</div>
    </div>`;
    };
    const tipo = a.tipo_propiedad || "casa";
    const attrs = getTypeAttrs(tipo);
    $("comparableFormContent").innerHTML = `
    <div class="pf-body ap-two-col-grid-wide">
      <div class="field ap-full-width"><label class="field-label">Calle</label>
        <input id="cf_calle" class="field-input" value="${esc(v("calle"))}" placeholder="Calle"/></div>
      <div class="field"><label class="field-label">N\xFAmero</label>
        <input id="cf_numero_calle" class="field-input" value="${esc(v("numero_calle"))}"/></div>
      <div class="field"><label class="field-label">Piso / Depto</label>
        <input id="cf_piso_depto" class="field-input" value="${esc(v("piso_depto"))}"/></div>
      <div class="field"><label class="field-label">Barrio</label>
        <input id="cf_barrio" class="field-input" value="${esc(v("barrio"))}"/></div>
      <div class="field"><label class="field-label">Localidad</label>
        <input id="cf_localidad" class="field-input" value="${esc(v("localidad"))}"/></div>
      <div class="field"><label class="field-label">Tipo operaci\xF3n</label>
        <select id="cf_tipo_operacion" class="field-input field-input--select">${sel("tipo_operacion", [["cotizacion", "Cotizaci\xF3n"], ["venta", "Venta"]])}</select></div>
      <div class="field"><label class="field-label">Precio USD</label>
        <input id="cf_precio_usd" class="field-input" type="number" value="${v("precio_usd", 0)}"/></div>
      <div class="field"><label class="field-label">Precio ARS</label>
        <input id="cf_precio_ars" class="field-input" type="number" value="${v("precio_ars", 0)}"/></div>
      <div class="field"><label class="field-label">Sup. cubierta m\xB2</label>
        <input id="cf_superficie_cubierta" class="field-input" type="number" value="${v("superficie_cubierta", 0)}"/></div>
      <div class="field"><label class="field-label">Sup. terreno m\xB2</label>
        <input id="cf_superficie_terreno" class="field-input" type="number" value="${v("superficie_terreno", 0)}"/></div>
      <div class="field"><label class="field-label">Dormitorios</label>
        <input id="cf_dormitorios" class="field-input" type="number" value="${vn("dormitorios", 0)}"/></div>
      <div class="field"><label class="field-label">Ba\xF1os</label>
        <input id="cf_banios" class="field-input" type="number" value="${vn("banios", 0)}" step="0.5"/></div>
      <div class="field"><label class="field-label">Tipo propiedad</label>
        <select id="cf_tipo_propiedad" class="field-input field-input--select">${sel("tipo_propiedad", TIPO_PROPS)}</select></div>
      <div class="field"><label class="field-label">A\xF1o constr.</label>
        <input id="cf_anio_construccion" class="field-input" type="number" value="${v("anio_construccion", 0)}"/></div>
      <div class="field"><label class="field-label">Garage</label>
        <label class="acm-chip">
          <input type="checkbox" class="acm-chip-input" id="cf_tiene_garage" ${vn("tiene_garage", false) ? "checked" : ""}>
          <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Tiene garage</span></span>
        </label></div>

      <div  class="ap-divider-wide"></div>

      <div  class="ap-full-width">
        <div  class="ap-flex-row-gap-sm">
          <h4  class="ap-overline-strong">Atributos comparativos</h4>
          <span  class="ap-badge-muted">${esc(tipo)}</span>
        </div>
        <div  class="ap-three-col-grid">
          ${attrs.map((attr) => attr[3] ? autoBadge(attr[0], attr[1]) : manualToggle(attr[0], attr[1])).join("")}
        </div>
      </div>

      <div  class="ap-divider-narrow"></div>

      <div class="field"><label class="field-label">D\xEDas en mercado</label>
        <input id="cf_dias_en_mercado" class="field-input" type="number" value="${v("dias_en_mercado", 0)}"/></div>
      <div class="field"><label class="field-label">Inmobiliaria</label>
        <input id="cf_inmobiliaria" class="field-input" value="${esc(v("inmobiliaria"))}"/></div>
      <div class="field"><label class="field-label">Tel. inmobiliaria</label>
        <input id="cf_telefono_inmobiliaria" class="field-input" value="${esc(v("telefono_inmobiliaria"))}"/></div>
      <div class="field ap-full-width"><label class="field-label">Link fuente</label>
        <div  class="ap-flex-row-sm">
          <input id="cf_link_fuente" class="field-input ap-flex-1" value="${esc(v("link_fuente"))}" placeholder="https://mercadolibre.com.ar/..."  />
          <button class="btn btn-primary ap-btn-nowrap" id="extraerURLBtn"   ${c2 ? "disabled" : ""}>Extraer</button>
        </div>
        <div id="extraerStatus"  class="ap-hint-sm"></div></div>

      <div class="field ap-full-width"><label class="field-label">Observaciones</label>
        <textarea id="cf_observaciones" class="field-input" rows="3">${esc(v("observaciones"))}</textarea></div>

      <div id="homologPreview"  class="ap-expandable-section">
        <div  class="ap-overline-section-sm">Vista previa de homologaci\xF3n</div>
        <div  class="ap-three-col-grid">
          <div  class="ap-chip-card-center">
            <div  class="ap-overline-micro">Coeficiente</div>
            <div id="hpCoef"  class="ap-value-md-emphasis">\u2014</div>
          </div>
          <div  class="ap-chip-card-center">
            <div  class="ap-overline-micro">$/m\xB2 ajustado</div>
            <div id="hpM2"  class="ap-value-md-accent">\u2014</div>
          </div>
          <div  class="ap-chip-card-center">
            <div  class="ap-overline-micro">Valor ajustado</div>
            <div id="hpTotal"  class="ap-value-md-accent">\u2014</div>
          </div>
        </div>
      </div>

      <div class="pf-actions ap-full-width">
        <button class="btn btn-primary btn-full" id="saveComparableBtn">${c2 ? "Guardar cambios" : "Agregar comparable"}</button>
        <button class="btn btn-ghost" id="cfCancelBtn" type="button">Cancelar</button>
      </div>
    </div>`;
    $("comparableFormModal").classList.remove("hidden");
    $("saveComparableBtn").onclick = () => saveComparableForm(aid, cid);
    $("extraerURLBtn").onclick = () => extraerDesdeURL(aid, cid);
    setTimeout(() => {
      var _a;
      return (_a = $("cfCancelBtn")) == null ? void 0 : _a.addEventListener("click", closeComparableForm);
    }, 0);
    _bindComparableFormPreview(aid, cid);
    _previewHomologacion(aid);
    const modal = $("comparableFormModal");
    modal.querySelectorAll(".attr-toggle").forEach((container) => {
      container.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-field]");
        if (!btn) return;
        const field2 = btn.dataset.field;
        const value = btn.dataset.value;
        const sel2 = container.querySelector("select");
        if (sel2) sel2.value = value;
        container.querySelectorAll("button").forEach((b) => {
          const isActive = b.dataset.value === value;
          Object.assign(b.style, {
            background: isActive ? value === "superior" ? "var(--accent)" : value === "inferior" ? "#e74c3c" : "var(--admin-bg)" : "transparent",
            color: isActive ? "#fff" : "var(--g3)",
            borderColor: isActive ? "transparent" : "var(--b)",
            fontWeight: isActive ? "600" : "400"
          });
        });
        _previewHomologacion(aid);
      });
    });
  }
  async function extraerDesdeURL(aid, cid) {
    var _a, _b;
    const url = (_b = (_a = $("cf_link_fuente")) == null ? void 0 : _a.value) == null ? void 0 : _b.trim();
    if (!url) {
      toast("Peg\xE1 una URL primero.", "warn");
      return;
    }
    const status = $("extraerStatus");
    status.innerHTML = '<span  class="ap-text-soft">Extrayendo datos...</span>';
    $("extraerURLBtn").disabled = true;
    try {
      let setVal2 = function(id, val) {
        const el = $(id);
        if (el && val != null) el.value = val;
      }, setNum2 = function(id, val) {
        const el = $(id);
        if (el && val != null) el.value = val;
      }, setCheck2 = function(id, val) {
        const el = $(id);
        if (el) el.checked = !!val;
      };
      var setVal = setVal2, setNum = setNum2, setCheck = setCheck2;
      const data = await API.extraerURL(url);
      if (!data || !Object.keys(data).length) {
        status.innerHTML = '<span  class="ap-error-text">No se pudieron extraer datos de esta URL.</span>';
        return;
      }
      if (data._error) {
        if (data.link_fuente) setVal2("cf_link_fuente", data.link_fuente);
        status.innerHTML = `<span  class="ap-warning-text">\u26A0 ${esc(data._error)}</span>`;
        return;
      }
      setVal2("cf_calle", data.calle);
      setVal2("cf_numero_calle", data.numero_calle);
      setVal2("cf_barrio", data.barrio);
      setVal2("cf_localidad", data.localidad);
      setVal2("cf_piso_depto", data.piso_depto);
      setNum2("cf_precio_usd", data.precio_usd);
      setNum2("cf_precio_ars", data.precio_ars);
      setNum2("cf_superficie_cubierta", data.superficie_cubierta);
      setNum2("cf_superficie_terreno", data.superficie_terreno);
      setNum2("cf_dormitorios", data.dormitorios);
      setNum2("cf_banios", data.banios);
      setNum2("cf_anio_construccion", data.anio_construccion);
      setCheck2("cf_tiene_garage", data.tiene_garage);
      setVal2("cf_tipo_operacion", data.tipo_operacion || "cotizacion");
      if (data.link_fuente) setVal2("cf_link_fuente", data.link_fuente);
      if (data.inmobiliaria) setVal2("cf_inmobiliaria", data.inmobiliaria);
      if (data.tipo_propiedad) setVal2("cf_tipo_propiedad", data.tipo_propiedad);
      const count = Object.keys(data).filter((k) => data[k] != null && data[k] !== "" && data[k] !== 0 && data[k] !== false).length;
      status.innerHTML = `<span  class="ap-text-accent">\u2713 ${count} campos extra\xEDdos correctamente.</span>`;
    } catch (e) {
      status.innerHTML = '<span  class="ap-error-text"></span>';
      status.firstChild.textContent = "Error: " + (e.message || "");
    } finally {
      $("extraerURLBtn").disabled = false;
    }
  }
  function closeComparableForm() {
    $("comparableFormModal").classList.add("hidden");
  }
  function _gatherComparableData() {
    const g = (id) => {
      var _a, _b;
      return (_b = (_a = $(id)) == null ? void 0 : _a.value) != null ? _b : "";
    };
    const gn = (id) => {
      var _a;
      const v = parseFloat((_a = $(id)) == null ? void 0 : _a.value);
      return isNaN(v) ? null : v;
    };
    const gi = (id) => {
      var _a;
      const v = parseInt((_a = $(id)) == null ? void 0 : _a.value);
      return isNaN(v) ? null : v;
    };
    const gc = (id) => {
      var _a, _b;
      return (_b = (_a = $(id)) == null ? void 0 : _a.value) != null ? _b : "equivalente";
    };
    const gb = (id) => {
      var _a;
      return ((_a = $(id)) == null ? void 0 : _a.checked) || false;
    };
    const data = {
      calle: g("cf_calle"),
      numero_calle: g("cf_numero_calle"),
      piso_depto: g("cf_piso_depto"),
      barrio: g("cf_barrio"),
      localidad: g("cf_localidad"),
      tipo_operacion: g("cf_tipo_operacion"),
      precio_usd: gn("cf_precio_usd"),
      precio_ars: gn("cf_precio_ars"),
      superficie_cubierta: gn("cf_superficie_cubierta"),
      superficie_terreno: gn("cf_superficie_terreno"),
      dormitorios: gi("cf_dormitorios"),
      banios: gn("cf_banios"),
      tiene_garage: gb("cf_tiene_garage"),
      tipo_propiedad: g("cf_tipo_propiedad"),
      anio_construccion: gi("cf_anio_construccion"),
      dias_en_mercado: gi("cf_dias_en_mercado"),
      inmobiliaria: g("cf_inmobiliaria"),
      telefono_inmobiliaria: g("cf_telefono_inmobiliaria"),
      link_fuente: g("cf_link_fuente"),
      observaciones: g("cf_observaciones")
    };
    const tipo = getCurrentAppraisalType();
    const attrs = getTypeAttrs(tipo);
    attrs.forEach((a) => {
      data[a[0]] = gc("cf_" + a[0]);
    });
    return data;
  }
  var _previewTimer = null;
  function _previewHomologacion(aid) {
    if (_previewTimer) clearTimeout(_previewTimer);
    _previewTimer = setTimeout(async () => {
      const data = _gatherComparableData();
      if (!data.precio_usd || !data.superficie_cubierta) {
        $("homologPreview").style.display = "none";
        return;
      }
      try {
        const result = await API.previewComparable(aid, data);
        $("homologPreview").style.display = "";
        $("hpCoef").textContent = result.coeficiente_ajuste != null ? result.coeficiente_ajuste.toFixed(4) : "\u2014";
        $("hpM2").textContent = result.valor_m2_ajustado != null ? "$ " + result.valor_m2_ajustado.toFixed(2) : "\u2014";
        $("hpTotal").textContent = result.valor_ajustado != null ? "$ " + result.valor_ajustado.toFixed(2) : "\u2014";
      } catch (e) {
        $("homologPreview").style.display = "none";
      }
    }, 300);
  }
  function _bindComparableFormPreview(aid, cid) {
    const triggers = [
      "cf_precio_usd",
      "cf_superficie_cubierta",
      "cf_anio_construccion",
      "cf_dormitorios",
      "cf_tiene_garage",
      "cf_precio_ars"
    ];
    const tipo = getCurrentAppraisalType();
    getTypeAttrs(tipo).forEach((a) => {
      triggers.push("cf_" + a[0]);
    });
    triggers.forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener("change", () => _previewHomologacion(aid));
      if (el && el.type === "number") el.addEventListener("input", () => _previewHomologacion(aid));
    });
  }
  async function _acmRefreshDetail(aid) {
    const updated = await API.getAppraisal(aid);
    _currentAppraisal = updated;
    const compContainer = $("acmComparables");
    if (compContainer) compContainer.innerHTML = renderComparableCards(updated);
    const resultsContainer = $("acmResults");
    if (resultsContainer) resultsContainer.outerHTML = renderResults(updated);
    const heading = $("acmComparablesCount");
    if (heading) heading.textContent = `Comparables (${(updated.comparables || []).length})`;
  }
  async function saveComparableForm(aid, cid) {
    const data = _gatherComparableData();
    try {
      if (cid) {
        await API.updateComparable(aid, cid, data);
      } else {
        await API.createComparable(aid, data);
      }
      closeComparableForm();
      await _acmRefreshDetail(aid);
      refreshAppraisalMap(aid);
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function confirmDeleteComparable(aid, cid) {
    if (!await confirmModal("\xBFEliminar este comparable?")) return;
    try {
      await API.deleteComparable(aid, cid);
      await _acmRefreshDetail(aid);
      refreshAppraisalMap(aid);
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function toggleComparableExclusion(aid, cid) {
    if (!await confirmModal("\xBFCambiar exclusi\xF3n de este comparable?")) return;
    try {
      const data = await _req("PATCH", `/api/appraisals/${aid}/comparables/${cid}/toggle-exclusion`);
      await _acmRefreshDetail(aid);
      refreshAppraisalMap(aid);
      toast(data.excluido ? "Comparable excluido del c\xE1lculo" : "Comparable incluido", "info");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function completarAppraisal(aid) {
    if (!await confirmModal("\xBFFinalizar la valuaci\xF3n? Se cambiar\xE1 el estado a Completada.")) return;
    try {
      const saved = await API.completarAppraisal(aid);
      _currentAppraisal = saved;
      $("appraisalDetailView").innerHTML = renderDetail(saved);
      loadAppraisals();
      toast("Valuaci\xF3n completada", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function _bindDetail(aid) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    (_a = $("saveBtn")) == null ? void 0 : _a.addEventListener("click", () => saveAppraisalDetail(aid));
    (_b = $("completarBtn")) == null ? void 0 : _b.addEventListener("click", () => completarAppraisal(aid));
    (_c = $("restoreBtn")) == null ? void 0 : _c.addEventListener("click", () => restoreAppraisal(aid));
    (_d = $("reportBtn")) == null ? void 0 : _d.addEventListener("click", () => generarPDFAppraisal(aid));
    (_e = $("exportCsvBtn")) == null ? void 0 : _e.addEventListener("click", () => exportCsv(aid));
    (_f = $("archiveBtn")) == null ? void 0 : _f.addEventListener("click", () => archiveAppraisal(aid));
    (_g = $("deleteAppraisalBtn")) == null ? void 0 : _g.addEventListener("click", () => deleteAppraisal(aid));
    (_h = $("addComparableBtn")) == null ? void 0 : _h.addEventListener("click", () => openComparableForm(aid, null));
    (_i = $("newVersionBtn")) == null ? void 0 : _i.addEventListener("click", () => createNewAppraisalVersion(aid));
    ["ad_superficie_cubierta", "ad_tipo_cambio_usd", "ad_valor_uva"].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener("input", _recalcLive);
    });
    const tipoEl = $("ad_tipo_propiedad");
    if (tipoEl) {
      tipoEl.addEventListener("change", () => {
        const tipo = tipoEl.value || "casa";
        _currentAppraisal.tipo_propiedad = tipo;
        const compContainer = $("acmComparables");
        if (compContainer) compContainer.innerHTML = renderComparableCards(_currentAppraisal);
        const resultsContainer = $("acmResults");
        if (resultsContainer) resultsContainer.outerHTML = renderResults(_currentAppraisal);
        _recalcLive();
        const hidden = detectHiddenComparableAttrs(tipo);
        if (hidden.length > 0) {
          toast('Se ocultaron atributos comparativos que no aplican a "' + tipo + '": ' + hidden.join(", "), "info");
        }
      });
    }
  }
  function detectHiddenComparableAttrs(tipo) {
    const used = {};
    getTypeAttrs(tipo).forEach((a) => {
      used[a[0]] = true;
    });
    const hidden = COMP_ATTRS.filter((f) => !used[f]);
    return hidden;
  }
  var _origRenderDetail = renderDetail;
  renderDetail = function(a) {
    const html = _origRenderDetail(a);
    setTimeout(() => {
      loadAppraisalLogs(a.id);
      loadAppraisalVersions(a.id);
      loadAppraisalMap(a.id);
      _bindDetail(a.id);
    }, 50);
    return html;
  };
  function showModal(title, bodyHtml, _footerHtml, closeLabel) {
    const existing = document.getElementById("apprModalWrap");
    if (existing) existing.remove();
    const wrap = document.createElement("div");
    wrap.id = "apprModalWrap";
    wrap.style.cssText = "position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)";
    wrap.onclick = (e) => {
      if (e.target === wrap) closeModal();
    };
    wrap.innerHTML = `
    <div  class="ap-modal-surface">
      <div  class="ap-modal-header-row">
        <span  class="ap-hero-title">${title}</span>
        <button onclick="closeModal()"  class="ap-modal-close-btn">\xD7</button>
      </div>
      <div  class="ap-scroll-content">${bodyHtml}</div>
      ${closeLabel ? `<div  class="ap-modal-footer"><button class="btn btn-ghost btn-sm" onclick="closeModal()">${closeLabel}</button></div>` : ""}
    </div>`;
    document.body.appendChild(wrap);
  }
  function closeModal() {
    const el = document.getElementById("apprModalWrap");
    if (el) el.remove();
  }
  function renderKpiBar(stats, container) {
    if (!container) return;
    const cards = [
      { label: "Pendientes", num: stats.borradores || 0, sub: "Borradores" },
      { label: "En Proceso", num: stats.en_proceso || 0, sub: "Activas" },
      { label: "Completadas", num: stats.completadas || 0, sub: "Finalizadas" },
      { label: "Archivadas", num: stats.archivadas || 0, sub: "Inactivas" },
      { label: "Total", num: stats.total || 0, sub: "Tasaciones" },
      { label: "Con Agente", num: stats.con_agente || 0, sub: "Asignadas" },
      { label: "Sin Agente", num: stats.sin_agente || 0, sub: "Sin asignar" }
    ];
    container.innerHTML = cards.map((c2) => `
    <div class="appr-kpi-card">
      <span class="appr-kpi-label">${c2.label}</span>
      <span class="appr-kpi-number">${c2.num}</span>
      <span class="appr-kpi-sub">${c2.sub}</span>
    </div>
  `).join("");
  }
  async function openAppraisalPanel(id) {
    _currentAppraisal = null;
    try {
      const a = await API.getAppraisal(id);
      _currentAppraisal = a;
      $("apprPanelTitle").textContent = esc(a.titulo || a.solicitante || `Tasaci\xF3n #${a.id}`);
      const body = $("apprPanelBody");
      body.innerHTML = '<div class="loading-state">Cargando...</div>';
      $("apprOverlay").classList.add("show");
      $("apprPanel").classList.add("open");
      renderAppraisalPanel(a, body);
    } catch (e) {
      toast("Error al cargar tasaci\xF3n: " + e.message, "error");
    }
  }
  function closeAppraisalPanel() {
    $("apprOverlay").classList.remove("show");
    $("apprPanel").classList.remove("open");
    $("apprPanelBody").innerHTML = "";
    _currentAppraisal = null;
  }
  async function renderAppraisalPanel(a, body) {
    const iconMap = { casa: "\u{1F3E0}", departamento: "\u{1F3E2}", ph: "\u{1F3D8}\uFE0F", local: "\u{1F3EA}", oficina: "\u{1F3E2}", terreno: "\u{1F333}" };
    const icon = iconMap[a.tipo_propiedad] || "\u{1F4CB}";
    const priorityCls = "priority-" + (a.priority || "media");
    const statusCls = ESTADO_CLS[a.estado] || "status-oculta";
    body.innerHTML = `
    <div class="appr-panel-section">
      <div class="appr-panel-section-title">Informaci\xF3n General</div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Estado</span>
        <span><span class="admin-status-badge ${statusCls}">${ESTADO_MAP[a.estado] || a.estado}</span></span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Prioridad</span>
        <span class="admin-status-badge ${priorityCls} ap-avatar-round">${a.priority || "media"}</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Tipo</span>
        <span class="appr-panel-value">${icon} ${a.tipo_propiedad || "\u2014"}</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Direcci\xF3n</span>
        <span class="appr-panel-value">${esc(a.direccion || "\u2014")}</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Barrio</span>
        <span class="appr-panel-value">${esc(a.barrio || "\u2014")}</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Sup. Cubierta</span>
        <span class="appr-panel-value">${a.superficie_cubierta ? a.superficie_cubierta + " m\xB2" : "\u2014"}</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Dorm / Ba\xF1os</span>
        <span class="appr-panel-value">${a.dormitorios || 0} dorm \xB7 ${a.banios || 0} ba\xF1os</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Valor Estimado</span>
        <span class="appr-panel-value ap-link-accent-bold">${_fmtUSD(a.valor_estimado_usd)}</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Solicitante</span>
        <span class="appr-panel-value">${esc(a.solicitante || "\u2014")}</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Agente</span>
        <span class="appr-panel-value">${esc(a.assigned_agent_name || "Sin asignar")}</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Comparables</span>
        <span class="appr-panel-value">${a.total_comparables || 0}</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Creado</span>
        <span class="appr-panel-value">${a.created_at ? formatDateShort(a.created_at) : "\u2014"}</span>
      </div>
      <div class="appr-panel-row">
        <span class="appr-panel-label">Actualizado</span>
        <span class="appr-panel-value">${a.updated_at ? formatDateShort(a.updated_at) : "\u2014"}</span>
      </div>
    </div>
    <div class="appr-panel-section">
      <div class="appr-panel-section-title">Acciones R\xE1pidas</div>
      <div class="appr-actions" id="apprActions"></div>
    </div>
    <div class="appr-panel-section">
      <div class="appr-panel-section-title">L\xEDnea de Tiempo</div>
      <div class="appr-timeline" id="apprTimeline"><div class="loading-state"></div></div>
    </div>
    <div class="appr-panel-section">
      <div class="appr-panel-section-title">Comentarios</div>
      <div class="appr-comments" id="apprComments"><div class="loading-state"></div></div>
      <div class="appr-comment-input">
        <textarea id="apprCommentInput" placeholder="Escrib\xED un comentario..." rows="1"></textarea>
        <button class="btn btn-primary btn-sm" id="apprCommentSend">Enviar</button>
      </div>
    </div>
    <div class="appr-panel-section">
      <div class="appr-panel-section-title">Archivos</div>
      <div class="appr-files" id="apprFiles"><div class="loading-state"></div></div>
      <div class="appr-upload-zone ap-stack-top-xs" id="apprUploadZone"  >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Subir archivo
        <input type="file" id="apprFileInput"  class="ap-hidden" multiple>
      </div>
    </div>
  `;
    renderActions(a);
    renderTimeline(a.id);
    renderComments(a.id);
    renderFiles(a.id);
    $("apprCommentSend").onclick = () => sendComment(a.id);
    $("apprCommentInput").onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendComment(a.id);
      }
    };
    $("apprUploadZone").onclick = () => $("apprFileInput").click();
    $("apprFileInput").onchange = (e) => uploadFile(a.id, e.target);
    $("apprOverlay").onclick = closeAppraisalPanel;
  }
  function renderActions(a) {
    const c2 = $("apprActions");
    if (!c2) return;
    c2.innerHTML = `
    <button class="appr-action-btn" onclick="openAppraisalDetail(${a.id})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      Abrir ACM
    </button>
    <button class="appr-action-btn" onclick="showAssignAgent(${a.id})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ${a.assigned_agent_id ? "Reasignar agente" : "Asignar agente"}
    </button>
    <button class="appr-action-btn" onclick="showChangeStatus(${a.id}, '${a.estado}')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      Cambiar estado
    </button>
    <button class="appr-action-btn" onclick="convertToProperty(${a.id})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      Convertir en propiedad
    </button>
  `;
  }
  async function renderTimeline(aid) {
    const c2 = $("apprTimeline");
    if (!c2) return;
    try {
      const items = await API.getAppraisalTimeline(aid);
      if (!items || !items.length) {
        c2.innerHTML = '<div  class="ap-footnote-italic">Sin actividad registrada</div>';
        return;
      }
      const dotCls = { estado: "appr-timeline-dot--estado", asignacion: "appr-timeline-dot--asignacion", comentario: "appr-timeline-dot--comentario", conversion: "appr-timeline-dot--conversion" };
      c2.innerHTML = items.map((i) => `
      <div class="appr-timeline-item">
        <div class="appr-timeline-dot ${dotCls[i.event_type] || "appr-timeline-dot--nota"}"></div>
        <div class="appr-timeline-content">${esc(i.description || i.event_type)}</div>
        <div class="appr-timeline-time">${formatDateTime(i.created_at)}</div>
      </div>
    `).join("");
    } catch (e) {
      c2.innerHTML = '<div  class="ap-text-muted-base">Error al cargar</div>';
    }
  }
  async function renderComments(aid) {
    const c2 = $("apprComments");
    if (!c2) return;
    try {
      const items = await API.getAppraisalComments(aid);
      if (!items || !items.length) {
        c2.innerHTML = '<div  class="ap-footnote-italic-sm">Sin comentarios</div>';
        return;
      }
      c2.innerHTML = items.map((i) => `
      <div class="appr-comment">
        <div class="appr-comment-header">
          <span class="appr-comment-author">${esc(i.user_name || "Usuario")}</span>
          <span class="appr-comment-time">${formatDateTime(i.created_at)}</span>
        </div>
        <div class="appr-comment-content">${esc(i.content)}</div>
      </div>
    `).join("");
    } catch (e) {
      c2.innerHTML = '<div  class="ap-text-muted-base">Error al cargar</div>';
    }
  }
  async function renderFiles(aid) {
    const c2 = $("apprFiles");
    if (!c2) return;
    try {
      const items = await API.getAppraisalFiles(aid);
      if (!items || !items.length) {
        c2.innerHTML = '<div  class="ap-footnote-italic-sm">Sin archivos</div>';
        return;
      }
      c2.innerHTML = items.map((i) => `
      <span class="appr-file-chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${esc(i.original_name)}
        <button class="appr-file-delete" onclick="deleteFile(${aid}, ${i.id})" title="Eliminar">\xD7</button>
      </span>
    `).join("");
    } catch (e) {
      c2.innerHTML = '<div  class="ap-text-muted-base">Error al cargar</div>';
    }
  }
  async function sendComment(aid) {
    const input = $("apprCommentInput");
    const content = input.value.trim();
    if (!content) return;
    input.disabled = true;
    try {
      await API.addAppraisalComment(aid, { content });
      input.value = "";
      renderComments(aid);
      renderTimeline(aid);
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
    input.disabled = false;
    input.focus();
  }
  async function uploadFile(aid, input) {
    const files = input.files;
    if (!files || !files.length) return;
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      try {
        await API.uploadAppraisalFile(aid, fd);
      } catch (e) {
        toast("Error al subir: " + e.message, "error");
      }
    }
    input.value = "";
    renderFiles(aid);
  }
  async function deleteFile(aid, fid) {
    if (!confirm("\xBFEliminar este archivo?")) return;
    try {
      await API.deleteAppraisalFile(aid, fid);
      renderFiles(aid);
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  async function showAssignAgent(aid) {
    try {
      const agents = await API.getAppraisalAgents();
      const current = _currentAppraisal == null ? void 0 : _currentAppraisal.assigned_agent_id;
      showModal("Asignar Agente", `
      <div  class="ap-footnote-spaced">Seleccion\xE1 el agente para esta tasaci\xF3n</div>
      <div class="appr-assign-list">
        <button class="appr-assign-option" data-agent="">\u2014 Sin agente \u2014</button>
        ${agents.map((a) => `
          <button class="appr-assign-option ${current === a.id ? "active" : ""}" data-agent="${a.id}" style="${current === a.id ? "background:var(--admin-primary-glow);border-color:var(--admin-primary-border);color:var(--admin-primary)" : ""}">${esc(a.name)}</button>
        `).join("")}
      </div>
    `, null, "Cerrar");
      document.querySelectorAll(".appr-assign-option").forEach((btn) => {
        btn.onclick = async () => {
          try {
            await API.assignAppraisalAgent(aid, { agent_id: btn.dataset.agent || null });
            toast("Agente asignado", "success");
            closeModal();
            closeAppraisalPanel();
            loadAppraisals();
          } catch (e) {
            toast("Error: " + e.message, "error");
          }
        };
      });
    } catch (e) {
      toast("Error al cargar agentes: " + e.message, "error");
    }
  }
  async function showChangeStatus(aid, current) {
    const estados = [
      ["borrador", "Pendiente"],
      ["en_proceso", "En Proceso"],
      ["completada", "Completada"],
      ["archivada", "Archivada"]
    ];
    showModal("Cambiar Estado", `
    <div  class="ap-footnote-spaced">Seleccion\xE1 el nuevo estado</div>
    <div class="appr-assign-list">
      ${estados.map(([val, label]) => `
        <button class="appr-assign-option ${val === current ? "active" : ""}" data-estado="${val}" style="${val === current ? "background:var(--admin-primary-glow);border-color:var(--admin-primary-border);color:var(--admin-primary)" : ""}">${label}</button>
      `).join("")}
    </div>
  `, null, "Cerrar");
    document.querySelectorAll(".appr-assign-list .appr-assign-option").forEach((btn) => {
      btn.onclick = async () => {
        try {
          await API.changeAppraisalStatus(aid, { estado: btn.dataset.estado });
          toast("Estado actualizado", "success");
          closeModal();
          closeAppraisalPanel();
          loadAppraisals();
        } catch (e) {
          toast("Error: " + e.message, "error");
        }
      };
    });
  }
  async function convertToProperty(aid) {
    if (!confirm("\xBFConvertir esta tasaci\xF3n en una propiedad del inventario?")) return;
    try {
      const result = await API.convertAppraisalToProperty(aid, { operation_type: "venta" });
      toast(`Propiedad #${result.property_id} creada: ${result.property_title}`, "success");
      closeAppraisalPanel();
      loadAppraisals();
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  function formatDateShort(d) {
    if (!d) return "\u2014";
    const dt = /* @__PURE__ */ new Date(d + (d.includes("T") ? "" : "T00:00:00"));
    return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function formatDateTime(d) {
    if (!d) return "\u2014";
    const dt = /* @__PURE__ */ new Date(d + (d.includes("T") ? "" : "T00:00:00"));
    return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  window.renderComparableCards = renderComparableCards;
  window.openComparableForm = openComparableForm;
  window.closeComparableForm = closeComparableForm;
  window.saveComparableForm = saveComparableForm;
  window.confirmDeleteComparable = confirmDeleteComparable;
  window.toggleComparableExclusion = toggleComparableExclusion;
  window.filterAppraisals = filterAppraisals;
  window.showAppraisalsList = showAppraisalsList;
  window.loadAppraisals = loadAppraisals;
  window.openAppraisalForm = openAppraisalForm;
  window.closeAppraisalForm = closeAppraisalForm;
  window.openAppraisalDetail = openAppraisalDetail;
  window.openReport = openReport;
  window.archiveAppraisal = archiveAppraisal;
  window.deleteAppraisal = deleteAppraisal;
  window.restoreAppraisal = restoreAppraisal;
  window.saveAppraisalDetail = saveAppraisalDetail;
  window.completarAppraisal = completarAppraisal;
  window.extraerDesdeURL = extraerDesdeURL;
  window.exportCsv = exportCsv;
  window.togglePyramidSection = togglePyramidSection;
  window.changeAppraisalPage = changeAppraisalPage;
  window.closeAppraisalPanel = closeAppraisalPanel;
  window.openAppraisalPanel = openAppraisalPanel;
  window.showModal = showModal;
  window.closeModal = closeModal;
  window.showAssignAgent = showAssignAgent;
  window.showChangeStatus = showChangeStatus;
  window.convertToProperty = convertToProperty;
  window.deleteFile = deleteFile;
  document.addEventListener("click", (e) => {
    if (e.target.closest("#backToAppraisalsList")) showAppraisalsList();
  });
  document.addEventListener("change", (e) => {
    const el = e.target.closest("#appraisalFilter") || e.target.closest("#appraisalShowArchived");
    if (el) {
      _appraisalPage = 1;
      loadAppraisals();
    }
  });
  var _searchTimer = null;
  document.addEventListener("input", (e) => {
    if (e.target.closest("#appraisalSearch")) {
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(() => {
        _appraisalPage = 1;
        loadAppraisals();
      }, 300);
    }
  });
  var _tasaciones = [];
  var _currentTasacion = null;
  var _tasacionPage = 1;
  var _tasacionPages = 1;
  var _tasacionTotal = 0;
  function _sel(id, val, opts) {
    const v = val != null ? val : "";
    const oh = opts.map((o) => `<option value="${o[0]}"${v === o[0] ? " selected" : ""}>${o[1]}</option>`).join("");
    return id ? `<select id="${id}" class="field-input field-input--select">${oh}</select>` : oh;
  }
  function _tf(v) {
    return v != null ? v : "";
  }
  function _fmtUSD(n) {
    const v = Number(n);
    return v ? `USD ${v.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "\u2014";
  }
  function stDev(arr) {
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
  }
  function _fmtARS(n) {
    const v = Number(n);
    return v ? `ARS ${v.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "\u2014";
  }
  function _fmtUVA(n) {
    const v = Number(n);
    return v ? `${v.toLocaleString("es-AR", { minimumFractionDigits: 2 })} UVAs` : "\u2014";
  }
  function round(v, d) {
    const p = Math.pow(10, d || 0);
    return Math.round(v * p) / p;
  }
  var TAS_ESTADO_MAP = { borrador: "Borrador", en_proceso: "En proceso", completada: "Completada", archivada: "Archivada" };
  var TAS_ESTADO_CLS = { borrador: "status-oculta", en_proceso: "status-disponible", completada: "status-vendida", archivada: "status-oculta" };
  var TAS_TIPO_PROPS = [["casa", "Casa"], ["departamento", "Departamento"], ["ph", "PH"], ["local", "Local"], ["oficina", "Oficina"], ["terreno", "Terreno"]];
  var TAS_DESTINOS = [["venta", "Venta"], ["locacion", "Locaci\xF3n"], ["garantia", "Garant\xEDa"], ["seguro", "Seguro"]];
  function esc(v) {
    return String(v != null ? v : "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  var TAS_COMP_ATTRS = [
    "comp_antiguedad",
    "comp_estacionamiento",
    "comp_habitaciones",
    "comp_ubicacion",
    "comp_estado_mantenimiento",
    "comp_comodidades",
    "comp_orientacion",
    "comp_vistas",
    "comp_nivel_piso"
  ];
  var TAS_TYPE_ATTR_MAP = {
    casa: [
      ["comp_antiguedad", "Antig\xFCedad", 0.07, true],
      ["comp_estado_mantenimiento", "Estado de mantenimiento", 0.05, false],
      ["comp_estacionamiento", "Estacionamiento", 0.03, true],
      ["comp_ubicacion", "Calidad de ubicaci\xF3n", 0.07, false],
      ["comp_comodidades", "Comodidades", 0.04, false],
      ["comp_habitaciones", "Cantidad de habitaciones", 0.04, true]
    ],
    ph: [
      ["comp_antiguedad", "Antig\xFCedad", 0.07, true],
      ["comp_estado_mantenimiento", "Estado de mantenimiento", 0.05, false],
      ["comp_estacionamiento", "Estacionamiento", 0.03, true],
      ["comp_ubicacion", "Calidad de ubicaci\xF3n", 0.07, false],
      ["comp_comodidades", "Comodidades", 0.04, false],
      ["comp_habitaciones", "Cantidad de habitaciones", 0.04, true]
    ],
    departamento: [
      ["comp_nivel_piso", "Ubicaci\xF3n planta", 0.05, false],
      ["comp_vistas", "Ubicaci\xF3n piso", 0.03, false],
      ["comp_antiguedad", "Antig\xFCedad", 0.06, true],
      ["comp_ubicacion", "Calidad de ubicaci\xF3n", 0.07, false],
      ["comp_comodidades", "Comodidades", 0.04, false],
      ["comp_habitaciones", "Cantidad de habitaciones", 0.05, true]
    ],
    terreno: [
      ["comp_comodidades", "Servicios", 0.05, false],
      ["comp_vistas", "Acceso", 0.04, false],
      ["comp_habitaciones", "Superficie", 0.06, true],
      ["comp_ubicacion", "Calidad de ubicaci\xF3n", 0.07, false],
      ["comp_orientacion", "Forma", 0.04, false],
      ["comp_antiguedad", "Orientaci\xF3n", 0.04, false]
    ],
    local: [
      ["comp_ubicacion", "Ubicaci\xF3n / Visibilidad", 0.07, false],
      ["comp_estado_mantenimiento", "Estado de mantenimiento", 0.05, false],
      ["comp_habitaciones", "Superficie", 0.06, true],
      ["comp_vistas", "Accesibilidad", 0.03, false],
      ["comp_comodidades", "Comodidades / Instalaciones", 0.05, false],
      ["comp_estacionamiento", "Estacionamiento", 0.04, true]
    ],
    oficina: [
      ["comp_ubicacion", "Ubicaci\xF3n / Visibilidad", 0.07, false],
      ["comp_estado_mantenimiento", "Estado de mantenimiento", 0.05, false],
      ["comp_habitaciones", "Superficie", 0.06, true],
      ["comp_vistas", "Accesibilidad", 0.03, false],
      ["comp_comodidades", "Comodidades / Instalaciones", 0.05, false],
      ["comp_estacionamiento", "Estacionamiento", 0.04, true]
    ]
  };
  function getTypeAttrs(tipo) {
    return TAS_TYPE_ATTR_MAP[tipo] || TAS_TYPE_ATTR_MAP.casa;
  }
  function getCurrentTasacionType() {
    return _currentTasacion && _currentTasacion.tipo_propiedad || "casa";
  }
  function _calcCoef(c2) {
    const coef = c2.coeficiente_ajuste;
    if (coef != null) return coef;
    return 1;
  }
  function _ajustado(c2) {
    const v = c2.valor_m2_ajustado;
    if (v != null) return v;
    if (c2.precio_por_m2 && c2.coeficiente_ajuste) return round(c2.precio_por_m2 * c2.coeficiente_ajuste, 2);
    if (c2.precio_usd && c2.superficie_cubierta) return round(c2.precio_usd / c2.superficie_cubierta, 2);
    return null;
  }
  function renderTasaciones() {
    const list = $("tasacionesAdminList");
    if (!_tasaciones.length) {
      list.innerHTML = '<div class="loading-state">No hay tasaciones.</div>';
      return;
    }
    list.innerHTML = _tasaciones.map((a) => {
      const cls = TAS_ESTADO_CLS[a.estado] || "status-oculta";
      return `<div class="admin-message-item" data-id="${a.id}" style="cursor:pointer;${a.estado === "archivada" ? "opacity:0.6" : ""}">
      <div class="ap-flex-row-between">
        <div class="ap-flex-1-min">
          <div class="ap-flex-row-center-sm">
            <strong class="ap-btn-text-light">${esc(a.titulo || a.solicitante || "(sin t\xEDtulo)")}</strong>
            <span class="admin-status-badge ${cls} ap-badge-sm">${TAS_ESTADO_MAP[a.estado] || a.estado}</span>
          </div>
          <div class="ap-label-small">
            ${a.solicitante ? `${esc(a.solicitante)} \xB7 ` : ""}
            ${a.tipo_propiedad ? esc(a.tipo_propiedad) + " \xB7 " : ""}
            ${a.barrio ? esc(a.barrio) + " \xB7 " : ""}
            ${a.superficie_cubierta ? a.superficie_cubierta + " m\xB2" : ""}
          </div>
          <div class="ap-label-dim">
            ${a.dormitorios ? a.dormitorios + " dorm" : ""}${a.banios ? " \xB7 " + a.banios + " ba\xF1os" : ""}
          </div>
          ${a.valor_estimado_usd ? `<div class="ap-link-accent">${_fmtUSD(a.valor_estimado_usd)}</div>` : ""}
        </div>
        <div class="ap-flex-shrink-right">
          <div class="ap-value-small">${a.updated_at ? window.formatDateShort(a.updated_at) : ""}</div>
          <div class="ap-hint-text">${a.total_comparables || 0} comp.</div>
        </div>
      </div>
    </div>`;
    }).join("");
    list.insertAdjacentHTML("afterend", _renderPagination());
  }
  function _renderPagination() {
    if (_tasacionPages <= 1) return "";
    const prevDisabled = _tasacionPage <= 1;
    const nextDisabled = _tasacionPage >= _tasacionPages;
    return `<div class="admin-pagination ap-flex-row-divider">
    <button class="btn btn-ghost" onclick="changeTasacionPage(${_tasacionPage - 1})" ${prevDisabled ? "disabled" : ""}>\u2190 Anterior</button>
    <span class="ap-body-text">P\xE1g. ${_tasacionPage} de ${_tasacionPages} (${_tasacionTotal} total)</span>
    <button class="btn btn-ghost" onclick="changeTasacionPage(${_tasacionPage + 1})" ${nextDisabled ? "disabled" : ""}>Siguiente \u2192</button>
  </div>`;
  }
  async function changeTasacionPage(page) {
    if (page < 1 || page > _tasacionPages) return;
    _tasacionPage = page;
    await loadTasaciones();
  }
  document.addEventListener("click", (e) => {
    const item = e.target.closest("#tasacionesAdminList .admin-message-item[data-id]");
    if (item) openTasacionPanel(parseInt(item.dataset.id));
  });
  function filterTasaciones() {
    _tasacionPage = 1;
    loadTasaciones();
  }
  async function loadTasaciones() {
    var _a, _b, _c, _d;
    const list = $("tasacionesAdminList");
    if (!list) return;
    list.innerHTML = '<div class="loading-state">Cargando tasaciones...</div>';
    try {
      const incluirArchivadas = ((_a = $("tasacionShowArchived")) == null ? void 0 : _a.checked) || false;
      const estadoFiltro = ((_b = $("tasacionFilter")) == null ? void 0 : _b.value) || "";
      const searchText = ((_d = (_c = $("tasacionSearch")) == null ? void 0 : _c.value) == null ? void 0 : _d.trim()) || "";
      const params = { page: _tasacionPage, per_page: 20 };
      if (incluirArchivadas) params.archivadas = "1";
      if (estadoFiltro) params.estado = estadoFiltro;
      if (searchText) params.search = searchText;
      const result = await API.getTasaciones(params);
      if (Array.isArray(result)) {
        _tasaciones = result;
        _tasacionPages = 1;
        _tasacionTotal = result.length;
      } else {
        _tasaciones = result.data || [];
        _tasacionPage = result.page || 1;
        _tasacionPages = result.pages || 1;
        _tasacionTotal = result.total || _tasaciones.length;
      }
      renderTasaciones();
      const stats = await API.getTasacionesStats();
      renderTasacionKpiBar(stats, $("tasKpiBar"));
      const sub = $("tasacionSubtitle");
      if (sub) {
        sub.textContent = `${stats.total} total \xB7 ${stats.borradores} borradores \xB7 ${stats.en_proceso} en proceso \xB7 ${stats.completadas} completadas \xB7 ${stats.archivadas} archivadas`;
      }
      $("sidebarTasacionesCount").textContent = stats.total;
    } catch (e) {
      list.innerHTML = '<div class="loading-state">Sin permisos para ver tasaciones.</div>';
    }
  }
  function showTasacionesList() {
    var _a;
    (_a = $("tasOverlay")) == null ? void 0 : _a.classList.add("show");
    $("tasacionesListView").classList.remove("hidden");
    $("tasacionDetailView").classList.add("hidden");
    _currentTasacion = null;
    loadTasaciones();
  }
  async function openTasacionDetail(id) {
    var _a, _b;
    console.log("[DEBUG TAS] openTasacionDetail called, id:", id);
    try {
      const a = await API.getTasacion(id);
      console.log("[DEBUG TAS] API response received, a?.id:", a == null ? void 0 : a.id, "a?.titulo:", a == null ? void 0 : a.titulo);
      _currentTasacion = a;
      console.log("[DEBUG TAS] _currentTasacion SET, checking:", !!_currentTasacion, _currentTasacion == null ? void 0 : _currentTasacion.id);
      _currentTasacion = null;
      (_a = $("tasOverlay")) == null ? void 0 : _a.classList.remove("show");
      (_b = $("apprOverlay")) == null ? void 0 : _b.classList.remove("show");
      $("tasacionesListView").classList.add("hidden");
      const dv = $("tasacionDetailView");
      dv.classList.remove("hidden");
      dv.innerHTML = renderTasacionDetail(a);
      dv.scrollTop = 0;
    } catch (e) {
      toast("Error al cargar tasaci\xF3n: " + e.message, "error");
    }
  }
  function renderTasacionDetail(a) {
    const isReadOnly = a.estado === "completada" || a.estado === "archivada";
    const hasComps = (a.comparables || []).length > 1 && a.superficie_cubierta > 0;
    const isCompleted = a.estado === "completada";
    const canDelete = (_currentUser == null ? void 0 : _currentUser.role) === "admin" || (_currentUser == null ? void 0 : _currentUser.role) === "editor";
    function roIcon() {
      return '<div class="acm-readonly-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>';
    }
    return `
    ${isReadOnly ? `
    <div class="acm-readonly-banner">
      ${roIcon()}
      <div class="ap-flex-1">
        <strong class="ap-error-emphasis">Modo lectura</strong>
        <p class="ap-label-inline">Esta tasaci\xF3n est\xE1 ${a.estado === "completada" ? "completada" : "archivada"}. Los datos son inmutables.</p>
      </div>
      ${isCompleted ? `<button class="btn btn-primary ap-btn-compact" id="tas_newVersionBtn">+ Nueva versi\xF3n</button>` : ""}
    </div>` : ""}
    <div class="admin-topbar">
      <div>
        <button class="btn btn-ghost ap-stack-sm" id="backToTasacionesList">\u2190 Volver</button>
        <h1 class="admin-page-title">${esc(a.titulo || a.solicitante || "Tasaci\xF3n #" + a.id)}</h1>
        <p class="admin-page-sub">${TAS_ESTADO_MAP[a.estado] || a.estado} \xB7 ${a.total_comparables || 0} comparables</p>
        ${a.appraisal_request_id ? `<p class="ap-link-underlined">
              Creada desde <a href="#" onclick="switchTab('tasacion-requests'); return false;" class="ap-link-hover">solicitud #${a.appraisal_request_id}</a>
            </p>` : ""}
      </div>
      <div class="ap-flex-wrap-sm">
        ${isReadOnly ? `<button class="btn btn-ghost" id="tas_restoreBtn" style="${a.estado === "archivada" ? "" : "display:none"}">Restaurar</button>
              <button class="btn btn-ghost" id="tas_reportBtn">PDF</button>
              <button class="btn btn-ghost" id="tas_exportCsvBtn">CSV</button>` : `<button class="btn btn-primary" id="tas_saveBtn">Guardar</button>
              ${hasComps && !isCompleted ? `<button class="btn btn-primary ap-surface-accent" id="tas_completarBtn">Guardar Valuaci\xF3n</button>` : ""}
              <button class="btn btn-ghost" id="tas_reportBtn">PDF</button>
              <button class="btn btn-ghost" id="tas_exportCsvBtn">CSV</button>
              <button class="btn btn-danger" id="tas_archiveBtn">Archivar</button>`}
        ${canDelete ? `<button class="btn btn-danger ap-delete-btn-bg" id="deleteTasacionBtn">Eliminar</button>` : ""}
      </div>
    </div>

    ${renderTasacionResults(a)}

    <div class="acm-pyramid">
      ${renderSection("Datos del cliente", [
      { label: "T\xEDtulo", id: "td_titulo", type: "text", val: a.titulo },
      { label: "Solicitante", id: "td_solicitante", type: "text", val: a.solicitante },
      { label: "Tel\xE9fono", id: "td_telefono", type: "text", val: a.telefono },
      { label: "Fecha", id: "td_fecha_tasacion", type: "date", val: a.fecha_tasacion },
      { label: "Destino", id: "td_destino", type: "select", val: a.destino, opts: TAS_DESTINOS },
      { label: "Estado", id: "td_estado", type: "select", val: a.estado, opts: [["borrador", "Borrador"], ["en_proceso", "En proceso"], ["completada", "Completada"]] }
    ], isReadOnly)}
      ${renderSection("Datos del inmueble", [
      { label: "Tipo", id: "td_tipo_propiedad", type: "select", val: a.tipo_propiedad, opts: TAS_TIPO_PROPS },
      { label: "Direcci\xF3n", id: "td_direccion", type: "text", val: a.direccion },
      { label: "Barrio", id: "td_barrio", type: "text", val: a.barrio },
      { label: "Localidad", id: "td_localidad", type: "text", val: a.localidad },
      { label: "Provincia", id: "td_provincia", type: "text", val: a.provincia },
      { label: "A\xF1o constr.", id: "td_anio_construccion", type: "number", val: a.anio_construccion },
      { label: "Sup. terreno m\xB2", id: "td_superficie_terreno", type: "number", val: a.superficie_terreno },
      { label: "Sup. cubierta m\xB2", id: "td_superficie_cubierta", type: "number", val: a.superficie_cubierta },
      { label: "Dormitorios", id: "td_dormitorios", type: "number", val: a.dormitorios },
      { label: "Ba\xF1os", id: "td_banios", type: "number", val: a.banios }
    ], isReadOnly)}
      ${renderSection("Construcci\xF3n", [
      { label: "Tipo construcci\xF3n", id: "td_tipo_construccion", type: "text", val: a.tipo_construccion },
      { label: "Tipo techo", id: "td_tipo_techo", type: "text", val: a.tipo_techo },
      { label: "Orientaci\xF3n", id: "td_orientacion", type: "text", val: a.orientacion },
      { label: "Luminosidad", id: "td_luminosidad", type: "select", val: a.luminosidad, opts: [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
      { label: "Cal. constructiva", id: "td_calidad_constructiva", type: "select", val: a.calidad_constructiva, opts: [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
      { label: "Cal. mantenimiento", id: "td_calidad_mantenimiento", type: "select", val: a.calidad_mantenimiento, opts: [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
      { label: "Terminaci\xF3n", id: "td_detalles_terminacion", type: "select", val: a.detalles_terminacion, opts: [["alto", "Alto"], ["medio", "Medio"], ["bajo", "Bajo"]] },
      { label: "Estado conservaci\xF3n", id: "td_estado_conservacion", type: "select", val: a.estado_conservacion, opts: [["excelente", "Excelente"], ["bueno", "Bueno"], ["regular", "Regular"], ["malo", "Malo"]] },
      { label: "Estacionamiento", id: "td_estacionamiento", type: "text", val: a.estacionamiento },
      { label: "Calefacci\xF3n", id: "td_calefaccion", type: "select", val: a.calefaccion, opts: [["central", "Central"], ["individual", "Individual"], ["", "Sin"]] },
      { label: "Agua caliente", id: "td_agua_caliente", type: "select", val: a.agua_caliente, opts: [["central", "Central"], ["individual", "Individual"], ["", "Sin"]] },
      { label: "Aire acond.", id: "td_aire_acondicionado", type: "select", val: a.aire_acondicionado, opts: [["central", "Central"], ["individual", "Individual"], ["", "Sin"]] },
      { label: "Vida remanente", id: "td_vida_remanente", type: "number", val: a.vida_remanente }
    ], isReadOnly)}
      ${renderSection("Referencias econ\xF3micas", [
      { label: "T/C USD", id: "td_tipo_cambio_usd", type: "number", val: a.tipo_cambio_usd },
      { label: "Valor UVA", id: "td_valor_uva", type: "number", val: a.valor_uva },
      { label: "Imp. inmob. mensual", id: "td_impuesto_inmobiliario_mensual", type: "number", val: a.impuesto_inmobiliario_mensual }
    ], isReadOnly)}
      ${renderSection("Comodidades", [
      { label: "Cocina", id: "td_tiene_cocina", type: "checkbox", val: a.tiene_cocina },
      { label: "Comedor", id: "td_tiene_comedor", type: "checkbox", val: a.tiene_comedor },
      { label: "Living", id: "td_tiene_living", type: "checkbox", val: a.tiene_living },
      { label: "Patio", id: "td_tiene_patio", type: "checkbox", val: a.tiene_patio },
      { label: "Terraza", id: "td_tiene_terraza", type: "checkbox", val: a.tiene_terraza },
      { label: "Balc\xF3n", id: "td_tiene_balcon", type: "checkbox", val: a.tiene_balcon },
      { label: "Lavadero", id: "td_tiene_lavadero", type: "checkbox", val: a.tiene_lavadero },
      { label: "Escritorio", id: "td_tiene_escritorio", type: "checkbox", val: a.tiene_escritorio },
      { label: "Suite", id: "td_tiene_suite", type: "checkbox", val: a.tiene_suite },
      { label: "Play room", id: "td_tiene_playroom", type: "checkbox", val: a.tiene_playroom },
      { label: "Asador", id: "td_tiene_asador", type: "checkbox", val: a.tiene_asador },
      { label: "Piscina", id: "td_tiene_piscina", type: "checkbox", val: a.tiene_piscina },
      { label: "Garage", id: "td_tiene_garage", type: "checkbox", val: a.tiene_garage }
    ], isReadOnly)}
      ${renderSection("Servicios", [
      { label: "Electricidad p\xFAblica", id: "td_tiene_electricidad_publica", type: "checkbox", val: a.tiene_electricidad_publica },
      { label: "Gas p\xFAblico", id: "td_tiene_gas_publico", type: "checkbox", val: a.tiene_gas_publico },
      { label: "Tel\xE9fono p\xFAblico", id: "td_tiene_telefono_publico", type: "checkbox", val: a.tiene_telefono_publico },
      { label: "Agua p\xFAblica", id: "td_tiene_agua_publica", type: "checkbox", val: a.tiene_agua_publica },
      { label: "Cloaca p\xFAblica", id: "td_tiene_cloaca_publica", type: "checkbox", val: a.tiene_cloaca_publica },
      { label: "Desag\xFCe pluvial", id: "td_tiene_desague_pluvial", type: "checkbox", val: a.tiene_desague_pluvial }
    ], isReadOnly)}
      ${renderSection("Descripci\xF3n del barrio", [
      { label: "Tipo barrio", id: "td_tipo_barrio", type: "select", val: a.tipo_barrio, opts: [["urbano", "Urbano"], ["suburbano", "Suburbano"], ["rural", "Rural"]] },
      { label: "Nivel construcci\xF3n", id: "td_nivel_construccion", type: "select", val: a.nivel_construccion, opts: [["mas_75", "M\xE1s del 75%"], ["50_75", "50-75%"], ["25_50", "25-50%"], ["menos_25", "Menos del 25%"]] },
      { label: "\xCDndice crecimiento", id: "td_indice_crecimiento", type: "select", val: a.indice_crecimiento, opts: [["en_crecimiento", "En crecimiento"], ["estable", "Estable"], ["en_declinacion", "En declinaci\xF3n"]] },
      { label: "Vigilancia", id: "td_vigilancia_barrio", type: "checkbox", val: a.vigilancia_barrio },
      { label: "Valores propiedad", id: "td_valores_propiedad", type: "select", val: a.valores_propiedad, opts: [["creciente", "Creciente"], ["estable", "Estable"], ["decreciente", "Decreciente"]] },
      { label: "Demanda / Oferta", id: "td_demanda_oferta", type: "select", val: a.demanda_oferta, opts: [["exceso_demanda", "Exceso Demanda"], ["equilibrio", "Equilibrio"], ["exceso_oferta", "Exceso Oferta"]] },
      { label: "Tiempo comercializaci\xF3n", id: "td_tiempo_comercializacion", type: "select", val: a.tiempo_comercializacion, opts: [["menos_3", "Menos 3 meses"], ["3_6", "3 a 6 meses"], ["mas_6", "M\xE1s de 6 meses"]] },
      { label: "% Residencial", id: "td_uso_residencial_pct", type: "number", val: a.uso_residencial_pct },
      { label: "% Comercial", id: "td_uso_comercial_pct", type: "number", val: a.uso_comercial_pct },
      { label: "% Industrial", id: "td_uso_industrial_pct", type: "number", val: a.uso_industrial_pct },
      { label: "Cambios uso terreno", id: "td_cambios_uso_terreno", type: "select", val: a.cambios_uso_terreno, opts: [["probable", "Probable"], ["improbable", "Improbable"]] },
      { label: "Facilidades estacionamiento", id: "td_facilidades_estacionamiento", type: "text", val: a.facilidades_estacionamiento },
      { label: "Tipolog\xEDas predominantes", id: "td_tipologias_predominantes", type: "text", val: a.tipologias_predominantes },
      { label: "Calidad constructiva barrio", id: "td_calidad_constructiva_barrio", type: "select", val: a.calidad_constructiva_barrio, opts: [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
      { label: "Construcci\xF3n altura", id: "td_construccion_altura", type: "text", val: a.construccion_altura },
      { label: "Uso comercial desc.", id: "td_uso_comercial_descripcion", type: "text", val: a.uso_comercial_descripcion },
      { label: "Uso industrial desc.", id: "td_uso_industrial_descripcion", type: "text", val: a.uso_industrial_descripcion },
      { label: "Nivel socioecon\xF3mico", id: "td_nivel_socioeconomico", type: "select", val: a.nivel_socioeconomico, opts: [["alto", "Alto"], ["medio_alto", "Medio Alto"], ["medio", "Medio"], ["medio_bajo", "Medio Bajo"], ["bajo", "Bajo"]] }
    ], isReadOnly)}
      ${renderSection("Observaciones", [
      { label: "", id: "td_observaciones", type: "textarea", val: a.observaciones }
    ], isReadOnly)}
    </div>

    <!-- COMPARABLES -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="tas-sec-comparables">
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('tas-sec-comparables')">
        <h4 class="acm-pyramid-section-title">Comparables (${(a.comparables || []).length})</h4>
        <span class="acm-pyramid-section-toggle">\u25BC</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div class="ap-actions-bar-right">
          ${isReadOnly ? "" : `<button class="btn btn-primary" id="tas_addComparableBtn">+ Agregar comparable</button>`}
        </div>
        <div id="tasComparables">${renderTasacionComparableCards(a)}</div>
      </div>
    </div>

    <!-- MAPA -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="tas-sec-ubicacion">
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('tas-sec-ubicacion')">
        <h4 class="acm-pyramid-section-title">Ubicaci\xF3n</h4>
        <span class="acm-pyramid-section-toggle">\u25BC</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div id="tasMapContainer" class="ap-map-container">
          <div class="ap-empty-state">Cargando mapa...</div>
        </div>
      </div>
    </div>

    <!-- VERSIONES -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="tas-sec-versiones">
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('tas-sec-versiones')">
        <h4 class="acm-pyramid-section-title">Versiones</h4>
        <span class="acm-pyramid-section-toggle">\u25BC</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div id="tasacionVersionsContainer" class="ap-stack-xl"><div class="loading-state ap-text-base">Cargando...</div></div>
      </div>
    </div>

    <!-- HISTORIAL -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="tas-sec-historial">
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('tas-sec-historial')">
        <h4 class="acm-pyramid-section-title">Historial de cambios</h4>
        <span class="acm-pyramid-section-toggle">\u25BC</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div id="tasacionLogsContainer" class="ap-stack-xl"><div class="loading-state ap-text-base">Cargando...</div></div>
      </div>
    </div>
  `;
  }
  var _tasMapInstance = null;
  var _tasMapMarkers = [];
  function _tasIcon(color, size) {
    return {
      html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      className: ""
    };
  }
  function _tasPopupContent(c2) {
    return `<div class="ap-text-block">
    <div class="ap-warning-label">C${c2.numero}</div>
    <div class="ap-text-dark">${esc(c2.direccion || "Sin direcci\xF3n")}</div>
    <hr class="ap-divider-light">
    <table class="ap-input-full">
      <tr><td class="ap-text-medium">Precio</td><td class="ap-label-right">USD ${c2.precio_usd ? c2.precio_usd.toLocaleString("es-AR") : "-"}</td></tr>
      ${c2.sup_cubierta ? `<tr><td class="ap-text-medium">Sup. cubierta</td><td class="ap-text-right">${c2.sup_cubierta} m\xB2</td></tr>` : ""}
      ${c2.precio_por_m2 ? `<tr><td class="ap-text-medium">Precio/m\xB2</td><td class="ap-text-right">USD ${Number(c2.precio_por_m2).toLocaleString("es-AR")}</td></tr>` : ""}
      ${c2.coeficiente_ajuste ? `<tr><td class="ap-text-medium">Coef. ajuste</td><td class="ap-text-right">${c2.coeficiente_ajuste}</td></tr>` : ""}
      ${c2.valor_m2_ajustado ? `<tr><td class="ap-text-medium">Valor/m\xB2 ajust.</td><td class="ap-brand-right">USD ${Number(c2.valor_m2_ajustado).toLocaleString("es-AR")}</td></tr>` : ""}
      ${c2.valor_ajustado ? `<tr><td class="ap-text-medium">Valor ajustado</td><td class="ap-brand-right">USD ${Number(c2.valor_ajustado).toLocaleString("es-AR")}</td></tr>` : ""}
    </table>
  </div>`;
  }
  function _tasSubjectPopup(a) {
    return `<div class="ap-text-block">
    <div class="ap-brand-label">${esc(a.titulo || "Inmueble tasado")}</div>
    <div class="ap-text-dark">${esc(a.direccion || "")}</div>
    <hr class="ap-divider-light">
    <table class="ap-input-full">
      ${a.superficie_cubierta ? `<tr><td class="ap-text-medium">Sup. cubierta</td><td class="ap-text-right">${a.superficie_cubierta} m\xB2</td></tr>` : ""}
      ${a.tipo_propiedad ? `<tr><td class="ap-text-medium">Tipo</td><td class="ap-text-right">${a.tipo_propiedad}</td></tr>` : ""}
      ${a.valor_estimado_usd ? `<tr><td class="ap-text-medium">Valor estimado</td><td class="ap-brand-right">USD ${a.valor_estimado_usd.toLocaleString("es-AR")}</td></tr>` : ""}
      ${a.precio_m2_promedio ? `<tr><td class="ap-text-medium">Precio/m\xB2 prom.</td><td class="ap-text-right">USD ${Number(a.precio_m2_promedio).toLocaleString("es-AR")}</td></tr>` : ""}
    </table>
  </div>`;
  }
  async function _tasInitMap(ctr) {
    const L = await loadLeaflet();
    const mapEl = document.createElement("div");
    mapEl.style.cssText = "width:100%;height:350px;border-radius:6px";
    ctr.innerHTML = "";
    ctr.appendChild(mapEl);
    await new Promise((r) => setTimeout(r, 0));
    const map = L.map(mapEl, { center: [-31.4201, -64.1888], zoom: 12, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18
    }).addTo(map);
    return map;
  }
  function _tasRenderMap(data) {
    const L = window.L;
    if (!L) return;
    const markers = [];
    const bounds = [];
    if (data.appraisal.lat && data.appraisal.lng) {
      const icon = L.divIcon(_tasIcon("#20b8ab", 22));
      const m = L.marker([data.appraisal.lat, data.appraisal.lng], { icon }).addTo(_tasMapInstance).bindPopup(_tasSubjectPopup(data.appraisal));
      markers.push(m);
      bounds.push([data.appraisal.lat, data.appraisal.lng]);
    }
    (data.comparables || []).forEach((c2) => {
      if (!c2.lat || !c2.lng) return;
      const icon = L.divIcon(_tasIcon("#e67e22", 16));
      const m = L.marker([c2.lat, c2.lng], { icon }).addTo(_tasMapInstance).bindPopup(_tasPopupContent(c2));
      markers.push(m);
      bounds.push([c2.lat, c2.lng]);
    });
    _tasMapMarkers = markers;
    if (bounds.length > 1) {
      _tasMapInstance.fitBounds(bounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
      _tasMapInstance.setView(bounds[0], 14);
    } else {
      _tasMapInstance.setView([-31.4201, -64.1888], 12);
    }
  }
  async function loadTasacionMap(aid) {
    const ctr = $("tasMapContainer");
    if (!ctr) return;
    try {
      const data = await _req("GET", `/api/tasaciones/${aid}/map-data`);
      const hasCoords = data.appraisal.lat && data.appraisal.lng || (data.comparables || []).some((c2) => c2.lat && c2.lng);
      if (!hasCoords) {
        ctr.innerHTML = '<div class="ap-empty-state-lg">No hay ubicaciones disponibles para visualizar.<br><span class="ap-text-sm">Complet\xE1 las direcciones de la tasaci\xF3n y los comparables.</span></div>';
        _tasMapInstance = null;
        return;
      }
      if (_tasMapInstance) {
        _tasMapMarkers.forEach((m) => _tasMapInstance.removeLayer(m));
        _tasMapInstance.remove();
        _tasMapInstance = null;
      }
      _tasMapInstance = await _tasInitMap(ctr);
      _tasRenderMap(data);
    } catch (e) {
      ctr.innerHTML = '<div class="ap-empty-state-lg">Error al cargar mapa: ' + esc(e.message || "") + "</div>";
      _tasMapInstance = null;
    }
  }
  async function refreshTasacionMap(aid) {
    if (!_tasMapInstance) {
      loadTasacionMap(aid);
      return;
    }
    try {
      const data = await _req("GET", `/api/tasaciones/${aid}/map-data`);
      _tasMapMarkers.forEach((m) => _tasMapInstance.removeLayer(m));
      _tasRenderMap(data);
    } catch (e) {
    }
  }
  function loadLeaflet() {
    return new Promise((resolve, reject) => {
      if (window.L) return resolve(window.L);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error("Leaflet load failed"));
      document.head.appendChild(script);
    });
  }
  function togglePyramidSection(id) {
    const sec = document.querySelector(`[data-section="${id}"]`);
    if (sec) sec.classList.toggle("collapsed");
  }
  function renderSection(title, fields, disabled) {
    const id = "tas-sec-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const isCheckbox = fields.length > 0 && fields.every((f) => f.type === "checkbox");
    if (isCheckbox) {
      const checkedCount = fields.filter((f) => f.val).length;
      const countLabel = checkedCount > 0 ? ` <span class="ap-metric-number">(${checkedCount})</span>` : "";
      const rows2 = fields.map((f) => {
        const chk = f.val ? "checked" : "";
        const dis = disabled ? "disabled" : "";
        const cls = `acm-chip${disabled ? " acm-chip--disabled" : ""}`;
        return `<label class="${cls}">
        <input type="checkbox" class="acm-chip-input" id="${f.id}" ${chk} ${dis}>
        <span class="acm-chip-visual">
          <span class="acm-chip-box">
            <svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span class="acm-chip-text">${f.label}</span>
        </span>
      </label>`;
      }).join("");
      return `<div class="acm-pyramid-section" data-section="${id}">
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('${id}')">
        <h4 class="acm-pyramid-section-title">${title}${countLabel}</h4>
        <span class="acm-pyramid-section-toggle">\u25BC</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div class="acm-pyramid-checkbox-grid">${rows2}</div>
      </div>
    </div>`;
    }
    const rows = fields.map((f) => {
      if (f.type === "textarea") {
        return `<div class="field acm-pyramid-full"><label class="field-label">${f.label}</label>
        <textarea id="${f.id}" class="field-input" rows="3" ${disabled ? "disabled" : ""}>${esc(f.val || "")}</textarea></div>`;
      }
      if (f.type === "checkbox") {
        const chk = f.val ? "checked" : "";
        const dis = disabled ? "disabled" : "";
        const cls = `acm-chip${disabled ? " acm-chip--disabled" : ""}`;
        return `<label class="${cls} ap-stack-md">
        <input type="checkbox" class="acm-chip-input" id="${f.id}" ${chk} ${dis}>
        <span class="acm-chip-visual">
          <span class="acm-chip-box">
            <svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span class="acm-chip-text">${f.label}</span>
        </span>
      </label>`;
      }
      if (f.type === "select") {
        return `<div class="field"><label class="field-label">${f.label}</label>
        <select id="${f.id}" class="field-input field-input--select" ${disabled ? "disabled" : ""}>${_sel("", f.val, f.opts)}</select></div>`;
      }
      return `<div class="field"><label class="field-label">${f.label}</label>
      <input id="${f.id}" class="field-input" type="${f.type}" value="${_tf(f.val)}" ${disabled ? "disabled" : ""} ${f.type === "number" ? 'step="any"' : ""}/></div>`;
    }).join("");
    return `<div class="acm-pyramid-section" data-section="${id}">
    <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('${id}')">
      <h4 class="acm-pyramid-section-title">${title}</h4>
      <span class="acm-pyramid-section-toggle">\u25BC</span>
    </button>
    <div class="acm-pyramid-section-body">
      <div class="acm-pyramid-grid">${rows}</div>
    </div>
  </div>`;
  }
  function renderBarChart(comps) {
    const ajustados = [];
    const labels = [];
    comps.forEach((c2) => {
      const ajustado = _ajustado(c2);
      if (ajustado !== null) {
        ajustados.push(ajustado);
        labels.push("C" + c2.numero);
      }
    });
    if (!ajustados.length) return "";
    const maxVal = Math.max(...ajustados);
    const prom = ajustados.reduce((a, b) => a + b, 0) / ajustados.length;
    return `<div class="ap-detail-card">
    <div class="ap-overline">$/m\xB2 ajustado por comparable</div>
    ${ajustados.map(
      (v, i) => `<div class="ap-flex-row-tag">
        <span class="ap-icon-col">${labels[i]}</span>
        <div class="ap-progress-track">
          <div style="height:100%;width:${(v / maxVal * 100).toFixed(0)}%;background:${v === prom ? "var(--admin-primary)" : v > prom ? "rgba(32,184,171,0.6)" : "rgba(32,184,171,0.3)"};border-radius:3px"></div>
        </div>
        <span class="ap-number-col">${_fmtUSD(v)}</span>
      </div>`
    ).join("")}
  </div>`;
  }
  function renderTasacionResults(a) {
    const hasVal = a.valor_estimado_usd != null;
    const comps = a.comparables || [];
    return `<div id="tasResults" class="ap-hero-card">
    <h4 class="ap-section-label">Resultados de la valuaci\xF3n</h4>
    ${hasVal ? `
    <div class="ap-two-col-grid">
      <div class="ap-auto-grid">
        <div><div class="ap-label-muted">Valor Estimado</div>
          <div class="ap-value-xl">${_fmtUSD(a.valor_estimado_usd)}</div></div>
        <div><div class="ap-label-muted">En Pesos</div>
          <div class="ap-value-lg">${_fmtARS(a.valor_estimado_ars)}</div></div>
        <div><div class="ap-label-muted">En UVAs</div>
          <div class="ap-value-lg">${_fmtUVA(a.valor_estimado_uvas)}</div></div>
        <div><div class="ap-label-muted">Precio/m\xB2 prom.</div>
          <div class="ap-value-lg">${_fmtUSD(a.precio_m2_promedio)}</div></div>
        <div><div class="ap-label-muted">Rango m\xB2</div>
          <div class="ap-value-md">${_fmtUSD(a.precio_m2_minimo)} \u2013 ${_fmtUSD(a.precio_m2_maximo)}</div></div>
        <div><div class="ap-label-muted">Dispersi\xF3n</div>
          <div class="ap-value-lg">${a.dispersion_pct != null ? a.dispersion_pct + "%" : "\u2014"}</div></div>
        <div><div class="ap-label-muted">Coef. promedio</div>
          <div class="ap-value-lg">${a.coeficiente_promedio || "\u2014"}</div></div>
        <div><div class="ap-label-muted">Comparables</div>
          <div class="ap-value-lg">${a.total_comparables || 0}</div></div>
      </div>
      ${renderBarChart(comps)}
    </div>` : `
    <div class="ap-empty-row">
      Carg\xE1 comparables y superficie cubierta para ver la valuaci\xF3n.
    </div>`}
  </div>`;
  }
  function renderTasacionComparableCards(a) {
    return renderComparableCardsShared(a, { prefix: "tas-", getTipoFn: getCurrentTasacionType });
  }
  document.addEventListener("click", (e) => {
    const tasTab = $("tabTasaciones");
    if (!tasTab || tasTab.classList.contains("hidden")) return;
    const editBtn = e.target.closest(".tas-editComparableBtn");
    if (editBtn) openTasacionComparableForm(parseInt(editBtn.dataset.aid), parseInt(editBtn.dataset.cid));
    const delBtn = e.target.closest(".tas-deleteComparableBtn");
    if (delBtn) confirmDeleteTasacionComparable(parseInt(delBtn.dataset.aid), parseInt(delBtn.dataset.cid));
    const toggleBtn = e.target.closest(".tas-toggleExclusionBtn");
    if (toggleBtn) toggleTasacionComparableExclusion(parseInt(toggleBtn.dataset.aid), parseInt(toggleBtn.dataset.cid));
  });
  function _tasRecalcLive() {
    var _a, _b, _c;
    const a = _currentTasacion;
    if (!a) return;
    const cont = $("tasResults");
    if (!cont) return;
    const sc = parseFloat((_a = $("td_superficie_cubierta")) == null ? void 0 : _a.value) || 0;
    const tc = parseFloat((_b = $("td_tipo_cambio_usd")) == null ? void 0 : _b.value) || 1;
    const uva = parseFloat((_c = $("td_valor_uva")) == null ? void 0 : _c.value) || 1;
    const comps = a.comparables || [];
    if (!comps.length || !sc) {
      cont.innerHTML = '<h4 class="ap-section-overline">Resultados de la valuaci\xF3n</h4><div class="ap-empty-row-light">Carg\xE1 comparables y superficie cubierta para ver la valuaci\xF3n.</div>';
      return;
    }
    const ajustados = [];
    const coefs = [];
    const labels = [];
    comps.forEach((c2) => {
      const coef = _calcCoef(c2);
      const ajustado = _ajustado(c2);
      if (ajustado !== null) {
        ajustados.push(ajustado);
        coefs.push(coef);
        labels.push("C" + c2.numero);
      }
    });
    if (!ajustados.length) {
      cont.innerHTML = '<h4 class="ap-section-overline">Resultados de la valuaci\xF3n</h4><div class="ap-empty-row-light">Complet\xE1 precio y superficie en los comparables.</div>';
      return;
    }
    const prom = ajustados.reduce((a2, b) => a2 + b, 0) / ajustados.length;
    const mini = Math.min(...ajustados);
    const maxi = Math.max(...ajustados);
    const dispersion = ajustados.length > 1 && prom ? Math.round(stDev(ajustados) / prom * 1e3) / 10 : 0;
    const coef_prom = Math.round(coefs.reduce((a2, b) => a2 + b, 0) / coefs.length * 1e4) / 1e4;
    const valor_usd = Math.round(sc * prom * 100) / 100;
    const valor_ars = Math.round(valor_usd * tc * 100) / 100;
    const valor_uvas = Math.round(valor_ars / uva * 100) / 100;
    const maxVal = Math.max(...ajustados);
    const barChart = ajustados.map(
      (v, i) => `<div class="ap-flex-row-tag">
      <span class="ap-icon-col-muted">${labels[i]}</span>
      <div class="ap-progress-fill">
        <div style="height:100%;width:${(v / maxVal * 100).toFixed(0)}%;background:${v === prom ? "var(--accent)" : v > prom ? "rgba(32,184,171,0.6)" : "rgba(32,184,171,0.3)"};border-radius:3px;transition:width .3s"></div>
      </div>
      <span class="ap-number-col-muted">${_fmtUSD(v)}</span>
    </div>`
    ).join("");
    cont.innerHTML = `
    <div class="ap-flex-row-between-md">
      <h4 class="ap-overline-accent">Resultados de la valuaci\xF3n</h4>
    </div>
    <div class="ap-two-col-grid">
      <div class="ap-auto-grid">
        <div><div class="ap-text-muted-light">Valor Estimado</div>
          <div class="ap-value-xl-light">${_fmtUSD(valor_usd)}</div></div>
        <div><div class="ap-text-muted-light">En Pesos</div>
          <div class="ap-value-lg-light">${_fmtARS(valor_ars)}</div></div>
        <div><div class="ap-text-muted-light">En UVAs</div>
          <div class="ap-value-lg-light">${_fmtUVA(valor_uvas)}</div></div>
        <div><div class="ap-text-muted-light">Precio/m\xB2 prom.</div>
          <div class="ap-value-lg-light">${_fmtUSD(prom)}</div></div>
        <div><div class="ap-text-muted-light">Rango m\xB2</div>
          <div class="ap-value-md-light">${_fmtUSD(mini)} \u2013 ${_fmtUSD(maxi)}</div></div>
        <div><div class="ap-text-muted-light">Dispersi\xF3n</div>
          <div class="ap-value-lg-light">${dispersion}%</div></div>
        <div><div class="ap-text-muted-light">Coef. promedio</div>
          <div class="ap-value-lg-light">${coef_prom}</div></div>
        <div><div class="ap-text-muted-light">Comparables</div>
          <div class="ap-value-lg-light">${comps.length}</div></div>
      </div>
      <div class="ap-info-card">
        <div class="ap-overline-card">$/m\xB2 ajustado por comparable</div>
        ${barChart}
      </div>
    </div>`;
  }
  async function saveTasacionDetail(id) {
    const prefix = "td_";
    const fields = document.querySelectorAll("#tasacionDetailView [id]");
    const data = {};
    fields.forEach((el) => {
      if (!el.id.startsWith(prefix)) return;
      const key = el.id.slice(prefix.length);
      if (el.type === "checkbox") {
        data[key] = el.checked;
      } else if (el.type === "number") {
        data[key] = el.value !== "" ? parseFloat(el.value) : null;
      } else {
        data[key] = el.value;
      }
    });
    try {
      const saved = await API.updateTasacion(id, data);
      _currentTasacion = saved;
      const dv = $("tasacionDetailView");
      dv.innerHTML = renderTasacionDetail(saved);
      dv.scrollTop = 0;
      loadTasaciones();
    } catch (e) {
      toast("Error al guardar: " + e.message, "error");
    }
  }
  async function archiveTasacion(id) {
    if (!await confirmModal("\xBFArchivar esta tasaci\xF3n? Se puede restaurar despu\xE9s.")) return;
    try {
      await API.archiveTasacion(id);
      showTasacionesList();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function deleteTasacion(id) {
    if (!await confirmModal("\xBFEliminar esta tasaci\xF3n DEFINITIVAMENTE? No se puede deshacer.")) return;
    try {
      await API.deleteTasacion(id);
      showTasacionesList();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function restoreTasacion(id) {
    if (!await confirmModal("\xBFRestaurar esta tasaci\xF3n?")) return;
    try {
      const saved = await API.restoreTasacion(id);
      _currentTasacion = saved;
      const dv = $("tasacionDetailView");
      dv.innerHTML = renderTasacionDetail(saved);
      loadTasaciones();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function openTasacionReport(id) {
    window.open(`/api/tasaciones/${id}/report`, "_blank");
  }
  function exportTasacionCsv(id) {
    window.open(`/api/tasaciones/${id}/csv`, "_blank");
  }
  async function loadTasacionLogs(aid) {
    const container = $("tasacionLogsContainer");
    if (!container) return;
    try {
      const logs = await API.getTasacionLogs(aid);
      if (!logs.length) {
        container.innerHTML = '<div class="ap-empty-card-sm">Sin cambios registrados.</div>';
        return;
      }
      container.innerHTML = '<div class="ap-scroll-area">' + logs.map(
        (l) => `<div class="ap-table-row">
        <span class="ap-label-nowrap">${l.created_at ? new Date(l.created_at).toLocaleString() : ""}</span>
        <span class="admin-status-badge status-oculta ap-badge-tiny">${l.accion}</span>
        <span class="ap-text-secondary">${esc(l.descripcion)}</span>
      </div>`
      ).join("") + "</div>";
    } catch (e) {
      container.innerHTML = '<div class="ap-label-dim-sm">Error al cargar historial.</div>';
    }
  }
  async function loadTasacionVersions(aid) {
    const container = $("tasacionVersionsContainer");
    if (!container) return;
    try {
      const versions = await API.getTasacionVersions(aid);
      if (!versions.length) {
        container.innerHTML = '<div class="ap-empty-card-sm">Sin versiones guardadas.</div>';
        return;
      }
      container.innerHTML = versions.map(
        (v, i) => `<div class="ap-flex-row-list-item">
        <span class="admin-status-badge status-vendida ap-badge-compact">v${v.version}</span>
        <span class="ap-text-fill">${v.created_at ? new Date(v.created_at).toLocaleString() : ""}</span>
        <span class="ap-label-dim">${v.created_by || "\u2014"}</span>
        <span class="ap-label-dim">${v.has_snapshot ? "\u2713 Snapshot" : "\u2014"}</span>
        <button class="btn btn-ghost btn-sm viewVersionBtn ap-badge-compact" data-version="${v.version}">Ver</button>
        ${i < versions.length - 1 ? `<button class="btn btn-ghost btn-sm diffVersionBtn ap-badge-compact" data-va="${versions[i + 1].version}" data-vb="${v.version}" title="Comparar con v${versions[i + 1].version}">\u21C4</button>` : ""}
      </div>`
      ).join("");
      container.querySelectorAll(".viewVersionBtn").forEach((btn) => {
        btn.addEventListener("click", () => viewTasacionVersion(parseInt(btn.dataset.version)));
      });
      container.querySelectorAll(".diffVersionBtn").forEach((btn) => {
        btn.addEventListener("click", () => compareTasacionVersions(parseInt(btn.dataset.va), parseInt(btn.dataset.vb)));
      });
    } catch (e) {
      container.innerHTML = '<div class="ap-label-dim-sm">Error al cargar versiones.</div>';
    }
  }
  async function createNewTasacionVersion(aid) {
    if (!confirm("\xBFCrear una nueva versi\xF3n? La tasaci\xF3n se desbloquear\xE1 para edici\xF3n.")) return;
    try {
      await API.createNewTasacionVersion(aid);
      toast("Nueva versi\xF3n creada. Tasaci\xF3n desbloqueada.", "success");
      openTasacionDetail(aid);
    } catch (e) {
      toast("Error al crear versi\xF3n: " + e.message, "error");
    }
  }
  async function viewTasacionVersion(version) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const a = _currentTasacion;
    if (!a) return;
    try {
      const data = await API.getTasacionVersion(a.id, version);
      const s = data.snapshot;
      if (!s) {
        toast("Snapshot no disponible", "error");
        return;
      }
      const html = `
    <div class="ap-section-card">
      <div class="ap-flex-row-between-md">
        <h4 class="ap-btn-text-emphasis">Versi\xF3n v${version} \xB7 ${s.generated_at ? new Date(s.generated_at).toLocaleString() : ""}</h4>
        <button class="btn btn-ghost btn-sm ap-text-sm" id="closeVersionPreview">Cerrar</button>
      </div>
      <div class="ap-two-col-grid-md">
        <div class="ap-chip-card">
          <div class="ap-overline-tight">Sujeto</div>
          <div class="ap-label-soft">${esc(((_a = s.appraisal) == null ? void 0 : _a.direccion) || ((_b = s.appraisal) == null ? void 0 : _b.solicitante) || "\u2014")}</div>
          <div class="ap-label-soft">Sup. cubierta: ${((_c = s.appraisal) == null ? void 0 : _c.superficie_cubierta) || "\u2014"} m\xB2</div>
          <div class="ap-label-soft">T/C: USD ${((_d = s.appraisal) == null ? void 0 : _d.tipo_cambio_usd) || "\u2014"} \xB7 UVA: ${((_e = s.appraisal) == null ? void 0 : _e.valor_uva) || "\u2014"}</div>
        </div>
        <div class="ap-chip-card">
          <div class="ap-overline-tight">Resultados</div>
          <div class="ap-link-accent-sm">Valor estimado: USD ${(((_f = s.appraisal) == null ? void 0 : _f.valor_estimado_usd) || 0).toLocaleString("es-AR")}</div>
          <div class="ap-label-soft">Precio/m\xB2 prom.: USD ${Number(((_g = s.appraisal) == null ? void 0 : _g.precio_m2_promedio) || 0).toLocaleString("es-AR")}</div>
          <div class="ap-label-soft">Coef. promedio: ${((_h = s.appraisal) == null ? void 0 : _h.coeficiente_promedio) || "\u2014"}</div>
        </div>
      </div>
      <div class="ap-stack-top-base">
        <div class="ap-overline-section">Comparables (${(s.comparables || []).length})</div>
        ${(s.comparables || []).map(
        (c2) => `<div class="ap-tag-row">
            <span class="ap-btn-text-white">C${c2.numero}</span>
            <span class="ap-text-secondary">${esc(c2.calle || "")} ${esc(c2.numero_calle || "")}</span>
            <span class="ap-text-accent">USD ${(c2.precio_usd || 0).toLocaleString("es-AR")}</span>
            <span class="ap-text-dim">${c2.superficie_cubierta || "\u2014"} m\xB2</span>
            <span class="ap-text-soft">Coef: ${c2.coeficiente_ajuste || "\u2014"}</span>
            <span class="ap-text-soft">Ajust: USD ${(c2.valor_m2_ajustado || 0).toLocaleString("es-AR")}/m\xB2</span>
          </div>`
      ).join("")}
      </div>
    </div>`;
      const container = $("tasacionVersionsContainer");
      container.insertAdjacentHTML("beforebegin", html);
      (_i = $("closeVersionPreview")) == null ? void 0 : _i.addEventListener("click", () => {
        const el = container.previousElementSibling;
        if (el && el.id !== "tasacionVersionsContainer") el.remove();
      });
    } catch (e) {
      toast("Error al cargar versi\xF3n: " + e.message, "error");
    }
  }
  async function compareTasacionVersions(va, vb) {
    var _a;
    const a = _currentTasacion;
    if (!a) return;
    try {
      const data = await _req("GET", `/api/tasaciones/${a.id}/versions/${va}/compare/${vb}`);
      const changes = data.appraisal_changes || [];
      const compChanges = data.comparable_changes || [];
      if (!changes.length && !compChanges.length) {
        toast("No hay diferencias entre estas versiones.", "info");
        return;
      }
      const fieldLabels = {
        valor_estimado_usd: "Valor estimado USD",
        titulo: "T\xEDtulo",
        direccion: "Direcci\xF3n",
        tipo_propiedad: "Tipo propiedad",
        superficie_cubierta: "Sup. cubierta",
        precio_m2_promedio: "$/m\xB2 prom.",
        coeficiente_promedio: "Coef. promedio",
        dispersion_pct: "Dispersi\xF3n",
        tipo_cambio_usd: "T/C USD",
        valor_uva: "UVA",
        solicitante: "Solicitante",
        destino: "Destino"
      };
      const fmt = (v) => v == null ? "\u2014" : typeof v === "number" && v > 100 ? v.toLocaleString("es-AR") : String(v);
      let html = `<div class="ap-section-card">
      <div class="ap-flex-row-between-md">
        <h4 class="ap-btn-text-emphasis">Diff v${va} \u2192 v${vb}</h4>
        <button class="btn btn-ghost btn-sm ap-text-sm" id="closeVersionDiff">Cerrar</button>
      </div>`;
      if (changes.length) {
        html += `<div class="ap-stack-base">
        <div class="ap-overline-section">Cambios en la tasaci\xF3n</div>
        <table class="ap-table-full">
          <tr class="ap-overline-tiny">
            <th class="ap-table-cell-left">Campo</th>
            <th class="ap-table-cell-left">v${va}</th>
            <th class="ap-table-cell-left">v${vb}</th>
          </tr>
          ${changes.map((c2) => `<tr>
            <td class="ap-table-cell-muted">${fieldLabels[c2.field] || c2.field}</td>
            <td class="ap-table-cell-dim">${fmt(c2.from)}</td>
            <td class="ap-table-cell-accent">${fmt(c2.to)}</td>
          </tr>`).join("")}
        </table>
      </div>`;
      }
      if (compChanges.length) {
        html += `<div>
        <div class="ap-overline-section">Cambios en comparables</div>
        <table class="ap-table-full">
          <tr class="ap-overline-tiny">
            <th class="ap-table-cell-left">Comp.</th>
            <th class="ap-table-cell-left">Campo</th>
            <th class="ap-table-cell-left">v${va}</th>
            <th class="ap-table-cell-left">v${vb}</th>
          </tr>
          ${compChanges.map((c2) => {
          const isAdd = c2.field === "__added__";
          const isDel = c2.field === "__removed__";
          return `<tr style="${isAdd ? "background:rgba(39,174,96,0.08)" : isDel ? "background:rgba(231,76,60,0.08)" : ""}">
              <td class="ap-table-cell-bold">C${c2.numero}</td>
              <td class="ap-table-cell-soft">${isAdd ? "\u2795 Agregado" : isDel ? "\u2796 Eliminado" : c2.field}</td>
              <td class="ap-table-cell-dim">${fmt(c2.from)}</td>
              <td style="padding:4px 8px;border-bottom:1px solid var(--bg2);color:${isAdd ? "var(--accent)" : isDel ? "#e74c3c" : "var(--accent)"}">${fmt(c2.to)}</td>
            </tr>`;
        }).join("")}
        </table>
      </div>`;
      }
      html += "</div>";
      const container = $("tasacionVersionsContainer");
      container.insertAdjacentHTML("beforebegin", html);
      (_a = $("closeVersionDiff")) == null ? void 0 : _a.addEventListener("click", () => {
        const el = container.previousElementSibling;
        if (el && el.id !== "tasacionVersionsContainer") el.remove();
      });
    } catch (e) {
      toast("Error al comparar versiones: " + e.message, "error");
    }
  }
  function openTasacionForm(id) {
    $("tasacionFormTitle").textContent = "Nueva tasaci\xF3n";
    $("tasacionFormContent").innerHTML = `
    <div class="pf-body ap-flex-col">
      <div class="ap-two-col-grid-sm">
        <div class="field ap-full-width"><label class="field-label">T\xEDtulo / Referencia</label>
          <input id="tqf_titulo" class="field-input" placeholder="Ej: BARRIO YAPEYU"/></div>
      </div>
      <div class="ap-two-col-grid-sm">
        <div class="field"><label class="field-label">Solicitante</label>
          <input id="tqf_solicitante" class="field-input" placeholder="Nombre del cliente"/></div>
        <div class="field"><label class="field-label">Tel\xE9fono</label>
          <input id="tqf_telefono" class="field-input" placeholder="Tel\xE9fono"/></div>
      </div>
      <div class="ap-two-col-grid-sm">
        <div class="field"><label class="field-label">Tipo propiedad</label>
          <select id="tqf_tipo_propiedad" class="field-input field-input--select">${_sel("", "casa", TAS_TIPO_PROPS)}</select></div>
        <div class="field"><label class="field-label">Direcci\xF3n</label>
          <input id="tqf_direccion" class="field-input" placeholder="Calle y n\xFAmero"/></div>
      </div>
      <div class="ap-two-col-grid-sm">
        <div class="field"><label class="field-label">Barrio</label>
          <input id="tqf_barrio" class="field-input" placeholder="Barrio"/></div>
        <div class="field"><label class="field-label">Destino</label>
          <select id="tqf_destino" class="field-input field-input--select">${_sel("", "venta", TAS_DESTINOS)}</select></div>
      </div>
      <div class="pf-actions ap-stack-top-sm">
        <button class="btn btn-primary btn-full" id="quickSaveBtn">Crear tasaci\xF3n</button>
        <button class="btn btn-ghost" id="tqfCancelBtn" type="button">Cancelar</button>
      </div>
    </div>`;
    $("tasacionFormModal").classList.remove("hidden");
    $("quickSaveBtn").onclick = () => quickSaveTasacion();
    $("tqfCancelBtn").onclick = closeTasacionForm;
  }
  function closeTasacionForm() {
    $("tasacionFormModal").classList.add("hidden");
  }
  async function quickSaveTasacion() {
    const data = {
      titulo: $("tqf_titulo").value.trim(),
      solicitante: $("tqf_solicitante").value.trim(),
      telefono: $("tqf_telefono").value.trim(),
      tipo_propiedad: $("tqf_tipo_propiedad").value,
      direccion: $("tqf_direccion").value.trim(),
      barrio: $("tqf_barrio").value.trim(),
      destino: $("tqf_destino").value,
      estado: "borrador"
    };
    if (!data.titulo && !data.solicitante) {
      toast("Ingres\xE1 al menos un t\xEDtulo o un solicitante.", "warn");
      return;
    }
    try {
      const saved = await API.createTasacion(data);
      closeTasacionForm();
      openTasacionDetail(saved.id);
      loadTasaciones();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function openTasacionComparableForm(aid, cid) {
    console.log("[DEBUG TAS] openTasacionComparableForm called, aid:", aid, "cid:", cid);
    console.log("[DEBUG TAS] _currentTasacion value:", !!_currentTasacion, _currentTasacion == null ? void 0 : _currentTasacion.id);
    const a = _currentTasacion;
    if (!a) {
      toast == null ? void 0 : toast("No se pudo cargar la tasaci\xF3n. Recarg\xE1 la p\xE1gina e intent\xE1 de nuevo.");
      return;
    }
    const c2 = cid ? ((a == null ? void 0 : a.comparables) || []).find((x) => x.id === cid) : null;
    $("comparableFormTitle").textContent = c2 ? "Editar comparable C" + c2.numero : "Nuevo comparable";
    const v = (field2, def) => {
      var _a, _b;
      return c2 != null ? (_b = (_a = c2[field2]) != null ? _a : def) != null ? _b : "" : def != null ? def : "";
    };
    const vn = (field2, def) => {
      var _a, _b;
      return c2 != null ? (_b = (_a = c2[field2]) != null ? _a : def) != null ? _b : 0 : def != null ? def : 0;
    };
    const sel = (field2, opts) => _sel("", v(field2), opts);
    const attrLabel = (val) => val === "superior" ? "\u2191 Superior" : val === "inferior" ? "\u2193 Inferior" : "= Equivalente";
    const btnStyle = (val, current, field2) => `style="background:${val === current ? val === "superior" ? "var(--accent)" : val === "inferior" ? "#e74c3c" : "var(--admin-bg)" : "transparent"};color:${val === current ? "#fff" : "var(--g3)"};border:1px solid ${val === current ? "transparent" : "var(--b)"};border-radius:4px;padding:3px 8px;font-size:10px;font-weight:${val === current ? "600" : "400"};cursor:pointer;transition:all .15s" data-field="${field2}" data-value="${val}"`;
    const manualToggle = (field2, label) => {
      const val = v(field2, "equivalente");
      return `<div class="ap-compact-card">
      <div class="ap-label-with-space">${label}</div>
      <div class="ap-flex-row-tight attr-toggle" data-field="${field2}">
        <button type="button" ${btnStyle("superior", val, field2)}>\u2191 Superior</button>
        <button type="button" ${btnStyle("equivalente", val, field2)}>= Equivalente</button>
        <button type="button" ${btnStyle("inferior", val, field2)}>\u2193 Inferior</button>
      </div>
      <select id="cf_${field2}" class="field-input field-input--select ap-hidden">${[["superior", "Superior"], ["equivalente", "Equivalente"], ["inferior", "Inferior"]].map((o) => `<option value="${o[0]}"${val === o[0] ? " selected" : ""}>${o[1]}</option>`).join("")}</select>
    </div>`;
    };
    const autoBadge = (id, label) => {
      const val = v(id, "equivalente");
      const icon = val === "superior" ? "\u2191" : val === "inferior" ? "\u2193" : "=";
      const clr = val === "superior" ? "var(--accent)" : val === "inferior" ? "#e74c3c" : "var(--g3)";
      return `<div class="ap-compact-card-center">
      <div class="ap-label-compact">${label}</div>
      <div style="font-size:13px;font-weight:700;color:${clr}">${icon} ${val === "superior" ? "Superior" : val === "inferior" ? "Inferior" : "Equivalente"}</div>
      <div class="ap-hint-tiny">autom\xE1tico</div>
    </div>`;
    };
    const tipo = a.tipo_propiedad || "casa";
    const attrs = getTypeAttrs(tipo);
    $("comparableFormContent").innerHTML = `
    <div class="pf-body ap-two-col-grid-wide">
      <div class="field ap-full-width"><label class="field-label">Calle</label>
        <input id="cf_calle" class="field-input" value="${esc(v("calle"))}" placeholder="Calle"/></div>
      <div class="field"><label class="field-label">N\xFAmero</label>
        <input id="cf_numero_calle" class="field-input" value="${esc(v("numero_calle"))}"/></div>
      <div class="field"><label class="field-label">Piso / Depto</label>
        <input id="cf_piso_depto" class="field-input" value="${esc(v("piso_depto"))}"/></div>
      <div class="field"><label class="field-label">Barrio</label>
        <input id="cf_barrio" class="field-input" value="${esc(v("barrio"))}"/></div>
      <div class="field"><label class="field-label">Localidad</label>
        <input id="cf_localidad" class="field-input" value="${esc(v("localidad"))}"/></div>
      <div class="field"><label class="field-label">Tipo operaci\xF3n</label>
        <select id="cf_tipo_operacion" class="field-input field-input--select">${sel("tipo_operacion", [["cotizacion", "Cotizaci\xF3n"], ["venta", "Venta"]])}</select></div>
      <div class="field"><label class="field-label">Precio USD</label>
        <input id="cf_precio_usd" class="field-input" type="number" value="${v("precio_usd", 0)}"/></div>
      <div class="field"><label class="field-label">Precio ARS</label>
        <input id="cf_precio_ars" class="field-input" type="number" value="${v("precio_ars", 0)}"/></div>
      <div class="field"><label class="field-label">Sup. cubierta m\xB2</label>
        <input id="cf_superficie_cubierta" class="field-input" type="number" value="${v("superficie_cubierta", 0)}"/></div>
      <div class="field"><label class="field-label">Sup. terreno m\xB2</label>
        <input id="cf_superficie_terreno" class="field-input" type="number" value="${v("superficie_terreno", 0)}"/></div>
      <div class="field"><label class="field-label">Dormitorios</label>
        <input id="cf_dormitorios" class="field-input" type="number" value="${vn("dormitorios", 0)}"/></div>
      <div class="field"><label class="field-label">Ba\xF1os</label>
        <input id="cf_banios" class="field-input" type="number" value="${vn("banios", 0)}" step="0.5"/></div>
      <div class="field"><label class="field-label">Tipo propiedad</label>
        <select id="cf_tipo_propiedad" class="field-input field-input--select">${sel("tipo_propiedad", TAS_TIPO_PROPS)}</select></div>
      <div class="field"><label class="field-label">A\xF1o constr.</label>
        <input id="cf_anio_construccion" class="field-input" type="number" value="${v("anio_construccion", 0)}"/></div>
      <div class="field"><label class="field-label">Garage</label>
        <label class="acm-chip">
          <input type="checkbox" class="acm-chip-input" id="cf_tiene_garage" ${vn("tiene_garage", false) ? "checked" : ""}>
          <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Tiene garage</span></span>
        </label></div>

      <div class="ap-divider-wide"></div>

      <div class="ap-full-width">
        <div class="ap-flex-row-gap-sm">
          <h4 class="ap-overline-strong">Atributos comparativos</h4>
          <span class="ap-badge-muted">${esc(tipo)}</span>
        </div>
        <div class="ap-three-col-grid">
          ${attrs.map((attr) => attr[3] ? autoBadge(attr[0], attr[1]) : manualToggle(attr[0], attr[1])).join("")}
        </div>
      </div>

      <div class="ap-divider-narrow"></div>

      <div class="field"><label class="field-label">D\xEDas en mercado</label>
        <input id="cf_dias_en_mercado" class="field-input" type="number" value="${v("dias_en_mercado", 0)}"/></div>
      <div class="field"><label class="field-label">Inmobiliaria</label>
        <input id="cf_inmobiliaria" class="field-input" value="${esc(v("inmobiliaria"))}"/></div>
      <div class="field"><label class="field-label">Tel. inmobiliaria</label>
        <input id="cf_telefono_inmobiliaria" class="field-input" value="${esc(v("telefono_inmobiliaria"))}"/></div>
      <div class="field ap-full-width"><label class="field-label">Link fuente</label>
        <div class="ap-flex-row-sm">
          <input id="cf_link_fuente" class="field-input ap-flex-1" value="${esc(v("link_fuente"))}" placeholder="https://mercadolibre.com.ar/..." />
          <button class="btn btn-primary ap-btn-nowrap" id="extraerURLBtn" ${c2 ? "disabled" : ""}>Extraer</button>
        </div>
        <div id="extraerStatus" class="ap-hint-sm"></div></div>

      <div class="field ap-full-width"><label class="field-label">Observaciones</label>
        <textarea id="cf_observaciones" class="field-input" rows="3">${esc(v("observaciones"))}</textarea></div>

      <div id="homologPreview" class="ap-expandable-section">
        <div class="ap-overline-section-sm">Vista previa de homologaci\xF3n</div>
        <div class="ap-three-col-grid">
          <div class="ap-chip-card-center">
            <div class="ap-overline-micro">Coeficiente</div>
            <div id="hpCoef" class="ap-value-md-emphasis">\u2014</div>
          </div>
          <div class="ap-chip-card-center">
            <div class="ap-overline-micro">$/m\xB2 ajustado</div>
            <div id="hpM2" class="ap-value-md-accent">\u2014</div>
          </div>
          <div class="ap-chip-card-center">
            <div class="ap-overline-micro">Valor ajustado</div>
            <div id="hpTotal" class="ap-value-md-accent">\u2014</div>
          </div>
        </div>
      </div>

      <div class="pf-actions ap-full-width">
        <button class="btn btn-primary btn-full" id="saveComparableBtn">${c2 ? "Guardar cambios" : "Agregar comparable"}</button>
        <button class="btn btn-ghost" id="cfCancelBtn" type="button">Cancelar</button>
      </div>
    </div>`;
    $("comparableFormModal").classList.remove("hidden");
    $("saveComparableBtn").onclick = () => saveTasacionComparableForm(aid, cid);
    $("extraerURLBtn").onclick = () => extraerDesdeURL(aid, cid);
    setTimeout(() => {
      var _a, _b;
      (_a = $("cfCancelBtn")) == null ? void 0 : _a.addEventListener("click", closeTasacionComparableForm);
      (_b = $("closeComparableBtn")) == null ? void 0 : _b.addEventListener("click", closeTasacionComparableForm);
    }, 0);
    _bindTasacionComparableFormPreview(aid, cid);
    _tasPreviewHomologacion(aid);
    const modal = $("comparableFormModal");
    modal.querySelectorAll(".attr-toggle").forEach((container) => {
      container.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-field]");
        if (!btn) return;
        const field2 = btn.dataset.field;
        const value = btn.dataset.value;
        const sel2 = container.querySelector("select");
        if (sel2) sel2.value = value;
        container.querySelectorAll("button").forEach((b) => {
          const isActive = b.dataset.value === value;
          Object.assign(b.style, {
            background: isActive ? value === "superior" ? "var(--accent)" : value === "inferior" ? "#e74c3c" : "var(--admin-bg)" : "transparent",
            color: isActive ? "#fff" : "var(--g3)",
            borderColor: isActive ? "transparent" : "var(--b)",
            fontWeight: isActive ? "600" : "400"
          });
        });
        _tasPreviewHomologacion(aid);
      });
    });
  }
  async function extraerDesdeURL(aid, cid) {
    var _a, _b;
    const url = (_b = (_a = $("cf_link_fuente")) == null ? void 0 : _a.value) == null ? void 0 : _b.trim();
    if (!url) {
      toast("Peg\xE1 una URL primero.", "warn");
      return;
    }
    const status = $("extraerStatus");
    status.innerHTML = '<span class="ap-text-soft">Extrayendo datos...</span>';
    $("extraerURLBtn").disabled = true;
    function setVal(id, val) {
      const el = $(id);
      if (el && val != null) el.value = val;
    }
    function setNum(id, val) {
      const el = $(id);
      if (el && val != null) el.value = val;
    }
    function setCheck(id, val) {
      const el = $(id);
      if (el) el.checked = !!val;
    }
    try {
      const data = await API.extraerURLTasacion(url);
      if (!data || !Object.keys(data).length) {
        status.innerHTML = '<span class="ap-error-text">No se pudieron extraer datos de esta URL.</span>';
        return;
      }
      if (data._error) {
        if (data.link_fuente) setVal("cf_link_fuente", data.link_fuente);
        status.innerHTML = `<span class="ap-warning-text">\u26A0 ${esc(data._error)}</span>`;
        return;
      }
      setVal("cf_calle", data.calle);
      setVal("cf_numero_calle", data.numero_calle);
      setVal("cf_barrio", data.barrio);
      setVal("cf_localidad", data.localidad);
      setVal("cf_piso_depto", data.piso_depto);
      setNum("cf_precio_usd", data.precio_usd);
      setNum("cf_precio_ars", data.precio_ars);
      setNum("cf_superficie_cubierta", data.superficie_cubierta);
      setNum("cf_superficie_terreno", data.superficie_terreno);
      setNum("cf_dormitorios", data.dormitorios);
      setNum("cf_banios", data.banios);
      setNum("cf_anio_construccion", data.anio_construccion);
      setCheck("cf_tiene_garage", data.tiene_garage);
      setVal("cf_tipo_operacion", data.tipo_operacion || "cotizacion");
      if (data.link_fuente) setVal("cf_link_fuente", data.link_fuente);
      if (data.inmobiliaria) setVal("cf_inmobiliaria", data.inmobiliaria);
      if (data.tipo_propiedad) setVal("cf_tipo_propiedad", data.tipo_propiedad);
      const count = Object.keys(data).filter((k) => data[k] != null && data[k] !== "" && data[k] !== 0 && data[k] !== false).length;
      status.innerHTML = `<span class="ap-text-accent">\u2713 ${count} campos extra\xEDdos correctamente.</span>`;
    } catch (e) {
      status.innerHTML = '<span class="ap-error-text"></span>';
      status.firstChild.textContent = "Error: " + (e.message || "");
    } finally {
      $("extraerURLBtn").disabled = false;
    }
  }
  function closeTasacionComparableForm() {
    $("comparableFormModal").classList.add("hidden");
  }
  function _gatherTasacionComparableData() {
    const g = (id) => {
      var _a, _b;
      return (_b = (_a = $(id)) == null ? void 0 : _a.value) != null ? _b : "";
    };
    const gn = (id) => {
      var _a;
      const v = parseFloat((_a = $(id)) == null ? void 0 : _a.value);
      return isNaN(v) ? null : v;
    };
    const gi = (id) => {
      var _a;
      const v = parseInt((_a = $(id)) == null ? void 0 : _a.value);
      return isNaN(v) ? null : v;
    };
    const gc = (id) => {
      var _a, _b;
      return (_b = (_a = $(id)) == null ? void 0 : _a.value) != null ? _b : "equivalente";
    };
    const gb = (id) => {
      var _a;
      return ((_a = $(id)) == null ? void 0 : _a.checked) || false;
    };
    const data = {
      calle: g("cf_calle"),
      numero_calle: g("cf_numero_calle"),
      piso_depto: g("cf_piso_depto"),
      barrio: g("cf_barrio"),
      localidad: g("cf_localidad"),
      tipo_operacion: g("cf_tipo_operacion"),
      precio_usd: gn("cf_precio_usd"),
      precio_ars: gn("cf_precio_ars"),
      superficie_cubierta: gn("cf_superficie_cubierta"),
      superficie_terreno: gn("cf_superficie_terreno"),
      dormitorios: gi("cf_dormitorios"),
      banios: gn("cf_banios"),
      tiene_garage: gb("cf_tiene_garage"),
      tipo_propiedad: g("cf_tipo_propiedad"),
      anio_construccion: gi("cf_anio_construccion"),
      dias_en_mercado: gi("cf_dias_en_mercado"),
      inmobiliaria: g("cf_inmobiliaria"),
      telefono_inmobiliaria: g("cf_telefono_inmobiliaria"),
      link_fuente: g("cf_link_fuente"),
      observaciones: g("cf_observaciones")
    };
    const tipo = getCurrentTasacionType();
    const attrs = getTypeAttrs(tipo);
    attrs.forEach((a) => {
      data[a[0]] = gc("cf_" + a[0]);
    });
    return data;
  }
  var _tasPreviewTimer = null;
  function _tasPreviewHomologacion(aid) {
    if (_tasPreviewTimer) clearTimeout(_tasPreviewTimer);
    _tasPreviewTimer = setTimeout(async () => {
      const data = _gatherTasacionComparableData();
      if (!data.precio_usd || !data.superficie_cubierta) {
        $("homologPreview").style.display = "none";
        return;
      }
      try {
        const result = await API.previewTasacionComparable(aid, data);
        $("homologPreview").style.display = "";
        $("hpCoef").textContent = result.coeficiente_ajuste != null ? result.coeficiente_ajuste.toFixed(4) : "\u2014";
        $("hpM2").textContent = result.valor_m2_ajustado != null ? "$ " + result.valor_m2_ajustado.toFixed(2) : "\u2014";
        $("hpTotal").textContent = result.valor_ajustado != null ? "$ " + result.valor_ajustado.toFixed(2) : "\u2014";
      } catch (e) {
        $("homologPreview").style.display = "none";
      }
    }, 300);
  }
  function _bindTasacionComparableFormPreview(aid, cid) {
    const triggers = [
      "cf_precio_usd",
      "cf_superficie_cubierta",
      "cf_anio_construccion",
      "cf_dormitorios",
      "cf_tiene_garage",
      "cf_precio_ars"
    ];
    const tipo = getCurrentTasacionType();
    getTypeAttrs(tipo).forEach((a) => {
      triggers.push("cf_" + a[0]);
    });
    triggers.forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener("change", () => _tasPreviewHomologacion(aid));
      if (el && el.type === "number") el.addEventListener("input", () => _tasPreviewHomologacion(aid));
    });
  }
  async function _tasRefreshDetail(aid) {
    const updated = await API.getTasacion(aid);
    _currentTasacion = updated;
    const compContainer = $("tasComparables");
    if (compContainer) compContainer.innerHTML = renderTasacionComparableCards(updated);
    const resultsContainer = $("tasResults");
    if (resultsContainer) resultsContainer.outerHTML = renderTasacionResults(updated);
    const heading = $("tasComparablesCount");
    if (heading) heading.textContent = `Comparables (${(updated.comparables || []).length})`;
  }
  async function saveTasacionComparableForm(aid, cid) {
    const data = _gatherTasacionComparableData();
    try {
      if (cid) {
        await API.updateTasacionComparable(aid, cid, data);
      } else {
        await API.createTasacionComparable(aid, data);
      }
      closeTasacionComparableForm();
      await _tasRefreshDetail(aid);
      refreshTasacionMap(aid);
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function confirmDeleteTasacionComparable(aid, cid) {
    if (!await confirmModal("\xBFEliminar este comparable?")) return;
    try {
      await API.deleteTasacionComparable(aid, cid);
      await _tasRefreshDetail(aid);
      refreshTasacionMap(aid);
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function toggleTasacionComparableExclusion(aid, cid) {
    if (!await confirmModal("\xBFCambiar exclusi\xF3n de este comparable?")) return;
    try {
      const data = await _req("PATCH", `/api/tasaciones/${aid}/comparables/${cid}/toggle-exclusion`);
      await _tasRefreshDetail(aid);
      refreshTasacionMap(aid);
      toast(data.excluido ? "Comparable excluido del c\xE1lculo" : "Comparable incluido", "info");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function completarTasacion(aid) {
    if (!await confirmModal("\xBFFinalizar la valuaci\xF3n? Se cambiar\xE1 el estado a Completada.")) return;
    try {
      const saved = await API.completarTasacion(aid);
      _currentTasacion = saved;
      $("tasacionDetailView").innerHTML = renderTasacionDetail(saved);
      loadTasaciones();
      toast("Valuaci\xF3n completada", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  function _bindTasacionDetail(aid) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    console.log("[DEBUG TAS] _bindTasacionDetail called, aid:", aid);
    console.log("[DEBUG TAS] checking _currentTasacion in bind:", !!_currentTasacion, _currentTasacion == null ? void 0 : _currentTasacion.id);
    (_a = $("tas_saveBtn")) == null ? void 0 : _a.addEventListener("click", () => saveTasacionDetail(aid));
    (_b = $("tas_completarBtn")) == null ? void 0 : _b.addEventListener("click", () => completarTasacion(aid));
    (_c = $("tas_restoreBtn")) == null ? void 0 : _c.addEventListener("click", () => restoreTasacion(aid));
    (_d = $("tas_reportBtn")) == null ? void 0 : _d.addEventListener("click", () => window.generarPDFReporte(aid, "tasacion"));
    (_e = $("tas_exportCsvBtn")) == null ? void 0 : _e.addEventListener("click", () => exportTasacionCsv(aid));
    (_f = $("tas_archiveBtn")) == null ? void 0 : _f.addEventListener("click", () => archiveTasacion(aid));
    (_g = $("deleteTasacionBtn")) == null ? void 0 : _g.addEventListener("click", () => deleteTasacion(aid));
    (_h = $("tas_addComparableBtn")) == null ? void 0 : _h.addEventListener("click", () => openTasacionComparableForm(aid, null));
    (_i = $("tas_newVersionBtn")) == null ? void 0 : _i.addEventListener("click", () => createNewTasacionVersion(aid));
    ["td_superficie_cubierta", "td_tipo_cambio_usd", "td_valor_uva"].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener("input", _tasRecalcLive);
    });
    const tipoEl = $("td_tipo_propiedad");
    if (tipoEl) {
      tipoEl.addEventListener("change", () => {
        if (!_currentTasacion) {
          toast == null ? void 0 : toast("No se pudo cargar la tasaci\xF3n. Recarg\xE1 la p\xE1gina e intent\xE1 de nuevo.");
          return;
        }
        const tipo = tipoEl.value || "casa";
        _currentTasacion.tipo_propiedad = tipo;
        const compContainer = $("tasComparables");
        if (compContainer) compContainer.innerHTML = renderTasacionComparableCards(_currentTasacion);
        const resultsContainer = $("tasResults");
        if (resultsContainer) resultsContainer.outerHTML = renderTasacionResults(_currentTasacion);
        _tasRecalcLive();
        const hidden = detectHiddenTasacionComparableAttrs(tipo);
        if (hidden.length > 0) {
          toast('Se ocultaron atributos comparativos que no aplican a "' + tipo + '": ' + hidden.join(", "), "info");
        }
      });
    }
  }
  function detectHiddenTasacionComparableAttrs(tipo) {
    const used = {};
    getTypeAttrs(tipo).forEach((a) => {
      used[a[0]] = true;
    });
    const hidden = TAS_COMP_ATTRS.filter((f) => !used[f]);
    return hidden;
  }
  var _origRenderTasacionDetail = renderTasacionDetail;
  renderTasacionDetail = function(a) {
    const html = _origRenderTasacionDetail(a);
    setTimeout(() => {
      loadTasacionLogs(a.id);
      loadTasacionVersions(a.id);
      loadTasacionMap(a.id);
      _bindTasacionDetail(a.id);
    }, 50);
    return html;
  };
  function showModal(title, bodyHtml, _footerHtml, closeLabel) {
    const existing = document.getElementById("apprModalWrap");
    if (existing) existing.remove();
    const wrap = document.createElement("div");
    wrap.id = "apprModalWrap";
    wrap.style.cssText = "position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)";
    wrap.onclick = (e) => {
      if (e.target === wrap) closeModal();
    };
    wrap.innerHTML = `
    <div class="ap-modal-surface">
      <div class="ap-modal-header-row">
        <span class="ap-hero-title">${title}</span>
        <button onclick="closeModal()" class="ap-modal-close-btn">\xD7</button>
      </div>
      <div class="ap-scroll-content">${bodyHtml}</div>
      ${closeLabel ? `<div class="ap-modal-footer"><button class="btn btn-ghost btn-sm" onclick="closeModal()">${closeLabel}</button></div>` : ""}
    </div>`;
    document.body.appendChild(wrap);
  }
  function closeModal() {
    const el = document.getElementById("apprModalWrap");
    if (el) el.remove();
  }
  function renderTasacionKpiBar(stats, container) {
    if (!container) return;
    const cards = [
      { label: "Pendientes", num: stats.borradores || 0, sub: "Borradores" },
      { label: "En Proceso", num: stats.en_proceso || 0, sub: "Activas" },
      { label: "Completadas", num: stats.completadas || 0, sub: "Finalizadas" },
      { label: "Archivadas", num: stats.archivadas || 0, sub: "Inactivas" },
      { label: "Total", num: stats.total || 0, sub: "Tasaciones" },
      { label: "Con Agente", num: stats.con_agente || 0, sub: "Asignadas" },
      { label: "Sin Agente", num: stats.sin_agente || 0, sub: "Sin asignar" }
    ];
    container.innerHTML = cards.map((c2) => `
    <div class="tas-kpi-card">
      <span class="tas-kpi-label">${c2.label}</span>
      <span class="tas-kpi-number">${c2.num}</span>
      <span class="tas-kpi-sub">${c2.sub}</span>
    </div>
  `).join("");
  }
  async function openTasacionPanel(id) {
    _currentTasacion = null;
    try {
      const a = await API.getTasacion(id);
      _currentTasacion = a;
      $("tasPanelTitle").textContent = esc(a.titulo || a.solicitante || `Tasaci\xF3n #${a.id}`);
      const body = $("tasPanelBody");
      body.innerHTML = '<div class="loading-state">Cargando...</div>';
      $("tasOverlay").classList.add("show");
      $("tasPanel").classList.add("open");
      renderTasacionPanel(a, body);
    } catch (e) {
      toast("Error al cargar tasaci\xF3n: " + e.message, "error");
    }
  }
  function closeTasacionPanel() {
    $("tasOverlay").classList.remove("show");
    $("tasPanel").classList.remove("open");
    $("tasPanelBody").innerHTML = "";
    _currentTasacion = null;
  }
  async function renderTasacionPanel(a, body) {
    const iconMap = { casa: "\u{1F3E0}", departamento: "\u{1F3E2}", ph: "\u{1F3D8}\uFE0F", local: "\u{1F3EA}", oficina: "\u{1F3E2}", terreno: "\u{1F333}" };
    const icon = iconMap[a.tipo_propiedad] || "\u{1F4CB}";
    const priorityCls = "priority-" + (a.priority || "media");
    const statusCls = TAS_ESTADO_CLS[a.estado] || "status-oculta";
    body.innerHTML = `
    <div class="tas-panel-section">
      <div class="tas-panel-section-title">Informaci\xF3n General</div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Estado</span>
        <span><span class="admin-status-badge ${statusCls}">${TAS_ESTADO_MAP[a.estado] || a.estado}</span></span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Prioridad</span>
        <span class="admin-status-badge ${priorityCls} ap-avatar-round">${a.priority || "media"}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Tipo</span>
        <span class="tas-panel-value">${icon} ${a.tipo_propiedad || "\u2014"}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Direcci\xF3n</span>
        <span class="tas-panel-value">${esc(a.direccion || "\u2014")}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Barrio</span>
        <span class="tas-panel-value">${esc(a.barrio || "\u2014")}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Sup. Cubierta</span>
        <span class="tas-panel-value">${a.superficie_cubierta ? a.superficie_cubierta + " m\xB2" : "\u2014"}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Dorm / Ba\xF1os</span>
        <span class="tas-panel-value">${a.dormitorios || 0} dorm \xB7 ${a.banios || 0} ba\xF1os</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Valor Estimado</span>
        <span class="tas-panel-value ap-link-accent-bold">${_fmtUSD(a.valor_estimado_usd)}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Solicitante</span>
        <span class="tas-panel-value">${esc(a.solicitante || "\u2014")}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Agente</span>
        <span class="tas-panel-value">${esc(a.assigned_agent_name || "Sin asignar")}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Comparables</span>
        <span class="tas-panel-value">${a.total_comparables || 0}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Creado</span>
        <span class="tas-panel-value">${a.created_at ? formatDateShort(a.created_at) : "\u2014"}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Actualizado</span>
        <span class="tas-panel-value">${a.updated_at ? formatDateShort(a.updated_at) : "\u2014"}</span>
      </div>
    </div>
    <div class="tas-panel-section">
      <div class="tas-panel-section-title">Acciones R\xE1pidas</div>
      <div class="tas-actions" id="tasActions"></div>
    </div>
    <div class="tas-panel-section">
      <div class="tas-panel-section-title">L\xEDnea de Tiempo</div>
      <div class="tas-timeline" id="tasTimeline"><div class="loading-state"></div></div>
    </div>
    <div class="tas-panel-section">
      <div class="tas-panel-section-title">Comentarios</div>
      <div class="tas-comments" id="tasComments"><div class="loading-state"></div></div>
      <div class="tas-comment-input">
        <textarea id="tasCommentInput" placeholder="Escrib\xED un comentario..." rows="1"></textarea>
        <button class="btn btn-primary btn-sm" id="tasCommentSend">Enviar</button>
      </div>
    </div>
    <div class="tas-panel-section">
      <div class="tas-panel-section-title">Archivos</div>
      <div class="tas-files" id="tasFiles"><div class="loading-state"></div></div>
      <div class="tas-upload-zone ap-stack-top-xs" id="tasUploadZone">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Subir archivo
        <input type="file" id="tasFileInput" class="ap-hidden" multiple>
      </div>
    </div>
  `;
    renderTasacionActions(a);
    renderTasacionTimeline(a.id);
    renderTasacionComments(a.id);
    renderTasacionFiles(a.id);
    $("tasCommentSend").onclick = () => sendTasacionComment(a.id);
    $("tasCommentInput").onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendTasacionComment(a.id);
      }
    };
    $("tasUploadZone").onclick = () => $("tasFileInput").click();
    $("tasFileInput").onchange = (e) => uploadTasacionFile(a.id, e.target);
    $("tasOverlay").onclick = closeTasacionPanel;
  }
  function renderTasacionActions(a) {
    const c2 = $("tasActions");
    if (!c2) return;
    c2.innerHTML = `
    <button class="tas-action-btn" onclick="openTasacionDetail(${a.id})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      Abrir ACM
    </button>
    <button class="tas-action-btn" onclick="showTasacionAssignAgent(${a.id})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ${a.assigned_agent_id ? "Reasignar agente" : "Asignar agente"}
    </button>
    <button class="tas-action-btn" onclick="showTasacionChangeStatus(${a.id}, '${a.estado}')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      Cambiar estado
    </button>
    <button class="tas-action-btn" onclick="convertTasacionToProperty(${a.id})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      Convertir en propiedad
    </button>
  `;
  }
  async function renderTasacionTimeline(aid) {
    const c2 = $("tasTimeline");
    if (!c2) return;
    try {
      const items = await API.getTasacionTimeline(aid);
      if (!items || !items.length) {
        c2.innerHTML = '<div class="ap-footnote-italic">Sin actividad registrada</div>';
        return;
      }
      const dotCls = { estado: "tas-timeline-dot--estado", asignacion: "tas-timeline-dot--asignacion", comentario: "tas-timeline-dot--comentario", conversion: "tas-timeline-dot--conversion" };
      c2.innerHTML = items.map((i) => `
      <div class="tas-timeline-item">
        <div class="tas-timeline-dot ${dotCls[i.event_type] || "tas-timeline-dot--nota"}"></div>
        <div class="tas-timeline-content">${esc(i.description || i.event_type)}</div>
        <div class="tas-timeline-time">${formatDateTime(i.created_at)}</div>
      </div>
    `).join("");
    } catch (e) {
      c2.innerHTML = '<div class="ap-text-muted-base">Error al cargar</div>';
    }
  }
  async function renderTasacionComments(aid) {
    const c2 = $("tasComments");
    if (!c2) return;
    try {
      const items = await API.getTasacionComments(aid);
      if (!items || !items.length) {
        c2.innerHTML = '<div class="ap-footnote-italic-sm">Sin comentarios</div>';
        return;
      }
      c2.innerHTML = items.map((i) => `
      <div class="tas-comment">
        <div class="tas-comment-header">
          <span class="tas-comment-author">${esc(i.user_name || "Usuario")}</span>
          <span class="tas-comment-time">${formatDateTime(i.created_at)}</span>
        </div>
        <div class="tas-comment-content">${esc(i.content)}</div>
      </div>
    `).join("");
    } catch (e) {
      c2.innerHTML = '<div class="ap-text-muted-base">Error al cargar</div>';
    }
  }
  async function renderTasacionFiles(aid) {
    const c2 = $("tasFiles");
    if (!c2) return;
    try {
      const items = await API.getTasacionFiles(aid);
      if (!items || !items.length) {
        c2.innerHTML = '<div class="ap-footnote-italic-sm">Sin archivos</div>';
        return;
      }
      c2.innerHTML = items.map((i) => `
      <span class="tas-file-chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${esc(i.original_name)}
        <button class="tas-file-delete" onclick="deleteTasacionFile(${aid}, ${i.id})" title="Eliminar">\xD7</button>
      </span>
    `).join("");
    } catch (e) {
      c2.innerHTML = '<div class="ap-text-muted-base">Error al cargar</div>';
    }
  }
  async function sendTasacionComment(aid) {
    const input = $("tasCommentInput");
    const content = input.value.trim();
    if (!content) return;
    input.disabled = true;
    try {
      await API.addTasacionComment(aid, { content });
      input.value = "";
      renderTasacionComments(aid);
      renderTasacionTimeline(aid);
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
    input.disabled = false;
    input.focus();
  }
  async function uploadTasacionFile(aid, input) {
    const files = input.files;
    if (!files || !files.length) return;
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      try {
        await API.uploadTasacionFile(aid, fd);
      } catch (e) {
        toast("Error al subir: " + e.message, "error");
      }
    }
    input.value = "";
    renderTasacionFiles(aid);
  }
  async function deleteTasacionFile(aid, fid) {
    if (!confirm("\xBFEliminar este archivo?")) return;
    try {
      await API.deleteTasacionFile(aid, fid);
      renderTasacionFiles(aid);
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  async function showTasacionAssignAgent(aid) {
    try {
      const agents = await API.getTasacionAgents();
      const current = _currentTasacion == null ? void 0 : _currentTasacion.assigned_agent_id;
      showModal("Asignar Agente", `
      <div class="ap-footnote-spaced">Seleccion\xE1 el agente para esta tasaci\xF3n</div>
      <div class="tas-assign-list">
        <button class="tas-assign-option" data-agent="">\u2014 Sin agente \u2014</button>
        ${agents.map((a) => `
          <button class="tas-assign-option ${current === a.id ? "active" : ""}" data-agent="${a.id}" style="${current === a.id ? "background:var(--admin-primary-glow);border-color:var(--admin-primary-border);color:var(--admin-primary)" : ""}">${esc(a.name)}</button>
        `).join("")}
      </div>
    `, null, "Cerrar");
      document.querySelectorAll(".tas-assign-option").forEach((btn) => {
        btn.onclick = async () => {
          try {
            await API.assignTasacionAgent(aid, { agent_id: btn.dataset.agent || null });
            toast("Agente asignado", "success");
            closeModal();
            closeTasacionPanel();
            loadTasaciones();
          } catch (e) {
            toast("Error: " + e.message, "error");
          }
        };
      });
    } catch (e) {
      toast("Error al cargar agentes: " + e.message, "error");
    }
  }
  async function showTasacionChangeStatus(aid, current) {
    const estados = [
      ["borrador", "Pendiente"],
      ["en_proceso", "En Proceso"],
      ["completada", "Completada"],
      ["archivada", "Archivada"]
    ];
    showModal("Cambiar Estado", `
    <div class="ap-footnote-spaced">Seleccion\xE1 el nuevo estado</div>
    <div class="tas-assign-list">
      ${estados.map(([val, label]) => `
        <button class="tas-assign-option ${val === current ? "active" : ""}" data-estado="${val}" style="${val === current ? "background:var(--admin-primary-glow);border-color:var(--admin-primary-border);color:var(--admin-primary)" : ""}">${label}</button>
      `).join("")}
    </div>
  `, null, "Cerrar");
    document.querySelectorAll(".tas-assign-list .tas-assign-option").forEach((btn) => {
      btn.onclick = async () => {
        try {
          await API.changeTasacionStatus(aid, { estado: btn.dataset.estado });
          toast("Estado actualizado", "success");
          closeModal();
          closeTasacionPanel();
          loadTasaciones();
        } catch (e) {
          toast("Error: " + e.message, "error");
        }
      };
    });
  }
  async function convertTasacionToProperty(aid) {
    if (!confirm("\xBFConvertir esta tasaci\xF3n en una propiedad del inventario?")) return;
    try {
      const result = await API.convertTasacionToProperty(aid, { operation_type: "venta" });
      toast(`Propiedad #${result.property_id} creada: ${result.property_title}`, "success");
      closeTasacionPanel();
      loadTasaciones();
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  function formatDateShort(d) {
    if (!d) return "\u2014";
    const dt = /* @__PURE__ */ new Date(d + (d.includes("T") ? "" : "T00:00:00"));
    return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function formatDateTime(d) {
    if (!d) return "\u2014";
    const dt = /* @__PURE__ */ new Date(d + (d.includes("T") ? "" : "T00:00:00"));
    return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  window.openTasacionComparableForm = openTasacionComparableForm;
  window.closeTasacionComparableForm = closeTasacionComparableForm;
  window.saveTasacionComparableForm = saveTasacionComparableForm;
  window.confirmDeleteTasacionComparable = confirmDeleteTasacionComparable;
  window.toggleTasacionComparableExclusion = toggleTasacionComparableExclusion;
  window.filterTasaciones = filterTasaciones;
  window.showTasacionesList = showTasacionesList;
  window.loadTasaciones = loadTasaciones;
  window.openTasacionForm = openTasacionForm;
  window.closeTasacionForm = closeTasacionForm;
  window.openTasacionDetail = openTasacionDetail;
  window.openTasacionReport = openTasacionReport;
  window.archiveTasacion = archiveTasacion;
  window.deleteTasacion = deleteTasacion;
  window.restoreTasacion = restoreTasacion;
  window.saveTasacionDetail = saveTasacionDetail;
  window.completarTasacion = completarTasacion;
  window.extraerDesdeURL = extraerDesdeURL;
  window.exportTasacionCsv = exportTasacionCsv;
  window.togglePyramidSection = togglePyramidSection;
  window.changeTasacionPage = changeTasacionPage;
  window.closeTasacionPanel = closeTasacionPanel;
  window.openTasacionPanel = openTasacionPanel;
  window.showModal = showModal;
  window.closeModal = closeModal;
  window.showTasacionAssignAgent = showTasacionAssignAgent;
  window.showTasacionChangeStatus = showTasacionChangeStatus;
  window.convertTasacionToProperty = convertTasacionToProperty;
  window.deleteTasacionFile = deleteTasacionFile;
  document.addEventListener("click", (e) => {
    if (e.target.closest("#backToTasacionesList")) showTasacionesList();
  });
  document.addEventListener("change", (e) => {
    const el = e.target.closest("#tasacionFilter") || e.target.closest("#tasacionShowArchived");
    if (el) {
      _tasacionPage = 1;
      loadTasaciones();
    }
  });
  var _tasSearchTimer = null;
  document.addEventListener("input", (e) => {
    if (e.target.closest("#tasacionSearch")) {
      clearTimeout(_tasSearchTimer);
      _tasSearchTimer = setTimeout(() => {
        _tasacionPage = 1;
        loadTasaciones();
      }, 300);
    }
  });
  (function() {
    const LEAD_STATUSES = [
      "nuevo",
      "contactado",
      "calificado",
      "visita_agendada",
      "visita_realizada",
      "negociacion",
      "cerrado_ganado",
      "cerrado_perdido",
      "propietario"
    ];
    const STATUS_LABELS = {
      nuevo: "Nuevo",
      contactado: "Contactado",
      calificado: "Calificado",
      visita_agendada: "Visita Agendada",
      visita_realizada: "Visita Realizada",
      negociacion: "Negociaci\xF3n",
      cerrado_ganado: "Ganado",
      cerrado_perdido: "Perdido",
      propietario: "Propietario"
    };
    const ORIGINS = ["manual", "contacto", "tasacion", "propiedad", "whatsapp", "referido", "evento", "web"];
    const TIPO_CLIENTE_OPTS = ["propietario", "comprador", "inversor"];
    const PRIORITY_LABELS = ["baja", "media", "alta"];
    let _leads = [];
    let _page2 = 1;
    let _totalPages = 1;
    let _agents2 = [];
    let _hasFollowupFilter = false;
    let _selectedLeadId = null;
    function $id(id) {
      return document.getElementById(id);
    }
    function esc2(s) {
      if (s == null) return "";
      var d = document.createElement("div");
      d.textContent = String(s);
      return d.innerHTML;
    }
    function fmtDate(d) {
      if (!d) return "\u2014";
      return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
    }
    function fmtDateTime(d) {
      if (!d) return "\u2014";
      return new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    function fmtCurrency(n) {
      if (n == null || isNaN(n)) return "\u2014";
      return "USD " + Number(n).toLocaleString("es-AR");
    }
    function fmtPercent(n) {
      if (n == null || isNaN(n)) return "\u2014";
      return n + "%";
    }
    function isFollowupDue(d) {
      if (!d) return false;
      return new Date(d) <= /* @__PURE__ */ new Date();
    }
    function getPriority(score) {
      if (score == null) return "baja";
      if (score >= 70) return "alta";
      if (score >= 40) return "media";
      return "baja";
    }
    function getPriorityLabel(p) {
      var m = { baja: "Baja", media: "Media", alta: "Alta" };
      return m[p] || "\u2014";
    }
    async function init() {
      setupFilters();
      var nb = $id("newLeadBtn");
      if (nb) nb.addEventListener("click", showNewLeadModal);
      var rb = $id("refreshCrm");
      if (rb) rb.addEventListener("click", loadLeads);
      var s = $id("crmSearch");
      if (s) {
        var t;
        s.addEventListener("input", function() {
          clearTimeout(t);
          t = setTimeout(loadLeads, 300);
        });
      }
      await loadAgents();
      await loadLeads();
    }
    function setupFilters() {
      var sf = $id("crmStatusFilter");
      if (sf) {
        sf.innerHTML = '<option value="">Todos los estados</option>' + LEAD_STATUSES.map(function(s) {
          return '<option value="' + s + '">' + esc2(STATUS_LABELS[s]) + "</option>";
        }).join("");
        sf.addEventListener("change", function() {
          _page2 = 1;
          loadLeads();
        });
      }
      var of = $id("crmOriginFilter");
      if (of) {
        of.innerHTML = '<option value="">Todos los or\xEDgenes</option>' + ORIGINS.map(function(o) {
          return '<option value="' + o + '">' + o.charAt(0).toUpperCase() + o.slice(1) + "</option>";
        }).join("");
        of.addEventListener("change", function() {
          _page2 = 1;
          loadLeads();
        });
      }
      var tc = $id("crmTipoClienteFilter");
      if (tc) {
        tc.innerHTML = '<option value="">Todos los tipos</option>' + TIPO_CLIENTE_OPTS.map(function(t) {
          return '<option value="' + t + '">' + t.charAt(0).toUpperCase() + t.slice(1) + "</option>";
        }).join("");
        tc.addEventListener("change", function() {
          _page2 = 1;
          loadLeads();
        });
      }
      var af = $id("crmAgentFilter");
      if (af) af.addEventListener("change", function() {
        _page2 = 1;
        loadLeads();
      });
      var fb = document.querySelector(".admin-filter-group");
      if (!fb) return;
      if ($id("crmFollowupFilter")) return;
      var lb = document.createElement("label");
      lb.className = "acm-chip";
      lb.innerHTML = '<input type="checkbox" class="acm-chip-input" id="crmFollowupFilter"><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Solo con followup</span></span>';
      lb.querySelector("input").addEventListener("change", function(e) {
        _hasFollowupFilter = e.target.checked;
        _page2 = 1;
        loadLeads();
      });
      fb.appendChild(lb);
    }
    async function loadAgents() {
      try {
        var d = await API.getCrmAgents();
        _agents2 = d.agents || [];
        var sel = $id("crmAgentFilter");
        if (!sel) return;
        sel.innerHTML = '<option value="">Todos los agentes</option>' + _agents2.map(function(a) {
          return '<option value="' + a.id + '">' + esc2(a.name) + "</option>";
        }).join("");
      } catch (e) {
        console.warn("Error loading CRM agents:", e);
      }
    }
    async function loadLeads() {
      var c2 = $id("crmLeadList");
      if (!c2) return;
      c2.innerHTML = '<div class="loading-state">Cargando prospectos...</div>';
      closeDetailPanel();
      var p = { page: _page2, per_page: 50 };
      var sv = $id("crmSearch");
      if (sv && (sv = sv.value.trim())) p.search = sv;
      var st = $id("crmStatusFilter");
      if (st && (st = st.value)) p.status = st;
      var or = $id("crmOriginFilter");
      if (or && (or = or.value)) p.origin = or;
      var tc = $id("crmTipoClienteFilter");
      if (tc && (tc = tc.value)) p.tipo_cliente = tc;
      var ag = $id("crmAgentFilter");
      if (ag && (ag = ag.value)) p.agent_id = ag;
      if (_hasFollowupFilter) p.has_followup = "true";
      try {
        var d = await API.getLeads(p);
        _leads = d.leads || [];
        _totalPages = d.pages || 1;
        var sub = $id("crmSubtitle");
        if (sub) sub.textContent = d.total + " prospectos";
        renderLeadList(c2);
        updateCrmBadge(d.total);
        updateCrmKpis(_leads);
      } catch (e) {
        c2.innerHTML = '<div class="loading-state">Error: ' + esc2(e.message) + "</div>";
      }
    }
    function getInitials(name) {
      if (!name) return "?";
      var parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    function getAvatarColor(name) {
      var colors = ["#20B8AB", "#3b82f6", "#8C64DC", "#e67e22", "#39D98A", "#CC3535", "#FFB432", "#1abc9c", "#9b59b6", "#e74c3c"];
      var hash = 0;
      for (var i = 0; i < (name || "").length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    }
    function hasRecentActivity(lastContacted) {
      if (!lastContacted) return false;
      var days = (Date.now() - new Date(lastContacted).getTime()) / 864e5;
      return days < 7;
    }
    function renderLeadList(c2) {
      if (!_leads.length) {
        c2.innerHTML = '<div class="empty-state">No hay prospectos a\xFAn. Los contactos y solicitudes de tasaci\xF3n se convierten autom\xE1ticamente.</div>';
        return;
      }
      var rows = "";
      for (var i = 0; i < _leads.length; i++) {
        var l = _leads[i];
        var inits = getInitials(l.name);
        var avColor = getAvatarColor(l.name);
        var sl = STATUS_LABELS[l.status] || l.status;
        var sb = '<span class="crm-status-badge crm-status-badge--' + l.status + '"><span class="crm-status-dot crm-status-dot--' + l.status + '"></span>' + sl + "</span>";
        var pr = getPriority(l.lead_score);
        var pc = pr === "alta" ? "priority--alta" : pr === "media" ? "priority--media" : "priority--baja";
        var pb = '<span class="crm-priority ' + pc + '">' + getPriorityLabel(pr) + "</span>";
        var propThumb = "";
        var propName = "";
        if (l.properties && l.properties.length) {
          var p = l.properties[0];
          propName = esc2(p.property_title || "Prop #" + p.property_id);
          if (p.image) {
            propThumb = '<img class="crm-prop-thumb" src="' + esc2(p.image) + '" alt="" loading="lazy">';
          } else {
            propThumb = '<span class="crm-prop-thumb crm-prop-thumb--empty">\u{1F3E0}</span>';
          }
        } else {
          propThumb = '<span class="crm-prop-thumb crm-prop-thumb--empty">\u2014</span>';
          propName = '<span class="crm-prop-name-muted">Sin propiedad</span>';
        }
        var an = l.agent_name ? '<div class="crm-agent-row"><span class="crm-agent-avatar">' + getInitials(l.agent_name) + '</span><span class="crm-agent-name">' + esc2(l.agent_name) + "</span></div>" : '<span class="crm-agent-name muted">\u2014</span>';
        var recentDot = hasRecentActivity(l.last_contacted_at) ? '<span class="crm-activity-dot" title="Actividad reciente"></span>' : "";
        var la = l.last_contacted_at ? '<span class="crm-activity-date">' + fmtDate(l.last_contacted_at) + "</span>" : '<span class="crm-activity-date muted">\u2014</span>';
        var na = l.next_followup_at ? '<span class="crm-next-action ' + (isFollowupDue(l.next_followup_at) ? "next-action--due" : "") + '">' + fmtDate(l.next_followup_at) + "</span>" : '<span class="crm-next-action muted">\u2014</span>';
        var cr = l.created_at ? fmtDate(l.created_at) : "\u2014";
        rows += '<tr class="crm-row crm-row--status-' + l.status + (_selectedLeadId === l.id ? " crm-row--selected" : "") + '" data-id="' + l.id + '"><td class="crm-cell crm-cell--client"><div class="crm-client-row"><span class="crm-client-avatar" style="background:' + avColor + '">' + esc2(inits) + '</span><div class="crm-client-info"><strong>' + esc2(l.name) + (l.tipo_cliente ? '<span class="crm-tipo-chip crm-tipo-chip--' + esc2(l.tipo_cliente) + '">' + esc2(l.tipo_cliente) + "</span>" : "") + '</strong><div class="crm-meta">' + esc2(l.email || "") + (l.phone ? " \xB7 " + esc2(l.phone) : "") + '</div></div></div></td><td class="crm-cell crm-cell--property"><div class="crm-prop-row">' + propThumb + '<span class="crm-prop-name">' + propName + '</span></div></td><td class="crm-cell crm-cell--agent-c">' + an + '</td><td class="crm-cell crm-cell--status-c">' + sb + '</td><td class="crm-cell crm-cell--priority">' + pb + '</td><td class="crm-cell crm-cell--last-activity">' + recentDot + la + '</td><td class="crm-cell crm-cell--next-action">' + na + '</td><td class="crm-cell crm-cell--created">' + cr + '</td><td class="crm-cell crm-cell--actions-c"><button class="btn btn-outline btn-xs crm-view-btn" data-action="viewLead" data-id="' + l.id + '">Ver detalle</button><button class="btn btn-ghost btn-xs crm-btn-danger" data-action="deleteLead" data-id="' + l.id + '" title="Eliminar">\u2715</button></td></tr>';
      }
      var pag = _totalPages > 1 ? buildPagination() : "";
      c2.innerHTML = '<div class="crm-table-wrap"><table><thead><tr class="crm-header-row"><th class="crm-col crm-col--client">Cliente</th><th class="crm-col crm-col--property">Propiedad</th><th class="crm-col crm-col--agent">Agente</th><th class="crm-col crm-col--status">Estado</th><th class="crm-col crm-col--priority">Prioridad</th><th class="crm-col crm-col--last-activity">Actividad</th><th class="crm-col crm-col--next-action">Pr\xF3x. Acci\xF3n</th><th class="crm-col crm-col--created">Creado</th><th class="crm-col crm-col--actions"></th></tr></thead><tbody>' + rows + "</tbody></table></div>" + pag;
      c2.querySelectorAll('[data-action="viewLead"]').forEach(function(b) {
        b.addEventListener("click", function(e) {
          e.stopPropagation();
          openDetailPanel(+this.dataset.id);
        });
      });
      c2.querySelectorAll('[data-action="deleteLead"]').forEach(function(b) {
        b.addEventListener("click", function(e) {
          e.stopPropagation();
          deleteLead(+this.dataset.id);
        });
      });
      c2.querySelectorAll("[data-page]").forEach(function(b) {
        b.addEventListener("click", function() {
          _page2 = +this.dataset.page;
          loadLeads();
        });
      });
      c2.querySelectorAll(".crm-row").forEach(function(r) {
        r.addEventListener("click", function() {
          openDetailPanel(+this.dataset.id);
        });
      });
    }
    function buildPagination() {
      var h = '<div class="pagination">';
      if (_page2 > 1) h += '<button class="btn btn-ghost btn-xs" data-page="' + (_page2 - 1) + '">\u2039 Anterior</button>';
      h += '<span class="pagination-info">P\xE1g. ' + _page2 + " de " + _totalPages + "</span>";
      if (_page2 < _totalPages) h += '<button class="btn btn-ghost btn-xs" data-page="' + (_page2 + 1) + '">Siguiente \u203A</button>';
      h += "</div>";
      return h;
    }
    async function openDetailPanel(id) {
      _selectedLeadId = id;
      var panel = $id("crmSidePanel");
      if (!panel) return;
      var backdrop = $id("crmBackdrop");
      if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.className = "crm-backdrop";
        backdrop.id = "crmBackdrop";
        backdrop.addEventListener("click", closeDetailPanel);
        document.body.appendChild(backdrop);
      }
      backdrop.classList.add("open");
      var existing = panel.querySelector(".crm-side-body");
      if (existing) existing.innerHTML = '<div class="loading-state">Cargando...</div>';
      panel.classList.add("open");
      var lead, activities, properties;
      try {
        var results = await Promise.all([
          API.getLead(id),
          _req("GET", "/api/crm/leads/" + id + "/activities").catch(function() {
            return [];
          }),
          _req("GET", "/api/crm/leads/" + id + "/properties").catch(function() {
            return [];
          })
        ]);
        lead = results[0];
        activities = results[1];
        properties = results[2];
      } catch (e) {
        toast("Error al cargar prospecto: " + e.message, "error");
        return;
      }
      if (Array.isArray(lead.properties)) properties = lead.properties;
      if (!panel.querySelector(".crm-side-body")) {
        panel.innerHTML = '<div class="crm-side-header"><div class="crm-side-header-info"><span class="crm-status-dot crm-status-dot--' + lead.status + '"></span><h3 class="crm-side-title">' + esc2(lead.name) + '</h3></div><button class="crm-side-close">\u2715</button></div><div class="crm-side-body"></div>';
        panel.querySelector(".crm-side-close").addEventListener("click", closeDetailPanel);
      } else {
        var hdr = panel.querySelector(".crm-side-header");
        hdr.innerHTML = '<div class="crm-side-header-info"><span class="crm-status-dot crm-status-dot--' + lead.status + '"></span><h3 class="crm-side-title">' + esc2(lead.name) + '</h3></div><button class="crm-side-close">\u2715</button>';
        panel.querySelector(".crm-side-close").addEventListener("click", closeDetailPanel);
      }
      renderSideBody(panel, lead, activities, properties);
      panel.dataset.leadId = lead.id;
    }
    function closeDetailPanel() {
      _selectedLeadId = null;
      var panel = $id("crmSidePanel");
      if (panel) {
        panel.classList.remove("open");
        var body = panel.querySelector(".crm-side-body");
        if (body) body.innerHTML = "";
        var hdr = panel.querySelector(".crm-side-header");
        if (hdr) hdr.innerHTML = "";
      }
      var backdrop = $id("crmBackdrop");
      if (backdrop) backdrop.classList.remove("open");
      var rows = document.querySelectorAll(".crm-row--selected");
      for (var i = 0; i < rows.length; i++) rows[i].classList.remove("crm-row--selected");
    }
    function renderSideBody(panel, lead, activities, properties) {
      var _a;
      var body = panel.querySelector(".crm-side-body");
      if (!body) return;
      var sopts = LEAD_STATUSES.map(function(s) {
        return '<option value="' + s + '"' + (lead.status === s ? " selected" : "") + ">" + STATUS_LABELS[s] + "</option>";
      }).join("");
      var aopts = _agents2.map(function(a) {
        return '<option value="' + a.id + '"' + (lead.agent_id === a.id ? " selected" : "") + ">" + esc2(a.name) + "</option>";
      }).join("");
      var oopts = ORIGINS.map(function(o) {
        return '<option value="' + o + '"' + (lead.origin === o ? " selected" : "") + ">" + o.charAt(0).toUpperCase() + o.slice(1) + "</option>";
      }).join("");
      var tcOpts = TIPO_CLIENTE_OPTS.map(function(t) {
        return '<option value="' + t + '"' + (lead.tipo_cliente === t ? " selected" : "") + ">" + t.charAt(0).toUpperCase() + t.slice(1) + "</option>";
      }).join("");
      var ph = !properties || !properties.length ? '<div class="crm-side-field-value">Sin propiedades vinculadas</div>' : properties.map(function(p) {
        return '<div class="crm-prop-item"><span>' + esc2(p.property_title || "Propiedad #" + (p.property_id || p.id)) + '</span><button class="btn btn-ghost btn-xs crm-btn-danger" data-action="removeProp" data-prop-id="' + (p.id || p.property_id) + '">\u2715</button></div>';
      }).join("");
      function sec(t) {
        return '<div class="crm-side-section"><h4 class="crm-side-section-title">' + t + '</h4><div class="crm-side-fields">';
      }
      function es() {
        return "</div></div>";
      }
      function fl(lbl, id, type, val) {
        var inp = type === "number" ? '<input class="field-input" id="' + id + '" type="number" value="' + (val != null ? val : "") + '">' : '<input class="field-input" id="' + id + '" type="' + type + '" value="' + esc2(val || "") + '">';
        return '<div class="crm-side-field"><span class="crm-side-field-label">' + lbl + "</span>" + inp + "</div>";
      }
      body.innerHTML = sec("Informaci\xF3n") + fl("Nombre", "crmDtlName", "text", lead.name) + fl("Email", "crmDtlEmail", "email", lead.email) + '<div class="crm-side-field-row">' + fl("Tel\xE9fono", "crmDtlPhone", "text", lead.phone) + fl("WhatsApp", "crmDtlWhatsapp", "text", lead.whatsapp) + '</div><div class="crm-side-field"><span class="crm-side-field-label">Contacto preferido</span><select class="field-input field-input--select" id="crmDtlPrefContact"><option value="">\u2014</option><option value="phone"' + (lead.preferred_contact_method === "phone" ? " selected" : "") + '>Tel\xE9fono</option><option value="whatsapp"' + (lead.preferred_contact_method === "whatsapp" ? " selected" : "") + '>WhatsApp</option><option value="email"' + (lead.preferred_contact_method === "email" ? " selected" : "") + '>Email</option></select></div><div class="crm-side-field-row"><div class="crm-side-field"><span class="crm-side-field-label">Origen</span><select class="field-input field-input--select" id="crmDtlOrigin">' + oopts + '</select></div><div class="crm-side-field"><span class="crm-side-field-label">Tipo cliente</span><select class="field-input field-input--select" id="crmDtlTipoCliente"><option value="">\u2014</option>' + tcOpts + '</select></div></div><div class="crm-side-field-row"><div class="crm-side-field"><span class="crm-side-field-label">Agente</span><select class="field-input field-input--select" id="crmDtlAgent"><option value="">Sin agente</option>' + aopts + '</select></div><div class="crm-side-field"><span class="crm-side-field-label">Score</span><input class="field-input" id="crmDtlScore" type="number" value="' + (lead.lead_score != null ? lead.lead_score : "") + '"></div></div><div class="crm-side-field"><span class="crm-side-field-label">Estado</span><select class="field-input field-input--select" id="crmDtlStatus">' + sopts + "</select></div>" + es() + sec("Propiedades relacionadas") + '<div id="crmDtlPropsWrap">' + ph + '<div class="crm-prop-add"><input class="field-input" id="crmDtlPropSearch" placeholder="Buscar propiedad..."><button class="btn btn-ghost btn-sm" id="crmDtlAddProp">+</button></div></div>' + es() + sec("Presupuesto") + '<div class="crm-side-field-row">' + fl("M\xEDn (USD)", "crmDtlBudgetMin", "number", lead.budget_min) + fl("M\xE1x (USD)", "crmDtlBudgetMax", "number", lead.budget_max) + "</div>" + fl("Valor estimado (USD)", "crmDtlEstValue", "number", lead.estimated_value) + es() + sec("Tracking") + fl("UTM Source", "crmDtlUtmSource", "text", lead.utm_source) + fl("UTM Campaign", "crmDtlUtmCampaign", "text", lead.utm_campaign) + es() + sec("Actividad reciente") + '<div class="crm-timeline">' + buildTimelineHTML(activities) + "</div>" + es() + sec("Notas") + '<textarea class="field-input" id="crmDtlNotes" rows="3">' + esc2(lead.notes || "") + "</textarea>" + es() + sec("Tareas") + '<div id="crmTasksPanel"><div class="loading-state">Cargando tareas...</div></div><button class="btn btn-ghost btn-xs crm-new-task-btn" id="crmNewTaskBtn">+ Nueva tarea</button>' + es() + sec("Acciones r\xE1pidas") + '<div class="crm-quick-actions"><button class="btn btn-ghost btn-sm" data-action="logCall">\u{1F4DE} Llamada</button><button class="btn btn-ghost btn-sm" data-action="addNoteInline">\u{1F4DD} Nota</button><button class="btn btn-ghost btn-sm" data-action="scheduleVisit">\u{1F4C5} Visita</button><button class="btn btn-ghost btn-sm" data-action="scheduleFollowup">\u23F0 Followup</button></div><div id="crmQuickActionPanel"></div>' + es();
      bindQuickActions(body, lead);
      bindPropertyHandlers(body, lead);
      CrmTasks.loadLeadTasks(lead.id, body);
      (_a = body.querySelector("#crmNewTaskBtn")) == null ? void 0 : _a.addEventListener("click", function() {
        CrmTasks.showTaskForm(lead.id, null, body);
      });
      bindSideSave(lead.id, body);
    }
    function buildTimelineHTML(acts) {
      if (!acts || !acts.length) return '<div class="crm-timeline-empty">Sin actividad registrada.</div>';
      var dots = { call: "call", note: "note", email: "email", visit: "visit", followup: "followup", status_change: "status_change" };
      return acts.map(function(a) {
        var dc = dots[a.activity_type] || "note";
        return '<div class="crm-interaction"><span class="crm-interaction-dot crm-interaction-dot--' + dc + '"></span><div class="crm-interaction-body"><strong>' + esc2(a.title || a.activity_type || "") + '</strong><div class="crm-interaction-text">' + esc2(a.description || "") + '</div><div class="crm-interaction-date">' + fmtDateTime(a.created_at) + (a.created_by ? " \xB7 " + esc2(a.created_by) : "") + "</div></div></div>";
      }).join("");
    }
    function bindSideSave(leadId, body) {
      var _a;
      var btn = document.createElement("div");
      btn.className = "crm-side-save";
      btn.innerHTML = '<button class="btn btn-primary btn-full" id="crmSideSaveBtn">Guardar cambios</button>';
      body.appendChild(btn);
      (_a = body.querySelector("#crmSideSaveBtn")) == null ? void 0 : _a.addEventListener("click", async function() {
        var d = collectSideFormData(body);
        if (!d.name) {
          toast("El nombre es obligatorio.", "error");
          return;
        }
        try {
          await API.updateLead(leadId, d);
          toast("Prospecto actualizado.", "success");
          await loadLeads();
          _selectedLeadId = leadId;
        } catch (e) {
          toast("Error: " + e.message, "error");
        }
      });
    }
    function collectSideFormData(body) {
      function v(id) {
        var el = body.querySelector("#" + id);
        return el ? el.value.trim() || null : null;
      }
      function n(id) {
        var val = v(id);
        return val && val !== "" && !isNaN(val) ? parseFloat(val) : null;
      }
      return {
        name: v("crmDtlName"),
        email: v("crmDtlEmail"),
        phone: v("crmDtlPhone"),
        whatsapp: v("crmDtlWhatsapp"),
        preferred_contact_method: v("crmDtlPrefContact"),
        status: v("crmDtlStatus"),
        origin: v("crmDtlOrigin"),
        tipo_cliente: v("crmDtlTipoCliente"),
        agent_id: v("crmDtlAgent") ? parseInt(v("crmDtlAgent")) : null,
        budget_min: n("crmDtlBudgetMin"),
        budget_max: n("crmDtlBudgetMax"),
        estimated_value: n("crmDtlEstValue"),
        lead_score: v("crmDtlScore") ? parseInt(v("crmDtlScore")) : null,
        utm_source: v("crmDtlUtmSource"),
        utm_campaign: v("crmDtlUtmCampaign"),
        notes: v("crmDtlNotes")
      };
    }
    function bindQuickActions(body, lead) {
      var p = body.querySelector("#crmQuickActionPanel");
      if (!p) return;
      var actions = [
        { sel: '[data-action="logCall"]', build: function() {
          var _a, _b;
          p.innerHTML = '<div class="crm-quick-panel"><span class="crm-quick-panel-label">Registrar llamada</span><input class="field-input" id="crmQaCallDesc" placeholder="Descripci\xF3n..."><div class="crm-quick-panel-actions"><button class="btn btn-primary btn-sm" id="crmQaCallSave">Guardar</button><button class="btn btn-ghost btn-sm" id="crmQaCallCancel">Cancelar</button></div></div>';
          (_a = body.querySelector("#crmQaCallSave")) == null ? void 0 : _a.addEventListener("click", async function() {
            var d = body.querySelector("#crmQaCallDesc").value;
            if (!d || !d.trim()) {
              toast("Ingres\xE1 una descripci\xF3n.", "warn");
              return;
            }
            try {
              await _req("POST", "/api/crm/leads/" + lead.id + "/activities", { activity_type: "call", description: d.trim(), title: "Llamada telef\xF3nica" });
              toast("Llamada registrada.", "success");
              p.innerHTML = "";
              var acts = await _req("GET", "/api/crm/leads/" + lead.id + "/activities").catch(function() {
                return [];
              });
              var tl = body.querySelector(".crm-timeline");
              if (tl) tl.innerHTML = buildTimelineHTML(acts);
            } catch (e) {
              toast("Error: " + e.message, "error");
            }
          });
          (_b = body.querySelector("#crmQaCallCancel")) == null ? void 0 : _b.addEventListener("click", function() {
            p.innerHTML = "";
          });
        } },
        { sel: '[data-action="addNoteInline"]', build: function() {
          var _a, _b;
          p.innerHTML = '<div class="crm-quick-panel"><span class="crm-quick-panel-label">Agregar nota</span><textarea class="field-input" id="crmQaNoteText" rows="2" placeholder="Escrib\xED una nota..."></textarea><div class="crm-quick-panel-actions"><button class="btn btn-primary btn-sm" id="crmQaNoteSave">Guardar</button><button class="btn btn-ghost btn-sm" id="crmQaNoteCancel">Cancelar</button></div></div>';
          (_a = body.querySelector("#crmQaNoteSave")) == null ? void 0 : _a.addEventListener("click", async function() {
            var t = body.querySelector("#crmQaNoteText").value;
            if (!t || !t.trim()) {
              toast("Escrib\xED una nota.", "warn");
              return;
            }
            try {
              await API.addLeadNote(lead.id, { note: t.trim() });
              toast("Nota agregada.", "success");
              p.innerHTML = "";
              var acts = await _req("GET", "/api/crm/leads/" + lead.id + "/activities").catch(function() {
                return [];
              });
              var tl = body.querySelector(".crm-timeline");
              if (tl) tl.innerHTML = buildTimelineHTML(acts);
            } catch (e) {
              toast("Error: " + e.message, "error");
            }
          });
          (_b = body.querySelector("#crmQaNoteCancel")) == null ? void 0 : _b.addEventListener("click", function() {
            p.innerHTML = "";
          });
        } },
        { sel: '[data-action="scheduleVisit"]', build: function() {
          var _a, _b;
          p.innerHTML = '<div class="crm-quick-panel"><span class="crm-quick-panel-label">Agendar visita</span><input class="field-input" id="crmQaVisitDate" type="datetime-local"><input class="field-input" id="crmQaVisitAddress" placeholder="Direcci\xF3n..."><textarea class="field-input" id="crmQaVisitNotes" rows="2" placeholder="Notas..."></textarea><div class="crm-quick-panel-actions"><button class="btn btn-primary btn-sm" id="crmQaVisitSave">Guardar</button><button class="btn btn-ghost btn-sm" id="crmQaVisitCancel">Cancelar</button></div></div>';
          (_a = body.querySelector("#crmQaVisitSave")) == null ? void 0 : _a.addEventListener("click", async function() {
            var dt = body.querySelector("#crmQaVisitDate").value;
            if (!dt) {
              toast("Seleccion\xE1 fecha y hora.", "warn");
              return;
            }
            try {
              await _req("POST", "/api/crm/leads/" + lead.id + "/visits", {
                scheduled_at: dt,
                address: body.querySelector("#crmQaVisitAddress").value.trim() || "",
                notes: body.querySelector("#crmQaVisitNotes").value.trim() || ""
              });
              toast("Visita agendada.", "success");
              p.innerHTML = "";
            } catch (e) {
              toast("Error: " + e.message, "error");
            }
          });
          (_b = body.querySelector("#crmQaVisitCancel")) == null ? void 0 : _b.addEventListener("click", function() {
            p.innerHTML = "";
          });
        } },
        { sel: '[data-action="scheduleFollowup"]', build: function() {
          var _a, _b;
          p.innerHTML = '<div class="crm-quick-panel"><span class="crm-quick-panel-label">Programar followup</span><input class="field-input" id="crmQaFupDate" type="datetime-local"><textarea class="field-input" id="crmQaFupText" rows="2" placeholder="Notas..."></textarea><div class="crm-quick-panel-actions"><button class="btn btn-primary btn-sm" id="crmQaFupSave">Guardar</button><button class="btn btn-ghost btn-sm" id="crmQaFupCancel">Cancelar</button></div></div>';
          (_a = body.querySelector("#crmQaFupSave")) == null ? void 0 : _a.addEventListener("click", async function() {
            var dt = body.querySelector("#crmQaFupDate").value;
            if (!dt) {
              toast("Seleccion\xE1 fecha y hora.", "warn");
              return;
            }
            try {
              await API.updateLead(lead.id, { next_followup_at: dt });
              await _req("POST", "/api/crm/leads/" + lead.id + "/activities", {
                activity_type: "followup",
                title: "Followup programado",
                description: body.querySelector("#crmQaFupText").value.trim() || ""
              });
              toast("Followup programado.", "success");
              p.innerHTML = "";
            } catch (e) {
              toast("Error: " + e.message, "error");
            }
          });
          (_b = body.querySelector("#crmQaFupCancel")) == null ? void 0 : _b.addEventListener("click", function() {
            p.innerHTML = "";
          });
        } }
      ];
      for (var i = 0; i < actions.length; i++) {
        var btn = body.querySelector(actions[i].sel);
        if (btn) btn.addEventListener("click", actions[i].build);
      }
    }
    function renderPropsWrap(container, props, lead, body) {
      var ph = !props || !props.length ? '<div class="crm-side-field-value">Sin propiedades vinculadas</div>' : props.map(function(p) {
        return '<div class="crm-prop-item"><span>' + esc2(p.property_title || "Propiedad #" + (p.property_id || p.id)) + '</span><button class="btn btn-ghost btn-xs crm-btn-danger" data-action="removeProp" data-prop-id="' + (p.id || p.property_id) + '">\u2715</button></div>';
      }).join("");
      container.innerHTML = ph + '<div class="crm-prop-add"><input class="field-input" id="crmDtlPropSearch" placeholder="Buscar propiedad..."><button class="btn btn-ghost btn-sm" id="crmDtlAddProp">+</button></div>';
      bindPropertyHandlers(body, lead);
    }
    function linkProperty(leadId, propertyId, body) {
      _req("POST", "/api/crm/leads/" + leadId + "/properties", { property_id: propertyId }).then(function() {
        toast("Propiedad agregada.", "success");
        var inp = body.querySelector("#crmDtlPropSearch");
        if (inp) inp.value = "";
        var dd = body.querySelector(".crm-prop-results");
        if (dd) dd.remove();
        _req("GET", "/api/crm/leads/" + leadId + "/properties").then(function(props) {
          var wrap = body.querySelector("#crmDtlPropsWrap");
          if (wrap) renderPropsWrap(wrap, props || [], { id: leadId }, body);
        }).catch(function() {
        });
      }).catch(function(e) {
        toast("Error: " + e.message, "error");
      });
    }
    function showPropResults(body, results, leadId) {
      var existing = body.querySelector(".crm-prop-results");
      if (existing) existing.remove();
      var inp = body.querySelector("#crmDtlPropSearch");
      if (!inp) return;
      if (!results || !results.length) return;
      var wrap = document.createElement("div");
      wrap.className = "crm-prop-results";
      results.forEach(function(p) {
        var btn = document.createElement("button");
        btn.className = "btn btn-ghost btn-xs crm-prop-result-btn";
        btn.textContent = esc2(p.title || "Propiedad #" + p.id) + " \u2014 " + fmtCurrency(p.price);
        btn.addEventListener("click", function(e) {
          e.stopPropagation();
          linkProperty(leadId, p.id, body);
        });
        wrap.appendChild(btn);
      });
      inp.parentNode.appendChild(wrap);
    }
    function bindPropertyHandlers(body, lead) {
      body.querySelectorAll('[data-action="removeProp"]').forEach(function(b) {
        b.addEventListener("click", async function(e) {
          e.stopPropagation();
          try {
            await _req("DELETE", "/api/crm/leads/" + lead.id + "/properties/" + this.dataset.propId);
            var it = this.closest(".crm-prop-item");
            if (it) it.remove();
            toast("Propiedad removida.", "success");
          } catch (e2) {
            toast("Error: " + e2.message, "error");
          }
        });
      });
      var inp = body.querySelector("#crmDtlPropSearch");
      var btn = body.querySelector("#crmDtlAddProp");
      if (inp) {
        var _srchTimer;
        inp.addEventListener("input", function() {
          var val = this.value.trim();
          var dd = body.querySelector(".crm-prop-results");
          if (!val || val.length < 2) {
            if (val.length < 2 && dd) dd.remove();
            return;
          }
          var pid = parseInt(val);
          if (!isNaN(pid)) {
            if (dd) dd.remove();
            return;
          }
          clearTimeout(_srchTimer);
          _srchTimer = setTimeout(function() {
            API.getProperties({ search: val, per_page: 8 }).then(function(res) {
              if (res && res.properties) showPropResults(body, res.properties, lead.id);
            }).catch(function() {
            });
          }, 300);
        });
      }
      if (btn) {
        btn.addEventListener("click", function() {
          if (!inp) return;
          var val = inp.value.trim();
          if (!val) {
            toast("Ingres\xE1 un ID o nombre de propiedad.", "warn");
            return;
          }
          var pid = parseInt(val);
          if (!isNaN(pid)) {
            linkProperty(lead.id, pid, body);
          } else {
            API.getProperties({ search: val, per_page: 5 }).then(function(res) {
              if (!res || !res.properties || !res.properties.length) {
                toast("No se encontraron propiedades.", "warn");
                return;
              }
              showPropResults(body, res.properties, lead.id);
            }).catch(function(e) {
              toast("Error al buscar: " + e.message, "error");
            });
          }
        });
      }
    }
    function showNewLeadModal() {
      var _a, _b, _c;
      var aopts = _agents2.map(function(a) {
        return '<option value="' + a.id + '">' + esc2(a.name) + "</option>";
      }).join("");
      var sopts = LEAD_STATUSES.map(function(s) {
        return '<option value="' + s + '"' + (s === "nuevo" ? " selected" : "") + ">" + STATUS_LABELS[s] + "</option>";
      }).join("");
      var oopts = ORIGINS.map(function(o) {
        return '<option value="' + o + '"' + (o === "manual" ? " selected" : "") + ">" + o.charAt(0).toUpperCase() + o.slice(1) + "</option>";
      }).join("");
      var backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.innerHTML = '<div class="modal crm-new-modal"><div class="modal-header"><h3>+ Nuevo prospecto</h3><button class="modal-close">\u2715</button></div><div class="modal-body"><div class="crm-form"><div class="crm-form-row"><label>Nombre *</label><input class="field-input" id="crmNewName" required></div><div class="crm-form-row"><label>Email</label><input class="field-input" id="crmNewEmail" type="email"></div><div class="crm-form-row"><label>Tel\xE9fono</label><input class="field-input" id="crmNewPhone"></div><div class="crm-form-row"><label>WhatsApp</label><input class="field-input" id="crmNewWhatsapp"></div><div class="crm-form-row"><label>Contacto preferido</label><select class="field-input field-input--select" id="crmNewPrefContact"><option value="">\u2014</option><option value="phone">Tel\xE9fono</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select></div><div class="crm-form-inline"><div><label>Estado</label><select class="field-input field-input--select" id="crmNewStatus">' + sopts + '</select></div><div><label>Agente</label><select class="field-input field-input--select" id="crmNewAgent"><option value="">Sin agente</option>' + aopts + '</select></div></div><div class="crm-form-inline"><div><label>Origen</label><select class="field-input field-input--select" id="crmNewOrigin">' + oopts + '</select></div><div><label>Valor estimado (USD)</label><input class="field-input" id="crmNewEstValue" type="number"></div></div><div class="crm-form-row"><label>Notas</label><textarea class="field-input" id="crmNewNotes" rows="3"></textarea></div></div></div><div class="modal-footer"><button class="btn btn-secondary modal-cancel">Cancelar</button><button class="btn btn-primary modal-save">Crear prospecto</button></div></div>';
      document.body.appendChild(backdrop);
      var close = function() {
        backdrop.remove();
      };
      (_a = backdrop.querySelector(".modal-close")) == null ? void 0 : _a.addEventListener("click", close);
      (_b = backdrop.querySelector(".modal-cancel")) == null ? void 0 : _b.addEventListener("click", close);
      backdrop.addEventListener("click", function(e) {
        if (e.target === backdrop) close();
      });
      (_c = backdrop.querySelector(".modal-save")) == null ? void 0 : _c.addEventListener("click", async function() {
        var _a2, _b2, _c2, _d, _e;
        function g(id) {
          var el = $id(id);
          return el ? el.value : null;
        }
        var data = {
          name: (_a2 = g("crmNewName")) == null ? void 0 : _a2.trim(),
          email: ((_b2 = g("crmNewEmail")) == null ? void 0 : _b2.trim()) || null,
          phone: ((_c2 = g("crmNewPhone")) == null ? void 0 : _c2.trim()) || null,
          whatsapp: ((_d = g("crmNewWhatsapp")) == null ? void 0 : _d.trim()) || null,
          preferred_contact_method: g("crmNewPrefContact") || null,
          status: g("crmNewStatus") || "nuevo",
          agent_id: g("crmNewAgent") ? parseInt(g("crmNewAgent")) : null,
          origin: g("crmNewOrigin") || "manual",
          estimated_value: g("crmNewEstValue") ? parseFloat(g("crmNewEstValue")) : null,
          notes: ((_e = g("crmNewNotes")) == null ? void 0 : _e.trim()) || null
        };
        if (!data.name) {
          toast("El nombre es obligatorio.", "error");
          return;
        }
        try {
          await API.createLead(data);
          toast("Prospecto creado.", "success");
          close();
          await loadLeads();
        } catch (e) {
          toast("Error: " + e.message, "error");
        }
      });
    }
    async function deleteLead(id) {
      if (!await confirmModal("\xBFEliminar este prospecto? Se perder\xE1n todos los datos asociados.")) return;
      try {
        await API.deleteLead(id);
        toast("Prospecto eliminado.", "success");
        closeDetailPanel();
        await loadLeads();
      } catch (e) {
        toast("Error: " + e.message, "error");
      }
    }
    function updateCrmKpis(leads) {
      var total = leads.length;
      var nuevo = 0, ganados = 0, perdidos = 0, pendientes = 0;
      for (var i = 0; i < total; i++) {
        var s = leads[i].status;
        if (s === "nuevo") nuevo++;
        else if (s === "cerrado_ganado") ganados++;
        else if (s === "cerrado_perdido") perdidos++;
        else pendientes++;
      }
      var el = $id("crmKpiTotal");
      if (el) el.textContent = total;
      el = $id("crmKpiNuevo");
      if (el) el.textContent = nuevo;
      el = $id("crmKpiGanados");
      if (el) el.textContent = ganados;
      el = $id("crmKpiPerdidos");
      if (el) el.textContent = perdidos;
    }
    function updateCrmBadge(count) {
      var b = $id("sidebarCrmCount");
      if (b) {
        b.textContent = count || "";
        b.style.display = count ? "" : "none";
      }
    }
    window._crmAgents = _agents2;
    window.initCrm = init;
  })();
  (function() {
    var TASK_PRIORITIES = ["baja", "media", "alta", "urgente"];
    var TASK_PRIORITY_LABELS = { baja: "Baja", media: "Media", alta: "Alta", urgente: "Urgente" };
    var TASK_STATUS_LABELS = { pendiente: "Pendiente", en_progreso: "En progreso", completada: "Completada", cancelada: "Cancelada" };
    function esc2(s) {
      if (s == null) return "";
      var d = document.createElement("div");
      d.textContent = String(s);
      return d.innerHTML;
    }
    function fmtDate(d) {
      if (!d) return "\u2014";
      return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
    }
    function isFollowupDue(d) {
      if (!d) return false;
      return new Date(d) <= /* @__PURE__ */ new Date();
    }
    function taskPriorityClass(p) {
      var m = { baja: "task-priority--baja", media: "task-priority--media", alta: "task-priority--alta", urgente: "task-priority--urgente" };
      return m[p] || "task-priority--media";
    }
    function taskStatusClass(s) {
      var m = { pendiente: "task-status--pendiente", en_progreso: "task-status--progreso", completada: "task-status--completada", cancelada: "task-status--cancelada" };
      return m[s] || "task-status--pendiente";
    }
    function renderTaskCard(t) {
      var isDone = t.status === "completada" || t.status === "cancelada";
      var checked = t.status === "completada" ? " checked" : "";
      var disabled = isDone ? " disabled" : "";
      var dueStr = t.due_at ? fmtDate(t.due_at) : "";
      var assignedStr = t.assigned_to_name ? esc2(t.assigned_to_name) : "";
      var priorityLabel = TASK_PRIORITY_LABELS[t.priority] || "Media";
      var statusLabel = TASK_STATUS_LABELS[t.status] || t.status;
      return '<div class="crm-task-card' + (isDone ? " task-card--done" : "") + '" data-task-id="' + t.id + '" data-task-priority="' + (t.priority || "media") + '" data-task-assigned="' + (t.assigned_to_id || "") + '" data-task-due="' + (t.due_at || "") + '" data-task-desc="' + esc2(t.description || "") + '" role="listitem"><label class="acm-chip' + (disabled ? " acm-chip--disabled" : "") + '"><input type="checkbox" class="acm-chip-input crm-task-checkbox"' + checked + disabled + '><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text"></span></span></label><div class="crm-task-body"><div class="crm-task-title">' + esc2(t.title) + '</div><div class="crm-task-meta"><span class="crm-task-priority ' + taskPriorityClass(t.priority) + '">' + priorityLabel + '</span><span class="crm-task-status ' + taskStatusClass(t.status) + '">' + statusLabel + "</span>" + (dueStr ? '<span class="crm-task-due' + (isFollowupDue(t.due_at) && !isDone ? " task-due--overdue" : "") + '">' + dueStr + "</span>" : "") + (assignedStr ? '<span class="crm-task-assigned">' + esc2(assignedStr) + "</span>" : "") + '</div></div><div class="crm-task-actions">' + (!isDone ? '<button class="btn btn-ghost btn-xs task-edit-btn" aria-label="Editar tarea">\u270E</button>' : "") + '<button class="btn btn-ghost btn-xs task-delete-btn" aria-label="Eliminar tarea">\u2715</button></div></div>';
    }
    function bindTaskCardEvents(panel, leadId, modal) {
      panel.querySelectorAll(".crm-task-checkbox").forEach(function(cb) {
        cb.addEventListener("change", function() {
          var card = this.closest(".crm-task-card");
          if (!card) return;
          completeTask(parseInt(card.dataset.taskId), card);
        });
      });
      panel.querySelectorAll(".task-edit-btn").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
          e.stopPropagation();
          var card = this.closest(".crm-task-card");
          if (!card) return;
          showTaskForm(leadId, parseInt(card.dataset.taskId), modal);
        });
      });
      panel.querySelectorAll(".task-delete-btn").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
          e.stopPropagation();
          var card = this.closest(".crm-task-card");
          if (!card) return;
          deleteTask(parseInt(card.dataset.taskId), card);
        });
      });
    }
    async function completeTask(taskId, cardEl) {
      if (!cardEl) return;
      try {
        await _req("PATCH", "/api/crm/tasks/" + taskId + "/complete");
        cardEl.classList.add("task-card--done");
        var cb = cardEl.querySelector(".crm-task-checkbox");
        if (cb) {
          cb.checked = true;
          cb.disabled = true;
        }
        var statusEl = cardEl.querySelector(".crm-task-status");
        if (statusEl) {
          statusEl.textContent = "Completada";
          statusEl.className = "crm-task-status task-status--completada";
        }
        var editBtn = cardEl.querySelector(".task-edit-btn");
        if (editBtn) editBtn.remove();
        toast("Tarea completada.", "success");
      } catch (e) {
        toast("Error: " + e.message, "error");
      }
    }
    async function deleteTask(taskId, cardEl) {
      if (!await confirmModal("\xBFEliminar esta tarea?")) return;
      try {
        await _req("DELETE", "/api/crm/tasks/" + taskId);
        if (cardEl) cardEl.remove();
        toast("Tarea eliminada.", "success");
      } catch (e) {
        toast("Error: " + e.message, "error");
      }
    }
    async function loadLeadTasks(leadId, modal) {
      var panel = modal.querySelector("#crmTasksPanel");
      if (!panel) return;
      panel.innerHTML = '<div class="loading-state">Cargando tareas...</div>';
      try {
        var d = await _req("GET", "/api/crm/tasks?lead_id=" + leadId);
        var tasks = d.tasks || [];
        if (!tasks.length) {
          panel.innerHTML = '<div class="crm-timeline-empty">Sin tareas a\xFAn. Cre\xE1 la primera tarea para este prospecto.</div>';
          return;
        }
        var h = '<div class="crm-task-list" role="list">';
        for (var i = 0; i < tasks.length; i++) h += renderTaskCard(tasks[i]);
        h += "</div>";
        panel.innerHTML = h;
        bindTaskCardEvents(panel, leadId, modal);
      } catch (e) {
        panel.innerHTML = '<div class="crm-timeline-empty">Error al cargar tareas: ' + esc2(e.message) + "</div>";
      }
    }
    function _getTaskCardData(modal, taskId) {
      var card = modal.querySelector('.crm-task-card[data-task-id="' + taskId + '"]');
      if (!card) return { title: "", desc: "", priority: "media", assigned: "", due: "" };
      return {
        title: card.querySelector(".crm-task-title").textContent || "",
        desc: card.dataset.taskDesc || "",
        priority: card.dataset.taskPriority || "media",
        assigned: card.dataset.taskAssigned || "",
        due: card.dataset.taskDue || ""
      };
    }
    function _selOpt(opts, val) {
      if (!val) return opts;
      return opts.replace(new RegExp('"' + val + '"', "g"), '"' + val + '" selected');
    }
    function showTaskForm(leadId, taskId, modal) {
      var _a, _b;
      var panel = modal.querySelector("#crmQuickActionPanel");
      if (!panel) return;
      var isEdit = !!taskId;
      var priorityOpts = "";
      for (var i = 0; i < TASK_PRIORITIES.length; i++) {
        var p = TASK_PRIORITIES[i];
        priorityOpts += '<option value="' + p + '">' + TASK_PRIORITY_LABELS[p] + "</option>";
      }
      var pre = isEdit ? _getTaskCardData(modal, taskId) : { title: "", desc: "", priority: "media", assigned: "", due: "" };
      panel.innerHTML = '<div class="crm-quick-panel"><span class="crm-quick-panel-label">' + (isEdit ? "Editar tarea" : "Nueva tarea") + '</span><input class="field-input" id="crmTaskTitle" placeholder="T\xEDtulo *" value="' + esc2(pre.title) + '"><textarea class="field-input" id="crmTaskDesc" rows="2" placeholder="Descripci\xF3n (opcional)">' + esc2(pre.desc) + '</textarea><div class="crm-field-row"><div><span class="crm-field-label">Prioridad</span><select class="field-input field-input--select" id="crmTaskPriority">' + _selOpt(priorityOpts, pre.priority) + '</select></div><div><span class="crm-field-label">Asignado a</span><select class="field-input field-input--select" id="crmTaskAssigned"></select></div></div><span class="crm-field-label">Vence</span><input class="field-input" id="crmTaskDue" type="datetime-local" value="' + pre.due + '"><div class="crm-quick-panel-actions"><button class="btn btn-primary btn-sm" id="crmTaskSave">' + (isEdit ? "Guardar cambios" : "Crear tarea") + '</button><button class="btn btn-ghost btn-sm" id="crmTaskCancel">Cancelar</button></div></div>';
      var agents = window._crmAgents || [];
      var agentSel = modal.querySelector("#crmTaskAssigned");
      if (agentSel) {
        var opts = '<option value="">Sin agente</option>';
        for (var i = 0; i < agents.length; i++) {
          opts += '<option value="' + agents[i].id + '"' + (agents[i].id == parseInt(pre.assigned) ? " selected" : "") + ">" + esc2(agents[i].name) + "</option>";
        }
        agentSel.innerHTML = opts;
      }
      async function onSave() {
        var btn = modal.querySelector("#crmTaskSave");
        btn.disabled = true;
        btn.textContent = "Guardando...";
        var title = modal.querySelector("#crmTaskTitle").value.trim();
        if (!title) {
          toast("El t\xEDtulo es obligatorio.", "warn");
          btn.disabled = false;
          btn.textContent = isEdit ? "Guardar cambios" : "Crear tarea";
          return;
        }
        var data = {
          title,
          description: modal.querySelector("#crmTaskDesc").value.trim() || void 0,
          priority: (modal.querySelector("#crmTaskPriority") || {}).value || "media",
          assigned_to_id: parseInt((modal.querySelector("#crmTaskAssigned") || {}).value) || null,
          due_at: (modal.querySelector("#crmTaskDue") || {}).value || null
        };
        if (!isEdit) data.lead_id = leadId;
        try {
          if (isEdit) {
            await _req("PATCH", "/api/crm/tasks/" + taskId, data);
            toast("Tarea actualizada.", "success");
          } else {
            await _req("POST", "/api/crm/tasks", data);
            toast("Tarea creada.", "success");
          }
          panel.innerHTML = "";
          await loadLeadTasks(leadId, modal);
          var acts = await _req("GET", "/api/crm/leads/" + leadId + "/activities").catch(function() {
            return [];
          });
          var tl = modal.querySelector(".crm-timeline");
          if (tl) {
            var dots = { call: "call", note: "note", email: "email", visit: "visit", followup: "followup", status_change: "status_change" };
            tl.innerHTML = (acts || []).map(function(a) {
              var dc = dots[a.activity_type] || "note";
              return '<div class="crm-interaction"><span class="crm-interaction-dot crm-interaction-dot--' + dc + '"></span><div class="crm-interaction-body"><strong>' + esc2(a.title || a.activity_type || "") + '</strong><div class="crm-interaction-text">' + esc2(a.description || "") + '</div><div class="crm-interaction-date">' + (a.created_at ? fmtDate(a.created_at) : "") + (a.created_by ? " \xB7 " + esc2(a.created_by) : "") + "</div></div></div>";
            }).join("") || '<div class="crm-timeline-empty">Sin actividad registrada.</div>';
          }
        } catch (e) {
          toast("Error: " + e.message, "error");
          btn.disabled = false;
          btn.textContent = isEdit ? "Guardar cambios" : "Crear tarea";
        }
      }
      (_a = modal.querySelector("#crmTaskSave")) == null ? void 0 : _a.addEventListener("click", onSave);
      (_b = modal.querySelector("#crmTaskCancel")) == null ? void 0 : _b.addEventListener("click", function() {
        panel.innerHTML = "";
      });
      var titleInp = modal.querySelector("#crmTaskTitle");
      if (titleInp) setTimeout(function() {
        titleInp.focus();
      }, 100);
    }
    window.CrmTasks = {
      loadLeadTasks,
      showTaskForm,
      completeTask,
      deleteTask
    };
  })();
  var _requests = [];
  var _activeReqId = null;
  var _reqOpen = false;
  var REQ_TYPE_ICONS = { consulta: "\u{1F4CB}", tasacion: "\u{1F4B0}", visita: "\u{1F511}", informacion: "\u2139\uFE0F", propuesta: "\u{1F4C4}", reclamo: "\u26A0\uFE0F", otro: "\u{1F4CC}" };
  var REQ_TYPE_LABELS = { consulta: "Consulta", tasacion: "Tasaci\xF3n", visita: "Visita", informacion: "Informaci\xF3n", propuesta: "Propuesta", reclamo: "Reclamo", otro: "Otro" };
  async function loadRequests() {
    const list = $("reqList");
    if (!list) return;
    list.innerHTML = '<div class="loading-state">Cargando solicitudes...</div>';
    try {
      const [data, stats] = await Promise.all([
        API.getRequests(),
        API.getRequestStats()
      ]);
      _requests = data.requests || [];
      _renderStats(stats);
      _renderList();
      if (_requests.length && !_activeReqId) {
        _activeReqId = _requests[0].id;
        _openRequest(_activeReqId);
      }
      $("reqSubtitle").textContent = `${_requests.length} solicitud${_requests.length !== 1 ? "es" : ""}`;
    } catch (e) {
      list.innerHTML = '<div class="error-state">Error al cargar solicitudes.</div>';
    }
  }
  function _renderStats(stats) {
    const bar = $("reqKpiBar");
    if (!bar) return;
    if (!stats) {
      bar.innerHTML = "";
      return;
    }
    const avg = stats.avg_response_hours != null ? `${stats.avg_response_hours}h` : "\u2014";
    bar.innerHTML = `
    <div class="req-kpi-card">
      <span class="req-kpi-label">Nuevas</span>
      <span class="req-kpi-number">${stats.nuevas || 0}</span>
    </div>
    <div class="req-kpi-card">
      <span class="req-kpi-label">En revisi\xF3n</span>
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
    const list = $("reqList");
    if (!list) return;
    if (!_requests.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">\u{1F4CB}</div><div class="empty-state-text">No hay solicitudes todav\xEDa.</div></div>';
      return;
    }
    list.innerHTML = _requests.map((r) => `
    <div class="req-item${r.id === _activeReqId ? " active" : ""}" data-req-id="${r.id}" onclick="selectRequest(${r.id})">
      <div class="req-item-type">${REQ_TYPE_ICONS[r.request_type] || "\u{1F4CB}"}</div>
      <div class="req-item-info">
        <div class="req-item-client">${esc(r.client_name)}</div>
        <div class="req-item-subject">${esc(r.subject || REQ_TYPE_LABELS[r.request_type] || r.request_type)}</div>
      </div>
      <div class="req-item-meta">
        <span class="req-item-priority priority-${r.priority || "media"}">${r.priority || "media"}</span>
        <span class="req-item-status status-${r.status}">${_statusLabel(r.status)}</span>
        <span class="req-item-time">${_fmtDate(r.updated_at)}</span>
        ${r.assigned_agent_name ? `<span class="req-item-agent">${esc(r.assigned_agent_name.split(" ")[0])}</span>` : ""}
      </div>
    </div>
  `).join("");
  }
  function _statusLabel(s) {
    const map = { nueva: "Nueva", en_revision: "Revisi\xF3n", respondida: "Respondida", cerrada: "Cerrada" };
    return map[s] || s;
  }
  function _fmtDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const now = /* @__PURE__ */ new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  }
  window.selectRequest = async function selectRequest(id) {
    var _a;
    _activeReqId = id;
    document.querySelectorAll(".req-item").forEach((el) => el.classList.remove("active"));
    (_a = document.querySelector(`.req-item[data-req-id="${id}"]`)) == null ? void 0 : _a.classList.add("active");
    await _openRequest(id);
    _showPanel();
  };
  async function _openRequest(id) {
    try {
      const data = await API.getRequest(id);
      _renderSidePanel(data);
      _reqOpen = true;
    } catch (e) {
      toast("Error al cargar detalle", "error");
    }
  }
  function _showPanel() {
    const panel = $("reqPanel");
    const overlay = $("reqOverlay");
    if (panel) panel.classList.add("open");
    if (overlay) overlay.classList.add("show");
  }
  window.closeRequestPanel = function closeRequestPanel2() {
    _reqOpen = false;
    const panel = $("reqPanel");
    const overlay = $("reqOverlay");
    if (panel) panel.classList.remove("open");
    if (overlay) overlay.classList.remove("show");
  };
  function _renderSidePanel(data) {
    const body = $("reqPanelBody");
    if (!body) return;
    const r = data;
    const comments = data.comments || [];
    const files = data.files || [];
    const statusOpts = ["nueva", "en_revision", "respondida", "cerrada"].map(
      (s) => `<option value="${s}"${s === r.status ? " selected" : ""}>${_statusLabel(s)}</option>`
    ).join("");
    const priorityOpts = ["baja", "media", "alta", "urgente"].map(
      (p) => `<option value="${p}"${p === r.priority ? " selected" : ""}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`
    ).join("");
    $("reqPanelTitle").textContent = `#${r.id} \xB7 ${esc(r.client_name)}`;
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
      ${r.client_email ? `<div class="req-panel-row"><span class="req-panel-label">Email</span><span class="req-panel-value"><a href="mailto:${esc(r.client_email)}" class="req-link">${esc(r.client_email)}</a></span></div>` : ""}
      ${r.client_phone ? `<div class="req-panel-row"><span class="req-panel-label">Tel\xE9fono</span><span class="req-panel-value"><a href="tel:${esc(r.client_phone)}" class="req-link">${esc(r.client_phone)}</a></span></div>` : ""}
    </div>

    <div class="req-panel-section">
      <div class="req-panel-section-title">Detalle</div>
      <div class="req-panel-row"><span class="req-panel-label">Tipo</span><span class="req-panel-value">${REQ_TYPE_LABELS[r.request_type] || r.request_type}</span></div>
      ${r.property_title ? `<div class="req-panel-row"><span class="req-panel-label">Propiedad</span><span class="req-panel-value">${esc(r.property_title)}</span></div>` : ""}
      ${r.assigned_agent_name ? `<div class="req-panel-row"><span class="req-panel-label">Responsable</span><span class="req-panel-value">${esc(r.assigned_agent_name)}</span></div>` : ""}
      <div class="req-panel-row"><span class="req-panel-label">Origen</span><span class="req-panel-value">${r.source || "web"}</span></div>
      <div class="req-panel-row"><span class="req-panel-label">Creado</span><span class="req-panel-value">${_fmtDateFull(r.created_at)}</span></div>
      ${r.response_time_hours != null ? `<div class="req-panel-row"><span class="req-panel-label">Tiempo respuesta</span><span class="req-panel-value">${r.response_time_hours}h</span></div>` : ""}
      ${r.description ? `<div class="req-panel-desc">${esc(r.description)}</div>` : ""}
    </div>

    <div class="req-panel-section">
      <div class="req-panel-section-title">Comentarios (${comments.length})</div>
      <div class="req-comments" id="reqComments">
        ${comments.length ? comments.map((c2) => `
          <div class="req-comment">
            <div class="req-comment-header">
              <span class="req-comment-author">${esc(c2.author_name || c2.author)}</span>
              <span class="req-comment-time">${_fmtDateTime(c2.created_at)}</span>
            </div>
            <div class="req-comment-content">${esc(c2.content)}</div>
          </div>
        `).join("") : '<div class="req-empty-text">Sin comentarios</div>'}
      </div>
      <div class="req-comment-input">
        <textarea id="reqCommentInput" rows="2" placeholder="Agregar comentario..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();addRequestComment(${r.id})}"></textarea>
        <button class="btn btn-primary btn-sm req-send-btn" onclick="addRequestComment(${r.id})">Enviar</button>
      </div>
    </div>

    <div class="req-panel-section">
      <div class="req-panel-section-title">Archivos (${files.length})</div>
      ${files.length ? `<div class="req-files">${files.map((f) => `<a href="${esc(f.url)}" target="_blank" class="req-file-chip">\u{1F4CE} ${esc(f.filename)}</a>`).join("")}</div>` : '<div class="req-empty-text">Sin archivos</div>'}
    </div>

    <div class="req-panel-section">
      <div class="req-panel-section-title">Acciones r\xE1pidas</div>
      <div class="req-actions">
        <button class="req-action-btn" onclick="assignAgent(${r.id})">\u{1F464} Asignar agente</button>
        ${!r.lead_id ? `<button class="req-action-btn" onclick="convertToLead(${r.id})">\u{1F504} Convertir en lead</button>` : '<button class="req-action-btn" disabled>\u2705 Ya convertido a lead</button>'}
        <button class="req-action-btn" onclick="closeRequestPanel()">\u2715 Cerrar panel</button>
      </div>
    </div>`;
  }
  function _fmtDateFull(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function _fmtDateTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  window.updateRequestField = async function updateRequestField2(id, field2, value) {
    try {
      const updated = await API.updateRequest(id, { [field2]: value });
      const idx = _requests.findIndex((r) => r.id === id);
      if (idx !== -1) _requests[idx] = updated;
      _renderList();
      if (_activeReqId === id && _reqOpen) _openRequest(id);
      toast("Actualizado", "success");
    } catch (e) {
      toast("Error al actualizar", "error");
    }
  };
  window.addRequestComment = async function addRequestComment2(id) {
    const input = $("reqCommentInput");
    const content = ((input == null ? void 0 : input.value) || "").trim();
    if (!content) return;
    try {
      await API.addRequestComment(id, content);
      input.value = "";
      if (_activeReqId === id) _openRequest(id);
    } catch (e) {
      toast("Error al agregar comentario", "error");
    }
  };
  window.convertToLead = async function convertToLead(id) {
    if (!await confirmModal("\xBFConvertir esta solicitud en un lead de CRM?")) return;
    try {
      const result = await API.convertRequestToLead(id);
      const idx = _requests.findIndex((r) => r.id === id);
      if (idx !== -1) _requests[idx] = result.request;
      _renderList();
      if (_activeReqId === id && _reqOpen) _openRequest(id);
      toast("Convertido a lead correctamente", "success");
    } catch (e) {
      toast("Error al convertir: " + e.message, "error");
    }
  };
  window.assignAgent = async function assignAgent(id) {
    var _a;
    try {
      const data = await API.getRequestAgents();
      const agents = data.agents || [];
      const current = (_a = _requests.find((r) => r.id === id)) == null ? void 0 : _a.assigned_agent_id;
      const names = {};
      agents.forEach((a) => {
        names[a.id] = a.name;
      });
      const opts = agents.map(
        (a) => `<option value="${a.id}"${a.id === current ? " selected" : ""}>${esc(a.name)}</option>`
      ).join("");
      const modal = document.createElement("div");
      modal.className = "admin-modal-overlay";
      modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:2000;display:flex;align-items:center;justify-content:center";
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
      toast("Error al cargar agentes", "error");
    }
  };
  window.assignAgentConfirm = async function assignAgentConfirm(id) {
    const sel = $("assignAgentSelect");
    if (!sel) return;
    const agentId = parseInt(sel.value);
    const overlay = sel.closest(".admin-modal-overlay");
    if (overlay) overlay.remove();
    await updateRequestField(id, "assigned_agent_id", agentId);
  };
  window.filterRequests = function filterRequests2() {
    var _a, _b, _c;
    const status = ((_a = $("reqFilterStatus")) == null ? void 0 : _a.value) || "";
    const type = ((_b = $("reqFilterType")) == null ? void 0 : _b.value) || "";
    const priority = ((_c = $("reqFilterPriority")) == null ? void 0 : _c.value) || "";
    document.querySelectorAll(".req-item").forEach((el) => {
      const id = parseInt(el.dataset.reqId);
      const r = _requests.find((x) => x.id === id);
      if (!r) {
        el.style.display = "none";
        return;
      }
      const matchStatus = !status || r.status === status;
      const matchType = !type || r.request_type === type;
      const matchPriority = !priority || r.priority === priority;
      el.style.display = matchStatus && matchType && matchPriority ? "" : "none";
    });
  };
  window.loadRequests = loadRequests;
  window.closeRequestPanel = closeRequestPanel;
  window.filterRequests = filterRequests;
  window.addRequestComment = addRequestComment;
  var _mkPosts = [];
  var _mkCampaigns = [];
  var _mkCurrentCampaign = null;
  var _mkCurrentPost = null;
  var MKT_POST_STATUS = { draft: "Borrador", scheduled: "Programado", publishing: "Publicando", published: "Publicado", failed: "Fallido" };
  var MKT_CAMP_STATUS = { draft: "Borrador", active: "Activa", paused: "Pausada", completed: "Completada" };
  var MKT_STATUS_CLS = { draft: "status-oculta", scheduled: "status-disponible", publishing: "admin-prop-featured", published: "status-disponible", failed: "status-vendida" };
  function esc(v) {
    return String(v != null ? v : "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  async function loadMarketing() {
    try {
      const dash = await API.getMarketingDashboard();
      renderMktKpiBar(dash, $("mktKpiBar"));
      renderMktPlatforms($("mktPlatformsGrid"));
    } catch (e) {
    }
    loadMarketingPosts();
    loadMarketingCampaigns();
    loadMarketingStats();
  }
  function renderMktKpiBar(stats, container) {
    var _a, _b;
    if (!container) return;
    const cards = [
      { label: "Publicaciones", num: stats.total_posts, sub: `${stats.published} publicadas` },
      { label: "Programadas", num: stats.scheduled, sub: `${stats.drafts} borradores` },
      { label: "Alcance", num: (_a = stats.reach) != null ? _a : 0, sub: "total" },
      { label: "Leads", num: (_b = stats.leads) != null ? _b : 0, sub: `${stats.leads_30d} en 30d` }
    ];
    container.innerHTML = cards.map((c2) => `
    <div class="req-kpi-card">
      <span class="req-kpi-label">${c2.label}</span>
      <span class="req-kpi-number">${c2.num}</span>
      <span class="req-kpi-sub">${c2.sub}</span>
    </div>
  `).join("");
  }
  async function renderMktPlatforms(container) {
    if (!container) return;
    try {
      const platforms = await API.getMarketingPlatforms();
      container.innerHTML = platforms.map((p) => `
      <div class="mkt-platform-card">
        <div class="mkt-platform-icon">${_platformIcon(p.id)}</div>
        <div class="mkt-platform-info">
          <div class="mkt-platform-name">${esc(p.name)}</div>
          <div class="mkt-platform-status">${p.connected ? "Conectada" : "Sin conectar"}</div>
        </div>
        ${p.connected ? '<span class="admin-status-badge status-disponible mkt-badge-tiny">\u2713</span>' : '<span class="admin-status-badge status-oculta mkt-badge-tiny">\u2014</span>'}
      </div>
    `).join("");
    } catch (e) {
      container.innerHTML = '<div class="loading-state">Error al cargar</div>';
    }
  }
  function _platformIcon(id) {
    const icons = {
      facebook: "\u{1F4D8}",
      instagram: "\u{1F4F8}",
      linkedin: "\u{1F4BC}",
      google_business: "\u{1F4CD}",
      whatsapp: "\u{1F4AC}",
      email: "\u{1F4E7}"
    };
    return icons[id] || "\u{1F50C}";
  }
  async function loadMarketingPosts() {
    try {
      const posts = await API.getMarketingPosts();
      _mkPosts = posts || [];
      renderMktPosts($("mktPostsList"));
    } catch (e) {
      const el = $("mktPostsList");
      if (el) el.innerHTML = '<div class="loading-state">Error al cargar</div>';
    }
  }
  function renderMktPosts(container) {
    if (!container) return;
    if (!_mkPosts.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Sin publicaciones</div></div>';
      return;
    }
    container.innerHTML = _mkPosts.map((p) => {
      var _a, _b, _c;
      const statusCls = MKT_STATUS_CLS[p.status] || "status-oculta";
      const hasMedia = p.media_urls && p.media_urls.length;
      const eng = p.engagement || {};
      return `
      <button type="button" class="mkt-post-item" data-mkt-post="${p.id}" onclick="openMktPostPanel(${p.id})">
        <div class="mkt-post-thumb${hasMedia ? "" : "--empty"}">
          ${hasMedia ? `<img src="${esc(p.media_urls[0])}" alt="" onerror="this.style.display='none';this.parentElement.classList.add('mkt-post-thumb--empty');this.parentElement.textContent='\u{1F4F7}'">` : "\u{1F4F7}"}
        </div>
        <div class="mkt-post-body">
          <div class="mkt-post-body-top">
            <span class="admin-status-badge ${statusCls} mkt-badge-tiny">${MKT_POST_STATUS[p.status] || p.status}</span>
            <span class="mkt-meta">${esc(p.account_platform || "")} \xB7 ${esc(p.account_label || "")}</span>
            ${p.property_title ? `<span class="mkt-prop-title">${esc(p.property_title)}</span>` : ""}
          </div>
          <div class="mkt-post-text">${esc(p.content || "")}</div>
        </div>
        <div class="mkt-post-stats">
          <div class="mkt-post-stat">
            <span class="mkt-post-stat-num">${(_a = eng.likes) != null ? _a : 0}</span>
            likes
          </div>
          <div class="mkt-post-stat">
            <span class="mkt-post-stat-num">${(_b = eng.comments) != null ? _b : 0}</span>
            comments
          </div>
          <div class="mkt-post-stat">
            <span class="mkt-post-stat-num">${(_c = eng.shares) != null ? _c : 0}</span>
            shares
          </div>
        </div>
      </button>
    `;
    }).join("");
  }
  async function openMktPostPanel(id) {
    var _a, _b, _c, _d;
    try {
      const posts = await API.getMarketingPosts();
      const p = posts.find((x) => x.id === id);
      if (!p) {
        toast("Publicaci\xF3n no encontrada", "error");
        return;
      }
      _mkCurrentPost = p;
      $("mktPanelTitle").textContent = "Publicaci\xF3n #" + p.id;
      const body = $("mktPanelBody");
      const eng = p.engagement || {};
      const hasMedia = p.media_urls && p.media_urls.length;
      const statusCls = MKT_STATUS_CLS[p.status] || "status-oculta";
      body.innerHTML = `
      <div class="req-panel-section">
        <div class="req-panel-section-title">Vista Previa</div>
        ${hasMedia ? `<div class="mkt-media-grid">${p.media_urls.map((u) => `<img src="${esc(u)}" class="mkt-media-img" onerror="this.style.display='none'">`).join("")}</div>` : ""}
        <div class="mkt-content-box">${esc(p.content || "")}</div>
      </div>
      <div class="req-panel-section">
        <div class="req-panel-section-title">Detalles</div>
        <div class="req-panel-row"><span class="req-panel-label">Estado</span><span class="admin-status-badge ${statusCls}">${MKT_POST_STATUS[p.status] || p.status}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Plataforma</span><span class="req-panel-value">${esc(p.account_platform || "\u2014")}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Cuenta</span><span class="req-panel-value">${esc(p.account_label || "\u2014")}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Propiedad</span><span class="req-panel-value">${esc(p.property_title || "\u2014")}</span></div>
        ${p.scheduled_at ? `<div class="req-panel-row"><span class="req-panel-label">Programado</span><span class="req-panel-value">${formatDateShort(p.scheduled_at)}</span></div>` : ""}
        ${p.published_at ? `<div class="req-panel-row"><span class="req-panel-label">Publicado</span><span class="req-panel-value">${formatDateShort(p.published_at)}</span></div>` : ""}
      </div>
      <div class="req-panel-section">
        <div class="req-panel-section-title">Estad\xEDsticas</div>
        <div class="req-panel-row"><span class="req-panel-label">Likes</span><span class="req-panel-value mkt-num">${(_a = eng.likes) != null ? _a : 0}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Comentarios</span><span class="req-panel-value mkt-num">${(_b = eng.comments) != null ? _b : 0}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Compartidos</span><span class="req-panel-value mkt-num">${(_c = eng.shares) != null ? _c : 0}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Guardados</span><span class="req-panel-value mkt-num">${(_d = eng.saved) != null ? _d : 0}</span></div>
      </div>
      ${p.error ? `<div class="req-panel-section"><div class="req-panel-section-title">Error</div><div class="mkt-error-text">${esc(p.error)}</div></div>` : ""}
    `;
      $("mktOverlay").classList.add("show");
      $("mktPanel").classList.add("open");
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  function closeMktPanel() {
    $("mktOverlay").classList.remove("show");
    $("mktPanel").classList.remove("open");
    if ($("mktCampPanel")) $("mktCampPanel").classList.remove("open");
    _mkCurrentPost = null;
    _mkCurrentCampaign = null;
  }
  async function loadMarketingCampaigns() {
    try {
      const campaigns = await API.getMarketingCampaigns();
      _mkCampaigns = campaigns || [];
      renderMktCampaigns($("mktCampaignList"));
      renderMktCampaignStats($("mktCampStats"));
    } catch (e) {
      const el = $("mktCampaignList");
      if (el) el.innerHTML = '<div class="loading-state">Error al cargar</div>';
    }
  }
  function renderMktCampaigns(container) {
    if (!container) return;
    if (!_mkCampaigns.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Sin campa\xF1as</div></div>';
      return;
    }
    const statusClsMap = { draft: "status-oculta", active: "status-disponible", paused: "admin-prop-featured", completed: "status-vendida" };
    container.innerHTML = _mkCampaigns.map((c2) => `
    <button type="button" class="mkt-campaign-item" onclick="openMktCampaignPanel(${c2.id})">
      <div>
        <div class="mkt-campaign-name">${esc(c2.name)}</div>
        <div class="mkt-campaign-desc">${esc(c2.description || "")}</div>
        <div class="mkt-camp-status-wrap"><span class="admin-status-badge ${statusClsMap[c2.status] || "status-oculta"} mkt-badge-tiny">${MKT_CAMP_STATUS[c2.status] || c2.status}</span></div>
      </div>
      <div class="mkt-campaign-meta mkt-meta-col">
        <span class="mkt-meta">${c2.platform || "\u2014"}</span>
      </div>
      <div class="mkt-campaign-budget">$${(c2.budget || 0).toLocaleString("es-AR")}</div>
      <div class="mkt-campaign-roi">${c2.roi ? c2.roi + "x" : "\u2014"}</div>
    </button>
  `).join("");
  }
  function renderMktCampaignStats(container) {
    if (!container) return;
    const active = _mkCampaigns.filter((c2) => c2.status === "active").length;
    const totalBudget = _mkCampaigns.reduce((s, c2) => s + (c2.budget || 0), 0);
    const totalLeads = _mkCampaigns.reduce((s, c2) => s + (c2.leads_generated || 0), 0);
    container.innerHTML = `
    <div class="mkt-stats-grid">
      <div class="req-kpi-card"><span class="req-kpi-label">Activas</span><span class="req-kpi-number">${active}</span><span class="req-kpi-sub">de ${_mkCampaigns.length}</span></div>
      <div class="req-kpi-card"><span class="req-kpi-label">Presupuesto</span><span class="req-kpi-number">$${totalBudget.toLocaleString("es-AR")}</span><span class="req-kpi-sub">total</span></div>
      <div class="req-kpi-card"><span class="req-kpi-label">Leads</span><span class="req-kpi-number">${totalLeads}</span><span class="req-kpi-sub">generados</span></div>
    </div>
  `;
  }
  async function openMktCampaignPanel(id) {
    try {
      const c2 = _mkCampaigns.find((x) => x.id === id);
      if (!c2) {
        toast("Campa\xF1a no encontrada", "error");
        return;
      }
      _mkCurrentCampaign = c2;
      $("mktCampPanelTitle").textContent = esc(c2.name);
      const body = $("mktCampPanelBody");
      const statusClsMap = { draft: "status-oculta", active: "status-disponible", paused: "admin-prop-featured", completed: "status-vendida" };
      body.innerHTML = `
      <div class="req-panel-section">
        <div class="req-panel-section-title">Informaci\xF3n</div>
        <div class="req-panel-row"><span class="req-panel-label">Estado</span><span class="admin-status-badge ${statusClsMap[c2.status] || "status-oculta"}">${MKT_CAMP_STATUS[c2.status] || c2.status}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Plataforma</span><span class="req-panel-value">${esc(c2.platform || "\u2014")}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Presupuesto</span><span class="req-panel-value mkt-budget-value">$${(c2.budget || 0).toLocaleString("es-AR")}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">ROI</span><span class="req-panel-value mkt-roi-value">${c2.roi ? c2.roi + "x" : "\u2014"}</span></div>
        <div class="req-panel-row"><span class="req-panel-label">Leads</span><span class="req-panel-value mkt-num">${c2.leads_generated || 0}</span></div>
        ${c2.start_date ? `<div class="req-panel-row"><span class="req-panel-label">Inicio</span><span class="req-panel-value">${formatDateShort(c2.start_date)}</span></div>` : ""}
        ${c2.end_date ? `<div class="req-panel-row"><span class="req-panel-label">Fin</span><span class="req-panel-value">${formatDateShort(c2.end_date)}</span></div>` : ""}
      </div>
      ${c2.description ? `<div class="req-panel-section"><div class="req-panel-section-title">Descripci\xF3n</div><div class="req-panel-desc">${esc(c2.description)}</div></div>` : ""}
      ${c2.results ? `<div class="req-panel-section"><div class="req-panel-section-title">Resultados</div><div class="req-panel-desc">${esc(c2.results)}</div></div>` : ""}
      <div class="req-panel-section">
        <div class="req-panel-section-title">Acciones</div>
        <div class="req-actions">
          <button class="req-action-btn" onclick="editMktCampaign(${c2.id})">\u270F\uFE0F Editar campa\xF1a</button>
          <button class="req-action-btn" onclick="deleteMktCampaign(${c2.id})">\u{1F5D1}\uFE0F Eliminar campa\xF1a</button>
        </div>
      </div>
    `;
      $("mktOverlay").classList.add("show");
      $("mktCampPanel").classList.add("open");
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  function showNewCampaignForm() {
    _mkCurrentCampaign = null;
    const platforms = [
      ["", "Seleccionar..."],
      ["facebook", "Facebook"],
      ["instagram", "Instagram"],
      ["linkedin", "LinkedIn"],
      ["google_business", "Google Business"],
      ["whatsapp", "WhatsApp"],
      ["email", "Email"]
    ];
    const STATUSES = [
      ["draft", "Borrador"],
      ["active", "Activa"],
      ["paused", "Pausada"],
      ["completed", "Completada"]
    ];
    showModal("Nueva Campa\xF1a", `
<div class="crm-form mkt-form-sm">
          <div class="crm-form-row"><label>Nombre *</label><input id="mktCampName" class="field-input" value="${esc(c.name || "")}"/>
          </div>
          <div class="crm-form-row"><label>Descripci\xF3n</label><textarea id="mktCampDesc" class="field-input mkt-textarea-sm"></textarea></div>
      <div class="crm-form-inline">
        <div><label>Plataforma</label><select id="mktCampPlatform" class="field-input field-input--select">${platforms.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
        <div><label>Estado</label><select id="mktCampStatus" class="field-input field-input--select">${STATUSES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
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
    <button class="btn btn-primary" id="saveMktCampBtn">Crear campa\xF1a</button>
  `, null);
    $("saveMktCampBtn").onclick = saveMktCampaign;
  }
  async function saveMktCampaign() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    const data = {
      name: (_b = (_a = $("mktCampName")) == null ? void 0 : _a.value) == null ? void 0 : _b.trim(),
      description: (_d = (_c = $("mktCampDesc")) == null ? void 0 : _c.value) == null ? void 0 : _d.trim(),
      platform: ((_e = $("mktCampPlatform")) == null ? void 0 : _e.value) || "",
      status: ((_f = $("mktCampStatus")) == null ? void 0 : _f.value) || "draft",
      budget: parseFloat((_g = $("mktCampBudget")) == null ? void 0 : _g.value) || 0,
      roi: parseFloat((_h = $("mktCampRoi")) == null ? void 0 : _h.value) || 0,
      leads_generated: parseInt((_i = $("mktCampLeads")) == null ? void 0 : _i.value) || 0,
      start_date: ((_j = $("mktCampStart")) == null ? void 0 : _j.value) || null,
      end_date: ((_k = $("mktCampEnd")) == null ? void 0 : _k.value) || null,
      results: ((_m = (_l = $("mktCampResults")) == null ? void 0 : _l.value) == null ? void 0 : _m.trim()) || ""
    };
    if (!data.name) {
      toast("El nombre es obligatorio", "warn");
      return;
    }
    try {
      await API.createMarketingCampaign(data);
      toast("Campa\xF1a creada", "success");
      closeModal();
      loadMarketingCampaigns();
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  async function editMktCampaign(id) {
    const c2 = _mkCampaigns.find((x) => x.id === id);
    if (!c2) return;
    const platforms = [
      ["", "Seleccionar..."],
      ["facebook", "Facebook"],
      ["instagram", "Instagram"],
      ["linkedin", "LinkedIn"],
      ["google_business", "Google Business"],
      ["whatsapp", "WhatsApp"],
      ["email", "Email"]
    ];
    const STATUSES = [
      ["draft", "Borrador"],
      ["active", "Activa"],
      ["paused", "Pausada"],
      ["completed", "Completada"]
    ];
    showModal("Editar Campa\xF1a", `
<div class="crm-form mkt-form-sm">
          <div class="crm-form-row"><label>Nombre</label><input id="mktCampName" class="field-input" value="${esc(c2.name || "")}"/>
          </div>
          <div class="crm-form-row"><label>Descripci\xF3n</label><textarea id="mktCampDesc" class="field-input mkt-textarea-sm">${esc(c2.description || "")}</textarea></div>
      <div class="crm-form-inline">
        <div><label>Plataforma</label><select id="mktCampPlatform" class="field-input field-input--select">${platforms.map(([v, l]) => `<option value="${v}"${c2.platform === v ? " selected" : ""}>${l}</option>`).join("")}</select></div>
        <div><label>Estado</label><select id="mktCampStatus" class="field-input field-input--select">${STATUSES.map(([v, l]) => `<option value="${v}"${c2.status === v ? " selected" : ""}>${l}</option>`).join("")}</select></div>
      </div>
      <div class="crm-form-inline">
        <div><label>Presupuesto ($)</label><input type="number" id="mktCampBudget" class="field-input" value="${c2.budget || 0}" min="0" step="100"></div>
        <div><label>ROI (x)</label><input type="number" id="mktCampRoi" class="field-input" value="${c2.roi || 0}" min="0" step="0.1"></div>
      </div>
      <div class="crm-form-inline">
        <div><label>Inicio</label><input type="date" id="mktCampStart" class="field-input" value="${c2.start_date || ""}"></div>
        <div><label>Fin</label><input type="date" id="mktCampEnd" class="field-input" value="${c2.end_date || ""}"></div>
      </div>
      <div class="crm-form-row"><label>Leads generados</label><input type="number" id="mktCampLeads" class="field-input" value="${c2.leads_generated || 0}" min="0"></div>
      <div class="crm-form-row"><label>Resultados</label><textarea id="mktCampResults" class="field-input mkt-textarea-sm">${esc(c2.results || "")}</textarea></div>
    </div>
  `, `
    <button class="btn btn-primary" id="saveMktCampBtn">Guardar cambios</button>
  `, null);
    $("saveMktCampBtn").onclick = async () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
      const data = {
        name: (_b = (_a = $("mktCampName")) == null ? void 0 : _a.value) == null ? void 0 : _b.trim(),
        description: (_d = (_c = $("mktCampDesc")) == null ? void 0 : _c.value) == null ? void 0 : _d.trim(),
        platform: ((_e = $("mktCampPlatform")) == null ? void 0 : _e.value) || "",
        status: ((_f = $("mktCampStatus")) == null ? void 0 : _f.value) || "draft",
        budget: parseFloat((_g = $("mktCampBudget")) == null ? void 0 : _g.value) || 0,
        roi: parseFloat((_h = $("mktCampRoi")) == null ? void 0 : _h.value) || 0,
        leads_generated: parseInt((_i = $("mktCampLeads")) == null ? void 0 : _i.value) || 0,
        start_date: ((_j = $("mktCampStart")) == null ? void 0 : _j.value) || null,
        end_date: ((_k = $("mktCampEnd")) == null ? void 0 : _k.value) || null,
        results: ((_m = (_l = $("mktCampResults")) == null ? void 0 : _l.value) == null ? void 0 : _m.trim()) || ""
      };
      if (!data.name) {
        toast("El nombre es obligatorio", "warn");
        return;
      }
      try {
        await API.updateMarketingCampaign(id, data);
        toast("Campa\xF1a actualizada", "success");
        closeModal();
        closeMktPanel();
        loadMarketingCampaigns();
      } catch (e) {
        toast("Error: " + e.message, "error");
      }
    };
  }
  async function deleteMktCampaign(id) {
    if (!await confirmModal("\xBFEliminar esta campa\xF1a definitivamente?")) return;
    try {
      await API.deleteMarketingCampaign(id);
      toast("Campa\xF1a eliminada", "success");
      closeMktPanel();
      loadMarketingCampaigns();
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
  }
  async function loadMarketingStats() {
    const container = $("mktStatsCharts");
    if (!container) return;
    try {
      const data = await API.getMarketingMetrics("30");
      renderMktStats(container, data);
    } catch (e) {
      container.innerHTML = '<div class="loading-state">Error al cargar estad\xEDsticas</div>';
    }
  }
  function renderMktStats(container, data) {
    if (!container) return;
    const dates = data.dates || [];
    const postsByDate = data.posts_by_date || {};
    const leadsByDate = data.leads_by_date || {};
    const metrics = data.metrics || [];
    const metricsByType = {};
    metrics.forEach((m) => {
      if (!metricsByType[m.metric]) metricsByType[m.metric] = {};
      metricsByType[m.metric][m.date] = (metricsByType[m.metric][m.date] || 0) + m.value;
    });
    const reachData = metricsByType["reach"] || {};
    const clicksData = metricsByType["clicks"] || {};
    const leadsMetricData = metricsByType["leads"] || {};
    container.innerHTML = `
    <div class="mkt-dash-card mkt-dash-card-full">
      <div class="mkt-dash-card-header">
        <span>Publicaciones por d\xEDa (\xFAltimos 30 d\xEDas)</span>
      </div>
      <div class="mkt-chart-bar-container mkt-chart-bar-container--80">
        ${dates.map((d) => {
      const val = postsByDate[d] || 0;
      const max = Math.max(...Object.values(postsByDate), 1);
      const pct = Math.max(val / max * 100, 1);
      return `<div class="mkt-chart-bar-wrap">
            <span class="mkt-chart-bar-label">${val}</span>
            <div class="mkt-chart-bar mkt-chart-bar--posts" style="height:${pct}%"></div>
          </div>`;
    }).join("")}
      </div>
    </div>
    <div class="mkt-dash-card">
      <div class="mkt-dash-card-header">
        <span>Alcance</span>
        <span class="mkt-num">${Object.values(reachData).reduce((a, b) => a + b, 0).toLocaleString("es-AR")}</span>
      </div>
      <div class="mkt-chart-bar-container mkt-chart-bar-container--60">
        ${dates.map((d) => {
      const val = reachData[d] || 0;
      const max = Math.max(...Object.values(reachData), 1);
      const pct = Math.max(val / max * 100, 1);
      return `<div class="mkt-chart-bar-single mkt-chart-bar--reach" style="height:${pct}%"></div>`;
    }).join("")}
      </div>
    </div>
    <div class="mkt-dash-card">
      <div class="mkt-dash-card-header">
        <span>Leads por d\xEDa</span>
        <span class="mkt-num">${Object.values(leadsByDate).reduce((a, b) => a + b, 0)}</span>
      </div>
      <div class="mkt-chart-bar-container mkt-chart-bar-container--60">
        ${dates.map((d) => {
      const val = leadsByDate[d] || 0;
      const max = Math.max(...Object.values(leadsByDate), 1);
      const pct = Math.max(val / max * 100, 1);
      return `<div class="mkt-chart-bar-single mkt-chart-bar--leads" style="height:${pct}%"></div>`;
    }).join("")}
      </div>
    </div>
  `;
  }
  function formatDateShort(d) {
    if (!d) return "\u2014";
    try {
      const dt = /* @__PURE__ */ new Date(d + (d.includes("T") ? "" : "T00:00:00"));
      return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch (e) {
      return d;
    }
  }
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
  var _calView = "month";
  var _calDate = /* @__PURE__ */ new Date();
  var _calEvents = [];
  var _calPanelOpen = false;
  var _calMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  function loadCalendar() {
    loadCalendarKpi();
    renderCalendarView();
    loadCalendarActivity("upcoming");
  }
  window.loadCalendar = loadCalendar;
  async function loadCalendarKpi() {
    const bar = document.getElementById("calKpiBar");
    if (!bar) return;
    bar.innerHTML = '<div class="loading-state cal-kpi-loading">Cargando estad\xEDsticas...</div>';
    try {
      const d = await API._rawReq("GET", "/api/calendar/kpi");
      const labels = [
        { key: "today_events", label: "Hoy", cls: "cal-kpi-accent" },
        { key: "week_events", label: "Esta semana", cls: "" },
        { key: "visits", label: "Visitas", cls: "cal-kpi-accent" },
        { key: "appraisals", label: "Tasaciones", cls: "" },
        { key: "calls", label: "Llamadas", cls: "" },
        { key: "overdue", label: "Vencidas", cls: "cal-kpi-warn" },
        { key: "completed_today", label: "Completadas hoy", cls: "cal-kpi-success" },
        { key: "completion_rate", label: "Completado %", cls: "" }
      ];
      bar.innerHTML = labels.map((l) => {
        var _a;
        const val = (_a = d[l.key]) != null ? _a : 0;
        const display = l.key === "completion_rate" ? val + "%" : val;
        return `<div class="cal-kpi-card"><span class="cal-kpi-number ${l.cls}">${display}</span><span class="cal-kpi-label">${l.label}</span></div>`;
      }).join("");
    } catch (e) {
      bar.innerHTML = '<div class="error-state">Error al cargar KPIs</div>';
    }
  }
  function renderCalendarView() {
    const wrap = document.getElementById("calGridWrap");
    if (!wrap) return;
    if (_calView === "month") renderMonthView();
    else if (_calView === "week") renderWeekView();
    else renderDayView();
    updateNavLabel();
  }
  function updateNavLabel() {
    const lbl = document.getElementById("calNavLabel");
    if (!lbl) return;
    const y = _calDate.getFullYear();
    const m = _calDate.getMonth();
    const d = _calDate.getDate();
    if (_calView === "month") lbl.textContent = _calMonths[m] + " " + y;
    else if (_calView === "week") {
      const ref = new Date(y, m, d);
      const start = new Date(ref);
      start.setDate(ref.getDate() - ref.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      lbl.textContent = start.getDate() + " " + _calMonths[start.getMonth()] + " - " + end.getDate() + " " + _calMonths[end.getMonth()] + " " + y;
    } else {
      lbl.textContent = d + " " + _calMonths[m] + " " + y;
    }
  }
  async function fetchEvents(view, year, month, day) {
    let params = "view=" + view;
    if (year) params += "&year=" + year;
    if (month) params += "&month=" + month;
    if (day) params += "&day=" + day;
    try {
      const data = await API._rawReq("GET", "/api/calendar/events?" + params);
      _calEvents = data || [];
      return _calEvents;
    } catch (e) {
      _calEvents = [];
      return [];
    }
  }
  function getEventTypeColor(type) {
    const colors = {
      visita: "var(--admin-accent)",
      reunion: "var(--admin-cal-reunion)",
      llamada: "var(--admin-cal-llamada)",
      tasacion: "var(--admin-cal-tasacion)",
      recordatorio: "var(--admin-cal-recordatorio)",
      tarea: "var(--admin-cal-tarea)",
      evento: "var(--admin-cal-evento)"
    };
    return colors[type] || "var(--admin-text-muted)";
  }
  function getEventTypeLabel(type) {
    const labels = {
      visita: "Visita",
      reunion: "Reuni\xF3n",
      llamada: "Llamada",
      tasacion: "Tasaci\xF3n",
      recordatorio: "Recordatorio",
      tarea: "Tarea",
      evento: "Evento"
    };
    return labels[type] || type;
  }
  async function renderMonthView() {
    const wrap = document.getElementById("calGridWrap");
    if (!wrap) return;
    const year = _calDate.getFullYear();
    const month = _calDate.getMonth();
    await fetchEvents("month", year, month + 1);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const today = /* @__PURE__ */ new Date();
    const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    const eventsByDate = {};
    _calEvents.forEach(function(e) {
      if (!e.start_at) return;
      const key = e.start_at.substring(0, 10);
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push(e);
    });
    var h = '<div class="cal-grid-header">' + ["Dom", "Lun", "Mar", "Mi\xE9", "Jue", "Vie", "S\xE1b"].map(function(d2) {
      return "<div>" + d2 + "</div>";
    }).join("") + '</div><div class="cal-grid">';
    for (var i = firstDay - 1; i >= 0; i--) {
      var day = daysInPrev - i;
      var mStr = String(month).padStart(2, "0");
      var dStr = String(day).padStart(2, "0");
      var yStr = month === 0 ? year - 1 : year;
      var pm = month === 0 ? 11 : month - 1;
      var dateStr = yStr + "-" + String(pm + 1).padStart(2, "0") + "-" + dStr;
      var dayEvents = eventsByDate[dateStr] || [];
      var lblPrev = day + " de " + _calMonths[pm] + " de " + yStr + (dayEvents.length ? ", " + dayEvents.length + " evento" + (dayEvents.length !== 1 ? "s" : "") : "");
      h += '<div class="cal-day cal-day--other" role="button" tabindex="0" aria-label="' + lblPrev + `" onclick="switchCalView('day',` + yStr + "," + (pm + 1) + "," + day + ')"><div class="cal-day-num">' + day + "</div>" + dayEvents.slice(0, 2).map(function(e) {
        return '<button type="button" class="cal-day-event cal-day-event--' + e.event_type + '" onclick="event.stopPropagation();openCalEvent(' + e.id + ')">' + esc(e.title) + "</button>";
      }).join("") + (dayEvents.length > 2 ? '<button type="button" class="cal-day-more">+' + (dayEvents.length - 2) + " m\xE1s</button>" : "") + "</div>";
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      var isToday = dateStr === todayStr;
      var dayEvents = eventsByDate[dateStr] || [];
      var lblCur = d + " de " + _calMonths[month] + " de " + year + (isToday ? ", hoy" : "") + (dayEvents.length ? ", " + dayEvents.length + " evento" + (dayEvents.length !== 1 ? "s" : "") : "");
      h += '<div class="cal-day' + (isToday ? " cal-day--today" : "") + '" role="button" tabindex="0" aria-label="' + lblCur + `" onclick="switchCalView('day',` + year + "," + (month + 1) + "," + d + ')"><div class="cal-day-num">' + d + "</div>" + dayEvents.slice(0, 3).map(function(e) {
        return '<button type="button" class="cal-day-event cal-day-event--' + e.event_type + '" onclick="event.stopPropagation();openCalEvent(' + e.id + ')">' + esc(e.title) + "</button>";
      }).join("") + (dayEvents.length > 3 ? '<button type="button" class="cal-day-more">+' + (dayEvents.length - 3) + " m\xE1s</button>" : "") + "</div>";
    }
    var totalCells = firstDay + daysInMonth;
    var remaining = (7 - totalCells % 7) % 7;
    for (var r = 1; r <= remaining; r++) {
      var nm = month + 1;
      var ny = year;
      if (nm > 11) {
        nm = 0;
        ny++;
      }
      var dateStr2 = ny + "-" + String(nm + 1).padStart(2, "0") + "-" + String(r).padStart(2, "0");
      var dayEvents2 = eventsByDate[dateStr2] || [];
      var lblRem = r + " de " + _calMonths[nm] + " de " + ny + (dayEvents2.length ? ", " + dayEvents2.length + " evento" + (dayEvents2.length !== 1 ? "s" : "") : "");
      h += '<div class="cal-day cal-day--other" role="button" tabindex="0" aria-label="' + lblRem + `" onclick="switchCalView('day',` + ny + "," + (nm + 1) + "," + r + ')"><div class="cal-day-num">' + r + "</div>" + dayEvents2.slice(0, 2).map(function(e) {
        return '<button type="button" class="cal-day-event cal-day-event--' + e.event_type + '" onclick="event.stopPropagation();openCalEvent(' + e.id + ')">' + esc(e.title) + "</button>";
      }).join("") + (dayEvents2.length > 2 ? '<button type="button" class="cal-day-more">+' + (dayEvents2.length - 2) + " m\xE1s</button>" : "") + "</div>";
    }
    h += "</div>";
    wrap.innerHTML = h;
  }
  async function renderWeekView() {
    const wrap = document.getElementById("calGridWrap");
    if (!wrap) return;
    const year = _calDate.getFullYear();
    const month = _calDate.getMonth();
    const day = _calDate.getDate();
    await fetchEvents("week", year, month + 1, day);
    const ref = new Date(year, month, day);
    const start = new Date(ref);
    start.setDate(ref.getDate() - ref.getDay());
    const days = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    const today = /* @__PURE__ */ new Date();
    const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    const eventsByDate = {};
    _calEvents.forEach(function(e) {
      if (!e.start_at) return;
      var key = e.start_at.substring(0, 10);
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push(e);
    });
    var h = '<div class="cal-grid-header">' + days.map(function(d2) {
      return "<div>" + ["Dom", "Lun", "Mar", "Mi\xE9", "Jue", "Vie", "S\xE1b"][d2.getDay()] + " " + d2.getDate() + "</div>";
    }).join("") + '</div><div class="cal-grid">';
    days.forEach(function(d2) {
      var ds = d2.getFullYear() + "-" + String(d2.getMonth() + 1).padStart(2, "0") + "-" + String(d2.getDate()).padStart(2, "0");
      var isToday = ds === todayStr;
      var dayEvents = eventsByDate[ds] || [];
      var lblWeek = d2.getDate() + " de " + _calMonths[d2.getMonth()] + " de " + d2.getFullYear() + (isToday ? ", hoy" : "") + (dayEvents.length ? ", " + dayEvents.length + " evento" + (dayEvents.length !== 1 ? "s" : "") : "");
      h += '<div class="cal-day' + (isToday ? " cal-day--today" : "") + '" role="button" tabindex="0" aria-label="' + lblWeek + `" onclick="switchCalView('day',` + d2.getFullYear() + "," + (d2.getMonth() + 1) + "," + d2.getDate() + ')"><div class="cal-day-num">' + d2.getDate() + "</div>" + dayEvents.slice(0, 4).map(function(e) {
        return '<button type="button" class="cal-day-event cal-day-event--' + e.event_type + '" onclick="event.stopPropagation();openCalEvent(' + e.id + ')">' + esc(e.title) + "</button>";
      }).join("") + (dayEvents.length > 4 ? '<button type="button" class="cal-day-more">+' + (dayEvents.length - 4) + " m\xE1s</button>" : "") + "</div>";
    });
    h += "</div>";
    wrap.innerHTML = h;
  }
  async function renderDayView() {
    const wrap = document.getElementById("calGridWrap");
    if (!wrap) return;
    const year = _calDate.getFullYear();
    const month = _calDate.getMonth() + 1;
    const day = _calDate.getDate();
    await fetchEvents("day", year, month, day);
    if (!_calEvents.length) {
      wrap.innerHTML = '<div class="cal-day-view"><div class="cal-day-view-empty">Sin eventos para este d\xEDa</div></div>';
      return;
    }
    _calEvents.sort(function(a, b) {
      return (a.start_at || "").localeCompare(b.start_at || "");
    });
    var h = '<div class="cal-day-view">';
    _calEvents.forEach(function(e) {
      var time = e.start_at ? e.start_at.substring(11, 16) : "";
      var endTime = e.end_at ? e.end_at.substring(11, 16) : "";
      var color = getEventTypeColor(e.event_type);
      h += '<button type="button" class="cal-time-slot" onclick="openCalEvent(' + e.id + ')"><div class="cal-time-label">' + time + (endTime ? " - " + endTime : "") + '</div><div class="cal-time-content"><div class="cal-event-header"><span class="cal-event-dot" style="background:' + color + '"></span><span class="cal-event-title">' + esc(e.title) + '</span><span class="admin-status-badge status-' + e.status + ' cal-event-status-badge">' + e.status + "</span></div>" + (e.client_name ? '<div class="cal-event-client">' + esc(e.client_name) + "</div>" : "") + "</div></button>";
    });
    h += "</div>";
    wrap.innerHTML = h;
  }
  async function loadCalendarActivity(view) {
    const list = document.getElementById("calActivityList");
    if (!list) return;
    list.innerHTML = '<div class="loading-state">Cargando...</div>';
    try {
      var data = await API._rawReq("GET", "/api/calendar/events?view=" + view);
      if (!data || !data.length) {
        list.innerHTML = '<div class="empty-state">Sin actividades</div>';
        return;
      }
      var typeIcons = { visita: "\u{1F3E0}", reunion: "\u{1F91D}", llamada: "\u{1F4DE}", tasacion: "\u{1F4CB}", recordatorio: "\u{1F514}", tarea: "\u2705", evento: "\u{1F4C5}" };
      var statusLabels = { pendiente: "Pendiente", confirmado: "Confirmado", completado: "Completado", cancelado: "Cancelado", reprogramado: "Reprogramado" };
      list.innerHTML = data.map(function(e) {
        var date = e.start_at ? e.start_at.substring(0, 10) : "";
        var time = e.start_at ? e.start_at.substring(11, 16) : "";
        return '<button type="button" class="cal-activity-item" onclick="openCalEvent(' + e.id + ')"><div class="cal-activity-icon" style="background:' + getEventTypeColor(e.event_type) + '15">' + (typeIcons[e.event_type] || "\u{1F4CC}") + '</div><div class="cal-activity-body"><div class="cal-activity-title">' + esc(e.title) + '</div><div class="cal-activity-meta"><span>' + getEventTypeLabel(e.event_type) + "</span>" + (e.client_name ? "<span>" + esc(e.client_name) + "</span>" : "") + "<span>" + date + " " + time + '</span><span class="admin-status-badge status-' + e.status + '">' + (statusLabels[e.status] || e.status) + "</span></div></div></button>";
      }).join("");
    } catch (e) {
      list.innerHTML = '<div class="error-state">Error al cargar</div>';
    }
  }
  window.loadCalendarActivity = loadCalendarActivity;
  function calNavigate(dir) {
    if (_calView === "month") _calDate.setMonth(_calDate.getMonth() + dir);
    else if (_calView === "week") _calDate.setDate(_calDate.getDate() + dir * 7);
    else _calDate.setDate(_calDate.getDate() + dir);
    renderCalendarView();
    var activityView = document.querySelector(".cal-subtab.active[data-cal-tab]");
    if (activityView) loadCalendarActivity(activityView.getAttribute("data-cal-tab"));
    else loadCalendarActivity("upcoming");
  }
  window.calNavigate = calNavigate;
  function calToday() {
    _calDate = /* @__PURE__ */ new Date();
    renderCalendarView();
    loadCalendarActivity("upcoming");
  }
  window.calToday = calToday;
  function switchCalView(view, year, month, day) {
    _calView = view;
    if (year) _calDate = new Date(year, (month || 1) - 1, day || 1);
    document.querySelectorAll(".cal-view-btn").forEach(function(b) {
      b.classList.toggle("active", b.getAttribute("data-cal-view") === view);
    });
    renderCalendarView();
  }
  window.switchCalView = switchCalView;
  async function openCalEvent(id) {
    var overlay = document.getElementById("calOverlay");
    var panel = document.getElementById("calPanel");
    var body = document.getElementById("calPanelBody");
    var title = document.getElementById("calPanelTitle");
    if (!panel || !body) return;
    _calPanelOpen = true;
    if (overlay) overlay.classList.remove("hidden");
    panel.classList.add("open");
    title.textContent = "Cargando...";
    body.innerHTML = '<div class="loading-state">Cargando detalle...</div>';
    try {
      var e = await API._rawReq("GET", "/api/calendar/events/" + id);
      if (!e) {
        body.innerHTML = '<div class="error-state">Evento no encontrado</div>';
        return;
      }
      title.textContent = e.title;
      var statusLabels = { pendiente: "Pendiente", confirmado: "Confirmado", completado: "Completado", cancelado: "Cancelado", reprogramado: "Reprogramado" };
      var priorityLabels = { baja: "Baja", media: "Media", alta: "Alta", urgente: "Urgente" };
      var priorityColors = { baja: "var(--admin-text-muted)", media: "#eab308", alta: "var(--admin-accent)", urgente: "var(--admin-danger)" };
      var time = e.start_at ? e.start_at.substring(11, 16) : "";
      var endTime = e.end_at ? e.end_at.substring(11, 16) : "";
      var date = e.start_at ? e.start_at.substring(0, 10) : "";
      var h = "";
      h += '<div class="cal-panel-section">';
      h += '<div class="cal-panel-header-row">';
      h += '<span class="admin-status-badge status-' + e.status + '">' + (statusLabels[e.status] || e.status) + "</span>";
      h += '<span class="cal-panel-type">' + getEventTypeLabel(e.event_type) + "</span>";
      h += '<span class="cal-panel-priority" style="color:' + (priorityColors[e.priority] || "var(--admin-text-muted)") + '">' + (priorityLabels[e.priority] || e.priority) + "</span>";
      h += "</div>";
      h += '<div class="cal-panel-info">';
      if (e.client_name) h += '<div class="cal-panel-field"><span class="cal-panel-label">Cliente</span><span class="cal-panel-value">' + esc(e.client_name) + "</span></div>";
      if (e.client_phone) h += '<div class="cal-panel-field"><span class="cal-panel-label">Tel\xE9fono</span><span class="cal-panel-value">' + esc(e.client_phone) + "</span></div>";
      h += '<div class="cal-panel-field"><span class="cal-panel-label">Fecha</span><span class="cal-panel-value">' + date + "</span></div>";
      h += '<div class="cal-panel-field"><span class="cal-panel-label">Hora</span><span class="cal-panel-value">' + time + (endTime ? " - " + endTime : "") + "</span></div>";
      if (e.location) h += '<div class="cal-panel-field"><span class="cal-panel-label">Ubicaci\xF3n</span><span class="cal-panel-value">' + esc(e.location) + "</span></div>";
      if (e.agent_name) h += '<div class="cal-panel-field"><span class="cal-panel-label">Agente</span><span class="cal-panel-value">' + esc(e.agent_name) + "</span></div>";
      if (e.property_title) h += '<div class="cal-panel-field"><span class="cal-panel-label">Propiedad</span><span class="cal-panel-value">' + esc(e.property_title) + "</span></div>";
      if (e.lead_name) h += '<div class="cal-panel-field"><span class="cal-panel-label">Lead</span><span class="cal-panel-value">' + esc(e.lead_name) + "</span></div>";
      h += "</div></div>";
      if (e.description) {
        h += '<div class="cal-panel-section">';
        h += '<div class="cal-panel-section-title">Descripci\xF3n</div>';
        h += '<div class="cal-panel-desc">' + esc(e.description) + "</div>";
        h += "</div>";
      }
      h += '<div class="cal-panel-section">';
      h += '<div class="cal-panel-section-title">Acciones</div>';
      h += '<div class="cal-actions">';
      if (e.status !== "completado") h += '<button class="btn btn-primary btn-sm" onclick="calAction(' + e.id + `,'complete')">\u2713 Completar</button>`;
      if (e.status !== "cancelado") h += '<button class="btn btn-ghost btn-sm" onclick="calAction(' + e.id + `,'cancel')">\u2715 Cancelar</button>`;
      h += '<button class="btn btn-ghost btn-sm" onclick="calAction(' + e.id + `,'reschedule')">\u21BB Reprogramar</button>`;
      h += '<button class="btn btn-ghost btn-sm" onclick="calEditEvent(' + e.id + ')">\u270E Editar</button>';
      h += '<button class="btn btn-ghost btn-sm cal-btn-danger" onclick="calDeleteEvent(' + e.id + ')">\u{1F5D1} Eliminar</button>';
      h += "</div></div>";
      h += '<div class="cal-panel-section">';
      h += '<div class="cal-panel-section-title">Comentarios</div>';
      if (e.comments && e.comments.length) {
        e.comments.forEach(function(c2) {
          var initial = (c2.created_by_name || "?")[0];
          h += '<div class="cal-comment-item"><div class="cal-comment-avatar">' + initial + '</div><div class="cal-comment-content">';
          h += '<div class="cal-comment-header"><span class="cal-comment-author">' + esc(c2.created_by_name || "Sistema") + '</span><span class="cal-comment-time">' + (c2.created_at ? c2.created_at.substring(0, 16).replace("T", " ") : "") + "</span></div>";
          h += '<div class="cal-comment-text">' + esc(c2.content) + "</div></div></div>";
        });
      }
      h += '<div class="cal-comment-input-area">';
      h += '<input type="text" class="field-input" id="calNewComment" placeholder="Escrib\xED un comentario..." />';
      h += '<button class="btn btn-primary btn-sm" onclick="calAddComment(' + e.id + ')">Enviar</button>';
      h += "</div></div>";
      body.innerHTML = h;
    } catch (err) {
      body.innerHTML = '<div class="error-state">Error: ' + err.message + "</div>";
    }
  }
  window.openCalEvent = openCalEvent;
  function closeCalPanel() {
    _calPanelOpen = false;
    var overlay = document.getElementById("calOverlay");
    var panel = document.getElementById("calPanel");
    if (overlay) overlay.classList.add("hidden");
    if (panel) panel.classList.remove("open");
  }
  window.closeCalPanel = closeCalPanel;
  async function calAction(id, action) {
    var data = { action };
    if (action === "reschedule") {
      var newDate = prompt("Nueva fecha (YYYY-MM-DD HH:MM):");
      if (!newDate) return;
      data.start_at = newDate;
    }
    try {
      await API._rawReq("POST", "/api/calendar/events/" + id + "/action", data);
      toast("Evento actualizado", "success");
      openCalEvent(id);
      renderCalendarView();
      var activeTab = document.querySelector(".cal-subtab.active[data-cal-tab]");
      if (activeTab) loadCalendarActivity(activeTab.getAttribute("data-cal-tab"));
      loadCalendarKpi();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  window.calAction = calAction;
  async function calAddComment(eventId) {
    var input = document.getElementById("calNewComment");
    if (!input || !input.value.trim()) return;
    try {
      await API._rawReq("POST", "/api/calendar/events/" + eventId + "/comments", { content: input.value.trim() });
      input.value = "";
      openCalEvent(eventId);
    } catch (e) {
      toast(e.message, "error");
    }
  }
  window.calAddComment = calAddComment;
  async function calDeleteEvent(id) {
    if (!await confirmModal("\xBFEliminar este evento permanentemente?")) return;
    try {
      await API._rawReq("DELETE", "/api/calendar/events/" + id);
      toast("Evento eliminado", "success");
      closeCalPanel();
      renderCalendarView();
      loadCalendarKpi();
      var activeTab = document.querySelector(".cal-subtab.active[data-cal-tab]");
      if (activeTab) loadCalendarActivity(activeTab.getAttribute("data-cal-tab"));
    } catch (e) {
      toast(e.message, "error");
    }
  }
  window.calDeleteEvent = calDeleteEvent;
  function calEditEvent(id) {
    closeCalPanel();
    var e = _calEvents.find(function(x) {
      return x.id === id;
    });
    if (!e) {
      toast("Evento no encontrado", "error");
      return;
    }
    openCalEventForm(e);
  }
  window.calEditEvent = calEditEvent;
  function openCalEventForm(event) {
    var modal = document.getElementById("calEventFormModal");
    var content = document.getElementById("calEventFormContent");
    var title = document.getElementById("calEventFormTitle");
    if (!modal || !content) return;
    var isEdit = !!event;
    title.textContent = isEdit ? "Editar evento" : "Nuevo evento";
    var e = event || {};
    var start = e.start_at ? e.start_at.substring(0, 16) : "";
    var end = e.end_at ? e.end_at.substring(0, 16) : "";
    var typeOptions = ["visita", "reunion", "llamada", "tasacion", "recordatorio", "tarea", "evento"].map(function(t) {
      return '<option value="' + t + '"' + (e.event_type === t ? " selected" : "") + ">" + getEventTypeLabel(t) + "</option>";
    }).join("");
    content.innerHTML = '<div class="pf-body"><div class="field"><label class="field-label">T\xEDtulo *</label><input id="calFormTitle" class="field-input" value="' + esc(e.title || "") + '"/></div><div class="field"><label class="field-label">Tipo</label><select id="calFormType" class="field-input field-input--select">' + typeOptions + '</select></div><div class="cal-form-grid"><div class="field"><label class="field-label">Inicio *</label><input id="calFormStart" type="datetime-local" class="field-input" value="' + start + '"/></div><div class="field"><label class="field-label">Fin</label><input id="calFormEnd" type="datetime-local" class="field-input" value="' + end + '"/></div></div><div class="field"><label class="field-label">Cliente</label><input id="calFormClient" class="field-input" value="' + esc(e.client_name || "") + '"/></div><div class="field"><label class="field-label">Tel\xE9fono</label><input id="calFormPhone" class="field-input" value="' + esc(e.client_phone || "") + '"/></div><div class="field"><label class="field-label">Ubicaci\xF3n</label><input id="calFormLocation" class="field-input" value="' + esc(e.location || "") + '"/></div><div class="cal-form-grid"><div class="field"><label class="field-label">Prioridad</label><select id="calFormPriority" class="field-input field-input--select">' + ["baja", "media", "alta", "urgente"].map(function(p) {
      return '<option value="' + p + '"' + (e.priority === p ? " selected" : "") + ">" + p.charAt(0).toUpperCase() + p.slice(1) + "</option>";
    }).join("") + '</select></div><div class="field"><label class="field-label">Estado</label><select id="calFormStatus" class="field-input field-input--select">' + ["pendiente", "confirmado", "completado", "cancelado"].map(function(s) {
      return '<option value="' + s + '"' + (e.status === s ? " selected" : "") + ">" + s.charAt(0).toUpperCase() + s.slice(1) + "</option>";
    }).join("") + '</select></div></div><div class="field"><label class="field-label">Descripci\xF3n</label><textarea id="calFormDesc" class="field-input cal-form-desc">' + esc(e.description || "") + '</textarea></div><div class="cal-form-actions"><button class="btn btn-primary btn-full" id="saveCalEventBtn">' + (isEdit ? "Guardar cambios" : "Crear evento") + `</button><button class="btn btn-ghost" onclick="document.getElementById('calEventFormModal').classList.add('hidden')">Cancelar</button></div></div>`;
    modal.classList.remove("hidden");
    document.getElementById("saveCalEventBtn").onclick = function() {
      var titleVal = document.getElementById("calFormTitle").value.trim();
      if (!titleVal) {
        toast("El t\xEDtulo es requerido", "warn");
        return;
      }
      var startVal = document.getElementById("calFormStart").value;
      if (!startVal) {
        toast("La fecha de inicio es requerida", "warn");
        return;
      }
      var body = {
        title: titleVal,
        event_type: document.getElementById("calFormType").value,
        start_at: new Date(startVal).toISOString(),
        end_at: document.getElementById("calFormEnd").value ? new Date(document.getElementById("calFormEnd").value).toISOString() : null,
        client_name: document.getElementById("calFormClient").value,
        client_phone: document.getElementById("calFormPhone").value,
        location: document.getElementById("calFormLocation").value,
        priority: document.getElementById("calFormPriority").value,
        status: document.getElementById("calFormStatus").value,
        description: document.getElementById("calFormDesc").value
      };
      var method = isEdit ? "PUT" : "POST";
      var url = isEdit ? "/api/calendar/events/" + e.id : "/api/calendar/events";
      API._rawReq(method, url, body).then(function() {
        modal.classList.add("hidden");
        toast(isEdit ? "Evento actualizado" : "Evento creado", "success");
        renderCalendarView();
        loadCalendarKpi();
        var activeTab = document.querySelector(".cal-subtab.active[data-cal-tab]");
        if (activeTab) loadCalendarActivity(activeTab.getAttribute("data-cal-tab"));
      }).catch(function(err) {
        toast(err.message, "error");
      });
    };
  }
  window.openCalEventForm = openCalEventForm;
  document.addEventListener("keydown", function(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var target = e.target.closest('[role="button"]');
    if (!target) return;
    e.preventDefault();
    target.click();
  });
  document.addEventListener("click", function(e) {
    var el = e.target.closest("[data-cal-tab]");
    if (!el) return;
    document.querySelectorAll(".cal-subtab").forEach(function(b) {
      b.classList.remove("active");
    });
    el.classList.add("active");
    var view = el.getAttribute("data-cal-tab");
    loadCalendarActivity(view);
  });
  document.addEventListener("click", function(e) {
    var el = e.target.closest("#newCalEventBtn");
    if (!el) return;
    openCalEventForm(null);
  });
  document.addEventListener("click", function(e) {
    var el = e.target.closest("#closeCalEventForm, #closeCalPanel");
    if (!el) return;
    if (el.id === "closeCalPanel") {
      closeCalPanel();
      return;
    }
    el.closest(".modal-backdrop").classList.add("hidden");
  });
  window.openCalEventForm = openCalEventForm;
  window.closeCalPanel = closeCalPanel;
  var SEC_SUBTABS = ["dashboard", "api-keys", "webhooks", "devices", "events", "login-attempts", "system-events", "audit-logs"];
  var SEC_LABELS = ["Dashboard", "API Keys", "Webhooks", "Dispositivos", "Eventos de seguridad", "Intentos de login", "Eventos del sistema", "Auditor\xEDa"];
  window.renderSecurity = async function renderSecurity2() {
    const wrap = document.getElementById("securityContent");
    if (!wrap) return;
    const tabsEl = document.getElementById("securitySubtabs");
    if (!tabsEl) return;
    let activeSub = sessionStorage.getItem("securitySubTab") || "dashboard";
    if (!SEC_SUBTABS.includes(activeSub)) activeSub = "dashboard";
    tabsEl.innerHTML = SEC_SUBTABS.map(
      (s, i) => `<button class="rbac-subtab${s === activeSub ? " active" : ""}" data-sec-tab="${s}">${SEC_LABELS[i]}</button>`
    ).join("");
    tabsEl.querySelectorAll("[data-sec-tab]").forEach((btn) => {
      btn.onclick = () => {
        sessionStorage.setItem("securitySubTab", btn.dataset.secTab);
        renderSecurity2();
      };
    });
    wrap.innerHTML = '<div class="loading-state">Cargando...</div>';
    switch (activeSub) {
      case "dashboard":
        await loadSecDashboard(wrap);
        break;
      case "api-keys":
        await loadSecApiKeys(wrap);
        break;
      case "webhooks":
        await loadSecWebhooks(wrap);
        break;
      case "devices":
        await loadSecDevices(wrap);
        break;
      case "events":
        await loadSecEvents(wrap);
        break;
      case "login-attempts":
        await loadSecLoginAttempts(wrap);
        break;
      case "system-events":
        await loadSecSystemEvents(wrap);
        break;
      case "audit-logs":
        await loadSecAuditLogs(wrap);
        break;
    }
  };
  function secApi(path, method, body) {
    return window._rawReq("/api/security" + path, method, body);
  }
  function secTable(headers, rows, cls) {
    const h = headers.map((h2) => `<th>${h2}</th>`).join("");
    const r = rows.map((r2) => `<tr>${r2.map((c2) => `<td>${c2}</td>`).join("")}</tr>`).join("");
    return `<table class="${cls || "admin-table"}"><thead><tr>${h}</tr></thead><tbody>${r || '<tr><td colspan="99" class="empty-state">Sin datos</td></tr>'}</tbody></table>`;
  }
  function secSeverityDot(sev) {
    const cls = sev === "critical" ? "security-dot--critical" : sev === "high" ? "security-dot--high" : sev === "medium" ? "security-dot--medium" : "security-dot--low";
    return `<span class="security-dot ${cls}" title="${sev}"></span>`;
  }
  async function loadSecDashboard(wrap) {
    const res = await secApi("/dashboard");
    if (!res.ok) {
      wrap.innerHTML = `<div class="error-state">${res.error || "Error"}</div>`;
      return;
    }
    const d = res.data;
    const kpis = [
      { label: "API Keys activas", value: d.active_keys, icon: "\u{1F511}" },
      { label: "Webhooks activos", value: d.active_webhooks, icon: "\u{1F517}" },
      { label: "Eventos hoy", value: d.events_today, icon: "\u26A0\uFE0F" },
      { label: "No resueltos", value: d.unresolved_events, icon: "\u{1F6A8}" },
      { label: "Eventos sistema", value: d.system_events_today, icon: "\u2699\uFE0F" },
      { label: "Dispositivos", value: d.total_devices, icon: "\u{1F4BB}" }
    ];
    wrap.innerHTML = `
    <div class="cal-kpi-bar">
      ${kpis.map((k) => `<div class="cal-kpi-item"><span class="cal-kpi-label">${k.icon} ${k.label}</span><span class="cal-kpi-value">${k.value}</span></div>`).join("")}
    </div>
    <div class="sec-grid-2">
      <div class="admin-card"><div class="admin-card-header">Eventos de seguridad recientes</div><div class="admin-card-body" id="secRecentEvents"></div></div>
      <div class="admin-card"><div class="admin-card-header">Eventos del sistema recientes</div><div class="admin-card-body" id="secRecentSystem"></div></div>
    </div>`;
    const evWrap = document.getElementById("secRecentEvents");
    const sysWrap = document.getElementById("secRecentSystem");
    if (d.recent_events && d.recent_events.length) {
      evWrap.innerHTML = d.recent_events.map(
        (e) => `<div class="security-audit-row">
        ${secSeverityDot(e.severity)}
        <div class="sec-event-content">
          <div class="sec-event-title">${esc(e.title)}</div>
          <div class="sec-event-meta">${e.username} \xB7 ${e.created_at}</div>
        </div>
        ${!e.resolved ? '<span class="badge badge-warning">Pendiente</span>' : '<span class="badge badge-success">Resuelto</span>'}
      </div>`
      ).join("");
    } else {
      evWrap.innerHTML = '<div class="empty-state">Sin eventos recientes</div>';
    }
    if (d.recent_system_events && d.recent_system_events.length) {
      sysWrap.innerHTML = d.recent_system_events.map(
        (e) => `<div class="security-audit-row">
        ${secSeverityDot(e.severity)}
        <div class="sec-event-content">
          <div class="sec-event-title">${esc(e.title)}</div>
          <div class="sec-event-meta">${e.source || ""} \xB7 ${e.created_at}</div>
        </div>
        ${!e.resolved ? '<span class="badge badge-warning">Pendiente</span>' : '<span class="badge badge-success">Resuelto</span>'}
      </div>`
      ).join("");
    } else {
      sysWrap.innerHTML = '<div class="empty-state">Sin eventos recientes</div>';
    }
  }
  async function loadSecApiKeys(wrap) {
    const res = await secApi("/api-keys");
    if (!res.ok) {
      wrap.innerHTML = `<div class="error-state">${res.error || "Error"}</div>`;
      return;
    }
    const keys = res.data || [];
    wrap.innerHTML = `
    <div class="admin-filter-row">
      <button class="btn btn-primary btn-sm" onclick="secShowApiKeyForm()">+ Nueva API Key</button>
    </div>
    ${secTable(
      ["Nombre", "Prefijo", "Creado por", "Scopes", "Expira", "Estado", "\xDAltimo uso", "Acciones"],
      keys.map((k) => [
        esc(k.name),
        `<code class="security-key-value">${esc(k.key_prefix)}...</code>`,
        esc(k.username || "-"),
        (k.scopes || []).slice(0, 2).join(", ") + ((k.scopes || []).length > 2 ? "..." : "") || '<span class="text-muted">sin scopes</span>',
        k.expires_at || '<span class="text-muted">Nunca</span>',
        k.active ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-muted">Inactiva</span>',
        k.last_used || '<span class="text-muted">Nunca</span>',
        `<button class="btn btn-ghost btn-xs" onclick="secDeleteApiKey(${k.id})">Eliminar</button>
         <button class="btn btn-ghost btn-xs" onclick="secToggleApiKey(${k.id}, ${!k.active})">${k.active ? "Desactivar" : "Activar"}</button>`
      ]),
      "admin-table"
    )}`;
  }
  window.secShowApiKeyForm = async function secShowApiKeyForm() {
    const usersRes = await secApi("/users");
    const users = usersRes.ok ? usersRes.data || [] : [];
    const opts = users.map((u) => `<option value="${u.id}">${esc(u.display_name || u.username)}</option>`).join("");
    const html = `
    <div class="modal-form-content">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input class="field-input" id="secAkName" placeholder="Ej: Producci\xF3n API" />
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
        <label class="form-label">Expira en (d\xEDas, opcional)</label>
        <input class="field-input" id="secAkExpires" type="number" min="1" placeholder="90" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="secCreateApiKey()">Crear</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      </div>
    </div>`;
    showModal("Nueva API Key", html);
  };
  window.secCreateApiKey = async function secCreateApiKey() {
    var _a, _b;
    const name = (_b = (_a = document.getElementById("secAkName")) == null ? void 0 : _a.value) == null ? void 0 : _b.trim();
    if (!name) {
      toast("Nombre requerido", "error");
      return;
    }
    const userEl = document.getElementById("secAkUser");
    const scopesEl = document.getElementById("secAkScopes");
    const expiresEl = document.getElementById("secAkExpires");
    const body = {
      name,
      user_id: userEl ? parseInt(userEl.value) : void 0,
      scopes: (scopesEl == null ? void 0 : scopesEl.value) ? scopesEl.value.split(",").map((s) => s.trim()).filter(Boolean) : [],
      expires_in_days: (expiresEl == null ? void 0 : expiresEl.value) ? parseInt(expiresEl.value) : void 0
    };
    const res = await secApi("/api-keys", "POST", body);
    if (res.ok) {
      const key = res.data;
      closeModal();
      toast("API Key creada. Copiala ahora \u2014 no se mostrar\xE1 de nuevo.", "success", 8e3);
      setTimeout(() => {
        showModal("API Key creada", `<div class="modal-form-content">
        <p class="sec-modal-text">Guard\xE1 esta clave en un lugar seguro. No podr\xE1 ser recuperada luego.</p>
        <div class="form-group">
          <label class="form-label">Clave</label>
          <div class="security-key-value">${esc(key.raw_key || "")}</div>
        </div>
        <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal(); renderSecurity();">Listo</button></div>
      </div>`);
      }, 300);
    } else {
      toast(res.error || "Error al crear", "error");
    }
  };
  window.secDeleteApiKey = async function secDeleteApiKey(id) {
    if (!await confirmModal("\xBFEliminar esta API Key? Esta acci\xF3n no se puede deshacer.")) return;
    const res = await secApi("/api-keys/" + id, "DELETE");
    if (res.ok) {
      toast("API Key eliminada", "success");
      renderSecurity();
    } else {
      toast(res.error || "Error", "error");
    }
  };
  window.secToggleApiKey = async function secToggleApiKey(id, active) {
    const res = await secApi("/api-keys/" + id, "PUT", { active });
    if (res.ok) {
      toast(active ? "API Key activada" : "API Key desactivada", "success");
      renderSecurity();
    } else {
      toast(res.error || "Error", "error");
    }
  };
  async function loadSecWebhooks(wrap) {
    const res = await secApi("/webhooks");
    if (!res.ok) {
      wrap.innerHTML = `<div class="error-state">${res.error || "Error"}</div>`;
      return;
    }
    const whs = res.data || [];
    wrap.innerHTML = `
    <div class="admin-filter-row">
      <button class="btn btn-primary btn-sm" onclick="secShowWebhookForm()">+ Nuevo Webhook</button>
    </div>
    ${secTable(
      ["Nombre", "URL", "Eventos", "Estado", "\xDAltima llamada", "Fallos", "Acciones"],
      whs.map((w) => [
        esc(w.name),
        `<code class="sec-cell-url">${esc(w.url)}</code>`,
        (w.events || []).join(", ") || '<span class="text-muted">todos</span>',
        `<span class="badge ${w.active ? "badge-success" : "badge-muted"}">${w.active ? "Activo" : "Inactivo"}</span>`,
        w.last_called_at || '<span class="text-muted">Nunca</span>',
        w.failure_count || 0,
        `<button class="btn btn-ghost btn-xs" onclick="secTestWebhook(${w.id})">Test</button>
         <button class="btn btn-ghost btn-xs" onclick="secEditWebhook(${w.id})">Editar</button>
         <button class="btn btn-ghost btn-xs" onclick="secDeleteWebhook(${w.id})">Eliminar</button>`
      ]),
      "admin-table"
    )}`;
  }
  window.secShowWebhookForm = function secShowWebhookForm2(data) {
    const d = data || {};
    const html = `
    <div class="modal-form-content">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input class="field-input" id="secWhName" value="${esc(d.name || "")}" />
      </div>
      <div class="form-group">
        <label class="form-label">URL *</label>
        <input class="field-input" id="secWhUrl" value="${esc(d.url || "")}" placeholder="https://ejemplo.com/webhook" />
      </div>
      <div class="form-group">
        <label class="form-label">Eventos (separados por coma, vac\xEDo = todos)</label>
        <input class="field-input" id="secWhEvents" value="${esc((d.events || []).join(", "))}" placeholder="property.created, property.updated" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="secCreateWebhook(${d.id || ""})">${d.id ? "Guardar" : "Crear"}</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      </div>
    </div>`;
    showModal(d.id ? "Editar Webhook" : "Nuevo Webhook", html);
  };
  window.secCreateWebhook = async function secCreateWebhook(id) {
    var _a, _b, _c, _d, _e;
    const name = (_b = (_a = document.getElementById("secWhName")) == null ? void 0 : _a.value) == null ? void 0 : _b.trim();
    const url = (_d = (_c = document.getElementById("secWhUrl")) == null ? void 0 : _c.value) == null ? void 0 : _d.trim();
    if (!name || !url) {
      toast("Nombre y URL requeridos", "error");
      return;
    }
    const eventsStr = ((_e = document.getElementById("secWhEvents")) == null ? void 0 : _e.value) || "";
    const events = eventsStr ? eventsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const body = { name, url, events };
    const res = id ? await secApi("/webhooks/" + id, "PUT", body) : await secApi("/webhooks", "POST", body);
    if (res.ok) {
      closeModal();
      toast(id ? "Webhook actualizado" : "Webhook creado", "success");
      renderSecurity();
    } else {
      toast(res.error || "Error", "error");
    }
  };
  window.secEditWebhook = async function secEditWebhook(id) {
    const res = await secApi("/webhooks");
    if (!res.ok) return;
    const wh = (res.data || []).find((w) => w.id === id);
    if (wh) secShowWebhookForm(wh);
  };
  window.secDeleteWebhook = async function secDeleteWebhook(id) {
    if (!await confirmModal("\xBFEliminar este webhook?")) return;
    const res = await secApi("/webhooks/" + id, "DELETE");
    if (res.ok) {
      toast("Webhook eliminado", "success");
      renderSecurity();
    } else {
      toast(res.error || "Error", "error");
    }
  };
  window.secTestWebhook = async function secTestWebhook(id) {
    var _a, _b;
    const res = await secApi("/webhooks/" + id + "/test", "POST");
    if (res.ok) {
      toast("Webhook probado. Estado: " + (((_a = res.data) == null ? void 0 : _a.last_status) || "ok"), ((_b = res.data) == null ? void 0 : _b.last_status) === "ok" ? "success" : "warn");
      renderSecurity();
    } else {
      toast(res.error || "Error", "error");
    }
  };
  async function loadSecDevices(wrap) {
    const res = await secApi("/devices");
    if (!res.ok) {
      wrap.innerHTML = `<div class="error-state">${res.error || "Error"}</div>`;
      return;
    }
    const devices = res.data || [];
    wrap.innerHTML = secTable(
      ["", "Nombre", "Usuario", "Tipo", "OS / Browser", "IP", "Confianza", "Visto", "Acciones"],
      devices.map((d) => [
        `<div class="security-device-icon">${d.device_type === "mobile" ? "\u{1F4F1}" : d.device_type === "tablet" ? "\u{1F4DF}" : "\u{1F4BB}"}</div>`,
        esc(d.name || "-"),
        esc(d.username || ""),
        esc(d.device_type || "-"),
        `${esc(d.os || "")} / ${esc(d.browser || "")}`,
        `<code class="sec-cell-ip">${esc(d.ip || "-")}</code>`,
        d.trusted ? '<span class="badge badge-success">Confiable</span>' : '<span class="badge badge-warning">No confiable</span>',
        d.last_seen || '<span class="text-muted">Nunca</span>',
        `<button class="btn btn-ghost btn-xs" onclick="secToggleDevice(${d.id}, ${!d.trusted})">${d.trusted ? "No confiar" : "Confiar"}</button>
       <button class="btn btn-ghost btn-xs" onclick="secDeleteDevice(${d.id})">Eliminar</button>`
      ]),
      "admin-table"
    );
  }
  window.secToggleDevice = async function secToggleDevice(id, trusted) {
    const res = await secApi("/devices/" + id, "PUT", { trusted });
    if (res.ok) {
      toast(trusted ? "Dispositivo marcado como confiable" : "Confianza removida", "success");
      renderSecurity();
    } else {
      toast(res.error || "Error", "error");
    }
  };
  window.secDeleteDevice = async function secDeleteDevice(id) {
    if (!await confirmModal("\xBFEliminar este dispositivo?")) return;
    const res = await secApi("/devices/" + id, "DELETE");
    if (res.ok) {
      toast("Dispositivo eliminado", "success");
      renderSecurity();
    } else {
      toast(res.error || "Error", "error");
    }
  };
  async function loadSecEvents(wrap) {
    var _a;
    const res = await secApi("/events?per_page=50");
    if (!res.ok) {
      wrap.innerHTML = `<div class="error-state">${res.error || "Error"}</div>`;
      return;
    }
    const events = ((_a = res.data) == null ? void 0 : _a.items) || [];
    wrap.innerHTML = secTable(
      ["", "Tipo", "T\xEDtulo", "Usuario", "IP", "Estado", "Creado", "Acciones"],
      events.map((e) => [
        secSeverityDot(e.severity),
        `<span class="badge badge-info">${esc(e.event_type)}</span>`,
        esc(e.title),
        esc(e.username || "Sistema"),
        `<code class="sec-cell-ip">${esc(e.ip || "-")}</code>`,
        e.resolved ? '<span class="badge badge-success">Resuelto</span>' : '<span class="badge badge-warning">Pendiente</span>',
        e.created_at || "",
        !e.resolved ? `<button class="btn btn-ghost btn-xs" onclick="secResolveEvent(${e.id})">Resolver</button>` : '<span class="text-muted">\u2014</span>'
      ]),
      "admin-table"
    );
  }
  window.secResolveEvent = async function secResolveEvent(id) {
    const res = await secApi("/events/" + id + "/resolve", "POST");
    if (res.ok) {
      toast("Evento resuelto", "success");
      renderSecurity();
    } else {
      toast(res.error || "Error", "error");
    }
  };
  async function loadSecLoginAttempts(wrap) {
    var _a;
    const res = await secApi("/login-attempts?per_page=50");
    if (!res.ok) {
      wrap.innerHTML = `<div class="error-state">${res.error || "Error"}</div>`;
      return;
    }
    const attempts = ((_a = res.data) == null ? void 0 : _a.items) || [];
    wrap.innerHTML = secTable(
      ["Usuario", "Intentos fallidos", "Bloqueado hasta", "\xDAltimo login", "\xDAltima IP", "Activo", "Acciones"],
      attempts.map((a) => [
        `${esc(a.display_name)}<br><span class="sec-user-meta">@${esc(a.username)}</span>`,
        a.login_attempts > 0 ? `<span class="badge ${a.login_attempts >= 5 ? "badge-danger" : "badge-warning"}">${a.login_attempts}</span>` : '<span class="text-muted">0</span>',
        a.locked_until ? `<span class="badge badge-danger">${a.locked_until}</span>` : '<span class="text-muted">\u2014</span>',
        a.last_login || '<span class="text-muted">Nunca</span>',
        `<code class="sec-cell-ip">${esc(a.last_ip || "-")}</code>`,
        a.is_active ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-muted">Inactivo</span>',
        a.locked_until ? `<button class="btn btn-ghost btn-xs" onclick="secUnlockUser(${a.user_id})">Desbloquear</button>` : '<span class="text-muted">\u2014</span>'
      ]),
      "admin-table"
    );
  }
  window.secUnlockUser = async function secUnlockUser(uid) {
    const res = await secApi("/login-attempts/" + uid + "/unlock", "POST");
    if (res.ok) {
      toast("Usuario desbloqueado", "success");
      renderSecurity();
    } else {
      toast(res.error || "Error", "error");
    }
  };
  async function loadSecSystemEvents(wrap) {
    var _a;
    const res = await secApi("/system-events?per_page=50");
    if (!res.ok) {
      wrap.innerHTML = `<div class="error-state">${res.error || "Error"}</div>`;
      return;
    }
    const events = ((_a = res.data) == null ? void 0 : _a.items) || [];
    wrap.innerHTML = secTable(
      ["", "Tipo", "T\xEDtulo", "Fuente", "Estado", "Creado", "Acciones"],
      events.map((e) => [
        secSeverityDot(e.severity),
        `<span class="badge badge-info">${esc(e.event_type)}</span>`,
        esc(e.title),
        esc(e.source || "-"),
        e.resolved ? '<span class="badge badge-success">Resuelto</span>' : '<span class="badge badge-warning">Pendiente</span>',
        e.created_at || "",
        !e.resolved ? `<button class="btn btn-ghost btn-xs" onclick="secResolveSystemEvent(${e.id})">Resolver</button>` : '<span class="text-muted">\u2014</span>'
      ]),
      "admin-table"
    );
  }
  window.secResolveSystemEvent = async function secResolveSystemEvent(id) {
    const res = await secApi("/system-events/" + id + "/resolve", "POST");
    if (res.ok) {
      toast("Evento resuelto", "success");
      renderSecurity();
    } else {
      toast(res.error || "Error", "error");
    }
  };
  async function loadSecAuditLogs(wrap) {
    var _a;
    const res = await secApi("/audit-logs?per_page=50");
    if (!res.ok) {
      wrap.innerHTML = `<div class="error-state">${res.error || "Error"}</div>`;
      return;
    }
    const logs = ((_a = res.data) == null ? void 0 : _a.items) || [];
    wrap.innerHTML = secTable(
      ["Acci\xF3n", "Usuario", "Detalles", "IP", "Fecha"],
      logs.map((l) => [
        `<span class="badge badge-info">${esc(l.action)}</span>`,
        esc(l.username || "Sistema"),
        esc(l.details || ""),
        `<code class="sec-cell-ip">${esc(l.ip || "-")}</code>`,
        l.created_at || ""
      ]),
      "admin-table"
    );
  }
  window.secApi = secApi;
  (async function() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    let reg;
    try {
      reg = await navigator.serviceWorker.ready;
    } catch (e) {
      return;
    }
    let sub = await reg.pushManager.getSubscription();
    if (sub) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    async function _getCsrfToken() {
      var _a;
      try {
        const r = await fetch("/api/auth/csrf-token", { credentials: "same-origin" });
        const d = await r.json();
        return d.ok ? (_a = d.data) == null ? void 0 : _a.csrf_token : null;
      } catch (e) {
        return null;
      }
    }
    try {
      const meta = document.querySelector('meta[name="vapid-public-key"]');
      const publicKey = meta == null ? void 0 : meta.getAttribute("content");
      if (!publicKey) return;
      const keyBytes = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")), (c2) => c2.charCodeAt(0));
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes
      });
      const csrfToken = await _getCsrfToken();
      const headers = { "Content-Type": "application/json" };
      if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers,
        credentials: "same-origin",
        body: JSON.stringify(sub.toJSON())
      });
    } catch (e) {
    }
  })();
})();
