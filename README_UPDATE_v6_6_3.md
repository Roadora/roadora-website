# Roadora v6.6.3 — compacte update

## Vereiste basis

Pas deze update toe op **Roadora v6.6.2**. v6.6.2 moet al over de volledige v6.6.1-basis zijn geplaatst.

## Bestanden in deze update

Vervang of voeg uitsluitend deze bestanden toe:

- `index.html` — vervangen
- `api/google-outings.js` — vervangen
- `css/webplanner-v663.css` — nieuw
- `js/webplanner-v663.js` — nieuw
- `ROADORA_v6_6_3_WIJZIGINGEN.md` — nieuw

De oudere bestanden `css/webplanner-v662.css` en `js/webplanner-v662.js` mogen blijven staan. De nieuwe `index.html` verwijst alleen naar de v6.6.3-assets.

## Wat testen na plaatsing

1. Open **Stops → Uitjes**.
2. Zoek op een algemene term, bijvoorbeeld `bergwandeling`.
3. Zoek op een exacte naam, bijvoorbeeld `Burg Eltz`.
4. Test zoeken rond huidige locatie, plaats/adres, kaartpunt en routepunt.
5. Test de stralen 10, 25 en 50 km.
6. Controleer dat een exacte plek buiten het gekozen gebied apart wordt gemeld en niet automatisch wordt toegevoegd.

## Configuratie

Er zijn geen nieuwe environment variables nodig. De bestaande `GOOGLE_MAPS_API_KEY` en Places API (New)-configuratie blijven in gebruik.
