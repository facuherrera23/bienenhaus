/**
 * admin-tasaciones.js — Tasaciones: Análisis Comparativo de Mercado
 */

let _tasaciones = [];
let _currentTasacion = null;
let _tasacionPage = 1;
let _tasacionPages = 1;
let _tasacionTotal = 0;

function _sel(id, val, opts) {
  const v = val ?? '';
  const oh = opts.map(o => `<option value="${o[0]}"${v === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('');
  return id ? `<select id="${id}" class="field-input field-input--select">${oh}</select>` : oh;
}

function _tf(v) { return v ?? ''; }
function _n(v) { return v ?? 0; }
function _fmtUSD(n) { const v = Number(n); return v ? `USD ${v.toLocaleString('es-AR', {minimumFractionDigits:2})}` : '\u2014'; }
function stDev(arr) { const m = arr.reduce((a,b) => a+b, 0) / arr.length; return Math.sqrt(arr.reduce((s, v) => s + (v-m)**2, 0) / (arr.length-1)); }
function _fmtARS(n) { const v = Number(n); return v ? `ARS ${v.toLocaleString('es-AR', {minimumFractionDigits:2})}` : '\u2014'; }
function _fmtUVA(n) { const v = Number(n); return v ? `${v.toLocaleString('es-AR', {minimumFractionDigits:2})} UVAs` : '\u2014'; }
function round(v, d) { const p = Math.pow(10, d || 0); return Math.round(v * p) / p; }

const TAS_ESTADO_MAP = {borrador:'Borrador', en_proceso:'En proceso', completada:'Completada', archivada:'Archivada'};
const TAS_ESTADO_CLS = {borrador:'status-oculta', en_proceso:'status-disponible', completada:'status-vendida', archivada:'status-oculta'};
const TAS_TIPO_PROPS = [['casa','Casa'],['departamento','Departamento'],['ph','PH'],['local','Local'],['oficina','Oficina'],['terreno','Terreno']];
const TAS_DESTINOS = [['venta','Venta'],['locacion','Locaci\u00f3n'],['garantia','Garant\u00eda'],['seguro','Seguro']];

function esc(v) { return String(v ?? '').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const TAS_COMP_ATTRS = ['comp_antiguedad','comp_estacionamiento','comp_habitaciones',
                        'comp_ubicacion','comp_estado_mantenimiento','comp_comodidades',
                        'comp_orientacion','comp_vistas','comp_nivel_piso'];
const TAS_AUTO_ATTRS = ['comp_antiguedad','comp_estacionamiento','comp_habitaciones'];

const TAS_TYPE_ATTR_MAP = {
  casa: [
    ['comp_antiguedad', 'Antigüedad', 0.07, true],
    ['comp_estado_mantenimiento', 'Estado de mantenimiento', 0.05, false],
    ['comp_estacionamiento', 'Estacionamiento', 0.03, true],
    ['comp_ubicacion', 'Calidad de ubicación', 0.07, false],
    ['comp_comodidades', 'Comodidades', 0.04, false],
    ['comp_habitaciones', 'Cantidad de habitaciones', 0.04, true],
  ],
  ph: [
    ['comp_antiguedad', 'Antigüedad', 0.07, true],
    ['comp_estado_mantenimiento', 'Estado de mantenimiento', 0.05, false],
    ['comp_estacionamiento', 'Estacionamiento', 0.03, true],
    ['comp_ubicacion', 'Calidad de ubicación', 0.07, false],
    ['comp_comodidades', 'Comodidades', 0.04, false],
    ['comp_habitaciones', 'Cantidad de habitaciones', 0.04, true],
  ],
  departamento: [
    ['comp_nivel_piso', 'Ubicación planta', 0.05, false],
    ['comp_vistas', 'Ubicación piso', 0.03, false],
    ['comp_antiguedad', 'Antigüedad', 0.06, true],
    ['comp_ubicacion', 'Calidad de ubicación', 0.07, false],
    ['comp_comodidades', 'Comodidades', 0.04, false],
    ['comp_habitaciones', 'Cantidad de habitaciones', 0.05, true],
  ],
  terreno: [
    ['comp_comodidades', 'Servicios', 0.05, false],
    ['comp_vistas', 'Acceso', 0.04, false],
    ['comp_habitaciones', 'Superficie', 0.06, true],
    ['comp_ubicacion', 'Calidad de ubicación', 0.07, false],
    ['comp_orientacion', 'Forma', 0.04, false],
    ['comp_antiguedad', 'Orientación', 0.04, false],
  ],
  local: [
    ['comp_ubicacion', 'Ubicación / Visibilidad', 0.07, false],
    ['comp_estado_mantenimiento', 'Estado de mantenimiento', 0.05, false],
    ['comp_habitaciones', 'Superficie', 0.06, true],
    ['comp_vistas', 'Accesibilidad', 0.03, false],
    ['comp_comodidades', 'Comodidades / Instalaciones', 0.05, false],
    ['comp_estacionamiento', 'Estacionamiento', 0.04, true],
  ],
  oficina: [
    ['comp_ubicacion', 'Ubicación / Visibilidad', 0.07, false],
    ['comp_estado_mantenimiento', 'Estado de mantenimiento', 0.05, false],
    ['comp_habitaciones', 'Superficie', 0.06, true],
    ['comp_vistas', 'Accesibilidad', 0.03, false],
    ['comp_comodidades', 'Comodidades / Instalaciones', 0.05, false],
    ['comp_estacionamiento', 'Estacionamiento', 0.04, true],
  ],
};

function getTypeAttrs(tipo) {
  return TAS_TYPE_ATTR_MAP[tipo] || TAS_TYPE_ATTR_MAP.casa;
}

function getTypeLabels(tipo) {
  const attrs = getTypeAttrs(tipo);
  const map = {};
  attrs.forEach(a => { map[a[0]] = a[1]; });
  return map;
}

function getTypeFactors(tipo) {
  const attrs = getTypeAttrs(tipo);
  const map = {};
  attrs.forEach(a => { map[a[0]] = a[2]; });
  return map;
}

function getTypeAutoFields(tipo) {
  const attrs = getTypeAttrs(tipo);
  const set = {};
  attrs.forEach(a => { if (a[3]) set[a[0]] = true; });
  return set;
}

function getCurrentTasacionType() {
  return (_currentTasacion && _currentTasacion.tipo_propiedad) || 'casa';
}

function _calcCoef(c) {
  const coef = c.coeficiente_ajuste;
  if (coef != null) return coef;
  return 1.0;
}

function _ajustado(c) {
  const v = c.valor_m2_ajustado;
  if (v != null) return v;
  if (c.precio_por_m2 && c.coeficiente_ajuste) return round(c.precio_por_m2 * c.coeficiente_ajuste, 2);
  if (c.precio_usd && c.superficie_cubierta) return round(c.precio_usd / c.superficie_cubierta, 2);
  return null;
}

// ── LIST VIEW ────────────────────────────────────────────────────────

function renderTasaciones() {
  const list = $('tasacionesAdminList');
  if (!_tasaciones.length) {
    list.innerHTML = '<div class="loading-state">No hay tasaciones.</div>';
    return;
  }
  list.innerHTML = _tasaciones.map(a => {
    const cls = TAS_ESTADO_CLS[a.estado] || 'status-oculta';
    return `<div class="admin-message-item" data-id="${a.id}" style="cursor:pointer;${a.estado === 'archivada' ? 'opacity:0.6' : ''}">
      <div class="ap-flex-row-between">
        <div class="ap-flex-1-min">
          <div class="ap-flex-row-center-sm">
            <strong class="ap-btn-text-light">${esc(a.titulo || a.solicitante || '(sin título)')}</strong>
            <span class="admin-status-badge ${cls} ap-badge-sm">${TAS_ESTADO_MAP[a.estado] || a.estado}</span>
          </div>
          <div class="ap-label-small">
            ${a.solicitante ? `${esc(a.solicitante)} · ` : ''}
            ${a.tipo_propiedad ? esc(a.tipo_propiedad) + ' · ' : ''}
            ${a.barrio ? esc(a.barrio) + ' · ' : ''}
            ${a.superficie_cubierta ? a.superficie_cubierta + ' m²' : ''}
          </div>
          <div class="ap-label-dim">
            ${a.dormitorios ? a.dormitorios + ' dorm' : ''}${a.banios ? ' · ' + a.banios + ' baños' : ''}
          </div>
          ${a.valor_estimado_usd ? `<div class="ap-link-accent">${_fmtUSD(a.valor_estimado_usd)}</div>` : ''}
        </div>
        <div class="ap-flex-shrink-right">
          <div class="ap-value-small">${a.updated_at ? window.formatDateShort(a.updated_at) : ''}</div>
          <div class="ap-hint-text">${a.total_comparables || 0} comp.</div>
        </div>
      </div>
    </div>`;
  }).join('');
  list.insertAdjacentHTML('afterend', _renderPagination());
}

function _renderPagination() {
  if (_tasacionPages <= 1) return '';
  const prevDisabled = _tasacionPage <= 1;
  const nextDisabled = _tasacionPage >= _tasacionPages;
  return `<div class="admin-pagination ap-flex-row-divider">
    <button class="btn btn-ghost" onclick="changeTasacionPage(${_tasacionPage - 1})" ${prevDisabled ? 'disabled' : ''}>← Anterior</button>
    <span class="ap-body-text">Pág. ${_tasacionPage} de ${_tasacionPages} (${_tasacionTotal} total)</span>
    <button class="btn btn-ghost" onclick="changeTasacionPage(${_tasacionPage + 1})" ${nextDisabled ? 'disabled' : ''}>Siguiente →</button>
  </div>`;
}

async function changeTasacionPage(page) {
  if (page < 1 || page > _tasacionPages) return;
  _tasacionPage = page;
  await loadTasaciones();
}

document.addEventListener('click', e => {
  const item = e.target.closest('#tasacionesAdminList .admin-message-item[data-id]');
  if (item) openTasacionPanel(parseInt(item.dataset.id));
});

function filterTasaciones() {
  _tasacionPage = 1;
  loadTasaciones();
}

async function loadTasaciones() {
  const list = $('tasacionesAdminList');
  if (!list) return;
  list.innerHTML = '<div class="loading-state">Cargando tasaciones...</div>';
  try {
    const incluirArchivadas = $('tasacionShowArchived')?.checked || false;
    const estadoFiltro = $('tasacionFilter')?.value || '';
    const searchText = $('tasacionSearch')?.value?.trim() || '';
    const params = { page: _tasacionPage, per_page: 20 };
    if (incluirArchivadas) params.archivadas = '1';
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
    renderTasacionKpiBar(stats, $('tasKpiBar'));
    const sub = $('tasacionSubtitle');
    if (sub) {
      sub.textContent = `${stats.total} total · ${stats.borradores} borradores · ${stats.en_proceso} en proceso · ${stats.completadas} completadas · ${stats.archivadas} archivadas`;
    }
    $('sidebarTasacionesCount').textContent = stats.total;
  } catch (e) {
    list.innerHTML = '<div class="loading-state">Sin permisos para ver tasaciones.</div>';
  }
}

function showTasacionesList() {
  $('tasOverlay')?.classList.add('show');
  $('tasacionesListView').classList.remove('hidden');
  $('tasacionDetailView').classList.add('hidden');
  _currentTasacion = null;
  loadTasaciones();
}

// ── DETAIL VIEW ──────────────────────────────────────────────────────

async function openTasacionDetail(id) {
  console.log('[DEBUG TAS] openTasacionDetail called, id:', id);
  try {
    const a = await API.getTasacion(id);
    console.log('[DEBUG TAS] API response received, a?.id:', a?.id, 'a?.titulo:', a?.titulo);
    _currentTasacion = a;
    console.log('[DEBUG TAS] _currentTasacion SET, checking:', !!_currentTasacion, _currentTasacion?.id);
    _currentTasacion = null;
    $('tasOverlay')?.classList.remove('show');
    $('apprOverlay')?.classList.remove('show');
    $('tasacionesListView').classList.add('hidden');
    const dv = $('tasacionDetailView');
    dv.classList.remove('hidden');
    dv.innerHTML = renderTasacionDetail(a);
    dv.scrollTop = 0;
  } catch (e) {
    toast('Error al cargar tasación: ' + e.message, 'error');
  }
}

function renderTasacionDetail(a) {
  const isReadOnly = a.estado === 'completada' || a.estado === 'archivada';
  const hasComps = (a.comparables||[]).length > 1 && a.superficie_cubierta > 0;
  const isCompleted = a.estado === 'completada';
  const canDelete = _currentUser?.role === 'admin' || _currentUser?.role === 'editor';
  function roIcon() {
    return '<div class="acm-readonly-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>';
  }
  return `
    ${isReadOnly ? `
    <div class="acm-readonly-banner">
      ${roIcon()}
      <div class="ap-flex-1">
        <strong class="ap-error-emphasis">Modo lectura</strong>
        <p class="ap-label-inline">Esta tasación está ${a.estado === 'completada' ? 'completada' : 'archivada'}. Los datos son inmutables.</p>
      </div>
      ${isCompleted ? `<button class="btn btn-primary ap-btn-compact" id="tas_newVersionBtn">+ Nueva versión</button>` : ''}
    </div>` : ''}
    <div class="admin-topbar">
      <div>
        <button class="btn btn-ghost ap-stack-sm" id="backToTasacionesList">← Volver</button>
        <h1 class="admin-page-title">${esc(a.titulo || a.solicitante || 'Tasación #' + a.id)}</h1>
        <p class="admin-page-sub">${TAS_ESTADO_MAP[a.estado] || a.estado} · ${a.total_comparables || 0} comparables</p>
        ${a.appraisal_request_id
          ? `<p class="ap-link-underlined">
              Creada desde <a href="#" onclick="switchTab('tasacion-requests'); return false;" class="ap-link-hover">solicitud #${a.appraisal_request_id}</a>
            </p>`
          : ''}
      </div>
      <div class="ap-flex-wrap-sm">
        ${isReadOnly
          ? `<button class="btn btn-ghost" id="tas_restoreBtn" style="${a.estado === 'archivada' ? '' : 'display:none'}">Restaurar</button>
              <button class="btn btn-ghost" id="tas_reportBtn">PDF</button>
              <button class="btn btn-ghost" id="tas_exportCsvBtn">CSV</button>`
          : `<button class="btn btn-primary" id="tas_saveBtn">Guardar</button>
              ${hasComps && !isCompleted ? `<button class="btn btn-primary ap-surface-accent" id="tas_completarBtn">Guardar Valuación</button>` : ''}
              <button class="btn btn-ghost" id="tas_reportBtn">PDF</button>
              <button class="btn btn-ghost" id="tas_exportCsvBtn">CSV</button>
              <button class="btn btn-danger" id="tas_archiveBtn">Archivar</button>`}
        ${canDelete ? `<button class="btn btn-danger ap-delete-btn-bg" id="deleteTasacionBtn">Eliminar</button>` : ''}
      </div>
    </div>

    ${renderTasacionResults(a)}

    <div class="acm-pyramid">
      ${renderSection('Datos del cliente', [
        {label:'Título', id:'td_titulo', type:'text', val:a.titulo},
        {label:'Solicitante', id:'td_solicitante', type:'text', val:a.solicitante},
        {label:'Teléfono', id:'td_telefono', type:'text', val:a.telefono},
        {label:'Fecha', id:'td_fecha_tasacion', type:'date', val:a.fecha_tasacion},
        {label:'Destino', id:'td_destino', type:'select', val:a.destino, opts:TAS_DESTINOS},
        {label:'Estado', id:'td_estado', type:'select', val:a.estado, opts:[['borrador','Borrador'],['en_proceso','En proceso'],['completada','Completada']]},
      ], isReadOnly)}
      ${renderSection('Datos del inmueble', [
        {label:'Tipo', id:'td_tipo_propiedad', type:'select', val:a.tipo_propiedad, opts:TAS_TIPO_PROPS},
        {label:'Dirección', id:'td_direccion', type:'text', val:a.direccion},
        {label:'Barrio', id:'td_barrio', type:'text', val:a.barrio},
        {label:'Localidad', id:'td_localidad', type:'text', val:a.localidad},
        {label:'Provincia', id:'td_provincia', type:'text', val:a.provincia},
        {label:'Año constr.', id:'td_anio_construccion', type:'number', val:a.anio_construccion},
        {label:'Sup. terreno m²', id:'td_superficie_terreno', type:'number', val:a.superficie_terreno},
        {label:'Sup. cubierta m²', id:'td_superficie_cubierta', type:'number', val:a.superficie_cubierta},
        {label:'Dormitorios', id:'td_dormitorios', type:'number', val:a.dormitorios},
        {label:'Baños', id:'td_banios', type:'number', val:a.banios},
      ], isReadOnly)}
      ${renderSection('Construcción', [
        {label:'Tipo construcción', id:'td_tipo_construccion', type:'text', val:a.tipo_construccion},
        {label:'Tipo techo', id:'td_tipo_techo', type:'text', val:a.tipo_techo},
        {label:'Orientación', id:'td_orientacion', type:'text', val:a.orientacion},
        {label:'Luminosidad', id:'td_luminosidad', type:'select', val:a.luminosidad, opts:[['alta','Alta'],['media','Media'],['baja','Baja']]},
        {label:'Cal. constructiva', id:'td_calidad_constructiva', type:'select', val:a.calidad_constructiva, opts:[['alta','Alta'],['media','Media'],['baja','Baja']]},
        {label:'Cal. mantenimiento', id:'td_calidad_mantenimiento', type:'select', val:a.calidad_mantenimiento, opts:[['alta','Alta'],['media','Media'],['baja','Baja']]},
        {label:'Terminación', id:'td_detalles_terminacion', type:'select', val:a.detalles_terminacion, opts:[['alto','Alto'],['medio','Medio'],['bajo','Bajo']]},
        {label:'Estado conservación', id:'td_estado_conservacion', type:'select', val:a.estado_conservacion, opts:[['excelente','Excelente'],['bueno','Bueno'],['regular','Regular'],['malo','Malo']]},
        {label:'Estacionamiento', id:'td_estacionamiento', type:'text', val:a.estacionamiento},
        {label:'Calefacción', id:'td_calefaccion', type:'select', val:a.calefaccion, opts:[['central','Central'],['individual','Individual'],['','Sin']]},
        {label:'Agua caliente', id:'td_agua_caliente', type:'select', val:a.agua_caliente, opts:[['central','Central'],['individual','Individual'],['','Sin']]},
        {label:'Aire acond.', id:'td_aire_acondicionado', type:'select', val:a.aire_acondicionado, opts:[['central','Central'],['individual','Individual'],['','Sin']]},
        {label:'Vida remanente', id:'td_vida_remanente', type:'number', val:a.vida_remanente},
      ], isReadOnly)}
      ${renderSection('Referencias económicas', [
        {label:'T/C USD', id:'td_tipo_cambio_usd', type:'number', val:a.tipo_cambio_usd},
        {label:'Valor UVA', id:'td_valor_uva', type:'number', val:a.valor_uva},
        {label:'Imp. inmob. mensual', id:'td_impuesto_inmobiliario_mensual', type:'number', val:a.impuesto_inmobiliario_mensual},
      ], isReadOnly)}
      ${renderSection('Comodidades', [
        {label:'Cocina', id:'td_tiene_cocina', type:'checkbox', val:a.tiene_cocina},
        {label:'Comedor', id:'td_tiene_comedor', type:'checkbox', val:a.tiene_comedor},
        {label:'Living', id:'td_tiene_living', type:'checkbox', val:a.tiene_living},
        {label:'Patio', id:'td_tiene_patio', type:'checkbox', val:a.tiene_patio},
        {label:'Terraza', id:'td_tiene_terraza', type:'checkbox', val:a.tiene_terraza},
        {label:'Balcón', id:'td_tiene_balcon', type:'checkbox', val:a.tiene_balcon},
        {label:'Lavadero', id:'td_tiene_lavadero', type:'checkbox', val:a.tiene_lavadero},
        {label:'Escritorio', id:'td_tiene_escritorio', type:'checkbox', val:a.tiene_escritorio},
        {label:'Suite', id:'td_tiene_suite', type:'checkbox', val:a.tiene_suite},
        {label:'Play room', id:'td_tiene_playroom', type:'checkbox', val:a.tiene_playroom},
        {label:'Asador', id:'td_tiene_asador', type:'checkbox', val:a.tiene_asador},
        {label:'Piscina', id:'td_tiene_piscina', type:'checkbox', val:a.tiene_piscina},
        {label:'Garage', id:'td_tiene_garage', type:'checkbox', val:a.tiene_garage},
      ], isReadOnly)}
      ${renderSection('Servicios', [
        {label:'Electricidad pública', id:'td_tiene_electricidad_publica', type:'checkbox', val:a.tiene_electricidad_publica},
        {label:'Gas público', id:'td_tiene_gas_publico', type:'checkbox', val:a.tiene_gas_publico},
        {label:'Teléfono público', id:'td_tiene_telefono_publico', type:'checkbox', val:a.tiene_telefono_publico},
        {label:'Agua pública', id:'td_tiene_agua_publica', type:'checkbox', val:a.tiene_agua_publica},
        {label:'Cloaca pública', id:'td_tiene_cloaca_publica', type:'checkbox', val:a.tiene_cloaca_publica},
        {label:'Desagüe pluvial', id:'td_tiene_desague_pluvial', type:'checkbox', val:a.tiene_desague_pluvial},
      ], isReadOnly)}
      ${renderSection('Descripción del barrio', [
        {label:'Tipo barrio', id:'td_tipo_barrio', type:'select', val:a.tipo_barrio, opts:[['urbano','Urbano'],['suburbano','Suburbano'],['rural','Rural']]},
        {label:'Nivel construcción', id:'td_nivel_construccion', type:'select', val:a.nivel_construccion, opts:[['mas_75','Más del 75%'],['50_75','50-75%'],['25_50','25-50%'],['menos_25','Menos del 25%']]},
        {label:'Índice crecimiento', id:'td_indice_crecimiento', type:'select', val:a.indice_crecimiento, opts:[['en_crecimiento','En crecimiento'],['estable','Estable'],['en_declinacion','En declinación']]},
        {label:'Vigilancia', id:'td_vigilancia_barrio', type:'checkbox', val:a.vigilancia_barrio},
        {label:'Valores propiedad', id:'td_valores_propiedad', type:'select', val:a.valores_propiedad, opts:[['creciente','Creciente'],['estable','Estable'],['decreciente','Decreciente']]},
        {label:'Demanda / Oferta', id:'td_demanda_oferta', type:'select', val:a.demanda_oferta, opts:[['exceso_demanda','Exceso Demanda'],['equilibrio','Equilibrio'],['exceso_oferta','Exceso Oferta']]},
        {label:'Tiempo comercialización', id:'td_tiempo_comercializacion', type:'select', val:a.tiempo_comercializacion, opts:[['menos_3','Menos 3 meses'],['3_6','3 a 6 meses'],['mas_6','Más de 6 meses']]},
        {label:'% Residencial', id:'td_uso_residencial_pct', type:'number', val:a.uso_residencial_pct},
        {label:'% Comercial', id:'td_uso_comercial_pct', type:'number', val:a.uso_comercial_pct},
        {label:'% Industrial', id:'td_uso_industrial_pct', type:'number', val:a.uso_industrial_pct},
        {label:'Cambios uso terreno', id:'td_cambios_uso_terreno', type:'select', val:a.cambios_uso_terreno, opts:[['probable','Probable'],['improbable','Improbable']]},
        {label:'Facilidades estacionamiento', id:'td_facilidades_estacionamiento', type:'text', val:a.facilidades_estacionamiento},
        {label:'Tipologías predominantes', id:'td_tipologias_predominantes', type:'text', val:a.tipologias_predominantes},
        {label:'Calidad constructiva barrio', id:'td_calidad_constructiva_barrio', type:'select', val:a.calidad_constructiva_barrio, opts:[['alta','Alta'],['media','Media'],['baja','Baja']]},
        {label:'Construcción altura', id:'td_construccion_altura', type:'text', val:a.construccion_altura},
        {label:'Uso comercial desc.', id:'td_uso_comercial_descripcion', type:'text', val:a.uso_comercial_descripcion},
        {label:'Uso industrial desc.', id:'td_uso_industrial_descripcion', type:'text', val:a.uso_industrial_descripcion},
        {label:'Nivel socioeconómico', id:'td_nivel_socioeconomico', type:'select', val:a.nivel_socioeconomico, opts:[['alto','Alto'],['medio_alto','Medio Alto'],['medio','Medio'],['medio_bajo','Medio Bajo'],['bajo','Bajo']]},
      ], isReadOnly)}
      ${renderSection('Observaciones', [
        {label:'', id:'td_observaciones', type:'textarea', val:a.observaciones}
      ], isReadOnly)}
    </div>

    <!-- COMPARABLES -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="tas-sec-comparables">
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('tas-sec-comparables')">
        <h4 class="acm-pyramid-section-title">Comparables (${(a.comparables||[]).length})</h4>
        <span class="acm-pyramid-section-toggle">▼</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div class="ap-actions-bar-right">
          ${isReadOnly ? '' : `<button class="btn btn-primary" id="tas_addComparableBtn">+ Agregar comparable</button>`}
        </div>
        <div id="tasComparables">${renderTasacionComparableCards(a)}</div>
      </div>
    </div>

    <!-- MAPA -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="tas-sec-ubicacion">
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('tas-sec-ubicacion')">
        <h4 class="acm-pyramid-section-title">Ubicación</h4>
        <span class="acm-pyramid-section-toggle">▼</span>
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
        <span class="acm-pyramid-section-toggle">▼</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div id="tasacionVersionsContainer" class="ap-stack-xl"><div class="loading-state ap-text-base">Cargando...</div></div>
      </div>
    </div>

    <!-- HISTORIAL -->
    <div class="acm-pyramid-section ap-stack-lg" data-section="tas-sec-historial">
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('tas-sec-historial')">
        <h4 class="acm-pyramid-section-title">Historial de cambios</h4>
        <span class="acm-pyramid-section-toggle">▼</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div id="tasacionLogsContainer" class="ap-stack-xl"><div class="loading-state ap-text-base">Cargando...</div></div>
      </div>
    </div>
  `;
}

// ── Mapa ACM ──────────────────────────────────────────────────────────

let _tasMapInstance = null;
let _tasMapMarkers = [];

function _tasIcon(color, size) {
  return {
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [size, size], iconAnchor: [size/2, size/2], className: '',
  };
}

function _tasPopupContent(c) {
  return `<div class="ap-text-block">
    <div class="ap-warning-label">C${c.numero}</div>
    <div class="ap-text-dark">${esc(c.direccion || 'Sin dirección')}</div>
    <hr class="ap-divider-light">
    <table class="ap-input-full">
      <tr><td class="ap-text-medium">Precio</td><td class="ap-label-right">USD ${c.precio_usd ? c.precio_usd.toLocaleString('es-AR') : '-'}</td></tr>
      ${c.sup_cubierta ? `<tr><td class="ap-text-medium">Sup. cubierta</td><td class="ap-text-right">${c.sup_cubierta} m²</td></tr>` : ''}
      ${c.precio_por_m2 ? `<tr><td class="ap-text-medium">Precio/m²</td><td class="ap-text-right">USD ${Number(c.precio_por_m2).toLocaleString('es-AR')}</td></tr>` : ''}
      ${c.coeficiente_ajuste ? `<tr><td class="ap-text-medium">Coef. ajuste</td><td class="ap-text-right">${c.coeficiente_ajuste}</td></tr>` : ''}
      ${c.valor_m2_ajustado ? `<tr><td class="ap-text-medium">Valor/m² ajust.</td><td class="ap-brand-right">USD ${Number(c.valor_m2_ajustado).toLocaleString('es-AR')}</td></tr>` : ''}
      ${c.valor_ajustado ? `<tr><td class="ap-text-medium">Valor ajustado</td><td class="ap-brand-right">USD ${Number(c.valor_ajustado).toLocaleString('es-AR')}</td></tr>` : ''}
    </table>
  </div>`;
}

function _tasSubjectPopup(a) {
  return `<div class="ap-text-block">
    <div class="ap-brand-label">${esc(a.titulo || 'Inmueble tasado')}</div>
    <div class="ap-text-dark">${esc(a.direccion || '')}</div>
    <hr class="ap-divider-light">
    <table class="ap-input-full">
      ${a.superficie_cubierta ? `<tr><td class="ap-text-medium">Sup. cubierta</td><td class="ap-text-right">${a.superficie_cubierta} m²</td></tr>` : ''}
      ${a.tipo_propiedad ? `<tr><td class="ap-text-medium">Tipo</td><td class="ap-text-right">${a.tipo_propiedad}</td></tr>` : ''}
      ${a.valor_estimado_usd ? `<tr><td class="ap-text-medium">Valor estimado</td><td class="ap-brand-right">USD ${a.valor_estimado_usd.toLocaleString('es-AR')}</td></tr>` : ''}
      ${a.precio_m2_promedio ? `<tr><td class="ap-text-medium">Precio/m² prom.</td><td class="ap-text-right">USD ${Number(a.precio_m2_promedio).toLocaleString('es-AR')}</td></tr>` : ''}
    </table>
  </div>`;
}

async function _tasInitMap(ctr) {
  const L = await loadLeaflet();
  const mapEl = document.createElement('div');
  mapEl.style.cssText = 'width:100%;height:350px;border-radius:6px';
  ctr.innerHTML = '';
  ctr.appendChild(mapEl);
  await new Promise(r => setTimeout(r, 0));
  const map = L.map(mapEl, { center: [-31.4201, -64.1888], zoom: 12, zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>', maxZoom: 18,
  }).addTo(map);
  return map;
}

function _tasRenderMap(data) {
  const L = window.L;
  if (!L) return;
  const markers = [];
  const bounds = [];

  if (data.appraisal.lat && data.appraisal.lng) {
    const icon = L.divIcon(_tasIcon('#20b8ab', 22));
    const m = L.marker([data.appraisal.lat, data.appraisal.lng], { icon })
      .addTo(_tasMapInstance)
      .bindPopup(_tasSubjectPopup(data.appraisal));
    markers.push(m);
    bounds.push([data.appraisal.lat, data.appraisal.lng]);
  }

  (data.comparables || []).forEach(c => {
    if (!c.lat || !c.lng) return;
    const icon = L.divIcon(_tasIcon('#e67e22', 16));
    const m = L.marker([c.lat, c.lng], { icon })
      .addTo(_tasMapInstance)
      .bindPopup(_tasPopupContent(c));
    markers.push(m);
    bounds.push([c.lat, c.lng]);
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
  const ctr = $('tasMapContainer');
  if (!ctr) return;
  try {
    const data = await _req('GET', `/api/tasaciones/${aid}/map-data`);
    const hasCoords = (data.appraisal.lat && data.appraisal.lng) ||
      (data.comparables || []).some(c => c.lat && c.lng);

    if (!hasCoords) {
      ctr.innerHTML = '<div class="ap-empty-state-lg">No hay ubicaciones disponibles para visualizar.<br><span class="ap-text-sm">Completá las direcciones de la tasación y los comparables.</span></div>';
      _tasMapInstance = null;
      return;
    }

    if (_tasMapInstance) {
      _tasMapMarkers.forEach(m => _tasMapInstance.removeLayer(m));
      _tasMapInstance.remove();
      _tasMapInstance = null;
    }
    _tasMapInstance = await _tasInitMap(ctr);
    _tasRenderMap(data);
  } catch (e) {
    ctr.innerHTML = '<div class="ap-empty-state-lg">Error al cargar mapa: ' + esc(e.message || '') + '</div>';
    _tasMapInstance = null;
  }
}

async function refreshTasacionMap(aid) {
  if (!_tasMapInstance) { loadTasacionMap(aid); return; }
  try {
    const data = await _req('GET', `/api/tasaciones/${aid}/map-data`);
    _tasMapMarkers.forEach(m => _tasMapInstance.removeLayer(m));
    _tasRenderMap(data);
  } catch { /* silent */ }
}

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Leaflet load failed'));
    document.head.appendChild(script);
  });
}

function togglePyramidSection(id) {
  const sec = document.querySelector(`[data-section="${id}"]`);
  if (sec) sec.classList.toggle('collapsed');
}

function renderSection(title, fields, disabled) {
  const id = 'tas-sec-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const isCheckbox = fields.length > 0 && fields.every(f => f.type === 'checkbox');
  if (isCheckbox) {
    const checkedCount = fields.filter(f => f.val).length;
    const countLabel = checkedCount > 0 ? ` <span class="ap-metric-number">(${checkedCount})</span>` : '';
    const rows = fields.map(f => {
      const chk = f.val ? 'checked' : '';
      const dis = disabled ? 'disabled' : '';
      const cls = `acm-chip${disabled ? ' acm-chip--disabled' : ''}`;
      return `<label class="${cls}">
        <input type="checkbox" class="acm-chip-input" id="${f.id}" ${chk} ${dis}>
        <span class="acm-chip-visual">
          <span class="acm-chip-box">
            <svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span class="acm-chip-text">${f.label}</span>
        </span>
      </label>`;
    }).join('');
    return `<div class="acm-pyramid-section" data-section="${id}">
      <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('${id}')">
        <h4 class="acm-pyramid-section-title">${title}${countLabel}</h4>
        <span class="acm-pyramid-section-toggle">▼</span>
      </button>
      <div class="acm-pyramid-section-body">
        <div class="acm-pyramid-checkbox-grid">${rows}</div>
      </div>
    </div>`;
  }
  const rows = fields.map(f => {
    if (f.type === 'textarea') {
      return `<div class="field acm-pyramid-full"><label class="field-label">${f.label}</label>
        <textarea id="${f.id}" class="field-input" rows="3" ${disabled ? 'disabled' : ''}>${esc(f.val || '')}</textarea></div>`;
    }
    if (f.type === 'checkbox') {
      const chk = f.val ? 'checked' : '';
      const dis = disabled ? 'disabled' : '';
      const cls = `acm-chip${disabled ? ' acm-chip--disabled' : ''}`;
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
    if (f.type === 'select') {
      return `<div class="field"><label class="field-label">${f.label}</label>
        <select id="${f.id}" class="field-input field-input--select" ${disabled ? 'disabled' : ''}>${_sel('', f.val, f.opts)}</select></div>`;
    }
    return `<div class="field"><label class="field-label">${f.label}</label>
      <input id="${f.id}" class="field-input" type="${f.type}" value="${_tf(f.val)}" ${disabled ? 'disabled' : ''} ${f.type === 'number' ? 'step="any"' : ''}/></div>`;
  }).join('');
  return `<div class="acm-pyramid-section" data-section="${id}">
    <button type="button" class="acm-pyramid-section-header" onclick="togglePyramidSection('${id}')">
      <h4 class="acm-pyramid-section-title">${title}</h4>
      <span class="acm-pyramid-section-toggle">▼</span>
    </button>
    <div class="acm-pyramid-section-body">
      <div class="acm-pyramid-grid">${rows}</div>
    </div>
  </div>`;
}

function renderBarChart(comps) {
  const ajustados = [];
  const labels = [];
  comps.forEach(c => {
    const ajustado = _ajustado(c);
    if (ajustado !== null) { ajustados.push(ajustado); labels.push('C' + c.numero); }
  });
  if (!ajustados.length) return '';
  const maxVal = Math.max(...ajustados);
  const prom = ajustados.reduce((a,b) => a+b, 0) / ajustados.length;
  return `<div class="ap-detail-card">
    <div class="ap-overline">$/m² ajustado por comparable</div>
    ${ajustados.map((v, i) =>
      `<div class="ap-flex-row-tag">
        <span class="ap-icon-col">${labels[i]}</span>
        <div class="ap-progress-track">
          <div style="height:100%;width:${(v/maxVal*100).toFixed(0)}%;background:${v === prom ? 'var(--admin-primary)' : v > prom ? 'rgba(32,184,171,0.6)' : 'rgba(32,184,171,0.3)'};border-radius:3px"></div>
        </div>
        <span class="ap-number-col">${_fmtUSD(v)}</span>
      </div>`
    ).join('')}
  </div>`;
}

function renderTasacionResults(a) {
  const hasVal = a.valor_estimado_usd != null;
  const comps = a.comparables || [];
  return `<div id="tasResults" class="ap-hero-card">
    <h4 class="ap-section-label">Resultados de la valuación</h4>
    ${hasVal ? `
    <div class="ap-two-col-grid">
      <div class="ap-auto-grid">
        <div><div class="ap-label-muted">Valor Estimado</div>
          <div class="ap-value-xl">${_fmtUSD(a.valor_estimado_usd)}</div></div>
        <div><div class="ap-label-muted">En Pesos</div>
          <div class="ap-value-lg">${_fmtARS(a.valor_estimado_ars)}</div></div>
        <div><div class="ap-label-muted">En UVAs</div>
          <div class="ap-value-lg">${_fmtUVA(a.valor_estimado_uvas)}</div></div>
        <div><div class="ap-label-muted">Precio/m² prom.</div>
          <div class="ap-value-lg">${_fmtUSD(a.precio_m2_promedio)}</div></div>
        <div><div class="ap-label-muted">Rango m²</div>
          <div class="ap-value-md">${_fmtUSD(a.precio_m2_minimo)} – ${_fmtUSD(a.precio_m2_maximo)}</div></div>
        <div><div class="ap-label-muted">Dispersión</div>
          <div class="ap-value-lg">${a.dispersion_pct != null ? a.dispersion_pct + '%' : '—'}</div></div>
        <div><div class="ap-label-muted">Coef. promedio</div>
          <div class="ap-value-lg">${a.coeficiente_promedio || '—'}</div></div>
        <div><div class="ap-label-muted">Comparables</div>
          <div class="ap-value-lg">${a.total_comparables || 0}</div></div>
      </div>
      ${renderBarChart(comps)}
    </div>` : `
    <div class="ap-empty-row">
      Cargá comparables y superficie cubierta para ver la valuación.
    </div>`}
  </div>`;
}

function renderTasacionComparableCards(a) {
  return renderComparableCardsShared(a, { prefix: 'tas-', getTipoFn: getCurrentTasacionType });
}

document.addEventListener('click', e => {
  const tasTab = $('tabTasaciones');
  if (!tasTab || tasTab.classList.contains('hidden')) return;
  const editBtn = e.target.closest('.tas-editComparableBtn');
  if (editBtn) openTasacionComparableForm(parseInt(editBtn.dataset.aid), parseInt(editBtn.dataset.cid));
  const delBtn = e.target.closest('.tas-deleteComparableBtn');
  if (delBtn) confirmDeleteTasacionComparable(parseInt(delBtn.dataset.aid), parseInt(delBtn.dataset.cid));
  const toggleBtn = e.target.closest('.tas-toggleExclusionBtn');
  if (toggleBtn) toggleTasacionComparableExclusion(parseInt(toggleBtn.dataset.aid), parseInt(toggleBtn.dataset.cid));
});

// ── LIVE RECALC ──────────────────────────────────────────────────────

function _tasRecalcLive() {
  const a = _currentTasacion;
  if (!a) return;
  const cont = $('tasResults');
  if (!cont) return;

  const sc = parseFloat($('td_superficie_cubierta')?.value) || 0;
  const tc = parseFloat($('td_tipo_cambio_usd')?.value) || 1;
  const uva = parseFloat($('td_valor_uva')?.value) || 1;
  const comps = a.comparables || [];

  if (!comps.length || !sc) {
    cont.innerHTML = '<h4 class="ap-section-overline">Resultados de la valuación</h4><div class="ap-empty-row-light">Cargá comparables y superficie cubierta para ver la valuación.</div>';
    return;
  }

  const ajustados = [];
  const coefs = [];
  const labels = [];
  comps.forEach(c => {
    const coef = _calcCoef(c);
    const ajustado = _ajustado(c);
    if (ajustado !== null) {
      ajustados.push(ajustado);
      coefs.push(coef);
      labels.push('C' + c.numero);
    }
  });

  if (!ajustados.length) {
    cont.innerHTML = '<h4 class="ap-section-overline">Resultados de la valuación</h4><div class="ap-empty-row-light">Completá precio y superficie en los comparables.</div>';
    return;
  }

  const prom = ajustados.reduce((a,b) => a+b, 0) / ajustados.length;
  const mini = Math.min(...ajustados);
  const maxi = Math.max(...ajustados);
  const dispersion = ajustados.length > 1 && prom ? Math.round(stDev(ajustados) / prom * 1000) / 10 : 0;
  const coef_prom = Math.round(coefs.reduce((a,b) => a+b, 0) / coefs.length * 10000) / 10000;
  const valor_usd = Math.round(sc * prom * 100) / 100;
  const valor_ars = Math.round(valor_usd * tc * 100) / 100;
  const valor_uvas = Math.round(valor_ars / uva * 100) / 100;

  const maxVal = Math.max(...ajustados);
  const barChart = ajustados.map((v, i) =>
    `<div class="ap-flex-row-tag">
      <span class="ap-icon-col-muted">${labels[i]}</span>
      <div class="ap-progress-fill">
        <div style="height:100%;width:${(v/maxVal*100).toFixed(0)}%;background:${v === prom ? 'var(--accent)' : v > prom ? 'rgba(32,184,171,0.6)' : 'rgba(32,184,171,0.3)'};border-radius:3px;transition:width .3s"></div>
      </div>
      <span class="ap-number-col-muted">${_fmtUSD(v)}</span>
    </div>`
  ).join('');

  cont.innerHTML = `
    <div class="ap-flex-row-between-md">
      <h4 class="ap-overline-accent">Resultados de la valuación</h4>
    </div>
    <div class="ap-two-col-grid">
      <div class="ap-auto-grid">
        <div><div class="ap-text-muted-light">Valor Estimado</div>
          <div class="ap-value-xl-light">${_fmtUSD(valor_usd)}</div></div>
        <div><div class="ap-text-muted-light">En Pesos</div>
          <div class="ap-value-lg-light">${_fmtARS(valor_ars)}</div></div>
        <div><div class="ap-text-muted-light">En UVAs</div>
          <div class="ap-value-lg-light">${_fmtUVA(valor_uvas)}</div></div>
        <div><div class="ap-text-muted-light">Precio/m² prom.</div>
          <div class="ap-value-lg-light">${_fmtUSD(prom)}</div></div>
        <div><div class="ap-text-muted-light">Rango m²</div>
          <div class="ap-value-md-light">${_fmtUSD(mini)} – ${_fmtUSD(maxi)}</div></div>
        <div><div class="ap-text-muted-light">Dispersión</div>
          <div class="ap-value-lg-light">${dispersion}%</div></div>
        <div><div class="ap-text-muted-light">Coef. promedio</div>
          <div class="ap-value-lg-light">${coef_prom}</div></div>
        <div><div class="ap-text-muted-light">Comparables</div>
          <div class="ap-value-lg-light">${comps.length}</div></div>
      </div>
      <div class="ap-info-card">
        <div class="ap-overline-card">$/m² ajustado por comparable</div>
        ${barChart}
      </div>
    </div>`;
}

// ── SAVE / ARCHIVE / RESTORE / REPORT ────────────────────────────────

async function saveTasacionDetail(id) {
  const prefix = 'td_';
  const fields = document.querySelectorAll('#tasacionDetailView [id]');
  const data = {};
  fields.forEach(el => {
    if (!el.id.startsWith(prefix)) return;
    const key = el.id.slice(prefix.length);
    if (el.type === 'checkbox') {
      data[key] = el.checked;
    } else if (el.type === 'number') {
      data[key] = el.value !== '' ? parseFloat(el.value) : null;
    } else {
      data[key] = el.value;
    }
  });
  try {
    const saved = await API.updateTasacion(id, data);
    _currentTasacion = saved;
    const dv = $('tasacionDetailView');
    dv.innerHTML = renderTasacionDetail(saved);
    dv.scrollTop = 0;
    loadTasaciones();
  } catch (e) { toast('Error al guardar: ' + e.message, 'error'); }
}

async function archiveTasacion(id) {
  if (!await confirmModal('¿Archivar esta tasación? Se puede restaurar después.')) return;
  try {
    await API.archiveTasacion(id);
    showTasacionesList();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteTasacion(id) {
  if (!await confirmModal('¿Eliminar esta tasación DEFINITIVAMENTE? No se puede deshacer.')) return;
  try {
    await API.deleteTasacion(id);
    showTasacionesList();
  } catch (e) { toast(e.message, 'error'); }
}

async function restoreTasacion(id) {
  if (!await confirmModal('¿Restaurar esta tasación?')) return;
  try {
    const saved = await API.restoreTasacion(id);
    _currentTasacion = saved;
    const dv = $('tasacionDetailView');
    dv.innerHTML = renderTasacionDetail(saved);
    loadTasaciones();
  } catch (e) { toast(e.message, 'error'); }
}

function openTasacionReport(id) {
  window.open(`/api/tasaciones/${id}/report`, '_blank');
}

function exportTasacionCsv(id) {
  window.open(`/api/tasaciones/${id}/csv`, '_blank');
}

// ── HISTORIAL ────────────────────────────────────────────────────────

async function loadTasacionLogs(aid) {
  const container = $('tasacionLogsContainer');
  if (!container) return;
  try {
    const logs = await API.getTasacionLogs(aid);
    if (!logs.length) {
      container.innerHTML = '<div class="ap-empty-card-sm">Sin cambios registrados.</div>';
      return;
    }
    container.innerHTML = '<div class="ap-scroll-area">' + logs.map(l =>
      `<div class="ap-table-row">
        <span class="ap-label-nowrap">${l.created_at ? new Date(l.created_at).toLocaleString() : ''}</span>
        <span class="admin-status-badge status-oculta ap-badge-tiny">${l.accion}</span>
        <span class="ap-text-secondary">${esc(l.descripcion)}</span>
      </div>`
    ).join('') + '</div>';
  } catch (e) {
    container.innerHTML = '<div class="ap-label-dim-sm">Error al cargar historial.</div>';
  }
}

async function loadTasacionVersions(aid) {
  const container = $('tasacionVersionsContainer');
  if (!container) return;
  try {
    const versions = await API.getTasacionVersions(aid);
    if (!versions.length) {
      container.innerHTML = '<div class="ap-empty-card-sm">Sin versiones guardadas.</div>';
      return;
    }
    container.innerHTML = versions.map((v, i) =>
      `<div class="ap-flex-row-list-item">
        <span class="admin-status-badge status-vendida ap-badge-compact">v${v.version}</span>
        <span class="ap-text-fill">${v.created_at ? new Date(v.created_at).toLocaleString() : ''}</span>
        <span class="ap-label-dim">${v.created_by || '—'}</span>
        <span class="ap-label-dim">${v.has_snapshot ? '✓ Snapshot' : '—'}</span>
        <button class="btn btn-ghost btn-sm viewVersionBtn ap-badge-compact" data-version="${v.version}">Ver</button>
        ${i < versions.length - 1 ? `<button class="btn btn-ghost btn-sm diffVersionBtn ap-badge-compact" data-va="${versions[i+1].version}" data-vb="${v.version}" title="Comparar con v${versions[i+1].version}">⇄</button>` : ''}
      </div>`
    ).join('');
    container.querySelectorAll('.viewVersionBtn').forEach(btn => {
      btn.addEventListener('click', () => viewTasacionVersion(parseInt(btn.dataset.version)));
    });
    container.querySelectorAll('.diffVersionBtn').forEach(btn => {
      btn.addEventListener('click', () => compareTasacionVersions(parseInt(btn.dataset.va), parseInt(btn.dataset.vb)));
    });
  } catch (e) {
    container.innerHTML = '<div class="ap-label-dim-sm">Error al cargar versiones.</div>';
  }
}

async function createNewTasacionVersion(aid) {
  if (!confirm('¿Crear una nueva versión? La tasación se desbloqueará para edición.')) return;
  try {
    await API.createNewTasacionVersion(aid);
    toast('Nueva versión creada. Tasación desbloqueada.', 'success');
    openTasacionDetail(aid);
  } catch (e) {
    toast('Error al crear versión: ' + e.message, 'error');
  }
}

async function viewTasacionVersion(version) {
  const a = _currentTasacion;
  if (!a) return;
  try {
    const data = await API.getTasacionVersion(a.id, version);
    const s = data.snapshot;
    if (!s) { toast('Snapshot no disponible', 'error'); return; }
    const html = `
    <div class="ap-section-card">
      <div class="ap-flex-row-between-md">
        <h4 class="ap-btn-text-emphasis">Versión v${version} · ${s.generated_at ? new Date(s.generated_at).toLocaleString() : ''}</h4>
        <button class="btn btn-ghost btn-sm ap-text-sm" id="closeVersionPreview">Cerrar</button>
      </div>
      <div class="ap-two-col-grid-md">
        <div class="ap-chip-card">
          <div class="ap-overline-tight">Sujeto</div>
          <div class="ap-label-soft">${esc(s.appraisal?.direccion || s.appraisal?.solicitante || '—')}</div>
          <div class="ap-label-soft">Sup. cubierta: ${s.appraisal?.superficie_cubierta || '—'} m²</div>
          <div class="ap-label-soft">T/C: USD ${s.appraisal?.tipo_cambio_usd || '—'} · UVA: ${s.appraisal?.valor_uva || '—'}</div>
        </div>
        <div class="ap-chip-card">
          <div class="ap-overline-tight">Resultados</div>
          <div class="ap-link-accent-sm">Valor estimado: USD ${(s.appraisal?.valor_estimado_usd || 0).toLocaleString('es-AR')}</div>
          <div class="ap-label-soft">Precio/m² prom.: USD ${Number(s.appraisal?.precio_m2_promedio || 0).toLocaleString('es-AR')}</div>
          <div class="ap-label-soft">Coef. promedio: ${s.appraisal?.coeficiente_promedio || '—'}</div>
        </div>
      </div>
      <div class="ap-stack-top-base">
        <div class="ap-overline-section">Comparables (${(s.comparables||[]).length})</div>
        ${(s.comparables||[]).map(c =>
          `<div class="ap-tag-row">
            <span class="ap-btn-text-white">C${c.numero}</span>
            <span class="ap-text-secondary">${esc(c.calle||'')} ${esc(c.numero_calle||'')}</span>
            <span class="ap-text-accent">USD ${(c.precio_usd||0).toLocaleString('es-AR')}</span>
            <span class="ap-text-dim">${c.superficie_cubierta || '—'} m²</span>
            <span class="ap-text-soft">Coef: ${c.coeficiente_ajuste || '—'}</span>
            <span class="ap-text-soft">Ajust: USD ${(c.valor_m2_ajustado || 0).toLocaleString('es-AR')}/m²</span>
          </div>`
        ).join('')}
      </div>
    </div>`;
    const container = $('tasacionVersionsContainer');
    container.insertAdjacentHTML('beforebegin', html);
    $('closeVersionPreview')?.addEventListener('click', () => {
      const el = container.previousElementSibling;
      if (el && el.id !== 'tasacionVersionsContainer') el.remove();
    });
  } catch (e) {
    toast('Error al cargar versión: ' + e.message, 'error');
  }
}

async function compareTasacionVersions(va, vb) {
  const a = _currentTasacion;
  if (!a) return;
  try {
    const data = await _req('GET', `/api/tasaciones/${a.id}/versions/${va}/compare/${vb}`);
    const changes = data.appraisal_changes || [];
    const compChanges = data.comparable_changes || [];
    if (!changes.length && !compChanges.length) {
      toast('No hay diferencias entre estas versiones.', 'info');
      return;
    }
    const fieldLabels = {
      valor_estimado_usd: 'Valor estimado USD', titulo: 'Título',
      direccion: 'Dirección', tipo_propiedad: 'Tipo propiedad',
      superficie_cubierta: 'Sup. cubierta', precio_m2_promedio: '$/m² prom.',
      coeficiente_promedio: 'Coef. promedio', dispersion_pct: 'Dispersión',
      tipo_cambio_usd: 'T/C USD', valor_uva: 'UVA',
      solicitante: 'Solicitante', destino: 'Destino',
    };
    const fmt = v => v == null ? '—' : typeof v === 'number' && v > 100 ? v.toLocaleString('es-AR') : String(v);
    let html = `<div class="ap-section-card">
      <div class="ap-flex-row-between-md">
        <h4 class="ap-btn-text-emphasis">Diff v${va} → v${vb}</h4>
        <button class="btn btn-ghost btn-sm ap-text-sm" id="closeVersionDiff">Cerrar</button>
      </div>`;
    if (changes.length) {
      html += `<div class="ap-stack-base">
        <div class="ap-overline-section">Cambios en la tasación</div>
        <table class="ap-table-full">
          <tr class="ap-overline-tiny">
            <th class="ap-table-cell-left">Campo</th>
            <th class="ap-table-cell-left">v${va}</th>
            <th class="ap-table-cell-left">v${vb}</th>
          </tr>
          ${changes.map(c => `<tr>
            <td class="ap-table-cell-muted">${fieldLabels[c.field] || c.field}</td>
            <td class="ap-table-cell-dim">${fmt(c.from)}</td>
            <td class="ap-table-cell-accent">${fmt(c.to)}</td>
          </tr>`).join('')}
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
          ${compChanges.map(c => {
            const isAdd = c.field === '__added__';
            const isDel = c.field === '__removed__';
            return `<tr style="${isAdd ? 'background:rgba(39,174,96,0.08)' : isDel ? 'background:rgba(231,76,60,0.08)' : ''}">
              <td class="ap-table-cell-bold">C${c.numero}</td>
              <td class="ap-table-cell-soft">${isAdd ? '➕ Agregado' : isDel ? '➖ Eliminado' : c.field}</td>
              <td class="ap-table-cell-dim">${fmt(c.from)}</td>
              <td style="padding:4px 8px;border-bottom:1px solid var(--bg2);color:${isAdd ? 'var(--accent)' : isDel ? '#e74c3c' : 'var(--accent)'}">${fmt(c.to)}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>`;
    }
    html += '</div>';
    const container = $('tasacionVersionsContainer');
    container.insertAdjacentHTML('beforebegin', html);
    $('closeVersionDiff')?.addEventListener('click', () => {
      const el = container.previousElementSibling;
      if (el && el.id !== 'tasacionVersionsContainer') el.remove();
    });
  } catch (e) { toast('Error al comparar versiones: ' + e.message, 'error'); }
}

// ── MODAL: Nueva tasación rápida ─────────────────────────────────────

function openTasacionForm(id) {
  $('tasacionFormTitle').textContent = 'Nueva tasación';
  $('tasacionFormContent').innerHTML = `
    <div class="pf-body ap-flex-col">
      <div class="ap-two-col-grid-sm">
        <div class="field ap-full-width"><label class="field-label">Título / Referencia</label>
          <input id="tqf_titulo" class="field-input" placeholder="Ej: BARRIO YAPEYU"/></div>
      </div>
      <div class="ap-two-col-grid-sm">
        <div class="field"><label class="field-label">Solicitante</label>
          <input id="tqf_solicitante" class="field-input" placeholder="Nombre del cliente"/></div>
        <div class="field"><label class="field-label">Teléfono</label>
          <input id="tqf_telefono" class="field-input" placeholder="Teléfono"/></div>
      </div>
      <div class="ap-two-col-grid-sm">
        <div class="field"><label class="field-label">Tipo propiedad</label>
          <select id="tqf_tipo_propiedad" class="field-input field-input--select">${_sel('', 'casa', TAS_TIPO_PROPS)}</select></div>
        <div class="field"><label class="field-label">Dirección</label>
          <input id="tqf_direccion" class="field-input" placeholder="Calle y número"/></div>
      </div>
      <div class="ap-two-col-grid-sm">
        <div class="field"><label class="field-label">Barrio</label>
          <input id="tqf_barrio" class="field-input" placeholder="Barrio"/></div>
        <div class="field"><label class="field-label">Destino</label>
          <select id="tqf_destino" class="field-input field-input--select">${_sel('', 'venta', TAS_DESTINOS)}</select></div>
      </div>
      <div class="pf-actions ap-stack-top-sm">
        <button class="btn btn-primary btn-full" id="quickSaveBtn">Crear tasación</button>
        <button class="btn btn-ghost" id="tqfCancelBtn" type="button">Cancelar</button>
      </div>
    </div>`;
  $('tasacionFormModal').classList.remove('hidden');
  $('quickSaveBtn').onclick = () => quickSaveTasacion();
  $('tqfCancelBtn').onclick = closeTasacionForm;
}

function closeTasacionForm() {
  $('tasacionFormModal').classList.add('hidden');
}

async function quickSaveTasacion() {
  const data = {
    titulo: $('tqf_titulo').value.trim(),
    solicitante: $('tqf_solicitante').value.trim(),
    telefono: $('tqf_telefono').value.trim(),
    tipo_propiedad: $('tqf_tipo_propiedad').value,
    direccion: $('tqf_direccion').value.trim(),
    barrio: $('tqf_barrio').value.trim(),
    destino: $('tqf_destino').value,
    estado: 'borrador',
  };
  if (!data.titulo && !data.solicitante) { toast('Ingresá al menos un título o un solicitante.', 'warn'); return; }
  try {
    const saved = await API.createTasacion(data);
    closeTasacionForm();
    openTasacionDetail(saved.id);
    loadTasaciones();
  } catch (e) { toast(e.message, 'error'); }
}

// ── MODAL: Comparable ────────────────────────────────────────────────

function openTasacionComparableForm(aid, cid) {
  console.log('[DEBUG TAS] openTasacionComparableForm called, aid:', aid, 'cid:', cid);
  console.log('[DEBUG TAS] _currentTasacion value:', !!_currentTasacion, _currentTasacion?.id);
  const a = _currentTasacion;
  if (!a) {
    toast?.('No se pudo cargar la tasación. Recargá la página e intentá de nuevo.');
    return;
  }
  const c = cid ? (a?.comparables||[]).find(x => x.id === cid) : null;
  $('comparableFormTitle').textContent = c ? 'Editar comparable C' + c.numero : 'Nuevo comparable';
  const v = (field, def) => c != null ? (c[field] ?? def ?? '') : (def ?? '');
  const vn = (field, def) => c != null ? (c[field] ?? def ?? 0) : (def ?? 0);
  const sel = (field, opts) => _sel('', v(field), opts);
  const attrLabel = (val) => val === 'superior' ? '↑ Superior' : val === 'inferior' ? '↓ Inferior' : '= Equivalente';

  const btnStyle = (val, current, field) =>
    `style="background:${val === current ? (val === 'superior' ? 'var(--accent)' : val === 'inferior' ? '#e74c3c' : 'var(--admin-bg)') : 'transparent'};color:${val === current ? '#fff' : 'var(--g3)'};border:1px solid ${val === current ? 'transparent' : 'var(--b)'};border-radius:4px;padding:3px 8px;font-size:10px;font-weight:${val === current ? '600' : '400'};cursor:pointer;transition:all .15s" data-field="${field}" data-value="${val}"`;

  const manualToggle = (field, label) => {
    const val = v(field, 'equivalente');
    return `<div class="ap-compact-card">
      <div class="ap-label-with-space">${label}</div>
      <div class="ap-flex-row-tight attr-toggle" data-field="${field}">
        <button type="button" ${btnStyle('superior', val, field)}>↑ Superior</button>
        <button type="button" ${btnStyle('equivalente', val, field)}>= Equivalente</button>
        <button type="button" ${btnStyle('inferior', val, field)}>↓ Inferior</button>
      </div>
      <select id="cf_${field}" class="field-input field-input--select ap-hidden">${[['superior','Superior'],['equivalente','Equivalente'],['inferior','Inferior']].map(o => `<option value="${o[0]}"${val === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select>
    </div>`;
  };

  const autoBadge = (id, label) => {
    const val = v(id, 'equivalente');
    const icon = val === 'superior' ? '↑' : val === 'inferior' ? '↓' : '=';
    const clr = val === 'superior' ? 'var(--accent)' : val === 'inferior' ? '#e74c3c' : 'var(--g3)';
    return `<div class="ap-compact-card-center">
      <div class="ap-label-compact">${label}</div>
      <div style="font-size:13px;font-weight:700;color:${clr}">${icon} ${val === 'superior' ? 'Superior' : val === 'inferior' ? 'Inferior' : 'Equivalente'}</div>
      <div class="ap-hint-tiny">automático</div>
    </div>`;
  };

  const tipo = a.tipo_propiedad || 'casa';
  const attrs = getTypeAttrs(tipo);

  $('comparableFormContent').innerHTML = `
    <div class="pf-body ap-two-col-grid-wide">
      <div class="field ap-full-width"><label class="field-label">Calle</label>
        <input id="cf_calle" class="field-input" value="${esc(v('calle'))}" placeholder="Calle"/></div>
      <div class="field"><label class="field-label">Número</label>
        <input id="cf_numero_calle" class="field-input" value="${esc(v('numero_calle'))}"/></div>
      <div class="field"><label class="field-label">Piso / Depto</label>
        <input id="cf_piso_depto" class="field-input" value="${esc(v('piso_depto'))}"/></div>
      <div class="field"><label class="field-label">Barrio</label>
        <input id="cf_barrio" class="field-input" value="${esc(v('barrio'))}"/></div>
      <div class="field"><label class="field-label">Localidad</label>
        <input id="cf_localidad" class="field-input" value="${esc(v('localidad'))}"/></div>
      <div class="field"><label class="field-label">Tipo operación</label>
        <select id="cf_tipo_operacion" class="field-input field-input--select">${sel('tipo_operacion', [['cotizacion','Cotización'],['venta','Venta']])}</select></div>
      <div class="field"><label class="field-label">Precio USD</label>
        <input id="cf_precio_usd" class="field-input" type="number" value="${v('precio_usd',0)}"/></div>
      <div class="field"><label class="field-label">Precio ARS</label>
        <input id="cf_precio_ars" class="field-input" type="number" value="${v('precio_ars',0)}"/></div>
      <div class="field"><label class="field-label">Sup. cubierta m²</label>
        <input id="cf_superficie_cubierta" class="field-input" type="number" value="${v('superficie_cubierta',0)}"/></div>
      <div class="field"><label class="field-label">Sup. terreno m²</label>
        <input id="cf_superficie_terreno" class="field-input" type="number" value="${v('superficie_terreno',0)}"/></div>
      <div class="field"><label class="field-label">Dormitorios</label>
        <input id="cf_dormitorios" class="field-input" type="number" value="${vn('dormitorios',0)}"/></div>
      <div class="field"><label class="field-label">Baños</label>
        <input id="cf_banios" class="field-input" type="number" value="${vn('banios',0)}" step="0.5"/></div>
      <div class="field"><label class="field-label">Tipo propiedad</label>
        <select id="cf_tipo_propiedad" class="field-input field-input--select">${sel('tipo_propiedad', TAS_TIPO_PROPS)}</select></div>
      <div class="field"><label class="field-label">Año constr.</label>
        <input id="cf_anio_construccion" class="field-input" type="number" value="${v('anio_construccion',0)}"/></div>
      <div class="field"><label class="field-label">Garage</label>
        <label class="acm-chip">
          <input type="checkbox" class="acm-chip-input" id="cf_tiene_garage" ${vn('tiene_garage',false) ? 'checked' : ''}>
          <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Tiene garage</span></span>
        </label></div>

      <div class="ap-divider-wide"></div>

      <div class="ap-full-width">
        <div class="ap-flex-row-gap-sm">
          <h4 class="ap-overline-strong">Atributos comparativos</h4>
          <span class="ap-badge-muted">${esc(tipo)}</span>
        </div>
        <div class="ap-three-col-grid">
          ${attrs.map(attr => attr[3] ? autoBadge(attr[0], attr[1]) : manualToggle(attr[0], attr[1])).join('')}
        </div>
      </div>

      <div class="ap-divider-narrow"></div>

      <div class="field"><label class="field-label">Días en mercado</label>
        <input id="cf_dias_en_mercado" class="field-input" type="number" value="${v('dias_en_mercado',0)}"/></div>
      <div class="field"><label class="field-label">Inmobiliaria</label>
        <input id="cf_inmobiliaria" class="field-input" value="${esc(v('inmobiliaria'))}"/></div>
      <div class="field"><label class="field-label">Tel. inmobiliaria</label>
        <input id="cf_telefono_inmobiliaria" class="field-input" value="${esc(v('telefono_inmobiliaria'))}"/></div>
      <div class="field ap-full-width"><label class="field-label">Link fuente</label>
        <div class="ap-flex-row-sm">
          <input id="cf_link_fuente" class="field-input ap-flex-1" value="${esc(v('link_fuente'))}" placeholder="https://mercadolibre.com.ar/..." />
          <button class="btn btn-primary ap-btn-nowrap" id="extraerURLBtn" ${c ? 'disabled' : ''}>Extraer</button>
        </div>
        <div id="extraerStatus" class="ap-hint-sm"></div></div>

      <div class="field ap-full-width"><label class="field-label">Observaciones</label>
        <textarea id="cf_observaciones" class="field-input" rows="3">${esc(v('observaciones'))}</textarea></div>

      <div id="homologPreview" class="ap-expandable-section">
        <div class="ap-overline-section-sm">Vista previa de homologación</div>
        <div class="ap-three-col-grid">
          <div class="ap-chip-card-center">
            <div class="ap-overline-micro">Coeficiente</div>
            <div id="hpCoef" class="ap-value-md-emphasis">—</div>
          </div>
          <div class="ap-chip-card-center">
            <div class="ap-overline-micro">$/m² ajustado</div>
            <div id="hpM2" class="ap-value-md-accent">—</div>
          </div>
          <div class="ap-chip-card-center">
            <div class="ap-overline-micro">Valor ajustado</div>
            <div id="hpTotal" class="ap-value-md-accent">—</div>
          </div>
        </div>
      </div>

      <div class="pf-actions ap-full-width">
        <button class="btn btn-primary btn-full" id="saveComparableBtn">${c ? 'Guardar cambios' : 'Agregar comparable'}</button>
        <button class="btn btn-ghost" id="cfCancelBtn" type="button">Cancelar</button>
      </div>
    </div>`;
  $('comparableFormModal').classList.remove('hidden');
  $('saveComparableBtn').onclick = () => saveTasacionComparableForm(aid, cid);
  $('extraerURLBtn').onclick = () => extraerDesdeURL(aid, cid);
  setTimeout(() => {
    $('cfCancelBtn')?.addEventListener('click', closeTasacionComparableForm);
    $('closeComparableBtn')?.addEventListener('click', closeTasacionComparableForm);
  }, 0);
  _bindTasacionComparableFormPreview(aid, cid);
  _tasPreviewHomologacion(aid);

  const modal = $('comparableFormModal');
  modal.querySelectorAll('.attr-toggle').forEach(container => {
    container.addEventListener('click', e => {
      const btn = e.target.closest('button[data-field]');
      if (!btn) return;
      const field = btn.dataset.field;
      const value = btn.dataset.value;
      const sel = container.querySelector('select');
      if (sel) sel.value = value;
      container.querySelectorAll('button').forEach(b => {
        const isActive = b.dataset.value === value;
        Object.assign(b.style, {
          background: isActive ? (value === 'superior' ? 'var(--accent)' : value === 'inferior' ? '#e74c3c' : 'var(--admin-bg)') : 'transparent',
          color: isActive ? '#fff' : 'var(--g3)',
          borderColor: isActive ? 'transparent' : 'var(--b)',
          fontWeight: isActive ? '600' : '400',
        });
      });
      _tasPreviewHomologacion(aid);
    });
  });
}

async function extraerDesdeURL(aid, cid) {
  const url = $('cf_link_fuente')?.value?.trim();
  if (!url) { toast('Pegá una URL primero.', 'warn'); return; }
  const status = $('extraerStatus');
  status.innerHTML = '<span class="ap-text-soft">Extrayendo datos...</span>';
    $('extraerURLBtn').disabled = true;
  function setVal(id, val) { const el = $(id); if (el && val != null) el.value = val; }
  function setNum(id, val) { const el = $(id); if (el && val != null) el.value = val; }
  function setCheck(id, val) { const el = $(id); if (el) el.checked = !!val; }
  try {
    const data = await API.extraerURLTasacion(url);
    if (!data || !Object.keys(data).length) {
      status.innerHTML = '<span class="ap-error-text">No se pudieron extraer datos de esta URL.</span>';
      return;
    }
    if (data._error) {
      if (data.link_fuente) setVal('cf_link_fuente', data.link_fuente);
      status.innerHTML = `<span class="ap-warning-text">⚠ ${esc(data._error)}</span>`;
      return;
    }

    setVal('cf_calle', data.calle);
    setVal('cf_numero_calle', data.numero_calle);
    setVal('cf_barrio', data.barrio);
    setVal('cf_localidad', data.localidad);
    setVal('cf_piso_depto', data.piso_depto);
    setNum('cf_precio_usd', data.precio_usd);
    setNum('cf_precio_ars', data.precio_ars);
    setNum('cf_superficie_cubierta', data.superficie_cubierta);
    setNum('cf_superficie_terreno', data.superficie_terreno);
    setNum('cf_dormitorios', data.dormitorios);
    setNum('cf_banios', data.banios);
    setNum('cf_anio_construccion', data.anio_construccion);
    setCheck('cf_tiene_garage', data.tiene_garage);
    setVal('cf_tipo_operacion', data.tipo_operacion || 'cotizacion');
    if (data.link_fuente) setVal('cf_link_fuente', data.link_fuente);
    if (data.inmobiliaria) setVal('cf_inmobiliaria', data.inmobiliaria);
    if (data.tipo_propiedad) setVal('cf_tipo_propiedad', data.tipo_propiedad);

    const count = Object.keys(data).filter(k => data[k] != null && data[k] !== '' && data[k] !== 0 && data[k] !== false).length;
    status.innerHTML = `<span class="ap-text-accent">✓ ${count} campos extraídos correctamente.</span>`;
  } catch (e) {
    status.innerHTML = '<span class="ap-error-text"></span>'; status.firstChild.textContent = 'Error: ' + (e.message || '');
  } finally {
    $('extraerURLBtn').disabled = false;
  }
}

function closeTasacionComparableForm() {
  $('comparableFormModal').classList.add('hidden');
}

function _gatherTasacionComparableData() {
  const g = id => $(id)?.value ?? '';
  const gn = id => { const v = parseFloat($(id)?.value); return isNaN(v) ? null : v; };
  const gi = id => { const v = parseInt($(id)?.value); return isNaN(v) ? null : v; };
  const gc = id => ($(id)?.value ?? 'equivalente');
  const gb = id => $(id)?.checked || false;
  const data = {
    calle: g('cf_calle'), numero_calle: g('cf_numero_calle'), piso_depto: g('cf_piso_depto'),
    barrio: g('cf_barrio'), localidad: g('cf_localidad'),
    tipo_operacion: g('cf_tipo_operacion'), precio_usd: gn('cf_precio_usd'), precio_ars: gn('cf_precio_ars'),
    superficie_cubierta: gn('cf_superficie_cubierta'), superficie_terreno: gn('cf_superficie_terreno'),
    dormitorios: gi('cf_dormitorios'), banios: gn('cf_banios'),
    tiene_garage: gb('cf_tiene_garage'),
    tipo_propiedad: g('cf_tipo_propiedad'), anio_construccion: gi('cf_anio_construccion'),
    dias_en_mercado: gi('cf_dias_en_mercado'), inmobiliaria: g('cf_inmobiliaria'),
    telefono_inmobiliaria: g('cf_telefono_inmobiliaria'), link_fuente: g('cf_link_fuente'),
    observaciones: g('cf_observaciones'),
  };
  const tipo = getCurrentTasacionType();
  const attrs = getTypeAttrs(tipo);
  attrs.forEach(a => { data[a[0]] = gc('cf_' + a[0]); });
  return data;
}

let _tasPreviewTimer = null;

function _tasPreviewHomologacion(aid) {
  if (_tasPreviewTimer) clearTimeout(_tasPreviewTimer);
  _tasPreviewTimer = setTimeout(async () => {
    const data = _gatherTasacionComparableData();
    if (!data.precio_usd || !data.superficie_cubierta) {
      $('homologPreview').style.display = 'none';
      return;
    }
    try {
      const result = await API.previewTasacionComparable(aid, data);
      $('homologPreview').style.display = '';
      $('hpCoef').textContent = result.coeficiente_ajuste != null ? result.coeficiente_ajuste.toFixed(4) : '—';
      $('hpM2').textContent = result.valor_m2_ajustado != null ? '$ ' + result.valor_m2_ajustado.toFixed(2) : '—';
      $('hpTotal').textContent = result.valor_ajustado != null ? '$ ' + result.valor_ajustado.toFixed(2) : '—';
    } catch (e) {
      $('homologPreview').style.display = 'none';
    }
  }, 300);
}

function _bindTasacionComparableFormPreview(aid, cid) {
  const triggers = ['cf_precio_usd', 'cf_superficie_cubierta', 'cf_anio_construccion',
    'cf_dormitorios', 'cf_tiene_garage', 'cf_precio_ars'];
  const tipo = getCurrentTasacionType();
  getTypeAttrs(tipo).forEach(a => { triggers.push('cf_' + a[0]); });
  triggers.forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('change', () => _tasPreviewHomologacion(aid));
    if (el && el.type === 'number') el.addEventListener('input', () => _tasPreviewHomologacion(aid));
  });
}

async function _tasRefreshDetail(aid) {
  const updated = await API.getTasacion(aid);
  _currentTasacion = updated;
  const compContainer = $('tasComparables');
  if (compContainer) compContainer.innerHTML = renderTasacionComparableCards(updated);
  const resultsContainer = $('tasResults');
  if (resultsContainer) resultsContainer.outerHTML = renderTasacionResults(updated);
  const heading = $('tasComparablesCount');
  if (heading) heading.textContent = `Comparables (${(updated.comparables||[]).length})`;
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
  } catch (e) { toast(e.message, 'error'); }
}

async function confirmDeleteTasacionComparable(aid, cid) {
  if (!await confirmModal('¿Eliminar este comparable?')) return;
  try {
    await API.deleteTasacionComparable(aid, cid);
    await _tasRefreshDetail(aid);
    refreshTasacionMap(aid);
  } catch (e) { toast(e.message, 'error'); }
}

async function toggleTasacionComparableExclusion(aid, cid) {
  if (!await confirmModal('¿Cambiar exclusión de este comparable?')) return;
  try {
    const data = await _req('PATCH', `/api/tasaciones/${aid}/comparables/${cid}/toggle-exclusion`);
    await _tasRefreshDetail(aid);
    refreshTasacionMap(aid);
    toast(data.excluido ? 'Comparable excluido del cálculo' : 'Comparable incluido', 'info');
  } catch (e) { toast(e.message, 'error'); }
}

async function completarTasacion(aid) {
  if (!await confirmModal('¿Finalizar la valuación? Se cambiará el estado a Completada.')) return;
  try {
    const saved = await API.completarTasacion(aid);
    _currentTasacion = saved;
    $('tasacionDetailView').innerHTML = renderTasacionDetail(saved);
    loadTasaciones();
    toast('Valuación completada', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

// ── BIND DETAIL BUTTONS ──────────────────────────────────────────────

function _bindTasacionDetail(aid) {
  console.log('[DEBUG TAS] _bindTasacionDetail called, aid:', aid);
  console.log('[DEBUG TAS] checking _currentTasacion in bind:', !!_currentTasacion, _currentTasacion?.id);
  $('tas_saveBtn')?.addEventListener('click', () => saveTasacionDetail(aid));
  $('tas_completarBtn')?.addEventListener('click', () => completarTasacion(aid));
  $('tas_restoreBtn')?.addEventListener('click', () => restoreTasacion(aid));
  $('tas_reportBtn')?.addEventListener('click', () => window.generarPDFReporte(aid, 'tasacion'));
  $('tas_exportCsvBtn')?.addEventListener('click', () => exportTasacionCsv(aid));
  $('tas_archiveBtn')?.addEventListener('click', () => archiveTasacion(aid));
  $('deleteTasacionBtn')?.addEventListener('click', () => deleteTasacion(aid));
  $('tas_addComparableBtn')?.addEventListener('click', () => openTasacionComparableForm(aid, null));
  $('tas_newVersionBtn')?.addEventListener('click', () => createNewTasacionVersion(aid));

  ['td_superficie_cubierta','td_tipo_cambio_usd','td_valor_uva'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', _tasRecalcLive);
  });

  const tipoEl = $('td_tipo_propiedad');
  if (tipoEl) {
    tipoEl.addEventListener('change', () => {
      if (!_currentTasacion) {
        toast?.('No se pudo cargar la tasación. Recargá la página e intentá de nuevo.');
        return;
      }
      const tipo = tipoEl.value || 'casa';
      _currentTasacion.tipo_propiedad = tipo;
      const compContainer = $('tasComparables');
      if (compContainer) compContainer.innerHTML = renderTasacionComparableCards(_currentTasacion);
      const resultsContainer = $('tasResults');
      if (resultsContainer) resultsContainer.outerHTML = renderTasacionResults(_currentTasacion);
      _tasRecalcLive();
      const hidden = detectHiddenTasacionComparableAttrs(tipo);
      if (hidden.length > 0) {
        toast('Se ocultaron atributos comparativos que no aplican a "' + tipo + '": ' + hidden.join(', '), 'info');
      }
    });
  }
}

function detectHiddenTasacionComparableAttrs(tipo) {
  const used = {};
  getTypeAttrs(tipo).forEach(a => { used[a[0]] = true; });
  const hidden = TAS_COMP_ATTRS.filter(f => !used[f]);
  return hidden;
}

const _origRenderTasacionDetail = renderTasacionDetail;
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

// ── MANAGEMENT CENTER ────────────────────────────────────────────────

function showModal(title, bodyHtml, _footerHtml, closeLabel) {
  const existing = document.getElementById('apprModalWrap');
  if (existing) existing.remove();
  const wrap = document.createElement('div');
  wrap.id = 'apprModalWrap';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)';
  wrap.onclick = e => { if (e.target === wrap) closeModal(); };
  wrap.innerHTML = `
    <div class="ap-modal-surface">
      <div class="ap-modal-header-row">
        <span class="ap-hero-title">${title}</span>
        <button onclick="closeModal()" class="ap-modal-close-btn">×</button>
      </div>
      <div class="ap-scroll-content">${bodyHtml}</div>
      ${closeLabel ? `<div class="ap-modal-footer"><button class="btn btn-ghost btn-sm" onclick="closeModal()">${closeLabel}</button></div>` : ''}
    </div>`;
  document.body.appendChild(wrap);
}
function closeModal() {
  const el = document.getElementById('apprModalWrap');
  if (el) el.remove();
}

function renderTasacionKpiBar(stats, container) {
  if (!container) return;
  const cards = [
    { label: 'Pendientes', num: stats.borradores || 0, sub: 'Borradores' },
    { label: 'En Proceso', num: stats.en_proceso || 0, sub: 'Activas' },
    { label: 'Completadas', num: stats.completadas || 0, sub: 'Finalizadas' },
    { label: 'Archivadas', num: stats.archivadas || 0, sub: 'Inactivas' },
    { label: 'Total', num: stats.total || 0, sub: 'Tasaciones' },
    { label: 'Con Agente', num: stats.con_agente || 0, sub: 'Asignadas' },
    { label: 'Sin Agente', num: stats.sin_agente || 0, sub: 'Sin asignar' },
  ];
  container.innerHTML = cards.map(c => `
    <div class="tas-kpi-card">
      <span class="tas-kpi-label">${c.label}</span>
      <span class="tas-kpi-number">${c.num}</span>
      <span class="tas-kpi-sub">${c.sub}</span>
    </div>
  `).join('');
}

async function openTasacionPanel(id) {
  _currentTasacion = null;
  try {
    const a = await API.getTasacion(id);
    _currentTasacion = a;
    $('tasPanelTitle').textContent = esc(a.titulo || a.solicitante || `Tasación #${a.id}`);
    const body = $('tasPanelBody');
    body.innerHTML = '<div class="loading-state">Cargando...</div>';
    $('tasOverlay').classList.add('show');
    $('tasPanel').classList.add('open');
    renderTasacionPanel(a, body);
  } catch (e) {
    toast('Error al cargar tasación: ' + e.message, 'error');
  }
}

function closeTasacionPanel() {
  $('tasOverlay').classList.remove('show');
  $('tasPanel').classList.remove('open');
  $('tasPanelBody').innerHTML = '';
  _currentTasacion = null;
}

async function renderTasacionPanel(a, body) {
  const iconMap = {casa:'🏠', departamento:'🏢', ph:'🏘️', local:'🏪', oficina:'🏢', terreno:'🌳'};
  const icon = iconMap[a.tipo_propiedad] || '📋';
  const priorityCls = 'priority-' + (a.priority || 'media');
  const statusCls = TAS_ESTADO_CLS[a.estado] || 'status-oculta';
  body.innerHTML = `
    <div class="tas-panel-section">
      <div class="tas-panel-section-title">Información General</div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Estado</span>
        <span><span class="admin-status-badge ${statusCls}">${TAS_ESTADO_MAP[a.estado] || a.estado}</span></span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Prioridad</span>
        <span class="admin-status-badge ${priorityCls} ap-avatar-round">${a.priority || 'media'}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Tipo</span>
        <span class="tas-panel-value">${icon} ${a.tipo_propiedad || '—'}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Dirección</span>
        <span class="tas-panel-value">${esc(a.direccion || '—')}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Barrio</span>
        <span class="tas-panel-value">${esc(a.barrio || '—')}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Sup. Cubierta</span>
        <span class="tas-panel-value">${a.superficie_cubierta ? a.superficie_cubierta + ' m²' : '—'}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Dorm / Baños</span>
        <span class="tas-panel-value">${a.dormitorios || 0} dorm · ${a.banios || 0} baños</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Valor Estimado</span>
        <span class="tas-panel-value ap-link-accent-bold">${_fmtUSD(a.valor_estimado_usd)}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Solicitante</span>
        <span class="tas-panel-value">${esc(a.solicitante || '—')}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Agente</span>
        <span class="tas-panel-value">${esc(a.assigned_agent_name || 'Sin asignar')}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Comparables</span>
        <span class="tas-panel-value">${a.total_comparables || 0}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Creado</span>
        <span class="tas-panel-value">${a.created_at ? formatDateShort(a.created_at) : '—'}</span>
      </div>
      <div class="tas-panel-row">
        <span class="tas-panel-label">Actualizado</span>
        <span class="tas-panel-value">${a.updated_at ? formatDateShort(a.updated_at) : '—'}</span>
      </div>
    </div>
    <div class="tas-panel-section">
      <div class="tas-panel-section-title">Acciones Rápidas</div>
      <div class="tas-actions" id="tasActions"></div>
    </div>
    <div class="tas-panel-section">
      <div class="tas-panel-section-title">Línea de Tiempo</div>
      <div class="tas-timeline" id="tasTimeline"><div class="loading-state"></div></div>
    </div>
    <div class="tas-panel-section">
      <div class="tas-panel-section-title">Comentarios</div>
      <div class="tas-comments" id="tasComments"><div class="loading-state"></div></div>
      <div class="tas-comment-input">
        <textarea id="tasCommentInput" placeholder="Escribí un comentario..." rows="1"></textarea>
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
  $('tasCommentSend').onclick = () => sendTasacionComment(a.id);
  $('tasCommentInput').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTasacionComment(a.id); } };
  $('tasUploadZone').onclick = () => $('tasFileInput').click();
  $('tasFileInput').onchange = e => uploadTasacionFile(a.id, e.target);
  $('tasOverlay').onclick = closeTasacionPanel;
}

function renderTasacionActions(a) {
  const c = $('tasActions');
  if (!c) return;
  c.innerHTML = `
    <button class="tas-action-btn" onclick="openTasacionDetail(${a.id})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      Abrir ACM
    </button>
    <button class="tas-action-btn" onclick="showTasacionAssignAgent(${a.id})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ${a.assigned_agent_id ? 'Reasignar agente' : 'Asignar agente'}
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
  const c = $('tasTimeline');
  if (!c) return;
  try {
    const items = await API.getTasacionTimeline(aid);
    if (!items || !items.length) {
      c.innerHTML = '<div class="ap-footnote-italic">Sin actividad registrada</div>';
      return;
    }
    const dotCls = {estado:'tas-timeline-dot--estado', asignacion:'tas-timeline-dot--asignacion', comentario:'tas-timeline-dot--comentario', conversion:'tas-timeline-dot--conversion'};
    c.innerHTML = items.map(i => `
      <div class="tas-timeline-item">
        <div class="tas-timeline-dot ${dotCls[i.event_type] || 'tas-timeline-dot--nota'}"></div>
        <div class="tas-timeline-content">${esc(i.description || i.event_type)}</div>
        <div class="tas-timeline-time">${formatDateTime(i.created_at)}</div>
      </div>
    `).join('');
  } catch {
    c.innerHTML = '<div class="ap-text-muted-base">Error al cargar</div>';
  }
}

async function renderTasacionComments(aid) {
  const c = $('tasComments');
  if (!c) return;
  try {
    const items = await API.getTasacionComments(aid);
    if (!items || !items.length) {
      c.innerHTML = '<div class="ap-footnote-italic-sm">Sin comentarios</div>';
      return;
    }
    c.innerHTML = items.map(i => `
      <div class="tas-comment">
        <div class="tas-comment-header">
          <span class="tas-comment-author">${esc(i.user_name || 'Usuario')}</span>
          <span class="tas-comment-time">${formatDateTime(i.created_at)}</span>
        </div>
        <div class="tas-comment-content">${esc(i.content)}</div>
      </div>
    `).join('');
  } catch {
    c.innerHTML = '<div class="ap-text-muted-base">Error al cargar</div>';
  }
}

async function renderTasacionFiles(aid) {
  const c = $('tasFiles');
  if (!c) return;
  try {
    const items = await API.getTasacionFiles(aid);
    if (!items || !items.length) {
      c.innerHTML = '<div class="ap-footnote-italic-sm">Sin archivos</div>';
      return;
    }
    c.innerHTML = items.map(i => `
      <span class="tas-file-chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${esc(i.original_name)}
        <button class="tas-file-delete" onclick="deleteTasacionFile(${aid}, ${i.id})" title="Eliminar">×</button>
      </span>
    `).join('');
  } catch {
    c.innerHTML = '<div class="ap-text-muted-base">Error al cargar</div>';
  }
}

async function sendTasacionComment(aid) {
  const input = $('tasCommentInput');
  const content = input.value.trim();
  if (!content) return;
  input.disabled = true;
  try {
    await API.addTasacionComment(aid, { content });
    input.value = '';
    renderTasacionComments(aid);
    renderTasacionTimeline(aid);
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
  input.disabled = false;
  input.focus();
}

async function uploadTasacionFile(aid, input) {
  const files = input.files;
  if (!files || !files.length) return;
  for (const f of files) {
    const fd = new FormData();
    fd.append('file', f);
    try {
      await API.uploadTasacionFile(aid, fd);
    } catch (e) {
      toast('Error al subir: ' + e.message, 'error');
    }
  }
  input.value = '';
  renderTasacionFiles(aid);
}

async function deleteTasacionFile(aid, fid) {
  if (!confirm('¿Eliminar este archivo?')) return;
  try {
    await API.deleteTasacionFile(aid, fid);
    renderTasacionFiles(aid);
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

async function showTasacionAssignAgent(aid) {
  try {
    const agents = await API.getTasacionAgents();
    const current = _currentTasacion?.assigned_agent_id;
    showModal('Asignar Agente', `
      <div class="ap-footnote-spaced">Seleccioná el agente para esta tasación</div>
      <div class="tas-assign-list">
        <button class="tas-assign-option" data-agent="">— Sin agente —</button>
        ${agents.map(a => `
          <button class="tas-assign-option ${current === a.id ? 'active' : ''}" data-agent="${a.id}" style="${current === a.id ? 'background:var(--admin-primary-glow);border-color:var(--admin-primary-border);color:var(--admin-primary)' : ''}">${esc(a.name)}</button>
        `).join('')}
      </div>
    `, null, 'Cerrar');
    document.querySelectorAll('.tas-assign-option').forEach(btn => {
      btn.onclick = async () => {
        try {
          await API.assignTasacionAgent(aid, { agent_id: btn.dataset.agent || null });
          toast('Agente asignado', 'success');
          closeModal();
          closeTasacionPanel();
          loadTasaciones();
        } catch (e) {
          toast('Error: ' + e.message, 'error');
        }
      };
    });
  } catch (e) {
    toast('Error al cargar agentes: ' + e.message, 'error');
  }
}

async function showTasacionChangeStatus(aid, current) {
  const estados = [
    ['borrador', 'Pendiente'],
    ['en_proceso', 'En Proceso'],
    ['completada', 'Completada'],
    ['archivada', 'Archivada'],
  ];
  showModal('Cambiar Estado', `
    <div class="ap-footnote-spaced">Seleccioná el nuevo estado</div>
    <div class="tas-assign-list">
      ${estados.map(([val, label]) => `
        <button class="tas-assign-option ${val === current ? 'active' : ''}" data-estado="${val}" style="${val === current ? 'background:var(--admin-primary-glow);border-color:var(--admin-primary-border);color:var(--admin-primary)' : ''}">${label}</button>
      `).join('')}
    </div>
  `, null, 'Cerrar');
  document.querySelectorAll('.tas-assign-list .tas-assign-option').forEach(btn => {
    btn.onclick = async () => {
      try {
        await API.changeTasacionStatus(aid, { estado: btn.dataset.estado });
        toast('Estado actualizado', 'success');
        closeModal();
        closeTasacionPanel();
        loadTasaciones();
      } catch (e) {
        toast('Error: ' + e.message, 'error');
      }
    };
  });
}

async function convertTasacionToProperty(aid) {
  if (!confirm('¿Convertir esta tasación en una propiedad del inventario?')) return;
  try {
    const result = await API.convertTasacionToProperty(aid, { operation_type: 'venta' });
    toast(`Propiedad #${result.property_id} creada: ${result.property_title}`, 'success');
    closeTasacionPanel();
    loadTasaciones();
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

function formatDateShort(d) {
  if (!d) return '—';
  const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00'));
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00'));
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Exponer globales
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

// Botón volver en detalle de tasación
document.addEventListener('click', e => {
  if (e.target.closest('#backToTasacionesList')) showTasacionesList();
});

// Filtro y búsqueda de tasaciones
document.addEventListener('change', e => {
  const el = e.target.closest('#tasacionFilter') || e.target.closest('#tasacionShowArchived');
  if (el) {
    _tasacionPage = 1;
    loadTasaciones();
  }
});

let _tasSearchTimer = null;
document.addEventListener('input', e => {
  if (e.target.closest('#tasacionSearch')) {
    clearTimeout(_tasSearchTimer);
    _tasSearchTimer = setTimeout(() => {
      _tasacionPage = 1;
      loadTasaciones();
    }, 300);
  }
});
