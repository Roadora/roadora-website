# Roadora v6.6.2 — handmatig zoeken en Rondreis

## Eten: Nu nodig

- Eten wordt niet meer automatisch over de volledige dagroute verspreid.
- De gebruiker kiest zelf Restaurant, Fastfood, Lunch, Koffie of Supermarkt.
- Pas na klikken op zoeken gebruikt Roadora de actuele locatie.
- Roadora vraagt 10–15 opties op binnen circa 10 km.
- Resultaten tonen een directe knop **Navigeer** en kunnen optioneel aan de actieve reisdag worden toegevoegd.

## Uitjes: volledig handmatig zoeken

De gebruiker kiest zelf waar Roadora zoekt:

- huidige locatie;
- plaats of exact adres;
- zelfgekozen kaartpunt;
- zelfgekozen routepunt.

Beschikbare zoekstralen: 10, 25 en 50 km. Roadora voegt nooit automatisch een uitje toe.

## Zelf een plek toevoegen

Nieuwe actie **Zelf een plek toevoegen** voor:

- Camperplek / overnachting;
- Hotel / overnachting;
- Eten;
- Uitje;
- Tussenstop;
- Anders.

De locatie kan worden ingevoerd als adres, Google Maps-link, coördinaten of via een pin op de kaart. Handmatig toegevoegde plekken krijgen `source: user`, worden opgeslagen in de roadtrip en gaan mee in routeplanning en Google Maps-export. Een plek buiten de route wordt niet geblokkeerd; Roadora toont eerst een waarschuwing.

## Enkele reis / Rondreis

- Nieuwe keuze **Enkele reis** of **Rondreis**.
- Bij Rondreis voegt de gebruiker zelf tussenbestemmingen toe, in eigen volgorde.
- De knop **Eindig bij vertrekpunt** kopieert het vertrekpunt alleen na een bewuste klik.
- Roadora berekent de route via de opgegeven tussenbestemmingen, maar stelt zelf geen landen, regio’s, dagen of stops voor.

## Meerdaagse koppeling

- Een overnachtingsplek wordt niet automatisch als vertrekpunt van de volgende dag ingevuld.
- Bij Dag 2 en later verschijnt een bewuste actie om de vorige overnachtingsplek als vertrekpunt te gebruiken.
- Google Maps gebruikt die overnachtingsplek alleen als dagstart nadat de gebruiker deze koppeling heeft bevestigd.

## Technisch

- Nieuwe assets: `webplanner-v662.js` en `webplanner-v662.css`.
- Food API gebruikt één actuele locatie, standaard 10 km, maximaal 15 resultaten in de interface.
- Outings API gebruikt één door de gebruiker gekozen zoekcentrum, 10–50 km en maximaal 20 resultaten.
- Bestaande route-, opslag-, beveiligings- en Maps-logica uit v6.6.1 blijft behouden.
