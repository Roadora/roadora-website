# Roadora v6.5.0 — Eten en WC live

Gebouwd op de stabiele v6.4.0 Routekeuze-basis.

## Nieuw

- De Stops-knop **Restaurants** heet voortaan **Eten**.
- Eten haalt live Google Places-resultaten op langs de actieve reisdag.
- Eten heeft vijf filters:
  - Restaurant
  - Fastfood
  - Lunch
  - Koffie
  - Supermarkt
- WC haalt live resultaten op langs de actieve reisdag.
- WC maakt onderscheid tussen:
  - openbare WC;
  - rustplaats;
  - tankstation, waarbij WC-beschikbaarheid gecontroleerd moet worden.
- Eten- en WC-resultaten tonen waar beschikbaar:
  - beoordeling;
  - openingstatus;
  - type voorziening;
  - kilometers vanaf het begin van de roadtrip;
  - verwachte aankomsttijd;
  - geschatte tijd vanaf de route.
- Resultaten verschijnen als pins op de Leaflet-kaart.
- Een gekozen Eten- of WC-stop wordt op routepositie in de actieve dagplanning geplaatst.
- Standaard stopduur:
  - Eten: 45 minuten;
  - WC/pauze: 10 minuten.
- Alle latere aankomsttijden en de overnachting worden automatisch doorgeschoven.
- Verwachte aankomsttijden in zoekresultaten houden rekening met eerder geplande stops.

## Veiligheidsregels behouden

- Alles staat standaard uit.
- Alleen de categorie waarop de gebruiker klikt wordt live geladen.
- Resultaten worden gezocht binnen de actieve reisdag, niet over een andere dag.
- Bestaande stops, hotels, camperplekken, routekeuze en Maps-export blijven behouden.
- Uitjes zijn nog niet live gekoppeld.

## Technisch

- Nieuwe Vercel API-routes:
  - `api/google-food.js`
  - `api/google-wc.js`
- Bestaande `GOOGLE_MAPS_API_KEY` wordt server-side gebruikt; er is geen extra sleutel nodig.
- Cacheversies bijgewerkt naar v6.5.0.
- v6.4.0 blijft ongewijzigd beschikbaar als fallback.

## Controle

- JavaScript-syntaxcontrole voor alle JS- en API-bestanden.
- Mocktests voor Google Places-verzoeken en normalisatie.
- Front-end functietest voor actieve-dagzoekpunten.
- Headless Chromium-flow getest:
  - Eten openen;
  - filter wisselen;
  - eetstop toevoegen;
  - WC openen;
  - WC-stop toevoegen;
  - juiste routevolgorde en oplopende aankomsttijden controleren.
