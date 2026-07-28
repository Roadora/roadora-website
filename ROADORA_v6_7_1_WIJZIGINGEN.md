# Roadora v6.7.1 – geselecteerde stops als echte routepunten

## Nieuw

- Uitjes en Eten hebben een directe knop **Navigeer** vanaf de actuele locatie.
- De detailweergave van Uitjes en Eten bevat eveneens een knop **Navigeer**.
- Een toegevoegde locatie wordt een echt waypoint in de routeberekening.
- De Leaflet-routelijn wordt opnieuw berekend via alle actieve geselecteerde stops.

## Automatisch opnieuw berekenen

Roadora berekent de actieve route opnieuw na:

- stop toevoegen;
- stop vervangen;
- hotel of camperplek als dageindpunt kiezen;
- stop overslaan;
- stop hervatten;
- stop verwijderen.

Overgeslagen stops worden niet als waypoint meegestuurd.

Na iedere geslaagde berekening worden afstand, rijtijd, routepositie, stopvolgorde en aankomsttijden opnieuw verwerkt. Wanneer de routeprovider faalt, blijft de bestaande planning en routelijn bewaard.

## Route-API

- Ondersteuning uitgebreid naar maximaal 25 tussenliggende routepunten per berekening.
- Google blijft primair en ORS blijft fallback.
- Roadora optimaliseert de volgorde niet zelfstandig; de gebruiker bepaalt de stops en Roadora verwerkt ze in de bestaande reisvolgorde.
