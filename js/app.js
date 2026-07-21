import { loadState, saveState, saveTrip, listTrips } from './storage.js';
import { $, $$, setText, showToast } from './dom.js';
import { buildPlan, estimateTrip } from './planner.js';
import { CATEGORIES, getRecommendations, getAllStops } from './recommendations.js';

let state=loadState();

export function initPlanner(){
  hydrateForm();
  bindForm();
  render();
}
function hydrateForm(){
  const fields=['origin','destination','date','departTime','hotelArrival','adults','children','vehicleRangeKm','plug','maxDetour'];
  fields.forEach(name=>{const el=$(`[name="${name}"]`); if(el)el.value=state[name]??'';});
  $$(`[data-vehicle]`).forEach(btn=>btn.classList.toggle('active',btn.dataset.vehicle===state.vehicle));
  $$(`[data-pref]`).forEach(btn=>btn.classList.toggle('active',state.preferences?.includes(btn.dataset.pref)));
  $$(`[data-pet]`).forEach(btn=>btn.classList.toggle('active',btn.dataset.pet===state.pet));
  $$(`[data-view-mode]`).forEach(btn=>btn.classList.toggle('active',btn.dataset.viewMode===state.stopViewMode));
}
function bindForm(){
  $$('input,select').forEach(el=>el.addEventListener('input',()=>{state[el.name]=el.value;persistRender();}));
  $$(`[data-vehicle]`).forEach(btn=>btn.addEventListener('click',()=>{state.vehicle=btn.dataset.vehicle;state.vehicleRangeKm=defaultRange(state.vehicle);hydrateForm();persistRender();}));
  $$(`[data-pet]`).forEach(btn=>btn.addEventListener('click',()=>{state.pet=btn.dataset.pet;hydrateForm();persistRender();}));
  $$(`[data-pref]`).forEach(btn=>btn.addEventListener('click',()=>{const pref=btn.dataset.pref;const prefs=new Set(state.preferences||[]);prefs.has(pref)?prefs.delete(pref):prefs.add(pref);state.preferences=[...prefs];hydrateForm();persistRender();}));
  $$(`[data-view-mode]`).forEach(btn=>btn.addEventListener('click',()=>{state.stopViewMode=btn.dataset.viewMode;hydrateForm();persistRender();}));
  $('#planRoute')?.addEventListener('click',()=>{persistRender();showToast('Roadtrip bijgewerkt op basis van je tijden, profiel en rijbereik.');});
  $('#saveRoute')?.addEventListener('click',saveCurrentTrip);
  $('#saveRouteSide')?.addEventListener('click',saveCurrentTrip);
  $('#exportApp')?.addEventListener('click',()=>{saveTrip(state);renderSavedTrips();showToast('Roadtrip klaar voor app-sync zodra accounts actief zijn.');});
  $('#resetDemo')?.addEventListener('click',()=>{localStorage.removeItem('roadora.route.v2');state=loadState();hydrateForm();render();showToast('Voorbeeldroute teruggezet.');});
}
function saveCurrentTrip(){const trip=saveTrip(state);state.tripId=trip.id;renderSavedTrips();showToast('Roadtrip opgeslagen in Mijn roadtrips.');}
function persistRender(){saveState(state);render();}
function render(){
  const est=estimateTrip(state);
  setText('#routeTitle', `${short(state.origin)} → ${short(state.destination)}`);
  setText('#summaryRoute', `${short(state.origin)} → ${short(state.destination)}`);
  setText('#mapRouteTitle', `${short(state.origin)} → ${short(state.destination)}`);
  setText('#distance', est.distance);setText('#duration', est.duration);setText('#altitude','12.850 m');
  setText('#sideDistance', est.distance);setText('#sideDuration', est.duration);setText('#sideVehicle', vehicleLabel());
  setText('#sideTravelers', travelersLabel());setText('#sideDepart', displayDateTime());setText('#sideHotel', state.hotelArrival);
  setText('#chargeLabel', state.vehicle==='electric' ? 'Laadstop' : 'Tankstop');
  setText('#chargeDetail', state.vehicle==='electric' ? `${state.vehicleRangeKm || 325} km rijbereik · ${state.plug || 'CCS'}` : `${state.vehicleRangeKm || defaultRange(state.vehicle)} km rijbereik`);
  $('#evFields')?.classList.toggle('hidden',state.vehicle!=='electric');
  updateRangeCopy();
  renderTimeline();renderRecommendations();renderAllStops();renderTags();renderSavedTrips();
}
function renderTimeline(){
  const root=$('#timeline'); if(!root)return; root.innerHTML='';
  buildPlan(state).forEach(item=>{
    const row=document.createElement('div');row.className='time-row';
    row.innerHTML=`<div class="time">${item.time}</div><div class="time-card ${item.kind==='hotel'?'hotel':''}"><strong>${item.title}</strong><span>${item.meta}</span></div>`;
    root.appendChild(row);
  });
}
function renderRecommendations(){
  const panel=$('#recommendPanel'); const all=$('#allStopsPanel');
  panel?.classList.toggle('hidden',state.stopViewMode==='all');
  all?.classList.toggle('hidden',state.stopViewMode!=='all');
  const root=$('#recommendations'); if(!root)return; root.innerHTML='';
  getRecommendations(state).forEach(item=>{
    const rec=document.createElement('button');rec.type='button';rec.className='rec';
    rec.innerHTML=`<div><strong>${item.title}</strong><span>${item.meta}</span></div>`;
    rec.addEventListener('click',()=>{state.activeStopCategory=categoryFromTitle(item.title);state.stopViewMode='all';persistRender();});
    root.appendChild(rec);
  });
}
function renderAllStops(){
  const tabs=$('#categoryTabs'); const list=$('#allStops'); if(!tabs||!list)return;
  tabs.innerHTML=''; list.innerHTML='';
  CATEGORIES.forEach(cat=>{
    const btn=document.createElement('button'); btn.type='button'; btn.className=`cat-tab ${state.activeStopCategory===cat.id?'active':''}`; btn.textContent=cat.label;
    btn.addEventListener('click',()=>{state.activeStopCategory=cat.id;persistRender();});
    tabs.appendChild(btn);
  });
  getAllStops(state,state.activeStopCategory).forEach((item,i)=>{
    const row=document.createElement('div');row.className='stop-row';
    row.innerHTML=`<div class="match-score">${i===0?'•':'+'}</div><div><strong>${item.title}</strong><span>${item.meta}</span></div><button class="mini-link" type="button">Toevoegen</button>`;
    row.querySelector('button')?.addEventListener('click',()=>showToast(`${item.title} toegevoegd aan Dag 1.`));
    list.appendChild(row);
  });
}
function renderSavedTrips(){
  const root=$('#savedTrips'); if(!root)return; const trips=listTrips(); root.innerHTML='';
  if(!trips.length){root.innerHTML='<p class="step-note">Nog geen opgeslagen roadtrips. Bewaar je planning om hem later via je account naar de app te sturen.</p>';return;}
  trips.slice(0,3).forEach(trip=>{
    const el=document.createElement('div');el.className='trip-card';
    const d=new Date(trip.updatedAt).toLocaleDateString('nl-NL');
    el.innerHTML=`<strong>${trip.name}</strong><span>${trip.days} dagroute · ${trip.daysPlan?.[0]?.stops?.length||0} stops · bijgewerkt ${d}</span>`;
    root.appendChild(el);
  });
}
function renderTags(){
  const root=$('#profileTags'); if(!root)return; root.innerHTML='';
  const tags=[];
  if(Number(state.children)>0)tags.push(`${state.children} kinderen`);
  if(state.pet==='dog')tags.push('hond mee');
  tags.push(`${state.vehicleRangeKm||defaultRange(state.vehicle)} km rijbereik`);
  (state.preferences||[]).slice(0,4).forEach(p=>tags.push(prefLabel(p)));
  tags.forEach(tag=>{const el=document.createElement('span');el.className='tag';el.textContent=tag;root.appendChild(el);});
}
function updateRangeCopy(){
  const label=$('#rangeLabel'); const help=$('#rangeHelp');
  if(!label||!help)return;
  if(state.vehicle==='electric'){
    label.textContent='Hoe ver kun je ongeveer rijden op een volle accu?';
    help.textContent='Handmatig invullen kan gewoon, bijvoorbeeld 325 km. Roadora gebruikt dit voor laadstopzones.';
  }else{
    label.textContent='Hoe ver kun je ongeveer rijden op een volle tank?';
    help.textContent='Handmatig invullen kan gewoon. Roadora gebruikt dit voor tankstops, pauzes en dagroutes.';
  }
}
function categoryFromTitle(title){return ({Hotels:'hotels',Restaurants:'restaurants',Laden:'charging',Tanken:'fuel',Uitjes:'activities'})[title]||'hotels';}
function defaultRange(vehicle){return vehicle==='electric'?325:vehicle==='camper'?500:vehicle==='bus'?600:650;}
function short(value){return String(value||'').split(',')[0];}
function travelersLabel(){const kids=Number(state.children)||0;return `${state.adults||2} volwassenen${kids?`, ${kids} kinderen`:''}${state.pet==='dog'?', hond':''}`;}
function vehicleLabel(){const range=state.vehicleRangeKm||defaultRange(state.vehicle);return state.vehicle==='electric'?`Elektrisch (${range} km)`:state.vehicle==='camper'?`Camper (${range} km)`:state.vehicle==='bus'?`Bus (${range} km)`:`Auto (${range} km)`;}
function displayDateTime(){return `${state.date||'2026-05-26'} · ${state.departTime||'08:30'}`;}
function prefLabel(value){return ({family:'familiekamers',pets:'huisdieren',kids:'kindvriendelijk',parking:'parkeren',charging:'laadpunt',breakfast:'ontbijt',quiet:'rustig'})[value]||value;}
