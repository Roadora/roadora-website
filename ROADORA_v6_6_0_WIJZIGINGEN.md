# Roadora v6.6.0 — Uitjes live en stopbeheer

## Nieuwe functies

- **Uitjes** is live gekoppeld aan Google Places (New) langs de actieve reisdag.
- Vier eenvoudige uitjesfilters:
  - Bezienswaardigheden
  - Natuur
  - Cultuur
  - Met kinderen
- Resultaten worden verspreid over maximaal zes routepunten van de actieve dag.
- Ieder resultaat kan een beoordeling, aantal reviews, openingstatus, routeafstand, omrij-inschatting, foto en type uitje tonen wanneer Google die gegevens levert.
- Uitjes krijgen een voorgestelde stopduur. Deze tijd wordt automatisch meegenomen in de rest van de dagplanning.

## Stopbeheer

- Tussenstops kunnen tijdelijk worden **overgeslagen**.
- Overgeslagen stops blijven zichtbaar in de planning, maar:
  - tellen niet mee in de stopduur;
  - worden niet naar Google Maps geëxporteerd;
  - krijgen een grijze, herkenbare weergave;
  - kunnen met **Hervatten** weer worden geactiveerd.
- Live tussenstops kunnen voortaan altijd worden **vervangen** door een nieuw resultaat van hetzelfde type, niet alleen na een routewissel.
- Hotels en Camperplekken blijven eindpunten van een reisdag en worden niet als gewone tussenstop overgeslagen.

## Techniek en veiligheid

- Nieuwe endpoint: `api/google-outings.js`.
- Nieuwe assets: `js/webplanner-v660.js` en `css/webplanner-v660.css` om oude browsercache te vermijden.
- Uitjesfilter en overgeslagen status worden lokaal met de roadtrip opgeslagen.
- Bestaande invoerbeveiliging, routefiltering, origincontrole en basis-rate-limiting zijn behouden.
- v6.5.6 is ongewijzigd bewaard als stabiele fallback.

## Controle

- JavaScript- en API-syntaxcontrole: 19 bestanden groen.
- Browserflow getest: filteren, toevoegen, vervangen, overslaan, hervatten en Maps-export.
- Opslagtest: gekozen uitjestype en overgeslagen status blijven in de autosave staan.
- Responsive getest op 320, 360, 390, 430 en 1440 pixels zonder horizontale overflow.
- Invoerbeveiliging opnieuw getest met kwaadaardige HTML; geen uitvoering of geïnjecteerde DOM-elementen.
- Google Places-respons is lokaal met mocks getest. Na Vercel-deploy blijft één echte live zoektest met de productie-API-key nodig.
