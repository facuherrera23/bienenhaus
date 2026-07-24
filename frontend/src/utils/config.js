/**
 * Configuration constants for the frontend
 * Single source of truth for shared values
 */

// WhatsApp number - single source of truth
export const WHATSAPP_NUMBER = '5493514110000';

// Formatted for display
export const WHATSAPP_FORMATTED = '+54 351 411-0000';

// Pre-built WhatsApp URLs
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_URL_WITH_TEXT = (text = 'Hola Bienenhaus, quisiera recibir información.') =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// Site URL
export const SITE_URL = 'https://bienenhaus.onrender.com';

// API base
export const API_BASE = '/api';

// Pagination
export const PER_PAGE = 6;

// Breakpoints (matching tokens.css)
export const BREAKPOINTS = {
  mobile: 320,
  mobileLarge: 375,
  tablet: 480,
  tabletLarge: 600,
  desktop: 768,
  desktopLarge: 1024,
  desktopXL: 1280,
  desktopXXL: 1440
};

// Animation durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500
};

// Debounce delays
export const DEBOUNCE = {
  filter: 300,
  scroll: 100,
  resize: 250
};

// Storage keys
export const STORAGE_KEYS = {
  theme: 'bienenhaus_theme',
  lastVisit: 'bienenhaus_last_visit'
};

// External links
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/bienenhaus.prop',
  facebook: 'https://www.facebook.com/Bienenhaus.prop',
  youtube: 'https://www.youtube.com/@BienenhausPropiedades',
  tiktok: 'https://www.tiktok.com/@bienenhaus.prop'
};