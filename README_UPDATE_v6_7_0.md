# Roadora v6.7.0 — compacte update

## Vereiste basis

Pas deze update toe op **Roadora v6.6.3**.

## Bestanden in deze update

Vervang of voeg uitsluitend deze bestanden toe:

- `index.html` — vervangen
- `js/webplanner-v670.js` — nieuw
- `css/webplanner-v670.css` — nieuw
- `api/resolve-map-link.js` — nieuw
- `ROADORA_v6_7_0_WIJZIGINGEN.md` — nieuw
- `ROADORA_v6_7_0_TESTRAPPORT.md` — nieuw

De oudere JavaScript- en CSS-assets mogen blijven staan. De nieuwe `index.html` verwijst alleen naar de v6.7.0-assets.

## Plaatsen

Pak de zip uit over de bestaande **v6.6.3-projectmap**, met behoud van de mapstructuur. Upload of commit daarna alleen de meegeleverde bestanden.

## Wat kort live testen

1. Maak een Rondreis met twee handmatige tussenbestemmingen en wijzig de volgorde.
2. Vul per reisdag een eigen vertrektijd en gewenste aankomsttijd in.
3. Kies een overnachting en voeg daarna bewust een nieuwe reisdag toe.
4. Gebruik de knop om de vorige overnachting als vertrekpunt te koppelen en ontkoppel hem weer.
5. Voeg een verblijfsdag bij een gekozen hotel/camperplek toe.
6. Voeg zelf een plek toe via coördinaten, een volledige Google Maps-link en een korte `maps.app.goo.gl`-link.
7. Sla de roadtrip op, ververs de pagina en open hem opnieuw.
8. Open een gekoppelde reisdag in Google Maps en controleer het vertrekpunt.

## Configuratie

Er zijn geen nieuwe environment variables nodig. Voor het uitlezen/geocoderen van Google Maps-links gebruikt Roadora de bestaande `GOOGLE_MAPS_API_KEY` (of `GOOGLE_GEOCODING_API_KEY` wanneer aanwezig).
