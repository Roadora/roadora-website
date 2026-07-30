(function(){
  'use strict';
  const DB_NAME='roadora-roadtrips';
  const DB_VERSION=1;
  const STORE='trips';
  const FALLBACK_KEY='roadoraTripsFallbackV1';

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)) return reject(new Error('IndexedDB niet beschikbaar'));
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)){
          const store=db.createObjectStore(STORE,{keyPath:'id'});
          store.createIndex('updatedAt','updatedAt',{unique:false});
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error || new Error('IndexedDB openen mislukt'));
    });
  }

  function fallbackRead(){
    try{return JSON.parse(localStorage.getItem(FALLBACK_KEY)||'[]');}catch(_){return [];}
  }
  function fallbackWrite(items){
    try{localStorage.setItem(FALLBACK_KEY,JSON.stringify(items)); return true;}
    catch(_){return false;}
  }
  async function withStore(mode,fn){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,mode);
      const store=tx.objectStore(STORE);
      let result;
      try{result=fn(store);}catch(err){db.close();reject(err);return;}
      tx.oncomplete=()=>{db.close();resolve(result);};
      tx.onerror=()=>{db.close();reject(tx.error || new Error('IndexedDB-transactie mislukt'));};
      tx.onabort=()=>{db.close();reject(tx.error || new Error('IndexedDB-transactie afgebroken'));};
    });
  }
  function requestResult(req){
    return new Promise((resolve,reject)=>{
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error || new Error('IndexedDB-verzoek mislukt'));
    });
  }

  async function list(){
    try{
      const db=await openDb();
      const rows=await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).getAll();
        req.onsuccess=()=>resolve(req.result||[]);
        req.onerror=()=>reject(req.error);
      });
      db.close();
      return rows.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
    }catch(_){
      return fallbackRead().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
    }
  }

  async function get(id){
    if(!id) return null;
    try{
      const db=await openDb();
      const result=await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).get(id);
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error);
      });
      db.close();
      return result;
    }catch(_){
      return fallbackRead().find(x=>x.id===id)||null;
    }
  }

  async function put(record){
    if(!record?.id) throw new Error('Roadtrip-ID ontbreekt');
    try{
      const db=await openDb();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).put(record);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
      });
      db.close();
      return record;
    }catch(_){
      const rows=fallbackRead();
      const index=rows.findIndex(x=>x.id===record.id);
      if(index>=0) rows[index]=record; else rows.unshift(record);
      if(!fallbackWrite(rows.slice(0,50))) throw new Error('Lokale fallback-opslag mislukt');
      return record;
    }
  }

  async function remove(id){
    try{
      const db=await openDb();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
      });
      db.close();
    }catch(_){
      if(!fallbackWrite(fallbackRead().filter(x=>x.id!==id))) throw new Error('Lokale fallback-opslag mislukt');
    }
  }

  window.RoadoraTripDB={list,get,put,remove};
})();
