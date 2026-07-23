/**
 * push-subscribe.js — Suscripción a notificaciones push (VAPID)
 */
(async function() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  // Esperar a que el service worker esté activo
  let reg;
  try {
    reg = await navigator.serviceWorker.ready;
  } catch {
    return;
  }

  // Si ya está suscripto, salir
  let sub = await reg.pushManager.getSubscription();
  if (sub) return;

  // Pedir permiso (solo una vez)
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return;

  async function _getCsrfToken() {
    try {
      const r = await fetch('/api/auth/csrf-token', { credentials: 'same-origin' });
      const d = await r.json();
      return d.ok ? d.data?.csrf_token : null;
    } catch { return null; }
  }

  try {
    // Obtener la clave pública desde el backend o hardcodeada
    // La expondremos via un meta tag en admin.html
    const meta = document.querySelector('meta[name="vapid-public-key"]');
    const publicKey = meta?.getAttribute('content');
    if (!publicKey) return;

    const keyBytes = Uint8Array.from(atob(publicKey.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes,
    });

    // Obtener token CSRF y enviar al backend
    const csrfToken = await _getCsrfToken();
    const headers = { 'Content-Type': 'application/json' };
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify(sub.toJSON()),
    });
  } catch {
    // Silencioso — el push no es crítico
  }
})();
