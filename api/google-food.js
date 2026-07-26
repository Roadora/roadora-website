// Roadora Google Eten API — v6.5.0
// Server-side Google Places Nearby Search proxy voor eetstops langs de actieve reisdag.

const CONFIG = {
  cacheName: '__ROADORA_GOOGLE_FOOD_CACHE_V650__',
  cacheTtlMs: 15 * 60 * 1000,
  requestTimeoutMs: 8000,
  maxPoints: 6,
  maxResultsPerPoint: 10,
  maxTotalResults: 35,
  defaultRadiusMeters: 5000,
  minRadiusMeters: 1500,
  maxRadiusMeters: 9000,
  concurrency: 3,
  routeEngine: 'food-active-day-v1',
  placeMode: 'food'
};

const FOOD_TYPES = {
  restaurant: ['restaurant'],
  fastfood: ['fast_food_restaurant', 'meal_takeaway'],
  lunch: ['restaurant', 'cafe', 'bakery'],
  coffee: ['cafe', 'bakery'],
  supermarket: ['supermarket', 'grocery_store']
};

const memoryCache = globalThis[CONFIG.cacheName] || new Map();
globalThis[CONFIG.cacheName] = memoryCache;

function send(res, status, body) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
  res.status(status).json(body);
}

function trimCache(maxEntries = 100) {
  if (memoryCache.size <= maxEntries) return;
  const keys = Array.from(memoryCache.keys());
  for (const key of keys.slice(0, Math.max(0, keys.length - maxEntries))) memoryCache.delete(key);
}

function roundCoord(value, digits = 3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const m = 10 ** digits;
  return Math.round(n * m) / m;
}

function normalizePoint(point, index = 0) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const progress = Number(point?.progress);
  const distanceFromStartMeters = Number(point?.distanceFromStartMeters);
  return {
    lat,
    lng,
    index,
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : index,
    distanceFromStartMeters: Number.isFinite(distanceFromStartMeters) ? Math.max(0, Math.round(distanceFromStartMeters)) : null
  };
}

function normalizeFoodType(value) {
  const id = String(value || 'restaurant').toLowerCase();
  return Object.prototype.hasOwnProperty.call(FOOD_TYPES, id) ? id : 'restaurant';
}

function cacheKey(points, radiusMeters, mode, foodType) {
  const compact = points.map(p => `${roundCoord(p.lat)},${roundCoord(p.lng)}`).join('|');
  return `${CONFIG.placeMode}:${foodType}:${mode || 'default'}:${radiusMeters}:${compact}`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = value => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function foodLabel(foodType) {
  return ({ restaurant: 'Restaurant', fastfood: 'Fastfood', lunch: 'Lunch', coffee: 'Koffie', supermarket: 'Supermarkt' })[foodType] || 'Eten';
}

function inferFoodLabel(place, selectedFoodType) {
  const types = Array.isArray(place?.types) ? place.types : [];
  if (types.includes('supermarket') || types.includes('grocery_store')) return 'Supermarkt';
  if (types.includes('cafe')) return selectedFoodType === 'lunch' ? 'Lunch/café' : 'Koffie/café';
  if (types.includes('bakery')) return 'Bakkerij';
  if (types.includes('fast_food_restaurant') || types.includes('meal_takeaway')) return 'Fastfood/afhalen';
  return foodLabel(selectedFoodType);
}

function inferAmenities(place, selectedFoodType) {
  const types = Array.isArray(place?.types) ? place.types : [];
  const values = new Set([inferFoodLabel(place, selectedFoodType)]);
  if (types.includes('meal_takeaway')) values.add('Afhalen');
  if (types.includes('bakery')) values.add('Bakkerij');
  if (types.includes('cafe')) values.add('Koffie');
  return Array.from(values).slice(0, 4);
}

function normalizePlace(hit, foodType) {
  const place = hit?.place || hit;
  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const openNow = typeof place?.regularOpeningHours?.openNow === 'boolean'
    ? place.regularOpeningHours.openNow
    : null;
  const offRouteKm = hit?.point ? haversineKm(hit.point.lat, hit.point.lng, lat, lng) : null;
  const detourMinutes = Number.isFinite(offRouteKm) ? Math.max(2, Math.min(20, Math.round(2 + offRouteKm * 2.2))) : 5;

  return {
    id: place?.id || place?.name || `${roundCoord(lat, 5)},${roundCoord(lng, 5)}`,
    name: place?.displayName?.text || `${foodLabel(foodType)} langs route`,
    address: place?.formattedAddress || 'Langs je route',
    lat,
    lng,
    rating: typeof place?.rating === 'number' ? place.rating : null,
    userRatingCount: typeof place?.userRatingCount === 'number' ? place.userRatingCount : null,
    openNow,
    provider: 'Google Places',
    status: openNow === true ? 'nu open' : openNow === false ? 'nu mogelijk gesloten' : 'openingstijden controleren',
    detourMinutes,
    detourLabel: `± ${detourMinutes} min van route`,
    amenities: inferAmenities(place, foodType),
    foodType,
    foodLabel: inferFoodLabel(place, foodType),
    googleMapsUri: place?.googleMapsUri || null,
    website: place?.websiteUri || null,
    photoName: Array.isArray(place?.photos) && place.photos[0]?.name ? place.photos[0].name : null,
    photoNames: Array.isArray(place?.photos) ? place.photos.map(p => p?.name).filter(Boolean).slice(0, 5) : [],
    photoUrl: Array.isArray(place?.photos) && place.photos[0]?.name ? `/api/google-photo?name=${encodeURIComponent(place.photos[0].name)}&w=420` : null,
    photoUrls: Array.isArray(place?.photos) ? place.photos.map(p => p?.name).filter(Boolean).slice(0, 5).map(name => `/api/google-photo?name=${encodeURIComponent(name)}&w=720`) : [],
    routeSampleIndex: Number.isFinite(hit?.sampleIndex) ? hit.sampleIndex : null,
    routeProgress: Number.isFinite(hit?.point?.progress) ? hit.point.progress : null,
    distanceFromStartMeters: Number.isFinite(hit?.point?.distanceFromStartMeters) ? hit.point.distanceFromStartMeters : null
  };
}

async function searchFoodNearPoint({ apiKey, point, radiusMeters, foodType }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.name',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.userRatingCount',
          'places.regularOpeningHours.openNow',
          'places.googleMapsUri',
          'places.websiteUri',
          'places.photos.name',
          'places.types'
        ].join(',')
      },
      body: JSON.stringify({
        includedTypes: FOOD_TYPES[foodType],
        maxResultCount: CONFIG.maxResultsPerPoint,
        rankPreference: 'DISTANCE',
        locationRestriction: {
          circle: {
            center: { latitude: point.lat, longitude: point.lng },
            radius: radiusMeters
          }
        }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `Google Places ${response.status}`;
      const code = data?.error?.status || 'GOOGLE_PLACES_ERROR';
      throw new Error(`${code}: ${message}`);
    }
    return Array.isArray(data?.places)
      ? data.places.map(place => ({ place, sampleIndex: point.index, point }))
      : [];
  } finally {
    clearTimeout(timer);
  }
}

async function runLimited(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const current = items[cursor++];
      try { results.push({ status: 'fulfilled', value: await worker(current) }); }
      catch (reason) { results.push({ status: 'rejected', reason }); }
    }
  });
  await Promise.all(workers);
  return results;
}

function scorePlace(place) {
  const rating = Number(place.rating || 0);
  const reviews = Math.min(0.7, Math.log10(Math.max(1, Number(place.userRatingCount || 0))) / 5);
  const openBonus = place.openNow === true ? 0.25 : 0;
  return rating + reviews + openBonus;
}

function dedupeAndSpread(rawHits, foodType, maxTotal = CONFIG.maxTotalResults) {
  const seen = new Set();
  const normalized = [];
  for (const hit of rawHits) {
    const place = normalizePlace(hit, foodType);
    if (!place) continue;
    const id = place.id || `${roundCoord(place.lat, 4)},${roundCoord(place.lng, 4)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push(place);
  }

  const bySegment = new Map();
  normalized.forEach((place, order) => {
    const key = Number.isFinite(place.routeSampleIndex) ? place.routeSampleIndex : order;
    if (!bySegment.has(key)) bySegment.set(key, []);
    bySegment.get(key).push({ ...place, __order: order });
  });
  for (const list of bySegment.values()) list.sort((a, b) => scorePlace(b) - scorePlace(a) || a.__order - b.__order);

  const keys = Array.from(bySegment.keys()).sort((a, b) => a - b);
  const result = [];
  let round = 0;
  while (result.length < maxTotal && round < CONFIG.maxResultsPerPoint) {
    for (const key of keys) {
      const item = bySegment.get(key)?.[round];
      if (item) result.push(item);
      if (result.length >= maxTotal) break;
    }
    round += 1;
  }
  return result.sort((a, b) => (a.routeProgress ?? 0) - (b.routeProgress ?? 0)).map(({ __order, ...place }) => place);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { ok: false, status: 'method_not_allowed', places: [] });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return send(res, 200, { ok: false, status: 'misconfigured', source: 'backend', message: 'GOOGLE_MAPS_API_KEY ontbreekt in Vercel Environment Variables.', places: [] });

  const body = req.body || {};
  const mode = String(body.mode || 'route_food');
  const foodType = normalizeFoodType(body.foodType);
  const points = Array.isArray(body.points) ? body.points.map(normalizePoint).filter(Boolean).slice(0, CONFIG.maxPoints) : [];
  const radiusMeters = Math.max(CONFIG.minRadiusMeters, Math.min(CONFIG.maxRadiusMeters, Number(body.radiusMeters) || CONFIG.defaultRadiusMeters));
  if (!points.length) return send(res, 200, { ok: true, status: 'no_route_points', source: 'google', routeEngine: CONFIG.routeEngine, foodType, places: [] });

  const key = cacheKey(points, radiusMeters, mode, foodType);
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.savedAt < CONFIG.cacheTtlMs) return send(res, 200, { ...cached.payload, cached: true });

  try {
    const settled = await runLimited(points, CONFIG.concurrency, point => searchFoodNearPoint({ apiKey, point, radiusMeters, foodType }));
    const rawHits = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    const errors = settled.filter(result => result.status === 'rejected').map(result => String(result.reason?.message || result.reason)).slice(0, 4);
    const places = dedupeAndSpread(rawHits, foodType, Math.min(CONFIG.maxTotalResults, Number(body.maxResults) || CONFIG.maxTotalResults));
    const payload = {
      ok: true,
      status: places.length ? (errors.length ? 'partial_live' : 'live') : (errors.length ? 'partial_error' : 'empty'),
      source: 'google', cached: false, routeEngine: CONFIG.routeEngine, foodType,
      searchedPoints: points.length, radiusMeters, count: places.length, places, errors
    };
    trimCache();
    memoryCache.set(key, { savedAt: Date.now(), payload });
    return send(res, 200, payload);
  } catch (error) {
    return send(res, 200, { ok: false, status: 'error', source: 'google', routeEngine: CONFIG.routeEngine, foodType, message: String(error?.message || error), places: [] });
  }
}
