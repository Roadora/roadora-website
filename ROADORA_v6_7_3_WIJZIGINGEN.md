# Roadora v6.7.3 — wijzigingen

## Eenvoudig zelf een plek toevoegen

De oude hoofdflow met losse naam, Google Maps-link en coördinaten is vervangen door:

1. naam of adres zoeken;
2. juiste zoekresultaat kiezen;
3. tussenstop of overnachting kiezen;
4. soort plek en reisdag kiezen;
5. toevoegen.

Google Maps-links, coördinaten en een kaartpin blijven beschikbaar onder **Meer opties**.

## Nieuwe plaatszoekendpoint

`api/google-place-search.js` zoekt maximaal acht relevante matches op naam of adres. De zoekopdracht wordt, wanneer een route bestaat, alleen geografisch bevooroordeeld rond de actieve route; een expliciete plaatsnaam kan nog steeds buiten dat gebied gevonden worden.

## Handmatige stopvolgorde

Iedere tussenstop krijgt pijlen omhoog en omlaag. Zodra de gebruiker de volgorde wijzigt:

- blijft die handmatige volgorde vaststaan;
- worden waypoints in precies die volgorde naar de routeberekening gestuurd;
- wordt de Leaflet-routelijn opnieuw getekend;
- worden afstand, rijtijd en aankomsttijden vernieuwd.

## Omrijtijdwaarschuwing

Roadora vergelijkt de geschatte of gemeten extra rijtijd met de instelling **Maximaal omrijden**.

- Voor het toevoegen kan een bevestiging verschijnen.
- Na de routeberekening wordt bij een te grote impact een waarschuwing op de planningkaart getoond.

## Getest

Gecontroleerde browsertest uitgevoerd met:

- zoeken op naam;
- meerdere resultaten en bewuste selectie;
- automatische herkenning van camperplek/overnachting;
- toevoegen als tussenstop;
- twee waypoints;
- stopvolgorde omwisselen;
- routeaanvraag in de nieuwe volgorde;
- omrijtijdwaarschuwing;
- stop verwijderen;
- mobiele viewport van 390 × 844 pixels;
- geen JavaScript- of consolefouten.
