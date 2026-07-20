let roadoraMap=null;
let layers={route:null,markers:null,zones:null};

const stops=[
  {key:'start',type:'start',label:'Amsterdam',time:'08:30',meta:'Vertrekpunt',lat:52.3676,lng:4.9041},
  {key:'pause',type:'pause',label:'Pauzezone',time:'11:00',meta:'WC · koffie · hond uitlaten',lat:50.3569,lng:7.5890},
  {key:'lunch',type:'lunch',label:'Lunchstop',time:'13:00',meta:'kindvriendelijk langs de route',lat:49.4875,lng:8.4660},
  {key:'charge',type:'charge',label:'Laadstop',time:'15:15',meta:'logisch binnen actieradius',lat:48.4011,lng:9.9876},
  {key:'hotel',type:'hotel',label:'Hotelzone',time:'16:30 - 18:00',meta:'familiekamer · hond welkom',lat:47.2692,lng:11.4041},
  {key:'end',type:'end',label:'Toscane',time:'',meta:'Bestemming',lat:43.7696,lng:11.2558}
];

const routeLine=[
  [52.3676,4.9041],[51.9244,4.4777],[51.4416,5.4697],[50.9375,6.9603],[50.3569,7.5890],[49.4875,8.4660],[48.7758,9.1829],[48.4011,9.9876],[47.2692,11.4041],[46.4983,11.3548],[45.4384,10.9916],[44.4949,11.3426],[43.7696,11.2558]
];

const theme={
  start:'#2aa66a', pause:'#b78400', lunch:'#de7b10', charge:'#7d53b8', hotel:'#1f7aa3', end:'#151515'
};

export function initRoadoraMap(){
  const el=document.getElementById('roadoraMap');
  if(!el || !window.L || roadoraMap)return;

  roadoraMap=window.L.map(el,{zoomControl:true,scrollWheelZoom:false,attributionControl:true}).setView([48.55,8.3],6);

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:18,
    attribution:'&copy; OpenStreetMap'
  }).addTo(roadoraMap);

  layers.route=window.L.layerGroup().addTo(roadoraMap);
  layers.markers=window.L.layerGroup().addTo(roadoraMap);
  layers.zones=window.L.layerGroup().addTo(roadoraMap);

  drawMap();
  requestAnimationFrame(()=>roadoraMap.invalidateSize());
  window.addEventListener('resize',()=>roadoraMap?.invalidateSize());

  window.RoadoraMap={update:updateRoadoraMap,instance:roadoraMap};
}

export function updateRoadoraMap(state={}){
  if(!roadoraMap)return;
  const chargeStop=stops.find(s=>s.key==='charge');
  const hotelStop=stops.find(s=>s.key==='hotel');
  if(chargeStop){
    chargeStop.label=state.vehicle==='electric'?'Laadstop':'Tankstop';
    chargeStop.meta=state.vehicle==='electric'?`${state.evRangeKm||325} km actieradius · ${state.plug||'CCS'}`:'handig vóór de hotelzone';
  }
  if(hotelStop){
    hotelStop.time=state.hotelArrival||'16:30 - 18:00';
    hotelStop.meta=hotelMeta(state);
  }
  drawMap();
}

function drawMap(){
  layers.route.clearLayers();
  layers.markers.clearLayers();
  layers.zones.clearLayers();

  const line=window.L.polyline(routeLine,{color:'#bb850d',weight:5,opacity:.9,lineJoin:'round'}).addTo(layers.route);
  window.L.polyline(routeLine,{color:'#fff7e6',weight:2,opacity:.9,lineJoin:'round'}).addTo(layers.route);

  stops.filter(s=>['pause','lunch','charge','hotel'].includes(s.type)).forEach(stop=>{
    window.L.circle([stop.lat,stop.lng],{
      radius: stop.type==='hotel'?36000:22000,
      color: theme[stop.type],
      weight:1,
      opacity:.23,
      fillColor:theme[stop.type],
      fillOpacity:.08
    }).addTo(layers.zones);
  });

  stops.forEach(stop=>{
    const marker=window.L.marker([stop.lat,stop.lng],{icon:markerIcon(stop.type)}).addTo(layers.markers);
    marker.bindPopup(`<strong>${escapeHtml(stop.time ? `${stop.time} ${stop.label}` : stop.label)}</strong><br><span>${escapeHtml(stop.meta)}</span>`);
    if(['pause','lunch','charge','hotel'].includes(stop.type)){
      marker.bindTooltip(`${stop.time} ${stop.label}`,{permanent:true,direction:'right',offset:[12,0],className:'roadora-tooltip'});
    }
  });

  roadoraMap.fitBounds(line.getBounds(),{padding:[38,38],maxZoom:6});
}

function markerIcon(type){
  const label={start:'✓',pause:'1',lunch:'2',charge:'3',hotel:'4',end:'🏁'}[type]||'•';
  return window.L.divIcon({
    className:`roadora-marker marker-${type}`,
    html:`<span>${label}</span>`,
    iconSize:[34,34],
    iconAnchor:[17,17],
    popupAnchor:[0,-18]
  });
}

function hotelMeta(state){
  const bits=[];
  if(Number(state.children)>0)bits.push('familiekamer');
  if(state.pet==='dog')bits.push('hond welkom');
  if(state.vehicle==='electric')bits.push('laadpunt dichtbij');
  return bits.length?bits.join(' · '):'passende overnachtingszone';
}

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g, char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'
  }[char]));
}
