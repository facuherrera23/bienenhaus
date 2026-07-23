/**
 * pdf-brochure.js — Generación de folleto PDF para propiedades
 */
(function() {
  const CDN_JSPDF    = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const CDN_HTML2CANVAS = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

  let _loaded = false;

  async function _loadDeps() {
    if (_loaded) return;
    await Promise.all([
      new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = CDN_JSPDF;
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      }),
      new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = CDN_HTML2CANVAS;
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      }),
    ]);
    _loaded = true;
  }

  function _contactData() {
    const meta = document.querySelector('meta[name="contact-phone"]');
    const phone   = meta?.getAttribute('content') || '+54 351 411-0000';
    const email   = document.querySelector('meta[name="contact-email"]')?.getAttribute('content') || 'info@bienenhaus.com.ar';
    const siteUrl = document.querySelector('meta[name="site-url"]')?.getAttribute('content') || 'https://bienenhaus.onrender.com';
    const siteName = document.querySelector('meta[name="site-name"]')?.getAttribute('content') || 'Bienenhaus Propiedades';
    return { phone, email, siteUrl, siteName };
  }

  function _buildHTML(p, contact) {
    const isRental = 'price_ars' in p;
    const price = isRental
      ? `AR$ ${Number(p.price_ars).toLocaleString('es-AR')}/mes`
      : `USD ${Number(p.price).toLocaleString('es-AR')}`;
    const priceLabel = isRental ? 'ALQUILER' : 'VENTA';
    const propUrl = `${contact.siteUrl}/${isRental ? 'alquiler' : 'venta'}/${p.id}`;
    const images = (p.images || []).filter(Boolean);
    const heroImage = images[0] || null;

    const specs = [];
    if (p.beds)  specs.push(`<div class="bh-spec"><span class="bh-spec-n">${p.beds}</span><span class="bh-spec-l">DORM.</span></div>`);
    if (p.baths) specs.push(`<div class="bh-spec"><span class="bh-spec-n">${p.baths}</span><span class="bh-spec-l">BAÑOS</span></div>`);
    if (p.sqm)   specs.push(`<div class="bh-spec"><span class="bh-spec-n">${p.sqm}</span><span class="bh-spec-l">M²</span></div>`);
    if (isRental && p.furnished) specs.push(`<div class="bh-spec"><span class="bh-spec-n">●</span><span class="bh-spec-l">AMOBLADO</span></div>`);

    return `
      <div id="brochure-content" style="
        width: 210mm; min-height: 297mm;
        background: #000000; color: #ffffff;
        font-family: 'Poppins', sans-serif;
        padding: 0; margin: 0; box-sizing: border-box;
        display: flex; flex-direction: column;
        overflow: hidden;
      ">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@400;600;700;800;900&family=Poppins:wght@200;300;400;500;600&family=Quicksand:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          .bh { width: 210mm; min-height: 297mm; background: #000; color: #fff; font-family: Poppins, sans-serif; display: flex; flex-direction: column; }

          .bh-grain { position: absolute; inset: 0; opacity: 0.035; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-repeat: repeat; background-size: 256px 256px; pointer-events: none; z-index: 1; }

          .bh-accent-line { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent 0%, #20b8ab 25%, #20b8ab 75%, transparent 100%); z-index: 2; }

          /* Header compacto */
          .bh-header { position: relative; z-index: 2; padding: 20px 36px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .bh-brand { font-family: 'Anton', Impact, sans-serif; font-size: 18px; letter-spacing: 0.08em; color: #fff; text-transform: uppercase; }
          .bh-brand-sub { font-family: 'Quicksand', sans-serif; font-size: 7px; letter-spacing: 0.3em; color: #20b8ab; text-transform: uppercase; }
          .bh-header-tag { font-family: 'Poppins', sans-serif; font-size: 7px; font-weight: 400; color: #555; letter-spacing: 0.1em; text-transform: uppercase; }

          /* Type badge */
          .bh-type-row { position: relative; z-index: 2; padding: 6px 36px 0; display: flex; gap: 8px; }
          .bh-type-badge { font-family: 'Poppins', sans-serif; font-size: 7px; font-weight: 500; color: #9a9a9a; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; }

          /* Hero: title left + price right */
          .bh-hero { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: flex-end; padding: 20px 36px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .bh-hero-left { flex: 1; }
          .bh-hero-title { font-family: 'Anton', Impact, sans-serif; font-size: 30px; letter-spacing: 0.02em; color: #fff; text-transform: uppercase; line-height: 1.1; margin-bottom: 2px; }
          .bh-hero-location { font-family: 'Quicksand', sans-serif; font-size: 9px; font-weight: 500; color: #20b8ab; letter-spacing: 0.18em; text-transform: uppercase; }
          .bh-hero-right { text-align: right; flex-shrink: 0; margin-left: 20px; }
          .bh-hero-price-label { font-family: 'Poppins', sans-serif; font-size: 7px; font-weight: 400; color: #555; letter-spacing: 0.12em; text-transform: uppercase; }
          .bh-hero-price { font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 900; color: #20b8ab; line-height: 1; }

          /* Body 2 columnas */
          .bh-body { position: relative; z-index: 2; flex: 1; display: flex; gap: 0; padding: 16px 36px; min-height: 0; }
          .bh-body-left { flex: 1; display: flex; flex-direction: column; padding-right: 24px; border-right: 1px solid rgba(255,255,255,0.06); }
          .bh-body-right { width: 170px; flex-shrink: 0; padding-left: 24px; display: flex; flex-direction: column; gap: 10px; }

          .bh-label { font-family: 'Poppins', sans-serif; font-size: 7px; font-weight: 500; color: #555; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
          .bh-desc { font-family: 'Poppins', sans-serif; font-size: 9px; font-weight: 200; line-height: 1.85; color: #9a9a9a; flex: 1; }

          /* Data card */
          .bh-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 4px; padding: 10px 14px; }
          .bh-card-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
          .bh-card-row:last-child { border-bottom: none; }
          .bh-card-l { font-family: 'Poppins', sans-serif; font-size: 7px; font-weight: 400; color: #555; letter-spacing: 0.05em; text-transform: uppercase; }
          .bh-card-v { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; color: #fff; letter-spacing: 0.02em; }

          /* Image */
          .bh-img-wrap { width: 100%; height: 90px; overflow: hidden; border-radius: 3px; background: #0d0d0d; }
          .bh-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(0.5); }

          /* Specs bar */
          .bh-specs { position: relative; z-index: 2; display: flex; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); margin: 0 36px; }
          .bh-spec { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 8px; border-right: 1px solid rgba(255,255,255,0.06); }
          .bh-spec:last-child { border-right: none; }
          .bh-spec-n { font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 800; color: #fff; line-height: 1; }
          .bh-spec-l { font-family: 'Poppins', sans-serif; font-size: 6px; font-weight: 500; color: #555; letter-spacing: 0.1em; }

          /* Footer */
          .bh-footer { position: relative; z-index: 2; border-top: 1px solid rgba(255,255,255,0.06); padding: 12px 36px; display: flex; align-items: center; justify-content: space-between; }
          .bh-footer-items { display: flex; gap: 14px; flex-wrap: wrap; }
          .bh-footer-item { font-family: 'Poppins', sans-serif; font-size: 7px; color: #555; letter-spacing: 0.02em; }
          .bh-footer-divider { color: #2a2a2a; font-size: 7px; }
          .bh-footer-url { font-family: 'Poppins', sans-serif; font-size: 6px; color: #2a2a2a; letter-spacing: 0.02em; }
        </style>

        <div class="bh-accent-line"></div>
        <div class="bh-grain"></div>

        <div class="bh-header">
          <div>
            <div class="bh-brand">Bienenhaus</div>
            <div class="bh-brand-sub">Propiedades</div>
          </div>
          <span class="bh-header-tag">Folleto informativo</span>
        </div>

        ${p.type ? `<div class="bh-type-row"><span class="bh-type-badge">${esc(p.type)}</span></div>` : ''}

        <div class="bh-hero">
          <div class="bh-hero-left">
            <div class="bh-hero-title">${esc(p.title)}</div>
            <div class="bh-hero-location">${esc(p.location || '')}</div>
          </div>
          <div class="bh-hero-right">
            <div class="bh-hero-price-label">${priceLabel}</div>
            <div class="bh-hero-price">${price}</div>
          </div>
        </div>

        <div class="bh-body">
          <div class="bh-body-left">
            <div class="bh-label">Descripción</div>
            ${p.desc
              ? `<p class="bh-desc">${esc(p.desc)}</p>`
              : `<p class="bh-desc" style="color:#2a2a2a">Sin descripción disponible.</p>`}
          </div>
          <div class="bh-body-right">
            <div class="bh-card">
              <div class="bh-card-row"><span class="bh-card-l">Ubicación</span><span class="bh-card-v">${esc(p.location || '—')}</span></div>
              <div class="bh-card-row"><span class="bh-card-l">${isRental ? 'Alquiler' : 'Venta'}</span><span class="bh-card-v">${price}</span></div>
              ${p.beds ? `<div class="bh-card-row"><span class="bh-card-l">Dorm.</span><span class="bh-card-v">${p.beds}</span></div>` : ''}
              ${p.baths ? `<div class="bh-card-row"><span class="bh-card-l">Baños</span><span class="bh-card-v">${p.baths}</span></div>` : ''}
              ${p.sqm ? `<div class="bh-card-row"><span class="bh-card-l">Superficie</span><span class="bh-card-v">${p.sqm} m²</span></div>` : ''}
            </div>
            ${heroImage
              ? `<div class="bh-img-wrap"><img src="${heroImage}" crossorigin="anonymous" alt=""/></div>`
              : ''}
          </div>
        </div>

        ${specs.length ? `<div class="bh-specs">${specs.join('')}</div>` : ''}

        <div class="bh-footer">
          <div class="bh-footer-items">
            <span class="bh-footer-item">${contact.phone}</span>
            <span class="bh-footer-divider">|</span>
            <span class="bh-footer-item">${contact.email}</span>
            <span class="bh-footer-divider">|</span>
            <span class="bh-footer-item">${contact.siteName}</span>
          </div>
          <span class="bh-footer-url">${propUrl}</span>
        </div>
      </div>`;
  }

  window.descargarFolleto = async function(id) {
    const isRental = window._subTab === 'alquiler';
    const arr = isRental ? (window._rentals || []) : (window._props || []);
    const p = arr.find(x => x.id === id);
    if (!p) return;

    try {
      await _loadDeps();
    } catch {
      window.open(`/${isRental ? 'alquiler' : 'venta'}/${id}`, '_blank');
      return;
    }

    const contact = _contactData();
    if (!window.html2canvas || !window.jspdf) {
      window.open(`/${isRental ? 'alquiler' : 'venta'}/${id}`, '_blank');
      return;
    }

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
    container.innerHTML = _buildHTML(p, contact);
    document.body.appendChild(container);

    try {
      await new Promise(r => setTimeout(r, 500));

      const el = document.getElementById('brochure-content');
      const canvas = await window.html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: 793.7,
        windowWidth: 793.7,
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 0);

      const filename = `folleto-${(p.title || 'propiedad').replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)}.pdf`;
      pdf.save(filename);
    } catch (e) {
      console.warn('Error generando folleto:', e);
      window.open(`/${'price_ars' in p ? 'alquiler' : 'venta'}/${p.id}`, '_blank');
    } finally {
      document.body.removeChild(container);
    }
  };

  function esc(s) {
    return String(s ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
