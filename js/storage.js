import { CONFIG } from './config.js';
export function loadState(){
  try{
    const stored=JSON.parse(localStorage.getItem(CONFIG.storageKeys.route)||'null');
    return {...CONFIG.defaults,...stored};
  }catch{return {...CONFIG.defaults};}
}
export function saveState(state){localStorage.setItem(CONFIG.storageKeys.route,JSON.stringify(state));}
export function getConsent(){return localStorage.getItem(CONFIG.storageKeys.consent);}
export function setConsent(value){localStorage.setItem(CONFIG.storageKeys.consent,value);}
