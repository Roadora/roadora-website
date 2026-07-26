const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
function todayISO(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function hasRoute(){ return ['google','ors','external-route'].includes(state.routeSource) && Array.isArray(routeCoords) && routeCoords.length > 1; }
function effectiveRangeKm(){ if(Number(state.range)>0) return Number(state.range); if(state.vehicle==='electric') return 325; if(state.vehicle==='camper') return 500; if(state.vehicle==='bus') return 600; if(state.vehicle==='car') return 650; return 650; }
function createDefaultState(){
  return {
    tripId:'', tripName:'', origin:'', destination:'', date:todayISO(), depart:'', arrival:'', days:1,
    adults:2, children:0, pet:'none', vehicle:'', range:0, plug:'CCS', maxDetour:20, activeDay:1, view:'all', category:'', suggestions:false, activeStop:null,
    routeSource:'empty', routeDistanceKm:0, routeDurationMin:0, routeZones:[], placeStatus:{}, dayHotels:{}, routePreference:'fastest', routeVariantId:'', routeVariantSummaries:[]
  };
}
const state = createDefaultState();
const editingPlanRows = new Set();
let routeCoords = [];
let routeVariants = [];
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
function cleanLocationValue(value){ return String(value||'').replace(/\s+/g,' ').trim(); }
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
  panel.innerHTML=`<div class="location-history-title">${locationHistoryLabel(input.id)}</div>` + items.map(item=>`<button type="button" class="location-history-item" data-location-value="${String(item).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}">${String(item).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</button>`).join('');
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
  const adults=$('[name="adults"]'); if(adults) adults.value=state.adults || 2;
  const children=$('[name="children"]'); if(children) children.value=state.children || 0;
  applySavedChoices({pet:state.pet, vehicle:state.vehicle, prefs:state.prefs||[]});
  $$('.route-preference').forEach(b=>b.classList.toggle('active',b.dataset.routePreference===(state.routePreference||'fastest')));
  updateDepartTimeDisplay();
}
function serializeDraft(){
  readForm();
  return {
    version:'v6.4.0', savedAt:Date.now(),
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
  state.date=state.date || todayISO();
  state.depart=normalizeTimeValue(state.depart);
  state.days=Math.max(1,Math.min(21,Number(state.days)||1));
  state.activeDay=Math.max(1,Math.min(state.days,Number(state.activeDay)||1));
  // Stopcategorieën zijn na openen standaard uit; de gebruiker zet ze bewust opnieuw aan.
  state.category=''; state.suggestions=false; state.activeStop=null;
  routeCoords=Array.isArray(draft.routeCoords)
    ? draft.routeCoords.filter(c=>Array.isArray(c)&&c.length>=2&&Number.isFinite(Number(c[0]))&&Number.isFinite(Number(c[1]))).map(c=>[Number(c[0]),Number(c[1])])
    : [];
  routeVariants=[];
  Object.keys(timelines).forEach(k=>delete timelines[k]);
  if(draft.timelines && typeof draft.timelines==='object') Object.assign(timelines,cloneJsonSafe(draft.timelines));
  if(!Object.keys(timelines).length) timelines[1]=[['—','Route nog niet gepland','Vul vertrekpunt en bestemming in en klik op Maak dagroute','Vertrek']];
  Object.keys(stops).forEach(k=>{stops[k]=Array.isArray(draft.stops?.[k])?cloneJsonSafe(draft.stops[k]):[];});
  repairDayHotelsFromTimelines();
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
const cats = [['hotels','Hotels'],['camperplaces','Camperplekken'],['restaurants','Restaurants'],['laden','Laden'],['tanken','Tanken'],['uitjes','Uitjes'],['wc','WC']];
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
function plannedMarkerHtml(kind,label){
  return `<div class="planned-stop-pin planned-stop-pin-${kind}"><span>${escapeHtml(label)}</span></div>`;
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
        html:plannedMarkerHtml(kind,label),
        iconSize:[34,40],
        iconAnchor:[17,38],
        popupAnchor:[0,-34]
      })
    });
    marker.__planIndex=index;
    marker.bindTooltip(`${title} · Dag ${state.activeDay}`,{direction:'top',offset:[0,-28]});
    marker.bindPopup(`<div class="planned-stop-popup"><strong>${escapeHtml(title)}</strong><span>Dag ${state.activeDay} · ${escapeHtml(typeLabel)}</span></div>`,{offset:[0,-28]});
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
  const letter = {hotels:'H',camperplaces:'C',restaurants:'R',laden:'L',tanken:'T',uitjes:'U',wc:'W'}[cat] || 'P';
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
  renderPlannedStopMarkers();
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
function renderRouteChoices(){
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
    note.classList.toggle('warning',state.routePreference==='tollfree');
    if(hasRoute()){
      const base=`Actief: ${routePreferenceLabel()} · ${routeProviderLabel()}. Stops worden langs deze route gezocht.`;
      note.textContent=state.routePreference==='tollfree' ? `${base} Tol vermijden blijft een routevoorkeur.` : base;
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
      const meta=row?.[4]||{}; const lat=Number(meta.lat),lng=Number(meta.lng);
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
  ['hotels','camperplaces','laden','tanken'].forEach(cat=>setPlaceStatus(cat,'idle','Zet deze categorie aan om live resultaten langs je gekozen route te laden.'));
  ['restaurants','uitjes','wc'].forEach(cat=>setPlaceStatus(cat,'empty','Deze categorie staat standaard uit en wordt later live gekoppeld.'));
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
  if(preservePlan) reprojectSavedPlanToCurrentRoute();
  updateTexts(); renderTimeline(); renderStops(); renderTripOverview(); renderRouteChoices(); updateMapRoute();
  saveDraftNow();
  if(!silent) toast(`${normalized.label} geselecteerd`);
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
  markers = markerData.map(m=>L.marker(m.coords,{icon:L.divIcon({className:'',html:`<div class="custom-marker m-${m.type}">${m.label}</div>`,iconSize:[28,28],iconAnchor:[14,14]})}).bindTooltip(m.title));
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
  const coords=Array.isArray(routeCoords)?routeCoords:[];
  if(coords.length<2) return null;
  const p=Math.max(0,Math.min(1,Number(progress)||0));
  const idx=Math.max(0,Math.min(coords.length-1,Math.round(p*(coords.length-1))));
  const c=coords[idx];
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
  if(!prev || !plan || plan.length<2) return;
  if(!safeTimeValue(plan[0]?.[0])) plan[0][0]=state.depart || '—';
  refreshDayTimelineTimes(d);
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
  const depart=String(activeDayStartClock()||'').match(/^(\d{1,2}):(\d{2})$/);
  if(depart && Number.isFinite(progress) && Number(state.routeDurationMin)>0){
    const departMinutes=Number(depart[1])*60+Number(depart[2]);
    const driveProgress=Math.max(0,progress-dayStartProgress(state.activeDay));
    const arrival=departMinutes + (Number(state.routeDurationMin)*driveProgress);
    lines.push(`aankomst ± ${formatMinutesAsClock(arrival)}`);
  }
  return lines;
}

function hotelTripInfo(meta={}){
  const meters=Number(meta.distanceFromStartMeters);
  const km=Number.isFinite(meters) ? Math.round(meters/1000) : (Number.isFinite(Number(meta.distanceFromStartKm)) ? Math.round(Number(meta.distanceFromStartKm)) : null);
  const progress=Number.isFinite(Number(meta.routeProgress)) ? Number(meta.routeProgress) : (Number(state.routeDistanceKm)>0 && Number.isFinite(km) ? km/Number(state.routeDistanceKm) : null);
  const depart=String(activeDayStartClock()||'').match(/^(\d{1,2}):(\d{2})$/);
  let arrivalTime='—';
  if(depart && Number.isFinite(progress) && Number(state.routeDurationMin)>0){
    const departMinutes=Number(depart[1])*60+Number(depart[2]);
    const driveProgress=Math.max(0,progress-dayStartProgress(state.activeDay));
    arrivalTime=formatMinutesAsClock(departMinutes + (Number(state.routeDurationMin)*driveProgress));
  }
  const remainingKm = Number.isFinite(km) && Number(state.routeDistanceKm)>0 ? Math.max(0, Math.round(Number(state.routeDistanceKm)-km)) : null;
  const remainingMin = Number.isFinite(progress) && Number(state.routeDurationMin)>0 ? Math.max(0, Math.round(Number(state.routeDurationMin)*(1-progress))) : null;
  return {km,progress,arrivalTime,remainingKm,remainingMin};
}

function clampRouteProgress(value){
  const n=Number(value);
  return Number.isFinite(n) ? Math.max(0,Math.min(1,n)) : null;
}
function nearestRouteProgress(lat,lng){
  if(!Array.isArray(routeCoords) || routeCoords.length<2 || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  const targetLat=Number(lat), targetLng=Number(lng);
  const lngScale=Math.max(0.2,Math.cos(targetLat*Math.PI/180));
  let bestIndex=0, bestScore=Infinity;
  routeCoords.forEach((coord,index)=>{
    const cLat=Number(coord?.[0]), cLng=Number(coord?.[1]);
    if(!Number.isFinite(cLat)||!Number.isFinite(cLng)) return;
    const dLat=cLat-targetLat;
    const dLng=(cLng-targetLng)*lngScale;
    const score=(dLat*dLat)+(dLng*dLng);
    if(score<bestScore){bestScore=score; bestIndex=index;}
  });
  return bestIndex/Math.max(1,routeCoords.length-1);
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
  if(isOvernightCategory(category)) return 0;
  const duration=Number(meta.stopDurationMin);
  const stay=Number.isFinite(duration) && duration>=0 ? duration : defaultStopDurationMinutes(category);
  // De Google-resultaten tonen een benaderde afstand/tijd vanaf de route. We tellen die één keer mee.
  return Math.max(0,Math.round(stay + detourMinutesFromMeta(meta)));
}
function dayStartProgress(day){
  if(Number(day)<=1) return 0;
  return clampRouteProgress(selectedHotelForDay(Number(day)-1)?.info?.progress) ?? 0;
}
function dayEndProgress(day){
  return clampRouteProgress(selectedHotelForDay(Number(day))?.info?.progress) ?? 1;
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
function currentDisplayedStopsForMap(){
  if(!state.category) return [];
  const list=(stops[state.category]||[]).map((item,i)=>{ if(item?.[2]) item[2].__stopIndex=i; return item; });
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
  const name=place?.name || (cat==='hotels'?'Hotel langs route':cat==='camperplaces'?'Camperplek langs route':'Tankstation langs route');
  const bits=[];
  if(place?.rating) bits.push(`${place.rating} ★`);
  if(Array.isArray(place?.amenities)&&place.amenities.length) bits.push(place.amenities.slice(0,3).join(' · '));
  const distanceKm = Number.isFinite(Number(place?.distanceFromStartMeters)) ? Math.round(Number(place.distanceFromStartMeters)/1000) : null;
  if(isEnergyCategory(cat) && Number.isFinite(distanceKm)) bits.push(`± ${distanceKm} km vanaf vertrek`);
  if(isOvernightCategory(cat)) hotelTripMeta(place).forEach(x=>bits.push(x));
  bits.push(place?.detourLabel || (isOvernightCategory(cat)?'+10 min omrijden':'+3 min omrijden'));
  const derivedPhotoUrl = place?.photoUrl || (place?.photoName ? `/api/google-photo?name=${encodeURIComponent(place.photoName)}&w=420` : null);
  const derivedPhotoUrls = Array.isArray(place?.photoUrls) && place.photoUrls.length
    ? place.photoUrls
    : (derivedPhotoUrl ? [derivedPhotoUrl] : []);
  const meta={...place, live:true, distanceFromStartKm:distanceKm, photoUrl:derivedPhotoUrl, photoUrls:derivedPhotoUrls, address:place?.address||'', googleMapsUri:place?.googleMapsUri||null, website:place?.website||null};
  return [name,bits.filter(Boolean).join(' · '),meta];
}
async function loadLivePlacesFor(cat){
  const endpoint = cat==='hotels' ? '/api/google-hotels' : cat==='camperplaces' ? '/api/google-camperplaces' : cat==='tanken' ? '/api/google-fuel' : cat==='laden' ? '/api/google-charging' : null;
  if(!endpoint) return false;
  if(cat==='camperplaces' && !supportsCamperPlaces()){
    state.category=''; clearPlaceMarkers(); renderStops();
    toast('Camperplekken zijn alleen beschikbaar voor Busje en Camper');
    return false;
  }
  if(isOvernightCategory(cat) && !hasValidDepartTime()){
    stops[cat]=[]; clearPlaceMarkers();
    setPlaceStatus(cat,'empty','Vul eerst je vertrektijd in. Dan kunnen we bepalen waar je rond je aankomsttijdvak op de route bent.');
    return false;
  }
  if(isOvernightCategory(cat) && !arrivalSlotLabel()){
    stops[cat]=[]; clearPlaceMarkers();
    setPlaceStatus(cat,'empty','Kies eerst wanneer je ongeveer wilt aankomen. Dan zoeken we rond het juiste stuk van je route.');
    return false;
  }
  const points = isOvernightCategory(cat)
    ? hotelArrivalSearchPoints()
    : (isEnergyCategory(cat) ? energySearchPoints() : routeSamplePoints(10,{includeEnds:false}));
  if(!points.length){
    setPlaceStatus(cat,'empty',isOvernightCategory(cat)?'Kies eerst een geldig aankomsttijdvak.':'Geen zoekpunt op de route gevonden.');
    return false;
  }
  const overnight=isOvernightCategory(cat);
  try{
    const body={points,radiusMeters:overnight?22000:7000,mode:overnight?`arrival_window_${cat}_cost_safe`:'route_quick',maxResults:overnight?30:40};
    if(cat==='hotels') body.hotelHint=hotelSearchHint();
    const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await res.json().catch(()=>({places:[]}));
    if(!res.ok || data.ok===false) throw new Error(data.message||data.status||'live places fout');
    const list=(Array.isArray(data.places)?data.places:[]).map(p=>normalizeLivePlace(p,cat));
    if(list.length){stops[cat]=list; setPlaceStatus(cat,'live'); renderStops(); return true;}
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
function reprojectSavedPlanToCurrentRoute(){
  Object.values(timelines).forEach(plan=>{
    if(!Array.isArray(plan)) return;
    plan.forEach(row=>{
      const meta=row?.[4];
      if(!meta || typeof meta!=='object') return;
      const progress=nearestRouteProgress(meta.lat,meta.lng);
      if(progress!==null){
        meta.routeProgress=progress;
        meta.distanceFromStartMeters=Math.round(progress*Number(state.routeDistanceKm||0)*1000);
      }
    });
  });
  Object.values(state.dayHotels||{}).forEach(hotel=>{
    const meta=hotel?.meta;
    if(!meta || typeof meta!=='object') return;
    const progress=nearestRouteProgress(meta.lat,meta.lng);
    if(progress!==null){
      meta.routeProgress=progress;
      meta.distanceFromStartMeters=Math.round(progress*Number(state.routeDistanceKm||0)*1000);
      hotel.info=hotelTripInfo(meta);
    }
  });
  refreshAllTimelineTimes();
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
    const [startGeo,endGeo]=await Promise.all([geocodePlace(state.origin), geocodePlace(state.destination)]);
    toast('Routevarianten laden…');
    const params=new URLSearchParams({
      start:startGeo.coord.join(','), end:endGeo.coord.join(','), profile:'driving-car',
      variants:'1', preference
    });
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
    routeCoords=routeBackup.routeCoords; routeVariants=routeBackup.routeVariants;
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
  state.origin=($('#origin')?.value||'').trim();
  state.destination=($('#destination')?.value||'').trim();
  state.date=$('#date')?.value || todayISO();
  state.depart=normalizeTimeValue($('#departTime')?.value || '');
  state.arrival=$('#hotelArrival')?.value || '';
  state.days=Math.max(1,Math.min(21,Number($('#tripDays')?.value)||1));
  state.activeDay=Math.max(1,Math.min(state.days,Number(state.activeDay)||1));
  state.range=Number($('#vehicleRangeKm')?.value)||0;
  state.plug=$('#plug')?.value || 'CCS';
  state.adults=Number($('[name="adults"]')?.value)||1;
  state.children=Number($('[name="children"]')?.value)||0;
  state.maxDetour=Number($('#maxDetour')?.value)||20;
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
function activateTripDay(day){
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
    const plan=timelines[day];
    if(!Array.isArray(plan)||!plan.length) continue;
    if(day===1){
      plan[0]=[safeTimeValue(plan[0]?.[0])||state.depart||'—',`Vertrek ${dayStartName(1)}`,'Start van deze reisdag','Vertrek'];
    } else {
      const previous=selectedHotelForDay(day-1);
      if(previous){
        plan[0]=[safeTimeValue(plan[0]?.[0])||state.depart||'—',`Vertrek ${previous.name}`,'Start vanaf gekozen overnachting','Vertrek',navMetaForHotel(previous)];
      } else {
        plan[0]=[safeTimeValue(plan[0]?.[0])||state.depart||'—',`Vertrek dag ${day}`,'Start van deze reisdag','Vertrek'];
      }
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
    list.innerHTML='';
    for(let i=1;i<=state.days;i++){
      const row=document.createElement('div');
      row.className='overview-day-row'+(i===state.activeDay?' active':'');
      row.innerHTML=`<button class="overview-day-open" type="button" data-open-day="${i}"><span class="overview-day-num">Dag ${i}</span><span class="overview-day-main"><strong>${dayRouteLabel(i)}</strong><em>${i===state.activeDay?'actieve dag':dayStatus(i)}</em></span></button><button class="overview-day-delete" type="button" data-delete-day="${i}" title="Dag verwijderen">Verwijder</button>`;
      list.appendChild(row);
    }
  }
  const detail=$('#activeDayDetail');
  if(detail){
    const plan=dayPlan();
    const hotel=selectedHotelForDay(state.activeDay);
    const endpointTitle = hotel ? `Overnachting / eindpunt` : (state.activeDay===state.days ? 'Bestemming / eindpunt' : 'Eindpunt');
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
function renderTimeline(){
  const list = dayPlan();
  $('#timeline').innerHTML = list.map((r,i)=>{
    const detail = typeof r[2]==='function'?r[2]():r[2];
    const type = r[3] || inferType(r[1]);
    const editing = editingPlanRows.has(i);
    const hasMapPoint=Boolean(plannedRowCoordinate(r,i,list));
    return `<div class="plan-row ${i===list.length-1?'active':''} ${editing?'editing':''}" data-plan-index="${i}">
      <div class="plan-read">
        <div class="plan-read-time">${safeReadTime(r[0])}</div>
        <div class="plan-read-main"><strong>${r[1]}</strong><span>${detail}</span><em>${type}</em></div>
        <div class="plan-read-actions">
          ${hasMapPoint?`<button class="plan-map" type="button" data-show-plan-on-map="${i}" aria-label="Toon ${escapeHtml(r[1])} op de kaart">Kaart</button>`:''}
          <button class="plan-edit" type="button">Bewerken</button>
        </div>
      </div>
      <div class="plan-edit-panel">
        <div class="plan-timebox"><input class="plan-time-input" type="time" value="${safeTimeValue(r[0])}" aria-label="Tijd"></div>
        <div class="plan-fields">
          <div class="plan-topline">${planTypeSelect(type)}${i>0 && (i<list.length-1 || Boolean(selectedHotelForDay(state.activeDay)))?'<button class="plan-remove" type="button" title="Verwijderen">Verwijder</button>':''}</div>
          <input class="plan-title-input" value="${r[1]}" aria-label="Titel van stop">
          <input class="plan-detail-input" value="${detail}" aria-label="Details of eigen locatie">
          <button class="plan-save" type="button">Opslaan</button>
        </div>
      </div>
    </div>`;
  }).join('');
  renderPlannedStopMarkers();
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
function stopWindow(cat){ const z=zoneForCategory(cat); return z ? (isOvernightCategory(cat) ? 'zelf gekozen' : `rond ${z.time}`) : ({hotels:'zelf gekozen',camperplaces:'zelf gekozen',restaurants:'rond 13:00',laden:'rond 15:15',tanken:'rond 15:15',uitjes:'flexibel onderweg',wc:'wanneer nodig'}[cat]||'onderweg');}
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
  $('#categoryTabs').innerHTML = visibleCats().map(([id,label])=>`<button class="category-btn ${id===state.category?'active':''}" data-cat="${id}" type="button" aria-pressed="${id===state.category?'true':'false'}">${label}</button>`).join('');
  const suggestionToggle = $('#suggestionToggle');
  if(suggestionToggle){
    suggestionToggle.textContent = 'Roadora suggesties uit';
    suggestionToggle.setAttribute('aria-pressed', 'false');
    suggestionToggle.classList.add('off');
  }
  if(!hasRoute()){
    $('#recommendTitle').textContent = 'Plan eerst je route';
    $('#allStopsTitle').textContent = 'Nog geen stops geladen';
    const empty = `<div class="empty-stops"><strong>Plan eerst je dagroute.</strong><span>Vul vertrekpunt en bestemming in. Daarna kun je handmatig Hotels, Camperplekken, Restaurants, Laden, Tanken, Uitjes of WC aanzetten.</span></div>`;
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
    ? (isEnergyCategory(state.category) ? recommendedEnergyStops(rawSelected).slice(0,10) : rawSelected.slice(0, isOvernightCategory(state.category)?20:6))
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
    const start=dayStartName(state.activeDay);
    const middle=plan.length>2 ? plan.slice(1,-1) : [];
    timelines[state.activeDay]=[
      [state.activeDay===1 ? (state.depart || '—') : (plan[0]?.[0] || '—'), `Vertrek ${start}`, 'Start van deze reisdag', 'Vertrek'],
      ...middle,
      [arrivalTime, `Aankomst ${title}`, shortRouteDetailForDay(state.activeDay), overnightType,navMeta]
    ];
    if(state.activeDay < state.days){
      const next=state.activeDay+1;
      const dest=(state.destination||'').split(',')[0].trim() || 'bestemming';
      const nextStartTime = safeTimeValue(timelines[next]?.[0]?.[0]) || state.depart || '—';
      const existing=Array.isArray(timelines[next]) ? timelines[next] : [];
      const existingMiddle=existing.length>2 ? existing.slice(1,-1) : [];
      let existingLast=existing.length>1 ? existing[existing.length-1] : null;
      const nextHotel=selectedHotelForDay(next);
      if(nextHotel){
        const nextMeta={...(nextHotel.meta||{}),lat:Number(nextHotel.meta?.lat),lng:Number(nextHotel.meta?.lng),placeId:nextHotel.meta?.id||nextHotel.meta?.placeId||'',name:nextHotel.name,category:nextHotel.category||nextHotel.meta?.category||'hotels',autoTime:true,stopDurationMin:0};
        existingLast=[nextHotel.info?.arrivalTime||'—',`Aankomst ${nextHotel.name}`,shortRouteDetailForDay(next),nextHotel.category==='camperplaces'?'Camperplek':'Hotel',nextMeta];
      } else if(!existingLast){
        existingLast=[addMinutesToClock(nextStartTime, info.remainingMin), `Aankomst ${dest}`, shortRouteDetailForDay(next), 'Bestemming'];
      }
      timelines[next]=[
        [nextStartTime, `Vertrek ${title}`, 'Start vanaf gekozen overnachting', 'Vertrek',navMeta],
        ...existingMiddle,
        existingLast
      ];
      refreshDayTimelineTimes(next);
      syncFollowingDayArrival(next);
    }
    refreshDayTimelineTimes(state.activeDay);
    if(state.activeDay < state.days) refreshDayTimelineTimes(state.activeDay+1);
    editingPlanRows.clear();
    activateTab('planningTab');
    renderAll();
    saveDraftNow();
    toast(`${title} ingesteld als eindpunt van Dag ${state.activeDay}`);
    return;
  }
  const type = {restaurants:'Lunch',laden:'Laden/tanken',tanken:'Laden/tanken',uitjes:'Uitje',wc:'Pauze'}[cat]||'Stop';
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
    lat:Number(meta.lat),lng:Number(meta.lng),placeId:meta.id||'',name:title,category:cat,
    routeProgress,
    distanceFromStartMeters:Number.isFinite(Number(meta.distanceFromStartMeters))?Number(meta.distanceFromStartMeters):(routeProgress!==null?Math.round(routeProgress*Number(state.routeDistanceKm||0)*1000):null),
    stopDurationMin:defaultStopDurationMinutes(cat),
    autoTime:true
  };
  plan.splice(insertAt,0,['—',title,desc,type,navMeta]);
  refreshDayTimelineTimes(state.activeDay);
  editingPlanRows.clear();
  activateTab('planningTab');
  renderTimeline(); renderTripOverview(); scheduleAutosave();
  toast(`${title} toegevoegd aan Dag ${state.activeDay}`);
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
  return `${from} → ${to}`;
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
  restoringDraft=true;
  Object.keys(state).forEach(k=>delete state[k]);
  Object.assign(state,createDefaultState());
  routeCoords=[]; routeVariants=[]; markerData=[];
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
  return plan.slice(1).map(navPointFromRow).filter(Boolean);
}
function dayNavigationOrigin(day=state.activeDay){
  const d=Number(day)||1;
  if(d<=1) return null;
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
  const plan=timelines[d] || [];
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
function renderAll(){updateTexts();renderRouteChoices();renderDays();renderTimeline();renderStops();renderTripOverview();renderTrips(); if(map) setTimeout(()=>map.invalidateSize(),80); scheduleAutosave();}

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
    const close=e.target.closest('[data-close-stop-modal]');
    if(close){closeStopDetail(); return;}
    const cat=e.target.closest('[data-cat]'); if(cat){
      const next=cat.dataset.cat;
      if(state.category===next){ state.category=''; clearPlaceMarkers(); renderStops(); toast('Categorie uitgezet'); return; }
      state.category=next;
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
        } else if(next==='laden' || next==='tanken'){
          if(Number(state.placeStatus[`${next}Day`])!==Number(state.activeDay) || !['live','loading'].includes(state.placeStatus[next])){ resetLiveCategory(next,'loading'); loadLivePlacesFor(next); }
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
    const openDay=e.target.closest('[data-open-day]'); if(openDay){activateTripDay(Number(openDay.dataset.openDay)||1); return;}
    const showPlanOnMap=e.target.closest('[data-show-plan-on-map]');
    if(showPlanOnMap){e.preventDefault(); e.stopPropagation(); focusPlannedStop(Number(showPlanOnMap.dataset.showPlanOnMap)); return;}
    const edit=e.target.closest('.plan-edit');
    if(edit){const row=edit.closest('[data-plan-index]'); const i=Number(row.dataset.planIndex); editingPlanRows.has(i)?editingPlanRows.delete(i):editingPlanRows.add(i); renderTimeline(); return;}
    const saveEdit=e.target.closest('.plan-save');
    if(saveEdit){const row=saveEdit.closest('[data-plan-index]'); const i=Number(row.dataset.planIndex); editingPlanRows.delete(i); renderTimeline(); toast('Planningregel opgeslagen'); return;}
    const remove=e.target.closest('.plan-remove');
    if(remove){const row=remove.closest('[data-plan-index]'); removePlanRow(Number(row.dataset.planIndex));}
  });
  document.addEventListener('input',e=>{
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
  ['origin','destination','date','tripDays','vehicleRangeKm','plug','maxDetour'].forEach(id=>{
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
  $('#hotelArrival')?.addEventListener('input',()=>{ readForm(); stops.hotels=[]; stops.camperplaces=[]; clearPlaceMarkers(); setPlaceStatus('hotels','idle','Klik op Hotels om rond dit aankomsttijdvak te zoeken. Vertrektijd is hiervoor nodig.'); setPlaceStatus('camperplaces','idle','Klik op Camperplekken om rond dit aankomsttijdvak te zoeken. Vertrektijd is hiervoor nodig.'); renderAll(); saveDraftNow(); });
  $('#hotelArrival')?.addEventListener('change',()=>{ readForm(); saveDraftNow(); });
  $$('input[name="adults"],input[name="children"]').forEach(i=>i.addEventListener('input',renderAll));
  $('#planRoute').onclick=async()=>{await loadRealRoute(); renderAll(); fitMap();};
  $('#addPlanStop')?.addEventListener('click',()=>{const insertAt=Math.max(1,dayPlan().length-1); dayPlan().splice(insertAt,0,['12:00','Nieuwe stop','Zelf invullen of kies later uit Stops','Zelf ingevuld']); editingPlanRows.clear(); editingPlanRows.add(insertAt); renderTimeline(); scheduleAutosave(); toast('Stop toegevoegd');});
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
  $('#chooseHotelZone')?.addEventListener('click',()=>{ state.category='hotels'; state.view='all'; state.suggestions=false; if(hasRoute()){ if(!hasValidDepartTime()){ stops.hotels=[]; clearPlaceMarkers(); setPlaceStatus('hotels','empty','Vul eerst je vertrektijd in. Dan kunnen we bepalen waar je rond je aankomsttijdvak op de route bent.'); toast('Vul eerst je vertrektijd in'); } else if(!arrivalSlotLabel()){ stops.hotels=[]; clearPlaceMarkers(); setPlaceStatus('hotels','empty','Kies eerst een aankomsttijdvak. Dan zoeken we hotels rond het juiste deel van je route.'); toast('Kies eerst een aankomsttijdvak voor hotels'); } else if(Number(state.placeStatus.hotelsDay)!==Number(state.activeDay) || !['live','loading'].includes(state.placeStatus.hotels)){ resetLiveCategory('hotels','loading'); loadLivePlacesFor('hotels'); } } renderStops(); });
  $('#recalculatePlan')?.addEventListener('click',async()=>{const ok=await loadRealRoute({preservePlan:true}); renderAll(); if(ok) toast('Route opnieuw berekend; planning behouden');});
  $('#addTripDay')?.addEventListener('click',()=>{state.days=Math.min(21,state.days+1); const input=$('#tripDays'); if(input) input.value=state.days; state.activeDay=state.days; editingPlanRows.clear(); renderAll(); toast('Dag toegevoegd');});
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
document.addEventListener('DOMContentLoaded',async()=>{ const dateInput=$('#date'); if(dateInput && !dateInput.value) dateInput.value=todayISO(); state.date=dateInput?.value||todayISO(); const restored=restoreDraft(); bind(); updateDepartTimeDisplay(); applyRouteZones({resetPlan:!restored});renderAll(); await refreshTripsCache(); setStorageStatus(state.tripId?'Opgeslagen op dit apparaat':'Nog niet bewaard'); setTimeout(()=>{initMap(); if(hasRoute()){setTimeout(()=>{updateMapRoute(); fitMap();},250);}},250); });
