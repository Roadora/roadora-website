# Testrapport Roadora v6.8.4

**Testdatum:** 2 augustus 2026  
**Basis:** Roadora v6.8.3  
**Doel:** stabiliteitsfix voor de mobiele app-shell

## Automatische quality gate

Geslaagd:

- buildversie v6.8.4 in planner, PWA en service worker;
- 10 HTML-pagina's en alle lokale verwijzingen;
- 11 browser-JavaScriptbestanden;
- 12 API-endpoints;
- JavaScript-syntax;
- manifest, iconen, service-workercache en beveiligingsheaders;
- mobiele stabiliteitsregressies.

## Browser-/interactietest

Getest met Chromium en touch-emulatie.

### 390 × 844 — telefoon portret

Geslaagd:

- app-shell en routesheet openen;
- kaartselectie sluit de sheet zonder vastloper;
- body blijft direct leesbaar na activeren van `map-pick-active`;
- sheet opent opnieuw na beëindigen van kaartselectie;
- Stops scrolt van positie 0 naar 500;
- vertrekdatum heeft vandaag als minimum;
- datum vóór vandaag wordt geblokkeerd vóór een route-API-call;
- Nederlandse melding: “Kies vandaag of een latere vertrekdatum”;
- Maak dagroute is 48 px hoog;
- sheet-sluitknop is 44 × 44 px;
- actieve sheet is toegankelijk, inactieve sheet en kaart zijn `inert`;
- na sluiten keert focus terug naar de Stops-knop;
- startscherm maakt de planner `inert`;
- PWA-melding en cookiebanner overlappen niet;
- geen JavaScript-paginafouten.

### 844 × 390 — telefoon landschap

Geslaagd:

- app-shell blijft actief;
- bottom navigation blijft zichtbaar;
- routesheet blijft fixed;
- geen horizontale pagina-overflow;
- geen JavaScript-paginafouten.

### 820 × 1180 — tablet portret

Geslaagd:

- app-shell wordt gebruikt in plaats van de desktopplanner;
- bottom navigation en fixed sheet zijn actief;
- geen horizontale pagina-overflow;
- geen JavaScript-paginafouten.

### 1440 × 900 — desktop

Geslaagd:

- mobiele app-shell blijft uit;
- mobiele navigatie blijft verborgen;
- linker- en rechterkolom blijven normale desktoponderdelen;
- geen onbedoelde `inert`-status;
- geen JavaScript-paginafouten.

## Conclusie

De zes auditpunten uit v6.8.3 zijn in v6.8.4 hersteld. De route-, stop-, dag- en opslaglogica is niet herschreven.
