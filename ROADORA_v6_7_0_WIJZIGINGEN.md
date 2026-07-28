# Roadora v6.7.0 — Rondreis en eigen plekken gehard

## Rondreis volledig handmatig

- De gebruiker bepaalt zelf alle tussenbestemmingen en hun volgorde.
- Tussenbestemmingen kunnen omhoog, omlaag en verwijderd worden.
- De expliciete actie **Eindig bij vertrekpunt** vult alleen na een bewuste klik het eindpunt in.
- Roadora stelt geen landen, bestemmingen, dagen, rustdagen of stops voor.
- De routeaanvraag bewaart de handmatig gekozen volgorde.

## Tijden per reisdag

Iedere reisdag heeft nu eigen instellingen voor:

- vertrektijd;
- gewenste aankomsttijd;
- aankomsttijdvak voor de overnachting;
- type dag: reisdag of verblijfsdag.

Roadora vergelijkt de berekende aankomst met de gewenste aankomst en toont alleen de haalbaarheid. De gebruiker beslist zelf wat wordt aangepast.

## Bewuste koppeling tussen dagen

- Een nieuwe reisdag wordt nooit automatisch aan de vorige overnachting gekoppeld.
- Alleen de knop **Gebruik [overnachting] als vertrek** maakt de koppeling.
- De koppeling kan weer worden verwijderd zonder de eigen vertrektijd te verliezen.
- Wanneer een al gekoppelde overnachting wordt gewijzigd, wordt alleen die bewust gekoppelde volgende dag bijgewerkt.

## Verblijfsdagen en meerdere nachten

- Na het kiezen van een hotel of camperplek kan de gebruiker zelf een verblijfsdag toevoegen.
- Een verblijfsdag bewaart dezelfde overnachtingsplek en bevat geen lange dagroute.
- Verblijfsdagen worden niet als gewone route naar Google Maps geëxporteerd.
- Bij verwijderen of invoegen van dagen schuiven tijden, overnachtingen en daggegevens gecontroleerd mee.

## Zelf een plek toevoegen

Ondersteund worden:

- naam of volledig adres;
- coördinaten;
- volledige Google Maps-link;
- korte Google Maps-link (`maps.app.goo.gl`);
- handmatig geplaatste kaartpin.

Handmatig toegevoegde plekken:

- krijgen `source: user`;
- bewaren naam, type, coördinaten, notitie en bronlink;
- worden meegenomen in route, tijdlijn, opslag en Google Maps-export;
- kunnen als overnachting of gewone stop worden gebruikt;
- worden nooit aan de algemene Roadora-resultaten toegevoegd.

Roadora blokkeert een plek buiten de route niet, maar toont eerst de afstand en geschatte extra reistijd en vraagt om bevestiging.

## Google Maps-links

- Volledige links met coördinaten worden lokaal uitgelezen.
- Korte Google Maps-links worden veilig via `/api/resolve-map-link` opgelost.
- De resolver accepteert uitsluitend Google Maps-hosts en voorkomt willekeurige externe URL-verzoeken.
- Wanneer alleen een naam/adres in de link staat, gebruikt de resolver de bestaande Google-geocodingconfiguratie.

## Opslag en migratie

- Daginstellingen en verblijfsdagen worden in IndexedDB/autosave bewaard.
- v6.6.3-roadtrips zonder daginstellingen krijgen bij openen veilige standaardwaarden.
- Opslaan, nieuwe roadtrip starten en opnieuw openen behouden handmatige plekken, dagkoppelingen en tijden.
