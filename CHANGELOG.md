# Changelog

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
