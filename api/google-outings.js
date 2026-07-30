// Google Uitjes API.
// Server-side Google Places Nearby Search proxy voor uitjes langs de actieve reisdag.

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
  const storeName = `__ROADORA_RATE_${bucket}_V660__`;
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
  cacheName: '__ROADORA_GOOGLE_OUTINGS_CACHE_V663__',
  cacheTtlMs: 15 * 60 * 1000,
  requestTimeoutMs: 8000,
  maxPoints: 1,
  maxResultsPerPoint: 20,
  maxTotalResults: 20,
  defaultRadiusMeters: 25000,
  minRadiusMeters: 5000,
  maxRadiusMeters: 50000,
  concurrency: 1,
  routeEngine: 'outings-user-chosen-area-v2',
  placeMode: 'outings'
};

const OUTING_TYPES = {
  highlights: ['tourist_attraction', 'observation_deck', 'historical_landmark', 'scenic_spot'],
  nature: ['park', 'hiking_area', 'national_park', 'picnic_ground', 'botanical_garden', 'scenic_spot'],
  culture: ['museum', 'historical_place', 'monument', 'castle', 'art_gallery'],
  family: ['zoo', 'aquarium', 'amusement_park', 'playground', 'miniature_golf_course']
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
    lat,
    lng,
    index,
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : index,
    distanceFromStartMeters: Number.isFinite(distanceFromStartMeters) ? Math.max(0, Math.round(distanceFromStartMeters)) : null,
    label: String(point?.label || '').trim().slice(0, 120)
  };
}
function normalizeOutingType(value) {
  const id = String(value || 'highlights').toLowerCase();
  return Object.prototype.hasOwnProperty.call(OUTING_TYPES, id) ? id : 'highlights';
}
function sanitizeSearchTerm(value) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}
function normalizeSearchText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function exactNameStrength(name, query) {
  const a = normalizeSearchText(name);
  const b = normalizeSearchText(query);
  if (!a || !b || b.length < 3) return 0;
  if (a === b) return 3;
  if (a.startsWith(b) || b.startsWith(a)) return Math.min(a.length, b.length) >= 5 ? 2 : 1;
  if (a.includes(b) || b.includes(a)) return b.length >= 6 ? 1 : 0;
  return 0;
}
function isLikelyExactNameQuery(query) {
  const value = normalizeSearchText(query);
  if (!value) return false;
  const generic = new Set(['bergwandeling','wandeling','hiking','waterval','zwemmeer','zwemmen','museum','dierentuin','uitzichtpunt','pretpark','natuur','cultuur','kasteel','park','speeltuin','aquarium','bezienswaardigheid','bezienswaardigheden']);
  if (generic.has(value)) return false;
  return value.split(/\s+/).length >= 2 || value.length >= 8;
}
function cacheKey(points, radiusMeters, mode, outingType, searchTerm = '') {
  const compact = points.map(p => `${roundCoord(p.lat)},${roundCoord(p.lng)}`).join('|');
  return `${CONFIG.placeMode}:${outingType}:${normalizeSearchText(searchTerm)}:${mode || 'default'}:${radiusMeters}:${compact}`;
}
function haversineKm(lat1, lng1, lat2, lng2) {
  const values = [lat1, lng1, lat2, lng2].map(Number);
  if (!values.every(Number.isFinite)) return Infinity;
  const [aLat, aLng, bLat, bLng] = values;
  const toRad = value => value * Math.PI / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}
function outingTypeLabel(type) {
  return ({ highlights: 'Bezienswaardigheid', nature: 'Natuur', culture: 'Cultuur', family: 'Gezinsuitje' })[type] || 'Uitje';
}
function inferOutingLabel(place, selectedType) {
  const types = Array.isArray(place?.types) ? place.types : [];
  if (types.includes('museum') || types.includes('art_museum') || types.includes('history_museum')) return 'Museum';
  if (types.includes('castle')) return 'Kasteel';
  if (types.includes('historical_place') || types.includes('historical_landmark') || types.includes('monument')) return 'Historische plek';
  if (types.includes('zoo')) return 'Dierentuin';
  if (types.includes('aquarium')) return 'Aquarium';
  if (types.includes('amusement_park')) return 'Attractiepark';
  if (types.includes('playground') || types.includes('indoor_playground')) return 'Speeltuin';
  if (types.includes('hiking_area')) return 'Wandeling';
  if (types.includes('park') || types.includes('national_park') || types.includes('botanical_garden')) return 'Park/natuur';
  if (types.includes('observation_deck') || types.includes('scenic_spot')) return 'Uitzichtpunt';
  return outingTypeLabel(selectedType);
}
function inferAmenities(place, selectedType) {
  const types = Array.isArray(place?.types) ? place.types : [];
  const values = new Set([inferOutingLabel(place, selectedType)]);
  if (types.includes('park') || types.includes('picnic_ground')) values.add('Buiten');
  if (types.includes('museum') || types.includes('aquarium')) values.add('Binnen');
  if (types.includes('playground') || types.includes('zoo') || types.includes('amusement_park')) values.add('Met kinderen');
  return Array.from(values).slice(0, 4);
}
function suggestedDurationMinutes(label, selectedType) {
  if (/Museum|Aquarium|Dierentuin|Attractiepark/i.test(label)) return selectedType === 'family' ? 120 : 90;
  if (/Wandeling|Park|natuur/i.test(label)) return 60;
  if (/Uitzichtpunt|Historische plek|Kasteel/i.test(label)) return 45;
  return 60;
}
function normalizePlace(hit, outingType, searchTerm = '', radiusMeters = CONFIG.defaultRadiusMeters) {
  const place = hit?.place || hit;
  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const openNow = typeof place?.regularOpeningHours?.openNow === 'boolean' ? place.regularOpeningHours.openNow : null;
  const distanceFromSearchKm = hit?.point ? haversineKm(hit.point.lat, hit.point.lng, lat, lng) : null;
  const detourMinutes = Number.isFinite(distanceFromSearchKm) ? Math.max(3, Math.min(60, Math.round(3 + distanceFromSearchKm * 1.4))) : 8;
  const outingLabel = inferOutingLabel(place, outingType);
  const name = place?.displayName?.text || `${outingTypeLabel(outingType)} rond zoekgebied`;
  const exactStrength = searchTerm ? exactNameStrength(name, searchTerm) : 0;
  const insideSearchArea = Number.isFinite(distanceFromSearchKm) ? distanceFromSearchKm <= (Number(radiusMeters) / 1000) + 0.25 : true;
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
    status: openNow === true ? 'nu open' : openNow === false ? 'nu mogelijk gesloten' : 'openingstijden controleren',
    detourMinutes,
    detourLabel: `± ${detourMinutes} min rijden`,
    distanceFromSearchKm: Number.isFinite(distanceFromSearchKm) ? Math.round(distanceFromSearchKm * 10) / 10 : null,
    searchAreaLabel: hit?.point?.label || 'Zelf gekozen zoekgebied',
    searchTerm: searchTerm || '',
    exactNameStrength: exactStrength,
    exactNameMatch: exactStrength >= 2,
    insideSearchArea,
    amenities: inferAmenities(place, outingType),
    outingType,
    outingLabel,
    suggestedDurationMin: suggestedDurationMinutes(outingLabel, outingType),
    googleMapsUri: place?.googleMapsUri || null,
    website: place?.websiteUri || null,
    phone: place?.nationalPhoneNumber || null,
    summary: place?.editorialSummary?.text || null,
    photoName: Array.isArray(place?.photos) && place.photos[0]?.name ? place.photos[0].name : null,
    photoNames: Array.isArray(place?.photos) ? place.photos.map(p => p?.name).filter(Boolean).slice(0, 5) : [],
    photoUrl: Array.isArray(place?.photos) && place.photos[0]?.name ? `/api/google-photo?name=${encodeURIComponent(place.photos[0].name)}&w=420` : null,
    photoUrls: Array.isArray(place?.photos) ? place.photos.map(p => p?.name).filter(Boolean).slice(0, 5).map(name => `/api/google-photo?name=${encodeURIComponent(name)}&w=720`) : [],
    routeSampleIndex: Number.isFinite(hit?.sampleIndex) ? hit.sampleIndex : null,
    routeProgress: Number.isFinite(hit?.point?.progress) ? hit.point.progress : null,
    distanceFromStartMeters: Number.isFinite(hit?.point?.distanceFromStartMeters) ? hit.point.distanceFromStartMeters : null
  };
}
async function searchOutingsNearPoint({ apiKey, point, radiusMeters, outingType }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id', 'places.name', 'places.displayName', 'places.formattedAddress', 'places.location',
          'places.rating', 'places.userRatingCount', 'places.regularOpeningHours.openNow',
          'places.googleMapsUri', 'places.websiteUri', 'places.nationalPhoneNumber',
          'places.photos.name', 'places.types', 'places.editorialSummary'
        ].join(',')
      },
      body: JSON.stringify({
        includedTypes: OUTING_TYPES[outingType],
        maxResultCount: CONFIG.maxResultsPerPoint,
        rankPreference: 'POPULARITY',
        locationRestriction: {
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
    return Array.isArray(data?.places) ? data.places.map(place => ({ place, sampleIndex: point.index, point })) : [];
  } finally {
    clearTimeout(timer);
  }
}
async function searchOutingsByText({ apiKey, point, radiusMeters, outingType, searchTerm }) {
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
          'places.id', 'places.name', 'places.displayName', 'places.formattedAddress', 'places.location',
          'places.rating', 'places.userRatingCount', 'places.regularOpeningHours.openNow',
          'places.googleMapsUri', 'places.websiteUri', 'places.nationalPhoneNumber',
          'places.photos.name', 'places.types', 'places.editorialSummary'
        ].join(',')
      },
      body: JSON.stringify({
        textQuery: searchTerm,
        maxResultCount: CONFIG.maxResultsPerPoint,
        rankPreference: 'RELEVANCE',
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
    return Array.isArray(data?.places) ? data.places.map(place => ({ place, sampleIndex: point.index, point })) : [];
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
      try { results.push({ status: 'fulfilled', value: await worker(current) }); }
      catch (reason) { results.push({ status: 'rejected', reason }); }
    }
  });
  await Promise.all(workers);
  return results;
}
function scorePlace(place) {
  const rating = Number(place.rating || 0);
  const reviews = Math.min(1, Math.log10(Math.max(1, Number(place.userRatingCount || 0))) / 4.5);
  const openBonus = place.openNow === true ? 0.15 : 0;
  const detourPenalty = Math.min(0.8, Number(place.detourMinutes || 0) / 45);
  return rating + reviews + openBonus - detourPenalty;
}
function dedupeAndSpread(rawHits, outingType, searchTerm = '', radiusMeters = CONFIG.defaultRadiusMeters, maxTotal = CONFIG.maxTotalResults) {
  const seen = new Set();
  const normalized = [];
  for (const hit of rawHits) {
    const place = normalizePlace(hit, outingType, searchTerm, radiusMeters);
    if (!place) continue;
    const id = place.id || `${roundCoord(place.lat, 4)},${roundCoord(place.lng, 4)}`;
    if (seen.has(id)) continue;
    seen.add(id); normalized.push(place);
  }
  const inside = normalized.filter(place => place.insideSearchArea !== false);
  inside.sort((a,b)=>{
    const exactDiff = Number(b.exactNameStrength || 0) - Number(a.exactNameStrength || 0);
    if (exactDiff) return exactDiff;
    const scoreDiff=scorePlace(b)-scorePlace(a);
    if(Math.abs(scoreDiff)>0.2) return scoreDiff;
    const ad=Number.isFinite(Number(a.distanceFromSearchKm))?Number(a.distanceFromSearchKm):999;
    const bd=Number.isFinite(Number(b.distanceFromSearchKm))?Number(b.distanceFromSearchKm):999;
    return ad-bd;
  });
  let outsideExact = null;
  if (searchTerm && isLikelyExactNameQuery(searchTerm)) {
    outsideExact = normalized
      .filter(place => place.insideSearchArea === false && Number(place.exactNameStrength || 0) >= 2 && Number(place.distanceFromSearchKm || Infinity) <= 250)
      .sort((a,b)=>Number(b.exactNameStrength||0)-Number(a.exactNameStrength||0) || Number(a.distanceFromSearchKm||999)-Number(b.distanceFromSearchKm||999))[0] || null;
    if (outsideExact) {
      outsideExact = {
        ...outsideExact,
        exactNameMatch: true,
        exactOutsideSearchArea: true,
        searchAreaLabel: `Exacte plek buiten gekozen zoekgebied`
      };
    }
  }
  const slots = Math.max(1, maxTotal - (outsideExact ? 1 : 0));
  const places = inside.slice(0, slots);
  if (outsideExact && !places.some(place => place.id === outsideExact.id)) places.unshift(outsideExact);
  return { places: places.slice(0, maxTotal), exactOutsideCount: outsideExact ? 1 : 0 };
}
export default async function handler(req, res) {
  const security = roadoraSecureRequest(req, res, { methods: 'POST, OPTIONS', maxRequests: 60, bucket: 'OUTINGS' });
  if (security.handled) return;
  if (req.method !== 'POST') return send(res, 405, { ok: false, status: 'method_not_allowed', places: [] });
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return send(res, 200, { ok: false, status: 'misconfigured', source: 'backend', message: 'GOOGLE_MAPS_API_KEY ontbreekt in Vercel Environment Variables.', places: [] });
  const body = req.body || {};
  const mode = String(body.mode || 'manual_place');
  const outingType = normalizeOutingType(body.outingType);
  const searchTerm = sanitizeSearchTerm(body.searchTerm);
  const points = Array.isArray(body.points) ? body.points.map(normalizePoint).filter(Boolean).slice(0, CONFIG.maxPoints) : [];
  const radiusMeters = Math.max(CONFIG.minRadiusMeters, Math.min(CONFIG.maxRadiusMeters, Number(body.radiusMeters) || CONFIG.defaultRadiusMeters));
  if (!points.length) return send(res, 200, { ok: true, status: 'no_route_points', source: 'google', routeEngine: CONFIG.routeEngine, outingType, places: [] });
  const key = cacheKey(points, radiusMeters, mode, outingType, searchTerm);
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.savedAt < CONFIG.cacheTtlMs) return send(res, 200, { ...cached.payload, cached: true });
  try {
    const settled = await runLimited(points, CONFIG.concurrency, point => searchTerm
      ? searchOutingsByText({ apiKey, point, radiusMeters, outingType, searchTerm })
      : searchOutingsNearPoint({ apiKey, point, radiusMeters, outingType }));
    const rawHits = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    const errors = settled.filter(result => result.status === 'rejected').map(result => String(result.reason?.message || result.reason)).slice(0, 4);
    const requestedMax = Number(body.maxResults);
    const maxResults = Number.isFinite(requestedMax) ? Math.max(1, Math.min(CONFIG.maxTotalResults, Math.round(requestedMax))) : CONFIG.maxTotalResults;
    const selected = dedupeAndSpread(rawHits, outingType, searchTerm, radiusMeters, maxResults);
    const places = selected.places;
    const payload = {
      ok: true,
      status: places.length ? (errors.length ? 'partial_live' : 'live') : (errors.length ? 'partial_error' : 'empty'),
      source: 'google', cached: false, routeEngine: CONFIG.routeEngine, outingType, searchTerm,
      searchedPoints: points.length, radiusMeters, count: places.length, exactOutsideCount: selected.exactOutsideCount, places, errors
    };
    trimCache();
    memoryCache.set(key, { savedAt: Date.now(), payload });
    return send(res, 200, payload);
  } catch (error) {
    return send(res, 200, { ok: false, status: 'error', source: 'google', routeEngine: CONFIG.routeEngine, outingType, searchTerm, message: String(error?.message || error), places: [] });
  }
}
