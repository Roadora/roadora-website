# Testrapport v6.8.2

## Doel

Regressietest voor de mobiele invoer-, laag- en scrollproblemen uit v6.8.1.

## Gecontroleerd

- Scrim staat binnen `main.shell` en onder de actieve sheet.
- Vertrek- en bestemmingsveld zijn hit-testbaar.
- Routepaneel heeft een interne scrollcontainer.
- Uitgebreide sheet overlapt topbar en bottom navigation niet.
- Focus op invoervelden vergroot de sheet en houdt het veld zichtbaar.
- Nieuwe roadtrip opent Route instellen met scrollpositie nul.
- Route, Stops, Planning en Meer behouden dezelfde shellcontroller.
- Desktopregels buiten het mobiele breakpoint zijn niet aangepast.
- JavaScript-syntax en volledige repository-quality-gate zijn groen.
