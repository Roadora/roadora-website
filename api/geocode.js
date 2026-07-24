// Roadora Geocoding API — v4.4.1 Route & Places Audit Fix
// Server-side Google Geocoding proxy. Keeps GOOGLE_MAPS_API_KEY out of frontend code.

const CONFIG = {
  cacheName: '__ROADORA_GEOCODE_CACHE_V441__',
  cacheTtlMs: 24 * 60 * 60 * 1000,
  requestTimeoutMs: 8500,
  defaultRegion: 'nl',
  defaultLanguage: 'nl'
};

const memoryCache = globalThis[CONFIG.cacheName] || new Map();
globalThis[CONFIG.cacheName] = memoryCache;

function send(res, status, body) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(status).json(body);
}

function cleanQuery(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 180);
}

function cacheKey(query) {
  return query.toLowerCase();
}

function normalizeResult(item) {
  const loc = item?.geometry?.location || {};
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    formattedAddress: item?.formatted_address || null,
    lat,
    lng,
    location: { lat, lng },
    coord: [lng, lat],
    placeId: item?.place_id || null,
    types: Array.isArray(item?.types) ? item.types : []
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'GET') return send(res, 405, { ok: false, status: 'method_not_allowed' });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    return send(res, 200, {
      ok: false,
      status: 'misconfigured',
      message: 'GOOGLE_MAPS_API_KEY ontbreekt in Vercel Environment Variables.'
    });
  }

  const q = cleanQuery(req.query?.q || req.query?.address || '');
  if (!q) return send(res, 400, { ok: false, status: 'missing_query', message: 'Plaats of adres ontbreekt.' });

  const key = cacheKey(q);
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.savedAt < CONFIG.cacheTtlMs) {
    return send(res, 200, { ...cached.payload, cached: true });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);

  try {
    const params = new URLSearchParams({
      address: q,
      key: apiKey,
      language: CONFIG.defaultLanguage,
      region: CONFIG.defaultRegion
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, { signal: controller.signal });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return send(res, 200, { ok: false, status: 'google_error', message: `Google Geocoding ${response.status}` });
    }

    if (data.status !== 'OK') {
      return send(res, 200, {
        ok: false,
        status: data.status || 'empty',
        message: data.error_message || `Geen coördinaten gevonden voor: ${q}`
      });
    }

    const result = normalizeResult(Array.isArray(data.results) ? data.results[0] : null);
    if (!result) return send(res, 200, { ok: false, status: 'invalid_result', message: `Geen bruikbaar resultaat voor: ${q}` });

    const payload = { ok: true, status: 'live', query: q, result, cached: false };
    memoryCache.set(key, { savedAt: Date.now(), payload });
    if (memoryCache.size > 120) memoryCache.delete(memoryCache.keys().next().value);
    return send(res, 200, payload);
  } catch (error) {
    return send(res, 200, { ok: false, status: 'error', message: String(error?.message || error) });
  } finally {
    clearTimeout(timer);
  }
}
