#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import json, re, struct, subprocess, sys

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

# PWA metadata and build versions.
pwa_js=(ROOT/'js/pwa.js').read_text(encoding='utf-8') if (ROOT/'js/pwa.js').exists() else ''
sw_js=(ROOT/'sw.js').read_text(encoding='utf-8') if (ROOT/'sw.js').exists() else ''
pwa_build=re.search(r"const BUILD = '([^']+)'",pwa_js)
sw_build=re.search(r"const BUILD = '([^']+)'",sw_js)
app_values=[values[0], pwa_build.group(1) if pwa_build else None, sw_build.group(1) if sw_build else None]
if len(set(app_values))!=1: errors.append(f'PWA-buildversies verschillen: planner/pwa/service-worker = {app_values}')

required_pwa_files=['manifest.webmanifest','sw.js','offline.html','js/pwa.js','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/icon-maskable-192.png','assets/icons/icon-maskable-512.png','assets/icons/apple-touch-icon.png']
for name in required_pwa_files:
    if not (ROOT/name).exists(): errors.append(f'Ontbrekend PWA-bestand: {name}')

for html in html_files:
    source=html.read_text(encoding='utf-8')
    if html.name!='offline.html':
        for snippet,label in [
            ('manifest.webmanifest','manifestkoppeling'),
            ('apple-touch-icon.png','Apple touch icon'),
            ('js/pwa.js','PWA-registratie'),
            ('viewport-fit=cover','safe-area viewport'),
        ]:
            if snippet not in source: errors.append(f'{html.name} mist {label}')
if 'id="installRoadoraApp"' not in index: errors.append('index.html mist installatieknop')

# Manifest validation and PNG dimensions without third-party dependencies.
def png_size(path):
    with path.open('rb') as handle:
        header=handle.read(24)
    if len(header)<24 or header[:8]!=b'\x89PNG\r\n\x1a\n': return None
    return struct.unpack('>II',header[16:24])
try:
    manifest=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
    for key in ['id','name','short_name','start_url','scope','display','background_color','theme_color','icons']:
        if not manifest.get(key): errors.append(f'manifest.webmanifest mist {key}')
    if manifest.get('display')!='standalone': errors.append('manifest.webmanifest gebruikt niet display=standalone')
    if manifest.get('scope')!='/': errors.append('manifest.webmanifest scope is niet /')
    declared={(item.get('src'),item.get('sizes'),item.get('purpose','any')) for item in manifest.get('icons',[]) if isinstance(item,dict)}
    for src,size,purpose in [
        ('/assets/icons/icon-192.png','192x192','any'),
        ('/assets/icons/icon-512.png','512x512','any'),
        ('/assets/icons/icon-maskable-192.png','192x192','maskable'),
        ('/assets/icons/icon-maskable-512.png','512x512','maskable'),
    ]:
        if (src,size,purpose) not in declared: errors.append(f'manifest mist icoon {src} ({purpose})')
        path=ROOT/src.lstrip('/')
        if path.exists():
            expected=tuple(map(int,size.split('x')))
            actual=png_size(path)
            if actual!=expected: errors.append(f'{src} heeft afmeting {actual}, verwacht {expected}')
except Exception as exc:
    errors.append(f'manifest.webmanifest ongeldig: {exc}')

for snippet,label in [
    ("navigator.serviceWorker.register('/sw.js'",'service-workerregistratie'),
    ('beforeinstallprompt','installatieprompt'),
    ('controllerchange','gecontroleerde appupdate'),
]:
    if snippet not in pwa_js: errors.append(f'js/pwa.js mist {label}')
for snippet,label in [
    ("url.pathname.startsWith('/api/')",'network-only API-regel'),
    ("caches.match('/offline.html')",'offline fallback'),
    ("type === 'SKIP_WAITING'",'bevestigde updateactivatie'),
    ('roadora-app-${BUILD}','versiegebonden appcache'),
]:
    if snippet not in sw_js: errors.append(f'sw.js mist {label}')

# Kaartpunt/routepunt regression checks.
for required_snippet, label in [
    ('bindMapPickCapture();', 'robuuste kaartklik-capture'),
    ("requestAnimationFrame(()=>beginMapPick", 'direct starten van kaartpunt/routepunt'),
    ("data-cancel-map-pick", 'annuleren van kaartselectie'),
    ("nearestRouteProjection(clicked.lat,clicked.lng)", 'routepunt vastklikken op route'),
]:
    if required_snippet not in js: errors.append(f'webplanner.js mist {label}')
if 'map-pick-banner' not in (ROOT/'css/webplanner.css').read_text(encoding='utf-8'):
    errors.append('webplanner.css mist zichtbare kaartselectiebanner')

# Syntax-check all JavaScript using Node.
for file in sorted([*ROOT.glob('js/*.js'),*ROOT.glob('api/*.js'),ROOT/'sw.js']):
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
    sw_headers=next((item.get('headers',[]) for item in vercel.get('headers',[]) if item.get('source')=='/sw.js'),[])
    sw_header_text=json.dumps(sw_headers)
    if 'no-cache' not in sw_header_text or 'Service-Worker-Allowed' not in sw_header_text:
        errors.append('vercel.json mist veilige sw.js cache/scope headers')
    manifest_headers=next((item.get('headers',[]) for item in vercel.get('headers',[]) if item.get('source')=='/manifest.webmanifest'),[])
    if 'application/manifest+json' not in json.dumps(manifest_headers):
        errors.append('vercel.json mist manifest content-type')
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
