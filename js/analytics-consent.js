/* Roadora analytics consent v2.3 — banner + Consent Mode updates only */
(function(){
  var STORAGE_KEY = 'roadora_analytics_consent_v1';

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };

  function getConsent(){
    try{ return localStorage.getItem(STORAGE_KEY); }catch(e){ return null; }
  }

  function setConsent(value){
    try{ localStorage.setItem(STORAGE_KEY, value); }catch(e){ }
  }

  function grantAnalytics(){
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('event', 'analytics_consent_granted');
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }

  function denyAnalytics(){
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function hideBanner(){
    var banner = document.querySelector('[data-cookie-banner]');
    if(banner){
      banner.hidden = true;
      banner.setAttribute('aria-hidden', 'true');
    }
  }

  function showBanner(){
    var banner = document.querySelector('[data-cookie-banner]');
    if(banner){
      banner.hidden = false;
      banner.removeAttribute('aria-hidden');
    }
  }

  function bindBanner(){
    var consent = getConsent();
    if(consent === 'accepted'){
      grantAnalytics();
      hideBanner();
      return;
    }
    if(consent === 'declined'){
      denyAnalytics();
      hideBanner();
      return;
    }

    showBanner();

    document.querySelectorAll('[data-cookie-accept]').forEach(function(btn){
      btn.addEventListener('click', function(){
        setConsent('accepted');
        grantAnalytics();
        hideBanner();
      });
    });

    document.querySelectorAll('[data-cookie-decline]').forEach(function(btn){
      btn.addEventListener('click', function(){
        setConsent('declined');
        denyAnalytics();
        hideBanner();
      });
    });

    document.querySelectorAll('[data-cookie-reset]').forEach(function(btn){
      btn.addEventListener('click', function(){
        try{ localStorage.removeItem(STORAGE_KEY); }catch(e){ }
        showBanner();
      });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindBanner);
  } else {
    bindBanner();
  }
})();
