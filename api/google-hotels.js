// Roadora Google Hotels API — v4.1 Route Core Lock
// Server-side Google Places proxy for hotels/lodging along an ORS route.
// Safe for Vercel: API key stays in Environment Variables.


// Basis misbruikbeveiliging voor serverless proxy's.
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
  cacheName: '__ROADORA_GOOGLE_HOTELS_CACHE_V655__',
  cacheTtlMs: 15 * 60 * 1000,
  requestTimeoutMs: 8000,
  maxPoints: 3,
  maxResultsPerPoint: 20,
  maxTotalResults: 30,
  defaultRadiusMeters: 22000,
  minRadiusMeters: 5000,
  maxRadiusMeters: 25000,
  concurrency: 2,
  routeEngine: 'cost-safe-time-window-v3-hard-geofence',
  placeMode: 'hotels'
};

const memoryCache = globalThis[CONFIG.cacheName] || new Map();
globalThis[CONFIG.cacheName] = memoryCache;

function send(res, status, body) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
  res.status(status).json(body);
}

function trimCache(maxEntries = 80) {
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

function haversineMeters(lat1, lng1, lat2, lng2) {
  const values = [lat1, lng1, lat2, lng2].map(Number);
  if (!values.every(Number.isFinite)) return Infinity;
  const [aLat, aLng, bLat, bLng] = values;
  const toRad = value => value * Math.PI / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(Math.max(0, 1 - s)));
}

function normalizePoint(point, index = 0) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const progress = Number(point?.progress);
  const distanceFromStartMeters = Number(point?.distanceFromStartMeters);
  return {
    lat,
    lng,
    index,
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : index,
    distanceFromStartMeters: Number.isFinite(distanceFromStartMeters) ? Math.max(0, Math.round(distanceFromStartMeters)) : null
  };
}

function cacheKey(points, radiusMeters, mode, hotelQuery = '') {
  const compact = points.map(p => `${roundCoord(p.lat)},${roundCoord(p.lng)}`).join('|');
  const q = sanitizeHotelHint(hotelQuery || 'hotel lodging').replace(/\s+/g,'-');
  return `${CONFIG.placeMode}:${mode || 'default'}:${radiusMeters}:${q}:${compact}`;
}
function sanitizeHotelHint(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}
function buildHotelQuery(hint) {
  const clean = sanitizeHotelHint(hint);
  return clean ? `${clean} hotel lodging` : 'hotel lodging';
}

function inferHotelAmenities(place) {
  const text = [
    place?.displayName?.text,
    place?.formattedAddress,
    place?.editorialSummary?.text,
    ...(Array.isArray(place?.types) ? place.types : [])
  ].filter(Boolean).join(' ').toLowerCase();

  const amenities = new Set();
  if (text.includes('breakfast') || text.includes('ontbijt')) amenities.add('Ontbijt');
  if (text.includes('family') || text.includes('familie') || text.includes('children') || text.includes('kids')) amenities.add('Familie');
  if (text.includes('pet') || text.includes('dog') || text.includes('huisdier') || text.includes('hond')) amenities.add('Hond');
  if (text.includes('charging') || text.includes('ev') || text.includes('electric')) amenities.add('EV');
  if (text.includes('spa') || text.includes('wellness') || text.includes('pool') || text.includes('zwembad')) amenities.add('Wellness');
  return Array.from(amenities).slice(0, 6);
}

function normalizePlace(hit) {
  const place = hit?.place || hit;
  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const name = place?.displayName?.text || 'Hotel langs route';
  const openNow = typeof place?.regularOpeningHours?.openNow === 'boolean'
    ? place.regularOpeningHours.openNow
    : null;

  return {
    id: place?.id || place?.name || `${roundCoord(lat, 5)},${roundCoord(lng, 5)}`,
    name,
    address: place?.formattedAddress || 'Langs je route',
    lat,
    lng,
    rating: typeof place?.rating === 'number' ? place.rating : null,
    userRatingCount: typeof place?.userRatingCount === 'number' ? place.userRatingCount : null,
    openNow,
    provider: 'Google Places',
    checkedAt: new Date().toISOString(),
    status: openNow === true ? 'nu open' : 'beschikbaarheid checken',
    detourLabel: '± 10 min van route',
    amenities: inferHotelAmenities(place),
    googleMapsUri: place?.googleMapsUri || null,
    website: place?.websiteUri || null,
    phone: place?.nationalPhoneNumber || null,
    priceLevel: place?.priceLevel || null,
    photoName: Array.isArray(place?.photos) && place.photos[0]?.name ? place.photos[0].name : null,
    photoNames: Array.isArray(place?.photos) ? place.photos.map(p => p?.name).filter(Boolean).slice(0, 6) : [],
    photoUrl: Array.isArray(place?.photos) && place.photos[0]?.name ? `/api/google-photo?name=${encodeURIComponent(place.photos[0].name)}&w=420` : null,
    photoUrls: Array.isArray(place?.photos) ? place.photos.map(p => p?.name).filter(Boolean).slice(0, 6).map(name => `/api/google-photo?name=${encodeURIComponent(name)}&w=720`) : [],
    summary: place?.editorialSummary?.text || null,
    routeSampleIndex: Number.isFinite(hit?.sampleIndex) ? hit.sampleIndex : null,
    routeProgress: Number.isFinite(hit?.point?.progress) ? hit.point.progress : null,
    distanceFromStartMeters: Number.isFinite(hit?.point?.distanceFromStartMeters) ? hit.point.distanceFromStartMeters : null,
    searchPointDistanceMeters: Number.isFinite(hit?.point?.lat) && Number.isFinite(hit?.point?.lng)
      ? Math.round(haversineMeters(lat, lng, hit.point.lat, hit.point.lng))
      : null
  };
}

async function searchHotelsNearPoint({ apiKey, point, radiusMeters, hotelQuery }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.name',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.userRatingCount',
          'places.priceLevel',
          'places.googleMapsUri',
          'places.types',
          'places.regularOpeningHours',
          'places.websiteUri',
          'places.nationalPhoneNumber',
          'places.photos',
          'places.editorialSummary'
        ].join(',')
      },
      body: JSON.stringify({
        textQuery: hotelQuery,
        maxResultCount: CONFIG.maxResultsPerPoint,
        languageCode: 'nl',
        locationBias: {
          circle: {
            center: { latitude: point.lat, longitude: point.lng },
            radius: radiusMeters
          }
        }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `Google Places ${response.status}`;
      const code = data?.error?.status || 'GOOGLE_PLACES_ERROR';
      throw new Error(`${code}: ${message}`);
    }

    return Array.isArray(data?.places)
      ? data.places.map(place => ({ place, sampleIndex: point.index, point }))
      : [];
  } finally {
    clearTimeout(timer);
  }
}

async function runLimited(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const current = items[cursor++];
      try {
        results.push({ status: 'fulfilled', value: await worker(current) });
      } catch (reason) {
        results.push({ status: 'rejected', reason });
      }
    }
  });
  await Promise.all(workers);
  return results;
}

function scoreHotel(place) {
  const rating = Number(place.rating || 0);
  const reviews = Math.min(0.8, Math.log10(Math.max(1, Number(place.userRatingCount || 0))) / 5);
  const openBonus = place.openNow === true ? 0.1 : 0;
  return rating + reviews + openBonus;
}

function dedupeAndSpread(rawHits, maxTotal = CONFIG.maxTotalResults, radiusMeters = CONFIG.defaultRadiusMeters) {
  const seen = new Set();
  const normalized = [];

  for (const hit of rawHits) {
    const place = normalizePlace(hit);
    if (!place) continue;
    // Google Text Search locationBias is not a hard boundary. Enforce the requested
    // arrival-area circle ourselves so distant matches never reach the planner.
    if (!Number.isFinite(place.searchPointDistanceMeters) || place.searchPointDistanceMeters > radiusMeters) continue;
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

  for (const list of bySegment.values()) {
    list.sort((a, b) => scoreHotel(b) - scoreHotel(a) || a.__order - b.__order);
  }

  const keys = Array.from(bySegment.keys()).sort((a, b) => a - b);
  const result = [];
  let round = 0;
  while (result.length < maxTotal && round < 4) {
    for (const key of keys) {
      const item = bySegment.get(key)?.[round];
      if (item) {
        result.push(item);
        if (result.length >= maxTotal) break;
      }
    }
    round += 1;
  }

  return result
    .sort((a, b) => {
      const ap = Number.isFinite(a.routeProgress) ? a.routeProgress : (a.routeSampleIndex || 0);
      const bp = Number.isFinite(b.routeProgress) ? b.routeProgress : (b.routeSampleIndex || 0);
      return ap - bp;
    })
    .map(({ __order, ...place }) => place);
}

export default async function handler(req, res) {
  const security = roadoraSecureRequest(req, res, { methods: 'POST, OPTIONS', maxRequests: 60, bucket: 'HOTELS' });
  if (security.handled) return;
  if (req.method !== 'POST') return send(res, 405, { ok: false, status: 'method_not_allowed', places: [] });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return send(res, 200, {
      ok: false,
      status: 'misconfigured',
      source: 'backend',
      message: 'GOOGLE_MAPS_API_KEY ontbreekt in Vercel Environment Variables.',
      places: []
    });
  }

  const body = req.body || {};
  const requestedMax = Number(body.maxResults);
  const maxTotalResults = Number.isFinite(requestedMax) ? Math.max(1, Math.min(CONFIG.maxTotalResults, Math.round(requestedMax))) : CONFIG.maxTotalResults;
  const mode = String(body.mode || 'route_planning');
  const points = Array.isArray(body.points)
    ? body.points.map(normalizePoint).filter(Boolean).slice(0, CONFIG.maxPoints)
    : [];
  const radiusMeters = Math.max(CONFIG.minRadiusMeters, Math.min(CONFIG.maxRadiusMeters, Number(body.radiusMeters) || CONFIG.defaultRadiusMeters));
  const hotelQuery = buildHotelQuery(body.hotelHint);

  if (!points.length) {
    return send(res, 200, { ok: true, status: 'no_route_points', source: 'google', routeEngine: CONFIG.routeEngine, places: [] });
  }

  const key = cacheKey(points, radiusMeters, mode, hotelQuery);
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.savedAt < CONFIG.cacheTtlMs) {
    return send(res, 200, { ...cached.payload, cached: true });
  }

  try {
    const settled = await runLimited(points, CONFIG.concurrency, point => searchHotelsNearPoint({ apiKey, point, radiusMeters, hotelQuery }));
    const rawHits = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    const errors = settled.filter(result => result.status === 'rejected').map(result => String(result.reason?.message || result.reason)).slice(0, 4);
    const places = dedupeAndSpread(rawHits, maxTotalResults, radiusMeters);

    const payload = {
      ok: true,
      status: places.length ? (errors.length ? 'partial_live' : 'live') : (errors.length ? 'partial_error' : 'empty'),
      source: 'google',
      cached: false,
      routeEngine: CONFIG.routeEngine,
      searchedPoints: points.length,
      radiusMeters,
      hardGeofence: true,
      query: hotelQuery,
      costSafe: true,
      count: places.length,
      places,
      errors
    };

    trimCache();
    memoryCache.set(key, { savedAt: Date.now(), payload });
    return send(res, 200, payload);
  } catch (error) {
    return send(res, 200, {
      ok: false,
      status: 'error',
      source: 'google',
      routeEngine: CONFIG.routeEngine,
      message: String(error?.message || error),
      places: []
    });
  }
}
