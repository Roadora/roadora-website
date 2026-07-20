const LEAFLET_CSS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

let map;
let routeLayer;
let markerLayer;
let pendingState;
let loadingPromise;

const routePoints=[
  [52.3676,4.9041],   // Amsterdam
  [51.0504,6.9603],   // Keulen
  [50.1109,8.6821],   // Frankfurt
  [48.4011,9.9876],   // Ulm
  [47.2692,11.4041],  // Innsbruck
  [45.4384,10.9916],  // Verona
  [43.7696,11.2558]   // Toscane / Florence
];

function loadLeaflet(){
  if(window.L)return Promise.resolve(window.L);
  if(loadingPromise)return loadingPromise;

  loadingPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector(`link[href="${LEAFLET_CSS}"]`)){
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href=LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const existing=document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if(existing){
      existing.addEventListener('load',()=>resolve(window.L),{once:true});
      existing.addEventListener('error',reject,{once:true});
      return;
    }

    const script=document.createElement('script');
    script.src=LEAFLET_JS;
    script.defer=true;
    script.onload=()=>resolve(window.L);
    script.onerror=()=>reject(new Error('Leaflet kon niet worden geladen.'));
    document.head.appendChild(script);
  });

  return loadingPromise;
}

export async function initRealMap(){
  const el=document.getElementById('roadoraMap');
  if(!el)return;

  try{
    const L=await loadLeaflet();
    if(map)return;

    map=L.map(el,{
      zoomControl:true,
      scrollWheelZoom:false,
      preferCanvas:true,
      attributionControl:true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:18,
      attribution:'&copy; OpenStreetMap'
    }).addTo(map);

    routeLayer=L.layerGroup().addTo(map);
    markerLayer=L.layerGroup().addTo(map);

    renderMap(pendingState || {});

    requestAnimationFrame(()=>{
      map.invalidateSize();
      fitRoute();
    });

    window.addEventListener('resize',()=>{
      if(!map)return;
      window.setTimeout(()=>{map.invalidateSize();fitRoute();},120);
    });
  }catch(error){
    console.error(error);
    el.innerHTML='<div style="padding:24px;color:#6f6a60">De kaart kon niet worden geladen. Controleer je internetverbinding.</div>';
  }
}

export function updateRealMap(state){
  pendingState=state;
  if(!map || !window.L)return;
  renderMap(state || {});
}

function renderMap(state){
  const L=window.L;
  if(!L || !map || !routeLayer || !markerLayer)return;

  routeLayer.clearLayers();
  markerLayer.clearLayers();

  const vehicle=state.vehicle || 'electric';
  const isElectric=vehicle==='electric';
  const chargeTitle=isElectric?'Laadstop':'Tankstop';
  const chargeMeta=isElectric
    ? `${state.evRangeKm || 325} km actieradius · ${state.plug || 'CCS'}`
    : 'logisch vóór de hotelzone';

  L.polyline(routePoints,{color:'#0d6b6e',weight:5,opacity:.9,lineJoin:'round'}).addTo(routeLayer);
  L.polyline(routePoints,{color:'#bd880e',weight:2,opacity:.85,lineJoin:'round'}).addTo(routeLayer);

  const stops=[
    {kind:'start',label:'✓',coords:routePoints[0],title:short(state.origin)||'Amsterdam',meta:'Vertrekpunt'},
    {kind:'pause',label:'1',coords:[51.0504,6.9603],title:'11:00 Pauze',meta:'WC · koffie · rustig bewegen'},
    {kind:'lunch',label:'2',coords:[50.1109,8.6821],title:'13:00 Lunch',meta:'kindvriendelijk langs de route'},
    {kind:'charge',label:'3',coords:[48.4011,9.9876],title:`15:15 ${chargeTitle}`,meta:chargeMeta},
    {kind:'hotel',label:'4',coords:[47.2692,11.4041],title:'16:30 - 18:00 Hotelzone',meta:'familiekamer · hond welkom'},
    {kind:'end',label:'🏁',coords:routePoints[6],title:short(state.destination)||'Toscane',meta:'Bestemming'}
  ];

  stops.forEach(stop=>{
    L.marker(stop.coords,{icon:createMarkerIcon(stop.kind,stop.label)})
      .bindPopup(`<div class="roadora-popup"><strong>${escapeHtml(stop.title)}</strong><span>${escapeHtml(stop.meta)}</span></div>`)
      .addTo(markerLayer);
  });

  fitRoute();
}

function createMarkerIcon(kind,label){
  return window.L.divIcon({
    className:'',
    html:`<div class="roadora-marker ${kind}">${label}</div>`,
    iconSize:[34,34],
    iconAnchor:[17,17],
    popupAnchor:[0,-18]
  });
}

function fitRoute(){
  if(!map || !window.L)return;
  const bounds=window.L.latLngBounds(routePoints);
  map.fitBounds(bounds,{padding:[42,42],maxZoom:6});
}

function short(value){
  return String(value||'').split(',')[0].trim();
}

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g,char=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#039;',
    '"':'&quot;'
  })[char]);
}
