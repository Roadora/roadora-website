// Roadora Google Places Photo proxy — v4.2 Hotel UX v2
// Keeps GOOGLE_MAPS_API_KEY server-side while showing Places photos in the app.


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

export default async function handler(req, res) {
  const security = roadoraSecureRequest(req, res, { methods: 'GET, OPTIONS', maxRequests: 180, bucket: 'PHOTO' });
  if (security.handled) return;
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).send('GOOGLE_MAPS_API_KEY missing');

  const name = String(req.query?.name || '').trim();
  const width = Math.max(120, Math.min(900, Number(req.query?.w) || 420));
  if (!name || !name.startsWith('places/')) return res.status(400).send('Invalid photo name');

  const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}&key=${encodeURIComponent(apiKey)}`;
  try {
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) return res.status(r.status).send('Photo not available');
    const contentType = r.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(502).send('Photo proxy error');
  }
}
