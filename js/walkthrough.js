document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-step-link]').forEach(link=>{
    link.addEventListener('click',e=>{
      const id=link.getAttribute('href');
      if(id&&id.startsWith('#')){e.preventDefault();document.querySelector(id)?.scrollIntoView({behavior:'smooth',block:'start'});}
    });
  });
});
