# Testrapport Roadora v6.7.4

## Statische quality gate

- Alle lokale HTML-verwijzingen bestaan.
- Geen dubbele HTML-id’s gevonden.
- Buildversie is gelijk in HTML, footer en JavaScript.
- Alle browser- en API-JavaScriptbestanden slagen voor `node --check`.
- Alle twaalf vereiste API-endpoints zijn aanwezig.
- Beveiligingsheaders in `vercel.json` zijn aanwezig.
- Geen oude versiegebonden webplannerbundels of patchdocumenten in de productieroot.
- Geen verwijzingen naar andere projecten of lokale ontwikkelpaden gevonden.

## Gecontroleerde browsertest

Getest in Chromium met vaste route-, geocode- en Places-antwoorden:

- Planner start met build v6.7.4.
- Amsterdam → Innsbruck berekent 900 km en 9 uur.
- Een handmatig gezocht uitje wordt gekozen en toegevoegd.
- De route wordt opnieuw aangeroepen met het gekozen uitje als waypoint.
- De getekende routelijn bevat het waypoint.
- De stop krijgt verwijderacties.
- Verwijderen berekent de route opnieuw zonder waypoint.
- Mobiele viewport 390 × 844 heeft geen horizontale overflow.
- De normale pagina kan tot onderaan scrollen.
- Geen JavaScript-, pagina- of consolefouten gevonden.

## Beperking

De browsertest gebruikt gecontroleerde API-antwoorden en een Leaflet-teststub. Na liveplaatsing blijft een korte praktijktest met echte Google/ORS-data en echte kaarttegels nodig.
