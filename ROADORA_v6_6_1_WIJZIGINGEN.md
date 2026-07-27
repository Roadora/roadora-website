# Roadora v6.6.1 — Eten en Uitjes verspreid over de reisdag

## Nieuw

- De actieve reisdag wordt voor Eten en Uitjes verdeeld in vijf vaste routezones.
- De weergave **Aanbevolen verspreid** kiest eerst één sterke locatie per zone en maximaal twee per zone.
- Aanbevolen locaties houden ongeveer 35–50 km onderlinge afstand, afhankelijk van de lengte van de reisdag.
- Lege zones kunnen gecontroleerd worden aangevuld vanuit een naburige zone.
- **Alle resultaten** blijft beschikbaar en staat gewoon in routevolgorde.
- Alleen de actieve reisdag wordt gebruikt; resultaten van andere dagen mengen niet mee.
- Roadora kiest of voegt niets automatisch toe. De gebruiker zet Eten of Uitjes zelf aan, kiest zelf een filter en voegt zelf een resultaat toe.

## Techniek

- Eten en Uitjes gebruiken maximaal tien zoekpunten over de actieve dagroute, in plaats van zes.
- Kwaliteitsscore combineert beoordeling, reviewaantal, openingstatus en afstand/omrijtijd.
- Nieuwe fysieke assets `webplanner-v661.js` en `webplanner-v661.css` voorkomen oude browsercache.
- v6.6.0 blijft ongewijzigd beschikbaar als fallback.
