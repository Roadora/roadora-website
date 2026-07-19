/* Roadora analytics consent v2.1 — banner visible by default fallback */
(function(){
  var MEASUREMENT_ID = 'G-ROXTKDJ2PH';
  var STORAGE_KEY = 'roadora_analytics_consent_v1';
  var loaded = false;

  function injectAnalytics(){
    if(loaded || !MEASUREMENT_ID || !/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    gtag('js', new Date());
    gtag('config', MEASUREMENT_ID, { anonymize_ip: true });
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
    if(consent === 'accepted'){ injectAnalytics(); hideBanner(); return; }
    if(consent === 'declined'){ hideBanner(); return; }
    showBanner();

    document.querySelectorAll('[data-cookie-accept]').forEach(function(btn){
      btn.addEventListener('click', function(){
        setConsent('accepted');
        injectAnalytics();
        hideBanner();
      });
    });
    document.querySelectorAll('[data-cookie-decline]').forEach(function(btn){
      btn.addEventListener('click', function(){
        setConsent('declined');
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
