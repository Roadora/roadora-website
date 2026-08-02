# Roadora v6.8.4 — Stabiliteitsfix mobiele app

Roadora v6.8.4 herstelt de blokkerende kaartpunt-/routepuntvastloper en maakt de app-shell bruikbaar in telefoonlandschap en op tablets. Daarnaast zijn datumvalidatie, mobiele tikdoelen, meldingstapeling en toegankelijkheid aangescherpt.

## Gewijzigd

- Kaartpunt, Routepunt en Pin op kaart sluiten de sheet zonder een oneindige body-classobserverlus.
- De sheet wordt alleen aangepast bij een echte overgang naar of uit kaartselectie.
- De app-shell wordt ook actief op touchtablets, telefoonlandschap en geïnstalleerde touch-PWA's.
- Vertrekdatums vóór vandaag worden geblokkeerd bij een nieuwe routeberekening.
- Oude opgeslagen roadtrips blijven gewoon leesbaar.
- Primaire mobiele knoppen zijn minimaal 48 px hoog; overige belangrijke tikdoelen minimaal 44 px.
- PWA-installatie- en updateberichten worden automatisch boven een zichtbare cookiebanner geplaatst.
- Inactieve sheets, de kaart achter een open sheet en de planner achter het startscherm krijgen `aria-hidden` en `inert`.
- Focus gaat naar de geopende sheet en keert na sluiten terug naar de knop die de sheet opende.
- Quality gate uitgebreid met regressiecontroles voor deze stabiliteitsfixes.

## Installatie

Pak de compacte update uit in de hoofdmap van de Roadora-repository, vervang bestaande bestanden, commit en push via GitHub Desktop. Sluit de geïnstalleerde app na de groene Vercel-deployment volledig af en accepteer daarna de Roadora-update.
