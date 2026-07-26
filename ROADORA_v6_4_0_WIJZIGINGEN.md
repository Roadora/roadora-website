# Roadora Webplanner v6.4.0 — Routekeuze

Basis: Roadora v6.3.5 Quality Gate.

## Nieuw

- Routekeuze vóór het zoeken en toevoegen van stops:
  - **Snelste**
  - **Tol vermijden**
  - **Alternatief**
- Per beschikbare route toont Roadora afstand en geschatte rijtijd.
- Extra afstand en reistijd worden ten opzichte van de snelste route getoond.
- Een niet-beschikbare alternatieve route wordt duidelijk uitgeschakeld.
- De gekozen route wordt de actieve Leaflet-route.
- Hotels, Camperplekken, laadpunten en tankstations zoeken daarna langs de gekozen route.

## Routeproviders

- Google blijft de primaire routeprovider.
- De bestaande Google Directions-route wordt gebruikt voor de snelste route en beschikbare alternatieven.
- Voor **Tol vermijden** wordt een aparte route met tolvermijding opgevraagd.
- Als Google Directions niet beschikbaar is, probeert Roadora de Google Routes API.
- ORS blijft fallback en gebruikt voor tolvermijding `avoid_features: ["tollways"]`.
- Tol vermijden is een voorkeur van de routeprovider en geen absolute garantie dat nergens tol voorkomt.

## Veilig wisselen van route

- Bestaande gekozen stops en overnachtingen blijven behouden.
- Stopafstanden en aankomsttijden worden opnieuw gekoppeld aan de nieuwe route.
- Roadora waarschuwt vóór het wisselen wanneer al stops zijn gepland.
- Roadora meldt extra wanneer gekozen stops mogelijk ver van de nieuwe route liggen.
- Oude live zoekresultaten worden leeggemaakt, zodat nieuwe resultaten uitsluitend langs de nieuwe route worden opgehaald.
- Opnieuw klikken op de al actieve route wist geen zoekresultaten.

## Opslag

- De gekozen routevoorkeur wordt opgeslagen in autosave en IndexedDB-roadtrips.
- Kleine samenvattingen van beschikbare varianten worden opgeslagen.
- Alleen de actieve routegeometrie wordt lokaal bewaard; bij het kiezen van een andere variant na heropenen worden varianten opnieuw actueel berekend.

## Google Maps

- Bij **Tol vermijden** bevat de Maps-export `avoid=tolls`.
- De bestaande regels blijven behouden:
  - Dag 1 start vanaf de actuele locatie.
  - Dag 2 en later starten vanaf de vorige overnachting.
  - Maximaal drie tussenstops plus één eindbestemming voor de volledige dagroute.
  - “Navigeer naar volgende stop” blijft vanaf de actuele locatie werken.
- Google Maps kan een alternatieve lijn opnieuw berekenen; geplande tussenstops blijven de route wel sturen.

## Niet gewijzigd

- Hotels en Camperplekken met aankomsttijdvakken.
- Camperplekken alleen voor Busje en Camper.
- Lokale roadtripbibliotheek in IndexedDB.
- Stops-pins en Kaart-knoppen.
- Google primair en ORS fallback.
