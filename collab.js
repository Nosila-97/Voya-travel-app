// Voyā Supabase collaboration + account-backed trip sync
const VOYA_SUPABASE_URL = 'https://mczgismbhxmcolwaxayk.supabase.co';
const VOYA_SUPABASE_KEY = 'sb_publishable_5t7y4fFoh_41pBK8gj5Cyw_zTRlQZZ0';
const sb = window.supabase.createClient(VOYA_SUPABASE_URL, VOYA_SUPABASE_KEY);

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

function serializableTrip(tr){ const copy=JSON.parse(JSON.stringify(tr)); copy.cloudId=tr.cloudId||null; return copy; }

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
  const cloudId=tr.cloudId, userId=collabSession.user.id, data=serializableTrip(tr);
  const {error}=await sb.from('trip_documents').upsert({trip_id:cloudId,data,updated_by:userId,updated_at:new Date().toISOString()},{onConflict:'trip_id'});
  if(error){ console.error('Voyā cloud sync failed',error); return; }
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
    for(const row of remoteRows){
      if(!row?.data) continue;
      const remote=JSON.parse(JSON.stringify(row.data)); remote.cloudId=row.trip_id;
      const i=store.trips.findIndex(t=>t.cloudId===row.trip_id || t.id===remote.id);
      if(i>=0) store.trips[i]=remote; else store.trips.push(remote);
    }
    // Keep local-only drafts, but sort cloud trips by their own updatedAt when available.
    store.trips.sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0));
    originalSaveStore(false);
    if(currentPage==='trips') navigate('trips');
  } finally { hydratingCloud=false; }
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
window.openTrip = function(id){ originalOpenTrip(id); const tr=currentTrip(); if(tr?.cloudId) subscribeTrip(tr.cloudId); };

async function subscribeTrip(cloudId){
  if(!cloudId) return;
  if(collabChannel){ await sb.removeChannel(collabChannel); collabChannel=null; }
  collabChannel=sb.channel(`voya-trip-${cloudId}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'trip_documents',filter:`trip_id=eq.${cloudId}`},payload=>{
    const row=payload.new; if(!row?.data || row.updated_by===collabSession?.user?.id) return; applyRemoteTrip(cloudId,row.data);
  }).subscribe();
}

function applyRemoteTrip(cloudId,remote){
  applyingRemote=true;
  try{
    remote.cloudId=cloudId;
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
  const i=store.trips.findIndex(t=>t.cloudId===cloudId || t.id===remote.id);
  if(i>=0) store.trips[i]=remote; else store.trips.unshift(remote);
  store.activeTripId=remote.id; originalSaveStore(false); subscribeTrip(cloudId); navigate('trip');
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

const voyaShareObserver = new MutationObserver(()=>{ if(document.querySelector('.overview-top')) injectShareButton(); });
voyaShareObserver.observe(document.getElementById('app'),{childList:true,subtree:true});

initCollab().then(()=>{ if(document.querySelector('.overview-top')) injectShareButton(); });
