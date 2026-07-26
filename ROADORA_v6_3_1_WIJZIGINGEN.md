# Roadora Webplanner v6.3.1

## Hotelfix bij opgeslagen roadtrips

- Opgelost: een gekozen hotel of camperplek verdween na het opnieuw openen van een opgeslagen roadtrip.
- Oorzaak: na het laden van de opgeslagen snapshot werd de route-initialisatie opnieuw uitgevoerd. Die maakte `dayHotels` leeg en bouwde de dagplanning opnieuw op.
- Bij het openen van een opgeslagen roadtrip worden routegegevens nu geladen zonder de opgeslagen dagen, stops en overnachtingen te resetten.
- De autosave bij het starten van de website behoudt voortaan eveneens de opgeslagen overnachtingen.
- Herstel toegevoegd: wanneer een oudere opgeslagen reis geen `dayHotels` meer bevat, maar de hotel- of camperplekregel nog wel in de dagplanning staat, reconstrueert Roadora de overnachting automatisch.
- Een bewuste nieuwe routeberekening blijft de bestaande dagindeling opnieuw opbouwen; dat gedrag is ongewijzigd.

## Bestaande functies uit v6.3

- Hotels en Camperplekken gebruiken één aankomsttijdvak voor de overnachting.
- Alle stopcategorieën staan standaard uit, ook na het openen van een opgeslagen reis.
- Camperplekken zijn alleen zichtbaar bij voertuigtype Busje en Camper.
- Meerdere roadtrips worden lokaal opgeslagen in IndexedDB.
- Acties: openen, naam wijzigen, dupliceren en verwijderen.
- Google Maps dagroute zonder `origin`, met maximaal drie tussenstops plus één eindbestemming.
- Fallbackknop: `Navigeer naar volgende stop`.

## Test

1. Maak een roadtrip van twee dagen.
2. Selecteer voor Dag 1 een hotel of camperplek.
3. Sla de roadtrip op.
4. Start een nieuwe roadtrip of open een andere reis.
5. Open de opgeslagen tweedaagse roadtrip opnieuw.
6. De overnachting moet op Dag 1 zichtbaar blijven en Dag 2 moet vanaf die overnachting starten.
