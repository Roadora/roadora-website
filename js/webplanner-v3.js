const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const state = {
  origin:'Amsterdam, Nederland', destination:'Toscane, Italië', date:'2026-05-26', depart:'08:30', arrival:'16:30 - 18:00', days:8,
  adults:2, children:3, pet:'dog', vehicle:'electric', range:325, plug:'CCS', maxDetour:20, activeDay:1, view:'recommended', category:'hotels', suggestions:true
};
const editingPlanRows = new Set();
const routeCoords = [[52.3676,4.9041],[51.05,5.1],[50.11,7.0],[49.49,8.47],[48.4,9.99],[47.37,8.54],[46.0,10.2],[43.77,11.25]];
const markerData = [
  {type:'start',label:'A',coords:[52.3676,4.9041],title:'Vertrek Amsterdam'},
  {type:'pause',label:'1',coords:[50.9,6.3],title:'11:00 Pauze'},
  {type:'lunch',label:'2',coords:[49.49,8.47],title:'13:00 Lunch'},
  {type:'charge',label:'3',coords:[48.4,9.99],title:'15:15 Laad-/tankstop'},
  {type:'hotel',label:'H',coords:[46.9,10.9],title:'16:30 - 18:00 Overnachten rond'},
  {type:'end',label:'B',coords:[43.77,11.25],title:'Toscane'}
];
const recs = [
  ['Hotels rond je overnachting','Familiekamer · hond toegestaan · parkeren · weinig omrijden'],
  ['Restaurants rond aankomst','Gezinsvriendelijk · hond welkom · dicht bij route'],
  ['Laden of tanken','Binnen jouw rijbereik · combineren met pauze of lunch'],
  ['Uitjes en korte stops','Korte wandeling · speeltuin · uitzichtpunt · rustig aankomen'],
  ['WC en pauzeplekken','Praktisch onderweg · koffie · parkeren · snel verder'],
  ['Camper/parkeren','Ruime plekken · makkelijk keren · geschikt voor langere voertuigen']
];
const stops = {
  hotels:[
    ['Hotel Alpenblick','Beste match · familiekamer · hond toegestaan · +8 min omrijden'],
    ['Gasthof Route Süd','Goed alternatief · parkeren · +5 min omrijden'],
    ['City Hotel Ulm','Past deels · huisdieren onbekend · +3 min omrijden'],
    ['Hotel Am Park','Rustige locatie · ontbijt · +11 min omrijden'],
    ['Familiehotel Tirol','Familiekamer · laadpunt dichtbij · +14 min omrijden'],
    ['Routehotel Donau','Parkeren · familiekamer mogelijk · +6 min omrijden'],
    ['Hotel Waldruhe','Hond welkom · rustige ligging · +12 min omrijden'],
    ['Aparthotel Zuid-Duitsland','Ruime kamer · keukenhoek · geschikt voor gezin'],
    ['Hotel bij afrit A8','Snel bereikbaar · ontbijt · +4 min omrijden'],
    ['Pension Alpenroute','Eenvoudig · hond op aanvraag · +9 min omrijden'],
    ['Hotel met laadpunt','Laadpunt dichtbij · parkeren · +10 min omrijden'],
    ['Familie Gasthof','Kindvriendelijk · restaurant · +7 min omrijden']
  ],
  restaurants:[
    ['Raststätte Frankenhöhe','Lunch langs route · WC · parkeren'],
    ['Trattoria Al Lago','Italiaans · geschikt voor gezin · terras'],
    ['Bistro Route Süd','Korte omweg · hond welkom op terras'],
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
    ['Korte wandeling Donau','Rustige stop · hondvriendelijk'],
    ['Speeltuin stadspark','Kindvriendelijk · 15 min pauze'],
    ['Uitzichtpunt Alpenroute','Korte foto-stop · weinig omrijden'],
    ['Zwembad bij overnachting','Voor avond na aankomst'],
    ['Historisch centrum Ulm','Korte wandeling · eten dichtbij'],
    ['Natuurpad langs route','Even bewegen · hond welkom'],
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
    ['Parkeerplaats met voorzieningen','Snel uitstappen · hond uitlaten'],
    ['Autohof grensroute','WC · tanken · koffie']
  ]
};
const cats = [['hotels','Hotels'],['restaurants','Restaurants'],['laden','Laden'],['tanken','Tanken'],['uitjes','Uitjes'],['wc','WC']];
const visualCats = new Set(['hotels','restaurants','laden','tanken','uitjes']);
const thumbLabels = {hotels:'Hotel',restaurants:'Restaurant',laden:'Laadstation',tanken:'Tankstation',uitjes:'Uitje',wc:'WC'};
function toMinutes(t){ const [h='0',m='0']=String(t||'00:00').split(':'); return Number(h)*60+Number(m); }
function fromMinutes(min){ min=((min%1440)+1440)%1440; return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`; }
function shiftTime(t, diff){ return fromMinutes(toMinutes(t)+diff); }
function firstPlanTime(){ return dayPlan()[0]?.[0] || state.depart || '09:00'; }
function categoryTitle(cat=state.category){ return ({hotels:'Hotels in je hotelzone',restaurants:'Restaurants langs je route',laden:'Laadpunten langs je route',tanken:'Tankstations langs je route',uitjes:'Uitjes en korte stops',wc:'WC en pauzeplekken'}[cat]||'Stops langs je route'); }
function viewCopy(){
  if(!state.suggestions) return `Zelf zoeken actief · alle ${categoryTitle(state.category).toLowerCase()} worden getoond en gesorteerd op je profiel.`;
  return state.view==='recommended' ? 'We tonen eerst wat past bij jouw reis. Je kunt altijd alles bekijken.' : `Alle ${categoryTitle(state.category).toLowerCase()} · gesorteerd op beste match voor jouw reis.`;
}
function stopItemHtml(s, cat=state.category, recommended=false){
  const visual = visualCats.has(cat);
  const label = thumbLabels[cat] || 'Stop';
  const primaryAction = cat==='hotels' ? 'Bekijk hotel' : (cat==='laden'||cat==='tanken' ? 'Bekijk locatie' : 'Bekijk');
  const cls = visual ? ` has-thumb stop-${cat}` : ' compact-stop';
  return `<div class="stop-item${cls}">${visual?`<div class="stop-thumb thumb-${cat}" aria-label="${label} foto"><span>${label}</span></div>`:''}<div class="stop-main"><strong>${s[0]}</strong><p>${s[1]}</p><div class="stop-meta"><span>${recommended?'Aanbevolen':'Beste match'}</span><span>Profielgestuurd</span></div></div><div class="stop-actions-row">${visual?`<button class="ghost-action" type="button">${primaryAction}</button>`:''}<button class="add-stop-action" type="button">Toevoegen</button></div></div>`;
}
function recommendedStops(){
  const preferred = {
    hotels: stops.hotels.slice(0,4), restaurants: stops.restaurants.slice(0,3), laden: stops.laden.slice(0,3), tanken: stops.tanken.slice(0,3), uitjes: stops.uitjes.slice(0,3), wc: stops.wc.slice(0,3)
  };
  return preferred[state.category] || stops.hotels.slice(0,4);
}
const timelines = {
  1:[['08:30','Vertrek Amsterdam','Start van je roadtrip'],['11:00','Rustige pauze','WC · koffie · hond uitlaten'],['13:00','Lunchstop','Gezinsvriendelijk · weinig omrijden'],['15:15','Laad-/tankstop',()=> `${state.range} km rijbereik · ${state.vehicle==='electric'?state.plug:'volle tank'}`],['16:30','Overnachten rond','Familiekamer · huisdieren toegestaan · parkeren']],
  2:[['09:00','Vertrek vanaf overnachting','Verder richting Toscane'],['11:15','Korte pauze','WC · koffie'],['13:00','Lunchstop','Restaurant langs route'],['15:30','Aankomst Toscane','Rustig aankomen en inchecken']],
  3:[['10:00','Dagroute Toscane','Rustige lokale route'],['12:30','Lunch','Dorp of uitzichtpunt'],['15:00','Uitje','Korte activiteit in de buurt'],['17:00','Terug naar verblijf','Geen lange rit']]
};
let map, routeLine, markers=[];
function initMap(){
  if(!window.L || map) return;
  map = L.map('roadoraMap',{zoomControl:false,scrollWheelZoom:true}).setView([48.4,8.8],5);
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(map);
  routeLine = L.polyline(routeCoords,{color:'#0b6f71',weight:5,opacity:.88,lineCap:'round'}).addTo(map);
  markers = markerData.map(m=>L.marker(m.coords,{icon:L.divIcon({className:'',html:`<div class="custom-marker m-${m.type}">${m.label}</div>`,iconSize:[28,28],iconAnchor:[14,14]})}).addTo(map).bindTooltip(m.title));
  fitMap(); setTimeout(()=>map.invalidateSize(),250); setTimeout(()=>map.invalidateSize(),900);
}
function fitMap(){ if(map && routeLine) map.fitBounds(routeLine.getBounds(),{padding:[45,45]}); }
function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }
function readForm(){
  state.origin=$('#origin').value||state.origin; state.destination=$('#destination').value||state.destination; state.date=$('#date').value; state.depart=$('#departTime').value; state.arrival=$('#hotelArrival').value; state.days=Math.max(1,Math.min(21,Number($('#tripDays').value)||1)); state.range=Number($('#vehicleRangeKm').value)||325; state.plug=$('#plug').value;
  state.adults=Number($('[name="adults"]').value)||1; state.children=Number($('[name="children"]').value)||0; state.maxDetour=Number($('#maxDetour')?.value)||20;
}
function vehicleLabel(){return {car:'Auto',electric:'Elektrisch',camper:'Camper',bus:'Bus'}[state.vehicle]||'Auto'}
function setText(id, value){ const el=$(id); if(el) el.textContent=value; }
function updateTexts(){
  readForm(); const simpleOrigin=state.origin.split(',')[0]; const simpleDest=state.destination.split(',')[0]; const title=`${simpleOrigin} → ${simpleDest}`;
  ['#summaryRoute','#routeTitle','#mapRouteTitle','#tripOverviewTitle'].forEach(id=>setText(id,title));
  setText('#sideDepart',`${state.date} · ${state.depart}`); setText('#sideHotel',state.arrival); setText('#sideVehicle',`${vehicleLabel()} (${state.range} km)`);
  setText('#sideTravelers',`${state.adults} volwassenen, ${state.children} kinderen${state.pet!=='none'?', hond':''}`);
  const petText = state.pet==='none' ? 'geen hond' : (state.pet==='multiple' ? 'meerdere honden' : 'hond mee');
  const vehicleText = vehicleLabel();
  const prefTexts = $$('.pref.active').map(b=>b.textContent.trim());
  if($('#profileSummary')) $('#profileSummary').textContent = `${state.adults} volwassenen · ${state.children} kinderen · ${petText}`;
  if($('#vehicleSummary')) $('#vehicleSummary').textContent = state.vehicle==='electric' ? `${vehicleText} · ${state.range} km · ${state.plug}` : `${vehicleText} · ${state.range} km rijbereik`;
  if($('#prefSummary')) $('#prefSummary').textContent = prefTexts.length ? prefTexts.slice(0,4).join(' · ') + (prefTexts.length>4 ? ' +' + (prefTexts.length-4) : '') : 'geen voorkeuren gekozen';
  const detourValue = $('#maxDetour')?.closest('.range-row')?.querySelector('strong'); if(detourValue) detourValue.textContent = `${state.maxDetour} min`;
  setText('#rangeLabel', state.vehicle==='electric' ? 'Hoe ver kun je ongeveer rijden op een volle accu?' : 'Hoe ver kun je ongeveer rijden op een volle tank?');
  $('#evFields')?.classList.toggle('hidden', state.vehicle!=='electric'); setText('#chargeLabel', state.vehicle==='electric'?'Laadstop':'Tankstop');
  setText('#chargeDetail', state.vehicle==='electric'?`${state.range} km rijbereik · ${state.plug}`:`${state.range} km rijbereik · tankstop`);
  setText('#dayCountPill',`${state.days} dagen`); setText('#overviewDayPill',`Dag ${state.activeDay}`); setText('#overviewDaysPill',`${state.days} dagen`); setText('#activeDaySummary',`Dag ${state.activeDay} · ${dayRouteLabel(state.activeDay, simpleOrigin, simpleDest)}`); setText('#tripOverviewMeta',`${state.days} dagen · 1.495 km · 15 u 45 m heenreis`);
  const tags = [`${state.children} kinderen`, state.pet==='none'?'geen hond':'hond mee', `${state.range} km rijbereik`, 'familiekamers', state.vehicle==='electric'?'laden':'tanken'];
  if($('#profileTags')) $('#profileTags').innerHTML = tags.map(t=>`<span class="tag">${t}</span>`).join(''); if($('#tripOverviewTags')) $('#tripOverviewTags').innerHTML = tags.slice(0,4).map(t=>`<span class="tag">${t}</span>`).join('');
}
function renderDays(){
  const tabs=$('#dayTabs'); tabs.innerHTML='';
  for(let i=1;i<=state.days;i++){const b=document.createElement('button'); b.className='day-tab'+(i===state.activeDay?' active':''); b.textContent=`Dag ${i}`; b.onclick=()=>{state.activeDay=i; editingPlanRows.clear(); renderAll();}; tabs.appendChild(b);}
}
function dayRouteLabel(day, origin=state.origin.split(',')[0], dest=state.destination.split(',')[0]){
  if(day===1) return `${origin} → overnachten rond`;
  if(day===2) return `overnachting → ${dest}`;
  if(day===state.days && state.days>3) return `${dest} → ${origin}`;
  if(day===state.days-1 && state.days>4) return `${dest} → tussenstop`;
  return `${dest} omgeving`;
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
function renderTimeline(){
  const list = dayPlan();
  $('#timeline').innerHTML = list.map((r,i)=>{
    const detail = typeof r[2]==='function'?r[2]():r[2];
    const type = r[3] || inferType(r[1]);
    const editing = editingPlanRows.has(i);
    return `<div class="plan-row ${i===list.length-1?'active':''} ${editing?'editing':''}" data-plan-index="${i}">
      <div class="plan-read">
        <div class="plan-read-time">${r[0]}</div>
        <div class="plan-read-main"><strong>${r[1]}</strong><span>${detail}</span><em>${type}</em></div>
        <button class="plan-edit" type="button">Bewerken</button>
      </div>
      <div class="plan-edit-panel">
        <div class="plan-timebox"><input class="plan-time-input" type="time" value="${r[0]}" aria-label="Tijd"></div>
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
function renderStops(){
  const intro=$('#stopsIntro'); if(intro) intro.textContent = viewCopy();
  const toggle=$('#suggestionToggle');
  if(toggle){ toggle.textContent = state.suggestions ? 'Roadora suggesties aan' : 'Zelf zoeken actief'; toggle.classList.toggle('is-on', state.suggestions); toggle.setAttribute('aria-pressed', String(state.suggestions)); }
  $('#categoryTabs').innerHTML = cats.map(([id,label])=>`<button class="category-btn ${id===state.category?'active':''}" data-cat="${id}" type="button">${label}</button>`).join('');
  const recommendTitle = categoryTitle(state.category).replace('langs je route','aanbevolen langs je route').replace('in je hotelzone','aanbevolen in je hotelzone');
  const recommendHead = $('#recommendPanel .card-title h3'); if(recommendHead) recommendHead.textContent = recommendTitle;
  $('#recommendations').innerHTML = recommendedStops().map(s=>stopItemHtml(s,state.category,true)).join('');
  $('#allStops').innerHTML = (stops[state.category]||[]).map(s=>stopItemHtml(s,state.category,false)).join('');
  if(!state.suggestions){ state.view='all'; }
  $('#recommendPanel').classList.toggle('hidden', !state.suggestions || state.view!=='recommended');
  $('#allStopsPanel').classList.toggle('hidden', state.view!=='all');
  $$('.mode-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===state.view));
}
function renderDelayCard(){
  const planned=$('#plannedDepart'), actual=$('#actualDepart'), status=$('#delayStatus'), msg=$('#delayMessage');
  if(!planned||!actual) return;
  const planStart=firstPlanTime(); planned.value=planStart;
  if(!actual.value) actual.value=planStart;
  const diff=toMinutes(actual.value)-toMinutes(planStart);
  if(diff===0){ if(status) status.textContent='op schema'; if(msg) msg.textContent='Vertrek je later dan gepland? Roadora kan de dagplanning meeschuiven of de hotelzone behouden.'; }
  else { const abs=Math.abs(diff); const h=Math.floor(abs/60), m=abs%60; const label=`${h?`${h} uur `:''}${m?`${m} min`:''}`.trim(); if(status) status.textContent = diff>0 ? `${label} later` : `${label} eerder`; if(msg) msg.textContent = diff>0 ? `Je vertrekt ${label} later dan gepland. Kies of Roadora alles laat meeschuiven of de hotelzone probeert te behouden.` : `Je vertrekt ${label} eerder dan gepland. Roadora kan je pauzes en hotelzone ruimer plannen.`; }
}
function shiftActivePlan(){
  const planned=firstPlanTime(), actual=$('#actualDepart')?.value || planned; const diff=toMinutes(actual)-toMinutes(planned);
  if(!diff){ toast('Je vertrektijd staat al gelijk'); return; }
  const plan=dayPlan(); plan.forEach(r=>{r[0]=shiftTime(r[0], diff)}); editingPlanRows.clear(); renderAll(); toast('Dagplanning bijgewerkt');
}
function keepHotelZonePlan(){
  const planned=firstPlanTime(), actual=$('#actualDepart')?.value || planned; const diff=toMinutes(actual)-toMinutes(planned);
  const plan=dayPlan(); if(plan[0]) plan[0][0]=actual;
  if(diff>0){
    const hotelIdx=plan.findIndex(r=>inferType(r[1])==='Overnachten rond'||String(r[3]||'').includes('Overnachten'));
    if(hotelIdx>1){ plan.splice(1,0,[shiftTime(actual,90),'Kortere pauze','Hotelzone blijft behouden · minder marge','Pauze']); }
  }
  editingPlanRows.clear(); renderAll(); toast('Hotelzone behouden, planning ingekort');
}
function manualAdjustPlan(){ editingPlanRows.add(0); renderTimeline(); toast('Pas de dagplanning zelf aan'); }
function renderTrips(){
  const trips=JSON.parse(localStorage.getItem('roadoraTripsV3')||'[]');
  $('#savedTrips').innerHTML = trips.length ? trips.map(t=>`<div class="trip-card"><strong>${t.name}</strong><span>${t.days} dagen · ${t.route} · ${t.created}</span></div>`).join('') : '<p class="muted">Nog geen opgeslagen roadtrips. Bewaar je planning om hem later via je account naar de app te sturen.</p>';
}
function renderAll(){updateTexts();renderDays();renderTimeline();renderStops();renderDelayCard();renderTripOverview();renderTrips(); if(map) setTimeout(()=>map.invalidateSize(),80);}
function bind(){
  $$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active')); $$('.tab-panel').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#'+b.dataset.tab).classList.add('active'); if(map) setTimeout(()=>map.invalidateSize(),150);});
  document.addEventListener('click',e=>{
    const cat=e.target.closest('[data-cat]'); if(cat){state.category=cat.dataset.cat; renderStops();}
    const mode=e.target.closest('[data-view]'); if(mode){state.view=mode.dataset.view; $$('.mode-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===state.view)); renderStops();}
    const delDay=e.target.closest('[data-delete-day]'); if(delDay){e.preventDefault(); e.stopPropagation(); deleteTripDay(Number(delDay.dataset.deleteDay)); return;}
    const edit=e.target.closest('.plan-edit');
    if(edit){const row=edit.closest('[data-plan-index]'); const i=Number(row.dataset.planIndex); editingPlanRows.has(i)?editingPlanRows.delete(i):editingPlanRows.add(i); renderTimeline(); return;}
    const saveEdit=e.target.closest('.plan-save');
    if(saveEdit){const row=saveEdit.closest('[data-plan-index]'); const i=Number(row.dataset.planIndex); editingPlanRows.delete(i); renderTimeline(); toast('Planningregel opgeslagen'); return;}
    const remove=e.target.closest('.plan-remove');
    if(remove){const row=remove.closest('[data-plan-index]'); const i=Number(row.dataset.planIndex); dayPlan().splice(i,1); editingPlanRows.clear(); renderTimeline(); toast('Stop verwijderd');}
    const addStop=e.target.closest('.add-stop-action');
    if(addStop){ const item=addStop.closest('.stop-item'); const title=item?.querySelector('strong')?.textContent || 'Gekozen stop'; const insertAt=Math.max(1,dayPlan().length-1); dayPlan().splice(insertAt,0,['12:30',title,'Toegevoegd vanuit Stops-tab', categoryTitle(state.category).replace(' langs je route','')]); renderAll(); toast('Stop toegevoegd aan Dag '+state.activeDay); return; }
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
  $('#planRoute').onclick=()=>{renderAll(); fitMap(); toast('Dagroute bijgewerkt');};
  $('#addPlanStop')?.addEventListener('click',()=>{const insertAt=Math.max(1,dayPlan().length-1); dayPlan().splice(insertAt,0,['12:00','Nieuwe stop','Zelf invullen of kies later uit Stops','Zelf ingevuld']); editingPlanRows.clear(); editingPlanRows.add(insertAt); renderTimeline(); toast('Stop toegevoegd');});
  $('#chooseHotelZone')?.addEventListener('click',()=>{const plan=dayPlan(); const idx=plan.findIndex(r=>String(r[1]).toLowerCase().includes('hotel')); if(idx>=0){plan[idx]=[state.arrival.split(' - ')[0]||'17:00','Zelf gekozen overnachting','Vul zelf plaats, regio of hotel in','Overnachten rond'];} else {plan.push([state.arrival.split(' - ')[0]||'17:00','Zelf gekozen overnachting','Vul zelf plaats, regio of hotel in','Overnachten rond']);} renderTimeline(); toast('Overnachting handmatig gezet');});
  $('#recalculatePlan')?.addEventListener('click',()=>{timelines[state.activeDay]=state.activeDay===1?[[state.depart,'Vertrek Amsterdam','Start van je roadtrip','Vertrek'],['11:00','Rustige pauze','WC · koffie · hond uitlaten','Pauze'],['13:00','Lunchstop','Gezinsvriendelijk · weinig omrijden','Lunch'],['15:15','Laad-/tankstop',`${state.range} km rijbereik · ${state.vehicle==='electric'?state.plug:'volle tank'}`,'Laden/tanken'],[state.arrival.split(' - ')[0]||'16:30','Overnachten rond','Familiekamer · huisdieren toegestaan · parkeren','Overnachten rond']]:dayPlan(); renderAll(); toast('Voorstel opnieuw berekend');});
  $('#suggestionToggle')?.addEventListener('click',()=>{state.suggestions=!state.suggestions; if(!state.suggestions) state.view='all'; else state.view='recommended'; renderStops(); toast(state.suggestions?'Roadora suggesties aan':'Zelf zoeken actief');});
  $('#actualDepart')?.addEventListener('input',renderDelayCard);
  $('#shiftPlan')?.addEventListener('click',shiftActivePlan);
  $('#keepHotelZone')?.addEventListener('click',keepHotelZonePlan);
  $('#manualPlan')?.addEventListener('click',manualAdjustPlan);
  $('#addTripDay')?.addEventListener('click',()=>{state.days=Math.min(21,state.days+1); const input=$('#tripDays'); if(input) input.value=state.days; state.activeDay=state.days; editingPlanRows.clear(); renderAll(); toast('Dag toegevoegd');});
  $('#mapFit').onclick=fitMap; $('#mapZoomIn').onclick=()=>map?.zoomIn(); $('#mapZoomOut').onclick=()=>map?.zoomOut();
  $('#mapToggleStops').onclick=()=>{markers.forEach(m=>map.hasLayer(m)?map.removeLayer(m):m.addTo(map));};
  function save(){readForm(); const trips=JSON.parse(localStorage.getItem('roadoraTripsV3')||'[]'); trips.unshift({name:`Roadtrip ${state.destination.split(',')[0]}`,route:`${state.origin.split(',')[0]} → ${state.destination.split(',')[0]}`,days:state.days,created:new Date().toLocaleDateString('nl-NL')}); localStorage.setItem('roadoraTripsV3',JSON.stringify(trips.slice(0,4))); renderTrips(); toast('Roadtrip opgeslagen');}
  $('#saveRoute').onclick=save; $('#saveRouteSide').onclick=save; $('#exportApp').onclick=()=>toast('Account/app-export wordt later gekoppeld'); $('#resetDemo').onclick=()=>location.reload();
  $('#acceptCookies')?.addEventListener('click',()=>{localStorage.setItem('roadoraCookie','yes');$('#cookieBanner').classList.remove('show')}); $('#rejectCookies')?.addEventListener('click',()=>{localStorage.setItem('roadoraCookie','no');$('#cookieBanner').classList.remove('show')}); if(!localStorage.getItem('roadoraCookie')) setTimeout(()=>$('#cookieBanner')?.classList.add('show'),900);
}
document.addEventListener('DOMContentLoaded',()=>{bind();renderAll();setTimeout(initMap,250);});
