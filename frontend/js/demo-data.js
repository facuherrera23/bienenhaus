/**
 * demo-data.js — Shared demo data and merge functions
 * Loads FIRST so properties.js and agents.js can use it
 */

// ── Datos de propiedades demo ──────────────────────────────────────────────────
const DEMO_PROPERTIES = [
  {
    id: 101,
    title: 'Casa en Nueva Córdoba - 3 Dormitorios',
    type: 'casa',
    location: 'Nueva Córdoba, Córdoba Capital',
    price: 185000,
    beds: 3,
    baths: 2,
    sqm: 120,
    sqm_total: 180,
    parkings: 2,
    antiquity: '10 años',
    status: 'disponible',
    featured: true,
    description: 'Hermosa casa ubicada en el corazón de Nueva Córdoba, a metros de la Ciudad Universitaria. Cuenta con amplio living comedor, cocina integrada con anafe, horno y campana. Tres dormitorios con placares incorporados, el principal con baño en suite. Patio con parrilla y jardín. Cochera cubierta para dos autos. Excelente iluminación natural y ventilación cruzada.',
    images: [
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg'
    ],
    latitude: -31.4216,
    longitude: -64.1888,
  },
  {
    id: 102,
    title: 'Departamento en Centro - 2 Ambientes',
    type: 'departamento',
    location: 'Centro, Córdoba Capital',
    price: 125000,
    beds: 2,
    baths: 1,
    sqm: 55,
    sqm_total: 65,
    parkings: 1,
    antiquity: '5 años',
    status: 'disponible',
    featured: true,
    description: 'Moderno departamento en el centro de la ciudad, totalmente amoblado. Living comedor con cocina tipo americana, balcón con vista a la calle. Dormitorio con cama queen y placard. Baño completo con artefactos nuevos. A pasos de peatonal, supermercados y transporte público. Expensas incluyen agua y mantenimiento de espacios comunes.',
    images: [
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg'
    ],
    latitude: -31.4135,
    longitude: -64.1810,
  },
  {
    id: 103,
    title: 'Casa en Barrio Jardín - 4 Dormitorios',
    type: 'casa',
    location: 'Barrio Jardín, Córdoba Capital',
    price: 320000,
    beds: 4,
    baths: 3,
    sqm: 280,
    sqm_total: 450,
    parkings: 3,
    antiquity: '15 años',
    status: 'disponible',
    featured: true,
    description: 'Imponente casa en Barrio Jardín, una de las zonas más exclusivas de Córdoba. Living comedor doble altura, cocina integrada con isla, toilette de recepción. Master suite con vestidor y baño con hidromasaje. Tres dormitorios adicionales con placares. Quincho cerrado con parrilla, piscina, jardín parquizado. Cochera para 3 autos.',
    images: [
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg'
    ],
    latitude: -31.4321,
    longitude: -64.2012,
  },
  {
    id: 104,
    title: 'Departamento en Güemes - 1 Dormitorio',
    type: 'departamento',
    location: 'Güemes, Córdoba Capital',
    price: 95000,
    beds: 1,
    baths: 1,
    sqm: 45,
    sqm_total: 50,
    parkings: 0,
    antiquity: '3 años',
    status: 'disponible',
    featured: false,
    description: 'Moderno monoambiente divisio en Güemes, zona gastronómica y cultural. Cocina integrada, balcón con vista al cerro. Baño completo moderno. Ideal para estudiante o profesional soltero. A metros de la Cañada y transporte público.',
    images: [
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg'
    ],
    latitude: -31.4189,
    longitude: -64.1855,
  },
  {
    id: 105,
    title: 'Terreno en Barrio Cerrado - 800 m²',
    type: 'terreno',
    location: 'Malagueño, Córdoba',
    price: 85000,
    beds: 0,
    baths: 0,
    sqm: 800,
    sqm_total: 800,
    parkings: 0,
    antiquity: '0 años',
    status: 'disponible',
    featured: true,
    description: 'Lote de 800 m² en barrio cerrado con seguridad 24hs, club house, pileta, canchas de tenis y fútbol. Servicios de luz, agua, gas y cloacas por tendido. Acceso directo desde ruta. Ideal para construir la casa de tus sueños.',
    images: [
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg'
    ],
    latitude: -31.3892,
    longitude: -64.2567,
  },
  {
    id: 106,
    title: 'Local Comercial en Zona Norte - 120 m²',
    type: 'local',
    location: 'Zona Norte, Córdoba Capital',
    price: 150000,
    beds: 0,
    baths: 1,
    sqm: 120,
    sqm_total: 120,
    parkings: 2,
    antiquity: '8 años',
    status: 'disponible',
    featured: false,
    description: 'Local comercial en excelente ubicación sobre avenida principal. 120 m² en planta baja, baño, oficina privada, depósito. Aire acondicionado, persianas automatizadas. Ideal para oficina, showroom o local gastronómico. Alto tránsito vehicular y peatonal.',
    images: [
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg'
    ],
    latitude: -31.3892,
    longitude: -64.2567,
  }
];

// ── Datos de alquileres demo ──────────────────────────────────────────────────
const DEMO_RENTALS = [
  {
    id: 201,
    title: 'Departamento en Nueva Córdoba - 2 Ambientes',
    type: 'departamento',
    location: 'Nueva Córdoba, Córdoba Capital',
    price_ars: 280000,
    beds: 2,
    baths: 1,
    sqm: 55,
    sqm_total: 65,
    status: 'disponible',
    featured: true,
    min_months: 12,
    furnished: true,
    description: 'Modern apartment in Nueva Córdoba, fully furnished. 2 bedrooms, 1 bathroom, balcony. Fully equipped kitchen, AC, WiFi included. Building with amenities: pool, gym, SUM, laundry. 12 month minimum lease.',
    images: [
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg'
    ],
    latitude: -31.4216,
    longitude: -64.1888,
  },
  {
    id: 202,
    title: 'Casa en Cerro de las Rosas - 3 Dormitorios',
    type: 'casa',
    location: 'Cerro de las Rosas, Córdoba Capital',
    price_ars: 450000,
    beds: 3,
    baths: 2,
    sqm: 140,
    sqm_total: 200,
    status: 'disponible',
    featured: true,
    min_months: 12,
    furnished: true,
    description: 'Beautiful house in Cerro de las Rosas, fully furnished. 3 bedrooms, 2 bathrooms, garden, garage. Quiet neighborhood, close to schools and shopping. 12 month minimum lease.',
    images: [
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg'
    ],
    latitude: -31.4156,
    longitude: -64.2012,
  },
  {
    id: 203,
    title: 'Local Comercial en Güemes - 80 m²',
    type: 'local',
    location: 'Güemes, Córdoba Capital',
    price_ars: 350000,
    beds: 0,
    baths: 1,
    sqm: 80,
    sqm_total: 80,
    status: 'disponible',
    featured: true,
    min_months: 24,
    furnished: false,
    description: 'Commercial space in trendy Güemes neighborhood. 80m² open plan, bathroom, high ceilings, large windows. Ideal for retail, showroom, or cafe. High foot traffic area.',
    images: [
      '/images/placeholder-property.svg',
      '/images/placeholder-property.svg'
    ],
    latitude: -31.4189,
    longitude: -64.1855,
  }
];

// ── Datos de agentes demo ─────────────────────────────────────────────────────
const DEMO_AGENTS = [
  {
    id: 1,
    name: 'María',
    last: 'González',
    years: 12,
    license_number: 'CPI 4.234',
    specialty: 'Venta de propiedades premium',
    phone: '+54 351 411-0001',
    whatsapp: '+5493515000001',
    email: 'maria.gonzalez@bienenhaus.com.ar',
    avatar: '/images/placeholder-property.svg',
  },
  {
    id: 2,
    name: 'Carlos',
    last: 'Rodríguez',
    years: 8,
    license_number: 'CPI 5.123',
    specialty: 'Alquileres y administración',
    phone: '+54 351 411-0002',
    whatsapp: '+5493515000002',
    email: 'carlos.rodriguez@bienenhaus.com.ar',
    avatar: '/images/placeholder-property.svg',
  },
  {
    id: 3,
    name: 'Laura',
    last: 'Martínez',
    years: 15,
    license_number: 'CPI 3.789',
    specialty: 'Propiedades de lujo y fincas',
    phone: '+54 351 411-0003',
    whatsapp: '+5493515000003',
    email: 'laura.martinez@bienenhaus.com.ar',
    avatar: '/images/placeholder-property.svg',
  },
  {
    id: 4,
    name: 'Roberto',
    last: 'Silva',
    years: 6,
    license_number: 'CPI 6.045',
    specialty: 'Inversiones y desarrollos',
    phone: '+54 351 411-0004',
    whatsapp: '+5493515000004',
    email: 'roberto.silva@bienenhaus.com.ar',
    avatar: '/images/placeholder-property.svg',
  }
];

// ── Funciones de utilidad para datos demo ─────────────────────────────────────
function getDemoProperties() {
  return DEMO_PROPERTIES;
}

function getDemoRentals() {
  return DEMO_RENTALS;
}

function getDemoAgents() {
  return DEMO_AGENTS;
}

// ── Función para mezclar datos API con datos demo ─────────────────────────────
function mergeWithDemo(apiData, demoData, key = 'id') {
  if (!apiData || !apiData.length) return demoData;

  const apiIds = new Set(apiData.map(item => item.id));
  const uniqueDemo = demoData.filter(item => !apiIds.has(item.id));
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

// Exportar para uso global
window.DEMO_PROPERTIES = DEMO_PROPERTIES;
window.DEMO_RENTALS = DEMO_RENTALS;
window.DEMO_AGENTS = DEMO_AGENTS;
window.mergeProperties = mergeProperties;
window.mergeRentals = mergeRentals;
window.mergeAgents = mergeAgents;
window.getDemoProperties = () => DEMO_PROPERTIES;
window.getDemoRentals = () => DEMO_RENTALS;
window.getDemoAgents = () => DEMO_AGENTS;

