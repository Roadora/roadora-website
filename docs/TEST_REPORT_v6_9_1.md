# Roadora v6.9.1 — Vercel Hobby deploymentfix

## Aanleiding

Vercel Hobby staat bij een project met losse bestanden in `api/` maximaal 12 Vercel Functions per deployment toe. v6.9.0 bevatte 13 functies doordat `api/app-config.js` als extra endpoint was toegevoegd.

## Oplossing

- `api/app-config.js` verwijderd.
- Publieke Supabase-configuratie samengevoegd met `api/geocode.js` via `?mode=app-config`.
- `js/cloud-sync.js` gebruikt het nieuwe gecombineerde endpoint.
- Quality gate controleert voortaan hard dat `api/` exact 12 functies bevat.

## Resultaten

- 12 Vercel Functions.
- Account- en cloudfunctionaliteit blijft gelijk.
- Google-geocoding blijft via hetzelfde endpoint werken.
- Publieke Supabase-configuratie retourneert uitsluitend URL en publishable key.
- Quality gate groen.
- JavaScript-syntax groen.

## Opmerking

De Vercel-melding over ESM dat naar CommonJS wordt gecompileerd is een waarschuwing en niet de oorzaak van de buildfout.
