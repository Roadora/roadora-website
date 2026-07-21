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
    {title:'Restaurants',meta:Number(state.children)>0?'geschikt voor gezinnen rond aankomst':'rond je overnachting'},
    {title:state.vehicle==='electric'?'Laden':'Tanken',meta:`op basis van ${state.vehicleRangeKm||325} km rijbereik`},
    {title:'Uitjes',meta:state.pet==='dog'?'wandelplek of korte stop':'korte stop zonder omweg'},
    {title:'WC',meta:'korte noodstop met parkeren en koffie'},
    {title:'Pauzeplek',meta:'rustige stop rond je volgende rijblok'}
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
      {title:'City Hotel Ulm',meta:`Past deels · huisdieren onbekend · +3 min omrijden`},
      {title:'Hotel Routeblick',meta:`Familiekamer mogelijk · parkeren · +9 min`},
      {title:'Landhotel Süd',meta:`Rustig gelegen · ${dog?'hond welkom · ':''}+12 min`},
      {title:'Motel Transit',meta:'Snel langs de route · 24/7 check-in'},
      {title:'Familiehotel Park',meta:children?'Familiekamer · speeltuin · ontbijt':'Comfortabel · ontbijt'},
      {title:'Hotel met laadpunt',meta:ev?'Laadpunt dichtbij · goede match':'Parkeren · ontbijt'}
    ],
    restaurants:[
      {title:'Raststätte Frankenwald',meta:`Beste match · WC · ${children?'gezinsvriendelijk · ':''}+2 min`},
      {title:'Trattoria Al Lago',meta:'Rond je overnachting · diner · +7 min'},
      {title:'Bistro Südroute',meta:'Snelle stop · weinig omrijden'},
      {title:'Familierestaurant Route 7',meta:children?'Kindermenu · WC · +5 min':'Diner langs route'},
      {title:'Autohof Grill',meta:'Snel eten · parkeren · weinig omrijden'},
      {title:'Pizzeria Centrum',meta:'Rond je overnachting · avondeten'},
      {title:'Koffie & Sandwich stop',meta:'Korte pauze · lichte lunch'},
      {title:'Restaurant met terras',meta:dog?'Hond welkom op terras':'Rustige plek'}
    ],
    charging:[
      {title:'IONITY Ulm-West',meta:`Beste match · binnen ${range} km rijbereik · eten erbij`},
      {title:'EnBW Schnellladepark',meta:'Snelladen · WC · +4 min'},
      {title:'Hotel-laadpunt in zone',meta:'Handig bij overnachting · beschikbaarheid checken'},
      {title:'Fastned Corridor',meta:'Snelladen · langs route'},
      {title:'Tesla Supercharger omgeving',meta:'Snel laden · horeca dichtbij'},
      {title:'Allego laadplein',meta:'Meerdere laders · +6 min'},
      {title:'Stadslaadpunt rond overnachting',meta:'Goed voor avondladen'},
      {title:'Reserve laadstop',meta:'Alternatief binnen veilige marge'}
    ],
    fuel:[
      {title:'Shell Autohof Süd',meta:`Beste match · tanken rond ${Math.round(range*.78)} km · WC`},
      {title:'TotalEnergies Routepunt',meta:'24/7 · restaurant erbij'},
      {title:'Aral Raststation',meta:'Weinig omrijden · snel verder'},
      {title:'Esso Route Service',meta:'Ruime parkeerplaats · WC'},
      {title:'OMV Autohof',meta:'Langs route · shop · koffie'},
      {title:'BP Tankstop Zuid',meta:'Reserve stop · +6 min'},
      {title:'Tankstation rond overnachting',meta:'Handig voor vertrek morgen'},
      {title:'Grensroute tankstop',meta:'Logisch vóór lange etappe'}
    ],
    activities:[
      {title:'Korte wandeling bij rivier',meta:`Beste match · ${dog?'hondvriendelijk · ':''}30-45 min`},
      {title:'Speeltuin langs route',meta:children?'Kindvriendelijk · weinig omrijden':'Korte pauzeplek'},
      {title:'Uitzichtpunt Alpenrand',meta:'Foto-stop · 20 min omrijden'},
      {title:'Kasteel langs route',meta:'Korte bezichtiging · 60 min'},
      {title:'Meerwandeling',meta:dog?'Hondvriendelijk · pauzeplek':'Rustige pauze'},
      {title:'Speelbos bij afrit',meta:children?'Kindvriendelijk · korte omweg':'Groene stop'},
      {title:'Historisch centrum',meta:'Rond je overnachting · avondwandeling'},
      {title:'Panorama parkeerplaats',meta:'Foto-stop · weinig omrijden'}
    ],
    wc:[
      {title:'Rustige WC-stop A6',meta:'Nu nodig · weinig omrijden'},
      {title:'Rastplatz met koffie',meta:'WC · koffie · parkeren'},
      {title:'Familie-stop langs route',meta:children?'WC · verschoonplek · speeltuin':'WC · korte pauze'},
      {title:'WC bij tankstation',meta:'Nu nodig · 24/7'},
      {title:'Raststätte met speeltuin',meta:children?'WC · speeltuin · koffie':'WC · koffie'},
      {title:'Parkeerplaats korte stop',meta:'Snel stoppen · weinig omrijden'},
      {title:'Restaurant-WC langs route',meta:'Combineer met lunch'},
      {title:'Reserve WC-stop',meta:'Alternatief op route'}
    ]
  };
  return sets[category] || sets.hotels;
}
