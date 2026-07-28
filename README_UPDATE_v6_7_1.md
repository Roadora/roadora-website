# Roadora v6.7.1 – compacte update op v6.7.0

Deze zip bevat alleen de bestanden die voor v6.7.1 zijn gewijzigd of nieuw zijn.

## Vereiste basis

Pas deze update uitsluitend toe op **Roadora v6.7.0**.

## Installeren

Pak de zip uit in de hoofdmap van je Roadora-project en laat bestaande bestanden vervangen. Behoud de mapstructuur.

Te vervangen/plaatsen:

- `index.html`
- `js/webplanner-v671.js` (nieuw)
- `api/route.js`
- `ROADORA_v6_7_1_WIJZIGINGEN.md`

`js/webplanner-v670.js` mag blijven staan. `index.html` verwijst na de update automatisch naar v6.7.1.

## Live testen na upload

1. Zoek een restaurant of uitje en tik op **Navigeer**: Google Maps moet direct naar die plek openen.
2. Voeg dezelfde plek toe aan de reisdag.
3. Controleer dat de routelijn in Leaflet opnieuw wordt berekend en werkelijk via de gekozen plek loopt.
4. Controleer dat kilometers, rijtijd en aankomsttijden zijn aangepast.
5. Sla de stop over: de routelijn moet opnieuw zonder die stop worden berekend.
6. Hervat of verwijder de stop: de routelijn moet opnieuw worden bijgewerkt.
