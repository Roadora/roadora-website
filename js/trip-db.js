(function(){
  'use strict';
  const DB_NAME='roadora-roadtrips';
  const DB_VERSION=2;
  const STORE='trips';
  const QUEUE_STORE='syncQueue';
  const META_STORE='meta';
  const FALLBACK_KEY='roadoraTripsFallbackV1';
  const FALLBACK_QUEUE_KEY='roadoraSyncQueueFallbackV1';
  const FALLBACK_META_KEY='roadoraSyncMetaFallbackV1';

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
        if(!db.objectStoreNames.contains(QUEUE_STORE)){
          const queue=db.createObjectStore(QUEUE_STORE,{keyPath:'tripId'});
          queue.createIndex('queuedAt','queuedAt',{unique:false});
        }
        if(!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE,{keyPath:'key'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error || new Error('IndexedDB openen mislukt'));
    });
  }

  function readJson(key,fallback){
    try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(_){return fallback;}
  }
  function writeJson(key,value){
    try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}
  }
  function fallbackRead(){return readJson(FALLBACK_KEY,[]);}
  function fallbackWrite(items){return writeJson(FALLBACK_KEY,items);}
  function fallbackQueueRead(){return readJson(FALLBACK_QUEUE_KEY,[]);}
  function fallbackQueueWrite(items){return writeJson(FALLBACK_QUEUE_KEY,items);}
  function fallbackMetaRead(){return readJson(FALLBACK_META_KEY,{});}
  function fallbackMetaWrite(value){return writeJson(FALLBACK_META_KEY,value);}

  function emitChange(type,detail){
    try{window.dispatchEvent(new CustomEvent(type,{detail}));}catch(_){/* oudere browsers */}
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

  async function put(record,{source='local'}={}){
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
    }catch(_){
      const rows=fallbackRead();
      const index=rows.findIndex(x=>x.id===record.id);
      if(index>=0) rows[index]=record; else rows.unshift(record);
      if(!fallbackWrite(rows.slice(0,100))) throw new Error('Lokale fallback-opslag mislukt');
    }
    if(source==='local') emitChange('roadora:trip-local-change',{type:'upsert',record});
    return record;
  }

  async function remove(id,{source='local'}={}){
    const existing=await get(id);
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
    if(source==='local') emitChange('roadora:trip-local-change',{type:'delete',tripId:id,record:existing});
  }

  async function queuePut(item){
    if(!item?.tripId) throw new Error('Synchronisatie-ID ontbreekt');
    const normalized={...item,queuedAt:item.queuedAt||new Date().toISOString()};
    try{
      const db=await openDb();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(QUEUE_STORE,'readwrite');
        tx.objectStore(QUEUE_STORE).put(normalized);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
      });
      db.close();
    }catch(_){
      const rows=fallbackQueueRead();
      const index=rows.findIndex(x=>x.tripId===normalized.tripId);
      if(index>=0) rows[index]=normalized; else rows.push(normalized);
      if(!fallbackQueueWrite(rows)) throw new Error('Synchronisatiewachtrij opslaan mislukt');
    }
    emitChange('roadora:sync-queue-changed',{tripId:normalized.tripId});
    return normalized;
  }

  async function queueList(){
    try{
      const db=await openDb();
      const rows=await new Promise((resolve,reject)=>{
        const tx=db.transaction(QUEUE_STORE,'readonly');
        const req=tx.objectStore(QUEUE_STORE).getAll();
        req.onsuccess=()=>resolve(req.result||[]);
        req.onerror=()=>reject(req.error);
      });
      db.close();
      return rows.sort((a,b)=>String(a.queuedAt||'').localeCompare(String(b.queuedAt||'')));
    }catch(_){return fallbackQueueRead();}
  }

  async function queueRemove(tripId){
    try{
      const db=await openDb();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(QUEUE_STORE,'readwrite');
        tx.objectStore(QUEUE_STORE).delete(tripId);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
      });
      db.close();
    }catch(_){
      if(!fallbackQueueWrite(fallbackQueueRead().filter(x=>x.tripId!==tripId))) throw new Error('Synchronisatiewachtrij bijwerken mislukt');
    }
  }

  async function metaGet(key){
    try{
      const db=await openDb();
      const value=await new Promise((resolve,reject)=>{
        const tx=db.transaction(META_STORE,'readonly');
        const req=tx.objectStore(META_STORE).get(key);
        req.onsuccess=()=>resolve(req.result?.value ?? null);
        req.onerror=()=>reject(req.error);
      });
      db.close();
      return value;
    }catch(_){return fallbackMetaRead()[key] ?? null;}
  }

  async function metaSet(key,value){
    try{
      const db=await openDb();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(META_STORE,'readwrite');
        tx.objectStore(META_STORE).put({key,value});
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
      });
      db.close();
    }catch(_){
      const meta=fallbackMetaRead();meta[key]=value;
      if(!fallbackMetaWrite(meta)) throw new Error('Synchronisatiemetadata opslaan mislukt');
    }
    return value;
  }

  window.RoadoraTripDB={list,get,put,remove,queuePut,queueList,queueRemove,metaGet,metaSet};
})();
