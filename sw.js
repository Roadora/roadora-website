/* Roadora PWA service worker v6.9.1 */
'use strict';

const BUILD = 'v6.9.1';
const APP_CACHE = `roadora-app-${BUILD}`;
const RUNTIME_CACHE = `roadora-runtime-${BUILD}`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/favicon.svg',
  '/assets/icons/favicon-32.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon-maskable-192.png',
  '/assets/icons/icon-maskable-512.png',
  '/css/webplanner.css?v=6.9.1',
  '/css/styles.css',
  '/js/leaflet-fallback.js?v=6.9.1',
  '/js/trip-db.js?v=6.9.1',
  '/js/cloud-sync.js?v=6.9.1',
  '/js/webplanner.js?v=6.9.1',
  '/js/app-shell.js?v=6.9.1',
  '/js/pwa.js?v=6.9.1',
  '/js/main.js',
  '/js/analytics-consent.js',
  '/js/navigation.js',
  '/contact.html',
  '/hotels-onderweg.html',
  '/privacy.html',
  '/roadora-uitleg.html',
  '/roadtrip-door-europa.html',
  '/roadtrip-planner.html',
  '/slimme-stops-onderweg.html',
  '/voorwaarden.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('roadora-') && ![APP_CACHE,RUNTIME_CACHE].includes(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if(event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(request){
  const cache = await caches.open(RUNTIME_CACHE);
  try{
    const response = await fetch(request);
    if(response?.ok) cache.put(request, response.clone()).catch(()=>{});
    return response;
  }catch(_){
    return (await cache.match(request, {ignoreSearch:true}))
      || (await caches.match(request, {ignoreSearch:true}))
      || (await caches.match('/index.html'))
      || (await caches.match('/offline.html'));
  }
}

async function staleWhileRevalidate(request){
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request) || await caches.match(request);
  const network = fetch(request).then(response => {
    if(response?.ok) cache.put(request, response.clone()).catch(()=>{});
    return response;
  }).catch(()=>null);
  if(cached){
    network.catch(()=>{});
    return cached;
  }
  return (await network) || Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;

  // Routes, geocoding and Places must always remain current and are never cached.
  if(url.pathname.startsWith('/api/')){
    event.respondWith(fetch(request));
    return;
  }

  if(request.mode === 'navigate'){
    event.respondWith(networkFirst(request));
    return;
  }

  if(['style','script','image','font'].includes(request.destination) || url.pathname === '/manifest.webmanifest'){
    event.respondWith(staleWhileRevalidate(request));
  }
});
