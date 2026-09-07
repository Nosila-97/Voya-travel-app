// Voyā flexible packing: photos, exact names and notes are optional.
(function(){
  function lang(en,zh){try{return store.lang==='zh'?zh:en}catch(e){return en}}

  window.savePackItem=function(){
    const tr=currentTrip();
    const id=document.getElementById('packItemId')?.value||'';
    const type=(document.getElementById('packItemType')?.value||'').trim()||lang('Item','物品');
    const typedName=(document.getElementById('packItemName')?.value||'').trim();
    const name=typedName||type;
    const person=document.getElementById('packItemPerson')?.value||'You';
    const note=(document.getElementById('packItemNote')?.value||'').trim();
    if(id){
      const x=tr.packing.find(x=>x.id===id);
      if(x)Object.assign(x,{name,type,person,note,image:packDraftImage||'',cat:packCategory});
    }else{
      tr.packing.push({id:uid(),name,type,person,note,image:packDraftImage||'',cat:packCategory,packed:false});
    }
    packPerson=person;
    saveStore(true);
    closeModalButton();
    renderPacking();
  };

  function makeOptional(){
    const modal=document.querySelector('.pack-item-modal');
    if(!modal)return;
    const name=document.getElementById('packItemName');
    const type=document.getElementById('packItemType');
    const note=document.getElementById('packItemNote');
    if(name){
      name.placeholder=lang('Optional — e.g. black boots','可选，例如：黑色长靴');
      const label=name.previousElementSibling;
      if(label?.classList.contains('field-label'))label.textContent=lang('Specific name (optional)','具体名称（可选）');
    }
    if(type){
      const label=type.previousElementSibling;
      if(label?.classList.contains('field-label'))label.textContent=lang('Item type','物品类型');
    }
    if(note){
      const label=note.previousElementSibling;
      if(label?.classList.contains('field-label'))label.textContent=lang('Note / event (optional)','备注 / 对应活动（可选）');
    }
    const photo=document.getElementById('packPhotoPreview');
    if(photo){
      const label=photo.closest('.photo-picker')?.previousElementSibling;
      if(label?.classList.contains('field-label'))label.textContent=lang('Photo (optional)','图片（可选）');
    }
  }

  const obs=new MutationObserver(makeOptional);
  obs.observe(document.body,{childList:true,subtree:true});
  makeOptional();
})();
