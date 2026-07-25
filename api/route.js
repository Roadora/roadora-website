// Roadora v4.8 — Google route primair + ORS fallback
// Doel:
// - Leaflet blijft kaartlaag; dit endpoint levert alleen een GeoJSON-route.
// - Google is primaire routeprovider wanneer GOOGLE_MAPS_API_KEY aanwezig is.
// - ORS blijft fallback wanneer Google ontbreekt of faalt.
// - Geen demo-route en geen verborgen fallbackcoördinaten.
// - Veilige debug zonder API-keys.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const q = req.query || {};
  const profile = sanitizeProfile(q.profile);
  const start = parseCoord(q.start);
  const end = parseCoord(q.end);
  const via = parseWaypoints(q.waypoints || q.via || '').slice(0, 9);

  if (!start || !end) {
    return res.status(400).json({
      ok:false,
      error:'Ongeldige start/eind coördinaten',
      received:{ start:String(q.start || ''), end:String(q.end || '') }
    });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_DIRECTIONS_API_KEY;
  const orsKey = process.env.ORS_API_KEY || process.env.OPENROUTESERVICE_API_KEY || process.env.OPEN_ROUTE_SERVICE_API_KEY;
  const debug = {
    requestedCoordinateCount: compactCoords([start, ...via, end]).length,
    start: coordLabel(start),
    end: coordLabel(end),
    profile,
    providers: {
      google: { configured: Boolean(googleKey), keyLength: googleKey ? String(googleKey).length : 0 },
      ors: { configured: Boolean(orsKey), keyLength: orsKey ? String(orsKey).length : 0 }
    },
    attempts: []
  };

  if (!googleKey && !orsKey) {
    return res.status(500).json({ ok:false, error:'Geen routeprovider ingesteld: GOOGLE_MAPS_API_KEY of ORS_API_KEY ontbreekt in Vercel.', mode:'no-provider', debug });
  }

  // 1) Google eerst. Voor routekwaliteit, ETA en toekomstige Places-logica is dit de beste primaire bron.
  if (googleKey) {
    const googleDirections = await tryGoogleDirections({ key: googleKey, start, end, via, timeoutMs: 12000 });
    debug.attempts.push(googleDirections.debug);
    if (googleDirections.ok) return res.status(200).json(addRoadoraMeta(googleDirections.data, { source:'google', mode:'google-directions', requestedWaypoints:via.length, usedWaypoints:via.length, skippedWaypoints:[] }));

    const googleRoutes = await tryGoogleRoutesApi({ key: googleKey, start, end, via, timeoutMs: 12000 });
    debug.attempts.push(googleRoutes.debug);
    if (googleRoutes.ok) return res.status(200).json(addRoadoraMeta(googleRoutes.data, { source:'google', mode:'google-routes-api', requestedWaypoints:via.length, usedWaypoints:via.length, skippedWaypoints:[] }));
  }

  // 2) ORS fallback. ORS is niet meer de enige bron; bij 502/504 crasht Roadora niet stil.
  if (orsKey) {
    const requestedCoordinates = compactCoords([start, ...via, end]);
    const orsDirect = await tryOrsRoute({ key: orsKey, profile, coordinates: requestedCoordinates, radiusesMode: via.length ? 'wide' : 'none', timeoutMs: 12000, authMode:'header' });
    debug.attempts.push(orsDirect.debug);
    if (orsDirect.ok) return res.status(200).json(addRoadoraMeta(orsDirect.data, { source:'ors', mode:via.length ? 'ors-waypoints-fallback' : 'ors-direct-fallback', requestedWaypoints:via.length, usedWaypoints:via.length, skippedWaypoints:[] }));

    const orsRecovery = await tryOrsRoute({ key: orsKey, profile, coordinates:[start, end], radiusesMode:'none', timeoutMs: 12000, authMode:'header' });
    debug.attempts.push(orsRecovery.debug);
    if (orsRecovery.ok) return res.status(200).json(addRoadoraMeta(orsRecovery.data, { source:'ors', mode:'ors-direct-recovery', requestedWaypoints:via.length, usedWaypoints:0, skippedWaypoints:via.map(coordLabel) }));
  }

  return res.status(bestStatus(debug.attempts)).json({
    ok:false,
    error:'Route niet geladen: Google en ORS gaven geen bruikbare route terug.',
    mode:'all-providers-failed',
    debug
  });
}

function sanitizeProfile(value) {
  const p = String(value || 'driving-car').replace(/[^a-z-]/g, '') || 'driving-car';
  const allowed = new Set(['driving-car','driving-hgv','cycling-regular','foot-walking']);
  return allowed.has(p) ? p : 'driving-car';
}
function parseCoord(value) {
  const parts = String(value || '').split(',').map(v => Number(String(v).trim()));
  if (parts.length !== 2) return null;
  const [lng, lat] = parts;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
  return [round6(lng), round6(lat)];
}
function parseWaypoints(raw) { return String(raw || '').split('|').map(parseCoord).filter(Boolean); }
function compactCoords(coords) {
  const out = [];
  for (const c of coords.filter(Boolean)) {
    const prev = out[out.length - 1];
    if (!prev || Math.abs(prev[0] - c[0]) > 0.00001 || Math.abs(prev[1] - c[1]) > 0.00001) out.push(c);
  }
  return out;
}
function round6(n) { return Math.round(Number(n) * 1e6) / 1e6; }
function coordLabel(c) { return `${round6(c[0])},${round6(c[1])}`; }
function latLngString(c) { return `${round6(c[1])},${round6(c[0])}`; }
function latLngObject(c) { return { latitude: Number(c[1]), longitude: Number(c[0]) }; }
function truncateBody(v) {
  const s = typeof v === 'string' ? v : JSON.stringify(v || {});
  return s.length > 1800 ? s.slice(0, 1800) + '…' : s;
}
function bestStatus(attempts) {
  const s5 = attempts.map(a => Number(a?.status)).find(s => s >= 500);
  const s4 = attempts.map(a => Number(a?.status)).find(s => s >= 400 && s < 500);
  return s5 || s4 || 502;
}
function hasGeometry(data) {
  const coords = data?.features?.[0]?.geometry?.coordinates;
  return Array.isArray(coords) && coords.length > 1;
}
function addRoadoraMeta(data, meta) {
  data.ok = true;
  data.roadora = meta;
  if (data.features?.[0]) {
    data.features[0].properties = data.features[0].properties || {};
    data.features[0].properties.roadora = meta;
  }
  return data;
}
function toGeoJson({ coordinates, distanceMeters, durationSeconds, providerRaw = {} }) {
  return {
    type:'FeatureCollection',
    bbox:bboxOf(coordinates),
    features:[{
      type:'Feature',
      properties:{ summary:{ distance:Number(distanceMeters || 0), duration:Number(durationSeconds || 0) }, providerRaw },
      geometry:{ type:'LineString', coordinates }
    }]
  };
}
function bboxOf(coords) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) { minLng = Math.min(minLng, lng); minLat = Math.min(minLat, lat); maxLng = Math.max(maxLng, lng); maxLat = Math.max(maxLat, lat); }
  return [minLng, minLat, maxLng, maxLat];
}
function decodePolyline(str) {
  let index = 0, lat = 0, lng = 0;
  const coordinates = [];
  while (index < String(str || '').length) {
    let b, shift = 0, result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20 && index < str.length);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0; result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20 && index < str.length);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    coordinates.push([round6(lng / 1e5), round6(lat / 1e5)]);
  }
  return coordinates;
}
function parseDurationSeconds(v) {
  if (typeof v === 'number') return v;
  const m = String(v || '').match(/^(\d+(?:\.\d+)?)s$/);
  return m ? Number(m[1]) : 0;
}

async function tryGoogleDirections({ key, start, end, via, timeoutMs = 12000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  const params = new URLSearchParams({
    origin: latLngString(start),
    destination: latLngString(end),
    mode: 'driving',
    language: 'nl',
    key
  });
  if (via.length) params.set('waypoints', via.map(latLngString).join('|'));
  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`, { signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    const route = Array.isArray(data.routes) ? data.routes[0] : null;
    const encoded = route?.overview_polyline?.points || '';
    const coords = decodePolyline(encoded);
    const legs = Array.isArray(route?.legs) ? route.legs : [];
    const distance = legs.reduce((sum, leg) => sum + Number(leg?.distance?.value || 0), 0);
    const duration = legs.reduce((sum, leg) => sum + Number(leg?.duration?.value || 0), 0);
    const debug = { provider:'google-directions', status:response.status, ok:response.ok && data.status === 'OK' && coords.length > 1, durationMs:Date.now() - startedAt, googleStatus:data.status || null, message:data.error_message || null };
    if (!response.ok || data.status !== 'OK' || coords.length < 2) return { ok:false, status:response.ok ? 502 : response.status, debug:{ ...debug, body:truncateBody({ status:data.status, error_message:data.error_message, routes:Array.isArray(data.routes) ? data.routes.length : 0 }) } };
    return { ok:true, status:200, data:toGeoJson({ coordinates:coords, distanceMeters:distance, durationSeconds:duration, providerRaw:{ provider:'google-directions', routeCount:data.routes.length } }), debug };
  } catch (err) {
    const status = err?.name === 'AbortError' ? 504 : 502;
    return { ok:false, status, debug:{ provider:'google-directions', status, ok:false, durationMs:Date.now() - startedAt, message:err?.name === 'AbortError' ? `Google Directions timeout na ${timeoutMs} ms` : (err?.message || 'Google Directions fetch fout') } };
  } finally { clearTimeout(timer); }
}

async function tryGoogleRoutesApi({ key, start, end, via, timeoutMs = 12000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  const body = {
    origin:{ location:{ latLng:latLngObject(start) } },
    destination:{ location:{ latLng:latLngObject(end) } },
    intermediates: via.map(c => ({ location:{ latLng:latLngObject(c) } })),
    travelMode:'DRIVE',
    routingPreference:'TRAFFIC_UNAWARE',
    polylineEncoding:'ENCODED_POLYLINE',
    languageCode:'nl-NL',
    units:'METRIC'
  };
  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Goog-Api-Key':key,
        'X-Goog-FieldMask':'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline'
      },
      body:JSON.stringify(body),
      signal:controller.signal
    });
    const data = await response.json().catch(() => ({}));
    const route = Array.isArray(data.routes) ? data.routes[0] : null;
    const encoded = route?.polyline?.encodedPolyline || '';
    const coords = decodePolyline(encoded);
    const debug = { provider:'google-routes-api', status:response.status, ok:response.ok && coords.length > 1, durationMs:Date.now() - startedAt, message:data?.error?.message || null };
    if (!response.ok || coords.length < 2) return { ok:false, status:response.ok ? 502 : response.status, debug:{ ...debug, body:truncateBody(data) } };
    return { ok:true, status:200, data:toGeoJson({ coordinates:coords, distanceMeters:route.distanceMeters, durationSeconds:parseDurationSeconds(route.duration), providerRaw:{ provider:'google-routes-api' } }), debug };
  } catch (err) {
    const status = err?.name === 'AbortError' ? 504 : 502;
    return { ok:false, status, debug:{ provider:'google-routes-api', status, ok:false, durationMs:Date.now() - startedAt, message:err?.name === 'AbortError' ? `Google Routes timeout na ${timeoutMs} ms` : (err?.message || 'Google Routes fetch fout') } };
  } finally { clearTimeout(timer); }
}

function radiusesFor(coordinates, mode) {
  if (mode === 'none') return null;
  if (mode === 'unlimited') return coordinates.map(() => -1);
  return coordinates.map((_, i) => (i === 0 || i === coordinates.length - 1) ? 5000 : 50000);
}
async function tryOrsRoute({ key, profile, coordinates, radiusesMode = 'none', timeoutMs = 12000, authMode='header' }) {
  const body = { coordinates, instructions:false, geometry_simplify:false, elevation:false, units:'m' };
  const radiuses = radiusesFor(coordinates, radiusesMode);
  if (radiuses) body.radiuses = radiuses;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson${authMode === 'query' ? `?api_key=${encodeURIComponent(key)}` : ''}`;
  const headers = { 'Content-Type':'application/json', Accept:'application/json, application/geo+json' };
  if (authMode === 'header') headers.Authorization = key;
  try {
    const orsRes = await fetch(url, { method:'POST', headers, body:JSON.stringify(body), signal:controller.signal });
    const text = await orsRes.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = { raw:text || '' }; }
    const debug = { provider:'ors', attempt:'post-geojson', authMode, radiusesMode, status:orsRes.status, ok:orsRes.ok, durationMs:Date.now() - startedAt, body:truncateBody(data) };
    if (!orsRes.ok) return { ok:false, status:orsRes.status, debug };
    if (!hasGeometry(data)) return { ok:false, status:502, debug:{ ...debug, message:'ORS gaf 200 terug, maar zonder route-geometry' } };
    return { ok:true, status:orsRes.status, data, debug };
  } catch (err) {
    const status = err?.name === 'AbortError' ? 504 : 502;
    return { ok:false, status, debug:{ provider:'ors', attempt:'post-geojson', authMode, radiusesMode, status, durationMs:Date.now() - startedAt, message:err?.name === 'AbortError' ? `ORS timeout na ${timeoutMs} ms` : (err?.message || 'ORS fetch fout') } };
  } finally { clearTimeout(timer); }
}
