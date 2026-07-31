(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';
  const mobileMedia = window.matchMedia(MOBILE_QUERY);
  const body = document.body;
  const html = document.documentElement;

  const viewToTab = {
    stops: 'stopsTab',
    planning: 'planningTab',
    more: 'roadtripTab'
  };
  const tabToView = Object.fromEntries(Object.entries(viewToTab).map(([view, tab]) => [tab, view]));
  const viewTitles = {
    route: 'Route instellen',
    stops: 'Stops onderweg',
    planning: 'Planning',
    more: 'Roadtrips & meer'
  };

  let currentView = 'route';
  let mapPickReturnView = '';
  let routeWasEmpty = true;
  let dragState = null;
  let viewportTimer = 0;

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  function isMobile(){ return mobileMedia.matches; }
  function shellOpen(){ return body.classList.contains('mobile-sheet-open'); }
  function homeOpen(){ return body.classList.contains('mobile-home-open'); }
  function activeSheet(){ return $('.mobile-app-sheet.is-active'); }
  function sheetScroller(sheet = activeSheet()){
    if(!sheet) return null;
    return sheet.matches('.left-panel') ? sheet.querySelector(':scope > .panel-stack') : sheet.querySelector(':scope > .tab-panel.active');
  }

  function updateVisualViewport(){
    if(!isMobile()) return;
    const viewport = window.visualViewport;
    const height = Math.max(320, Math.round(viewport?.height || window.innerHeight));
    html.style.setProperty('--mobile-visual-height', `${height}px`);
    const covered = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
    body.classList.toggle('mobile-keyboard-open', covered > 120);
  }

  function scheduleViewportUpdate(){
    window.clearTimeout(viewportTimer);
    updateVisualViewport();
    viewportTimer = window.setTimeout(updateVisualViewport, 120);
  }

  function resetSheetScroll(){
    const scroller = sheetScroller();
    if(scroller) scroller.scrollTop = 0;
  }

  function dispatchMapResize(){
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 220);
  }

  function updateNav(view = currentView){
    $$('#mobileAppNav [data-mobile-view]').forEach(button => {
      const active = button.dataset.mobileView === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  function updateRightSheetTitle(view){
    const title = $('#mobileRightSheetTitle');
    if(title) title.textContent = viewTitles[view] || 'Roadora';
  }

  function closeSheet({keepView = true} = {}){
    const focused = document.activeElement;
    if(focused?.closest?.('.mobile-app-sheet')) focused.blur();
    body.classList.remove('mobile-sheet-open', 'mobile-sheet-expanded');
    body.removeAttribute('data-mobile-sheet');
    $$('.mobile-app-sheet').forEach(sheet => sheet.classList.remove('is-active'));
    $('#mobileSheetScrim')?.setAttribute('aria-hidden', 'true');
    if(!keepView) currentView = 'route';
    updateNav();
    dispatchMapResize();
  }

  function activateExistingTab(tabId){
    const button = $(`.tab[data-tab="${tabId}"]`);
    if(button && !button.classList.contains('active')) button.click();
  }

  function openView(view, options = {}){
    if(!isMobile()) return;
    const {expand = false, toggle = false, resetScroll = false} = options;
    closeHome({silent:true});

    if(toggle && currentView === view && shellOpen()){
      closeSheet();
      return;
    }

    currentView = view;
    updateNav(view);
    body.classList.toggle('mobile-sheet-expanded', Boolean(expand));
    body.classList.add('mobile-sheet-open');
    $('#mobileSheetScrim')?.setAttribute('aria-hidden', 'false');

    if(view === 'route'){
      body.dataset.mobileSheet = 'route';
      $('.left-panel')?.classList.add('is-active');
      $('.right-panel')?.classList.remove('is-active');
    }else{
      const tabId = viewToTab[view] || 'roadtripTab';
      activateExistingTab(tabId);
      updateRightSheetTitle(view);
      body.dataset.mobileSheet = 'right';
      $('.right-panel')?.classList.add('is-active');
      $('.left-panel')?.classList.remove('is-active');
    }
    scheduleViewportUpdate();
    if(resetScroll) window.requestAnimationFrame(resetSheetScroll);
    dispatchMapResize();
  }

  function syncHeader(){
    const title = $('#mobileShellTitle');
    const meta = $('#mobileShellMeta');
    if(!title || !meta) return;

    const routeTitle = $('#mapRouteTitle')?.textContent?.trim() || '';
    const day = $('#overviewDayPill')?.textContent?.trim() || 'Dag 1';
    const metrics = $$('.map-summary .summary-row span').map(item => item.textContent.trim()).filter(Boolean);
    const hasRoute = routeTitle && !/^nog geen route/i.test(routeTitle);

    title.textContent = hasRoute ? day : 'Roadora';
    meta.textContent = hasRoute
      ? metrics.slice(0, 2).filter(value => value !== '—').join(' • ') || routeTitle
      : 'Jouw roadtrip planner';

    const continueButton = $('#mobileContinueTrip');
    if(continueButton){
      continueButton.hidden = !hasRoute;
      continueButton.textContent = hasRoute ? `Verder met ${day}` : 'Verder met huidige roadtrip';
    }
    routeWasEmpty = !hasRoute;
  }

  function syncInstallButton(){
    const source = $('#installRoadoraApp');
    const target = $('#mobileInstallApp');
    if(!source || !target) return;
    target.hidden = source.hidden;
  }

  function syncRecentTrips(){
    const source = $('#savedTrips');
    const target = $('#mobileRecentTrips');
    if(!source || !target) return;
    target.innerHTML = source.innerHTML;
    const cards = [...target.querySelectorAll('.trip-card')];
    cards.slice(3).forEach(card => card.remove());
    if(cards.length > 3){
      // Defensive; cards beyond three are removed above in browsers where the NodeList is live.
      [...target.querySelectorAll('.trip-card')].slice(3).forEach(card => card.remove());
    }
  }

  function shouldOpenHomeInitially(){
    const params = new URLSearchParams(location.search);
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
    return standalone || params.get('source') === 'pwa';
  }

  function openHome(){
    if(!isMobile()) return;
    closeSheet();
    syncRecentTrips();
    syncHeader();
    syncInstallButton();
    body.classList.add('mobile-home-open');
    $('#mobileAppHome')?.setAttribute('aria-hidden', 'false');
    updateNav('route');
  }

  function closeHome({silent = false} = {}){
    body.classList.remove('mobile-home-open');
    $('#mobileAppHome')?.setAttribute('aria-hidden', 'true');
    if(!silent) updateNav();
  }

  function toggleSheetSize(){
    if(!shellOpen()) return;
    body.classList.toggle('mobile-sheet-expanded');
    dispatchMapResize();
  }

  function bindSheetDrag(handle){
    handle.addEventListener('pointerdown', event => {
      if(!isMobile() || event.button > 0) return;
      dragState = {startY:event.clientY, lastY:event.clientY, pointerId:event.pointerId};
      handle.setPointerCapture?.(event.pointerId);
    });
    handle.addEventListener('pointermove', event => {
      if(!dragState || dragState.pointerId !== event.pointerId) return;
      dragState.lastY = event.clientY;
    });
    const finish = event => {
      if(!dragState || dragState.pointerId !== event.pointerId) return;
      const distance = dragState.lastY - dragState.startY;
      dragState = null;
      if(distance > 70) closeSheet();
      else if(distance < -55) body.classList.add('mobile-sheet-expanded');
      else toggleSheetSize();
    };
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', () => { dragState = null; });
  }

  function syncFromExistingTabs(){
    if(!isMobile() || homeOpen() || body.dataset.mobileSheet === 'route') return;
    const active = $('.tab-panel.active');
    const view = tabToView[active?.id];
    if(!view) return;
    currentView = view;
    updateRightSheetTitle(view);
    updateNav(view);
  }

  function bind(){
    $('#mobileAppNav')?.addEventListener('click', event => {
      const button = event.target.closest('[data-mobile-view]');
      if(!button) return;
      openView(button.dataset.mobileView, {toggle:true});
    });

    $('#mobileSheetScrim')?.addEventListener('click', () => closeSheet());
    $$('[data-mobile-sheet-close]').forEach(button => button.addEventListener('click', () => closeSheet()));
    $$('[data-mobile-sheet-toggle]').forEach(button => bindSheetDrag(button));
    $$('.mobile-sheet-chrome>strong').forEach(title => {
      title.setAttribute('role','button');
      title.setAttribute('tabindex','0');
      title.setAttribute('aria-label','Paneel vergroten of verkleinen');
      title.addEventListener('click', toggleSheetSize);
      title.addEventListener('keydown', event => {
        if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); toggleSheetSize(); }
      });
    });

    $('#mobileHeaderMore')?.addEventListener('click', () => openView('more', {toggle:true}));
    $('.brand')?.addEventListener('click', event => {
      if(!isMobile()) return;
      event.preventDefault();
      openHome();
    });

    $('.mobile-new-roadtrip')?.addEventListener('click', () => {
      $('#newRoadtrip')?.click();
      closeHome({silent:true});
      window.setTimeout(() => openView('route', {expand:true, resetScroll:true}), 80);
    });
    $('#mobileContinueTrip')?.addEventListener('click', () => {
      closeHome({silent:true});
      openView('planning');
    });
    $('#mobileOpenLibrary')?.addEventListener('click', () => openView('more', {expand:true}));
    $('#mobileInstallApp')?.addEventListener('click', () => $('#installRoadoraApp')?.click());

    $('#mobileRecentTrips')?.addEventListener('click', event => {
      const action = event.target.closest('[data-trip-action]');
      if(action?.dataset.tripAction === 'open'){
        window.setTimeout(() => {
          closeHome({silent:true});
          closeSheet();
          syncHeader();
        }, 160);
      }
    });

    document.addEventListener('focusin', event => {
      if(!isMobile()) return;
      const field = event.target.closest?.('.mobile-app-sheet input, .mobile-app-sheet select, .mobile-app-sheet textarea, .mobile-app-sheet [contenteditable="true"]');
      if(!field) return;
      body.classList.add('mobile-sheet-expanded');
      scheduleViewportUpdate();
      window.setTimeout(() => field.scrollIntoView({block:'center', inline:'nearest', behavior:'smooth'}), 160);
    });

    window.visualViewport?.addEventListener('resize', scheduleViewportUpdate);
    window.visualViewport?.addEventListener('scroll', scheduleViewportUpdate);
    window.addEventListener('orientationchange', scheduleViewportUpdate);

    document.addEventListener('keydown', event => {
      if(event.key !== 'Escape' || !isMobile()) return;
      if(homeOpen()) closeHome();
      else if(shellOpen()) closeSheet();
    });

    $('#planRoute')?.addEventListener('click', () => {
      const title = $('#mapRouteTitle');
      if(!title) return;
      const observer = new MutationObserver(() => {
        const text = title.textContent.trim();
        if(text && !/^nog geen route/i.test(text)){
          observer.disconnect();
          window.setTimeout(() => closeSheet(), 120);
        }
      });
      observer.observe(title, {childList:true,subtree:true,characterData:true});
      window.setTimeout(() => observer.disconnect(), 15000);
    });

    const savedTrips = $('#savedTrips');
    if(savedTrips) new MutationObserver(syncRecentTrips).observe(savedTrips, {childList:true,subtree:true,characterData:true});

    const install = $('#installRoadoraApp');
    if(install) new MutationObserver(syncInstallButton).observe(install, {attributes:true,attributeFilter:['hidden','aria-hidden']});

    const routeSummary = $('.map-summary');
    if(routeSummary) new MutationObserver(syncHeader).observe(routeSummary, {childList:true,subtree:true,characterData:true});

    const tabContainer = $('.right-panel');
    if(tabContainer) new MutationObserver(syncFromExistingTabs).observe(tabContainer, {attributes:true,subtree:true,attributeFilter:['class']});

    new MutationObserver(() => {
      if(!isMobile()) return;
      const picking = body.classList.contains('map-pick-active');
      if(picking){
        if(shellOpen()) mapPickReturnView = currentView;
        closeSheet();
      }else if(mapPickReturnView){
        const returnView = mapPickReturnView;
        mapPickReturnView = '';
        window.setTimeout(() => openView(returnView), 100);
      }
    }).observe(body, {attributes:true,attributeFilter:['class']});

    mobileMedia.addEventListener?.('change', event => {
      if(event.matches){
        html.classList.add('roadora-mobile-shell');
        updateVisualViewport();
        syncHeader();
        syncRecentTrips();
        syncInstallButton();
        if(shouldOpenHomeInitially()) openHome();
        else if(routeWasEmpty) openView('route');
      }else{
        html.classList.remove('roadora-mobile-shell');
        closeHome({silent:true});
        closeSheet();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bind();
    syncHeader();
    syncRecentTrips();
    syncInstallButton();
    syncFromExistingTabs();

    if(isMobile()){
      html.classList.add('roadora-mobile-shell');
      updateVisualViewport();
      currentView = 'route';
      updateNav();
      window.setTimeout(() => {
        syncHeader();
        if(shouldOpenHomeInitially()) openHome();
        else if(routeWasEmpty) openView('route');
      }, 420);
    }
  }, {once:true});
})();
