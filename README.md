# Roadora v6.8.2 — Mobiele interactie- en scrollfix

Roadora v6.8.2 herstelt de blokkerende bediening van de mobiele app-shell. Het routeformulier, de overige bottom sheets en het mobiele toetsenbord werken nu binnen een vaste kaartgerichte app-interface.

## Opgelost

- Vertrekpunt en bestemming zijn weer aanklikbaar en invulbaar.
- De transparante sluitlaag ligt niet meer boven de bottom sheets.
- Route, Stops, Planning en Meer scrollen in een eigen interne scrollbody.
- De volledig geopende sheet blijft onder de vaste topbar en boven de bottom navigation.
- Bij het openen van het telefoontoetsenbord wordt de beschikbare schermhoogte opnieuw berekend.
- Het actieve invoerveld wordt automatisch zichtbaar gehouden.
- Nieuwe roadtrip opent Route instellen bovenaan.
- De paneeltitel kan naast de greep ook worden gebruikt om het paneel te vergroten of verkleinen.

## Behouden

- Desktopindeling en bestaande route-, stop-, dag- en opslaglogica.
- PWA-installatie, offline app-shell en lokaal opgeslagen roadtrips.
- Kaartpunt- en Routepuntselectie.

## Controle

```bash
python scripts/quality_gate.py
```
