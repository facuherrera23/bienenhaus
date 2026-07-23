/**
 * admin-calendar.js — Módulo 15: Agenda y Recordatorios
 * Reutiliza API._req, .req-kpi-bar, .req-panel, .req-overlay, .btn, .field-input
 */

let _calView = 'month';
let _calDate = new Date();
let _calEvents = [];
let _calPanelOpen = false;
const _calMonths = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

/* ── INIT ── */
function loadCalendar() {
  loadCalendarKpi();
  renderCalendarView();
  loadCalendarActivity('upcoming');
}
window.loadCalendar = loadCalendar;

/* ── KPIs ── */
async function loadCalendarKpi() {
  const bar = document.getElementById('calKpiBar');
  if (!bar) return;
  bar.innerHTML = '<div class="loading-state cal-kpi-loading">Cargando estadísticas...</div>';
  try {
    const d = await API._rawReq('GET', '/api/calendar/kpi');
    const labels = [
      { key: 'today_events', label: 'Hoy', cls: 'cal-kpi-accent' },
      { key: 'week_events', label: 'Esta semana', cls: '' },
      { key: 'visits', label: 'Visitas', cls: 'cal-kpi-accent' },
      { key: 'appraisals', label: 'Tasaciones', cls: '' },
      { key: 'calls', label: 'Llamadas', cls: '' },
      { key: 'overdue', label: 'Vencidas', cls: 'cal-kpi-warn' },
      { key: 'completed_today', label: 'Completadas hoy', cls: 'cal-kpi-success' },
      { key: 'completion_rate', label: 'Completado %', cls: '' },
    ];
    bar.innerHTML = labels.map(l => {
      const val = d[l.key] ?? 0;
      const display = l.key === 'completion_rate' ? val + '%' : val;
      return `<div class="cal-kpi-card"><span class="cal-kpi-number ${l.cls}">${display}</span><span class="cal-kpi-label">${l.label}</span></div>`;
    }).join('');
  } catch (e) {
    bar.innerHTML = '<div class="error-state">Error al cargar KPIs</div>';
  }
}

/* ── CALENDAR VIEW ── */
function renderCalendarView() {
  const wrap = document.getElementById('calGridWrap');
  if (!wrap) return;
  if (_calView === 'month') renderMonthView();
  else if (_calView === 'week') renderWeekView();
  else renderDayView();
  updateNavLabel();
}

function updateNavLabel() {
  const lbl = document.getElementById('calNavLabel');
  if (!lbl) return;
  const y = _calDate.getFullYear();
  const m = _calDate.getMonth();
  const d = _calDate.getDate();
  if (_calView === 'month') lbl.textContent = _calMonths[m] + ' ' + y;
  else if (_calView === 'week') {
    const ref = new Date(y, m, d);
    const start = new Date(ref); start.setDate(ref.getDate() - ref.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 6);
    lbl.textContent = start.getDate() + ' ' + _calMonths[start.getMonth()] + ' - ' + end.getDate() + ' ' + _calMonths[end.getMonth()] + ' ' + y;
  } else {
    lbl.textContent = d + ' ' + _calMonths[m] + ' ' + y;
  }
}

async function fetchEvents(view, year, month, day) {
  let params = 'view=' + view;
  if (year) params += '&year=' + year;
  if (month) params += '&month=' + month;
  if (day) params += '&day=' + day;
  try {
    const data = await API._rawReq('GET', '/api/calendar/events?' + params);
    _calEvents = data || [];
    return _calEvents;
  } catch {
    _calEvents = [];
    return [];
  }
}

function getEventTypeColor(type) {
  const colors = {
    visita: 'var(--admin-accent)',
    reunion: 'var(--admin-cal-reunion)',
    llamada: 'var(--admin-cal-llamada)',
    tasacion: 'var(--admin-cal-tasacion)',
    recordatorio: 'var(--admin-cal-recordatorio)',
    tarea: 'var(--admin-cal-tarea)',
    evento: 'var(--admin-cal-evento)',
  };
  return colors[type] || 'var(--admin-text-muted)';
}

function getEventTypeLabel(type) {
  const labels = {
    visita: 'Visita', reunion: 'Reunión', llamada: 'Llamada',
    tasacion: 'Tasación', recordatorio: 'Recordatorio', tarea: 'Tarea', evento: 'Evento',
  };
  return labels[type] || type;
}

/* ── Month View ── */
async function renderMonthView() {
  const wrap = document.getElementById('calGridWrap');
  if (!wrap) return;
  const year = _calDate.getFullYear();
  const month = _calDate.getMonth();
  await fetchEvents('month', year, month + 1);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

  const eventsByDate = {};
  _calEvents.forEach(function(e) {
    if (!e.start_at) return;
    const key = e.start_at.substring(0, 10);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(e);
  });

  var h = '<div class="cal-grid-header">' +
    ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(function(d) { return '<div>' + d + '</div>'; }).join('') +
    '</div><div class="cal-grid">';

  // Previous month days
  for (var i = firstDay - 1; i >= 0; i--) {
    var day = daysInPrev - i;
    var mStr = String(month).padStart(2,'0');
    var dStr = String(day).padStart(2,'0');
    var yStr = month === 0 ? year - 1 : year;
    var pm = month === 0 ? 11 : month - 1;
    var dateStr = yStr + '-' + String(pm + 1).padStart(2,'0') + '-' + dStr;
    var dayEvents = eventsByDate[dateStr] || [];
    var lblPrev = day + ' de ' + _calMonths[pm] + ' de ' + yStr + (dayEvents.length ? ', ' + dayEvents.length + ' evento' + (dayEvents.length !== 1 ? 's' : '') : '');
    h += '<div class="cal-day cal-day--other" role="button" tabindex="0" aria-label="' + lblPrev + '" onclick="switchCalView(\'day\',' + yStr + ',' + (pm + 1) + ',' + day + ')">' +
      '<div class="cal-day-num">' + day + '</div>' +
      dayEvents.slice(0, 2).map(function(e) {
        return '<button type="button" class="cal-day-event cal-day-event--' + e.event_type + '" onclick="event.stopPropagation();openCalEvent(' + e.id + ')">' + esc(e.title) + '</button>';
      }).join('') +
      (dayEvents.length > 2 ? '<button type="button" class="cal-day-more">+' + (dayEvents.length - 2) + ' más</button>' : '') +
      '</div>';
  }

  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = year + '-' + String(month + 1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    var isToday = dateStr === todayStr;
    var dayEvents = eventsByDate[dateStr] || [];
    var lblCur = d + ' de ' + _calMonths[month] + ' de ' + year + (isToday ? ', hoy' : '') + (dayEvents.length ? ', ' + dayEvents.length + ' evento' + (dayEvents.length !== 1 ? 's' : '') : '');
    h += '<div class="cal-day' + (isToday ? ' cal-day--today' : '') + '" role="button" tabindex="0" aria-label="' + lblCur + '" onclick="switchCalView(\'day\',' + year + ',' + (month + 1) + ',' + d + ')">' +
      '<div class="cal-day-num">' + d + '</div>' +
      dayEvents.slice(0, 3).map(function(e) {
        return '<button type="button" class="cal-day-event cal-day-event--' + e.event_type + '" onclick="event.stopPropagation();openCalEvent(' + e.id + ')">' + esc(e.title) + '</button>';
      }).join('') +
      (dayEvents.length > 3 ? '<button type="button" class="cal-day-more">+' + (dayEvents.length - 3) + ' más</button>' : '') +
      '</div>';
  }

  // Fill remaining cells
  var totalCells = firstDay + daysInMonth;
  var remaining = (7 - (totalCells % 7)) % 7;
  for (var r = 1; r <= remaining; r++) {
    var nm = month + 1;
    var ny = year;
    if (nm > 11) { nm = 0; ny++; }
    var dateStr2 = ny + '-' + String(nm + 1).padStart(2,'0') + '-' + String(r).padStart(2,'0');
    var dayEvents2 = eventsByDate[dateStr2] || [];
    var lblRem = r + ' de ' + _calMonths[nm] + ' de ' + ny + (dayEvents2.length ? ', ' + dayEvents2.length + ' evento' + (dayEvents2.length !== 1 ? 's' : '') : '');
    h += '<div class="cal-day cal-day--other" role="button" tabindex="0" aria-label="' + lblRem + '" onclick="switchCalView(\'day\',' + ny + ',' + (nm + 1) + ',' + r + ')">' +
      '<div class="cal-day-num">' + r + '</div>' +
      dayEvents2.slice(0, 2).map(function(e) {
        return '<button type="button" class="cal-day-event cal-day-event--' + e.event_type + '" onclick="event.stopPropagation();openCalEvent(' + e.id + ')">' + esc(e.title) + '</button>';
      }).join('') +
      (dayEvents2.length > 2 ? '<button type="button" class="cal-day-more">+' + (dayEvents2.length - 2) + ' más</button>' : '') +
      '</div>';
  }

  h += '</div>';
  wrap.innerHTML = h;
}

/* ── Week View ── */
async function renderWeekView() {
  const wrap = document.getElementById('calGridWrap');
  if (!wrap) return;
  const year = _calDate.getFullYear();
  const month = _calDate.getMonth();
  const day = _calDate.getDate();
  await fetchEvents('week', year, month + 1, day);
  const ref = new Date(year, month, day);
  const start = new Date(ref); start.setDate(ref.getDate() - ref.getDay());
  const days = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(start); d.setDate(start.getDate() + i);
    days.push(d);
  }
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  const eventsByDate = {};
  _calEvents.forEach(function(e) {
    if (!e.start_at) return;
    var key = e.start_at.substring(0, 10);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(e);
  });
  var h = '<div class="cal-grid-header">' +
    days.map(function(d) { return '<div>' + ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()] + ' ' + d.getDate() + '</div>'; }).join('') +
    '</div><div class="cal-grid">';
  days.forEach(function(d) {
    var ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    var isToday = ds === todayStr;
    var dayEvents = eventsByDate[ds] || [];
    var lblWeek = d.getDate() + ' de ' + _calMonths[d.getMonth()] + ' de ' + d.getFullYear() + (isToday ? ', hoy' : '') + (dayEvents.length ? ', ' + dayEvents.length + ' evento' + (dayEvents.length !== 1 ? 's' : '') : '');
    h += '<div class="cal-day' + (isToday ? ' cal-day--today' : '') + '" role="button" tabindex="0" aria-label="' + lblWeek + '" onclick="switchCalView(\'day\',' + d.getFullYear() + ',' + (d.getMonth() + 1) + ',' + d.getDate() + ')">' +
      '<div class="cal-day-num">' + d.getDate() + '</div>' +
      dayEvents.slice(0, 4).map(function(e) {
        return '<button type="button" class="cal-day-event cal-day-event--' + e.event_type + '" onclick="event.stopPropagation();openCalEvent(' + e.id + ')">' + esc(e.title) + '</button>';
      }).join('') +
      (dayEvents.length > 4 ? '<button type="button" class="cal-day-more">+' + (dayEvents.length - 4) + ' más</button>' : '') +
      '</div>';
  });
  h += '</div>';
  wrap.innerHTML = h;
}

/* ── Day View ── */
async function renderDayView() {
  const wrap = document.getElementById('calGridWrap');
  if (!wrap) return;
  const year = _calDate.getFullYear();
  const month = _calDate.getMonth() + 1;
  const day = _calDate.getDate();
  await fetchEvents('day', year, month, day);
  if (!_calEvents.length) {
    wrap.innerHTML = '<div class="cal-day-view"><div class="cal-day-view-empty">Sin eventos para este día</div></div>';
    return;
  }
  _calEvents.sort(function(a, b) { return (a.start_at || '').localeCompare(b.start_at || ''); });
  var h = '<div class="cal-day-view">';
  _calEvents.forEach(function(e) {
    var time = e.start_at ? e.start_at.substring(11, 16) : '';
    var endTime = e.end_at ? e.end_at.substring(11, 16) : '';
    var color = getEventTypeColor(e.event_type);
    h += '<button type="button" class="cal-time-slot" onclick="openCalEvent(' + e.id + ')">' +
      '<div class="cal-time-label">' + time + (endTime ? ' - ' + endTime : '') + '</div>' +
      '<div class="cal-time-content">' +
      '<div class="cal-event-header">' +
      '<span class="cal-event-dot" style="background:' + color + '"></span>' +
      '<span class="cal-event-title">' + esc(e.title) + '</span>' +
      '<span class="admin-status-badge status-' + e.status + ' cal-event-status-badge">' + e.status + '</span>' +
      '</div>' +
      (e.client_name ? '<div class="cal-event-client">' + esc(e.client_name) + '</div>' : '') +
      '</div></button>';
  });
  h += '</div>';
  wrap.innerHTML = h;
}

/* ── Activity List ── */
async function loadCalendarActivity(view) {
  const list = document.getElementById('calActivityList');
  if (!list) return;
  list.innerHTML = '<div class="loading-state">Cargando...</div>';
  try {
    var data = await API._rawReq('GET', '/api/calendar/events?view=' + view);
    if (!data || !data.length) {
      list.innerHTML = '<div class="empty-state">Sin actividades</div>';
      return;
    }
    var typeIcons = { visita: '🏠', reunion: '🤝', llamada: '📞', tasacion: '📋', recordatorio: '🔔', tarea: '✅', evento: '📅' };
    var statusLabels = { pendiente: 'Pendiente', confirmado: 'Confirmado', completado: 'Completado', cancelado: 'Cancelado', reprogramado: 'Reprogramado' };
    list.innerHTML = data.map(function(e) {
      var date = e.start_at ? e.start_at.substring(0, 10) : '';
      var time = e.start_at ? e.start_at.substring(11, 16) : '';
      return '<button type="button" class="cal-activity-item" onclick="openCalEvent(' + e.id + ')">' +
        '<div class="cal-activity-icon" style="background:' + getEventTypeColor(e.event_type) + '15">' + (typeIcons[e.event_type] || '📌') + '</div>' +
        '<div class="cal-activity-body">' +
        '<div class="cal-activity-title">' + esc(e.title) + '</div>' +
        '<div class="cal-activity-meta">' +
        '<span>' + getEventTypeLabel(e.event_type) + '</span>' +
        (e.client_name ? '<span>' + esc(e.client_name) + '</span>' : '') +
        '<span>' + date + ' ' + time + '</span>' +
        '<span class="admin-status-badge status-' + e.status + '">' + (statusLabels[e.status] || e.status) + '</span>' +
        '</div></div></button>';
    }).join('');
  } catch (e) {
    list.innerHTML = '<div class="error-state">Error al cargar</div>';
  }
}
window.loadCalendarActivity = loadCalendarActivity;

/* ── Navigation ── */
function calNavigate(dir) {
  if (_calView === 'month') _calDate.setMonth(_calDate.getMonth() + dir);
  else if (_calView === 'week') _calDate.setDate(_calDate.getDate() + dir * 7);
  else _calDate.setDate(_calDate.getDate() + dir);
  renderCalendarView();
  var activityView = document.querySelector('.cal-subtab.active[data-cal-tab]');
  if (activityView) loadCalendarActivity(activityView.getAttribute('data-cal-tab'));
  else loadCalendarActivity('upcoming');
}
window.calNavigate = calNavigate;

function calToday() {
  _calDate = new Date();
  renderCalendarView();
  loadCalendarActivity('upcoming');
}
window.calToday = calToday;

function switchCalView(view, year, month, day) {
  _calView = view;
  if (year) _calDate = new Date(year, (month || 1) - 1, day || 1);
  document.querySelectorAll('.cal-view-btn').forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-cal-view') === view); });
  renderCalendarView();
}
window.switchCalView = switchCalView;

/* ── Event Panel ── */
async function openCalEvent(id) {
  var overlay = document.getElementById('calOverlay');
  var panel = document.getElementById('calPanel');
  var body = document.getElementById('calPanelBody');
  var title = document.getElementById('calPanelTitle');
  if (!panel || !body) return;
  _calPanelOpen = true;
  if (overlay) overlay.classList.remove('hidden');
  panel.classList.add('open');
  title.textContent = 'Cargando...';
  body.innerHTML = '<div class="loading-state">Cargando detalle...</div>';
  try {
    var e = await API._rawReq('GET', '/api/calendar/events/' + id);
    if (!e) { body.innerHTML = '<div class="error-state">Evento no encontrado</div>'; return; }
    title.textContent = e.title;
    var statusLabels = { pendiente: 'Pendiente', confirmado: 'Confirmado', completado: 'Completado', cancelado: 'Cancelado', reprogramado: 'Reprogramado' };
    var priorityLabels = { baja: 'Baja', media: 'Media', alta: 'Alta', urgente: 'Urgente' };
    var priorityColors = { baja: 'var(--admin-text-muted)', media: '#eab308', alta: 'var(--admin-accent)', urgente: 'var(--admin-danger)' };
    var time = e.start_at ? e.start_at.substring(11, 16) : '';
    var endTime = e.end_at ? e.end_at.substring(11, 16) : '';
    var date = e.start_at ? e.start_at.substring(0, 10) : '';

    var h = '';
    h += '<div class="cal-panel-section">';
    h += '<div class="cal-panel-header-row">';
    h += '<span class="admin-status-badge status-' + e.status + '">' + (statusLabels[e.status] || e.status) + '</span>';
    h += '<span class="cal-panel-type">' + getEventTypeLabel(e.event_type) + '</span>';
    h += '<span class="cal-panel-priority" style="color:' + (priorityColors[e.priority] || 'var(--admin-text-muted)') + '">' + (priorityLabels[e.priority] || e.priority) + '</span>';
    h += '</div>';
    h += '<div class="cal-panel-info">';
    if (e.client_name) h += '<div class="cal-panel-field"><span class="cal-panel-label">Cliente</span><span class="cal-panel-value">' + esc(e.client_name) + '</span></div>';
    if (e.client_phone) h += '<div class="cal-panel-field"><span class="cal-panel-label">Teléfono</span><span class="cal-panel-value">' + esc(e.client_phone) + '</span></div>';
    h += '<div class="cal-panel-field"><span class="cal-panel-label">Fecha</span><span class="cal-panel-value">' + date + '</span></div>';
    h += '<div class="cal-panel-field"><span class="cal-panel-label">Hora</span><span class="cal-panel-value">' + time + (endTime ? ' - ' + endTime : '') + '</span></div>';
    if (e.location) h += '<div class="cal-panel-field"><span class="cal-panel-label">Ubicación</span><span class="cal-panel-value">' + esc(e.location) + '</span></div>';
    if (e.agent_name) h += '<div class="cal-panel-field"><span class="cal-panel-label">Agente</span><span class="cal-panel-value">' + esc(e.agent_name) + '</span></div>';
    if (e.property_title) h += '<div class="cal-panel-field"><span class="cal-panel-label">Propiedad</span><span class="cal-panel-value">' + esc(e.property_title) + '</span></div>';
    if (e.lead_name) h += '<div class="cal-panel-field"><span class="cal-panel-label">Lead</span><span class="cal-panel-value">' + esc(e.lead_name) + '</span></div>';
    h += '</div></div>';

    if (e.description) {
      h += '<div class="cal-panel-section">';
      h += '<div class="cal-panel-section-title">Descripción</div>';
      h += '<div class="cal-panel-desc">' + esc(e.description) + '</div>';
      h += '</div>';
    }

    h += '<div class="cal-panel-section">';
    h += '<div class="cal-panel-section-title">Acciones</div>';
    h += '<div class="cal-actions">';
    if (e.status !== 'completado') h += '<button class="btn btn-primary btn-sm" onclick="calAction(' + e.id + ',\'complete\')">✓ Completar</button>';
    if (e.status !== 'cancelado') h += '<button class="btn btn-ghost btn-sm" onclick="calAction(' + e.id + ',\'cancel\')">✕ Cancelar</button>';
    h += '<button class="btn btn-ghost btn-sm" onclick="calAction(' + e.id + ',\'reschedule\')">↻ Reprogramar</button>';
    h += '<button class="btn btn-ghost btn-sm" onclick="calEditEvent(' + e.id + ')">✎ Editar</button>';
    h += '<button class="btn btn-ghost btn-sm cal-btn-danger" onclick="calDeleteEvent(' + e.id + ')">🗑 Eliminar</button>';
    h += '</div></div>';

    // Comments
    h += '<div class="cal-panel-section">';
    h += '<div class="cal-panel-section-title">Comentarios</div>';
    if (e.comments && e.comments.length) {
      e.comments.forEach(function(c) {
        var initial = (c.created_by_name || '?')[0];
        h += '<div class="cal-comment-item"><div class="cal-comment-avatar">' + initial + '</div><div class="cal-comment-content">';
        h += '<div class="cal-comment-header"><span class="cal-comment-author">' + esc(c.created_by_name || 'Sistema') + '</span><span class="cal-comment-time">' + (c.created_at ? c.created_at.substring(0, 16).replace('T', ' ') : '') + '</span></div>';
        h += '<div class="cal-comment-text">' + esc(c.content) + '</div></div></div>';
      });
    }
    h += '<div class="cal-comment-input-area">';
    h += '<input type="text" class="field-input" id="calNewComment" placeholder="Escribí un comentario..." />';
    h += '<button class="btn btn-primary btn-sm" onclick="calAddComment(' + e.id + ')">Enviar</button>';
    h += '</div></div>';

    body.innerHTML = h;
  } catch (err) {
    body.innerHTML = '<div class="error-state">Error: ' + err.message + '</div>';
  }
}
window.openCalEvent = openCalEvent;

function closeCalPanel() {
  _calPanelOpen = false;
  var overlay = document.getElementById('calOverlay');
  var panel = document.getElementById('calPanel');
  if (overlay) overlay.classList.add('hidden');
  if (panel) panel.classList.remove('open');
}
window.closeCalPanel = closeCalPanel;

/* ── Actions ── */
async function calAction(id, action) {
  var data = { action: action };
  if (action === 'reschedule') {
    var newDate = prompt('Nueva fecha (YYYY-MM-DD HH:MM):');
    if (!newDate) return;
    data.start_at = newDate;
  }
  try {
    await API._rawReq('POST', '/api/calendar/events/' + id + '/action', data);
    toast('Evento actualizado', 'success');
    openCalEvent(id);
    renderCalendarView();
    var activeTab = document.querySelector('.cal-subtab.active[data-cal-tab]');
    if (activeTab) loadCalendarActivity(activeTab.getAttribute('data-cal-tab'));
    loadCalendarKpi();
  } catch (e) { toast(e.message, 'error'); }
}
window.calAction = calAction;

async function calAddComment(eventId) {
  var input = document.getElementById('calNewComment');
  if (!input || !input.value.trim()) return;
  try {
    await API._rawReq('POST', '/api/calendar/events/' + eventId + '/comments', { content: input.value.trim() });
    input.value = '';
    openCalEvent(eventId);
  } catch (e) { toast(e.message, 'error'); }
}
window.calAddComment = calAddComment;

async function calDeleteEvent(id) {
  if (!await confirmModal('¿Eliminar este evento permanentemente?')) return;
  try {
    await API._rawReq('DELETE', '/api/calendar/events/' + id);
    toast('Evento eliminado', 'success');
    closeCalPanel();
    renderCalendarView();
    loadCalendarKpi();
    var activeTab = document.querySelector('.cal-subtab.active[data-cal-tab]');
    if (activeTab) loadCalendarActivity(activeTab.getAttribute('data-cal-tab'));
  } catch (e) { toast(e.message, 'error'); }
}
window.calDeleteEvent = calDeleteEvent;

function calEditEvent(id) {
  closeCalPanel();
  var e = _calEvents.find(function(x) { return x.id === id; });
  if (!e) { toast('Evento no encontrado', 'error'); return; }
  openCalEventForm(e);
}
window.calEditEvent = calEditEvent;

/* ── Event Form ── */
function openCalEventForm(event) {
  var modal = document.getElementById('calEventFormModal');
  var content = document.getElementById('calEventFormContent');
  var title = document.getElementById('calEventFormTitle');
  if (!modal || !content) return;
  var isEdit = !!event;
  title.textContent = isEdit ? 'Editar evento' : 'Nuevo evento';
  var e = event || {};
  var start = e.start_at ? e.start_at.substring(0, 16) : '';
  var end = e.end_at ? e.end_at.substring(0, 16) : '';
  var typeOptions = ['visita', 'reunion', 'llamada', 'tasacion', 'recordatorio', 'tarea', 'evento'].map(function(t) {
    return '<option value="' + t + '"' + (e.event_type === t ? ' selected' : '') + '>' + getEventTypeLabel(t) + '</option>';
  }).join('');
  content.innerHTML =
    '<div class="pf-body">' +
    '<div class="field"><label class="field-label">Título *</label><input id="calFormTitle" class="field-input" value="' + esc(e.title || '') + '"/></div>' +
    '<div class="field"><label class="field-label">Tipo</label><select id="calFormType" class="field-input field-input--select">' + typeOptions + '</select></div>' +
    '<div class="cal-form-grid">' +
    '<div class="field"><label class="field-label">Inicio *</label><input id="calFormStart" type="datetime-local" class="field-input" value="' + start + '"/></div>' +
    '<div class="field"><label class="field-label">Fin</label><input id="calFormEnd" type="datetime-local" class="field-input" value="' + end + '"/></div>' +
    '</div>' +
    '<div class="field"><label class="field-label">Cliente</label><input id="calFormClient" class="field-input" value="' + esc(e.client_name || '') + '"/></div>' +
    '<div class="field"><label class="field-label">Teléfono</label><input id="calFormPhone" class="field-input" value="' + esc(e.client_phone || '') + '"/></div>' +
    '<div class="field"><label class="field-label">Ubicación</label><input id="calFormLocation" class="field-input" value="' + esc(e.location || '') + '"/></div>' +
    '<div class="cal-form-grid">' +
    '<div class="field"><label class="field-label">Prioridad</label><select id="calFormPriority" class="field-input field-input--select">' +
    ['baja','media','alta','urgente'].map(function(p) { return '<option value="' + p + '"' + (e.priority === p ? ' selected' : '') + '>' + p.charAt(0).toUpperCase() + p.slice(1) + '</option>'; }).join('') +
    '</select></div>' +
    '<div class="field"><label class="field-label">Estado</label><select id="calFormStatus" class="field-input field-input--select">' +
    ['pendiente','confirmado','completado','cancelado'].map(function(s) { return '<option value="' + s + '"' + (e.status === s ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>'; }).join('') +
    '</select></div></div>' +
    '<div class="field"><label class="field-label">Descripción</label><textarea id="calFormDesc" class="field-input cal-form-desc">' + esc(e.description || '') + '</textarea></div>' +
    '<div class="cal-form-actions">' +
    '<button class="btn btn-primary btn-full" id="saveCalEventBtn">' + (isEdit ? 'Guardar cambios' : 'Crear evento') + '</button>' +
    '<button class="btn btn-ghost" onclick="document.getElementById(\'calEventFormModal\').classList.add(\'hidden\')">Cancelar</button></div></div>';
  modal.classList.remove('hidden');
  document.getElementById('saveCalEventBtn').onclick = function() {
    var titleVal = document.getElementById('calFormTitle').value.trim();
    if (!titleVal) { toast('El título es requerido', 'warn'); return; }
    var startVal = document.getElementById('calFormStart').value;
    if (!startVal) { toast('La fecha de inicio es requerida', 'warn'); return; }
    var body = {
      title: titleVal,
      event_type: document.getElementById('calFormType').value,
      start_at: new Date(startVal).toISOString(),
      end_at: document.getElementById('calFormEnd').value ? new Date(document.getElementById('calFormEnd').value).toISOString() : null,
      client_name: document.getElementById('calFormClient').value,
      client_phone: document.getElementById('calFormPhone').value,
      location: document.getElementById('calFormLocation').value,
      priority: document.getElementById('calFormPriority').value,
      status: document.getElementById('calFormStatus').value,
      description: document.getElementById('calFormDesc').value,
    };
    var method = isEdit ? 'PUT' : 'POST';
    var url = isEdit ? '/api/calendar/events/' + e.id : '/api/calendar/events';
    API._rawReq(method, url, body).then(function() {
      modal.classList.add('hidden');
      toast(isEdit ? 'Evento actualizado' : 'Evento creado', 'success');
      renderCalendarView();
      loadCalendarKpi();
      var activeTab = document.querySelector('.cal-subtab.active[data-cal-tab]');
      if (activeTab) loadCalendarActivity(activeTab.getAttribute('data-cal-tab'));
    }).catch(function(err) { toast(err.message, 'error'); });
  };
}
window.openCalEventForm = openCalEventForm;

/* ── Keyboard navigation for role="button" day cells ── */
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  var target = e.target.closest('[role="button"]');
  if (!target) return;
  e.preventDefault();
  target.click();
});

/* ── Subtab Switching ── */
document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-cal-tab]');
  if (!el) return;
  document.querySelectorAll('.cal-subtab').forEach(function(b) { b.classList.remove('active'); });
  el.classList.add('active');
  var view = el.getAttribute('data-cal-tab');
  loadCalendarActivity(view);
});

document.addEventListener('click', function(e) {
  var el = e.target.closest('#newCalEventBtn');
  if (!el) return;
  openCalEventForm(null);
});

document.addEventListener('click', function(e) {
  var el = e.target.closest('#closeCalEventForm, #closeCalPanel');
  if (!el) return;
  if (el.id === 'closeCalPanel') { closeCalPanel(); return; }
  el.closest('.modal-backdrop').classList.add('hidden');
});

/* ── Expose globals ── */
window.openCalEventForm = openCalEventForm;
window.closeCalPanel = closeCalPanel;
