// Voyā account gate: email + password, no email-confirmation step in UI
const VOYA_AUTH_URL='https://mczgismbhxmcolwaxayk.supabase.co';
const VOYA_AUTH_KEY='sb_publishable_5t7y4fFoh_41pBK8gj5Cyw_zTRlQZZ0';
const authSb=window.voyaSupabase||window.supabase.createClient(VOYA_AUTH_URL,VOYA_AUTH_KEY);

function gateText(en,zh){try{return store.lang==='zh'?zh:en}catch(e){return en}}

function ensureGateStyles(){
  if(document.getElementById('voyaGateStyles'))return;
  const s=document.createElement('style');s.id='voyaGateStyles';s.textContent=`
  #voyaLoginGate{position:fixed;inset:0;z-index:99999;background:linear-gradient(180deg,#f7f2ee 0%,#efe7e1 100%);display:none;align-items:center;justify-content:center;padding:24px;font-family:'DM Sans',sans-serif}
  #voyaLoginGate.show{display:flex}.voya-gate-card{width:min(100%,390px);background:rgba(255,255,255,.9);backdrop-filter:blur(18px);border:1px solid rgba(120,100,88,.13);border-radius:28px;padding:26px;box-shadow:0 20px 60px rgba(68,53,45,.13)}
  .voya-gate-brand{display:flex;align-items:center;gap:10px;margin-bottom:20px}.voya-gate-brand img{width:38px;height:38px;border-radius:12px}.voya-gate-brand b{font-size:25px}.voya-gate-card h1{font-size:28px;margin:4px 0 8px}.voya-gate-card p{font-size:13px;line-height:1.55;color:#77685f;margin:0 0 20px}.voya-gate-card input{width:100%;box-sizing:border-box;border:1px solid #ded2ca;background:#fff;border-radius:15px;padding:14px 15px;margin:6px 0;font:inherit;font-size:15px;outline:none}.voya-gate-card input:focus{border-color:#9e897b}.voya-gate-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.voya-gate-actions button{border:0;border-radius:15px;padding:13px;font:600 14px 'DM Sans',sans-serif}.voya-gate-login{background:#211e1c;color:#fff}.voya-gate-signup{background:#eee6e0;color:#332b27}.voya-gate-error{min-height:20px;margin-top:7px;color:#9d4949;font-size:12px}.voya-gate-note{font-size:11px!important;text-align:center;margin:13px 0 0!important;color:#9b8d84!important}.voya-account-btn{border:0;background:#eee7e2;border-radius:999px;padding:8px 11px;font:600 11px 'DM Sans',sans-serif;color:#675a52;max-width:155px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  `;document.head.appendChild(s);
}

function gateMarkup(){return `<div id="voyaLoginGate"><div class="voya-gate-card">
  <div class="voya-gate-brand"><img src="assets/icon.svg" alt="Voyā"><b>Voyā</b></div>
  <h1>${gateText('Your trips, together.','一起规划每一次旅行')}</h1>
  <p>${gateText('Use your email and password to keep the same Voyā account across devices.','用邮箱和密码登录，这样换链接或换设备也能回到同一个 Voyā 账号。')}</p>
  <input id="gateName" type="text" autocomplete="name" maxlength="60" placeholder="${gateText('Your name (for a new account)','你的名字（注册新账号时填写）')}">
  <input id="gateEmail" type="email" autocomplete="email" placeholder="Email">
  <input id="gatePassword" type="password" autocomplete="current-password" placeholder="Password (6+ characters)">
  <div id="gateError" class="voya-gate-error"></div>
  <div class="voya-gate-actions"><button class="voya-gate-signup" onclick="voyaGateSignUp()">${gateText('Create account','注册')}</button><button class="voya-gate-login" onclick="voyaGateSignIn()">${gateText('Sign in','登录')}</button></div>
  <p class="voya-gate-note">${gateText('Test mode: no email confirmation step.','测试模式：不需要邮箱验证。')}</p>
</div></div>`}

function showGate(){ensureGateStyles();if(!document.getElementById('voyaLoginGate'))document.body.insertAdjacentHTML('beforeend',gateMarkup());document.getElementById('voyaLoginGate')?.classList.add('show');document.body.style.overflow='hidden'}
function hideGate(){document.getElementById('voyaLoginGate')?.classList.remove('show');document.body.style.overflow='';document.getElementById('voyaAuthModal')?.remove()}
function gateError(msg=''){const e=document.getElementById('gateError');if(e)e.textContent=msg}

function finishAuthAndReload(){
  gateError(gateText('Loading your trips…','正在加载你的 Trips…'));
  setTimeout(()=>location.reload(),120);
}

async function voyaGateSignIn(){
  const email=document.getElementById('gateEmail')?.value.trim();
  const password=document.getElementById('gatePassword')?.value;
  if(!email||!password)return gateError(gateText('Enter email and password.','请输入邮箱和密码。'));
  gateError(gateText('Signing in…','正在登录…'));
  const {data,error}=await authSb.auth.signInWithPassword({email,password});
  if(error)return gateError(error.message);
  if(!data.session)return gateError(gateText('Could not start a session.','无法建立登录会话。'));
  finishAuthAndReload();
}

async function voyaGateSignUp(){
  const name=document.getElementById('gateName')?.value.trim();
  const email=document.getElementById('gateEmail')?.value.trim();
  const password=document.getElementById('gatePassword')?.value;
  if(!name)return gateError(gateText('Enter your name.','请输入你的名字。'));
  if(!email||!password||password.length<6)return gateError(gateText('Use a valid email and a password with at least 6 characters.','请输入有效邮箱，密码至少 6 位。'));
  gateError(gateText('Creating account…','正在创建账号…'));
  const {data,error}=await authSb.auth.signUp({email,password,options:{data:{display_name:name}}});
  if(error)return gateError(error.message);
  if(!data.session){
    return gateError(gateText('The backend still requires email confirmation. Turn off Confirm email in Supabase Auth settings, then try again.','后台目前仍要求邮箱验证。需要先在 Supabase Auth 里关闭 Confirm email，再重新注册。'));
  }
  finishAuthAndReload();
}

function accountDisplayName(session){const saved=session?.user?.user_metadata?.display_name?.trim();return saved||(session?.user?.email||'Traveler').split('@')[0]}

async function openVoyaProfile(){
  const {data}=await authSb.auth.getSession();const session=data.session;if(!session)return showGate();
  document.getElementById('voyaProfileModal')?.remove();
  const name=accountDisplayName(session);
  document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="voyaProfileModal"><div class="modal-card" onclick="event.stopPropagation()"><div class="modal-handle"></div><h3>${gateText('Your profile','你的资料')}</h3><p style="color:var(--muted);font-size:13px">${gateText('This name is shown to friends in shared trips.','这个名字会显示在你和朋友共享的 Trip 里。')}</p><input id="voyaProfileName" class="modal-input" maxlength="60" value="${escapeHtml(name)}" placeholder="${gateText('Your name','你的名字')}"><div id="voyaProfileError" class="voya-gate-error"></div><div class="modal-actions"><button class="secondary-btn" onclick="voyaSignOut()">${gateText('Log out','退出登录')}</button><button class="primary-btn" onclick="saveVoyaProfile()">${gateText('Save name','保存名字')}</button></div><button class="secondary-btn wide" onclick="document.getElementById('voyaProfileModal')?.remove()">${gateText('Cancel','取消')}</button></div></div>`);
}

async function saveVoyaProfile(){
  const input=document.getElementById('voyaProfileName'),errorEl=document.getElementById('voyaProfileError');
  const name=input?.value.trim();if(!name){if(errorEl)errorEl.textContent=gateText('Enter your name.','请输入你的名字。');return;}
  if(errorEl)errorEl.textContent=gateText('Saving…','正在保存…');
  const {data,error}=await authSb.auth.updateUser({data:{display_name:name}});
  if(error){if(errorEl)errorEl.textContent=error.message;return;}
  const {error:syncError}=await authSb.rpc('sync_my_display_name',{p_display_name:name});
  if(syncError){if(errorEl)errorEl.textContent=syncError.message;return;}
  window.voyaCurrentUserName=name;
  if(data?.user&&collabSession)collabSession.user=data.user;
  document.getElementById('voyaProfileModal')?.remove();
  await refreshAccountButton();
  if(typeof currentPage!=='undefined')navigate(currentPage);
  showToast(gateText('Name saved ✓','名字已保存 ✓'));
}

async function voyaSignOut(){
  document.getElementById('voyaProfileModal')?.remove();
  await authSb.auth.signOut();
  document.querySelector('.voya-account-btn')?.remove();
  showGate();
}

async function refreshAccountButton(){
  const {data}=await authSb.auth.getSession();const session=data.session;
  if(!session)return;
  const wrap=document.querySelector('.top-actions');if(!wrap)return;
  const name=accountDisplayName(session);window.voyaCurrentUserName=name;
  let b=document.getElementById('voyaAccountBtn');if(!b){b=document.createElement('button');b.id='voyaAccountBtn';b.className='voya-account-btn';b.onclick=openVoyaProfile;wrap.prepend(b)}
  b.textContent=name+' · '+gateText('Account','账号');
}

async function initVoyaGate(){
  ensureGateStyles();
  const params=new URLSearchParams(location.search);
  const forceLogin=params.get('login')==='1';
  if(forceLogin){
    await authSb.auth.signOut();
    params.delete('login');
    const next=location.pathname+(params.toString()?`?${params.toString()}`:'');
    history.replaceState({},'',next);
    document.querySelector('.voya-account-btn')?.remove();
    showGate();
  }else{
    const {data}=await authSb.auth.getSession();
    if(data.session){hideGate();refreshAccountButton()}else showGate();
  }
  authSb.auth.onAuthStateChange((_event,session)=>{if(session){hideGate();setTimeout(refreshAccountButton,0)}else showGate()});
}

window.voyaGateSignIn=voyaGateSignIn;window.voyaGateSignUp=voyaGateSignUp;window.openVoyaProfile=openVoyaProfile;window.saveVoyaProfile=saveVoyaProfile;window.voyaSignOut=voyaSignOut;
initVoyaGate();
