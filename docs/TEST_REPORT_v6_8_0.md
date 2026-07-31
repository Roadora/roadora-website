# Testrapport v6.8.0

## Automatisch gecontroleerd

- Alle HTML-verwijzingen bestaan.
- Manifest is geldige JSON en bevat naam, start-url, scope, standalone display, kleuren en 192/512-iconen.
- Alle iconen bestaan en hebben de gedeclareerde afmetingen.
- Service worker en alle browser/API-JavaScriptbestanden slagen voor `node --check`.
- Service worker bevat een offline fallback, versiegebonden caches en gecontroleerde updateboodschap.
- `/api/` is expliciet uitgesloten van caching.
- Vercel levert `sw.js` zonder cache en met scope `/`.
- HTML-, footer- en JavaScript-buildversies zijn gelijk aan v6.8.0.

## Handmatig na deployment

- Installatieprompt in Chrome/Edge.
- Zet op beginscherm in Safari op iPhone/iPad.
- Standalone openen via appicoon.
- Offline foutpagina na het uitschakelen van internet.
- Updatebericht bij een volgende deployment.
- Bestaande roadtrip opslaan, app bijwerken en opnieuw openen.
