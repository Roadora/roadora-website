Roadora Beta Landing v1

Doel:
- Tijdelijk de publieke Roadora-app verbergen.
- Bezoekers zien alleen een nette besloten-beta pagina.
- Geen analytics, geen cookies, geen app-code.
- robots.txt en Vercel header zetten alles op noindex/nofollow/noarchive.

Gebruik:
1. Maak lokaal/GitHub eerst een backup of bewaar de laatste Roadora fallback-zip.
2. Vervang tijdelijk de publieke repo-inhoud door deze bestanden:
   - index.html
   - robots.txt
   - vercel.json
3. Commit/push naar GitHub.
4. Vercel deployt automatisch.
5. Test je Roadora-url in incognito.

Terug naar de echte app:
- Upload later de laatste stabiele Roadora fallback-zip terug naar GitHub.
