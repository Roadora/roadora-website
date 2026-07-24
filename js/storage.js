import { CONFIG } from './config.js';
export function loadState(){
  try{
    const stored=JSON.parse(localStorage.getItem(CONFIG.storageKeys.route)||'null');
    return {...CONFIG.defaults,...stored};
  }catch{return {...CONFIG.defaults};}
}
export function saveState(state){localStorage.setItem(CONFIG.storageKeys.route,JSON.stringify(state));}
export function listTrips(){
  try{return JSON.parse(localStorage.getItem(CONFIG.storageKeys.trips)||'[]');}
  catch{return [];}
}
export function saveTrip(state){
  const trips=listTrips();
  const id=state.tripId || `trip-${Date.now()}`;
  const trip={
    id,
    name: `${short(state.origin)} naar ${short(state.destination)}`,
    days: Number(state.tripDays)||1,
    updatedAt: new Date().toISOString(),
    route: {
      origin: state.origin,
      destination: state.destination,
      date: state.date,
      departTime: state.departTime,
      hotelArrival: state.hotelArrival
    },
    profile: {
      adults: Number(state.adults)||1,
      children: Number(state.children)||0,
      pet: state.pet,
      vehicle: state.vehicle,
      vehicleRangeKm: Number(state.vehicleRangeKm)||0,
      plug: state.plug,
      preferences: state.preferences || []
    },
    daysPlan: buildDaysPlan(state)
  };
  const existing=trips.findIndex(t=>t.id===id);
  if(existing>=0)trips[existing]=trip; else trips.unshift(trip);
  localStorage.setItem(CONFIG.storageKeys.trips,JSON.stringify(trips.slice(0,12)));
  localStorage.setItem(CONFIG.storageKeys.route,JSON.stringify({...state,tripId:id}));
  return trip;
}
export function getConsent(){return localStorage.getItem(CONFIG.storageKeys.consent);}
export function setConsent(value){localStorage.setItem(CONFIG.storageKeys.consent,value);}
function short(value){return String(value||'').split(',')[0];}

function buildDaysPlan(state){
  const days=Math.max(1,Math.min(21,Number(state.tripDays)||1));
  return Array.from({length:days},(_,idx)=>{
    const day=idx+1;
    const isFirst=day===1;
    const isLast=day===days;
    const title=isFirst
      ? `Dag ${day} · ${short(state.origin)} → overnachten rond`
      : isLast
        ? `Dag ${day} · eindroute → ${short(state.destination)}`
        : `Dag ${day} · dagroute / omgeving`;
    return {
      day,
      title,
      origin: isFirst ? state.origin : 'Nog te kiezen',
      destination: isLast ? state.destination : 'Nog te kiezen',
      stops: isFirst ? ['Pauzezone','Lunchzone',state.vehicle==='electric'?'Laadstop':'Tankstop','Overnachten rond'] : ['Dagroute','Stops','Uitjes','Hotel'],
      hotelZone: state.hotelArrival
    };
  });
}
