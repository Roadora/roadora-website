import { initConsent } from './analytics-consent.js';
import { initNavigation } from './navigation.js';
import { initPlanner } from './app.js';
import { initRoadoraMap } from './real-map.js';

document.addEventListener('DOMContentLoaded',()=>{initConsent();initNavigation();initRoadoraMap();initPlanner();});
