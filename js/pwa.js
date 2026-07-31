(() => {
  'use strict';

  const BUILD = 'v6.8.1';
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const canRegister = 'serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname));
  let deferredInstallPrompt = null;
  let reloadingForUpdate = false;

  document.documentElement.classList.toggle('pwa-standalone', isStandalone);

  function installButton(){ return document.getElementById('installRoadoraApp'); }

  function setInstallButtonVisible(visible){
    const button = installButton();
    if(!button) return;
    button.hidden = !visible;
    button.setAttribute('aria-hidden', String(!visible));
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
    notice.querySelector('.pwa-notice-dismiss')?.addEventListener('click',()=>{ notice.hidden=true; });
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
    action.onclick = () => { notice.hidden=true; onAction?.(); };
    notice.hidden = false;
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
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallButtonVisible(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    setInstallButtonVisible(false);
    showNotice('Roadora is geïnstalleerd','Je kunt Roadora nu vanaf je beginscherm openen.','Sluiten',()=>{},'Sluiten');
  });

  document.addEventListener('DOMContentLoaded', () => {
    installButton()?.addEventListener('click', requestInstall);
    if(!isStandalone && isIOS) setInstallButtonVisible(true);
  });

  function offerUpdate(registration){
    if(!registration.waiting) return;
    showNotice(
      'Nieuwe Roadora-versie beschikbaar',
      'Werk de app bij zonder je lokaal opgeslagen roadtrips te verwijderen.',
      'Nu bijwerken',
      () => registration.waiting?.postMessage({type:'SKIP_WAITING'})
    );
  }

  async function registerServiceWorker(){
    if(!canRegister) return;
    try{
      const registration = await navigator.serviceWorker.register('/sw.js', {scope:'/', updateViaCache:'none'});
      if(registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration);

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if(!worker) return;
        worker.addEventListener('statechange', () => {
          if(worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(registration);
        });
      });

      // Check for a newer build after the current page is fully loaded.
      setTimeout(() => registration.update().catch(()=>{}), 2500);
    }catch(error){
      console.warn(`[Roadora ${BUILD}] service worker kon niet worden geregistreerd`, error);
    }
  }

  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if(reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener('load', registerServiceWorker, {once:true});
})();
