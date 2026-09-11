// Voyā Supabase collaboration + account-backed trip sync
const VOYA_SUPABASE_URL = 'https://mczgismbhxmcolwaxayk.supabase.co';
const VOYA_SUPABASE_KEY = 'sb_publishable_5t7y4fFoh_41pBK8gj5Cyw_zTRlQZZ0';
const sb = window.supabase.createClient(VOYA_SUPABASE_URL, VOYA_SUPABASE_KEY);
window.voyaSupabase = sb;

let collabSession = null;
let collabChannel = null;
let collabSyncTimer = null;
let pendingAfterAuth = null;
let applyingRemote = false;
let hydratingCloud = false;
const cloudingTrips = new Map();

const originalSaveStore = window.saveStore;
const originalRenderTrip = window.renderTrip;
const originalOpenTrip = window.openTrip;

function collabText(en, zh){ return store.lang === 'en' ? en : zh; }
function sessionDisplayName(session=collabSession){const saved=session?.user?.user_metadata?.display_name?.trim();return saved||(session?.user?.email||'Traveler').split('@')[0]}
function applySessionDisplayName(session=collabSession){window.voyaCurrentUserName=sessionDisplayName(session)}
window.voyaTripRosters=window.voyaTripRosters||{};
async function refreshTripRoster(tr){
  if(!tr?.cloudId||!collabSession)return;
  const {data,error}=await sb.from('trip_members').select('user_id,role,display_name').eq('trip_id',tr.cloudId);
  if(error){console.error('Voyā roster restore failed',error);return;}
  const rows=data||[],ownName=sessionDisplayName(),nameOf=row=>row.display_name?.trim()||(row.user_id===collabSession.user.id?ownName:'');
  const owner=rows.find(row=>row.role==='owner');
  window.voyaTripRosters[tr.cloudId]={ownerName:nameOf(owner||{})||ownName,count:rows.length,members:rows.filter(row=>row.role!=='owner'&&nameOf(row)).map(row=>({userId:row.user_id,name:nameOf(row),role:row.role}))};
  tr.cloudTravelerCount=rows.length;
}

function meaningfulTrip(tr){ return !!(tr && (tr.name || tr.destination || tr.startDate || tr.endDate || tr.members?.length || tr.packing?.length || tr.outfits?.length || tr.shared?.length)); }

function injectCollabStyles(){
  if(document.getElementById('voyaCollabStyles')) return;
  const style = document.createElement('style');
  style.id='voyaCollabStyles';
  style.textContent = `
    .voya-share-btn{border:0;background:#1f1c1a;color:white;border-radius:999px;padding:10px 15px;font:600 13px 'DM Sans',sans-serif;box-shadow:0 5px 16px rgba(31,28,26,.14)}
    .voya-cloud-pill{display:inline-flex;align-items:center;gap:5px;margin-top:8px;padding:6px 9px;border-radius:999px;background:#efe8e2;color:#6d5d54;font-size:11px;font-weight:600}
    .voya-auth-card{max-width:390px}.voya-auth-card h3{margin-bottom:5px}.voya-auth-card p{margin:0 0 18px;color:var(--muted);font-size:13px;line-height:1.45}
    .voya-auth-error{min-height:18px;font-size:12px;color:#a34848;margin:7px 0}
    .voya-auth-switch{display:flex;gap:8px;margin-top:10px}.voya-auth-switch button{flex:1}
    .voya-share-link{font-size:12px;word-break:break-all;padding:12px;border-radius:14px;background:#f4efeb;border:1px solid var(--line);margin:12px 0}
    .voya-collab-row{display:flex;gap:8px;align-items:center;margin-top:12px}.voya-collab-row button{flex:1}
  `;
  document.head.appendChild(style);
}

function authModalHtml(){
  return `<div class="modal-backdrop" id="voyaAuthModal"><div class="modal-card voya-auth-card" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <h3>${collabText('Sign in to share','登录后即可共享')}</h3>
    <p>${collabText('Sign in so this trip can sync safely across friends and devices.','登录后，这次旅行就能在朋友和不同设备之间同步。')}</p>
    <input id="voyaAuthEmail" class="modal-input" type="email" autocomplete="email" placeholder="Email">
    <input id="voyaAuthPassword" class="modal-input" type="password" autocomplete="current-password" placeholder="Password (6+ characters)">
    <div id="voyaAuthError" class="voya-auth-error"></div>
    <div class="voya-auth-switch">
      <button class="secondary-btn" onclick="collabSignUp()">${collabText('Create account','创建账号')}</button>
      <button class="primary-btn" onclick="collabSignIn()">${collabText('Sign in','登录')}</button>
    </div>
    <button class="secondary-btn wide" style="margin-top:9px" onclick="closeCollabAuth()">${collabText('Not now','暂时不要')}</button>
  </div></div>`;
}

function openCollabAuth(after){ pendingAfterAuth = after || pendingAfterAuth; document.getElementById('voyaAuthModal')?.remove(); document.body.insertAdjacentHTML('beforeend', authModalHtml()); }
function closeCollabAuth(){ document.getElementById('voyaAuthModal')?.remove(); }
function setAuthError(msg){ const el=document.getElementById('voyaAuthError'); if(el) el.textContent=msg||''; }

async function collabSignIn(){
  const email=document.getElementById('voyaAuthEmail')?.value.trim();
  const password=document.getElementById('voyaAuthPassword')?.value;
  if(!email||!password) return setAuthError(collabText('Enter email and password.','请输入邮箱和密码。'));
  setAuthError(collabText('Signing in…','正在登录…'));
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error) return setAuthError(error.message);
  collabSession=data.session; closeCollabAuth();
  await migrateLocalTripsToCloud();
  await hydrateAllCloudTrips();
  showToast(collabText('Signed in ✓','登录成功 ✓'));
  const next=pendingAfterAuth; pendingAfterAuth=null; if(next) await next();
}

async function collabSignUp(){
  const email=document.getElementById('voyaAuthEmail')?.value.trim();
  const password=document.getElementById('voyaAuthPassword')?.value;
  if(!email||!password||password.length<6) return setAuthError(collabText('Use a valid email and a password with at least 6 characters.','请输入有效邮箱，密码至少 6 位。'));
  setAuthError(collabText('Creating account…','正在创建账号…'));
  const {data,error}=await sb.auth.signUp({email,password});
  if(error) return setAuthError(error.message);
  if(!data.session) return setAuthError(collabText('Email confirmation is still enabled in the backend.','后台仍然开启了邮箱验证。'));
  collabSession=data.session; closeCollabAuth();
  await migrateLocalTripsToCloud();
  await hydrateAllCloudTrips();
  showToast(collabText('Account created ✓','账号创建成功 ✓'));
  const next=pendingAfterAuth; pendingAfterAuth=null; if(next) await next();
}

async function ensureCollabAuth(after){
  const {data}=await sb.auth.getSession(); collabSession=data.session;
  if(collabSession) return true;
  openCollabAuth(after); return false;
}

const PACKING_IMAGE_BUCKET='voya-packing-images';
function serializableTrip(tr){const copy=JSON.parse(JSON.stringify(tr));copy.cloudId=tr.cloudId||null;(copy.packing||[]).forEach(item=>{if(item.imagePath)item.image='';delete item.imageRemote;delete item.pendingImageDelete});delete copy.pendingImageDeletes;return copy}
function mergePackingImages(target,source){const sourceById=new Map((source?.packing||[]).map(item=>[item.id,item])),packing=target?.packing||[];let recovered=0;target.packing=packing.map(item=>{if(item.imageCleared)return item;const sourceItem=sourceById.get(item.id);if(!sourceItem)return item;const merged={...item};if(!merged.imagePath&&sourceItem.imagePath){merged.imagePath=sourceItem.imagePath;recovered++}if(!merged.image&&!merged.imagePath&&sourceItem.image){merged.image=sourceItem.image;recovered++}return merged});return recovered}
function packingDataUrlToBlob(dataUrl){const parts=dataUrl.split(','),mime=parts[0]?.match(/data:([^;]+)/)?.[1]||'image/jpeg',bytes=atob(parts[1]||''),array=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)array[i]=bytes.charCodeAt(i);return new Blob([array],{type:mime})}
async function uploadPackingImage(tr,item){if(!tr?.cloudId||!item?.id||!item.image?.startsWith('data:image/'))return false;const blob=packingDataUrlToBlob(item.image),extension=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg',fileId=crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(36).slice(2),path=`${tr.cloudId}/${item.id}/${fileId}.${extension}`;const {error}=await sb.storage.from(PACKING_IMAGE_BUCKET).upload(path,blob,{contentType:blob.type,upsert:false,cacheControl:'31536000'});if(error){console.error('Voyā image upload failed',error);return false}item.imagePath=path;item.imageCleared=false;return true}
async function removePackingImage(path){if(!path)return true;const {error}=await sb.storage.from(PACKING_IMAGE_BUCKET).remove([path]);if(error){console.error('Voyā image removal failed',error);return false}return true}
async function migrateTripImagesToStorage(tr){if(!tr?.cloudId)return;const items=tr.packing||[];for(const item of items){let ready=true;if(item.image?.startsWith('data:image/')&&!item.imagePath)ready=await uploadPackingImage(tr,item);if(item.pendingImageDelete&&ready){if(await removePackingImage(item.pendingImageDelete))delete item.pendingImageDelete}}if(tr.pendingImageDeletes?.length){const failed=[];for(const path of tr.pendingImageDeletes){if(!await removePackingImage(path))failed.push(path)}tr.pendingImageDeletes=failed}}
async function hydratePackingImageUrls(tr){const items=(tr?.packing||[]).filter(item=>item.imagePath);if(!items.length)return;const paths=[...new Set(items.map(item=>item.imagePath))],{data,error}=await sb.storage.from(PACKING_IMAGE_BUCKET).createSignedUrls(paths,604800);if(error){console.error('Voyā image URL restore failed',error);return}const urls=new Map((data||[]).filter(row=>row.signedUrl).map(row=>[row.path,row.signedUrl]));items.forEach(item=>{const url=urls.get(item.imagePath);if(url){item.image=url;item.imageRemote=true}})}

async function createCloudTrip(tr){
  if(!tr || tr.cloudId || !collabSession || !meaningfulTrip(tr)) return tr?.cloudId||null;
  if(cloudingTrips.has(tr.id)) return cloudingTrips.get(tr.id);
  const job=(async()=>{
    const userId=collabSession.user.id;
    const {data,error}=await sb.from('trips').insert({
      owner_id:userId,
      title:tr.name||tr.destination||'Trip',
      destination:tr.destination||null,
      starts_on:tr.startDate||null,
      ends_on:tr.endDate||null
    }).select('id').single();
    if(error){ console.error('Voyā cloud trip create failed',error); return null; }
    tr.cloudId=data.id;
    await migrateTripImagesToStorage(tr);
    originalSaveStore(false);
    const {error:docError}=await sb.from('trip_documents').insert({trip_id:data.id,data:serializableTrip(tr),updated_by:userId,updated_at:new Date().toISOString()});
    if(docError){ console.error('Voyā cloud document create failed',docError); return null; }
    return data.id;
  })();
  cloudingTrips.set(tr.id,job);
  try{return await job;}finally{cloudingTrips.delete(tr.id);}
}

async function syncTripToCloud(tr){
  if(!tr || !collabSession || applyingRemote || !meaningfulTrip(tr)) return;
  if(!tr.cloudId){ const id=await createCloudTrip(tr); if(!id) return; }
  const cloudId=tr.cloudId, userId=collabSession.user.id;
  const {data:existing,error:readError}=await sb.from('trip_documents').select('data').eq('trip_id',cloudId).maybeSingle();
  if(!readError&&existing?.data)mergePackingImages(tr,existing.data);
  await migrateTripImagesToStorage(tr);
  originalSaveStore(false);
  const data=serializableTrip(tr);
  const {error}=await sb.from('trip_documents').upsert({trip_id:cloudId,data,updated_by:userId,updated_at:new Date().toISOString()},{onConflict:'trip_id'});
  if(error){ console.error('Voyā cloud sync failed',error); return; }
  mergePackingImages(tr,data);
  await sb.from('trips').update({title:tr.name||tr.destination||'Trip',destination:tr.destination||null,starts_on:tr.startDate||null,ends_on:tr.endDate||null,updated_at:new Date().toISOString()}).eq('id',cloudId);
}

window.saveStore = function(show=false){
  originalSaveStore(show);
  const tr=currentTrip();
  if(tr && collabSession && !applyingRemote && meaningfulTrip(tr)){
    clearTimeout(collabSyncTimer);
    collabSyncTimer=setTimeout(()=>syncTripToCloud(tr),700);
  }
};

async function migrateLocalTripsToCloud(){
  if(!collabSession) return;
  const localOnly=store.trips.filter(tr=>!tr.cloudId && meaningfulTrip(tr));
  for(const tr of localOnly) await syncTripToCloud(tr);
  originalSaveStore(false);
}

async function hydrateAllCloudTrips(){
  if(!collabSession || hydratingCloud) return;
  hydratingCloud=true;
  try{
    const {data,error}=await sb.from('trip_documents').select('trip_id,data,updated_at').order('updated_at',{ascending:false});
    if(error){ console.error('Voyā cloud trip restore failed',error); return; }
    const remoteRows=data||[];
    const remoteIds=new Set(remoteRows.map(row=>row.trip_id));
    // A successful cloud read is authoritative for account-backed trips. This
    // prevents deleted trips from surviving in localStorage on another device.
    store.trips=store.trips.filter(tr=>!tr.cloudId||remoteIds.has(tr.cloudId));
    if(!store.trips.some(tr=>tr.id===store.activeTripId)) store.activeTripId=store.trips[0]?.id||null;
    const recoveredTrips=[];
    for(const row of remoteRows){
      if(!row?.data) continue;
      const remote=JSON.parse(JSON.stringify(row.data)); remote.cloudId=row.trip_id;
      const i=store.trips.findIndex(t=>t.cloudId===row.trip_id || t.id===remote.id),local=i>=0?store.trips[i]:null;
      const recovered=local&&mergePackingImages(remote,local);
      const needsStorageMigration=(remote.packing||[]).some(item=>item.image?.startsWith('data:image/')&&!item.imagePath);
      if(recovered||needsStorageMigration)recoveredTrips.push(remote);
      if(i>=0) store.trips[i]=remote; else store.trips.push(remote);
    }
    await Promise.all(store.trips.filter(tr=>tr.cloudId).map(tr=>hydratePackingImageUrls(tr)));
    await Promise.all(store.trips.filter(tr=>tr.cloudId).map(tr=>refreshTripRoster(tr)));
    // Keep local-only drafts, but sort cloud trips by their own updatedAt when available.
    store.trips.sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0));
    originalSaveStore(false);
    if(typeof cachePackingImages==='function')await cachePackingImages();
    if(recoveredTrips.length)await Promise.all(recoveredTrips.map(tr=>syncTripToCloud(tr)));
    if(currentPage==='trips'||currentPage==='trip'||currentPage==='packing'||currentPage==='outfits') navigate(currentPage);
  } finally { hydratingCloud=false; }
}

function removeCloudTripLocally(cloudId,localId){
  store.trips=store.trips.filter(tr=>tr.id!==localId&&tr.cloudId!==cloudId);
  if(!store.trips.some(tr=>tr.id===store.activeTripId)) store.activeTripId=store.trips[0]?.id||null;
  originalSaveStore(false);
  if(currentPage!=='trips') navigate('trips'); else renderTrips();
}

async function deleteTripEverywhere(id,confirmed=false){
  const tr=store.trips.find(item=>item.id===id);
  if(!tr) return;
  if(!confirmed&&!confirm(collabText('Delete this trip?','确定删除这次旅行？'))) return;

  clearTimeout(collabSyncTimer);
  collabSyncTimer=null;

  // A create may already be in flight after a recent edit. Wait for it so the
  // newly created cloud row cannot bring the trip back after local deletion.
  const pendingCreate=cloudingTrips.get(tr.id);
  if(pendingCreate){
    const createdId=await pendingCreate;
    if(createdId&&!tr.cloudId) tr.cloudId=createdId;
  }

  if(tr.cloudId){
    const ok=collabSession||await ensureCollabAuth(()=>deleteTripEverywhere(id,true));
    if(!ok) return;
    const cloudId=tr.cloudId;
    const userId=collabSession.user.id;
    const {data,error}=await sb.from('trips').delete().eq('id',cloudId).eq('owner_id',userId).select('id');
    if(error||!data?.length){
      console.error('Voyā cloud trip delete failed',error||'No row deleted');
      showToast(collabText('Could not delete the trip. Please try again.','删除失败，请再试一次。'));
      return;
    }
    if(collabChannel){ await sb.removeChannel(collabChannel); collabChannel=null; }
    removeCloudTripLocally(cloudId,tr.id);
  }else{
    removeCloudTripLocally(null,tr.id);
  }

  showToast(collabText('Trip deleted permanently ✓','旅行已永久删除 ✓'));
}

async function makeTripCloud(tr){
  const ok=await ensureCollabAuth(()=>shareCurrentTrip()); if(!ok) return null;
  if(tr.cloudId) return tr.cloudId;
  return createCloudTrip(tr);
}

async function shareCurrentTrip(){
  const tr=currentTrip(); if(!tr) return;
  const ok=await ensureCollabAuth(()=>shareCurrentTrip()); if(!ok) return;
  const tripId=await makeTripCloud(tr); if(!tripId) return;
  await syncTripToCloud(tr);
  const {data,error}=await sb.from('trip_invites').insert({trip_id:tripId,role:'editor',created_by:collabSession.user.id}).select('token').single();
  if(error){ showToast(error.message); return; }
  const url=`${location.origin+location.pathname}?invite=${encodeURIComponent(data.token)}`;
  openShareModal(url);
}

function openShareModal(url){
  document.querySelector('.voya-share-modal')?.remove();
  const html=`<div class="modal-backdrop voya-share-modal"><div class="modal-card" onclick="event.stopPropagation()">
    <div class="modal-handle"></div><h3>${collabText('Share this trip','共享这次旅行')}</h3>
    <p style="color:var(--muted);font-size:13px">${collabText('Anyone with this link can join as an editor after signing in.','拿到这个链接的朋友登录后，就能以编辑者身份加入。')}</p>
    <div class="voya-share-link" id="voyaShareLink">${escapeHtml(url)}</div>
    <div class="voya-collab-row"><button class="secondary-btn" onclick="copyShareLink()">${collabText('Copy link','复制链接')}</button><button class="primary-btn" onclick="nativeShareTrip()">${collabText('Share…','分享…')}</button></div>
    <button class="secondary-btn wide" style="margin-top:9px" onclick="document.querySelector('.voya-share-modal')?.remove()">${collabText('Done','完成')}</button>
  </div></div>`;
  document.body.insertAdjacentHTML('beforeend',html); window.__voyaShareUrl=url;
}
async function copyShareLink(){try{await navigator.clipboard.writeText(window.__voyaShareUrl);showToast(collabText('Link copied ✓','链接已复制 ✓'));}catch(e){showToast(collabText('Press and hold the link to copy it.','长按链接复制。'));}}
async function nativeShareTrip(){const tr=currentTrip(),url=window.__voyaShareUrl;if(navigator.share){try{await navigator.share({title:tr?.name||'Voyā trip',text:collabText('Join my trip on Voyā','加入我的 Voyā 旅行'),url});}catch(e){}}else copyShareLink();}

function injectShareButton(){
  const top=document.querySelector('.overview-top'); if(!top||document.getElementById('voyaShareBtn')) return;
  const btn=document.createElement('button'); btn.id='voyaShareBtn'; btn.className='voya-share-btn'; btn.textContent=collabText('Share','共享'); btn.onclick=shareCurrentTrip;
  const edit=top.querySelector('.round-btn');
  if(edit){const wrap=document.createElement('div');wrap.style.cssText='display:flex;gap:8px;align-items:center';edit.replaceWith(wrap);wrap.append(edit,btn);}else top.appendChild(btn);
  const tr=currentTrip();
  if(tr?.cloudId && !document.querySelector('.voya-cloud-pill')){const hero=document.querySelector('.overview-hero');const pill=document.createElement('div');pill.className='voya-cloud-pill';pill.textContent=collabText('☁ Synced to account','☁ 已同步到账号');hero?.appendChild(pill);}
}

window.renderTrip = function(){ originalRenderTrip(); injectShareButton(); };
window.openTrip = function(id){ originalOpenTrip(id); const tr=currentTrip(); if(tr?.cloudId){subscribeTrip(tr.cloudId);refreshTripRoster(tr).then(()=>{if(currentTrip()?.id===tr.id)navigate(currentPage)});} };

let activeRosterRefresh=null;
async function refreshActiveTripView(){
  if(activeRosterRefresh)return activeRosterRefresh;
  if(!collabSession)return;
  const page=currentPage,tr=currentTrip(),localId=tr?.id;
  activeRosterRefresh=(async()=>{
    if(page==='trips'){
      await Promise.all(store.trips.filter(item=>item.cloudId).map(item=>refreshTripRoster(item)));
      originalSaveStore(false);
      if(currentPage==='trips'&&!document.querySelector('.modal-backdrop'))renderTrips();
      return;
    }
    if(!tr?.cloudId)return;
    await refreshTripRoster(tr);
    originalSaveStore(false);
    if(currentTrip()?.id===localId&&currentPage===page&&!document.querySelector('.modal-backdrop'))navigate(page);
  })();
  try{await activeRosterRefresh;}finally{activeRosterRefresh=null;}
}

async function subscribeTrip(cloudId){
  if(!cloudId) return;
  if(collabChannel){ await sb.removeChannel(collabChannel); collabChannel=null; }
  collabChannel=sb.channel(`voya-trip-${cloudId}`)
  .on('postgres_changes',{event:'*',schema:'public',table:'trip_documents',filter:`trip_id=eq.${cloudId}`},payload=>{
    if(payload.eventType==='DELETE'){ removeCloudTripLocally(cloudId); return; }
    const row=payload.new; if(!row?.data || row.updated_by===collabSession?.user?.id) return; applyRemoteTrip(cloudId,row.data);
  })
  .on('postgres_changes',{event:'*',schema:'public',table:'trip_members',filter:`trip_id=eq.${cloudId}`},()=>refreshActiveTripView())
  .subscribe();
}

async function applyRemoteTrip(cloudId,remote){
  applyingRemote=true;
  try{
    remote.cloudId=cloudId;
    await hydratePackingImageUrls(remote);
    const i=store.trips.findIndex(t=>t.cloudId===cloudId || t.id===remote.id);
    if(i>=0) store.trips[i]=remote; else store.trips.unshift(remote);
    if(store.activeTripId && i>=0 && store.activeTripId!==remote.id) store.activeTripId=remote.id;
    originalSaveStore(false);
    if(currentPage!=='edit' && !document.querySelector('.modal-backdrop')) navigate(currentPage);
    const state=document.getElementById('saveState'); if(state){state.textContent=collabText('Updated by friend ✓','朋友已更新 ✓');setTimeout(()=>state.textContent='',1500);}
  } finally { applyingRemote=false; }
}

async function loadCloudTrip(cloudId){
  const {data,error}=await sb.from('trip_documents').select('data').eq('trip_id',cloudId).single();
  if(error||!data?.data){ showToast(error?.message||collabText('Trip could not be loaded.','无法加载旅行。')); return; }
  const remote=data.data; remote.cloudId=cloudId;
  await hydratePackingImageUrls(remote);
  const i=store.trips.findIndex(t=>t.cloudId===cloudId || t.id===remote.id);
  if(i>=0) store.trips[i]=remote; else store.trips.unshift(remote);
  store.activeTripId=remote.id; await refreshTripRoster(remote); originalSaveStore(false); subscribeTrip(cloudId); navigate('trip');
}

async function acceptInviteFromUrl(){
  const params=new URLSearchParams(location.search),token=params.get('invite'); if(!token) return;
  const ok=await ensureCollabAuth(()=>acceptInviteFromUrl()); if(!ok) return;
  const {data,error}=await sb.rpc('accept_trip_invite',{p_token:token});
  if(error){ showToast(error.message); return; }
  const tripId=Array.isArray(data)?data[0]?.trip_id:data?.trip_id; if(!tripId) return;
  history.replaceState({},'',location.pathname); await loadCloudTrip(tripId); showToast(collabText('Trip joined ✓','已加入旅行 ✓'));
}

async function onSignedIn(session){
  collabSession=session;
  applySessionDisplayName(session);
  if(window.voyaImageCacheReady)await window.voyaImageCacheReady;
  const displayName=sessionDisplayName(session);
  const {error:nameSyncError}=await sb.rpc('sync_my_display_name',{p_display_name:displayName});
  if(nameSyncError)console.error('Voyā display name sync failed',nameSyncError);
  await migrateLocalTripsToCloud();
  await hydrateAllCloudTrips();
  const tr=currentTrip(); if(tr?.cloudId) subscribeTrip(tr.cloudId);
  await acceptInviteFromUrl();
}

async function initCollab(){
  injectCollabStyles();
  const {data}=await sb.auth.getSession(); collabSession=data.session;
  sb.auth.onAuthStateChange((event,session)=>{
    collabSession=session;
    if(session && (event==='SIGNED_IN' || event==='TOKEN_REFRESHED' || event==='INITIAL_SESSION')) setTimeout(()=>onSignedIn(session),0);
  });
  if(collabSession) await onSignedIn(collabSession); else await acceptInviteFromUrl();
}

window.collabSignIn=collabSignIn; window.collabSignUp=collabSignUp; window.closeCollabAuth=closeCollabAuth;
window.shareCurrentTrip=shareCurrentTrip; window.copyShareLink=copyShareLink; window.nativeShareTrip=nativeShareTrip;
window.voyaHydrateCloudTrips=hydrateAllCloudTrips; window.voyaMigrateTrips=migrateLocalTripsToCloud;
window.deleteTrip=deleteTripEverywhere;

const voyaShareObserver = new MutationObserver(()=>{ if(document.querySelector('.overview-top')) injectShareButton(); });
voyaShareObserver.observe(document.getElementById('app'),{childList:true,subtree:true});

window.addEventListener('pageshow',()=>setTimeout(refreshActiveTripView,0));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(refreshActiveTripView,0)});
initCollab().then(()=>{ if(document.querySelector('.overview-top')) injectShareButton(); });
