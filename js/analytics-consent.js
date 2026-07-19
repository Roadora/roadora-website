/* Roadora analytics consent v2.4 — robust GA4 Consent Mode + realtime events */
(function(){
  var STORAGE_KEY = 'roadora_analytics_consent_v1';
  var GA_ID = 'G-ROXTKDJ2PH';

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };

  function getConsent(){
    try{ return localStorage.getItem(STORAGE_KEY); }catch(e){ return null; }
  }

  function setConsent(value){
    try{ localStorage.setItem(STORAGE_KEY, value); }catch(e){ }
  }

  function sendPageView(){
    window.gtag('config', GA_ID, {
      anonymize_ip: true,
      send_page_view: true,
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }

  function grantAnalytics(){
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted'
    });

    sendPageView();

    window.gtag('event', 'roadora_analytics_allowed', {
      event_category: 'consent',
      event_label: 'analytics_granted',
      debug_mode: true
    });
  }

  function denyAnalytics(){
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted'
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
  }

  window.RoadoraAnalyticsDebug = {
    gaId: GA_ID,
    consent: getConsent,
    grant: function(){ setConsent('accepted'); grantAnalytics(); hideBanner(); },
    reset: function(){ try{ localStorage.removeItem(STORAGE_KEY); }catch(e){} showBanner(); },
    testEvent: function(){
      window.gtag('event', 'roadora_manual_test', {
        event_category: 'debug',
        event_label: 'manual_test',
        debug_mode: true
      });
    }
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindBanner);
  } else {
    bindBanner();
  }
})();
