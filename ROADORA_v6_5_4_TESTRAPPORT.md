# Roadora v6.5.4 — testrapport

Testdatum: 26 juli 2026

## Geautomatiseerde resultaten

- 66/66 end-to-end browserchecks geslaagd.
- 46/46 API-, provider- en fallbackchecks geslaagd.
- 6/6 aanvullende security-, rate-limit- en FieldMask-checks geslaagd.
- 64/64 statische HTML-, asset-, CSP-, toegankelijkheids- en pakketchecks geslaagd.
- JavaScript-syntaxcontrole geslaagd voor de actieve planner, IndexedDB-laag, Leaflet-fallback en alle 9 serverless API-bestanden.
- ZIP-integriteit en heruitpakcontrole geslaagd.

## Specifiek opnieuw getest

- opgeslagen HTML/JavaScript in vertrekpunt en bestemming wordt niet uitgevoerd;
- kwaadaardige invoer blijft ook na autosave/heropenen gewone tekst;
- verlagen van het aantal dagen verwijdert verborgen latere dagen definitief na bevestiging;
- 320, 360, 390, 430, 768 en 1440 pixels zonder horizontale overflow;
- routevarianten, routewissel, stopvolgorde, aankomsttijden en compacte waarschuwingen;
- Hotels, Camperplekken, Eten, WC, Tanken en Laden;
- hotel als vertrekpunt van de volgende reisdag;
- opslaan, openen, dupliceren, hernoemen, verwijderen en nieuwe roadtrip;
- Google Maps-export per dag en tol vermijden;
- API origincontrole, preflight, methodebeveiliging en rate limiting;
- uitgebreide hotel-/campervelden in Google Places FieldMasks.

## Nog live controleren

De sandbox kan geen echte productie-API-keys of mobiele Google Maps-app gebruiken. Controleer na plaatsing daarom kort:

1. één echte Google-route en ORS-fallback;
2. hotel/camperfoto, website, telefoon en openingstijden;
3. Maps-export op Android/iOS;
4. Vercel response headers en Google Cloud quota-alerts.

De ingebouwde rate limiting is per actieve serverless instance. Voor publieke groei blijven platformbrede limieten en budgetalerts bij Vercel/Google Cloud aanbevolen.
