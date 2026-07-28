# Roadora v6.7.0 — testrapport

## Browserflow

Geslaagd:

- Rondreis met handmatige tussenbestemmingen en gewijzigde volgorde.
- Routeaanvraag behoudt de gekozen tussenbestemmingsvolgorde.
- Eigen vertrektijd, gewenste aankomsttijd en aankomsttijdvak per dag.
- Haalbaarheidsmelding op basis van berekende en gewenste aankomst.
- Handmatige camperplek via volledige Google Maps-link.
- Nieuwe reisdag wordt niet automatisch gekoppeld.
- Expliciet koppelen en ontkoppelen van vorige overnachting.
- Handmatig hotel als eindpunt en expliciete verblijfsdag.
- Verblijfsdag opent geen Google Maps-dagroute.
- Opslaan, nieuwe roadtrip starten en opnieuw openen met drie dagen.
- Daginstellingen blijven na heropenen behouden.
- Handmatige invoer blijft veilig als tekst (XSS-regressietest).
- Geen horizontale overflow op 320, 360, 390, 430, 768 en 1440 pixels.

## Extra regressietests

Geslaagd:

- Verwijderen van een middelste reisdag schuift de latere dag, tijden en instellingen correct door.
- Een gewijzigd hotel/camperplek werkt alleen een bewust gekoppelde volgende dag bij.
- Een normale nieuw ingevoegde reisdag blijft ongekoppeld.
- Dag 2 Google Maps-export gebruikt de coördinaten van de bewust gekoppelde vorige overnachting.
- Korte Google Maps-link gebruikt de resolver en levert coördinaten terug.

## API- en veiligheidschecks

Geslaagd:

- Niet-Google-URL wordt geweigerd.
- Volledige Google Maps-link met coördinaten wordt direct opgelost.
- Korte Google Maps-link met veilige redirect wordt opgelost.
- Verkeerde HTTP-methode wordt geweigerd.
- Origincontrole en toegestane Google-hosts zijn actief.

## Statische controles

- Alle productie-JavaScript- en API-bestanden: syntax correct.
- `index.html`: geen dubbele ID's.
- Alle lokale assets waarnaar `index.html` verwijst bestaan.
- Nieuwe buildreferenties wijzen naar `webplanner-v670.js` en `webplanner-v670.css`.

## Nog eenmaal live controleren na Vercel-upload

- Een echte korte Google Maps-link op mobiel.
- Een echte Google/ORS-route met meerdere rondreis-tussenbestemmingen.
- Google Maps-export van Dag 2 vanaf een zelf toegevoegde overnachtingsplek.
