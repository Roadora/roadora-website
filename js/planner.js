export function parseTimeToMinutes(time){const [h,m]=String(time||'08:30').split(':').map(Number);return (h||0)*60+(m||0);}
export function formatMinutes(total){const h=Math.floor(total/60)%24;const m=total%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
export function buildPlan(state){
  const depart=parseTimeToMinutes(state.departTime);
  const isEv=state.vehicle==='electric';
  const range=Number(state.evRangeKm)||325;
  const safeChargeKm=Math.max(120,Math.round(range*.72));
  const hotelWindow=state.hotelArrival||'16:30 - 18:00';
  return [
    {time:formatMinutes(depart),title:`Vertrek ${shortPlace(state.origin)}`,meta:'Start van je roadtrip',kind:'start'},
    {time:formatMinutes(depart+150),title:'Rustige pauze',meta:'WC, koffie en even bewegen · ±2 u 30 rijden',kind:'pause'},
    {time:formatMinutes(depart+285),title:'Lunchstop',meta:profileLunchLabel(state),kind:'lunch'},
    {time:formatMinutes(depart+405),title:isEv?'Laadstop':'Tankstop',meta:isEv?`Aanbevolen rond ${safeChargeKm} km op basis van ${range} km actieradius`:'Handig vóór de hotelzone',kind:'charge'},
    {time:hotelWindow,title:'Hotelzone',meta:hotelZoneLabel(state),kind:'hotel'}
  ];
}
function shortPlace(value){return String(value||'').split(',')[0];}
function profileLunchLabel(state){
  const bits=[]; if(Number(state.children)>0)bits.push('kindvriendelijk'); if(state.pet==='dog')bits.push('hond welkom'); bits.push('weinig omrijden'); return bits.join(' · ');
}
function hotelZoneLabel(state){
  const bits=[]; if(Number(state.children)>0)bits.push('familiekamer'); if(state.pet==='dog')bits.push('huisdieren toegestaan'); if(state.vehicle==='electric')bits.push('laadpunt dichtbij'); return bits.length?bits.join(' · '):'past bij je aankomsttijd';
}
export function estimateTrip(state){
  const isEv=state.vehicle==='electric';
  return {distance:'1.495 km',duration:'15 u 45 m',hotelZone:'Zuid-Duitsland / Tirol',evHint:isEv?`${state.evRangeKm||325} km actieradius`:''};
}
