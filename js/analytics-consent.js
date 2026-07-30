import { CONFIG } from './config.js';
import { getConsent, setConsent } from './storage.js';
import { $ } from './dom.js';

export function initConsent(){
  const banner=$('#cookieBanner');
  if(!banner)return;
  const consent=getConsent();
  if(consent){banner.classList.add('hidden');if(consent==='accepted')loadAnalytics();return;}
  $('#acceptCookies')?.addEventListener('click',()=>{setConsent('accepted');banner.classList.add('hidden');loadAnalytics();});
  $('#rejectCookies')?.addEventListener('click',()=>{setConsent('rejected');banner.classList.add('hidden');});
}
function loadAnalytics(){
  if(window.__roadoraGaLoaded)return; window.__roadoraGaLoaded=true;
  const script=document.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${CONFIG.gaMeasurementId}`;document.head.appendChild(script);
  window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
  gtag('js',new Date());gtag('config',CONFIG.gaMeasurementId,{anonymize_ip:true});
}
