# ToolPakker

ToolPakker is een statische, productgerichte gereedschapvergelijker. De catalogus scheidt basismodellen, exacte uitvoeringen en aanbieders. Prijs- en beschikbaarheidsupdates worden alleen gepubliceerd bij een gecontroleerde EAN- en uitvoeringscodematch.

## Status

- Projectversie: **0.5.352**
- 1.423 basismodellen
- 2.103 uitvoeringen
- 2.314 live aanbiedingen
- 23 actieve categorieën
- Productie: Vercel vanuit branch `main`



### Bosch Professional + Mastertools batch 2 (0.5.352)

- 40 aanvullende Bosch Professional-uitvoeringen gepubliceerd na controle van EAN, volledige Bosch-artikelcode en de Leveringsomvang van de exacte Mastertools-productpagina.
- 9 nieuwe basismodellen, 37 nieuwe uitvoeringen en 40 nieuwe live Mastertools-aanbiedingen toegevoegd; 3 bestaande uitvoeringen hebben nu eveneens een gecontroleerde Mastertools-aanbieding.
- De batch omvat GSR/GSB-boormachines, GDR/GDX-slagschroevendraaiers, GDS-slagmoersleutels en GBH-boor-/combihamers.
- Alle 14 inhoudelijk aangepakte Bosch-basismodellen hebben Productomschrijving, Bijzondere kenmerken en Technische gegevens uit officiële Bosch Professional-bronnen; GSR 18V-65 was al compleet.
- Twee intern tegenstrijdige productpagina’s en één gecombineerde machine-/handgereedschapsset zijn bewust niet gepubliceerd en blijven in de reviewwachtrij.
- Catalogusstatus: 1.423 basismodellen, 2.103 uitvoeringen en 2.314 live aanbiedingen.


### Zelfmeldende feedbewaking (0.5.351)

- De feedworkflow groepeert ontbrekende aanbiedingen voortaan per aanbieder en merk en zet alleen echte actiepunten in één automatisch bijgewerkte GitHub Issue.
- Alle open Mastertools-productpagina’s krijgen voorrang binnen de runlimiet; ToolMax stopt na drie anti-botblokkades automatisch met verdere probes om onnodig verkeer te voorkomen.
- Ongeldige aanbieder-URL’s zijn een harde fout. De foutieve DJV186WVE-link is hersteld naar de exacte ToolMax-productpagina.
- Nieuwe productkandidaten blijven uitsluitend informatief en veroorzaken geen waarschuwing of automatische publicatie.
- Je hoeft het feedartifact niet routinematig te openen: controleer alleen de automatische issue wanneer die openstaat.


### Catalogus-synchronisatieherstel (0.5.350)

- De volledige, onderling afhankelijke Bosch Professional-dataset van v0.5.348 en v0.5.349 is opnieuw als één consistente reparatieset vastgelegd.
- Productgroepen, uitvoeringen, bronaanbiedingen, gepubliceerde aanbiedingen, productinformatie en bronregistratie worden daardoor altijd samen bijgewerkt.
- De catalogusconsolidatietest toont voortaan bij een fout eerst de concrete structurele foutrecords, zodat GitHub Actions direct laat zien welk bestand of record niet synchroon is.
- De gevalideerde catalogus blijft op 1.414 basismodellen, 2.066 uitvoeringen en 2.274 live aanbiedingen.

### Bosch Professional batch 1 inhoudelijk compleet (0.5.349)

- De vier nog onvolledige basismodellen uit de eerste Mastertools-batch hebben nu alle drie vaste onderdelen uit officiële Bosch Professional-bronnen.
- GSR 12V-15 FC, GDS 18V-1050 H, GKS 18V-57-2 en GOP 18V-34 bevatten een uitgebreide omschrijving, minimaal zes kenmerken en minimaal zeven technische gegevens.
- Uitvoeringen, setinhoud, EAN-koppelingen, prijzen en aanbieders zijn niet aangepast; de catalogus blijft op 1.414 basismodellen, 2.066 uitvoeringen en 2.274 live aanbiedingen.


### Bosch Professional + Mastertools batch 1 (0.5.348)

- 40 Mastertools-producten gepubliceerd na handmatige controle van EAN, volledige Bosch-artikelcode en Leveringsomvang op de exacte productpagina.
- 29 nieuwe uitvoeringen en 40 nieuwe live aanbiedingen; 11 bestaande Bosch-uitvoeringen hebben nu ook een gecontroleerde Mastertools-aanbieding.
- GSR 12V-15 FC staat als aparte FlexiClick-familie in de catalogus.
- Zes onduidelijke of intern tegenstrijdige Mastertools-pagina’s zijn niet gepubliceerd en blijven als bronprobleem geregistreerd.
- Afgekapt opgeslagen Bosch-titels zijn vervangen door volledige modelcodes en modeltitels worden niet meer visueel afgeknipt.
- Catalogusstatus: 1.414 basismodellen, 2.066 uitvoeringen en 2.274 live aanbiedingen.


### Makita bouwplaats en resterende machines (0.5.345)

- 40 aanvullende Makita-basismodellen uitgebreid met officiële fabrikantinformatie: alle 36 nog lege bouwplaatsproducten, de resterende CL117-steelstofzuiger en drie zaagmachines.
- De batch omvat verlichting, lasermeetinstrumenten, dompel- en vacuümpompen, audio, een luchtpomp, band-/lintzagen en een afkort-/tafelzaag.
- Makita telt nu 797 complete basismodellen, 0 gedeeltelijke modellen en 57 modellen die nog alle drie onderdelen missen.
- Alle 797 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 760 recent verwerkte modellen.
- Producten, uitvoeringen, aanbieders, prijzen, EAN-koppelingen en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Makita reiniging, tuin en zaagmachines (0.5.344)

- 40 aanvullende Makita-basismodellen uitgebreid met officiële fabrikantinformatie: 16 reinigingsmachines, 14 tuinmachines, 2 cirkelzagen, 2 specialistische machines en 6 zaagmachines.
- Makita telt nu 757 complete basismodellen, 0 gedeeltelijke modellen en 97 modellen die nog alle drie onderdelen missen.
- Alle 757 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 720 recent verwerkte modellen.
- Catalogusproducten, uitvoeringen, prijzen, aanbieders, EAN-koppelingen en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.


### Makita reiniging batch 1 (0.5.343)

- 40 Makita-basismodellen in Reiniging uitgebreid met officiële fabrikantinformatie: compacte stofzuigers, RoboCleaners, rug-, bouw- en stof-/waterzuigers en hogedrukreinigers.
- Makita telt nu 717 complete basismodellen, 0 gedeeltelijke modellen en 137 modellen die nog alle drie onderdelen missen.
- Alle 717 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 680 recent verwerkte modellen.
- Catalogusproducten, uitvoeringen, prijzen, aanbieders, EAN-koppelingen en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Makita accu, energie en bouwplaats batch (0.5.342)

- 40 aanvullende Makita-basismodellen zijn uitgebreid: 25 accu-/laadproducten en 15 ventilatie-, verlichting- en audioproducten voor bouwplaats en mobiel gebruik.
- Makita telt nu 677 complete basismodellen, 0 gedeeltelijke modellen en 177 modellen die nog alle drie onderdelen missen.
- Alle 677 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 640 recent verwerkte modellen.
- De eerder afgeronde tuinmachinebatch en de vergrendelde desktopzijpanelen blijven ongewijzigd behouden.

### Makita tuinmachines batch 3 (0.5.341)

- Nog eens 40 eerder volledig lege Makita-tuinmachines hebben nu Productomschrijving, Bijzondere kenmerken en Technische gegevens uit officiële Makita Nederland-bronnen.
- De batch omvat tophandle-, snoei-, accu- en elektrische kettingzagen, een kantensnijder, XGT- en 230 V-heggenscharen, een stokheggenschaar en professionele bosmaaiers.
- Makita telt nu 637 complete basismodellen, 0 gedeeltelijke modellen en 217 modellen die nog alle drie onderdelen missen.
- Alle 637 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 600 recent verwerkte modellen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden, uitvoeringen en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Volledig vergrendelde zijpanelen in uitvoeringsscherm (0.5.340)

- De brede desktopwerkruimte vergrendelt nu het document zelf aan het viewport met een vaste body.
- Achtergebleven pagina-offsets van het startscherm worden bij binnenkomst in de catalogus gewist.
- Muiswielscroll in categorie-, model- en gekozen-uitvoeringsschermen blijft uitsluitend in de middelste kolom.
- De linker categorie- en rechter aanbiederskolom behouden exact hun oorspronkelijke positie.

### Vaste zijpanelen met eigen middenscroll (0.5.339)

- Vanaf het categoriescherm stopt de desktoppagina zelf volledig met scrollen.
- De linker categorie- en rechter aanbiederskolom blijven daardoor exact op hun oorspronkelijke rasterpositie staan, ook op model- en uitvoeringsschermen.
- Alleen de middelste hoofdinhoud scrolt verticaal; de topbar blijft op zijn vaste plek en kan niet meer halverwege het scherm terechtkomen.
- Bij openen van een model of uitvoering springt de middelste kolom terug naar boven. Teruggaan naar de categorie herstelt de eerdere positie in de modellenlijst.
- Startscherm, tablet en mobiel behouden hun bestaande scrollgedrag.
- Een browserregressietest controleert dat `window.scrollY` nul blijft terwijl de middelste kolom wel beweegt.

### Zijpanelen exact op oorspronkelijke positie (0.5.338)

- Vanaf het categoriescherm blijven de linker categorie- en rechter aanbiederskolom exact staan waar ze bij het openen van het scherm beginnen.
- De zijpanelen schuiven bij pagina-scroll niet meer omhoog tot tegen de topbar; de oorspronkelijke vrije ruimte onder de header blijft behouden.
- Alleen de middelste product-, model- of uitvoeringskolom beweegt door, ook op het daaropvolgende modelscherm.
- Het startscherm behoudt de bestaande gewone pagina-scroll voor de aanbiederskolom.
- Desktopregressietests meten de beginpositie en controleren die opnieuw na scrollen op categorie- én modelniveau.

### Zijpanelen vanaf de catalogus vast (0.5.337)

- Op het startscherm beweegt de aanbiederskolom met de pagina mee.
- Na het kiezen van een categorie blijven de linker categorie- en rechter aanbiederskolom onder de topbar staan.
- Alleen de lange middelste kolom scrollt dan door; dezelfde regel geldt voor model-, uitvoering- en zoekschermen.
- Desktopregressietests bewaken beide verschillende scrolltoestanden.

### Rechterkolom volgt de pagina-scroll (0.5.336)

- De aanbiederskolom staat op desktop niet langer sticky vast onder de topbar.
- Bij scrollen beweegt de kolom nu met de middelste inhoud mee omhoog en verdwijnt hij achter de vaste topbar.
- Het logo blijft netjes boven de categoriekolom uitgelijnd; tablet en mobiel blijven ongewijzigd.

### Desktopuitlijning en gelijklopende zijpanelen (0.5.335)

- Het ToolPakker-logo staat op desktop exact boven de categoriekolom.
- Zoekbalk en vergelijkingknop lijnen uit met de middelste productkolom en rechter aanbiederskolom.
- De categorie- en aanbiederskolom schuiven bij pagina-scroll door tot direct onder de vaste header, zodat de rechterkolom niet langer lager blijft hangen.
- Tablet en mobiel zijn inhoudelijk en visueel ongewijzigd.

### Aangesloten aanbieders terug zonder instructiekaart (0.5.334)

- De aanbiederskolom met de echte aangesloten aanbieders blijft weer zichtbaar voordat een uitvoering is gekozen.
- Alleen het ongewenste blok “Kies een uitvoering” met icoon en instructietekst blijft verwijderd.
- Na het kiezen van een exacte uitvoering worden de algemene aanbiederslogo’s vervangen door de bijbehorende live prijs- en voorraadkaarten.
- Catalogusdata, prijzen, EAN-koppelingen, voorraad en productinformatie zijn niet gewijzigd.

### Makita tuinmachines batch 2 (0.5.333)

- Nog eens 40 eerder volledig lege Makita-tuinmachines hebben nu Productomschrijving, Bijzondere kenmerken en Technische gegevens uit officiële Makita Nederland-bronnen.
- De batch omvat heggenscharen, stokheggenscharen, snoeischaren, trimmers, bosmaaiers, drukspuiten, verticuteermachine, combisystemen, grasmaaiers, stokkettingzagen, bladblazers en tophandle-kettingzagen.
- Makita telt nu 597 complete basismodellen, 0 gedeeltelijke modellen en 257 modellen die nog alle drie onderdelen missen.
- Alle 597 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 560 recent verwerkte modellen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Aanbieders na uitvoeringskeuze hersteld (0.5.332)

- Alleen de lege instructiekaart blijft weg voordat een uitvoering is gekozen.
- Zodra een exacte uitvoering is geselecteerd, verschijnt de aanbiederskolom weer betrouwbaar met de echte aanbieders en prijzen.
- De zichtbaarheid wordt nu uitsluitend door de actuele applicatiestatus geregeld; een blijvend HTML-`hidden`-attribuut kan de aanbieders niet meer blokkeren.
- Catalogusdata, prijzen, EAN-koppelingen en productinformatie zijn niet gewijzigd.

### Inactieve aanbiederskolom verwijderd (0.5.331)

- De lege kaart “Kies een uitvoering” is verwijderd.
- De aanbiederskolom blijft verborgen tot een exacte uitvoering is gekozen.
- De catalogus gebruikt de vrijgekomen breedte; daarna verschijnen alleen echte aanbiedersgegevens.

### Desktop browsertest boven tabletbreakpoint (0.5.330)

- De vaste desktopflow draait expliciet op 1440 × 1000 pixels.
- De quality gate bewaakt dat de desktoptests boven het 1400px-tabletbreakpoint blijven.

### Compactere hoofdtitel (0.5.329)

- De losse bovenregel “Onafhankelijke gereedschapvergelijker” is verwijderd.
- De homepagehoofdtitel is kleiner en blijft op desktop op één regel staan.
- De drie compacte startstappen blijven direct onder de titel staan.
- Tablet en mobiel houden hun veilige responsive gedrag.

### Compacte startstappen (0.5.328)

- De drie stappen op desktop en tablet staan nu direct onder de titel “ToolPakker: professioneel gereedschap vergelijken”.
- De lange toelichtingen en drie grote losse kaarten zijn vervangen door drie korte stappen: Kies categorie, Kies model & uitvoering en Vergelijk aanbieders.
- De korte waardepropositie direct onder de zoekbalk blijft ongewijzigd.
- Catalogusdata, prijzen, aanbieders en productinformatie zijn niet aangepast.

### Makita 40 tuinmachines compleet (0.5.327)

- In één grote batch zijn 40 eerder volledig lege Makita-tuinmachines voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat blaas- en zuigmachines, transporters, grondboren, grasmaaiers, stokkettingzagen, bladblazers, kettingzagen en heggenscharen.
- Alle 40 modellen hebben minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens, gekoppeld aan officiële Makita Nederland-productbladen.
- Makita telt nu 557 complete basismodellen, 0 gedeeltelijke modellen en 297 modellen die nog alle drie onderdelen missen.
- Alle 557 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 520 recent verwerkte modellen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Mobiele UX-opruiming (0.5.326)

- Eén mobiele categorienavigatie via het hamburgermenu.
- Geen dubbele startuitleg of inactieve aanbiederskolom op de mobiele homepage.
- Officiële aanbiederslogo’s zonder herhaalde tekstnaam.

### Responsive vergelijkwerkruimte (0.5.325)

- De goedgekeurde desktop-, tablet- en mobiele mock-up is vertaald naar de bestaande ToolPakker-componenten.
- De header, categorieflow, modelkaarten en aanbiederskolom zijn compacter en duidelijker geprioriteerd.
- Tablets en kleine laptops gebruiken voortaan een inklapbare categoriebediening; mobiel heeft daarnaast een echte merkselectie.
- De catalogus- en aanbiedersdata zijn niet aangepast.


### Strakkere categorietypografie (0.5.324)

- Alleen de gereedschapsnamen in de categorienavigatie zijn dunner en rustiger gemaakt.
- De kop “Categorieën” blijft vet en de actieve keuze houdt subtiel extra nadruk.
- De typografie is consistent op desktop, kleine laptops, tablets en mobiel.



### Responsive kleine laptops en tablets hersteld (0.5.323)

- De brede desktopindeling start nu pas vanaf 1401 pixels, omdat de drie vaste kolommen daaronder niet betrouwbaar binnen het scherm pasten.
- Kleine laptops en tablets in landscape tonen categorieën bovenaan en daarna een overzichtelijke product-/aanbiedersindeling met twee kolommen.
- Tablets in portretstand blijven gestapeld; mobiele schermen houden de bestaande compacte gebruikersflow.
- Het compacte woordmerk zonder slogan wordt automatisch gebruikt tot en met 1400 pixels, zodat logo, zoekbalk en vergelijkknop niet tegen elkaar drukken.
- De browser-quality-gate controleert deze responsive regels zonder een nieuw testscript of npm-commando toe te voegen.

### Nieuwe ToolPakker-huisstijl ingebouwd (0.5.322)

- Het publieke ToolPakker-woordmerk is vervangen door het nieuwe donkerblauw/turquoise logo met de gecorrigeerde slogan “DÉ PROFESSIONELE GEREEDSCHAPVERGELIJKER”.
- De desktop-, mobiele en informatiepaginaheaders gebruiken dezelfde geoptimaliseerde logo-assets zonder wijzigingen aan de bestaande navigatie of lay-out.
- Alle favicon-, app-icon- en schema.org-logoformaten zijn vervangen door het bijbehorende nieuwe TP-monogram.
- Bestaande Open Graph- en Twitter-verwijzingen blijven werken via hetzelfde stabiele logo-pad.
- Catalogusdata, prijzen, EAN-koppelingen, aanbiedingen en productinformatie zijn niet gewijzigd.

### Makita 40 frees- en specialistische machines compleet (0.5.321)

- In één grote batch zijn alle 17 nog lege freesmachines en 23 specialistische machines voorzien van alle drie vaste onderdelen.
- Alle 40 modellen hebben minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens, uitsluitend uit officiële Makita Nederland-productpagina’s of officiële productbladen.
- Makita telt nu 517 complete basismodellen, 0 gedeeltelijke modellen en 337 modellen die nog alle drie onderdelen missen.
- Alle 517 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 480 recent verwerkte modellen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Makita 40 slagmoer-, afkort- en schroefmachines compleet (0.5.320)

- In één grote batch zijn 16 slagmoer- en ratelsleutels, 18 afkort- en metaalzaagmachines en 6 schroef- en bandschroefmachines voorzien van alle drie vaste onderdelen.
- Alle 40 modellen hebben minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens, uitsluitend uit officiële Makita Nederland-productpagina’s of officiële productbladen.
- Makita telt nu 477 complete basismodellen, 0 gedeeltelijke modellen en 377 modellen die nog alle drie onderdelen missen.
- Alle 477 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 440 recent verwerkte modellen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Makita 40 bevestigings-, zaag-, multitool- en polijstmachines compleet (0.5.319)

- In één grote batch zijn 16 spijker- en nietmachines, 10 reciprozagen, 4 multitools, 4 decoupeerzagen en 6 polijstmachines voorzien van alle drie vaste onderdelen.
- Alle 40 modellen hebben minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens, uitsluitend uit officiële Makita Nederland-productpagina’s of officiële productbladen.
- Makita telt nu 437 complete basismodellen, 0 gedeeltelijke modellen en 417 modellen die nog alle drie onderdelen missen.
- Alle 437 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 400 recent verwerkte modellen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Makita 40 haakse, rechte en doorslijpers compleet (0.5.318)

- In één grote batch zijn 40 haakse, rechte en compacte doorslijpers voorzien van alle drie vaste onderdelen.
- Alle 40 modellen hebben minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens, uitsluitend uit officiële Makita Nederland-productpagina’s of officiële productbladen.
- Makita telt nu 397 complete basismodellen, 0 gedeeltelijke modellen en 457 modellen die nog alle drie onderdelen missen.
- Alle 397 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 360 recent verwerkte modellen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Makita 40 boor-, schroef- en slagmachines compleet (0.5.317)

- In één grote batch zijn 25 boor- en klopboormachines, 10 slagschroevendraaiers en 5 slagmoersleutels voorzien van alle drie vaste onderdelen.
- Alle 40 modellen hebben minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens, uitsluitend uit officiële Makita Nederland-productpagina’s of officiële productbladen.
- Makita telt nu 357 complete basismodellen, 0 gedeeltelijke modellen en 497 modellen die nog alle drie onderdelen missen.
- Alle 357 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 320 recent verwerkte modellen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Makita 40 cirkel-, inval- en decoupeerzagen compleet (0.5.316)

- In één grote batch zijn 32 cirkel-, metaalcirkel- en invalcirkelzagen plus 8 decoupeerzagen voorzien van alle drie vaste onderdelen.
- Alle 40 modellen hebben minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens, uitsluitend uit officiële Makita Nederland-productpagina’s.
- Makita telt nu 317 complete basismodellen, 0 gedeeltelijke modellen en 537 modellen die nog alle drie onderdelen missen.
- Alle 317 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 280 recent verwerkte modellen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

### Makita 40 schuur-, schaaf- en zaagmachines compleet (0.5.315)

- In één grote batch zijn 29 schuurmachines, 10 schaafmachines en de tafelzaag 2704 voorzien van alle drie vaste onderdelen.
- Alle 40 modellen hebben minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens, uitsluitend uit officiële Makita Nederland-productpagina’s.
- Makita telt nu 277 complete basismodellen, 0 gedeeltelijke modellen en 577 modellen die nog alle drie onderdelen missen.
- Alle 277 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de geconsolideerde quality gate bewaakt nu 240 recent verwerkte modellen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.


### Makita 40 nieuwe basismodellen compleet (0.5.314)

- In één grote batch zijn 36 boor-, combi-, breekhamers en schrapers plus vier haakse boormachines voorzien van alle drie vaste onderdelen.
- Alle 40 modellen hebben minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens, uitsluitend uit officiële Makita Nederland-productpagina’s.
- Makita telt nu 237 complete basismodellen, 0 gedeeltelijke modellen en 617 modellen die nog alle drie onderdelen missen.
- Alle 237 complete Makita-modellen voldoen aan de uitgebreide inhoudsnorm; de bestaande geconsolideerde quality gate bewaakt nu 200 recent verwerkte modellen.


### Makita resterende complete modellen verdiept (0.5.313)

- De laatste 38 Makita-basismodellen die alle drie vaste onderdelen al hadden maar nog niet aan de uitgebreide norm voldeden, zijn in één batch afgerond.
- De batch omvat accu’s en laders, zaag- en schuurmachines, bouwplaatsverlichting en radio’s, schroef- en slagschroefmachines, slagmoersleutels en specialistische machines.
- Alle 197 reeds gevulde Makita-basismodellen hebben nu minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens.
- Alle drie secties blijven uitsluitend gekoppeld aan officiële Makita Nederland-productpagina’s; uitvoeringsspecifieke accu-, lader-, koffer- en setinhoud blijft apart.
- De geconsolideerde quality gate bewaakt 160 recent uitgebreide Makita-modellen en controleert dat alle 197 complete modellen de uitgebreide norm blijven halen.



### Makita boor-, combi- en breekhamers verdiept (0.5.312)

- De 9 reeds complete maar nog te korte Makita-basismodellen in de categorie Boorhamers zijn inhoudelijk uitgebreid tot minimaal 250 tekens productomschrijving.
- De batch omvat DHR202, DHR242, DHR243, HR005G, HR007G, HR012G, HR5212, M8600 en M8700.
- Alle negen modellen behouden minimaal vier bijzondere kenmerken en minimaal vijf technische gegevens, uitsluitend op basis van officiële Makita Nederland-productpagina’s.
- Makita blijft 197 complete basismodellen en 0 gedeeltelijke modellen tellen; 159 modellen voldoen nu aan de uitgebreide inhoudsnorm.
- De bestaande geconsolideerde quality gate bewaakt voortaan 122 recent uitgebreide Makita-modellen, zonder extra scripts of hulpbestanden in de projectroot.


### Makita haakse en rechte slijpers verdiept (0.5.311)

- De 9 reeds complete maar nog te korte Makita-basismodellen in de categorie Haakse slijpers zijn inhoudelijk uitgebreid tot minimaal 250 tekens productomschrijving.
- De batch omvat DGA511, DGD800, GA029G, GA038G, GA055G, GA5030, GA9020, GD0810 en M9503.
- GA9020 heeft nu eveneens minimaal vier officieel onderbouwde bijzondere kenmerken; bij alle negen blijven minimaal vijf technische regels aanwezig.
- Makita blijft 197 complete basismodellen en 0 gedeeltelijke modellen tellen; 150 modellen voldoen nu aan de uitgebreide inhoudsnorm.
- De bestaande geconsolideerde quality gate bewaakt voortaan 113 recent uitgebreide Makita-modellen, zonder extra scripts of hulpbestanden in de projectroot.


### Makita reinigingsmachines verdiept (0.5.310)

- De 13 reeds complete Makita-modellen in de categorie Reiniging zijn inhoudelijk uitgebreid tot minimaal 250 tekens productomschrijving.
- CL070, CL072 en CL183 hebben nu eveneens minimaal vier bijzondere kenmerken op basis van officiële Makita Nederland-informatie.
- Makita blijft 197 complete basismodellen en 0 gedeeltelijke modellen tellen; 141 modellen voldoen nu aan de uitgebreide inhoudsnorm.
- De bestaande geconsolideerde quality gate bewaakt voortaan 104 recent uitgebreide Makita-modellen, zonder extra scripts of hulpbestanden in de projectroot.


### Makita tuinmachines verdiept (0.5.309)

- De 16 reeds complete Makita-modellen in de categorie Tuinmachines zijn inhoudelijk uitgebreid tot minimaal 250 tekens productomschrijving.
- DLM330, UB101 en UH023G hebben nu eveneens minimaal vier bijzondere kenmerken op basis van officiële Makita Nederland-informatie.
- Makita blijft 197 complete basismodellen en 0 gedeeltelijke modellen tellen; 128 modellen voldoen nu aan de uitgebreide inhoudsnorm.
- De bestaande geconsolideerde quality gate bewaakt voortaan 91 recent uitgebreide Makita-modellen, zonder extra scripts of hulpbestanden in de projectroot.

### Makita boor- en klopboormachines verdiept (0.5.308)

- De 21 reeds complete Makita-modellen in de categorie Accuboormachines zijn inhoudelijk uitgebreid tot minimaal 250 tekens productomschrijving.
- Bestaande officiële kenmerken en technische gegevens zijn behouden; de omschrijvingen zijn aangescherpt met uitsluitend gegevens van de gekoppelde Makita Nederland-productpagina’s.
- Makita blijft 197 complete basismodellen en 0 gedeeltelijke modellen tellen; 112 modellen voldoen nu aan de uitgebreide inhoudsnorm.
- De bestaande geconsolideerde quality gate bewaakt voortaan 75 recent uitgebreide Makita-modellen, zonder extra scripts of hulpbestanden in de projectroot.

### Kwaliteitscontrole-herstel (0.5.307)

- De twee release-specifieke Makita-testbestanden zijn uit de actieve scriptsmap verwijderd.
- Hun controles zijn geconsolideerd in de bestaande canonieke bronkwaliteitstest, zodat de 54 verbeterde Makita-modellen volledig bewaakt blijven.
- De projectstructuur voldoet weer aan beide vaste grenzen: 65 npm-commando’s en 70 actieve `.mjs`-scripts.
- De inhoudelijke Makita-resultaten van v0.5.304 en v0.5.305 zijn ongewijzigd.

## Snel starten

Vereisten: Node.js 22 en npm 10.

```bash
npm ci
npm run check
npm run build
npm run serve:test
```

Open daarna `http://127.0.0.1:4173`.

## Belangrijkste commando's

```bash
npm run check              # verplichte lokale kwaliteitscontrole
npm run check:release      # kwaliteitscontrole plus kritieke browsertests
npm run automation:sync    # feeds synchroniseren; vereist lokale env-variabelen
node scripts/automation/verify-missing-offer-pages.mjs  # veilige automatische productpaginaverificatie
node scripts/automation/verify-missing-offer-pages.mjs --read-only # compacte feedstatus en actiepunten genereren
npm run check:automation   # controle na een feedupdate
npm run review:serve       # lokale reviewinterface
npm run release:bundle     # release-manifest en SHA-256-controlesommen
```

## Mappen

- `data/` — canonieke catalogus, bronregistraties en gepubliceerde aanbiedingen
- `js/` en `css/` — websitebroncode
- `scripts/` — actieve build-, validatie-, feed- en onderhoudsscripts
- `tests/` — Playwright-gebruikersflows
- `docs/` — architectuur, beheer, deployment en overdracht
- `archive/` — historische audits, patches en back-ups; niet actief in de build
- `public/` — gegenereerde Vercel-output; niet committen of handmatig aanpassen

## Publicatieregels

Nieuwe producten worden nooit automatisch live gezet. Bestaande aanbiedingen mogen alleen automatisch wijzigen bij een exacte EAN- én volledige uitvoeringscodematch. Herhaald ontbrekende aanbiedingen worden op hun exacte ToolMax- of Mastertools-productpagina gecontroleerd. Een veilige exacte match kan de aanbieding zeven dagen live bevestigen en een betrouwbare prijs of bekende voorraadstatus begrensd bijwerken. Verdachte prijzen, mogelijke vervallen pagina’s, blokkades en identiteitsverschillen blijven handmatig te beoordelen. Aanbiedingen worden nooit automatisch verwijderd of gedeactiveerd. Setinhoud, accuaantallen, laadmodellen en koffers worden nooit uit een titel afgeleid. De workflow maakt bij echte actiepunten één bijgewerkte GitHub Issue en sluit die automatisch zodra de feedcontrole weer gezond is; het volledige artifact is alleen nodig voor detailonderzoek.

## Documentatie

Begin bij:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/DATA_PIPELINE.md`](docs/DATA_PIPELINE.md)
- [`docs/AFFILIATE_PARTNERS.md`](docs/AFFILIATE_PARTNERS.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- [`docs/HANDOVER.md`](docs/HANDOVER.md)
- [`docs/RELEASE_MANAGEMENT.md`](docs/RELEASE_MANAGEMENT.md)
- [`docs/handover/README.md`](docs/handover/README.md)
- [`SECURITY.md`](SECURITY.md)

ToolPakker is propriëtaire software. Zie [`LICENSE.md`](LICENSE.md).


### Makita-inhoudsstatus (0.5.305)

De audit op de drie vaste basismodelonderdelen is verder afgerond:

- De laatste **16 gedeeltelijke Makita-basismodellen** hebben nu Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Daardoor zijn er **197 complete**, **0 gedeeltelijke** en **657 volledig lege** Makita-basismodellen binnen de auditpopulatie van 854 modellen.
- **91 Makita-basismodellen** voldoen nu aan de uitgebreide norm van minimaal 250 tekens, vier kenmerken en vijf technische regels.
- Alle 16 modellen in deze batch gebruiken officiële Makita Nederland-productpagina’s als fabrikantbron.
- De batch bevat uitsluitend basismodelinformatie; prijzen, EAN’s, aanbieders en exacte setinhoud zijn niet aangepast.
- Regressiedekking: onderdeel van `npm run test:product-information-sources` en daarmee van `npm run check`.


### DeWalt-inhoudsstatus (0.5.303)

De DeWalt-catalogus is productmatig én inhoudelijk afgerond. De inhoudsaudit loopt over alle 414 DeWalt-basismodellen en 644 exacte uitvoeringen:

- **Alle 414 basismodellen** hebben Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- **Alle 414 basismodellen** voldoen aan de uitgebreide inhoudsnorm: minimaal 250 tekens omschrijving, vier kenmerken en vijf technische regels.
- De laatste 28 modellen omvatten de resterende combisets, DCS525, DCB182PAK, DXAM2250 en DXF2067. Officiële DeWalt-productpagina’s en officiële DeWalt-documentatie zijn gebruikt; exacte pakket- en machinecombinaties zijn daarnaast op EAN en volledige fabrikantcode tegen de bestaande ToolMax- of Mastertools-uitvoering gecontroleerd.
- Setinhoud, accuaantallen, laadmodel en koffer blijven uitsluitend op uitvoeringsniveau gekoppeld. Ze worden niet uit de basismodelcode afgeleid.
- De generieke blokken **“Wat betekent modelcode …?”** blijven uit de publieke renderer en styling verwijderd.
- Er staan geen DeWalt-basismodellen meer open in de inhoudsaudit.

De definitieve voortgang staat in `data/review/dewalt-content-audit-v0_5_303.json`.



### Makita-inhoudsstatus (0.5.304)

De eerste Makita-herstelbatch rondt alle 38 gedeeltelijke accu’s, laders en startsets af. Deze modellen hebben nu Productomschrijving, Bijzondere kenmerken en Technische gegevens en voldoen elk aan minimaal 250 tekens, vier kenmerken en vijf technische regels. De Makita-audit staat daardoor op 181 complete basismodellen, 16 gedeeltelijke modellen en 657 volledig lege modellen; 75 modellen voldoen nu aan de uitgebreide inhoudsnorm.
