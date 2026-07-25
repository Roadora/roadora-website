// Roadora v4.7 — ORS route audit + stabiele foutdiagnose
// Doel:
// - ORS blijft routebron
// - geen demo-route of fallbackcoördinaten
// - meer tijd voor lange routes
// - elke ORS-poging geeft duidelijke, veilige debug terug zonder API-key

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = process.env.ORS_API_KEY || process.env.OPENROUTESERVICE_API_KEY || process.env.OPEN_ROUTE_SERVICE_API_KEY;
  if (!key) return res.status(500).json({ ok:false, error:'ORS_API_KEY ontbreekt in Vercel Environment Variables', env:{ hasORS:false } });

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

  const requestedCoordinates = compactCoords([start, ...via, end]);
  if (requestedCoordinates.length < 2) return res.status(400).json({ ok:false, error:'Te weinig geldige routepunten' });

  const baseDebug = {
    source:'ors',
    profile,
    requestedCoordinateCount: requestedCoordinates.length,
    start: coordLabel(start),
    end: coordLabel(end),
    hasKey: true,
    keyLength: String(key).length
  };

  try {
    if (!via.length) {
      const attempts = [];

      const simple = await tryOrsRoute({ key, profile, coordinates:[start, end], radiusesMode:'none', timeoutMs:20000, authMode:'header' });
      attempts.push(simple.debug);
      if (simple.ok) return res.status(200).json(addRoadoraMeta(simple.data, { source:'ors', mode:'direct-simple', requestedWaypoints:0, usedWaypoints:0, skippedWaypoints:[] }));

      const queryAuth = await tryOrsRoute({ key, profile, coordinates:[start, end], radiusesMode:'none', timeoutMs:20000, authMode:'query' });
      attempts.push(queryAuth.debug);
      if (queryAuth.ok) return res.status(200).json(addRoadoraMeta(queryAuth.data, { source:'ors', mode:'direct-simple-query-auth', requestedWaypoints:0, usedWaypoints:0, skippedWaypoints:[] }));

      const recovery = await tryOrsRoute({ key, profile, coordinates:[start, end], radiusesMode:'unlimited', timeoutMs:20000, authMode:'header' });
      attempts.push(recovery.debug);
      if (recovery.ok) return res.status(200).json(addRoadoraMeta(recovery.data, { source:'ors', mode:'direct-unlimited-snap', requestedWaypoints:0, usedWaypoints:0, skippedWaypoints:[] }));

      return res.status(bestStatus([simple, queryAuth, recovery])).json({
        ok:false,
        error:'ORS route fout',
        mode:'direct-route-failed',
        debug:{ ...baseDebug, attempts }
      });
    }

    const attempts = [];
    let route = await tryOrsRoute({ key, profile, coordinates: requestedCoordinates, radiusesMode:'wide', timeoutMs:20000, authMode:'header' });
    attempts.push(route.debug);
    if (route.ok) return res.status(200).json(addRoadoraMeta(route.data, { source:'ors', mode:'full-waypoints', requestedWaypoints:via.length, usedWaypoints:via.length, skippedWaypoints:[] }));

    route = await tryOrsRoute({ key, profile, coordinates: requestedCoordinates, radiusesMode:'unlimited', timeoutMs:20000, authMode:'header' });
    attempts.push(route.debug);
    if (route.ok) return res.status(200).json(addRoadoraMeta(route.data, { source:'ors', mode:'full-waypoints-unlimited-snap', requestedWaypoints:via.length, usedWaypoints:via.length, skippedWaypoints:[] }));

    const segmented = await buildSegmentedRoute({ key, profile, start, end, via });
    attempts.push(...(segmented.attempts || []));
    if (segmented.ok) return res.status(200).json(segmented.data);

    const direct = await tryOrsRoute({ key, profile, coordinates:[start, end], radiusesMode:'none', timeoutMs:20000, authMode:'header' });
    attempts.push(direct.debug);
    if (direct.ok) return res.status(200).json(addRoadoraMeta(direct.data, { source:'ors', mode:'direct-recovery', requestedWaypoints:via.length, usedWaypoints:0, skippedWaypoints:via.map(coordLabel) }));

    return res.status(bestStatus([route, segmented, direct])).json({ ok:false, error:'ORS route fout', mode:'waypoint-route-failed', debug:{ ...baseDebug, attempts } });
  } catch (err) {
    return res.status(500).json({ ok:false, error:err?.message || 'Route API fout', debug:baseDebug });
  }
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
function radiusesFor(coordinates, mode) {
  if (mode === 'none') return null;
  if (mode === 'unlimited') return coordinates.map(() => -1);
  return coordinates.map((_, i) => (i === 0 || i === coordinates.length - 1) ? 5000 : 50000);
}
function bestStatus(results) {
  const status = results.map(r => Number(r?.status || r?.debug?.status)).find(s => s && s >= 400 && s < 500) ||
    results.map(r => Number(r?.status || r?.debug?.status)).find(s => s && s >= 500) || 502;
  return status;
}
function truncateBody(v) {
  const s = typeof v === 'string' ? v : JSON.stringify(v || {});
  return s.length > 1800 ? s.slice(0, 1800) + '…' : s;
}

async function tryOrsRoute({ key, profile, coordinates, radiusesMode = 'none', timeoutMs = 20000, authMode='header' }) {
  const body = { coordinates, instructions:false, geometry_simplify:false, elevation:false, units:'m' };
  const radiuses = radiusesFor(coordinates, radiusesMode);
  if (radiuses) body.radiuses = radiuses;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  let orsRes;
  let text = '';
  const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson${authMode === 'query' ? `?api_key=${encodeURIComponent(key)}` : ''}`;
  const headers = { 'Content-Type':'application/json', Accept:'application/json, application/geo+json' };
  if (authMode === 'header') headers.Authorization = key;

  try {
    orsRes = await fetch(url, { method:'POST', headers, body:JSON.stringify(body), signal:controller.signal });
    text = await orsRes.text();
  } catch (err) {
    clearTimeout(timer);
    const status = err?.name === 'AbortError' ? 504 : 502;
    return {
      ok:false,
      status,
      debug:{
        attempt:'post-geojson',
        authMode,
        radiusesMode,
        status,
        durationMs:Date.now() - startedAt,
        message: err?.name === 'AbortError' ? `ORS timeout na ${timeoutMs} ms` : (err?.message || 'ORS fetch fout')
      }
    };
  } finally {
    clearTimeout(timer);
  }

  let data;
  try { data = JSON.parse(text); } catch (_) { data = { raw:text || '' }; }
  const debug = {
    attempt:'post-geojson',
    authMode,
    radiusesMode,
    status:orsRes.status,
    ok:orsRes.ok,
    durationMs:Date.now() - startedAt,
    body:truncateBody(data)
  };

  if (!orsRes.ok) return { ok:false, status:orsRes.status, debug };
  if (!hasGeometry(data)) return { ok:false, status:502, debug:{ ...debug, message:'ORS gaf 200 terug, maar zonder route-geometry' } };
  return { ok:true, status:orsRes.status, data, debug };
}

function hasGeometry(data) {
  const coords = data?.features?.[0]?.geometry?.coordinates;
  return Array.isArray(coords) && coords.length > 1;
}
function summaryOf(data) { return data?.features?.[0]?.properties?.summary || { distance:0, duration:0 }; }
function coordsOf(data) { return data?.features?.[0]?.geometry?.coordinates || []; }
function addRoadoraMeta(data, meta) {
  data.ok = true;
  data.roadora = meta;
  if (data.features?.[0]) {
    data.features[0].properties = data.features[0].properties || {};
    data.features[0].properties.roadora = meta;
  }
  return data;
}

async function buildSegmentedRoute({ key, profile, start, end, via }) {
  const routePoints = [start, ...via, end];
  let current = routePoints[0];
  const merged = [];
  let distance = 0;
  let duration = 0;
  const used = [];
  const skipped = [];
  const attempts = [];

  for (let i = 1; i < routePoints.length; i++) {
    const target = routePoints[i];
    const isFinal = i === routePoints.length - 1;
    const segment = await tryOrsRoute({ key, profile, coordinates:[current, target], radiusesMode:'unlimited', timeoutMs:20000, authMode:'header' });
    attempts.push(segment.debug);
    if (!segment.ok) {
      if (!isFinal) { skipped.push(coordLabel(target)); continue; }
      return { ok:false, status:segment.status, attempts };
    }
    const part = coordsOf(segment.data);
    if (part.length) merged.push(...(merged.length ? part.slice(1) : part));
    const s = summaryOf(segment.data);
    distance += Number(s.distance || 0);
    duration += Number(s.duration || 0);
    if (!isFinal) used.push(coordLabel(target));
    current = target;
  }

  if (merged.length < 2) return { ok:false, status:502, attempts };
  const data = { type:'FeatureCollection', bbox:bboxOf(merged), features:[{ type:'Feature', properties:{ summary:{ distance, duration }, roadora:{ source:'ors', mode:'segmented-recovery', requestedWaypoints:via.length, usedWaypoints:used.length, skippedWaypoints:skipped } }, geometry:{ type:'LineString', coordinates:merged } }] };
  data.ok = true;
  data.roadora = data.features[0].properties.roadora;
  return { ok:true, data, attempts };
}
function bboxOf(coords) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) { minLng = Math.min(minLng, lng); minLat = Math.min(minLat, lat); maxLng = Math.max(maxLng, lng); maxLat = Math.max(maxLat, lat); }
  return [minLng, minLat, maxLng, maxLat];
}
