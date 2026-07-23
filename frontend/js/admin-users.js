/**
 * admin-users.js — RBAC: Usuarios, Roles y Permisos (Módulo 17)
 * 7 subtabs: Dashboard, Usuarios, Roles, Permisos, Invitaciones, Sesiones, Auditoría
 * Reutiliza: .btn, .admin-status-badge, .field, .field-input, .modal-backdrop
 */
let _rbacTab = 'dashboard';
let _rbacUsers = [];
let _rbacRoles = [];

function renderRBAC() {
  _rbacTab = 'dashboard';
  renderRbacSubtabs();
  renderRbacDashboard();
}
window.renderRBAC = renderRBAC;

function renderRbacSubtabs() {
  var c = document.getElementById('rbacSubtabs');
  if (!c) return;
  var tabs = ['dashboard','usuarios','roles','permisos','invitaciones','sesiones','auditoria'];
  var labels = ['Dashboard','Usuarios','Roles','Permisos','Invitaciones','Sesiones','Auditoría'];
  c.innerHTML = tabs.map(function(t,i) {
    return '<button class="rbac-subtab' + (t === _rbacTab ? ' active' : '') + '" data-rbac-tab="' + t + '">' + labels[i] + '</button>';
  }).join('');
}

function setRbacContent(html) {
  var el = document.getElementById('rbacContent');
  if (el) el.innerHTML = html;
}

/* ── 1. DASHBOARD ── */
async function renderRbacDashboard() {
  setRbacContent('<div class="loading-state">Cargando dashboard...</div>');
  try {
    var d = await API._rawReq('GET', '/api/admin/rbac/dashboard');
    var html = '<div class="rbac-kpi-grid">';
    var kpis = [
      {v:d.active_users, l:'Activos', c:''},
      {v:d.inactive_users, l:'Inactivos', c:''},
      {v:d.roles_count, l:'Roles creados', c:''},
      {v:d.permissions_count, l:'Permisos asignados', c:''},
      {v:d.active_sessions, l:'Sesiones activas', c:''},
      {v:d.pending_invites, l:'Invitaciones pendientes', c:''},
      {v:d.total_users, l:'Usuarios totales', c:''},
      {v:d.admins, l:'Administradores', c:''},
    ];
    kpis.forEach(function(k) {
      html += '<div class="rbac-kpi-card"><div class="rbac-kpi-value">' + k.v + '</div><div class="rbac-kpi-label">' + k.l + '</div></div>';
    });
    html += '</div>';

    // Recent logins
    if (d.recent_logins && d.recent_logins.length) {
      html += '<div class="stg-card"><div class="stg-card-header"><div class="stg-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg></div><div><h2 class="stg-card-title">Últimos accesos</h2></div></div>';
      html += '<div class="usr-col-gap6">';
      d.recent_logins.forEach(function(l) {
        html += '<div class="usr-log-row"><span class="usr-log-text">' + esc(l.username) + '</span><span class="usr-text-muted">' + (l.time ? l.time.substring(0,16).replace('T',' ') : '') + ' · ' + (l.ip||'') + '</span></div>';
      });
      html += '</div></div>';
    }

    setRbacContent(html);
  } catch (e) {
    setRbacContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

/* ── 2. USUARIOS ── */
async function renderRbacUsuarios() {
  setRbacContent('<div class="loading-state">Cargando usuarios...</div>');
  try {
    _rbacUsers = await API._rawReq('GET', '/api/admin/rbac/users');
    var html = '<div class="usr-section-header"><h3 class="usr-section-title">' + _rbacUsers.length + ' usuarios</h3><button class="btn btn-primary btn-sm" onclick="rbacOpenUserForm(null)">+ Nuevo usuario</button></div>';
    if (!_rbacUsers.length) {
      html += '<div class="empty-state">Sin usuarios registrados</div>';
    } else {
      _rbacUsers.forEach(function(u) {
        var initial = (u.display_name || u.username)[0].toUpperCase();
        var statusBadge = u.is_active ? '<span class="admin-status-badge status-disponible">Activo</span>' : '<span class="admin-status-badge status-oculta">Inactivo</span>';
        /* ⚠️ role="button" + manual keyboard handler en vez de <button> porque esta
           fila contiene .rbac-user-actions con <button> anidados (Editar/Eliminar).
           HTML no permite <button> dentro de <button>, y .rbac-user-actions usa
           event.stopPropagation() para no disparar el open panel al clickear acciones. */
        html += '<div class="rbac-user-row" role="button" tabindex="0" onclick="rbacOpenUserPanel(' + u.id + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click()}">';
        html += '<div class="rbac-user-avatar">' + initial + '</div>';
        html += '<div class="rbac-user-info"><div class="rbac-user-name">' + esc(u.display_name || u.username) + ' ' + statusBadge + '</div><div class="rbac-user-email">' + esc(u.email) + ' · ' + esc(u.role_name || u.role) + '</div></div>';
        html += '<div class="rbac-user-meta">';
        html += '<span class="usr-login-time">' + (u.last_login ? u.last_login.substring(0,10) : '—') + '</span>';
        if (u.active_sessions > 0) html += '<span class="sidebar-badge usr-session-badge">' + u.active_sessions + '</span>';
        html += '</div>';
        html += '<div class="rbac-user-actions" onclick="event.stopPropagation()">';
        html += '<button class="btn btn-ghost btn-sm" onclick="rbacOpenUserForm(' + u.id + ')">Editar</button>';
        html += '<button class="btn btn-ghost btn-sm usr-danger-btn" onclick="rbacDeleteUser(' + u.id + ')">Eliminar</button>';
        html += '</div></div>';
      });
    }
    setRbacContent(html);
  } catch (e) {
    setRbacContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

async function rbacOpenUserPanel(uid) {
  try {
    var u = await API._rawReq('GET', '/api/admin/rbac/users/' + uid);
    var panel = document.getElementById('rbacPanel');
    var body = document.getElementById('rbacPanelBody');
    document.getElementById('rbacPanelTitle').textContent = u.display_name || u.username;
    var html = '';
    html += '<div class="rbac-panel-section"><div class="rbac-detail-grid">';
    html += rbacField('Usuario', u.username);
    html += rbacField('Email', u.email || '—');
    html += rbacField('Rol', u.role_name || u.role);
    html += rbacField('Estado', u.is_active ? 'Activo' : 'Inactivo');
    html += rbacField('Creado', u.created_at ? u.created_at.substring(0,10) : '—');
    html += rbacField('Último acceso', u.last_login ? u.last_login.substring(0,16).replace('T',' ') : '—');
    html += rbacField('Última IP', u.last_ip || '—');
    html += rbacField('Intentos fallidos', String(u.login_attempts || 0));
    html += '</div></div>';

    // Permissions
    if (u.permissions && u.permissions.length) {
      html += '<div class="rbac-panel-section"><div class="rbac-panel-section-title">Permisos asignados</div><div class="rbac-role-perms">';
      u.permissions.forEach(function(p) {
        html += '<span class="rbac-role-perm-tag">' + esc(p.name) + '</span>';
      });
      html += '</div></div>';
    }

    // Sessions
    if (u.sessions && u.sessions.length) {
      html += '<div class="rbac-panel-section"><div class="rbac-panel-section-title">Sesiones activas (' + u.sessions.length + ')</div>';
      u.sessions.slice(0,5).forEach(function(s) {
        html += '<div class="usr-log-row"><span class="usr-log-text">' + esc(s.browser || '?') + '</span> <span class="usr-text-muted">· ' + esc(s.os || '') + ' · ' + esc(s.ip || '') + (s.active ? '' : ' (inactiva)') + '</span></div>';
      });
      html += '</div>';
    }

    // Audit
    if (u.audit && u.audit.length) {
      html += '<div class="rbac-panel-section"><div class="rbac-panel-section-title">Actividad reciente</div>';
      u.audit.slice(0,8).forEach(function(a) {
        html += '<div class="usr-event-row"><span class="usr-log-text">' + esc(a.action) + '</span><span class="usr-text-muted">' + (a.created_at ? a.created_at.substring(0,16).replace('T',' ') : '') + '</span></div>';
      });
      html += '</div>';
    }

    body.innerHTML = html;
    panel.classList.add('open');
    document.getElementById('rbacOverlay').classList.remove('hidden');
  } catch (e) {
    toast(e.message, 'error');
  }
}
window.rbacOpenUserPanel = rbacOpenUserPanel;

function closeRbacPanel() {
  document.getElementById('rbacPanel').classList.remove('open');
  document.getElementById('rbacOverlay').classList.add('hidden');
}
window.closeRbacPanel = closeRbacPanel;

function rbacField(label, value) {
  return '<div><div class="rbac-panel-label">' + label + '</div><div class="rbac-panel-value">' + esc(String(value)) + '</div></div>';
}

function rbacOpenUserForm(uid) {
  var isEdit = !!uid;
  var u = isEdit ? _rbacUsers.find(function(x) { return x.id === uid; }) : {};
  API._rawReq('GET', '/api/admin/rbac/roles').then(function(roles) {
    _rbacRoles = roles;
    var title = isEdit ? 'Editar usuario' : 'Nuevo usuario';
    var modal = document.getElementById('rbacUserFormModal');
    document.getElementById('rbacUserFormTitle').textContent = title;
    var roleOpts = roles.map(function(r) {
      var sel = isEdit && u.role_id === r.id ? ' selected' : '';
      return '<option value="' + r.id + '"' + sel + '>' + esc(r.name) + '</option>';
    }).join('');
    document.getElementById('rbacUserFormContent').innerHTML = '<div class="pf-body"><div class="stg-grid-2">' +
      '<div class="field"><label class="field-label">Usuario *</label><input id="ru_username" class="field-input" value="' + esc((u||{}).username||'') + '"/></div>' +
      '<div class="field"><label class="field-label">Nombre visible</label><input id="ru_display_name" class="field-input" value="' + esc((u||{}).display_name||'') + '"/></div>' +
      '<div class="field"><label class="field-label">Email</label><input id="ru_email" class="field-input" value="' + esc((u||{}).email||'') + '"/></div>' +
      '<div class="field"><label class="field-label">Rol</label><select id="ru_role_id" class="field-input field-input--select">' + roleOpts + '</select></div>' +
      '<div class="field usr-field-full"><label class="field-label">Contraseña ' + (isEdit ? '(dejar vacío para no cambiar)' : '*') + '</label><input id="ru_password" type="password" class="field-input" placeholder="••••••"/></div>' +
      (isEdit ? '<div class="field usr-field-row"><label class="acm-chip"><input type="checkbox" class="acm-chip-input" id="ru_is_active" ' + (u.is_active !== false ? 'checked' : '') + '/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Activo</span></span></label></div>' : '') +
      '</div><div class="usr-btn-row">' +
      '<button class="btn btn-primary btn-full" id="rbacSaveUserBtn">' + (isEdit ? 'Guardar' : 'Crear') + '</button>' +
      '<button class="btn btn-ghost" onclick="document.getElementById(\'rbacUserFormModal\').classList.add(\'hidden\')">Cancelar</button></div></div>';
    modal.classList.remove('hidden');
    document.getElementById('rbacSaveUserBtn').onclick = function() {
      var username = document.getElementById('ru_username').value.trim();
      if (!username) { toast('El usuario es requerido', 'warn'); return; }
      var body = { username: username, display_name: document.getElementById('ru_display_name').value, email: document.getElementById('ru_email').value, role_id: parseInt(document.getElementById('ru_role_id').value) || null };
      var pw = document.getElementById('ru_password').value;
      if (pw) body.password = pw;
      if (isEdit) {
        body.is_active = document.getElementById('ru_is_active').checked;
        API._rawReq('PUT', '/api/admin/rbac/users/' + uid, body).then(function() {
          modal.classList.add('hidden');
          toast('Usuario actualizado', 'success');
          renderRbacUsuarios();
        }).catch(function(err) { toast(err.message, 'error'); });
      } else {
        API._rawReq('POST', '/api/admin/rbac/users', body).then(function() {
          modal.classList.add('hidden');
          toast('Usuario creado', 'success');
          renderRbacUsuarios();
        }).catch(function(err) { toast(err.message, 'error'); });
      }
    };
  }).catch(function(err) { toast(err.message, 'error'); });
}
window.rbacOpenUserForm = rbacOpenUserForm;

function rbacDeleteUser(uid) {
  confirmModal('¿Eliminar este usuario?').then(function(ok) {
    if (!ok) return;
    API._rawReq('DELETE', '/api/admin/rbac/users/' + uid).then(function() {
      toast('Usuario eliminado', 'success');
      renderRbacUsuarios();
    }).catch(function(err) { toast(err.message, 'error'); });
  });
}
window.rbacDeleteUser = rbacDeleteUser;

/* ── 3. ROLES ── */
async function renderRbacRoles() {
  setRbacContent('<div class="loading-state">Cargando roles...</div>');
  try {
    var roles = await API._rawReq('GET', '/api/admin/rbac/roles');
    var html = '<div class="usr-section-header"><h3 class="usr-section-title">' + roles.length + ' roles</h3><button class="btn btn-primary btn-sm" onclick="rbacOpenRoleForm(null)">+ Nuevo rol</button></div>';
    html += '<div class="stg-grid-3">';
    roles.forEach(function(r) {
      html += '<div class="rbac-role-card">';
      html += '<div class="rbac-role-head"><div class="rbac-role-dot" style="background:' + (r.color||'var(--admin-accent)') + '"></div><div><div class="rbac-role-name">' + esc(r.name) + '</div><div class="rbac-role-count">' + r.user_count + ' usuarios</div></div></div>';
      html += '<div class="rbac-role-desc">' + esc(r.description || '—') + '</div>';
      if (r.permissions && r.permissions.length) {
        html += '<div class="rbac-role-perms">';
        r.permissions.slice(0,6).forEach(function(p) { html += '<span class="rbac-role-perm-tag">' + esc(p.name) + '</span>'; });
        if (r.permissions.length > 6) html += '<span class="rbac-role-perm-tag">+' + (r.permissions.length - 6) + '</span>';
        html += '</div>';
      }
      html += '<div class="usr-role-actions"><button class="btn btn-ghost btn-sm" onclick="rbacOpenRoleForm(' + r.id + ')">Editar</button>' +
        (r.is_system ? '' : '<button class="btn btn-ghost btn-sm usr-danger-btn" onclick="rbacDeleteRole(' + r.id + ')">Eliminar</button>') +
        '</div></div>';
    });
    html += '</div>';
    setRbacContent(html);
  } catch (e) {
    setRbacContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

function rbacOpenRoleForm(rid) {
  var isEdit = !!rid;
  API._rawReq('GET', '/api/admin/rbac/roles').then(function(roles) {
    var r = isEdit ? roles.find(function(x) { return x.id === rid; }) : {};
    var title = isEdit ? 'Editar rol' : 'Nuevo rol';
    var modal = document.getElementById('rbacRoleFormModal');
    document.getElementById('rbacRoleFormTitle').textContent = title;
    document.getElementById('rbacRoleFormContent').innerHTML = '<div class="pf-body"><div class="stg-grid-2">' +
      '<div class="field"><label class="field-label">Nombre *</label><input id="rr_name" class="field-input" value="' + esc((r||{}).name||'') + '"/></div>' +
      '<div class="field"><label class="field-label">Slug</label><input id="rr_slug" class="field-input" value="' + esc((r||{}).slug||'') + '" placeholder="ej: analista"/></div>' +
      '<div class="field usr-field-full"><label class="field-label">Descripción</label><input id="rr_description" class="field-input" value="' + esc((r||{}).description||'') + '"/></div>' +
      '<div class="field"><label class="field-label">Color</label><input id="rr_color" type="color" class="stg-color-input" value="' + esc((r||{}).color||'#20b8ab') + '"/></div>' +
      '<div class="field"><label class="field-label">Orden</label><input id="rr_sort_order" type="number" class="field-input" value="' + ((r||{}).sort_order||'0') + '"/></div>' +
      '</div><div class="usr-btn-row">' +
      '<button class="btn btn-primary btn-full" id="rbacSaveRoleBtn">' + (isEdit ? 'Guardar' : 'Crear') + '</button>' +
      '<button class="btn btn-ghost" onclick="document.getElementById(\'rbacRoleFormModal\').classList.add(\'hidden\')">Cancelar</button></div></div>';
    modal.classList.remove('hidden');
    document.getElementById('rbacSaveRoleBtn').onclick = function() {
      var name = document.getElementById('rr_name').value.trim();
      if (!name) { toast('El nombre es requerido', 'warn'); return; }
      var body = { name: name, slug: document.getElementById('rr_slug').value.trim() || name.toLowerCase().replace(/\s+/g,'_'), description: document.getElementById('rr_description').value, color: document.getElementById('rr_color').value, sort_order: parseInt(document.getElementById('rr_sort_order').value) || 0 };
      if (isEdit) {
        API._rawReq('PUT', '/api/admin/rbac/roles/' + rid, body).then(function() {
          modal.classList.add('hidden'); toast('Rol actualizado', 'success'); renderRbacRoles();
        }).catch(function(err) { toast(err.message, 'error'); });
      } else {
        API._rawReq('POST', '/api/admin/rbac/roles', body).then(function() {
          modal.classList.add('hidden'); toast('Rol creado', 'success'); renderRbacRoles();
        }).catch(function(err) { toast(err.message, 'error'); });
      }
    };
  }).catch(function(err) { toast(err.message, 'error'); });
}
window.rbacOpenRoleForm = rbacOpenRoleForm;

function rbacDeleteRole(rid) {
  confirmModal('¿Eliminar este rol?').then(function(ok) {
    if (!ok) return;
    API._rawReq('DELETE', '/api/admin/rbac/roles/' + rid).then(function() {
      toast('Rol eliminado', 'success'); renderRbacRoles();
    }).catch(function(err) { toast(err.message, 'error'); });
  });
}
window.rbacDeleteRole = rbacDeleteRole;

/* ── 4. PERMISOS ── */
async function renderRbacPermisos() {
  setRbacContent('<div class="loading-state">Cargando permisos...</div>');
  try {
    var data = await API._rawReq('GET', '/api/admin/rbac/permissions');
    var roles = await API._rawReq('GET', '/api/admin/rbac/roles');
    _rbacRoles = roles;
    var grouped = data.grouped || {};
    var moduleOrder = ['dashboard','properties','crm','messages','agents','appraisals','portals','marketing','settings','users','roles','reports'];
    var moduleLabels = { dashboard:'Dashboard', properties:'Propiedades', crm:'CRM', messages:'Mensajes', agents:'Agentes', appraisals:'Tasaciones', portals:'Portales', marketing:'Marketing', settings:'Configuración', users:'Usuarios', roles:'Roles', reports:'Reportes' };

    // Role selector
    var html = '<div class="usr-perm-header">';
    html += '<label class="usr-perm-label">Ver permisos para:</label>';
    html += '<select id="rbacPermRoleFilter" class="field-input field-input--select usr-perm-select" onchange="renderRbacPermMatrix()">';
    roles.forEach(function(r) {
      html += '<option value="' + r.id + '">' + esc(r.name) + '</option>';
    });
    html += '</select><button class="btn btn-primary btn-sm" id="rbacSavePermsBtn">Guardar cambios</button><span id="rbacPermMsg" class="usr-msg-inline"></span></div>';

    html += '<div id="rbacPermMatrix"></div>';
    setRbacContent(html);
    renderRbacPermMatrix();
  } catch (e) {
    setRbacContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

function renderRbacPermMatrix() {
  var roleId = parseInt(document.getElementById('rbacPermRoleFilter').value);
  var role = _rbacRoles.find(function(r) { return r.id === roleId; });
  var permIds = (role && role.permissions) ? role.permissions.map(function(p) { return p.id; }) : [];

  API._rawReq('GET', '/api/admin/rbac/permissions').then(function(data) {
    var grouped = data.grouped || {};
    var moduleOrder = ['dashboard','properties','crm','messages','agents','appraisals','portals','marketing','settings','users','roles','reports'];
    var moduleLabels = { dashboard:'Dashboard', properties:'Propiedades', crm:'CRM', messages:'Mensajes', agents:'Agentes', appraisals:'Tasaciones', portals:'Portales', marketing:'Marketing', settings:'Configuración', users:'Usuarios', roles:'Roles', reports:'Reportes' };
    var html = '';
    moduleOrder.forEach(function(mod) {
      var perms = grouped[mod];
      if (!perms || !perms.length) return;
      html += '<div class="rbac-perm-module"><div class="rbac-perm-module-title">' + (moduleLabels[mod] || mod) + '</div><div class="rbac-perm-grid">';
      perms.forEach(function(p) {
        var checked = permIds.indexOf(p.id) !== -1 ? 'checked' : '';
        html += '<label class="acm-chip"><input type="checkbox" class="acm-chip-input rbac-perm-cb" data-perm-id="' + p.id + '" ' + checked + '/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">' + esc(p.name) + '</span></span></label>';
      });
      html += '</div></div>';
    });
    document.getElementById('rbacPermMatrix').innerHTML = html;

    document.getElementById('rbacSavePermsBtn').onclick = function() {
      var cbs = document.querySelectorAll('.rbac-perm-cb:checked');
      var ids = Array.from(cbs).map(function(cb) { return parseInt(cb.getAttribute('data-perm-id')); });
      API._rawReq('PUT', '/api/admin/rbac/roles/' + roleId, { permission_ids: ids }).then(function() {
        document.getElementById('rbacPermMsg').textContent = '✓ Permisos actualizados';
        document.getElementById('rbacPermMsg').style.color = '#4caf80';
        setTimeout(function() { document.getElementById('rbacPermMsg').textContent = ''; }, 3000);
      }).catch(function(err) { toast(err.message, 'error'); });
    };
  });
}
window.renderRbacPermMatrix = renderRbacPermMatrix;

/* ── 5. INVITACIONES ── */
async function renderRbacInvitaciones() {
  setRbacContent('<div class="loading-state">Cargando invitaciones...</div>');
  try {
    var invites = await API._rawReq('GET', '/api/admin/rbac/invitations');
    var html = '<div class="usr-section-header"><h3 class="usr-section-title">' + invites.length + ' invitaciones</h3><button class="btn btn-primary btn-sm" onclick="rbacOpenInviteForm()">+ Invitar usuario</button></div>';
    if (!invites.length) {
      html += '<div class="empty-state">Sin invitaciones pendientes</div>';
    } else {
      invites.forEach(function(i) {
        var statusBadge = i.status === 'pending' ? '<span class="admin-status-badge status-disponible">Pendiente</span>' : i.status === 'accepted' ? '<span class="admin-status-badge status-oculta">Aceptada</span>' : '<span class="admin-status-badge usr-badge-danger">Cancelada</span>';
        html += '<div class="rbac-invite-row"><div class="rbac-invite-info"><div class="rbac-invite-email">' + esc(i.email) + ' ' + statusBadge + '</div><div class="rbac-invite-meta">Rol: ' + esc(i.role_name || '—') + ' · Invitó: ' + esc(i.inviter_name || '—') + ' · ' + (i.created_at ? i.created_at.substring(0,10) : '') + (i.expires_at ? ' · Exp: ' + i.expires_at.substring(0,10) : '') + '</div></div><div class="rbac-user-actions">';
        if (i.status === 'pending') {
          html += '<button class="btn btn-ghost btn-sm" onclick="rbacResendInvite(' + i.id + ')">Reenviar</button>';
          html += '<button class="btn btn-ghost btn-sm" onclick="rbacCancelInvite(' + i.id + ')">Cancelar</button>';
        }
        html += '<button class="btn btn-ghost btn-sm usr-danger-btn" onclick="rbacDeleteInvite(' + i.id + ')">Eliminar</button>';
        html += '</div></div>';
      });
    }
    setRbacContent(html);
  } catch (e) {
    setRbacContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

function rbacOpenInviteForm() {
  API._rawReq('GET', '/api/admin/rbac/roles').then(function(roles) {
    var modal = document.getElementById('rbacInviteModal');
    var roleOpts = roles.map(function(r) { return '<option value="' + r.id + '">' + esc(r.name) + '</option>'; }).join('');
    document.getElementById('rbacInviteContent').innerHTML = '<div class="pf-body"><div class="field"><label class="field-label">Email *</label><input id="ri_email" type="email" class="field-input" placeholder="usuario@bienenhaus.com"/></div><div class="field"><label class="field-label">Rol</label><select id="ri_role_id" class="field-input field-input--select">' + roleOpts + '</select></div><div class="usr-btn-row"><button class="btn btn-primary btn-full" id="rbacSendInviteBtn">Enviar invitación</button><button class="btn btn-ghost" onclick="document.getElementById(\'rbacInviteModal\').classList.add(\'hidden\')">Cancelar</button></div></div>';
    modal.classList.remove('hidden');
    document.getElementById('rbacSendInviteBtn').onclick = function() {
      var email = document.getElementById('ri_email').value.trim();
      if (!email || email.indexOf('@') === -1) { toast('Email inválido', 'warn'); return; }
      API._rawReq('POST', '/api/admin/rbac/invitations', { email: email, role_id: parseInt(document.getElementById('ri_role_id').value) || null }).then(function() {
        modal.classList.add('hidden'); toast('Invitación enviada', 'success'); renderRbacInvitaciones();
      }).catch(function(err) { toast(err.message, 'error'); });
    };
  }).catch(function(err) { toast(err.message, 'error'); });
}
window.rbacOpenInviteForm = rbacOpenInviteForm;

function rbacResendInvite(iid) {
  API._rawReq('POST', '/api/admin/rbac/invitations/' + iid + '/resend').then(function() {
    toast('Invitación reenviada', 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
}
window.rbacResendInvite = rbacResendInvite;

function rbacCancelInvite(iid) {
  API._rawReq('POST', '/api/admin/rbac/invitations/' + iid + '/cancel').then(function() {
    toast('Invitación cancelada', 'success'); renderRbacInvitaciones();
  }).catch(function(err) { toast(err.message, 'error'); });
}
window.rbacCancelInvite = rbacCancelInvite;

function rbacDeleteInvite(iid) {
  confirmModal('¿Eliminar esta invitación?').then(function(ok) {
    if (!ok) return;
    API._rawReq('DELETE', '/api/admin/rbac/invitations/' + iid).then(function() {
      toast('Invitación eliminada', 'success'); renderRbacInvitaciones();
    }).catch(function(err) { toast(err.message, 'error'); });
  });
}
window.rbacDeleteInvite = rbacDeleteInvite;

/* ── 6. SESIONES ── */
async function renderRbacSesiones() {
  setRbacContent('<div class="loading-state">Cargando sesiones...</div>');
  try {
    var sessions = await API._rawReq('GET', '/api/admin/rbac/sessions');
    var html = '<h3 class="usr-subsection-title">' + sessions.length + ' sesiones activas</h3>';
    if (!sessions.length) {
      html += '<div class="empty-state">Sin sesiones registradas</div>';
    } else {
      sessions.forEach(function(s) {
        var activeBadge = s.active ? '<span class="admin-status-badge status-disponible">Activa</span>' : '<span class="admin-status-badge status-oculta">Inactiva</span>';
        html += '<div class="rbac-session-row"><div class="rbac-session-info"><div class="rbac-session-device">' + esc(s.username || '?') + ' · ' + esc(s.browser || '?') + ' ' + activeBadge + '</div><div class="rbac-session-detail">' + esc(s.os || '') + (s.device ? ' · ' + esc(s.device) : '') + (s.ip ? ' · ' + esc(s.ip) : '') + (s.city ? ' · ' + esc(s.city) : '') + (s.last_activity ? ' · ' + s.last_activity.substring(0,16).replace('T',' ') : '') + '</div></div>';
        if (s.active) html += '<button class="btn btn-ghost btn-sm usr-danger-btn" onclick="rbacTerminateSession(' + s.id + ')">Cerrar</button>';
        html += '</div>';
      });
    }
    setRbacContent(html);
  } catch (e) {
    setRbacContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

function rbacTerminateSession(sid) {
  confirmModal('¿Cerrar esta sesión?').then(function(ok) {
    if (!ok) return;
    API._rawReq('POST', '/api/admin/rbac/sessions/' + sid + '/terminate').then(function() {
      toast('Sesión cerrada', 'success'); renderRbacSesiones();
    }).catch(function(err) { toast(err.message, 'error'); });
  });
}
window.rbacTerminateSession = rbacTerminateSession;

/* ── 7. AUDITORÍA ── */
async function renderRbacAuditoria() {
  setRbacContent('<div class="loading-state">Cargando auditoría...</div>');
  try {
    var audit = await API._rawReq('GET', '/api/admin/rbac/audit');
    var html = '<h3 class="usr-subsection-title">' + audit.length + ' eventos</h3>';
    var iconMap = { login: '🔑', logout: '🚪', password_change: '🔐', role_change: '👤', user_created: '➕', user_updated: '✏️', user_deleted: '🗑️', role_created: '➕', role_updated: '✏️', role_deleted: '🗑️', invitation_sent: '📧' };
    audit.forEach(function(a) {
      html += '<div class="rbac-audit-item"><div class="rbac-audit-icon">' + (iconMap[a.action] || '📋') + '</div><div class="rbac-audit-info"><div class="rbac-audit-action">' + esc(a.action) + '</div><div class="rbac-audit-detail">' + esc(a.username || 'Sistema') + (a.details ? ' · ' + esc(a.details) : '') + '</div></div><div class="rbac-audit-time">' + (a.created_at ? a.created_at.substring(0,16).replace('T',' ') : '') + '</div></div>';
    });
    setRbacContent(html);
  } catch (e) {
    setRbacContent('<div class="error-state">Error: ' + e.message + '</div>');
  }
}

/* ── Subtab switching ── */
document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-rbac-tab]');
  if (!btn) return;
  _rbacTab = btn.getAttribute('data-rbac-tab');
  document.querySelectorAll('.rbac-subtab').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var fns = {
    dashboard: renderRbacDashboard,
    usuarios: renderRbacUsuarios,
    roles: renderRbacRoles,
    permisos: renderRbacPermisos,
    invitaciones: renderRbacInvitaciones,
    sesiones: renderRbacSesiones,
    auditoria: renderRbacAuditoria,
  };
  if (fns[_rbacTab]) fns[_rbacTab]();
});

/* ── Helps ── */
window.esc = window.esc || function(s) { if (typeof s !== 'string') return String(s || ''); return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); };
