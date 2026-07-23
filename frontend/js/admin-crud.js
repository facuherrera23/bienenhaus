/**
 * admin-crud.js — CRUD de propiedades, alquileres y agentes
 */

const homeIconR = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
const locSvg   = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const bedSvg   = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 012 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>';
const bathSvg  = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3v2.25"/><path d="M4 21l1-1.5"/><path d="M20 21l-1-1.5"/></svg>';
const sqmSvg   = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>';

// ══════════════════════════════════════════════════════════════════════
// RENDER — PROPIEDADES
// ══════════════════════════════════════════════════════════════════════
function renderProps() {
  const list = $('propsAdminList');
  $('sidebarPropCount').textContent = _props.length;

  // Filtrar por búsqueda + filtros combinados
  const q = _searchQuery;
  readFilterValues();
  let filtered = _props.filter(p => {
    if (q && !(p.title || '').toLowerCase().includes(q) && !(p.location || '').toLowerCase().includes(q)) return false;
    return matchFilters(p, false);
  });

  const totalPages = Math.ceil(filtered.length / _perPage) || 1;
  if (_page > totalPages) _page = totalPages;

  // Ordenar
  const sorted = [...filtered].sort((a, b) => {
    let va = a[_sortField], vb = b[_sortField];
    if (_sortField === 'price') { va = Number(va) || 0; vb = Number(vb) || 0; }
    else if (_sortField === 'title') { va = (va || '').toLowerCase(); vb = (vb || '').toLowerCase(); }
    else { va = va || ''; vb = vb || ''; }
    if (va < vb) return _sortOrder === 'asc' ? -1 : 1;
    if (va > vb) return _sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const start = (_page - 1) * _perPage;
  const end   = Math.min(start + _perPage, sorted.length);
  const pageItems = sorted.slice(start, end);

  $('propSubtitle').textContent = `${filtered.length} ${filtered.length === 1 ? 'propiedad' : 'propiedades'}${q ? ' filtradas' : ''} — Pág. ${_page}/${totalPages}`;

  if (!filtered.length) {
    list.innerHTML = '<div class="loading-state"></div>';
    list.firstChild.textContent = q ? 'Sin resultados para "' + q + '".' : 'No hay propiedades. Creá la primera con el botón de arriba.';
    return;
  }

  const homeIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';

  list.style.display = '';
  list.className = 'prop-grid';
  list.innerHTML = '';

  // Remove stale sort bars then insert fresh one
  document.querySelectorAll('#sortBar').forEach(el => el.remove());

  const sorters = [
    { field: 'created_at', label: 'Fecha' },
    { field: 'price', label: 'Precio' },
    { field: 'title', label: 'Nombre' },
  ];
  list.insertAdjacentHTML('beforebegin', `<div class="sort-bar" id="sortBar">
    <span class="sort-bar-label">Ordenar</span>
    ${sorters.map(s => `<button class="sort-btn${_sortField === s.field ? ' sort-btn--active' : ''}" data-action="sortProps" data-field="${s.field}" data-field="${s.field}">
      ${s.label} ${_sortField === s.field ? (_sortOrder === 'asc' ? '↑' : '↓') : ''}
    </button>`).join('')}
    <span class="sort-bar-count">${_props.length} ${_props.length === 1 ? 'propiedad' : 'propiedades'}</span>
  </div>`);

  list.innerHTML = pageItems.map(p => {
    const thumb = p.images?.[0];
    const thumbHtml = thumb
      ? `<img class="prop-card-thumb" ${imgAttrs(thumb, [400, 800])} alt="" loading="lazy"/>`
      : `<div class="prop-card-thumb--empty">${homeIcon}</div>`;

    const specs = [];
    if (p.beds)  specs.push(`<div class="prop-card-spec">${bedSvg} ${p.beds}</div>`);
    if (p.baths) specs.push(`<div class="prop-card-spec">${bathSvg} ${p.baths}</div>`);
    if (p.sqm)   specs.push(`<div class="prop-card-spec">${sqmSvg} ${p.sqm} m²</div>`);

    return `
      <div class="prop-card" data-id="${p.id}">
        <div class="prop-card-check${_selectedProps.has(p.id) ? ' checked' : ''}" data-action="toggleSelect" data-pid="${p.id}">
          <input type="checkbox" ${_selectedProps.has(p.id) ? 'checked' : ''}/>
        </div>
        ${thumbHtml}
        <div class="prop-card-body">
          <div class="prop-card-title">${p.title}</div>
          <div class="prop-card-loc">${locSvg} ${p.location || 'Sin ubicación'}</div>
          <div class="prop-card-price">${fmtPrice(p.price)}</div>

          ${specs.length ? `<div class="prop-card-specs">${specs.join('')}</div>` : ''}

          <div class="prop-card-badges">
            ${statusBadge(p.status)}
            ${p.featured ? '<span class="admin-status-badge admin-prop-featured">★ Destacada</span>' : ''}
          </div>

          <div class="prop-card-actions">
            <button class="btn btn-ghost btn-icon" data-action="openPropPreview" data-pid="${p.id}" title="Vista rápida">
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
            ${p.status !== 'disponible'
              ? `<button class="btn btn-success btn-icon" data-action="setPropStatus" data-pid="${p.id}" data-status="disponible" title="Disponible">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                 </button>`
              : ''}
            ${p.status !== 'vendida'
              ? `<button class="btn btn-warn btn-icon" data-action="setPropStatus" data-pid="${p.id}" data-status="vendida" title="Vendida">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                 </button>`
              : ''}
            ${p.status !== 'oculta'
              ? `<button class="btn btn-ghost btn-icon" data-action="setPropStatus" data-pid="${p.id}" data-status="oculta" title="Ocultar">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                 </button>`
              : ''}
            <button class="btn btn-danger btn-icon" data-action="confirmDeleteProp" data-pid="${p.id}" title="Eliminar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }).join('') + paginationHTML(totalPages);
}

function paginationHTML(totalPages) {
  if (totalPages <= 1) return '';
  const prevDisabled = _page <= 1;
  const nextDisabled = _page >= totalPages;
  const maxVisible = 7;

  let pages = [];
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let left  = Math.max(2, _page - 2);
    let right = Math.min(totalPages - 1, _page + 2);
    if (left > 2) pages.push('…');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('…');
    pages.push(totalPages);
  }

  const pageBtns = pages.map(p =>
    p === '…'
      ? `<span class="page-dots">…</span>`
      : `<button type="button" class="page-btn${p === _page ? ' page-btn--active' : ''}"
                 data-action="goToPage" data-page="${p}">${p}</button>`
  ).join('');

  return `
    <div class="pagination">
      <button type="button" class="page-btn page-btn--nav" data-action="goToPage" data-page="${_page - 1}"
              ${prevDisabled ? 'disabled' : ''}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Anterior
      </button>
      <div class="page-numbers">${pageBtns}</div>
      <button type="button" class="page-btn page-btn--nav" data-action="goToPage" data-page="${_page + 1}"
              ${nextDisabled ? 'disabled' : ''}>
        Siguiente
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>`;
}

// ══════════════════════════════════════════════════════════════════════
// FORMULARIO DE PROPIEDAD / ALQUILER (unificado)
// ══════════════════════════════════════════════════════════════════════
function openPropForm(id) {
  const isRental = _subTab === 'alquiler';
  const items = isRental ? _rentals : _props;
  const item = id ? items.find(p => p.id === id) : null;

  const typeLabel = isRental ? 'Alquiler' : 'Propiedad';
  $('propFormTitle').textContent = item ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`;

  const v = field => item != null ? (item[field] ?? '') : '';
  const statusOpts = isRental ? ['disponible','alquilada','oculta'] : ['disponible','vendida','oculta'];

  const priceFields = isRental
    ? `<div class="field"><label class="field-label">Precio ARS/mes</label>
        <input id="rf_price_ars" class="field-input" type="number" value="${v('price_ars')}" min="0" step="0.01"/></div>
       <div class="field"><label class="field-label">Expensas ARS</label>
        <input id="rf_expenses" class="field-input" type="number" value="${v('expenses')}" min="0"/></div>`
    : `<div class="field"><label class="field-label">Precio USD</label>
        <input id="pf_price" class="field-input" type="number" value="${v('price')}" min="0" step="0.01"/></div>`;

  const rentalExtras = isRental
    ? `<div class="pf-row-3">
         <div class="field"><label class="field-label">Min. meses</label>
          <input id="rf_min_months" class="field-input" type="number" value="${v('min_months')}" min="0"/></div>
         <div class="field crud-field-bottom" >
          <label class="acm-chip">
            <input type="checkbox" class="acm-chip-input" id="rf_furnished" ${item?.furnished ? 'checked' : ''}/>
            <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Amoblado</span></span>
          </label>
         </div>
       </div>`
    : '';

  const featuredLabel = isRental ? '★ Alquiler destacado' : '★ Propiedad destacada';

  $('propFormContent').innerHTML = `
    <div class="pf-body">
      <div>
        <p class="af-section-label">Información básica</p>
        <div class="field">
          <label class="field-label">Título *</label>
          <input id="pf_title" class="field-input" value="${v('title')}" placeholder="Nombre"/>
        </div>
        <div class="pf-row-2">
          <div class="field"><label class="field-label">Tipo</label>
            <select id="pf_type" class="field-input field-input--select">
              ${['casa','departamento','finca','terreno','local','otro'].map(t =>
                `<option value="${t}"${v('type') === t ? ' selected' : ''}>${t[0].toUpperCase() + t.slice(1)}</option>`
              ).join('')}
            </select>
          </div>
          <div class="field"><label class="field-label">Estado</label>
            <select id="pf_status" class="field-input field-input--select">
              ${statusOpts.map(s =>
                `<option value="${s}"${v('status') === s ? ' selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Ubicación</label>
          <input id="pf_location" class="field-input" value="${v('location')}" placeholder="Ciudad, Provincia"/>
        </div>
      </div>

      <hr class="af-divider"/>

      <div>
        <p class="af-section-label">Precio y dimensiones</p>
        <div class="pf-row-4">
          ${priceFields}
          <div class="field"><label class="field-label">Dormitorios</label>
            <input id="pf_beds"  class="field-input" type="number" value="${v('beds')}"  min="0"/></div>
          <div class="field"><label class="field-label">Baños</label>
            <input id="pf_baths" class="field-input" type="number" value="${v('baths')}" min="0"/></div>
          <div class="field"><label class="field-label">m² cubiertos</label>
            <input id="pf_sqm"   class="field-input" type="number" value="${v('sqm')}"   min="0" step="0.1"/></div>
        </div>
        ${rentalExtras}
      </div>

      <hr class="af-divider"/>

      <div>
        <p class="af-section-label">Descripción</p>
        <div class="field">
          <textarea id="pf_desc" class="field-input" rows="4" placeholder="Describí...">${esc(v('desc'))}</textarea>
        </div>
      </div>

      <hr class="af-divider"/>

      <div>
        <p class="af-section-label">Video (opcional)</p>
        <div class="field">
          <input id="pf_video_url" class="field-input" value="${v('video_url') || ''}" placeholder="https://www.youtube.com/watch?v=..."/>
        </div>
      </div>

      <hr class="af-divider"/>

      <div>
        <p class="af-section-label">Imágenes</p>
        <div id="dropZone" class="drop-zone">
          <input type="file" id="fileInput"
                 accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                 multiple class="crud-hidden-input"/>
          <div class="drop-zone-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div class="drop-zone-text">Arrastrá imágenes aquí o</div>
          <button type="button" class="btn btn-outline btn-sm" id="browseBtn">
            Seleccionar archivos
          </button>
          <div class="drop-zone-hint">JPG · PNG · WEBP · GIF — máx. 8 MB por foto</div>
        </div>
        <div id="uploadProgress" class="upload-progress hidden">
          <div class="upload-progress-bar" id="uploadProgressBar"></div>
          <span id="uploadProgressText" class="upload-progress-text">Subiendo...</span>
        </div>
        <div id="imgPreviewGrid" class="img-preview-grid"></div>
      </div>

      <hr class="af-divider"/>

      <label class="acm-chip">
        <input type="checkbox" class="acm-chip-input" id="pf_featured" ${item?.featured ? 'checked' : ''}/>
        <span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">${featuredLabel}</span></span>
      </label>

      <div class="pf-actions">
        <button class="btn btn-primary btn-full" id="savePropBtn">
          ${item ? 'Guardar cambios' : `Crear ${typeLabel.toLowerCase()}`}
        </button>
        <button class="btn btn-ghost" data-action="closePropForm">Cancelar</button>
      </div>
    </div>`;

  initUploader(item?.images || []);

  $('propFormModal').classList.remove('hidden');

  $('savePropBtn').onclick = () => savePropForm(id || null);
}

function closePropForm() {
  $('propFormModal').classList.add('hidden');
}

async function savePropForm(id) {
  const title = $('pf_title')?.value.trim();
  if (!title) { toast('El título es obligatorio.', 'warn'); $('pf_title')?.focus(); return; }
  const isRental = _subTab === 'alquiler';
  const priceEl = isRental ? $('rf_price_ars') : $('pf_price');
  const price = priceEl ? parseFloat(priceEl.value) : 0;
  if (price <= 0) { toast('El precio debe ser mayor a cero.', 'warn'); priceEl?.focus(); return; }
  const location = $('pf_location')?.value.trim();
  if (!location) { toast('La ubicación es obligatoria.', 'warn'); $('pf_location')?.focus(); return; }

  const baseData = {
    title,
    type:     $('pf_type').value,
    status:   $('pf_status').value,
    location: $('pf_location').value.trim(),
    beds:     $('pf_beds').value,
    baths:    $('pf_baths').value,
    sqm:      $('pf_sqm').value,
    desc:     $('pf_desc').value.trim(),
    images:   _currentImages.filter(u => !u.startsWith('blob:')),
    video_url: $('pf_video_url')?.value.trim() || '',
    featured: $('pf_featured').checked,
  };

  const data = isRental
    ? { ...baseData, price_ars: $('rf_price_ars').value, expenses: $('rf_expenses').value, min_months: $('rf_min_months').value, furnished: $('rf_furnished').checked }
    : { ...baseData, price: $('pf_price').value };

  try {
    let saved;
    if (id) {
      saved = isRental ? await API.updateRental(id, data) : await API.updateProperty(id, data);
      if (isRental) _rentals = _rentals.map(r => r.id === id ? saved : r);
      else _props = _props.map(p => p.id === id ? saved : p);
    } else {
      saved = isRental ? await API.createRental(data) : await API.createProperty(data);
      if (isRental) { _rentals.unshift(saved); _rPage = 1; }
      else { _props.unshift(saved); _page = 1; }
    }
    if (!id) showPublishStep(saved, isRental);
  } catch (e) { toast(e.message, 'error'); }
}

/* ── Paso 2: Publicación ──────────────────────── */
function showPublishStep(item, isRental) {
  const typeLabel = isRental ? 'Alquiler' : 'Propiedad';
  $('propFormTitle').textContent = `Paso 2 — Publicar ${typeLabel}`;

  const defaultContent = item.title + '\n' + (item.desc || '').slice(0, 200);

  $('propFormContent').innerHTML = `
    <div class="ps-body">
      <div class="ps-progress"><span class="ps-dot done">&#10003;</span><span class="ps-line"></span><span class="ps-dot active">2</span></div>
      <p class="ps-sub">La ${typeLabel.toLowerCase()} se guardó correctamente. Elegí d&oacute;nde publicarla:</p>

      <div class="ps-section">
        <p class="ps-section-label">📡 Portales</p>
        <label class="acm-chip"><input type="checkbox" class="acm-chip-input" id="psPortalAll" checked/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">Seleccionar todos</span></span></label>
        <div id="psPortalList" class="ps-list"></div>
      </div>

      ${isRental ? '' : `
      <div class="ps-section">
        <p class="ps-section-label">📱 Redes sociales</p>
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
        <button class="btn btn-ghost" id="psSkipBtn">Omitir — cerrar</button>
      </div>
    </div>`;

  // Render portals
  const activePortals = _portals.filter(p => p.active);
  const portalList = $('psPortalList');
  if (activePortals.length) {
    portalList.innerHTML = activePortals.map(p =>
      `<label class="acm-chip"><input type="checkbox" class="acm-chip-input ps-portal" value="${p.id}" checked/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">${esc(p.name)}</span></span></label>`
    ).join('');
  } else {
    portalList.innerHTML = '<div class="ps-empty">No hay portales activos.</div>';
  }

  let hasSocial = false;

  // Render social accounts
  if (!isRental) _socialReq('GET', '/api/social/accounts').then(res => {
    const accounts = (res.data || []).filter(a => a.active);
    const socialList = $('psSocialList');
    if (accounts.length) {
      hasSocial = true;
      socialList.innerHTML = accounts.map(a =>
        `<label class="acm-chip"><input type="checkbox" class="acm-chip-input ps-social" value="${a.id}" checked/><span class="acm-chip-visual"><span class="acm-chip-box"><svg class="acm-chip-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="acm-chip-text">${esc(a.platform)} · ${esc(a.label || a.platform)}</span></span></label>`
      ).join('');
    } else {
      socialList.innerHTML = '<div class="ps-empty">No hay cuentas de redes activas.</div>';
    }
    _checkEmpty(activePortals.length, hasSocial);
  });
  else _checkEmpty(activePortals.length, false);

  $('psPublishBtn').onclick = () => executePublish(item, isRental);
  $('psSkipBtn').onclick = () => { renderSubTab(); closePropForm(); };

  // Bind "Seleccionar todos" toggles
  const $portalAll = $('psPortalAll');
  const $socialAll = $('psSocialAll');
  if ($portalAll) $portalAll.addEventListener('change', function () {
    document.querySelectorAll('.ps-portal').forEach(cb => cb.checked = this.checked);
  });
  if ($socialAll && !isRental) $socialAll.addEventListener('change', function () {
    document.querySelectorAll('.ps-social').forEach(cb => cb.checked = this.checked);
  });
}

function _checkEmpty(hasPortal, hasSocial) {
  const btn = $('psPublishBtn');
  const msg = $('psEmptyMsg');
  if (!hasPortal && !hasSocial) {
    if (btn) btn.style.display = 'none';
    if (msg) msg.style.display = '';
  } else {
    if (btn) btn.style.display = '';
    if (msg) msg.style.display = 'none';
  }
}

async function executePublish(item, isRental) {
  const btn = $('psPublishBtn');
  btn.disabled = true; btn.textContent = 'Publicando...';

  const portalIds = [...document.querySelectorAll('.ps-portal:checked')].map(cb => cb.value);
  const socialIds = [...document.querySelectorAll('.ps-social:checked')].map(cb => cb.value);
  const propId = item.id;

  const portalNames = {};
  _portals.forEach(p => { portalNames[p.id] = p.name; });

  let ok = 0, err = 0;
  const errors = [];

  // Enqueue to selected portals
  for (const pid of portalIds) {
    try {
      await API.enqueuePortal({
        action: 'publish',
        property_id: isRental ? null : propId,
        rental_id: isRental ? propId : null,
        portal_id: parseInt(pid),
      });
      ok++;
    } catch (e) {
      err++;
      errors.push(portalNames[pid] || `Portal #${pid}`);
    }
  }

  // Create social posts for selected accounts
  const socialContent = ($('psSocialContent')?.value || item.title).trim();
  for (const aid of socialIds) {
    try {
      await _socialReq('POST', '/api/social/posts', {
        account_id: parseInt(aid),
        property_id: isRental ? null : propId,
        content: socialContent,
        media_urls: JSON.stringify((item.images || []).slice(0, 10)),
      });
      ok++;
    } catch (e) {
      err++;
      errors.push(`Social #${aid}`);
    }
  }

  if (err) {
    toast(`${ok} publicadas, ${err} con error:\n${errors.join(', ')}`, 'warn');
  } else {
    toast(`${ok} publicaciones realizadas`, 'ok');
  }
  renderSubTab();
  closePropForm();
}
// ══════════════════════════════════════════════════════════════════════
const agentPhoneIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>';
const agentMailIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
const agentWaIcon   = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>';
const agentPropIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
const agentLeadIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>';
const agentSaleIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>';

function statusClass(status) {
  if (status === 'active') return 'active';
  if (status === 'vacation') return 'vacation';
  return 'inactive';
}

function agentCardHTML(a) {
  const bg       = AVATAR_BG[a.id % AVATAR_BG.length];
  const initials = (a.name[0] || '') + (a.last[0] || '');
  const st       = a.status || 'active';
  const avHtml   = a.avatar
    ? `<img src="${a.avatar}" class="agent-admin-photo" alt="${a.name}" data-onerror="hide"/>
       <div class="agent-admin-initials" style="background:${bg};display:none">${initials}</div>`
    : `<div class="agent-admin-initials" style="background:${bg}">${initials}</div>`;

  return `
    <div class="agent-admin-card">
      <div class="agent-admin-status ${statusClass(st)}">${st}</div>
      <div class="agent-admin-avatar-wrap">
        ${avHtml}
      </div>
      <div class="agent-admin-name">${a.name} ${a.last}</div>
      ${a.specialty ? `<div class="agent-admin-specialty">${esc(a.specialty)}</div>` : ''}
      <div class="agent-admin-years">${a.license_number || (a.years ? `${a.years} año${a.years !== 1 ? 's' : ''} de experiencia` : '')}</div>

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
        ${a.phone    ? `<div class="agent-admin-chip">${agentPhoneIcon} ${a.phone}</div>` : ''}
        ${a.email    ? `<div class="agent-admin-chip">${agentMailIcon} ${a.email}</div>` : ''}
        ${a.whatsapp ? `<a href="https://wa.me/${a.whatsapp}" target="_blank" class="agent-admin-chip agent-admin-wa">${agentWaIcon} WhatsApp</a>` : ''}
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
  const bg       = AVATAR_BG[a.id % AVATAR_BG.length];
  const initials = (a.name[0] || '') + (a.last[0] || '');
  const avatarHtml = a.avatar
    ? `<img src="${a.avatar}" class="agent-table-av" alt=""/>`
    : `<div class="agent-table-initials" style="background:${bg}">${initials}</div>`;

  return `
    <tr>
      <td><div class="agent-table-name">${avatarHtml} <span>${a.name} ${a.last}</span></div></td>
      <td>${a.specialty || '—'}</td>
      <td>${a.license_number || '—'}</td>
      <td>${a.phone || '—'}</td>
      <td>${a.email || '—'}</td>
      <td>
        <div class="agent-table-actions">
          <button class="btn btn-ghost btn-sm" data-action="openAgentForm" data-aid="${a.id}">Editar</button>
          <button class="btn btn-danger btn-sm" data-action="confirmDeleteAgent" data-aid="${a.id}">Eliminar</button>
        </div>
      </td>
    </tr>`;
}

function renderAgentKPI() {
  const existing = $('agentKpiBar');
  if (existing) existing.remove();

  const total   = _agents.length;
  const active  = _agents.filter(a => (a.status || 'active') === 'active').length;
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

  const topbar = $('tabAgents')?.querySelector('.admin-topbar');
  if (topbar) topbar.insertAdjacentHTML('afterend', kpiHtml);
}

function renderAgents() {
  const list = $('agentsAdminList');
  $('sidebarAgentCount').textContent = _agents.length;
  $('agentSubtitle').textContent = `${_agents.length} ${_agents.length === 1 ? 'agente' : 'agentes'} registrados`;

  // Remove stale view toggle
  const oldToggle = $('agentViewToggle');
  if (oldToggle) oldToggle.remove();

  renderAgentKPI();

  if (!_agents.length) {
    list.innerHTML = `<div class="loading-state">No hay agentes. Agregá el primero con el botón de arriba.</div>`;
    return;
  }

  // Inject view toggle before list
  list.insertAdjacentHTML('beforebegin', `<div class="agent-view-toggle" id="agentViewToggle">
    <button class="agent-view-btn${_agentView === 'cards' ? ' active' : ''}" data-action="switchAgentView" data-view="cards">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      Tarjetas
    </button>
    <button class="agent-view-btn${_agentView === 'table' ? ' active' : ''}" data-action="switchAgentView" data-view="table">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      Tabla
    </button>
  </div>`);

  if (_agentView === 'table') {
    list.style.display = '';
    list.className = '';
    list.innerHTML = `<table class="agent-table">
      <thead><tr>
        <th>Nombre</th><th>Especialidad</th><th>Matrícula</th><th>Teléfono</th><th>Email</th><th>Acciones</th>
      </tr></thead>
      <tbody>${_agents.map(agentTableRowHTML).join('')}</tbody>
    </table>`;
  } else {
    list.style.display = 'grid';
    list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(270px, 1fr))';
    list.style.gap = '16px';
    list.innerHTML = _agents.map(agentCardHTML).join('');
  }

  list.querySelectorAll('img[data-onerror]').forEach(function(img) {
    img.onerror = function() {
      this.style.display = 'none';
      var next = this.nextElementSibling;
      if (next) next.style.display = 'flex';
    };
  });

  // Bind view toggle
  const toggleBtns = document.querySelectorAll('[data-action="switchAgentView"]');
  toggleBtns.forEach(btn => {
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

// ══════════════════════════════════════════════════════════════════════
// FORMULARIO DE AGENTE
// ══════════════════════════════════════════════════════════════════════
let _agentAvatar = '';

function openAgentForm(id) {
  const agent = id ? _agents.find(a => a.id === id) : null;
  $('agentFormTitle').textContent = agent ? 'Editar Agente' : 'Nuevo Agente';
  _agentAvatar = agent?.avatar || '';

  const v  = field => agent != null ? (agent[field] ?? '') : '';
  const bg = agent ? AVATAR_BG[agent.id % AVATAR_BG.length] : AVATAR_BG[0];
  const initials = agent ? (agent.name[0]||'')+(agent.last[0]||'') : '?';

  const avatarPreviewHtml = _agentAvatar
    ? `<img src="${_agentAvatar}" class="avatar-preview-img" alt="foto"/>`
    : `<div class="avatar-preview-placeholder" style="background:${bg}">${initials}</div>`;

  $('agentFormContent').innerHTML = `
    <div class="af-header">
      <div class="af-avatar-section">
        <div class="af-avatar-wrap">
          <div class="avatar-upload-preview" id="avatarPreview">
            ${avatarPreviewHtml}
            <div class="avatar-upload-overlay" id="avatarOverlay">
              <span class="crud-icon-placeholder">📷</span>
              <span class="crud-change-label">CAMBIAR</span>
            </div>
          </div>
        </div>
        <div class="af-avatar-actions">
          <input type="file" id="avatarInput"
                 accept="image/jpeg,image/png,image/webp,image/gif" class="crud-hidden-input"/>
          <button type="button" class="btn btn-outline btn-sm crud-btn-full" id="avatarBtn">
            ${_agentAvatar ? '↺ Cambiar foto' : '+ Subir foto'}
          </button>
          ${_agentAvatar ? `<button type="button" class="btn btn-danger btn-sm crud-btn-full" id="avatarRemoveBtn">Quitar</button>` : ''}
          <div class="crud-upload-hint">JPG · PNG · WEBP<br/>máx. 5MB</div>
        </div>
      </div>
      <div id="avatarUploadStatus" class="avatar-status crud-upload-status"></div>
    </div>

    <div class="af-divider"></div>

    <p class="af-section-label">Datos personales</p>
    <div class="crud-grid-2col">
      <div class="field">
        <label class="field-label">Nombre *</label>
        <input id="af_name" class="field-input" value="${v('name')}" placeholder="Nombre"/>
      </div>
      <div class="field">
        <label class="field-label">Apellido</label>
        <input id="af_last" class="field-input" value="${v('last')}" placeholder="Apellido"/>
      </div>
    </div>
    <div class="crud-grid-2col-wide">
      <div class="field">
        <label class="field-label">Especialidad</label>
        <input id="af_specialty" class="field-input" value="${v('specialty')}" placeholder="Ej: Propiedades residenciales"/>
      </div>
      <div class="field">
        <label class="field-label">Matrícula</label>
        <input id="af_license" class="field-input" value="${v('license_number')}" placeholder="Ej: MAT. 12345"/>
      </div>
    </div>

    <div class="af-divider"></div>

    <p class="af-section-label">Contacto</p>
    <div class="crud-grid-2col">
      <div class="field">
        <label class="field-label">Teléfono</label>
        <input id="af_phone" class="field-input" value="${v('phone')}" placeholder="+54 351 ..."/>
      </div>
      <div class="field">
        <label class="field-label">WhatsApp (solo números)</label>
        <input id="af_whatsapp" class="field-input" value="${v('whatsapp')}" placeholder="5493510..."/>
      </div>
    </div>
    <div class="field">
      <label class="field-label">Email</label>
      <input id="af_email" class="field-input" type="email" value="${v('email')}" placeholder="agente@bienenhaus.com"/>
    </div>

    <div class="af-divider"></div>

    <div class="crud-flex-gap10">
      <button class="btn btn-primary btn-full crud-btn-pad14" id="saveAgentBtn">
        ${agent ? 'Guardar cambios' : 'Crear agente'}
      </button>
      <button class="btn btn-ghost crud-btn-pad14h" data-action="closeAgentForm">Cancelar</button>
    </div>`;

  $('agentFormModal').classList.remove('hidden');
  $('saveAgentBtn').onclick = () => saveAgentForm(id || null);

  const triggerUpload = () => $('avatarInput').click();
  $('avatarBtn').onclick     = triggerUpload;
  $('avatarOverlay').onclick = triggerUpload;

  $('avatarInput').onchange = async () => {
    const file = $('avatarInput').files[0];
    if (!file) return;
    $('avatarInput').value = '';
    setAvatarStatus('Comprimiendo…', 'loading');
    const compressed = await compressImage(file, 400, 0.82);
    const localUrl = URL.createObjectURL(compressed);
    setAvatarPreview(localUrl);
    setAvatarStatus('Subiendo…', 'loading');
    try {
      const result = await API.uploadImages([compressed], 'avatar');
      URL.revokeObjectURL(localUrl);
      _agentAvatar = result.urls?.[0] || '';
      setAvatarPreview(_agentAvatar);
      setAvatarStatus('✓ Foto subida', 'ok');
      setTimeout(() => setAvatarStatus('', ''), 2500);
    } catch (err) {
      URL.revokeObjectURL(localUrl);
      setAvatarPreview(_agentAvatar);
      setAvatarStatus(`Error: ${err.message}`, 'error');
    }
  };

  const removeBtn = $('avatarRemoveBtn');
  if (removeBtn) {
    removeBtn.onclick = () => {
      if (_agentAvatar?.startsWith('/static/uploads/'))
        API.deleteImage(_agentAvatar.split('/').pop()).catch(() => {});
      _agentAvatar = '';
      setAvatarPreview('');
      removeBtn.remove();
      $('avatarBtn').textContent = '+ Subir foto';
    };
  }
}

function setAvatarPreview(url) {
  const wrap = $('avatarPreview');
  if (!wrap) return;
  const overlay = `<div class="avatar-upload-overlay" id="avatarOverlay"
    data-action="clickAvatarInput">
    <span>📷</span>
    <span class="crud-small-label">Cambiar foto</span>
  </div>`;
  if (url) {
    wrap.innerHTML = `<img src="${url}" class="avatar-preview-img" alt="foto"/>${overlay}`;
  } else {
    const initials = (($('af_name')?.value[0]||'')+($('af_last')?.value[0]||''))||'?';
    wrap.innerHTML = `<div class="avatar-preview-placeholder" style="background:${AVATAR_BG[0]}">${initials}</div>${overlay}`;
  }
}

function setAvatarStatus(msg, type) {
  const el = $('avatarUploadStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'avatar-status' + (type ? ' avatar-status-' + type : '');
}

function closeAgentForm() {
  $('agentFormModal').classList.add('hidden');
}

async function saveAgentForm(id) {
  const name = $('af_name')?.value.trim();
  if (!name) { toast('El nombre es obligatorio.', 'warn'); return; }

  const data = {
    name,
    last:      $('af_last').value.trim(),
    specialty: $('af_specialty').value.trim(),
    license_number: $('af_license').value.trim(),
    phone:     $('af_phone').value.trim(),
    whatsapp:  $('af_whatsapp').value.trim(),
    email:     $('af_email').value.trim(),
    avatar:    _agentAvatar,
  };

  try {
    let saved;
    if (id) {
      saved = await API.updateAgent(id, data);
      _agents = _agents.map(a => a.id === id ? saved : a);
    } else {
      saved = await API.createAgent(data);
      _agents.push(saved);
    }
    renderAgents();
    closeAgentForm();
  } catch (e) { toast(e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════════════
// RENDER — ALQUILERES (subtab)
// ══════════════════════════════════════════════════════════════════════
function renderRentals() {
  const list = $('propsAdminList');
  $('sidebarPropCount').textContent = _props.length;

  // Remove stale sort bars from venta tab
  document.querySelectorAll('#sortBar').forEach(el => el.remove());

  // Filtrar por búsqueda + filtros combinados
  const q = _searchQuery;
  readFilterValues();
  let filtered = _rentals.filter(r => {
    if (q && !(r.title || '').toLowerCase().includes(q) && !(r.location || '').toLowerCase().includes(q)) return false;
    return matchFilters(r, true);
  });

  const totalPages = Math.ceil(filtered.length / _rPerPage) || 1;
  if (_rPage > totalPages) _rPage = totalPages;
  const start = (_rPage - 1) * _rPerPage;
  const end   = Math.min(start + _rPerPage, filtered.length);
  const pageItems = filtered.slice(start, end);

  $('propSubtitle').textContent = `${filtered.length} ${filtered.length === 1 ? 'alquiler' : 'alquileres'}${q ? ' filtrados' : ''} — Pág. ${_rPage}/${totalPages}`;

  if (!filtered.length) {
    list.innerHTML = '<div class="loading-state"></div>';
    list.firstChild.textContent = q ? 'Sin resultados para "' + q + '".' : 'No hay alquileres. Creá el primero con el botón de arriba.';
    return;
  }

  list.style.display = '';
  list.className = 'prop-grid';

  list.innerHTML = pageItems.map(r => {
    const thumb = r.images?.[0];
    const thumbHtml = thumb
      ? `<img class="prop-card-thumb" ${imgAttrs(thumb, [400, 800])} alt="" loading="lazy"/>`
      : `<div class="prop-card-thumb--empty">${homeIconR}</div>`;

    const specs = [];
    if (r.beds)  specs.push(`<div class="prop-card-spec">${bedSvg} ${r.beds}</div>`);
    if (r.baths) specs.push(`<div class="prop-card-spec">${bathSvg} ${r.baths}</div>`);
    if (r.sqm)   specs.push(`<div class="prop-card-spec">${sqmSvg} ${r.sqm} m²</div>`);

    return `
      <div class="prop-card">
        ${thumbHtml}
        <div class="prop-card-body">
          <div class="prop-card-title">${r.title}</div>
          <div class="prop-card-loc">${locSvg} ${r.location || 'Sin ubicación'}</div>
          <div class="prop-card-price">${fmtAR(r.price_ars)}/mes</div>
          ${r.expenses > 0 ? `<div class="crud-expenses-label">+ ${fmtAR(r.expenses)} expensas</div>` : ''}

          ${specs.length ? `<div class="prop-card-specs">${specs.join('')}</div>` : ''}

          <div class="crud-tags-row">
            ${rentalStatusBadge(r.status)}
            ${r.featured ? '<span class="admin-status-badge admin-prop-featured">★ Destacado</span>' : ''}
            ${r.furnished ? '<span class="admin-status-badge crud-badge-furnished">Amoblado</span>' : ''}
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
            ${r.status !== 'disponible'
              ? `<button class="btn btn-success btn-icon" data-action="setRentalStatus" data-rid="${r.id}" data-status="disponible" title="Disponible">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                 </button>`
              : ''}
            ${r.status !== 'alquilada'
              ? `<button class="btn btn-warn btn-icon" data-action="setRentalStatus" data-rid="${r.id}" data-status="alquilada" title="Alquilada">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                 </button>`
              : ''}
            ${r.status !== 'oculta'
              ? `<button class="btn btn-ghost btn-icon" data-action="setRentalStatus" data-rid="${r.id}" data-status="oculta" title="Ocultar">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                 </button>`
              : ''}
            <button class="btn btn-danger btn-icon" data-action="confirmDeleteRental" data-rid="${r.id}" title="Eliminar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }).join('') + paginationRentalHTML(totalPages);
}

function paginationRentalHTML(totalPages) {
  if (totalPages <= 1) return '';
  const prevDisabled = _rPage <= 1;
  const nextDisabled = _rPage >= totalPages;
  const maxVisible = 7;

  let pages = [];
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let left  = Math.max(2, _rPage - 2);
    let right = Math.min(totalPages - 1, _rPage + 2);
    if (left > 2) pages.push('…');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('…');
    pages.push(totalPages);
  }

  const pageBtns = pages.map(p =>
    p === '…'
      ? `<span class="page-dots">…</span>`
      : `<button type="button" class="page-btn${p === _rPage ? ' page-btn--active' : ''}"
                 data-action="goToRentalPage" data-page="${p}">${p}</button>`
  ).join('');

  return `
    <div class="pagination">
      <button type="button" class="page-btn page-btn--nav" data-action="goToRentalPage" data-page="${_rPage - 1}"
              ${prevDisabled ? 'disabled' : ''}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Anterior
      </button>
      <div class="page-numbers">${pageBtns}</div>
      <button type="button" class="page-btn page-btn--nav" data-action="goToRentalPage" data-page="${_rPage + 1}"
              ${nextDisabled ? 'disabled' : ''}>
        Siguiente
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>`;
}
