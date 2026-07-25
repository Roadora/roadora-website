const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
function todayISO(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function hasRoute(){ return ['google','ors','external-route'].includes(state.routeSource) && Array.isArray(routeCoords) && routeCoords.length > 1; }
function effectiveRangeKm(){ if(Number(state.range)>0) return Number(state.range); if(state.vehicle==='electric') return 325; if(state.vehicle==='camper') return 500; if(state.vehicle==='bus') return 600; if(state.vehicle==='car') return 650; return 650; }
const state = {
  origin:'', destination:'', date:todayISO(), depart:'', arrival:'', days:1,
  adults:2, children:0, pet:'none', vehicle:'', range:0, plug:'CCS', maxDetour:20, activeDay:1, view:'all', category:'', suggestions:false, activeStop:null,
  routeSource:'empty', routeDistanceKm:0, routeDurationMin:0, routeZones:[], placeStatus:{}, dayHotels:{}
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
  hotels:[],
  restaurants:[],
  laden:[],
  tanken:[],
  uitjes:[],
  wc:[]
};
const AUTOSAVE_KEY = 'roadoraPlannerDraftV58';
let autosaveTimer = null;
let restoringDraft = false;
function cloneJsonSafe(value){
  try{return JSON.parse(JSON.stringify(value));}catch(_){return value;}
}
function normalizeTimeValue(value){
  const raw=String(value||'').trim();
  if(!raw || raw==='--:--') return '';
  const compact=raw.replace(/[^0-9]/g,'');
  let hh='', mm='';
  if(/^\d{1,2}:\d{1,2}$/.test(raw)){
    const parts=raw.split(':'); hh=parts[0]; mm=parts[1];
  } else if(compact.length===3){
    hh=compact.slice(0,1); mm=compact.slice(1);
  } else if(compact.length>=4){
    hh=compact.slice(0,2); mm=compact.slice(2,4);
  } else if(compact.length<=2){
    hh=compact; mm='00';
  }
  const h=Number(hh), m=Number(mm);
  if(!Number.isFinite(h)||!Number.isFinite(m)||h<0||h>23||m<0||m>59) return '';
  return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
}

function updateDepartTimeDisplay(){
  const hidden=$('#departTime');
  const display=$('#departTimeDisplay');
  if(!display) return;
  const val=normalizeTimeValue(hidden?.value || state.depart || '');
  display.textContent = val || 'Tijd kiezen';
  display.classList.toggle('is-placeholder', !val);
}
function setDepartTime(value){
  const val=normalizeTimeValue(value);
  const input=$('#departTime');
  if(input) input.value=val;
  state.depart=val;
  updateDepartTimeDisplay();
  renderAll();
}
function activePrefLabels(){return $$('.pref.active').map(b=>b.textContent.trim());}
function applySavedChoices(saved={}){
  if(saved.pet){ $$('.choice[data-pet]').forEach(b=>b.classList.toggle('active', b.dataset.pet===saved.pet)); }
  if(saved.vehicle){ $$('.choice[data-vehicle]').forEach(b=>b.classList.toggle('active', b.dataset.vehicle===saved.vehicle)); }
  else { $$('.choice[data-vehicle]').forEach(b=>b.classList.remove('active')); }
  const prefs=Array.isArray(saved.prefs)?saved.prefs:[];
  $$('.pref').forEach(b=>b.classList.toggle('active', prefs.includes(b.textContent.trim())));
}
function setFormFromState(){
  const set=(id,val)=>{const el=$('#'+id); if(el) el.value = val ?? '';};
  set('origin', state.origin || '');
  set('destination', state.destination || '');
  set('date', state.date || todayISO());
  set('departTime', state.depart || '');
  set('hotelArrival', state.arrival || '');
  set('tripDays', state.days || 1);
  set('vehicleRangeKm', state.range || '');
  set('plug', state.plug || 'CCS');
  set('maxDetour', state.maxDetour || 20);
  const adults=$('[name="adults"]'); if(adults) adults.value=state.adults || 2;
  const children=$('[name="children"]'); if(children) children.value=state.children || 0;
  applySavedChoices({pet:state.pet, vehicle:state.vehicle, prefs:state.prefs||[]});
  updateDepartTimeDisplay();
}
function serializeDraft(){
  readForm();
  return {
    version:'v5.9', savedAt:Date.now(),
    state:{...cloneJsonSafe(state), prefs:activePrefLabels()},
    routeCoords:cloneJsonSafe(routeCoords),
    timelines:cloneJsonSafe(timelines),
    stops:cloneJsonSafe(stops),
    activeTab:$('.tab.active')?.dataset?.tab || 'planning'
  };
}
function saveDraftNow(){
  if(restoringDraft) return;
  try{localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializeDraft()));}catch(err){console.warn('Roadora autosave fout:',err);}
}
function scheduleAutosave(){
  if(restoringDraft) return;
  clearTimeout(autosaveTimer);
  autosaveTimer=setTimeout(saveDraftNow,180);
}
function restoreDraft(){
  const raw=localStorage.getItem(AUTOSAVE_KEY);
  if(!raw) return false;
  try{
    const draft=JSON.parse(raw);
    if(!draft || !draft.state) return false;
    restoringDraft=true;
    Object.assign(state, draft.state);
    state.date=state.date || todayISO();
    state.depart=normalizeTimeValue(state.depart);
    state.days=Math.max(1,Math.min(21,Number(state.days)||1));
    if(Array.isArray(draft.routeCoords)) routeCoords=draft.routeCoords.filter(c=>Array.isArray(c)&&c.length>=2&&Number.isFinite(Number(c[0]))&&Number.isFinite(Number(c[1]))).map(c=>[Number(c[0]),Number(c[1])]);
    if(draft.timelines && typeof draft.timelines==='object'){ Object.keys(timelines).forEach(k=>delete timelines[k]); Object.assign(timelines,draft.timelines); }
    if(draft.stops && typeof draft.stops==='object'){ Object.keys(stops).forEach(k=>{stops[k]=Array.isArray(draft.stops[k])?draft.stops[k]:[];}); }
    setFormFromState();
    restoringDraft=false;
    return true;
  }catch(err){
    restoringDraft=false;
    console.warn('Roadora herstel fout:',err);
    return false;
  }
}
function clearDraft(){
  try{localStorage.removeItem(AUTOSAVE_KEY);}catch(_){}
}
function resetPlanner(){
  clearDraft();
  location.reload();
}
const cats = [['hotels','Hotels'],['restaurants','Restaurants'],['laden','Laden'],['tanken','Tanken'],['uitjes','Uitjes'],['wc','WC']];
const categorySpecs = {
  hotels: {
    singular:'hotel', action:'Bekijk hotel', type:'overnachten rond je stopmoment',
    recommended:'Hotels rond je gekozen aankomsttijdvak', all:'Hotels rond je gekozen aankomsttijdvak',
    sort:'Maximaal 30 hotels rond je gekozen aankomsttijdvak. Resultaten tonen afstand vanaf vertrek en verwachte aankomst.',
    match:['Overnachten rond', 'Weinig omrijden', 'Past bij route'],
    why:['Ligt logisch langs je route', 'Je kiest zelf of je hier wilt overnachten', 'Zo min mogelijk omrijden']
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
const FEATURE_ROADORA_SUGGESTIONS = false; // tijdelijk on hold: eerst routeflow perfectioneren
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
  const max = state.category==='hotels' ? 20 : 40;
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
  renderRouteZoneMarkers(false);
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
  if(!FEATURE_ROADORA_SUGGESTIONS){ markers=[]; routeZoneMarkersVisible=false; setRouteZoneMarkersVisible(false); return; }
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
  // Roadora-suggesties staan tijdelijk on hold.
  // Bewust geen automatische pauze-, lunch-, laad-, tank- of hotelmomenten.
  state.routeZones=[];
  markerData=[];
  state.dayHotels={};
  const originName=(state.origin||'vertrekpunt').split(',')[0];
  const destName=(state.destination||'bestemming').split(',')[0];
  timelines[1]=[
    [state.depart || '—',`Vertrek ${originName}`,'Start van je route','Vertrek'],
    ['—',`Aankomst ${destName}`,`${Math.round(state.routeDistanceKm||0)} km · ${durationLabel(state.routeDurationMin||0)}`,'Bestemming']
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
function arrivalSlotLabel(value=state.arrival){
  const labels={'12-14':'12:00 - 14:00','14-16':'14:00 - 16:00','16-18':'16:00 - 18:00','18-20':'18:00 - 20:00','20-22':'20:00 - 22:00'};
  return labels[value] || '';
}
function arrivalSlotCenterHour(value=state.arrival){
  const m=String(value||'').match(/^(\d{1,2})-(\d{1,2})$/);
  if(!m) return null;
  return (Number(m[1])+Number(m[2]))/2;
}
function hasValidDepartTime(){ return /^\d{1,2}:\d{2}$/.test(String(state.depart||'')); }
function activePreferenceTexts(){ return $$('.pref.active').map(b=>b.textContent.trim().toLowerCase()); }
function hotelSearchHint(){
  const prefs=activePreferenceTexts();
  const parts=[];
  if(state.pet && state.pet!=='none') parts.push('pet friendly');
  if(state.children>0 || prefs.some(p=>p.includes('familie') || p.includes('kind'))) parts.push('family');
  if(prefs.some(p=>p.includes('parkeren'))) parts.push('parking');
  if(prefs.some(p=>p.includes('ontbijt'))) parts.push('breakfast');
  return parts.slice(0,3).join(' ');
}
function progressForHotelArrivalSlot(){
  const center=arrivalSlotCenterHour();
  if(!Number.isFinite(center)) return null;
  const depart=String(state.depart||'').match(/^(\d{1,2}):(\d{2})$/);
  if(depart && Number(state.routeDurationMin)>0){
    const departHour=Number(depart[1])+(Number(depart[2])/60);
    let elapsedHours=center-departHour;
    if(elapsedHours<0) elapsedHours+=24;
    return Math.max(0.06, Math.min(0.96, (elapsedHours*60)/Math.max(1,Number(state.routeDurationMin))));
  }
  // Zonder vertrektijd kan Roadora niet betrouwbaar bepalen waar je rond het tijdvak op de route bent.
  return null;
}
function routePointAtProgress(progress,index=0){
  const coords=Array.isArray(routeCoords)?routeCoords:[];
  if(coords.length<2) return null;
  const p=Math.max(0,Math.min(1,Number(progress)||0));
  const idx=Math.max(0,Math.min(coords.length-1,Math.round(p*(coords.length-1))));
  const c=coords[idx];
  return c ? {lat:c[0],lng:c[1],index,progress:p,distanceFromStartMeters:Math.round((state.routeDistanceKm||0)*1000*p)} : null;
}
function hotelArrivalSearchPoints(){
  const depart=String(state.depart||'').match(/^(\d{1,2}):(\d{2})$/);
  const slot=String(state.arrival||'').match(/^(\d{1,2})-(\d{1,2})$/);
  const duration=Number(state.routeDurationMin)||0;
  if(!depart || !slot || duration<=0) return [];
  const departHour=Number(depart[1])+(Number(depart[2])/60);
  const startHour=Number(slot[1]);
  const endHour=Number(slot[2]);
  const hours=[startHour,(startHour+endHour)/2,endHour];
  const progresses=hours.map(hour=>{
    let elapsed=hour-departHour;
    if(elapsed<0) elapsed+=24;
    return Math.max(0.06, Math.min(0.96, (elapsed*60)/Math.max(1,duration)));
  });
  return [...new Set(progresses.map(p=>Math.round(p*1000)/1000))]
    .map((x,i)=>routePointAtProgress(x,i))
    .filter(Boolean);
}
function formatMinutesAsClock(totalMinutes){
  const minutes=((Math.round(Number(totalMinutes)||0)%1440)+1440)%1440;
  const h=Math.floor(minutes/60);
  const m=minutes%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function minutesFromClock(value){
  const m=String(value||'').match(/^(\d{1,2}):(\d{2})$/);
  if(!m) return null;
  const h=Number(m[1]), min=Number(m[2]);
  if(!Number.isFinite(h)||!Number.isFinite(min)||h<0||h>23||min<0||min>59) return null;
  return h*60+min;
}
function addMinutesToClock(value, extraMinutes){
  const base=minutesFromClock(value);
  if(base===null || !Number.isFinite(Number(extraMinutes))) return '—';
  return formatMinutesAsClock(base + Number(extraMinutes));
}
function syncFollowingDayArrival(day){
  const d=Number(day)||state.activeDay;
  if(d<=1) return;
  const prev=selectedHotelForDay(d-1);
  const plan=timelines[d];
  if(!prev || !plan || plan.length<2) return;
  const startTime = safeTimeValue(plan[0]?.[0]) || state.depart || '';
  const arrival = addMinutesToClock(startTime, prev.info?.remainingMin);
  if(arrival && arrival !== '—'){
    plan[plan.length-1][0] = arrival;
    plan[plan.length-1][2] = shortRouteDetailForDay(d);
  }
}
function syncAllFollowingDayArrivals(){
  for(let d=2; d<=Number(state.days||1); d++) syncFollowingDayArrival(d);
}
function hotelTripMeta(meta={}){
  const lines=[];
  const meters=Number(meta.distanceFromStartMeters);
  const km=Number.isFinite(meters) ? Math.round(meters/1000) : (Number.isFinite(Number(meta.distanceFromStartKm)) ? Math.round(Number(meta.distanceFromStartKm)) : null);
  if(Number.isFinite(km)) lines.push(`${km} km vanaf vertrek`);
  const progress=Number.isFinite(Number(meta.routeProgress)) ? Number(meta.routeProgress) : (Number(state.routeDistanceKm)>0 && Number.isFinite(km) ? km/Number(state.routeDistanceKm) : null);
  const depart=String(state.depart||'').match(/^(\d{1,2}):(\d{2})$/);
  if(depart && Number.isFinite(progress) && Number(state.routeDurationMin)>0){
    const departMinutes=Number(depart[1])*60+Number(depart[2]);
    const arrival=departMinutes + (Number(state.routeDurationMin)*progress);
    lines.push(`aankomst ± ${formatMinutesAsClock(arrival)}`);
  }
  return lines;
}

function hotelTripInfo(meta={}){
  const meters=Number(meta.distanceFromStartMeters);
  const km=Number.isFinite(meters) ? Math.round(meters/1000) : (Number.isFinite(Number(meta.distanceFromStartKm)) ? Math.round(Number(meta.distanceFromStartKm)) : null);
  const progress=Number.isFinite(Number(meta.routeProgress)) ? Number(meta.routeProgress) : (Number(state.routeDistanceKm)>0 && Number.isFinite(km) ? km/Number(state.routeDistanceKm) : null);
  const depart=String(state.depart||'').match(/^(\d{1,2}):(\d{2})$/);
  let arrivalTime='—';
  if(depart && Number.isFinite(progress) && Number(state.routeDurationMin)>0){
    const departMinutes=Number(depart[1])*60+Number(depart[2]);
    arrivalTime=formatMinutesAsClock(departMinutes + (Number(state.routeDurationMin)*progress));
  }
  const remainingKm = Number.isFinite(km) && Number(state.routeDistanceKm)>0 ? Math.max(0, Math.round(Number(state.routeDistanceKm)-km)) : null;
  const remainingMin = Number.isFinite(progress) && Number(state.routeDurationMin)>0 ? Math.max(0, Math.round(Number(state.routeDurationMin)*(1-progress))) : null;
  return {km,progress,arrivalTime,remainingKm,remainingMin};
}
function selectedHotelForDay(day=state.activeDay){
  return state.dayHotels && state.dayHotels[day] ? state.dayHotels[day] : null;
}
function dayStartName(day){
  const origin=(state.origin||'').split(',')[0].trim() || 'vertrekpunt';
  if(day<=1) return origin;
  const previousHotel=selectedHotelForDay(day-1);
  if(previousHotel?.name) return previousHotel.name;
  return `dag ${day}`;
}
function dayEndName(day){
  const dest=(state.destination||'').split(',')[0].trim() || 'bestemming';
  const hotel=selectedHotelForDay(day);
  if(hotel?.name) return hotel.name;
  if(day===state.days) return dest;
  return 'eindpunt later kiezen';
}
function shortRouteDetailForDay(day){
  const hotel=selectedHotelForDay(day);
  if(hotel){
    const bits=[];
    if(Number.isFinite(hotel.info?.km)) bits.push(`${hotel.info.km} km vanaf vertrek`);
    if(hotel.info?.arrivalTime && hotel.info.arrivalTime!=='—') bits.push(`aankomst ± ${hotel.info.arrivalTime}`);
    const detour=hotel.meta?.detourLabel || '± 10 min van route';
    bits.push(detour);
    return bits.join(' · ');
  }
  if(day>1 && selectedHotelForDay(day-1)){
    const prev=selectedHotelForDay(day-1);
    const bits=[];
    if(Number.isFinite(prev.info?.remainingKm)) bits.push(`${prev.info.remainingKm} km resterend`);
    if(Number.isFinite(prev.info?.remainingMin)) bits.push(durationLabel(prev.info.remainingMin));
    return bits.join(' · ') || 'vanaf gekozen overnachting';
  }
  return `${Math.round(state.routeDistanceKm||0)} km · ${durationLabel(state.routeDurationMin||0)}`;
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
  if(state.suggestions && state.view==='recommended') return list.slice(0,state.category==='hotels'?8:6);
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
  if(cat==='hotels') hotelTripMeta(place).forEach(x=>bits.push(x));
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
  if(cat==='hotels' && !hasValidDepartTime()){
    stops.hotels=[];
    clearPlaceMarkers();
    setPlaceStatus('hotels','empty','Vul eerst je vertrektijd in. Dan kunnen we bepalen waar je rond je aankomsttijdvak op de route bent.');
    return false;
  }
  if(cat==='hotels' && !arrivalSlotLabel()){
    stops.hotels=[];
    clearPlaceMarkers();
    setPlaceStatus('hotels','empty','Kies eerst een aankomsttijdvak. Dan zoeken we hotels rond het juiste deel van je route.');
    return false;
  }
  const points = cat==='hotels'
    ? hotelArrivalSearchPoints()
    : (isEnergyCategory(cat) ? energySearchPoints() : routeSamplePoints(10,{includeEnds:false}));
  if(!points.length){
    setPlaceStatus(cat,'empty',cat==='hotels'?'Kies eerst een geldig aankomsttijdvak.':'Geen zoekpunt op de route gevonden.');
    return false;
  }
  try{
    const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({points,radiusMeters:cat==='hotels'?22000:7000,mode:cat==='hotels'?'arrival_window_hotels_cost_safe':'route_quick',maxResults:cat==='hotels'?30:40,hotelHint:cat==='hotels'?hotelSearchHint():''})});
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
    updateMapRoute();
    saveDraftNow();
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
      applyRouteZones(); renderAll(); updateMapRoute(); saveDraftNow();
    }
  }catch(err){console.warn('setGoogleRoute fout:',err);}
};
function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }
function activateTab(tabId){
  $$('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===tabId));
  $$('.tab-panel').forEach(x=>x.classList.toggle('active',x.id===tabId));
  if(map) setTimeout(()=>map.invalidateSize(),150);
}
function readForm(){
  state.origin=($('#origin')?.value||'').trim();
  state.destination=($('#destination')?.value||'').trim();
  state.date=$('#date')?.value || todayISO();
  state.depart=normalizeTimeValue($('#departTime')?.value || '');
  state.arrival=$('#hotelArrival')?.value || '';
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
  setText('#sideHotel',arrivalSlotLabel() ? `hotel aankomst ${arrivalSlotLabel()}` : 'geen tijdvak gekozen');
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
  setText('#activeDaySummary', hasRoute() ? `Dag ${state.activeDay} · ${dayRouteLabel(state.activeDay)}` : 'Dag 1 · nog niet gepland');
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
function dayRouteLabel(day){
  const start=dayStartName(day);
  const end=dayEndName(day);
  if(!hasRoute() && day===1) return 'nog niet gepland';
  return start && end ? `${start} → ${end}` : 'dagroute';
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
  syncAllFollowingDayArrivals();
  const list=$('#overviewDayList');
  if(list){
    list.innerHTML='';
    for(let i=1;i<=state.days;i++){
      const b=document.createElement('button');
      b.type='button';
      b.className='overview-day-row'+(i===state.activeDay?' active':'');
      b.innerHTML=`<span class="overview-day-num">Dag ${i}</span><span class="overview-day-main"><strong>${dayRouteLabel(i)}</strong><em>${i===state.activeDay?'actieve dag':dayStatus(i)}</em></span><button class="overview-day-delete" type="button" data-delete-day="${i}" title="Dag verwijderen">Verwijder</button>`;
      b.onclick=(e)=>{if(e.target.closest('[data-delete-day]')) return; state.activeDay=i; editingPlanRows.clear(); renderAll();};
      list.appendChild(b);
    }
  }
  const detail=$('#activeDayDetail');
  if(detail){
    const plan=dayPlan();
    const hotel=selectedHotelForDay(state.activeDay);
    const endpointTitle = hotel ? `Hotel / eindpunt` : (state.activeDay===state.days ? 'Bestemming / eindpunt' : 'Eindpunt');
    const endpointText = hotel
      ? `${hotel.name} · ${shortRouteDetailForDay(state.activeDay)}`
      : shortRouteDetailForDay(state.activeDay);
    detail.innerHTML = `<div class="active-day-head"><strong>${dayRouteLabel(state.activeDay)}</strong><span>${dayStatus(state.activeDay)} · ${plan.length} momenten</span></div>` +
      `<div class="active-day-mini-list">${plan.map(r=>`<div><span>${safeReadTime(r[0])}</span><strong>${escapeHtml(r[1])}</strong></div>`).join('')}</div>` +
      `<div class="active-day-note"><strong>${endpointTitle}</strong><span>${escapeHtml(endpointText)}</span></div>`;
  }
}
function dayPlan(){
  if(!timelines[state.activeDay]){
    const start=dayStartName(state.activeDay);
    const end=dayEndName(state.activeDay);
    const startTime = state.activeDay===1 ? (state.depart || '—') : '—';
    timelines[state.activeDay] = [
      [startTime,`Vertrek ${start}`,'Start van deze reisdag','Vertrek'],
      ['—',`Aankomst ${end}`,shortRouteDetailForDay(state.activeDay),'Bestemming']
    ];
  }
  syncFollowingDayArrival(state.activeDay);
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
function stopWindow(cat){ const z=zoneForCategory(cat); return z ? (cat==='hotels' ? 'zelf gekozen' : `rond ${z.time}`) : ({hotels:'zelf gekozen',restaurants:'rond 13:00',laden:'rond 15:15',tanken:'rond 15:15',uitjes:'flexibel onderweg',wc:'wanneer nodig'}[cat]||'onderweg');}
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
  const tripMeta = cat==='hotels' ? hotelTripMeta(meta).map(x=>`<span>${escapeHtml(x)}</span>`).join('') : '';
  const why = stopWhyList(cat).slice(0, compact ? 2 : 3).map(x=>`<span>${escapeHtml(x)}</span>`).join('');
  const photoStyle = meta.photoUrl ? ` style="background-image:url('${escapeHtml(meta.photoUrl)}')"` : '';
  const livePill = meta.live ? '<span class="live-place-pill">live</span>' : '';
  return `<div class="stop-result ${showPhoto?'has-photo':'no-photo'} ${meta.live?'live-place':''}" data-stop-card="${originalIndex}" data-stop-cat="${cat}">
    ${showPhoto ? `<button class="${stopVisualClass(cat,index)} has-live-photo"${photoStyle} data-view-stop="${originalIndex}" data-stop-cat="${cat}" type="button" aria-label="${primaryAction} ${name}"></button>` : ''}
    <div class="stop-result-main">
      <strong>${name}${livePill}</strong>
      <p>${desc}</p>
      <div class="stop-match-line">${labels}</div>
      ${tripMeta ? `<div class="stop-trip-line">${tripMeta}</div>` : ''}
      <div class="stop-why-line">${why}</div>
      <div class="stop-result-actions-inline">
        <button class="text-action" data-view-stop="${originalIndex}" data-stop-cat="${cat}" type="button">${primaryAction}</button>
        <button class="text-action add" data-add-stop="${originalIndex}" data-stop-cat="${cat}" type="button">Toevoegen</button>
      </div>
    </div>
  </div>`;
}
function renderStops(){
  state.suggestions = false;
  state.view = 'all';
  $$('.mode-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===state.view));
  $('#categoryTabs').innerHTML = cats.map(([id,label])=>`<button class="category-btn ${id===state.category?'active':''}" data-cat="${id}" type="button" aria-pressed="${id===state.category?'true':'false'}">${label}</button>`).join('');
  const suggestionToggle = $('#suggestionToggle');
  if(suggestionToggle){
    suggestionToggle.textContent = 'Roadora suggesties uit';
    suggestionToggle.setAttribute('aria-pressed', 'false');
    suggestionToggle.classList.add('off');
  }
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
    const empty = `<div class="empty-stops"><strong>Stops staan uit.</strong><span>Kies handmatig Hotels, Laden of Tanken. Pas dan haalt Roadora live locaties op en verschijnen pins op de kaart.</span></div>`;
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
    ? (isEnergyCategory(state.category) ? recommendedEnergyStops(rawSelected).slice(0,10) : rawSelected.slice(0, state.category==='hotels'?20:6))
    : [];
  const recTitle = state.suggestions ? categoryTitle(state.category,'recommended') : 'Zelf zoeken actief';
  const allTitle = categoryTitle(state.category,'all');
  $('#recommendTitle').textContent = recTitle;
  $('#allStopsTitle').textContent = allTitle;
  const recommendSub = $('#recommendPanel .tiny-muted') || $('#recommendPanel .stops-subhead .mini-link');
  const allSub = $('#allStopsPanel .tiny-muted');
  if(allSub) allSub.textContent = categorySpec(state.category).sort;
  const suggestionToggle2 = $('#suggestionToggle');
  if(suggestionToggle2){
    suggestionToggle2.textContent = 'Roadora suggesties uit';
    suggestionToggle2.setAttribute('aria-pressed', 'false');
    suggestionToggle2.classList.add('off');
  }
  const status = state.placeStatus[state.category] || (selected.length ? 'demo' : 'empty');
  const statusMessage = state.placeStatus[`${state.category}Message`] || '';
  const emptyHtml = status==='loading'
    ? `<div class="empty-stops"><strong>Live resultaten laden…</strong><span>Roadora zoekt nu rond je gekozen tijdvak of routezone.</span></div>`
    : status==='error'
      ? `<div class="empty-stops error"><strong>Live resultaten niet geladen.</strong><span>${escapeHtml(statusMessage || 'Controleer je API-key, Vercel env vars of Network-tab.')}</span></div>`
      : `<div class="empty-stops"><strong>Nog geen live resultaten gevonden.</strong><span>${escapeHtml(statusMessage || 'Probeer een grotere regio of bereken de route opnieuw.')}</span></div>`;
  $('#recommendations').innerHTML = state.suggestions
    ? (recommended.length ? recommended.map((s,i)=>stopCardHtml(s,i,state.category,false,s?.[2]?.__stopIndex ?? i)).join('') : emptyHtml)
    : `<div class="empty-stops"><strong>Roadora suggesties staan uit.</strong><span>Gebruik de categorieknoppen om zelf te bepalen welke stops op kaart komen.</span></div>`;
  $('#allStops').innerHTML = rawSelected.length ? rawSelected.map((s,i)=>stopCardHtml(s,i,state.category,true,s?.[2]?.__stopIndex ?? i)).join('') : emptyHtml;
  $('#recommendPanel')?.classList.add('hidden');
  $('#allStopsPanel')?.classList.remove('hidden');
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
  const tags = [categorySingular(cat), state.children>0?'gezin als voorkeur':null, state.pet==='dog'?'hond als voorkeur':null, state.range>0?`${state.range} km rijbereik`:null, meta.provider || null].filter(Boolean);
  $('#stopModalTags').innerHTML = tags.map(t=>`<span>${escapeHtml(t)}</span>`).join('');
  const modal=$('#stopDetailModal'); modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
}
function closeStopDetail(){const modal=$('#stopDetailModal'); if(!modal) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');}
function addStopToActiveDay(cat,index){
  const item=(stops[cat]||[])[index]; if(!item) return;
  const title=item[0];
  const desc=typeof item[1]==='function'?item[1]():item[1];
  const meta=item[2]||{};
  const plan=dayPlan();
  if(cat==='hotels'){
    const info=hotelTripInfo(meta);
    const arrivalTime = info.arrivalTime && info.arrivalTime!=='—' ? info.arrivalTime : '—';
    state.dayHotels[state.activeDay]={name:title,desc,meta,info};
    const start=dayStartName(state.activeDay);
    timelines[state.activeDay]=[
      [state.activeDay===1 ? (state.depart || '—') : (plan[0]?.[0] || '—'), `Vertrek ${start}`, 'Start van deze reisdag', 'Vertrek'],
      [arrivalTime, `Aankomst ${title}`, shortRouteDetailForDay(state.activeDay), 'Hotel']
    ];
    if(state.activeDay < state.days){
      const next=state.activeDay+1;
      const dest=(state.destination||'').split(',')[0].trim() || 'bestemming';
      const nextStartTime = state.depart || '—';
      const nextArrivalTime = addMinutesToClock(nextStartTime, info.remainingMin);
      timelines[next]=[
        [nextStartTime, `Vertrek ${title}`, 'Start vanaf gekozen overnachting', 'Vertrek'],
        [nextArrivalTime, `Aankomst ${dest}`, shortRouteDetailForDay(next), 'Bestemming']
      ];
      syncFollowingDayArrival(next);
    }
    editingPlanRows.clear();
    activateTab('planningTab');
    renderAll();
    saveDraftNow();
    toast(`${title} ingesteld als eindpunt van Dag ${state.activeDay}`);
    return;
  }
  const time = {restaurants:'13:00',laden:'15:15',tanken:'15:15',uitjes:'14:30',wc:'11:00'}[cat]||'12:00';
  const type = {restaurants:'Lunch',laden:'Laden/tanken',tanken:'Laden/tanken',uitjes:'Uitje',wc:'Pauze'}[cat]||'Stop';
  const insertAt=Math.max(1,plan.length-1);
  plan.splice(insertAt,0,[time,title,desc,type]);
  editingPlanRows.clear();
  activateTab('planningTab');
  renderTimeline(); renderTripOverview();
  toast(`${title} toegevoegd aan Dag ${state.activeDay}`);
}
function renderTrips(){
  const trips=JSON.parse(localStorage.getItem('roadoraTripsV3')||'[]');
  $('#savedTrips').innerHTML = trips.length ? trips.map(t=>`<div class="trip-card"><strong>${t.name}</strong><span>${t.days} dagen · ${t.route} · ${t.created}</span></div>`).join('') : '<p class="muted">Nog geen opgeslagen roadtrips. Bewaar je planning om hem later via je account naar de app te sturen.</p>';
}
function renderAll(){updateTexts();renderDays();renderTimeline();renderStops();renderTripOverview();renderTrips(); if(map) setTimeout(()=>map.invalidateSize(),80); scheduleAutosave();}

function clockParts(value){
  const val=normalizeTimeValue(value) || '09:00';
  const [hh,mm]=val.split(':').map(Number);
  return {hour:Number.isFinite(hh)?hh:9, minute:Number.isFinite(mm)?mm:0};
}
function buildRoundClock(selectedHour){
  const face=$('#roundClock');
  if(!face) return;
  const radius=98;
  const center=123;
  let html='<div id="clockHand" class="clock-hand"></div><div class="clock-center"></div>';
  for(let hour=0; hour<24; hour++){
    const label=String(hour).padStart(2,'0');
    const angle=((hour % 12) / 12) * Math.PI * 2 - Math.PI/2;
    const ring = hour < 12 ? radius : 67;
    const x=center + Math.cos(angle)*ring;
    const y=center + Math.sin(angle)*ring;
    html += `<button class="clock-hour${hour===selectedHour?' active':''}" type="button" data-clock-hour="${hour}" style="left:${x}px;top:${y}px">${label}</button>`;
  }
  face.innerHTML=html;
  updateClockHand(selectedHour);
}
function updateClockHand(hour){
  const hand=$('#clockHand');
  if(!hand) return;
  const angle=((Number(hour)||0)%12)*30;
  hand.style.transform=`translate(-50%,-100%) rotate(${angle}deg)`;
}
function openClockPicker(){
  const modal=$('#departClockModal');
  if(!modal) return;
  let {hour,minute}=clockParts(state.depart || $('#departTime')?.value || '09:00');
  const sync=()=>{
    const val=`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
    const display=$('#clockDisplay');
    if(display) display.textContent=val;
    $$('.minute-chip').forEach(b=>b.classList.toggle('active', Number(b.dataset.minute)===minute));
    $$('.clock-hour').forEach(b=>b.classList.toggle('active', Number(b.dataset.clockHour)===hour));
    updateClockHand(hour);
  };
  buildRoundClock(hour);
  sync();
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  const onClick=(e)=>{
    const h=e.target.closest('[data-clock-hour]');
    if(h){ hour=Number(h.dataset.clockHour); sync(); return; }
    const m=e.target.closest('[data-minute]');
    if(m){ minute=Number(m.dataset.minute); sync(); return; }
    if(e.target.closest('#confirmDepartClock')){ setDepartTime(`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`); close(); return; }
    if(e.target.closest('#clearDepartClock')){ setDepartTime(''); close(); return; }
    if(e.target.closest('[data-clock-close]')){ close(); return; }
  };
  const onKey=(e)=>{ if(e.key==='Escape') close(); };
  function close(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    modal.removeEventListener('click',onClick);
    document.removeEventListener('keydown',onKey);
  }
  modal.addEventListener('click',onClick);
  document.addEventListener('keydown',onKey);
}

function bind(){
  $$('.tab').forEach(b=>b.onclick=()=>activateTab(b.dataset.tab));
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
        if(next==='hotels'){
          if(!hasValidDepartTime()){
            stops.hotels=[]; clearPlaceMarkers();
            setPlaceStatus('hotels','empty','Vul eerst je vertrektijd in. Dan kunnen we bepalen waar je rond je aankomsttijdvak op de route bent.');
            toast('Vul eerst je vertrektijd in');
          } else if(!arrivalSlotLabel()){
            stops.hotels=[]; clearPlaceMarkers();
            setPlaceStatus('hotels','empty','Kies eerst een aankomsttijdvak. Dan zoeken we hotels rond het juiste deel van je route.');
            toast('Kies eerst een aankomsttijdvak voor hotels');
          } else if(!['live','loading'].includes(state.placeStatus.hotels)){
            resetLiveCategory('hotels','loading');
            loadLivePlacesFor('hotels');
          }
        } else if(next==='laden' || next==='tanken'){
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
      state.view='all';
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
    if(e.target.classList.contains('plan-time-input')){ plan[i][0]=e.target.value; if(i===0) syncFollowingDayArrival(state.activeDay); }
    if(e.target.classList.contains('plan-title-input')) plan[i][1]=e.target.value;
    if(e.target.classList.contains('plan-detail-input')) plan[i][2]=e.target.value;
    scheduleAutosave();
  });
  document.addEventListener('change',e=>{
    const row=e.target.closest('[data-plan-index]'); if(!row || !e.target.classList.contains('plan-type')) return;
    const i=Number(row.dataset.planIndex); const plan=dayPlan(); if(plan[i]) plan[i][3]=e.target.value;
    scheduleAutosave();
  });
  $$('[data-vehicle]').forEach(b=>b.onclick=()=>{$$('[data-vehicle]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); state.vehicle=b.dataset.vehicle; renderAll();});
  $$('[data-pet]').forEach(b=>b.onclick=()=>{$$('[data-pet]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); state.pet=b.dataset.pet; renderAll();});
  $$('.pref').forEach(b=>b.onclick=()=>{b.classList.toggle('active'); renderAll();});
  $$('.left-edit-toggle').forEach(btn=>btn.onclick=()=>{const card=btn.closest('[data-left-fold]'); const open=!card.classList.contains('open'); card.classList.toggle('open',open); btn.textContent=open?'Sluiten':'Bewerken'; btn.setAttribute('aria-expanded', String(open));});
  ['origin','destination','date','tripDays','vehicleRangeKm','plug','maxDetour'].forEach(id=>$('#'+id)?.addEventListener('input',renderAll));
  $('#openDepartClock')?.addEventListener('click',()=>openClockPicker());
  updateDepartTimeDisplay();
  $('#hotelArrival')?.addEventListener('input',()=>{ stops.hotels=[]; clearPlaceMarkers(); setPlaceStatus('hotels','idle','Klik op Hotels om rond dit aankomsttijdvak te zoeken. Vertrektijd is hiervoor nodig.'); renderAll(); });
  $$('input[name="adults"],input[name="children"]').forEach(i=>i.addEventListener('input',renderAll));
  $('#planRoute').onclick=async()=>{await loadRealRoute(); renderAll(); fitMap();};
  $('#addPlanStop')?.addEventListener('click',()=>{const insertAt=Math.max(1,dayPlan().length-1); dayPlan().splice(insertAt,0,['12:00','Nieuwe stop','Zelf invullen of kies later uit Stops','Zelf ingevuld']); editingPlanRows.clear(); editingPlanRows.add(insertAt); renderTimeline(); toast('Stop toegevoegd');});
  $('#addManualStop')?.addEventListener('click',()=>$('#addPlanStop')?.click());
  $('#suggestionToggle')?.addEventListener('click',()=>{
    state.suggestions=false;
    state.view='all';
    setRouteZoneMarkersVisible(false);
    renderStops();
    toast('Roadora suggesties staan tijdelijk on hold');
  });
  $('#modalAddStop')?.addEventListener('click',()=>{if(state.activeStop){addStopToActiveDay(state.activeStop.cat,state.activeStop.index); closeStopDetail();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeStopDetail();});
  $('#chooseHotelZone')?.addEventListener('click',()=>{ state.category='hotels'; state.view='all'; state.suggestions=false; if(hasRoute()){ if(!hasValidDepartTime()){ stops.hotels=[]; clearPlaceMarkers(); setPlaceStatus('hotels','empty','Vul eerst je vertrektijd in. Dan kunnen we bepalen waar je rond je aankomsttijdvak op de route bent.'); toast('Vul eerst je vertrektijd in'); } else if(!arrivalSlotLabel()){ stops.hotels=[]; clearPlaceMarkers(); setPlaceStatus('hotels','empty','Kies eerst een aankomsttijdvak. Dan zoeken we hotels rond het juiste deel van je route.'); toast('Kies eerst een aankomsttijdvak voor hotels'); } else if(!['live','loading'].includes(state.placeStatus.hotels)){ resetLiveCategory('hotels','loading'); loadLivePlacesFor('hotels'); } } renderStops(); });
  $('#recalculatePlan')?.addEventListener('click',async()=>{await loadRealRoute(); renderAll(); toast('Route opnieuw berekend');});
  $('#addTripDay')?.addEventListener('click',()=>{state.days=Math.min(21,state.days+1); const input=$('#tripDays'); if(input) input.value=state.days; state.activeDay=state.days; editingPlanRows.clear(); renderAll(); toast('Dag toegevoegd');});
  $('#mapFit').onclick=fitMap; $('#mapZoomIn').onclick=()=>map?.zoomIn(); $('#mapZoomOut').onclick=()=>map?.zoomOut();
  $('#mapToggleStops').onclick=()=>toast('Stopmoment-suggesties staan tijdelijk on hold');
  function save(){readForm(); const trips=JSON.parse(localStorage.getItem('roadoraTripsV3')||'[]'); trips.unshift({name:`Roadtrip ${state.destination.split(',')[0]}`,route:`${state.origin.split(',')[0]} → ${state.destination.split(',')[0]}`,days:state.days,created:new Date().toLocaleDateString('nl-NL')}); localStorage.setItem('roadoraTripsV3',JSON.stringify(trips.slice(0,4))); renderTrips(); saveDraftNow(); toast('Roadtrip opgeslagen');}
  $('#saveRoute').onclick=save; $('#saveRouteSide').onclick=save; $('#exportApp').onclick=()=>toast('Account/app-export wordt later gekoppeld'); $('#resetDemo').onclick=resetPlanner;
  $('#acceptCookies')?.addEventListener('click',()=>{localStorage.setItem('roadoraCookie','yes');$('#cookieBanner').classList.remove('show')}); $('#rejectCookies')?.addEventListener('click',()=>{localStorage.setItem('roadoraCookie','no');$('#cookieBanner').classList.remove('show')}); if(!localStorage.getItem('roadoraCookie')) setTimeout(()=>$('#cookieBanner')?.classList.add('show'),900);
}
document.addEventListener('DOMContentLoaded',()=>{ const dateInput=$('#date'); if(dateInput && !dateInput.value) dateInput.value=todayISO(); state.date=dateInput?.value||todayISO(); restoreDraft(); bind(); updateDepartTimeDisplay(); applyRouteZones();renderAll();setTimeout(()=>{initMap(); if(hasRoute()){setTimeout(()=>{updateMapRoute(); fitMap();},250);}},250); });
