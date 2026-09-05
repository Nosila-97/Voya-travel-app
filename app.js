const state = {
  lang: localStorage.getItem('voya-lang') || 'en',
  members: [
    {name:'Alison', role:'You', avatar:'A'},
    {name:'Mia', role:'Friend', avatar:'M'}
  ],
  activities: ['Sightseeing','Beach','Dining','Night out','Shopping','Museum'],
  packing: [
    {name:'Linen shirt', cat:'clothes', packed:true},
    {name:'White tank', cat:'clothes', packed:true},
    {name:'Black dress', cat:'clothes', packed:false},
    {name:'Wide-leg trousers', cat:'clothes', packed:true},
    {name:'Denim shorts', cat:'clothes', packed:false},
    {name:'Swimsuit', cat:'clothes', packed:true},
    {name:'Light cardigan', cat:'clothes', packed:false},
    {name:'Sandals', cat:'clothes', packed:true},
    {name:'Sneakers', cat:'clothes', packed:false},
    {name:'Passport', cat:'essentials', packed:true},
    {name:'Universal adapter', cat:'essentials', packed:false},
    {name:'Power bank', cat:'essentials', packed:true},
    {name:'Skincare', cat:'essentials', packed:true},
    {name:'Medication', cat:'essentials', packed:false},
  ],
  shared: [
    {name:'Sunscreen', who:'Alison', packed:true},
    {name:'Universal adapter', who:'Mia', packed:true},
    {name:'Camera', who:'Alison', packed:false},
    {name:'Hair dryer', who:'Mia', packed:false},
    {name:'First aid kit', who:'Unassigned', packed:false},
    {name:'Portable tripod', who:'Unassigned', packed:false},
  ]
}

const dict = {
  en:{
    'nav.home':'Home','nav.packing':'Packing','nav.outfits':'Outfits','nav.shared':'Shared',
    'home.eyebrow':'YOUR NEXT TRIP','home.title1':'Pack light.','home.title2':'Travel beautifully.','home.subtitle':'Plan outfits, split shared items, and know exactly who brings what.','home.start':'Plan a trip',
    'create.title':'Create a Trip','create.subtitle':"Tell me where you're going and I'll help you pack.",'create.destination':'Destination','create.dates':'Travel dates','create.triptype':'Trip type','create.leisure':'Leisure','create.business':'Business','create.family':'Family','create.withwho':"Who's coming?",'create.solo':'Solo','create.friends':'Friends','create.couple':'Couple',
    'common.next':'Next','common.continue':'Continue',
    'members.title':'Travel Together','members.subtitle':'Invite friends and decide who brings shared items.','members.add':'Add a traveler','members.inviteTitle':'Invite by link','members.inviteCopy':'Friends can join the trip and update their own packing list.','members.copy':'Copy link',
    'activities.title':'Select Activities','activities.subtitle':"We'll tailor outfit and packing suggestions around your plans.",'activities.generate':'Build my packing plan',
    'overview.trip':'TRIP OVERVIEW','overview.sunny':'Mostly sunny','overview.cities':'Cities','overview.days':'Days','overview.travelers':'Travelers','overview.itinerary':'Itinerary','overview.outfits':'See outfits','overview.pack':'Packing list','overview.shared':'Shared items',
    'outfits.title':'Your Outfit Plan','outfits.subtitle':'10 days · 12 core pieces · 21 looks','outfits.mine':'My looks','outfits.friend':"Mia's looks",
    'packing.title':'Packing List','packing.subtitle':'Your personal list','packing.packed':'packed','packing.all':'All','packing.clothes':'Clothes','packing.essentials':'Essentials','packing.add':'Add item',
    'shared.title':'Shared Items','shared.subtitle':'Split responsibilities. No duplicates.','shared.assigned':'Assigned','shared.unassigned':'Unassigned','shared.packed':'Packed','shared.add':'Add shared item',
    'modal.addTraveler':'Add a traveler','modal.add':'Add'
  },
  zh:{
    'nav.home':'主页','nav.packing':'行李','nav.outfits':'穿搭','nav.shared':'共享',
    'home.eyebrow':'下一段旅程','home.title1':'轻装出发，','home.title2':'漂亮旅行。','home.subtitle':'规划每日穿搭、共享行李分工，出发前清楚知道谁带什么。','home.start':'开始规划旅行',
    'create.title':'创建旅行','create.subtitle':'告诉我你要去哪里，我来帮你规划穿搭和行李。','create.destination':'目的地','create.dates':'旅行日期','create.triptype':'旅行类型','create.leisure':'休闲旅行','create.business':'商务','create.family':'家庭','create.withwho':'和谁一起？','create.solo':'独自','create.friends':'朋友','create.couple':'情侣',
    'common.next':'下一步','common.continue':'继续',
    'members.title':'一起旅行','members.subtitle':'邀请同行朋友，并分配共享物品由谁负责带。','members.add':'添加同行人','members.inviteTitle':'邀请链接','members.inviteCopy':'朋友加入后可以维护自己的穿搭和行李清单。','members.copy':'复制链接',
    'activities.title':'选择旅行活动','activities.subtitle':'我们会根据你的行程自动生成穿搭和行李建议。','activities.generate':'生成我的旅行清单',
    'overview.trip':'旅行总览','overview.sunny':'大部分晴天','overview.cities':'城市','overview.days':'天数','overview.travelers':'同行人','overview.itinerary':'行程','overview.outfits':'查看穿搭','overview.pack':'行李清单','overview.shared':'共享物品',
    'outfits.title':'我的穿搭计划','outfits.subtitle':'10天 · 12件核心单品 · 21套穿搭','outfits.mine':'我的穿搭','outfits.friend':'Mia 的穿搭',
    'packing.title':'行李清单','packing.subtitle':'我的个人行李','packing.packed':'已打包','packing.all':'全部','packing.clothes':'衣服','packing.essentials':'必需品','packing.add':'添加物品',
    'shared.title':'共享物品','shared.subtitle':'分工明确，不重复带。','shared.assigned':'已分配','shared.unassigned':'未分配','shared.packed':'已打包','shared.add':'添加共享物品',
    'modal.addTraveler':'添加同行人','modal.add':'添加'
  }
}

const activities = [
  ['📷','Sightseeing','观光'],['🏖','Beach','海滩'],['🥾','Hiking','徒步'],['🍽','Dining','餐厅'],['🍸','Night out','夜生活'],['🏛','Museum','博物馆'],['🛍','Shopping','购物'],['🧘','Wellness','放松'],['💻','Work','工作']
]
const outfits = [
  {day:'Day 1', zh:'第1天', title:'Milan · Travel Look', zht:'米兰 · 抵达穿搭', emoji:'🤍 👖 👜'},
  {day:'Day 2', zh:'第2天', title:'Milan · City Walk', zht:'米兰 · City Walk', emoji:'👚 🩳 🕶'},
  {day:'Day 3', zh:'第3天', title:'Amalfi · Beach', zht:'阿马尔菲 · 海边', emoji:'👙 🤍 🩴'},
  {day:'Day 4', zh:'第4天', title:'Dinner Night', zht:'晚餐夜', emoji:'🖤 👠 👜'},
]

function t(key){ return dict[state.lang][key] || key }
function setLang(lang){ state.lang=lang; localStorage.setItem('voya-lang',lang); document.getElementById('langToggle').textContent=lang==='en'?'中':'EN'; applyTranslations(); }
function applyTranslations(){ document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent=t(el.dataset.i18n) }) }

function navigate(page){
  const app=document.getElementById('app'); const tpl=document.getElementById(page+'Tpl');
  if(!tpl) return; app.innerHTML=''; app.appendChild(tpl.content.cloneNode(true));
  const nav=document.getElementById('bottomNav');
  if(['overview','outfits','packing','shared'].includes(page)){nav.classList.remove('hidden')}else{nav.classList.add('hidden')}
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===page || (page==='overview'&&b.dataset.nav==='home')))
  applyTranslations(); window.scrollTo({top:0,behavior:'instant'});
  if(page==='members') renderMembers(); if(page==='activities') renderActivities(); if(page==='outfits') renderOutfits(); if(page==='packing') renderPacking(); if(page==='shared') renderShared();
}

function renderMembers(){
  const el=document.getElementById('membersList');
  el.innerHTML=state.members.map((m,i)=>`<div class="member-row"><div class="avatar">${m.avatar}</div><div class="meta"><b>${m.name}</b><small>${i===0?(state.lang==='en'?'You · Private + shared list':'你 · 个人清单 + 共享清单'):(state.lang==='en'?'Friend · Can edit own list':'朋友 · 可编辑自己的清单')}</small></div><span class="pill">${i===0?(state.lang==='en'?'Owner':'创建者'):(state.lang==='en'?'Joined':'已加入')}</span></div>`).join('')
}
function renderActivities(){
  const el=document.getElementById('activityGrid');
  el.innerHTML=activities.map((a,i)=>`<button class="activity ${state.activities.includes(a[1])?'active':''}" onclick="toggleActivity('${a[1]}',this)"><span class="icon">${a[0]}</span><small>${state.lang==='en'?a[1]:a[2]}</small></button>`).join('')
}
function toggleActivity(name,btn){ const i=state.activities.indexOf(name); if(i>=0)state.activities.splice(i,1); else state.activities.push(name); btn.classList.toggle('active') }
function renderOutfits(){ document.getElementById('outfitCards').innerHTML=outfits.map(o=>`<div class="outfit-card"><div class="outfit-top"><div><small>${state.lang==='en'?o.day:o.zh}</small><br><b>${state.lang==='en'?o.title:o.zht}</b></div><span>›</span></div><div class="look-canvas">${o.emoji}</div><div class="outfit-meta"><span>18–24°C</span><span>${state.lang==='en'?'Casual chic':'轻松精致'}</span></div></div>`).join('') }
function renderPacking(filter='all'){
  const list=document.getElementById('packingList'); if(!list)return;
  const items=state.packing.filter(x=>filter==='all'||x.cat===filter);
  const groups={clothes:[],essentials:[]};items.forEach(x=>groups[x.cat].push(x));
  list.innerHTML=Object.entries(groups).filter(([,arr])=>arr.length).map(([cat,arr])=>`<div class="pack-group"><div class="group-title"><b>${cat==='clothes'?(state.lang==='en'?'Clothes':'衣服'):(state.lang==='en'?'Essentials':'必需品')}</b><small>${arr.filter(x=>x.packed).length}/${arr.length}</small></div>${arr.map(item=>`<label class="check-row"><input type="checkbox" ${item.packed?'checked':''} onchange="togglePack('${item.name.replaceAll("'","\\'")}',this.checked)"><span class="grow">${item.name}</span><small>${item.cat==='clothes'?'OOTD':'Trip'}</small></label>`).join('')}</div>`).join('');
  updatePackProgress(); document.querySelectorAll('.packing-filters button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.packing-filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderPacking(b.dataset.filter)})
}
function togglePack(name,val){ const x=state.packing.find(i=>i.name===name); if(x)x.packed=val; updatePackProgress() }
function updatePackProgress(){ const packed=state.packing.filter(x=>x.packed).length,total=state.packing.length; const txt=document.getElementById('packProgressText'),bar=document.getElementById('packProgressBar'); if(txt)txt.textContent=`${packed} / ${total}`; if(bar)bar.style.width=`${Math.round(packed/total*100)}%` }
function addPackingItem(){ const name=prompt(state.lang==='en'?'Item name':'物品名称'); if(!name)return; state.packing.push({name,cat:'essentials',packed:false}); renderPacking(); }
function renderShared(){
  const el=document.getElementById('sharedList');
  el.innerHTML=state.shared.map((x,i)=>`<div class="shared-row"><div class="shared-main"><input type="checkbox" ${x.packed?'checked':''} onchange="state.shared[${i}].packed=this.checked"><div class="grow"><b>${x.name}</b><small>${x.packed?(state.lang==='en'?'Packed':'已打包'):(state.lang==='en'?'Not packed yet':'还没打包')}</small></div><select class="assignee" onchange="state.shared[${i}].who=this.value"><option ${x.who==='Alison'?'selected':''}>Alison</option><option ${x.who==='Mia'?'selected':''}>Mia</option><option ${x.who==='Unassigned'?'selected':''}>${state.lang==='en'?'Unassigned':'未分配'}</option></select></div></div>`).join('')
}
function addSharedItem(){ const name=prompt(state.lang==='en'?'Shared item':'共享物品'); if(!name)return; state.shared.push({name,who:'Unassigned',packed:false});renderShared() }
function openAddMember(){ const tpl=document.getElementById('modalTpl'); document.body.appendChild(tpl.content.cloneNode(true));applyTranslations() }
function closeModal(e){ if(e.target.classList.contains('modal-backdrop'))e.target.remove() }
function saveMember(){ const input=document.getElementById('newMemberName'); if(!input||!input.value.trim())return; const n=input.value.trim();state.members.push({name:n,role:'Friend',avatar:n[0].toUpperCase()});document.querySelector('.modal-backdrop').remove();renderMembers();showToast(state.lang==='en'?'Traveler added':'同行人已添加') }
function copyInvite(){ navigator.clipboard?.writeText(window.location.href); showToast(state.lang==='en'?'Invite link copied':'邀请链接已复制') }
function showToast(msg){ const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800) }

document.getElementById('langToggle').onclick=()=>setLang(state.lang==='en'?'zh':'en');
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
setLang(state.lang); navigate('home');
