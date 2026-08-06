/* Roadora account- en cloudsynchronisatie v6.9.1 */
(() => {
  'use strict';

  const BUILD='v6.9.1';
  const CONFIG_URL='/api/geocode?mode=app-config';
  const SDK_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm';
  const TABLE='roadora_trips';
  const SYNC_INTERVAL_MS=45000;
  const state={
    configured:false,
    initializing:true,
    syncing:false,
    online:navigator.onLine!==false,
    session:null,
    client:null,
    lastSyncAt:null,
    lastError:'',
    timer:null,
    connecting:false,
    intervalStarted:false
  };

  const $=selector=>document.querySelector(selector);
  const db=()=>window.RoadoraTripDB||null;
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const nowIso=()=>new Date().toISOString();
  const currentUser=()=>state.session?.user||null;
  const isSignedIn=()=>Boolean(currentUser());

  function createId(){
    return globalThis.crypto?.randomUUID?.() || `trip-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  }

  function stripCloud(record){
    if(!record) return record;
    const copy=clone(record);
    delete copy._cloud;
    return copy;
  }

  function stableStringify(value){
    if(value===null || typeof value!=='object') return JSON.stringify(value);
    if(Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  async function recordHash(record){
    const text=stableStringify(stripCloud(record));
    if(globalThis.crypto?.subtle){
      const data=new TextEncoder().encode(text);
      const digest=await crypto.subtle.digest('SHA-256',data);
      return [...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
    }
    let hash=2166136261;
    for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return `fallback-${(hash>>>0).toString(16)}`;
  }

  function formatSyncTime(value){
    if(!value) return '';
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
  }

  function setText(selector,text){const element=$(selector);if(element)element.textContent=text;}
  function setHidden(selector,hidden){const element=$(selector);if(element){element.hidden=hidden;element.setAttribute('aria-hidden',String(hidden));}}
  function setBusy(button,busy,label='Bezig…'){
    if(!button) return;
    if(busy){
      if(!button.dataset.idleLabel) button.dataset.idleLabel=button.textContent.trim();
      button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=label;
    }else{
      button.disabled=false;button.removeAttribute('aria-busy');
      if(button.dataset.idleLabel){button.textContent=button.dataset.idleLabel;delete button.dataset.idleLabel;}
    }
  }

  function notify(message,kind='info'){
    window.dispatchEvent(new CustomEvent('roadora:cloud-message',{detail:{message,kind}}));
  }

  function emitState(){
    renderAccount();
    window.dispatchEvent(new CustomEvent('roadora:cloud-state',{detail:getPublicState()}));
  }

  function getPublicState(){
    return {
      build:BUILD,
      configured:state.configured,
      initializing:state.initializing,
      syncing:state.syncing,
      signedIn:isSignedIn(),
      email:currentUser()?.email||'',
      online:state.online,
      lastSyncAt:state.lastSyncAt,
      lastError:state.lastError
    };
  }

  function renderAccount(){
    const user=currentUser();
    const pill=$('#accountStatePill');
    const status=$('#cloudSyncStatus');
    const emailInput=$('#roadoraAccountEmail');
    const sendButton=$('#sendRoadoraLoginLink');
    const signOutButton=$('#roadoraSignOut');
    const syncButton=$('#syncRoadoraNow');
    const storagePill=$('#tripStorageModePill');
    const warning=$('#tripStorageWarning');
    const homeStatus=$('#mobileHomeStorageStatus');

    if(pill){
      pill.textContent=!state.configured?'Cloud instellen':user?'Ingelogd':'Niet ingelogd';
      pill.dataset.state=!state.configured?'setup':user?'signed-in':'signed-out';
    }
    if(emailInput){
      emailInput.disabled=Boolean(user)||!state.configured;
      if(user) emailInput.value=user.email||'';
    }
    if(sendButton){setHidden('#sendRoadoraLoginLink',Boolean(user));sendButton.disabled=!state.configured||state.initializing||!state.client;}
    if(signOutButton) setHidden('#roadoraSignOut',!user);
    if(syncButton){setHidden('#syncRoadoraNow',!user);syncButton.disabled=state.syncing||!state.online;}

    let statusText='Roadtrips blijven veilig lokaal op dit apparaat.';
    let storageText='op dit apparaat';
    let homeText='Lokaal opgeslagen';
    if(!state.configured){
      statusText='Cloudsynchronisatie is nog niet gekoppeld. Voeg eerst de Supabase-omgevingsvariabelen toe.';
    }else if(state.initializing){
      statusText='Roadora-account wordt voorbereid…';
    }else if(!state.online){
      statusText=user?'Offline. Wijzigingen worden later automatisch gesynchroniseerd.':'Offline. Lokale roadtrips blijven beschikbaar.';
      if(user){storageText='offline wachtrij';homeText='Offline · later synchroniseren';}
    }else if(user && state.syncing){
      statusText='Roadtrips synchroniseren…';storageText='synchroniseren';homeText='Synchroniseren…';
    }else if(user && state.lastError){
      statusText=`Synchronisatie tijdelijk niet gelukt: ${state.lastError}`;storageText='sync aandacht nodig';homeText='Sync aandacht nodig';
    }else if(user){
      const time=formatSyncTime(state.lastSyncAt);
      statusText=`Ingelogd als ${user.email||'Roadora-gebruiker'}. ${time?`Laatst gesynchroniseerd om ${time}.`:'Roadtrips worden automatisch gesynchroniseerd.'}`;
      storageText='lokaal + cloud';homeText='Gesynchroniseerd';
    }else{
      statusText='Log in met je e-mailadres om roadtrips tussen desktop en telefoon te synchroniseren.';
    }
    if(status) status.textContent=statusText;
    if(storagePill) storagePill.textContent=storageText;
    if(homeStatus){
      homeStatus.textContent=homeText;
      const holder=homeStatus.closest('.mobile-home-status');
      if(holder) holder.dataset.cloud=user?(state.lastError?'error':state.syncing?'pending':'synced'):'local';
    }
    if(warning){
      warning.textContent=user
        ? 'Roadtrips worden lokaal én beveiligd in je Roadora-account opgeslagen. Offline wijzigingen worden later bijgewerkt.'
        : 'Roadtrips worden lokaal in deze browser opgeslagen. Log in om ze ook op andere apparaten te zien.';
    }
  }

  async function loadConfig(){
    try{
      const response=await fetch(CONFIG_URL,{cache:'no-store',headers:{Accept:'application/json'}});
      if(!response.ok) throw new Error('configuratie niet bereikbaar');
      const config=await response.json();
      return {
        url:String(config.supabaseUrl||'').trim(),
        key:String(config.supabasePublishableKey||'').trim(),
        configured:Boolean(config.configured && config.supabaseUrl && config.supabasePublishableKey)
      };
    }catch(error){
      console.warn('[Roadora cloud] configuratie kon niet worden geladen',error);
      return {url:'',key:'',configured:false};
    }
  }

  async function createSupabaseClient(config){
    if(typeof window.__ROADORA_SUPABASE_FACTORY__==='function') return window.__ROADORA_SUPABASE_FACTORY__(config);
    const module=await import(SDK_URL);
    return module.createClient(config.url,config.key,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'},
      global:{headers:{'X-Client-Info':`roadora-web-${BUILD}`}}
    });
  }

  function localToPayload(record,userId,revision){
    return {
      id:String(record.id),
      user_id:userId,
      name:String(record.name||'Roadtrip').slice(0,160),
      route:String(record.route||'').slice(0,300),
      days:Math.max(1,Math.min(31,Number(record.days)||1)),
      snapshot:clone(record.snapshot||{}),
      client_updated_at:record.updatedAt||nowIso(),
      client_hash:'',
      revision:Math.max(1,Number(revision)||1),
      device_id:'',
      is_deleted:false
    };
  }

  function remoteToLocal(row){
    return {
      id:String(row.id),
      name:String(row.name||'Roadtrip'),
      route:String(row.route||''),
      days:Number(row.days)||1,
      createdAt:row.created_at||row.client_updated_at||row.updated_at||nowIso(),
      updatedAt:row.client_updated_at||row.updated_at||nowIso(),
      snapshot:clone(row.snapshot||{}),
      _cloud:{
        userId:String(row.user_id||''),
        revision:Number(row.revision)||1,
        updatedAt:row.updated_at||nowIso(),
        hash:String(row.client_hash||''),
        status:'synced'
      }
    };
  }

  async function deviceId(){
    const database=db();
    let id=await database?.metaGet?.('deviceId');
    if(!id){id=createId();await database?.metaSet?.('deviceId',id);}
    return id;
  }

  async function getRemoteTrip(tripId){
    const {data,error}=await state.client.from(TABLE).select('*').eq('id',tripId).maybeSingle();
    if(error) throw error;
    return data||null;
  }

  async function saveCloudState(record,row,status='synced'){
    const database=db();
    if(!database) return;
    const local={...record,_cloud:{
      userId:String(row.user_id||currentUser()?.id||''),
      revision:Number(row.revision)||1,
      updatedAt:row.updated_at||nowIso(),
      hash:String(row.client_hash||''),
      status
    }};
    await database.put(local,{source:'cloud'});
  }

  async function makeConflictCopy(localRecord,remoteRow){
    const database=db();
    const copy=stripCloud(localRecord);
    copy.id=createId();
    copy.name=`${localRecord.name||'Roadtrip'} (lokale versie)`;
    copy.createdAt=nowIso();copy.updatedAt=copy.createdAt;
    if(copy.snapshot?.state){copy.snapshot.state.tripId=copy.id;copy.snapshot.state.tripName=copy.name;}
    await database.put(copy,{source:'cloud'});
    await database.queuePut({tripId:copy.id,type:'upsert',record:copy,baseRevision:0,queuedAt:nowIso()});
    await database.put(remoteToLocal(remoteRow),{source:'cloud'});
    notify(`“${localRecord.name||'Roadtrip'}” was op twee apparaten gewijzigd. Beide versies zijn bewaard.`, 'warning');
  }

  async function queueLocalChange(detail){
    const database=db();
    if(!database||!detail) return;
    const existingQueue=(await database.queueList()).find(item=>item.tripId===(detail.tripId||detail.record?.id));
    const record=detail.record||null;
    const tripId=detail.tripId||record?.id;
    if(!tripId) return;
    const owner=record?._cloud?.userId||'';
    if(owner && currentUser()?.id && owner!==currentUser().id){
      notify('Deze lokale roadtrip hoort bij een ander Roadora-account en is niet geüpload.','warning');
      return;
    }
    const baseRevision=existingQueue?.baseRevision ?? Number(record?._cloud?.revision||0);
    await database.queuePut({
      tripId,
      type:detail.type==='delete'?'delete':'upsert',
      record:detail.type==='delete'?null:clone(record),
      baseRevision,
      queuedAt:nowIso()
    });
    if(record && isSignedIn()){
      await database.put({...record,_cloud:{...(record._cloud||{}),userId:currentUser().id,status:'pending'}},{source:'cloud'});
    }
    emitState();
    scheduleSync(250);
  }

  async function prepareLocalTrips(){
    const database=db();const user=currentUser();
    if(!database||!user) return;
    const rows=await database.list();
    const queue=await database.queueList();
    const queued=new Set(queue.map(item=>item.tripId));
    for(const record of rows){
      const owner=record?._cloud?.userId||'';
      if(owner && owner!==user.id) continue;
      if(record?._cloud?.status==='synced' && owner===user.id) continue;
      if(queued.has(record.id)) continue;
      await database.queuePut({tripId:record.id,type:'upsert',record:clone(record),baseRevision:Number(record?._cloud?.revision||0),queuedAt:nowIso()});
    }
  }

  async function pushUpsert(item){
    const database=db();const user=currentUser();
    if(!database||!user) return;
    const local=await database.get(item.tripId);
    if(!local){await database.queueRemove(item.tripId);return;}
    const owner=local?._cloud?.userId||'';
    if(owner && owner!==user.id){await database.queueRemove(item.tripId);return;}
    const remote=await getRemoteTrip(item.tripId);
    const hash=await recordHash(local);
    const baseRevision=Number(item.baseRevision||0);

    if(remote?.is_deleted){
      if(Number(remote.revision||0)>baseRevision){
        await makeConflictCopy(local,remote);
        await database.remove(item.tripId,{source:'cloud'});
        await database.queueRemove(item.tripId);
        return;
      }
    }
    if(remote && Number(remote.revision||0)>baseRevision && String(remote.client_hash||'')!==hash){
      await makeConflictCopy(local,remote);
      await database.queueRemove(item.tripId);
      return;
    }
    if(remote && String(remote.client_hash||'')===hash && !remote.is_deleted){
      await saveCloudState(local,remote);
      await database.queueRemove(item.tripId);
      return;
    }

    const nextRevision=remote?Number(remote.revision||0)+1:1;
    const payload=localToPayload(local,user.id,nextRevision);
    payload.client_hash=hash;
    payload.device_id=await deviceId();
    let data,error;
    if(remote){
      ({data,error}=await state.client.from(TABLE).update(payload).eq('id',item.tripId).eq('revision',Number(remote.revision)||0).select('*').maybeSingle());
      if(!error && !data) throw new Error('Roadtrip is ondertussen op een ander apparaat gewijzigd');
    }else{
      ({data,error}=await state.client.from(TABLE).insert(payload).select('*').single());
    }
    if(error) throw error;
    await saveCloudState(local,data);
    await database.queueRemove(item.tripId);
  }

  async function pushDelete(item){
    const database=db();const user=currentUser();
    if(!database||!user) return;
    const remote=await getRemoteTrip(item.tripId);
    if(!remote){await database.queueRemove(item.tripId);return;}
    const baseRevision=Number(item.baseRevision||0);
    if(Number(remote.revision||0)>baseRevision){
      await database.put(remoteToLocal(remote),{source:'cloud'});
      await database.queueRemove(item.tripId);
      notify('Verwijderen is niet uitgevoerd omdat de roadtrip op een ander apparaat nieuwer was.','warning');
      return;
    }
    const {data,error}=await state.client.from(TABLE).update({
      is_deleted:true,
      revision:Number(remote.revision||0)+1,
      client_updated_at:nowIso(),
      device_id:await deviceId()
    }).eq('id',item.tripId).eq('revision',Number(remote.revision)||0).select('id').maybeSingle();
    if(error) throw error;
    if(!data) throw new Error('Roadtrip is ondertussen op een ander apparaat gewijzigd');
    await database.queueRemove(item.tripId);
  }

  async function processQueue(){
    const database=db();
    if(!database||!isSignedIn()) return;
    const queue=await database.queueList();
    for(const item of queue){
      if(item.type==='delete') await pushDelete(item);
      else await pushUpsert(item);
    }
  }

  async function pullCloudTrips(){
    const database=db();const user=currentUser();
    if(!database||!user) return;
    const {data,error}=await state.client.from(TABLE).select('*').order('updated_at',{ascending:false}).limit(250);
    if(error) throw error;
    const queue=await database.queueList();
    const pending=new Set(queue.map(item=>item.tripId));
    for(const row of data||[]){
      if(pending.has(String(row.id))) continue;
      const local=await database.get(String(row.id));
      if(row.is_deleted){
        if(local?._cloud?.userId===user.id || !local) await database.remove(String(row.id),{source:'cloud'});
        continue;
      }
      if(local?._cloud?.userId && local._cloud.userId!==user.id) continue;
      const localRevision=Number(local?._cloud?.revision||0);
      if(!local || Number(row.revision||0)>=localRevision) await database.put(remoteToLocal(row),{source:'cloud'});
    }
  }

  async function syncNow({manual=false}={}){
    if(state.syncing || !state.configured || !isSignedIn()) return false;
    if(navigator.onLine===false){state.online=false;emitState();if(manual)notify('Geen internetverbinding. Roadora synchroniseert later automatisch.','warning');return false;}
    state.syncing=true;state.lastError='';emitState();
    try{
      await prepareLocalTrips();
      await processQueue();
      await pullCloudTrips();
      await processQueue();
      state.lastSyncAt=nowIso();
      await db()?.metaSet?.(`lastSync:${currentUser().id}`,state.lastSyncAt);
      window.dispatchEvent(new CustomEvent('roadora:cloud-sync-changed'));
      if(manual) notify('Roadtrips zijn gesynchroniseerd.','success');
      return true;
    }catch(error){
      console.warn('[Roadora cloud] synchronisatie mislukt',error);
      state.lastError=String(error?.message||'onbekende fout').slice(0,180);
      if(manual) notify('Synchronisatie is niet gelukt. Je lokale roadtrips zijn wel veilig bewaard.','error');
      return false;
    }finally{
      state.syncing=false;emitState();
    }
  }

  function scheduleSync(delay=700){
    clearTimeout(state.timer);
    state.timer=setTimeout(()=>syncNow({manual:false}),delay);
  }

  async function sendLoginLink(email){
    const value=String(email||'').trim().toLowerCase();
    if(!state.configured||!state.client) throw new Error('Cloudsynchronisatie is nog niet beschikbaar');
    if(!/^\S+@\S+\.\S+$/.test(value)) throw new Error('Vul een geldig e-mailadres in');
    const button=$('#sendRoadoraLoginLink');setBusy(button,true,'Versturen…');
    try{
      const redirectTo=`${location.origin}${location.pathname||'/'}`;
      const {error}=await state.client.auth.signInWithOtp({email:value,options:{emailRedirectTo:redirectTo,shouldCreateUser:true}});
      if(error) throw error;
      notify(`Inloglink verstuurd naar ${value}. Open de e-mail op dit apparaat.`, 'success');
      setText('#cloudSyncStatus','Controleer je e-mail en open de beveiligde Roadora-inloglink.');
      return true;
    }finally{setBusy(button,false);}
  }

  async function signOut(){
    if(!state.client) return;
    const {error}=await state.client.auth.signOut();
    if(error) throw error;
    state.session=null;state.lastError='';state.lastSyncAt=null;emitState();
    notify('Je bent uitgelogd. Lokale roadtrips blijven op dit apparaat staan.','success');
  }

  async function handleAuthSession(session,event='INITIAL_SESSION'){
    state.session=session||null;state.lastError='';
    if(session?.user){
      state.lastSyncAt=await db()?.metaGet?.(`lastSync:${session.user.id}`);
      emitState();
      scheduleSync(event==='INITIAL_SESSION'?300:80);
    }else emitState();
  }

  function bindUi(){
    $('#sendRoadoraLoginLink')?.addEventListener('click',async()=>{
      try{await sendLoginLink($('#roadoraAccountEmail')?.value);}catch(error){notify(error?.message||'Inloglink kon niet worden verstuurd.','error');}
    });
    $('#roadoraAccountEmail')?.addEventListener('keydown',event=>{
      if(event.key==='Enter'){event.preventDefault();$('#sendRoadoraLoginLink')?.click();}
    });
    $('#roadoraSignOut')?.addEventListener('click',async()=>{
      try{await signOut();}catch(error){notify(error?.message||'Uitloggen is niet gelukt.','error');}
    });
    $('#syncRoadoraNow')?.addEventListener('click',()=>syncNow({manual:true}));
  }

  async function connectCloud(){
    if(state.client||state.connecting) return Boolean(state.client);
    state.connecting=true;
    try{
      const config=await loadConfig();
      state.configured=config.configured;
      if(!config.configured){state.initializing=false;renderAccount();emitState();return false;}
      state.client=await createSupabaseClient(config);
      state.client.auth.onAuthStateChange((event,session)=>setTimeout(()=>handleAuthSession(session,event),0));
      const {data,error}=await state.client.auth.getSession();
      if(error) throw error;
      state.initializing=false;
      await handleAuthSession(data?.session||null,'INITIAL_SESSION');
      if(!state.intervalStarted){
        state.intervalStarted=true;
        setInterval(()=>{if(isSignedIn()&&document.visibilityState==='visible')syncNow({manual:false});},SYNC_INTERVAL_MS);
      }
      return true;
    }catch(error){
      console.warn('[Roadora cloud] initialisatie mislukt',error);
      state.client=null;state.initializing=false;state.lastError='Accountverbinding kon niet worden gestart';renderAccount();emitState();
      return false;
    }finally{state.connecting=false;}
  }

  async function init(){
    bindUi();renderAccount();
    window.addEventListener('roadora:trip-local-change',event=>queueLocalChange(event.detail).catch(error=>console.warn('[Roadora cloud] lokale wijziging',error)));
    window.addEventListener('roadora:sync-queue-changed',()=>{if(isSignedIn())scheduleSync(300);});
    window.addEventListener('online',()=>{state.online=true;emitState();if(!state.client)connectCloud().catch(()=>{});else scheduleSync(100);});
    window.addEventListener('offline',()=>{state.online=false;emitState();});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&isSignedIn())scheduleSync(150);});
    await connectCloud();
  }

  window.RoadoraCloudSync={
    build:BUILD,
    init,
    syncNow,
    sendLoginLink,
    signOut,
    isConfigured:()=>state.configured,
    isSignedIn,
    getState:getPublicState,
    __recordHash:recordHash,
    __remoteToLocal:remoteToLocal
  };
  document.addEventListener('DOMContentLoaded',init,{once:true});
})();
