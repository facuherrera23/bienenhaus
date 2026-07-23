/* ═══════════════════════════════════════════════════════════
   admin-acm.js — ACM (Análisis Comparativo de Mercado)
   Carga bajo demanda vía loadAcm()
═══════════════════════════════════════════════════════════════ */
var NIVELES = ["Mucho Mejor", "Mejor", "Igual", "Peor", "Mucho Peor"];
var FRACCIONES = { "Mucho Mejor": -1, "Mejor": -0.5, "Igual": 0, "Peor": 0.5, "Mucho Peor": 1 };

var TIPOS = {
  "Casas": [
    ["Calidad de ubicación", 30], ["Cantidad de habitaciones", 20], ["Estado de mantenimiento", 20],
    ["Antigüedad", 15], ["Comodidades", 10], ["Estacionamiento", 5]
  ],
  "Deptos": [
    ["Calidad de ubicación (barrio)", 30], ["Cantidad de habitaciones", 20], ["Ubicación piso", 15],
    ["Antigüedad", 15], ["Comodidades (edificio)", 12], ["Ubicación planta", 8]
  ],
  "Lotes": [
    ["Calidad de ubicación", 35], ["Superficie", 25], ["Servicios", 20],
    ["Acceso", 10], ["Forma", 6], ["Orientación", 4]
  ],
  "Galpones": [
    ["Calidad de ubicación", 25], ["Superficie y altura libre", 25], ["Acceso", 20],
    ["Instalaciones", 15], ["Estado / antigüedad", 10], ["Oficinas y servicios anexos", 5]
  ],
  "Oficinas": [
    ["Calidad de ubicación", 30], ["Superficie y layout", 20], ["Ubicación piso / vista", 15],
    ["Comodidades del edificio", 15], ["Antigüedad / estado", 12], ["Estacionamiento", 8]
  ],
  "Locales": [
    ["Calidad de ubicación", 35], ["Frente / vidriera", 20], ["Superficie y forma", 15],
    ["Instalaciones", 12], ["Estado de mantenimiento", 10], ["Estacionamiento / carga y descarga", 8]
  ]
};

window.loadAcm = function loadAcm() {
  var container = document.getElementById('acmContainer');
  if (!container) return;
  if (container.dataset.acmLoaded) return;
  container.dataset.acmLoaded = '1';

  container.innerHTML =
    '<div class="cma-root" id="cma-tool">' +
    '  <link rel="stylesheet" href="/css/tasacion2.css?v=' + (window._version || '1') + '"/>' +
    '  <header class="cma-header">' +
    '    <div class="cma-header-text">' +
    '      <p class="cma-eyebrow">Herramienta de tasación</p>' +
    '      <h1>Análisis Comparativo de Mercado</h1>' +
    '      <p class="cma-sub">Homogeneización de antecedentes por condiciones y coeficiente de mercado</p>' +
    '    </div>' +
    '    <div class="cma-seal" id="cma-seal">' +
    '      <div class="cma-seal-ring">' +
    '        <span class="cma-seal-label">Valor sugerido</span>' +
    '        <span class="cma-seal-value" id="seal-value">USD —</span>' +
    '        <span class="cma-seal-sub" id="seal-count">0 antecedentes</span>' +
    '      </div>' +
    '    </div>' +
    '  </header>' +
    '  <nav class="cma-tabs" id="cma-tabs" role="tablist" aria-label="Tipo de inmueble"></nav>' +
    '  <section class="cma-panel cma-config">' +
    '    <div class="cma-config-col">' +
    '      <h2>Ponderación de variables <span class="cma-hint">(deben sumar 100%)</span></h2>' +
    '      <div id="cma-weights" class="cma-weights"></div>' +
    '      <p class="cma-sum-line">Suma: <strong id="cma-sum">100%</strong></p>' +
    '    </div>' +
    '    <div class="cma-config-col cma-config-narrow">' +
    '      <h2>Sujeto a tasar</h2>' +
    '      <label class="cma-field"><span>Dirección / referencia</span><input type="text" id="subject-address" placeholder="Ej: San Jerónimo 2100, San Vicente"></label>' +
    '      <h2 class="cma-mt">Coeficiente de mercado</h2>' +
    '      <label class="cma-field"><span>Publicado → vendido</span><input type="number" id="market-coef" step="0.01" min="0" max="1.5" value="0.95"></label>' +
    '      <p class="cma-note">Castigo fijo aplicado por igual a todos los antecedentes.</p>' +
    '    </div>' +
    '  </section>' +
    '  <section class="cma-panel">' +
    '    <div class="cma-table-head"><h2>Antecedentes</h2><button id="cma-add-row" class="cma-btn-ghost" type="button">+ Agregar antecedente</button></div>' +
    '    <div class="cma-table-wrap"><table class="cma-table" id="cma-table"><thead><tr id="cma-table-header"></tr></thead><tbody id="cma-table-body"></tbody></table></div>' +
    '  </section>' +
    '  <section class="cma-panel cma-results">' +
    '    <div class="cma-result-card"><span class="cma-result-label">Promedio</span><span class="cma-result-value" id="res-avg">USD —</span></div>' +
    '    <div class="cma-result-card"><span class="cma-result-label">Mediana</span><span class="cma-result-value" id="res-median">USD —</span></div>' +
    '    <div class="cma-result-card"><span class="cma-result-label">Promedio m²</span><span class="cma-result-value" id="res-avg-m2">USD —</span></div>' +
    '    <div class="cma-result-card cma-result-main"><span class="cma-result-label">Valor sugerido de tasación</span><span class="cma-result-value" id="res-suggested">USD —</span></div>' +
    '  </section>' +
    '  <p class="cma-footnote">Valor homogeneizado = Precio publicado × Coeficiente de condiciones × Coeficiente de mercado. Precio/m² = Valor homogeneizado / Superficie. El coeficiente de condiciones surge de comparar cada antecedente contra el sujeto: en igualdad de condiciones el coeficiente es 1.00; si el antecedente está mejor, se corrige hacia abajo; si está peor, se corrige hacia arriba. Esta herramienta es orientativa — siempre debe complementarse con el criterio del profesional matriculado interviniente.</p>' +
    '</div>';

  var state = { tipo: "Casas", weights: {}, marketCoef: 0.95, rows: {} };

  Object.keys(TIPOS).forEach(function (t) {
    state.weights[t] = TIPOS[t].map(function (v) { return { name: v[0], weight: v[1] }; });
    state.rows[t] = [];
    for (var i = 0; i < 6; i++) state.rows[t].push({ address: "", price: "", superficie: "", levels: ["Igual","Igual","Igual","Igual","Igual","Igual"] });
  });

  function $(id) { return document.getElementById(id); }

  function fmtUSD(n) {
    if (n === null || n === undefined || isNaN(n)) return "USD —";
    return "USD " + Math.round(n).toLocaleString("es-AR");
  }

  function renderTabs() {
    var tabsEl = $("cma-tabs");
    tabsEl.innerHTML = "";
    Object.keys(TIPOS).forEach(function (t) {
      var btn = document.createElement("button");
      btn.className = "cma-tab" + (t === state.tipo ? " active" : "");
      btn.type = "button";
      btn.textContent = t;
      btn.addEventListener("click", function () { state.tipo = t; renderAll(); });
      tabsEl.appendChild(btn);
    });
  }

  function renderWeights() {
    var w = state.weights[state.tipo];
    var el = $("cma-weights");
    el.innerHTML = "";
    w.forEach(function (item, idx) {
      var row = document.createElement("div");
      row.className = "cma-weight-row";

      var nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = item.name;
      nameInput.addEventListener("input", function () { item.name = nameInput.value; renderTableHeader(); });

      var weightInput = document.createElement("input");
      weightInput.type = "number";
      weightInput.min = "0"; weightInput.max = "100";
      weightInput.value = item.weight;
      weightInput.addEventListener("input", function () {
        item.weight = parseFloat(weightInput.value) || 0;
        updateSum(); renderTableHeader(); recalcAll();
      });

      var pct = document.createElement("span");
      pct.className = "cma-pct";
      pct.textContent = "%";

      row.appendChild(nameInput);
      row.appendChild(weightInput);
      row.appendChild(pct);
      el.appendChild(row);
    });
    updateSum();
  }

  function updateSum() {
    var total = state.weights[state.tipo].reduce(function (s, i) { return s + (parseFloat(i.weight) || 0); }, 0);
    $("cma-sum").textContent = total + "%";
    document.querySelector(".cma-sum-line").classList.toggle("bad", Math.round(total) !== 100);
  }

  function renderTableHeader() {
    var thead = $("cma-table-header");
    thead.innerHTML = "";
    ["Antecedente", "Precio publicado (USD)", "Superficie (m²)"].forEach(function (h) {
      var th = document.createElement("th"); th.textContent = h; thead.appendChild(th);
    });
    state.weights[state.tipo].forEach(function (item) {
      var th = document.createElement("th"); th.textContent = item.name + " (" + item.weight + "%)"; thead.appendChild(th);
    });
    ["Coef. Condiciones", "Coef. Mercado", "Valor Homogeneizado", "Precio/m²", ""].forEach(function (h) {
      var th = document.createElement("th"); th.textContent = h; thead.appendChild(th);
    });
  }

  function renderTableBody() {
    var tbody = $("cma-table-body");
    tbody.innerHTML = "";
    var rows = state.rows[state.tipo];
    rows.forEach(function (row, rIdx) {
      var tr = document.createElement("tr");

      function mkInput(type, placeholder, value, fn) {
        var inp = document.createElement("input");
        inp.type = type; inp.placeholder = placeholder; inp.value = value;
        if (type === "number") { inp.min = "0"; if (placeholder === "m²") inp.step = "0.1"; }
        inp.addEventListener("input", fn);
        return inp;
      }

      var tdAddr = document.createElement("td");
      var inAddr = mkInput("text", "Dirección / referencia", row.address, function () { row.address = inAddr.value; });
      tdAddr.appendChild(inAddr); tr.appendChild(tdAddr);

      var tdPrice = document.createElement("td");
      var inPrice = mkInput("number", "0", row.price, function () { row.price = inPrice.value; recalcRow(rIdx); });
      tdPrice.appendChild(inPrice); tr.appendChild(tdPrice);

      var tdSup = document.createElement("td");
      var inSup = mkInput("number", "m²", row.superficie, function () { row.superficie = inSup.value; recalcRow(rIdx); });
      tdSup.appendChild(inSup); tr.appendChild(tdSup);

      for (var i = 0; i < 6; i++) {
        (function (i) {
          var td = document.createElement("td");
          var sel = document.createElement("select");
          NIVELES.forEach(function (n) {
            var opt = document.createElement("option");
            opt.value = n; opt.textContent = n;
            if (row.levels[i] === n) opt.selected = true;
            sel.appendChild(opt);
          });
          sel.addEventListener("change", function () { row.levels[i] = sel.value; recalcRow(rIdx); });
          td.appendChild(sel); tr.appendChild(td);
        })(i);
      }

      var tdCoef = document.createElement("td"); tdCoef.className = "calc"; tr.appendChild(tdCoef);
      var tdMercado = document.createElement("td"); tdMercado.className = "calc"; tr.appendChild(tdMercado);
      var tdValor = document.createElement("td"); tdValor.className = "calc value"; tr.appendChild(tdValor);
      var tdM2 = document.createElement("td"); tdM2.className = "calc"; tr.appendChild(tdM2);

      var tdRemove = document.createElement("td");
      var btnRemove = document.createElement("button");
      btnRemove.className = "cma-row-remove";
      btnRemove.type = "button";
      btnRemove.innerHTML = "&times;";
      btnRemove.title = "Quitar antecedente";
      btnRemove.addEventListener("click", function () { rows.splice(rIdx, 1); renderTableBody(); recalcAll(); });
      tdRemove.appendChild(btnRemove); tr.appendChild(tdRemove);

      tbodyEl.appendChild(tr);
    });
    recalcAll();
  }

  function computeRow(row) {
    var w = state.weights[state.tipo];
    var coef = 1;
    for (var i = 0; i < 6; i++) {
      var frac = FRACCIONES[row.levels[i]] || 0;
      coef *= (1 + ((parseFloat(w[i].weight) || 0) / 100) * frac);
    }
    var price = parseFloat(row.price);
    var sup = parseFloat(row.superficie);
    var mercado = state.marketCoef;
    var valor = (isNaN(price) || row.price === "") ? null : price * coef * mercado;
    var precioM2 = (valor !== null && sup > 0) ? valor / sup : null;
    return { coef: coef, mercado: mercado, valor: valor, precioM2: precioM2 };
  }

  function recalcRow(rIdx) {
    var row = state.rows[state.tipo][rIdx];
    var tr = $("cma-table-body").children[rIdx];
    if (!tr) return;
    var res = computeRow(row);
    var tds = tr.querySelectorAll("td.calc");
    if (tds.length >= 3) {
      tds[0].textContent = res.coef.toFixed(3);
      tds[1].textContent = res.mercado.toFixed(2);
      tds[2].textContent = res.valor === null ? "—" : fmtUSD(res.valor);
      if (tds[3]) tds[3].textContent = res.precioM2 === null ? "—" : fmtUSD(res.precioM2);
    }
    recalcSummary();
  }

  function recalcAll() {
    state.rows[state.tipo].forEach(function (_, idx) { recalcRow(idx); });
    recalcSummary();
  }

  function recalcSummary() {
    var results = state.rows[state.tipo].map(computeRow);
    var values = results.map(function (r) { return r.valor; }).filter(function (v) { return v !== null; });
    var m2Values = results.map(function (r) { return r.precioM2; }).filter(function (v) { return v !== null; });

    var avg = values.length ? values.reduce(function (a, b) { return a + b; }, 0) / values.length : null;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var median = sorted.length ? (sorted.length % 2 !== 0 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : null;
    var suggested = (avg !== null && median !== null) ? (avg + median) / 2 : null;
    var avgM2 = m2Values.length ? m2Values.reduce(function (a, b) { return a + b; }, 0) / m2Values.length : null;

    $("res-avg").textContent = fmtUSD(avg);
    $("res-median").textContent = fmtUSD(median);
    $("res-avg-m2").textContent = fmtUSD(avgM2);
    $("res-suggested").textContent = fmtUSD(suggested);
    $("seal-value").textContent = fmtUSD(suggested);
    $("seal-count").textContent = values.length + (values.length === 1 ? " antecedente" : " antecedentes");
  }

  var tbodyEl = $("cma-table-body");

  $("cma-add-row").addEventListener("click", function () {
    state.rows[state.tipo].push({ address: "", price: "", superficie: "", levels: ["Igual","Igual","Igual","Igual","Igual","Igual"] });
    renderTableBody();
  });

  $("market-coef").addEventListener("input", function () {
    state.marketCoef = parseFloat(this.value) || 0.95;
    recalcAll();
  });

  function renderAll() { renderTabs(); renderWeights(); renderTableHeader(); renderTableBody(); }
  renderAll();
};
