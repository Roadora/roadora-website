## 0.5.352 — Bosch Professional + Mastertools batch 2 (2026-08-03)

- 40 aanvullende Bosch Professional-producten van Mastertools handmatig gekoppeld op exacte EAN, volledige Bosch-artikelcode en gecontroleerde Leveringsomvang.
- 9 nieuwe basismodellen en 37 nieuwe uitvoeringen toegevoegd; 3 bestaande uitvoeringen zijn aangevuld met een tweede gecontroleerde Mastertools-aanbieding.
- 40 nieuwe live aanbiedingen toegevoegd voor GSR/GSB, GDR/GDX, GDS en GBH-machinefamilies.
- 14 Bosch-basismodellen zijn voorzien van alle drie vaste informatieonderdelen uit officiële Bosch Professional-bronnen; GSR 18V-65 bleef op zijn reeds complete broninformatie staan.
- De bestaande afgekorte catalogustitels van GSR 18V-65, GDR 18V-200, GBH 18V-24 C en GDX 18V-200 zijn genormaliseerd naar volledige modelnamen.
- De uitvoeringen 06019K4001 en 0611927101 zijn wegens interne bronconflicten niet gepubliceerd; combiset 0615A5007K blijft uitgesteld voor een aparte setaudit.
- Catalogus groeit naar 1.423 basismodellen, 2.103 uitvoeringen en 2.314 live aanbiedingen.
- Versie verhoogd naar 0.5.352.

## 0.5.351 — Zelfmeldende feedbewaking en provider-noodrem (2026-08-03)

- Nieuwe feedgezondheidscontrole classificeert iedere run als gezond, aandacht nodig of kritiek en groepeert ontbrekende aanbiedingen per aanbieder en merk.
- De workflow maakt of actualiseert bij echte actiepunten één GitHub Issue en sluit die automatisch wanneer de controle weer gezond is; dagelijkse artifactcontrole is niet meer nodig.
- Mastertools krijgt voorrang bij automatische productpaginaverificatie, zodat alle open Mastertools-kandidaten eerst binnen de runlimiet worden gecontroleerd.
- Na drie 403/429/anti-botblokkades per aanbieder opent een circuit breaker en worden resterende verzoeken voor die aanbieder veilig overgeslagen.
- Ongeldige aanbieder-URL’s zijn voortaan een kritieke quality-gatefout; de foutieve DJV186WVE-URL is hersteld naar de exacte ToolMax-productpagina.
- Nieuwe regressietests bewaken providerprioriteit, circuit-breakerregistratie, compacte gezondheidsmeldingen en geldige ToolMax-/Mastertools-product-URL’s.
- Aanbiedingen worden nog steeds nooit automatisch verwijderd of gedeactiveerd; nieuwe productkandidaten blijven uitsluitend informatief.
- Versie verhoogd naar 0.5.351.

## 0.5.350 — Catalogus-synchronisatieherstel Bosch Professional (2026-08-03)

- De complete afhankelijke dataset van Bosch Professional batch 1 opnieuw gebundeld om een gedeeltelijke of gemengde v0.5.348/v0.5.349-installatie te herstellen.
- Productgroepen, uitvoeringen, bronaanbiedingen, gepubliceerde aanbiedingen, reviewregistraties, productinformatie en officiële bronregistratie zijn als één consistente staat opgenomen.
- De catalogusconsolidatietest logt voortaan de exacte harde foutrecords vóór de assertion, zodat een toekomstige GitHub Actions-fout direct te herleiden is.
- Lokaal gevalideerd: 1.414 productgroepen, 2.066 uitvoeringen en 0 harde structurele fouten; Bosch-gate groen met 40 Mastertools-producten en 27 titelcorrecties.
- Prijzen, setinhoud en catalogusaantallen zijn inhoudelijk niet gewijzigd.
- Versie verhoogd naar 0.5.350.

## 0.5.349 — Bosch Professional batch 1 inhoudelijk compleet (2026-08-02)

- Vier Bosch Professional-basismodellen uit de eerste Mastertools-batch zijn aangevuld met alle drie vaste informatieonderdelen: productomschrijving, bijzondere kenmerken en technische gegevens.
- GSR 12V-15 FC, GDS 18V-1050 H, GKS 18V-57-2 en GOP 18V-34 gebruiken per onderdeel uitsluitend hun officiële Bosch Professional-productpagina.
- Elke machine heeft een uitgebreide omschrijving, minimaal zes kenmerken en minimaal zeven technische regels; setinhoud blijft strikt per exacte uitvoering gekoppeld.
- Nieuwe regressietest bewaakt de officiële bron-URL’s, sectiecompleetheid en kenmerkende technische waarden van deze vier modellen.
- Basismodellen, uitvoeringen, prijzen, EAN-koppelingen en 2.274 live aanbiedingen zijn niet gewijzigd.
- Versie verhoogd naar 0.5.349.

## 0.5.348 — Bosch Professional + Mastertools batch 1 en volledige modeltitels (2026-08-02)

- 40 Bosch Professional-producten van Mastertools handmatig gekoppeld op exacte EAN, volledige Bosch-artikelcode en de Leveringsomvang van de exacte productpagina.
- 29 nieuwe uitvoeringen toegevoegd en 11 bestaande uitvoeringen uitgebreid met een tweede live aanbieder; totaal 40 nieuwe Mastertools-aanbiedingen.
- De GSR 12V-15 FC is als eigen FlexiClick-basismodel toegevoegd in plaats van onjuist samen te voegen met de vaste GSR 12V-15.
- Zes bronconflicten zijn bewust niet gepubliceerd en blijven in de reviewwachtrij.
- 27 afgekapt opgeslagen Bosch-modeltitels hersteld naar volledige modelcodes; modeltitels mogen nu visueel doorlopen in plaats van afgekapt te worden.
- Nieuwe regressietest bewaakt titel-integriteit, exacte batchidentiteit, Leveringsomvang en het verwijderen van gepubliceerde producten uit de reviewwachtrij.
- Catalogus groeit naar 1.414 basismodellen, 2.066 uitvoeringen en 2.274 live aanbiedingen.
- Versie verhoogd naar 0.5.348.

## 0.5.345 — Makita bouwplaats en resterende machines: 40 modellen (2026-08-02)

- 40 eerder volledig lege Makita-basismodellen voorzien van een uitgebreide omschrijving, minimaal vier kenmerken en minimaal vijf technische regels.
- De batch rondt alle 36 nog lege bouwplaatsproducten af en voegt de resterende CL117-steelstofzuiger, de DPB182-bandzaag, LB1200-lintzaag en LF1000-afkort-/tafelzaag toe.
- Alle drie inhoudsonderdelen zijn per model gekoppeld aan een officiële Makita Nederland-productpagina of een officieel Makita-productblad.
- Makita stijgt van 757 naar 797 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 97 naar 57. Alle 797 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde Makita-regressieset groeit van 720 naar 760 modellen. Producten, uitvoeringen, prijzen, aanbiedingen, EAN-koppelingen en setinhoud in de aanbiederslaag zijn niet gewijzigd.
- Versie verhoogd naar 0.5.345.

## 0.5.344 — Makita reiniging, tuin en zaagmachines: 40 modellen (2026-08-02)

- 40 eerder volledig lege Makita-basismodellen voorzien van een uitgebreide omschrijving, minimaal vier kenmerken en minimaal vijf technische regels.
- De batch omvat 16 resterende reinigingsmachines, 14 resterende tuinmachines, 2 cirkelzagen, 2 specialistische machines en 6 zaagmachines.
- Alle drie inhoudsonderdelen zijn per model gekoppeld aan een officiële Makita Nederland-productpagina of een officieel Makita-productblad.
- Makita stijgt van 717 naar 757 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 137 naar 97. Alle 757 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde Makita-regressieset groeit van 680 naar 720 modellen. Producten, uitvoeringen, prijzen, aanbiedingen, EAN-koppelingen en setinhoud in de aanbiederslaag zijn niet gewijzigd.
- Versie verhoogd naar 0.5.344.

## 0.5.343 — Makita reiniging: 40 modellen, batch 1 (2026-08-02)

- 40 eerder volledig lege Makita-basismodellen in de categorie Reiniging voorzien van een uitgebreide omschrijving, minimaal vier kenmerken en minimaal vijf technische regels.
- De batch omvat auto- en steelstofzuigers, RoboCleaners, rugstofzuigers, professionele droog- en stof-/waterzuigers en accu- en 230 V-hogedrukreinigers.
- Alle drie inhoudsonderdelen zijn per model gekoppeld aan een officiële Makita Nederland-productpagina of een officieel Makita-productblad.
- Makita stijgt van 677 naar 717 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 177 naar 137. Alle 717 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde Makita-regressieset groeit van 640 naar 680 modellen. Producten, uitvoeringen, prijzen, aanbiedingen, EAN-koppelingen en setinhoud in de aanbiederslaag zijn niet gewijzigd.
- Versie verhoogd naar 0.5.343.

## 0.5.342 — Makita accu, energie en bouwplaats: 40 modellen (2026-08-01)

- 40 Makita-basismodellen kregen een uitgebreide fabrikantgebaseerde omschrijving, minimaal vier kenmerken en minimaal vijf technische regels.
- De batch omvat 25 accu-/laadproducten en 15 ventilatoren, lampen, luchtpomp-, radio- en speakerproducten.
- Makita stijgt van 637 naar 677 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 217 naar 177. Alle 677 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde Makita-regressieset groeit van 600 naar 640 modellen. Producten, uitvoeringen, prijzen, aanbiedingen, EAN-koppelingen en setinhoud in de aanbiederslaag zijn niet gewijzigd.
- Versie verhoogd naar 0.5.342.

## 0.5.341 — Makita 40 tuinmachines, batch 3 (2026-07-31)

- In één grote batch 40 eerder volledig lege Makita-basismodellen in de categorie Tuinmachines voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat tophandle-, snoei-, accu- en elektrische kettingzagen, een kantensnijder, XGT- en 230 V-heggenscharen, een stokheggenschaar en professionele bosmaaiers.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officiële Makita Nederland-productpagina als bron.
- Makita stijgt van 597 naar 637 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 257 naar 217. Alle 637 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 560 naar 600 modellen zonder een nieuw los testsysteem toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden, uitvoeringen en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.340 — Uitvoeringsscherm zijpanelen volledig vergrendeld (2026-07-31)

- Vergrendelt de brede desktopwerkruimte fysiek aan het viewport met een vaste body, zodat de documentpagina niet meer kan meescrollen.
- Wist een eventuele resterende pagina-offset zodra de gebruiker vanaf het startscherm de catalogus opent.
- Begrensd scrollketens in de drie panelen; muiswielscroll boven de middelste kolom beweegt uitsluitend de middelste inhoud.
- Breidt de browserregressietest uit met echte wheel-input en controle op categorie-, model- én gekozen-uitvoeringsniveau.
- Startscherm, tablet en mobiel blijven ongewijzigd.
- Geen wijzigingen aan catalogusdata, prijzen, aanbieders, EAN-koppelingen of productinformatie.

## 0.5.339 — Vaste zijpanelen met eigen middenscroll (2026-07-31)

- Maakt de brede desktopcatalogus vanaf het categoriescherm een vaste viewportwerkruimte in plaats van een scrollende documentpagina.
- De linker categorie- en rechter aanbiederskolom blijven exact op hun oorspronkelijke positie staan op categorie-, model-, uitvoering- en zoekschermen.
- Alleen de middelste hoofdinhoud heeft verticale scroll; de topbar en beide zijpanelen bewegen niet meer mee.
- Past het opslaan, terugzetten en naar boven springen van de lijstpositie aan op de nieuwe middelste scrollcontainer.
- Breidt de browserregressietest uit met controle op nul documentscroll, beweging van de middeninhoud en onveranderde zijpaneelposities.
- Startscherm, tablet en mobiel blijven ongewijzigd.
- Geen wijzigingen aan catalogusdata, prijzen, aanbieders, EAN-koppelingen of productinformatie.

## 0.5.338 — Zijpanelen vergrendeld op oorspronkelijke positie (2026-07-31)

- Vanaf een gekozen categorie blijven de linker en rechter zijpanelen exact op hun oorspronkelijke verticale positie staan.
- De panelen schuiven bij scrollen niet meer omhoog tot tegen de vaste topbar; de oorspronkelijke tussenruimte onder de header blijft behouden.
- Alleen de middelste productkolom beweegt door, zowel op het categoriescherm als op het daaropvolgende model- en uitvoeringsscherm.
- Het startscherm behoudt de gewone pagina-scroll voor de aanbiederskolom.
- De desktopbrowsertest meet de beginpositie van beide zijpanelen en bewaakt die opnieuw na scrollen op categorie- en modelniveau.
- Geen wijzigingen aan catalogusdata, prijzen, aanbieders, EAN-koppelingen of productinformatie.

## 0.5.337 — Aanbiederskolom alleen vanaf catalogus sticky (2026-07-31)

- Op het eerste startscherm blijft de aanbiederskolom gewoon met de pagina meescrollen, zoals in v0.5.336.
- Vanaf een gekozen categorie blijft de rechter aanbiederskolom onder de vaste topbar staan, net als de linker categoriekolom.
- Bij lange modellenlijsten beweegt daardoor alleen de middelste productkolom door; model-, uitvoering-, zoek- en aanbiederschermen gebruiken dezelfde werkruimtestatus.
- Een desktopbrowsertest bewaakt zowel het statische startscherm als het sticky gedrag vanaf het tweede scherm.
- Geen wijzigingen aan catalogusdata, prijzen, aanbieders, EAN-koppelingen of productinformatie.

## 0.5.336 — Aanbiederskolom volgt de pagina-scroll (2026-07-30)

- De rechter aanbiederskolom is op desktop niet langer sticky onder de vaste topbar.
- De kolom beweegt nu samen met de middelste inhoud omhoog en schuift achter de topbar door, zoals bedoeld.
- Het ToolPakker-logo blijft exact boven de categoriekolom staan.
- Tablet en mobiel behouden hun bestaande document-flow.
- Geen wijzigingen aan catalogusdata, prijzen, aanbieders, EAN-koppelingen of productinformatie.

## 0.5.335 — Logo boven categorieën en gelijklopende zijpanelen (2026-07-30)

- Lijnt het ToolPakker-logo op desktop exact uit boven de categoriekolom.
- De zoekbalk en vergelijkingknop volgen nu dezelfde kolombreedtes en tussenruimtes als de werkruimte eronder.
- De linker- en rechterzijpanelen scrollen bij het bereiken van de vaste header door tot dezelfde bovenrand, zonder de eerdere extra ruimte boven de aanbiederskolom.
- Tablet en mobiel behouden hun bestaande compacte header- en kolomindeling.
- Geen wijzigingen aan catalogusdata, prijzen, aanbieders, EAN-koppelingen of productinformatie.

## 0.5.334 — Aangesloten aanbieders terug zonder instructiekaart (2026-07-30)

- Herstelt de aanbiederskolom exact volgens de oorspronkelijke wens: de echte aangesloten aanbieders blijven zichtbaar, terwijl alleen de kaart “Kies een uitvoering” is verwijderd.
- Voor een uitvoeringskeuze toont de kolom de aangesloten aanbieders en de vaste vergelijkingswaarborgen.
- Na een uitvoeringskeuze toont dezelfde kolom de echte live aanbiedingen, totaalprijzen, voorraad en affiliateknoppen voor die uitvoering.
- De oude CSS-status die de volledige aanbiederskolom verborg is verwijderd.
- Geen wijzigingen aan catalogusdata, prijzen, EAN-koppelingen, voorraad, setinhoud of productinformatie.

## 0.5.333 — Makita 40 tuinmachines, batch 2 (2026-07-30)

- In één grote batch 40 eerder volledig lege Makita-basismodellen in de categorie Tuinmachines voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat heggenscharen, stokheggenscharen, grasschaar, snoeischaren, trimmers, bosmaaiers, drukspuiten, verticuteermachine, combisystemen, grasmaaiers, stokkettingzagen, bladblazers en tophandle-kettingzagen.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officiële Makita Nederland-productpagina of een officieel productblad als bron.
- Makita stijgt van 557 naar 597 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 297 naar 257. Alle 597 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 520 naar 560 modellen zonder nieuwe scripts, npm-commando’s of losse hulpbestanden toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.332 — Aanbieders na uitvoeringskeuze hersteld (2026-07-30)

- Herstelt een regressie waarbij de volledige aanbiederskolom verborgen kon blijven nadat een uitvoering was gekozen.
- Alleen de ongewenste lege kaart “Kies een uitvoering” blijft verwijderd.
- De aanbiederskolom verschijnt nu weer zodra een exacte uitvoering geselecteerd is, met echte aanbieder-, prijs- en voorraadgegevens.
- Geen wijzigingen aan catalogusdata, prijzen, EAN-koppelingen of productinformatie.

## 0.5.331 — Inactieve aanbiederskolom verwijderd (2026-07-29)

- De lege kaart “Kies een uitvoering” met icoon en instructietekst is volledig verwijderd.
- De volledige aanbiederskolom blijft verborgen zolang nog geen exacte uitvoering is gekozen.
- De model- en uitvoeringsweergave gebruikt de vrijgekomen breedte; zodra een uitvoering wordt gekozen verschijnt de aanbiederskolom automatisch met echte aanbiedersinformatie.
- Dezelfde werking geldt voor desktop, kleine laptops, tablets en mobiel.
- Geen wijzigingen aan catalogusdata, prijzen, aanbieders, EAN-koppelingen of productinformatie.

## 0.5.330 — Desktop browsertest boven tabletbreakpoint (2026-07-29)

- De desktop Playwright-suite gebruikt expliciet 1440 × 1000 pixels en draait daardoor boven het bewuste tabletbreakpoint van 1400 pixels.
- De browser-quality-gate bewaakt deze vaste desktopviewport om dezelfde regressie te voorkomen.
- Geen wijzigingen aan catalogusdata, prijzen, aanbieders of productinformatie.

## 0.5.329 — Compactere hoofdtitel zonder bovenregel (2026-07-29)

- De losse tekst “Onafhankelijke gereedschapvergelijker” boven de homepagehoofdtitel is verwijderd.
- “ToolPakker: professioneel gereedschap vergelijken” is duidelijk kleiner gemaakt en blijft op desktop netjes op één regel staan.
- Tablet behoudt een veilige meeregelige fallback; de mobiele startweergave blijft compact en ongewijzigd.
- De drie korte startstappen blijven direct onder de hoofdtitel staan.
- Geen wijzigingen aan catalogusdata, prijzen, aanbieders of productinformatie.

## 0.5.328 — Compacte startstappen onder de hoofdtitel (2026-07-29)

- De drie stappen van de ToolPakker-flow zijn direct onder de hoofdtitel geplaatst.
- De uitgebreide toelichtingen en losse kaartindeling zijn vervangen door drie korte stappen: Kies categorie, Kies model & uitvoering en Vergelijk aanbieders.
- De korte waardepropositie onder de zoekbalk blijft behouden.
- Geen wijzigingen aan catalogusdata, prijzen, EAN-koppelingen, aanbieders of productinformatie.

## 0.5.327 — Makita 40 tuinmachines (2026-07-29)

- In één grote batch 40 eerder volledig lege Makita-basismodellen in de categorie Tuinmachines voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat compacte blaas- en zuigmachines, accu-transporters, grondboren, grasmaaiers, stokkettingzagen, bladblazers, kettingzagen en heggenscharen.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officieel Makita Nederland-productblad als bron.
- Makita stijgt van 517 naar 557 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 337 naar 297. Alle 557 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 480 naar 520 modellen zonder nieuwe scripts, npm-commando’s of losse hulpbestanden toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.326 — Mobiele navigatie en aanbiederslogo’s opgeschoond (2026-07-28)

- Mobiel gebruikt voortaan uitsluitend het hamburgermenu voor de categoriekeuze; de dubbele balk “Categorieën” is verwijderd.
- De korte waardepropositie direct onder de zoekbalk blijft zichtbaar. De tweede grote hero, de drie uitlegkaarten en de inactieve aanbiederskolom zijn op de mobiele startweergave verborgen.
- Het hamburgermenu kan opnieuw worden gesloten, verandert visueel in een sluitkruis en sluit ook met Escape.
- Aangesloten aanbieders tonen alleen hun officiële woordmerk; de dubbele aanbiedernaam naast het logo is verwijderd en de logo-afmetingen zijn genormaliseerd.
- Desktop en tablet behouden de bestaande vergelijkwerkruimte. Catalogusdata, prijzen, EAN-koppelingen en productinformatie zijn niet gewijzigd.

## 0.5.325 — Responsive vergelijkwerkruimte (2026-07-28)

- De homepage en categorieflow zijn opnieuw ingedeeld volgens de goedgekeurde desktop-, tablet- en mobiele mock-up.
- Desktop gebruikt een compactere header en een rustige drie-kolomswerkruimte voor categorieën, modellen en aanbieders.
- Tablets en kleine laptops gebruiken een inklapbare categoriekeuze met een gestapelde of tweekolomsindeling, afhankelijk van de beschikbare breedte.
- Mobiel heeft een compacte menuknop, zoekbalk, categorie-uitklapper, merkselectie en beter scanbare modelkaarten.
- De grote uitlegkaarten zijn vervangen door een compacte startuitleg; de aanbiederskolom toont nu een contextuele lege staat en drie vertrouwensteksten.
- Catalogusdata, prijzen, EAN-koppelingen, aanbieders en productinformatie zijn niet gewijzigd.

## 0.5.324 — Strakkere categorietypografie (2026-07-28)

- De namen van de gereedschapscategorieën gebruiken een rustiger, dunner lettergewicht met strakkere letterspatiëring.
- De actieve categorie blijft iets zwaarder voor duidelijke oriëntatie, zonder terug te vallen op de eerdere zware typografie.
- De kop “Categorieën” en de statuslabels blijven ongewijzigd en behouden hun bestaande nadruk.
- De aanpassing werkt gelijk op desktop, kleine laptops, tablets en het mobiele categoriemenu.
- Catalogusdata, prijzen, EAN-koppelingen, aanbieders en productinformatie zijn niet gewijzigd.

## 0.5.323 — Responsive kleine laptops en tablets (2026-07-28)

- De desktopwerkruimte wordt pas vanaf 1401 pixels gebruikt; daardoor kan de vaste drie-kolomsindeling niet meer buiten beeld lopen op kleine laptops.
- Schermen van 1025 tot en met 1400 pixels gebruiken een gebalanceerde tweekolomsindeling met categorieën bovenaan, producten links en aanbieders rechts.
- Tablets in portretstand behouden de rustige gestapelde indeling; mobiel blijft ongewijzigd.
- Op schermen tot 1400 pixels wordt het compacte ToolPakker-woordmerk zonder de kleine slogan gebruikt, zodat de header niet wordt samengedrukt.
- De bestaande browser-quality-gate bewaakt voortaan het veilige breakpoint, het compacte woordmerk en de tweekolomsindeling.
- Catalogusdata, prijzen, EAN-koppelingen, aanbieders en productinformatie zijn niet gewijzigd.

## 0.5.322 — Nieuwe ToolPakker-huisstijl (2026-07-28)

- Het nieuwe ToolPakker-logo met donkerblauw/turquoise woordmerk en de gecorrigeerde slogan “DÉ PROFESSIONELE GEREEDSCHAPVERGELIJKER” is ingebouwd.
- De hoofdheader, informatiepagina’s en bestaande sociale deelverwijzingen gebruiken de vernieuwde logo-assets op hun bestaande stabiele paden.
- Het nieuwe TP-monogram is doorgevoerd in alle favicon-, Apple Touch-, webmanifest- en schema.org-iconformaten van 16 tot en met 512 pixels.
- Afmetingen van de bestaande headerassets zijn behouden om layoutverschuivingen te voorkomen.
- Catalogusdata, prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en productinformatie zijn niet gewijzigd.

## 0.5.321 — Makita 40 frees- en specialistische machines (2026-07-27)

- In één grote batch 40 eerder volledig lege Makita-basismodellen voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat alle 17 nog lege freesmachines en 23 specialistische machines voor kit, smering, plaatknippen, draadeind, betonstaal, kabels en mengen.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officiële Makita Nederland-productpagina of officieel productblad als bron.
- Makita stijgt van 477 naar 517 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 377 naar 337. Alle 517 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 440 naar 480 modellen zonder nieuwe scripts, npm-commando’s of losse hulpbestanden toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.320 — Makita 40 slagmoer-, afkort- en schroefmachines (2026-07-27)

- In één grote batch 40 eerder volledig lege Makita-basismodellen voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat 16 slagmoer- en ratelsleutels, 18 afkort- en metaalzaagmachines en 6 schroef- en bandschroefmachines.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officiële Makita Nederland-productpagina of officieel productblad als bron.
- Makita stijgt van 437 naar 477 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 417 naar 377. Alle 477 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 400 naar 440 modellen zonder nieuwe scripts, npm-commando’s of losse hulpbestanden toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.319 — Makita 40 bevestigings-, zaag-, multitool- en polijstmachines (2026-07-27)

- In één grote batch 40 eerder volledig lege Makita-basismodellen voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat 16 spijker- en nietmachines, 10 reciprozagen, 4 multitools, 4 decoupeerzagen en 6 polijstmachines.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officiële Makita Nederland-productpagina of officieel productblad als bron.
- Makita stijgt van 397 naar 437 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 457 naar 417. Alle 437 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 360 naar 400 modellen zonder nieuwe scripts, npm-commando’s of losse hulpbestanden toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.318 — Makita 40 haakse, rechte en doorslijpers (2026-07-26)

- In één grote batch 40 eerder volledig lege Makita-basismodellen voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat 37 haakse slijpers, één platkop haakse slijper, één rechte slijper en één compacte doorslijper op LXT, XGT en 230 V.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officiële Makita Nederland-productpagina of officieel productblad als bron.
- Makita stijgt van 357 naar 397 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 497 naar 457. Alle 397 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 320 naar 360 modellen zonder nieuwe scripts, npm-commando’s of losse hulpbestanden toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.317 — Makita 40 basismodellen: boor-, schroef- en slagmachines (2026-07-26)

- In één grote batch 40 eerder volledig lege Makita-basismodellen voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat 25 boor-, haakse boor-, klopboor- en magneetkernboormachines, 10 slagschroevendraaiers en 5 slagmoersleutels.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officiële Makita Nederland-productpagina of officieel productblad als bron.
- Makita stijgt van 317 naar 357 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 537 naar 497. Alle 357 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 280 naar 320 modellen zonder nieuwe scripts, npm-commando’s of losse hulpbestanden toe te voegen.
- De broncontrole accepteert naast officiële Makita-artikelpagina’s ook officiële Makita-productbladen onder `product_print`; andere domeinen of bronsoorten blijven afgewezen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.316 — Makita 40 basismodellen: cirkel-, inval- en decoupeerzagen (2026-07-26)

- In één grote batch 40 eerder volledig lege Makita-basismodellen voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat 32 cirkel-, metaalcirkel- en invalcirkelzagen plus 8 decoupeerzagen.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officiële Makita Nederland-productpagina als bron.
- Makita stijgt van 277 naar 317 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 577 naar 537. Alle 317 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 240 naar 280 modellen zonder nieuwe scripts, npm-commando’s of losse hulpbestanden toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.315 — Makita 40 basismodellen: schuurmachines, schaafmachines en tafelzaag (2026-07-26)

- In één grote batch 40 eerder volledig lege Makita-basismodellen voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat 29 schuurmachines, 10 schaafmachines en tafelzaag 2704.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officiële Makita Nederland-productpagina als bron.
- Makita stijgt van 237 naar 277 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 617 naar 577. Alle 277 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 200 naar 240 modellen zonder nieuwe scripts, npm-commando’s of losse hulpbestanden toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.314 — Makita 40 basismodellen: boor-, combi-, breekhamers en haakse boormachines (2026-07-26)

- In één grote batch 40 eerder volledig lege Makita-basismodellen voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- De batch omvat 36 boor-, combi-, breekhamers en schrapers plus vier haakse boormachines: DHR171, DHR182, DHR183, DHR241, DHR264, DHR281, DHR400, HK0500, HM0810T, HM0871C, HM1101C, HM1203C, HM1213C, HM1214C, HM1812, HR002G, HR003G, HR006G, HR008G, HR009G, HR010G, HR166D, HR1841F, HR2300, HR2470, HR2600, HR2601, HR2630, HR2631F, HR2652, HR3011FC, HR3210FC, HR4002, HR4013C, HR4510C, HR5202C, DA3010F, DA3011F, DA333D en DA4031.
- Elk model heeft minimaal 250 tekens productomschrijving, vier officieel onderbouwde kenmerken en vijf technische regels, met per sectie een officiële Makita Nederland-productpagina als bron.
- Makita stijgt van 197 naar 237 complete basismodellen; 0 modellen zijn gedeeltelijk en het aantal volledig lege modellen daalt van 657 naar 617. Alle 237 complete modellen voldoen aan de uitgebreide inhoudsnorm.
- De geconsolideerde regressiedekking stijgt van 160 naar 200 modellen zonder nieuwe scripts, npm-commando’s of losse hulpbestanden toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

# Changelog

## 0.5.313 — Makita inhoudsverdieping: laatste 38 complete modellen (2026-07-26)

- De laatste 38 reeds complete maar nog te korte of te magere Makita-basismodellen in één grote batch uitgebreid.
- Alle drie vaste onderdelen zijn per model aanwezig: Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Alle 197 gevulde Makita-basismodellen voldoen nu aan minimaal 250 tekens omschrijving, vier kenmerken en vijf technische regels.
- Zeven modellen met minder dan vier kenmerken aangevuld met officieel geregistreerde product- of technische eigenschappen.
- Inhoud uitsluitend opgebouwd uit de reeds gekoppelde officiële Makita Nederland-productpagina’s; geen providerinformatie als basismodelbron gebruikt.
- Makita-status blijft 197 compleet, 0 gedeeltelijk en 657 volledig leeg; de uitgebreide norm stijgt van 159 naar 197 modellen.
- Geconsolideerde regressiedekking uitgebreid van 122 naar 160 recent verbeterde Makita-basismodellen, zonder nieuwe scripts, npm-commando’s of losse hoofdbestanden.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.312 — Makita inhoudsverdieping: boor-, combi- en breekhamers (2026-07-26)

- Alle 9 reeds complete maar nog te korte Makita-basismodellen binnen Boorhamers uitgebreid naar minimaal 250 tekens Productomschrijving.
- De batch omvat DHR202, DHR242, DHR243, HR005G, HR007G, HR012G, HR5212, M8600 en M8700.
- Alle drie vaste onderdelen blijven bij ieder model aanwezig: Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Omschrijvingen uitsluitend opgebouwd uit de gekoppelde officiële Makita Nederland-productpagina’s, gebruikersvoordelen en technische gegevens.
- Makita-status blijft 197 compleet, 0 gedeeltelijk en 657 volledig leeg; het aantal modellen op de uitgebreide norm stijgt van 150 naar 159.
- Geconsolideerde regressiedekking uitgebreid van 113 naar 122 Makita-basismodellen, zonder nieuwe scripts, npm-commando’s of losse hoofdbestanden.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.311 — Makita inhoudsverdieping: haakse en rechte slijpers (2026-07-26)

- Alle 9 reeds complete maar nog te korte Makita-basismodellen binnen Haakse slijpers uitgebreid naar minimaal 250 tekens Productomschrijving.
- De batch omvat DGA511, DGD800, GA029G, GA038G, GA055G, GA5030, GA9020, GD0810 en M9503.
- GA9020 aangevuld tot minimaal vier officieel onderbouwde bijzondere kenmerken op basis van de officiële gebruikersvoordelen en technische gegevens.
- Omschrijvingen uitsluitend opgebouwd uit de gekoppelde officiële Makita Nederland-productpagina’s en de reeds vastgelegde officiële technische gegevens.
- Makita-status blijft 197 compleet, 0 gedeeltelijk en 657 volledig leeg; het aantal modellen op de uitgebreide norm stijgt van 141 naar 150.
- Geconsolideerde regressiedekking uitgebreid van 104 naar 113 Makita-basismodellen, zonder nieuwe scripts, npm-commando’s of losse hoofdbestanden.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.310 — Makita inhoudsverdieping: reiniging (2026-07-26)

- Alle 13 reeds complete maar nog te korte Makita-basismodellen binnen Reiniging uitgebreid naar minimaal 250 tekens Productomschrijving.
- De batch omvat CL001G, CL002G, CL004G, CL070, CL072, CL108, CL183, DCL181, DHW080, DVC261, VC008G, VC011G en VS001G.
- CL070, CL072 en CL183 aangevuld tot minimaal vier officieel onderbouwde bijzondere kenmerken.
- Omschrijvingen en kenmerken uitsluitend opgebouwd uit de gekoppelde officiële Makita Nederland-productpagina’s en de reeds vastgelegde officiële technische gegevens.
- Makita-status blijft 197 compleet, 0 gedeeltelijk en 657 volledig leeg; het aantal modellen op de uitgebreide norm stijgt van 128 naar 141.
- Geconsolideerde regressiedekking uitgebreid van 91 naar 104 Makita-basismodellen, zonder nieuwe scripts, npm-commando’s of losse hoofdbestanden.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.309 — Makita inhoudsverdieping: tuinmachines (2026-07-26)

- Alle 16 reeds complete maar nog te korte Makita-basismodellen binnen Tuinmachines uitgebreid naar minimaal 250 tekens Productomschrijving.
- De batch omvat DLM330, DLM530, DLM532, DLM538, DUB185, DUB186, DUC254, DUH483, UB002G, UB005G, UB101, UH004G, UH006G, UH023G, UH201 en UR006G.
- DLM330, UB101 en UH023G aangevuld tot minimaal vier officieel onderbouwde bijzondere kenmerken.
- Omschrijvingen en kenmerken uitsluitend opgebouwd uit de gekoppelde officiële Makita Nederland-productpagina’s en de reeds vastgelegde officiële technische gegevens.
- Makita-status blijft 197 compleet, 0 gedeeltelijk en 657 volledig leeg; het aantal modellen op de uitgebreide norm stijgt van 112 naar 128.
- Geconsolideerde regressiedekking uitgebreid van 75 naar 91 Makita-basismodellen, zonder nieuwe scripts, npm-commando’s of losse hoofdbestanden.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.308 — Makita inhoudsverdieping: accuboormachines (2026-07-26)

- Alle 21 reeds complete Makita-basismodellen binnen Accuboormachines uitgebreid naar minimaal 250 tekens Productomschrijving.
- De batch omvat DDF482, DDF485, DDF490, DDF492, DF033, DF331, DF333, DHP458, DHP482, DHP485, DHP487, DHP489, DHP492, DP4020, DP4021, HP333, HP488, M6200, M8101, M8103 en M8104.
- Omschrijvingen uitsluitend opgebouwd uit de gekoppelde officiële Makita Nederland-productpagina’s, bestaande gebruikersvoordelen en technische gegevens.
- Makita-status blijft 197 compleet, 0 gedeeltelijk en 657 volledig leeg; het aantal modellen op de uitgebreide norm stijgt van 91 naar 112.
- Geconsolideerde regressiedekking uitgebreid van 54 naar 75 Makita-basismodellen, zonder nieuwe scripts of npm-commando’s toe te voegen.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.
- Compacte update bevat uitsluitend toegestane projectbestanden en geen los leesmij-, batch- of verwijderbestand.

## 0.5.307 — Scriptsmap opgeschoond en Makita-regressies geconsolideerd (2026-07-26)

- De release-specifieke bestanden `scripts/test-makita-batch-1-content.mjs` en `scripts/test-makita-batch-2-content.mjs` definitief uit de actieve scriptsmap verwijderd.
- Alle inhoudelijke controles voor de 54 Makita-modellen samengevoegd met de bestaande canonieke bronkwaliteitstest `test-product-information-sources.mjs`.
- De Makita-status wordt voortaan rechtstreeks uit de canonieke catalogus berekend en bewaakt: 854 basismodellen, 197 compleet, 0 gedeeltelijk, 657 volledig leeg en 91 op de uitgebreide norm.
- Vijf laderomschrijvingen terminologisch aangepast van “deze uitvoering” naar “dit laadmodel”, zodat de canonieke builder ze niet onterecht als uitvoeringsspecifieke setinhoud afwijst.
- Verouderde historische Makita-asserties aangepast aan de later officieel uitgebreide drie-sectiestructuur, zonder de oorspronkelijke bron- en techniekcontroles te verwijderen.
- `package.json` bevat 65 npm-commando’s en de actieve scriptsmap precies 70 `.mjs`-bestanden, conform de bestaande projectstructuurgrenzen.
- De volledige inhoud uit v0.5.304 en v0.5.305 blijft behouden; prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.306 — Quality-gate-hotfix Makita-regressietests (2026-07-26)

- De losse npm-scripts `test:makita-batch-1` en `test:makita-batch-2` verwijderd, zodat `package.json` weer binnen de bestaande limiet van 65 commando’s valt.
- Beide Makita-regressietests blijven automatisch draaien binnen `npm run check`, nu via directe Node-aanroepen in het bestaande `check:core`-commando.
- De inhoudelijke wijzigingen uit v0.5.304 en v0.5.305 volledig behouden.
- Geen wijzigingen aan prijzen, EAN-koppelingen, aanbieders, voorraad, levertijden of uitvoeringsspecifieke setinhoud.

## 0.5.305 — Makita drie onderdelen batch 2: resterende gedeeltelijke modellen (2026-07-26)

- De laatste 16 gedeeltelijke Makita-basismodellen voorzien van alle drie vaste onderdelen: Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Veertien ontbrekende omschrijvingen toegevoegd op basis van officiële Makita Nederland-productpagina’s en technische gegevens.
- Ontbrekende kenmerken toegevoegd voor BO4565, DECDML807 en DML801.
- HG5030 en M9204 uitgebreid naar minimaal vier kenmerken.
- Alle 16 modellen voldoen nu aan de uitgebreide inhoudsnorm: minimaal 250 tekens, vier kenmerken en vijf technische regels.
- Makita-audit bijgewerkt naar 197 complete, 0 gedeeltelijke en 657 volledig lege basismodellen; 91 modellen voldoen aan de uitgebreide norm.
- Nieuwe regressietest `test:makita-batch-2` toegevoegd.
- Prijzen, EAN-koppelingen, aanbieders, voorraad, levertijd en uitvoeringsspecifieke setinhoud zijn niet gewijzigd.

## 0.5.304 — Makita accu’s, laders en startsets inhoudelijk afgerond

- alle 38 gedeeltelijke Makita-accu’s, laders en startsets uit de v0.5.303-audit compleet gemaakt;
- Productomschrijving, Bijzondere kenmerken en Technische gegevens uitsluitend uit reeds geverifieerde officiële Makita-productpagina’s opgebouwd;
- alle 38 modellen voldoen nu aan minimaal 250 tekens, vier kenmerken en vijf technische regels;
- Makita-status verbeterd van 143 naar 181 complete basismodellen en van 54 naar 16 gedeeltelijke modellen;
- aantal Makita-modellen dat aan de uitgebreide inhoudsnorm voldoet verhoogd van 37 naar 75;
- prijzen, aanbiedingen, EAN-koppelingen, voorraad, levertijd en uitvoeringsspecifieke setinhoud niet gewijzigd.

## 0.5.303 — DeWalt productinformatie definitief afgerond (2026-07-25)

- de laatste 28 DeWalt-basismodellen voorzien van Productomschrijving, Bijzondere kenmerken en Technische gegevens;
- resterende combisets, DCS525, DCB182PAK, DXAM2250 en DXF2067 inhoudelijk afgerond;
- officiële DeWalt-productpagina’s en -documentatie gekoppeld, met aanvullende exacte controle op EAN en volledige fabrikantcode voor pakket- en combisamenstellingen;
- alle 414 DeWalt-basismodellen voldoen nu aan de uitgebreide inhoudsnorm;
- quality-gate-dekking uitgebreid zodat alle 414 DeWalt-basismodellen blijvend op inhoudsdiepte en officiële bronregistratie worden gecontroleerd;
- modelcode-uitleg blijft volledig uit de publieke renderer en styling verwijderd;
- definitieve audit vastgelegd in `data/review/dewalt-content-audit-v0_5_303.json`.

## 0.5.302 — DeWalt productinformatie batch 16: Combisets deel 1 (2026-07-25)

- Dertien DeWalt-combiset-basismodellen voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Deze deelbatch omvat DCK2050, DCK2060, DCK2062, DCK2080, DCK2200, DCK2222, DCK266, DCK268, DCK276, DCK368, DCK384, DCK422 en DCK755.
- DeWalt-dekking verbeterd van 373 naar 386 basismodellen met alle drie de onderdelen en van 373 naar 386 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Binnen Combisets voldoen nu 13 van de 37 basismodellen aan de uitgebreide inhoudsnorm; 24 combisets blijven over.
- DCK2052, DCK2095, DCK2110 en DCK212 zijn bewust uitgesteld omdat de officieel vindbare DeWalt-productinformatie niet eenduidig aansluit op de huidige cataloguscombinatie; er is niet gegokt met de machinesamenstelling.
- Productinformatie is uitsluitend gebaseerd op officiële modelspecifieke DeWalt-productpagina’s; exacte accu-, lader-, koffer- en andere setinhoud blijft uitsluitend aan de uitvoering gekoppeld.
- De generieke modelcode-uitleg blijft uit de publieke renderer, CSS en compatibiliteitsmodule verwijderd.
- Regressietest uitgebreid van 320 naar 333 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_302.json`.
- Compacte update bevat geen `.git`-map, `UPDATE-INSTRUCTIES.txt` of andere hulpdocumenten in de hoofdmap.

## 0.5.301 — DeWalt productinformatie batch 15: Accu’s & laders deel 2 (2026-07-25)

- 22 DeWalt-basismodellen binnen Accu’s & laders voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Deze deelbatch omvat XR-laders, 12V/18V XR-accu’s, XR FLEXVOLT-pakketten, POWERSTACK-accu’s, POWERSHIFT-accu en -lader en de DDF5610500-accu.
- DeWalt-dekking verbeterd van 355 naar 373 basismodellen met alle drie de onderdelen en van 351 naar 373 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Binnen Accu’s & laders voldoen nu 47 van de 48 basismodellen aan de uitgebreide inhoudsnorm. DCB182PAK is bewust uitgesteld omdat geen exact passende, officieel verifieerbare DeWalt-fabrikantbron is gevonden; winkeltekst en de pakketnaam zijn niet als basismodelinformatie overgenomen.
- Productinformatie is uitsluitend gebaseerd op officiële modelspecifieke DeWalt-productpagina’s en officiële DeWalt-handleidingen; exacte accu-, lader-, koffer- en andere setinhoud blijft uitsluitend aan de uitvoering gekoppeld.
- De generieke modelcode-uitleg blijft uit de publieke renderer, CSS en compatibiliteitsmodule verwijderd.
- Regressietest uitgebreid van 298 naar 320 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_301.json`.
- Compacte update bevat geen `.git`-map, `UPDATE-INSTRUCTIES.txt` of andere hulpdocumenten in de hoofdmap.

## 0.5.300 — DeWalt productinformatie batch 14: Accu’s & laders deel 1 (2026-07-25)

- Twintig DeWalt-basismodellen binnen Accu’s & laders voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Deze deelbatch omvat multivoltage- en snelladers, starterpacks, compacte 12V XR-accu’s en POWERSTACK-pakketten.
- DeWalt-dekking verbeterd van 342 naar 355 basismodellen met alle drie de onderdelen en van 331 naar 351 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Productinformatie is uitsluitend gebaseerd op officiële modelspecifieke DeWalt-productpagina’s en officiële DeWalt-handleidingen; exacte accu-, lader-, koffer- en andere setinhoud blijft uitsluitend aan de uitvoering gekoppeld.
- De generieke modelcode-uitleg blijft uit de publieke renderer, CSS en compatibiliteitsmodule verwijderd.
- Regressietest uitgebreid van 278 naar 298 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_300.json`.
- Compacte update bevat geen `.git`-map, `UPDATE-INSTRUCTIES.txt` of andere hulpdocumenten in de hoofdmap.

## 0.5.299 — DeWalt productinformatie batch 13: Bouwplaats & licht deel 2 (2026-07-25)

- Achttien DeWalt-basismodellen binnen Bouwplaats & licht voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Deze deelbatch omvat werklampen, zaklampen, bouwventilator, watertank, Bluetooth-luidsprekers en werfradio’s.
- DeWalt-dekking verbeterd van 328 naar 342 basismodellen met alle drie de onderdelen en van 313 naar 331 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Binnen Bouwplaats & licht voldoen nu 46 van de 48 basismodellen aan de uitgebreide inhoudsnorm. DXAM2250 en DXF2067 zijn bewust uitgesteld omdat geen officieel verifieerbare, modelspecifieke DeWalt-fabrikantbron is gevonden; winkelteksten zijn niet als fabrikantinformatie overgenomen.
- Productinformatie is uitsluitend gebaseerd op officiële modelspecifieke DeWalt-productpagina’s; exacte accu-, lader-, koffer- en andere setinhoud blijft uitsluitend aan de uitvoering gekoppeld.
- De generieke modelcode-uitleg blijft uit de publieke renderer, CSS en compatibiliteitsmodule verwijderd.
- Regressietest uitgebreid van 260 naar 278 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_299.json`.
- Compacte update bevat geen `.git`-map, `UPDATE-INSTRUCTIES.txt` of andere hulpdocumenten in de hoofdmap.

## 0.5.298 — DeWalt productinformatie batch 12: Bouwplaats & licht deel 1 (2026-07-25)

- Twintig DeWalt-basismodellen binnen Bouwplaats & licht voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Deze deelbatch omvat de DCE050-transferpomp, roterende laser, kruis- en multilijnlasers, USB-C-lasermodellen en laserafstandsmeters.
- DeWalt-dekking verbeterd van 308 naar 328 basismodellen met alle drie de onderdelen en van 293 naar 313 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Binnen Bouwplaats & licht voldoen nu 28 van de 48 basismodellen aan de uitgebreide inhoudsnorm; twintig modellen blijven over voor deel 2.
- Productinformatie is uitsluitend gebaseerd op officiële modelspecifieke DeWalt-productpagina’s; exacte accu-, lader-, koffer- en andere setinhoud blijft uitsluitend aan de uitvoering gekoppeld.
- De generieke modelcode-uitleg blijft uit de publieke renderer, CSS en compatibiliteitsmodule verwijderd.
- Regressietest uitgebreid van 240 naar 260 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_298.json`.
- Compacte update bevat geen `.git`-map, `UPDATE-INSTRUCTIES.txt` of andere hulpdocumenten in de hoofdmap.

## 0.5.297 — DeWalt productinformatie batch 11: specialistische machines (2026-07-25)

- De resterende 29 DeWalt-specialistische machines voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Alle 30 basismodellen in de categorie Specialistische machines voldoen nu aan de uitgebreide inhoudsnorm.
- DeWalt-dekking verbeterd van 279 naar 308 basismodellen met alle drie de onderdelen en van 264 naar 293 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Voor reguliere machines zijn officiële DeWalt-productpagina’s en handleidingen gebruikt. Voor DeWalt-gelabelde compressoren, generatoren en lasmachines zijn modelspecifieke DeWalt-catalogi en -handleidingen gebruikt.
- Exacte accu-, lader-, koffer-, accessoire- en andere setinhoud blijft uitsluitend aan de uitvoering gekoppeld.
- De generieke modelcode-uitleg blijft uit de publieke renderer, CSS en compatibiliteitsmodule verwijderd.
- Regressietest uitgebreid van 211 naar 240 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_297.json`.
- Compacte update bevat geen `.git`-map, `UPDATE-INSTRUCTIES.txt` of andere hulpdocumenten in de hoofdmap.

## 0.5.296 — DeWalt productinformatie batch 10: reiniging (2026-07-25)

- Alle 18 DeWalt-blazers, nat-/droogstofzuigers, stofafzuigers en luchtfilterunits voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Alle 18 basismodellen in de categorie Reiniging voldoen nu aan de uitgebreide inhoudsnorm.
- DeWalt-dekking verbeterd van 262 naar 279 basismodellen met alle drie de onderdelen en van 246 naar 264 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Productinformatie gebaseerd op officiële DeWalt-productpagina’s en modelspecifieke, door DeWalt uitgegeven handleidingen; exacte accu-, lader-, koffer- en andere setinhoud blijft uitsluitend aan de uitvoering gekoppeld.
- De generieke modelcode-uitleg blijft uit de publieke renderer, CSS en compatibiliteitsmodule verwijderd.
- Regressietest uitgebreid van 193 naar 211 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_296.json`.
- Compacte update bevat geen `.git`-map, `UPDATE-INSTRUCTIES.txt` of andere hulpdocumenten in de hoofdmap.

## 0.5.295 — DeWalt productinformatie batch 9: tuinmachines (2026-07-25)

- De resterende 25 DeWalt-tuinmachines voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Alle 28 basismodellen in de categorie Tuinmachines voldoen nu aan de uitgebreide inhoudsnorm.
- DeWalt-dekking verbeterd van 239 naar 262 basismodellen met alle drie de onderdelen en van 221 naar 246 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Productinformatie uitsluitend gebaseerd op officiële DeWalt-fabrikantbronnen; DeWalt België is expliciet als officiële landensite toegestaan voor een exact gelijk basismodel wanneer DeWalt.nl geen directe productpagina biedt.
- Exacte accu-, lader-, koffer- en andere setinhoud blijft uitsluitend aan de uitvoering gekoppeld.
- Regressietest uitgebreid van 168 naar 193 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_295.json`.
- Compacte update bevat geen `.git`-map, `UPDATE-INSTRUCTIES.txt` of andere hulpdocumenten in de hoofdmap.

## 0.5.294 — DeWalt productinformatie batch 8: spijkerpistolen (2026-07-25)

- De resterende 12 DeWalt-spijkerpistolen, nietmachines en constructietackers voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Alle 12 basismodellen in de categorie Spijkerpistolen voldoen nu aan de uitgebreide inhoudsnorm.
- DeWalt-dekking verbeterd van 227 naar 239 basismodellen met alle drie de onderdelen en van 209 naar 221 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Productinformatie uitsluitend gebaseerd op officiële DeWalt-fabrikantbronnen; exacte accu-, lader-, koffer- en andere setinhoud blijft gekoppeld aan de uitvoering.
- Regressietest uitgebreid van 156 naar 168 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_294.json`.
- Compacte update bevat geen `UPDATE-INSTRUCTIES.txt` of andere hulpdocumenten in de hoofdmap.

## 0.5.293 — DeWalt productinformatie batch 7: zaagmachines (2026-07-25)

- De resterende 12 DeWalt-combinatiezagen, lintzagen, tegelzagen, alligatorzagen, radiaalzaag en tafelzaag voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Alle 14 basismodellen in de categorie Zaagmachines voldoen nu aan de uitgebreide inhoudsnorm.
- DeWalt-dekking verbeterd van 215 naar 227 basismodellen met alle drie de onderdelen en van 197 naar 209 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Productinformatie uitsluitend gebaseerd op officiële DeWalt-fabrikantbronnen; exacte accu-, lader-, koffer- en andere setinhoud blijft gekoppeld aan de uitvoering.
- Regressietest uitgebreid van 144 naar 156 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_293.json`.

## 0.5.292 — DeWalt productinformatie batch 6: haakse slijpers, doorslijpers en stiftslijpers (2026-07-25)

- De resterende 27 DeWalt-haakse slijpers, doorslijpers en stiftslijpers voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Alle 29 basismodellen in de categorie Haakse slijpers voldoen nu aan de uitgebreide inhoudsnorm.
- DeWalt-dekking verbeterd van 196 naar 215 basismodellen met alle drie de onderdelen en van 170 naar 197 modellen die aan de uitgebreide inhoudsnorm voldoen.
- De generieke **“Wat betekent modelcode …?”**-uitleg nu daadwerkelijk uit de publieke renderer en CSS verwijderd. De compacte update overschrijft daarnaast de oude decoder met een veilige no-opmodule, zodat het blok ook verdwijnt bij installaties waarop v0.5.289 niet volledig is toegepast.
- Productinformatie uitsluitend gebaseerd op officiële DeWalt-fabrikantbronnen; exacte accu-, lader-, koffer- en andere setinhoud blijft gekoppeld aan de uitvoering.
- Regressietest uitgebreid van 117 naar 144 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_292.json`.

## 0.5.291 — DeWalt productinformatie batch 5: slagmoersleutels en accu-ratels (2026-07-25)

- De resterende 15 DeWalt-slagmoersleutels en accu-ratels voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Alle 19 basismodellen in de categorie Slagmoersleutels voldoen nu aan de uitgebreide inhoudsnorm.
- DeWalt-dekking verbeterd van 181 naar 196 basismodellen met alle drie de onderdelen en van 155 naar 170 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Productinformatie uitsluitend gebaseerd op officiële DeWalt-fabrikantbronnen; exacte accu-, lader-, koffer- en andere setinhoud blijft gekoppeld aan de uitvoering.
- Regressietest uitgebreid van 102 naar 117 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_291.json`.

## 0.5.290 — DeWalt productinformatie batch 4: boorhamers en breekhamers (2026-07-25)

- De resterende 21 DeWalt-boorhamers en breekhamers voorzien van uitgebreide Productomschrijving, Bijzondere kenmerken en Technische gegevens.
- Alle 29 basismodellen in de categorie Boorhamers voldoen nu aan de uitgebreide inhoudsnorm.
- DeWalt-dekking verbeterd van 162 naar 181 basismodellen met alle drie de onderdelen en van 134 naar 155 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Productinformatie uitsluitend gebaseerd op officiële DeWalt-fabrikantbronnen; exacte accu-, lader-, koffer- en andere setinhoud blijft gekoppeld aan de uitvoering.
- Regressietest uitgebreid van 81 naar 102 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_290.json`.

## 0.5.289 — DeWalt productinformatie batch 3 en verwijdering modelcode-uitleg (2026-07-22)

- De volledige generieke DeWalt-uitleg **“Wat betekent modelcode …?”** uit alle publieke productpagina’s, bijbehorende CSS en de oude decoder verwijderd.
- 27 DeWalt-basismodellen volledig uitgebreid: achttien accuboormachines, acht slagschroevendraaiers en de compacte DCH172-boorhamer.
- Alle 21 DeWalt-accuboormachines en alle 9 DeWalt-slagschroevendraaiers voldoen nu aan de uitgebreide inhoudsnorm.
- DeWalt-dekking verbeterd van 145 naar 162 basismodellen met alle drie de onderdelen en van 107 naar 134 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Regressietest uitgebreid naar 81 volledig bewaakte DeWalt-basismodellen en voorzien van een blokkade tegen het terugkeren van de generieke modelcode-uitleg.
- De build gebruikt bij een ontbrekende lokale esbuild-installatie direct de bestaande cache-veilige ES-modulefallback, zonder vast te lopen op een `npx`-oproep.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_289.json`.

## 0.5.288 — DeWalt productinformatie batch 2 (2026-07-22)

- 27 DeWalt-basismodellen volledig uitgebreid binnen afkortzagen, cirkelzagen, reciprozagen en multitools.
- Ieder verwerkt model heeft minimaal 250 tekens Productomschrijving, vier Bijzondere kenmerken en vijf Technische gegevens met officiële DeWalt-bronregistratie.
- DeWalt-dekking verbeterd van 122 naar 145 basismodellen met alle drie de onderdelen en van 80 naar 107 modellen die aan de uitgebreide inhoudsnorm voldoen.
- DCS525 bewust nog niet inhoudelijk ingevuld: er is nog geen volledige officiële DeWalt-productpagina met voldoende modelgegevens gevonden.
- Regressietest uitgebreid naar 54 volledig bewaakte DeWalt-basismodellen.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_288.json`; het canonieke productinformatie-auditbestand is direct meegeleverd.

## 0.5.287 — DeWalt productinformatie batch 1 (2026-07-21)

- 27 DeWalt-basismodellen volledig uitgebreid binnen frezen, schuurmachines, schaafmachines, polijstmachines, schroefmachines en decoupeerzagen.
- Ieder model in deze batch heeft een Productomschrijving van minimaal 250 tekens, minimaal vier Bijzondere kenmerken en minimaal vijf relevante Technische gegevens.
- Productinformatie uitsluitend gebaseerd op officiële DeWalt-fabrikantbronnen; niet-officiële winkels en afgeleide codebetekenissen zijn niet gebruikt.
- DeWalt-dekking verbeterd van 95 naar 122 basismodellen met alle drie de onderdelen en van 53 naar 80 modellen die aan de uitgebreide inhoudsnorm voldoen.
- Vaste regressietest toegevoegd die inhoudsdiepte en officiële bronregistratie voor deze 27 modellen bewaakt.
- Actuele voortgang vastgelegd in `data/review/dewalt-content-audit-v0_5_287.json`.

## 0.5.286 — DeWalt inhoudsaudit en modelcode-uitleg (2026-07-21)

- Volledige inhoudsnulmeting uitgevoerd voor 414 DeWalt-basismodellen en 644 exacte uitvoeringen.
- Alle 644 DeWalt-uitvoeringen voorzien van een apart blok dat de productfamilie, modelreeks, exacte uitvoeringscode en regionale suffixen uitlegt.
- Geen universele betekenis verzonnen voor letters of cijfers waarvoor DeWalt geen betrouwbare officiële legenda publiceert; exacte setinhoud blijft leidend.
- Vaste quality-gate toegevoegd die 644/644 modelcode-uitleg afdwingt.
- Nulmeting opgeslagen in `data/review/dewalt-content-audit-v0_5_286.json`.

## 0.5.285 — DeWalt definitief afgerond (2026-07-21)

- Laatste 3 exact verifieerbare DeWalt-uitvoeringen toegevoegd: DCS520T2-QW, DW030PL en DCB115D2-QW.
- Alle resterende ToolMax- en Mastertools-DeWalt-feedregels definitief beoordeeld.
- Accessoires, handgereedschap buiten scope, bronproblemen en code/EAN-conflicten expliciet geregistreerd in `data/review/dewalt-final-audit-v0_5_285.json`.
- Geen aannames gedaan bij ontbrekende of tegenstrijdige Leveringsomvang.

## 0.5.284 - 2026-07-21

- De categorie `combisets` volledig gemaakt voor DeWalt met 46 exacte uitvoeringen en 77 live aanbiedingen: 42 van ToolMax en 35 van Mastertools.
- Negen aanvullende Mastertools-combisets en elf ToolMax-only uitvoeringen toegevoegd; exacte dubbele sets delen één uitvoering met twee aanbieders.
- De bestaande DW0887100-1 laser-/afstandsmetercombiset vanuit `bouwplaats` naar `combisets` verplaatst.
- DCK246P2T-QW alleen voor ToolMax gepubliceerd: de Mastertools-Leveringsomvang bevestigt niet beide machines en is daarom niet gebruikt.
- Alle koppelingen blijven strikt op volledige DeWalt-code + EAN; setinhoud wordt niet automatisch tussen aanbieders overschreven.
- De automatische feedworkflow bouwt bij een tussentijdse wijziging van `main` opnieuw vanaf de nieuwste commit in plaats van conflicterende JSON-bestanden te rebasen.

## 0.5.283 - 2026-07-21

- 30 exact gekoppelde Mastertools-DeWalt-uitvoeringen toegevoegd: 25 combisets, twee complete freesuitvoeringen, twee tuinmachines en één plaatschaar.
- De nieuwe categorie `combisets` voor het eerst gevuld; families DCK2050, DCK2051, DCK2062 en DCK266 zijn per exacte uitvoering geconsolideerd.
- Setinhoud uitsluitend uit `Leveringsomvang` op de exacte productpagina; vier tegenstrijdige of onvolledige bronnen geblokkeerd.
- Uitgangspunt is de samengevoegde v0.5.282 met de actuele automatische feedstatus, zodat geen prijs- of voorraadupdate wordt teruggedraaid.

## 0.5.282 - 2026-07-21

- Dertig nieuwe exacte DeWalt-uitvoeringen gepubliceerd in acht categorieën: dertien specialistische machines, zeven reinigingsmachines, drie frezen, twee tuinmachines, twee tackers, één haakse slijper, één invalzaag en één schroefmachine.
- Vierentwintig nieuwe basismodellen toegevoegd; de bestaande DCW604-, DCMBL562- en DCG200-families zijn uitgebreid en DCE590, DCS350 en DCV586M bevatten ieder twee exact gescheiden uitvoeringen.
- DWE4559-QS, DWE4579-QS, D25430K-QS en DW331KT-QS bewust niet gepubliceerd omdat de machine of een bruikbare Leveringsomvang ontbreekt. Bij DCG200NT-XJ is de TSTAK uit de titel niet als meegeleverd opgenomen omdat Leveringsomvang alleen de machine noemt.
- De catalogus bevat na deze update 1.373 basismodellen, 1.984 uitvoeringen en 2.150 live aanbiedingen.

## 0.5.281 - 2026-07-20

- Dertig nieuwe exacte DeWalt-uitvoeringen gepubliceerd: twee polijstmachines. tien tuinmachines. twee waterpompen. zeven laser-/meetproducten. vier tackers en vijf frezen.
- Drieëntwintig nieuwe basismodellen toegevoegd; de bestaande DCMWP134-familie is met de W2-uitvoering uitgebreid.
- Zes bronproblemen of duplicaten bewust geblokkeerd. waaronder twee DCE0811-sets zonder laser in Leveringsomvang en drie pagina’s zonder bruikbare Leveringsomvang.
- De catalogus bevat na deze update 1.349 basismodellen. 1.954 uitvoeringen en 2.120 live aanbiedingen.

## 0.5.280 - 2026-07-20

- Dertig nieuwe exacte DeWalt-uitvoeringen gepubliceerd: 22 boor-/klopboormachines. twee kernboormachines en zes schroefmachines.
- Zestien nieuwe basismodellen toegevoegd; DCD805. DCD800. DCD799 en andere families blijven per exacte uitvoering gescheiden.
- Zes bronproblemen of identiteitsconflicten bewust geblokkeerd. waaronder DCD805H2T-QW. DCD703L2T-QW en de reeds bestaande DCD996N-XJ met afwijkend EAN.
- De catalogus bevat na deze update 1.326 basismodellen. 1.924 uitvoeringen en 2.090 live aanbiedingen.

## 0.5.279 - 2026-07-20

- Dertig nieuwe exacte DeWalt-uitvoeringen in één gemengde Mastertools-batch gepubliceerd: zeven reinigingsmachines, dertien bouwplaatsproducten, twee compressoren, drie schaafuitvoeringen en vijf haakse ratelsleutels.
- Zesentwintig nieuwe basismodellen toegevoegd; de bestaande DXV20PTA- en DCL079-families zijn veilig uitgebreid zonder dubbele productkaarten.
- DXV50SAPTA, DCF900H2T-QW en DW680-QS bewust geblokkeerd wegens foutieve of onvolledige Leveringsomvang; DCS512N-XJ niet dubbel toegevoegd omdat code en EAN al live stonden.
- De totale catalogus bevat na deze update 1.310 basismodellen, 1.894 uitvoeringen en 2.060 live aanbiedingen.

## 0.5.278 - 2026-07-20

- Dertig nieuwe exacte DeWalt-uitvoeringen uit drie werkgebieden in één Mastertools-batch gepubliceerd: twaalf tackers/nietmachines, drie afstandsmeters en vijftien kruis-, punt- en multilijnlasers.
- Achttien platformzuivere basismodellen toegevoegd; uitvoeringen zijn uitsluitend gekoppeld op exact EAN + volledige DeWalt-code en setinhoud is letterlijk uit Leveringsomvang overgenomen.
- DDF5110500, DPN1850PP-XJ en DCE0811D1G-QW bewust niet gepubliceerd omdat de exacte machine in Leveringsomvang ontbreekt; titelclaims zijn niet gebruikt om dat gat op te vullen.
- Spijkerpistolen bevat na deze update 43 live aanbiedingen en Bouwplaats 143; de totale catalogus bevat 1.284 basismodellen, 1.864 uitvoeringen en 2.030 live aanbiedingen.

## 0.5.277 - 2026-07-20

- Vier DeWalt-tuingroepen in één grote Mastertools-batch afgerond: grastrimmers/combisystemen, heggenscharen, snoeischaren en kettingzagen.
- Achtentwintig nieuwe exacte uitvoeringen onder vijftien nieuwe basismodellen gepubliceerd, uitsluitend na exact EAN + volledige uitvoeringscode en controle van Leveringsomvang.
- Accessoires, voordeelsets en titelclaims zijn niet als meegeleverd behandeld; onbekende accu- of laadmodellen zijn niet ingevuld.
- DCM563P1-QW bewust geblokkeerd: hetzelfde EAN staat al als ToolMax-uitvoering DCM563P1, terwijl de volledige codes niet exact gelijk zijn. Er is daarom geen dubbele uitvoering en geen onveilige samenvoeging gemaakt.
- Tuinmachines bevat na deze update 315 live aanbiedingen; de totale catalogus bevat 1.266 basismodellen, 1.834 uitvoeringen en 2.000 live aanbiedingen.

## 0.5.276 - 2026-07-19

- De volledige actuele Mastertools-categorie DeWalt schuurmachines gecontroleerd op exact EAN + volledige uitvoeringscode.
- Zeventien nieuwe exacte uitvoeringen toegevoegd onder acht nieuwe basismodellen en de bestaande DWE4257-familie.
- Setinhoud uitsluitend overgenomen uit Leveringsomvang; titelclaims, voordeelsets en FAQ-inhoud zijn niet als meegeleverd behandeld.
- Bij DCW200P2 en DCW200NT is bewust geen TSTAK geclaimd, omdat de titel die wel noemt maar Leveringsomvang geen koffer vermeldt.
- Schuurmachines bevat na deze update 86 live aanbiedingen; haakse slijpers 215; de totale catalogus bevat 1.251 basismodellen, 1.806 uitvoeringen en 1.972 live aanbiedingen.

## 0.5.275 - 2026-07-19

- De volledige actuele Mastertools-categorie DeWalt frezen gecontroleerd op exact EAN + volledige uitvoeringscode.
- Vijf nieuwe exacte uitvoeringen en vijf nieuwe basismodellen toegevoegd: D26204, DWE627, D26203, DW682 en DWE625.
- Setinhoud uitsluitend overgenomen uit Leveringsomvang; voordeelsets en aanbevolen accessoires zijn niet als meegeleverd behandeld.
- Bij D26203 en DW682K is de setinhoud bewust niet met een uit de titel afgeleide machineregel aangevuld, omdat de Leveringsomvang die regel niet noemt.
- Frezen bevat na deze update 38 live aanbiedingen; de totale catalogus bevat 1.243 basismodellen, 1.789 uitvoeringen en 1.955 live aanbiedingen.

## 0.5.274 - 2026-07-19

- De volledige actuele Mastertools-categorie DeWalt afkort-/verstekzaagmachines en metaalafkortzagen gecontroleerd op exact EAN + volledige uitvoeringscode.
- Zeventien nieuwe exacte uitvoeringen toegevoegd onder negen nieuwe basismodellen en vier bestaande modelreeksen.
- Setinhoud uitsluitend overgenomen uit Leveringsomvang; actieafbeeldingen, voordeelsets en titelclaims zijn niet als meegeleverd behandeld.
- Accu-uitvoeringen DCS365, DCS727, DCS777, DCS781 en DCS782 en gesnoerde DWS-/metaalzaagmodellen zijn strikt gescheiden.
- Afkortzagen bevat na deze update 49 live aanbiedingen; de totale catalogus bevat 1.238 basismodellen, 1.784 uitvoeringen en 1.950 live aanbiedingen.

## 0.5.273 - 2026-07-19

- De volledige actuele Mastertools-categorie DeWalt reciprozaagmachines gecontroleerd op exact EAN + volledige uitvoeringscode.
- Veertien nieuwe exacte uitvoeringen toegevoegd onder vijf nieuwe basismodellen en drie bestaande modelreeksen.
- Twee al gekoppelde uitvoeringen opnieuw gecontroleerd; DCS369P2 bevat nu exact DCB184-accu’s en de DCB115-multilader volgens Leveringsomvang.
- Setinhoud uitsluitend overgenomen uit Leveringsomvang; titelclaims over een koffer worden niet overgenomen wanneer de bronsectie die koffer niet noemt.
- Reciprozagen bevat na deze update 40 live aanbiedingen; de totale catalogus bevat 1.229 basismodellen, 1.767 uitvoeringen en 1.933 live aanbiedingen.

## 0.5.272 - 2026-07-19

- Vanafprijzen op uitvoerings- en modelkaarten worden voortaan tijdens de build en bij runtime rechtstreeks afgeleid van dezelfde actuele live aanbiedingen als de aanbiederskaart.
- Een feed- of productpaginaprijswijziging werkt daardoor in één publicatie door naar de aanbiederskaart, gereedschapskaart, zoekresultaten en SEO-pagina’s.
- De laagste bekende totaalprijs wordt gebruikt; wanneer verzending onbekend is, valt de kaart veilig terug op de productprijs.
- Inactieve, niet-goedgekeurde of uit de actuele feed verwijderde aanbiedingen tellen niet mee voor de vanafprijs.
- Een nieuwe kwaliteitscontrole voorkomt dat statische `fromPrice`-waarden opnieuw achterlopen op de gepubliceerde aanbiedingen.

## 0.5.271 - 2026-07-19

- De productpaginaverificatie kan een herhaald ontbrekende ToolMax- of Mastertools-aanbieding nu automatisch tijdelijk live bevestigen, uitsluitend bij een exacte EAN- én volledige uitvoeringscodematch.
- Betrouwbaar uit de exacte pagina gelezen prijzen worden automatisch bijgewerkt binnen een veiligheidsmarge van 40% tot 200% van de bestaande prijs; grotere afwijkingen blijven staan en worden als uitgestelde prijscontrole gerapporteerd.
- Bekende pagina-statussen `in_stock`, `available`, `backorder` en `out_of_stock` worden automatisch bijgewerkt zonder de aanbieding offline te zetten.
- Automatische bevestigingen blijven zeven dagen geldig en worden in de persistente ontbrekende-aanbiedingenstatus bewaard, zodat zij niet bij de volgende feedrun direct opnieuw openvallen.
- Een aanbiederbrede noodrem blokkeert alle automatische toepassingen wanneer veel resultaten tegelijk technisch fout, onduidelijk of mogelijk vervallen zijn.
- Mogelijk vervallen pagina’s, identiteitsverschillen en technische blokkades blijven handmatig te beoordelen; automatische verwijdering en deactivering blijven uitgeschakeld.
- Het gedetailleerde paginaverificatierapport blijft uitsluitend als tijdelijk GitHub Artifact beschikbaar en wordt niet gecommit.

## 0.5.270 - 2026-07-19

- Automatische productpaginavoorcontrole toegevoegd voor aanbiedingen met status `manual-review-required` bij ToolMax en Mastertools.
- De controle werkt in `read-only-preview`: zij rapporteert HTTP-status, exacte EAN- en uitvoeringscodematch, canonieke URL, prijsindicatie, bestelbaarheid en voorraadindicatie zonder catalogus- of auditstatus te wijzigen.
- Providergebonden URL-allowlists, HTTPS-verplichting, redirectcontrole, responlimiet, timeout, retry en lage aanvraagsnelheid beschermen tegen onveilige of te zware controles.
- Aanbiederbrede noodrem toegevoegd wanneer veel pagina’s tegelijk technisch fout, onduidelijk of mogelijk vervallen lijken.
- Preview en samenvatting worden uitsluitend als tijdelijk GitHub Artifact en Actions-overzicht bewaard en nooit automatisch gecommit; een roterend zesuursvenster voorkomt dat grote wachtrijen steeds bij dezelfde kandidaten blijven steken.
- Geen prijs, voorraad, live-status, handmatige beslissing of aanbieding wordt door deze versie automatisch gewijzigd of verwijderd.

## 0.5.269 - 2026-07-19

- Quality gate aangepast voor aanbiedingen die na een handmatige productpaginacontrole terugkeren in de feed.
- Actuele feedwaarden zoals `backorder`, prijs en voorraad mogen de oudere handmatige momentopname veilig vervangen.
- Alleen aanbiedingen die nog buiten de feed vallen blijven strikt aan hun geldige `page-verified-live`-beslissing gekoppeld.
- Rapportversie wordt voortaan rechtstreeks uit `package.json` gelezen, zodat `automationVersion` niet meer achterloopt.
- Geen product wordt verwijderd of automatisch nieuw gepubliceerd.

## 0.5.268 - 2026-07-18

- Quality-gatecontrole voor handmatig geverifieerde ontbrekende aanbiedingen onafhankelijk gemaakt van de actuele rapportweergave.
- De test accepteert zowel open reviewitems als reeds naar `pageVerifiedLive` verplaatste aanbiedingen en gebruikt de persistente auditstatus als veilige terugval.
- Alle 111 handmatige beslissingen blijven strikt gevalideerd op aanbieder, EAN, uitvoeringscode, prijs, voorraadstatus en geldigheidsperiode.
- Geen catalogus-, prijs- of aanbiedingswijzigingen; deze update corrigeert uitsluitend de onterecht rode GitHub Actions-controle.

## 0.5.267 - 2026-07-18

- Laatste batch van 16 ontbrekende ToolMax-aanbiedingen handmatig op de actuele productpagina en productvermelding gecontroleerd.
- Alle 16 DeWalt- en Makita-aanbiedingen blijven live; niets is verwijderd of offline gezet.
- Vijf actuele zichtbare prijswijzigingen verwerkt: DCF102Z, 198077-8, BL1850B-10, HS6601J en UR3000.
- De ontbrekende-aanbiedingenaudit is hiermee volledig afgerond: 15 Mastertools- en 96 ToolMax-aanbiedingen zijn handmatig gecontroleerd; er blijven geen open ontbrekende aanbiedingen over.

## 0.5.266 - 2026-07-18

- Vierde batch van 20 ontbrekende ToolMax-aanbiedingen handmatig op de exacte productpagina gecontroleerd.
- Alle 20 DeWalt- en Makita-productpagina’s bestaan en blijven live; niets is verwijderd of offline gezet.
- Zes actuele zichtbare prijswijzigingen verwerkt, waaronder DCS577N-XJ+DCB546, DWS774-QS, DTD201ZJ, DTL302Z, DTW301ZJ en GA055GZ.
- Handmatige keep-live-beslissingen 14 dagen geldig gemaakt; na deze batch blijven 16 ToolMax-aanbiedingen open voor de laatste auditbatch.

## 0.5.265 - 2026-07-18

- Derde batch van 20 ontbrekende ToolMax DeWalt-aanbiedingen handmatig op de exacte productpagina gecontroleerd.
- Alle 20 productpagina’s bestaan en blijven live; niets is verwijderd of offline gezet.
- Zeven actuele zichtbare prijswijzigingen verwerkt en één verouderde ToolMax-product-URL vervangen door de actuele canonieke URL.
- Handmatige keep-live-beslissingen 14 dagen geldig gemaakt; na deze batch blijven 36 ToolMax-aanbiedingen open voor controle.

## 0.5.264 - 2026-07-18

- Tweede batch van 20 ontbrekende ToolMax-aanbiedingen handmatig op de exacte productpagina gecontroleerd.
- Alle 20 productpagina’s bestaan en blijven live; niets is verwijderd of offline gezet.
- Veertien actuele zichtbare prijswijzigingen verwerkt voor Bosch Professional- en DeWalt-aanbiedingen.
- Handmatige keep-live-beslissingen 14 dagen geldig gemaakt; na deze batch blijven 56 ToolMax-aanbiedingen open voor controle.

## 0.5.263 - 2026-07-18

- Eerste batch van 20 ontbrekende ToolMax Bosch Professional-aanbiedingen handmatig op de exacte productpagina gecontroleerd.
- Alle 20 productpagina’s bestaan en blijven live; niets is verwijderd of offline gezet.
- Actuele zichtbare prijzen overgenomen voor de gecontroleerde aanbiedingen.
- Handmatige keep-live-beslissingen 14 dagen geldig gemaakt, waarna opnieuw controle volgt wanneer de producten nog steeds buiten de feed vallen.

## 0.5.262 — Mastertools ontbrekende aanbiedingen handmatig gecontroleerd

- alle 15 Mastertools-aanbiedingen die twee opeenvolgende feedruns ontbraken zijn op de exacte productpagina gecontroleerd;
- geen van de 15 productpagina's is vervallen: alle exacte artikelcodes en EAN-koppelingen blijven geldig;
- actuele productpaginaprijzen en voorraadstatussen zijn gecontroleerd en waar nodig bijgewerkt;
- vier prijswijzigingen verwerkt: HP001GZ naar €238,99, HR2601 naar €202,99, TD003GD201 naar €483,99 en UC013GT101 naar €547,98;
- handmatige keep-live-beslissingen krijgen een geldigheid van 14 dagen en worden daarna opnieuw ter controle aangeboden wanneer de feedkoppeling niet terugkeert;
- productpaginacontrole voorkomt terugkerende meldingen, maar verwijdert of deactiveert nooit automatisch een aanbieding;
- 15 Mastertools-aanbiedingen zijn tijdelijk als `page-verified-live` geregistreerd; de 96 ToolMax-aanbiedingen blijven open voor de volgende auditbatch;
- catalogus blijft 1.224 basismodellen, 1.753 uitvoeringen en 1.919 live aanbiedingen bevatten.

## 0.5.261 — Ontbrekende feedaanbiedingen veilig controleren

- ontbrekende live aanbiedingen krijgen een persistente auditstatus over opeenvolgende volledige feedruns;
- één gemiste run wordt uitsluitend geregistreerd en verandert niets aan de live aanbieding;
- na twee opeenvolgende gemiste runs wordt handmatige broncontrole verplicht;
- aanbiedingen worden nooit automatisch verwijderd of offline gezet;
- teruggekeerde aanbiedingen worden automatisch als opgelost geregistreerd;
- stabiele status na de tweede run voorkomt onnodige commits bij iedere zesuurscontrole;
- feedworkflow commit auditstatus ook wanneer er geen prijs- of voorraadwijziging is;
- feedrapport 17 is als eerste waarneming vastgelegd: 111 aanbiedingen één keer gemist, nul automatisch verwijderd.

## 0.5.260 — Mastertools DeWalt multitools volledig afgerond

- volledige Mastertools DeWalt-multitoolcategorie gecontroleerd op exact EAN + exacte uitvoeringscode;
- zeven bestaande live uitvoeringen opnieuw tegen de exacte Leveringsomvang bevestigd;
- DCS353N-XJ toegevoegd met EAN 5035048748398 en uitsluitend de bronvermelde machine als setinhoud;
- DCS353D2-QW geblokkeerd wegens tegenstrijdige 12V/18V-accuinformatie in de Mastertools-Leveringsomvang;
- DT20715-QZ en DT20713-QZ uitgesloten als accessoires;
- catalogus telt nu 1.224 basismodellen, 1.753 uitvoeringen en 1.919 live aanbiedingen.

## 0.5.259 — Mastertools DeWalt decoupeerzagen broncontrole

- acht aangekondigde Mastertools DeWalt-decoupeerzagen opnieuw gecontroleerd op exacte EAN en volledige uitvoeringscode;
- zeven reeds gepubliceerde uitvoeringen bevestigd als exact gekoppeld en inhoudelijk gelijk aan de actuele sectie `Leveringsomvang`;
- DW331KT-QS niet gepubliceerd omdat de actuele Mastertools-productpagina geen sectie `Leveringsomvang` toont;
- titel, productafbeelding, DeWalt-fabrikantpagina en andere winkels zijn bewust niet gebruikt om Mastertools-setinhoud af te leiden;
- publieke catalogus blijft ongewijzigd op 1.224 basismodellen, 1.752 uitvoeringen en 1.918 live aanbiedingen.

## 0.5.257 — Geautoriseerde aanbieders en schone testdata

- actieve aanbiedersregistratie teruggebracht tot ToolMax en Mastertools als live partners en Gereedschapspecialist uitsluitend als review-only bron;
- oude speculatieve en demonstratie-aanbieders volledig uit actieve data, tests, bronregistraties en historische demo-inhoud verwijderd;
- historische `data/offers.json` leeggezet zodat alleen de canonieke categorie- en publicatiebestanden nog aanbiedingsdata bevatten;
- live-publicatie wordt nu geblokkeerd wanneer de aanbieder niet expliciet live én affiliate-goedgekeurd is;
- review- en publicatietests gebruiken uitsluitend de neutrale `ToolPakker Testaanbieder` en het gereserveerde domein `example.invalid`;
- geautomatiseerde aanbiedersautorisatiecontrole toegevoegd aan iedere quality gate en releasecontrole;
- publieke catalogus blijft 1.224 basismodellen, 1.752 uitvoeringen en 1.918 aanbiedingen bevatten, uitsluitend van ToolMax en Mastertools.

## 0.5.256 — Professionele reviewgoedkeuring

- review- en live-publicatievalidatie zijn expliciet van elkaar gescheiden;
- de systeembeheerde controledatum wordt pas bij daadwerkelijke goedkeuring vastgelegd en blokkeert de goedkeurknop niet langer vooraf;
- EAN, fabrikantcode, feedmatch, affiliate-status en setinhoud blijven verplicht vóór publicatie;
- review-publicatietest gebruikt de echte canonieke identiteit van de gekozen uitvoering en doorloopt alle vier reviewcontroles;
- API- en kernregressietests bewaken de volledige route van import tot live publicatie;
- publieke website, catalogus en 1.918 live aanbiedingen zijn inhoudelijk niet gewijzigd.

## 0.5.255 — Release- en overdrachtsklaar

- professioneel verkoop- en overdrachtsdossier toegevoegd onder `docs/handover/`;
- activa-, account-, commercieel-, datakamer-, due-diligence- en closingtemplates toegevoegd;
- reproduceerbaar release-manifest en SHA-256-controlesommen ingevoerd;
- handmatige/taggestuurde GitHub-workflow toegevoegd voor een overdraagbaar release-artifact;
- automatische release-readinesscontrole toegevoegd aan de quality gate;
- versie-, README-, lockfile- en changelogconsistentie wordt automatisch bewaakt;
- live websitecode, catalogus en aanbiedingen zijn inhoudelijk niet gewijzigd.

Alle betekenisvolle wijzigingen aan ToolPakker worden hier vastgelegd.

## 0.5.258 — Correcte Playwright-locatorcompositie

- laatste releaseworkflow-assertie bouwt de CTA-locator vóór `expect()` op;
- ongeldige constructie `expect(locator).getByRole()` verwijderd;
- regressiecontrole toegevoegd zodat locator-methodes niet opnieuw op assertion-objecten worden aangeroepen;
- publieke website, catalogus, feeds en geautoriseerde aanbieders zijn niet gewijzigd.

## 0.5.254 — Professionele tijdelijke feedlog-opslag

- automatische feedworkflow schrijft het downloadlog uitsluitend naar GitHub Runner Temp;
- repositorycontrole en feedworkflow spreken elkaar niet langer tegen;
- feedlog blijft bij fouten beschikbaar als tijdelijk GitHub Artifact;
- regressiecontroles voorkomen dat tijdelijke logs opnieuw onder `data/automation` terechtkomen;
- live websitecode, catalogus en aanbiedingen zijn niet gewijzigd.

## 0.5.253 — Stabiele browserfixtures en geldige selectors

- vier-itemsvergelijking gebruikt drie gelijksoortige Makita-modellen en één vaste DeWalt-uitbijter;
- uitbijtercontrole richt zich expliciet op merk en platform van de DeWalt-kaart;
- foutieve extra sluitende bracket uit de mobiele sponsored-linkselector verwijderd;
- regressiecontrole toegevoegd voor de vaste vergelijkfixture en geldige mobiele selector;
- live websitecode, catalogus en aanbiedingen zijn niet gewijzigd.

## 0.5.252 — Betrouwbare kritieke browsertests

- cookie-bannerhelper centraal gedeeld door desktop- en mobiele tests;
- cookieknop semantisch en binnen de zichtbare banner geselecteerd;
- dubbele, verborgen knop in het instellingenvenster veroorzaakt geen Playwright strict-modefout meer;
- live websitecode en catalogusinhoud zijn niet gewijzigd.

## 0.5.251 — Stable Professional Baseline

- repository gescheiden in broncode, gegenereerde output en historisch archief;
- legacy hoofddocumenten, oude patchscripts en ongebruikte styling verwijderd;
- reproduceerbare kwaliteits- en automatiseringscommando's ingevoerd;
- GitHub Actions opgesplitst in data/buildcontrole en browsertests;
- buildoutput uit Git verwijderd en volledig door Vercel gegenereerd;
- hardgecodeerde versienummers uit structurele tests verwijderd;
- professionele architectuur-, beheer-, security- en overdrachtsdocumentatie toegevoegd.
