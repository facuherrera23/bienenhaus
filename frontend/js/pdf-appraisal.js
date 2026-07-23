/**
 * pdf-appraisal.js — PDF profesional con jsPDF (4 páginas)
 * Carga jsPDF + jspdf-autotable desde CDN.
 *
 * generarPDFReporte(id, tipo) es la función genérica; tipo = 'appraisal' | 'tasacion'.
 * generarPDFAppraisal(id) se mantiene como wrapper de compatibilidad.
 */

async function generarPDFReporte(id, tipo) {
  const toast = window.toast || console.warn;
  // TODO: confirmar con negocio si el header del PDF debe
  // diferenciarse entre "ACM" (appraisal) y "Tasación", o si es
  // intencional que sea el mismo texto para ambos.
  const cfg = {
    appraisal: { fetch: () => API.getAppraisal(id), filenamePrefix: 'ACM' },
    tasacion:  { fetch: () => API.getTasacion(id),  filenamePrefix: 'Tasacion' },
  };
  const tipoCfg = cfg[tipo] || cfg.appraisal;
  try {
    const a = await tipoCfg.fetch();
    const empresa = { nombre: 'Bienenhaus Propiedades', tasador_nombre: 'Tasador', tasador_matricula: '', telefono: '', email: '', direccion: '' };
    // Eliminado: llamada a map-data no utilizada en el PDF (GET puro sin side-effects)

    // Cargar jsPDF + autotable desde CDN
    const { jsPDF } = await loadJSPDF();
    await loadAutoTable();

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const margin = 18;
    const cW = pageW - margin * 2;
    const teal = '#20b8ab';
    const dark = '#0a0a0a';
    const gray = '#666';

    function header(title, subtitle) {
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, pageW, 36, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(title || 'ACM', margin, 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(32, 184, 171);
      doc.text(subtitle || 'Análisis Comparativo de Mercado', margin, 24);
      if (empresa?.nombre) {
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(empresa.nombre, pageW - margin, 12, { align: 'right' });
      }
      doc.setDrawColor(32, 184, 171);
      doc.setLineWidth(0.3);
      doc.line(margin, 36, pageW - margin, 36);
    }

    function footer() {
      const y = doc.internal.pageSize.height - 12;
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')} · Bienenhaus`, margin, y);
      doc.text(`Pág. ${doc.internal.getCurrentPageInfo().pageNumber}`, pageW - margin, y, { align: 'right' });
    }

    function section(x, y, w, title, contentFn) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(32, 184, 171);
      doc.text(title, x, y);
      const y0 = y + 1.5;
      const lines = contentFn(y0);
      return lines;
    }

    function row(y, label, value, x1, x2) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(label, x1 || margin, y);
      doc.setTextColor(200, 200, 200);
      doc.text(String(value ?? '—'), x2 || margin + cW * 0.5, y);
      return y + 4.5;
    }

    // ── PÁGINA 1: Datos del cliente e inmueble ────────────────
    header('ACM', 'Análisis Comparativo de Mercado');
    let y = 44;

    // Sección: Tasación
    y = section(margin, y, cW, '1. TASACIÓN', (y0) => {
      let yy = y0;
      yy = row(yy, 'Título', a.titulo);
      yy = row(yy, 'Solicitante', a.solicitante);
      yy = row(yy, 'Teléfono', a.telefono);
      yy = row(yy, 'Fecha', a.fecha_tasacion);
      yy = row(yy, 'Destino', a.destino === 'venta' ? 'Venta' : 'Alquiler');
      yy = row(yy, 'Estado', a.estado);
      return yy + 2;
    }) + 2;

    y = section(margin, y, cW, '2. INMUEBLE TASADO', (y0) => {
      let yy = y0;
      yy = row(yy, 'Dirección', a.direccion);
      yy = row(yy, 'Barrio / Localidad', `${a.barrio ? a.barrio + ', ' : ''}${a.localidad || ''}`);
      yy = row(yy, 'Tipo', a.tipo_propiedad);
      yy = row(yy, 'Sup. cubierta', a.superficie_cubierta ? `${a.superficie_cubierta} m²` : '—');
      yy = row(yy, 'Sup. terreno', a.superficie_terreno ? `${a.superficie_terreno} m²` : '—');
      yy = row(yy, 'Dormitorios', a.dormitorios);
      yy = row(yy, 'Baños', a.banios);
      yy = row(yy, 'Año constr.', a.anio_construccion);
      return yy + 2;
    }) + 2;

    y = section(margin, y, cW, '3. CARACTERÍSTICAS', (y0) => {
      let yy = y0;
      yy = row(yy, 'Construcción', a.tipo_construccion);
      yy = row(yy, 'Techo', a.tipo_techo);
      yy = row(yy, 'Calidad constructiva', a.calidad_constructiva);
      yy = row(yy, 'Calidad mantenimiento', a.calidad_mantenimiento);
      yy = row(yy, 'Estacionamiento', a.estacionamiento);
      yy = row(yy, 'Vida remanente', a.vida_remanente ? `${a.vida_remanente} años` : '—');
      yy = row(yy, 'T/C USD', a.tipo_cambio_usd);
      yy = row(yy, 'Valor UVA', a.valor_uva);
      return yy;
    });

    // Línea separadora
    y = Math.max(y + 4, 60);
    doc.setDrawColor(32, 184, 171, 0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 4;

    // Tabla resumen
    if ((a.comparables || []).length > 0) {
      y = section(margin, y, cW, 'RESUMEN DE VALUACIÓN', (y0) => {
        let yy = y0;
        yy = row(yy, 'Valor Estimado USD', a.valor_estimado_usd ? `USD ${a.valor_estimado_usd.toLocaleString()}` : '—');
        yy = row(yy, 'Valor Estimado ARS', a.valor_estimado_ars ? `ARS ${a.valor_estimado_ars.toLocaleString()}` : '—');
        yy = row(yy, 'Valor en UVAs', a.valor_estimado_uvas ? `${a.valor_estimado_uvas.toLocaleString()} UVAs` : '—');
        yy = row(yy, 'Precio/m² promedio', a.precio_m2_promedio ? `USD ${a.precio_m2_promedio.toLocaleString()}` : '—');
        yy = row(yy, 'Rango USD/m²', a.precio_m2_minimo && a.precio_m2_maximo ? `USD ${a.precio_m2_minimo} – ${a.precio_m2_maximo}` : '—');
        yy = row(yy, 'Dispersión', a.dispersion_pct ? `${a.dispersion_pct}%` : '—');
        yy = row(yy, 'Coeficiente promedio', a.coeficiente_promedio ?? '—');
        yy = row(yy, 'Comparables', a.total_comparables ?? 0);
        return yy;
      });
    }

    footer();
    doc.addPage();

    // ── PÁGINA 2: Tabla de comparables ────────────────────────
    header('COMPARABLES', `Tasación #${a.id} · ${a.solicitante || a.titulo || ''}`);

    if ((a.comparables || []).length > 0) {
      const head = [['#', 'Dirección', 'Precio USD', 'm²', 'USD/m²', 'Coef.', 'Ajustado', 'Antig.', 'Estac.', 'Hab.', 'Ubic.', 'Mant.', 'Comod.']];
      const body = a.comparables.map(c => {
        const coef = c.coeficiente_ajuste ?? '';
        const ajustado = c.valor_m2_ajustado ?? '';
        return [
          `C${c.numero}`,
          `${c.calle || ''} ${c.numero_calle || ''}`.trim() || '—',
          c.precio_usd ? c.precio_usd.toLocaleString() : '—',
          c.superficie_cubierta || '—',
          c.precio_por_m2 ? c.precio_por_m2.toLocaleString() : '—',
          coef,
          ajustado ? ajustado.toLocaleString() : '—',
          c.comp_antiguedad || '—',
          c.comp_estacionamiento || '—',
          c.comp_habitaciones || '—',
          c.comp_ubicacion || '—',
          c.comp_estado_mantenimiento || '—',
          c.comp_comodidades || '—',
        ];
      });

      doc.autoTable({
        head, body,
        startY: 42,
        theme: 'grid',
        tableWidth: cW,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 6, cellPadding: 1.2, lineColor: [40, 40, 40],
          textColor: [200, 200, 200], fillColor: [10, 10, 10],
        },
        headStyles: {
          fillColor: [32, 184, 171], textColor: [255, 255, 255],
          fontStyle: 'bold', fontSize: 6,
        },
        alternateRowStyles: { fillColor: [16, 16, 16] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 32 },
          2: { cellWidth: 18, halign: 'right' },
          3: { cellWidth: 10, halign: 'center' },
          4: { cellWidth: 14, halign: 'right' },
          5: { cellWidth: 12, halign: 'center' },
          6: { cellWidth: 17, halign: 'right' },
          7: { cellWidth: 10, halign: 'center' },
          8: { cellWidth: 10, halign: 'center' },
          9: { cellWidth: 10, halign: 'center' },
          10: { cellWidth: 10, halign: 'center' },
          11: { cellWidth: 10, halign: 'center' },
          12: { cellWidth: 10, halign: 'center' },
        },
        didDrawPage: () => footer(),
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No se cargaron comparables.', margin, 60);
    }

    // ── PÁGINA 3: Valuación detallada + rango ────────────────
    doc.addPage();
    header('VALUACIÓN FINAL', `Tasación #${a.id}`);

    y = 44;
    doc.setFillColor(32, 184, 171, 0.05);
    doc.rect(margin, y - 4, cW, 50, 'F');
    doc.setDrawColor(32, 184, 171, 0.3);
    doc.rect(margin, y - 4, cW, 50, 'S');

    // Valor grande
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(32, 184, 171);
    doc.text(a.valor_estimado_usd ? `USD ${a.valor_estimado_usd.toLocaleString()}` : '—', margin + 4, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Valor estimado de mercado', margin + 4, y + 14);

    // Detalles
    y += 18;
    const dets = [
      ['Valor en Pesos', a.valor_estimado_ars ? `ARS ${a.valor_estimado_ars.toLocaleString()}` : '—'],
      ['Valor en UVAs', a.valor_estimado_uvas ? `${a.valor_estimado_uvas.toLocaleString()} UVAs` : '—'],
      ['Precio/m² promedio', a.precio_m2_promedio ? `USD ${a.precio_m2_promedio.toLocaleString()}` : '—'],
    ];
    dets.forEach(([l, v], i) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(l, margin + 4, y + i * 4);
      doc.setTextColor(200, 200, 200);
      doc.text(v, margin + cW * 0.4, y + i * 4);
    });

    y = 108;

    // Rango de valores
    if (a.precio_m2_minimo && a.precio_m2_maximo) {
      section(margin, y, cW, 'RANGO DE VALORES', (y0) => {
        const min = a.precio_m2_minimo;
        const max = a.precio_m2_maximo;
        const prom = a.precio_m2_promedio || 0;
        const barW = cW - 10;
        const barY = y0 + 6;
        const barH = 8;

        // Barra visual (texto)
        doc.setDrawColor(32, 184, 171, 0.3);
        doc.setFillColor(20, 20, 20);
        doc.roundedRect(margin + 5, barY, barW, barH, 1, 1, 'FD');

        // Relleno proporcional
        const total = max - min || 1;
        const pctMin = ((prom - min) / total) * 0.5;
        const pctMax = ((prom - min) / total) * 0.5;
        const fillW = Math.max(8, (pctMin + pctMax) * barW);
        const fillX = margin + 5 + (pctMin) * barW;
        doc.setFillColor(32, 184, 171);
        doc.roundedRect(fillX, barY, fillW, barH, 1, 1, 'F');

        // Etiquetas
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text(`USD ${min.toLocaleString()}`, margin + 5, barY + barH + 4);
        doc.text(`USD ${max.toLocaleString()}`, margin + 5 + barW, barY + barH + 4, { align: 'right' });
        doc.setTextColor(32, 184, 171);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(`USD ${prom.toLocaleString()}`, margin + 5 + barW / 2, barY - 2, { align: 'center' });

        let yy = barY + barH + 10;
        yy = row(yy, 'Precio/m² mínimo', `USD ${min.toLocaleString()}`);
        yy = row(yy, 'Precio/m² promedio', `USD ${prom.toLocaleString()}`);
        yy = row(yy, 'Precio/m² máximo', `USD ${max.toLocaleString()}`);
        yy = row(yy, 'Dispersión', `${a.dispersion_pct || 0}%`);
        yy = row(yy, 'Coeficiente promedio', a.coeficiente_promedio ?? '—');
        yy = row(yy, 'Comparables utilizados', a.total_comparables ?? 0);
        return yy;
      });
    }

    // ── PÁGINA 4: Tasador + observaciones ────────────────────
    doc.addPage();
    header('INFORME PROFESIONAL', `Tasación #${a.id}`);

    y = 44;

    // Datos del tasador
    if (empresa) {
      section(margin, y, cW, 'DATOS DEL TASADOR', (y0) => {
        let yy = y0;
        yy = row(yy, 'Inmobiliaria', empresa.nombre || '—');
        yy = row(yy, 'Tasador', empresa.tasador_nombre || '—');
        yy = row(yy, 'Matrícula', empresa.tasador_matricula || '—');
        yy = row(yy, 'Teléfono', empresa.telefono || '—');
        yy = row(yy, 'Email', empresa.email || '—');
        yy = row(yy, 'Dirección', empresa.direccion || '—');
        return yy + 2;
      }) + 6;
    }

    // Observaciones
    if (a.observaciones) {
      y = section(margin, y, cW, 'OBSERVACIONES', (y0) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        const lines = doc.splitTextToSize(a.observaciones, cW);
        doc.text(lines, margin, y0);
        return y0 + lines.length * 4 + 4;
      }) + 6;
    }

    // Firma
    y = Math.max(y, pageH - 70);
    doc.setDrawColor(150, 150, 150);
    doc.line(margin, y, margin + 60, y);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(empresa?.tasador_nombre || 'Tasador', margin, y + 5);
    doc.setFontSize(6);
    doc.text(empresa?.tasador_matricula ? `Mat. ${empresa.tasador_matricula}` : '', margin, y + 9);

    // Disclaimer
    y = pageH - 30;
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    const disclaimer = [
      'Este informe es una estimación del valor de mercado realizada mediante el Análisis Comparativo de Mercado (ACM).',
      'Los valores aquí expresados no constituyen una tasación oficial ni un compromiso de compra-venta.',
      'La exactitud de los datos depende de la calidad de la información proporcionada y de los comparables utilizados.',
    ].join(' ');
    doc.text(doc.splitTextToSize(disclaimer, cW), margin, y);

    // Guardar
    doc.save(`${tipoCfg.filenamePrefix}_${a.solicitante || a.titulo || a.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
    if (window.toast) toast('PDF descargado', 'success');

  } catch (e) {
    console.error('Error generando PDF:', e);
    if (window.toast) toast('Error al generar PDF: ' + e.message, 'error');
  }
}

async function loadJSPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return window.jspdf;
}

async function loadAutoTable() {
  if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.autoTable) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.3/jspdf.plugin.autotable.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function generarPDFAppraisal(id) {
  return generarPDFReporte(id, 'appraisal');
}

// Exportar a window
window.generarPDFAppraisal = generarPDFAppraisal;
window.generarPDFReporte = generarPDFReporte;
