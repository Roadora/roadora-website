# Roadora v6.6.1 — testrapport

## Scope

Gerichte quality gate voor de nieuwe spreiding van Eten en Uitjes over de actieve reisdag.

## Geslaagde controles

- De actieve reisdag wordt in vijf vaste routezones verdeeld.
- De aanbevolen lijst bevat maximaal acht resultaten en maximaal twee per zone.
- Op een testdag van 800 km bleef de kleinste afstand tussen gekozen aanbevelingen ruim boven de ingestelde 50 km-grens.
- Lege/dunne routezones worden gecontroleerd aangevuld zonder clustering te veroorzaken.
- Alle resultaten blijven volledig beschikbaar en staan in routevolgorde.
- Wisselen tussen `Aanbevolen verspreid` en `Alle resultaten` werkt.
- Eten en Uitjes gebruiken dezelfde verdeellogica, maar behouden hun eigen filters.
- Dag 2 gebruikt uitsluitend het routedeel vanaf het eindpunt van Dag 1; resultaten uit de eerste helft werden weggefilterd.
- Op 320 px ontstond geen horizontale overflow; beide weergaveknoppen bleven bruikbaar.
- Google Food en Google Outings verwerken nu tien zoekpunten per actieve reisdag.
- JavaScript- en API-syntax zijn gecontroleerd.
- De gebruiker moet de categorie en het filter nog steeds zelf kiezen en moet iedere stop zelf toevoegen.

## API-mocktests

- `google-food`: 10 zoekpunten verwerkt, 10 unieke testresultaten, route-engine `food-active-day-zones-v2`.
- `google-outings`: 10 zoekpunten verwerkt, 10 unieke testresultaten, route-engine `outings-active-day-zones-v2`.

## Browsermocktest

- 16 resultaten langs een testdag.
- 8 gelijkmatig verdeelde aanbevelingen.
- Vijf routegebieden vertegenwoordigd, met maximaal twee aanbevelingen per gebied.
- Dag 2-filtering, moduswissel en 320px-weergave groen.
- Geen JavaScript-page-errors.

## Live controle na plaatsing

Google Places-resultaten kunnen per land en categorie verschillen. Controleer na deployment één lange route met Eten en Uitjes en vergelijk `Aanbevolen verspreid` met `Alle resultaten`.
