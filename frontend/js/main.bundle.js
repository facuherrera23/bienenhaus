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

  // js/_public-concat-tmp.js
  var _filters = { search: "", type: "all", priceMin: "", priceMax: "", beds: "all", status: "all" };
  var _sort = "default";
  var _allLoadedProps = [];
  var _filterTimer = null;
  var _page = 1;
  var _rFilters = { search: "", type: "all", priceMin: "", priceMax: "", beds: "all", furnished: "" };
  var _rSort = "default";
  var _rFilterTimer = null;
  var _rPage = 1;
  function goToPage(n) {
    _page = n;
    applyFilters();
  }
  window.goToPage = goToPage;
  function goToRentalPage(n) {
    _rPage = n;
    applyRentalFilters();
  }
  window.goToRentalPage = goToRentalPage;
  function currentFilters() {
    return __spreadValues({}, _filters);
  }
  window.currentFilters = currentFilters;
  var PRICE_MAX = 5e5;
  var sliderMin = document.getElementById("sliderMin");
  var sliderMax = document.getElementById("sliderMax");
  function fmtSlider(v) {
    if (v >= PRICE_MAX) return "Sin l\xEDmite";
    return `USD ${Number(v).toLocaleString("es-AR")}`;
  }
  function updateSlider() {
    if (!sliderMin || !sliderMax) return;
    let min = parseInt(sliderMin.value);
    let max = parseInt(sliderMax.value);
    if (min > max - 5e3) {
      min = max - 5e3;
      sliderMin.value = min;
    }
    const minLbl = document.getElementById("sliderMinLabel");
    const maxLbl = document.getElementById("sliderMaxLabel");
    const rangeLbl = document.getElementById("sliderRangeLabel");
    const range = document.getElementById("sliderRange");
    if (minLbl) minLbl.textContent = fmtSlider(min);
    if (maxLbl) maxLbl.textContent = fmtSlider(max);
    if (rangeLbl) rangeLbl.textContent = fmtSlider(min) + " \u2014 " + fmtSlider(max);
    if (range) {
      const pMin = min / PRICE_MAX * 100;
      const pMax = max / PRICE_MAX * 100;
      range.style.left = pMin + "%";
      range.style.width = pMax - pMin + "%";
    }
    _filters.priceMin = min > 0 ? min : "";
    _filters.priceMax = max < PRICE_MAX ? max : "";
    applyFilters();
  }
  sliderMin == null ? void 0 : sliderMin.addEventListener("input", updateSlider);
  sliderMax == null ? void 0 : sliderMax.addEventListener("input", updateSlider);
  if (sliderMin && sliderMax) updateSlider();
  var _a;
  (_a = document.getElementById("fSort")) == null ? void 0 : _a.addEventListener("change", (e) => {
    _sort = e.target.value;
    _page = 1;
    applyFilters();
  });
  function applyFilters() {
    clearTimeout(_filterTimer);
    _filterTimer = setTimeout(async () => {
      showSkeletons();
      try {
        const filters = __spreadProps(__spreadValues({}, _filters), { page: _page, sort: _sort, per_page: PER_PAGE });
        const data = await API.getProperties(filters);
        const props = data.properties;
        _allLoadedProps = props;
        renderProperties(props, { page: data.page, pages: data.pages, total: data.total, has_prev: data.has_prev, has_next: data.has_next });
        if (props.length) setTimeout(revealCards, 50);
        updateFilterChips();
      } catch (err) {
        showError("propsGrid", "Error al cargar propiedades. \xBFEst\xE1 corriendo el servidor?");
      }
    }, 350);
  }
  function bindFilter(id, key, event = "input") {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(event, () => {
      _filters[key] = el.value;
      applyFilters();
    });
  }
  bindFilter("fSearch", "search");
  bindFilter("fType", "type", "change");
  bindFilter("fBeds", "beds", "change");
  bindFilter("fStatus", "status", "change");
  var _a2;
  (_a2 = document.getElementById("fReset")) == null ? void 0 : _a2.addEventListener("click", () => {
    _filters = { search: "", type: "all", priceMin: "", priceMax: "", beds: "all", status: "all" };
    _sort = "default";
    _page = 1;
    ["fSearch"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    ["fType", "fBeds", "fStatus", "fSort"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = id === "fSort" ? "default" : "all";
    });
    if (sliderMin) sliderMin.value = 0;
    if (sliderMax) sliderMax.value = PRICE_MAX;
    updateSlider();
    applyFilters();
  });
  function applyRentalFilters() {
    clearTimeout(_rFilterTimer);
    _rFilterTimer = setTimeout(async () => {
      showRentalSkeletons();
      try {
        const filters = __spreadProps(__spreadValues({}, _rFilters), { page: _rPage, sort: _rSort, per_page: PER_PAGE });
        const data = await API.getRentals(filters);
        const rlist = data.rentals || [];
        renderRentalsIndex(rlist);
        renderRentalPagination(data);
        if (rlist.length) setTimeout(revealCards, 50);
        updateFilterChips();
      } catch (err) {
        const rg = document.getElementById("rentalsGridIndex");
        if (rg) rg.innerHTML = '<div class="loading-state">Error al cargar alquileres.</div>';
      }
    }, 350);
  }
  function updateFilterChips() {
    const wrap = document.getElementById("activeChips");
    if (!wrap) return;
    const isRent = _activeTab === "alquiler";
    const f = isRent ? _rFilters : _filters;
    const sorter = isRent ? _rSort : _sort;
    const chips = [];
    if (f.search)
      chips.push('<span class="filter-chip" data-key="search">"' + f.search + '"<button class="filter-chip-remove" data-key="search">&times;</button></span>');
    if (f.type && f.type !== "all") {
      const labels = { casa: "Casa", departamento: "Depto", finca: "Finca", terreno: "Terreno", local: "Local", otro: "Otro" };
      chips.push('<span class="filter-chip" data-key="type">' + (labels[f.type] || f.type) + '<button class="filter-chip-remove" data-key="type">&times;</button></span>');
    }
    if (f.beds && f.beds !== "all")
      chips.push('<span class="filter-chip" data-key="beds">' + f.beds + ' dorm.<button class="filter-chip-remove" data-key="beds">&times;</button></span>');
    if (f.status && f.status !== "all") {
      const slabel = f.status === "alquilada" ? "Alquilada" : f.status === "vendida" ? "Vendida" : "Disponible";
      chips.push('<span class="filter-chip" data-key="status">' + slabel + '<button class="filter-chip-remove" data-key="status">&times;</button></span>');
    }
    if (f.furnished === "true")
      chips.push('<span class="filter-chip" data-key="furnished">Amoblado<button class="filter-chip-remove" data-key="furnished">&times;</button></span>');
    if (f.priceMin || f.priceMax) {
      const min = f.priceMin || "0";
      const max = f.priceMax || "\u221E";
      chips.push('<span class="filter-chip" data-key="price">USD ' + Number(min).toLocaleString("es-AR") + "\u2013" + (max === "\u221E" ? "sin l\xEDmite" : Number(max).toLocaleString("es-AR")) + '<button class="filter-chip-remove" data-key="price">&times;</button></span>');
    }
    if (sorter && sorter !== "default") {
      const sortLabels = { price_asc: "Menor precio", price_desc: "Mayor precio", newest: "M\xE1s nuevos", oldest: "M\xE1s antiguos" };
      chips.push('<span class="filter-chip" data-key="sort">' + (sortLabels[sorter] || sorter) + '<button class="filter-chip-remove" data-key="sort">&times;</button></span>');
    }
    wrap.innerHTML = chips.join("");
    wrap.querySelectorAll(".filter-chip-remove").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const key = btn.dataset.key;
        const ff = _activeTab === "alquiler" ? _rFilters : _filters;
        if (key === "price") {
          ff.priceMin = "";
          ff.priceMax = "";
          if (sliderMin) sliderMin.value = 0;
          if (sliderMax) sliderMax.value = PRICE_MAX;
          if (typeof updateSlider === "function") updateSlider();
        } else if (key === "search") {
          ff.search = "";
          const el = document.getElementById("fSearch");
          if (el) el.value = "";
        } else if (key === "furnished") {
          ff.furnished = "";
          const el = document.getElementById("fFurnished");
          if (el) el.checked = false;
        } else if (key === "sort") {
          if (_activeTab === "alquiler") {
            _rSort = "default";
          } else {
            _sort = "default";
          }
          const sel = document.getElementById("fSort");
          if (sel) sel.value = "default";
        } else {
          ff[key] = "all";
          const mid = key === "type" ? "fType" : key === "beds" ? "fBeds" : "fStatus";
          const el = document.getElementById(mid);
          if (el) el.value = "all";
        }
        if (_activeTab === "alquiler") {
          _rPage = 1;
          applyRentalFilters();
        } else {
          _page = 1;
          applyFilters();
        }
      });
    });
  }
  function switchTab(tab) {
    _activeTab = tab;
    document.querySelectorAll(".prop-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    const saleGrid = document.getElementById("propsGrid");
    const rentGrid = document.getElementById("rentalsGridIndex");
    const salePag = document.getElementById("pagination");
    const rentPag = document.getElementById("rentalPaginationIndex");
    if (tab === "venta") {
      saleGrid.classList.remove("hidden");
      rentGrid.classList.add("hidden");
      salePag.classList.remove("hidden");
      rentPag.classList.add("hidden");
      if (!saleGrid.querySelector(".prop-card")) applyFilters();
    } else {
      saleGrid.classList.add("hidden");
      rentGrid.classList.remove("hidden");
      salePag.classList.add("hidden");
      rentPag.classList.remove("hidden");
      if (!rentGrid.querySelector(".prop-card")) applyRentalFilters();
    }
  }
  window.switchTab = switchTab;
  function initTabs() {
    document.querySelectorAll(".prop-tab").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
    const rentGrid = document.getElementById("rentalsGridIndex");
    const rentPag = document.getElementById("rentalPaginationIndex");
    const salePag = document.getElementById("pagination");
    if (rentGrid) rentGrid.classList.add("hidden");
    if (rentPag) rentPag.classList.add("hidden");
    if (salePag) salePag.classList.remove("hidden");
  }
  window.initTabs = initTabs;
  function fmtAR(n) {
    return `AR$ ${Number(n).toLocaleString("es-AR")}/mes`;
  }
  function buildRentalCard(rental) {
    const images = rental.images || [];
    const hasImgs = images.length > 0;
    const isRented = rental.status === "alquilada";
    const statusMap = {
      disponible: { cls: "badge-disponible", label: "Disponible" },
      alquilada: { cls: "badge-vendida", label: "Alquilada" }
    };
    const sd = statusMap[rental.status] || statusMap.disponible;
    const n = images.length;
    const dotsHtml = n > 1 ? `<div class="carousel-dots">${images.map((_, i) => `<button class="carousel-dot${i === 0 ? " active" : ""}" data-i="${i}"></button>`).join("")}</div>` : "";
    const arrowsHtml = n > 1 ? `<button class="carousel-arrow left" data-dir="-1">&#8249;</button>
       <button class="carousel-arrow right" data-dir="1">&#8250;</button>` : "";
    const etitle = esc(rental.title);
    const eloc = esc(rental.location);
    const edesc = esc(rental.desc || "");
    const priceBadge = isRented ? '<span class="badge-price sold">Alquilada</span>' : `<span class="badge-price">${fmtAR(rental.price_ars)}</span>`;
    return `
    <div class="prop-card${isRented ? " sold" : ""}"
         data-images='${JSON.stringify(images)}'>
      <div class="card-img-wrap">
        ${hasImgs ? `<img class="card-img" ${imgAttrs(images[0], [400, 800])} alt="${etitle}" loading="lazy" decoding="async"
               onerror="this.src='https://picsum.photos/seed/fallback/900/600'"/>` : `<div class="card-no-img">Sin imagen</div>`}
        <div class="card-gradient"></div>
        <div class="badge badge-status ${sd.cls}">${sd.label}</div>
        <div class="badge badge-type">${esc(rental.type || "")}</div>
        ${rental.featured ? '<div class="badge badge-featured">Destacado</div>' : ""}
        ${priceBadge}
        ${arrowsHtml}
        ${dotsHtml}
      </div>
      <div class="card-body">
        <div class="card-location">${eloc}</div>
        <a href="/alquiler/${rental.id}" class="card-title-link"><h3 class="card-title">${etitle}</h3></a>
        <p class="card-desc">${edesc}</p>
        <div class="card-specs">
          <div class="spec"><div class="spec-n">${rental.beds || "\u2014"}</div><div class="spec-l">dorms.</div></div>
          <div class="spec"><div class="spec-n">${rental.baths || "\u2014"}</div><div class="spec-l">ba\xF1os</div></div>
          <div class="spec"><div class="spec-n">${rental.sqm || ""}m\xB2</div><div class="spec-l">sup.</div></div>
        </div>
        <div class="card-footer">
          <a href="/alquiler/${rental.id}" class="btn btn-ghost btn-sm">Ver detalle</a>
           <a href="https://wa.me/${_wa()}?text=Hola%20Bienenhaus%2C%20me%20interesa%20el%20alquiler%20${encodeURIComponent(rental.title)}"
             target="_blank" class="btn btn-outline btn-sm">Consultar</a>
        </div>
      </div>
    </div>`;
  }
  function renderRentalsIndex(rentals) {
    const grid = document.getElementById("rentalsGridIndex");
    if (!grid) return;
    if (!rentals.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-title">Sin resultados</div><div class="empty-sub">Proximamente m\xE1s alquileres.</div></div>`;
      return;
    }
    grid.innerHTML = rentals.map(buildRentalCard).join("");
    grid.querySelectorAll(".prop-card").forEach(initCarousel);
  }
  function renderRentalPagination(pag) {
    const wrap = document.getElementById("rentalPaginationIndex");
    if (!wrap) return;
    if (!pag || pag.pages <= 1) {
      wrap.innerHTML = "";
      return;
    }
    const p = pag.page, pages = pag.pages;
    let html = '<div class="pag-inner">';
    html += `<button class="pag-btn" onclick="goToRentalPage(${p - 1})" ${pag.has_prev ? "" : "disabled"}>\u2039 Anterior</button>`;
    const maxVisible = 5;
    let start = Math.max(1, p - Math.floor(maxVisible / 2));
    let end = Math.min(pages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    if (start > 1) {
      html += `<button class="pag-num" onclick="goToRentalPage(1)">1</button>`;
      if (start > 2) html += '<span class="pag-dots">\u2026</span>';
    }
    for (let i = start; i <= end; i++) html += `<button class="pag-num${i === p ? " pag-active" : ""}" onclick="goToRentalPage(${i})">${i}</button>`;
    if (end < pages) {
      if (end < pages - 1) html += '<span class="pag-dots">\u2026</span>';
      html += `<button class="pag-num" onclick="goToRentalPage(${pages})">${pages}</button>`;
    }
    html += `<button class="pag-btn" onclick="goToRentalPage(${p + 1})" ${pag.has_next ? "" : "disabled"}>Siguiente \u203A</button>`;
    html += "</div>";
    wrap.innerHTML = html;
  }
  function showSkeletons(n = 6) {
    const grid = document.getElementById("propsGrid");
    if (!grid) return;
    grid.innerHTML = Array.from({ length: n }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line w-30"></div>
        <div class="skeleton skeleton-line w-80 h-20"></div>
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton-specs">
          <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
        </div>
        <div class="skeleton skeleton-line w-100"></div>
      </div>
    </div>`).join("");
  }
  function showRentalSkeletons(n = 6) {
    const grid = document.getElementById("rentalsGridIndex");
    if (!grid) return;
    grid.innerHTML = Array.from({ length: n }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line w-30"></div>
        <div class="skeleton skeleton-line w-80 h-20"></div>
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton-specs">
          <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
        </div>
        <div class="skeleton skeleton-line w-100"></div>
      </div>
    </div>`).join("");
  }
  function initContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;
    document.getElementById("cf_ts").value = Date.now();
    const motivoSel = document.getElementById("cf_motivo");
    const tasacionFields = document.getElementById("cfTasacionFields");
    if (motivoSel && tasacionFields) {
      motivoSel.addEventListener("change", function() {
        const show = motivoSel.value === "tasacion";
        tasacionFields.style.display = show ? "block" : "none";
        const msg = document.getElementById("cf_message");
        if (msg) msg.required = !show;
        const btn = document.getElementById("cf_submit");
        if (btn) btn.textContent = show ? "Solicitar tasaci\xF3n" : "Enviar mensaje";
      });
    }
    form.addEventListener("submit", async (e) => {
      var _a7;
      e.preventDefault();
      const submitBtn = document.getElementById("cf_submit");
      const msgEl = document.getElementById("cfMsg");
      if (document.getElementById("cf_website").value) return;
      const name = document.getElementById("cf_name").value.trim();
      const motivo = motivoSel ? motivoSel.value : "";
      const phone = document.getElementById("cf_phone").value.trim();
      const city = ((_a7 = document.getElementById("cf_city")) == null ? void 0 : _a7.value.trim()) || "";
      if (motivo === "tasacion") {
        if (!name || !phone || !city) {
          msgEl.textContent = "Complet\xE1 nombre, tel\xE9fono y zona.";
          msgEl.className = "cf-msg cf-msg--err";
          return;
        }
      } else {
        const message = document.getElementById("cf_message").value.trim();
        if (!name || !message) {
          msgEl.textContent = "Complet\xE1 nombre y mensaje.";
          msgEl.className = "cf-msg cf-msg--err";
          return;
        }
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
      const payload = {
        name,
        email: document.getElementById("cf_email").value.trim(),
        phone,
        _ts: document.getElementById("cf_ts").value,
        _website: document.getElementById("cf_website").value
      };
      try {
        let res;
        if (motivo === "tasacion") {
          payload.property_type = document.getElementById("cf_property_type").value;
          payload.motivo = "tasacion";
          payload.city = city;
          payload.address = document.getElementById("cf_address").value.trim();
          payload.comments = document.getElementById("cf_message").value.trim();
          res = await API.sendTasacion(payload);
        } else {
          payload.message = document.getElementById("cf_message").value.trim();
          if (motivo) payload.motivo = motivo;
          res = await API.sendContact(payload);
        }
        if (res && res.ok !== false) {
          msgEl.textContent = motivo === "tasacion" ? "\u2713 Solicitud de tasaci\xF3n recibida. Te contactaremos pronto." : "\u2713 Mensaje enviado. Te contactaremos pronto.";
          msgEl.className = "cf-msg cf-msg--ok";
          form.reset();
          document.getElementById("cf_ts").value = Date.now();
          if (tasacionFields) tasacionFields.style.display = "none";
          if (motivoSel) motivoSel.value = "";
          if (document.getElementById("cf_submit")) document.getElementById("cf_submit").textContent = "Enviar mensaje";
        } else {
          msgEl.textContent = res && res.error || "Error al enviar.";
          msgEl.className = "cf-msg cf-msg--err";
        }
      } catch (e2) {
        msgEl.textContent = "Error de conexi\xF3n.";
        msgEl.className = "cf-msg cf-msg--err";
      }
      submitBtn.disabled = false;
      submitBtn.textContent = motivoSel && motivoSel.value === "tasacion" ? "Solicitar tasaci\xF3n" : "Enviar mensaje";
    });
  }
  window._whatsapp = "5493510000000";
  window._whatsapp2 = "";
  var PER_PAGE = 6;
  window.fmtPriceARS = function(n, short) {
    return window.formatPrice ? window.formatPrice(n, "ARS") : "ARS " + Number(n).toLocaleString("es-AR");
  };
  function _wa() {
    const nums = [window._whatsapp || "5493510000000"];
    if (window._whatsapp2) nums.push(window._whatsapp2);
    return nums[Math.floor(Math.random() * nums.length)];
  }
  var _activeTab = "venta";
  function goToPage(n) {
    _page = n;
    applyFilters();
  }
  window.goToPage = goToPage;
  function goToRentalPage(n) {
    _rPage = n;
    applyRentalFilters();
  }
  window.goToRentalPage = goToRentalPage;
  function currentFilters() {
    return __spreadValues({}, _filters);
  }
  window.currentFilters = currentFilters;
  var DEMO_PROPERTIES = [
    {
      id: 101,
      title: "Casa en Nueva C\xF3rdoba - 3 Dormitorios",
      type: "casa",
      location: "Nueva C\xF3rdoba, C\xF3rdoba Capital",
      price: 185e3,
      beds: 3,
      baths: 2,
      sqm: 120,
      sqm_total: 180,
      parkings: 2,
      antiquity: "10 a\xF1os",
      status: "disponible",
      featured: true,
      description: "Hermosa casa ubicada en el coraz\xF3n de Nueva C\xF3rdoba, a metros de la Ciudad Universitaria. Cuenta con amplio living comedor, cocina integrada con anafe, horno y campana. Tres dormitorios con placares incorporados, el principal con ba\xF1o en suite. Patio con parrilla y jard\xEDn. Cochera cubierta para dos autos. Excelente iluminaci\xF3n natural y ventilaci\xF3n cruzada.",
      images: [
        "/images/propiedades/casa-nueva-cordoba-1.webp",
        "/images/propiedades/casa-nueva-cordoba-2.webp",
        "/images/propiedades/casa-nueva-cordoba-3.webp"
      ],
      latitude: -31.4216,
      longitude: -64.1888
    },
    {
      id: 102,
      title: "Departamento en Centro - 2 Ambientes",
      type: "departamento",
      location: "Centro, C\xF3rdoba Capital",
      price: 125e3,
      beds: 2,
      baths: 1,
      sqm: 55,
      sqm_total: 65,
      parkings: 1,
      antiquity: "5 a\xF1os",
      status: "disponible",
      featured: true,
      description: "Moderno departamento en el centro de la ciudad, totalmente amoblado. Living comedor con cocina tipo americana, balc\xF3n con vista a la calle. Dormitorio con cama queen y placard. Ba\xF1o completo con artefactos nuevos. A pasos de peatonal, supermercados y transporte p\xFAblico. Expensas incluyen agua y mantenimiento de espacios comunes.",
      images: [
        "/images/propiedades/depto-centro-1.webp",
        "/images/propiedades/depto-centro-2.webp",
        "/images/propiedades/depto-centro-3.webp"
      ],
      latitude: -31.4135,
      longitude: -64.181
    },
    {
      id: 103,
      title: "Casa en Barrio Jard\xEDn - 4 Dormitorios",
      type: "casa",
      location: "Barrio Jard\xEDn, C\xF3rdoba Capital",
      price: 32e4,
      beds: 4,
      baths: 3,
      sqm: 280,
      sqm_total: 450,
      parkings: 3,
      antiquity: "15 a\xF1os",
      status: "disponible",
      featured: true,
      description: "Imponente casa en Barrio Jard\xEDn, una de las zonas m\xE1s exclusivas de C\xF3rdoba. Living comedor doble altura, cocina integrada con isla, toilette de recepci\xF3n. Master suite con vestidor y ba\xF1o con hidromasaje. Tres dormitorios adicionales con placares. Quincho cerrado con parrilla, piscina, jard\xEDn parquizado. Cochera para 3 autos.",
      images: [
        "/images/propiedades/casa-barrio-jardin-1.webp",
        "/images/propiedades/casa-barrio-jardin-2.webp",
        "/images/propiedades/casa-barrio-jardin-3.webp"
      ],
      latitude: -31.4321,
      longitude: -64.2012
    },
    {
      id: 104,
      title: "Departamento en G\xFCemes - 1 Dormitorio",
      type: "departamento",
      location: "G\xFCemes, C\xF3rdoba Capital",
      price: 95e3,
      beds: 1,
      baths: 1,
      sqm: 45,
      sqm_total: 50,
      parkings: 0,
      antiquity: "3 a\xF1os",
      status: "disponible",
      featured: false,
      description: "Moderno monoambiente divisio en G\xFCemes, zona gastron\xF3mica y cultural. Cocina integrada, balc\xF3n con vista al cerro. Ba\xF1o completo moderno. Ideal para estudiante o profesional soltero. A metros de la Ca\xF1ada y transporte p\xFAblico.",
      images: [
        "/images/propiedades/depto-guemes-1.webp",
        "/images/propiedades/depto-guemes-2.webp"
      ],
      latitude: -31.4189,
      longitude: -64.1855
    },
    {
      id: 105,
      title: "Terreno en Barrio Cerrado - 800 m\xB2",
      type: "terreno",
      location: "Malague\xF1o, C\xF3rdoba",
      price: 85e3,
      beds: 0,
      baths: 0,
      sqm: 800,
      sqm_total: 800,
      parkings: 0,
      antiquity: "0 a\xF1os",
      status: "disponible",
      featured: true,
      description: "Lote de 800 m\xB2 en barrio cerrado con seguridad 24hs, club house, pileta, canchas de tenis y f\xFAtbol. Servicios de luz, agua, gas y cloacas por tendido. Acceso directo desde ruta. Ideal para construir la casa de tus sue\xF1os.",
      images: [
        "/images/propiedades/terreno-malague\xF1o-1.webp",
        "/images/propiedades/terreno-malague\xF1o-2.webp"
      ],
      latitude: -31.3892,
      longitude: -64.2567
    },
    {
      id: 106,
      title: "Local Comercial en Zona Norte - 120 m\xB2",
      type: "local",
      location: "Zona Norte, C\xF3rdoba Capital",
      price: 15e4,
      beds: 0,
      baths: 1,
      sqm: 120,
      sqm_total: 120,
      parkings: 2,
      antiquity: "8 a\xF1os",
      status: "disponible",
      featured: false,
      description: "Local comercial en excelente ubicaci\xF3n sobre avenida principal. 120 m\xB2 en planta baja, ba\xF1o, oficina privada, dep\xF3sito. Aire acondicionado, persianas automatizadas. Ideal para oficina, showroom o local gastron\xF3mico. Alto tr\xE1nsito vehicular y peatonal.",
      images: [
        "/images/propiedades/local-zona-norte-1.webp",
        "/images/propiedades/local-zona-norte-2.webp"
      ],
      latitude: -31.3892,
      longitude: -64.2567
    }
  ];
  var DEMO_RENTALS = [
    {
      id: 201,
      title: "Departamento en Nueva C\xF3rdoba - 2 Ambientes",
      type: "departamento",
      location: "Nueva C\xF3rdoba, C\xF3rdoba Capital",
      price_ars: 28e4,
      beds: 2,
      baths: 1,
      sqm: 55,
      sqm_total: 65,
      status: "disponible",
      featured: true,
      min_months: 12,
      furnished: true,
      description: "Modern apartment in Nueva C\xF3rdoba, fully furnished. 2 bedrooms, 1 bathroom, balcony. Fully equipped kitchen, AC, WiFi included. Building with amenities: pool, gym, SUM, laundry. 12 month minimum lease.",
      images: [
        "/images/alquileres/depto-nueva-cordoba-1.webp",
        "/images/alquileres/depto-nueva-cordoba-2.webp"
      ],
      latitude: -31.4216,
      longitude: -64.1888
    },
    {
      id: 202,
      title: "Casa en Cerro de las Rosas - 3 Dormitorios",
      type: "casa",
      location: "Cerro de las Rosas, C\xF3rdoba Capital",
      price_ars: 45e4,
      beds: 3,
      baths: 2,
      sqm: 140,
      sqm_total: 200,
      status: "disponible",
      featured: true,
      min_months: 12,
      furnished: true,
      description: "Beautiful house in Cerro de las Rosas, fully furnished. 3 bedrooms, 2 bathrooms, garden, garage. Quiet neighborhood, close to schools and shopping. 12 month minimum lease.",
      images: [
        "/images/alquileres/casa-cerro-rosas-1.webp",
        "/images/alquileres/casa-cerro-rosas-2.webp"
      ],
      latitude: -31.4156,
      longitude: -64.2012
    },
    {
      id: 203,
      title: "Local Comercial en G\xFCemes - 80 m\xB2",
      type: "local",
      location: "G\xFCemes, C\xF3rdoba Capital",
      price_ars: 35e4,
      beds: 0,
      baths: 1,
      sqm: 80,
      sqm_total: 80,
      status: "disponible",
      featured: true,
      min_months: 24,
      furnished: false,
      description: "Commercial space in trendy G\xFCemes neighborhood. 80m\xB2 open plan, bathroom, high ceilings, large windows. Ideal for retail, showroom, or cafe. High foot traffic area.",
      images: [
        "/images/alquileres/local-guemes-1.webp",
        "/images/alquileres/local-guemes-2.webp"
      ],
      latitude: -31.4189,
      longitude: -64.1855
    }
  ];
  var DEMO_AGENTS = [
    {
      id: 1,
      name: "Mar\xEDa",
      last: "Gonz\xE1lez",
      years: 12,
      license_number: "CPI 4.234",
      specialty: "Venta de propiedades premium",
      phone: "+54 351 411-0001",
      whatsapp: "+5493515000001",
      email: "maria.gonzalez@bienenhaus.com.ar",
      avatar: "/images/agentes/maria-gonzalez.webp"
    },
    {
      id: 2,
      name: "Carlos",
      last: "Rodr\xEDguez",
      years: 8,
      license_number: "CPI 5.123",
      specialty: "Alquileres y administraci\xF3n",
      phone: "+54 351 411-0002",
      whatsapp: "+5493515000002",
      email: "carlos.rodriguez@bienenhaus.com.ar",
      avatar: "/images/agentes/carlos-rodriguez.webp"
    },
    {
      id: 3,
      name: "Laura",
      last: "Mart\xEDnez",
      years: 15,
      license_number: "CPI 3.789",
      specialty: "Propiedades de lujo y fincas",
      phone: "+54 351 411-0003",
      whatsapp: "+5493515000003",
      email: "laura.martinez@bienenhaus.com.ar",
      avatar: "/images/agentes/laura-martinez.webp"
    },
    {
      id: 4,
      name: "Roberto",
      last: "Silva",
      years: 6,
      license_number: "CPI 6.045",
      specialty: "Inversiones y desarrollos",
      phone: "+54 351 411-0004",
      whatsapp: "+5493515000004",
      email: "roberto.silva@bienenhaus.com.ar",
      avatar: "/images/agentes/roberto-silva.webp"
    }
  ];
  function mergeWithDemo(apiData, demoData, key = "id") {
    if (!apiData || !apiData.length) return demoData;
    const apiIds = new Set(apiData.map((item) => item.id));
    const uniqueDemo = demoData.filter((item) => !apiIds.has(item.id));
    return [...apiData, ...uniqueDemo];
  }
  function mergeProperties(apiProps) {
    return mergeWithDemo(apiProps, DEMO_PROPERTIES);
  }
  function mergeRentals(apiRentals) {
    return mergeWithDemo(apiRentals, DEMO_RENTALS);
  }
  function mergeAgents(apiAgents) {
    return mergeWithDemo(apiAgents, DEMO_AGENTS);
  }
  window.DEMO_PROPERTIES = DEMO_PROPERTIES;
  window.DEMO_RENTALS = DEMO_RENTALS;
  window.DEMO_AGENTS = DEMO_AGENTS;
  window.mergeProperties = mergeProperties;
  window.mergeRentals = mergeRentals;
  window.mergeAgents = mergeAgents;
  window.getDemoProperties = () => DEMO_PROPERTIES;
  window.getDemoRentals = () => DEMO_RENTALS;
  window.getDemoAgents = () => DEMO_AGENTS;
  window.mergeProperties = mergeProperties;
  window.mergeRentals = mergeRentals;
  window.mergeAgents = mergeAgents;
  window.getDemoProperties = () => DEMO_PROPERTIES;
  window.getDemoRentals = () => DEMO_RENTALS;
  window.getDemoAgents = () => DEMO_AGENTS;
  function switchTab(tab) {
    _activeTab = tab;
    document.querySelectorAll(".prop-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    const saleGrid = document.getElementById("propsGrid");
    const rentGrid = document.getElementById("rentalsGridIndex");
    const salePag = document.getElementById("pagination");
    const rentPag = document.getElementById("rentalPaginationIndex");
    if (tab === "venta") {
      saleGrid.classList.remove("hidden");
      rentGrid.classList.add("hidden");
      salePag.classList.remove("hidden");
      rentPag.classList.add("hidden");
      if (!saleGrid.querySelector(".prop-card")) applyFilters();
    } else {
      saleGrid.classList.add("hidden");
      rentGrid.classList.remove("hidden");
      salePag.classList.add("hidden");
      rentPag.classList.remove("hidden");
      if (!rentGrid.querySelector(".prop-card")) applyRentalFilters();
    }
  }
  window.switchTab = switchTab;
  function initTabs() {
    document.querySelectorAll(".prop-tab").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
    const rentGrid = document.getElementById("rentalsGridIndex");
    const rentPag = document.getElementById("rentalPaginationIndex");
    const salePag = document.getElementById("pagination");
    if (rentGrid) rentGrid.classList.add("hidden");
    if (rentPag) rentPag.classList.add("hidden");
    if (salePag) salePag.classList.remove("hidden");
  }
  window.initTabs = initTabs;
  function fmtAR(n) {
    return `AR$ ${Number(n).toLocaleString("es-AR")}/mes`;
  }
  function buildRentalCard(rental) {
    const images = rental.images || [];
    const hasImgs = images.length > 0;
    const isRented = rental.status === "alquilada";
    const statusMap = {
      disponible: { cls: "badge-disponible", label: "Disponible" },
      alquilada: { cls: "badge-vendida", label: "Alquilada" }
    };
    const sd = statusMap[rental.status] || statusMap.disponible;
    const n = images.length;
    const dotsHtml = n > 1 ? `<div class="carousel-dots">${images.map((_, i) => `<button class="carousel-dot${i === 0 ? " active" : ""}" data-i="${i}"></button>`).join("")}</div>` : "";
    const arrowsHtml = n > 1 ? `<button class="carousel-arrow left" data-dir="-1">&#8249;</button>
       <button class="carousel-arrow right" data-dir="1">&#8250;</button>` : "";
    const etitle = esc(rental.title);
    const eloc = esc(rental.location);
    const edesc = esc(rental.desc || "");
    const priceBadge = isRented ? '<span class="badge-price sold">Alquilada</span>' : `<span class="badge-price">${fmtAR(rental.price_ars)}</span>`;
    return `
    <div class="prop-card${isRented ? " sold" : ""}"
         data-images='${JSON.stringify(images)}'>
      <div class="card-img-wrap">
        ${hasImgs ? `<img class="card-img" ${imgAttrs(images[0], [400, 800])} alt="${etitle}" loading="lazy" decoding="async"
               onerror="this.src='https://picsum.photos/seed/fallback/900/600'"/>` : `<div class="card-no-img">Sin imagen</div>`}
        <div class="card-gradient"></div>
        <div class="badge badge-status ${sd.cls}">${sd.label}</div>
        <div class="badge badge-type">${esc(rental.type || "")}</div>
        ${rental.featured ? '<div class="badge badge-featured">Destacado</div>' : ""}
        ${priceBadge}
        ${arrowsHtml}
        ${dotsHtml}
      </div>
      <div class="card-body">
        <div class="card-location">${eloc}</div>
        <a href="/alquiler/${rental.id}" class="card-title-link"><h3 class="card-title">${etitle}</h3></a>
        <p class="card-desc">${edesc}</p>
        <div class="card-specs">
          <div class="spec"><div class="spec-n">${rental.beds || "\u2014"}</div><div class="spec-l">dorms.</div></div>
          <div class="spec"><div class="spec-n">${rental.baths || "\u2014"}</div><div class="spec-l">ba\xF1os</div></div>
          <div class="spec"><div class="spec-n">${rental.sqm || ""}m\xB2</div><div class="spec-l">sup.</div></div>
        </div>
        <div class="card-footer">
          <a href="/alquiler/${rental.id}" class="btn btn-ghost btn-sm">Ver detalle</a>
           <a href="https://wa.me/${_wa()}?text=Hola%20Bienenhaus%2C%20me%20interesa%20el%20alquiler%20${encodeURIComponent(rental.title)}"
             target="_blank" class="btn btn-outline btn-sm">Consultar</a>
        </div>
      </div>
    </div>`;
  }
  function renderRentalsIndex(rentals) {
    const grid = document.getElementById("rentalsGridIndex");
    if (!grid) return;
    if (!rentals.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-title">Sin resultados</div><div class="empty-sub">Proximamente m\xE1s alquileres.</div></div>`;
      return;
    }
    grid.innerHTML = rentals.map(buildRentalCard).join("");
    grid.querySelectorAll(".prop-card").forEach(initCarousel);
  }
  document.getElementById("footerYear").textContent = (/* @__PURE__ */ new Date()).getFullYear();
  window.addEventListener("scroll", () => {
    document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 50);
    const btn = document.getElementById("backToTop");
    if (btn) btn.classList.toggle("visible", window.scrollY > 400);
  });
  var _a3;
  (_a3 = document.getElementById("backToTop")) == null ? void 0 : _a3.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  var _a4;
  (_a4 = document.getElementById("hamburger")) == null ? void 0 : _a4.addEventListener("click", () => {
    document.getElementById("mobileMenu").classList.toggle("open");
  });
  document.querySelectorAll(".nav-link[data-scroll]").forEach((el) => {
    el.addEventListener("click", () => {
      var _a7;
      (_a7 = document.getElementById("mobileMenu")) == null ? void 0 : _a7.classList.remove("open");
    });
  });
  document.querySelectorAll(".nav-link[data-scroll]").forEach((el) => {
    el.addEventListener("click", () => {
      var _a7;
      (_a7 = document.getElementById("mobileMenu")) == null ? void 0 : _a7.classList.remove("open");
    });
  });
  function scrollToSection(id, motivo) {
    var _a7, _b;
    (_a7 = document.getElementById(id)) == null ? void 0 : _a7.scrollIntoView({ behavior: "smooth", block: "start" });
    (_b = document.getElementById("mobileMenu")) == null ? void 0 : _b.classList.remove("open");
    if (motivo) {
      const ms = document.getElementById("cf_motivo");
      if (ms) {
        ms.value = motivo;
        ms.dispatchEvent(new Event("change"));
      }
    }
  }
  document.querySelectorAll("[data-scroll]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToSection(el.dataset.scroll, el.dataset.motivo);
      const tab = el.dataset.tab;
      if (tab && typeof switchTab === "function") switchTab(tab);
    });
  });
  function toggleFilterBar(btnId, innerId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("click", () => {
      const inner = document.getElementById(innerId);
      inner == null ? void 0 : inner.classList.toggle("open");
      btn.classList.toggle("open");
    });
  }
  toggleFilterBar("filterToggle", "filterInner");
  function fmtSlider(v) {
    if (v >= PRICE_MAX) return "Sin l\xEDmite";
    return `USD ${Number(v).toLocaleString("es-AR")}`;
  }
  function updateSlider() {
    if (!sliderMin || !sliderMax) return;
    let min = parseInt(sliderMin.value);
    let max = parseInt(sliderMax.value);
    if (min > max - 5e3) {
      min = max - 5e3;
      sliderMin.value = min;
    }
    const minLbl = document.getElementById("sliderMinLabel");
    const maxLbl = document.getElementById("sliderMaxLabel");
    const rangeLbl = document.getElementById("sliderRangeLabel");
    const range = document.getElementById("sliderRange");
    if (minLbl) minLbl.textContent = fmtSlider(min);
    if (maxLbl) maxLbl.textContent = fmtSlider(max);
    if (rangeLbl) rangeLbl.textContent = fmtSlider(min) + " \u2014 " + fmtSlider(max);
    if (range) {
      const pMin = min / PRICE_MAX * 100;
      const pMax = max / PRICE_MAX * 100;
      range.style.left = pMin + "%";
      range.style.width = pMax - pMin + "%";
    }
    _filters.priceMin = min > 0 ? min : "";
    _filters.priceMax = max < PRICE_MAX ? max : "";
    applyFilters();
  }
  sliderMin == null ? void 0 : sliderMin.addEventListener("input", updateSlider);
  sliderMax == null ? void 0 : sliderMax.addEventListener("input", updateSlider);
  if (sliderMin && sliderMax) updateSlider();
  var _a5;
  (_a5 = document.getElementById("fSort")) == null ? void 0 : _a5.addEventListener("change", (e) => {
    _sort = e.target.value;
    _page = 1;
    applyFilters();
  });
  function applyFilters() {
    clearTimeout(_filterTimer);
    _filterTimer = setTimeout(async () => {
      showSkeletons();
      try {
        const filters = __spreadProps(__spreadValues({}, _filters), { page: _page, sort: _sort, per_page: PER_PAGE });
        const data = await API.getProperties(filters);
        const props = data.properties;
        _allLoadedProps = props;
        renderProperties(props, { page: data.page, pages: data.pages, total: data.total, has_prev: data.has_prev, has_next: data.has_next });
        if (props.length) setTimeout(revealCards, 50);
      } catch (err) {
        showError("propsGrid", "Error al cargar propiedades. \xBFEst\xE1 corriendo el servidor?");
      }
    }, 350);
  }
  function bindFilter(id, key, event = "input") {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(event, () => {
      _filters[key] = el.value;
      applyFilters();
    });
  }
  bindFilter("fSearch", "search");
  bindFilter("fType", "type", "change");
  bindFilter("fBeds", "beds", "change");
  bindFilter("fStatus", "status", "change");
  var _a6;
  (_a6 = document.getElementById("fReset")) == null ? void 0 : _a6.addEventListener("click", () => {
    _filters = { search: "", type: "all", priceMin: "", priceMax: "", beds: "all", status: "all" };
    _sort = "default";
    _page = 1;
    ["fSearch"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    ["fType", "fBeds", "fStatus", "fSort"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = id === "fSort" ? "default" : "all";
    });
    if (sliderMin) sliderMin.value = 0;
    if (sliderMax) sliderMax.value = PRICE_MAX;
    updateSlider();
    applyFilters();
  });
  function applyRentalFilters() {
    clearTimeout(_rFilterTimer);
    _rFilterTimer = setTimeout(async () => {
      showRentalSkeletons();
      try {
        const filters = __spreadProps(__spreadValues({}, _rFilters), { page: _rPage, sort: _rSort, per_page: PER_PAGE });
        const data = await API.getRentals(filters);
        const rlist = data.rentals || [];
        renderRentalsIndex(rlist, data.total);
        renderRentalPagination(data);
        if (rlist.length) setTimeout(revealCards, 50);
      } catch (err) {
        const rg = document.getElementById("rentalsGridIndex");
        if (rg) rg.innerHTML = '<div class="loading-state">Error al cargar alquileres.</div>';
      }
    }, 350);
  }
  function showSkeletons(n = 6) {
    const grid = document.getElementById("propsGrid");
    if (!grid) return;
    grid.innerHTML = Array.from({ length: n }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line w-30"></div>
        <div class="skeleton skeleton-line w-80 h-20"></div>
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton-specs">
          <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
        </div>
        <div class="skeleton skeleton-line w-100"></div>
      </div>
    </div>`).join("");
  }
  function showRentalSkeletons(n = 6) {
    const grid = document.getElementById("rentalsGridIndex");
    if (!grid) return;
    grid.innerHTML = Array.from({ length: n }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line w-30"></div>
        <div class="skeleton skeleton-line w-80 h-20"></div>
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton-specs">
          <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
        </div>
        <div class="skeleton skeleton-line w-100"></div>
      </div>
    </div>`).join("");
  }
  function renderRentalPagination(pag) {
    const wrap = document.getElementById("rentalPaginationIndex");
    if (!wrap) return;
    if (!pag || pag.pages <= 1) {
      wrap.innerHTML = "";
      return;
    }
    wrap.setAttribute("aria-label", "Paginaci\xF3n");
    const p = pag.page, pages = pag.pages;
    let html = '<div class="pag-inner">';
    html += `<button class="pag-btn" onclick="goToRentalPage(${p - 1})" ${pag.has_prev ? "" : "disabled"}>\u2039 Anterior</button>`;
    const maxVisible = 5;
    let start = Math.max(1, p - Math.floor(maxVisible / 2));
    let end = Math.min(pages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    if (start > 1) {
      html += `<button class="pag-num" onclick="goToRentalPage(1)">1</button>`;
      if (start > 2) html += '<span class="pag-dots">\u2026</span>';
    }
    for (let i = start; i <= end; i++) html += `<button class="pag-num${i === p ? " pag-active" : ""}" onclick="goToRentalPage(${i})"${i === p ? ' aria-current="page"' : ""}>${i}</button>`;
    if (end < pages) {
      if (end < pages - 1) html += '<span class="pag-dots">\u2026</span>';
      html += `<button class="pag-num" onclick="goToRentalPage(${pages})">${pages}</button>`;
    }
    html += `<button class="pag-btn" onclick="goToRentalPage(${p + 1})" ${pag.has_next ? "" : "disabled"}>Siguiente \u203A</button>`;
    html += "</div>";
    wrap.innerHTML = html;
  }
  function animateCounter(el, target) {
    const duration = 1800;
    const start = performance.now();
    const isFloat = target % 1 !== 0;
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      el.textContent = isFloat ? current.toFixed(1) : Math.round(current).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function initStatsCounter() {
    const stats = document.querySelectorAll(".stat-n[data-count]");
    if (!stats.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute("data-count"));
          if (!isNaN(target)) animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    stats.forEach((el) => observer.observe(el));
  }
  function initReveal() {
    document.querySelectorAll(".section-heading, .section-alt, .about-cards, .value-cards, .contact-grid").forEach((el) => {
      el.classList.add("reveal");
    });
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
  }
  function revealCards() {
    document.querySelectorAll(".prop-card").forEach((card, i) => {
      card.classList.add("reveal-card");
      const dirs = ["reveal-left", "reveal-right", "reveal-center"];
      card.classList.add(dirs[i % 3]);
      card.style.transitionDelay = `${Math.min(i * 0.08, 0.6)}s`;
      setTimeout(() => card.classList.add("visible"), 30);
    });
  }
  async function applySettings() {
    let s;
    try {
      s = await API.getPublicSettings();
    } catch (e) {
      console.warn("Settings no disponibles, usando valores por defecto.");
      return;
    }
    window._siteSettings = s;
    window._whatsapp = s.whatsapp || "5493510000000";
    window._whatsapp2 = s.whatsapp2 || "";
    const el = (id) => document.getElementById(id);
    if (el("sitePhone")) el("sitePhone").textContent = s.phone || "";
    if (el("siteEmail")) el("siteEmail").textContent = s.email || "";
    if (el("siteHours")) el("siteHours").textContent = s.hours || "";
    if (el("siteAddress")) el("siteAddress").textContent = s.address || "";
    if (el("siteCity")) el("siteCity").textContent = s.city || el("siteCity").textContent;
    const chipValues = document.querySelectorAll(".contact-chip-value");
    if (chipValues[0] && s.phone) chipValues[0].textContent = s.phone;
    if (chipValues[1] && s.email) chipValues[1].textContent = s.email;
    if (chipValues[2] && s.hours) chipValues[2].textContent = s.hours;
    if (chipValues[3] && s.address) chipValues[3].textContent = s.address;
    if (el("sitePhoneFooter")) el("sitePhoneFooter").textContent = s.phone || "";
    if (el("siteEmailFooter")) el("siteEmailFooter").textContent = s.email || "";
    if (el("siteAddressFooter")) el("siteAddressFooter").textContent = s.address || "";
    if (el("siteHoursFooter")) el("siteHoursFooter").textContent = s.hours || "";
    const defMsg = encodeURIComponent("Hola Bienenhaus, quisiera recibir informaci\xF3n sobre una propiedad.");
    document.querySelectorAll('a[href*="wa.me"]').forEach((a) => {
      try {
        const url = new URL(a.href);
        const text = url.searchParams.get("text") || defMsg;
        a.href = `https://wa.me/${_wa()}${text ? "?text=" + encodeURIComponent(text) : ""}`;
      } catch (e) {
        a.href = `https://wa.me/${wNum}?text=${defMsg}`;
      }
    });
    const videoUrl = s.hero_video_url || "";
    const imgUrl = s.hero_image_url || "";
    const heroBg = document.getElementById("heroBg");
    const heroVideo = document.getElementById("heroVideo");
    if (videoUrl && heroVideo) {
      heroVideo.src = videoUrl;
      heroVideo.classList.remove("hidden");
      heroBg == null ? void 0 : heroBg.classList.add("has-video");
      heroVideo.load();
      heroVideo.play().catch(() => {
      });
      injectMuteButton(heroVideo);
    } else if (imgUrl && heroBg) {
      heroBg.style.backgroundImage = `url('${imgUrl}')`;
    }
    const set = (id, val) => {
      const el2 = document.getElementById(id);
      if (el2 && val) el2.textContent = val;
    };
    set("qsEyebrow", s.about_eyebrow);
    set("qsLead", s.about_lead);
    set("qsBody", s.about_body);
    set("qsMision", s.about_mision);
    set("qsVision", s.about_vision);
    set("qsValor1k", s.about_valor1k);
    set("qsValor1v", s.about_valor1v);
    set("qsValor2k", s.about_valor2k);
    set("qsValor2v", s.about_valor2v);
    set("qsValor3k", s.about_valor3k);
    set("qsValor3v", s.about_valor3v);
    set("qsMercado", s.about_mercado);
    set("qsOfrecemos", s.about_ofrecemos);
    set("qsComo", s.about_como);
    if (s.ga_id && !window._gaInjected) {
      window._gaInjected = true;
      const gid = s.ga_id.replace(/^G-/i, "");
      const gtagId = "G-" + gid;
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
      document.head.appendChild(s1);
      const s2 = document.createElement("script");
      s2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gtagId}');`;
      document.head.appendChild(s2);
    }
  }
  function injectMuteButton(video) {
    if (document.getElementById("heroMuteBtn")) return;
    const hero = document.getElementById("hero");
    if (!hero) return;
    const btn = document.createElement("button");
    btn.id = "heroMuteBtn";
    btn.className = "hero-mute-btn";
    btn.title = "Activar/silenciar sonido";
    btn.innerHTML = "\u{1F507}";
    btn.style.cssText = "position:absolute;bottom:80px;right:24px;z-index:2;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.55);border:1px solid var(--accent-b);color:var(--accent);font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(4px);transition:background .15s;";
    btn.addEventListener("click", () => {
      video.muted = !video.muted;
      btn.innerHTML = video.muted ? "\u{1F507}" : "\u{1F50A}";
    });
    hero.appendChild(btn);
  }
  function initContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;
    document.getElementById("cf_ts").value = Date.now();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("cf_submit");
      const msgEl = document.getElementById("cfMsg");
      if (document.getElementById("cf_website").value) return;
      const name = document.getElementById("cf_name").value.trim();
      const message = document.getElementById("cf_message").value.trim();
      if (!name || !message) {
        msgEl.textContent = "Complet\xE1 nombre y mensaje.";
        msgEl.className = "cf-msg cf-msg--err";
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
      try {
        const res = await API.sendContact({
          name,
          email: document.getElementById("cf_email").value.trim(),
          phone: document.getElementById("cf_phone").value.trim(),
          message,
          _ts: document.getElementById("cf_ts").value,
          _website: document.getElementById("cf_website").value
        });
        if (res.ok) {
          msgEl.textContent = "\u2713 Mensaje enviado. Te contactaremos pronto.";
          msgEl.className = "cf-msg cf-msg--ok";
          form.reset();
          document.getElementById("cf_ts").value = Date.now();
        } else {
          msgEl.textContent = res.error || "Error al enviar.";
          msgEl.className = "cf-msg cf-msg--err";
        }
      } catch (e2) {
        msgEl.textContent = "Error de conexi\xF3n.";
        msgEl.className = "cf-msg cf-msg--err";
      }
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar mensaje";
    });
  }
  async function init() {
    var _a7, _b;
    showSkeletons();
    initReveal();
    initTabs();
    applySettings();
    initContactForm();
    const [propsResult, agentsResult] = await Promise.allSettled([
      loadProperties(__spreadProps(__spreadValues({}, _filters), { page: _page, sort: _sort, per_page: PER_PAGE })),
      loadAgents()
    ]);
    let props = [];
    let data = { properties: [], available_total: 0 };
    if (propsResult.status === "fulfilled") {
      data = propsResult.value;
      props = data.properties;
      _allLoadedProps = props;
    } else {
      console.error("[init] Fall\xF3 carga de properties:", propsResult.reason);
    }
    let agents = [];
    if (agentsResult.status === "fulfilled") {
      agents = agentsResult.value;
    } else {
      console.error("[init] Fall\xF3 carga de agents:", agentsResult.reason);
    }
    const heroYearsSetting = (_a7 = window._siteSettings) == null ? void 0 : _a7.hero_years;
    const yearsVal = heroYearsSetting ? parseInt(heroYearsSetting) : agents.length ? Math.max(...agents.map((a) => a.years || 0)) : 0;
    const sp = document.getElementById("statProps");
    const sa = document.getElementById("statAgents");
    const sy = document.getElementById("statYears");
    if (sp) {
      sp.dataset.count = (_b = data.available_total) != null ? _b : props.filter((p) => p.status === "disponible").length;
      sp.textContent = "\u2014";
    }
    if (sa) {
      sa.dataset.count = agents.length;
      sa.textContent = "\u2014";
    }
    if (sy) {
      sy.dataset.count = yearsVal;
      sy.textContent = "\u2014";
    }
    setTimeout(initStatsCounter, 200);
    loadGeoRecommendations();
    showRentalSkeletons();
    try {
      const rdata = await API.getRentals(__spreadProps(__spreadValues({}, _rFilters), { page: _rPage, sort: _rSort, per_page: PER_PAGE }));
      const rlist = rdata.rentals || [];
      renderRentalsIndex(rlist);
      renderRentalPagination(rdata);
      if (rlist.length) setTimeout(revealCards, 50);
    } catch (err) {
      const rg = document.getElementById("rentalsGridIndex");
      if (rg) rg.innerHTML = '<div class="loading-state">Error al cargar alquileres.</div>';
    }
  }
  init();
  async function loadGeoRecommendations() {
    var _a7, _b, _c, _d, _e, _f, _g;
    const section = document.getElementById("recomendaciones");
    const grid = document.getElementById("recGrid");
    const loading = document.getElementById("recLoading");
    const recTitle = document.getElementById("recTitle");
    const recSub = document.getElementById("recSub");
    if (!section || !grid) return;
    if (!navigator.geolocation) {
      section.classList.add("hidden");
      return;
    }
    let lat, lng;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5e3,
          enableHighAccuracy: false
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (e) {
      section.classList.add("hidden");
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&accept-language=es`,
        { headers: { "User-Agent": "Bienenhaus/1.0" } }
      );
      const geo = await res.json();
      const city = ((_a7 = geo.address) == null ? void 0 : _a7.city) || ((_b = geo.address) == null ? void 0 : _b.town) || ((_c = geo.address) == null ? void 0 : _c.village) || ((_d = geo.address) == null ? void 0 : _d.county) || "";
      const neighborhood = ((_e = geo.address) == null ? void 0 : _e.suburb) || ((_f = geo.address) == null ? void 0 : _f.neighbourhood) || ((_g = geo.address) == null ? void 0 : _g.quarter) || "";
      const place = neighborhood || city;
      if (!place) {
        section.classList.add("hidden");
        return;
      }
      if (loading) loading.textContent = "Buscando propiedades...";
      try {
        const q = encodeURIComponent(place);
        const data = await API.getProperties({ search: place, per_page: 6, sort: "default" });
        const props = data.properties || [];
        if (!props.length) {
          section.classList.add("hidden");
          return;
        }
        if (recTitle) recTitle.textContent = `Propiedades cerca de ${place}`;
        if (recSub) recSub.textContent = "Recomendadas seg\xFAn tu ubicaci\xF3n";
        section.classList.remove("hidden");
        grid.innerHTML = props.map(buildPropCard).join("");
        grid.querySelectorAll(".prop-card").forEach(initCarousel);
      } catch (e) {
        section.classList.add("hidden");
      }
    } catch (e) {
      section.classList.add("hidden");
    }
  }
  document.querySelectorAll(".logo-3d-wrap").forEach((wrap) => {
    const img = wrap.querySelector(".logo-3d");
    if (!img) return;
    wrap.addEventListener("mousemove", (e) => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rotX = (y - 0.5) * -28;
      const rotY = (x - 0.5) * 28;
      img.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`;
    });
    wrap.addEventListener("mouseleave", () => {
      img.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
    });
  });
})();
