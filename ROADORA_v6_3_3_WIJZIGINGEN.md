# Roadora Webplanner v6.3.3

## Tijdlijnfix voor gekozen stops

- Tank-, laad- en andere tussenstops krijgen niet langer een vaste voorbeeldtijd.
- De verwachte tijd wordt berekend uit de positie van de stop op de route, de vertrektijd en de actuele routetijd.
- Tussenstops worden op routevolgorde gezet wanneer hun routepositie bekend is.
- De verwachte aankomst bij hotel of camperplek schuift mee met eerdere stops.
- Voor de tijdinschatting tellen een standaard stopduur en de benaderde omrijtijd mee.
- Handmatig gewijzigde tijden worden niet opnieuw overschreven.
- Oudere opgeslagen roadtrips kunnen de routepositie van een stop herstellen via de opgeslagen coördinaten.

Basis/fallback: Roadora v6.3.2.
