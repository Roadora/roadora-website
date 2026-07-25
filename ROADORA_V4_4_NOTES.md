# Roadora v4.4 — Demo losgekoppeld

Deze versie haalt de vaste demo-route uit de actieve plannerlogica.

- Geen automatische Amsterdam → Toscane route bij laden.
- Geen vaste 325 km/elektrisch als leidende standaard.
- Route wordt pas berekend na invoer en klik op "Maak dagroute".
- `/api/route` gebruikt geen fallbackcoördinaten meer als start/eind ontbreken.
- Live stops worden pas getoond na echte routeberekening.
- Bij API-fout toont Roadora een foutstatus in plaats van stille demo-data.
- Sitemap/robots blijven ongewijzigd t.o.v. v4.2.
