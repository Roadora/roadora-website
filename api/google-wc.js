// Roadora Google WC API — v6.5.0
// Server-side Google Places Nearby Search proxy voor openbare toiletten en praktische pauzeplekken.


// Roadora v6.5.4 — basis misbruikbeveiliging voor serverless proxy's.
function roadoraRequestHeader(req, name) {
  const headers = req?.headers || {};
  const value = headers[name] ?? headers[String(name).toLowerCase()] ?? headers[String(name).toUpperCase()];
  return Array.isArray(value) ? value[0] : String(value || '');
}
function roadoraAllowedOrigins() {
  const configured = String(process.env.ROADORA_ALLOWED_ORIGINS || '').split(',').map(v => v.trim().replace(/\/$/, '')).filter(Boolean);
  const defaults = ['https://roadora.eu', 'https://www.roadora.eu'];
  if (process.env.VERCEL_URL) defaults.push(`https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '').replace(/\/$/, '')}`);
  if (process.env.NODE_ENV !== 'production' || process.env.ROADORA_ALLOW_LOCALHOST === '1') {
    defaults.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173');
  }
  return new Set([...defaults, ...configured]);
}
function roadoraClientKey(req) {
  const forwarded = roadoraRequestHeader(req, 'x-forwarded-for').split(',')[0].trim();
  return forwarded || roadoraRequestHeader(req, 'x-real-ip') || req?.socket?.remoteAddress || 'unknown';
}
function roadoraSecureRequest(req, res, { methods, maxRequests, bucket }) {
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const origin = roadoraRequestHeader(req, 'origin').replace(/\/$/, '');
  if (origin) {
    if (!roadoraAllowedOrigins().has(origin)) {
      res.status(403).json({ ok: false, status: 'origin_not_allowed', message: 'Deze API is alleen voor Roadora.' });
      return { handled: true };
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return { handled: true };
  }
  const length = Number(roadoraRequestHeader(req, 'content-length') || 0);
  let approx = 0;
  try { approx = req?.body ? JSON.stringify(req.body).length : JSON.stringify(req?.query || {}).length; } catch (_) {}
  if (length > 100000 || approx > 100000) {
    res.status(413).json({ ok: false, status: 'request_too_large' });
    return { handled: true };
  }
  const storeName = `__ROADORA_RATE_${bucket}_V654__`;
  const store = globalThis[storeName] || new Map();
  globalThis[storeName] = store;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const key = roadoraClientKey(req);
  const current = store.get(key);
  const entry = !current || now - current.startedAt >= windowMs ? { startedAt: now, count: 0 } : current;
  entry.count += 1;
  store.set(key, entry);
  if (store.size > 500) {
    for (const [ip, value] of store) if (now - value.startedAt >= windowMs) store.delete(ip);
  }
  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
  if (entry.count > maxRequests) {
    res.setHeader('Retry-After', String(Math.ceil((windowMs - (now - entry.startedAt)) / 1000)));
    res.status(429).json({ ok: false, status: 'rate_limited', message: 'Te veel verzoeken. Probeer het zo opnieuw.' });
    return { handled: true };
  }
  return { handled: false };
}

const CONFIG = {
  cacheName: '__ROADORA_GOOGLE_WC_CACHE_V650__',
  cacheTtlMs: 15 * 60 * 1000,
  requestTimeoutMs: 8000,
  maxPoints: 8,
  maxResultsPerPoint: 10,
  maxTotalResults: 35,
  defaultRadiusMeters: 4500,
  minRadiusMeters: 1200,
  maxRadiusMeters: 8000,
  concurrency: 3,
  routeEngine: 'wc-active-day-v1',
  placeMode: 'wc'
};

const memoryCache = globalThis[CONFIG.cacheName] || new Map();
globalThis[CONFIG.cacheName] = memoryCache;

function send(res, status, body) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
  res.status(status).json(body);
}
function trimCache(maxEntries = 100) {
  if (memoryCache.size <= maxEntries) return;
  const keys = Array.from(memoryCache.keys());
  for (const key of keys.slice(0, Math.max(0, keys.length - maxEntries))) memoryCache.delete(key);
}
function roundCoord(value, digits = 3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const m = 10 ** digits;
  return Math.round(n * m) / m;
}
function normalizePoint(point, index = 0) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const progress = Number(point?.progress);
  const distanceFromStartMeters = Number(point?.distanceFromStartMeters);
  return {
    lat, lng, index,
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : index,
    distanceFromStartMeters: Number.isFinite(distanceFromStartMeters) ? Math.max(0, Math.round(distanceFromStartMeters)) : null
  };
}
function cacheKey(points, radiusMeters, mode) {
  const compact = points.map(p => `${roundCoord(p.lat)},${roundCoord(p.lng)}`).join('|');
  return `${CONFIG.placeMode}:${mode || 'default'}:${radiusMeters}:${compact}`;
}
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = value => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function classifyPlace(place) {
  const types = Array.isArray(place?.types) ? place.types : [];
  if (types.includes('public_bathroom')) return { kind: 'public', label: 'Openbare WC', status: 'openbaar toilet' };
  if (types.includes('rest_stop')) return { kind: 'rest_stop', label: 'Rustplaats', status: 'WC en voorzieningen controleren' };
  if (types.includes('gas_station')) return { kind: 'gas_station', label: 'Tankstation', status: 'WC beschikbaarheid controleren' };
  return { kind: 'pause', label: 'Pauzeplek', status: 'voorzieningen controleren' };
}
function normalizePlace(hit) {
  const place = hit?.place || hit;
  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const cls = classifyPlace(place);
  const openNow = typeof place?.regularOpeningHours?.openNow === 'boolean' ? place.regularOpeningHours.openNow : null;
  const offRouteKm = hit?.point ? haversineKm(hit.point.lat, hit.point.lng, lat, lng) : null;
  const detourMinutes = Number.isFinite(offRouteKm) ? Math.max(1, Math.min(15, Math.round(1 + offRouteKm * 2))) : 3;
  const amenities = new Set([cls.label]);
  if (cls.kind === 'gas_station') amenities.add('Brandstof');
  if (cls.kind === 'rest_stop') amenities.add('Pauze');
  if (openNow === true) amenities.add('Nu toegankelijk');
  return {
    id: place?.id || place?.name || `${roundCoord(lat, 5)},${roundCoord(lng, 5)}`,
    name: place?.displayName?.text || cls.label,
    address: place?.formattedAddress || 'Langs je route',
    lat, lng,
    rating: typeof place?.rating === 'number' ? place.rating : null,
    userRatingCount: typeof place?.userRatingCount === 'number' ? place.userRatingCount : null,
    openNow,
    provider: 'Google Places',
    checkedAt: new Date().toISOString(),
    status: openNow === false ? `${cls.status} · nu mogelijk gesloten` : cls.status,
    detourMinutes,
    detourLabel: `± ${detourMinutes} min van route`,
    amenities: Array.from(amenities).slice(0, 4),
    wcKind: cls.kind,
    wcLabel: cls.label,
    googleMapsUri: place?.googleMapsUri || null,
    routeSampleIndex: Number.isFinite(hit?.sampleIndex) ? hit.sampleIndex : null,
    routeProgress: Number.isFinite(hit?.point?.progress) ? hit.point.progress : null,
    distanceFromStartMeters: Number.isFinite(hit?.point?.distanceFromStartMeters) ? hit.point.distanceFromStartMeters : null
  };
}
async function searchWcNearPoint({ apiKey, point, radiusMeters }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST', signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id','places.name','places.displayName','places.formattedAddress','places.location',
          'places.rating','places.userRatingCount','places.regularOpeningHours.openNow',
          'places.googleMapsUri','places.types'
        ].join(',')
      },
      body: JSON.stringify({
        includedTypes: ['public_bathroom', 'rest_stop', 'gas_station'],
        maxResultCount: CONFIG.maxResultsPerPoint,
        rankPreference: 'DISTANCE',
        locationRestriction: { circle: { center: { latitude: point.lat, longitude: point.lng }, radius: radiusMeters } }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `Google Places ${response.status}`;
      const code = data?.error?.status || 'GOOGLE_PLACES_ERROR';
      throw new Error(`${code}: ${message}`);
    }
    return Array.isArray(data?.places) ? data.places.map(place => ({ place, sampleIndex: point.index, point })) : [];
  } finally { clearTimeout(timer); }
}
async function runLimited(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const current = items[cursor++];
      try { results.push({ status: 'fulfilled', value: await worker(current) }); }
      catch (reason) { results.push({ status: 'rejected', reason }); }
    }
  });
  await Promise.all(workers);
  return results;
}
function scorePlace(place) {
  const kindBonus = place.wcKind === 'public' ? 1.2 : place.wcKind === 'rest_stop' ? 0.7 : 0.2;
  const rating = Number(place.rating || 0) * 0.35;
  const openBonus = place.openNow === true ? 0.25 : 0;
  return kindBonus + rating + openBonus;
}
function dedupeAndSpread(rawHits, maxTotal = CONFIG.maxTotalResults) {
  const seen = new Set();
  const normalized = [];
  for (const hit of rawHits) {
    const place = normalizePlace(hit);
    if (!place) continue;
    const id = place.id || `${roundCoord(place.lat, 4)},${roundCoord(place.lng, 4)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push(place);
  }
  const bySegment = new Map();
  normalized.forEach((place, order) => {
    const key = Number.isFinite(place.routeSampleIndex) ? place.routeSampleIndex : order;
    if (!bySegment.has(key)) bySegment.set(key, []);
    bySegment.get(key).push({ ...place, __order: order });
  });
  for (const list of bySegment.values()) list.sort((a, b) => scorePlace(b) - scorePlace(a) || a.__order - b.__order);
  const keys = Array.from(bySegment.keys()).sort((a, b) => a - b);
  const result = [];
  let round = 0;
  while (result.length < maxTotal && round < CONFIG.maxResultsPerPoint) {
    for (const key of keys) {
      const item = bySegment.get(key)?.[round];
      if (item) result.push(item);
      if (result.length >= maxTotal) break;
    }
    round += 1;
  }
  return result.sort((a, b) => (a.routeProgress ?? 0) - (b.routeProgress ?? 0)).map(({ __order, ...place }) => place);
}
export default async function handler(req, res) {
  const security = roadoraSecureRequest(req, res, { methods: 'POST, OPTIONS', maxRequests: 60, bucket: 'WC' });
  if (security.handled) return;
  if (req.method !== 'POST') return send(res, 405, { ok: false, status: 'method_not_allowed', places: [] });
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return send(res, 200, { ok: false, status: 'misconfigured', source: 'backend', message: 'GOOGLE_MAPS_API_KEY ontbreekt in Vercel Environment Variables.', places: [] });
  const body = req.body || {};
  const mode = String(body.mode || 'route_wc');
  const points = Array.isArray(body.points) ? body.points.map(normalizePoint).filter(Boolean).slice(0, CONFIG.maxPoints) : [];
  const radiusMeters = Math.max(CONFIG.minRadiusMeters, Math.min(CONFIG.maxRadiusMeters, Number(body.radiusMeters) || CONFIG.defaultRadiusMeters));
  if (!points.length) return send(res, 200, { ok: true, status: 'no_route_points', source: 'google', routeEngine: CONFIG.routeEngine, places: [] });
  const key = cacheKey(points, radiusMeters, mode);
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.savedAt < CONFIG.cacheTtlMs) return send(res, 200, { ...cached.payload, cached: true });
  try {
    const settled = await runLimited(points, CONFIG.concurrency, point => searchWcNearPoint({ apiKey, point, radiusMeters }));
    const rawHits = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    const errors = settled.filter(result => result.status === 'rejected').map(result => String(result.reason?.message || result.reason)).slice(0, 4);
    const places = dedupeAndSpread(rawHits, Math.min(CONFIG.maxTotalResults, Number(body.maxResults) || CONFIG.maxTotalResults));
    const payload = {
      ok: true, status: places.length ? (errors.length ? 'partial_live' : 'live') : (errors.length ? 'partial_error' : 'empty'),
      source: 'google', cached: false, routeEngine: CONFIG.routeEngine,
      searchedPoints: points.length, radiusMeters, count: places.length, places, errors
    };
    trimCache(); memoryCache.set(key, { savedAt: Date.now(), payload });
    return send(res, 200, payload);
  } catch (error) {
    return send(res, 200, { ok: false, status: 'error', source: 'google', routeEngine: CONFIG.routeEngine, message: String(error?.message || error), places: [] });
  }
}
