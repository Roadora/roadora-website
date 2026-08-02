# Roadora v6.9.0 — Supabase instellen

Roadora blijft zonder cloudconfiguratie volledig lokaal werken. Na onderstaande configuratie worden roadtrips automatisch tussen desktop en mobiele app gesynchroniseerd.

## 1. Maak een Supabase-project

Maak een nieuw Supabase-project voor Roadora. Gebruik voor productie een sterk databasewachtwoord en bewaar dit buiten de repository.

## 2. Installeer de database

Open in Supabase **SQL Editor**, plak de volledige inhoud van:

`supabase/roadora_v6_9_0.sql`

Voer het script één keer uit. Het script maakt de tabel, index, update-trigger en Row Level Security-policies aan.

Controleer daarna in **Table Editor** dat `roadora_trips` bestaat en dat RLS is ingeschakeld.

## 3. Stel e-mailinloggen in

Ga naar **Authentication → URL Configuration**.

Gebruik als Site URL:

`https://www.roadora.eu`

Voeg als Redirect URLs toe:

- `https://www.roadora.eu/**`
- `https://roadora.eu/**`
- eventueel je eigen Vercel-previewdomein tijdens testen

Roadora gebruikt een magic link per e-mail. De gebruiker hoeft geen wachtwoord in Roadora op te slaan.

## 4. Voeg Vercel Environment Variables toe

Open Vercel → Roadora → Settings → Environment Variables.

Voeg toe voor Production, Preview en Development:

- `SUPABASE_URL` — Project URL uit Supabase Project Settings → API
- `SUPABASE_PUBLISHABLE_KEY` — publishable key uit Supabase Project Settings → API Keys

Oudere Supabase-projecten kunnen nog een `anon` key tonen. Roadora ondersteunt tijdelijk ook `SUPABASE_ANON_KEY`, maar de publishable key heeft de voorkeur.

**Nooit toevoegen aan de browserconfiguratie:** `service_role`, databasewachtwoord of andere geheime sleutels.

Na het opslaan moet Vercel opnieuw deployen.

## 5. Live test

1. Open Roadora op desktop.
2. Ga naar **Meer → Roadora-account**.
3. Vul je e-mailadres in en kies **Stuur inloglink**.
4. Open de link uit de e-mail.
5. Bewaar een roadtrip en kies eventueel **Nu synchroniseren**.
6. Open Roadora op je telefoon, log in met hetzelfde e-mailadres en controleer of dezelfde roadtrip verschijnt.
7. Wijzig de naam op de telefoon en controleer de wijziging daarna op desktop.
8. Zet één apparaat kort offline, wijzig een roadtrip, ga weer online en controleer de automatische synchronisatie.

## Synchronisatiegedrag

- Iedere wijziging wordt eerst lokaal opgeslagen.
- Zonder internet komt de wijziging in een lokale wachtrij.
- Na herstel van internet probeert Roadora automatisch opnieuw te synchroniseren.
- Roadora synchroniseert bij inloggen, lokale wijzigingen, terugkeren naar de app, online komen en periodiek tijdens actief gebruik.
- Bij gelijktijdige wijzigingen wordt niets stilzwijgend overschreven. Roadora bewaart de cloudversie én maakt een aparte `lokale versie` aan.
- Verwijderen gebruikt een cloudtombstone, zodat de verwijdering ook op andere apparaten wordt doorgevoerd.

## Problemen oplossen

### Cloud instellen blijft zichtbaar

Controleer `/api/app-config` op de productiedomain. Het antwoord moet `configured: true` bevatten. De publishable key is openbaar bedoeld; een `service_role`-key mag daar nooit verschijnen.

### Inloglink keert niet terug naar Roadora

Controleer de Site URL en Redirect URLs in Supabase Authentication.

### Roadtrips verschijnen niet op het andere apparaat

- controleer of beide apparaten hetzelfde e-mailadres tonen;
- kies **Nu synchroniseren**;
- controleer internetverbinding;
- controleer in Supabase of RLS aanstaat en de drie policies bestaan;
- controleer de browserconsole en Vercel-deploymentlogs.
