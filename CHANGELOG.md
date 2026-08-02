# Changelog

## v6.8.4 — Stabiliteitsfix mobiele app

- Verwijdert de oneindige observerlus bij Kaartpunt, Routepunt en Pin op kaart.
- Maakt paneelsluiting idempotent en reageert alleen op echte kaartselectie-overgangen.
- Activeert de app-shell ook in telefoonlandschap, op touchtablets en in geïnstalleerde touch-PWA's.
- Blokkeert nieuwe routeberekeningen met een vertrekdatum vóór vandaag.
- Vergroot primaire en belangrijke mobiele tikdoelen naar 48 en minimaal 44 pixels.
- Stapelt PWA-installatie-/updateberichten boven de cookiebanner.
- Schermt inactieve sheets en achterliggende appdelen af met `aria-hidden` en `inert`.
- Herstelt focus naar de knop die een mobiele sheet opende.

## v6.8.3 — Mobiele Stops-scroll en hogere routesheet

- Herstelt verticaal scrollen in het volledige Stops-paneel en na het kiezen van een stopcategorie.
- Laat Stops standaard volledig geopend starten.
- Opent Route instellen merkbaar hoger.
- Verbetert Android-toetsenborddetectie met focus- en viewportstatus.
- Verbergt de onderste navigatie tijdens tekstinvoer en houdt het actieve veld zichtbaar.

## v6.8.2 — Mobiele interactie- en scrollfix

- Transparante scrim binnen de mobiele shell geplaatst, zodat invoervelden en scrollbewegingen niet meer worden onderschept.
- Bottom sheets omgebouwd naar vaste sheet-header met afzonderlijk scrollbare inhoud.
- Paneelhoogte corrigeert nu voor topbar én bottom navigation.
- Visual Viewport-afhandeling toegevoegd voor mobiel toetsenbord en oriëntatiewijzigingen.
- Focusvelden worden zichtbaar gehouden; Nieuwe roadtrip reset Route instellen naar boven.
- Paneeltitel ondersteunt tik en toetsenbord om te vergroten of verkleinen.
- Quality gate uitgebreid met regressiecontroles voor de mobiele interactielaag.

## v6.8.1 — Mobiele app-shell

- Mobiel startscherm toegevoegd met nieuwe roadtrip, huidige roadtrip en recente lokale roadtrips.
- De kaart is op mobiel het vaste hoofdscherm geworden.
- Vaste mobiele topbar toont actieve dag, kilometers en reistijd.
- Vaste bottom navigation toegevoegd voor Route, Stops, Planning en Meer.
- Route-, stop-, planning- en roadtrippanelen openen als bottom sheets boven de kaart.
- Bottom sheets kunnen worden gesloten, vergroot en met een neerwaartse veeg gesloten.
- Kaartpunt en Routepunt sluiten het paneel tijdens kaartselectie en herstellen daarna het juiste paneel.
- Geïnstalleerde PWA opent via `?source=pwa` op het mobiele startscherm.
- Desktopopmaak en bestaande plannerlogica blijven ongewijzigd.
- Service-worker-cache en quality gate uitgebreid met de mobiele app-shell.

## v6.8.0 — Installeerbare appbasis

- Web app manifest toegevoegd met standalone weergave, appkleuren en Roadora-iconen.
- Service worker toegevoegd voor app-shellcache, veilige updateflow en offline fallback.
- Route-, geocode- en Places-API’s worden bewust nooit door de service worker gecachet.
- Installatieknop toegevoegd voor ondersteunde browsers en iOS-instructie voor Zet op beginscherm.
- Nieuwe-versiemelding toegevoegd; een update wordt pas geactiveerd nadat de gebruiker daarvoor kiest.
- Safe-area ondersteuning toegevoegd voor geïnstalleerde apps op telefoons met notch of systeembalk.
- Quality gate uitgebreid met manifest-, icoon-, service-worker- en cacheveiligheidscontroles.

## v6.7.5 — Kaartpunt en routepunt herstel

- Klik op Kaartpunt of Routepunt start nu direct de kaartselectie.
- Routepunt controleert eerst of een route beschikbaar is en klikt vast op de dichtstbijzijnde positie op die route.
- Een zichtbare kaartbanner toont dat Roadora op een klik wacht en biedt Annuleren.
- Kaartselectie werkt ook boven route-lijnen en bestaande kaartmarkeringen.
- Cache-busting toegevoegd zodat browsers de herstelde planner direct laden.

## v6.7.4 — Clean Stable Base

- Alle updates tot en met v6.7.3 samengevoegd in één volledige repository.
- Oude versiegebonden CSS- en JavaScriptbundels verwijderd.
- Productie-assets hernoemd naar stabiele bestandsnamen.
- Ongebruikte oude plannerstyles en hulpscripts verwijderd.
- Historische patchdocumenten uit de productieroot verwijderd.
- Footer, HTML-buildmetadata en JavaScript-buildversie gelijkgezet.
- Verouderde tekst over uitgeschakelde stops vervangen door de actuele gebruikersflow.
- Verborgen, niet-gebruikte kaartknop verwijderd.
- Automatische statische quality gate toegevoegd.
- Geen nieuwe productfunctionaliteit toegevoegd.
