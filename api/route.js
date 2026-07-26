// Roadora v6.4 — routekeuze met Google primair + ORS fallback
// - Leaflet blijft de kaartlaag; dit endpoint levert routegeometrie en samenvattingen.
// - Google is primair, ORS is fallback.
// - Variantenmodus levert waar beschikbaar: snelste, tol vermijden en een alternatief.
// - Tol vermijden is een voorkeur en geen absolute garantie van de routeprovider.

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
  const preference = sanitizePreference(q.preference || q.routePreference);
  const wantsVariants = ['1','true','yes'].includes(String(q.variants || '').toLowerCase());

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
    preference,
    variants:wantsVariants,
    providers: {
      google: { configured: Boolean(googleKey), keyLength: googleKey ? String(googleKey).length : 0 },
      ors: { configured: Boolean(orsKey), keyLength: orsKey ? String(orsKey).length : 0 }
    },
    attempts: []
  };

  if (!googleKey && !orsKey) {
    return res.status(500).json({ ok:false, error:'Geen routeprovider ingesteld: GOOGLE_MAPS_API_KEY of ORS_API_KEY ontbreekt in Vercel.', mode:'no-provider', debug });
  }

  if (wantsVariants) {
    const bundle = await buildRouteVariants({ googleKey, orsKey, start, end, via, profile, preference, debug });
    if (bundle.variants.length) {
      return res.status(200).json({
        ok:true,
        variants:bundle.variants,
        selectedId:bundle.selectedId,
        roadora:{ mode:'route-variants', requestedPreference:preference, requestedWaypoints:via.length },
        debug:{ attempts:debug.attempts }
      });
    }
  }

  const avoidTolls = preference === 'tollfree';

  // 1) Google eerst.
  if (googleKey) {
    const googleDirections = await tryGoogleDirections({ key:googleKey, start, end, via, avoidTolls, timeoutMs:12000 });
    debug.attempts.push(googleDirections.debug);
    if (googleDirections.ok) return res.status(200).json(addRoadoraMeta(googleDirections.data, { source:'google', mode:'google-directions', preference, requestedWaypoints:via.length, usedWaypoints:via.length, skippedWaypoints:[] }));

    const googleRoutes = await tryGoogleRoutesApi({ key:googleKey, start, end, via, avoidTolls, timeoutMs:12000 });
    debug.attempts.push(googleRoutes.debug);
    if (googleRoutes.ok) return res.status(200).json(addRoadoraMeta(googleRoutes.data, { source:'google', mode:'google-routes-api', preference, requestedWaypoints:via.length, usedWaypoints:via.length, skippedWaypoints:[] }));
  }

  // 2) ORS fallback.
  if (orsKey) {
    const requestedCoordinates = compactCoords([start, ...via, end]);
    const orsDirect = await tryOrsRoute({ key:orsKey, profile, coordinates:requestedCoordinates, radiusesMode:via.length ? 'wide' : 'none', avoidFeatures:avoidTolls?['tollways']:[], timeoutMs:12000, authMode:'header' });
    debug.attempts.push(orsDirect.debug);
    if (orsDirect.ok) return res.status(200).json(addRoadoraMeta(orsDirect.data, { source:'ors', mode:via.length ? 'ors-waypoints-fallback' : 'ors-direct-fallback', preference, requestedWaypoints:via.length, usedWaypoints:via.length, skippedWaypoints:[] }));

    const orsRecovery = await tryOrsRoute({ key:orsKey, profile, coordinates:[start, end], radiusesMode:'none', avoidFeatures:avoidTolls?['tollways']:[], timeoutMs:12000, authMode:'header' });
    debug.attempts.push(orsRecovery.debug);
    if (orsRecovery.ok) return res.status(200).json(addRoadoraMeta(orsRecovery.data, { source:'ors', mode:'ors-direct-recovery', preference, requestedWaypoints:via.length, usedWaypoints:0, skippedWaypoints:via.map(coordLabel) }));
  }

  return res.status(bestStatus(debug.attempts)).json({
    ok:false,
    error:'Route niet geladen: Google en ORS gaven geen bruikbare route terug.',
    mode:'all-providers-failed',
    debug
  });
}

async function buildRouteVariants({ googleKey, orsKey, start, end, via, profile, preference, debug }) {
  const variants=[];
  const add=(variant)=>{
    if (!variant || !Array.isArray(variant.coordinates) || variant.coordinates.length < 2) return;
    const existing=variants.find(v=>v.id===variant.id);
    if (existing) return;
    variants.push(toPublicVariant(variant));
  };

  let fastestRaw=null;
  let tollRaw=null;

  if (googleKey) {
    const googleDefault=await tryGoogleDirectionsSet({ key:googleKey, start, end, via, avoidTolls:false, alternatives:via.length===0, timeoutMs:12000 });
    debug.attempts.push(googleDefault.debug);
    if (googleDefault.ok && googleDefault.routes.length) {
      fastestRaw={...googleDefault.routes[0], id:'fastest', label:'Snelste route', preference:'fastest'};
      add(fastestRaw);
      const alternate=googleDefault.routes.slice(1).find(route=>!sameRouteShape(route,fastestRaw));
      if (alternate) add({...alternate,id:'alternative',label:'Alternatieve route',preference:'alternative'});
    }

    const googleToll=await tryGoogleDirectionsSet({ key:googleKey, start, end, via, avoidTolls:true, alternatives:false, timeoutMs:12000 });
    debug.attempts.push(googleToll.debug);
    if (googleToll.ok && googleToll.routes.length) {
      tollRaw={...googleToll.routes[0],id:'tollfree',label:'Tol vermijden',preference:'tollfree'};
      add({...tollRaw,sameAsFastest:fastestRaw?sameRouteShape(tollRaw,fastestRaw):false});
    }

    // Wanneer Directions Legacy niet beschikbaar is, probeer de actuele Routes API.
    if (!fastestRaw) {
      const routesDefault=await tryGoogleRoutesSet({ key:googleKey, start, end, via, avoidTolls:false, alternatives:via.length===0, timeoutMs:12000 });
      debug.attempts.push(routesDefault.debug);
      if (routesDefault.ok && routesDefault.routes.length) {
        fastestRaw={...routesDefault.routes[0],id:'fastest',label:'Snelste route',preference:'fastest'};
        add(fastestRaw);
        const alternate=routesDefault.routes.slice(1).find(route=>!sameRouteShape(route,fastestRaw));
        if (alternate) add({...alternate,id:'alternative',label:'Alternatieve route',preference:'alternative'});
      }
    }
    if (!tollRaw) {
      const routesToll=await tryGoogleRoutesSet({ key:googleKey, start, end, via, avoidTolls:true, alternatives:false, timeoutMs:12000 });
      debug.attempts.push(routesToll.debug);
      if (routesToll.ok && routesToll.routes.length) {
        tollRaw={...routesToll.routes[0],id:'tollfree',label:'Tol vermijden',preference:'tollfree'};
        add({...tollRaw,sameAsFastest:fastestRaw?sameRouteShape(tollRaw,fastestRaw):false});
      }
    }
  }

  if (orsKey) {
    const coordinates=compactCoords([start,...via,end]);
    if (!fastestRaw) {
      const orsFast=await tryOrsRoute({ key:orsKey, profile, coordinates, radiusesMode:via.length?'wide':'none', avoidFeatures:[], timeoutMs:12000, authMode:'header' });
      debug.attempts.push(orsFast.debug);
      if (orsFast.ok) {
        fastestRaw=variantFromGeoJson(orsFast.data,{id:'fastest',label:'Snelste route',preference:'fastest',source:'ors',mode:'ors-direct-fallback'});
        add(fastestRaw);
      }
    }
    if (!tollRaw) {
      const orsToll=await tryOrsRoute({ key:orsKey, profile, coordinates, radiusesMode:via.length?'wide':'none', avoidFeatures:['tollways'], timeoutMs:12000, authMode:'header' });
      debug.attempts.push(orsToll.debug);
      if (orsToll.ok) {
        tollRaw=variantFromGeoJson(orsToll.data,{id:'tollfree',label:'Tol vermijden',preference:'tollfree',source:'ors',mode:'ors-avoid-tollways'});
        add({...tollRaw,sameAsFastest:fastestRaw?sameRouteShape(tollRaw,fastestRaw):false});
      }
    }
  }

  const desired=variants.find(v=>v.id===preference) || variants.find(v=>v.id==='fastest') || variants[0];
  return { variants:sortVariants(variants), selectedId:desired?.id || 'fastest' };
}

function sortVariants(list) {
  const order={fastest:0,tollfree:1,alternative:2};
  return [...list].sort((a,b)=>(order[a.id]??9)-(order[b.id]??9));
}
function sanitizeProfile(value) {
  const p = String(value || 'driving-car').replace(/[^a-z-]/g, '') || 'driving-car';
  const allowed = new Set(['driving-car','driving-hgv','cycling-regular','foot-walking']);
  return allowed.has(p) ? p : 'driving-car';
}
function sanitizePreference(value) {
  const p=String(value||'fastest').toLowerCase();
  return ['fastest','tollfree','alternative'].includes(p)?p:'fastest';
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
function routeMetricsFromLegacy(route) {
  const encoded=route?.overview_polyline?.points||'';
  const coordinates=decodePolyline(encoded);
  const legs=Array.isArray(route?.legs)?route.legs:[];
  return {
    coordinates,
    distanceMeters:legs.reduce((sum,leg)=>sum+Number(leg?.distance?.value||0),0),
    durationSeconds:legs.reduce((sum,leg)=>sum+Number(leg?.duration?.value||0),0)
  };
}
function sameRouteShape(a,b) {
  if (!a || !b) return false;
  const distanceDelta=Math.abs(Number(a.distanceMeters||0)-Number(b.distanceMeters||0));
  const durationDelta=Math.abs(Number(a.durationSeconds||0)-Number(b.durationSeconds||0));
  if (distanceDelta<700 && durationDelta<180) return true;
  const ac=a.coordinates||[], bc=b.coordinates||[];
  if (ac.length<2 || bc.length<2) return false;
  const amid=ac[Math.floor(ac.length/2)], bmid=bc[Math.floor(bc.length/2)];
  return coordinateDistanceKm(amid,bmid)<2 && distanceDelta<2500;
}
function coordinateDistanceKm(a,b) {
  if (!a || !b) return Infinity;
  const toRad=n=>Number(n)*Math.PI/180;
  const lat1=toRad(a[1]), lat2=toRad(b[1]);
  const dLat=lat2-lat1, dLng=toRad(b[0])-toRad(a[0]);
  const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
function toPublicVariant(v) {
  return {
    id:v.id,
    label:v.label,
    preference:v.preference,
    distanceMeters:Number(v.distanceMeters||0),
    durationSeconds:Number(v.durationSeconds||0),
    source:v.source||'unknown',
    mode:v.mode||'',
    sameAsFastest:Boolean(v.sameAsFastest),
    geometry:{type:'LineString',coordinates:v.coordinates}
  };
}
function variantFromGeoJson(data,meta) {
  const feature=data?.features?.[0]||{};
  const summary=feature.properties?.summary||{};
  return {
    ...meta,
    coordinates:feature.geometry?.coordinates||[],
    distanceMeters:Number(summary.distance||0),
    durationSeconds:Number(summary.duration||0)
  };
}

async function tryGoogleDirectionsSet({ key, start, end, via, avoidTolls=false, alternatives=false, timeoutMs=12000 }) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  const startedAt=Date.now();
  const params=new URLSearchParams({origin:latLngString(start),destination:latLngString(end),mode:'driving',language:'nl',units:'metric',key});
  if (via.length) params.set('waypoints',via.map(latLngString).join('|'));
  if (alternatives && !via.length) params.set('alternatives','true');
  if (avoidTolls) params.set('avoid','tolls');
  try {
    const response=await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,{signal:controller.signal});
    const data=await response.json().catch(()=>({}));
    const rawRoutes=Array.isArray(data.routes)?data.routes:[];
    const routes=rawRoutes.map(route=>{
      const metrics=routeMetricsFromLegacy(route);
      return {...metrics,source:'google',mode:'google-directions'};
    }).filter(route=>route.coordinates.length>1);
    const debug={provider:'google-directions',attempt:avoidTolls?'avoid-tolls':(alternatives?'alternatives':'default'),status:response.status,ok:response.ok&&data.status==='OK'&&routes.length>0,durationMs:Date.now()-startedAt,googleStatus:data.status||null,message:data.error_message||null,routeCount:routes.length};
    if (!response.ok || data.status!=='OK' || !routes.length) return {ok:false,status:response.ok?502:response.status,routes:[],debug:{...debug,body:truncateBody({status:data.status,error_message:data.error_message,routes:rawRoutes.length})}};
    return {ok:true,status:200,routes,debug};
  } catch(err) {
    const status=err?.name==='AbortError'?504:502;
    return {ok:false,status,routes:[],debug:{provider:'google-directions',attempt:avoidTolls?'avoid-tolls':(alternatives?'alternatives':'default'),status,ok:false,durationMs:Date.now()-startedAt,message:err?.name==='AbortError'?`Google Directions timeout na ${timeoutMs} ms`:(err?.message||'Google Directions fetch fout')}};
  } finally { clearTimeout(timer); }
}
async function tryGoogleDirections({ key, start, end, via, avoidTolls=false, timeoutMs=12000 }) {
  const result=await tryGoogleDirectionsSet({key,start,end,via,avoidTolls,alternatives:false,timeoutMs});
  if (!result.ok || !result.routes.length) return {ok:false,status:result.status,debug:result.debug};
  const route=result.routes[0];
  return {ok:true,status:200,data:toGeoJson({coordinates:route.coordinates,distanceMeters:route.distanceMeters,durationSeconds:route.durationSeconds,providerRaw:{provider:'google-directions',avoidTolls}}),debug:result.debug};
}

async function tryGoogleRoutesSet({ key, start, end, via, avoidTolls=false, alternatives=false, timeoutMs=12000 }) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  const startedAt=Date.now();
  const body={
    origin:{location:{latLng:latLngObject(start)}},
    destination:{location:{latLng:latLngObject(end)}},
    intermediates:via.map(c=>({location:{latLng:latLngObject(c)}})),
    travelMode:'DRIVE',
    routingPreference:'TRAFFIC_UNAWARE',
    computeAlternativeRoutes:Boolean(alternatives&&!via.length),
    routeModifiers:{avoidTolls:Boolean(avoidTolls),avoidHighways:false,avoidFerries:false},
    polylineEncoding:'ENCODED_POLYLINE',
    languageCode:'nl-NL',
    units:'METRIC'
  };
  try {
    const response=await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.routeLabels'},
      body:JSON.stringify(body),signal:controller.signal
    });
    const data=await response.json().catch(()=>({}));
    const routes=(Array.isArray(data.routes)?data.routes:[]).map(route=>({
      coordinates:decodePolyline(route?.polyline?.encodedPolyline||''),
      distanceMeters:Number(route?.distanceMeters||0),
      durationSeconds:parseDurationSeconds(route?.duration),
      routeLabels:Array.isArray(route?.routeLabels)?route.routeLabels:[],
      source:'google',mode:'google-routes-api'
    })).filter(route=>route.coordinates.length>1);
    const debug={provider:'google-routes-api',attempt:avoidTolls?'avoid-tolls':(alternatives?'alternatives':'default'),status:response.status,ok:response.ok&&routes.length>0,durationMs:Date.now()-startedAt,message:data?.error?.message||null,routeCount:routes.length};
    if (!response.ok || !routes.length) return {ok:false,status:response.ok?502:response.status,routes:[],debug:{...debug,body:truncateBody(data)}};
    return {ok:true,status:200,routes,debug};
  } catch(err) {
    const status=err?.name==='AbortError'?504:502;
    return {ok:false,status,routes:[],debug:{provider:'google-routes-api',attempt:avoidTolls?'avoid-tolls':(alternatives?'alternatives':'default'),status,ok:false,durationMs:Date.now()-startedAt,message:err?.name==='AbortError'?`Google Routes timeout na ${timeoutMs} ms`:(err?.message||'Google Routes fetch fout')}};
  } finally { clearTimeout(timer); }
}
async function tryGoogleRoutesApi({ key, start, end, via, avoidTolls=false, timeoutMs=12000 }) {
  const result=await tryGoogleRoutesSet({key,start,end,via,avoidTolls,alternatives:false,timeoutMs});
  if (!result.ok || !result.routes.length) return {ok:false,status:result.status,debug:result.debug};
  const route=result.routes[0];
  return {ok:true,status:200,data:toGeoJson({coordinates:route.coordinates,distanceMeters:route.distanceMeters,durationSeconds:route.durationSeconds,providerRaw:{provider:'google-routes-api',avoidTolls}}),debug:result.debug};
}

function radiusesFor(coordinates, mode) {
  if (mode === 'none') return null;
  if (mode === 'unlimited') return coordinates.map(() => -1);
  return coordinates.map((_, i) => (i === 0 || i === coordinates.length - 1) ? 5000 : 50000);
}
async function tryOrsRoute({ key, profile, coordinates, radiusesMode='none', avoidFeatures=[], timeoutMs=12000, authMode='header' }) {
  const body={coordinates,instructions:false,geometry_simplify:false,elevation:false,units:'m'};
  const radiuses=radiusesFor(coordinates,radiusesMode);
  if (radiuses) body.radiuses=radiuses;
  if (Array.isArray(avoidFeatures)&&avoidFeatures.length) body.options={avoid_features:avoidFeatures};
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  const startedAt=Date.now();
  const url=`https://api.openrouteservice.org/v2/directions/${profile}/geojson${authMode==='query'?`?api_key=${encodeURIComponent(key)}`:''}`;
  const headers={'Content-Type':'application/json',Accept:'application/json, application/geo+json'};
  if (authMode==='header') headers.Authorization=key;
  try {
    const orsRes=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal:controller.signal});
    const text=await orsRes.text();
    let data;
    try { data=JSON.parse(text); } catch(_) { data={raw:text||''}; }
    const debug={provider:'ors',attempt:avoidFeatures.length?'avoid-'+avoidFeatures.join('-'):'post-geojson',authMode,radiusesMode,status:orsRes.status,ok:orsRes.ok,durationMs:Date.now()-startedAt,body:truncateBody(data)};
    if (!orsRes.ok) return {ok:false,status:orsRes.status,debug};
    if (!hasGeometry(data)) return {ok:false,status:502,debug:{...debug,message:'ORS gaf 200 terug, maar zonder route-geometry'}};
    return {ok:true,status:orsRes.status,data,debug};
  } catch(err) {
    const status=err?.name==='AbortError'?504:502;
    return {ok:false,status,debug:{provider:'ors',attempt:avoidFeatures.length?'avoid-'+avoidFeatures.join('-'):'post-geojson',authMode,radiusesMode,status,durationMs:Date.now()-startedAt,message:err?.name==='AbortError'?`ORS timeout na ${timeoutMs} ms`:(err?.message||'ORS fetch fout')}};
  } finally { clearTimeout(timer); }
}
