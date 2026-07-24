import { $$ } from './dom.js';
export function initNavigation(){
  $$('.rail-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.rail-btn').forEach(item=>item.classList.remove('active'));btn.classList.add('active');
    const target=btn.dataset.target; if(target){document.querySelector(target)?.scrollIntoView({behavior:'smooth',block:'start'});}
  }));
}
