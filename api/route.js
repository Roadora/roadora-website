
// Roadora route API — Google first, ORS fallback
// Frontend blijft hetzelfde endpoint gebruiken: /api/route?start=lng,lat&end=lng,lat
// Als GOOGLE_MAPS_API_KEY aanwezig is, gebruiken we Google Directions voor de echte route.
// Als alleen ORS_API_KEY aanwezig is, gebruiken we de bestaande ORS-flow.

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
    return res.status(400).json({ ok:false, error:'Ongeldige of ontbrekende start/eindcoördinaten' });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_DIRECTIONS_API_KEY;
  const orsKey = process.env.ORS_API_KEY || process.env.OPENROUTESERVICE_API_KEY || process.env.OPEN_ROUTE_SERVICE_API_KEY;

  // Primair Google gebruiken, omdat de rest van Roadora ook Google gebruikt voor geocoding/places/photos.
  if (googleKey) {
    const google = await tryGoogleDirections({ key: googleKey, start, end, via, profile });
    if (google.ok) return res.status(200).json(google.data);

    // Als Google faalt maar ORS beschikbaar is, proberen we ORS als herstel.
    if (!orsKey) {
      return res.status(google.status || 502).json({
        ok:false,
        error:'Google route fout',
        status: google.status || 502,
        detail: google.detail || null
      });
    }
  }

  if (!orsKey) {
    return res.status(500).json({ ok:false, error:'GOOGLE_MAPS_API_KEY of ORS_API_KEY ontbreekt in Vercel env' });
  }

  const requestedCoordinates = compactCoords([start, ...via, end]);
  if (requestedCoordinates.length < 2) {
    return res.status(400).json({ ok:false, error:'Te weinig geldige routepunten' });
  }

  try {
    let route = await tryOrsRoute({ key: orsKey, profile, coordinates: requestedCoordinates, radiusesMode:'wide' });
    if (route.ok) {
      return res.status(200).json(addRoadoraMeta(route.data, {
        provider:'openrouteservice',
        mode:'full-waypoints',
        requestedWaypoints: via.length,
        usedWaypoints: via.length,
        skippedWaypoints: []
      }));
    }

    route = await tryOrsRoute({ key: orsKey, profile, coordinates: requestedCoordinates, radiusesMode:'unlimited' });
    if (route.ok) {
      return res.status(200).json(addRoadoraMeta(route.data, {
        provider:'openrouteservice',
        mode:'full-waypoints-unlimited-snap',
        requestedWaypoints: via.length,
        usedWaypoints: via.length,
        skippedWaypoints: []
      }));
    }

    if (via.length) {
      const segmented = await buildSegmentedRoute({ key: orsKey, profile, start, end, via });
      if (segmented.ok) return res.status(200).json(segmented.data);
    }

    const direct = await tryOrsRoute({ key: orsKey, profile, coordinates:[start, end], radiusesMode:'unlimited' });
    if (direct.ok) {
      return res.status(200).json(addRoadoraMeta(direct.data, {
        provider:'openrouteservice',
        mode:'direct-recovery',
        requestedWaypoints: via.length,
        usedWaypoints: 0,
        skippedWaypoints: via.map(coordLabel)
      }));
    }

    return res.status(direct.status || route.status || 502).json({
      ok:false,
      error:'ORS route fout',
      status: direct.status || route.status || 502,
      detail: direct.detail || route.detail || null
    });
  } catch (err) {
    return res.status(500).json({ ok:false, error: err?.message || 'Route API fout' });
  }
}

async function tryGoogleDirections({ key, start, end, via, profile }) {
  try {
    const origin = coordToGoogleLatLng(start);
    const destination = coordToGoogleLatLng(end);
    const params = new URLSearchParams({
      origin,
      destination,
      key,
      language:'nl',
      units:'metric',
      mode: googleMode(profile)
    });
    if (Array.isArray(via) && via.length) {
      params.set('waypoints', via.map(coordToGoogleLatLng).join('|'));
    }

    const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok:false, status:response.status, detail:data };
    if (data.status !== 'OK') return { ok:false, status:502, detail:{ status:data.status, message:data.error_message || null } };

    const route = Array.isArray(data.routes) ? data.routes[0] : null;
    const encoded = route?.overview_polyline?.points;
    const coordsLatLng = decodeGooglePolyline(encoded);
    if (!coordsLatLng.length) return { ok:false, status:502, detail:'Google route zonder polyline' };

    const legs = Array.isArray(route?.legs) ? route.legs : [];
    const distance = legs.reduce((sum, leg) => sum + Number(leg?.distance?.value || 0), 0);
    const duration = legs.reduce((sum, leg) => sum + Number(leg?.duration?.value || 0), 0);
    const lngLat = coordsLatLng.map(([lat, lng]) => [round6(lng), round6(lat)]);

    const featureCollection = {
      ok:true,
      type:'FeatureCollection',
      bbox:bboxOf(lngLat),
      features:[{
        type:'Feature',
        properties:{
          summary:{ distance, duration },
          roadora:{
            provider:'google-directions',
            mode: via?.length ? 'google-waypoints' : 'google-direct',
            requestedWaypoints: via?.length || 0,
            usedWaypoints: via?.length || 0,
            skippedWaypoints: []
          }
        },
        geometry:{ type:'LineString', coordinates:lngLat }
      }],
      roadora:{
        provider:'google-directions',
        mode: via?.length ? 'google-waypoints' : 'google-direct',
        requestedWaypoints: via?.length || 0,
        usedWaypoints: via?.length || 0,
        skippedWaypoints: []
      }
    };
    return { ok:true, status:200, data:featureCollection };
  } catch (err) {
    return { ok:false, status:500, detail:String(err?.message || err) };
  }
}

function coordToGoogleLatLng(coord) {
  return `${coord[1]},${coord[0]}`; // input is [lng,lat], Google expects lat,lng
}

function googleMode(profile) {
  if (profile === 'cycling-regular') return 'bicycling';
  if (profile === 'foot-walking') return 'walking';
  return 'driving';
}

function decodeGooglePolyline(str) {
  if (!str) return [];
  let index = 0, lat = 0, lng = 0, coordinates = [];
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20 && index < str.length);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20 && index < str.length);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return coordinates;
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
  return [round6(lng), round6(lat)]; // ORS verwacht [lng, lat]
}

function parseWaypoints(raw) {
  return String(raw || '')
    .split('|')
    .map(parseCoord)
    .filter(Boolean);
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
  if (mode === 'unlimited') return coordinates.map(() => -1);
  // Endpoints hoeven niet extreem ruim te zijn; tussenstops wel, omdat Google/POI-pins vaak naast de rijbaan liggen.
  return coordinates.map((_, i) => (i === 0 || i === coordinates.length - 1) ? 10000 : 50000);
}

async function tryOrsRoute({ key, profile, coordinates, radiusesMode = 'wide' }) {
  const body = {
    coordinates,
    instructions: false,
    geometry_simplify: false,
    elevation: false,
    preference: 'recommended',
    units: 'm',
    radiuses: radiusesFor(coordinates, radiusesMode)
  };

  const orsRes = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
    method: 'POST',
    headers: {
      Authorization: key,
      'Content-Type': 'application/json',
      Accept: 'application/json, application/geo+json'
    },
    body: JSON.stringify(body)
  });

  const text = await orsRes.text();
  let data;
  try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

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
    const segment = await tryOrsRoute({ key, profile, coordinates:[current, target], radiusesMode:'unlimited' });

    if (!segment.ok) {
      if (!isFinal) {
        skipped.push(coordLabel(target));
        continue;
      }
      // Eindbestemming mag nooit worden overgeslagen.
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
    bbox: bboxOf(merged),
    features:[{
      type:'Feature',
      properties:{
        summary:{ distance, duration },
        roadora:{
          mode:'segmented-waypoint-recovery',
          requestedWaypoints: via.length,
          usedWaypoints: used.length,
          skippedWaypoints: skipped
        }
      },
      geometry:{ type:'LineString', coordinates: merged }
    }],
    ok:true,
    roadora:{
      mode:'segmented-waypoint-recovery',
      requestedWaypoints: via.length,
      usedWaypoints: used.length,
      skippedWaypoints: skipped
    }
  };

  return { ok:true, data };
}

function bboxOf(coords) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLng, minLat, maxLng, maxLat].map(round6);
}
