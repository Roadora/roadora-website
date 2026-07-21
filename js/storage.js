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
    days: 1,
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
    daysPlan: [
      {
        day: 1,
        title: `Dag 1 · ${short(state.origin)} → ${short(state.destination)}`,
        origin: state.origin,
        destination: state.destination,
        stops: ['Pauzezone', 'Lunchzone', state.vehicle==='electric'?'Laadstop':'Tankstop', 'Hotelzone'],
        hotelZone: state.hotelArrival
      }
    ]
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
