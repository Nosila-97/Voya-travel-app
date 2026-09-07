// Voyā lightweight in-app image cropper for packing photos.
(function(){
  let cropState=null;

  function cropText(en,zh){try{return store.lang==='zh'?zh:en}catch(e){return en}}

  function ensureCropStyles(){
    if(document.getElementById('voyaCropStyles')) return;
    const s=document.createElement('style');
    s.id='voyaCropStyles';
    s.textContent=`
      .voya-crop-backdrop{position:fixed;inset:0;z-index:100000;background:rgba(22,19,17,.78);display:flex;align-items:flex-end;justify-content:center;padding:0}
      .voya-crop-card{width:min(100%,520px);background:#f8f4f1;border-radius:26px 26px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom));box-sizing:border-box;max-height:95vh;overflow:auto}
      .voya-crop-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.voya-crop-head h3{margin:0;font-size:18px}.voya-crop-head button{border:0;background:#ece4de;border-radius:999px;width:34px;height:34px;font-size:20px}
      .voya-crop-stage{position:relative;width:100%;aspect-ratio:1/1;background:#171513;border-radius:20px;overflow:hidden;touch-action:none;user-select:none}
      .voya-crop-stage img{position:absolute;left:50%;top:50%;transform-origin:center center;max-width:none;max-height:none;pointer-events:none;will-change:transform}
      .voya-crop-grid{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to right,transparent 33.1%,rgba(255,255,255,.45) 33.3%,rgba(255,255,255,.45) 33.7%,transparent 33.9%,transparent 66.1%,rgba(255,255,255,.45) 66.3%,rgba(255,255,255,.45) 66.7%,transparent 66.9%),linear-gradient(to bottom,transparent 33.1%,rgba(255,255,255,.45) 33.3%,rgba(255,255,255,.45) 33.7%,transparent 33.9%,transparent 66.1%,rgba(255,255,255,.45) 66.3%,rgba(255,255,255,.45) 66.7%,transparent 66.9%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.8);border-radius:20px}
      .voya-crop-help{text-align:center;color:#796b62;font-size:12px;margin:10px 0 4px}.voya-crop-zoom{display:flex;align-items:center;gap:10px;margin:10px 0 14px}.voya-crop-zoom span{font-size:18px}.voya-crop-zoom input{width:100%}
      .voya-crop-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:10px}.voya-crop-actions button{border:0;border-radius:15px;padding:13px;font:600 14px 'DM Sans',sans-serif}.voya-crop-cancel{background:#ebe3dd;color:#3e3530}.voya-crop-use{background:#211e1c;color:white}
    `;
    document.head.appendChild(s);
  }

  function closeCropper(){document.querySelector('.voya-crop-backdrop')?.remove();cropState=null}

  function applyTransform(){
    if(!cropState) return;
    const {img,scale,x,y}=cropState;
    img.style.transform=`translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`;
  }

  function openCropper(dataUrl){
    ensureCropStyles();
    document.querySelector('.voya-crop-backdrop')?.remove();
    const html=`<div class="voya-crop-backdrop"><div class="voya-crop-card" onclick="event.stopPropagation()">
      <div class="voya-crop-head"><h3>${cropText('Crop photo','裁剪图片')}</h3><button type="button" onclick="voyaCloseCropper()">×</button></div>
      <div class="voya-crop-stage" id="voyaCropStage"><img id="voyaCropImage" src="${dataUrl}" alt=""><div class="voya-crop-grid"></div></div>
      <div class="voya-crop-help">${cropText('Drag to reposition · Pinch or use slider to zoom','拖动调整位置 · 双指或滑杆缩放')}</div>
      <div class="voya-crop-zoom"><span>−</span><input id="voyaCropZoom" type="range" min="1" max="3" step="0.01" value="1"><span>＋</span></div>
      <div class="voya-crop-actions"><button class="voya-crop-cancel" type="button" onclick="voyaCloseCropper()">${cropText('Cancel','取消')}</button><button class="voya-crop-use" type="button" onclick="voyaUseCrop()">${cropText('Use photo','使用图片')}</button></div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend',html);
    const stage=document.getElementById('voyaCropStage');
    const img=document.getElementById('voyaCropImage');
    const zoom=document.getElementById('voyaCropZoom');
    cropState={stage,img,zoom,baseScale:1,scale:1,x:0,y:0,pointers:new Map(),lastPinch:null,naturalW:0,naturalH:0};
    img.onload=()=>{
      if(!cropState) return;
      cropState.naturalW=img.naturalWidth;cropState.naturalH=img.naturalHeight;
      const side=stage.clientWidth;
      cropState.baseScale=Math.max(side/img.naturalWidth,side/img.naturalHeight);
      img.style.width=img.naturalWidth+'px';img.style.height=img.naturalHeight+'px';
      cropState.scale=cropState.baseScale;
      zoom.min=String(cropState.baseScale);
      zoom.max=String(cropState.baseScale*3);
      zoom.step=String(cropState.baseScale/100);
      zoom.value=String(cropState.scale);
      applyTransform();
    };
    zoom.oninput=()=>{if(cropState){cropState.scale=Number(zoom.value);applyTransform()}};

    stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);cropState?.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});});
    stage.addEventListener('pointermove',e=>{
      if(!cropState||!cropState.pointers.has(e.pointerId))return;
      const prev=cropState.pointers.get(e.pointerId);cropState.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      const pts=[...cropState.pointers.values()];
      if(pts.length===1){cropState.x+=e.clientX-prev.x;cropState.y+=e.clientY-prev.y;applyTransform()}
      else if(pts.length>=2){
        const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
        if(cropState.lastPinch){cropState.scale=Math.min(cropState.baseScale*3,Math.max(cropState.baseScale,cropState.scale*(d/cropState.lastPinch)));cropState.zoom.value=String(cropState.scale);applyTransform()}
        cropState.lastPinch=d;
      }
    });
    const end=e=>{if(!cropState)return;cropState.pointers.delete(e.pointerId);if(cropState.pointers.size<2)cropState.lastPinch=null};
    stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
  }

  async function useCrop(){
    if(!cropState)return;
    const {stage,img,scale,x,y,naturalW,naturalH}=cropState;
    const side=stage.clientWidth;
    const out=900;
    const c=document.createElement('canvas');c.width=out;c.height=out;
    const ctx=c.getContext('2d');ctx.fillStyle='#f2ece7';ctx.fillRect(0,0,out,out);
    const factor=out/side;
    const drawnW=naturalW*scale*factor,drawnH=naturalH*scale*factor;
    const dx=(side/2 + x)*factor - drawnW/2;
    const dy=(side/2 + y)*factor - drawnH/2;
    ctx.drawImage(img,dx,dy,drawnW,drawnH);
    packDraftImage=c.toDataURL('image/jpeg',.82);
    closeCropper();
    if(typeof updatePackPhotoPreview==='function')updatePackPhotoPreview();
  }

  window.handlePackPhoto=function(input){
    const file=input.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onerror=()=>showToast?.(cropText('Could not read photo','图片读取失败'));
    reader.onload=()=>openCropper(reader.result);
    reader.readAsDataURL(file);
    input.value='';
  };
  window.voyaCloseCropper=closeCropper;
  window.voyaUseCrop=useCrop;
})();
