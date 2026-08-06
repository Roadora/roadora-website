# Roadora v6.9.2 — Interface-opruiming

## Wijziging

De visuele route-stappenbalk met de gekleurde rondjes ✓, 1, 2, 3, 4 en B is verwijderd uit het gedeelde planner-DOM. Daardoor verdwijnt hij tegelijk uit de desktopwebsite en de mobiele app-shell. De bijbehorende ongebruikte CSS is eveneens verwijderd.

## Gecontroleerd

- Geen `route-dots`-element meer in `index.html`.
- Geen actieve `.route-dots`, `.dot.start` of `.dot.end`-stijlen meer.
- De kaart, samenvatting, dagtabs, tijdlijn, Stops en mobiele bottom navigation blijven aanwezig.
- Geen lege strook onder de routesamenvatting.
- Planner werkt in desktop- en mobiele viewport.
- Exact 12 Vercel Functions; `api/app-config.js` is afwezig.
- HTML-verwijzingen, JavaScript-syntax, PWA-versies en quality gate zijn groen.

## Functionele impact

Geen. Routeberekening, stops, meerdaagse planning, lokaal opslaan en cloudsynchronisatie zijn niet gewijzigd.
