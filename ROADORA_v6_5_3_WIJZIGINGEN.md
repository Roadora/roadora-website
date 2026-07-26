# Roadora v6.5.3 — structurele compacte stopkaarten

- Nieuwe fysieke CSS- en JavaScriptbestanden zodat een oude browsercache de patch niet kan overslaan.
- Stopinformatie en acties zitten niet meer in concurrerende gridkolommen.
- Tijd staat in een vaste kolom; alle inhoud gebruikt de volledige resterende breedte.
- Kaart, Vervang en Bewerken staan altijd op een afzonderlijke regel.
- Routeafwijking staat als korte badge, bijvoorbeeld `23,1 km buiten route`.
- De dubbele aankomsttijd is uit de detailtekst verwijderd; de tijd blijft links zichtbaar.
- Eerder opgeslagen live stops worden bij het renderen opnieuw compact opgebouwd uit hun metadata.
- Kleine zichtbare buildversie in de footer en interne `window.ROADORA_BUILD` voor cachecontrole.
- v6.5.2 blijft ongewijzigd beschikbaar als fallback.
