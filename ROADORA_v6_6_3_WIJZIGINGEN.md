# Roadora v6.6.3 — vrije Uitjes-zoekfunctie

## Nieuw

- Vrij zoekveld **Wat wil je zoeken?** bij Uitjes.
- Zoeken op exacte naam, bijvoorbeeld `Swarovski Kristallwelten` of `Burg Eltz`.
- Zoeken op algemene termen, bijvoorbeeld `bergwandeling`, `waterval`, `zwemmeer`, `museum` of `dierentuin`.
- Vrije zoekterm en zoekgebied zijn bewust van elkaar gescheiden:
  - wat wil de gebruiker zoeken;
  - waar wil de gebruiker zoeken.
- Zoekgebied blijft volledig door de gebruiker bepaald:
  - huidige locatie;
  - plaats of adres;
  - kaartpunt;
  - routepunt.
- Handmatige zoekstraal van 10, 25 of 50 km.
- Maximaal 20 resultaten per zoekopdracht.
- Bestaande snelle categorieën blijven beschikbaar en starten nooit automatisch een zoekopdracht.

## Exacte namen

- Exacte naammatches krijgen voorrang in de resultaten.
- Algemene zoekresultaten buiten de gekozen straal worden hard weggefilterd.
- Alleen een sterke exacte naammatch mag als aparte optie buiten het gekozen zoekgebied verschijnen.
- Bij zo'n resultaat toont Roadora duidelijk hoeveel kilometer de plek buiten het zoekgebied ligt.
- De gebruiker beslist zelf of de plek wordt bekeken of toegevoegd.

## Techniek en veiligheid

- Vrije zoekopdrachten gebruiken Google Places Text Search (New).
- Categoriezoekopdrachten zonder vrije tekst blijven Google Places Nearby Search (New) gebruiken.
- Zoekterm en gekozen gebied worden apart opgeslagen in de roadtrip.
- Opgeslagen v6.6.2-reizen worden automatisch gemigreerd; het oude Uitjes-zoekveld blijft als gekozen plaats/adres behouden.
- Zoektermen worden opgeschoond en veilig als tekst weergegeven.
- Nieuwe fysieke CSS- en JavaScriptassets voorkomen browsercache met oudere Uitjes-code.

## Uitgevoerde controles

- JavaScript- en API-syntaxcontrole groen.
- API-mocktests voor categoriezoeking, algemene zoekterm, exacte match binnen de straal en exacte match buiten de straal groen.
- Browserflow met vrije zoekterm, plaats/adres, 10 km-straal en resultaatweergave groen.
- Responsive controle op 320, 360, 390, 430, 768 en 1440 pixels groen.
- Invoerveiligheid/XSS-regressietest groen.
