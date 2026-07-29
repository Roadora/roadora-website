// Roadora v6.7.3 — zoeken op naam of adres via Google Places Text Search (New).
// Server-side proxy zodat de Google Maps API-key nooit in de browser staat.

function header(req, name) {
  const headers = req?.headers || {};
  const value = headers[name] ?? headers[String(name).toLowerCase()] ?? headers[String(name).toUpperCase()];
  return Array.isArray(value) ? value[0] : String(value || '');
}
function allowedOrigins() {
  const configured = String(process.env.ROADORA_ALLOWED_ORIGINS || '')
    .split(',').map(v => v.trim().replace(/\/$/, '')).filter(Boolean);
  const defaults = ['https://roadora.eu', 'https://www.roadora.eu'];
  if (process.env.VERCEL_URL) defaults.push(`https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '').replace(/\/$/, '')}`);
  if (process.env.NODE_ENV !== 'production' || process.env.ROADORA_ALLOW_LOCALHOST === '1') {
    defaults.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173');
  }
  return new Set([...defaults, ...configured]);
}
function clientKey(req) {
  return header(req, 'x-forwarded-for').split(',')[0].trim() || header(req, 'x-real-ip') || req?.socket?.remoteAddress || 'unknown';
}
function secure(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const origin = header(req, 'origin').replace(/\/$/, '');
  if (origin) {
    if (!allowedOrigins().has(origin)) {
      res.status(403).json({ ok: false, status: 'origin_not_allowed', message: 'Deze API is alleen voor Roadora.' });
      return true;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  if (req.method !== 'GET') { res.status(405).json({ ok: false, status: 'method_not_allowed' }); return true; }

  const store = globalThis.__ROADORA_RATE_PLACE_SEARCH_V673__ || new Map();
  globalThis.__ROADORA_RATE_PLACE_SEARCH_V673__ = store;
  const now = Date.now();
  const key = clientKey(req);
  const previous = store.get(key);
  const entry = !previous || now - previous.startedAt >= 60000 ? { startedAt: now, count: 0 } : previous;
  entry.count += 1;
  store.set(key, entry);
  if (entry.count > 60) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((60000 - (now - entry.startedAt)) / 1000))));
    res.status(429).json({ ok: false, status: 'rate_limited', message: 'Te veel zoekopdrachten. Probeer het zo opnieuw.' });
    return true;
  }
  return false;
}

const cache = globalThis.__ROADORA_PLACE_SEARCH_CACHE_V673__ || new Map();
globalThis.__ROADORA_PLACE_SEARCH_CACHE_V673__ = cache;

function text(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function typeLabel(types = []) {
  const values = new Set(Array.isArray(types) ? types : []);
  if (values.has('campground') || values.has('rv_park')) return 'Camperplek of camping';
  if (values.has('hotel') || values.has('lodging')) return 'Hotel of overnachting';
  if (values.has('restaurant')) return 'Restaurant';
  if (values.has('cafe')) return 'Café';
  if (values.has('museum')) return 'Museum';
  if (values.has('amusement_park')) return 'Attractiepark';
  if (values.has('tourist_attraction')) return 'Uitje';
  if (values.has('park') || values.has('national_park')) return 'Park of natuur';
  if (values.has('store') || values.has('supermarket')) return 'Winkel';
  return 'Locatie';
}
function normalize(place) {
  const lat = num(place?.location?.latitude);
  const lng = num(place?.location?.longitude);
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const types = Array.isArray(place?.types) ? place.types.slice(0, 12) : [];
  const openNow = typeof place?.regularOpeningHours?.openNow === 'boolean' ? place.regularOpeningHours.openNow : null;
  return {
    id: text(place?.id || place?.name || `${lat},${lng}`, 160),
    name: text(place?.displayName?.text || place?.formattedAddress || 'Gevonden locatie', 160),
    address: text(place?.formattedAddress || '', 220),
    lat,
    lng,
    types,
    primaryType: text(place?.primaryType || '', 80),
    typeLabel: typeLabel(types),
    rating: Number.isFinite(Number(place?.rating)) ? Number(place.rating) : null,
    userRatingCount: Number.isFinite(Number(place?.userRatingCount)) ? Number(place.userRatingCount) : null,
    openNow,
    googleMapsUri: text(place?.googleMapsUri || '', 500),
    website: text(place?.websiteUri || '', 500),
    phone: text(place?.nationalPhoneNumber || '', 80),
    provider: 'Google Places'
  };
}
function send(res, status, body) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (secure(req, res)) return;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return send(res, 200, { ok: false, status: 'misconfigured', message: 'GOOGLE_MAPS_API_KEY ontbreekt.' });

  const query = text(req.query?.q || req.query?.query || '', 160);
  if (query.length < 2) return send(res, 400, { ok: false, status: 'missing_query', message: 'Vul minimaal twee tekens in.' });
  const lat = num(req.query?.lat);
  const lng = num(req.query?.lng);
  const requestedRadius = num(req.query?.radius);
  const radius = requestedRadius === null ? 150000 : Math.max(1000, Math.min(500000, requestedRadius));
  const key = `${query.toLowerCase()}|${lat?.toFixed(3) || ''}|${lng?.toFixed(3) || ''}|${Math.round(radius)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.savedAt < 15 * 60 * 1000) return send(res, 200, { ...cached.payload, cached: true });

  const body = { textQuery: query, languageCode: 'nl', maxResultCount: 8 };
  if (lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id', 'places.name', 'places.displayName', 'places.formattedAddress', 'places.location',
          'places.types', 'places.primaryType', 'places.rating', 'places.userRatingCount',
          'places.regularOpeningHours.openNow', 'places.googleMapsUri', 'places.websiteUri',
          'places.nationalPhoneNumber'
        ].join(',')
      },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return send(res, 200, { ok: false, status: data?.error?.status || 'google_error', message: data?.error?.message || `Google Places ${response.status}` });
    }
    const results = (Array.isArray(data?.places) ? data.places : []).map(normalize).filter(Boolean).slice(0, 8);
    const payload = { ok: true, status: results.length ? 'live' : 'empty', query, results, cached: false };
    cache.set(key, { savedAt: Date.now(), payload });
    if (cache.size > 150) cache.delete(cache.keys().next().value);
    return send(res, 200, payload);
  } catch (error) {
    return send(res, 200, { ok: false, status: 'error', message: String(error?.message || error) });
  } finally {
    clearTimeout(timer);
  }
}
