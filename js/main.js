import { initConsent } from './analytics-consent.js';
import { initNavigation } from './navigation.js';
import { initPlanner } from './app.js';

document.addEventListener('DOMContentLoaded',()=>{initConsent();initNavigation();initPlanner();});
