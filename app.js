const STORAGE_KEY='voya-state-v2';
const defaultState={
  lang:localStorage.getItem('voya-lang')||'en',
  trip:{name:'',destination:'',startDate:'',endDate:'',type:''},
  members:[],
  activities:[],
  customActivities:[],
  stops:[],
  packing:[],
  shared:[],
  outfits:[]
};
let state=loadState();
function loadState(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));return s?{...defaultState,...s,trip:{...defaultState.trip,...(s.trip||{})}}:structuredClone(defaultState)}catch(e){return structuredClone(defaultState)}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}

const dict={en:{
'nav.home':'Home','nav.packing':'Packing','nav.outfits':'Outfits','nav.shared':'Shared','home.eyebrow':'YOUR NEXT TRIP','home.title1':'Pack light.','home.title2':'Travel beautifully.','home.subtitle':'Build a trip from scratch, plan outfits, and split shared items with friends.','home.start':'Create a trip','home.continue':'Continue my trip',
'create.title':'Create a Trip','create.subtitle':'Start with your actual destination and dates.','create.tripname':'Trip name','create.destination':'Destination','create.start':'Start date','create.end':'End date','create.triptype':'Trip type','create.leisure':'Leisure','create.business':'Business','create.mixed':'Mixed',
'common.next':'Next','common.continue':'Continue','common.edit':'Edit',
'members.title':'Who’s coming?','members.subtitle':'No default friends. Add only the people actually joining.','members.inviteTitle':'Invite by link','members.inviteCopy':'Copy the trip link after adding people.','members.copy':'Copy link',
'activities.title':'Plans & Events','activities.subtitle':'Choose suggestions or add your own. Everything can be removed later.','activities.custom':'Add your own event','activities.generate':'Create my trip',
'overview.trip':'TRIP OVERVIEW','overview.days':'Days','overview.travelers':'Travelers','overview.events':'Events','overview.itinerary':'Stops / itinerary','overview.addStop':'Add stop','overview.eventsTitle':'Plans','overview.outfits':'Outfits','overview.pack':'Packing','overview.shared':'Shared','overview.editTrip':'Edit trip basics',
'outfits.title':'Outfit Plan','outfits.subtitle':'Add one look per day or event.','outfits.add':'Add outfit',
'packing.title':'Packing List','packing.subtitle':'Add, delete, and check off anything you want.','packing.packed':'packed','packing.all':'All','packing.clothes':'Clothes','packing.essentials':'Essentials',
'shared.title':'Shared Items','shared.subtitle':'Assign each item to a traveler. Add or remove anything.','shared.assigned':'Assigned','shared.unassigned':'Unassigned','shared.packed':'Packed',
'stop.title':'Add a stop','modal.add':'Add'
},zh:{
'nav.home':'主页','nav.packing':'行李','nav.outfits':'穿搭','nav.shared':'共享','home.eyebrow':'下一段旅程','home.title1':'轻装出发，','home.title2':'漂亮旅行。','home.subtitle':'从零创建自己的旅行，规划穿搭，并和朋友分工共享行李。','home.start':'创建旅行','home.continue':'继续我的旅行',
'create.title':'创建旅行','create.subtitle':'从你真正要去的地点和日期开始。','create.tripname':'旅行名称','create.destination':'目的地','create.start':'开始日期','create.end':'结束日期','create.triptype':'旅行类型','create.leisure':'休闲','create.business':'商务','create.mixed':'混合',
'common.next':'下一步','common.continue':'继续','common.edit':'编辑',
'members.title':'谁一起去？','members.subtitle':'不默认添加任何朋友，只加入真正同行的人。','members.inviteTitle':'邀请链接','members.inviteCopy':'添加同行人后，可以复制旅行链接。','members.copy':'复制链接',
'activities.title':'活动 / Event','activities.subtitle':'可以选推荐活动，也可以自己新增，之后都能删除。','activities.custom':'添加自定义活动','activities.generate':'创建我的旅行',
'overview.trip':'旅行总览','overview.days':'天数','overview.travelers':'同行人','overview.events':'活动','overview.itinerary':'城市 / 行程','overview.addStop':'添加地点','overview.eventsTitle':'活动','overview.outfits':'穿搭','overview.pack':'行李','overview.shared':'共享','overview.editTrip':'编辑旅行基础信息',
'outfits.title':'穿搭计划','outfits.subtitle':'按天或活动自由添加穿搭。','outfits.add':'添加穿搭',
'packing.title':'行李清单','packing.subtitle':'所有东西都可以新增、删除、勾选。','packing.packed':'已打包','packing.all':'全部','packing.clothes':'衣物','packing.essentials':'必需品',
'shared.title':'共享物品','shared.subtitle':'每件共享物品都可以分配给同行人，也可以随时增删。','shared.assigned':'已分配','shared.unassigned':'未分配','shared.packed':'已打包',
'stop.title':'添加地点','modal.add':'添加'
}};

const suggestedActivities=[['📷','Sightseeing','观光'],['🏖','Beach','海滩'],['🥾','Hiking','徒步'],['🍽','Dining','餐厅'],['🍸','Night out','夜生活'],['🏛','Museum','博物馆'],['🛍','Shopping','购物'],['🧘','Wellness','放松'],['💻','Work','工作'],['🍷','Wine tasting','品酒'],['🎵','Concert','演出'],['🚤','Boat day','出海']];
function t(k){return dict[state.lang][k]||k}
function applyTranslations(){document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));document.querySelectorAll('[data-ph-en]').forEach(el=>el.placeholder=state.lang==='en'?el.dataset.phEn:el.dataset.phZh)}
function setLang(lang){state.lang=lang;localStorage.setItem('voya-lang',lang);saveState();document.getElementById('langToggle').textContent=lang==='en'?'中':'EN';applyTranslations();rerenderCurrent()}
let currentPage='home';
function navigate(page){currentPage=page;const tpl=document.getElementById(page+'Tpl'),app=document.getElementById('app');if(!tpl)return;app.innerHTML='';app.appendChild(tpl.content.cloneNode(true));const nav=document.getElementById('bottomNav');if(['overview','outfits','packing','shared'].includes(page))nav.classList.remove('hidden');else nav.classList.add('hidden');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));applyTranslations();hydratePage(page);window.scrollTo({top:0,behavior:'instant'})}
function rerenderCurrent(){navigate(currentPage)}
function hydratePage(page){if(page==='home')renderHome();if(page==='create')renderCreate();if(page==='members')renderMembers();if(page==='activities')renderActivities();if(page==='overview')renderOverview();if(page==='outfits')renderOutfits();if(page==='packing')renderPacking();if(page==='shared')renderShared()}
function startNewTrip(){state={...structuredClone(defaultState),lang:state.lang};saveState();navigate('create')}
function hasTrip(){return !!(state.trip.name||state.trip.destination||state.trip.startDate||state.stops.length)}
function renderHome(){document.getElementById('continueTripBtn')?.classList.toggle('hidden',!hasTrip())}
function renderCreate(){tripName.value=state.trip.name;destination.value=state.trip.destination;startDate.value=state.trip.startDate;endDate.value=state.trip.endDate;document.querySelectorAll('#tripTypeChoices .choice').forEach(b=>{b.classList.toggle('active',b.dataset.value===state.trip.type);b.onclick=()=>{state.trip.type=b.dataset.value;document.querySelectorAll('#tripTypeChoices .choice').forEach(x=>x.classList.remove('active'));b.classList.add('active')}})}
function saveTripBasics(){state.trip.name=tripName.value.trim();state.trip.destination=destination.value.trim();state.trip.startDate=startDate.value;state.trip.endDate=endDate.value;if(!state.trip.destination){showToast(state.lang==='en'?'Please add a destination':'请先填写目的地');return}if(state.trip.startDate&&state.trip.endDate&&state.trip.endDate<state.trip.startDate){showToast(state.lang==='en'?'End date must be after start date':'结束日期要晚于开始日期');return}saveState();navigate('members')}

function renderMembers(){const el=document.getElementById('membersList');const you=`<div class="member-row"><div class="avatar">Y</div><div class="meta"><b>${state.lang==='en'?'You':'你'}</b><small>${state.lang==='en'?'Trip owner':'旅行创建者'}</small></div><span class="pill">${state.lang==='en'?'Owner':'创建者'}</span></div>`;const others=state.members.map((m,i)=>`<div class="member-row"><div class="avatar">${escapeHtml(m.name[0]?.toUpperCase()||'?')}</div><div class="meta"><b>${escapeHtml(m.name)}</b><small>${state.lang==='en'?'Traveler':'同行人'}</small></div><button class="delete-btn" onclick="removeMember(${i})">×</button></div>`).join('');el.innerHTML=you+others}
function addMemberFromInput(){const input=document.getElementById('memberName'),name=input.value.trim();if(!name)return;state.members.push({name});input.value='';saveState();renderMembers()}
function removeMember(i){const removed=state.members[i]?.name;state.members.splice(i,1);state.shared.forEach(x=>{if(x.who===removed)x.who=''});saveState();renderMembers()}

function renderActivities(){const grid=document.getElementById('activityGrid');grid.innerHTML=suggestedActivities.map(a=>`<button class="activity ${state.activities.includes(a[1])?'active':''}" onclick="toggleSuggestedActivity('${a[1]}')"><span class="icon">${a[0]}</span><small>${state.lang==='en'?a[1]:a[2]}</small></button>`).join('');renderSelectedActivities()}
function toggleSuggestedActivity(name){const i=state.activities.indexOf(name);if(i>=0)state.activities.splice(i,1);else state.activities.push(name);saveState();renderActivities()}
function addCustomActivity(){const input=document.getElementById('customActivity'),name=input.value.trim();if(!name)return;if(!state.customActivities.includes(name))state.customActivities.push(name);input.value='';saveState();renderSelectedActivities()}
function allActivities(){return [...state.activities,...state.customActivities]}
function renderSelectedActivities(){const el=document.getElementById('selectedActivities');if(!el)return;const all=allActivities();el.innerHTML=all.length?all.map((a,i)=>`<span class="chip">${escapeHtml(a)}<button onclick="removeActivity('${encodeURIComponent(a)}')">×</button></span>`).join(''):`<div class="empty-state">${state.lang==='en'?'No plans selected yet.':'还没有添加活动。'}</div>`}
function removeActivity(encoded){const a=decodeURIComponent(encoded);state.activities=state.activities.filter(x=>x!==a);state.customActivities=state.customActivities.filter(x=>x!==a);saveState();renderActivities()}
function saveAndOverview(){if(!state.stops.length&&state.trip.destination)state.stops=[{city:state.trip.destination,start:state.trip.startDate,end:state.trip.endDate}];saveState();navigate('overview')}

function renderOverview(){overviewName.textContent=state.trip.name||state.trip.destination|| (state.lang==='en'?'My Trip':'我的旅行');overviewDates.textContent=formatRange(state.trip.startDate,state.trip.endDate);overviewDestination.textContent='📍 '+(state.trip.destination||'—');dayCount.textContent=calcDays();memberCount.textContent=1+state.members.length;eventCount.textContent=allActivities().length;renderStops();overviewActivities.innerHTML=allActivities().length?allActivities().map(a=>`<span class="chip plain">${escapeHtml(a)}</span>`).join(''):`<div class="empty-state">${state.lang==='en'?'No plans yet. Tap Edit to add some.':'还没有活动，点“编辑”添加。'}</div>`}
function calcDays(){if(!state.trip.startDate||!state.trip.endDate)return '—';return Math.max(1,Math.round((new Date(state.trip.endDate)-new Date(state.trip.startDate))/86400000)+1)}
function formatRange(a,b){if(!a&&!b)return state.lang==='en'?'Dates not set':'未设置日期';const f=d=>d?new Date(d+'T12:00:00').toLocaleDateString(state.lang==='en'?'en-US':'zh-CN',{month:'short',day:'numeric',year:'numeric'}):'—';return `${f(a)} — ${f(b)}`}
function renderStops(){const el=document.getElementById('stopsList');el.innerHTML=state.stops.length?state.stops.map((s,i)=>`<div class="it-card"><div class="city-thumb">${escapeHtml((s.city||'?')[0].toUpperCase())}</div><div><b>${escapeHtml(s.city)}</b><small>${formatRange(s.start,s.end)}</small></div><button class="delete-btn" onclick="removeStop(${i})">×</button></div>`).join(''):`<div class="empty-state">${state.lang==='en'?'No stops yet. Add cities or places as you plan.':'还没有地点，可以按行程逐个添加城市或地点。'}</div>`}
function openStopModal(){document.body.appendChild(document.getElementById('stopModalTpl').content.cloneNode(true));applyTranslations()}
function saveStop(){const city=document.getElementById('stopCity').value.trim(),start=document.getElementById('stopStart').value,end=document.getElementById('stopEnd').value;if(!city)return;state.stops.push({city,start,end});saveState();document.querySelector('.modal-backdrop').remove();renderOverview()}
function removeStop(i){state.stops.splice(i,1);saveState();renderStops()}

let outfitPerson='You';
function renderOutfits(){const tabs=document.getElementById('outfitTabs');const people=['You',...state.members.map(m=>m.name)];if(!people.includes(outfitPerson))outfitPerson='You';tabs.innerHTML=people.map(p=>`<button class="${p===outfitPerson?'active':''}" onclick="outfitPerson='${escapeJs(p)}';renderOutfits()">${escapeHtml(p==='You'?(state.lang==='en'?'Me':'我'):p)}</button>`).join('');const cards=document.getElementById('outfitCards');const list=state.outfits.filter(o=>o.person===outfitPerson);cards.innerHTML=list.length?list.map((o,i)=>`<div class="outfit-card"><div class="outfit-top"><div><small>${escapeHtml(o.day||'')}</small><br><b>${escapeHtml(o.title)}</b></div><button class="delete-btn" onclick="removeOutfit('${o.id}')">×</button></div><div class="look-canvas">${escapeHtml(o.note||'♡')}</div></div>`).join(''):`<div class="empty-state">${state.lang==='en'?'No outfits yet. Add looks as you plan them.':'还没有穿搭，按天或活动自己添加。'}</div>`}
function addOutfit(){const title=prompt(state.lang==='en'?'Outfit name / event':'穿搭名称 / 对应活动');if(!title)return;const day=prompt(state.lang==='en'?'Day or date (optional)':'第几天或日期（可选）')||'';const note=prompt(state.lang==='en'?'Items / notes (optional)':'单品 / 备注（可选）')||'';state.outfits.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),person:outfitPerson,title,day,note});saveState();renderOutfits()}
function removeOutfit(id){state.outfits=state.outfits.filter(o=>o.id!==id);saveState();renderOutfits()}

let packFilter='all';
function renderPacking(){const list=document.getElementById('packingList');const items=state.packing.filter(x=>packFilter==='all'||x.cat===packFilter);list.innerHTML=items.length?items.map((item,i)=>`<div class="check-row"><input type="checkbox" ${item.packed?'checked':''} onchange="togglePack('${item.id}',this.checked)"><span class="grow">${escapeHtml(item.name)}</span><small>${item.cat==='clothes'?(state.lang==='en'?'Clothes':'衣物'):(state.lang==='en'?'Essentials':'必需品')}</small><button class="delete-btn" onclick="removePack('${item.id}')">×</button></div>`).join(''):`<div class="empty-state">${state.lang==='en'?'Your packing list is empty. Add anything you need.':'行李清单还是空的，按需要自己添加。'}</div>`;document.querySelectorAll('.packing-filters button').forEach(b=>{b.classList.toggle('active',b.dataset.filter===packFilter);b.onclick=()=>{packFilter=b.dataset.filter;renderPacking()}});updatePackProgress();document.getElementById('packingItemCat').options[0].text=state.lang==='en'?'Clothes':'衣物';document.getElementById('packingItemCat').options[1].text=state.lang==='en'?'Essentials':'必需品'}
function addPackingItem(){const input=document.getElementById('packingItemName'),name=input.value.trim();if(!name)return;state.packing.push({id:String(Date.now())+Math.random(),name,cat:document.getElementById('packingItemCat').value,packed:false});input.value='';saveState();renderPacking()}
function togglePack(id,val){const x=state.packing.find(i=>i.id===id);if(x)x.packed=val;saveState();updatePackProgress()}
function removePack(id){state.packing=state.packing.filter(x=>x.id!==id);saveState();renderPacking()}
function updatePackProgress(){const packed=state.packing.filter(x=>x.packed).length,total=state.packing.length;if(document.getElementById('packProgressText'))packProgressText.textContent=`${packed} / ${total}`;if(document.getElementById('packProgressBar'))packProgressBar.style.width=`${total?Math.round(packed/total*100):0}%`}

function renderShared(){const el=document.getElementById('sharedList');const people=['', 'You',...state.members.map(m=>m.name)];el.innerHTML=state.shared.length?state.shared.map(x=>`<div class="shared-row"><div class="shared-main"><input type="checkbox" ${x.packed?'checked':''} onchange="toggleSharedPack('${x.id}',this.checked)"><div class="grow"><b>${escapeHtml(x.name)}</b></div><select class="assignee" onchange="assignShared('${x.id}',this.value)">${people.map(p=>`<option value="${escapeHtml(p)}" ${x.who===p?'selected':''}>${p===''?(state.lang==='en'?'Unassigned':'未分配'):p==='You'?(state.lang==='en'?'Me':'我'):escapeHtml(p)}</option>`).join('')}</select><button class="delete-btn" onclick="removeShared('${x.id}')">×</button></div></div>`).join(''):`<div class="empty-state">${state.lang==='en'?'No shared items yet. Add only what needs to be split between travelers.':'还没有共享物品，只添加需要同行人分工携带的东西。'}</div>`;updateSharedSummary()}
function addSharedItem(){const input=document.getElementById('sharedItemName'),name=input.value.trim();if(!name)return;state.shared.push({id:String(Date.now())+Math.random(),name,who:'',packed:false});input.value='';saveState();renderShared()}
function assignShared(id,who){const x=state.shared.find(i=>i.id===id);if(x)x.who=who;saveState();updateSharedSummary()}
function toggleSharedPack(id,val){const x=state.shared.find(i=>i.id===id);if(x)x.packed=val;saveState();updateSharedSummary()}
function removeShared(id){state.shared=state.shared.filter(x=>x.id!==id);saveState();renderShared()}
function updateSharedSummary(){assignedCount.textContent=state.shared.filter(x=>x.who).length;unassignedCount.textContent=state.shared.filter(x=>!x.who).length;sharedPackedCount.textContent=state.shared.filter(x=>x.packed).length}

function copyInvite(){navigator.clipboard?.writeText(window.location.href);showToast(state.lang==='en'?'Trip link copied':'旅行链接已复制')}
function closeModal(e){if(e.target.classList.contains('modal-backdrop'))e.target.remove()}
function showToast(msg){const n=document.createElement('div');n.className='toast';n.textContent=msg;document.body.appendChild(n);setTimeout(()=>n.remove(),1800)}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function escapeJs(s=''){return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}

document.getElementById('langToggle').onclick=()=>setLang(state.lang==='en'?'zh':'en');
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
setLang(state.lang);navigate('home');
