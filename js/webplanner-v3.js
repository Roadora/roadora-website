const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
function todayISO(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function hasRoute(){ return ['google','ors','external-route'].includes(state.routeSource) && Array.isArray(routeCoords) && routeCoords.length > 1; }
function effectiveRangeKm(){ if(Number(state.range)>0) return Number(state.range); if(state.vehicle==='electric') return 325; if(state.vehicle==='camper') return 500; if(state.vehicle==='bus') return 600; if(state.vehicle==='car') return 650; return 650; }
const state = {
  origin:'', destination:'', date:todayISO(), depart:'', arrival:'16:30 - 18:00', days:1,
  adults:2, children:0, pet:'none', vehicle:'', range:0, plug:'CCS', maxDetour:20, activeDay:1, view:'all', category:'', suggestions:false, activeStop:null,
  routeSource:'empty', routeDistanceKm:0, routeDurationMin:0, routeZones:[], placeStatus:{}
};
const editingPlanRows = new Set();
let routeCoords = [];
let markerData = [];
const recs = [
  ['Hotels rond je overnachting','Overnachten rond je stopmoment · parkeren · weinig omrijden'],
  ['Restaurants rond je stopmoment','Dicht bij route · parkeren · snel verder'],
  ['Laden of tanken','Binnen jouw rijbereik · combineren met pauze of lunch'],
  ['Uitjes en korte stops','Korte wandeling · speeltuin · uitzichtpunt · rustig aankomen'],
  ['WC en pauzeplekken','Praktisch onderweg · koffie · parkeren · snel verder'],
  ['Camper/parkeren','Ruime plekken · makkelijk keren · geschikt voor langere voertuigen']
];
const stops = {
  hotels:[
    ['Hotel Alpenblick','Beste match · parkeren · +8 min omrijden'],
    ['Gasthof Route Süd','Goed alternatief · parkeren · +5 min omrijden'],
    ['City Hotel Ulm','Past deels · snel bereikbaar · +3 min omrijden'],
    ['Hotel Am Park','Rustige locatie · ontbijt · +11 min omrijden'],
    ['Familiehotel Tirol','Ruime kamers · laadpunt dichtbij · +14 min omrijden'],
    ['Routehotel Donau','Parkeren · ontbijt mogelijk · +6 min omrijden'],
    ['Hotel Waldruhe','Rustige ligging · goed bereikbaar · +12 min omrijden'],
    ['Aparthotel Zuid-Duitsland','Ruime kamer · keukenhoek · rustig gelegen'],
    ['Hotel bij afrit A8','Snel bereikbaar · ontbijt · +4 min omrijden'],
    ['Pension Alpenroute','Eenvoudig · ontbijt mogelijk · +9 min omrijden'],
    ['Hotel met laadpunt','Laadpunt dichtbij · parkeren · +10 min omrijden'],
    ['Familie Gasthof','Restaurant aanwezig · +7 min omrijden']
  ],
  restaurants:[
    ['Raststätte Frankenhöhe','Lunch langs route · WC · parkeren'],
    ['Trattoria Al Lago','Italiaans · geschikt voor gezin · terras'],
    ['Bistro Route Süd','Korte omweg · terras · parkeren'],
    ['Gasthof Waldblick','Rustige lunchplek · +7 min omrijden'],
    ['Familierestaurant A8','Kinderstoelen · snelle bediening · +5 min'],
    ['Autohof Restaurant','Ruim parkeren · WC · tanken mogelijk'],
    ['Lunch bij stadspark','Korte wandeling erbij · kindvriendelijk'],
    ['Pizzeria langs route','Snel eten · geschikt voor kinderen'],
    ['Café bij laadplein','Koffie · broodjes · laadpunt naast de deur'],
    ['Restaurant Overnachten rond','Handig rond aankomst · parkeren bij deur']
  ],
  laden:[
    ['IONITY Ulm-West','Snelladen · lunch dichtbij · binnen rijbereik'],
    ['Fastned Augsburg','Snelladen · WC · koffie'],
    ['EnBW Park','Laadplein · meerdere punten · weinig omrijden'],
    ['Hotelcharger Alpenblick','Laadpunt bij hotel · handig bij overnachting'],
    ['Aral Pulse Autohof','Snelladen · tanken · restaurant'],
    ['Tesla Supercharger route','Snel laden · eten dichtbij'],
    ['ChargePoint centrum','Laadpunt + korte wandeling'],
    ['Laadplein rond overnachting','Goed moment vóór inchecken'],
    ['Shell Recharge A8','Laadstop combineren met WC en koffie'],
    ['Snellader bij outlet','Laden + korte pauze of uitje']
  ],
  tanken:[
    ['Shell Route Süd','Langs route · weinig omrijden'],
    ['Aral Autohof','Ruim parkeren · WC'],
    ['TotalEnergies A8','Goede tankstop voor je overnachting'],
    ['OMV Tirol','Voor aankomst bij je overnachting'],
    ['Esso Raststätte','Tanken · koffie · snel verder'],
    ['BP Autohof Zuid','Ruime pomp · restaurant naast station'],
    ['Avia Routepunt','Goed alternatief · +4 min omrijden'],
    ['Tankstation bij overnachting','Handig voor vertrek volgende dag'],
    ['Shell grensroute','Goed moment vóór grensovergang'],
    ['Total Truckstop','Ruim parkeren · camper/bus geschikt']
  ],
  uitjes:[
    ['Korte wandeling Donau','Rustige stop · korte wandeling'],
    ['Speeltuin stadspark','Korte pauze · 15 min'],
    ['Uitzichtpunt Alpenroute','Korte foto-stop · weinig omrijden'],
    ['Zwembad bij overnachting','Voor avond na aankomst'],
    ['Historisch centrum Ulm','Korte wandeling · eten dichtbij'],
    ['Natuurpad langs route','Even bewegen · korte stop'],
    ['Outlet stop','Korte tussenstop · parkeren makkelijk'],
    ['Meer bij overnachting','Rustig aankomen · wandelen'],
    ['Kindermuseum omgeving','Voor langere pauze of vrije dag'],
    ['Panorama parkeerplaats','Foto-stop · 20 minuten']
  ],
  wc:[
    ['Raststätte Keulen Süd','WC · koffie · weinig omrijden'],
    ['Autohof Ulm','WC · parkeren · eten'],
    ['Pauzeplek A8','Snel en praktisch'],
    ['Servicepunt rond overnachting','Vlak voor aankomst'],
    ['Tankstation met WC','Direct langs route · korte stop'],
    ['Familie pauzeplek','WC · speeltuin · picknicktafel'],
    ['Laadplein met sanitair','WC tijdens laden'],
    ['Restaurantstop met WC','Lunch combineren met pauze'],
    ['Parkeerplaats met voorzieningen','Snel uitstappen · korte pauze'],
    ['Autohof grensroute','WC · tanken · koffie']
  ]
};
const cats = [['hotels','Hotels'],['restaurants','Restaurants'],['laden','Laden'],['tanken','Tanken'],['uitjes','Uitjes'],['wc','WC']];
const categorySpecs = {
  hotels: {
    singular:'hotel', action:'Bekijk hotel', type:'overnachten rond je stopmoment',
    recommended:'Aanbevolen overnachtingen rond je stopmoment', all:'Alle overnachtingen rond je stopmoment',
    sort:'Beste match op route, tijdvenster en weinig omrijden',
    match:['Overnachten rond', 'Weinig omrijden', 'Past bij route'],
    why:['Binnen je gewenste aankomsttijd', 'Past bij je reisprofiel', 'Logisch vanaf de route']
  },
  restaurants: {
    singular:'restaurant', action:'Bekijk locatie', type:'restaurant langs je route',
    recommended:'Aanbevolen restaurants rond je pauzes', all:'Alle restaurants langs je route',
    sort:'Beste match op lunchmoment, route en weinig omrijden',
    match:['Lunchmoment', 'Route', 'Weinig omrijden'],
    why:['Past rond je lunch- of aankomstmoment', 'Praktisch met parkeren en WC', 'Niet te ver van de route']
  },
  laden: {
    singular:'laadpunt', action:'Bekijk locatie', type:'laadstop binnen je rijbereik',
    recommended:'5–10 laadopties rond je laadmoment', all:'Alle laadpunten langs je route',
    sort:'Beste match op rijbereik, stekker, voorzieningen en omrijtijd',
    match:['Rijbereik', 'Stekker', 'Voorzieningen'],
    why:['Past binnen je opgegeven rijbereik', 'Goed moment in je dagplanning', 'Te combineren met eten of WC']
  },
  tanken: {
    singular:'tankstation', action:'Bekijk locatie', type:'tankstop langs je route',
    recommended:'5–10 tankstations rond je tankmoment', all:'Alle tankstations langs je route',
    sort:'Beste match op rijbereik, voorzieningen en weinig omrijden',
    match:['Rijbereik', 'WC/koffie', 'Weinig omrijden'],
    why:['Past bij je tank-/rijbereik', 'Handig rond pauze of overnachting', 'Snel bereikbaar vanaf de route']
  },
  uitjes: {
    singular:'uitje', action:'Bekijk locatie', type:'uitje of korte stop onderweg',
    recommended:'Aanbevolen uitjes en korte stops', all:'Alle uitjes en korte stops',
    sort:'Beste match op tijd, route en afstand vanaf route',
    match:['Korte stop', 'Route', 'Rustmoment'],
    why:['Geschikt als korte onderbreking', 'Past bij je reisgezelschap', 'Goed te combineren met pauze of aankomst']
  },
  wc: {
    singular:'pauzeplek', action:'Bekijk locatie', type:'WC- of pauzeplek onderweg',
    recommended:'Aanbevolen WC- en pauzeplekken', all:'Alle WC- en pauzeplekken',
    sort:'Beste match op snel bereikbaar, voorzieningen en routeafstand',
    match:['Snel', 'WC', 'Koffie/parkeren'],
    why:['Snelste praktische stop onderweg', 'Praktisch onderweg', 'Zo min mogelijk omrijden']
  }
};
const timelines = {
  1:[['—','Route nog niet gepland','Vul vertrekpunt en bestemming in en klik op Maak dagroute','Vertrek']]
};
let map, routeLine, markers=[], placeMarkers=[];
let routeZoneMarkersVisible = false;
function setRouteZoneMarkersVisible(visible){
  routeZoneMarkersVisible = Boolean(visible);
  const legend=$('.legend');
  if(legend) legend.classList.toggle('hidden', !routeZoneMarkersVisible);
  const toggle=$('#mapToggleStops');
  if(toggle){
    toggle.classList.toggle('active', routeZoneMarkersVisible);
    toggle.setAttribute('aria-pressed', String(routeZoneMarkersVisible));
    toggle.title = routeZoneMarkersVisible ? 'Stopmomenten verbergen' : 'Stopmomenten tonen';
  }
  if(!map || !Array.isArray(markers)) return;
  markers.forEach(m=>{
    if(routeZoneMarkersVisible){ if(!map.hasLayer(m)) m.addTo(map); }
    else if(map.hasLayer(m)) map.removeLayer(m);
  });
}

function clearPlaceMarkers(){
  if(!Array.isArray(placeMarkers)) placeMarkers=[];
  placeMarkers.forEach(m=>{ if(map && map.hasLayer(m)) map.removeLayer(m); });
  placeMarkers=[];
}
function placeMarkerHtml(cat,index){
  const letter = {hotels:'H',restaurants:'R',laden:'L',tanken:'T',uitjes:'U',wc:'W'}[cat] || 'P';
  return `<div class="place-marker place-marker-${cat}">${letter}</div>`;
}
function displayedPlacesForMap(){
  if(!state.category) return [];
  const list = currentDisplayedStopsForMap();
  if(!Array.isArray(list) || !list.length) return [];
  const max = state.suggestions && state.view === 'recommended' ? (isEnergyCategory(state.category) ? 10 : (state.category === 'hotels' ? 3 : 4)) : 40;
  return list.slice(0,max)
    .map((item,index)=>({item,index:item?.[2]?.__stopIndex ?? index,meta:item?.[2] || {}}))
    .filter(x=>Number.isFinite(Number(x.meta.lat)) && Number.isFinite(Number(x.meta.lng)));
}
function renderPlaceMarkers(){
  if(!map || !window.L) return;
  clearPlaceMarkers();
  const places = displayedPlacesForMap();
  placeMarkers = places.map(({item,index,meta})=>{
    const cat = state.category;
    const originalIndex = Number(index);
    const name = item?.[0] || categoryLabel(cat);
    const openFromPin = (event)=>{
      if(event?.originalEvent){
        L.DomEvent.stopPropagation(event.originalEvent);
        L.DomEvent.preventDefault(event.originalEvent);
      }
      if(Number.isFinite(originalIndex)){
        openStopDetail(cat, originalIndex);
      }
    };
    const marker = L.marker([Number(meta.lat),Number(meta.lng)],{
      interactive:true,
      keyboard:true,
      bubblingMouseEvents:false,
      riseOnHover:true,
      zIndexOffset:650,
      title:name,
      alt:name,
      icon:L.divIcon({
        className:'roadora-place-marker-icon',
        html:placeMarkerHtml(cat, originalIndex),
        iconSize:[30,34],
        iconAnchor:[15,32],
        popupAnchor:[0,-30]
      })
    }).bindTooltip(name);
    marker.on('click', openFromPin);
    marker.on('keypress', (event)=>{
      const key = event?.originalEvent?.key;
      if(key === 'Enter' || key === ' ') openFromPin(event);
    });
    marker.on('add',()=>{
      const el = marker.getElement?.();
      if(!el) return;
      el.setAttribute('role','button');
      el.setAttribute('tabindex','0');
      el.setAttribute('aria-label',`Bekijk ${name}`);
      el.addEventListener('click',(ev)=>{
        ev.preventDefault();
        ev.stopPropagation();
        if(Number.isFinite(originalIndex)) openStopDetail(cat, originalIndex);
      });
      el.addEventListener('touchend',(ev)=>{
        ev.preventDefault();
        ev.stopPropagation();
        if(Number.isFinite(originalIndex)) openStopDetail(cat, originalIndex);
      },{passive:false});
    });
    return marker;
  });
  placeMarkers.forEach(m=>m.addTo(map));
}

function initMap(){
  if(!window.L || map) return;
  map = L.map('roadoraMap',{zoomControl:false,scrollWheelZoom:true}).setView([48.4,8.8],5);
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(map);
  routeLine = L.polyline(routeCoords || [],{color:'#0b6f71',weight:5,opacity:.88,lineCap:'round'}).addTo(map);
  renderRouteZoneMarkers(true);
  renderPlaceMarkers();
  fitMap(); setTimeout(()=>map.invalidateSize(),250); setTimeout(()=>map.invalidateSize(),900);
}
function fitMap(){ if(map && routeLine && routeCoords.length>1) map.fitBounds(routeLine.getBounds(),{padding:[45,45]}); else if(map) map.setView([48.4,8.8],5); }

function durationLabel(mins){
  const m = Math.max(0, Math.round(Number(mins)||0));
  const h = Math.floor(m/60);
  const r = m%60;
  return h ? `${h}u ${String(r).padStart(2,'0')}m` : `${r} min`;
}
function parseTimeToMinutes(value){
  const m=String(value||'').match(/(\d{1,2}):(\d{2})/);
  if(!m) return null;
  return Math.max(0, Math.min(1439, Number(m[1])*60+Number(m[2])));
}
function minutesToTime(value){
  const v=((Math.round(value)%1440)+1440)%1440;
  return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
}
function destinationCoords(value){
  const text=String(value||'').toLowerCase();
  const known=[
    [/amsterdam/, [4.9041,52.3676]], [/rotterdam/, [4.4777,51.9244]], [/utrecht/, [5.1214,52.0907]], [/eindhoven/, [5.4697,51.4416]],
    [/toscane|florence|firenze/, [11.2558,43.7696]], [/gardameer|garda|verona/, [10.9916,45.4384]], [/innsbruck/, [11.4041,47.2692]],
    [/zuid-frankrijk|nice|nizza/, [7.2619,43.7102]], [/kroati|zagreb/, [15.9819,45.8150]], [/oostenrijk|wenen|vienna/, [16.3738,48.2082]],
    [/spanje|barcelona/, [2.1734,41.3851]], [/parijs|paris/, [2.3522,48.8566]], [/berlijn|berlin/, [13.4050,52.5200]]
  ];
  const hit=known.find(([rx])=>rx.test(text));
  return hit ? hit[1] : null;
}
function sampleRouteAtProgress(progress){
  if(!Array.isArray(routeCoords)||!routeCoords.length) return null;
  const p=Math.max(0,Math.min(1,Number(progress)||0));
  const idx=Math.round(p*(routeCoords.length-1));
  return routeCoords[idx] || routeCoords[0];
}
function setRouteCoordsFromLngLat(coords){
  if(!Array.isArray(coords)||coords.length<2) return false;
  routeCoords = coords.map(c=>[Number(c[1]),Number(c[0])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]));
  return routeCoords.length>1;
}

function renderRouteZoneMarkers(forceVisible=false){
  if(!map) return;
  markers.forEach(m=>{ if(map.hasLayer(m)) map.removeLayer(m); });
  markers = markerData.map(m=>L.marker(m.coords,{icon:L.divIcon({className:'',html:`<div class="custom-marker m-${m.type}">${m.label}</div>`,iconSize:[28,28],iconAnchor:[14,14]})}).bindTooltip(m.title));
  if(forceVisible) routeZoneMarkersVisible = true;
  setRouteZoneMarkersVisible(routeZoneMarkersVisible);
}
function updateMapRoute(){
  if(!map || !routeLine) return;
  if(!Array.isArray(routeCoords) || routeCoords.length<2){ routeLine.setLatLngs([]); markerData=[]; renderRouteZoneMarkers(false); fitMap(); return; }
  routeLine.setLatLngs(routeCoords);
  renderRouteZoneMarkers(false);
  fitMap();
}
function applyRouteZones(){
  readForm();
  if(!hasRoute()){
    state.routeZones=[];
    markerData=[];
    timelines[1]=[['—','Route nog niet gepland','Vul vertrekpunt en bestemming in en klik op Maak dagroute','Vertrek']];
    updateMapRoute();
    return;
  }
  const hasDepart=Boolean(state.depart);
  const departMin = parseTimeToMinutes(state.depart) ?? 540;
  const distanceKm = Number(state.routeDistanceKm)||1;
  const durationMin = Number(state.routeDurationMin)||1;
  const drivePerKmMin = durationMin / Math.max(1,distanceKm);
  const arrivalStart = parseTimeToMinutes((state.arrival||'').split('-')[0]||state.arrival) ?? (departMin + Math.min(durationMin, 480));
  const energyCategory = state.vehicle==='electric' ? 'laden' : (state.vehicle ? 'tanken' : 'wc');
  const energyLabel = state.vehicle==='electric' ? 'Laadstop' : (state.vehicle ? 'Tankstop' : 'Stop onderweg');
  const range = effectiveRangeKm();
  const safeRangeKm = Math.max(80, Math.round(range * (state.vehicle==='electric' ? 0.72 : 0.78)));
  const timeLabel=(mins)=>hasDepart ? minutesToTime(mins) : 'tijd later';
  const startTitle = `${state.depart || 'Vertrek'} Vertrek`;
  const moments = [
    {type:'start', category:'start', label:'A', title:startTitle, time:state.depart || 'tijd later', distanceKm:0, progress:0},
    {type:'pause', category:'wc', label:'1', title:`${timeLabel(departMin+150)} Pauze`, time:timeLabel(departMin+150), distanceKm:Math.round(150/drivePerKmMin), progress:Math.min(.28,(150/drivePerKmMin)/distanceKm)},
    {type:'lunch', category:'restaurants', label:'2', title:`${timeLabel(departMin+285)} Lunch`, time:timeLabel(departMin+285), distanceKm:Math.round(285/drivePerKmMin), progress:Math.min(.52,(285/drivePerKmMin)/distanceKm)},
    {type:'charge', category:energyCategory, label:'3', title:`${timeLabel(departMin+(safeRangeKm*drivePerKmMin))} ${energyLabel}`, time:timeLabel(departMin+(safeRangeKm*drivePerKmMin)), distanceKm:Math.min(Math.round(distanceKm*.72),safeRangeKm), progress:Math.min(.82,safeRangeKm/distanceKm)},
    {type:'hotel', category:'hotels', label:'H', title:`${state.arrival || 'Aankomst later'} Overnachten rond`, time:state.arrival || 'aankomst later', distanceKm:Math.round(((arrivalStart-departMin)*.88)/drivePerKmMin), progress:Math.min(.9,Math.max(.35,(((arrivalStart-departMin)*.88)/drivePerKmMin)/distanceKm))},
    {type:'end', category:'end', label:'B', title:(state.destination||'Bestemming').split(',')[0], time:'Aankomst', distanceKm:distanceKm, progress:1}
  ];
  state.routeZones = moments.filter(m=>!['start','end'].includes(m.category));
  markerData = moments.map(m=>({type:m.type,label:m.label,coords:sampleRouteAtProgress(m.progress)||routeCoords[0],title:m.title})).filter(m=>m.coords);
  timelines[1]=[
    [state.depart || '—',`Vertrek ${(state.origin||'vertrekpunt').split(',')[0]}`,'Start van je roadtrip','Vertrek'],
    [moments[1].time,'Rustige pauze','WC · koffie · even bewegen','Pauze'],
    [moments[2].time,'Lunchstop','Weinig omrijden · logisch onderweg','Lunch'],
    [moments[3].time,energyLabel,state.vehicle ? `${range} km rijbereik · ${state.vehicle==='electric'?state.plug:'volle tank'}` : 'Voertuig later kiezen','Laden/tanken'],
    [(state.arrival||'').split(' - ')[0]||moments[4].time,'Overnachten rond','Aanbevolen overnachtingen rond je stopmoment','Overnachten rond']
  ];
  updateMapRoute();
}
function routeSamplePoints(maxPoints=12,{includeEnds=false}={}){
  const coords=Array.isArray(routeCoords)?routeCoords:[];
  if(coords.length<2) return [];
  const start=includeEnds?0:1;
  const end=includeEnds?coords.length-1:coords.length-2;
  const count=Math.max(1,Math.min(maxPoints,end-start+1));
  const pts=[];
  for(let i=0;i<count;i++){
    const idx=Math.round(start + ((end-start) * (count===1?0:i/(count-1))));
    const c=coords[idx];
    if(!c) continue;
    pts.push({lat:c[0],lng:c[1],index:i,progress:idx/Math.max(1,coords.length-1),distanceFromStartMeters:Math.round((state.routeDistanceKm||0)*1000*(idx/Math.max(1,coords.length-1)))});
  }
  return pts;
}
function routePointAtDistanceKm(distanceKm,index=0){
  const coords=Array.isArray(routeCoords)?routeCoords:[];
  const total=Math.max(1,Number(state.routeDistanceKm)||1);
  if(coords.length<2) return null;
  const km=Math.max(0,Math.min(total,Number(distanceKm)||0));
  const progress=km/total;
  const idx=Math.max(0,Math.min(coords.length-1,Math.round(progress*(coords.length-1))));
  const c=coords[idx];
  return c ? {lat:c[0],lng:c[1],index,progress,distanceFromStartMeters:Math.round(km*1000)} : null;
}
function isEnergyCategory(cat){ return cat==='tanken' || cat==='laden'; }
function rangeZone(){
  const total=Math.max(1,Number(state.routeDistanceKm)||1);
  const range=Math.max(80,effectiveRangeKm());
  const factor=state.vehicle==='electric' ? 0.78 : 0.88;
  const target=Math.min(Math.max(60,range*factor),Math.max(60,total-35));
  const low=Math.max(20,target-(range*(state.vehicle==='electric'?0.18:0.16)));
  const high=Math.min(total-10,target+(range*(state.vehicle==='electric'?0.16:0.14)));
  return {target,low,high,range,total};
}
function energySearchPoints(){
  const z=rangeZone();
  const distances=[];
  const step=Math.max(18,(z.high-z.low)/6);
  for(let d=z.low; d<=z.high+1; d+=step) distances.push(d);
  distances.push(z.target);
  return [...new Set(distances.map(d=>Math.round(d)))].sort((a,b)=>a-b).slice(0,9)
    .map((d,i)=>routePointAtDistanceKm(d,i)).filter(Boolean);
}
function energyDistanceKm(item){
  const meta=item?.[2]||{};
  const raw=Number(meta.distanceFromStartMeters);
  if(Number.isFinite(raw) && raw>0) return Math.round(raw/1000);
  const progress=Number(meta.routeProgress);
  if(Number.isFinite(progress)) return Math.round((Number(state.routeDistanceKm)||0)*progress);
  return null;
}
function energyFitLabel(km){
  if(!Number.isFinite(Number(km))) return 'langs route';
  const z=rangeZone();
  if(km<z.low) return 'te vroeg';
  if(km>z.high) return 'alternatief';
  return state.vehicle==='electric' ? 'goede laadzone' : 'goede tankzone';
}
function recommendedEnergyStops(list){
  const indexed=(Array.isArray(list)?list:[]).map((item,i)=>{ if(item?.[2]) item[2].__stopIndex=i; return item; });
  const z=rangeZone();
  const scored=indexed.map((item,i)=>{
    const km=energyDistanceKm(item);
    const diff=Number.isFinite(km) ? Math.abs(km-z.target) : 9999;
    return {item,km,diff,i};
  }).sort((a,b)=>a.diff-b.diff || a.i-b.i);
  let chosen=scored.filter(x=>Number.isFinite(x.km) && x.km>=z.low && x.km<=z.high).slice(0,10);
  if(chosen.length<5) chosen=scored.slice(0,Math.min(10,Math.max(5,scored.length)));
  return chosen.map(x=>x.item);
}
function currentDisplayedStopsForMap(){
  if(!state.category) return [];
  const list=(stops[state.category]||[]).map((item,i)=>{ if(item?.[2]) item[2].__stopIndex=i; return item; });
  if(state.suggestions && state.view==='recommended' && isEnergyCategory(state.category)) return recommendedEnergyStops(list);
  if(state.suggestions && state.view==='recommended') return list.slice(0,state.category==='hotels'?3:4);
  return list;
}

async function geocodePlace(query){
  const q=String(query||'').trim();
  if(!q) throw new Error('Plaats ontbreekt');
  const res=await fetch('/api/geocode?q='+encodeURIComponent(q),{headers:{Accept:'application/json'}});
  const data=await res.json().catch(()=>({}));
  if(!res.ok || data.ok===false || !data.result?.coord) throw new Error(data.message||data.status||'Geocoding mislukt');
  return data.result;
}
function resetLiveCategory(cat,status='loading'){
  state.placeStatus[cat]=status;
  stops[cat]=[];
  if(state.category===cat) renderStops();
}
function setPlaceStatus(cat,status,message=''){
  state.placeStatus[cat]=status;
  state.placeStatus[`${cat}Message`]=message;
  if(state.category===cat) renderStops();
}

function normalizeLivePlace(place,cat){
  const name=place?.name || (cat==='hotels'?'Hotel langs route':'Tankstation langs route');
  const bits=[];
  if(place?.rating) bits.push(`${place.rating} ★`);
  if(Array.isArray(place?.amenities)&&place.amenities.length) bits.push(place.amenities.slice(0,3).join(' · '));
  const distanceKm = Number.isFinite(Number(place?.distanceFromStartMeters)) ? Math.round(Number(place.distanceFromStartMeters)/1000) : null;
  if(isEnergyCategory(cat) && Number.isFinite(distanceKm)) bits.push(`± ${distanceKm} km vanaf vertrek`);
  bits.push(place?.detourLabel || (cat==='hotels'?'+10 min omrijden':'+3 min omrijden'));
  const derivedPhotoUrl = place?.photoUrl || (place?.photoName ? `/api/google-photo?name=${encodeURIComponent(place.photoName)}&w=420` : null);
  const derivedPhotoUrls = Array.isArray(place?.photoUrls) && place.photoUrls.length
    ? place.photoUrls
    : (derivedPhotoUrl ? [derivedPhotoUrl] : []);
  const meta={...place, live:true, distanceFromStartKm:distanceKm, photoUrl:derivedPhotoUrl, photoUrls:derivedPhotoUrls, address:place?.address||'', googleMapsUri:place?.googleMapsUri||null, website:place?.website||null};
  return [name,bits.filter(Boolean).join(' · '),meta];
}
async function loadLivePlacesFor(cat){
  const endpoint = cat==='hotels' ? '/api/google-hotels' : cat==='tanken' ? '/api/google-fuel' : cat==='laden' ? '/api/google-charging' : null;
  if(!endpoint) return false;
  const points = cat==='hotels'
    ? routeSamplePoints(8,{includeEnds:false}).filter(p=>p.progress>.35 && p.progress<.92)
    : (isEnergyCategory(cat) ? energySearchPoints() : routeSamplePoints(10,{includeEnds:false}));
  if(!points.length) return false;
  try{
    const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({points,radiusMeters:cat==='hotels'?16000:7000,mode:cat==='hotels'?'route_planning':'route_quick'})});
    const data=await res.json().catch(()=>({places:[]}));
    if(!res.ok || data.ok===false) throw new Error(data.message||data.status||'live places fout');
    const list=(Array.isArray(data.places)?data.places:[]).map(p=>normalizeLivePlace(p,cat));
    if(list.length){
      stops[cat]=list;
      setPlaceStatus(cat,'live');
      renderStops();
      return true;
    }
    stops[cat]=[];
    setPlaceStatus(cat,'empty','Geen live resultaten gevonden rond deze routezone.');
    renderStops();
  }catch(err){
    console.warn(`Roadora ${cat} live places error:`,err);
    stops[cat]=[];
    setPlaceStatus(cat,'error',String(err?.message||err));
    renderStops();
  }
  return false;
}
async function loadRealRoute(){
  readForm();
  clearPlaceMarkers();
  if(!state.origin || !state.destination){
    state.routeSource='empty';
    setPlaceStatus('hotels','empty','Vul eerst vertrekpunt en bestemming in.');
    updateTexts(); renderStops();
    toast('Vul vertrekpunt en bestemming in');
    return false;
  }
  state.category='';
  clearPlaceMarkers();
  cats.forEach(([cat])=>{ stops[cat]=[]; });
  ['hotels','laden','tanken'].forEach(cat=>setPlaceStatus(cat,'idle','Zet deze categorie aan om live resultaten langs je route te laden.'));
  ['restaurants','uitjes','wc'].forEach(cat=>setPlaceStatus(cat,'empty','Deze categorie staat standaard uit en wordt later live gekoppeld. Kies voorlopig hotels, laden of tanken voor live kaartresultaten.'));
  try{
    toast('Plaatsen zoeken…');
    const [startGeo,endGeo]=await Promise.all([geocodePlace(state.origin), geocodePlace(state.destination)]);
    toast('Route laden via Google…');
    const params=new URLSearchParams({start:startGeo.coord.join(','),end:endGeo.coord.join(','),profile:'driving-car'});
    const res=await fetch('/api/route?'+params.toString(),{headers:{Accept:'application/json'}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok || !data?.features?.[0]?.geometry?.coordinates){
      console.warn('Roadora route API detail:', data);
      try{ console.warn('Roadora route API detail JSON:', JSON.stringify(data, null, 2)); }catch(_){}
      window.__ROADORA_LAST_ROUTE_ERROR__ = data;
      const firstAttempt = data?.debug?.attempts?.[0];
      const msg = firstAttempt?.body?.error?.message || firstAttempt?.body?.message || firstAttempt?.message || data?.error || data?.status || `Route ${res.status}`;
      throw new Error(String(msg));
    }
    const feature=data.features[0];
    if(!setRouteCoordsFromLngLat(feature.geometry.coordinates)) throw new Error('Route heeft geen bruikbare polyline');
    const summary=feature.properties?.summary||{};
    state.routeDistanceKm=Math.max(1,Math.round(Number(summary.distance||0)/1000));
    state.routeDurationMin=Math.max(1,Math.round(Number(summary.duration||0)/60));
    state.routeSource=(data?.roadora?.source==='google')?'google':((data?.roadora?.source==='ors')?'ors':'external-route');
    state.originResolved=startGeo.formattedAddress||state.origin;
    state.destinationResolved=endGeo.formattedAddress||state.destination;
    applyRouteZones();
    updateTexts();
    renderTimeline();
    toast(state.routeSource==='google' ? 'Google route geladen' : 'Route geladen via fallback');
    clearPlaceMarkers();
    renderStops();
    return true;
  }catch(err){
    console.warn('Roadora route error:',err);
    state.routeSource='route_error';
    routeCoords=[]; markerData=[]; updateMapRoute();
    setPlaceStatus('hotels','error','Route of geocoding niet geladen; live hotels zijn daarom niet opgehaald.');
    setPlaceStatus('tanken','error','Route of geocoding niet geladen; live tankstations zijn daarom niet opgehaald.');
    setPlaceStatus('laden','error','Route of geocoding niet geladen; live laadpunten zijn daarom niet opgehaald.');
    updateTexts();
    renderStops();
    toast('Route niet geladen: open console voor Roadora route API detail JSON');
    return false;
  }
}
window.RoadoraPlanner = window.RoadoraPlanner || {};
window.RoadoraPlanner.setGoogleRoute = function(routeData){
  try{
    const coords = routeData?.features?.[0]?.geometry?.coordinates || routeData?.coordinates || [];
    if(setRouteCoordsFromLngLat(coords)){
      const summary=routeData?.features?.[0]?.properties?.summary || routeData?.summary || {};
      if(summary.distance) state.routeDistanceKm=Math.round(Number(summary.distance)/1000);
      if(summary.duration) state.routeDurationMin=Math.round(Number(summary.duration)/60);
      state.routeSource='external-route';
      applyRouteZones(); renderAll(); updateMapRoute();
    }
  }catch(err){console.warn('setGoogleRoute fout:',err);}
};
function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }
function readForm(){
  state.origin=($('#origin')?.value||'').trim();
  state.destination=($('#destination')?.value||'').trim();
  state.date=$('#date')?.value || todayISO();
  state.depart=$('#departTime')?.value || '';
  state.arrival=$('#hotelArrival')?.value || '16:30 - 18:00';
  state.days=Math.max(1,Math.min(21,Number($('#tripDays')?.value)||1));
  state.range=Number($('#vehicleRangeKm')?.value)||0;
  state.plug=$('#plug')?.value || 'CCS';
  state.adults=Number($('[name="adults"]')?.value)||1;
  state.children=Number($('[name="children"]')?.value)||0;
  state.maxDetour=Number($('#maxDetour')?.value)||20;
}
function vehicleLabel(){return {car:'Auto',electric:'Elektrisch',camper:'Camper',bus:'Bus'}[state.vehicle]||'Geen voertuig gekozen'}
function setText(id, value){ const el=$(id); if(el) el.textContent=value; }
function routeTitleLabel(){
  const origin=(state.origin||'').split(',')[0].trim();
  const dest=(state.destination||'').split(',')[0].trim();
  if(origin && dest) return `${origin} → ${dest}`;
  return 'Nog geen route gepland';
}
function routeSourceLabel(){
  if(state.routeSource==='google') return 'Google route';
  if(state.routeSource==='ors') return 'ORS fallback';
  if(state.routeSource==='external-route') return 'Echte route';
  if(state.routeSource==='route_error') return 'Routefout';
  return 'Nog geen route';
}
function updateTexts(){
  readForm();
  const simpleOrigin=(state.origin||'').split(',')[0].trim();
  const simpleDest=(state.destination||'').split(',')[0].trim();
  const title=routeTitleLabel();
  ['#summaryRoute','#routeTitle','#mapRouteTitle','#tripOverviewTitle'].forEach(id=>setText(id,title));
  setText('#sideDepart',`${state.date || todayISO()} · ${state.depart || 'vertrektijd later'}`);
  setText('#sideHotel',state.arrival || 'aankomst later');
  const vehicleText = vehicleLabel();
  setText('#sideVehicle',state.vehicle ? `${vehicleText}${state.range?` (${state.range} km)`:''}` : 'Nog geen voertuig gekozen');
  setText('#sideTravelers',`${state.adults} volwassenen, ${state.children} kinderen${state.pet!=='none'?', hond':''}`);
  const petText = state.pet==='none' ? 'geen hond' : (state.pet==='multiple' ? 'meerdere honden' : 'hond mee');
  const prefTexts = $$('.pref.active').map(b=>b.textContent.trim());
  if($('#profileSummary')) $('#profileSummary').textContent = `${state.adults} volwassenen · ${state.children ? state.children + ' kinderen' : 'geen kinderen'} · ${petText}`;
  if($('#vehicleSummary')) $('#vehicleSummary').textContent = state.vehicle ? (state.vehicle==='electric' ? `${vehicleText}${state.range?` · ${state.range} km`:''} · ${state.plug}` : `${vehicleText}${state.range?` · ${state.range} km rijbereik`:''}`) : 'geen voertuig gekozen';
  if($('#prefSummary')) $('#prefSummary').textContent = prefTexts.length ? prefTexts.slice(0,4).join(' · ') + (prefTexts.length>4 ? ' +' + (prefTexts.length-4) : '') : 'geen voorkeuren gekozen';
  const detourValue = $('#maxDetour')?.closest('.range-row')?.querySelector('strong'); if(detourValue) detourValue.textContent = `${state.maxDetour} min`;
  setText('#rangeLabel', state.vehicle==='electric' ? 'Hoe ver kun je ongeveer rijden op een volle accu?' : (state.vehicle ? 'Hoe ver kun je ongeveer rijden op een volle tank?' : 'Hoe ver kun je ongeveer rijden?'));
  $('#evFields')?.classList.toggle('hidden', state.vehicle!=='electric');
  setText('#chargeLabel', state.vehicle==='electric'?'Laadstop':(state.vehicle?'Tankstop':'Stop onderweg'));
  const chargeText = state.vehicle ? (state.vehicle==='electric' ? `${state.range||effectiveRangeKm()} km rijbereik · ${state.plug}` : `${state.range||effectiveRangeKm()} km rijbereik · tankstop`) : 'voertuig later kiezen';
  setText('#chargeDetail', chargeText);
  const stats = $$('.stats .stat strong');
  if(stats[0]) stats[0].textContent = hasRoute() ? `${Number(state.routeDistanceKm).toLocaleString('nl-NL')} km` : '— km';
  if(stats[1]) stats[1].textContent = hasRoute() ? durationLabel(state.routeDurationMin) : '—';
  if(stats[2]) stats[2].textContent = routeSourceLabel();
  const mapSummary = $('.map-summary .summary-row');
  if(mapSummary) mapSummary.innerHTML = hasRoute()
    ? `<span>${Number(state.routeDistanceKm).toLocaleString('nl-NL')} km</span><span>${durationLabel(state.routeDurationMin)}</span><span id="chargeDetail">${chargeText}</span>`
    : `<span>— km</span><span>—</span><span id="chargeDetail">Vul je route in</span>`;
  setText('#dayCountPill',`${state.days} ${state.days===1?'dag':'dagen'}`);
  setText('#overviewDayPill',`Dag ${state.activeDay}`);
  setText('#overviewDaysPill',`${state.days} ${state.days===1?'dag':'dagen'}`);
  setText('#activeDaySummary', hasRoute() ? `Dag ${state.activeDay} · ${dayRouteLabel(state.activeDay, simpleOrigin, simpleDest)}` : 'Dag 1 · nog niet gepland');
  setText('#tripOverviewMeta', hasRoute() ? `${state.days} ${state.days===1?'dag':'dagen'} · ${Number(state.routeDistanceKm).toLocaleString('nl-NL')} km · ${durationLabel(state.routeDurationMin)} heenreis` : 'Vul je route in om een roadtrip te maken');
  const tags = [];
  if(state.children>0) tags.push(`${state.children} kinderen`);
  if(state.pet!=='none') tags.push(state.pet==='multiple'?'meerdere honden':'hond mee');
  if(state.range>0) tags.push(`${state.range} km rijbereik`);
  prefTexts.slice(0,3).forEach(p=>tags.push(p.toLowerCase()));
  if(state.vehicle==='electric') tags.push('laden'); else if(state.vehicle) tags.push('tanken');
  if($('#profileTags')) $('#profileTags').innerHTML = tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
  if($('#tripOverviewTags')) $('#tripOverviewTags').innerHTML = tags.slice(0,4).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
}
function renderDays(){
  const tabs=$('#dayTabs'); tabs.innerHTML='';
  for(let i=1;i<=state.days;i++){const b=document.createElement('button'); b.className='day-tab'+(i===state.activeDay?' active':''); b.textContent=`Dag ${i}`; b.onclick=()=>{state.activeDay=i; editingPlanRows.clear(); renderAll();}; tabs.appendChild(b);}
}
function dayRouteLabel(day, origin=state.origin.split(',')[0], dest=state.destination.split(',')[0]){
  if(day===1) return origin ? `${origin} → overnachten rond` : 'nog niet gepland';
  if(day===2) return dest ? `overnachting → ${dest}` : 'overnachting → bestemming';
  if(day===state.days && state.days>3) return (dest && origin) ? `${dest} → ${origin}` : 'terugreis';
  if(day===state.days-1 && state.days>4) return dest ? `${dest} → tussenstop` : 'tussenstop';
  return dest ? `${dest} omgeving` : 'dagroute';
}
function dayStatus(day){
  if(timelines[day]) return day===1?'gepland':'voorgesteld';
  return 'nog te plannen';
}

function deleteTripDay(day){
  if(state.days <= 1){ toast('Je roadtrip moet minimaal 1 dag hebben'); return; }
  const nextTimelines = {};
  for(let i=1;i<=state.days;i++){
    if(i === day) continue;
    const newIndex = i > day ? i - 1 : i;
    if(timelines[i]) nextTimelines[newIndex] = timelines[i];
  }
  Object.keys(timelines).forEach(k=>delete timelines[k]);
  Object.assign(timelines, nextTimelines);
  state.days = Math.max(1, state.days - 1);
  if(state.activeDay === day) state.activeDay = Math.min(day, state.days);
  else if(state.activeDay > day) state.activeDay -= 1;
  const input=$('#tripDays'); if(input) input.value=state.days;
  editingPlanRows.clear();
  renderAll();
  toast('Dag verwijderd');
}
function renderTripOverview(){
  const list=$('#overviewDayList');
  if(list){
    const origin=state.origin.split(',')[0], dest=state.destination.split(',')[0];
    list.innerHTML='';
    for(let i=1;i<=state.days;i++){
      const b=document.createElement('button');
      b.type='button';
      b.className='overview-day-row'+(i===state.activeDay?' active':'');
      b.innerHTML=`<span class="overview-day-num">Dag ${i}</span><span class="overview-day-main"><strong>${dayRouteLabel(i,origin,dest)}</strong><em>${i===state.activeDay?'actieve dag':dayStatus(i)}</em></span><button class="overview-day-delete" type="button" data-delete-day="${i}" title="Dag verwijderen">Verwijder</button>`;
      b.onclick=(e)=>{if(e.target.closest('[data-delete-day]')) return; state.activeDay=i; editingPlanRows.clear(); renderAll();};
      list.appendChild(b);
    }
  }
  const detail=$('#activeDayDetail');
  if(detail){
    const plan=dayPlan();
    const hotel=plan.find(r=>inferType(r[1])==='Overnachten rond'||String(r[3]||'').includes('Hotel')) || plan[plan.length-1];
    detail.innerHTML = `<div class="active-day-head"><strong>${dayRouteLabel(state.activeDay)}</strong><span>${dayStatus(state.activeDay)} · ${plan.length} momenten</span></div>` +
      `<div class="active-day-mini-list">${plan.map(r=>`<div><span>${r[0]}</span><strong>${r[1]}</strong></div>`).join('')}</div>` +
      `<div class="active-day-note"><strong>Hotel / eindpunt</strong><span>${hotel ? (typeof hotel[2]==='function'?hotel[2]():hotel[2]) : state.arrival}</span></div>`;
  }
}
function dayPlan(){
  if(!timelines[state.activeDay]) timelines[state.activeDay] = [[state.depart,'Vrije dag','Zelf stops, uitjes of restaurants toevoegen'],['13:00','Optionele stop','Alles tonen op kaart blijft mogelijk'],[state.arrival.split(' - ')[0]||'17:00','Terug naar verblijf','Overzicht bewaren in Mijn roadtrips']];
  return timelines[state.activeDay];
}
function inferType(title=''){
  const t=String(title).toLowerCase();
  if(t.includes('vertrek')) return 'Vertrek';
  if(t.includes('lunch')) return 'Lunch';
  if(t.includes('laad')||t.includes('tank')) return 'Laden/tanken';
  if(t.includes('hotel')) return 'Overnachten rond';
  if(t.includes('uitje')) return 'Uitje';
  if(t.includes('wc')) return 'WC';
  return 'Pauze';
}
function planTypeSelect(type){
  const opts=['Vertrek','Pauze','Lunch','Laden/tanken','Overnachten rond','Restaurant','Hotel','Uitje','WC','Zelf ingevuld'];
  return `<select class="plan-type" aria-label="Type stop">${opts.map(o=>`<option ${o===type?'selected':''}>${o}</option>`).join('')}</select>`;
}
function isValidTimeValue(value){ return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || '')); }
function safeTimeValue(value){ return isValidTimeValue(value) ? String(value) : ''; }
function safeReadTime(value){ return value && value !== '—' ? value : 'tijd later'; }
function renderTimeline(){
  const list = dayPlan();
  $('#timeline').innerHTML = list.map((r,i)=>{
    const detail = typeof r[2]==='function'?r[2]():r[2];
    const type = r[3] || inferType(r[1]);
    const editing = editingPlanRows.has(i);
    return `<div class="plan-row ${i===list.length-1?'active':''} ${editing?'editing':''}" data-plan-index="${i}">
      <div class="plan-read">
        <div class="plan-read-time">${safeReadTime(r[0])}</div>
        <div class="plan-read-main"><strong>${r[1]}</strong><span>${detail}</span><em>${type}</em></div>
        <button class="plan-edit" type="button">Bewerken</button>
      </div>
      <div class="plan-edit-panel">
        <div class="plan-timebox"><input class="plan-time-input" type="time" value="${safeTimeValue(r[0])}" aria-label="Tijd"></div>
        <div class="plan-fields">
          <div class="plan-topline">${planTypeSelect(type)}<button class="plan-remove" type="button" title="Verwijderen">Verwijder</button></div>
          <input class="plan-title-input" value="${r[1]}" aria-label="Titel van stop">
          <input class="plan-detail-input" value="${detail}" aria-label="Details of eigen locatie">
          <button class="plan-save" type="button">Opslaan</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function escapeHtml(v){return String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function categoryLabel(id){return (cats.find(c=>c[0]===id)||['',id])[1];}
function categorySpec(id){return categorySpecs[id] || {singular:'stop', action:'Bekijk locatie', type:'stop langs je route', recommended:'Aanbevolen stops', all:'Alle stops', sort:'Beste match voor jouw reis', match:['Route','Tijd','Profiel'], why:['Past bij je route', 'Past bij je tijd', 'Past bij je profiel']};}
function categorySingular(id){return categorySpec(id).singular;}
function categoryTitle(id, view){return view==='all' ? categorySpec(id).all : categorySpec(id).recommended;}
function stopMatchLabels(cat, desc='', meta={}){
  const spec = categorySpec(cat);
  const detour = (String(desc).match(/[±+]?\s*\d+\s*min[^·]*/)||['weinig omrijden'])[0].trim();
  if(isEnergyCategory(cat)){
    const km = energyDistanceKm([null,null,meta]);
    const distance = Number.isFinite(km) ? `± ${km} km vanaf vertrek` : stopZoneDistance(cat);
    return [distance, energyFitLabel(km), detour].slice(0,3);
  }
  return [spec.match[0], detour, stopWindow(cat), stopZoneDistance(cat)].slice(0,3);
}
function stopWhyList(cat){
  const base = categorySpec(cat).why.slice(0,3);
  if(state.children>0 && !base.some(x=>x.toLowerCase().includes('kind'))) base.push('Rekening met kinderen');
  if(state.pet==='dog' && !base.some(x=>x.toLowerCase().includes('hond'))) base.push('Hond mee als voorkeur');
  return base.slice(0,4);
}
function stopVisualClass(cat, i){return `stop-photo stop-photo-${cat} stop-photo-${(i%6)+1}`;}
function zoneForCategory(cat){ return (state.routeZones||[]).find(z=>z.category===cat) || (cat==='tanken' ? (state.routeZones||[]).find(z=>z.category==='laden') : null); }
function stopWindow(cat){ const z=zoneForCategory(cat); return z ? (cat==='hotels' ? state.arrival : `rond ${z.time}`) : ({hotels:state.arrival,restaurants:'rond 13:00',laden:'rond 15:15',tanken:'rond 15:15',uitjes:'flexibel onderweg',wc:'wanneer nodig'}[cat]||'onderweg');}
function stopZoneDistance(cat){ const z=zoneForCategory(cat); return z?.distanceKm ? `rond ${z.distanceKm} km` : 'langs je route';}
function isPhotoStop(cat){return cat!=='wc';}
function stopCardHtml(item, index, cat, compact=false, originalIndex=index){
  const name = escapeHtml(item[0]);
  const rawDesc = typeof item[1]==='function'?item[1]():item[1];
  const desc = escapeHtml(rawDesc);
  const meta = item[2] || {};
  const showPhoto = isPhotoStop(cat) && Boolean(meta.photoUrl);
  const primaryAction = categorySpec(cat).action;
  const labels = stopMatchLabels(cat, rawDesc, meta).map(x=>`<span>${escapeHtml(x)}</span>`).join('');
  const why = stopWhyList(cat).slice(0, compact ? 2 : 3).map(x=>`<span>${escapeHtml(x)}</span>`).join('');
  const photoStyle = meta.photoUrl ? ` style="background-image:url('${escapeHtml(meta.photoUrl)}')"` : '';
  const livePill = meta.live ? '<span class="live-place-pill">live</span>' : '';
  return `<div class="stop-result ${showPhoto?'has-photo':'no-photo'} ${meta.live?'live-place':''}" data-stop-card="${originalIndex}" data-stop-cat="${cat}">
    ${showPhoto ? `<button class="${stopVisualClass(cat,index)} has-live-photo"${photoStyle} data-view-stop="${originalIndex}" data-stop-cat="${cat}" type="button" aria-label="${primaryAction} ${name}"></button>` : ''}
    <div class="stop-result-main">
      <strong>${name}${livePill}</strong>
      <p>${desc}</p>
      <div class="stop-match-line">${labels}</div>
      <div class="stop-why-line">${why}</div>
      <div class="stop-result-actions-inline">
        <button class="text-action" data-view-stop="${originalIndex}" data-stop-cat="${cat}" type="button">${primaryAction}</button>
        <button class="text-action add" data-add-stop="${originalIndex}" data-stop-cat="${cat}" type="button">Toevoegen</button>
      </div>
    </div>
  </div>`;
}
function renderStops(){
  if(!state.suggestions && state.view !== 'all') state.view = 'all';
  $$('.mode-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===state.view));
  $('#categoryTabs').innerHTML = cats.map(([id,label])=>`<button class="category-btn ${id===state.category?'active':''}" data-cat="${id}" type="button" aria-pressed="${id===state.category?'true':'false'}">${label}</button>`).join('');
  $('#suggestionToggle').textContent = state.suggestions ? 'Roadora suggesties aan' : 'Roadora suggesties uit';
  $('#suggestionToggle').setAttribute('aria-pressed', String(state.suggestions));
  $('#suggestionToggle').classList.toggle('off', !state.suggestions);
  if(!hasRoute()){
    $('#recommendTitle').textContent = 'Plan eerst je route';
    $('#allStopsTitle').textContent = 'Nog geen stops geladen';
    const empty = `<div class="empty-stops"><strong>Plan eerst je dagroute.</strong><span>Vul vertrekpunt en bestemming in. Daarna kun je handmatig Hotels, Restaurants, Laden, Tanken, Uitjes of WC aanzetten.</span></div>`;
    $('#recommendations').innerHTML = empty;
    $('#allStops').innerHTML = empty;
    $('#recommendPanel').classList.add('hidden');
    $('#allStopsPanel').classList.remove('hidden');
    clearPlaceMarkers();
    return;
  }
  if(!state.category){
    $('#recommendTitle').textContent = 'Geen categorie geselecteerd';
    $('#allStopsTitle').textContent = 'Zet een stopcategorie aan';
    const empty = `<div class="empty-stops"><strong>Stops staan uit.</strong><span>Kies handmatig een categorie hierboven. Pas dan haalt Roadora live locaties op en verschijnen pins op de kaart.</span></div>`;
    $('#recommendations').innerHTML = empty;
    $('#allStops').innerHTML = empty;
    $('#recommendPanel').classList.add('hidden');
    $('#allStopsPanel').classList.remove('hidden');
    clearPlaceMarkers();
    return;
  }
  const rawSelected = (stops[state.category]||[]).map((item,i)=>{ if(item?.[2]) item[2].__stopIndex=i; return item; });
  const selected = (state.suggestions && state.view==='recommended' && isEnergyCategory(state.category)) ? recommendedEnergyStops(rawSelected) : rawSelected;
  const recommended = state.suggestions
    ? (isEnergyCategory(state.category) ? recommendedEnergyStops(rawSelected).slice(0,10) : rawSelected.slice(0, state.category==='hotels'?3:4))
    : [];
  const recTitle = state.suggestions ? categoryTitle(state.category,'recommended') : 'Zelf zoeken actief';
  const allTitle = categoryTitle(state.category,'all');
  $('#recommendTitle').textContent = recTitle;
  $('#allStopsTitle').textContent = allTitle;
  const recommendSub = $('#recommendPanel .tiny-muted') || $('#recommendPanel .stops-subhead .mini-link');
  const allSub = $('#allStopsPanel .tiny-muted');
  if(allSub) allSub.textContent = categorySpec(state.category).sort;
  $('#suggestionToggle').textContent = state.suggestions ? 'Roadora suggesties aan' : 'Zelf zoeken actief';
  $('#suggestionToggle').setAttribute('aria-pressed', String(state.suggestions));
  $('#suggestionToggle').classList.toggle('off', !state.suggestions);
  const status = state.placeStatus[state.category] || (selected.length ? 'demo' : 'empty');
  const statusMessage = state.placeStatus[`${state.category}Message`] || '';
  const emptyHtml = status==='loading'
    ? `<div class="empty-stops"><strong>Live resultaten laden…</strong><span>Roadora zoekt nu rond je routezone.</span></div>`
    : status==='error'
      ? `<div class="empty-stops error"><strong>Live resultaten niet geladen.</strong><span>${escapeHtml(statusMessage || 'Controleer je API-key, Vercel env vars of Network-tab.')}</span></div>`
      : `<div class="empty-stops"><strong>Nog geen live resultaten gevonden.</strong><span>${escapeHtml(statusMessage || 'Probeer een grotere regio of bereken de route opnieuw.')}</span></div>`;
  $('#recommendations').innerHTML = state.suggestions
    ? (recommended.length ? recommended.map((s,i)=>stopCardHtml(s,i,state.category,false,s?.[2]?.__stopIndex ?? i)).join('') : emptyHtml)
    : `<div class="empty-stops"><strong>Roadora suggesties staan uit.</strong><span>Gebruik de categorieknoppen om zelf te bepalen welke stops op kaart komen.</span></div>`;
  $('#allStops').innerHTML = rawSelected.length ? rawSelected.map((s,i)=>stopCardHtml(s,i,state.category,true,s?.[2]?.__stopIndex ?? i)).join('') : emptyHtml;
  $('#recommendPanel').classList.toggle('hidden', state.view!=='recommended');
  $('#allStopsPanel').classList.toggle('hidden', state.view!=='all');
  renderPlaceMarkers();
}
function openStopDetail(cat,index){
  const item=(stops[cat]||[])[index]; if(!item) return;
  state.activeStop={cat,index};
  const title=item[0]; const desc=typeof item[1]==='function'?item[1]():item[1];
  $('#stopModalTitle').textContent=title;
  $('#stopModalType').textContent=`${categoryLabel(cat)} · ${categorySpec(cat).type}`;
  $('#stopModalDescription').textContent=desc;
  const whyEl = $('#stopModalWhy');
  if(whyEl) whyEl.innerHTML = stopWhyList(cat).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  $('#stopModalDetour').textContent=(desc.match(/\+\d+\s*min/)||['weinig omrijden'])[0];
  $('#stopModalWindow').textContent=stopWindow(cat);
  $('#stopModalProfile').textContent=[state.children>0?`${state.children} kinderen`:'geen kinderen', state.pet==='dog'?'hond mee':'geen hond', state.range>0?`${state.range} km`:'rijbereik niet ingevuld'].join(' · ');
  const meta = item[2] || {};
  const modalPhotoUrl = meta.photoUrl || (Array.isArray(meta.photoUrls) ? meta.photoUrls[0] : null);
  $('#stopModalPhoto').className = modalPhotoUrl ? 'stop-modal-photo has-live-photo' : 'stop-modal-photo no-live-photo';
  if(modalPhotoUrl) $('#stopModalPhoto').style.backgroundImage = `url('${modalPhotoUrl}')`;
  else $('#stopModalPhoto').style.backgroundImage = '';
  const tags = [categorySingular(cat), state.children>0?'kindvriendelijk':null, state.pet==='dog'?'hond mee':null, state.range>0?`${state.range} km rijbereik`:null, meta.provider || null].filter(Boolean);
  $('#stopModalTags').innerHTML = tags.map(t=>`<span>${escapeHtml(t)}</span>`).join('');
  const modal=$('#stopDetailModal'); modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
}
function closeStopDetail(){const modal=$('#stopDetailModal'); if(!modal) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');}
function addStopToActiveDay(cat,index){
  const item=(stops[cat]||[])[index]; if(!item) return;
  const title=item[0]; const desc=typeof item[1]==='function'?item[1]():item[1];
  const time = {hotels:(state.arrival.split(' - ')[0]||'17:00'),restaurants:'13:00',laden:'15:15',tanken:'15:15',uitjes:'14:30',wc:'11:00'}[cat]||'12:00';
  const type = {hotels:'Overnachten rond',restaurants:'Lunch',laden:'Laden/tanken',tanken:'Laden/tanken',uitjes:'Uitje',wc:'Pauze'}[cat]||'Stop';
  const plan=dayPlan();
  const insertAt=Math.max(1,plan.length-1);
  plan.splice(insertAt,0,[time,title,desc,type]);
  editingPlanRows.clear();
  state.activeTab='planning';
  renderTimeline(); renderTripOverview();
  toast(`${title} toegevoegd aan Dag ${state.activeDay}`);
}
function renderTrips(){
  const trips=JSON.parse(localStorage.getItem('roadoraTripsV3')||'[]');
  $('#savedTrips').innerHTML = trips.length ? trips.map(t=>`<div class="trip-card"><strong>${t.name}</strong><span>${t.days} dagen · ${t.route} · ${t.created}</span></div>`).join('') : '<p class="muted">Nog geen opgeslagen roadtrips. Bewaar je planning om hem later via je account naar de app te sturen.</p>';
}
function renderAll(){updateTexts();renderDays();renderTimeline();renderStops();renderTripOverview();renderTrips(); if(map) setTimeout(()=>map.invalidateSize(),80);}
function bind(){
  $$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active')); $$('.tab-panel').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#'+b.dataset.tab).classList.add('active'); if(map) setTimeout(()=>map.invalidateSize(),150);});
  document.addEventListener('click',e=>{
    const viewStop=e.target.closest('[data-view-stop]');
    if(viewStop){openStopDetail(viewStop.dataset.stopCat, Number(viewStop.dataset.viewStop)); return;}
    const addStop=e.target.closest('[data-add-stop]');
    if(addStop){addStopToActiveDay(addStop.dataset.stopCat, Number(addStop.dataset.addStop)); return;}
    const close=e.target.closest('[data-close-stop-modal]');
    if(close){closeStopDetail(); return;}
    const cat=e.target.closest('[data-cat]'); if(cat){
      const next=cat.dataset.cat;
      if(state.category===next){ state.category=''; clearPlaceMarkers(); renderStops(); toast('Categorie uitgezet'); return; }
      state.category=next;
      if(hasRoute()){
        if(next==='hotels' || next==='laden' || next==='tanken'){
          if(!['live','loading'].includes(state.placeStatus[next])){ resetLiveCategory(next,'loading'); loadLivePlacesFor(next); }
        } else {
          stops[next]=[];
          setPlaceStatus(next,'empty','Deze categorie staat standaard uit en wordt later live gekoppeld.');
        }
      }
      renderStops();
      toast(`${categoryLabel(next)} aan`);
      return;
    }
    const mode=e.target.closest('[data-view]');
    if(mode){
      state.view=mode.dataset.view;
      $$('.mode-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===state.view));
      renderStops();
      return;
    }
    const delDay=e.target.closest('[data-delete-day]'); if(delDay){e.preventDefault(); e.stopPropagation(); deleteTripDay(Number(delDay.dataset.deleteDay)); return;}
    const edit=e.target.closest('.plan-edit');
    if(edit){const row=edit.closest('[data-plan-index]'); const i=Number(row.dataset.planIndex); editingPlanRows.has(i)?editingPlanRows.delete(i):editingPlanRows.add(i); renderTimeline(); return;}
    const saveEdit=e.target.closest('.plan-save');
    if(saveEdit){const row=saveEdit.closest('[data-plan-index]'); const i=Number(row.dataset.planIndex); editingPlanRows.delete(i); renderTimeline(); toast('Planningregel opgeslagen'); return;}
    const remove=e.target.closest('.plan-remove');
    if(remove){const row=remove.closest('[data-plan-index]'); const i=Number(row.dataset.planIndex); dayPlan().splice(i,1); editingPlanRows.clear(); renderTimeline(); toast('Stop verwijderd');}
  });
  document.addEventListener('input',e=>{
    const row=e.target.closest('[data-plan-index]'); if(!row) return;
    const i=Number(row.dataset.planIndex); const plan=dayPlan(); if(!plan[i]) return;
    if(e.target.classList.contains('plan-time-input')) plan[i][0]=e.target.value;
    if(e.target.classList.contains('plan-title-input')) plan[i][1]=e.target.value;
    if(e.target.classList.contains('plan-detail-input')) plan[i][2]=e.target.value;
  });
  document.addEventListener('change',e=>{
    const row=e.target.closest('[data-plan-index]'); if(!row || !e.target.classList.contains('plan-type')) return;
    const i=Number(row.dataset.planIndex); const plan=dayPlan(); if(plan[i]) plan[i][3]=e.target.value;
  });
  $$('[data-vehicle]').forEach(b=>b.onclick=()=>{$$('[data-vehicle]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); state.vehicle=b.dataset.vehicle; renderAll();});
  $$('[data-pet]').forEach(b=>b.onclick=()=>{$$('[data-pet]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); state.pet=b.dataset.pet; renderAll();});
  $$('.pref').forEach(b=>b.onclick=()=>{b.classList.toggle('active'); renderAll();});
  $$('.left-edit-toggle').forEach(btn=>btn.onclick=()=>{const card=btn.closest('[data-left-fold]'); const open=!card.classList.contains('open'); card.classList.toggle('open',open); btn.textContent=open?'Sluiten':'Bewerken'; btn.setAttribute('aria-expanded', String(open));});
  ['origin','destination','date','departTime','hotelArrival','tripDays','vehicleRangeKm','plug','maxDetour'].forEach(id=>$('#'+id)?.addEventListener('input',renderAll));
  $$('input[name="adults"],input[name="children"]').forEach(i=>i.addEventListener('input',renderAll));
  $('#planRoute').onclick=async()=>{await loadRealRoute(); renderAll(); fitMap();};
  $('#addPlanStop')?.addEventListener('click',()=>{const insertAt=Math.max(1,dayPlan().length-1); dayPlan().splice(insertAt,0,['12:00','Nieuwe stop','Zelf invullen of kies later uit Stops','Zelf ingevuld']); editingPlanRows.clear(); editingPlanRows.add(insertAt); renderTimeline(); toast('Stop toegevoegd');});
  $('#addManualStop')?.addEventListener('click',()=>$('#addPlanStop')?.click());
  $('#suggestionToggle')?.addEventListener('click',()=>{
    state.suggestions=!state.suggestions;
    state.view = state.suggestions ? 'recommended' : 'all';
    $$('.mode-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===state.view));
    setRouteZoneMarkersVisible(false);
    renderStops();
    toast(state.suggestions?'Roadora suggesties aan':'Roadora suggesties uit');
  });
  $('#modalAddStop')?.addEventListener('click',()=>{if(state.activeStop){addStopToActiveDay(state.activeStop.cat,state.activeStop.index); closeStopDetail();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeStopDetail();});
  $('#chooseHotelZone')?.addEventListener('click',()=>{const plan=dayPlan(); const idx=plan.findIndex(r=>String(r[1]).toLowerCase().includes('hotel')); if(idx>=0){plan[idx]=[state.arrival.split(' - ')[0]||'17:00','Zelf gekozen overnachting','Vul zelf plaats, regio of hotel in','Overnachten rond'];} else {plan.push([state.arrival.split(' - ')[0]||'17:00','Zelf gekozen overnachting','Vul zelf plaats, regio of hotel in','Overnachten rond']);} renderTimeline(); toast('Overnachting handmatig gezet');});
  $('#recalculatePlan')?.addEventListener('click',async()=>{await loadRealRoute(); renderAll(); toast('Voorstel opnieuw berekend op basis van route en tijden');});
  $('#addTripDay')?.addEventListener('click',()=>{state.days=Math.min(21,state.days+1); const input=$('#tripDays'); if(input) input.value=state.days; state.activeDay=state.days; editingPlanRows.clear(); renderAll(); toast('Dag toegevoegd');});
  $('#mapFit').onclick=fitMap; $('#mapZoomIn').onclick=()=>map?.zoomIn(); $('#mapZoomOut').onclick=()=>map?.zoomOut();
  $('#mapToggleStops').onclick=()=>setRouteZoneMarkersVisible(!routeZoneMarkersVisible);
  function save(){readForm(); const trips=JSON.parse(localStorage.getItem('roadoraTripsV3')||'[]'); trips.unshift({name:`Roadtrip ${state.destination.split(',')[0]}`,route:`${state.origin.split(',')[0]} → ${state.destination.split(',')[0]}`,days:state.days,created:new Date().toLocaleDateString('nl-NL')}); localStorage.setItem('roadoraTripsV3',JSON.stringify(trips.slice(0,4))); renderTrips(); toast('Roadtrip opgeslagen');}
  $('#saveRoute').onclick=save; $('#saveRouteSide').onclick=save; $('#exportApp').onclick=()=>toast('Account/app-export wordt later gekoppeld'); $('#resetDemo').onclick=()=>location.reload();
  $('#acceptCookies')?.addEventListener('click',()=>{localStorage.setItem('roadoraCookie','yes');$('#cookieBanner').classList.remove('show')}); $('#rejectCookies')?.addEventListener('click',()=>{localStorage.setItem('roadoraCookie','no');$('#cookieBanner').classList.remove('show')}); if(!localStorage.getItem('roadoraCookie')) setTimeout(()=>$('#cookieBanner')?.classList.add('show'),900);
}
document.addEventListener('DOMContentLoaded',()=>{ const dateInput=$('#date'); if(dateInput && !dateInput.value) dateInput.value=todayISO(); state.date=dateInput?.value||todayISO(); bind();applyRouteZones();renderAll();setTimeout(initMap,250); });
