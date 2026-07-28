document.addEventListener('DOMContentLoaded',()=>{
  document.body.dataset.roadoraBuild=ROADORA_BUILD;
  const build=$('#roadoraBuild'); if(build) build.textContent=ROADORA_BUILD;
},{once:true});

const ROADORA_BUILD='v6.6.3';
window.ROADORA_BUILD=ROADORA_BUILD;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
function todayISO(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function hasRoute(){ return ['google','ors','external-route'].includes(state.routeSource) && Array.isArray(routeCoords) && routeCoords.length > 1; }
function effectiveRangeKm(){ if(Number(state.range)>0) return Number(state.range); if(state.vehicle==='electric') return 325; if(state.vehicle==='camper') return 500; if(state.vehicle==='bus') return 600; if(state.vehicle==='car') return 650; return 650; }
function createDefaultState(){
  return {
    tripId:'', tripName:'', origin:'', destination:'', date:todayISO(), depart:'', arrival:'', days:1,
    adults:2, children:0, pet:'none', vehicle:'', range:0, plug:'CCS', maxDetour:20, activeDay:1, view:'all', category:'', suggestions:false, activeStop:null,
    routeSource:'empty', routeDistanceKm:0, routeDurationMin:0, routeZones:[], placeStatus:{}, dayHotels:{}, routePreference:'fastest', routeVariantId:'', routeVariantSummaries:[], routeMismatchCount:0, foodType:'restaurant', outingType:'highlights', tripType:'single', roundtripStops:[], foodSearchRadiusKm:10, foodSearchCenter:null, outingSearchMode:'place', outingSearchRadiusKm:25, outingSearchQuery:'', outingSearchTerm:'', outingAreaQuery:'', outingSearchCenter:null
  };
}
const state = createDefaultState();
const editingPlanRows = new Set();
let routeCoords = [];
let routeVariants = [];
let routeGeometryCache = null;
let replacingPlanStop = null;
let markerData = [];
let searchCenterMarker = null;
let manualPlaceMarker = null;
let mapPickMode = '';
let pendingMapPickResolve = null;
const recs = [
  ['Hotels rond je overnachting','Overnachten rond je stopmoment · parkeren · weinig omrijden'],
  ['Eten rond je huidige locatie','Restaurant, fastfood, lunch, koffie of supermarkt binnen 10 km'],
  ['Laden of tanken','Binnen jouw rijbereik · combineren met pauze of lunch'],
  ['Uitjes en korte stops','Korte wandeling · speeltuin · uitzichtpunt · rustig aankomen'],
  ['WC en pauzeplekken','Praktisch onderweg · koffie · parkeren · snel verder'],
  ['Camper/parkeren','Ruime plekken · makkelijk keren · geschikt voor langere voertuigen']
];
const stops = {
  hotels:[],
  camperplaces:[],
  restaurants:[],
  laden:[],
  tanken:[],
  uitjes:[],
  wc:[]
};
const AUTOSAVE_KEY = 'roadoraPlannerDraftV58';
const LOCATION_HISTORY_KEY = 'roadoraLocationHistoryV1';
const LOCATION_HISTORY_LIMIT = 8;
function sanitizePlainText(value,maxLength=180){ return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,maxLength); }
function cleanLocationValue(value){ return sanitizePlainText(value,180); }
function readLocationHistory(){
  try{
    const raw=localStorage.getItem(LOCATION_HISTORY_KEY);
    const data=raw?JSON.parse(raw):{};
    return {
      origin:Array.isArray(data.origin)?data.origin.filter(Boolean):[],
      destination:Array.isArray(data.destination)?data.destination.filter(Boolean):[]
    };
  }catch(_){ return {origin:[], destination:[]}; }
}
function saveLocationHistory(data){
  try{ localStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(data)); }catch(_){}
}
function rememberLocation(field, value){
  const val=cleanLocationValue(value);
  if(!val || val.length < 2 || !['origin','destination'].includes(field)) return;
  const data=readLocationHistory();
  const current=data[field] || [];
  data[field]=[val, ...current.filter(x=>String(x).toLowerCase()!==val.toLowerCase())].slice(0, LOCATION_HISTORY_LIMIT);
  saveLocationHistory(data);
}
function rememberCurrentLocations(){
  rememberLocation('origin', $('#origin')?.value || state.origin);
  rememberLocation('destination', $('#destination')?.value || state.destination);
}
function locationHistoryLabel(field){ return field==='origin' ? 'Eerder gezocht vertrekpunt' : 'Eerder gezocht bestemming'; }
function closeLocationHistory(){ $$('.location-history-popover').forEach(p=>p.remove()); }
function showLocationHistory(input){
  if(!input || !['origin','destination'].includes(input.id)) return;
  closeLocationHistory();
  const items=(readLocationHistory()[input.id] || []).filter(Boolean);
  if(!items.length) return;
  const wrap=input.closest('.input') || input.parentElement;
  if(!wrap) return;
  wrap.classList.add('has-location-history');
  const panel=document.createElement('div');
  panel.className='location-history-popover';
  panel.setAttribute('role','listbox');
  const heading=document.createElement('div');
  heading.className='location-history-title';
  heading.textContent=locationHistoryLabel(input.id);
  panel.appendChild(heading);
  items.forEach(value=>{
    const item=document.createElement('button');
    item.type='button';
    item.className='location-history-item';
    item.dataset.locationValue=sanitizePlainText(value,180);
    item.textContent=sanitizePlainText(value,180);
    panel.appendChild(item);
  });
  wrap.appendChild(panel);
}
let autosaveTimer = null;
let tripAutosaveTimer = null;
let restoringDraft = false;
let savedTripsCache = [];
let tripLibraryLoaded = false;
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
  const input=$('#departTime');
  if(!input) return;
  const val=normalizeTimeValue(input.value || state.depart || '');
  input.value = val;
}
function setDepartTime(value){
  const val=normalizeTimeValue(value);
  const input=$('#departTime');
  if(input) input.value=val;
  state.depart=val;
  updateDepartTimeDisplay();
  refreshAllTimelineTimes();
  renderAll();
  saveDraftNow();
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
  set('outingSearchTerm', state.outingSearchTerm || '');
  set('outingAreaQuery', state.outingAreaQuery || state.outingSearchQuery || '');
  const tripType=state.tripType==='roundtrip'?'roundtrip':'single';
  $$('[data-trip-type]').forEach(b=>{b.classList.toggle('active',b.dataset.tripType===tripType); b.setAttribute('aria-pressed',String(b.dataset.tripType===tripType));});
  renderRoundtripStops();
  const adults=$('[name="adults"]'); if(adults) adults.value=state.adults || 2;
  const children=$('[name="children"]'); if(children) children.value=state.children || 0;
  applySavedChoices({pet:state.pet, vehicle:state.vehicle, prefs:state.prefs||[]});
  $$('.route-preference').forEach(b=>b.classList.toggle('active',b.dataset.routePreference===(state.routePreference||'fastest')));
  updateDepartTimeDisplay();
}
function serializeDraft(){
  readForm();
  return {
    version:ROADORA_BUILD, savedAt:Date.now(),
    state:{...cloneJsonSafe(state), prefs:activePrefLabels()},
    routeCoords:cloneJsonSafe(routeCoords),
    timelines:cloneJsonSafe(timelines),
    stops:cloneJsonSafe(stops),
    activeTab:$('.tab.active')?.dataset?.tab || 'planning'
  };
}
function saveDraftNow(){
  if(restoringDraft) return;
  try{rememberCurrentLocations(); localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializeDraft()));}catch(err){console.warn('Roadora autosave fout:',err);}
}
function scheduleAutosave(){
  if(restoringDraft) return;
  clearTimeout(autosaveTimer);
  autosaveTimer=setTimeout(saveDraftNow,180);
  if(state.tripId){
    clearTimeout(tripAutosaveTimer);
    tripAutosaveTimer=setTimeout(()=>saveCurrentTripToLibrary({silent:true}),650);
  }
}
function applyDraftSnapshot(draft){
  if(!draft || !draft.state) return false;
  restoringDraft=true;
  Object.keys(state).forEach(k=>delete state[k]);
  Object.assign(state, createDefaultState(), cloneJsonSafe(draft.state));
  // v6.6.3 migratie: v6.6.2 gebruikte outingSearchQuery als plaats/adres.
  if(!state.outingAreaQuery && state.outingSearchQuery) state.outingAreaQuery=sanitizePlainText(state.outingSearchQuery,180);
  state.outingSearchTerm=sanitizePlainText(state.outingSearchTerm,120);
  state.outingAreaQuery=sanitizePlainText(state.outingAreaQuery,180);
  state.date=state.date || todayISO();
  state.depart=normalizeTimeValue(state.depart);
  state.days=Math.max(1,Math.min(21,Number(state.days)||1));
  state.activeDay=Math.max(1,Math.min(state.days,Number(state.activeDay)||1));
  state.origin=sanitizePlainText(state.origin,180);
  state.destination=sanitizePlainText(state.destination,180);
  state.tripName=sanitizePlainText(state.tripName,120);
  // Stopcategorieën zijn na openen standaard uit; de gebruiker zet ze bewust opnieuw aan.
  state.category=''; state.suggestions=false; state.activeStop=null;
  routeCoords=Array.isArray(draft.routeCoords)
    ? draft.routeCoords.filter(c=>Array.isArray(c)&&c.length>=2&&Number.isFinite(Number(c[0]))&&Number.isFinite(Number(c[1]))).map(c=>[Number(c[0]),Number(c[1])])
    : [];
  routeGeometryCache=null;
  routeVariants=[];
  Object.keys(timelines).forEach(k=>delete timelines[k]);
  if(draft.timelines && typeof draft.timelines==='object') Object.assign(timelines,cloneJsonSafe(draft.timelines));
  if(!Object.keys(timelines).length) timelines[1]=[['—','Route nog niet gepland','Vul vertrekpunt en bestemming in en klik op Maak dagroute','Vertrek']];
  Object.keys(stops).forEach(k=>{stops[k]=Array.isArray(draft.stops?.[k])?cloneJsonSafe(draft.stops[k]):[];});
  repairDayHotelsFromTimelines();
  pruneTripDataToDayCount(state.days);
  refreshAllTimelineTimes();
  setFormFromState();
  restoringDraft=false;
  return true;
}
function restoreDraft(){
  const raw=localStorage.getItem(AUTOSAVE_KEY);
  if(!raw) return false;
  try{return applyDraftSnapshot(JSON.parse(raw));}
  catch(err){restoringDraft=false; console.warn('Roadora herstel fout:',err); return false;}
}
function clearDraft(){
  try{localStorage.removeItem(AUTOSAVE_KEY); localStorage.removeItem(LOCATION_HISTORY_KEY);}catch(_){}
}
function resetPlanner(){
  clearDraft();
  location.reload();
}
const cats = [['hotels','Hotels'],['camperplaces','Camperplekken'],['restaurants','Eten'],['laden','Laden'],['tanken','Tanken'],['uitjes','Uitjes'],['wc','WC']];
const foodTypes = [['restaurant','Restaurant'],['fastfood','Fastfood'],['lunch','Lunch'],['coffee','Koffie'],['supermarket','Supermarkt']];
const outingTypes = [['highlights','Bezienswaardigheden'],['nature','Natuur'],['culture','Cultuur'],['family','Met kinderen']];
function foodTypeLabel(id=state.foodType){return (foodTypes.find(x=>x[0]===id)||foodTypes[0])[1];}
function outingTypeLabel(id=state.outingType){return (outingTypes.find(x=>x[0]===id)||outingTypes[0])[1];}
function supportsCamperPlaces(){return state.vehicle==='camper' || state.vehicle==='bus';}
function visibleCats(){return cats.filter(([id])=>id!=='camperplaces' || supportsCamperPlaces());}
function isOvernightCategory(cat){return cat==='hotels' || cat==='camperplaces';}
const categorySpecs = {
  hotels: {
    singular:'hotel', action:'Bekijk hotel', type:'overnachten rond je stopmoment',
    recommended:'Hotels rond je gekozen aankomsttijdvak', all:'Hotels rond je gekozen aankomsttijdvak',
    sort:'Maximaal 30 hotels rond je gekozen aankomsttijdvak. Resultaten tonen afstand vanaf vertrek en verwachte aankomst.',
    match:['Overnachten rond', 'Weinig omrijden', 'Past bij route'],
    why:['Ligt logisch langs je route', 'Je kiest zelf of je hier wilt overnachten', 'Zo min mogelijk omrijden']
  },
  camperplaces: {
    singular:'camperplek', action:'Bekijk camperplek', type:'camperplek rond je stopmoment',
    recommended:'Camperplekken rond je gekozen aankomsttijdvak', all:'Camperplekken rond je gekozen aankomsttijdvak',
    sort:'Maximaal 30 camperplekken rond je gekozen aankomsttijdvak. Alleen zichtbaar voor Busje en Camper.',
    match:['Overnachten rond', 'Geschikt voor camper', 'Past bij route'],
    why:['Ligt logisch langs je route', 'Geschikt als overnachtingsplek voor busje of camper', 'Zo min mogelijk omrijden']
  },
  restaurants: {
    singular:'eetstop', action:'Bekijk locatie', type:'eten rond je huidige locatie',
    recommended:'Eten binnen 10 km', all:'Eten binnen 10 km',
    sort:'10–15 live opties rond je actuele locatie, gerangschikt op afstand en kwaliteit',
    match:['Huidige locatie', 'Binnen 10 km', 'Zelf gekozen'],
    why:['Je hebt zelf om eten in de buurt gevraagd', 'Roadora voegt niets automatisch toe', 'Je kunt direct navigeren of de plek aan vandaag toevoegen']
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
    singular:'uitje', action:'Bekijk locatie', type:'uitje rond een door jou gekozen gebied',
    recommended:'Uitjes rond je gekozen gebied', all:'Uitjes rond je gekozen gebied',
    sort:'Tot 20 live uitjes rond je huidige locatie, een plaats, kaartpunt of routepunt',
    match:['Zelf gekozen gebied', 'Eigen straal', 'Niets automatisch toegevoegd'],
    why:['Je hebt zelf bepaald waar Roadora zoekt', 'Je kiest zelf het soort uitje', 'Stopduur wordt pas na toevoegen meegerekend']
  },
  wc: {
    singular:'WC-stop', action:'Bekijk locatie', type:'WC- of pauzeplek onderweg',
    recommended:'Aanbevolen WC- en pauzeplekken', all:'WC en pauzeplekken langs je route',
    sort:'Openbare toiletten, rustplaatsen en tankstations verspreid over de actieve reisdag',
    match:['Actieve reisdag', 'WC/pauze', 'Weinig omrijden'],
    why:['Ligt langs de actieve reisdag', 'Type voorziening staat duidelijk vermeld', 'Zo min mogelijk omrijden']
  }
};
const FEATURE_ROADORA_SUGGESTIONS = false; // tijdelijk on hold: eerst routeflow perfectioneren
const timelines = {
  1:[['—','Route nog niet gepland','Vul vertrekpunt en bestemming in en klik op Maak dagroute','Vertrek']]
};
let map, routeLine, markers=[], placeMarkers=[], plannedStopMarkers=[];
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
function clearPlannedStopMarkers(){
  if(!Array.isArray(plannedStopMarkers)) plannedStopMarkers=[];
  plannedStopMarkers.forEach(m=>{ if(map && map.hasLayer(m)) map.removeLayer(m); });
  plannedStopMarkers=[];
}
function plannedRowCoordinate(row,index,plan){
  const meta=row?.[4] || {};
  const lat=Number(meta.lat), lng=Number(meta.lng);
  if(Number.isFinite(lat) && Number.isFinite(lng)) return [lat,lng];
  if(Array.isArray(routeCoords) && routeCoords.length){
    if(index===0) return routeCoords[0];
    if(index===plan.length-1) return routeCoords[routeCoords.length-1];
  }
  return null;
}
function plannedStopKind(row,index,plan){
  const meta=row?.[4] || {};
  const type=String(row?.[3] || '').toLowerCase();
  const category=String(meta.category || '').toLowerCase();
  if(index===0) return 'start';
  if(category==='camperplaces' || type.includes('camper')) return 'camper';
  if(category==='hotels' || type.includes('hotel') || type.includes('overnacht')) return 'hotel';
  if(index===plan.length-1) return 'end';
  return 'stop';
}
function plannedStopLabel(kind,index){
  if(kind==='start') return 'S';
  if(kind==='hotel') return 'H';
  if(kind==='camper') return 'C';
  if(kind==='end') return 'E';
  return String(Math.max(1,index));
}
function plannedStopTypeLabel(kind,row){
  if(kind==='start') return 'Vertrekpunt';
  if(kind==='hotel') return 'Hotel';
  if(kind==='camper') return 'Camperplek';
  if(kind==='end') return 'Eindbestemming';
  return String(row?.[3] || 'Stop');
}
function plannedMarkerHtml(kind,label,mismatch=false,skipped=false){
  return `<div class="planned-stop-pin planned-stop-pin-${kind}${mismatch?' planned-stop-pin-mismatch':''}${skipped?' planned-stop-pin-skipped':''}"><span>${escapeHtml(skipped?'×':label)}</span></div>`;
}
function renderPlannedStopMarkers(){
  if(!map || !window.L) return;
  clearPlannedStopMarkers();
  const plan=timelines[state.activeDay] || [];
  if(!Array.isArray(plan) || !plan.length) return;
  plannedStopMarkers=plan.map((row,index)=>{
    const coords=plannedRowCoordinate(row,index,plan);
    if(!coords) return null;
    const kind=plannedStopKind(row,index,plan);
    const label=plannedStopLabel(kind,index);
    const title=String(row?.[1] || plannedStopTypeLabel(kind,row));
    const typeLabel=plannedStopTypeLabel(kind,row);
    const marker=L.marker(coords,{
      interactive:true,
      keyboard:true,
      bubblingMouseEvents:false,
      riseOnHover:true,
      zIndexOffset:900 + index,
      title,
      alt:title,
      icon:L.divIcon({
        className:'roadora-planned-marker-icon',
        html:plannedMarkerHtml(kind,label,Boolean(row?.[4]?.routeMismatch),Boolean(row?.[4]?.skipped)),
        iconSize:[34,40],
        iconAnchor:[17,38],
        popupAnchor:[0,-34]
      })
    });
    marker.__planIndex=index;
    const skipped=Boolean(row?.[4]?.skipped);
    marker.bindTooltip(escapeHtml(`${title} · Dag ${state.activeDay}${skipped?' · overgeslagen':''}`),{direction:'top',offset:[0,-28]});
    marker.bindPopup(`<div class="planned-stop-popup"><strong>${escapeHtml(title)}</strong><span>Dag ${state.activeDay} · ${escapeHtml(typeLabel)}${skipped?' · Overgeslagen':''}</span></div>`,{offset:[0,-28]});
    return marker;
  }).filter(Boolean);
  plannedStopMarkers.forEach(marker=>marker.addTo(map));
}
function focusPlannedStop(index){
  if(!map){toast('De kaart is nog niet geladen'); return;}
  const marker=plannedStopMarkers.find(m=>Number(m.__planIndex)===Number(index));
  if(!marker){toast('Voor deze handmatige stop is nog geen exacte locatie bekend'); return;}
  const target=marker.getLatLng();
  const zoom=Math.max(Number(map.getZoom())||5,12);
  map.flyTo(target,zoom,{duration:.45});
  setTimeout(()=>marker.openPopup(),220);
}
function placeMarkerHtml(cat,index){
  const letter = {hotels:'H',camperplaces:'C',restaurants:'E',laden:'L',tanken:'T',uitjes:'U',wc:'W'}[cat] || 'P';
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
    }).bindTooltip(escapeHtml(name));
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
  renderPlannedStopMarkers();
  map.on('click',handleMapSelectionClick);
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
function routeGeometryMetrics(){
  if(routeGeometryCache?.coords===routeCoords && Array.isArray(routeGeometryCache?.cumulative)) return routeGeometryCache;
  const cumulative=[0];
  let totalKm=0;
  for(let i=1;i<routeCoords.length;i++){
    const a=routeCoords[i-1],b=routeCoords[i];
    totalKm+=haversineKm(Number(a?.[0]),Number(a?.[1]),Number(b?.[0]),Number(b?.[1]));
    cumulative.push(totalKm);
  }
  routeGeometryCache={coords:routeCoords,cumulative,totalKm};
  return routeGeometryCache;
}
function routeCoordinateAtProgress(progress){
  if(!Array.isArray(routeCoords)||!routeCoords.length) return null;
  if(routeCoords.length===1) return routeCoords[0];
  const p=Math.max(0,Math.min(1,Number(progress)||0));
  const metrics=routeGeometryMetrics();
  const target=metrics.totalKm*p;
  let i=1;
  while(i<metrics.cumulative.length && metrics.cumulative[i]<target) i++;
  if(i>=routeCoords.length) return routeCoords[routeCoords.length-1];
  const before=metrics.cumulative[i-1],after=metrics.cumulative[i];
  const t=after>before?(target-before)/(after-before):0;
  const a=routeCoords[i-1],b=routeCoords[i];
  return [Number(a[0])+(Number(b[0])-Number(a[0]))*t,Number(a[1])+(Number(b[1])-Number(a[1]))*t];
}
function sampleRouteAtProgress(progress){
  return routeCoordinateAtProgress(progress);
}
function setRouteCoordsFromLngLat(coords){
  if(!Array.isArray(coords)||coords.length<2) return false;
  routeCoords = coords.map(c=>[Number(c[1]),Number(c[0])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]));
  routeGeometryCache=null;
  return routeCoords.length>1;
}

function routePreferenceLabel(value=state.routePreference){
  return {fastest:'Snelste route',tollfree:'Tol vermijden',alternative:'Alternatieve route'}[value]||'Snelste route';
}
function routeProviderLabel(source=state.routeSource){
  if(source==='google') return 'Google';
  if(source==='ors') return 'ORS fallback';
  if(source==='external-route') return 'externe route';
  return 'routeprovider';
}
function normalizeRouteVariant(item){
  const coords=item?.geometry?.coordinates;
  if(!item || !Array.isArray(coords) || coords.length<2) return null;
  return {
    id:['fastest','tollfree','alternative'].includes(item.id)?item.id:'fastest',
    label:item.label||routePreferenceLabel(item.id),
    preference:['fastest','tollfree','alternative'].includes(item.preference)?item.preference:item.id,
    distanceMeters:Number(item.distanceMeters||0),
    durationSeconds:Number(item.durationSeconds||0),
    source:item.source||'external-route',
    mode:item.mode||'',
    sameAsFastest:Boolean(item.sameAsFastest),
    geometry:{type:'LineString',coordinates:coords.map(c=>[Number(c[0]),Number(c[1])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]))}
  };
}
function routeVariantSummary(variant){
  return {
    id:variant.id,label:variant.label,preference:variant.preference,
    distanceMeters:Number(variant.distanceMeters||0),durationSeconds:Number(variant.durationSeconds||0),
    source:variant.source||'',mode:variant.mode||'',sameAsFastest:Boolean(variant.sameAsFastest)
  };
}
function currentRouteSummaries(){
  return routeVariants.length ? routeVariants.map(routeVariantSummary) : (Array.isArray(state.routeVariantSummaries)?state.routeVariantSummaries:[]);
}
function routeMetricText(variant,fastest){
  if(!variant) return '';
  const km=Math.max(1,Math.round(Number(variant.distanceMeters||0)/1000));
  const mins=Math.max(1,Math.round(Number(variant.durationSeconds||0)/60));
  if(variant.id==='fastest' || !fastest) return `${km.toLocaleString('nl-NL')} km · ${durationLabel(mins)}`;
  if(variant.sameAsFastest) return `${km.toLocaleString('nl-NL')} km · zelfde route`;
  const deltaKm=Math.round((Number(variant.distanceMeters||0)-Number(fastest.distanceMeters||0))/1000);
  const deltaMin=Math.round((Number(variant.durationSeconds||0)-Number(fastest.durationSeconds||0))/60);
  const extras=[];
  if(deltaKm) extras.push(`${deltaKm>0?'+':''}${deltaKm} km`);
  if(deltaMin) extras.push(`${deltaMin>0?'+':'-'}${durationLabel(Math.abs(deltaMin))}`);
  return `${km.toLocaleString('nl-NL')} km · ${durationLabel(mins)}${extras.length?' · '+extras.join(' · '):''}`;
}
function currentRouteMismatchCount(){
  const seen=new Set();
  let count=0;
  const inspect=meta=>{
    if(!meta?.routeMismatch) return;
    const lat=Number(meta.lat),lng=Number(meta.lng);
    const key=meta.id||meta.placeId||(Number.isFinite(lat)&&Number.isFinite(lng)?`${lat.toFixed(5)},${lng.toFixed(5)}`:`manual-${count}`);
    if(seen.has(key)) return;
    seen.add(key); count++;
  };
  Object.values(timelines).forEach(plan=>Array.isArray(plan)&&plan.forEach(row=>inspect(row?.[4])));
  Object.values(state.dayHotels||{}).forEach(hotel=>inspect(hotel?.meta));
  return count;
}
function renderRouteChoices(){
  state.routeMismatchCount=currentRouteMismatchCount();
  const summaries=currentRouteSummaries();
  const fastest=summaries.find(v=>v.id==='fastest');
  const loaded=summaries.length>0;
  $$('.route-preference').forEach(button=>{
    const id=button.dataset.routePreference;
    const variant=summaries.find(v=>v.id===id);
    const metric=button.querySelector(`[data-route-metric="${id}"]`);
    button.classList.toggle('active',id===(state.routePreference||'fastest'));
    button.classList.toggle('unavailable',loaded&&!variant);
    button.classList.toggle('same-route',Boolean(variant?.sameAsFastest));
    button.disabled=Boolean(loaded&&!variant);
    if(metric){
      if(variant) metric.textContent=routeMetricText(variant,fastest);
      else if(loaded) metric.textContent='Niet beschikbaar voor deze route';
      else metric.textContent={fastest:'Meestal de kortste reistijd',tollfree:'Probeert tolwegen te vermijden',alternative:'Andere beschikbare route'}[id]||'';
    }
  });
  const note=$('#routePreferenceNote');
  if(note){
    note.classList.toggle('warning',state.routePreference==='tollfree' || Number(state.routeMismatchCount)>0);
    if(hasRoute()){
      const base=`Actief: ${routePreferenceLabel()} · ${routeProviderLabel()}. Stops worden langs deze route gezocht.`;
      const mismatch=Number(state.routeMismatchCount)||0;
      const check=mismatch?` ${mismatch} ${mismatch===1?'gekozen stop ligt':'gekozen stops liggen'} niet gunstig langs deze route; gebruik Vervang.`:'';
      note.textContent=(state.routePreference==='tollfree' ? `${base} Tol vermijden blijft een routevoorkeur.` : base)+check;
    } else {
      note.textContent=`Gekozen: ${routePreferenceLabel()}. Roadora zoekt beschikbare routes zodra je op Maak dagroute klikt.`;
    }
  }
}
function haversineKm(lat1,lng1,lat2,lng2){
  const rad=n=>Number(n)*Math.PI/180;
  const a1=rad(lat1),a2=rad(lat2),dLat=a2-a1,dLng=rad(lng2)-rad(lng1);
  const h=Math.sin(dLat/2)**2+Math.cos(a1)*Math.cos(a2)*Math.sin(dLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
function plannedCoordinates(){
  const result=[];
  Object.values(timelines).forEach(plan=>{
    if(!Array.isArray(plan)) return;
    plan.forEach((row,index)=>{
      if(index===0 || index===plan.length-1) return;
      const meta=row?.[4]||{}; if(meta.skipped) return; const lat=Number(meta.lat),lng=Number(meta.lng);
      if(Number.isFinite(lat)&&Number.isFinite(lng)) result.push({lat,lng,name:meta.name||row[1]||'stop'});
    });
  });
  Object.values(state.dayHotels||{}).forEach(hotel=>{
    const meta=hotel?.meta||{}; const lat=Number(meta.lat),lng=Number(meta.lng);
    if(Number.isFinite(lat)&&Number.isFinite(lng)) result.push({lat,lng,name:hotel.name||'overnachting'});
  });
  const seen=new Set();
  return result.filter(p=>{const key=`${p.lat.toFixed(5)},${p.lng.toFixed(5)}`; if(seen.has(key)) return false; seen.add(key); return true;});
}
function distanceFromVariantKm(point,variant){
  const coords=variant?.geometry?.coordinates||[];
  if(!coords.length) return Infinity;
  const step=Math.max(1,Math.floor(coords.length/700));
  let best=Infinity;
  for(let i=0;i<coords.length;i+=step){
    const c=coords[i]; const d=haversineKm(point.lat,point.lng,Number(c[1]),Number(c[0]));
    if(d<best) best=d;
  }
  const last=coords[coords.length-1];
  if(last) best=Math.min(best,haversineKm(point.lat,point.lng,Number(last[1]),Number(last[0])));
  return best;
}
function routeChangeImpact(variant){
  const points=plannedCoordinates();
  return {total:points.length,far:points.filter(p=>distanceFromVariantKm(p,variant)>25).length};
}
function resetLiveResultsForRoute(){
  state.category=''; state.suggestions=false; state.activeStop=null;
  clearPlaceMarkers();
  cats.forEach(([cat])=>{stops[cat]=[];});
  ['hotels','camperplaces','laden','tanken','wc'].forEach(cat=>setPlaceStatus(cat,'idle','Zet deze categorie aan om live resultaten langs je gekozen route te laden.'));
  setPlaceStatus('restaurants','idle','Kies een categorie en zoek daarna rond je actuele locatie.');
  setPlaceStatus('uitjes','idle','Kies zelf een plaats, kaartpunt, routepunt of je actuele locatie.');
}
function applyRouteVariant(variant,{preservePlan=false,confirmImpact=false,silent=false}={}){
  const normalized=normalizeRouteVariant(variant);
  if(!normalized) return false;
  const changing=hasRoute() && state.routeVariantId && state.routeVariantId!==normalized.id;
  if(changing && confirmImpact){
    const impact=routeChangeImpact(normalized);
    if(impact.total){
      const warning=impact.far ? ` ${impact.far} gekozen ${impact.far===1?'stop ligt':'stops liggen'} mogelijk niet meer gunstig langs deze route.` : '';
      if(!confirm(`Route wijzigen naar ${normalized.label}? Afstanden en aankomsttijden van je bestaande stops worden opnieuw berekend.${warning}`)) return false;
    }
  }
  if(!setRouteCoordsFromLngLat(normalized.geometry.coordinates)) return false;
  state.routeDistanceKm=Math.max(1,Math.round(normalized.distanceMeters/1000));
  state.routeDurationMin=Math.max(1,Math.round(normalized.durationSeconds/60));
  state.routeSource=normalized.source==='google'?'google':(normalized.source==='ors'?'ors':'external-route');
  state.routePreference=normalized.preference||normalized.id;
  state.routeVariantId=normalized.id;
  state.routeVariantSummaries=currentRouteSummaries().length?currentRouteSummaries():[routeVariantSummary(normalized)];
  resetLiveResultsForRoute();
  applyRouteZones({resetPlan:!preservePlan});
  const routeAdjustment=preservePlan?reprojectSavedPlanToCurrentRoute():{adjusted:0,mismatch:0};
  if(!preservePlan) state.routeMismatchCount=0;
  updateTexts(); renderTimeline(); renderStops(); renderTripOverview(); renderRouteChoices(); updateMapRoute();
  saveDraftNow();
  if(!silent){
    const extra=routeAdjustment.mismatch?` · ${routeAdjustment.mismatch} ${routeAdjustment.mismatch===1?'stop controleren':'stops controleren'}`:(routeAdjustment.adjusted?` · ${routeAdjustment.adjusted} ${routeAdjustment.adjusted===1?'stop aangepast':'stops aangepast'}`:'');
    toast(`${normalized.label} geselecteerd${extra}`);
  }
  return true;
}
async function selectRoutePreference(id){
  const preference=['fastest','tollfree','alternative'].includes(id)?id:'fastest';
  if(hasRoute() && state.routePreference===preference && (!routeVariants.length || state.routeVariantId===preference)){
    renderRouteChoices();
    toast(`${routePreferenceLabel(preference)} is al actief`);
    return;
  }
  const variant=routeVariants.find(v=>v.id===preference);
  if(variant){
    applyRouteVariant(variant,{preservePlan:true,confirmImpact:true});
    return;
  }
  if(currentRouteSummaries().length && !currentRouteSummaries().some(v=>v.id===preference)){
    toast('Deze routevariant is niet beschikbaar');
    return;
  }
  if(hasRoute() && plannedCoordinates().length){
    if(!confirm(`Route opnieuw berekenen met voorkeur “${routePreferenceLabel(preference)}”? Je bestaande stops blijven staan en worden opnieuw gekoppeld.`)) return;
  }
  state.routePreference=preference;
  renderRouteChoices(); saveDraftNow();
  if(hasRoute()) await loadRealRoute({preservePlan:true,requestedPreference:preference});
}

function renderRouteZoneMarkers(forceVisible=false){
  if(!map) return;
  markers.forEach(m=>{ if(map.hasLayer(m)) map.removeLayer(m); });
  if(!FEATURE_ROADORA_SUGGESTIONS){ markers=[]; routeZoneMarkersVisible=false; setRouteZoneMarkersVisible(false); return; }
  markers = markerData.map(m=>L.marker(m.coords,{icon:L.divIcon({className:'',html:`<div class="custom-marker m-${m.type}">${m.label}</div>`,iconSize:[28,28],iconAnchor:[14,14]})}).bindTooltip(escapeHtml(m.title)));
  if(forceVisible) routeZoneMarkersVisible = true;
  setRouteZoneMarkersVisible(routeZoneMarkersVisible);
}
function updateMapRoute(){
  if(!map || !routeLine) return;
  if(!Array.isArray(routeCoords) || routeCoords.length<2){
    routeLine.setLatLngs([]); markerData=[]; renderRouteZoneMarkers(false); renderPlannedStopMarkers(); fitMap(); return;
  }
  routeLine.setLatLngs(routeCoords);
  renderRouteZoneMarkers(false);
  renderPlannedStopMarkers();
  fitMap();
}
function applyRouteZones({resetPlan=true}={}){
  readForm();
  if(!hasRoute()){
    state.routeZones=[];
    markerData=[];
    if(resetPlan || !Object.keys(timelines).length){
      state.dayHotels={};
      Object.keys(timelines).forEach(k=>delete timelines[k]);
      timelines[1]=[['—','Route nog niet gepland','Vul vertrekpunt en bestemming in en klik op Maak dagroute','Vertrek']];
    }
    updateMapRoute();
    return;
  }
  // Roadora-suggesties staan tijdelijk on hold.
  // Bewust geen automatische pauze-, lunch-, laad-, tank- of hotelmomenten.
  state.routeZones=[];
  markerData=[];
  if(resetPlan){
    state.dayHotels={};
    Object.keys(timelines).forEach(k=>delete timelines[k]);
    const originName=(state.origin||'vertrekpunt').split(',')[0];
    const destName=(state.destination||'bestemming').split(',')[0];
    timelines[1]=[
      [state.depart || '—',`Vertrek ${originName}`,'Start van je route','Vertrek'],
      ['—',`Aankomst ${destName}`,`${Math.round(state.routeDistanceKm||0)} km · ${durationLabel(state.routeDurationMin||0)}`,'Bestemming']
    ];
  } else {
    repairDayHotelsFromTimelines();
  }
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
function activeDayRouteSamplePoints(maxPoints=10){
  const coords=Array.isArray(routeCoords)?routeCoords:[];
  if(coords.length<2) return [];
  const startProgress=Math.max(0,Math.min(1,dayStartProgress(state.activeDay)));
  const endProgress=Math.max(startProgress,Math.min(1,dayEndProgress(state.activeDay)));
  const span=endProgress-startProgress;
  if(span<=0.001) return [];
  const count=Math.max(2,Math.min(12,Number(maxPoints)||10));
  const padding=Math.min(0.01,span/6);
  const from=startProgress+padding;
  const to=Math.max(from,endProgress-padding);
  return Array.from({length:count},(_,i)=>{
    const p=count===1?from:from+((to-from)*(i/(count-1)));
    return routePointAtProgress(p,i);
  }).filter(Boolean);
}
function routePointAtDistanceKm(distanceKm,index=0){
  const total=Math.max(1,Number(state.routeDistanceKm)||1);
  if(!Array.isArray(routeCoords)||routeCoords.length<2) return null;
  const km=Math.max(0,Math.min(total,Number(distanceKm)||0));
  const progress=km/total;
  const c=routeCoordinateAtProgress(progress);
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
function hasValidDepartTime(){ return /^\d{1,2}:\d{2}$/.test(String(activeDayStartClock()||'')); }
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
function activeDayStartClock(day=state.activeDay){
  const plan=timelines[Number(day)] || [];
  return safeTimeValue(plan[0]?.[0]) || safeTimeValue(state.depart);
}
function progressForHotelArrivalSlot(){
  const center=arrivalSlotCenterHour();
  if(!Number.isFinite(center)) return null;
  const startClock=activeDayStartClock();
  const depart=String(startClock||'').match(/^(\d{1,2}):(\d{2})$/);
  if(depart && Number(state.routeDurationMin)>0){
    const departHour=Number(depart[1])+(Number(depart[2])/60);
    let elapsedHours=center-departHour;
    if(elapsedHours<0) elapsedHours+=24;
    const startProgress=dayStartProgress(state.activeDay);
    const endProgress=Math.max(startProgress,dayEndProgress(state.activeDay));
    const target=startProgress + ((elapsedHours*60)/Math.max(1,Number(state.routeDurationMin)));
    return Math.max(startProgress+0.01, Math.min(Math.max(startProgress+0.01,endProgress-0.01), target));
  }
  // Zonder vertrektijd kan Roadora niet betrouwbaar bepalen waar je rond het tijdvak op de route bent.
  return null;
}
function routePointAtProgress(progress,index=0){
  if(!Array.isArray(routeCoords)||routeCoords.length<2) return null;
  const p=Math.max(0,Math.min(1,Number(progress)||0));
  const c=routeCoordinateAtProgress(p);
  return c ? {lat:c[0],lng:c[1],index,progress:p,distanceFromStartMeters:Math.round((state.routeDistanceKm||0)*1000*p)} : null;
}
function hotelArrivalSearchPoints(){
  const startClock=activeDayStartClock();
  const depart=String(startClock||'').match(/^(\d{1,2}):(\d{2})$/);
  const slot=String(state.arrival||'').match(/^(\d{1,2})-(\d{1,2})$/);
  const duration=Number(state.routeDurationMin)||0;
  if(!depart || !slot || duration<=0) return [];
  const departHour=Number(depart[1])+(Number(depart[2])/60);
  const startHour=Number(slot[1]);
  const endHour=Number(slot[2]);
  const dayStart=dayStartProgress(state.activeDay);
  const dayEnd=Math.max(dayStart,dayEndProgress(state.activeDay));
  const hours=[startHour,(startHour+endHour)/2,endHour];
  const progresses=hours.map(hour=>{
    let elapsed=hour-departHour;
    if(elapsed<0) elapsed+=24;
    const target=dayStart + ((elapsed*60)/Math.max(1,duration));
    return Math.max(dayStart+0.01, Math.min(Math.max(dayStart+0.01,dayEnd-0.01), target));
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
  if(!prev || !plan || plan.length<2 || !plan[0]?.[4]?.linkedFromPrevious) return;
  if(!safeTimeValue(plan[0]?.[0])) plan[0][0]=state.depart || '—';
  refreshDayTimelineTimes(d);
}
function syncAllFollowingDayArrivals(){
  for(let d=2; d<=Number(state.days||1); d++) syncFollowingDayArrival(d);
}
function plannedDelayBeforeProgress(progress,day=state.activeDay){
  const target=clampRouteProgress(progress);
  if(target===null) return 0;
  const plan=timelines[Number(day)] || [];
  if(!Array.isArray(plan) || plan.length<3) return 0;
  return plan.slice(1,-1).reduce((sum,row)=>{
    const rowProgress=routeProgressForMeta(row?.[4]||{});
    if(rowProgress===null || rowProgress>target+0.0001) return sum;
    return sum+stopDelayMinutes(row);
  },0);
}

function hotelTripMeta(meta={},day=state.activeDay){
  const lines=[];
  const meters=Number(meta.distanceFromStartMeters);
  const km=Number.isFinite(meters) ? Math.round(meters/1000) : (Number.isFinite(Number(meta.distanceFromStartKm)) ? Math.round(Number(meta.distanceFromStartKm)) : null);
  if(Number.isFinite(km)) lines.push(`${km} km vanaf vertrek`);
  const progress=Number.isFinite(Number(meta.routeProgress)) ? Number(meta.routeProgress) : (Number(state.routeDistanceKm)>0 && Number.isFinite(km) ? km/Number(state.routeDistanceKm) : null);
  const depart=String(activeDayStartClock(day)||'').match(/^(\d{1,2}):(\d{2})$/);
  if(depart && Number.isFinite(progress) && Number(state.routeDurationMin)>0){
    const departMinutes=Number(depart[1])*60+Number(depart[2]);
    const driveProgress=Math.max(0,progress-dayStartProgress(day));
    const arrival=departMinutes + (Number(state.routeDurationMin)*driveProgress) + plannedDelayBeforeProgress(progress,day);
    lines.push(`aankomst ± ${formatMinutesAsClock(arrival)}`);
  }
  return lines;
}

function hotelTripInfo(meta={},day=state.activeDay){
  const meters=Number(meta.distanceFromStartMeters);
  const km=Number.isFinite(meters) ? Math.round(meters/1000) : (Number.isFinite(Number(meta.distanceFromStartKm)) ? Math.round(Number(meta.distanceFromStartKm)) : null);
  const progress=Number.isFinite(Number(meta.routeProgress)) ? Number(meta.routeProgress) : (Number(state.routeDistanceKm)>0 && Number.isFinite(km) ? km/Number(state.routeDistanceKm) : null);
  const depart=String(activeDayStartClock(day)||'').match(/^(\d{1,2}):(\d{2})$/);
  let arrivalTime='—';
  if(depart && Number.isFinite(progress) && Number(state.routeDurationMin)>0){
    const departMinutes=Number(depart[1])*60+Number(depart[2]);
    const driveProgress=Math.max(0,progress-dayStartProgress(day));
    arrivalTime=formatMinutesAsClock(departMinutes + (Number(state.routeDurationMin)*driveProgress) + plannedDelayBeforeProgress(progress,day));
  }
  const remainingKm = Number.isFinite(km) && Number(state.routeDistanceKm)>0 ? Math.max(0, Math.round(Number(state.routeDistanceKm)-km)) : null;
  const remainingMin = Number.isFinite(progress) && Number(state.routeDurationMin)>0 ? Math.max(0, Math.round(Number(state.routeDurationMin)*(1-progress))) : null;
  return {km,progress,arrivalTime,remainingKm,remainingMin};
}

function clampRouteProgress(value){
  const n=Number(value);
  return Number.isFinite(n) ? Math.max(0,Math.min(1,n)) : null;
}
function nearestRouteProjection(lat,lng){
  if(!Array.isArray(routeCoords) || routeCoords.length<2 || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  const targetLat=Number(lat),targetLng=Number(lng);
  const metrics=routeGeometryMetrics();
  let best=null;
  for(let i=1;i<routeCoords.length;i++){
    const a=routeCoords[i-1],b=routeCoords[i];
    const refLat=(targetLat+Number(a[0])+Number(b[0]))/3;
    const scale=Math.max(0.2,Math.cos(refLat*Math.PI/180));
    const ax=Number(a[1])*scale,ay=Number(a[0]);
    const bx=Number(b[1])*scale,by=Number(b[0]);
    const px=targetLng*scale,py=targetLat;
    const dx=bx-ax,dy=by-ay;
    const denom=(dx*dx)+(dy*dy);
    const t=denom>0?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/denom)):0;
    const projectedLat=Number(a[0])+(Number(b[0])-Number(a[0]))*t;
    const projectedLng=Number(a[1])+(Number(b[1])-Number(a[1]))*t;
    const gapKm=haversineKm(targetLat,targetLng,projectedLat,projectedLng);
    const alongKm=metrics.cumulative[i-1]+((metrics.cumulative[i]-metrics.cumulative[i-1])*t);
    if(!best || gapKm<best.gapKm) best={progress:metrics.totalKm>0?alongKm/metrics.totalKm:0,alongKm,gapKm,lat:projectedLat,lng:projectedLng};
  }
  return best;
}
function nearestRouteProgress(lat,lng){
  return nearestRouteProjection(lat,lng)?.progress ?? null;
}
function routeProgressForMeta(meta={}){
  const direct=clampRouteProgress(meta.routeProgress);
  if(direct!==null) return direct;
  const meters=Number(meta.distanceFromStartMeters);
  if(Number.isFinite(meters) && Number(state.routeDistanceKm)>0) return clampRouteProgress(meters/(Number(state.routeDistanceKm)*1000));
  const km=Number(meta.distanceFromStartKm);
  if(Number.isFinite(km) && Number(state.routeDistanceKm)>0) return clampRouteProgress(km/Number(state.routeDistanceKm));
  return nearestRouteProgress(meta.lat,meta.lng);
}
function detourMinutesFromMeta(meta={}){
  const direct=Number(meta.detourMinutes);
  if(Number.isFinite(direct) && direct>=0) return Math.round(direct);
  const match=String(meta.detourLabel||'').match(/(\d+)\s*min/i);
  return match ? Number(match[1]) : 0;
}
function defaultStopDurationMinutes(category=''){
  return ({tanken:15,laden:30,restaurants:45,uitjes:60,wc:10}[String(category)]||15);
}
function stopDelayMinutes(row){
  const meta=row?.[4]||{};
  const category=String(meta.category||'');
  if(meta.skipped || isOvernightCategory(category)) return 0;
  const duration=Number(meta.stopDurationMin);
  const stay=Number.isFinite(duration) && duration>=0 ? duration : defaultStopDurationMinutes(category);
  // De Google-resultaten tonen een benaderde afstand/tijd vanaf de route. We tellen die één keer mee.
  return Math.max(0,Math.round(stay + detourMinutesFromMeta(meta)));
}
function dayStartProgress(day){
  const d=Number(day)||1;
  if(d<=1) return 0;
  const plan=timelines[d] || [];
  if(!plan[0]?.[4]?.linkedFromPrevious) return 0;
  return clampRouteProgress(selectedHotelForDay(d-1)?.info?.progress) ?? 0;
}
function dayEndProgress(day){
  return clampRouteProgress(selectedHotelForDay(Number(day))?.info?.progress) ?? 1;
}
function routeFitThresholdKm(category=''){
  return ({restaurants:4,wc:4,tanken:7,laden:7,hotels:15,camperplaces:15,uitjes:8}[String(category)]||8);
}
function updateMetaForCurrentRoute(meta={}){
  const projection=nearestRouteProjection(meta.lat,meta.lng);
  if(!projection) return null;
  const category=String(meta.category||'');
  const threshold=routeFitThresholdKm(category);
  const gapKm=Math.max(0,projection.gapKm);
  meta.routeProgress=clampRouteProgress(projection.progress);
  meta.distanceFromStartMeters=Math.round(meta.routeProgress*Number(state.routeDistanceKm||0)*1000);
  meta.routeGapKm=Math.round(gapKm*10)/10;
  meta.routeMismatch=gapKm>threshold;
  meta.routeVariantId=state.routeVariantId||state.routePreference||'';
  const detourMinutes=Math.max(2,Math.min(60,Math.round(2+gapKm*2.2)));
  meta.detourMinutes=detourMinutes;
  meta.detourLabel=meta.routeMismatch
    ? `± ${meta.routeGapKm.toLocaleString('nl-NL')} km van nieuwe route`
    : `± ${detourMinutes} min van route`;
  return projection;
}
function plannedStopDetail(row,day){
  const meta=row?.[4]||{};
  const category=String(meta.category||'');
  if(!meta.live && !['restaurants','wc','tanken','laden','uitjes'].includes(category)) return row?.[2]||'';
  const bits=[];
  if(Number.isFinite(Number(meta.rating))) bits.push(`${Number(meta.rating).toFixed(1).replace('.0','')} ★`);
  if(category==='restaurants') bits.push(meta.foodLabel||foodTypeLabel(meta.foodType));
  else if(category==='uitjes') bits.push(meta.outingLabel||outingTypeLabel(meta.outingType));
  else if(category==='wc') bits.push(meta.wcLabel||(Array.isArray(meta.amenities)?meta.amenities[0]:null)||'WC/pauze');
  else if(Array.isArray(meta.amenities)&&meta.amenities.length) bits.push(meta.amenities.slice(0,2).join(' · '));
  const meters=Number(meta.distanceFromStartMeters);
  if(Number.isFinite(meters)) bits.push(`${Math.round(meters/1000)} km vanaf vertrek`);
  const availability=availabilityLabel(meta); if(availability) bits.push(availability);
  if(!meta.routeMismatch && meta.detourLabel) bits.push(meta.detourLabel);
  return bits.filter(Boolean).join(' · ');
}
function plannedStopView(row,day){
  const meta=row?.[4]||{};
  const category=String(meta.category||'');
  const structured=Boolean(meta.live || ['restaurants','wc','tanken','laden','uitjes','hotels','camperplaces'].includes(category));
  const rawDetail=structured ? plannedStopDetail(row,day) : String(row?.[2]||'');
  const detailParts=rawDetail.split(' · ').map(v=>v.trim()).filter(Boolean);
  const gapKm=Number(meta.routeGapKm);
  const warning=meta.routeMismatch
    ? (Number.isFinite(gapKm) ? `${gapKm.toLocaleString('nl-NL')} km buiten route` : 'Niet gunstig langs deze route')
    : '';
  return {detailParts,warning,skipped:Boolean(meta.skipped)};
}
function renderPlannedStopDetail(row,day){
  const view=plannedStopView(row,day);
  const details=view.detailParts.length
    ? `<div class="plan-detail-list">${view.detailParts.map(item=>`<span class="plan-detail-item">${escapeHtml(item)}</span>`).join('')}</div>`
    : '';
  const warning=view.warning ? `<div class="plan-route-warning" role="status">${escapeHtml(view.warning)}</div>` : '';
  const skipped=view.skipped ? '<div class="plan-skipped-badge" role="status">Overgeslagen</div>' : '';
  return `${details}${warning}${skipped}`;
}
function refreshPlannedRowDetails(day){
  const plan=timelines[Number(day)]||[];
  plan.slice(1,-1).forEach(row=>{
    if(row?.[4]&&typeof row[4]==='object') row[2]=plannedStopDetail(row,day);
  });
}
function refreshDayTimelineTimes(day=state.activeDay,{sortStops=true}={}){
  const d=Number(day)||1;
  const plan=timelines[d];
  if(!Array.isArray(plan)||plan.length<2||Number(state.routeDurationMin)<=0) return;
  const startClock=safeTimeValue(plan[0]?.[0]) || (d===1?safeTimeValue(state.depart):'');
  const startMinutes=minutesFromClock(startClock);
  if(startMinutes===null) return;
  const startProgress=dayStartProgress(d);
  const endProgress=Math.max(startProgress,dayEndProgress(d));
  const first=plan[0], last=plan[plan.length-1];
  let middle=plan.slice(1,-1);
  middle.forEach(row=>{
    const meta=(row[4]&&typeof row[4]==='object')?row[4]:(row[4]={});
    const progress=routeProgressForMeta(meta);
    if(progress!==null){
      meta.routeProgress=progress;
      if(!Number.isFinite(Number(meta.distanceFromStartMeters)) && Number(state.routeDistanceKm)>0) meta.distanceFromStartMeters=Math.round(progress*Number(state.routeDistanceKm)*1000);
    }
  });
  if(sortStops){
    middle=middle.map((row,index)=>({row,index,progress:routeProgressForMeta(row?.[4]||{})}))
      .sort((a,b)=>{
        if(a.progress===null && b.progress===null) return a.index-b.index;
        if(a.progress===null) return 1;
        if(b.progress===null) return -1;
        return a.progress-b.progress || a.index-b.index;
      }).map(x=>x.row);
    timelines[d]=[first,...middle,last];
  }
  let accumulatedDelay=0;
  middle.forEach(row=>{
    const meta=row?.[4]||{};
    const progress=routeProgressForMeta(meta);
    if(meta.skipped){
      row[0]='—';
      return;
    }
    if(progress!==null && meta.autoTime!==false){
      const bounded=Math.max(startProgress,Math.min(endProgress,progress));
      const driveMinutes=Number(state.routeDurationMin)*Math.max(0,bounded-startProgress);
      row[0]=formatMinutesAsClock(startMinutes+driveMinutes+accumulatedDelay);
    }
    accumulatedDelay+=stopDelayMinutes(row);
  });
  const selected=selectedHotelForDay(d);
  const finalDrive=Number(state.routeDurationMin)*Math.max(0,endProgress-startProgress);
  const finalArrival=formatMinutesAsClock(startMinutes+finalDrive+accumulatedDelay);
  const finalMeta=(last[4]&&typeof last[4]==='object')?last[4]:(last[4]={});
  if(finalMeta.autoTime!==false) last[0]=finalArrival;
  if(selected){
    selected.info=selected.info||{};
    selected.info.arrivalTime=finalArrival;
    selected.info.progress=endProgress;
    last[2]=shortRouteDetailForDay(d);
  } else if(d===Number(state.days||1)){
    const segmentKm=Math.max(0,Math.round(Number(state.routeDistanceKm||0)*Math.max(0,endProgress-startProgress)));
    last[2]=`${segmentKm} km · ${durationLabel(Math.round(finalDrive+accumulatedDelay))}`;
  }
  refreshPlannedRowDetails(d);
}
function refreshAllTimelineTimes(){
  for(let d=1;d<=Number(state.days||1);d++) refreshDayTimelineTimes(d);
}
function repairDayHotelsFromTimelines(){
  if(!state.dayHotels || typeof state.dayHotels!=='object' || Array.isArray(state.dayHotels)) state.dayHotels={};
  Object.entries(timelines).forEach(([dayKey,plan])=>{
    if(state.dayHotels[dayKey] || !Array.isArray(plan) || !plan.length) return;
    const last=plan[plan.length-1];
    if(!Array.isArray(last)) return;
    const meta=(last[4] && typeof last[4]==='object') ? last[4] : {};
    const rawType=String(last[3]||'').toLowerCase();
    const rawTitle=String(last[1]||'');
    const category=meta.category==='camperplaces' || /camperplek/.test(rawType+' '+rawTitle.toLowerCase()) ? 'camperplaces'
      : (meta.category==='hotels' || /hotel|overnacht/.test(rawType+' '+rawTitle.toLowerCase()) ? 'hotels' : '');
    if(!category) return;
    const name=String(meta.name || rawTitle.replace(/^Aankomst\s+/i,'')).trim();
    if(!name) return;
    state.dayHotels[dayKey]={
      name,
      desc:String(last[2]||''),
      meta:{...meta,name,category},
      info:hotelTripInfo(meta),
      category
    };
  });
}

function selectedHotelForDay(day=state.activeDay){
  return state.dayHotels && state.dayHotels[day] ? state.dayHotels[day] : null;
}
function dayStartName(day){
  const origin=(state.origin||'').split(',')[0].trim() || 'vertrekpunt';
  if(day<=1) return origin;
  const plan=timelines[Number(day)]||[];
  const previousHotel=plan[0]?.[4]?.linkedFromPrevious?selectedHotelForDay(day-1):null;
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
  const dayStartKm=total*dayStartProgress(state.activeDay);
  const dayEndKm=Math.max(dayStartKm,total*dayEndProgress(state.activeDay));
  const available=Math.max(1,dayEndKm-dayStartKm);
  const relativeTarget=Math.min(Math.max(35,range*factor),Math.max(35,available-20));
  const target=Math.min(dayEndKm-5,dayStartKm+relativeTarget);
  const low=Math.max(dayStartKm+5,target-(range*(state.vehicle==='electric'?0.18:0.16)));
  const high=Math.min(dayEndKm-5,target+(range*(state.vehicle==='electric'?0.16:0.14)));
  return {target,low:Math.min(low,high),high:Math.max(low,high),range,total,dayStartKm,dayEndKm};
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

const DISTRIBUTED_RESULT_CATEGORIES = new Set([]);
function supportsDistributedRecommendations(cat=state.category){ return DISTRIBUTED_RESULT_CATEGORIES.has(String(cat||'')); }
function resultRouteProgress(item){
  const meta=item?.[2]||{};
  return routeProgressForMeta(meta);
}
function resultRouteKm(item){
  const progress=resultRouteProgress(item);
  if(progress===null) return null;
  return progress*Math.max(1,Number(state.routeDistanceKm)||1);
}
function resultQualityScore(item){
  const meta=item?.[2]||{};
  const rating=Math.max(0,Math.min(5,Number(meta.rating)||0));
  const reviews=Math.log10(Math.max(1,Number(meta.userRatingCount)||0))/4;
  const openBonus=meta.openNow===true?0.35:0;
  const gapPenalty=Math.min(1.4,Math.max(0,Number(meta.routeGapKm)||0)/8);
  const detourPenalty=Math.min(0.8,Math.max(0,Number(meta.detourMinutes)||0)/45);
  return rating+reviews+openBonus-gapPenalty-detourPenalty;
}
function distributionZoneLabel(zone){
  return ['begin reisdag','eerste helft','midden reisdag','tweede helft','einde reisdag'][Math.max(0,Math.min(4,Number(zone)||0))];
}
function distributedMinimumSpacingKm(){
  const dayKm=Math.max(0,(dayEndProgress(state.activeDay)-dayStartProgress(state.activeDay))*Math.max(1,Number(state.routeDistanceKm)||1));
  return dayKm>=320?50:(dayKm>=220?45:35);
}
function recommendedDistributedStops(list,{maxResults=8,zoneCount=5}={}){
  const start=dayStartProgress(state.activeDay);
  const end=Math.max(start+0.0001,dayEndProgress(state.activeDay));
  const daySpan=end-start;
  const annotated=(Array.isArray(list)?list:[]).map((item,index)=>{
    if(item?.[2] && !Number.isInteger(item[2].__stopIndex)) item[2].__stopIndex=index;
    const progress=resultRouteProgress(item);
    if(progress===null || progress<start-0.01 || progress>end+0.01) return null;
    const relative=Math.max(0,Math.min(0.999999,(progress-start)/daySpan));
    const zone=Math.max(0,Math.min(zoneCount-1,Math.floor(relative*zoneCount)));
    const km=progress*Math.max(1,Number(state.routeDistanceKm)||1);
    return {item,index,progress,relative,zone,km,score:resultQualityScore(item)};
  }).filter(Boolean);
  if(!annotated.length) return [];

  annotated.forEach(entry=>{ const meta=entry.item?.[2]; if(meta){ delete meta.distributionZone; delete meta.distributionLabel; } });
  const byZone=Array.from({length:zoneCount},()=>[]);
  annotated.forEach(entry=>byZone[entry.zone].push(entry));
  byZone.forEach(group=>group.sort((a,b)=>b.score-a.score || a.progress-b.progress || a.index-b.index));

  const chosen=[];
  const chosenIndexes=new Set();
  const minSpacing=distributedMinimumSpacingKm();
  const fits=(entry,spacing=minSpacing)=>chosen.every(existing=>Math.abs(existing.km-entry.km)>=spacing);
  const take=(entry)=>{
    if(!entry || chosenIndexes.has(entry.index)) return false;
    chosen.push(entry); chosenIndexes.add(entry.index);
    const meta=entry.item?.[2];
    if(meta){ meta.distributionZone=entry.zone+1; meta.distributionLabel=distributionZoneLabel(entry.zone); }
    return true;
  };

  // Eerste ronde: één sterke plek per vaste routezone.
  for(let zone=0;zone<zoneCount;zone++){
    const candidate=byZone[zone].find(entry=>fits(entry));
    if(candidate) take(candidate);
  }
  // Tweede ronde: maximaal twee per zone, alleen wanneer ze voldoende uit elkaar liggen.
  for(let zone=0;zone<zoneCount && chosen.length<maxResults;zone++){
    const already=chosen.filter(entry=>entry.zone===zone).length;
    if(already>=2) continue;
    const candidate=byZone[zone].find(entry=>!chosenIndexes.has(entry.index)&&fits(entry));
    if(candidate) take(candidate);
  }
  // Lege zones en dunne gebieden aanvullen vanuit naburige zones: grootste nog onbedekte afstand wint.
  const remaining=annotated.filter(entry=>!chosenIndexes.has(entry.index));
  while(chosen.length<Math.min(maxResults,annotated.length)){
    const ranked=remaining.filter(entry=>!chosenIndexes.has(entry.index)&&chosen.filter(x=>x.zone===entry.zone).length<2&&fits(entry)).map(entry=>({
      entry,
      coverage:chosen.length?Math.min(...chosen.map(existing=>Math.abs(existing.km-entry.km))):9999
    })).sort((a,b)=>b.coverage-a.coverage || b.entry.score-a.entry.score || a.entry.progress-b.entry.progress);
    if(!ranked.length) break;
    take(ranked[0].entry);
  }
  // Bij weinig resultaten één gecontroleerde versoepeling, zonder weer clustering te veroorzaken.
  const minimumTarget=Math.min(5,annotated.length,maxResults);
  if(chosen.length<minimumTarget){
    const relaxed=Math.max(22,minSpacing*0.7);
    for(const entry of annotated.slice().sort((a,b)=>b.score-a.score || a.progress-b.progress)){
      if(chosen.length>=minimumTarget) break;
      if(!chosenIndexes.has(entry.index)&&chosen.filter(x=>x.zone===entry.zone).length<2&&fits(entry,relaxed)) take(entry);
    }
  }
  return chosen.sort((a,b)=>a.progress-b.progress).map(entry=>entry.item);
}
function currentDisplayedStopsForMap(){
  if(!state.category) return [];
  const list=(stops[state.category]||[]).map((item,i)=>{ if(item?.[2]) item[2].__stopIndex=i; return item; });
  if(state.suggestions && state.view==='recommended' && supportsDistributedRecommendations(state.category)) return recommendedDistributedStops(list);
  if(state.suggestions && state.view==='recommended' && isEnergyCategory(state.category)) return recommendedEnergyStops(list);
  if(state.suggestions && state.view==='recommended') return list.slice(0,isOvernightCategory(state.category)?8:6);
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

function parseCoordinateText(value){
  const raw=String(value||'').trim();
  const direct=raw.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if(direct){const lat=Number(direct[1]),lng=Number(direct[2]); if(Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180) return {lat,lng};}
  const at=raw.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if(at) return {lat:Number(at[1]),lng:Number(at[2])};
  const q=raw.match(/[?&](?:q|query|destination)=(-?\d{1,2}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)/i);
  if(q) return {lat:Number(q[1]),lng:Number(q[2])};
  const bang=raw.match(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
  return bang?{lat:Number(bang[1]),lng:Number(bang[2])}:null;
}
function currentPosition(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){reject(new Error('Locatie is niet beschikbaar in deze browser'));return;}
    navigator.geolocation.getCurrentPosition(pos=>resolve({lat:Number(pos.coords.latitude),lng:Number(pos.coords.longitude),accuracy:Number(pos.coords.accuracy)||null}),err=>reject(new Error(err?.code===1?'Geef Roadora toestemming om je locatie te gebruiken':'Je actuele locatie kon niet worden bepaald')),{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
  });
}
function pointWithRouteMeta(center,index=0){
  const lat=Number(center?.lat),lng=Number(center?.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)) return null;
  const projection=nearestRouteProjection(lat,lng);
  return {lat,lng,index,progress:projection?clampRouteProgress(projection.progress):null,distanceFromStartMeters:projection?Math.round(clampRouteProgress(projection.progress)*Number(state.routeDistanceKm||0)*1000):null,label:sanitizePlainText(center?.label||'',120)};
}
function clearSearchCenterMarker(){
  if(searchCenterMarker&&map&&map.hasLayer(searchCenterMarker)) map.removeLayer(searchCenterMarker);
  searchCenterMarker=null;
}
function showSearchCenter(center,label='Zoekgebied'){
  clearSearchCenterMarker();
  if(!map||!window.L||!Number.isFinite(Number(center?.lat))||!Number.isFinite(Number(center?.lng))) return;
  searchCenterMarker=L.marker([Number(center.lat),Number(center.lng)],{icon:L.divIcon({className:'',html:'<div class="search-center-pin">⌖</div>',iconSize:[32,32],iconAnchor:[16,16]})}).addTo(map).bindTooltip(escapeHtml(label));
  map.setView([Number(center.lat),Number(center.lng)],Math.max(10,map.getZoom()));
}
async function resolveSearchCenter(value){
  const parsed=parseCoordinateText(value);
  if(parsed) return parsed;
  const geo=await geocodePlace(value);
  return {lat:Number(geo.lat??geo.location?.lat??geo.coord?.[1]),lng:Number(geo.lng??geo.location?.lng??geo.coord?.[0]),label:geo.formattedAddress||value};
}
function beginMapPick(mode){
  if(!map){toast('De kaart is nog niet klaar');return;}
  mapPickMode=mode;
  document.body.classList.add('map-pick-active');
  toast(mode==='outing-route'?'Tik op het gewenste deel van de route':'Tik op de gewenste plek op de kaart');
}
function finishMapPick(){mapPickMode=''; document.body.classList.remove('map-pick-active');}
function handleMapSelectionClick(event){
  if(!mapPickMode) return;
  const clicked={lat:Number(event.latlng.lat),lng:Number(event.latlng.lng)};
  if(mapPickMode==='outing-map' || mapPickMode==='outing-route'){
    const center=mapPickMode==='outing-route'&&hasRoute()?nearestRouteProjection(clicked.lat,clicked.lng):null;
    state.outingSearchCenter=center?{lat:center.lat,lng:center.lng,label:'Gekozen routepunt'}:{...clicked,label:'Gekozen kaartpunt'};
    state.outingSearchMode=mapPickMode==='outing-route'?'route':'map';
    finishMapPick(); showSearchCenter(state.outingSearchCenter,state.outingSearchCenter.label); renderStops(); saveDraftNow();
    toast('Zoekpunt gekozen. Tik op Zoek uitjes.');
    return;
  }
  if(mapPickMode==='manual-place'){
    $('#manualPlaceLocation').value=`${clicked.lat.toFixed(6)}, ${clicked.lng.toFixed(6)}`;
    if(manualPlaceMarker&&map.hasLayer(manualPlaceMarker)) map.removeLayer(manualPlaceMarker);
    manualPlaceMarker=L.marker([clicked.lat,clicked.lng]).addTo(map).bindTooltip('Zelf gekozen plek').openTooltip();
    finishMapPick(); openManualPlaceModal();
  }
}
function foodSearchCenterLabel(){return state.foodSearchCenter?'Huidige locatie vastgesteld':'Gebruik je actuele locatie om 10–15 opties binnen 10 km te laden.';}
async function searchFoodNearCurrentLocation(){
  try{
    setPlaceStatus('restaurants','loading','Je actuele locatie wordt bepaald…'); renderStops();
    const center=await currentPosition();
    state.foodSearchCenter={...center,label:'Huidige locatie'};
    showSearchCenter(center,'Huidige locatie');
    await loadLivePlacesFor('restaurants',{points:[pointWithRouteMeta(center)],radiusMeters:10000,maxResults:15,mode:'current_location_food'});
  }catch(err){stops.restaurants=[];setPlaceStatus('restaurants','error',String(err?.message||err));renderStops();}
}
async function searchOutingsManually(){
  try{
    const searchTerm=sanitizePlainText($('#outingSearchTerm')?.value||state.outingSearchTerm,120);
    state.outingSearchTerm=searchTerm;
    let center=state.outingSearchCenter;
    if(state.outingSearchMode==='current') center={...(await currentPosition()),label:'Huidige locatie'};
    if(state.outingSearchMode==='place'){
      const areaQuery=sanitizePlainText($('#outingAreaQuery')?.value||state.outingAreaQuery||state.outingSearchQuery,180);
      if(!areaQuery) throw new Error('Vul eerst een plaats of adres in waar je wilt zoeken');
      state.outingAreaQuery=areaQuery;
      state.outingSearchQuery=areaQuery; // alleen voor compatibiliteit met oudere opgeslagen roadtrips
      center=await resolveSearchCenter(areaQuery); center.label=center.label||areaQuery;
    }
    if(!center) throw new Error(state.outingSearchMode==='route'?'Kies eerst een punt op de route':'Kies eerst een punt op de kaart');
    state.outingSearchCenter={lat:Number(center.lat),lng:Number(center.lng),label:center.label||'Gekozen zoekgebied'};
    showSearchCenter(state.outingSearchCenter,state.outingSearchCenter.label);
    const radiusKm=Math.max(10,Math.min(50,Number($('#outingSearchRadius')?.value||state.outingSearchRadiusKm)||25));
    state.outingSearchRadiusKm=radiusKm;
    const typeHint=outingTypeLabel(state.outingType).toLowerCase();
    setPlaceStatus('uitjes','loading',searchTerm?`Zoeken naar “${searchTerm}” rond ${state.outingSearchCenter.label}…`:`${typeHint} zoeken rond ${state.outingSearchCenter.label}…`);
    await loadLivePlacesFor('uitjes',{
      points:[pointWithRouteMeta(state.outingSearchCenter)],
      radiusMeters:radiusKm*1000,
      maxResults:20,
      mode:`manual_${state.outingSearchMode}`,
      searchTerm
    });
  }catch(err){stops.uitjes=[];setPlaceStatus('uitjes','error',String(err?.message||err));renderStops();}
}
function renderRoundtripStops(){
  const wrap=$('#roundtripFields'), list=$('#roundtripStopList');
  if(!wrap||!list) return;
  const round=state.tripType==='roundtrip';
  wrap.classList.toggle('hidden',!round); wrap.setAttribute('aria-hidden',String(!round));
  const rows=Array.isArray(state.roundtripStops)?state.roundtripStops:[];
  list.innerHTML=rows.map((value,index)=>`<div class="roundtrip-stop-row"><span>${index+1}</span><input type="text" data-roundtrip-stop="${index}" value="${escapeHtml(value)}" placeholder="Plaats of adres"><button type="button" data-remove-roundtrip-stop="${index}" aria-label="Tussenbestemming verwijderen">×</button></div>`).join('');
}
function openManualPlaceModal(){const modal=$('#manualPlaceModal'); if(!modal)return; const day=$('#manualPlaceDay');if(day)day.textContent=String(state.activeDay);modal.classList.add('open');modal.setAttribute('aria-hidden','false');}
function closeManualPlaceModal(){const modal=$('#manualPlaceModal');if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');finishMapPick();}
function manualCategoryFromType(type){return ({hotel:'hotels',camperplace:'camperplaces',food:'restaurants',outing:'uitjes',stop:'wc',other:'wc'})[type]||'wc';}
async function saveManualPlace(){
  const type=$('#manualPlaceType')?.value||'other';
  const name=sanitizePlainText($('#manualPlaceName')?.value,120);
  const location=sanitizePlainText($('#manualPlaceLocation')?.value,400);
  const notes=sanitizePlainText($('#manualPlaceNotes')?.value,300);
  if(!name||!location){toast('Vul een naam en locatie in');return;}
  try{
    const center=await resolveSearchCenter(location);
    const projection=hasRoute()?nearestRouteProjection(center.lat,center.lng):null;
    if(projection&&projection.gapKm>25&&!confirm(`Deze plek ligt ongeveer ${Math.round(projection.gapKm)} km van je gekozen route. Toch toevoegen?`)) return;
    const cat=manualCategoryFromType(type);
    const label={hotel:'Hotel',camperplace:'Camperplek',food:'Eten',outing:'Uitje',stop:'Tussenstop',other:'Zelf ingevuld'}[type]||'Zelf ingevuld';
    const meta={id:`user-${Date.now()}`,source:'user',manualLabel:label,userAdded:true,provider:'Zelf toegevoegd',lat:Number(center.lat),lng:Number(center.lng),name,category:cat,address:center.label||location,notes,googleMapsUri:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${center.lat},${center.lng}`)}`,status:'controleer toegang en beschikbaarheid bij de aanbieder',amenities:['Zelf toegevoegd'],stopDurationMin:type==='food'?45:type==='outing'?60:10};
    if(projection){meta.routeProgress=clampRouteProgress(projection.progress);meta.distanceFromStartMeters=Math.round(meta.routeProgress*Number(state.routeDistanceKm||0)*1000);meta.routeGapKm=Math.round(projection.gapKm*10)/10;meta.detourMinutes=Math.max(2,Math.min(90,Math.round(2+projection.gapKm*2.2)));meta.detourLabel=`± ${meta.detourMinutes} min van route`;}
    const desc=['Zelf toegevoegd',notes,'controleer toegang en beschikbaarheid bij de aanbieder',meta.detourLabel].filter(Boolean).join(' · ');
    stops[cat].push([name,desc,meta]);
    const index=stops[cat].length-1;
    state.category=cat; closeManualPlaceModal(); addStopToActiveDay(cat,index);
  }catch(err){toast(String(err?.message||err));}
}
function navigateToPlace(cat,index){
  const item=(stops[cat]||[])[Number(index)]; const meta=item?.[2]||{};
  const lat=Number(meta.lat),lng=Number(meta.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)){toast('Geen exacte locatie beschikbaar');return;}
  const point={value:`${lat},${lng}`,placeId:String(meta.id||meta.placeId||'')};
  window.open(buildGoogleMapsUrl([point]),'_blank','noopener');
}
function linkPreviousOvernightToDay(day=state.activeDay){
  const d=Number(day); if(d<=1)return;
  const previous=selectedHotelForDay(d-1); if(!previous){toast('Dag '+(d-1)+' heeft nog geen overnachtingsplek');return;}
  const plan=timelines[d]||dayPlan(); const meta={...navMetaForHotel(previous),linkedFromPrevious:true};
  plan[0]=[safeTimeValue(plan[0]?.[0])||state.depart||'—',`Vertrek ${previous.name}`,'Door jou gekoppeld aan de overnachting van de vorige dag','Vertrek',meta];
  refreshDayTimelineTimes(d);renderAll();saveDraftNow();toast(`Overnachting Dag ${d-1} gebruikt als vertrek van Dag ${d}`);
}

function resetLiveCategory(cat,status='loading'){
  state.placeStatus[cat]=status;
  state.placeStatus[`${cat}Day`]=state.activeDay;
  stops[cat]=[];
  if(state.category===cat) renderStops();
}
function setPlaceStatus(cat,status,message=''){
  state.placeStatus[cat]=status;
  state.placeStatus[`${cat}Message`]=message;
  if(state.category===cat) renderStops();
}

function normalizeLivePlace(place,cat){
  const name=place?.name || (cat==='hotels'?'Hotel langs route':cat==='camperplaces'?'Camperplek langs route':cat==='restaurants'?'Eetstop langs route':cat==='uitjes'?'Uitje langs route':cat==='wc'?'WC-stop langs route':'Tankstation langs route');
  const projected={...place};
  const projection=nearestRouteProjection(projected.lat,projected.lng);
  if(projection){
    projected.routeProgress=clampRouteProgress(projection.progress);
    projected.distanceFromStartMeters=Math.round(projected.routeProgress*Number(state.routeDistanceKm||0)*1000);
    projected.routeGapKm=Math.round(projection.gapKm*10)/10;
    const detourMinutes=Math.max(2,Math.min(60,Math.round(2+projection.gapKm*2.2)));
    projected.detourMinutes=detourMinutes;
    projected.detourLabel=`± ${detourMinutes} min van route`;
  }
  const bits=[];
  if(projected?.rating) bits.push(`${projected.rating} ★`);
  if(Array.isArray(projected?.amenities)&&projected.amenities.length) bits.push(projected.amenities.slice(0,3).join(' · '));
  const distanceKm = Number.isFinite(Number(projected?.distanceFromStartMeters)) ? Math.round(Number(projected.distanceFromStartMeters)/1000) : null;
  if(isEnergyCategory(cat) && Number.isFinite(distanceKm)) bits.push(`± ${distanceKm} km vanaf vertrek`);
  if(isOvernightCategory(cat) || cat==='restaurants' || cat==='uitjes' || cat==='wc') hotelTripMeta(projected).forEach(x=>bits.push(x));
  const availability=availabilityLabel(projected); if(availability) bits.push(availability);
  bits.push(projected?.detourLabel || (isOvernightCategory(cat)?'+10 min omrijden':'+3 min omrijden'));
  const derivedPhotoUrl = projected?.photoUrl || (projected?.photoName ? `/api/google-photo?name=${encodeURIComponent(projected.photoName)}&w=420` : null);
  const derivedPhotoUrls = Array.isArray(projected?.photoUrls) && projected.photoUrls.length
    ? projected.photoUrls
    : (derivedPhotoUrl ? [derivedPhotoUrl] : []);
  const meta={...projected, live:true, distanceFromStartKm:distanceKm, photoUrl:derivedPhotoUrl, photoUrls:derivedPhotoUrls, address:projected?.address||'', googleMapsUri:projected?.googleMapsUri||null, website:projected?.website||null};
  return [name,bits.filter(Boolean).join(' · '),meta];
}

function placeInsideRequestedSearchArea(place,points,radiusMeters,cat){
  const lat=Number(place?.lat),lng=Number(place?.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)) return false;
  // Alleen een sterke exacte naammatch mag als aparte optie buiten de gekozen straal worden getoond.
  if(cat==='uitjes' && place?.exactOutsideSearchArea===true && place?.exactNameMatch===true) return true;
  const nearestPointKm=Math.min(...points.map(point=>haversineKm(lat,lng,Number(point.lat),Number(point.lng))));
  if(!Number.isFinite(nearestPointKm) || nearestPointKm>(Number(radiusMeters)/1000)+0.25) return false;
  if(isOvernightCategory(cat)){
    const projection=nearestRouteProjection(lat,lng);
    if(!projection || projection.gapKm>(Number(radiusMeters)/1000)+0.25) return false;
    const progresses=points.map(point=>Number(point.progress)).filter(Number.isFinite);
    if(progresses.length){
      const routeKm=Math.max(1,Number(state.routeDistanceKm)||1);
      const margin=(Number(radiusMeters)/1000)/routeKm+0.015;
      const low=Math.max(0,Math.min(...progresses)-margin);
      const high=Math.min(1,Math.max(...progresses)+margin);
      if(projection.progress<low || projection.progress>high) return false;
    }
  }
  return true;
}
async function loadLivePlacesFor(cat,options={}){
  const endpoint = cat==='hotels' ? '/api/google-hotels' : cat==='camperplaces' ? '/api/google-camperplaces' : cat==='restaurants' ? '/api/google-food' : cat==='uitjes' ? '/api/google-outings' : cat==='wc' ? '/api/google-wc' : cat==='tanken' ? '/api/google-fuel' : cat==='laden' ? '/api/google-charging' : null;
  if(!endpoint) return false;
  if(cat==='camperplaces' && !supportsCamperPlaces()){
    state.category=''; clearPlaceMarkers(); renderStops(); toast('Camperplekken zijn alleen beschikbaar voor Busje en Camper'); return false;
  }
  if(isOvernightCategory(cat) && !hasValidDepartTime()){
    stops[cat]=[]; clearPlaceMarkers(); setPlaceStatus(cat,'empty','Vul eerst je vertrektijd in. Dan kunnen we bepalen waar je rond je aankomsttijdvak op de route bent.'); return false;
  }
  if(isOvernightCategory(cat) && !arrivalSlotLabel()){
    stops[cat]=[]; clearPlaceMarkers(); setPlaceStatus(cat,'empty','Kies eerst wanneer je ongeveer wilt aankomen. Dan zoeken we rond het juiste stuk van je route.'); return false;
  }
  const points=Array.isArray(options.points)&&options.points.length?options.points:(isOvernightCategory(cat)?hotelArrivalSearchPoints():(isEnergyCategory(cat)?energySearchPoints():activeDayRouteSamplePoints(cat==='wc'?8:6)));
  if(!points.length){setPlaceStatus(cat,'empty',isOvernightCategory(cat)?'Kies eerst een geldig aankomsttijdvak.':'Kies eerst waar Roadora moet zoeken.');return false;}
  const overnight=isOvernightCategory(cat);
  try{
    const radiusMeters=Number(options.radiusMeters)||(overnight?22000:(cat==='wc'?4500:7000));
    const maxResults=Number(options.maxResults)||(overnight?30:40);
    const body={points,radiusMeters,mode:options.mode||(overnight?`arrival_window_${cat}_cost_safe`:`route_${cat}_day_${state.activeDay}`),maxResults};
    if(cat==='hotels') body.hotelHint=hotelSearchHint();
    if(cat==='restaurants') body.foodType=state.foodType||'restaurant';
    if(cat==='uitjes'){ body.outingType=state.outingType||'highlights'; body.searchTerm=sanitizePlainText(options.searchTerm ?? state.outingSearchTerm,120); }
    setPlaceStatus(cat,'loading',cat==='restaurants'?'Eten binnen 10 km laden…':cat==='uitjes'?(body.searchTerm?`Zoeken naar “${body.searchTerm}”…`:'Uitjes rond je gekozen gebied laden…'):'Live resultaten laden…');
    const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await res.json().catch(()=>({places:[]}));
    if(!res.ok || data.ok===false) throw new Error(data.message||data.status||'live places fout');
    const rawPlaces=Array.isArray(data.places)?data.places:[];
    const accepted=rawPlaces.filter(place=>placeInsideRequestedSearchArea(place,points,radiusMeters,cat));
    const list=accepted.map(p=>normalizeLivePlace(p,cat));
    stops[cat]=list;
    if(list.length){
      const outsideCount=cat==='uitjes'?list.filter(item=>item?.[2]?.exactOutsideSearchArea===true).length:0;
      const message=cat==='restaurants'?`${list.length} opties binnen 10 km van je actuele locatie.`:cat==='uitjes'?`${list.length-outsideCount} uitjes binnen het gekozen gebied${outsideCount?` · ${outsideCount} exacte match daarbuiten`:''}.`:(isOvernightCategory(cat)?`${list.length} resultaten binnen het gekozen aankomstgebied.`:`${list.length} resultaten langs Dag ${state.activeDay}.`);
      setPlaceStatus(cat,'live',message);renderStops();return true;
    }
    setPlaceStatus(cat,'empty',cat==='restaurants'?'Geen eten gevonden binnen 10 km. Probeer een andere categorie.':cat==='uitjes'?(body.searchTerm?`Geen resultaten voor “${body.searchTerm}” binnen deze straal. Probeer een andere zoekterm, grotere straal of ander gebied.`:'Geen uitjes gevonden binnen deze straal. Vergroot de straal of kies een ander gebied.'):isOvernightCategory(cat)?'Geen resultaten binnen 22 km van het gekozen aankomstgebied.':'Geen live resultaten gevonden.');renderStops();
  }catch(err){console.warn(`Roadora ${cat} live places error:`,err);stops[cat]=[];setPlaceStatus(cat,'error',String(err?.message||err));renderStops();}
  return false;
}
function reprojectSavedPlanToCurrentRoute(){
  let adjusted=0;
  const adjustedKeys=new Set();
  const inspectCount=meta=>{
    const lat=Number(meta?.lat),lng=Number(meta?.lng);
    const key=meta?.id||meta?.placeId||(Number.isFinite(lat)&&Number.isFinite(lng)?`${lat.toFixed(5)},${lng.toFixed(5)}`:`unknown-${adjustedKeys.size}`);
    if(adjustedKeys.has(key)) return;
    adjustedKeys.add(key); adjusted++;
  };
  Object.entries(timelines).forEach(([dayKey,plan])=>{
    if(!Array.isArray(plan)) return;
    plan.forEach(row=>{
      const meta=row?.[4];
      if(!meta || typeof meta!=='object' || !Number.isFinite(Number(meta.lat)) || !Number.isFinite(Number(meta.lng))) return;
      const projection=updateMetaForCurrentRoute(meta);
      if(projection) inspectCount(meta);
    });
    refreshDayTimelineTimes(Number(dayKey));
  });
  Object.entries(state.dayHotels||{}).forEach(([dayKey,hotel])=>{
    const meta=hotel?.meta;
    if(!meta || typeof meta!=='object') return;
    const projection=updateMetaForCurrentRoute(meta);
    if(projection){
      inspectCount(meta);
      hotel.info=hotelTripInfo(meta,Number(dayKey));
      const plan=timelines[Number(dayKey)];
      const last=Array.isArray(plan)&&plan.length?plan[plan.length-1]:null;
      if(last?.[4]&&typeof last[4]==='object') Object.assign(last[4],meta);
    }
  });
  state.routeMismatchCount=currentRouteMismatchCount();
  refreshAllTimelineTimes();
  return {adjusted,mismatch:state.routeMismatchCount};
}
async function loadRealRoute({preservePlan=false,requestedPreference=null}={}){
  readForm();
  const previousPreference=state.routePreference||'fastest';
  const preference=['fastest','tollfree','alternative'].includes(requestedPreference)?requestedPreference:previousPreference;
  clearPlaceMarkers();
  if(!state.origin || !state.destination){
    state.routeSource='empty';
    setPlaceStatus('hotels','empty','Vul eerst vertrekpunt en bestemming in.');
    updateTexts(); renderStops(); renderRouteChoices();
    toast('Vul vertrekpunt en bestemming in');
    return false;
  }
  const routeBackup={
    routeCoords:cloneJsonSafe(routeCoords), routeVariants:cloneJsonSafe(routeVariants),
    routeSource:state.routeSource, routeDistanceKm:state.routeDistanceKm, routeDurationMin:state.routeDurationMin,
    routePreference:previousPreference, routeVariantId:state.routeVariantId, routeVariantSummaries:cloneJsonSafe(state.routeVariantSummaries),
    originResolved:state.originResolved, destinationResolved:state.destinationResolved,
    markerData:cloneJsonSafe(markerData), stops:cloneJsonSafe(stops), placeStatus:cloneJsonSafe(state.placeStatus)
  };
  state.routePreference=preference;
  resetLiveResultsForRoute();
  try{
    toast('Plaatsen zoeken…');
    rememberCurrentLocations();
    const anchorNames=state.tripType==='roundtrip'?(state.roundtripStops||[]).map(x=>sanitizePlainText(x,180)).filter(Boolean):[];
    const geocoded=await Promise.all([geocodePlace(state.origin),...anchorNames.map(geocodePlace),geocodePlace(state.destination)]);
    const startGeo=geocoded[0],endGeo=geocoded[geocoded.length-1],viaGeo=geocoded.slice(1,-1);
    toast('Routevarianten laden…');
    const params=new URLSearchParams({start:startGeo.coord.join(','),end:endGeo.coord.join(','),profile:'driving-car',variants:'1',preference});
    if(viaGeo.length) params.set('waypoints',viaGeo.map(x=>x.coord.join(',')).join('|'));
    const res=await fetch('/api/route?'+params.toString(),{headers:{Accept:'application/json'}});
    const data=await res.json().catch(()=>({}));
    let selected=null;
    if(res.ok && Array.isArray(data?.variants) && data.variants.length){
      routeVariants=data.variants.map(normalizeRouteVariant).filter(Boolean);
      selected=routeVariants.find(v=>v.id===(data.selectedId||preference)) || routeVariants.find(v=>v.id==='fastest') || routeVariants[0];
    } else if(res.ok && data?.features?.[0]?.geometry?.coordinates){
      const feature=data.features[0]; const summary=feature.properties?.summary||{};
      selected=normalizeRouteVariant({
        id:preference,label:routePreferenceLabel(preference),preference,
        distanceMeters:Number(summary.distance||0),durationSeconds:Number(summary.duration||0),
        source:data?.roadora?.source||'external-route',mode:data?.roadora?.mode||'',
        geometry:feature.geometry
      });
      routeVariants=selected?[selected]:[];
    }
    if(!selected){
      console.warn('Roadora route API detail:',data);
      try{console.warn('Roadora route API detail JSON:',JSON.stringify(data,null,2));}catch(_){}
      window.__ROADORA_LAST_ROUTE_ERROR__=data;
      const firstAttempt=data?.debug?.attempts?.[0];
      const msg=firstAttempt?.body?.error?.message||firstAttempt?.body?.message||firstAttempt?.message||data?.error||data?.status||`Route ${res.status}`;
      throw new Error(String(msg));
    }
    state.originResolved=startGeo.formattedAddress||state.origin;
    state.destinationResolved=endGeo.formattedAddress||state.destination;
    state.routeVariantSummaries=routeVariants.map(routeVariantSummary);
    if(!applyRouteVariant(selected,{preservePlan,confirmImpact:false,silent:true})) throw new Error('Route heeft geen bruikbare polyline');
    updateTexts(); renderTimeline(); renderStops(); renderRouteChoices(); updateMapRoute();
    toast(`${selected.label} geladen via ${routeProviderLabel(state.routeSource)}`);
    saveDraftNow();
    return true;
  }catch(err){
    console.warn('Roadora route error:',err);
    routeCoords=routeBackup.routeCoords; routeGeometryCache=null; routeVariants=routeBackup.routeVariants;
    markerData=routeBackup.markerData;
    state.routeSource=routeBackup.routeSource; state.routeDistanceKm=routeBackup.routeDistanceKm; state.routeDurationMin=routeBackup.routeDurationMin;
    state.routePreference=routeBackup.routePreference; state.routeVariantId=routeBackup.routeVariantId; state.routeVariantSummaries=routeBackup.routeVariantSummaries||[];
    state.originResolved=routeBackup.originResolved; state.destinationResolved=routeBackup.destinationResolved;
    state.placeStatus=routeBackup.placeStatus||{};
    Object.keys(stops).forEach(cat=>{stops[cat]=Array.isArray(routeBackup.stops?.[cat])?routeBackup.stops[cat]:[];});
    updateMapRoute();
    setPlaceStatus('hotels','error','Route of geocoding niet geladen; live hotels zijn daarom niet opgehaald.');
    setPlaceStatus('camperplaces','error','Route of geocoding niet geladen; live camperplekken zijn daarom niet opgehaald.');
    setPlaceStatus('tanken','error','Route of geocoding niet geladen; live tankstations zijn daarom niet opgehaald.');
    setPlaceStatus('laden','error','Route of geocoding niet geladen; live laadpunten zijn daarom niet opgehaald.');
    setPlaceStatus('restaurants','error','Route of geocoding niet geladen; live eetstops zijn daarom niet opgehaald.');
    setPlaceStatus('wc','error','Route of geocoding niet geladen; live WC-plekken zijn daarom niet opgehaald.');
    updateTexts(); renderStops(); renderRouteChoices();
    toast(hasRoute()?'Nieuwe route niet geladen; bestaande route blijft staan':'Route niet geladen: open console voor Roadora route API detail JSON');
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
  state.origin=sanitizePlainText($('#origin')?.value||'',180);
  state.destination=sanitizePlainText($('#destination')?.value||'',180);
  state.date=$('#date')?.value || todayISO();
  state.depart=normalizeTimeValue($('#departTime')?.value || '');
  state.arrival=$('#hotelArrival')?.value || '';
  state.activeDay=Math.max(1,Math.min(state.days,Number(state.activeDay)||1));
  state.range=Number($('#vehicleRangeKm')?.value)||0;
  state.plug=$('#plug')?.value || 'CCS';
  state.adults=Number($('[name="adults"]')?.value)||1;
  state.children=Number($('[name="children"]')?.value)||0;
  state.maxDetour=Number($('#maxDetour')?.value)||20;
  state.outingSearchTerm=sanitizePlainText($('#outingSearchTerm')?.value||state.outingSearchTerm,120);
  state.outingAreaQuery=sanitizePlainText($('#outingAreaQuery')?.value||state.outingAreaQuery||state.outingSearchQuery,180);
  state.outingSearchQuery=state.outingAreaQuery;
}
function vehicleLabel(){return {car:'Auto',electric:'Elektrisch',camper:'Camper',bus:'Busje'}[state.vehicle]||'Geen voertuig gekozen'}
function setText(id, value){ const el=$(id); if(el) el.textContent=value; }
function routeTitleLabel(){
  const origin=(state.origin||'').split(',')[0].trim();
  const dest=(state.destination||'').split(',')[0].trim();
  if(origin && dest) return `${origin} → ${dest}`;
  return 'Nog geen route gepland';
}
function routeSourceLabel(){
  if(state.routeSource==='google') return `Google · ${routePreferenceLabel()}`;
  if(state.routeSource==='ors') return `ORS fallback · ${routePreferenceLabel()}`;
  if(state.routeSource==='external-route') return `Echte route · ${routePreferenceLabel()}`;
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
  setText('#sideHotel',arrivalSlotLabel() ? `overnachting ${arrivalSlotLabel()}` : 'geen tijdvak gekozen');
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
  setText('#tripOverviewMeta', hasRoute() ? `${state.tripType==='roundtrip'?'Rondreis':'Enkele reis'} · ${state.days} ${state.days===1?'dag':'dagen'} · ${Number(state.routeDistanceKm).toLocaleString('nl-NL')} km · ${durationLabel(state.routeDurationMin)}` : 'Vul je route in om een roadtrip te maken');
  const tags = [];
  if(state.children>0) tags.push(`${state.children} kinderen`);
  if(state.pet!=='none') tags.push(state.pet==='multiple'?'meerdere honden':'hond mee');
  if(state.range>0) tags.push(`${state.range} km rijbereik`);
  prefTexts.slice(0,3).forEach(p=>tags.push(p.toLowerCase()));
  if(state.vehicle==='electric') tags.push('laden'); else if(state.vehicle) tags.push('tanken');
  if($('#profileTags')) $('#profileTags').innerHTML = tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
  if($('#tripOverviewTags')) $('#tripOverviewTags').innerHTML = tags.slice(0,4).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
}
function activateTripDay(day){
  replacingPlanStop=null;
  state.activeDay=Math.max(1,Math.min(state.days,Number(day)||1));
  state.category='';
  state.suggestions=false;
  state.activeStop=null;
  editingPlanRows.clear();
  clearPlaceMarkers();
  renderAll();
}
function navMetaForHotel(hotel){
  if(!hotel) return null;
  const meta=hotel.meta||{};
  return {...meta,lat:Number(meta.lat),lng:Number(meta.lng),placeId:meta.id||meta.placeId||'',name:hotel.name,category:hotel.category||meta.category||'hotels',autoTime:true,stopDurationMin:0};
}
function rebuildDayConnections(){
  for(let day=1;day<=Number(state.days||1);day++){
    const plan=timelines[day]; if(!Array.isArray(plan)||!plan.length) continue;
    if(day===1){plan[0]=[safeTimeValue(plan[0]?.[0])||state.depart||'—',`Vertrek ${dayStartName(1)}`,'Start van deze reisdag','Vertrek'];}
    else if(plan[0]?.[4]?.linkedFromPrevious){
      const previous=selectedHotelForDay(day-1);
      if(previous) plan[0]=[safeTimeValue(plan[0]?.[0])||state.depart||'—',`Vertrek ${previous.name}`,'Door jou gekoppeld aan de overnachting van de vorige dag','Vertrek',{...navMetaForHotel(previous),linkedFromPrevious:true}];
      else plan[0]=[safeTimeValue(plan[0]?.[0])||state.depart||'—',`Vertrek dag ${day}`,'Kies zelf het vertrekpunt van deze reisdag','Vertrek'];
    }
    refreshDayTimelineTimes(day);
  }
}
function renderDays(){
  const tabs=$('#dayTabs'); tabs.innerHTML='';
  for(let i=1;i<=state.days;i++){const b=document.createElement('button'); b.className='day-tab'+(i===state.activeDay?' active':''); b.textContent=`Dag ${i}`; b.onclick=()=>activateTripDay(i); tabs.appendChild(b);}
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

function dayDataExistsBeyond(limit){
  return Object.keys(timelines).some(key=>Number(key)>limit && Array.isArray(timelines[key]) && timelines[key].length) ||
    Object.keys(state.dayHotels||{}).some(key=>Number(key)>limit);
}
function pruneTripDataToDayCount(limit){
  const maxDay=Math.max(1,Math.min(21,Number(limit)||1));
  Object.keys(timelines).forEach(key=>{ if(Number(key)>maxDay) delete timelines[key]; });
  Object.keys(state.dayHotels||{}).forEach(key=>{ if(Number(key)>maxDay) delete state.dayHotels[key]; });
  state.days=maxDay;
  state.activeDay=Math.max(1,Math.min(maxDay,Number(state.activeDay)||1));
  rebuildDayConnections();
}
function setTripDayCount(value,{confirmRemoval=true,activateNew=false}={}){
  const next=Math.max(1,Math.min(21,Number(value)||1));
  const previous=Math.max(1,Number(state.days)||1);
  const input=$('#tripDays');
  if(next<previous && confirmRemoval && dayDataExistsBeyond(next)){
    const label=next===1?'Dag 2 en later':'de latere reisdagen';
    if(!confirm(`Aantal dagen verlagen naar ${next}? ${label} worden definitief verwijderd.`)){
      if(input) input.value=previous; return false;
    }
  }
  if(next<previous) pruneTripDataToDayCount(next);
  else state.days=next;
  if(activateNew && next>previous) state.activeDay=next;
  else state.activeDay=Math.min(state.activeDay,next);
  if(input) input.value=state.days;
  state.category=''; state.suggestions=false; state.activeStop=null; clearPlaceMarkers();
  editingPlanRows.clear(); renderAll(); saveDraftNow();
  return true;
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
  const nextOvernights={};
  Object.entries(state.dayHotels||{}).forEach(([key,value])=>{
    const current=Number(key);
    if(current===day) return;
    nextOvernights[current>day?current-1:current]=value;
  });
  state.dayHotels=nextOvernights;
  state.days = Math.max(1, state.days - 1);
  if(state.activeDay === day) state.activeDay = Math.min(day, state.days);
  else if(state.activeDay > day) state.activeDay -= 1;
  const input=$('#tripDays'); if(input) input.value=state.days;
  rebuildDayConnections();
  editingPlanRows.clear();
  renderAll();
  toast('Dag verwijderd');
}
function renderTripOverview(){
  syncAllFollowingDayArrivals();
  const list=$('#overviewDayList');
  if(list){
    list.replaceChildren();
    for(let i=1;i<=state.days;i++){
      const row=document.createElement('div');
      row.className='overview-day-row'+(i===state.activeDay?' active':'');
      const open=document.createElement('button');
      open.className='overview-day-open'; open.type='button'; open.dataset.openDay=String(i);
      const num=document.createElement('span'); num.className='overview-day-num'; num.textContent=`Dag ${i}`;
      const main=document.createElement('span'); main.className='overview-day-main';
      const title=document.createElement('strong'); title.textContent=dayRouteLabel(i);
      const status=document.createElement('em'); status.textContent=i===state.activeDay?'actieve dag':dayStatus(i);
      main.append(title,status); open.append(num,main);
      const del=document.createElement('button'); del.className='overview-day-delete'; del.type='button'; del.dataset.deleteDay=String(i); del.title='Dag verwijderen'; del.textContent='Verwijder';
      row.append(open,del); list.appendChild(row);
    }
  }
  const detail=$('#activeDayDetail');
  if(detail){
    const plan=dayPlan();
    const hotel=selectedHotelForDay(state.activeDay);
    const endpointTitle=hotel?'Overnachting / eindpunt':(state.activeDay===state.days?'Bestemming / eindpunt':'Eindpunt');
    const endpointText=hotel?`${hotel.name} · ${shortRouteDetailForDay(state.activeDay)}`:shortRouteDetailForDay(state.activeDay);
    detail.replaceChildren();
    const head=document.createElement('div'); head.className='active-day-head';
    const headTitle=document.createElement('strong'); headTitle.textContent=dayRouteLabel(state.activeDay);
    const activeMoments=plan.filter((row,index)=>index===0||index===plan.length-1||!row?.[4]?.skipped).length;
    const skippedMoments=Math.max(0,plan.length-activeMoments);
    const headMeta=document.createElement('span'); headMeta.textContent=`${dayStatus(state.activeDay)} · ${activeMoments} momenten${skippedMoments?` · ${skippedMoments} overgeslagen`:''}`;
    head.append(headTitle,headMeta);
    const mini=document.createElement('div'); mini.className='active-day-mini-list';
    plan.forEach(row=>{ const item=document.createElement('div'); const skipped=Boolean(row?.[4]?.skipped); if(skipped) item.classList.add('skipped'); const time=document.createElement('span'); time.textContent=skipped?'—':safeReadTime(row[0]); const title=document.createElement('strong'); title.textContent=skipped?`Overgeslagen: ${String(row[1]||'')}`:String(row[1]||''); item.append(time,title); mini.appendChild(item); });
    const note=document.createElement('div'); note.className='active-day-note';
    const noteTitle=document.createElement('strong'); noteTitle.textContent=endpointTitle;
    const noteText=document.createElement('span'); noteText.textContent=endpointText;
    note.append(noteTitle,noteText); detail.append(head,mini,note);
    if(state.activeDay>1){const previous=selectedHotelForDay(state.activeDay-1);const linked=Boolean(plan[0]?.[4]?.linkedFromPrevious);if(previous&&!linked){const link=document.createElement('button');link.type='button';link.className='btn link-previous-overnight';link.dataset.linkPreviousOvernight=String(state.activeDay);link.textContent=`Gebruik ${previous.name} als vertrek van Dag ${state.activeDay}`;detail.appendChild(link);}}
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
  if(t.includes('hotel')||t.includes('camperplek')) return 'Overnachten rond';
  if(t.includes('uitje')) return 'Uitje';
  if(t.includes('wc')) return 'WC';
  return 'Pauze';
}
function planTypeSelect(type){
  const opts=['Vertrek','Pauze','Lunch','Laden/tanken','Overnachten rond','Restaurant','Hotel','Camperplek','Uitje','WC','Zelf ingevuld'];
  return `<select class="plan-type" aria-label="Type stop">${opts.map(o=>`<option ${o===type?'selected':''}>${o}</option>`).join('')}</select>`;
}
function isValidTimeValue(value){ return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || '')); }
function safeTimeValue(value){ return isValidTimeValue(value) ? String(value) : ''; }
function safeReadTime(value){ return value && value !== '—' ? value : 'tijd later'; }
function removePlanRow(index){
  const plan=dayPlan();
  const i=Number(index);
  if(!Number.isInteger(i) || i<0 || i>=plan.length) return false;
  if(i===0){toast('Het vertrekpunt van een reisdag kan niet worden verwijderd'); return false;}
  if(i===plan.length-1){
    const hotel=selectedHotelForDay(state.activeDay);
    if(!hotel){toast('Het eindpunt van een reisdag kan niet worden verwijderd'); return false;}
    delete state.dayHotels[state.activeDay];
    const dest=(state.destination||'').split(',')[0].trim() || (state.activeDay===state.days?'bestemming':'eindpunt later kiezen');
    plan[i]=['—',`Aankomst ${dest}`,shortRouteDetailForDay(state.activeDay),'Bestemming',{}];
    if(state.activeDay<state.days){
      const next=state.activeDay+1;
      if(Array.isArray(timelines[next]) && timelines[next].length){
        const genericStart=next===1?dayStartName(next):`dag ${next}`;
        timelines[next][0]=[safeTimeValue(timelines[next][0]?.[0])||state.depart||'—',`Vertrek ${genericStart}`,'Start van deze reisdag','Vertrek'];
      }
    }
  } else {
    plan.splice(i,1);
  }
  refreshDayTimelineTimes(state.activeDay);
  if(state.activeDay<state.days) refreshDayTimelineTimes(state.activeDay+1);
  editingPlanRows.clear();
  renderTimeline(); renderTripOverview(); scheduleAutosave();
  toast('Stop verwijderd');
  return true;
}
function canReplacePlannedStop(row){
  const category=String(row?.[4]?.category||'');
  return ['hotels','camperplaces','restaurants','laden','tanken','uitjes','wc'].includes(category);
}
function startReplacePlannedStop(index){
  const plan=dayPlan();
  const row=plan[Number(index)];
  const category=String(row?.[4]?.category||'');
  if(!row || !canReplacePlannedStop(row)){toast('Deze handmatige stop kan niet automatisch worden vervangen'); return;}
  replacingPlanStop={day:state.activeDay,index:Number(index),category};
  state.category=category; state.view='all'; state.suggestions=false;
  if(category==='restaurants') state.foodType=row?.[4]?.foodType||state.foodType||'restaurant';
  if(category==='uitjes') state.outingType=row?.[4]?.outingType||state.outingType||'highlights';
  activateTab('stopsTab');
  resetLiveCategory(category,'loading');
  renderAll();
  loadLivePlacesFor(category);
  toast(`Kies een vervangende ${categorySingular(category)} langs de nieuwe route`);
}
function toggleSkipPlannedStop(index){
  const plan=dayPlan();
  const i=Number(index);
  if(!Number.isInteger(i) || i<=0 || i>=plan.length-1){toast('Alleen tussenstops kunnen worden overgeslagen'); return false;}
  const row=plan[i];
  if(!row[4] || typeof row[4]!=='object') row[4]={};
  row[4].skipped=!row[4].skipped;
  if(!row[4].skipped) row[4].autoTime=true;
  refreshDayTimelineTimes(state.activeDay,{sortStops:false});
  renderTimeline(); renderTripOverview(); scheduleAutosave();
  toast(row[4].skipped?`${row[1]} overgeslagen`:`${row[1]} weer toegevoegd aan de route`);
  return true;
}
function renderTimeline(){
  const list = dayPlan();
  $('#timeline').innerHTML = list.map((r,i)=>{
    const detail = typeof r[2]==='function'?r[2]():r[2];
    const type = r[3] || inferType(r[1]);
    const editing = editingPlanRows.has(i);
    const hasMapPoint=Boolean(plannedRowCoordinate(r,i,list));
    const mismatch=Boolean(r?.[4]?.routeMismatch);
    const skipped=Boolean(r?.[4]?.skipped);
    const intermediate=i>0 && i<list.length-1;
    return `<div class="plan-row ${i===list.length-1?'active':''} ${editing?'editing':''} ${mismatch?'route-mismatch':''} ${skipped?'plan-row-skipped':''}" data-plan-index="${i}">
      <div class="plan-read plan-read-v653">
        <div class="plan-read-time">${escapeHtml(safeReadTime(r[0]))}</div>
        <div class="plan-read-content">
          <div class="plan-read-main"><strong>${escapeHtml(r[1])}</strong>${renderPlannedStopDetail(r,state.activeDay)}<em>${escapeHtml(type)}</em></div>
          <div class="plan-read-actions">
            ${hasMapPoint?`<button class="plan-map" type="button" data-show-plan-on-map="${i}" aria-label="Toon ${escapeHtml(r[1])} op de kaart">Kaart</button>`:''}
            ${intermediate&&canReplacePlannedStop(r)?`<button class="plan-replace" type="button" data-replace-plan-stop="${i}">Vervang</button>`:''}
            ${intermediate?`<button class="plan-skip" type="button" data-skip-plan-stop="${i}">${skipped?'Hervatten':'Overslaan'}</button>`:''}
            <button class="plan-edit" type="button">Bewerken</button>
          </div>
        </div>
      </div>
      <div class="plan-edit-panel">
        <div class="plan-timebox"><input class="plan-time-input" type="time" value="${safeTimeValue(r[0])}" aria-label="Tijd"></div>
        <div class="plan-fields">
          <div class="plan-topline">${planTypeSelect(type)}${i>0 && (i<list.length-1 || Boolean(selectedHotelForDay(state.activeDay)))?'<button class="plan-remove" type="button" title="Verwijderen">Verwijder</button>':''}</div>
          <input class="plan-title-input" value="${escapeHtml(r[1])}" aria-label="Titel van stop">
          <input class="plan-detail-input" value="${escapeHtml(detail)}" aria-label="Details of eigen locatie">
          <button class="plan-save" type="button">Opslaan</button>
        </div>
      </div>
    </div>`;
  }).join('');
  renderPlannedStopMarkers();
}

function escapeHtml(v){return String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function safePhotoUrl(value){
  const raw=String(value||'').trim(); if(!raw) return '';
  try{ const url=new URL(raw,window.location.origin); return url.origin===window.location.origin && url.pathname==='/api/google-photo' ? `${url.pathname}${url.search}` : ''; }catch(_){ return ''; }
}
function availabilityLabel(meta={}){
  if(typeof meta.openNow==='boolean') return meta.openNow?'open bij laatste controle':'gesloten bij laatste controle';
  const status=String(meta.status||'').trim();
  return status.replace(/nu open/gi,'open bij laatste controle').replace(/nu toegankelijk/gi,'toegankelijk bij laatste controle').replace(/nu mogelijk gesloten/gi,'mogelijk gesloten bij laatste controle');
}

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
  if(cat==='restaurants' && Number.isFinite(Number(meta.distanceFromSearchKm))) return [`${Number(meta.distanceFromSearchKm).toFixed(1).replace('.',',')} km vanaf huidige locatie`,availabilityLabel(meta)||'opening controleren',detour].slice(0,3);
  if(cat==='uitjes'){
    if(meta.exactOutsideSearchArea===true){
      const km=Number(meta.distanceFromSearchKm);
      return [`Exacte plek · ${Number.isFinite(km)?km.toFixed(1).replace('.',',')+' km':'buiten'} buiten zoekgebied`,availabilityLabel(meta)||'opening controleren',detour].slice(0,3);
    }
    return [meta.exactNameMatch===true?'Exacte naammatch':(meta.searchAreaLabel||'Zelf gekozen zoekgebied'),availabilityLabel(meta)||'opening controleren',detour].slice(0,3);
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
function stopWindow(cat){ const z=zoneForCategory(cat); if(cat==='restaurants') return `${foodTypeLabel()} · binnen 10 km`; if(cat==='uitjes') return `${state.outingSearchTerm||outingTypeLabel()} · zelf gekozen gebied`;  if(cat==='wc') return `onderweg op Dag ${state.activeDay}`; return z ? (isOvernightCategory(cat) ? 'zelf gekozen' : `rond ${z.time}`) : ({hotels:'zelf gekozen',camperplaces:'zelf gekozen',laden:'rond 15:15',tanken:'rond 15:15'}[cat]||'onderweg');}
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
  const tripMeta = isOvernightCategory(cat) ? hotelTripMeta(meta).map(x=>`<span>${escapeHtml(x)}</span>`).join('') : '';
  const why = stopWhyList(cat).slice(0, compact ? 2 : 3).map(x=>`<span>${escapeHtml(x)}</span>`).join('');
  const safePhoto=safePhotoUrl(meta.photoUrl);
  const photoStyle = safePhoto ? ` style="background-image:url('${escapeHtml(safePhoto)}')"` : '';
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
        ${(cat==='restaurants'||cat==='uitjes')?`<button class="text-action" data-navigate-stop="${originalIndex}" data-stop-cat="${cat}" type="button">Navigeer</button>`:''}
        <button class="text-action add" data-add-stop="${originalIndex}" data-stop-cat="${cat}" type="button">Toevoegen</button>
      </div>
    </div>
  </div>`;
}
function renderStops(){
  const distributedMode=supportsDistributedRecommendations(state.category);
  if(distributedMode){
    state.suggestions=true;
    if(!['recommended','all'].includes(state.view)) state.view='recommended';
  } else {
    state.suggestions=false;
    state.view='all';
  }
  const modeSwitch=$('#stopsTab .mode-switch');
  if(modeSwitch){
    modeSwitch.innerHTML=distributedMode
      ? `<button class="mode-btn ${state.view==='recommended'?'active':''}" data-view="recommended" type="button" aria-pressed="${state.view==='recommended'?'true':'false'}">Aanbevolen verspreid</button><button class="mode-btn ${state.view==='all'?'active':''}" data-view="all" type="button" aria-pressed="${state.view==='all'?'true':'false'}">Alle resultaten</button>`
      : '';
    modeSwitch.classList.toggle('hidden',!distributedMode);
    modeSwitch.setAttribute('aria-hidden',String(!distributedMode));
  }
  $('#categoryTabs').innerHTML = visibleCats().map(([id,label])=>`<button class="category-btn ${id===state.category?'active':''}" data-cat="${id}" type="button" aria-pressed="${id===state.category?'true':'false'}">${label}</button>`).join('');
  const foodFilters=$('#foodFilters');
  if(foodFilters){
    const showFood=state.category==='restaurants';
    const showOutings=state.category==='uitjes';
    const show=showFood||showOutings;
    foodFilters.classList.toggle('hidden',!show);
    foodFilters.setAttribute('aria-hidden',String(!show));
    foodFilters.innerHTML=showFood
      ? `<span>Wat zoek je?</span>${foodTypes.map(([id,label])=>`<button type="button" class="food-filter ${state.foodType===id?'active':''}" data-food-type="${id}" aria-pressed="${state.foodType===id?'true':'false'}">${label}</button>`).join('')}`
      : showOutings
        ? `<span>Wat wil je doen?</span>${outingTypes.map(([id,label])=>`<button type="button" class="food-filter ${state.outingType===id?'active':''}" data-outing-type="${id}" aria-pressed="${state.outingType===id?'true':'false'}">${label}</button>`).join('')}`
        : '';
  }
  const controls=$('#contextSearchControls');
  if(controls){
    if(state.category==='restaurants'){
      controls.classList.remove('hidden');controls.setAttribute('aria-hidden','false');
      controls.innerHTML=`<div class="manual-search-card"><div><strong>Nu eten zoeken</strong><span>${escapeHtml(foodSearchCenterLabel())}</span></div><button type="button" class="btn primary" id="searchFoodNow">Zoek 10–15 opties binnen 10 km</button></div>`;
    } else if(state.category==='uitjes'){
      controls.classList.remove('hidden');controls.setAttribute('aria-hidden','false');
      controls.innerHTML=`<div class="manual-search-card outing-search-card"><label class="outing-query-block" for="outingSearchTerm"><strong>Wat wil je zoeken?</strong><span>Zoek op een exacte naam of een algemene term, bijvoorbeeld bergwandeling, waterval, museum of Burg Eltz.</span><input id="outingSearchTerm" value="${escapeHtml(state.outingSearchTerm||'')}" placeholder="Bijv. bergwandeling, waterval of exacte naam" autocomplete="off"></label><div class="outing-area-block"><strong>Waar wil je zoeken?</strong><div class="search-mode-row">${[['current','Huidige locatie'],['place','Plaats/adres'],['map','Kaartpunt'],['route','Routepunt']].map(([id,label])=>`<button type="button" class="search-mode ${state.outingSearchMode===id?'active':''}" data-outing-search-mode="${id}" aria-pressed="${state.outingSearchMode===id?'true':'false'}">${label}</button>`).join('')}</div></div><div class="outing-search-fields"><input id="outingAreaQuery" class="${state.outingSearchMode==='place'?'':'hidden'}" value="${escapeHtml(state.outingAreaQuery||state.outingSearchQuery||'')}" placeholder="Bijv. Heidelberg of exact adres" aria-label="Plaats of adres waar je uitjes wilt zoeken"><select id="outingSearchRadius" aria-label="Zoekstraal uitjes"><option value="10" ${Number(state.outingSearchRadiusKm)===10?'selected':''}>10 km</option><option value="25" ${Number(state.outingSearchRadiusKm)===25?'selected':''}>25 km</option><option value="50" ${Number(state.outingSearchRadiusKm)===50?'selected':''}>50 km</option></select>${state.outingSearchMode==='map'||state.outingSearchMode==='route'?`<button type="button" class="btn" id="chooseOutingPoint">${state.outingSearchCenter?'Punt opnieuw kiezen':'Punt kiezen op kaart'}</button>`:''}<button type="button" class="btn primary" id="searchOutingsManual">Zoeken</button></div><span class="manual-search-status">${escapeHtml(state.outingSearchCenter?.label||'Kies zelf een zoekgebied. Roadora zoekt pas nadat jij op Zoeken klikt.')}</span></div>`;
    } else {controls.classList.add('hidden');controls.setAttribute('aria-hidden','true');controls.innerHTML='';}
  }
  const suggestionToggle = $('#suggestionToggle');
  if(suggestionToggle){
    suggestionToggle.textContent = distributedMode ? 'Verspreid over Dag '+state.activeDay : 'Roadora suggesties uit';
    suggestionToggle.setAttribute('aria-pressed', String(distributedMode));
    suggestionToggle.classList.toggle('off',!distributedMode);
  }
  if(!hasRoute() && !['restaurants','uitjes'].includes(state.category)){
    $('#recommendTitle').textContent = 'Plan eerst je route';
    $('#allStopsTitle').textContent = 'Nog geen stops geladen';
    const empty = `<div class="empty-stops"><strong>Plan eerst je dagroute.</strong><span>Vul vertrekpunt en bestemming in. Daarna kun je handmatig Hotels, Camperplekken, Eten, Laden, Tanken, Uitjes of WC aanzetten.</span></div>`;
    $('#recommendations').innerHTML = empty;
    $('#allStops').innerHTML = empty;
    $('#recommendPanel').classList.add('hidden');
    $('#recommendPanel').setAttribute('aria-hidden','true');
    $('#allStopsPanel').classList.remove('hidden');
    $('#allStopsPanel').setAttribute('aria-hidden','false');
    clearPlaceMarkers();
    return;
  }
  if(!state.category){
    $('#recommendTitle').textContent = 'Geen categorie geselecteerd';
    $('#allStopsTitle').textContent = 'Zet een stopcategorie aan';
    const empty = `<div class="empty-stops"><strong>Stops staan uit.</strong><span>Kies handmatig Hotels, Eten, Laden, Tanken, Uitjes of WC. Pas dan haalt Roadora live locaties op en verschijnen pins op de kaart.</span></div>`;
    $('#recommendations').innerHTML = empty;
    $('#allStops').innerHTML = empty;
    $('#recommendPanel').classList.add('hidden');
    $('#recommendPanel').setAttribute('aria-hidden','true');
    $('#allStopsPanel').classList.remove('hidden');
    $('#allStopsPanel').setAttribute('aria-hidden','false');
    clearPlaceMarkers();
    return;
  }
  const rawSelected = (stops[state.category]||[])
    .map((item,i)=>{ if(item?.[2]) item[2].__stopIndex=i; return item; })
    .sort((a,b)=>{
      const ap=resultRouteProgress(a),bp=resultRouteProgress(b);
      if(ap===null && bp===null) return 0;
      if(ap===null) return 1;
      if(bp===null) return -1;
      return ap-bp;
    });
  const recommended = distributedMode
    ? recommendedDistributedStops(rawSelected)
    : (state.suggestions ? (isEnergyCategory(state.category) ? recommendedEnergyStops(rawSelected).slice(0,10) : rawSelected.slice(0,isOvernightCategory(state.category)?20:6)) : []);
  const recTitle = distributedMode ? categoryTitle(state.category,'recommended') : (state.suggestions ? categoryTitle(state.category,'recommended') : 'Zelf zoeken actief');
  const allTitle = categoryTitle(state.category,'all');
  $('#recommendTitle').textContent = recTitle;
  $('#allStopsTitle').textContent = allTitle;
  const recommendSub = $('#recommendPanel .tiny-muted') || $('#recommendPanel .stops-subhead .mini-link');
  if(recommendSub && distributedMode) recommendSub.textContent='Alles tonen';
  const allSub = $('#allStopsPanel .tiny-muted');
  if(allSub) allSub.textContent = distributedMode
    ? 'In routevolgorde · kies zelf wat je toevoegt'
    : categorySpec(state.category).sort;
  const status = state.placeStatus[state.category] || (rawSelected.length ? 'demo' : 'empty');
  const statusMessage = state.placeStatus[`${state.category}Message`] || '';
  const emptyHtml = status==='loading'
    ? `<div class="empty-stops"><strong>Live resultaten laden…</strong><span>${state.category==='restaurants'?'Roadora zoekt binnen 10 km van je huidige locatie.':state.category==='uitjes'?'Roadora zoekt rond het gebied dat jij koos.':'Roadora zoekt live locaties.'}</span></div>`
    : status==='error'
      ? `<div class="empty-stops error"><strong>Live resultaten niet geladen.</strong><span>${escapeHtml(statusMessage || 'Controleer je API-key, Vercel env vars of Network-tab.')}</span></div>`
      : `<div class="empty-stops"><strong>Nog geen live resultaten gevonden.</strong><span>${escapeHtml(statusMessage || 'Probeer een grotere regio of bereken de route opnieuw.')}</span></div>`;
  $('#recommendations').innerHTML = recommended.length
    ? recommended.map((s,i)=>stopCardHtml(s,i,state.category,false,s?.[2]?.__stopIndex ?? i)).join('')
    : emptyHtml;
  $('#allStops').innerHTML = rawSelected.length
    ? rawSelected.map((s,i)=>stopCardHtml(s,i,state.category,true,s?.[2]?.__stopIndex ?? i)).join('')
    : emptyHtml;
  const showRecommended=distributedMode && state.view==='recommended';
  $('#recommendPanel').classList.toggle('hidden',!showRecommended);
  $('#recommendPanel').setAttribute('aria-hidden',String(!showRecommended));
  $('#allStopsPanel').classList.toggle('hidden',showRecommended);
  $('#allStopsPanel').setAttribute('aria-hidden',String(showRecommended));
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
  const modalPhotoUrl = safePhotoUrl(meta.photoUrl || (Array.isArray(meta.photoUrls) ? meta.photoUrls[0] : null));
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
  if(isOvernightCategory(cat)){
    const info=hotelTripInfo(meta);
    const dayStart=dayStartProgress(state.activeDay);
    if(Number.isFinite(info.progress) && info.progress <= dayStart+0.002){
      toast('Deze overnachtingsplek ligt vóór het vertrekpunt van deze reisdag');
      return;
    }
    const arrivalTime = info.arrivalTime && info.arrivalTime!=='—' ? info.arrivalTime : '—';
    const overnightType=cat==='camperplaces'?'Camperplek':'Hotel';
    const navMeta={...meta,lat:Number(meta.lat),lng:Number(meta.lng),placeId:meta.id||'',name:title,category:cat,autoTime:true,stopDurationMin:0};
    state.dayHotels[state.activeDay]={name:title,desc,meta:{...meta,category:cat},info,category:cat};
    replacingPlanStop=null;
    const start=dayStartName(state.activeDay);
    const middle=plan.length>2 ? plan.slice(1,-1) : [];
    timelines[state.activeDay]=[
      [state.activeDay===1 ? (state.depart || '—') : (plan[0]?.[0] || '—'), `Vertrek ${start}`, 'Start van deze reisdag', 'Vertrek'],
      ...middle,
      [arrivalTime, `Aankomst ${title}`, shortRouteDetailForDay(state.activeDay), overnightType,navMeta]
    ];
    // Roadora vult de volgende reisdag niet automatisch in. De gebruiker kan deze overnachting later bewust koppelen.
    refreshDayTimelineTimes(state.activeDay);
    if(state.activeDay < state.days) refreshDayTimelineTimes(state.activeDay+1);
    editingPlanRows.clear();
    activateTab('planningTab');
    renderAll();
    saveDraftNow();
    toast(`${title} ingesteld als eindpunt van Dag ${state.activeDay}`);
    return;
  }
  const type = meta.userAdded?(meta.manualLabel||'Zelf ingevuld'):({restaurants:foodTypeLabel(meta.foodType||state.foodType),laden:'Laden/tanken',tanken:'Laden/tanken',uitjes:meta.outingLabel||outingTypeLabel(meta.outingType||state.outingType),wc:'WC/pauze'}[cat]||'Stop');
  const insertAt=Math.max(1,plan.length-1);
  const routeProgress=routeProgressForMeta(meta);
  const startProgress=dayStartProgress(state.activeDay);
  const endProgress=dayEndProgress(state.activeDay);
  if(routeProgress!==null && (routeProgress < startProgress-0.002 || routeProgress > endProgress+0.002)){
    toast('Deze stop ligt buiten de actieve reisdag');
    return;
  }
  const navMeta={
    ...meta,
    lat:Number(meta.lat),lng:Number(meta.lng),placeId:meta.id||'',name:title,category:cat,foodType:meta.foodType||state.foodType,outingType:meta.outingType||state.outingType,
    routeProgress,
    distanceFromStartMeters:Number.isFinite(Number(meta.distanceFromStartMeters))?Number(meta.distanceFromStartMeters):(routeProgress!==null?Math.round(routeProgress*Number(state.routeDistanceKm||0)*1000):null),
    stopDurationMin:Number.isFinite(Number(meta.suggestedDurationMin))?Number(meta.suggestedDurationMin):defaultStopDurationMinutes(cat),
    autoTime:true
  };
  const replacement=replacingPlanStop && Number(replacingPlanStop.day)===Number(state.activeDay) && replacingPlanStop.category===cat
    ? Number(replacingPlanStop.index) : null;
  if(Number.isInteger(replacement) && replacement>0 && replacement<plan.length-1){
    plan[replacement]=['—',title,desc,type,navMeta];
    replacingPlanStop=null;
  } else {
    plan.splice(insertAt,0,['—',title,desc,type,navMeta]);
  }
  refreshDayTimelineTimes(state.activeDay);
  editingPlanRows.clear();
  activateTab('planningTab');
  renderTimeline(); renderTripOverview(); scheduleAutosave();
  toast(Number.isInteger(replacement)?`${title} ingesteld als vervangende stop`:`${title} toegevoegd aan Dag ${state.activeDay}`);
}
function tripDb(){return window.RoadoraTripDB || null;}
function createTripId(){return globalThis.crypto?.randomUUID ? crypto.randomUUID() : `trip-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
function shortPlace(value){return String(value||'').split(',')[0].trim();}
function defaultTripName(){
  const dest=shortPlace(state.destination);
  const origin=shortPlace(state.origin);
  if(dest) return `Roadtrip ${dest}`;
  if(origin) return `Roadtrip vanaf ${origin}`;
  return `Nieuwe roadtrip ${new Date().toLocaleDateString('nl-NL')}`;
}
function hasMeaningfulTrip(){return Boolean(state.origin || state.destination || hasRoute() || Number(state.days)>1 || Object.keys(timelines).some(k=>(timelines[k]||[]).length>1));}
function setStorageStatus(text){const el=$('#storageStatus'); if(el) el.textContent=text;}
function tripRouteLabel(){
  const from=shortPlace(state.origin)||'vertrek later';
  const to=shortPlace(state.destination)||'bestemming later';
  return `${state.tripType==='roundtrip'?'Rondreis: ':''}${from} → ${to}`;
}
function buildTripRecord(){
  const now=new Date().toISOString();
  const existing=savedTripsCache.find(t=>t.id===state.tripId);
  const snapshot=serializeDraft();
  snapshot.state.tripId=state.tripId;
  snapshot.state.tripName=state.tripName;
  return {
    id:state.tripId,
    name:state.tripName,
    route:tripRouteLabel(),
    days:Number(state.days)||1,
    createdAt:existing?.createdAt || now,
    updatedAt:now,
    snapshot
  };
}
async function refreshTripsCache(){
  const db=tripDb();
  if(!db){savedTripsCache=[]; tripLibraryLoaded=true; renderTrips(); return;}
  try{savedTripsCache=await db.list();}
  catch(err){console.warn('Roadora roadtripbibliotheek:',err); savedTripsCache=[];}
  tripLibraryLoaded=true;
  renderTrips();
}
async function saveCurrentTripToLibrary({silent=false,name=''}={}){
  if(restoringDraft || !hasMeaningfulTrip()){
    if(!silent) toast('Vul eerst minimaal een vertrekpunt of bestemming in');
    return null;
  }
  const previousTripId=state.tripId;
  const previousTripName=state.tripName;
  if(!state.tripId) state.tripId=createTripId();
  state.tripName=String(name||state.tripName||defaultTripName()).trim() || defaultTripName();
  const record=buildTripRecord();
  const db=tripDb();
  try{
    if(!db) throw new Error('Lokale opslag niet beschikbaar');
    await db.put(record);
    const index=savedTripsCache.findIndex(t=>t.id===record.id);
    if(index>=0) savedTripsCache[index]=record; else savedTripsCache.unshift(record);
    savedTripsCache.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
    saveDraftNow();
    renderTrips();
    setStorageStatus(`Opgeslagen op dit apparaat · ${new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}`);
    if(!silent) toast('Roadtrip opgeslagen op dit apparaat');
    return record;
  }catch(err){
    console.warn('Roadora opslaan mislukt:',err);
    state.tripId=previousTripId;
    state.tripName=previousTripName;
    setStorageStatus('Opslaan mislukt');
    if(!silent) toast('Roadtrip kon niet worden opgeslagen');
    return null;
  }
}
function resetWorkingPlannerState(){
  replacingPlanStop=null;
  restoringDraft=true;
  Object.keys(state).forEach(k=>delete state[k]);
  Object.assign(state,createDefaultState());
  routeCoords=[]; routeGeometryCache=null; routeVariants=[]; markerData=[];
  Object.keys(stops).forEach(k=>stops[k]=[]);
  Object.keys(timelines).forEach(k=>delete timelines[k]);
  timelines[1]=[['—','Route nog niet gepland','Vul vertrekpunt en bestemming in en klik op Maak dagroute','Vertrek']];
  editingPlanRows.clear();
  setFormFromState();
  clearPlaceMarkers();
  clearPlannedStopMarkers();
  if(routeLine) routeLine.setLatLngs([]);
  markers.forEach(m=>{if(map?.hasLayer(m)) map.removeLayer(m);}); markers=[];
  restoringDraft=false;
  try{localStorage.removeItem(AUTOSAVE_KEY);}catch(_){}
  renderAll();
  updateMapRoute();
  activateTab('planningTab');
  setStorageStatus('Nieuwe roadtrip · nog niet bewaard');
}
async function startNewRoadtrip(){
  clearTimeout(tripAutosaveTimer);
  if(hasMeaningfulTrip()){
    const saved=await saveCurrentTripToLibrary({silent:true});
    if(!saved){
      toast('Nieuwe roadtrip niet gestart: huidige reis kon niet worden opgeslagen');
      return;
    }
  }
  resetWorkingPlannerState();
  toast('Nieuwe roadtrip gestart');
}
async function openSavedTrip(id){
  const db=tripDb();
  if(!db) return;
  if(state.tripId!==id && hasMeaningfulTrip()) await saveCurrentTripToLibrary({silent:true});
  const record=await db.get(id);
  if(!record?.snapshot){toast('Deze roadtrip kan niet worden geopend'); return;}
  applyDraftSnapshot(record.snapshot);
  state.tripId=record.id;
  state.tripName=record.name || defaultTripName();
  saveDraftNow();
  applyRouteZones({resetPlan:false});
  renderAll();
  updateMapRoute();
  setTimeout(()=>{if(hasRoute()) fitMap();},120);
  activateTab(record.snapshot.activeTab || 'planningTab');
  setStorageStatus('Opgeslagen op dit apparaat');
  toast(`${state.tripName} geopend`);
}
async function renameSavedTrip(id){
  const record=savedTripsCache.find(t=>t.id===id); if(!record) return;
  const name=prompt('Nieuwe naam voor deze roadtrip:',record.name||'Roadtrip');
  if(name===null || !name.trim()) return;
  record.name=name.trim(); record.updatedAt=new Date().toISOString();
  if(record.snapshot?.state){record.snapshot.state.tripName=record.name;}
  await tripDb()?.put(record);
  if(state.tripId===id) state.tripName=record.name;
  await refreshTripsCache();
  toast('Naam gewijzigd');
}
async function duplicateSavedTrip(id){
  const db=tripDb(); if(!db) return;
  const source=await db.get(id); if(!source?.snapshot) return;
  const copy=cloneJsonSafe(source);
  copy.id=createTripId();
  copy.name=`${source.name || 'Roadtrip'} (kopie)`;
  copy.createdAt=new Date().toISOString(); copy.updatedAt=copy.createdAt;
  copy.snapshot.state.tripId=copy.id; copy.snapshot.state.tripName=copy.name;
  await db.put(copy); await refreshTripsCache();
  toast('Roadtrip gedupliceerd');
}
async function deleteSavedTrip(id){
  const record=savedTripsCache.find(t=>t.id===id); if(!record) return;
  if(!confirm(`Roadtrip “${record.name}” verwijderen?`)) return;
  await tripDb()?.remove(id);
  if(state.tripId===id){state.tripId=''; state.tripName=''; saveDraftNow(); setStorageStatus('Niet meer in Mijn roadtrips');}
  await refreshTripsCache();
  toast('Roadtrip verwijderd');
}
function navPointFromRow(row){
  if(!row) return null;
  const meta=row[4]||{};
  const lat=Number(meta.lat), lng=Number(meta.lng);
  const title=String(meta.name || row[1] || '').replace(/^Aankomst\s+/i,'').replace(/^Vertrek\s+/i,'').trim();
  const value=Number.isFinite(lat)&&Number.isFinite(lng) ? `${lat},${lng}` : title;
  if(!value) return null;
  return {value,placeId:String(meta.placeId||''),title};
}
function dayNavigationPoints(day=state.activeDay){
  const plan=timelines[day] || (day===state.activeDay ? dayPlan() : []);
  return plan.slice(1).filter(row=>!row?.[4]?.skipped).map(navPointFromRow).filter(Boolean);
}
function dayNavigationOrigin(day=state.activeDay){
  const d=Number(day)||1;
  if(d<=1) return null;
  const plan=timelines[d] || [];
  if(plan[0]?.[4]?.linkedFromPrevious){
    const previousHotel=selectedHotelForDay(d-1);
    if(previousHotel){
      const meta=previousHotel.meta||{};
      const lat=Number(meta.lat), lng=Number(meta.lng);
      const title=String(previousHotel.name||'').trim();
      const value=Number.isFinite(lat)&&Number.isFinite(lng) ? `${lat},${lng}` : title;
      if(value){
        return {
          value,
          placeId:String(meta.placeId||meta.id||''),
          title
        };
      }
    }
  }
  return navPointFromRow(plan[0]);
}
function buildGoogleMapsUrl(points,origin=null){
  if(!points.length) return '';
  const destination=points[points.length-1];
  const waypoints=points.slice(0,-1);
  const params=new URLSearchParams({api:'1',destination:destination.value,travelmode:'driving',dir_action:'navigate'});
  if(state.routePreference==='tollfree') params.set('avoid','tolls');
  if(origin?.value){
    params.set('origin',origin.value);
    if(origin.placeId) params.set('origin_place_id',origin.placeId);
  }
  if(destination.placeId) params.set('destination_place_id',destination.placeId);
  if(waypoints.length){
    params.set('waypoints',waypoints.map(p=>p.value).join('|'));
    if(waypoints.every(p=>p.placeId)) params.set('waypoint_place_ids',waypoints.map(p=>p.placeId).join('|'));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
function startFullDayRoute(){
  const points=dayNavigationPoints();
  if(!points.length){toast('Voeg eerst een bestemming of stop toe'); return;}
  if(points.length>4){toast('Meer dan 4 bestemmingen: gebruik Navigeer naar volgende stop'); return;}
  const origin=dayNavigationOrigin(state.activeDay);
  window.open(buildGoogleMapsUrl(points,origin),'_blank','noopener');
}
function navigateToNextStop(){
  const point=dayNavigationPoints()[0];
  if(!point){toast('Geen volgende stop gevonden'); return;}
  // Bewust zonder origin: deze knop navigeert altijd vanaf de actuele locatie.
  window.open(buildGoogleMapsUrl([point]),'_blank','noopener');
}
function formatTripUpdated(value){
  const d=new Date(value); if(Number.isNaN(d.getTime())) return 'onbekend';
  return d.toLocaleDateString('nl-NL',{day:'2-digit',month:'short',year:d.getFullYear()===new Date().getFullYear()?undefined:'numeric'});
}
function renderTrips(){
  const el=$('#savedTrips'); if(!el) return;
  if(!tripLibraryLoaded){el.innerHTML='<p class="muted">Opgeslagen roadtrips laden…</p>'; return;}
  el.innerHTML = savedTripsCache.length ? savedTripsCache.map(t=>`<article class="trip-card ${t.id===state.tripId?'active-trip':''}">
    <div class="trip-card-head"><strong>${escapeHtml(t.name||'Roadtrip')}</strong>${t.id===state.tripId?'<span class="trip-active-pill">geopend</span>':''}</div>
    <span>${escapeHtml(t.days||1)} ${(t.days||1)===1?'dag':'dagen'} · ${escapeHtml(t.route||'route nog niet compleet')} · gewijzigd ${escapeHtml(formatTripUpdated(t.updatedAt))}</span>
    <div class="trip-card-actions">
      <button type="button" data-trip-action="open" data-trip-id="${escapeHtml(t.id)}">Openen</button>
      <button type="button" data-trip-action="rename" data-trip-id="${escapeHtml(t.id)}">Naam</button>
      <button type="button" data-trip-action="duplicate" data-trip-id="${escapeHtml(t.id)}">Dupliceren</button>
      <button type="button" class="danger" data-trip-action="delete" data-trip-id="${escapeHtml(t.id)}">Verwijderen</button>
    </div>
  </article>`).join('') : '<p class="muted">Nog geen opgeslagen roadtrips. Maak een route en kies Bewaar.</p>';
}
function renderAll(){updateTexts();renderRoundtripStops();renderRouteChoices();renderDays();renderTimeline();renderStops();renderTripOverview();renderTrips(); if(map) setTimeout(()=>map.invalidateSize(),80); scheduleAutosave();}

function clockParts(value){
  const val=normalizeTimeValue(value) || '09:00';
  const [hh,mm]=val.split(':').map(Number);
  return {hour:Number.isFinite(hh)?hh:9, minute:Number.isFinite(mm)?mm:0};
}
function buildRoundClock(selectedHour){
  const face=$('#roundClock');
  if(!face) return;
  const radius=68;
  const center=87;
  let html='<div id="clockHand" class="clock-hand"></div><div class="clock-center"></div>';
  for(let hour=0; hour<24; hour++){
    const label=String(hour).padStart(2,'0');
    const angle=((hour % 12) / 12) * Math.PI * 2 - Math.PI/2;
    const ring = hour < 12 ? radius : 45;
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
  readForm();
  let {hour,minute}=clockParts(state.depart || $('#departTime')?.value || '09:00');
  const anchor=$('#openDepartClock');
  const panel=modal.querySelector('.clock-panel');
  if(anchor && panel){
    const r=anchor.getBoundingClientRect();
    const panelW=252;
    const gap=8;
    let left=Math.min(window.innerWidth-panelW-10, Math.max(10, r.right-panelW));
    let top=Math.min(window.innerHeight-330, Math.max(10, r.bottom+gap));
    panel.style.left=`${left}px`;
    panel.style.top=`${top}px`;
  }
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
    const clockTarget=e.target.closest('#openDepartClock, .clock-icon-btn');
    if(clockTarget){ e.preventDefault(); openClockPicker(); return; }
    const tripAction=e.target.closest('[data-trip-action]');
    if(tripAction){
      const id=tripAction.dataset.tripId; const action=tripAction.dataset.tripAction;
      if(action==='open') openSavedTrip(id);
      if(action==='rename') renameSavedTrip(id);
      if(action==='duplicate') duplicateSavedTrip(id);
      if(action==='delete') deleteSavedTrip(id);
      return;
    }
    const viewStop=e.target.closest('[data-view-stop]');
    if(viewStop){openStopDetail(viewStop.dataset.stopCat, Number(viewStop.dataset.viewStop)); return;}
    const addStop=e.target.closest('[data-add-stop]');
    if(addStop){addStopToActiveDay(addStop.dataset.stopCat, Number(addStop.dataset.addStop)); return;}
    const navStop=e.target.closest('[data-navigate-stop]');
    if(navStop){navigateToPlace(navStop.dataset.stopCat,Number(navStop.dataset.navigateStop));return;}
    const close=e.target.closest('[data-close-stop-modal]');
    if(close){closeStopDetail(); return;}
    const cat=e.target.closest('[data-cat]'); if(cat){
      const next=cat.dataset.cat;
      if(state.category===next){ state.category=''; clearPlaceMarkers(); renderStops(); toast('Categorie uitgezet'); return; }
      state.category=next;
      state.suggestions=false;
      state.view='all';
      if(hasRoute()){
        if(isOvernightCategory(next)){
          if(next==='camperplaces' && !supportsCamperPlaces()){
            state.category=''; clearPlaceMarkers(); toast('Camperplekken zijn alleen beschikbaar voor Busje en Camper');
          } else if(!hasValidDepartTime()){
            stops[next]=[]; clearPlaceMarkers();
            setPlaceStatus(next,'empty','Vul eerst je vertrektijd in. Dan kunnen we bepalen waar je rond je aankomsttijdvak op de route bent.');
            toast('Vul eerst je vertrektijd in');
          } else if(!arrivalSlotLabel()){
            stops[next]=[]; clearPlaceMarkers();
            setPlaceStatus(next,'empty','Kies eerst wanneer je ongeveer wilt aankomen. Dan zoeken we rond het juiste stuk van je route.');
            toast('Kies eerst een aankomsttijdvak');
          } else if(Number(state.placeStatus[`${next}Day`])!==Number(state.activeDay) || !['live','loading'].includes(state.placeStatus[next])){
            resetLiveCategory(next,'loading');
            loadLivePlacesFor(next);
          }
        } else if(next==='laden' || next==='tanken' || next==='wc'){
          if(Number(state.placeStatus[`${next}Day`])!==Number(state.activeDay) || !['live','loading'].includes(state.placeStatus[next])){ resetLiveCategory(next,'loading'); loadLivePlacesFor(next); }
        } else if(next==='restaurants'){setPlaceStatus('restaurants','idle','Kies een categorie en zoek rond je actuele locatie.');}
        else if(next==='uitjes'){setPlaceStatus('uitjes','idle','Kies zelf waar Roadora uitjes moet zoeken.');}
      }
      renderStops();
      toast(`${categoryLabel(next)} aan`);
      return;
    }
    const foodFilter=e.target.closest('[data-food-type]');
    if(foodFilter){
      const nextType=foodTypes.some(x=>x[0]===foodFilter.dataset.foodType)?foodFilter.dataset.foodType:'restaurant';
      if(state.foodType===nextType && state.placeStatus.restaurants==='live') return;
      state.foodType=nextType;
      if(state.category!=='restaurants') state.category='restaurants';
      state.suggestions=false; state.view='all';
      stops.restaurants=[]; setPlaceStatus('restaurants','idle',`Tik op zoeken voor ${foodTypeLabel(nextType).toLowerCase()} binnen 10 km.`);
      renderStops(); saveDraftNow(); toast(`${foodTypeLabel(nextType)} gekozen`);
      return;
    }
    const outingFilter=e.target.closest('[data-outing-type]');
    if(outingFilter){
      const nextType=outingTypes.some(x=>x[0]===outingFilter.dataset.outingType)?outingFilter.dataset.outingType:'highlights';
      if(state.outingType===nextType && state.placeStatus.uitjes==='live') return;
      state.outingType=nextType;
      if(state.category!=='uitjes') state.category='uitjes';
      state.suggestions=false; state.view='all';
      stops.uitjes=[]; setPlaceStatus('uitjes','idle',`Snelkeuze ${outingTypeLabel(nextType)} geselecteerd. Vul eventueel een vrije zoekterm in, kies een gebied en klik op Zoeken.`);
      renderStops(); saveDraftNow(); toast(`${outingTypeLabel(nextType)} gekozen`);
      return;
    }
    if(e.target.closest('#searchFoodNow')){searchFoodNearCurrentLocation();return;}
    const outingMode=e.target.closest('[data-outing-search-mode]');
    if(outingMode){state.outingSearchMode=outingMode.dataset.outingSearchMode;state.outingSearchCenter=null;clearSearchCenterMarker();renderStops();saveDraftNow();return;}
    if(e.target.closest('#chooseOutingPoint')){beginMapPick(state.outingSearchMode==='route'?'outing-route':'outing-map');return;}
    if(e.target.closest('#searchOutingsManual')){searchOutingsManually();return;}
    const tripTypeBtn=e.target.closest('[data-trip-type]');
    if(tripTypeBtn){state.tripType=tripTypeBtn.dataset.tripType==='roundtrip'?'roundtrip':'single';$$('[data-trip-type]').forEach(b=>{b.classList.toggle('active',b===tripTypeBtn);b.setAttribute('aria-pressed',String(b===tripTypeBtn));});renderRoundtripStops();renderAll();saveDraftNow();return;}
    if(e.target.closest('#addRoundtripStop')){state.roundtripStops=[...(state.roundtripStops||[]),''];renderRoundtripStops();return;}
    const removeRound=e.target.closest('[data-remove-roundtrip-stop]');
    if(removeRound){state.roundtripStops.splice(Number(removeRound.dataset.removeRoundtripStop),1);renderRoundtripStops();saveDraftNow();return;}
    if(e.target.closest('#useOriginAsDestination')){const origin=$('#origin')?.value||state.origin;if(!origin){toast('Vul eerst een vertrekpunt in');return;}$('#destination').value=origin;readForm();renderAll();saveDraftNow();toast('Terugkeerplaats gelijk aan vertrekpunt');return;}
    if(e.target.closest('#openManualPlace')){openManualPlaceModal();return;}
    if(e.target.closest('[data-close-manual-place]')){closeManualPlaceModal();return;}
    if(e.target.closest('#pickManualPlaceOnMap')){closeManualPlaceModal();beginMapPick('manual-place');return;}
    if(e.target.closest('#saveManualPlace')){saveManualPlace();return;}
    const linkPrevious=e.target.closest('[data-link-previous-overnight]');
    if(linkPrevious){linkPreviousOvernightToDay(Number(linkPrevious.dataset.linkPreviousOvernight));return;}
    const mode=e.target.closest('[data-view]');
    if(mode){
      const requested=mode.dataset.view;
      state.view=supportsDistributedRecommendations(state.category) && requested==='recommended'?'recommended':'all';
      state.suggestions=supportsDistributedRecommendations(state.category);
      renderStops();
      return;
    }
    const delDay=e.target.closest('[data-delete-day]'); if(delDay){e.preventDefault(); e.stopPropagation(); deleteTripDay(Number(delDay.dataset.deleteDay)); return;}
    const openDay=e.target.closest('[data-open-day]'); if(openDay){activateTripDay(Number(openDay.dataset.openDay)||1); return;}
    const showPlanOnMap=e.target.closest('[data-show-plan-on-map]');
    if(showPlanOnMap){e.preventDefault(); e.stopPropagation(); focusPlannedStop(Number(showPlanOnMap.dataset.showPlanOnMap)); return;}
    const replacePlanStop=e.target.closest('[data-replace-plan-stop]');
    if(replacePlanStop){e.preventDefault(); e.stopPropagation(); startReplacePlannedStop(Number(replacePlanStop.dataset.replacePlanStop)); return;}
    const skipPlanStop=e.target.closest('[data-skip-plan-stop]');
    if(skipPlanStop){e.preventDefault(); e.stopPropagation(); toggleSkipPlannedStop(Number(skipPlanStop.dataset.skipPlanStop)); return;}
    const edit=e.target.closest('.plan-edit');
    if(edit){const row=edit.closest('[data-plan-index]'); const i=Number(row.dataset.planIndex); editingPlanRows.has(i)?editingPlanRows.delete(i):editingPlanRows.add(i); renderTimeline(); return;}
    const saveEdit=e.target.closest('.plan-save');
    if(saveEdit){const row=saveEdit.closest('[data-plan-index]'); const i=Number(row.dataset.planIndex); editingPlanRows.delete(i); renderTimeline(); toast('Planningregel opgeslagen'); return;}
    const remove=e.target.closest('.plan-remove');
    if(remove){const row=remove.closest('[data-plan-index]'); removePlanRow(Number(row.dataset.planIndex));}
  });
  document.addEventListener('input',e=>{
    if(e.target.matches('[data-roundtrip-stop]')){state.roundtripStops[Number(e.target.dataset.roundtripStop)]=sanitizePlainText(e.target.value,180);scheduleAutosave();return;}
    if(e.target.id==='outingSearchTerm'){state.outingSearchTerm=sanitizePlainText(e.target.value,120);scheduleAutosave();return;}
    if(e.target.id==='outingAreaQuery'){state.outingAreaQuery=sanitizePlainText(e.target.value,180);state.outingSearchQuery=state.outingAreaQuery;scheduleAutosave();return;}
    const row=e.target.closest('[data-plan-index]'); if(!row) return;
    const i=Number(row.dataset.planIndex); const plan=dayPlan(); if(!plan[i]) return;
    if(e.target.classList.contains('plan-time-input')){
      plan[i][0]=e.target.value;
      if(i===0){
        refreshDayTimelineTimes(state.activeDay,{sortStops:false});
        syncFollowingDayArrival(state.activeDay);
      } else {
        if(!plan[i][4] || typeof plan[i][4]!=='object') plan[i][4]={};
        plan[i][4].autoTime=false;
      }
    }
    if(e.target.classList.contains('plan-title-input')){plan[i][1]=e.target.value; if(plan[i][4]) plan[i][4]=null;}
    if(e.target.classList.contains('plan-detail-input')){plan[i][2]=e.target.value; if(plan[i][4]) plan[i][4]=null;}
    scheduleAutosave();
  });
  document.addEventListener('change',e=>{
    const row=e.target.closest('[data-plan-index]'); if(!row || !e.target.classList.contains('plan-type')) return;
    const i=Number(row.dataset.planIndex); const plan=dayPlan(); if(plan[i]) plan[i][3]=e.target.value;
    scheduleAutosave();
  });
  $$('.route-preference').forEach(b=>b.onclick=()=>selectRoutePreference(b.dataset.routePreference));
  $$('[data-vehicle]').forEach(b=>b.onclick=()=>{$$('[data-vehicle]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); state.vehicle=b.dataset.vehicle; if(!supportsCamperPlaces() && state.category==='camperplaces'){state.category=''; stops.camperplaces=[]; clearPlaceMarkers();} renderAll();});
  $$('[data-pet]').forEach(b=>b.onclick=()=>{$$('[data-pet]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); state.pet=b.dataset.pet; renderAll();});
  $$('.pref').forEach(b=>b.onclick=()=>{b.classList.toggle('active'); renderAll();});
  $$('.left-edit-toggle').forEach(btn=>btn.onclick=()=>{const card=btn.closest('[data-left-fold]'); const open=!card.classList.contains('open'); card.classList.toggle('open',open); btn.textContent=open?'Sluiten':'Bewerken'; btn.setAttribute('aria-expanded', String(open));});
  ['origin','destination','date','vehicleRangeKm','plug','maxDetour'].forEach(id=>{
    const el=$('#'+id);
    if(!el) return;
    ['input','change','blur'].forEach(ev=>el.addEventListener(ev,()=>{ readForm(); renderAll(); saveDraftNow(); }));
  });
  ['origin','destination'].forEach(id=>{
    const input=$('#'+id);
    if(!input) return;
    input.addEventListener('focus',()=>showLocationHistory(input));
    input.addEventListener('click',()=>showLocationHistory(input));
    input.addEventListener('input',()=>{ readForm(); scheduleAutosave(); });
    input.addEventListener('blur',()=>{ rememberLocation(id, input.value); saveDraftNow(); setTimeout(closeLocationHistory,160); });
  });
  document.addEventListener('pointerdown',e=>{
    if(!e.target.closest('.location-history-popover') && !e.target.closest('#origin') && !e.target.closest('#destination')) closeLocationHistory();
  });
  document.addEventListener('click',e=>{
    const item=e.target.closest('.location-history-item');
    if(!item) return;
    const pop=item.closest('.location-history-popover');
    const input=pop?.parentElement?.querySelector('input');
    if(!input) return;
    input.value=item.dataset.locationValue || item.textContent.trim();
    readForm();
    rememberLocation(input.id, input.value);
    closeLocationHistory();
    renderAll();
    saveDraftNow();
  });

  const timeBox=$('#openDepartClock');
  if(timeBox){
    ['click','touchend'].forEach(ev=>timeBox.addEventListener(ev,(e)=>{ e.preventDefault(); openClockPicker(); }));
    timeBox.addEventListener('keydown',e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openClockPicker(); } });
  }
  updateDepartTimeDisplay();
  $('#hotelArrival')?.addEventListener('input',()=>{ readForm(); stops.hotels=[]; stops.camperplaces=[]; clearPlaceMarkers(); setPlaceStatus('hotels','idle','Klik op Hotels om rond het gekozen aankomsttijdvak te zoeken. Kies eerst een aankomsttijdvak voor de overnachting.'); setPlaceStatus('camperplaces','idle','Klik op Camperplekken om rond het gekozen aankomsttijdvak te zoeken. Kies eerst een aankomsttijdvak voor de overnachting.'); renderAll(); saveDraftNow(); });
  $('#hotelArrival')?.addEventListener('change',()=>{ readForm(); saveDraftNow(); });
  $('#tripDays')?.addEventListener('change',e=>{setTripDayCount(e.currentTarget.value,{confirmRemoval:true});});
  $$('input[name="adults"],input[name="children"]').forEach(i=>i.addEventListener('input',renderAll));
  $('#planRoute').onclick=async()=>{await loadRealRoute(); renderAll(); fitMap();};
  $('#addPlanStop')?.addEventListener('click',()=>{const insertAt=Math.max(1,dayPlan().length-1); dayPlan().splice(insertAt,0,['12:00','Nieuwe stop','Zelf invullen of kies later uit Stops','Zelf ingevuld']); editingPlanRows.clear(); editingPlanRows.add(insertAt); renderTimeline(); scheduleAutosave(); toast('Stop toegevoegd');});
  $('#addManualStop')?.addEventListener('click',openManualPlaceModal);
  $('#suggestionToggle')?.addEventListener('click',()=>{
    state.suggestions=false;
    state.view='all';
    setRouteZoneMarkersVisible(false);
    renderStops();
    toast('Roadora suggesties staan tijdelijk on hold');
  });
  $('#modalAddStop')?.addEventListener('click',()=>{if(state.activeStop){addStopToActiveDay(state.activeStop.cat,state.activeStop.index); closeStopDetail();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeStopDetail();});
  $('#chooseHotelZone')?.addEventListener('click',()=>{ state.category='hotels'; state.view='all'; state.suggestions=false; if(hasRoute()){ if(!hasValidDepartTime()){ stops.hotels=[]; clearPlaceMarkers(); setPlaceStatus('hotels','empty','Vul eerst je vertrektijd in. Dan kunnen we bepalen waar je rond je aankomsttijdvak op de route bent.'); toast('Vul eerst je vertrektijd in'); } else if(!arrivalSlotLabel()){ stops.hotels=[]; clearPlaceMarkers(); setPlaceStatus('hotels','empty','Kies eerst een aankomsttijdvak. Dan zoeken we hotels rond het juiste deel van je route.'); toast('Kies eerst een aankomsttijdvak voor hotels'); } else if(Number(state.placeStatus.hotelsDay)!==Number(state.activeDay) || !['live','loading'].includes(state.placeStatus.hotels)){ resetLiveCategory('hotels','loading'); loadLivePlacesFor('hotels'); } } renderStops(); });
  $('#recalculatePlan')?.addEventListener('click',async()=>{const ok=await loadRealRoute({preservePlan:true}); renderAll(); if(ok) toast('Route opnieuw berekend; planning behouden');});
  $('#addTripDay')?.addEventListener('click',()=>{ if(setTripDayCount(Math.min(21,state.days+1),{confirmRemoval:false,activateNew:true})) toast('Dag toegevoegd'); });
  $('#mapFit').onclick=fitMap; $('#mapZoomIn').onclick=()=>map?.zoomIn(); $('#mapZoomOut').onclick=()=>map?.zoomOut();
  $('#mapToggleStops').onclick=()=>toast('Stopmoment-suggesties staan tijdelijk on hold');
  const save=()=>saveCurrentTripToLibrary({silent:false});
  $('#saveRoute').onclick=save; $('#saveRouteSide').onclick=save;
  $('#newRoadtrip')?.addEventListener('click',startNewRoadtrip);
  $('#startDayRoute')?.addEventListener('click',startFullDayRoute);
  $('#navigateNextStop')?.addEventListener('click',navigateToNextStop);
  $('#resetDemo').onclick=resetPlanner;
  $('#acceptCookies')?.addEventListener('click',()=>{localStorage.setItem('roadoraCookie','yes');$('#cookieBanner').classList.remove('show')}); $('#rejectCookies')?.addEventListener('click',()=>{localStorage.setItem('roadoraCookie','no');$('#cookieBanner').classList.remove('show')}); if(!localStorage.getItem('roadoraCookie')) setTimeout(()=>$('#cookieBanner')?.classList.add('show'),900);
}
document.addEventListener('DOMContentLoaded',async()=>{ const dateInput=$('#date'); if(dateInput && !dateInput.value) dateInput.value=todayISO(); state.date=dateInput?.value||todayISO(); const restored=restoreDraft(); bind(); updateDepartTimeDisplay(); applyRouteZones({resetPlan:!restored});renderAll(); await refreshTripsCache(); setStorageStatus(state.tripId?'Opgeslagen op dit apparaat':'Nog niet bewaard'); setTimeout(async()=>{ const ready=await (window.ROADORA_LEAFLET_READY||Promise.resolve(Boolean(window.L))); if(!ready&&!window.L){toast('Kaartbibliotheek kon niet worden geladen'); return;} initMap(); if(hasRoute()){setTimeout(()=>{updateMapRoute(); fitMap();},250);}},250); });
