/**
 * mapa.js — Mapa interactivo con Leaflet
 */
async function initMapa(containerId, kind) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const mapEl = document.createElement('div');
  mapEl.id = 'leafletMap';
  mapEl.style.width = '100%';
  mapEl.style.height = '500px';
  mapEl.style.borderRadius = '4px';
  mapEl.style.overflow = 'hidden';
  container.innerHTML = '';
  container.appendChild(mapEl);

  const L = await loadLeaflet();

  const map = L.map('leafletMap', {
    center: [-31.4201, -64.1888],
    zoom: 12,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
    maxZoom: 18,
  }).addTo(map);

  try {
    const res = await fetch('/api/map/data', { credentials: 'same-origin' });
    const d = await res.json();
    if (!d.ok) throw new Error(d.error);
    const data = d.data;

    let items = [];
    if (kind === 'venta') items = data.properties || [];
    else if (kind === 'alquiler') items = data.rentals || [];
    else items = [...(data.properties || []), ...(data.rentals || [])];

    if (!items.length) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--g2)">No hay propiedades con ubicación en el mapa.</div>';
      return;
    }

    const bounds = [];
    const blueIcon = L.divIcon({
      html: '<svg viewBox="0 0 24 36" width="22" height="33"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#20b8ab"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg>',
      iconSize: [22, 33], iconAnchor: [11, 33], popupAnchor: [0, -36],
      className: '',
    });
    const orangeIcon = L.divIcon({
      html: '<svg viewBox="0 0 24 36" width="22" height="33"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#e67e22"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg>',
      iconSize: [22, 33], iconAnchor: [11, 33], popupAnchor: [0, -36],
      className: '',
    });

    items.forEach(item => {
      if (!item.lat || !item.lng) return;
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lng);
      if (isNaN(lat) || isNaN(lng)) return;
      bounds.push([lat, lng]);

      const icon = item.kind === 'alquiler' ? orangeIcon : blueIcon;
      const priceStr = item.kind === 'alquiler'
        ? `$${Number(item.price).toLocaleString('es-AR')}/mes`
        : `USD ${Number(item.price).toLocaleString('es-AR')}`;
      const link = item.kind === 'alquiler' ? `/alquiler/${item.id}` : `/venta/${item.id}`;
      const img = item.image
        ? `<img src="${item.image}" style="width:100%;height:100px;object-fit:cover;border-radius:3px;margin-bottom:6px"/>`
        : '';
      const meta = [item.beds && `${item.beds} dorm`, item.baths && `${item.baths} baño`, item.sqm && `${item.sqm}m²`].filter(Boolean).join(' · ');

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;max-width:220px">
            ${img}
            <div style="font-weight:700;font-size:13px;margin-bottom:2px">${item.title}</div>
            <div style="font-size:11px;color:#666;margin-bottom:4px">${item.location}${meta ? ' · ' + meta : ''}</div>
            <div style="font-weight:700;font-size:14px;color:#20b8ab">${priceStr}</div>
            <a href="${link}" style="display:inline-block;margin-top:6px;font-size:11px;color:#20b8ab;text-decoration:none;font-weight:600">Ver detalle →</a>
          </div>
        `, { maxWidth: 260, className: 'leaflet-popup-bienenhaus' });
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
  } catch (e) {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--g2)">Error al cargar mapa: ${e.message}</div>`;
  }
}

async function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
