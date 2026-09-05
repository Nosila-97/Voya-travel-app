const KEY='voya-v4';
const LEGACY='voya-v3';
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(36).slice(2);
const emptyTrip=()=>({id:uid(),name:'',destination:'',startDate:'',endDate:'',type:'leisure',members:[],activities:[],customActivities:[],stops:[],packing:[],shared:[],outfits:[],createdAt:Date.now(),updatedAt:Date.now()});
let store=loadStore();
let currentPage='trips';
let packCategory='clothes';
let packPerson='You';
let outfitPerson='You';
let packDraftImage='';

const dict={en:{
'nav.trip':'Trip','nav.pack':'Pack','nav.outfits':'Looks','nav.shared':'Shared','trips.eyebrow':'YOUR TRIPS','trips.title':'Where to next?','trips.subtitle':'Keep every trip, packing list and outfit plan in one place.','trips.new':'New trip',
'edit.title':'Trip details','edit.subtitle':'Start with the basics. You can change everything later.','edit.name':'Trip name','edit.destination':'Main destination','edit.start':'Start','edit.end':'End','edit.type':'Trip type',
'common.cancel':'Cancel','common.saveContinue':'Save & continue','common.back':'Back','common.save':'Save','common.edit':'Edit',
'members.title':'Travelers','members.subtitle':'Add only the people actually joining. Remove anyone anytime.','plans.title':'Plans & events','plans.subtitle':'Tap suggestions or add your own. Nothing is permanent.','plans.custom':'Add your own',
'trip.overview':'TRIP OVERVIEW','trip.days':'Days','trip.travelers':'Travelers','trip.packed':'Packed','trip.stops':'Stops','trip.addStop':'Add stop','trip.plans':'Plans','trip.travelersTitle':'Travelers','trip.pack':'Packing','trip.looks':'Outfits','trip.shared':'Shared','trip.delete':'Delete this trip',
'packing.title':'Packing list','packing.subtitle':'Choose a type, then add the exact piece you are bringing. Add a photo so everyone can recognize it.','packing.packed':' packed','packing.addExact':'Add exact item','packing.photo':'Photo','packing.itemName':'Exact item name','packing.type':'Type','packing.person':'Whose item?','packing.note':'Note / event','packing.choosePhoto':'Choose photo','packing.changePhoto':'Change photo',
'outfits.title':'Outfit plan','outfits.subtitle':'Plan by person, date or event.','outfits.add':'Add outfit','shared.title':'Shared items','shared.subtitle':"Decide who brings what so you don't duplicate things.",'stop.title':'Add stop','outfitModal.title':'Add outfit'
},zh:{
'nav.trip':'行程','nav.pack':'行李','nav.outfits':'穿搭','nav.shared':'共享','trips.eyebrow':'我的旅行','trips.title':'下一站去哪？','trips.subtitle':'把每次旅行、行李清单和穿搭计划都放在一起。','trips.new':'新建旅行',
'edit.title':'旅行信息','edit.subtitle':'先填基础信息，之后所有内容都可以修改。','edit.name':'旅行名称','edit.destination':'主要目的地','edit.start':'开始','edit.end':'结束','edit.type':'旅行类型',
'common.cancel':'取消','common.saveContinue':'保存并继续','common.back':'返回','common.save':'保存','common.edit':'编辑',
'members.title':'同行人','members.subtitle':'只添加真正同行的人，之后随时可以删除。','plans.title':'活动 / Event','plans.subtitle':'点选推荐活动或自己新增，之后都能改。','plans.custom':'自己添加',
'trip.overview':'旅行总览','trip.days':'天数','trip.travelers':'同行人','trip.packed':'已打包','trip.stops':'地点','trip.addStop':'添加地点','trip.plans':'活动','trip.travelersTitle':'同行人','trip.pack':'行李','trip.looks':'穿搭','trip.shared':'共享','trip.delete':'删除这次旅行',
'packing.title':'行李清单','packing.subtitle':'先选类型，再添加这次真正要带的具体单品。可以加图片，大家一眼就知道是哪件。','packing.packed':' 已打包','packing.addExact':'添加具体单品','packing.photo':'图片','packing.itemName':'具体单品名称','packing.type':'类型','packing.person':'谁的单品？','packing.note':'备注 / 对应活动','packing.choosePhoto':'选择图片','packing.changePhoto':'更换图片',
'outfits.title':'穿搭计划','outfits.subtitle':'按人、日期或活动来规划。','outfits.add':'添加穿搭','shared.title':'共享物品','shared.subtitle':'分配谁带什么，避免重复。','stop.title':'添加地点','outfitModal.title':'添加穿搭'
}};

const activitySuggestions=[['📷','Sightseeing','观光'],['🏖','Beach','海滩'],['🥾','Hiking','徒步'],['🍽','Dining','餐厅'],['🍸','Night out','夜生活'],['🏛','Museum','博物馆'],['🛍','Shopping','购物'],['🧘','Wellness','放松'],['💻','Work','工作'],['🍷','Wine tasting','品酒'],['🎵','Concert','演出'],['🚤','Boat day','出海']];
const categories={
clothes:{en:'Clothes',zh:'衣物',items:['T-shirt','Tank top','Shirt','Dress','Pants','Jeans','Shorts','Skirt','Sweater / cardigan','Jacket','Sleepwear','Underwear','Socks','Swimsuit']},
shoes:{en:'Shoes',zh:'鞋子',items:['Sneakers','Sandals','Heels','Flats','Hiking shoes','Flip-flops','Boots']},
toiletries:{en:'Toiletries',zh:'洗护',items:['Toothbrush','Toothpaste','Cleanser','Moisturizer','Sunscreen','Shampoo','Conditioner','Body wash','Makeup','Makeup remover','Hairbrush','Razor']},
electronics:{en:'Electronics',zh:'电子',items:['Phone charger','Power bank','Universal adapter','Camera','Camera charger','Earbuds','Watch charger','Laptop','Laptop charger']},
documents:{en:'Documents',zh:'证件',items:['Passport','Visa','ID','Flight tickets','Hotel confirmations','Travel insurance','Driver license','Credit cards','Cash']},
health:{en:'Health',zh:'健康',items:['Medication','Painkiller','Band-aids','Motion sickness pills','Allergy medicine','Vitamins','Contact lenses','Glasses']},
accessories:{en:'Accessories',zh:'配饰',items:['Sunglasses','Hat','Jewelry','Belt','Scarf','Handbag','Tote bag','Umbrella']}
};
const sharedPreset=['Universal adapter','Sunscreen','Camera','Tripod','Hair dryer','First aid kit','Laundry detergent','Umbrella','Portable speaker','Snacks'];

function loadStore(){try{let s=JSON.parse(localStorage.getItem(KEY)||'null');if(s?.trips)return s;const old=JSON.parse(localStorage.getItem(LEGACY)||'null');if(old?.trips){old.trips.forEach(tr=>{tr.packing=(tr.packing||[]).map(x=>({id:x.id||uid(),name:x.name||x.label||'Item',type:x.type||x.name||'Item',cat:x.cat||'clothes',person:x.person||'You',note:x.note||'',image:x.image||'',packed:!!x.packed}))});s={...old};localStorage.setItem(KEY,JSON.stringify(s));return s}return{lang:localStorage.getItem('voya-lang')||'en',trips:[],activeTripId:null}}catch(e){return{lang:'en',trips:[],activeTripId:null}}}
function saveStore(show=false){const tr=currentTrip();if(tr)tr.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(store));if(show)showSaved()}
function showSaved(){const el=document.getElementById('saveState');if(!el)return;el.textContent=store.lang==='en'?'Saved ✓':'已保存 ✓';setTimeout(()=>el.textContent='',1400)}
function currentTrip(){return store.trips.find(t=>t.id===store.activeTripId)||null}
function t(k){return dict[store.lang][k]||k}
function applyTranslations(){document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));document.querySelectorAll('[data-ph-en]').forEach(el=>el.placeholder=store.lang==='en'?el.dataset.phEn:el.dataset.phZh)}
function setLang(l){store.lang=l;localStorage.setItem('voya-lang',l);saveStore();document.getElementById('langToggle').textContent=l==='en'?'中':'EN';navigate(currentPage,true)}
function navigate(page){if(page!=='trips'&&!currentTrip()&&page!=='edit')return navigate('trips');currentPage=page;const tpl=document.getElementById(page+'Tpl');if(!tpl)return;const app=document.getElementById('app');app.innerHTML='';app.appendChild(tpl.content.cloneNode(true));const back=document.getElementById('globalBack');back.classList.toggle('hidden',page==='trips');back.onclick=smartBack;const nav=document.getElementById('bottomNav');const navPages=['trip','packing','outfits','shared'];nav.classList.toggle('hidden',!navPages.includes(page));document.querySelectorAll('#bottomNav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));applyTranslations();hydrate(page);window.scrollTo({top:0,behavior:'instant'})}
function goTrips(){navigate('trips')}
function smartBack(){const map={edit:'trips',members:'edit',plans:'members',trip:'trips',packing:'trip',outfits:'trip',shared:'trip'};navigate(map[currentPage]||'trips')}
function hydrate(page){({trips:renderTrips,edit:renderEdit,members:renderMembers,plans:renderPlans,trip:renderTrip,packing:renderPacking,outfits:renderOutfits,shared:renderShared}[page]||(()=>{}))()}

function createTrip(){const tr=emptyTrip();store.trips.unshift(tr);store.activeTripId=tr.id;saveStore();navigate('edit')}
function openTrip(id){store.activeTripId=id;saveStore();navigate('trip')}
function editTrip(id){store.activeTripId=id;saveStore();navigate('edit')}
function renderTrips(){const el=document.getElementById('tripCards');if(!store.trips.length){el.innerHTML=`<div class="empty-state">${store.lang==='en'?'No trips yet. Create one to get started.':'还没有旅行，先新建一个吧。'}</div>`;return}el.innerHTML=store.trips.map(tr=>{const total=tr.packing.length,done=tr.packing.filter(x=>x.packed).length,pct=total?Math.round(done/total*100):0;return `<div class="trip-card"><div class="trip-card-top"><div><div class="eyebrow">${escapeHtml(formatRange(tr.startDate,tr.endDate))}</div><h3>${escapeHtml(tr.name||tr.destination||'Untitled trip')}</h3><p>📍 ${escapeHtml(tr.destination||'—')}</p></div><button class="ghost-btn" onclick="toggleTripMenu(event,'${tr.id}')">•••</button></div><div class="mini-stats"><span class="mini-stat">${calcDays(tr)} ${store.lang==='en'?'days':'天'}</span><span class="mini-stat">${1+tr.members.length} ${store.lang==='en'?'travelers':'人'}</span><span class="mini-stat">${pct}% ${store.lang==='en'?'packed':'已打包'}</span></div><div class="trip-actions"><button class="open" onclick="openTrip('${tr.id}')">${store.lang==='en'?'Open trip':'进入旅行'}</button><button class="edit" onclick="editTrip('${tr.id}')">${store.lang==='en'?'Edit':'编辑'}</button></div></div>`}).join('')}
function toggleTripMenu(e,id){document.querySelector('.menu')?.remove();const m=document.createElement('div');m.className='menu';m.innerHTML=`<button onclick="duplicateTrip('${id}')">${store.lang==='en'?'Duplicate trip':'复制旅行'}</button><button onclick="deleteTrip('${id}')">${store.lang==='en'?'Delete trip':'删除旅行'}</button>`;e.currentTarget.parentElement.appendChild(m)}
function duplicateTrip(id){const src=store.trips.find(t=>t.id===id);if(!src)return;const cp=JSON.parse(JSON.stringify(src));cp.id=uid();cp.name=(cp.name||cp.destination||'Trip')+(store.lang==='en'?' copy':' 副本');cp.createdAt=cp.updatedAt=Date.now();store.trips.unshift(cp);saveStore(true);renderTrips()}
function deleteTrip(id){if(!confirm(store.lang==='en'?'Delete this trip?':'确定删除这次旅行？'))return;store.trips=store.trips.filter(t=>t.id!==id);if(store.activeTripId===id)store.activeTripId=store.trips[0]?.id||null;saveStore(true);navigate('trips')}
function deleteCurrentTrip(){const tr=currentTrip();if(tr)deleteTrip(tr.id)}

function renderEdit(){const tr=currentTrip();tripName.value=tr.name;destination.value=tr.destination;startDate.value=tr.startDate;endDate.value=tr.endDate;const types=[['leisure','✈️','Leisure','休闲'],['business','💼','Business','商务'],['mixed','♡','Mixed','混合']];tripTypes.innerHTML=types.map(x=>`<button class="choice ${tr.type===x[0]?'active':''}" onclick="setTripType('${x[0]}')">${x[1]}<span>${store.lang==='en'?x[2]:x[3]}</span></button>`).join('')}
function setTripType(v){currentTrip().type=v;saveStore();renderEdit()}
function saveTripDetails(goNext=false){const tr=currentTrip();tr.name=tripName.value.trim();tr.destination=destination.value.trim();tr.startDate=startDate.value;tr.endDate=endDate.value;if(!tr.destination){showToast(store.lang==='en'?'Add a destination first':'请先填写目的地');return}if(tr.startDate&&tr.endDate&&tr.endDate<tr.startDate){showToast(store.lang==='en'?'End date must be after start date':'结束日期要晚于开始日期');return}saveStore(true);if(goNext)navigate('members')}
function cancelEdit(){const tr=currentTrip();if(!tr.destination&&!tr.name&&!tr.members.length&&!tr.packing.length){store.trips=store.trips.filter(x=>x.id!==tr.id);store.activeTripId=store.trips[0]?.id||null;saveStore()}navigate('trips')}

function renderMembers(){const tr=currentTrip();membersList.innerHTML=`<div class="member-row"><div class="avatar">Y</div><div class="meta"><b>${store.lang==='en'?'You':'你'}</b><small>${store.lang==='en'?'Trip owner':'旅行创建者'}</small></div><span class="pill">${store.lang==='en'?'Owner':'创建者'}</span></div>`+tr.members.map((m,i)=>`<div class="member-row"><div class="avatar">${escapeHtml(m.name[0]?.toUpperCase()||'?')}</div><div class="meta"><b>${escapeHtml(m.name)}</b></div><button class="delete-btn" onclick="removeMember(${i})">×</button></div>`).join('')}
function addMember(){const tr=currentTrip(),input=memberName,name=input.value.trim();if(!name)return;tr.members.push({name});input.value='';saveStore();renderMembers()}
function removeMember(i){const tr=currentTrip(),removed=tr.members[i]?.name;tr.members.splice(i,1);tr.shared.forEach(x=>{if(x.who===removed)x.who=''});tr.packing.forEach(x=>{if(x.person===removed)x.person='You'});saveStore();renderMembers()}
function saveMembers(){saveStore(true);navigate('plans')}

function renderPlans(){const tr=currentTrip();activityGrid.innerHTML=activitySuggestions.map(a=>`<button class="activity ${tr.activities.includes(a[1])?'active':''}" onclick="toggleActivity('${a[1]}')"><span class="icon">${a[0]}</span><small>${store.lang==='en'?a[1]:a[2]}</small></button>`).join('');renderSelectedActivities()}
function toggleActivity(name){const tr=currentTrip(),i=tr.activities.indexOf(name);i>=0?tr.activities.splice(i,1):tr.activities.push(name);saveStore();renderPlans()}
function addCustomActivity(){const tr=currentTrip(),input=customActivity,name=input.value.trim();if(!name)return;if(!tr.customActivities.includes(name))tr.customActivities.push(name);input.value='';saveStore();renderSelectedActivities()}
function allActivities(tr=currentTrip()){return[...tr.activities,...tr.customActivities]}
function renderSelectedActivities(){const tr=currentTrip(),all=allActivities(tr);selectedActivities.innerHTML=all.map(a=>`<span class="chip">${escapeHtml(a)}<button onclick="removeActivity('${encodeURIComponent(a)}')">×</button></span>`).join('')||`<div class="empty-state">${store.lang==='en'?'No plans selected yet.':'还没有活动。'}</div>`}
function removeActivity(encoded){const tr=currentTrip(),a=decodeURIComponent(encoded);tr.activities=tr.activities.filter(x=>x!==a);tr.customActivities=tr.customActivities.filter(x=>x!==a);saveStore();renderPlans()}
function savePlans(){const tr=currentTrip();if(!tr.stops.length&&tr.destination)tr.stops=[{city:tr.destination,start:tr.startDate,end:tr.endDate}];saveStore(true);navigate('trip')}

function renderTrip(){const tr=currentTrip();overviewName.textContent=tr.name||tr.destination||'Trip';overviewDates.textContent=formatRange(tr.startDate,tr.endDate);overviewDestination.textContent='📍 '+(tr.destination||'—');dayCount.textContent=calcDays(tr);memberCount.textContent=1+tr.members.length;const total=tr.packing.length,done=tr.packing.filter(x=>x.packed).length;packCount.textContent=total?Math.round(done/total*100)+'%':'0%';renderStops();overviewActivities.innerHTML=allActivities(tr).map(a=>`<span class="chip plain">${escapeHtml(a)}</span>`).join('')||`<div class="empty-state">${store.lang==='en'?'No plans yet.':'还没有活动。'}</div>`;travelerChips.innerHTML=[store.lang==='en'?'You':'你',...tr.members.map(m=>m.name)].map(x=>`<span class="chip plain">${escapeHtml(x)}</span>`).join('')}
function calcDays(tr){if(!tr.startDate||!tr.endDate)return '—';return Math.max(1,Math.round((new Date(tr.endDate)-new Date(tr.startDate))/86400000)+1)}
function formatRange(a,b){if(!a&&!b)return store.lang==='en'?'Dates not set':'未设置日期';const f=d=>d?new Date(d+'T12:00:00').toLocaleDateString(store.lang==='en'?'en-US':'zh-CN',{month:'short',day:'numeric'}):'—';return `${f(a)} — ${f(b)}`}
function renderStops(){const tr=currentTrip();stopsList.innerHTML=tr.stops.map((s,i)=>`<div class="it-card"><div class="city-thumb">${escapeHtml((s.city||'?')[0].toUpperCase())}</div><div><b>${escapeHtml(s.city)}</b><small>${escapeHtml(formatRange(s.start,s.end))}</small></div><button class="delete-btn" onclick="removeStop(${i})">×</button></div>`).join('')||`<div class="empty-state">${store.lang==='en'?'No stops yet.':'还没有地点。'}</div>`}
function openStopModal(){document.body.appendChild(document.getElementById('stopModalTpl').content.cloneNode(true));applyTranslations()}
function saveStop(){const tr=currentTrip(),city=stopCity.value.trim();if(!city)return;tr.stops.push({city,start:stopStart.value,end:stopEnd.value});saveStore(true);closeModalButton();renderTrip()}
function removeStop(i){currentTrip().stops.splice(i,1);saveStore();renderStops()}

function people(){const tr=currentTrip();return ['You',...tr.members.map(m=>m.name)]}
function renderPacking(){const tr=currentTrip();if(!people().includes(packPerson))packPerson='You';renderPackPeople();renderCategoryTabs();renderPresets();renderPackItems();updatePackProgress()}
function renderPackPeople(){const el=document.getElementById('packPeople');if(!el)return;el.innerHTML=people().map(p=>`<button class="${p===packPerson?'active':''}" onclick="packPerson='${escapeJs(p)}';renderPacking()">${escapeHtml(p==='You'?(store.lang==='en'?'Me':'我'):p)}</button>`).join('')}
function renderCategoryTabs(){categoryTabs.innerHTML=Object.entries(categories).map(([k,v])=>`<button class="${k===packCategory?'active':''}" onclick="packCategory='${k}';renderPacking()">${store.lang==='en'?v.en:v.zh}</button>`).join('')}
function renderPresets(){const c=categories[packCategory];presetBox.innerHTML=`<div class="preset-title">${store.lang==='en'?'What are you bringing? Tap a type, then specify the exact piece.':'这次要带什么？先点类型，再填写具体是哪一件。'}</div><div class="preset-chips">${c.items.map(type=>`<button onclick="openPackItemModal('${encodeURIComponent(type)}')">＋ ${escapeHtml(type)}</button>`).join('')}</div>`}
function renderPackItems(){const tr=currentTrip();const list=tr.packing.filter(x=>x.cat===packCategory&&x.person===packPerson);packingList.innerHTML=list.length?`<div class="pack-grid">${list.map(x=>packCard(x)).join('')}</div>`:`<div class="empty-state">${store.lang==='en'?'No exact items added here yet. Tap a type above to add the actual piece.':'这里还没有具体单品。点上面的类型添加这次真正要带的那一件。'}</div>`}
function packCard(x){const person=x.person==='You'?(store.lang==='en'?'Me':'我'):x.person;return `<article class="pack-card ${x.packed?'is-packed':''}"><div class="pack-photo ${x.image?'has-image':''}" onclick="editPackItem('${x.id}')">${x.image?`<img src="${x.image}" alt="">`:`<span>＋<small>${store.lang==='en'?'photo':'图片'}</small></span>`}</div><div class="pack-card-body"><div class="pack-type">${escapeHtml(x.type||'Item')} · ${escapeHtml(person)}</div><div class="pack-name">${escapeHtml(x.name)}</div>${x.note?`<div class="pack-note">${escapeHtml(x.note)}</div>`:''}<div class="pack-card-actions"><label class="pack-check"><input type="checkbox" ${x.packed?'checked':''} onchange="togglePack('${x.id}',this.checked)"><span>${store.lang==='en'?'Packed':'已打包'}</span></label><button onclick="editPackItem('${x.id}')">✎</button><button onclick="removePack('${x.id}')">×</button></div></div></article>`}
function openPackItemModal(encodedType='',id=''){const type=decodeURIComponent(encodedType||'');const tr=currentTrip();const item=id?tr.packing.find(x=>x.id===id):null;packDraftImage=item?.image||'';document.body.appendChild(document.getElementById('packItemModalTpl').content.cloneNode(true));applyTranslations();packItemId.value=item?.id||'';packItemType.value=item?.type||type;packItemName.value=item?.name||'';packItemNote.value=item?.note||'';packItemPerson.innerHTML=people().map(p=>`<option value="${escapeHtml(p)}" ${p===(item?.person||packPerson)?'selected':''}>${escapeHtml(p==='You'?(store.lang==='en'?'Me':'我'):p)}</option>`).join('');updatePackPhotoPreview();setTimeout(()=>packItemName.focus(),50)}
function editPackItem(id){openPackItemModal('',id)}
function handlePackPhoto(input){const file=input.files?.[0];if(!file)return;compressImage(file,900,.72).then(data=>{packDraftImage=data;updatePackPhotoPreview()}).catch(()=>showToast(store.lang==='en'?'Could not read photo':'图片读取失败'))}
function updatePackPhotoPreview(){const box=document.getElementById('packPhotoPreview');if(!box)return;box.innerHTML=packDraftImage?`<img src="${packDraftImage}" alt=""><button type="button" class="photo-remove" onclick="removeDraftPhoto()">×</button>`:`<div class="photo-empty">＋<small>${store.lang==='en'?'Add photo':'添加图片'}</small></div>`}
function removeDraftPhoto(){packDraftImage='';updatePackPhotoPreview()}
function compressImage(file,max=900,quality=.72){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{let w=img.width,h=img.height;if(Math.max(w,h)>max){const r=max/Math.max(w,h);w=Math.round(w*r);h=Math.round(h*r)}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);resolve(c.toDataURL('image/jpeg',quality))};img.src=reader.result};reader.readAsDataURL(file)})}
function savePackItem(){const tr=currentTrip();const id=packItemId.value;const name=packItemName.value.trim(),type=packItemType.value.trim()||'Item',person=packItemPerson.value||'You',note=packItemNote.value.trim();if(!name){showToast(store.lang==='en'?'Give this exact item a name':'请给这件具体单品起个名字');return}if(id){const x=tr.packing.find(x=>x.id===id);Object.assign(x,{name,type,person,note,image:packDraftImage,cat:packCategory})}else tr.packing.push({id:uid(),name,type,person,note,image:packDraftImage,cat:packCategory,packed:false});packPerson=person;saveStore(true);closeModalButton();renderPacking()}
function togglePack(id,v){const x=currentTrip().packing.find(x=>x.id===id);if(x)x.packed=v;saveStore();renderPacking()}
function removePack(id){const tr=currentTrip();tr.packing=tr.packing.filter(x=>x.id!==id);saveStore();renderPacking()}
function updatePackProgress(){const tr=currentTrip(),done=tr.packing.filter(x=>x.packed).length,total=tr.packing.length;packProgressText.textContent=`${done} / ${total}`;packProgressBar.style.width=(total?Math.round(done/total*100):0)+'%'}
function quickCustomPack(){openPackItemModal('')}

function renderOutfits(){const tr=currentTrip();if(!people().includes(outfitPerson))outfitPerson='You';outfitTabs.innerHTML=people().map(p=>`<button class="${p===outfitPerson?'active':''}" onclick="outfitPerson='${escapeJs(p)}';renderOutfits()">${escapeHtml(p==='You'?(store.lang==='en'?'Me':'我'):p)}</button>`).join('');const list=tr.outfits.filter(o=>o.person===outfitPerson);outfitCards.innerHTML=list.map(o=>`<div class="outfit-card"><div class="outfit-top"><div><small>${escapeHtml(o.date||'')}</small><br><b>${escapeHtml(o.title)}</b></div><button class="delete-btn" onclick="removeOutfit('${o.id}')">×</button></div><div class="look-canvas">${escapeHtml(o.note||'♡')}</div></div>`).join('')||`<div class="empty-state">${store.lang==='en'?'No outfits yet.':'还没有穿搭。'}</div>`}
function openOutfitModal(){document.body.appendChild(document.getElementById('outfitModalTpl').content.cloneNode(true));applyTranslations()}
function saveOutfit(){const title=outfitTitle.value.trim();if(!title)return;currentTrip().outfits.push({id:uid(),person:outfitPerson,title,date:outfitDate.value,note:outfitNote.value.trim()});saveStore(true);closeModalButton();renderOutfits()}
function removeOutfit(id){const tr=currentTrip();tr.outfits=tr.outfits.filter(o=>o.id!==id);saveStore();renderOutfits()}

function renderShared(){const tr=currentTrip();sharedPresets.innerHTML=`<div class="preset-title">${store.lang==='en'?'Quick add':'快速添加'}</div><div class="preset-chips">${sharedPreset.map(x=>`<button onclick="addSharedPreset('${escapeJs(x)}')">＋ ${escapeHtml(x)}</button>`).join('')}</div>`;sharedList.innerHTML=tr.shared.map((x,i)=>`<div class="shared-row"><input type="checkbox" ${x.packed?'checked':''} onchange="trSharedToggle(${i},this.checked)"><div class="grow"><b>${escapeHtml(x.name)}</b></div><select onchange="setSharedWho(${i},this.value)"><option value="">${store.lang==='en'?'Unassigned':'未分配'}</option>${people().map(p=>`<option value="${escapeHtml(p)}" ${x.who===p?'selected':''}>${escapeHtml(p==='You'?(store.lang==='en'?'Me':'我'):p)}</option>`).join('')}</select><button class="delete-btn" onclick="removeShared(${i})">×</button></div>`).join('')||`<div class="empty-state">${store.lang==='en'?'No shared items yet.':'还没有共享物品。'}</div>`}
function addSharedPreset(name){const tr=currentTrip();if(!tr.shared.some(x=>x.name===name))tr.shared.push({name,who:'',packed:false});saveStore();renderShared()}
function addSharedItem(){const input=sharedItemName,name=input.value.trim();if(!name)return;currentTrip().shared.push({name,who:'',packed:false});input.value='';saveStore();renderShared()}
function trSharedToggle(i,v){currentTrip().shared[i].packed=v;saveStore()}
function setSharedWho(i,v){currentTrip().shared[i].who=v;saveStore()}
function removeShared(i){currentTrip().shared.splice(i,1);saveStore();renderShared()}
function explicitSave(){saveStore(true)}

function closeModal(e){if(e.target.classList.contains('modal-backdrop'))e.target.remove()}
function closeModalButton(){document.querySelector('.modal-backdrop')?.remove()}
function showToast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),1800)}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function escapeJs(s=''){return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}

document.getElementById('langToggle').onclick=()=>setLang(store.lang==='en'?'zh':'en');
document.querySelectorAll('#bottomNav button').forEach(b=>b.onclick=()=>navigate(b.dataset.page));
document.getElementById('langToggle').textContent=store.lang==='en'?'中':'EN';
navigate('trips');