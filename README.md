# Roadora v6.8.3 — Mobiele Stops-scroll en hogere routesheet

Roadora v6.8.3 herstelt het scrollen van het mobiele Stops-paneel en opent Route instellen duidelijk hoger. De toetsenborddetectie werkt nu ook op Android/PWA-installaties waarbij `visualViewport` en `innerHeight` tegelijk verkleinen.

## Gewijzigd

- Stops heeft één ID-specifieke, echte scrollcontainer.
- Stops opent standaard volledig zodat categorieën en resultaten direct bruikbaar zijn.
- Route instellen opent standaard hoger.
- Bij focus op een invoerveld verdwijnt de bottom navigation.
- De routesheet gebruikt dan alle zichtbare ruimte boven het toetsenbord.
- Geen wijzigingen aan route-, stop-, dag- of opslaglogica.

## Installatie

Pak de compacte update uit in de hoofdmap van de Roadora-repository, vervang bestaande bestanden, commit en push via GitHub Desktop.
