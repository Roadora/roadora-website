(function(){
  const header = document.querySelector('[data-header]');
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  function onScroll(){ if(header) header.classList.toggle('is-scrolled', window.scrollY > 20); }
  toggle && toggle.addEventListener('click', function(){ nav && nav.classList.toggle('open'); });
  document.addEventListener('click', function(event){
    if(!nav || !toggle) return;
    if(nav.contains(event.target) || toggle.contains(event.target)) return;
    nav.classList.remove('open');
  });
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();
