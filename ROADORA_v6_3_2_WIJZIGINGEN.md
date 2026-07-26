# Roadora Webplanner v6.3.2

## Nieuwe patch: zichtbare pins voor gekozen stops

- De actieve reisdag toont nu blijvende pins op de Leaflet-kaart voor alle stops waarvan een exacte locatie bekend is.
- Startpunt krijgt `S`, gewone tussenstops worden genummerd en het eindpunt krijgt `E`.
- Een hotel krijgt een herkenbare `H`-pin en een camperplek een `C`-pin.
- Klik op een pin toont de naam, dag en het type stop.
- Bij iedere planningregel met een bekende locatie staat nu **Kaart**. Daarmee zoomt Roadora direct naar de juiste pin.
- Bij het wisselen van reisdag worden de pins vervangen door de stops van de actieve dag.
- Handmatig getypte stops zonder coördinaten krijgen nog geen pin; daarvoor moet later een locatie worden gekozen of gegeocodeerd.

## Behouden

- Hotelfix uit v6.3.1.
- Lokale roadtripbibliotheek in IndexedDB.
- Hotels en Camperplekken met aankomsttijdvak.
- Camperplekken alleen voor Busje en Camper.
- Google Maps-export zonder `origin`, maximaal drie tussenstops plus één eindbestemming.
