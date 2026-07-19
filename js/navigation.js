document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.querySelector('[data-nav-toggle]');
  const nav=document.querySelector('[data-nav]');
  if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});}
});
