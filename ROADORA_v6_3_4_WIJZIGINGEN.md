# Roadora Webplanner v6.3.4

## Dagstart Google Maps hersteld

- Dag 1 blijft zonder `origin` openen, zodat Google Maps de actuele locatie gebruikt.
- Dag 2 en later gebruiken de gekozen overnachtingsplek van de vorige dag als gepland vertrekpunt.
- Hiervoor worden bij voorkeur de exacte coördinaten en Google Place ID van het hotel of de camperplek meegestuurd.
- `Navigeer naar volgende stop` blijft bewust zonder `origin` werken en navigeert dus altijd vanaf de actuele locatie.
- Als de overnachtingsmetadata ontbreekt, gebruikt Roadora de opgeslagen vertrekregel van de betreffende dag als fallback.

Basis/fallback: Roadora v6.3.3.
