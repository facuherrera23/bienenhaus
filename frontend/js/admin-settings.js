/**
 * admin-settings.js — Centro de Configuración (Módulo 16)
 * Categorías: Empresa, Sistema, Seguridad, Conectividad
 * Reutiliza: .cfg-card, .field, .field-input, .btn, .admin-subtab, .admin-status-badge
 */

let _stgTab = 'general';

function renderSettings() {
  _stgTab = 'general';
  renderStgSubtabs();
  renderStgGeneral();
}
window.renderSettings = renderSettings;

function renderStgSubtabs() {
  var container = document.getElementById('stgSubtabs');
  if (!container) return;
  var categories = [
    { label: 'Empresa', tabs: ['general','branding','localizacion'] },
    { label: 'Sistema', tabs: ['notificaciones','backups','preferencias','sistema'] },
    { label: 'Seguridad', tabs: ['seguridad'] },
    { label: 'Conectividad', tabs: ['integraciones'] }
  ];
  var labels = { general:'General', branding:'Branding', localizacion:'Localización', notificaciones:'Notificaciones', backups:'Backups', preferencias:'Preferencias', sistema:'Sistema', seguridad:'Seguridad', integraciones:'Integraciones' };
  var html = '';
  categories.forEach(function(cat) {
    html += '<div class="stg-category">';
    html += '<span class="stg-category-label">' + cat.label + '</span>';
    html += '<div class="stg-category-tabs">';
    cat.tabs.forEach(function(t) {
      html += '<button class="stg-subtab' + (t === _stgTab ? ' active' : '') + '" data-stg-tab="' + t + '">' + (labels[t] || t) + '</button>';
    });
    html += '</div></div>';
  });
  container.innerHTML = html;
}

/* ── 1. GENERAL ── */
async function renderStgGeneral() {
  setStgContent('<div class="loading-state">Cargando configuración...</div>');
  try {
    var s = await API._rawReq('GET', '/api/settings-center/general');
    var html = '<div class="stg-cards">';

    // Company info card
    html += '<div class="stg-card">';
    html += '<div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><div><h2 class="stg-card-title">Empresa</h2><p class="stg-card-sub">Información comercial del sitio</p></div></div>';
    html += '<div class="stg-grid-2">';
    html += field('stg_site_name', 'Nombre comercial', s.site_name);
    html += field('stg_business_name', 'Razón social', s.business_name);
    html += field('stg_cuit', 'CUIT/RUT', s.cuit);
    html += field('stg_email', 'Email', s.email, 'email');
    html += field('stg_phone', 'Teléfono', s.phone);
    html += field('stg_website', 'Sitio web', s.website || 'https://bienenhaus.com.ar');
    html += field('stg_address', 'Dirección', s.address);
    html += field('stg_hours', 'Horarios', s.hours);
    html += '</div>';
    html += stgActions('btnSaveGeneral');
    html += '</div>';

    // Contact / SMTP
    html += '<div class="stg-card">';
    html += '<div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg></div><div><h2 class="stg-card-title">Contacto y Redes</h2><p class="stg-card-sub">Datos públicos de contacto</p></div></div>';
    html += '<div class="stg-grid-2">';
    html += field('stg_whatsapp', 'WhatsApp 1', s.whatsapp);
    html += field('stg_whatsapp2', 'WhatsApp 2', s.whatsapp2);
    html += field('stg_instagram', 'Instagram URL', s.instagram);
    html += field('stg_facebook', 'Facebook URL', s.facebook);
    html += '</div>';
    html += stgActions('btnSaveGeneral');
    html += '</div>';

    // SMTP
    html += '<div class="stg-card">';
    html += '<div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><div><h2 class="stg-card-title">Correo SMTP</h2><p class="stg-card-sub">Servidor de correo saliente</p></div></div>';
    html += '<div class="stg-grid-2">';
    html += field('stg_smtp_host', 'Servidor SMTP', s.smtp_host);
    html += field('stg_smtp_port', 'Puerto', s.smtp_port);
    html += field('stg_smtp_user', 'Usuario', s.smtp_user);
    html += field('stg_smtp_pass', 'Contraseña', s.smtp_pass, 'password');
    html += field('stg_email_from', 'Email remitente', s.email_from);
    html += field('stg_email_to', 'Email destino', s.email_to);
    html += field('stg_webhook_url', 'Webhook URL', s.webhook_url);
    html += '</div>';
    html += stgActions('btnSaveSmtp');
    html += '</div>';

    // SEO
    html += '<div class="stg-card">';
    html += '<div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><div><h2 class="stg-card-title">SEO y Analytics</h2><p class="stg-card-sub">Meta tags y Google Analytics</p></div></div>';
    html += '<div class="stg-grid-2">';
    html += field('stg_seo_site_name', 'Nombre del sitio (SEO)', s.seo_site_name);
    html += field('stg_seo_description', 'Descripción (meta)', s.seo_description);
    html += field('stg_ga_id', 'Google Analytics ID', s.ga_id);
    html += field('stg_hero_years', 'Años de experiencia', s.hero_years);
    html += '</div>';
    html += stgActions('btnSaveSeo');
    html += '</div>';

    // About Us
    html += '<div class="stg-card">';
    html += '<div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div><div><h2 class="stg-card-title">Quiénes Somos</h2><p class="stg-card-sub">Contenido de la sección principal</p></div></div>';
    html += '<div class="stg-grid-2">';
    html += field('stg_about_eyebrow', 'Subtítulo', s.about_eyebrow);
    html += field('stg_about_lead', 'Lead', s.about_lead);
    html += '</div>';
    html += '<div class="field"><label class="field-label">Body</label><textarea id="stg_about_body" class="field-input stg-textarea-sm">' + esc(s.about_body || '') + '</textarea></div>';
    html += '<div class="stg-grid-3">';
    html += field('stg_about_mision', 'Misión', s.about_mision);
    html += field('stg_about_vision', 'Visión', s.about_vision);
    html += field('stg_about_mercado', 'A quiénes acompañamos', s.about_mercado);
    html += field('stg_about_ofrecemos', 'Qué ofrecemos', s.about_ofrecemos);
    html += field('stg_about_como', 'Cómo lo hacemos', s.about_como);
    html += '</div>';
    html += '<div class="stg-grid-3">';
    html += field('stg_about_valor1k', 'Valor 1 nombre', s.about_valor1k);
    html += field('stg_about_valor2k', 'Valor 2 nombre', s.about_valor2k);
    html += field('stg_about_valor3k', 'Valor 3 nombre', s.about_valor3k);
    html += '</div>';
    html += '<div class="stg-grid-3">';
    html += field('stg_about_valor1v', 'Valor 1 descripción', s.about_valor1v);
    html += field('stg_about_valor2v', 'Valor 2 descripción', s.about_valor2v);
    html += field('stg_about_valor3v', 'Valor 3 descripción', s.about_valor3v);
    html += '</div>';
    html += stgActions('btnSaveAbout');
    html += '</div>';

    html += '</div>';
    setStgContent(html);
    wireSave('btnSaveGeneral', ['stg_site_name','stg_business_name','stg_cuit','stg_email','stg_phone','stg_website','stg_address','stg_hours','stg_whatsapp','stg_whatsapp2','stg_instagram','stg_facebook']);
    wireSave('btnSaveSmtp', ['stg_smtp_host','stg_smtp_port','stg_smtp_user','stg_smtp_pass','stg_email_from','stg_email_to','stg_webhook_url']);
    wireSave('btnSaveSeo', ['stg_seo_site_name','stg_seo_description','stg_ga_id','stg_hero_years']);
    wireSave('btnSaveAbout', ['stg_about_eyebrow','stg_about_lead','stg_about_body','stg_about_mision','stg_about_vision','stg_about_valor1k','stg_about_valor1v','stg_about_valor2k','stg_about_valor2v','stg_about_valor3k','stg_about_valor3v','stg_about_mercado','stg_about_ofrecemos','stg_about_como']);
  } catch (e) {
    setStgContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

/* ── 2. BRANDING ── */
async function renderStgBranding() {
  setStgContent('<div class="loading-state">Cargando branding...</div>');
  try {
    var b = await API._rawReq('GET', '/api/settings-center/branding');
    var html = '<div class="stg-cards">';
    html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div><div><h2 class="stg-card-title">Logo y Marcas</h2><p class="stg-card-sub">Logos, favicon e imágenes</p></div></div>';
    html += '<div class="stg-grid-2">';
    html += field('stg_logo_main', 'Logo principal (URL)', b.logo_main);
    html += field('stg_logo_dark', 'Logo oscuro (URL)', b.logo_dark);
    html += field('stg_logo_light', 'Logo claro (URL)', b.logo_light);
    html += field('stg_favicon_url', 'Favicon (URL)', b.favicon_url);
    html += field('stg_login_image', 'Imagen de login (URL)', b.login_image);
    html += field('stg_public_image', 'Imagen pública (URL)', b.public_image);
    html += '</div>';
    html += stgActions('btnSaveBranding');
    html += '</div>';

    html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg></div><div><h2 class="stg-card-title">Colores y Tipografía</h2><p class="stg-card-sub">Paleta de colores y fuente</p></div></div>';
    html += '<div class="stg-grid-3">';
    html += '<div class="field"><label class="field-label">Color primario</label><input id="stg_brand_primary_color" type="color" class="stg-color-input" value="' + esc(b.brand_primary_color || '#20b8ab') + '"/></div>';
    html += '<div class="field"><label class="field-label">Color secundario</label><input id="stg_brand_secondary_color" type="color" class="stg-color-input" value="' + esc(b.brand_secondary_color || '#1a1a2e') + '"/></div>';
    html += '<div class="field"><label class="field-label">Color de acento</label><input id="stg_brand_accent_color" type="color" class="stg-color-input" value="' + esc(b.brand_accent_color || '#e8a87c') + '"/></div>';
    html += '</div>';
    html += '<div class="field"><label class="field-label">Fuente principal</label><select id="stg_brand_font" class="field-input field-input--select">' +
      ['Inter','Poppins','Montserrat','Playfair Display','Lora','DM Sans','Public Sans'].map(function(f) { return '<option value="' + f + '"' + (b.brand_font === f ? ' selected' : '') + '>' + f + '</option>'; }).join('') +
      '</select></div>';
    html += stgActions('btnSaveBranding');
    html += '</div>';

    // Live Preview
    html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div><div><h2 class="stg-card-title">Vista previa en vivo</h2></div></div>';
    html += '<div class="stg-preview"><div class="stg-preview-name stg-preview-accent">Bienenhaus</div><div class="stg-preview-tagline">Propiedades · Asesoramiento · Inversiones</div></div>';
    html += '</div>';

    html += '</div>';
    setStgContent(html);
    wireSave('btnSaveBranding', ['stg_logo_main','stg_logo_dark','stg_logo_light','stg_favicon_url','stg_login_image','stg_public_image','stg_brand_primary_color','stg_brand_secondary_color','stg_brand_accent_color','stg_brand_font'], '/api/settings-center/branding');
  } catch (e) {
    setStgContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

/* ── 3. OFICINAS ── */
async function renderStgOficinas() {
  setStgContent('<div class="loading-state">Cargando oficinas...</div>');
  try {
    var offices = await API._rawReq('GET', '/api/settings-center/offices');
    var html = '<div class="stg-office-header"><h3 class="stg-office-title">Oficinas</h3><button class="btn btn-primary btn-sm" onclick="stgOpenOfficeForm(null)">+ Nueva oficina</button></div>';
    if (!offices || !offices.length) {
      html += '<div class="empty-state">Sin oficinas registradas</div>';
    } else {
      offices.forEach(function(o) {
        var activeBadge = o.active ? '<span class="admin-status-badge status-disponible">Activa</span>' : '<span class="admin-status-badge status-oculta">Inactiva</span>';
        html += '<div class="stg-office-card">';
        html += '<div class="stg-office-avatar">🏢</div>';
        html += '<div class="stg-office-info"><div class="stg-office-name">' + esc(o.name) + ' ' + activeBadge + '</div>';
        html += '<div class="stg-office-detail">' + esc(o.address) + (o.city ? ', ' + esc(o.city) : '') + (o.phone ? ' · ' + esc(o.phone) : '') + (o.manager ? ' · Resp: ' + esc(o.manager) : '') + '</div></div>';
        html += '<div class="stg-office-actions">';
        html += '<button class="btn btn-ghost btn-sm" onclick="stgOpenOfficeForm(' + o.id + ')">Editar</button>';
        html += '<button class="btn btn-ghost btn-sm stg-danger-btn" onclick="stgDeleteOffice(' + o.id + ')">Eliminar</button>';
        html += '</div></div>';
      });
    }
    setStgContent(html);
  } catch (e) {
    setStgContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

function stgOpenOfficeForm(oid) {
  var offices = [];
  var isEdit = !!oid;
  API._rawReq('GET', '/api/settings-center/offices').then(function(data) {
    offices = data || [];
    var o = isEdit ? offices.find(function(x) { return x.id === oid; }) : {};
    var title = isEdit ? 'Editar oficina' : 'Nueva oficina';
    var modal = document.getElementById('stgOfficeFormModal');
    var content = document.getElementById('stgOfficeFormContent');
    document.getElementById('stgOfficeFormTitle').textContent = title;
    content.innerHTML = '<div class="pf-body"><div class="stg-grid-2">' +
      '<div class="field"><label class="field-label">Nombre *</label><input id="of_name" class="field-input" value="' + esc((o||{}).name||'') + '"/></div>' +
      '<div class="field"><label class="field-label">Teléfono</label><input id="of_phone" class="field-input" value="' + esc((o||{}).phone||'') + '"/></div>' +
      '<div class="field stg-field-full"><label class="field-label">Dirección</label><input id="of_address" class="field-input" value="' + esc((o||{}).address||'') + '"/></div>' +
      '<div class="field"><label class="field-label">Ciudad</label><input id="of_city" class="field-input" value="' + esc((o||{}).city||'') + '"/></div>' +
      '<div class="field"><label class="field-label">Provincia</label><input id="of_province" class="field-input" value="' + esc((o||{}).province||'') + '"/></div>' +
      '<div class="field"><label class="field-label">País</label><input id="of_country" class="field-input" value="' + esc((o||{}).country||'Argentina') + '"/></div>' +
      '<div class="field"><label class="field-label">Responsable</label><input id="of_manager" class="field-input" value="' + esc((o||{}).manager||'') + '"/></div>' +
      '<div class="field"><label class="field-label">Horario</label><input id="of_schedule" class="field-input" value="' + esc((o||{}).schedule||'') + '"/></div>' +
      '<div class="field stg-field-row"><label class="acm-chip"><input type="checkbox" class="acm-chip-input" id="of_active" ' + ((o||{}).active !== false ? 'checked' : '') + '/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Activa</span></span></label></div>' +
      '</div>' +
      '<div class="stg-btn-row">' +
      '<button class="btn btn-primary btn-full" id="saveOfficeBtn">' + (isEdit ? 'Guardar' : 'Crear') + '</button>' +
      '<button class="btn btn-ghost" onclick="document.getElementById(\'stgOfficeFormModal\').classList.add(\'hidden\')">Cancelar</button></div></div>';
    modal.classList.remove('hidden');
    document.getElementById('saveOfficeBtn').onclick = function() {
      var name = document.getElementById('of_name').value.trim();
      if (!name) { toast('El nombre es requerido', 'warn'); return; }
      var body = { name: name, phone: document.getElementById('of_phone').value, address: document.getElementById('of_address').value, city: document.getElementById('of_city').value, province: document.getElementById('of_province').value, country: document.getElementById('of_country').value, manager: document.getElementById('of_manager').value, schedule: document.getElementById('of_schedule').value, active: document.getElementById('of_active').checked };
      var url = isEdit ? '/api/settings-center/offices/' + oid : '/api/settings-center/offices';
      var method = isEdit ? 'PUT' : 'POST';
      API._rawReq(method, url, body).then(function() {
        modal.classList.add('hidden');
        toast(isEdit ? 'Oficina actualizada' : 'Oficina creada', 'success');
        renderStgOficinas();
      }).catch(function(err) { toast(err.message, 'error'); });
    };
  }).catch(function(err) { toast(err.message, 'error'); });
}
window.stgOpenOfficeForm = stgOpenOfficeForm;

function stgDeleteOffice(oid) {
  if (!confirmModal('¿Eliminar esta oficina?')) return;
  API._rawReq('DELETE', '/api/settings-center/offices/' + oid).then(function() {
    toast('Oficina eliminada', 'success');
    renderStgOficinas();
  }).catch(function(err) { toast(err.message, 'error'); });
}
window.stgDeleteOffice = stgDeleteOffice;

/* ── 4. LOCALIZACIÓN ── */
async function renderStgLocalizacion() {
  setStgContent('<div class="loading-state">Cargando...</div>');
  try {
    var l = await API._rawReq('GET', '/api/settings-center/localization');
    var html = '<div class="stg-cards"><div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></div><div><h2 class="stg-card-title">Localización</h2><p class="stg-card-sub">Formato regional del sitio</p></div></div>';
    html += '<div class="stg-grid-2">';
    html += '<div class="field"><label class="field-label">Idioma</label><select id="stg_locale_language" class="field-input field-input--select">' +
      '<option value="es"' + (l.locale_language === 'es' || !l.locale_language ? ' selected' : '') + '>Español</option>' +
      '<option value="en"' + (l.locale_language === 'en' ? ' selected' : '') + '>English</option>' +
      '<option value="pt"' + (l.locale_language === 'pt' ? ' selected' : '') + '>Português</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Moneda</label><select id="stg_locale_currency" class="field-input field-input--select">' +
      '<option value="ARS"' + (l.locale_currency === 'ARS' || !l.locale_currency ? ' selected' : '') + '>ARS (Peso argentino)</option>' +
      '<option value="USD"' + (l.locale_currency === 'USD' ? ' selected' : '') + '>USD (Dólar)</option>' +
      '<option value="EUR"' + (l.locale_currency === 'EUR' ? ' selected' : '') + '>EUR (Euro)</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Zona horaria</label><select id="stg_locale_timezone" class="field-input field-input--select">' +
      '<option value="America/Argentina/Buenos_Aires"' + (l.locale_timezone === 'America/Argentina/Buenos_Aires' || !l.locale_timezone ? ' selected' : '') + '>Argentina (GMT-3)</option>' +
      '<option value="America/Santiago"' + (l.locale_timezone === 'America/Santiago' ? ' selected' : '') + '>Chile (GMT-3)</option>' +
      '<option value="America/Mexico_City"' + (l.locale_timezone === 'America/Mexico_City' ? ' selected' : '') + '>México (GMT-6)</option>' +
      '<option value="America/New_York"' + (l.locale_timezone === 'America/New_York' ? ' selected' : '') + '>New York (GMT-5)</option>' +
      '<option value="Europe/Madrid"' + (l.locale_timezone === 'Europe/Madrid' ? ' selected' : '') + '>Madrid (GMT+1)</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Formato de fecha</label><select id="stg_locale_date_format" class="field-input field-input--select">' +
      '<option value="DD/MM/YYYY"' + (l.locale_date_format === 'DD/MM/YYYY' || !l.locale_date_format ? ' selected' : '') + '>DD/MM/YYYY</option>' +
      '<option value="MM/DD/YYYY"' + (l.locale_date_format === 'MM/DD/YYYY' ? ' selected' : '') + '>MM/DD/YYYY</option>' +
      '<option value="YYYY-MM-DD"' + (l.locale_date_format === 'YYYY-MM-DD' ? ' selected' : '') + '>YYYY-MM-DD</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Formato de hora</label><select id="stg_locale_time_format" class="field-input field-input--select">' +
      '<option value="24h"' + (l.locale_time_format === '24h' || !l.locale_time_format ? ' selected' : '') + '>24 horas</option>' +
      '<option value="12h"' + (l.locale_time_format === '12h' ? ' selected' : '') + '>12 horas (AM/PM)</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Sistema métrico</label><select id="stg_locale_metric_system" class="field-input field-input--select">' +
      '<option value="metric"' + (l.locale_metric_system === 'metric' || !l.locale_metric_system ? ' selected' : '') + '>Métrico (m², km)</option>' +
      '<option value="imperial"' + (l.locale_metric_system === 'imperial' ? ' selected' : '') + '>Imperial (ft², mi)</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Separador decimal</label><select id="stg_locale_decimal_separator" class="field-input field-input--select">' +
      '<option value="comma"' + (l.locale_decimal_separator === 'comma' || !l.locale_decimal_separator ? ' selected' : '') + '>Coma (1.234,56)</option>' +
      '<option value="dot"' + (l.locale_decimal_separator === 'dot' ? ' selected' : '') + '>Punto (1,234.56)</option>' +
      '</select></div>';
    html += '</div>' + stgActions('btnSaveLocalization') + '</div></div>';
    setStgContent(html);
    wireSave('btnSaveLocalization', ['stg_locale_language','stg_locale_currency','stg_locale_timezone','stg_locale_date_format','stg_locale_time_format','stg_locale_metric_system','stg_locale_decimal_separator'], '/api/settings-center/localization');
  } catch (e) {
    setStgContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

/* ── 5. NOTIFICACIONES ── */
async function renderStgNotificaciones() {
  setStgContent('<div class="loading-state">Cargando...</div>');
  try {
    var n = await API._rawReq('GET', '/api/settings-center/notifications');
    var html = '<div class="stg-cards"><div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div><div><h2 class="stg-card-title">Notificaciones</h2><p class="stg-card-sub">Canales de notificación del sistema</p></div></div>';
    html += '<div class="stg-grid-2">';
    html += stgToggle('stg_notif_email_enabled', 'Notificaciones por email', n.notif_email_enabled);
    html += stgToggle('stg_notif_push_enabled', 'Notificaciones push', n.notif_push_enabled);
    html += stgToggle('stg_notif_whatsapp_enabled', 'Notificaciones WhatsApp', n.notif_whatsapp_enabled);
    html += stgToggle('stg_notif_internal_enabled', 'Notificaciones internas', n.notif_internal_enabled);
    html += '<div class="field"><label class="field-label">Recordatorios</label><select id="stg_notif_reminders" class="field-input field-input--select">' +
      '<option value="todas"' + (n.notif_reminders === 'todas' || !n.notif_reminders ? ' selected' : '') + '>Todas</option>' +
      '<option value="importantes"' + (n.notif_reminders === 'importantes' ? ' selected' : '') + '>Solo importantes</option>' +
      '<option value="ninguna"' + (n.notif_reminders === 'ninguna' ? ' selected' : '') + '>Ninguna</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Notificaciones de marketing</label><select id="stg_notif_marketing" class="field-input field-input--select">' +
      '<option value="todas"' + (n.notif_marketing === 'todas' || !n.notif_marketing ? ' selected' : '') + '>Todas</option>' +
      '<option value="resumen"' + (n.notif_marketing === 'resumen' ? ' selected' : '') + '>Resumen semanal</option>' +
      '<option value="ninguna"' + (n.notif_marketing === 'ninguna' ? ' selected' : '') + '>Ninguna</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Sonidos</label><select id="stg_notif_sound" class="field-input field-input--select">' +
      '<option value="habilitados"' + (n.notif_sound === 'habilitados' || !n.notif_sound ? ' selected' : '') + '>Habilitados</option>' +
      '<option value="deshabilitados"' + (n.notif_sound === 'deshabilitados' ? ' selected' : '') + '>Deshabilitados</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Frecuencia</label><select id="stg_notif_frequency" class="field-input field-input--select">' +
      '<option value="tiempo_real"' + (n.notif_frequency === 'tiempo_real' || !n.notif_frequency ? ' selected' : '') + '>Tiempo real</option>' +
      '<option value="cada_5min"' + (n.notif_frequency === 'cada_5min' ? ' selected' : '') + '>Cada 5 minutos</option>' +
      '<option value="cada_15min"' + (n.notif_frequency === 'cada_15min' ? ' selected' : '') + '>Cada 15 minutos</option>' +
      '<option value="diario"' + (n.notif_frequency === 'diario' ? ' selected' : '') + '>Resumen diario</option>' +
      '</select></div>';
    html += '</div>' + stgActions('btnSaveNotifications') + '</div></div>';
    setStgContent(html);
    wireSave('btnSaveNotifications', ['stg_notif_email_enabled','stg_notif_push_enabled','stg_notif_whatsapp_enabled','stg_notif_internal_enabled','stg_notif_reminders','stg_notif_marketing','stg_notif_sound','stg_notif_frequency'], '/api/settings-center/notifications');
  } catch (e) {
    setStgContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

/* ── 6. INTEGRACIONES ── */
async function renderStgIntegraciones() {
  setStgContent('<div class="loading-state">Cargando integraciones...</div>');
  try {
    var integrations = await API._rawReq('GET', '/api/settings-center/integrations');
    var html = '<div class="stg-grid-3">';
    var iconMap = { facebook: '📘', google: '🔍', calendar: '📅', whatsapp: '💬', email: '✉️', ml: '🛒', zp: '🏠', ap: '🏘', cloud: '☁️', ai: '🤖' };
    integrations.forEach(function(intg) {
      html += '<div class="stg-int-card">';
      html += '<div class="stg-int-head"><div class="stg-int-icon">' + (iconMap[intg.icon] || '🔌') + '</div><div class="stg-int-info"><div class="stg-int-name">' + esc(intg.name) + '</div><div class="stg-int-meta">' + (intg.connected ? '<span class="admin-status-badge status-disponible">Conectado</span>' : '<span class="admin-status-badge status-oculta">Desconectado</span>') + (intg.last_sync ? ' · Última sinc.: ' + intg.last_sync.substring(0, 10) : '') + '</div></div></div>';
      html += '<div class="stg-int-actions">';
      html += '<button class="btn btn-ghost btn-sm" onclick="stgConfigIntegration(\'' + intg.id + '\')">Configurar</button>';
      if (intg.connected) html += '<button class="btn btn-ghost btn-sm" onclick="stgTestIntegration(\'' + intg.id + '\')">Probar</button>';
      if (intg.connected) html += '<button class="btn btn-ghost btn-sm stg-danger-btn" onclick="stgDisconnectIntegration(\'' + intg.id + '\')">Desconectar</button>';
      html += '</div></div>';
    });
    html += '</div>';
    setStgContent(html);
  } catch (e) {
    setStgContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

function stgConfigIntegration(id) {
  var modal = document.getElementById('stgIntegrationModal');
  var content = document.getElementById('stgIntegrationContent');
  var title = document.getElementById('stgIntegrationTitle');
  var nameMap = { meta: 'Meta (Facebook/Instagram)', google: 'Google', google_calendar: 'Google Calendar', whatsapp_business: 'WhatsApp Business', smtp: 'SMTP', mercadolibre: 'Mercado Libre', zonaprop: 'ZonaProp', argenprop: 'Argenprop', cloudinary: 'Cloudinary', openai: 'OpenAI' };
  var keyMap = { meta: 'meta_access_token', google: 'google_api_key', google_calendar: 'google_calendar_token', whatsapp_business: 'waba_token', smtp: 'smtp_host', mercadolibre: 'ml_access_token', zonaprop: 'zp_api_key', argenprop: 'ap_api_key', cloudinary: 'cloudinary_cloud_name', openai: 'openai_api_key' };
  title.textContent = 'Configurar: ' + (nameMap[id] || id);
  API._rawReq('GET', '/api/settings-center/integrations/' + id + '/config').then(function(data) {
    var fields = Object.keys(data).map(function(k) {
      var label = k.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
      return '<div class="field"><label class="field-label">' + label + '</label><input id="intg_' + k + '" class="field-input" value="' + esc(data[k] || '') + '"/></div>';
    }).join('');
    content.innerHTML = '<div class="pf-body">' + fields + '<div class="stg-btn-row"><button class="btn btn-primary btn-full" id="saveIntgBtn">Guardar configuración</button><button class="btn btn-ghost" onclick="document.getElementById(\'stgIntegrationModal\').classList.add(\'hidden\')">Cancelar</button></div></div>';
    modal.classList.remove('hidden');
    document.getElementById('saveIntgBtn').onclick = function() {
      var body = {};
      Object.keys(data).forEach(function(k) { body[k] = document.getElementById('intg_' + k).value; });
      API._rawReq('PUT', '/api/settings-center/integrations/' + id + '/config', body).then(function() {
        modal.classList.add('hidden');
        toast('Configuración guardada', 'success');
        renderStgIntegraciones();
      }).catch(function(err) { toast(err.message, 'error'); });
    };
  }).catch(function(err) { toast(err.message, 'error'); });
}
window.stgConfigIntegration = stgConfigIntegration;

function stgTestIntegration(id) {
  API._rawReq('POST', '/api/settings-center/integrations/' + id + '/test').then(function(r) {
    toast(r.message || 'Conexión exitosa', 'success');
  }).catch(function(err) { toast(err.message || 'Error de conexión', 'error'); });
}
window.stgTestIntegration = stgTestIntegration;

function stgDisconnectIntegration(id) {
  confirmModal('¿Desconectar esta integración?').then(function(ok) {
    if (!ok) return;
    API._rawReq('POST', '/api/settings-center/integrations/' + id + '/disconnect').then(function() {
      toast('Integración desconectada', 'success');
      renderStgIntegraciones();
    }).catch(function(err) { toast(err.message, 'error'); });
  });
}
window.stgDisconnectIntegration = stgDisconnectIntegration;

/* ── 7. SEGURIDAD ── */
async function renderStgSeguridad() {
  setStgContent('<div class="loading-state">Cargando...</div>');
  try {
    var sec = await API._rawReq('GET', '/api/settings-center/security');
    var html = '<div class="stg-cards">';
    html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><div><h2 class="stg-card-title">Política de seguridad</h2><p class="stg-card-sub">Configuración de acceso y contraseñas</p></div></div>';
    html += '<div class="stg-grid-2">';
    html += '<div class="field"><label class="field-label">Longitud mínima de contraseña</label><input id="stg_password_min_length" type="number" class="field-input" value="' + esc(sec.password_min_length || '8') + '"/></div>';
    html += stgToggle('stg_password_require_uppercase', 'Requiere mayúsculas', sec.password_require_uppercase);
    html += stgToggle('stg_password_require_special', 'Requiere caracteres especiales', sec.password_require_special);
    html += stgToggle('stg_two_factor_enabled', 'Autenticación de dos factores (2FA)', sec.two_factor_enabled);
    html += '<div class="field"><label class="field-label">Timeout de sesión (minutos)</label><input id="stg_session_timeout" type="number" class="field-input" value="' + esc(sec.session_timeout || '30') + '"/></div>';
    html += '<div class="field"><label class="field-label">Máximo de dispositivos simultáneos</label><input id="stg_session_max_devices" type="number" class="field-input" value="' + esc(sec.session_max_devices || '3') + '"/></div>';
    html += '<div class="field stg-field-full"><label class="field-label">IPs autorizadas (una por línea)</label><textarea id="stg_authorized_ips" class="field-input stg-textarea-sm">' + esc(sec.authorized_ips || '') + '</textarea></div>';
    html += '</div>' + stgActions('btnSaveSecurity') + '</div>';

    // Active sessions
    html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div><div><h2 class="stg-card-title">Sesiones activas</h2><p class="stg-card-sub">Dispositivos conectados actualmente</p></div></div>';
    html += '<div class="stg-sessions-info">Sesiones activas: <strong>' + (sec.active_sessions || 0) + '</strong></div>';
    html += '<div class="stg-session-btns">';
    for (var i = 0; i < (sec.active_sessions || 2); i++) {
      html += '<div class="stg-session-card"><div class="stg-session-card-title">Sesión ' + (i+1) + '</div><div class="stg-session-muted">Chrome · Windows</div><div class="stg-session-muted">IP: 192.168.1.' + (100+i) + '</div></div>';
    }
    html += '</div></div>';

    // Change password
    html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><div><h2 class="stg-card-title">Cambiar contraseña</h2></div></div>';
    html += '<div class="stg-grid-2">';
    html += '<div class="field"><label class="field-label">Contraseña actual</label><input type="password" id="stg_pass_actual" class="field-input"/></div>';
    html += '<div></div>';
    html += '<div class="field"><label class="field-label">Nueva contraseña</label><input type="password" id="stg_pass_new" class="field-input"/></div>';
    html += '<div class="field"><label class="field-label">Confirmar</label><input type="password" id="stg_pass_confirm" class="field-input"/></div>';
    html += '</div><button class="btn btn-primary stg-mt12" id="btnChangePass">Actualizar contraseña</button><span id="stgPassMsg" class="stg-pass-msg"></span>';
    html += '</div></div>';

    setStgContent(html);
    wireSave('btnSaveSecurity', ['stg_password_min_length','stg_password_require_uppercase','stg_password_require_special','stg_two_factor_enabled','stg_session_timeout','stg_session_max_devices','stg_authorized_ips'], '/api/settings-center/security');
    // Wire password change
    document.getElementById('btnChangePass').onclick = function() {
      var msg = document.getElementById('stgPassMsg');
      var current = document.getElementById('stg_pass_actual').value;
      var nueva = document.getElementById('stg_pass_new').value;
      var confirm = document.getElementById('stg_pass_confirm').value;
      if (!current || !nueva) { msg.textContent = 'Completá todos los campos'; msg.style.color = '#cc4444'; return; }
      if (nueva !== confirm) { msg.textContent = 'No coinciden'; msg.style.color = '#cc4444'; return; }
      API._rawReq('POST', '/api/auth/change-password', { current: current, new: nueva }).then(function() {
        msg.textContent = '✓ Contraseña actualizada'; msg.style.color = '#4caf80';
        document.getElementById('stg_pass_actual').value = '';
        document.getElementById('stg_pass_new').value = '';
        document.getElementById('stg_pass_confirm').value = '';
      }).catch(function(err) { msg.textContent = err.message; msg.style.color = '#cc4444'; });
    };
  } catch (e) {
    setStgContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

/* ── 8. BACKUPS ── */
async function renderStgBackups() {
  setStgContent('<div class="loading-state">Cargando backups...</div>');
  try {
    var data = await API._rawReq('GET', '/api/settings-center/backups');
    var html = '<div class="stg-cards">';

    // Config
    html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg></div><div><h2 class="stg-card-title">Configuración de Backups</h2></div></div>';
    html += '<div class="stg-grid-2">';
    html += stgToggle('stg_backup_auto_enabled', 'Backups automáticos', data.auto_enabled);
    html += '<div class="field"><label class="field-label">Intervalo (horas)</label><input id="stg_backup_auto_interval" type="number" class="field-input" value="' + esc(data.auto_interval || '24') + '"/></div>';
    html += stgToggle('stg_backup_cloudinary_enabled', 'Subir a Cloudinary', data.cloudinary_enabled);
    html += '</div><div class="stg-row-gap8-mt12">';
    html += '<button class="btn btn-primary btn-sm" id="saveBackupConfig">Guardar configuración</button>';
    html += '<button class="btn btn-ghost btn-sm" id="createBackupBtn">Crear backup ahora</button></div></div>';

    // History
    html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div><h2 class="stg-card-title">Historial de Backups</h2></div></div>';
    if (!data.backups || !data.backups.length) {
      html += '<div class="empty-state">Sin backups registrados</div>';
    } else {
      html += '<table class="stg-backup-table"><thead><tr><th>Archivo</th><th>Tamaño</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead><tbody>';
      data.backups.forEach(function(b) {
        html += '<tr><td>' + esc(b.filename) + '</td><td>' + b.size + '</td><td>' + (b.created_at ? b.created_at.substring(0, 16).replace('T', ' ') : '') + '</td><td><span class="admin-status-badge status-disponible">' + b.status + '</span></td><td><button class="btn btn-ghost btn-sm" onclick="stgDownloadBackup(\'' + esc(b.filename) + '\')">Descargar</button></td></tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div></div>';

    setStgContent(html);
    wireSave('saveBackupConfig', ['stg_backup_auto_enabled','stg_backup_auto_interval','stg_backup_cloudinary_enabled'], '/api/settings-center/backups/config');

    document.getElementById('createBackupBtn').onclick = function() {
      var btn = this;
      btn.disabled = true;
      btn.textContent = 'Creando...';
      API._rawReq('POST', '/api/settings-center/backups').then(function() {
        toast('Backup creado', 'success');
        renderStgBackups();
      }).catch(function(err) { toast(err.message, 'error'); btn.disabled = false; btn.textContent = 'Crear backup ahora'; });
    };
  } catch (e) {
    setStgContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

function stgDownloadBackup(filename) {
  window.open('/backups/' + filename, '_blank');
}
window.stgDownloadBackup = stgDownloadBackup;

/* ── 9. PREFERENCIAS ── */
async function renderStgPreferencias() {
  setStgContent('<div class="loading-state">Cargando preferencias...</div>');
  try {
    var p = await API._rawReq('GET', '/api/settings-center/preferences');
    var html = '<div class="stg-cards"><div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg></div><div><h2 class="stg-card-title">Preferencias del panel</h2><p class="stg-card-sub">Personalizá tu experiencia de administración</p></div></div>';
    html += '<div class="stg-grid-2">';
    html += '<div class="field"><label class="field-label">Dashboard inicial</label><select id="stg_pref_default_dashboard" class="field-input field-input--select">' +
      '<option value="dashboard"' + (p.default_dashboard === 'dashboard' || !p.default_dashboard ? ' selected' : '') + '>Dashboard</option>' +
      '<option value="props"' + (p.default_dashboard === 'props' ? ' selected' : '') + '>Propiedades</option>' +
      '<option value="calendar"' + (p.default_dashboard === 'calendar' ? ' selected' : '') + '>Agenda</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Vista por defecto</label><select id="stg_pref_default_view" class="field-input field-input--select">' +
      '<option value="cards"' + (p.default_view === 'cards' || !p.default_view ? ' selected' : '') + '>Tarjetas</option>' +
      '<option value="table"' + (p.default_view === 'table' ? ' selected' : '') + '>Tabla</option>' +
      '</select></div>';
    html += '<div class="field"><label class="field-label">Registros por página</label><select id="stg_pref_records_per_page" class="field-input field-input--select">' +
      '<option value="12"' + (p.records_per_page === '12' || !p.records_per_page ? ' selected' : '') + '>12</option>' +
      '<option value="24"' + (p.records_per_page === '24' ? ' selected' : '') + '>24</option>' +
      '<option value="48"' + (p.records_per_page === '48' ? ' selected' : '') + '>48</option>' +
      '<option value="100"' + (p.records_per_page === '100' ? ' selected' : '') + '>100</option>' +
      '</select></div>';
    html += stgToggle('stg_pref_animations_enabled', 'Animaciones', p.animations_enabled);
    html += stgToggle('stg_pref_compact_sidebar', 'Sidebar compacta', p.compact_sidebar);
    html += '</div>' + stgActions('btnSavePreferences') + '</div></div>';
    setStgContent(html);
    wireSave('btnSavePreferences', ['stg_pref_default_dashboard','stg_pref_default_view','stg_pref_records_per_page','stg_pref_animations_enabled','stg_pref_compact_sidebar'], '/api/settings-center/preferences');
  } catch (e) {
    setStgContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

/* ── 10. SISTEMA ── */
async function renderStgSistema() {
  setStgContent('<div class="loading-state">Cargando información del sistema...</div>');
  try {
    var sys = await API._rawReq('GET', '/api/settings-center/system');
    var html = '<div class="stg-cards"><div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div><div><h2 class="stg-card-title">Información del Sistema</h2><p class="stg-card-sub">Estado general de la instalación</p></div></div>';
    html += '<div class="stg-sys-grid">';
    var items = [
      { label: 'Versión', value: sys.version },
      { label: 'Entorno', value: sys.environment },
      { label: 'Base de datos', value: sys.db_type },
      { label: 'Python', value: sys.python_version },
      { label: 'Plataforma', value: sys.platform },
      { label: 'Propiedades', value: sys.properties_count },
      { label: 'Alquileres', value: sys.rentals_count },
      { label: 'Leads', value: sys.leads_count },
      { label: 'Usuarios', value: sys.users_count },
      { label: 'Agentes', value: sys.agents_count },
      { label: 'Eventos', value: sys.events_count },
      { label: 'Pool size', value: sys.db_pool ? sys.db_pool.size : 'N/A' },
    ];
    items.forEach(function(item) {
      html += '<div class="stg-sys-item"><div class="stg-sys-label">' + item.label + '</div><div class="stg-sys-value">' + esc(String(item.value)) + '</div></div>';
    });
    html += '</div></div>';

    // Health
    html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><div><h2 class="stg-card-title">Health Check</h2></div></div>';
    html += '<div class="stg-health-row"><button class="btn btn-ghost btn-sm" onclick="stgRunHealthCheck()">Ejecutar health check</button><span id="stgHealthResult"></span></div>';
    html += '</div></div>';

    setStgContent(html);
  } catch (e) {
    setStgContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

function stgRunHealthCheck() {
  var el = document.getElementById('stgHealthResult');
  el.textContent = 'Ejecutando...';
  fetch('/api/health', { credentials: 'include' }).then(function(r) { return r.json(); }).then(function(d) {
    var status = d.ok ? '✅ Saludable' : '❌ Error';
    el.innerHTML = '<span style="color:' + (d.ok ? '#4caf80' : '#cc4444') + ';font-weight:600">' + status + '</span> · DB: ' + d.database + ' · Pool: ' + (d.pool ? d.pool.checkedin + '/' + d.pool.size : 'N/A');
  }).catch(function(err) {
    el.textContent = '❌ ' + err.message;
  });
}
window.stgRunHealthCheck = stgRunHealthCheck;

/* ── Helpers ── */
function field(id, label, value, type) {
  var inputType = type || 'text';
  if (inputType === 'textarea') {
    return '<div class="field"><label class="field-label">' + label + '</label><textarea id="' + id + '" class="field-input stg-textarea-sm">' + esc(value || '') + '</textarea></div>';
  }
  return '<div class="field"><label class="field-label">' + label + '</label><input id="' + id + '" type="' + inputType + '" class="field-input" value="' + esc(value || '') + '"/></div>';
}

function stgActions(btnId) {
  return '<div class="stg-save-row"><button class="btn btn-primary" id="' + btnId + '">Guardar cambios</button><span id="' + btnId + 'Msg" class="stg-msg-inline"></span></div>';
}

function stgToggle(id, label, value) {
  var checked = value === 'true' || value === true || value === '1' ? 'checked' : '';
  return '<div class="field stg-field-row stg-field-tight"><label class="acm-chip"><input type="checkbox" class="acm-chip-input" id="' + id + '" ' + checked + '/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">' + label + '</span></span></label></div>';
}

function wireSave(btnId, fieldIds, apiPath) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  btn.onclick = function() {
    var msg = document.getElementById(btnId + 'Msg');
    var body = {};
    fieldIds.forEach(function(fid) {
      var el = document.getElementById(fid);
      if (el) {
        if (el.type === 'checkbox') body[fid.replace('stg_', '')] = el.checked ? 'true' : 'false';
        else body[fid.replace('stg_', '')] = el.value.trim();
      }
    });
    var path = apiPath || '/api/settings-center/general';
    API._rawReq('PUT', path, body).then(function() {
      msg.textContent = '✓ Guardado';
      msg.style.color = '#4caf80';
      setTimeout(function() { msg.textContent = ''; }, 3000);
    }).catch(function(err) {
      msg.textContent = err.message;
      msg.style.color = '#cc4444';
    });
  };
}

function setStgContent(html) {
  var el = document.getElementById('stgContent');
  if (el) el.innerHTML = html;
}

/* ── Subtab switching ── */
document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-stg-tab]');
  if (!btn) return;
  _stgTab = btn.getAttribute('data-stg-tab');
  document.querySelectorAll('.stg-subtab').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var fns = {
    general: renderStgGeneral,
    branding: renderStgBranding,
    localizacion: renderStgLocalizacion,
    notificaciones: renderStgNotificaciones,
    integraciones: renderStgIntegraciones,
    seguridad: renderStgSeguridad,
    backups: renderStgBackups,
    preferencias: renderStgPreferencias,
    sistema: renderStgSistema,
  };
  if (fns[_stgTab]) fns[_stgTab]();
});

/* ── Expose ── */
window.renderSettings = renderSettings;
