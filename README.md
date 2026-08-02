# Roadora v6.8.5 — Mobiele afwerking

Roadora v6.8.5 werkt de stabiele mobiele basis van v6.8.4 af tot een duidelijker en professioneler appproduct. De release verbetert het startscherm, de lokale roadtripbibliotheek, laad- en foutstatussen, verwijderen-bevestiging en de installatie-/updateflow zonder de route-, stop- of meerdaagse logica te herschrijven.

## Gewijzigd

- Versienummer en appstatus toegevoegd onder **Meer → Over Roadora**.
- Handmatige knop toegevoegd om op een nieuwe Roadora-versie te controleren.
- Installatieknoppen worden vanuit één PWA-controller aangestuurd.
- Mobiel startscherm verfijnd met lokale-opslagstatus, buildversie en duidelijkere recente roadtrips.
- Roadtripkaarten tonen naam, route, aantal dagen en laatste wijziging in een rustiger kaartontwerp.
- Lege en ladende toestanden toegevoegd aan de roadtripbibliotheek.
- Routeberekening en lokaal opslaan tonen een echte busy-status en blokkeren dubbele tikken.
- Routefouten zijn vertaald naar korte, bruikbare Nederlandse meldingen.
- Verwijderen van een roadtrip gebruikt een eigen toegankelijke bevestiging in plaats van een kaal browservenster.
- Toastmeldingen onderscheiden informatie, succes en fouten.
- Quality gate uitgebreid met regressiecontroles voor de mobiele afwerking.

## Installatie

Pak de compacte update uit in de hoofdmap van de Roadora-repository, vervang bestaande bestanden, commit en push via GitHub Desktop. Sluit de geïnstalleerde app na de groene Vercel-deployment volledig af en kies **Nu bijwerken** wanneer Roadora de nieuwe versie aanbiedt.
