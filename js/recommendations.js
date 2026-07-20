export function getRecommendations(state){
  const hotelTags=[];
  if(Number(state.children)>0)hotelTags.push('Familiekamer');
  if(state.pet==='dog')hotelTags.push('Huisdieren toegestaan');
  if(state.vehicle==='electric')hotelTags.push('Laadpunt dichtbij');
  if(state.preferences?.includes('parking'))hotelTags.push('Parkeren');
  return [
    {icon:'🏨',title:'Hotels',meta:`12 passend · ${hotelTags.slice(0,2).join(' + ') || 'langs je route'}`},
    {icon:'🍝',title:'Restaurants',meta:Number(state.children)>0?'kindvriendelijk rond aankomst':'rond je hotelzone'},
    {icon:state.vehicle==='electric'?'⚡':'⛽',title:state.vehicle==='electric'?'Laden':'Tanken',meta:state.vehicle==='electric'?`binnen ${state.evRangeKm||325} km bereik`:'logisch langs de route'},
    {icon:'📸',title:'Uitjes',meta:state.pet==='dog'?'wandelplek of korte stop':'korte stop zonder omweg'}
  ];
}
