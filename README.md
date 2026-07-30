# Roadora v6.7.4 — Clean Stable Base

Dit is de opgeschoonde volledige webplannerbasis na consolidatie van alle updates tot en met v6.7.3.

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
