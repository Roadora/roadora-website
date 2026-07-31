# Roadora v6.8.0 — Installeerbare appbasis

Roadora v6.8.0 maakt de bestaande planner installeerbaar als Progressive Web App, zonder de stabiele route-, stop- en opslaglogica van v6.7.5 te wijzigen.

## Productieregel

Gebruik deze volledige repository als enige basis voor volgende versies. Oudere compacte patches hoeven niet meer over deze map te worden gelegd.

## Actieve hoofdonderdelen

- `index.html` — webplanner
- `css/webplanner.css` — volledige plannerstijl
- `js/webplanner.js` — plannerinterface en gebruikersflow
- `js/trip-db.js` — lokale roadtripbibliotheek
- `js/leaflet-fallback.js` — Leaflet CDN-fallback
- `js/pwa.js` — installatie- en updateflow van de app
- `manifest.webmanifest` — appnaam, kleuren, startadres en iconen
- `sw.js` — veilige app-shellcache en offline fallback
- `offline.html` — uitleg bij ontbrekende internetverbinding
- `api/` — beveiligde route-, geocode- en Places-endpoints

## Wat v6.8.0 toevoegt

- Installeren op Android, iPhone/iPad en desktop.
- Openen in standalone appmodus zonder normale browserbalk.
- Roadora-appiconen, inclusief maskable iconen en Apple touch icon.
- Veilige app-shellcache; API-resultaten worden bewust niet gecachet.
- Offline foutpagina terwijl lokaal opgeslagen roadtrips behouden blijven.
- Gecontroleerde melding wanneer een nieuwe Roadora-versie klaarstaat.
- Safe-area ondersteuning voor notch en onderste systeembalk.

## Belangrijke opslaggrens

Roadtrips blijven in deze fase lokaal in IndexedDB staan. Desktop en telefoon synchroniseren nog niet automatisch. Account- en cloudsynchronisatie volgt als aparte, gecontroleerde fase.

## Lokaal controleren

```bash
python scripts/quality_gate.py
python -m http.server 3000
```

Open daarna `http://localhost:3000`. Service workers werken op localhost. Voor echte route- en Places-resultaten zijn dezelfde Vercel-omgevingsvariabelen nodig als op productie.
