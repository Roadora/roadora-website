export function parseTimeToMinutes(time){const [h,m]=String(time||'08:30').split(':').map(Number);return (h||0)*60+(m||0);}
export function formatMinutes(total){const h=Math.floor(total/60)%24;const m=total%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
export function buildPlan(state){
  const depart=parseTimeToMinutes(state.departTime);
  const isEv=state.vehicle==='electric';
  const range=Number(state.vehicleRangeKm)||defaultRange(state.vehicle);
  const safeKm=Math.max(80,Math.round(range*(isEv?.72:.78)));
  const hotelWindow=state.hotelArrival||'16:30 - 18:00';
  return [
    {time:formatMinutes(depart),title:`Vertrek ${shortPlace(state.origin)}`,meta:'Start van je roadtrip',kind:'start'},
    {time:formatMinutes(depart+150),title:'Rustige pauze',meta:pauseLabel(state),kind:'pause'},
    {time:formatMinutes(depart+285),title:'Lunchstop',meta:profileLunchLabel(state),kind:'lunch'},
    {time:formatMinutes(depart+405),title:isEv?'Laadstop':'Tankstop',meta:isEv?`Aanbevolen rond ${safeKm} km op basis van ${range} km rijbereik`:`Aanbevolen rond ${safeKm} km op basis van ${range} km rijbereik`,kind:'charge'},
    {time:hotelWindow,title:'Overnachten rond',meta:hotelZoneLabel(state),kind:'hotel'}
  ];
}
function shortPlace(value){return String(value||'').split(',')[0];}
function defaultRange(vehicle){return vehicle==='electric'?325:vehicle==='camper'?500:650;}
function pauseLabel(state){const bits=['WC','koffie','even bewegen']; if(state.pet==='dog')bits.push('hond uitlaten'); return bits.join(' · ')+' · ±2 u 30 rijden';}
function profileLunchLabel(state){
  const bits=[]; if(Number(state.children)>0)bits.push('geschikt voor gezin'); if(state.pet==='dog')bits.push('hond welkom'); bits.push('weinig omrijden'); return bits.join(' · ');
}
function hotelZoneLabel(state){
  const bits=[]; if(Number(state.children)>0)bits.push('familiekamer'); if(state.pet==='dog')bits.push('huisdieren toegestaan'); if(state.vehicle==='electric')bits.push('laadpunt dichtbij'); if(state.preferences?.includes('parking'))bits.push('parkeren'); return bits.length?bits.join(' · '):'past bij je aankomsttijd';
}
export function estimateTrip(state){return {distance:'1.495 km',duration:'15 u 45 m',hotelZone:'Zuid-Duitsland / Tirol',rangeHint:`${Number(state.vehicleRangeKm)||defaultRange(state.vehicle)} km rijbereik`};}
