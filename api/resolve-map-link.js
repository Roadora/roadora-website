// Roadora v6.7.0 — veilige Google Maps-link resolver.

function header(req, name) {
  const headers = req?.headers || {};
  const value = headers[name] ?? headers[String(name).toLowerCase()] ?? headers[String(name).toUpperCase()];
  return Array.isArray(value) ? value[0] : String(value || '');
}
function allowedOrigins() {
  const configured = String(process.env.ROADORA_ALLOWED_ORIGINS || '').split(',').map(v => v.trim().replace(/\/$/, '')).filter(Boolean);
  const values = ['https://roadora.eu', 'https://www.roadora.eu', ...configured];
  if (process.env.VERCEL_URL) values.push(`https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '').replace(/\/$/, '')}`);
  if (process.env.NODE_ENV !== 'production' || process.env.ROADORA_ALLOW_LOCALHOST === '1') {
    values.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://roadora.test:3000');
  }
  return new Set(values);
}
function secure(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const origin = header(req, 'origin').replace(/\/$/, '');
  if (origin) {
    if (!allowedOrigins().has(origin)) {
      res.status(403).json({ ok: false, status: 'origin_not_allowed', message: 'Deze API is alleen voor Roadora.' });
      return false;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') { res.status(204).end(); return false; }
  if (req.method !== 'GET') { res.status(405).json({ ok: false, status: 'method_not_allowed' }); return false; }
  return true;
}
function isAllowedMapHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'maps.app.goo.gl' || host === 'goo.gl' || host.endsWith('.google.com') || /(^|\.)google\.[a-z.]+$/.test(host);
}
function coordinatesFromText(value) {
  const raw = String(value || '');
  const patterns = [
    /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
    /[?&](?:q|query|destination|daddr)=(-?\d{1,2}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)/i,
    /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]), lng = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}
function queryFromMapUrl(value) {
  try {
    const url = new URL(value);
    for (const key of ['query', 'q', 'destination', 'daddr']) {
      const raw = url.searchParams.get(key);
      if (raw && !coordinatesFromText(raw)) return decodeURIComponent(raw.replace(/\+/g, ' ')).trim().slice(0, 180);
    }
    const place = url.pathname.match(/\/place\/([^/]+)/i);
    if (place?.[1]) return decodeURIComponent(place[1].replace(/\+/g, ' ')).trim().slice(0, 180);
  } catch (_) {}
  return '';
}
async function geocode(query, apiKey, signal) {
  const params = new URLSearchParams({ address: query, key: apiKey, language: 'nl', region: 'nl' });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, { signal });
  const data = await response.json().catch(() => ({}));
  const item = Array.isArray(data.results) ? data.results[0] : null;
  const lat = Number(item?.geometry?.location?.lat), lng = Number(item?.geometry?.location?.lng);
  if (!response.ok || data.status !== 'OK' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, label: item.formatted_address || query, placeId: item.place_id || '' };
}
export default async function handler(req, res) {
  if (!secure(req, res)) return;
  const raw = String(req.query?.url || '').trim().slice(0, 900);
  let source;
  try { source = new URL(raw); } catch (_) { return res.status(400).json({ ok: false, status: 'invalid_url', message: 'Dit is geen geldige Google Maps-link.' }); }
  if (source.protocol !== 'https:' || !isAllowedMapHost(source.hostname)) {
    return res.status(400).json({ ok: false, status: 'unsupported_url', message: 'Gebruik een Google Maps-link.' });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8500);
  try {
    let finalUrl = source.toString();
    if (source.hostname === 'maps.app.goo.gl' || source.hostname === 'goo.gl') {
      const response = await fetch(finalUrl, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'Roadora/6.7.0' } });
      finalUrl = response.url || finalUrl;
      const finalHost = new URL(finalUrl).hostname;
      if (!isAllowedMapHost(finalHost)) throw new Error('De link verwijst niet naar Google Maps.');
    }
    const direct = coordinatesFromText(finalUrl);
    if (direct) return res.status(200).json({ ok: true, result: { ...direct, label: `${direct.lat.toFixed(6)}, ${direct.lng.toFixed(6)}` } });
    const query = queryFromMapUrl(finalUrl);
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY;
    if (query && apiKey) {
      const result = await geocode(query, apiKey, controller.signal);
      if (result) return res.status(200).json({ ok: true, result });
    }
    return res.status(422).json({ ok: false, status: 'location_not_found', message: 'De Google Maps-link bevat geen uitleesbare locatie. Gebruik een volledig adres of coördinaten.' });
  } catch (error) {
    return res.status(422).json({ ok: false, status: 'resolve_failed', message: String(error?.message || error) });
  } finally { clearTimeout(timer); }
}
