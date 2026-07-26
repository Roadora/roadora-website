# Roadora v6.5.4 — Quality & Security Gate

- Opgeslagen DOM-XSS via vertrekpunt/bestemming gerepareerd; dagoverzicht wordt met `textContent` opgebouwd.
- Dynamische Leaflet-tooltips en fotolinks extra afgeschermd.
- Content Security Policy en aanvullende beveiligingsheaders toegevoegd via `vercel.json`.
- Basis origincontrole, verzoeklimieten en in-memory rate limiting toegevoegd aan alle API-proxy's.
- Google Places FieldMasks voor Hotels en Camperplekken uitgebreid met foto's, website, telefoon, openingstijden en samenvatting.
- Verlagen van het aantal reisdagen vraagt bevestiging en verwijdert verborgen latere dagen definitief.
- Oude snapshots met verborgen dagen worden bij openen opgeschoond.
- Tijdgebonden openingstekst wordt getoond als “bij laatste controle” en niet meer als blijvend “nu open”.
- 320px-header-overflow opgelost.
- Toegankelijke labels toegevoegd voor volwassenen en kinderen.
- Leaflet CDN-bestanden voorzien van officiële SRI-controles en een tweede gecontroleerde CDN-fallback.
- Nieuwe fysieke v6.5.4 assetnamen tegen oude browsercache.
- Oude ongebruikte plannerassets en dubbele sitemap verwijderd.
