// Roadora v6.5.4 — gecontroleerde Leaflet CDN-fallback.
(() => {
  const cssPrimary = document.getElementById('leafletCss');
  const ensureFallbackCss = () => {
    if (cssPrimary?.sheet || document.getElementById('leafletCssFallback')) return;
    const link = document.createElement('link');
    link.id = 'leafletCssFallback';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };
  ensureFallbackCss();
  if (window.L) {
    window.ROADORA_LEAFLET_READY = Promise.resolve(true);
    return;
  }
  window.ROADORA_LEAFLET_READY = new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(Boolean(window.L));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
    setTimeout(() => resolve(Boolean(window.L)), 8000);
  });
})();
