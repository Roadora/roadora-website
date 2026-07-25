import { initConsent } from './analytics-consent.js';
import { initNavigation } from './navigation.js';

document.addEventListener('DOMContentLoaded',()=>{
  initConsent();
  initNavigation();
});
