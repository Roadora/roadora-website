(function(){
  const cfg = window.RoadoraConfig || { gaMeasurementId: 'G-R0XTKDJ2PH', consentKey: 'roadora_analytics_consent_v1' };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ dataLayer.push(arguments); };
  gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500
  });
  gtag('js', new Date());
  gtag('config', cfg.gaMeasurementId, { anonymize_ip: true, send_page_view: true });

  function setConsent(value){
    try{ localStorage.setItem(cfg.consentKey, value); }catch(e){}
    if(value === 'granted'){
      gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      gtag('config', cfg.gaMeasurementId, { anonymize_ip:true, send_page_view:true });
      gtag('event','roadora_analytics_allowed',{event_category:'consent',event_label:'analytics_allowed'});
    }
    hideBanner();
  }
  function getConsent(){try{return localStorage.getItem(cfg.consentKey)}catch(e){return null}}
  function hideBanner(){const b=document.querySelector('[data-cookie-banner]'); if(b) b.hidden=true;}
  function showBanner(){const b=document.querySelector('[data-cookie-banner]'); if(b) b.hidden=false;}
  document.addEventListener('DOMContentLoaded', function(){
    const consent = getConsent();
    if(consent === 'granted'){
      gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      hideBanner();
    } else if(consent === 'denied') { hideBanner(); } else { showBanner(); }
    document.querySelectorAll('[data-cookie-accept]').forEach(btn=>btn.addEventListener('click',()=>setConsent('granted')));
    document.querySelectorAll('[data-cookie-decline]').forEach(btn=>btn.addEventListener('click',()=>setConsent('denied')));
    document.querySelectorAll('[data-cookie-reset]').forEach(btn=>btn.addEventListener('click',()=>{try{localStorage.removeItem(cfg.consentKey)}catch(e){}; showBanner();}));
  });
  window.RoadoraAnalyticsDebug = {
    getConsent, reset(){try{localStorage.removeItem(cfg.consentKey)}catch(e){}; location.reload();},
    testEvent(){gtag('event','roadora_manual_test',{event_category:'debug',event_label:'manual_test',debug_mode:true});}
  };
})();
