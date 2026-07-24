const routePoints = [
  [52.3676, 4.9041],
  [51.2277, 6.7735],
  [50.1109, 8.6821],
  [48.7758, 9.1829],
  [47.3769, 8.5417],
  [45.4384, 10.9916],
  [43.7711, 11.2486]
];

const stops = [
  { label: 'Start Amsterdam', type: 'start', time: '08:30', coords: [52.3676, 4.9041], text: 'Vertrekpunt van je roadtrip' },
  { label: 'Pauzezone Keulen', type: 'pause', time: '11:00', coords: [50.9375, 6.9603], text: 'WC · koffie · hond uitlaten' },
  { label: 'Lunch rond Frankfurt', type: 'lunch', time: '13:00', coords: [50.1109, 8.6821], text: 'Kindvriendelijk langs de route' },
  { label: 'Laad-/tankzone Ulm', type: 'charge', time: '15:15', coords: [48.4011, 9.9876], text: 'Gebaseerd op jouw rijbereik' },
  { label: 'Overnachten rond Verona/Toscane', type: 'hotel', time: '16:30 - 18:00', coords: [45.4384, 10.9916], text: 'Hotels passend bij profiel' },
  { label: 'Bestemming Toscane', type: 'end', time: 'Aankomst', coords: [43.7711, 11.2486], text: 'Eindpunt van de voorbeeldroute' }
];

const colors = { start: '#22a06b', pause: '#22a06b', lunch: '#e68112', charge: '#8b5bb7', hotel: '#2f7fa3', end: '#1f2528' };

function createMarkerIcon(stop) {
  const label = stop.type === 'start' ? '✓' : stop.type === 'end' ? '🏁' : stop.type === 'hotel' ? 'H' : stop.time.split(':')[0];
  return L.divIcon({
    className: `route-marker route-marker-${stop.type}`,
    html: `<span style="background:${colors[stop.type] || '#b68100'}">${label}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16]
  });
}

function fitMap(map, bounds) {
  map.invalidateSize(false);
  map.fitBounds(bounds, { padding: [42, 42], maxZoom: 7 });
}

function initRoadoraMap() {
  const el = document.getElementById('realMap');
  if (!el || !window.L || el.dataset.ready === 'true') return;
  el.dataset.ready = 'true';

  const map = L.map(el, {
    zoomControl: false,
    scrollWheelZoom: true,
    attributionControl: true,
    preferCanvas: true
  });

  map.setView([49.1, 7.9], 5);

  const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);

  tiles.once('load', () => el.closest('.map-card')?.classList.add('map-ready'));
  tiles.once('tileerror', () => {
    // Keep the route usable even if the tile server is temporarily slow.
    el.closest('.map-card')?.classList.add('map-ready');
  });

  const softRoute = L.polyline(routePoints, { color: '#f0d48a', weight: 12, opacity: 0.38, lineJoin: 'round' }).addTo(map);
  const route = L.polyline(routePoints, { color: '#b68100', weight: 5, opacity: 0.95, lineJoin: 'round' }).addTo(map);

  const markerLayer = L.layerGroup().addTo(map);
  stops.forEach((stop) => {
    L.marker(stop.coords, { icon: createMarkerIcon(stop) })
      .bindPopup(`<strong>${stop.label}</strong><br><span>${stop.time}</span><br>${stop.text}`)
      .addTo(markerLayer);
  });

  const bounds = route.getBounds().pad(0.18);
  fitMap(map, bounds);
  requestAnimationFrame(() => fitMap(map, bounds));
  setTimeout(() => fitMap(map, bounds), 300);
  setTimeout(() => fitMap(map, bounds), 900);

  document.getElementById('mapFit')?.addEventListener('click', () => fitMap(map, bounds));
  document.getElementById('mapZoomIn')?.addEventListener('click', () => map.zoomIn());
  document.getElementById('mapZoomOut')?.addEventListener('click', () => map.zoomOut());
  document.getElementById('mapToggleStops')?.addEventListener('click', () => {
    if (map.hasLayer(markerLayer)) map.removeLayer(markerLayer);
    else markerLayer.addTo(map);
  });

  window.addEventListener('resize', () => setTimeout(() => fitMap(map, bounds), 120));
}

function waitForLeaflet() {
  if (window.L) initRoadoraMap();
  else setTimeout(waitForLeaflet, 80);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForLeaflet);
else waitForLeaflet();
window.addEventListener('load', waitForLeaflet);
