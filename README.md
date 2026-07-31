# Roadora v6.8.1 — Mobiele app-shell

Roadora v6.8.1 bouwt boven op de installeerbare v6.8.0-basis en maakt van de mobiele planner een echte kaartgerichte app-interface. De bestaande route-, stop-, meerdaagse en lokale opslaglogica blijft behouden.

## Productieregel

Gebruik deze volledige repository als enige basis voor volgende versies. Leg geen oudere compacte patches over deze versie heen.

## Actieve hoofdonderdelen

- `index.html` — webplanner en mobiele appstructuur
- `css/webplanner.css` — desktopplanner plus mobiele app-shell
- `js/webplanner.js` — route-, stop-, dag- en opslaglogica
- `js/app-shell.js` — mobiel startscherm, bottom navigation en bottom sheets
- `js/trip-db.js` — lokale roadtripbibliotheek
- `js/leaflet-fallback.js` — Leaflet CDN-fallback
- `js/pwa.js` — installatie- en updateflow
- `manifest.webmanifest` — appnaam, kleuren, startadres en iconen
- `sw.js` — app-shellcache en offline fallback
- `api/` — route-, geocode- en Places-endpoints

## Wat v6.8.1 toevoegt

- Een echt mobiel Roadora-startscherm voor de geïnstalleerde app.
- Nieuwe roadtrip, doorgaan met de huidige roadtrip en recente lokale roadtrips.
- Vaste mobiele topbar met actieve dag, kilometers en reistijd.
- Kaart als permanent hoofdscherm.
- Vaste bottom navigation: Route, Stops, Planning en Meer.
- Route- en rechterpanelen als bottom sheets boven de kaart.
- Panelen sluiten, vergroten en met een neerwaartse veeg sluiten.
- Kaartpunt en Routepunt verbergen het paneel tijdelijk en openen Stops daarna opnieuw.
- De desktopweergave blijft de bestaande drielaagse planner.

## Opslaggrens

Roadtrips staan nog lokaal in IndexedDB. Desktop en telefoon synchroniseren nog niet automatisch. Account- en cloudsynchronisatie volgt in een latere fase.

## Lokaal controleren

```bash
python scripts/quality_gate.py
python -m http.server 3000
```

Open voor het mobiele app-startscherm:

```text
http://localhost:3000/?source=pwa
```
