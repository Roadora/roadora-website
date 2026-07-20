import { loadState, saveState } from './storage.js';
import { $, $$, setText, showToast } from './dom.js';
import { buildPlan, estimateTrip } from './planner.js';
import { getRecommendations } from './recommendations.js';

let state=loadState();

export function initPlanner(){
  hydrateForm();
  bindForm();
  render();
}
function hydrateForm(){
  const fields=['origin','destination','date','departTime','hotelArrival','adults','children','childAges','evRangeKm','plug','maxDetour'];
  fields.forEach(name=>{const el=$(`[name="${name}"]`); if(el)el.value=state[name]??'';});
  $$(`[data-vehicle]`).forEach(btn=>btn.classList.toggle('active',btn.dataset.vehicle===state.vehicle));
  $$(`[data-pref]`).forEach(btn=>btn.classList.toggle('active',state.preferences?.includes(btn.dataset.pref)));
  $$(`[data-pet]`).forEach(btn=>btn.classList.toggle('active',btn.dataset.pet===state.pet));
}
function bindForm(){
  $$('input,select').forEach(el=>el.addEventListener('input',()=>{state[el.name]=el.value;persistRender();}));
  $$(`[data-vehicle]`).forEach(btn=>btn.addEventListener('click',()=>{state.vehicle=btn.dataset.vehicle;hydrateForm();persistRender();}));
  $$(`[data-pet]`).forEach(btn=>btn.addEventListener('click',()=>{state.pet=btn.dataset.pet;hydrateForm();persistRender();}));
  $$(`[data-pref]`).forEach(btn=>btn.addEventListener('click',()=>{const pref=btn.dataset.pref;const prefs=new Set(state.preferences||[]);prefs.has(pref)?prefs.delete(pref):prefs.add(pref);state.preferences=[...prefs];hydrateForm();persistRender();}));
  $('#planRoute')?.addEventListener('click',()=>{persistRender();showToast('Roadtrip bijgewerkt op basis van je tijden en profiel.');});
  $('#saveRoute')?.addEventListener('click',()=>{saveState(state);showToast('Roadtrip opgeslagen in deze browser.');});
  $('#saveRouteSide')?.addEventListener('click',()=>{saveState(state);showToast('Roadtrip opgeslagen. Profiel kan later aan account gekoppeld worden.');});
  $('#resetDemo')?.addEventListener('click',()=>{localStorage.removeItem('roadora.route.v1');state=loadState();hydrateForm();render();showToast('Voorbeeldroute teruggezet.');});
}
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
  setText('#chargeDetail', state.vehicle==='electric' ? `${state.evRangeKm || 325} km actieradius · ${state.plug || 'CCS'}` : 'logisch langs de route');
  $('#evFields')?.classList.toggle('hidden',state.vehicle!=='electric');
  renderTimeline();renderRecommendations();renderTags();
  window.RoadoraMap?.update?.(state);
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
  const root=$('#recommendations'); if(!root)return; root.innerHTML='';
  getRecommendations(state).forEach(item=>{
    const rec=document.createElement('div');rec.className='rec';
    rec.innerHTML=`<div class="thumb">${item.icon}</div><div><strong>${item.title}</strong><span>${item.meta}</span></div>`;
    root.appendChild(rec);
  });
}
function renderTags(){
  const root=$('#profileTags'); if(!root)return; root.innerHTML='';
  const tags=[];
  if(Number(state.children)>0)tags.push(`${state.children} kinderen`);
  if(state.pet==='dog')tags.push('hond mee');
  if(state.vehicle==='electric')tags.push(`${state.evRangeKm||325} km EV`);
  (state.preferences||[]).slice(0,4).forEach(p=>tags.push(prefLabel(p)));
  tags.forEach(tag=>{const el=document.createElement('span');el.className='tag';el.textContent=tag;root.appendChild(el);});
}
function short(value){return String(value||'').split(',')[0];}
function travelersLabel(){const kids=Number(state.children)||0;return `${state.adults||2} volwassenen${kids?`, ${kids} kinderen`:''}${state.pet==='dog'?', hond':''}`;}
function vehicleLabel(){return state.vehicle==='electric'?`Elektrisch (${state.evRangeKm||325} km)`:state.vehicle==='camper'?'Camper':state.vehicle==='bus'?'Bus':'Auto';}
function displayDateTime(){return `${state.date||'2026-05-26'} · ${state.departTime||'08:30'}`;}
function prefLabel(value){return ({family:'familiekamers',pets:'huisdieren',kids:'kindvriendelijk',parking:'parkeren',charging:'laadpunt',breakfast:'ontbijt',quiet:'rustig'})[value]||value;}
