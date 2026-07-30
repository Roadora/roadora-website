#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import json, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
errors=[]
notes=[]

class RefParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.ids=[]
    def handle_starttag(self, tag, attrs):
        data=dict(attrs)
        if 'id' in data: self.ids.append(data['id'])
        for key in ('href','src'):
            value=data.get(key,'')
            if value: self.refs.append((tag,key,value))

def is_local(value):
    return not (value.startswith(('http://','https://','mailto:','tel:','data:','#','//')))

html_files=sorted(ROOT.glob('*.html'))
if not html_files: errors.append('Geen HTML-bestanden gevonden')
for html in html_files:
    parser=RefParser(); parser.feed(html.read_text(encoding='utf-8'))
    dup={x for x in parser.ids if parser.ids.count(x)>1}
    if dup: errors.append(f'{html.name}: dubbele id(s): {sorted(dup)}')
    for _,_,ref in parser.refs:
        if not is_local(ref): continue
        clean=ref.split('?',1)[0].split('#',1)[0]
        if not clean or clean=='/': continue
        target=(ROOT/clean.lstrip('/')).resolve()
        try: target.relative_to(ROOT.resolve())
        except ValueError:
            errors.append(f'{html.name}: onveilige lokale verwijzing {ref}'); continue
        if not target.exists(): errors.append(f'{html.name}: ontbrekend bestand {ref}')

# Active asset references must be stable and unversioned.
index=(ROOT/'index.html').read_text(encoding='utf-8')
required=['css/webplanner.css','js/webplanner.js','js/trip-db.js','js/leaflet-fallback.js']
for ref in required:
    if ref not in index: errors.append(f'index.html mist actieve verwijzing: {ref}')
if re.search(r'(webplanner|trip-db|leaflet-fallback)-v\d+', index):
    errors.append('index.html verwijst nog naar versiegebonden productie-assets')

# Version metadata must agree.
body_build=re.search(r'data-roadora-build="([^"]+)"',index)
footer_build=re.search(r'id="roadoraBuild"[^>]*>([^<]+)<',index)
js=(ROOT/'js/webplanner.js').read_text(encoding='utf-8')
js_build=re.search(r"ROADORA_BUILD='([^']+)'",js)
values=[m.group(1).strip() if m else None for m in (body_build,footer_build,js_build)]
if len(set(values))!=1: errors.append(f'Buildversies verschillen: HTML body/footer/JS = {values}')
else: notes.append(f'Buildversie: {values[0]}')

# Syntax-check all JavaScript using Node.
for file in sorted([*ROOT.glob('js/*.js'),*ROOT.glob('api/*.js')]):
    result=subprocess.run(['node','--check',str(file)],capture_output=True,text=True)
    if result.returncode:
        errors.append(f'JavaScript-syntaxfout in {file.relative_to(ROOT)}: {result.stderr.strip()}')

# Ensure no obsolete bundles, patch reports or abandoned planner modules remain.
obsolete_patterns = [
    'css/webplanner-v*.css',
    'js/webplanner-v*.js',
    'js/trip-db-v*.js',
    'js/leaflet-fallback-v*.js',
    'css/v*-*.css',
    'README_UPDATE_*.md',
    'ROADORA_v*_WIJZIGINGEN.md',
    'ROADORA_v*_TESTRAPPORT.md',
    'ROADORA_V*_NOTES.md',
    'ROADORA_v*_NOTES.md',
    '**/*.bak',
]
obsolete = []
for pattern in obsolete_patterns:
    obsolete.extend(ROOT.glob(pattern))

legacy_files = [
    'css/compact-columns.css',
    'css/product-ui.css',
    'css/real-map.css',
    'css/refinement.css',
    'js/app.js',
    'js/planner.js',
    'js/real-map.js',
    'js/recommendations.js',
    'js/walkthrough.js',
    'assets/cta-road.svg',
    'assets/hero-road.svg',
    'assets/map-pattern.svg',
    'assets/roadtrip-card.svg',
    'assets/route-illustration.svg',
    'roadora-sitemap.xml',
]
obsolete.extend(ROOT / name for name in legacy_files if (ROOT / name).exists())
if obsolete:
    unique = sorted({p.relative_to(ROOT) for p in obsolete}, key=str)
    errors.append('Historische of ongebruikte productiebestanden gevonden: ' + ', '.join(map(str, unique)))

robots = (ROOT / 'robots.txt').read_text(encoding='utf-8')
if 'https://www.roadora.eu/sitemap.xml' not in robots:
    errors.append('robots.txt verwijst niet naar de actieve sitemap.xml')
if (ROOT / 'roadora-sitemap.xml').exists():
    errors.append('Dubbele oude sitemap gevonden: roadora-sitemap.xml')

# Required endpoints.
for endpoint in ['route.js','geocode.js','google-hotels.js','google-camperplaces.js','google-food.js','google-outings.js','google-place-search.js','google-fuel.js','google-charging.js','google-wc.js','google-photo.js','resolve-map-link.js']:
    if not (ROOT/'api'/endpoint).exists(): errors.append(f'Ontbrekend API-endpoint: api/{endpoint}')

# Basic deployment/security checks.
try:
    vercel=json.loads((ROOT/'vercel.json').read_text(encoding='utf-8'))
    text=json.dumps(vercel)
    for header in ['Content-Security-Policy','Referrer-Policy','X-Content-Type-Options','Permissions-Policy']:
        if header not in text: errors.append(f'vercel.json mist beveiligingsheader: {header}')
except Exception as exc:
    errors.append(f'vercel.json ongeldig: {exc}')

# No absolute local filesystem paths or accidental ToolPakker references.
for file in ROOT.rglob('*'):
    if not file.is_file() or file.suffix.lower() not in {'.html','.css','.js','.md','.json','.txt','.xml'}: continue
    data=file.read_text(encoding='utf-8',errors='ignore')
    if '/mnt/data/' in data or 'C:\\' in data: errors.append(f'Lokale ontwikkelpad gevonden in {file.relative_to(ROOT)}')
    if re.search(r'\btoolpakker\b',data,re.I): errors.append(f'ToolPakker-verwijzing gevonden in {file.relative_to(ROOT)}')

if errors:
    print('ROADORA QUALITY GATE: MISLUKT')
    for error in errors: print(' -',error)
    sys.exit(1)
print('ROADORA QUALITY GATE: GROEN')
for note in notes: print(' -',note)
print(f' - {len(html_files)} HTML-pagina’s gecontroleerd')
print(f' - {len(list(ROOT.glob("js/*.js")))} browser-JavaScriptbestanden gecontroleerd')
print(f' - {len(list(ROOT.glob("api/*.js")))} API-endpoints gecontroleerd')
