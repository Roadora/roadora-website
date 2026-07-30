# Architectuur v6.7.4

## Browser

`index.html` laadt Leaflet, `trip-db.js` en `webplanner.js`. De planner bewaart roadtrips lokaal via IndexedDB en gebruikt serverless endpoints onder `/api`.

## Kaart en routing

Leaflet/OpenStreetMap verzorgt de kaartweergave. `/api/route` gebruikt Google primair en OpenRouteService als fallback. Actieve geselecteerde stops worden als waypoints in hun gekozen volgorde meegestuurd.

## Stops

De gebruiker kiest categorie, zoekgebied en locatie. Roadora voegt niets automatisch toe. Alleen actieve stops worden als waypoint gebruikt; overslaan, hervatten, verwijderen en verplaatsen leiden tot een nieuwe routeberekening.

## Opslag

Roadtrips worden lokaal opgeslagen. Het centrale, versieerbare app-datamodel en import/export volgen in v6.8.
