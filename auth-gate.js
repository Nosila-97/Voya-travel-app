// Voyā lightweight guest gate: email label + anonymous Supabase identity
const VOYA_AUTH_URL='https://mczgismbhxmcolwaxayk.supabase.co';
const VOYA_AUTH_KEY='sb_publishable_5t7y4fFoh_41pBK8gj5Cyw_zTRlQZZ0';
const authSb=window.supabase.createClient(VOYA_AUTH_URL,VOYA_AUTH_KEY);

function gateText(en,zh){try{return store.lang==='zh'?zh:en}catch(e){return en}}

function ensureGateStyles(){
  if(document.getElementById('voyaGateStyles'))return;
  const s=document.createElement('style');s.id='voyaGateStyles';s.textContent=`
  #voyaLoginGate{position:fixed;inset:0;z-index:99999;background:linear-gradient(180deg,#f7f2ee 0%,#efe7e1 100%);display:none;align-items:center;justify-content:center;padding:24px;font-family:'DM Sans',sans-serif}
  #voyaLoginGate.show{display:flex}.voya-gate-card{width:min(100%,390px);background:rgba(255,255,255,.88);backdrop-filter:blur(18px);border:1px solid rgba(120,100,88,.13);border-radius:28px;padding:26px;box-shadow:0 20px 60px rgba(68,53,45,.13)}
  .voya-gate-brand{display:flex;align-items:center;gap:10px;margin-bottom:20px}.voya-gate-brand img{width:38px;height:38px;border-radius:12px}.voya-gate-brand b{font-size:25px}.voya-gate-card h1{font-size:28px;margin:4px 0 8px}.voya-gate-card p{font-size:13px;line-height:1.55;color:#77685f;margin:0 0 20px}.voya-gate-card input{width:100%;box-sizing:border-box;border:1px solid #ded2ca;background:#fff;border-radius:15px;padding:14px 15px;margin:6px 0;font:inherit;font-size:15px;outline:none}.voya-gate-card input:focus{border-color:#9e897b}.voya-gate-continue{width:100%;margin-top:10px;border:0;border-radius:15px;padding:14px;background:#211e1c;color:#fff;font:600 14px 'DM Sans',sans-serif}.voya-gate-error{min-height:20px;margin-top:7px;color:#9d4949;font-size:12px}.voya-gate-note{font-size:11px!important;text-align:center;margin:13px 0 0!important;color:#9b8d84!important}.voya-account-btn{border:0;background:#eee7e2;border-radius:999px;padding:8px 11px;font:600 11px 'DM Sans',sans-serif;color:#675a52;max-width:155px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  `;document.head.appendChild(s);
}

function gateMarkup(){return `<div id="voyaLoginGate"><div class="voya-gate-card">
  <div class="voya-gate-brand"><img src="assets/icon.svg" alt="Voyā"><b>Voyā</b></div>
  <h1>${gateText('Your trips, together.','一起规划每一次旅行')}</h1>
  <p>${gateText('Enter an email so friends can recognize you. No password or email verification needed for this test version.','留一个邮箱方便朋友识别你。测试版不需要密码，也不需要邮箱验证。')}</p>
  <input id="gateEmail" type="email" autocomplete="email" placeholder="Email">
  <div id="gateError" class="voya-gate-error"></div>
  <button class="voya-gate-continue" onclick="voyaGuestContinue()">${gateText('Continue','继续')}</button>
  <p class="voya-gate-note">${gateText('Test mode: this email is only a display label, not a verified login credential.','测试模式：邮箱仅用于显示，不作为已验证的登录凭证。')}</p>
</div></div>`}

function showGate(){ensureGateStyles();if(!document.getElementById('voyaLoginGate'))document.body.insertAdjacentHTML('beforeend',gateMarkup());document.getElementById('voyaLoginGate')?.classList.add('show');document.body.style.overflow='hidden'}
function hideGate(){document.getElementById('voyaLoginGate')?.classList.remove('show');document.body.style.overflow='';document.getElementById('voyaAuthModal')?.remove()}
function gateError(msg=''){const e=document.getElementById('gateError');if(e)e.textContent=msg}

async function voyaGuestContinue(){
  const email=document.getElementById('gateEmail')?.value.trim();
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return gateError(gateText('Enter a valid email.','请输入有效邮箱。'));
  gateError(gateText('Entering Voyā…','正在进入 Voyā…'));
  let {data}=await authSb.auth.getSession();
  let session=data.session;
  if(!session){
    const {data:anonData,error}=await authSb.auth.signInAnonymously({options:{data:{display_email:email}}});
    if(error){
      console.error('Voyā anonymous sign-in failed',error);
      return gateError(gateText('Guest login is not enabled yet. Please try again after the backend setting is enabled.','匿名登录后台开关还没启用，启用后再试一次。'));
    }
    session=anonData.session;
  }else{
    await authSb.auth.updateUser({data:{display_email:email}});
  }
  localStorage.setItem('voya-display-email',email);
  gateError('');hideGate();showToast?.(gateText('Welcome to Voyā ✓','欢迎进入 Voyā ✓'));await refreshAccountButton();
  if(typeof acceptInviteFromUrl==='function')acceptInviteFromUrl();
}

async function voyaSignOut(){
  const ok=confirm(gateText('This test account cannot be recovered on another device after signing out. Log out anyway?','测试账号退出后无法在其他设备恢复。仍要退出吗？'));
  if(!ok)return;
  await authSb.auth.signOut();
  localStorage.removeItem('voya-display-email');
  document.querySelector('.voya-account-btn')?.remove();
  showGate();
}

async function refreshAccountButton(){
  const {data}=await authSb.auth.getSession();const session=data.session;
  if(!session)return;
  const wrap=document.querySelector('.top-actions');if(!wrap)return;
  let b=document.getElementById('voyaAccountBtn');if(!b){b=document.createElement('button');b.id='voyaAccountBtn';b.className='voya-account-btn';b.onclick=voyaSignOut;wrap.prepend(b)}
  const label=session.user?.user_metadata?.display_email||localStorage.getItem('voya-display-email')||gateText('Guest','访客');
  b.textContent=label+' · '+gateText('Log out','退出');
}

async function initVoyaGate(){
  ensureGateStyles();
  const {data}=await authSb.auth.getSession();
  if(data.session){hideGate();refreshAccountButton()}else showGate();
  authSb.auth.onAuthStateChange((_event,session)=>{if(session){hideGate();setTimeout(refreshAccountButton,0)}else showGate()});
}

window.voyaGuestContinue=voyaGuestContinue;window.voyaSignOut=voyaSignOut;
initVoyaGate();
