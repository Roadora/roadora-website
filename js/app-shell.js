(() => {
  'use strict';

  const APP_SHELL_QUERY = '(max-width: 760px), (max-width: 1024px) and (pointer: coarse), (display-mode: standalone) and (pointer: coarse)';
  const mobileMedia = window.matchMedia(APP_SHELL_QUERY);
  const standaloneMedia = window.matchMedia('(display-mode: standalone)');
  const coarseMedia = window.matchMedia('(pointer: coarse)');
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
  let mapPickingState = body.classList.contains('map-pick-active');
  let routeWasEmpty = true;
  let dragState = null;
  let viewportTimer = 0;
  let stableViewportHeight = 0;
  let lastSheetTrigger = null;

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  function isStandalone(){ return standaloneMedia.matches || navigator.standalone === true; }
  function isMobile(){ return mobileMedia.matches || (isStandalone() && coarseMedia.matches); }
  function shellOpen(){ return body.classList.contains('mobile-sheet-open'); }
  function homeOpen(){ return body.classList.contains('mobile-home-open'); }
  function activeSheet(){ return $('.mobile-app-sheet.is-active'); }
  function activeEditable(){
    const element = document.activeElement;
    return element?.closest?.('.mobile-app-sheet input, .mobile-app-sheet select, .mobile-app-sheet textarea, .mobile-app-sheet [contenteditable="true"]') || null;
  }
  function sheetScroller(sheet = activeSheet()){
    if(!sheet) return null;
    return sheet.matches('.left-panel') ? sheet.querySelector(':scope > .panel-stack') : sheet.querySelector(':scope > .tab-panel.active');
  }

  function setInert(element, inert){
    if(!element) return;
    element.toggleAttribute('inert', Boolean(inert));
  }

  function setAccessibleHidden(element, hidden){
    if(!element) return;
    element.setAttribute('aria-hidden', String(Boolean(hidden)));
    setInert(element, hidden);
  }

  function syncAccessibility(){
    const mobile = isMobile();
    const home = $('#mobileAppHome');
    const planner = $('#planner');
    const mapStage = $('.map-stage');
    const sheets = $$('.mobile-app-sheet');

    if(!mobile){
      planner?.removeAttribute('aria-hidden');
      setInert(planner, false);
      mapStage?.removeAttribute('aria-hidden');
      setInert(mapStage, false);
      setAccessibleHidden(home, true);
      sheets.forEach(sheet => {
        sheet.removeAttribute('aria-hidden');
        sheet.removeAttribute('role');
        sheet.removeAttribute('aria-modal');
        setInert(sheet, false);
      });
      return;
    }

    const showingHome = homeOpen();
    setAccessibleHidden(home, !showingHome);
    if(planner){
      planner.setAttribute('aria-hidden', String(showingHome));
      setInert(planner, showingHome);
    }

    const open = shellOpen() && !showingHome;
    setAccessibleHidden(mapStage, open);
    sheets.forEach(sheet => {
      const active = open && sheet.classList.contains('is-active');
      setAccessibleHidden(sheet, !active);
      if(active){
        sheet.setAttribute('role', 'dialog');
        sheet.setAttribute('aria-modal', 'true');
      }else{
        sheet.removeAttribute('role');
        sheet.removeAttribute('aria-modal');
      }
    });
  }

  function focusSoon(element){
    if(!element) return;
    window.requestAnimationFrame(() => window.setTimeout(() => {
      if(element.isConnected && !element.closest('[inert]')) element.focus({preventScroll:true});
    }, 30));
  }

  function updateVisualViewport(){
    if(!isMobile()) return;
    const viewport = window.visualViewport;
    const height = Math.max(240, Math.round(viewport?.height || window.innerHeight));
    const focused = Boolean(activeEditable());

    if(!stableViewportHeight) stableViewportHeight = Math.max(height, Math.round(window.innerHeight || height));
    if(!focused && height > stableViewportHeight) stableViewportHeight = height;

    html.style.setProperty('--mobile-visual-height', `${height}px`);
    const covered = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
    const reduced = Math.max(0, stableViewportHeight - height);
    const keyboardOpen = focused && (body.classList.contains('mobile-input-focused') || covered > 80 || reduced > 80);
    body.classList.toggle('mobile-keyboard-open', keyboardOpen);
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
      if(active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function updateRightSheetTitle(view){
    const title = $('#mobileRightSheetTitle');
    if(title) title.textContent = viewTitles[view] || 'Roadora';
  }

  function closeSheet({keepView = true, restoreFocus = true} = {}){
    const focused = document.activeElement;
    const hadSheetState = shellOpen()
      || body.classList.contains('mobile-sheet-expanded')
      || body.classList.contains('mobile-input-focused')
      || body.classList.contains('mobile-keyboard-open')
      || Boolean(body.dataset.mobileSheet)
      || $$('.mobile-app-sheet').some(sheet => sheet.classList.contains('is-active'));

    if(focused?.closest?.('.mobile-app-sheet')) focused.blur();
    if(hadSheetState){
      body.classList.remove('mobile-sheet-open', 'mobile-sheet-expanded', 'mobile-input-focused', 'mobile-keyboard-open');
      body.removeAttribute('data-mobile-sheet');
      $$('.mobile-app-sheet').forEach(sheet => sheet.classList.remove('is-active'));
      $('#mobileSheetScrim')?.setAttribute('aria-hidden', 'true');
      if(!keepView) currentView = 'route';
      updateNav();
      dispatchMapResize();
    }
    syncAccessibility();

    const trigger = lastSheetTrigger;
    if(restoreFocus && !body.classList.contains('map-pick-active') && trigger?.isConnected){
      focusSoon(trigger);
    }
  }

  function activateExistingTab(tabId){
    const button = $(`.tab[data-tab="${tabId}"]`);
    if(button && !button.classList.contains('active')) button.click();
  }

  function openView(view, options = {}){
    if(!isMobile()) return;
    const {expand = false, toggle = false, resetScroll = false, trigger = null, focus = true} = options;
    if(trigger) lastSheetTrigger = trigger;
    closeHome({silent:true});

    if(toggle && currentView === view && shellOpen()){
      closeSheet();
      return;
    }

    currentView = view;
    updateNav(view);
    body.classList.toggle('mobile-sheet-expanded', Boolean(expand || view === 'stops'));
    body.classList.add('mobile-sheet-open');
    $('#mobileSheetScrim')?.setAttribute('aria-hidden', 'false');

    let sheet = null;
    if(view === 'route'){
      body.dataset.mobileSheet = 'route';
      sheet = $('.left-panel');
      sheet?.classList.add('is-active');
      $('.right-panel')?.classList.remove('is-active');
    }else{
      const tabId = viewToTab[view] || 'roadtripTab';
      activateExistingTab(tabId);
      updateRightSheetTitle(view);
      body.dataset.mobileSheet = 'right';
      sheet = $('.right-panel');
      sheet?.classList.add('is-active');
      $('.left-panel')?.classList.remove('is-active');
    }
    syncAccessibility();
    scheduleViewportUpdate();
    if(resetScroll) window.requestAnimationFrame(resetSheetScroll);
    if(focus) focusSoon(sheet?.querySelector('.mobile-sheet-chrome>strong'));
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
    const routeLoading = body.classList.contains('route-loading');

    title.textContent = hasRoute ? day : 'Roadora';
    meta.textContent = routeLoading
      ? 'Route berekenen…'
      : hasRoute
        ? metrics.slice(0, 2).filter(value => value !== '—').join(' • ') || routeTitle
        : 'Jouw roadtrip planner';

    const continueButton = $('#mobileContinueTrip');
    if(continueButton){
      continueButton.hidden = !hasRoute;
      continueButton.textContent = hasRoute ? `Verder met ${day}` : 'Verder met huidige roadtrip';
    }
    routeWasEmpty = !hasRoute;
  }

  function syncBuildInfo(){
    const build = window.ROADORA_BUILD || body.dataset.roadoraBuild || 'v6.9.1';
    ['mobileBuildVersion','mobileHomeVersion'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=build;});
  }

  function syncInstallButton(){
    const source = $('#installRoadoraApp');
    if(!source) return;
    $$('[data-pwa-install]').forEach(button => {
      if(button === source) return;
      button.hidden = source.hidden;
      button.setAttribute('aria-hidden', String(source.hidden));
    });
  }

  function syncRecentTrips(){
    const source = $('#savedTrips');
    const target = $('#mobileRecentTrips');
    if(!source || !target) return;
    target.innerHTML = source.innerHTML;
    const cards = [...target.querySelectorAll('.trip-card')];
    cards.slice(3).forEach(card => card.remove());
    target.querySelectorAll('[data-trip-action="delete"]').forEach(button => button.remove());
    target.querySelectorAll('.trip-card-actions').forEach(actions => {
      if(!actions.children.length) actions.remove();
    });
  }

  function shouldOpenHomeInitially(){
    const params = new URLSearchParams(location.search);
    return isStandalone() || params.get('source') === 'pwa';
  }

  function openHome({focus = true} = {}){
    if(!isMobile()) return;
    closeSheet({restoreFocus:false});
    syncRecentTrips();
    syncHeader();
    syncInstallButton();
    body.classList.add('mobile-home-open');
    updateNav('route');
    syncAccessibility();
    if(focus) focusSoon($('.mobile-new-roadtrip'));
  }

  function closeHome({silent = false} = {}){
    const wasOpen = homeOpen();
    if(wasOpen) body.classList.remove('mobile-home-open');
    syncAccessibility();
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
    syncAccessibility();
  }

  function enableShellMode(){
    html.classList.add('roadora-mobile-shell');
    updateVisualViewport();
    syncHeader();
    syncRecentTrips();
    syncInstallButton();
    syncBuildInfo();
    syncAccessibility();
  }

  function disableShellMode(){
    html.classList.remove('roadora-mobile-shell');
    closeHome({silent:true});
    closeSheet({restoreFocus:false});
    syncAccessibility();
  }

  function syncShellMode(){
    const wasEnabled = html.classList.contains('roadora-mobile-shell');
    if(isMobile()){
      enableShellMode();
      if(!wasEnabled){
        if(shouldOpenHomeInitially()) openHome({focus:false});
        else if(routeWasEmpty && !shellOpen() && !homeOpen()) openView('route', {focus:false});
      }
    }else if(wasEnabled){
      disableShellMode();
    }
  }

  function bind(){
    $('#mobileAppNav')?.addEventListener('click', event => {
      const button = event.target.closest('[data-mobile-view]');
      if(!button) return;
      openView(button.dataset.mobileView, {toggle:true, trigger:button});
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

    $('#mobileHeaderMore')?.addEventListener('click', event => openView('more', {toggle:true, trigger:event.currentTarget}));
    $('.brand')?.addEventListener('click', event => {
      if(!isMobile()) return;
      event.preventDefault();
      openHome();
    });

    $('.mobile-new-roadtrip')?.addEventListener('click', event => {
      $('#newRoadtrip')?.click();
      closeHome({silent:true});
      window.setTimeout(() => openView('route', {expand:true, resetScroll:true, trigger:event.currentTarget}), 80);
    });
    $('#mobileContinueTrip')?.addEventListener('click', event => {
      closeHome({silent:true});
      openView('planning', {trigger:event.currentTarget});
    });
    $('#mobileOpenLibrary')?.addEventListener('click', event => openView('more', {expand:true, trigger:event.currentTarget}));

    $('#mobileRecentTrips')?.addEventListener('click', event => {
      if(event.target.closest('[data-start-new-roadtrip]')){
        event.preventDefault();
        event.stopPropagation();
        $('.mobile-new-roadtrip')?.click();
        return;
      }
      const action = event.target.closest('[data-trip-action]');
      if(action?.dataset.tripAction === 'open'){
        window.setTimeout(() => {
          closeHome({silent:true});
          closeSheet({restoreFocus:false});
          syncHeader();
        }, 160);
      }
    });

    document.addEventListener('focusin', event => {
      if(!isMobile()) return;
      const field = event.target.closest?.('.mobile-app-sheet input, .mobile-app-sheet select, .mobile-app-sheet textarea, .mobile-app-sheet [contenteditable="true"]');
      if(!field) return;
      body.classList.add('mobile-sheet-expanded', 'mobile-input-focused', 'mobile-keyboard-open');
      scheduleViewportUpdate();
      window.setTimeout(() => field.scrollIntoView({block:'center', inline:'nearest', behavior:'smooth'}), 160);
    });

    document.addEventListener('focusout', () => {
      if(!isMobile()) return;
      window.setTimeout(() => {
        const focused = Boolean(activeEditable());
        body.classList.toggle('mobile-input-focused', focused);
        if(!focused) body.classList.remove('mobile-keyboard-open');
        scheduleViewportUpdate();
      }, 120);
    });

    window.visualViewport?.addEventListener('resize', scheduleViewportUpdate);
    window.visualViewport?.addEventListener('scroll', scheduleViewportUpdate);
    window.addEventListener('orientationchange', () => {
      stableViewportHeight = 0;
      scheduleViewportUpdate();
      window.setTimeout(syncShellMode, 180);
    });

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
      syncHeader();
      const picking = body.classList.contains('map-pick-active');
      if(picking === mapPickingState) return;
      mapPickingState = picking;
      if(picking){
        if(shellOpen()) mapPickReturnView = currentView;
        closeSheet({restoreFocus:false});
      }else if(mapPickReturnView){
        const returnView = mapPickReturnView;
        mapPickReturnView = '';
        window.setTimeout(() => openView(returnView, {focus:false}), 100);
      }
    }).observe(body, {attributes:true,attributeFilter:['class']});

    const mediaChanged = () => syncShellMode();
    mobileMedia.addEventListener?.('change', mediaChanged);
    standaloneMedia.addEventListener?.('change', mediaChanged);
    coarseMedia.addEventListener?.('change', mediaChanged);
  }

  document.addEventListener('DOMContentLoaded', () => {
    bind();
    syncHeader();
    syncRecentTrips();
    syncInstallButton();
    syncBuildInfo();
    syncFromExistingTabs();
    syncAccessibility();

    if(isMobile()){
      enableShellMode();
      currentView = 'route';
      updateNav();
      window.setTimeout(() => {
        syncHeader();
        if(shouldOpenHomeInitially()) openHome({focus:false});
        else if(routeWasEmpty) openView('route', {focus:false});
      }, 420);
    }
  }, {once:true});
})();
