# Roadora v6.7.3 — laatste gebruikersflow

## Basis

Deze compacte update moet worden uitgepakt over **Roadora v6.7.2.6**.
Behoud de bestaande mapstructuur.

## Wat is toegevoegd

- Zelf een plek toevoegen begint nu met zoeken op **naam of adres**.
- Roadora toont meerdere mogelijke matches; de gebruiker kiest zelf de juiste plek.
- Per gekozen plek bepaalt de gebruiker:
  - tussenstop of overnachting;
  - soort plek;
  - reisdag;
  - optionele notitie.
- Google Maps-link, coördinaten en kaartpin staan alleen nog onder **Meer opties**.
- Tussenstops kunnen in de routeplanning omhoog en omlaag worden verplaatst.
- De route wordt daarna opnieuw berekend in de gekozen stopvolgorde.
- Bij meer extra rijtijd dan de ingestelde maximale omrijtijd verschijnt een duidelijke waarschuwing.
- Verwijderen, overslaan, hervatten, kaartweergave en waypoint-routing blijven behouden.

## Gewijzigde bestanden

- `index.html`
- `css/webplanner-v673.css`
- `js/webplanner-v673.js`
- `api/google-place-search.js`
- `README_UPDATE_v6_7_3.md`
- `ROADORA_v6_7_3_WIJZIGINGEN.md`

## Bestaande Vercel-instelling

De nieuwe zoekendpoint gebruikt dezelfde bestaande `GOOGLE_MAPS_API_KEY` als de overige Google Places-functies. Er is geen nieuwe environment variable nodig.

## Korte livecontrole

1. Maak een route.
2. Open Stops en kies **Zelf een plek toevoegen**.
3. Zoek een specifieke naam, bijvoorbeeld een camping, museum of restaurant.
4. Kies het juiste resultaat.
5. Kies tussenstop of overnachting en de reisdag.
6. Voeg twee tussenstops toe en verander de volgorde met de pijlen.
7. Controleer of de routelijn opnieuw in die volgorde wordt berekend.
8. Controleer opslaan, verversen en opnieuw openen.
