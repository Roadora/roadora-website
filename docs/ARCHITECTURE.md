# Architectuur v6.9.0

## Browser en geïnstalleerde app

`index.html` laadt Leaflet, `trip-db.js`, `cloud-sync.js`, `webplanner.js` en `pwa.js`. Het manifest geeft browsers de appnaam, iconen, kleuren, scope en standalone weergave. `pwa.js` registreert de service worker en beheert installatie- en updateberichten.

## Service worker

`sw.js` bewaart alleen de statische app-shell en publieke inhoudspagina’s. Navigaties gebruiken network-first met `offline.html` als fallback. CSS, JavaScript en afbeeldingen gebruiken stale-while-revalidate. Requests naar `/api/` blijven network-only, zodat route-, geocode- en Places-resultaten niet verouderen in een cache.

Een nieuwe service worker neemt de app niet stilzwijgend over. Roadora toont eerst een updatebericht en activeert de nieuwe worker pas na gebruikersbevestiging.

## Kaart en routing

Leaflet/OpenStreetMap verzorgt de kaartweergave. `/api/route` gebruikt Google primair en OpenRouteService als fallback. Actieve geselecteerde stops worden als waypoints in hun gekozen volgorde meegestuurd.

## Stops

De gebruiker kiest categorie, zoekgebied en locatie. Roadora voegt niets automatisch toe. Alleen actieve stops worden als waypoint gebruikt; overslaan, hervatten, verwijderen en verplaatsen leiden tot een nieuwe routeberekening.

## Opslag en synchronisatie

Roadtrips worden altijd eerst lokaal opgeslagen in IndexedDB en blijven buiten de service-workercache. `trip-db.js` gebruikt databaseversie 2 met aparte stores voor roadtrips, synchronisatiewachtrij en apparaatsmetadata. Daardoor verwijdert een appupdate geen opgeslagen roadtrips en blijven wijzigingen zonder internet beschikbaar.

`cloud-sync.js` is een optionele laag. Het haalt uitsluitend de publieke Supabase-URL en publishable key op via `/api/app-config`. Wanneer deze configuratie ontbreekt, blijft Roadora volledig lokaal werken. Na login verwerkt de synchronisatielaag de wachtrij, haalt cloudwijzigingen op en werkt lokale records bij.

De Supabase-tabel gebruikt een samengestelde sleutel van `user_id` en lokaal roadtrip-ID. Row Level Security beperkt select, insert en update tot `auth.uid() = user_id`. De browser krijgt nooit een service-role-key. Verwijderingen zijn soft deletes, zodat andere apparaten de verwijdering ontvangen.

Ieder cloudrecord heeft een revisienummer en inhoudshash. Wanneer een lokaal record en de cloudversie beide sinds de laatste synchronisatie zijn gewijzigd, overschrijft Roadora niets stil: de cloudversie blijft op het oorspronkelijke ID staan en de lokale versie wordt als aparte roadtrip bewaard.


## Mobiele app-shell v6.8.1

- `js/app-shell.js` is uitsluitend een presentatielaag boven de bestaande plannerlogica.
- Op schermen tot 760 px blijft de Leaflet-kaart permanent onder de interface staan.
- De linker routekolom en de rechter tabpanelen worden als bottom sheets getoond.
- De bestaande tabs blijven de bron van waarheid; de mobiele bottom navigation activeert die tabs programmatisch.
- Roadtripdata blijft in `js/webplanner.js` en `js/trip-db.js`; de app-shell dupliceert geen route- of opslagstatus.
- Op desktop wordt de app-shell volledig verborgen en blijft de drielaagse planner actief.


## Mobiele interactielaag v6.8.2

De scrim is een kind van `main.shell`, zodat kaart, scrim en bottom sheets in één stacking-context worden gerangschikt. De sheet zelf scrollt niet meer: de vaste sheet-header blijft staan en alleen `panel-stack` of het actieve `tab-panel` scrolt. `visualViewport` levert de bruikbare hoogte wanneer het mobiele toetsenbord opent.


## Mobiele interactielaag v6.8.3

Stops gebruikt `#stopsTab.tab-panel.active` als enige verticale scrollcontainer. Deze ID-specifieke override voorkomt dat oudere Stops-layoutregels met `overflow: visible` het scrollen uitschakelen. De routesheet krijgt een hogere standaardhoogte. Focus op invoervelden zet expliciet de mobiele toetsenbordstatus, zodat ook geïnstalleerde Android-PWA's met afwijkend viewportgedrag correct reageren.


## Mobiele stabiliteitslaag v6.8.4

De app-shell wordt niet langer uitsluitend door schermbreedte bepaald. `APP_SHELL_QUERY` combineert smalle schermen, coarse-pointer touchapparaten tot tabletbreedte en standalone touch-PWA's. De CSS voor de app-shell is volledig aan `html.roadora-mobile-shell` gekoppeld, zodat telefoonlandschap en tablets dezelfde vaste kaart, topbar, bottom navigation en sheets krijgen zonder desktop te beïnvloeden.

De body-classobserver bewaart de vorige `map-pick-active`-status en reageert uitsluitend op een echte overgang. `closeSheet()` is idempotent, waardoor een sheetwijziging de kaartselectieobserver niet opnieuw kan laten rondlopen. Inactieve sheets en achterliggende lagen worden met `aria-hidden` en `inert` uit de focus- en toegankelijkheidsboom gehaald.


## Mobiele productlaag v6.8.5

De lokale roadtripbibliotheek blijft volledig uit `webplanner.js` en IndexedDB komen. `app-shell.js` projecteert maximaal drie recente kaarten naar het mobiele startscherm en verwijdert daar bewust de destructieve verwijderactie; beheer blijft beschikbaar onder **Meer**.

`pwa.js` is de centrale controller voor alle installatieknoppen en voor handmatige en automatische updatecontrole. De appstatuskaart leest de actieve build uit `window.ROADORA_BUILD`. Route- en opslagknoppen gebruiken `aria-busy` om dubbele acties te voorkomen. Verwijderen gebruikt een eigen `alertdialog` met focusherstel en Escape-ondersteuning.


## Account- en cloudlaag v6.9.0

- `api/app-config.js` publiceert alleen de Supabase Project URL en publishable key uit Vercel Environment Variables.
- `js/cloud-sync.js` laadt `supabase-js` pas wanneer cloudconfiguratie aanwezig is.
- Authenticatie gebruikt een magic link/PKCE-flow en een blijvende browsersessie.
- `trip-db.js` verzendt lokale wijzigingen als events; de cloudlaag verwerkt die zonder de plannerlogica te dupliceren.
- Synchronisatie draait bij login, lokale wijzigingen, online komen, zichtbaarheid van de app, handmatige actie en periodiek tijdens actief gebruik.
- Cloudpulls worden via `source: cloud` teruggeschreven, zodat zij niet opnieuw in de uploadwachtrij terechtkomen.
- De mobiele startpagina en roadtripkaarten tonen de actuele lokale/cloudstatus.
