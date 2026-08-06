// Roadora Geocoding + publieke appconfig API — v6.9.2
// Server-side Google Geocoding proxy. Keeps GOOGLE_MAPS_API_KEY out of frontend code.


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

function sendPublicAppConfig(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const supabasePublishableKey = String(
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();
  const validUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl);
  const configured = Boolean(validUrl && supabasePublishableKey);
  return res.status(200).json({
    configured,
    supabaseUrl: configured ? supabaseUrl : '',
    supabasePublishableKey: configured ? supabasePublishableKey : ''
  });
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
  const security = roadoraSecureRequest(req, res, { methods: 'GET, OPTIONS', maxRequests: 90, bucket: 'GEOCODE' });
  if (security.handled) return;
  if (req.method !== 'GET') return send(res, 405, { ok: false, status: 'method_not_allowed' });

  if (String(req.query?.mode || '').trim() === 'app-config') {
    return sendPublicAppConfig(res);
  }

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
