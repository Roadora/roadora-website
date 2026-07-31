# Architectuur v6.8.0

## Browser en geïnstalleerde app

`index.html` laadt Leaflet, `trip-db.js`, `webplanner.js` en `pwa.js`. Het manifest geeft browsers de appnaam, iconen, kleuren, scope en standalone weergave. `pwa.js` registreert de service worker en beheert installatie- en updateberichten.

## Service worker

`sw.js` bewaart alleen de statische app-shell en publieke inhoudspagina’s. Navigaties gebruiken network-first met `offline.html` als fallback. CSS, JavaScript en afbeeldingen gebruiken stale-while-revalidate. Requests naar `/api/` blijven network-only, zodat route-, geocode- en Places-resultaten niet verouderen in een cache.

Een nieuwe service worker neemt de app niet stilzwijgend over. Roadora toont eerst een updatebericht en activeert de nieuwe worker pas na gebruikersbevestiging.

## Kaart en routing

Leaflet/OpenStreetMap verzorgt de kaartweergave. `/api/route` gebruikt Google primair en OpenRouteService als fallback. Actieve geselecteerde stops worden als waypoints in hun gekozen volgorde meegestuurd.

## Stops

De gebruiker kiest categorie, zoekgebied en locatie. Roadora voegt niets automatisch toe. Alleen actieve stops worden als waypoint gebruikt; overslaan, hervatten, verwijderen en verplaatsen leiden tot een nieuwe routeberekening.

## Opslag

Roadtrips worden lokaal opgeslagen in IndexedDB en blijven buiten de service-workercache. Daardoor verwijdert een appupdate geen opgeslagen roadtrips. Account-, cloud- en apparaatsynchronisatie zijn nog niet actief en volgen in een latere fase.
