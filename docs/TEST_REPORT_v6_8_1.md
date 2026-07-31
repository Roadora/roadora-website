# Testrapport v6.8.1

## Statische controle

- Alle HTML-verwijzingen bestaan.
- Buildversies in planner, PWA-script en service worker zijn gelijk aan v6.8.1.
- JavaScript-syntaxcontrole is uitgevoerd op browserbestanden, service worker en API-endpoints.
- De service worker cachet `js/app-shell.js` met de actuele buildversie.
- De quality gate controleert mobiel startscherm, bottom navigation en beide bottom sheets.

## Mobiele shellflow

Getest op een mobiele Chromium-viewport:

1. `?source=pwa` opent het Roadora-startscherm.
2. Nieuwe roadtrip opent de Route-bottom-sheet.
3. Route, Stops, Planning en Meer activeren het juiste mobiele paneel.
4. Paneel sluiten laat de kaart als hoofdscherm staan.
5. De Roadora-markering in de topbar opent het startscherm opnieuw.
6. De mobiele interface blijft binnen de viewport en gebruikt veilige boven- en onderranden.

## Bestaande functionaliteit

De route-, stop-, dag-, kaartpunt-, routepunt- en IndexedDB-logica is niet herschreven. De mobiele app-shell activeert uitsluitend de bestaande panelen en bediening.
