// Roadora v4.6 — ORS direct route stabilisatie + duidelijke foutdetails
// Belangrijkste fix:
// - bij een gewone A→B route doet dit endpoint niet meer 2/3 zware ORS-pogingen achter elkaar
// - daardoor voorkom je onnodige 502/504 timeouts op Vercel
// - demo/fallback-coördinaten blijven uitgeschakeld

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = process.env.ORS_API_KEY || process.env.OPENROUTESERVICE_API_KEY || process.env.OPEN_ROUTE_SERVICE_API_KEY;
  if (!key) return res.status(500).json({ ok:false, error:'ORS_API_KEY ontbreekt in Vercel env' });

  const q = req.query || {};
  const profile = sanitizeProfile(q.profile);
  const start = parseCoord(q.start);
  const end = parseCoord(q.end);
  const via = parseWaypoints(q.waypoints || q.via || '').slice(0, 9);

  if (!start || !end) {
    return res.status(400).json({
      ok:false,
      error:'Ongeldige start/eind coordinaten',
      received:{ start:String(q.start || ''), end:String(q.end || '') }
    });
  }

  const requestedCoordinates = compactCoords([start, ...via, end]);
  if (requestedCoordinates.length < 2) {
    return res.status(400).json({ ok:false, error:'Te weinig geldige routepunten' });
  }

  try {
    // Normale gebruikerroute zonder via-stops: hou dit bewust licht.
    // De vorige versie probeerde soms meerdere zware ORS-requests achter elkaar.
    // Op Vercel gaf dat bij lange routes sneller 502/504.
    if (!via.length) {
      const simple = await tryOrsRoute({
        key,
        profile,
        coordinates:[start, end],
        radiusesMode:'none',
        timeoutMs:8500
      });
      if (simple.ok) {
        return res.status(200).json(addRoadoraMeta(simple.data, {
          source:'ors',
          mode:'direct-simple',
          requestedWaypoints:0,
          usedWaypoints:0,
          skippedWaypoints:[]
        }));
      }

      // Eén lichte herstelpoging met ruim snappen, niet drie keer.
      const recovery = await tryOrsRoute({
        key,
        profile,
        coordinates:[start, end],
        radiusesMode:'unlimited',
        timeoutMs:8500
      });
      if (recovery.ok) {
        return res.status(200).json(addRoadoraMeta(recovery.data, {
          source:'ors',
          mode:'direct-unlimited-snap',
          requestedWaypoints:0,
          usedWaypoints:0,
          skippedWaypoints:[]
        }));
      }

      return res.status(recovery.status || simple.status || 502).json({
        ok:false,
        error:'ORS route fout',
        status: recovery.status || simple.status || 502,
        mode:'direct-route-failed',
        detail: recovery.detail || simple.detail || null,
        coordinates:{ start:coordLabel(start), end:coordLabel(end), profile }
      });
    }

    // Route met via-stops: eerst volledig proberen, daarna herstel per segment.
    let route = await tryOrsRoute({ key, profile, coordinates: requestedCoordinates, radiusesMode:'wide', timeoutMs:8500 });
    if (route.ok) {
      return res.status(200).json(addRoadoraMeta(route.data, {
        source:'ors',
        mode:'full-waypoints',
        requestedWaypoints:via.length,
        usedWaypoints:via.length,
        skippedWaypoints:[]
      }));
    }

    route = await tryOrsRoute({ key, profile, coordinates: requestedCoordinates, radiusesMode:'unlimited', timeoutMs:8500 });
    if (route.ok) {
      return res.status(200).json(addRoadoraMeta(route.data, {
        source:'ors',
        mode:'full-waypoints-unlimited-snap',
        requestedWaypoints:via.length,
        usedWaypoints:via.length,
        skippedWaypoints:[]
      }));
    }

    const segmented = await buildSegmentedRoute({ key, profile, start, end, via });
    if (segmented.ok) return res.status(200).json(segmented.data);

    const direct = await tryOrsRoute({ key, profile, coordinates:[start, end], radiusesMode:'none', timeoutMs:8500 });
    if (direct.ok) {
      return res.status(200).json(addRoadoraMeta(direct.data, {
        source:'ors',
        mode:'direct-recovery',
        requestedWaypoints:via.length,
        usedWaypoints:0,
        skippedWaypoints:via.map(coordLabel)
      }));
    }

    return res.status(direct.status || route.status || 502).json({
      ok:false,
      error:'ORS route fout',
      status:direct.status || route.status || 502,
      mode:'waypoint-route-failed',
      detail:direct.detail || route.detail || null
    });
  } catch (err) {
    return res.status(500).json({ ok:false, error:err?.message || 'Route API fout' });
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

function parseWaypoints(raw) {
  return String(raw || '').split('|').map(parseCoord).filter(Boolean);
}

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

async function tryOrsRoute({ key, profile, coordinates, radiusesMode = 'none', timeoutMs = 8500 }) {
  const body = {
    coordinates,
    instructions:false,
    geometry_simplify:false,
    elevation:false,
    units:'m'
  };
  const radiuses = radiusesFor(coordinates, radiusesMode);
  if (radiuses) body.radiuses = radiuses;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let orsRes;
  let text = '';

  try {
    orsRes = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
      method:'POST',
      headers:{
        Authorization:key,
        'Content-Type':'application/json',
        Accept:'application/json, application/geo+json'
      },
      body:JSON.stringify(body),
      signal:controller.signal
    });
    text = await orsRes.text();
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      return { ok:false, status:504, detail:{ message:`ORS timeout na ${timeoutMs} ms`, profile, radiusesMode } };
    }
    return { ok:false, status:502, detail:{ message:err?.message || 'ORS fetch fout', profile, radiusesMode } };
  } finally {
    clearTimeout(timer);
  }

  let data;
  try { data = JSON.parse(text); } catch (_) { data = { raw:text?.slice?.(0, 1200) || '' }; }

  if (!orsRes.ok) return { ok:false, status:orsRes.status, detail:data };
  if (!hasGeometry(data)) return { ok:false, status:502, detail:data };
  return { ok:true, status:orsRes.status, data };
}

function hasGeometry(data) {
  const coords = data?.features?.[0]?.geometry?.coordinates;
  return Array.isArray(coords) && coords.length > 1;
}

function summaryOf(data) {
  return data?.features?.[0]?.properties?.summary || { distance:0, duration:0 };
}

function coordsOf(data) {
  return data?.features?.[0]?.geometry?.coordinates || [];
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

async function buildSegmentedRoute({ key, profile, start, end, via }) {
  const routePoints = [start, ...via, end];
  let current = routePoints[0];
  const merged = [];
  let distance = 0;
  let duration = 0;
  const used = [];
  const skipped = [];

  for (let i = 1; i < routePoints.length; i++) {
    const target = routePoints[i];
    const isFinal = i === routePoints.length - 1;
    const segment = await tryOrsRoute({ key, profile, coordinates:[current, target], radiusesMode:'unlimited', timeoutMs:8500 });

    if (!segment.ok) {
      if (!isFinal) {
        skipped.push(coordLabel(target));
        continue;
      }
      return { ok:false, status:segment.status, detail:segment.detail };
    }

    const part = coordsOf(segment.data);
    if (part.length) {
      if (merged.length) merged.push(...part.slice(1));
      else merged.push(...part);
    }
    const s = summaryOf(segment.data);
    distance += Number(s.distance || 0);
    duration += Number(s.duration || 0);
    if (!isFinal) used.push(coordLabel(target));
    current = target;
  }

  if (merged.length < 2) return { ok:false, status:502, detail:'Segmented route heeft geen geometry' };

  const data = {
    type:'FeatureCollection',
    bbox:bboxOf(merged),
    features:[{
      type:'Feature',
      properties:{
        summary:{ distance, duration },
        roadora:{
          source:'ors',
          mode:'segmented-recovery',
          requestedWaypoints:via.length,
          usedWaypoints:used.length,
          skippedWaypoints:skipped
        }
      },
      geometry:{ type:'LineString', coordinates:merged }
    }]
  };
  data.ok = true;
  data.roadora = data.features[0].properties.roadora;
  return { ok:true, data };
}

function bboxOf(coords) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng); minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng); maxLat = Math.max(maxLat, lat);
  }
  return [minLng, minLat, maxLng, maxLat];
}
