# Roadora v6.9.0 — testrapport accounts en cloudsynchronisatie

**Testdatum:** 2 augustus 2026  
**Basis:** Roadora v6.8.5  
**Doel:** optionele accountlaag en offline-first cloudsynchronisatie zonder regressie van de lokale planner

## Automatische quality gate

Geslaagd:

- buildversie v6.9.0 in planner, PWA en service worker;
- 10 HTML-pagina’s en alle lokale verwijzingen;
- 12 browser-JavaScriptbestanden;
- 13 Vercel API-endpoints;
- JavaScript-syntax van browsercode, service worker en API’s;
- manifest, appiconen, service-workercache en CSP;
- aanwezigheid van accountinterface, synchronisatiewachtrij, conflictbeveiliging, SQL en setupdocumentatie;
- controle dat de Supabase-connectiedomeinen uitsluitend in `connect-src` zijn toegestaan.

## Lokale opslag en migratie

Geslaagd met de localStorage-fallback van `trip-db.js`:

- bestaande lokale roadtrips blijven leesbaar;
- databaseversie 2 bevat afzonderlijke stores/interfaces voor roadtrips, syncwachtrij en metadata;
- lokaal opslaan werkt wanneer cloudconfiguratie ontbreekt;
- lokale put/remove-acties sturen alleen bij lokale bron een synchronisatie-event;
- cloudpulls veroorzaken geen terugkoppellus naar de uploadwachtrij.

## Cloudmocktest

De Supabase-client is vervangen door een deterministische in-memory testclient. Geslaagd:

- zonder configuratie toont Roadora **Cloud instellen** en blijft lokale opslag werken;
- met configuratie en sessie toont Roadora **Ingelogd**;
- lokale roadtrip wordt geüpload en daarna lokaal als `synced` gemarkeerd;
- cloudroadtrip wordt naar het apparaat gedownload;
- een echte gelijktijdige wijziging overschrijft niets stil;
- de cloudversie blijft behouden en de lokale wijziging wordt als **(lokale versie)** opgeslagen;
- verwijderen maakt een cloudtombstone (`is_deleted = true`);
- handmatige synchronisatie, statusupdates en wachtrijverwerking functioneren.

## Runtimeconfiguratie-API

Geslaagd:

- zonder Vercel-variabelen: HTTP 200 met `configured: false` en lege publieke waarden;
- met geldige Project URL en publishable key: uitsluitend deze publieke waarden worden teruggegeven;
- onbekende origin wordt geweigerd met HTTP 403;
- respons gebruikt `Cache-Control: no-store`;
- er wordt geen service-role-key of databasewachtwoord gelezen of gepubliceerd.

## Databasebeveiliging

Statisch gecontroleerd:

- samengestelde primary key `(user_id, id)`;
- foreign key naar `auth.users` met cascade bij accountverwijdering;
- Row Level Security ingeschakeld en geforceerd;
- anon-rol heeft geen tabelrechten;
- authenticated heeft alleen select, insert en update;
- policies gebruiken `auth.uid() = user_id` voor lezen, toevoegen en wijzigen;
- revisienummer, inhoudshash en soft delete ondersteunen veilige synchronisatie.

## Beperkingen van deze test

Er is geen echt Supabase-productieproject of echte e-mailprovider beschikbaar in de testomgeving. Daarom moeten na configuratie nog live worden gecontroleerd:

1. ontvangst en terugkeer van de magic link;
2. dezelfde roadtrip op een echte desktop en telefoon;
3. offline wijzigen en later synchroniseren op fysieke apparaten;
4. Supabase Auth- en databasequota/logs;
5. accountverwijdering en bewaartermijnen volgens de definitieve privacyprocedure.

## Conclusie

v6.9.0 is veilig te deployen vóór cloudconfiguratie: Roadora blijft dan volledig lokaal werken. De account- en syncfuncties worden actief nadat het SQL-script is uitgevoerd en de twee publieke Supabase-variabelen in Vercel zijn ingesteld.
