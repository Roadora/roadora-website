# Roadora v6.6.0 — testrapport

Datum: 26 juli 2026
Basis: Roadora v6.5.6

## Samenvatting

Roadora v6.6.0 is gecontroleerd op de nieuwe Uitjes-flow en het nieuwe beheer van tussenstops. De bestaande route-, opslag- en beveiligingsbasis is niet opnieuw ontworpen; de nieuwe functies zijn daarop aangesloten.

## Uitgevoerde controles

### Browserflow

Geslaagd:

- Uitjes openen vanaf de Stops-tab.
- Standaardfilter Bezienswaardigheden laden.
- Wisselen naar Met kinderen.
- Een uitje toevoegen aan de actieve reisdag.
- Automatisch invoegen op de juiste routepositie.
- Voorgestelde stopduur meenemen in de aankomsttijd.
- Uitje vervangen door een ander uitje.
- Uitje tijdelijk overslaan.
- Overgeslagen stop uitsluiten van Google Maps-export.
- Stop hervatten en opnieuw opnemen in Google Maps-export.
- Compacte weergave van overgeslagen stops.

### Lokale opslag

Geslaagd:

- `outingType` wordt in de autosave opgeslagen.
- De metadata van een toegevoegd uitje wordt opgeslagen.
- De status `skipped` wordt opgeslagen.
- Bestaande v6.5.6-roadtrips krijgen veilig het standaardfilter Bezienswaardigheden wanneer het nieuwe veld ontbreekt.

### Responsive

Geteste viewportbreedtes:

- 320 px
- 360 px
- 390 px
- 430 px
- 1440 px

Resultaat:

- Geen horizontale pagina-overflow.
- Stopkaarten blijven compact.
- Acties Kaart, Vervang, Overslaan/Hervatten en Bewerken blijven bruikbaar.

### API

Geslaagd met gemockte Google Places-respons:

- Alleen POST en OPTIONS toegestaan.
- Onbekende origins worden geweigerd.
- Ontbrekende API-key levert een gecontroleerde configuratiemelding op.
- Ongeldige routepunten worden genegeerd.
- Uitjestypes worden genormaliseerd.
- Resultaatlimiet wordt begrensd.
- Resultaten worden gededupliceerd en over de routepunten gespreid.
- Cache voorkomt identieke vervolgverzoeken binnen de cacheduur.
- Museum krijgt een langere voorgestelde stopduur dan een kort uitzichtpunt.

### Security regression

Geslaagd:

- Kwaadaardige HTML in vertrekpunt en bestemming wordt als tekst weergegeven.
- Geen `onerror`-code uitgevoerd.
- Geen ongewenste afbeeldingselementen in de DOM geïnjecteerd.
- Bestaande CSP en serverless API-validatie blijven aanwezig.

### Statische controle

Geslaagd:

- 19 JavaScript- en API-bestanden syntactisch geldig.
- 9 HTML-pagina's gecontroleerd.
- 102 HTML-ID's gecontroleerd; geen dubbele ID's.
- 49 lokale asset- en paginaverwijzingen gecontroleerd; geen ontbrekende bestanden.
- Alleen de nieuwe actieve plannerassets worden door `index.html` geladen.

## Bekende grens

De testomgeving bevat geen productie-API-key. De Google Places-aanroep is daarom met realistische mocks gecontroleerd. Na deployment moet een echte Uitjes-zoekopdracht op Roadora worden uitgevoerd om API-activering, facturering en live resultaten te bevestigen.

## Fallback

De ongewijzigde v6.5.6-zip heeft dezelfde SHA-256-hash als het oorspronkelijke bestand:

`d92b4f1869a3877ea11fbf530fc5f5e82163d22574bfcfca69e2a27b748fc216`
