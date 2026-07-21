export const CATEGORIES = [
  {id:'hotels',label:'Hotels'},
  {id:'restaurants',label:'Restaurants'},
  {id:'charging',label:'Laden'},
  {id:'fuel',label:'Tanken'},
  {id:'activities',label:'Uitjes'},
  {id:'wc',label:'WC'}
];
export function getRecommendations(state){
  const hotelTags=[];
  if(Number(state.children)>0)hotelTags.push('Familiekamer');
  if(state.pet==='dog')hotelTags.push('Huisdieren toegestaan');
  if(state.vehicle==='electric')hotelTags.push('Laadpunt dichtbij');
  if(state.preferences?.includes('parking'))hotelTags.push('Parkeren');
  return [
    {title:'Hotels',meta:`12 passend · ${hotelTags.slice(0,2).join(' + ') || 'langs je route'}`},
    {title:'Restaurants',meta:Number(state.children)>0?'geschikt voor gezinnen rond aankomst':'rond je hotelzone'},
    {title:state.vehicle==='electric'?'Laden':'Tanken',meta:`op basis van ${state.vehicleRangeKm||325} km rijbereik`},
    {title:'Uitjes',meta:state.pet==='dog'?'wandelplek of korte stop':'korte stop zonder omweg'}
  ];
}
export function getAllStops(state,category='hotels'){
  const children=Number(state.children)>0;
  const dog=state.pet==='dog';
  const ev=state.vehicle==='electric';
  const range=Number(state.vehicleRangeKm)||325;
  const sets={
    hotels:[
      {title:'Hotel Alpenblick',meta:`Beste match · ${children?'familiekamer · ':''}${dog?'hond toegestaan · ':''}+8 min omrijden`},
      {title:'Gasthof Route Süd',meta:`Goed alternatief · parkeren · +5 min omrijden`},
      {title:'City Hotel Ulm',meta:`Past deels · huisdieren onbekend · +3 min omrijden`}
    ],
    restaurants:[
      {title:'Raststätte Frankenwald',meta:`Beste match · WC · ${children?'gezinsvriendelijk · ':''}+2 min`},
      {title:'Trattoria Al Lago',meta:'Rond hotelzone · diner · +7 min'},
      {title:'Bistro Südroute',meta:'Snelle stop · weinig omrijden'}
    ],
    charging:[
      {title:'IONITY Ulm-West',meta:`Beste match · binnen ${range} km rijbereik · eten erbij`},
      {title:'EnBW Schnellladepark',meta:'Snelladen · WC · +4 min'},
      {title:'Hotel-laadpunt in zone',meta:'Handig bij overnachting · beschikbaarheid checken'}
    ],
    fuel:[
      {title:'Shell Autohof Süd',meta:`Beste match · tanken rond ${Math.round(range*.78)} km · WC`},
      {title:'TotalEnergies Routepunt',meta:'24/7 · restaurant erbij'},
      {title:'Aral Raststation',meta:'Weinig omrijden · snel verder'}
    ],
    activities:[
      {title:'Korte wandeling bij rivier',meta:`Beste match · ${dog?'hondvriendelijk · ':''}30-45 min`},
      {title:'Speeltuin langs route',meta:children?'Kindvriendelijk · weinig omrijden':'Korte pauzeplek'},
      {title:'Uitzichtpunt Alpenrand',meta:'Foto-stop · 20 min omrijden'}
    ],
    wc:[
      {title:'Rustige WC-stop A6',meta:'Nu nodig · weinig omrijden'},
      {title:'Rastplatz met koffie',meta:'WC · koffie · parkeren'},
      {title:'Familie-stop langs route',meta:children?'WC · verschoonplek · speeltuin':'WC · korte pauze'}
    ]
  };
  return sets[category] || sets.hotels;
}
