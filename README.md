# Roadora v6.9.0 — Accounts en cloudsynchronisatie

Roadora v6.9.0 voegt een optioneel Roadora-account toe. Zonder configuratie en zonder login blijft de volledige planner lokaal werken zoals in v6.8.5. Na koppeling met Supabase worden roadtrips automatisch tussen desktop, telefoon en tablet gesynchroniseerd.

## Nieuw

- Wachtwoordloos inloggen via een beveiligde e-maillink.
- Lokale opslag blijft altijd de eerste opslaglaag en werkt offline.
- Automatische synchronisatie bij bewaren, inloggen, online komen en terugkeren naar de app.
- Lokale wachtrij voor wijzigingen zonder internet.
- Cloudstatus per roadtrip: alleen lokaal, wachtend of gesynchroniseerd.
- Handmatige knop **Nu synchroniseren**.
- Veilige Row Level Security: iedere gebruiker ziet alleen eigen roadtrips.
- Conflictbeveiliging: bij gelijktijdige wijzigingen blijven beide versies bewaard.
- Soft delete/tombstone zodat verwijderen op andere apparaten wordt doorgevoerd.
- Publieke runtimeconfiguratie via `/api/app-config`; er komt geen geheime sleutel in de repository.
- Privacy- en voorwaardenpagina bijgewerkt voor account- en cloudgebruik.

## Belangrijk

De update is veilig te deployen vóór Supabase is ingesteld. Roadora toont dan **Cloud instellen** en blijft lokaal functioneren.

Voor activatie van accounts en cloud volg je:

`docs/SUPABASE_SETUP_v6_9_0.md`

Voer daarna het SQL-bestand uit:

`supabase/roadora_v6_9_0.sql`

## Installatie

Pak de compacte update uit in de hoofdmap van de Roadora-repository, vervang bestaande bestanden, commit en push via GitHub Desktop. Configureer daarna Supabase en de twee Vercel Environment Variables volgens het setupdocument.
