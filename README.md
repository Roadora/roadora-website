# Roadora v6.7.5 — Kaartpunt en routepunt herstel

Dit is de opgeschoonde webplannerbasis met het herstelde Kaartpunt- en Routepunt-selectieproces.

## Productieregel

Gebruik deze volledige repository als enige basis voor volgende versies. Oudere compacte patches hoeven niet meer over deze map te worden gelegd.

## Actieve hoofdonderdelen

- `index.html` — webplanner
- `css/webplanner.css` — volledige plannerstijl
- `js/webplanner.js` — plannerinterface en gebruikersflow
- `js/trip-db.js` — lokale roadtripbibliotheek
- `js/leaflet-fallback.js` — Leaflet CDN-fallback
- `api/` — beveiligde route-, geocode- en Places-endpoints
- `assets/` — vaste Roadora-assets

## Lokaal controleren

```bash
python scripts/quality_gate.py
python -m http.server 3000
```

Open daarna `http://localhost:3000`. Voor echte API-resultaten zijn dezelfde Vercel-omgevingsvariabelen nodig als op productie.

## Herstel in v6.7.5

- Kaartpunt en Routepunt starten direct na het aanklikken.
- Routepunt wordt vastgezet op de actieve route.
- Een zichtbare kaartbanner laat zien dat Roadora op een kaartklik wacht.
- Selecteren werkt ook wanneer de gebruiker op een route-lijn of bestaande marker klikt.
