/* Roadora analytics consent v2.2 — Google Consent Mode v2 */
(function(){
  var MEASUREMENT_ID = 'G-ROXTKDJ2PH';
  var STORAGE_KEY = 'roadora_analytics_consent_v1';
  var tagReady = false;

  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  /* Consent Mode v2: tag is findable, storage stays denied until consent. */
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  function loadGoogleTag(){
    if(tagReady || !MEASUREMENT_ID || !/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)) return;
    tagReady = true;
    gtag('js', new Date());
    gtag('config', MEASUREMENT_ID, {
      anonymize_ip: true,
      send_page_view: true
    });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  function getConsent(){
    try{ return localStorage.getItem(STORAGE_KEY); }catch(e){ return null; }
  }

  function setConsent(value){
    try{ localStorage.setItem(STORAGE_KEY, value); }catch(e){ }
  }

  function grantAnalytics(){
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    loadGoogleTag();
    gtag('event', 'analytics_consent_granted');
  }

  function denyAnalytics(){
    gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    loadGoogleTag();
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
    /* Load tag on every page for GA tester and Consent Mode, but denied by default. */
    loadGoogleTag();

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

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindBanner);
  else bindBanner();
})();
