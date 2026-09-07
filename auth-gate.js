// Voyā login-first account gate
const VOYA_AUTH_URL='https://mczgismbhxmcolwaxayk.supabase.co';
const VOYA_AUTH_KEY='sb_publishable_5t7y4fFoh_41pBK8gj5Cyw_zTRlQZZ0';
const authSb=window.supabase.createClient(VOYA_AUTH_URL,VOYA_AUTH_KEY);

function gateText(en,zh){try{return store.lang==='zh'?zh:en}catch(e){return en}}

function ensureGateStyles(){
  if(document.getElementById('voyaGateStyles'))return;
  const s=document.createElement('style');s.id='voyaGateStyles';s.textContent=`
  #voyaLoginGate{position:fixed;inset:0;z-index:99999;background:linear-gradient(180deg,#f7f2ee 0%,#efe7e1 100%);display:none;align-items:center;justify-content:center;padding:24px;font-family:'DM Sans',sans-serif}
  #voyaLoginGate.show{display:flex}.voya-gate-card{width:min(100%,390px);background:rgba(255,255,255,.86);backdrop-filter:blur(18px);border:1px solid rgba(120,100,88,.13);border-radius:28px;padding:26px;box-shadow:0 20px 60px rgba(68,53,45,.13)}
  .voya-gate-brand{display:flex;align-items:center;gap:10px;margin-bottom:20px}.voya-gate-brand img{width:38px;height:38px;border-radius:12px}.voya-gate-brand b{font-size:25px}.voya-gate-card h1{font-size:28px;margin:4px 0 8px}.voya-gate-card p{font-size:13px;line-height:1.55;color:#77685f;margin:0 0 20px}.voya-gate-card input{width:100%;box-sizing:border-box;border:1px solid #ded2ca;background:#fff;border-radius:15px;padding:14px 15px;margin:6px 0;font:inherit;font-size:15px;outline:none}.voya-gate-card input:focus{border-color:#9e897b}.voya-gate-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.voya-gate-actions button{border:0;border-radius:15px;padding:13px;font:600 14px 'DM Sans',sans-serif}.voya-gate-login{background:#211e1c;color:#fff}.voya-gate-signup{background:#eee6e0;color:#332b27}.voya-gate-error{min-height:20px;margin-top:7px;color:#9d4949;font-size:12px}.voya-gate-note{font-size:11px!important;text-align:center;margin:13px 0 0!important;color:#9b8d84!important}.voya-account-btn{border:0;background:#eee7e2;border-radius:999px;padding:8px 11px;font:600 11px 'DM Sans',sans-serif;color:#675a52;max-width:126px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  `;document.head.appendChild(s);
}

function gateMarkup(){return `<div id="voyaLoginGate"><div class="voya-gate-card">
  <div class="voya-gate-brand"><img src="assets/icon.svg" alt="Voyā"><b>Voyā</b></div>
  <h1>${gateText('Your trips, together.','一起规划每一次旅行')}</h1>
  <p>${gateText('Sign in to see your trips, pack together with friends, and keep everything synced across devices.','登录后查看自己的旅行、和朋友一起打包，并在不同设备之间保持同步。')}</p>
  <input id="gateEmail" type="email" autocomplete="email" placeholder="Email">
  <input id="gatePassword" type="password" autocomplete="current-password" placeholder="Password (6+ characters)">
  <div id="gateError" class="voya-gate-error"></div>
  <div class="voya-gate-actions"><button class="voya-gate-signup" onclick="voyaGateSignUp()">${gateText('Create account','注册')}</button><button class="voya-gate-login" onclick="voyaGateSignIn()">${gateText('Sign in','登录')}</button></div>
  <p class="voya-gate-note">${gateText('Each traveler uses their own account.','每位同行人使用自己的账号。')}</p>
</div></div>`}

function showGate(){ensureGateStyles();if(!document.getElementById('voyaLoginGate'))document.body.insertAdjacentHTML('beforeend',gateMarkup());document.getElementById('voyaLoginGate')?.classList.add('show');document.body.style.overflow='hidden'}
function hideGate(){document.getElementById('voyaLoginGate')?.classList.remove('show');document.body.style.overflow='';document.getElementById('voyaAuthModal')?.remove()}
function gateError(msg=''){const e=document.getElementById('gateError');if(e)e.textContent=msg}

async function voyaGateSignIn(){
  const email=document.getElementById('gateEmail')?.value.trim(),password=document.getElementById('gatePassword')?.value;
  if(!email||!password)return gateError(gateText('Enter email and password.','请输入邮箱和密码。'));
  gateError(gateText('Signing in…','正在登录…'));
  const {error}=await authSb.auth.signInWithPassword({email,password});
  if(error)return gateError(error.message);
  gateError('');hideGate();showToast?.(gateText('Signed in ✓','登录成功 ✓'));await refreshAccountButton();
  if(typeof acceptInviteFromUrl==='function')acceptInviteFromUrl();
}

async function voyaGateSignUp(){
  const email=document.getElementById('gateEmail')?.value.trim(),password=document.getElementById('gatePassword')?.value;
  if(!email||!password||password.length<6)return gateError(gateText('Use a valid email and a password with at least 6 characters.','请输入有效邮箱，密码至少 6 位。'));
  gateError(gateText('Creating account…','正在创建账号…'));
  const {data,error}=await authSb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
  if(error)return gateError(error.message);
  if(data.session){hideGate();showToast?.(gateText('Account created ✓','注册成功 ✓'));await refreshAccountButton();}
  else gateError(gateText('Account created. Check your email to confirm, then return here and sign in.','账号已创建。请先去邮箱完成验证，再回来登录。'));
}

async function voyaSignOut(){
  await authSb.auth.signOut();
  document.querySelector('.voya-account-btn')?.remove();
  showGate();
}

async function refreshAccountButton(){
  const {data}=await authSb.auth.getSession();const session=data.session;
  if(!session)return;
  const wrap=document.querySelector('.top-actions');if(!wrap)return;
  let b=document.getElementById('voyaAccountBtn');if(!b){b=document.createElement('button');b.id='voyaAccountBtn';b.className='voya-account-btn';b.onclick=voyaSignOut;wrap.prepend(b)}
  b.textContent=(session.user.email||gateText('Account','账号'))+' · '+gateText('Log out','退出');
}

async function initVoyaGate(){
  ensureGateStyles();
  const {data}=await authSb.auth.getSession();
  if(data.session){hideGate();refreshAccountButton()}else showGate();
  authSb.auth.onAuthStateChange((_event,session)=>{if(session){hideGate();setTimeout(refreshAccountButton,0)}else showGate()});
}

window.voyaGateSignIn=voyaGateSignIn;window.voyaGateSignUp=voyaGateSignUp;window.voyaSignOut=voyaSignOut;
initVoyaGate();
