# Roadora Webplanner v6.3

## Ingebouwd

- Hotels en Camperplekken gebruiken één aankomsttijdvak voor de overnachting.
- Alle stopcategorieën staan standaard uit, ook na het openen van een opgeslagen reis.
- Camperplekken zijn alleen zichtbaar bij voertuigtype Busje en Camper.
- Live camperplekken worden via `/api/google-camperplaces` gezocht rond het berekende deel van de route.
- Een gekozen hotel of camperplek blijft het eindpunt van de dag zonder eerder toegevoegde stops te verwijderen.
- Meerdere roadtrips worden lokaal opgeslagen in IndexedDB, met localStorage als technische fallback.
- Acties: openen, naam wijzigen, dupliceren en verwijderen.
- `Nieuwe roadtrip` bewaart eerst de huidige planning en start daarna leeg.
- Na de eerste handmatige opslag worden verdere wijzigingen automatisch in dezelfde roadtrip opgeslagen.
- Google Maps dagroute: geen `origin`, actuele locatie als vertrekpunt, maximaal drie tussenstops plus één eindbestemming.
- Fallbackknop: `Navigeer naar volgende stop`.

## Belangrijk bij testen

1. Kies Auto of Elektrisch: Camperplekken mogen niet zichtbaar zijn.
2. Kies Busje of Camper: Camperplekken moeten zichtbaar worden.
3. Zonder vertrektijd of aankomsttijdvak mogen Hotels/Camperplekken niet zoeken.
4. Sla een roadtrip op, maak een nieuwe en open daarna de eerdere roadtrip opnieuw.
5. Test `Start dagroute in Maps` op een telefoon met maximaal vier bestemmingen totaal.
