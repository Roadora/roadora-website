(() => {
  'use strict';

  const BUILD = 'v6.9.0';
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const canRegister = 'serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname));
  let deferredInstallPrompt = null;
  let reloadingForUpdate = false;
  let activeRegistration = null;

  document.documentElement.classList.toggle('pwa-standalone', isStandalone);

  function installButtons(){ return [...document.querySelectorAll('[data-pwa-install], #installRoadoraApp')]; }
  function updateButton(){ return document.getElementById('checkRoadoraUpdate'); }
  function updateStatus(){ return document.getElementById('pwaUpdateStatus'); }

  function cookieBannerVisible(){
    const banner = document.getElementById('cookieBanner');
    if(!banner || banner.classList.contains('hidden')) return false;
    const style = window.getComputedStyle(banner);
    return banner.classList.contains('show') && style.display !== 'none' && style.visibility !== 'hidden';
  }

  function syncNoticeStack(){
    const banner = document.getElementById('cookieBanner');
    const lift = cookieBannerVisible() ? Math.ceil(banner.getBoundingClientRect().height + 12) : 0;
    document.documentElement.style.setProperty('--pwa-stack-lift', `${lift}px`);
  }

  function setUpdateStatus(message,state='ready'){
    const element=updateStatus();
    if(!element) return;
    element.textContent=message;
    element.dataset.state=state;
  }

  function setUpdateButtonBusy(busy){
    const button=updateButton();
    if(!button) return;
    if(busy){
      if(!button.dataset.idleLabel) button.dataset.idleLabel=button.textContent.trim();
      button.disabled=true;
      button.setAttribute('aria-busy','true');
      button.textContent='Controleren…';
    }else{
      button.disabled=false;
      button.removeAttribute('aria-busy');
      if(button.dataset.idleLabel){button.textContent=button.dataset.idleLabel;delete button.dataset.idleLabel;}
    }
  }

  function setInstallButtonVisible(visible){
    installButtons().forEach(button=>{
      button.hidden = !visible;
      button.setAttribute('aria-hidden', String(!visible));
    });
  }

  function ensureNotice(){
    let notice = document.getElementById('pwaNotice');
    if(notice) return notice;
    notice = document.createElement('section');
    notice.id = 'pwaNotice';
    notice.className = 'pwa-notice';
    notice.hidden = true;
    notice.setAttribute('role','status');
    notice.setAttribute('aria-live','polite');
    notice.innerHTML = '<div class="pwa-notice-copy"><strong></strong><span></span></div><div class="pwa-notice-actions"><button type="button" class="btn pwa-notice-dismiss">Later</button><button type="button" class="btn primary pwa-notice-action">Bijwerken</button></div>';
    document.body.appendChild(notice);
    notice.querySelector('.pwa-notice-dismiss')?.addEventListener('click',()=>{ notice.hidden=true; syncNoticeStack(); });
    return notice;
  }

  function showNotice(title, message, actionLabel, onAction, dismissLabel='Later'){
    const notice = ensureNotice();
    notice.querySelector('strong').textContent = title;
    notice.querySelector('span').textContent = message;
    const action = notice.querySelector('.pwa-notice-action');
    const dismiss = notice.querySelector('.pwa-notice-dismiss');
    action.textContent = actionLabel;
    dismiss.textContent = dismissLabel;
    action.onclick = () => { notice.hidden=true; syncNoticeStack(); onAction?.(); };
    notice.hidden = false;
    window.requestAnimationFrame(syncNoticeStack);
  }

  function showIOSInstallHelp(){
    showNotice(
      'Roadora installeren',
      'Tik in Safari op Deel en daarna op Zet op beginscherm.',
      'Begrepen',
      () => {},
      'Sluiten'
    );
  }

  async function requestInstall(){
    if(isStandalone){ setInstallButtonVisible(false); return; }
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      try{ await deferredInstallPrompt.userChoice; }catch(_){ /* browser closed prompt */ }
      deferredInstallPrompt = null;
      setInstallButtonVisible(false);
      return;
    }
    if(isIOS) showIOSInstallHelp();
    else showNotice('Roadora installeren','Open het browsermenu en kies App installeren of Toevoegen aan beginscherm.','Begrepen',()=>{},'Sluiten');
  }

  function offerUpdate(registration){
    if(!registration?.waiting) return false;
    setUpdateStatus(`Roadora ${BUILD} kan worden bijgewerkt.`,'available');
    showNotice(
      'Nieuwe Roadora-versie beschikbaar',
      'Werk de app bij zonder je lokaal opgeslagen roadtrips te verwijderen.',
      'Nu bijwerken',
      () => registration.waiting?.postMessage({type:'SKIP_WAITING'})
    );
    return true;
  }

  async function checkForUpdate({manual=true}={}){
    if(!canRegister){
      setUpdateStatus(`Roadora ${BUILD} is geladen. Updates werken via HTTPS.`,'ready');
      return false;
    }
    setUpdateButtonBusy(true);
    setUpdateStatus('Controleren op een nieuwere Roadora-versie…','checking');
    try{
      const registration=activeRegistration || await navigator.serviceWorker.getRegistration('/');
      if(!registration){
        setUpdateStatus('De app-updatefunctie wordt nog voorbereid. Open Roadora straks opnieuw.','waiting');
        return false;
      }
      activeRegistration=registration;
      await registration.update();
      await new Promise(resolve=>setTimeout(resolve,450));
      if(offerUpdate(registration)) return true;
      setUpdateStatus(`Roadora ${BUILD} is de nieuwste geladen versie.`,'ready');
      if(manual) showNotice('Roadora is bijgewerkt',`Je gebruikt ${BUILD}. Je roadtrips blijven op dit apparaat bewaard.`,'Sluiten',()=>{},'Sluiten');
      return false;
    }catch(error){
      console.warn(`[Roadora ${BUILD}] updatecontrole mislukt`,error);
      const message=navigator.onLine===false?'Geen internetverbinding. Probeer het later opnieuw.':'Updatecontrole niet gelukt. Probeer het straks opnieuw.';
      setUpdateStatus(message,'error');
      if(manual) showNotice('Updatecontrole niet gelukt',message,'Sluiten',()=>{},'Sluiten');
      return false;
    }finally{
      setUpdateButtonBusy(false);
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallButtonVisible(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    setInstallButtonVisible(false);
    setUpdateStatus(`Roadora ${BUILD} is geïnstalleerd.`,'ready');
    showNotice('Roadora is geïnstalleerd','Je kunt Roadora nu vanaf je beginscherm openen.','Sluiten',()=>{},'Sluiten');
  });

  document.addEventListener('DOMContentLoaded', () => {
    installButtons().forEach(button=>button.addEventListener('click', requestInstall));
    updateButton()?.addEventListener('click',()=>checkForUpdate({manual:true}));
    if(isStandalone) setInstallButtonVisible(false);
    else if(isIOS) setInstallButtonVisible(true);
    setUpdateStatus(`Roadora ${BUILD} is geladen.`,'ready');
    const cookieBanner = document.getElementById('cookieBanner');
    if(cookieBanner){
      new MutationObserver(syncNoticeStack).observe(cookieBanner, {attributes:true,attributeFilter:['class','hidden','style']});
    }
    window.addEventListener('resize', syncNoticeStack, {passive:true});
    syncNoticeStack();
  });

  async function registerServiceWorker(){
    if(!canRegister) return;
    try{
      const registration = await navigator.serviceWorker.register('/sw.js', {scope:'/', updateViaCache:'none'});
      activeRegistration=registration;
      if(registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration);

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if(!worker) return;
        setUpdateStatus('Nieuwe appbestanden worden klaargezet…','checking');
        worker.addEventListener('statechange', () => {
          if(worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(registration);
          else if(worker.state === 'activated') setUpdateStatus(`Roadora ${BUILD} is actief.`,'ready');
        });
      });

      setTimeout(() => checkForUpdate({manual:false}), 2500);
    }catch(error){
      console.warn(`[Roadora ${BUILD}] service worker kon niet worden geregistreerd`, error);
      setUpdateStatus('Offline- en updatefunctie kon niet worden gestart.','error');
    }
  }

  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if(reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  window.RoadoraPWA={build:BUILD,requestInstall,checkForUpdate};
  window.addEventListener('load', registerServiceWorker, {once:true});
})();
