const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const state = {
  origin:'Amsterdam, Nederland', destination:'Toscane, Italië', date:'2026-05-26', depart:'08:30', arrival:'16:30 - 18:00', days:8,
  adults:2, children:3, pet:'dog', vehicle:'electric', range:325, plug:'CCS', maxDetour:20, activeDay:1, view:'recommended', category:'hotels'
};
const routeCoords = [[52.3676,4.9041],[51.05,5.1],[50.11,7.0],[49.49,8.47],[48.4,9.99],[47.37,8.54],[46.0,10.2],[43.77,11.25]];
const markerData = [
  {type:'start',label:'A',coords:[52.3676,4.9041],title:'Vertrek Amsterdam'},
  {type:'pause',label:'1',coords:[50.9,6.3],title:'11:00 Pauze'},
  {type:'lunch',label:'2',coords:[49.49,8.47],title:'13:00 Lunch'},
  {type:'charge',label:'3',coords:[48.4,9.99],title:'15:15 Laad-/tankstop'},
  {type:'hotel',label:'H',coords:[46.9,10.9],title:'16:30 - 18:00 Hotelzone'},
  {type:'end',label:'B',coords:[43.77,11.25],title:'Toscane'}
];
const recs = [
  ['Hotels passend','Familiekamer · hond toegestaan · parkeren'],['Restaurants','Geschikt voor gezin rond aankomst'],['Laden/tanken','Binnen jouw rijbereik gecombineerd met pauze'],['Uitjes','Korte wandeling of activiteit in hotelzone']
];
const stops = {
  hotels:[['Hotel Alpenblick','Beste match · familiekamer · hond toegestaan · +8 min omrijden'],['Gasthof Route Süd','Goed alternatief · parkeren · +5 min omrijden'],['City Hotel Ulm','Past deels · huisdieren onbekend · +3 min omrijden'],['Hotel Am Park','Rustige locatie · ontbijt · +11 min omrijden'],['Familiehotel Tirol','Familiekamer · laadpunt dichtbij · +14 min omrijden']],
  restaurants:[['Raststätte Frankenhöhe','Lunch langs route · WC · parkeren'],['Trattoria Al Lago','Italiaans · geschikt voor gezin'],['Bistro Route Süd','Korte omweg · hond welkom op terras'],['Gasthof Waldblick','Rustige lunchplek · +7 min']],
  laden:[['IONITY Ulm-West','Snelladen · lunch dichtbij · binnen rijbereik'],['Fastned Augsburg','Snelladen · WC · koffie'],['EnBW Park','Laadplein · meerdere punten'],['Hotelcharger Alpenblick','Laadpunt bij hotel']],
  tanken:[['Shell Route Süd','Langs route · weinig omrijden'],['Aral Autohof','Ruim parkeren · WC'],['TotalEnergies A8','Goede tankstop voor hotelzone'],['OMV Tirol','Voor aankomst hotelzone']],
  uitjes:[['Korte wandeling Donau','Rustige stop · hondvriendelijk'],['Speeltuin stadspark','Kindvriendelijk · 15 min pauze'],['Uitzichtpunt Alpenroute','Korte foto-stop'],['Zwembad bij hotelzone','Voor avond na aankomst']],
  wc:[['Raststätte Keulen Süd','WC · koffie · weinig omrijden'],['Autohof Ulm','WC · parkeren · eten'],['Pauzeplek A8','Snel en praktisch'],['Hotelzone servicepunt','Vlak voor aankomst']]
};
const cats = [['hotels','Hotels'],['restaurants','Restaurants'],['laden','Laden'],['tanken','Tanken'],['uitjes','Uitjes'],['wc','WC']];
const timelines = {
  1:[['08:30','Vertrek Amsterdam','Start van je roadtrip'],['11:00','Rustige pauze','WC · koffie · hond uitlaten'],['13:00','Lunchstop','Gezinsvriendelijk · weinig omrijden'],['15:15','Laad-/tankstop',()=> `${state.range} km rijbereik · ${state.vehicle==='electric'?state.plug:'volle tank'}`],['16:30','Hotelzone','Familiekamer · huisdieren toegestaan · parkeren']],
  2:[['09:00','Vertrek hotelzone','Verder richting Toscane'],['11:15','Korte pauze','WC · koffie'],['13:00','Lunchstop','Restaurant langs route'],['15:30','Aankomst Toscane','Rustig aankomen en inchecken']],
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
  state.adults=Number($('[name="adults"]').value)||1; state.children=Number($('[name="children"]').value)||0;
}
function vehicleLabel(){return {car:'Auto',electric:'Elektrisch',camper:'Camper',bus:'Bus'}[state.vehicle]||'Auto'}
function updateTexts(){
  readForm(); const simpleOrigin=state.origin.split(',')[0]; const simpleDest=state.destination.split(',')[0]; const title=`${simpleOrigin} → ${simpleDest}`;
  ['#summaryRoute','#routeTitle','#mapRouteTitle'].forEach(id=>{if($(id)) $(id).textContent=title});
  $('#sideDepart').textContent=`${state.date} · ${state.depart}`; $('#sideHotel').textContent=state.arrival; $('#sideVehicle').textContent=`${vehicleLabel()} (${state.range} km)`;
  $('#sideTravelers').textContent=`${state.adults} volwassenen, ${state.children} kinderen${state.pet!=='none'?', hond':''}`;
  $('#rangeLabel').textContent = state.vehicle==='electric' ? 'Hoe ver kun je ongeveer rijden op een volle accu?' : 'Hoe ver kun je ongeveer rijden op een volle tank?';
  $('#evFields').classList.toggle('hidden', state.vehicle!=='electric'); $('#chargeLabel').textContent = state.vehicle==='electric'?'Laadstop':'Tankstop';
  $('#chargeDetail').textContent = state.vehicle==='electric'?`${state.range} km rijbereik · ${state.plug}`:`${state.range} km rijbereik · tankstop`;
  $('#dayCountPill').textContent=`${state.days} dagen`; $('#overviewDayPill').textContent=`Dag ${state.activeDay}`; $('#activeDaySummary').textContent=`Dag ${state.activeDay} · ${state.activeDay===1?simpleOrigin+' → hotelzone':state.activeDay===2?'hotelzone → '+simpleDest:'lokale dagroute / vrije dag'}`;
  const tags = [`${state.children} kinderen`, state.pet==='none'?'geen hond':'hond mee', `${state.range} km rijbereik`, 'familiekamers', state.vehicle==='electric'?'laden':'tanken'];
  $('#profileTags').innerHTML = tags.map(t=>`<span class="tag">${t}</span>`).join('');
}
function renderDays(){
  const tabs=$('#dayTabs'); tabs.innerHTML='';
  for(let i=1;i<=state.days;i++){const b=document.createElement('button'); b.className='day-tab'+(i===state.activeDay?' active':''); b.textContent=`Dag ${i}`; b.onclick=()=>{state.activeDay=i; renderAll();}; tabs.appendChild(b);}
}
function renderTimeline(){
  const list = timelines[state.activeDay] || [[state.depart,'Vrije dag','Zelf stops, uitjes of restaurants toevoegen'],['13:00','Optionele stop','Alles tonen op kaart blijft mogelijk'],[state.arrival.split(' - ')[0]||'17:00','Terug naar verblijf','Overzicht bewaren in Mijn roadtrips']];
  $('#timeline').innerHTML = list.map((r,i)=>`<div class="time-row"><div class="time">${r[0]}</div><div class="time-card ${i===list.length-1?'active':''}"><strong>${r[1]}</strong><span>${typeof r[2]==='function'?r[2]():r[2]}</span></div></div>`).join('');
}
function renderStops(){
  $('#categoryTabs').innerHTML = cats.map(([id,label])=>`<button class="category-btn ${id===state.category?'active':''}" data-cat="${id}" type="button">${label}</button>`).join('');
  $('#recommendations').innerHTML = recs.map(r=>`<div class="rec-card"><strong>${r[0]}</strong><span>${r[1]}</span></div>`).join('');
  $('#allStops').innerHTML = (stops[state.category]||[]).map(s=>`<div class="stop-item"><div><strong>${s[0]}</strong><p>${s[1]}</p></div><button type="button">Toevoegen</button></div>`).join('');
  $('#recommendPanel').classList.toggle('hidden', state.view!=='recommended'); $('#allStopsPanel').classList.toggle('hidden', state.view!=='all');
}
function renderTrips(){
  const trips=JSON.parse(localStorage.getItem('roadoraTripsV3')||'[]');
  $('#savedTrips').innerHTML = trips.length ? trips.map(t=>`<div class="trip-card"><strong>${t.name}</strong><span>${t.days} dagen · ${t.route} · ${t.created}</span></div>`).join('') : '<p class="muted">Nog geen opgeslagen roadtrips. Bewaar je planning om hem later via je account naar de app te sturen.</p>';
}
function renderAll(){updateTexts();renderDays();renderTimeline();renderStops();renderTrips(); if(map) setTimeout(()=>map.invalidateSize(),80);}
function bind(){
  $$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active')); $$('.tab-panel').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#'+b.dataset.tab).classList.add('active'); if(map) setTimeout(()=>map.invalidateSize(),150);});
  document.addEventListener('click',e=>{const cat=e.target.closest('[data-cat]'); if(cat){state.category=cat.dataset.cat; renderStops();} const mode=e.target.closest('[data-view]'); if(mode){state.view=mode.dataset.view; $$('.mode-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===state.view)); renderStops();}});
  $$('[data-vehicle]').forEach(b=>b.onclick=()=>{$$('[data-vehicle]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); state.vehicle=b.dataset.vehicle; renderAll();});
  $$('[data-pet]').forEach(b=>b.onclick=()=>{$$('[data-pet]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); state.pet=b.dataset.pet; renderAll();});
  $$('.pref').forEach(b=>b.onclick=()=>b.classList.toggle('active'));
  ['origin','destination','date','departTime','hotelArrival','tripDays','vehicleRangeKm','plug'].forEach(id=>$('#'+id)?.addEventListener('input',renderAll));
  $$('input[name="adults"],input[name="children"]').forEach(i=>i.addEventListener('input',renderAll));
  $('#planRoute').onclick=()=>{renderAll(); fitMap(); toast('Roadtrip bijgewerkt');}; $('#mapFit').onclick=fitMap; $('#mapZoomIn').onclick=()=>map?.zoomIn(); $('#mapZoomOut').onclick=()=>map?.zoomOut();
  $('#mapToggleStops').onclick=()=>{markers.forEach(m=>map.hasLayer(m)?map.removeLayer(m):m.addTo(map));};
  function save(){readForm(); const trips=JSON.parse(localStorage.getItem('roadoraTripsV3')||'[]'); trips.unshift({name:`Roadtrip ${state.destination.split(',')[0]}`,route:`${state.origin.split(',')[0]} → ${state.destination.split(',')[0]}`,days:state.days,created:new Date().toLocaleDateString('nl-NL')}); localStorage.setItem('roadoraTripsV3',JSON.stringify(trips.slice(0,4))); renderTrips(); toast('Roadtrip opgeslagen');}
  $('#saveRoute').onclick=save; $('#saveRouteSide').onclick=save; $('#exportApp').onclick=()=>toast('Account/app-export wordt later gekoppeld'); $('#resetDemo').onclick=()=>location.reload();
  $('#acceptCookies')?.addEventListener('click',()=>{localStorage.setItem('roadoraCookie','yes');$('#cookieBanner').classList.remove('show')}); $('#rejectCookies')?.addEventListener('click',()=>{localStorage.setItem('roadoraCookie','no');$('#cookieBanner').classList.remove('show')}); if(!localStorage.getItem('roadoraCookie')) setTimeout(()=>$('#cookieBanner')?.classList.add('show'),900);
}
document.addEventListener('DOMContentLoaded',()=>{bind();renderAll();setTimeout(initMap,250);});
