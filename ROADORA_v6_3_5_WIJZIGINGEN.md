# Roadora Webplanner v6.3.5 — Quality Gate

Basis/fallback: Roadora v6.3.4.

## Opgelost

- Opnieuw berekenen behoudt bestaande reisdagen, tussenstops, hotels en camperplekken.
- Bij een mislukte routeberekening blijven de vorige kaartlijn, planning en live zoekresultaten behouden.
- Een vervangen hotel/camperplek op een eerdere dag overschrijft een al geplande volgende dag niet meer.
- Tijden van Dag 2 en later worden berekend vanaf de overnachting van de vorige dag.
- Hotels en energiepunten worden per actieve reisdag gezocht; resultaten van Dag 1 worden niet hergebruikt op Dag 2.
- Hotelkaartjes op latere dagen gebruiken de vertrektijd en routepositie van die dag.
- Laad- en tankzoekzones beginnen na het vertrekpunt van de actieve dag.
- Stops die buiten de actieve reisdag liggen, worden niet toegevoegd.
- Na het verwijderen van een reisdag worden vertrekpunten en omliggende dagen opnieuw gekoppeld.
- Het aantal actieve dagen begrenst nu ook de actieve dag.
- Vertrekpunt en gewoon eindpunt kunnen niet per ongeluk uit de tijdlijn worden verwijderd.
- Een hotel/camperplek kan veilig worden verwijderd zonder de tijdlijn kapot te maken.
- Een nieuwe roadtrip start niet wanneer de huidige reis niet kan worden opgeslagen.
- Bij een mislukte eerste opslag wordt geen niet-bestaand roadtrip-ID achtergelaten.
- IndexedDB-fallback meldt nu correct wanneer ook localStorage niet kan schrijven.
- Ongeldige geneste knoppen in het dagoverzicht zijn vervangen door geldige, losse knoppen.
- Afstand bij de laatste reisdag toont nu de afstand van die dag, niet opnieuw de totale roadtripafstand.

## Behouden

- Google primair en ORS fallback.
- Camperplekken alleen bij Busje en Camper.
- Alles standaard uit.
- Aankomsttijdvakken voor Hotels en Camperplekken.
- Meerdere lokale roadtrips via IndexedDB.
- Stop-pins op de Roadora-kaart.
- Google Maps-export: Dag 1 vanaf actuele locatie; Dag 2+ vanaf vorige overnachting.
- Fallbackknop `Navigeer naar volgende stop` vanaf de actuele locatie.

## Quality gate

- 23 hoofdtests voor route, tijdlijn, opslag, openen, Maps-export en foutafhandeling.
- 11 verdiepende tests voor meerdaagse zoekgebieden, dagwissels, dagverwijdering en maximale Maps-stops.
- Alle JavaScript- en API-bestanden syntactisch gecontroleerd.
