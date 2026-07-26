# Roadora v6.5.1 — stops aanpassen na routewissel

## Opgelost

- Een gekozen stop behield na wisselen tussen Snelste, Tol vermijden en Alternatief nog de oude zichtbare afstand, aankomsttijd en omrij-indicatie.
- Routeposities werden berekend op basis van het indexnummer van polylinepunten. Omdat routepunten niet gelijkmatig verdeeld zijn, kon de kilometerpositie onnauwkeurig blijven.
- De tekst op een planningkaart werd niet opnieuw opgebouwd nadat de onderliggende stopmetadata al was aangepast.

## Nieuw gedrag

- Iedere gekozen stop wordt na een routewissel opnieuw geprojecteerd op de nieuwe routelijn.
- Afstand vanaf vertrek, routevolgorde, aankomsttijd en omrij-inschatting worden opnieuw berekend.
- De routepositie gebruikt nu cumulatieve lijnlengte en het dichtstbijzijnde lijnsegment in plaats van alleen het dichtstbijzijnde polylinepunt.
- Een stop die te ver van de nieuwe route ligt wordt oranje gemarkeerd.
- Bij zo'n stop verschijnt **Vervang**. Daarmee zoekt Roadora een nieuw resultaat van hetzelfde type langs de actieve route en reisdag.
- Een gekozen hotel of camperplek wordt nooit stilzwijgend vervangen. Roadora markeert deze zodat de gebruiker bewust een andere overnachting kan kiezen.
- De exacte locatiepin van een gekozen stop blijft op de echte locatie staan.

## Veilige fallback

Roadora v6.5.0 is ongewijzigd opgeslagen als stabiele fallback.
