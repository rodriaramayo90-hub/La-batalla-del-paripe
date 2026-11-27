/* Parse whole sprite sheets before frame extraction. Original RGBA is preserved. */
(function(){'use strict';
const cache=new WeakMap(),reports=[];
const ALPHA=24,DEFAULT_COLS=6;
// Extraction algorithm version. Bump when the segmentation rules change.
const CACHE_VERSION='v49-packed-20261127';
const stats={parsed:0,reused:0,fallback:0,stored:0,storeErrors:0};
let cacheWriteDisabled=false;

function gridDraw(ctx,im,row,col,x,y,size){const ROWS=im.spriteRows||4,COLS=im.spriteCols||DEFAULT_COLS;ctx.drawImage(im,col*im.width/COLS,row*im.height/ROWS,im.width/COLS,im.height/ROWS,x-size*(im.width/COLS)/(im.height/ROWS)/2,y-size,size*(im.width/COLS)/(im.height/ROWS),size)}
function parse(im){
 const ROWS=im.spriteRows||4,COLS=im.spriteCols||DEFAULT_COLS,COUNT=ROWS*COLS;
 const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height,n=w*h,cw=w/COLS,ch=h/ROWS;
 const source=document.createElement('canvas');source.width=w;source.height=h;const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(im,0,0);
 const rgba=sc.getImageData(0,0,w,h),pixels=rgba.data,labels=new Int32Array(n),queue=new Uint32Array(n),components=[null];
 let serial=0;
 // Eight-connected components retain thin diagonal hair, fingertips and clothing seams.
 for(let seed=0;seed<n;seed++){
  if(labels[seed]||pixels[seed*4+3]<ALPHA)continue;
  const id=++serial;let head=0,tail=0;queue[tail++]=seed;labels[seed]=id;
  const c={id,area:0,sx:0,sy:0,minx:w,miny:h,maxx:0,maxy:0};
  while(head<tail){const i=queue[head++],x=i%w,y=(i/w)|0;c.area++;c.sx+=x;c.sy+=y;if(x<c.minx)c.minx=x;if(x>c.maxx)c.maxx=x;if(y<c.miny)c.miny=y;if(y>c.maxy)c.maxy=y;
   for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx;if(xx<0||xx>=w)continue;const j=yy*w+xx;if(!labels[j]&&pixels[j*4+3]>=ALPHA){labels[j]=id;queue[tail++]=j}}}
  }
  c.cx=c.sx/c.area;c.cy=c.sy/c.area;c.slot=Math.max(0,Math.min(ROWS-1,Math.floor(c.cy/ch)))*COLS+Math.max(0,Math.min(COLS-1,Math.floor(c.cx/cw)));components.push(c);
 }
 const minArea=cw*ch*.015,minHeight=ch*(im.spriteMinHeight||.4);
 const chooseMains=()=>{const list=new Array(COUNT).fill(null);for(let id=1;id<components.length;id++){const c=components[id];if(c.area<minArea||c.maxy-c.miny+1<minHeight)continue;if(!list[c.slot]||list[c.slot].area<c.area)list[c.slot]=c}return list};
 let mains=chooseMains();const geodesicSplits=[],groups=new Map();
 // A few authored poses physically touch an adjacent pose. Split ONLY such merged
 // components by foreground-path distance from the two expected torso centers.
 function torsoSeed(slot,restrict){const col=slot%COLS,row=(slot/COLS)|0,tx=(col+.5)*cw,ty=(row+.42)*ch;let best=-1,score=Infinity;for(let y=Math.floor((row+.12)*ch);y<Math.min(h,(row+.82)*ch);y++){for(let x=Math.floor((col+.15)*cw);x<Math.min(w,(col+.85)*cw);x++){const i=y*w+x,id=labels[i];if(!id||(restrict&&id!==restrict)||components[id].area<minArea||components[id].maxy-components[id].miny+1<minHeight)continue;const d=(x-tx)*(x-tx)+(y-ty)*(y-ty);if(d<score){score=d;best=i}}}return best}
 for(let slot=0;slot<COUNT;slot++){if(mains[slot])continue;const seed=torsoSeed(slot,0);if(seed<0)continue;const id=labels[seed],primary=components[id].slot;if(primary===slot)continue;let slots=groups.get(id);if(!slots){slots=new Set([primary]);groups.set(id,slots)}slots.add(slot)}
 for(const [parent,slotSet] of groups){const slots=[...slotSet],seeds=slots.map(slot=>torsoSeed(slot,parent));if(seeds.some(seed=>seed<0)||new Set(seeds).size!==seeds.length)continue;const field=new Uint8Array(n);let head=0,tail=0;seeds.forEach((seed,i)=>{field[seed]=i+1;queue[tail++]=seed});while(head<tail){const i=queue[head++],x=i%w,y=(i/w)|0;for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx;if(xx<0||xx>=w)continue;const j=yy*w+xx;if(labels[j]===parent&&!field[j]){field[j]=field[i];queue[tail++]=j}}}}const split=slots.map(slot=>({id:++serial,slot,area:0,sx:0,sy:0,minx:w,miny:h,maxx:0,maxy:0}));for(let i=0;i<n;i++){if(labels[i]!==parent)continue;const c=split[field[i]-1];if(!c)continue;const x=i%w,y=(i/w)|0;labels[i]=c.id;c.area++;c.sx+=x;c.sy+=y;c.minx=Math.min(c.minx,x);c.maxx=Math.max(c.maxx,x);c.miny=Math.min(c.miny,y);c.maxy=Math.max(c.maxy,y)}components[parent].area=0;for(const c of split){c.cx=c.sx/c.area;c.cy=c.sy/c.area;components.push(c)}geodesicSplits.push({parent,slots});}
 mains=chooseMains();
 const missing=[];for(let slot=0;slot<COUNT;slot++)if(!mains[slot])missing.push({row:(slot/COLS)|0,col:slot%COLS});
 const report={src:im.currentSrc||im.src,width:w,height:h,components:components.filter(c=>c&&c.area>0).length,geodesicSplits,mainBodies:COUNT-missing.length,missingSlots:missing,fallback:missing.length>0,threshold:ALPHA,extendedFrames:[],ignoredNoise:0};
 if(missing.length){console.warn('[SpriteAtlas] Incomplete whole-body extraction; explicit grid fallback',report);source.width=source.height=0;const result={fallback:true,report};cache.set(im,result);reports.push(report);return result}
 const mainSlots=new Int16Array(components.length);mainSlots.fill(-1);mains.forEach((c,slot)=>mainSlots[c.id]=slot);
 const fragmentSlot=new Int16Array(components.length);fragmentSlot.fill(-1);
 // Multi-source foreground-distance field. First reached pixel of a detached component
 // gives its nearest BODY PIXEL, so a foot crossing a tile border belongs to its leg.
 const owners=new Uint8Array(n);let head=0,tail=0;
 for(let i=0;i<n;i++){const label=labels[i];if(label&&mainSlots[label]>=0){owners[i]=mainSlots[label]+1;queue[tail++]=i}}
 while(head<tail){const i=queue[head++],x=i%w,y=(i/w)|0,owner=owners[i];
  for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx;if(xx<0||xx>=w)continue;const j=yy*w+xx;if(owners[j])continue;owners[j]=owner;queue[tail++]=j;const label=labels[j];if(label&&mainSlots[label]<0&&fragmentSlot[label]<0&&components[label].area>3)fragmentSlot[label]=owner-1}}
 }
 const bounds=Array.from({length:COUNT},()=>({minx:w,miny:h,maxx:-1,maxy:-1}));
 const assigned=new Int16Array(components.length);assigned.fill(-1);
 for(let id=1;id<components.length;id++){const c=components[id];if(!c.area)continue;if(c.area<=3){report.ignoredNoise++;continue}const slot=mainSlots[id]>=0?mainSlots[id]:fragmentSlot[id];if(slot<0)continue;assigned[id]=slot;const b=bounds[slot];b.minx=Math.min(b.minx,c.minx);b.miny=Math.min(b.miny,c.miny);b.maxx=Math.max(b.maxx,c.maxx);b.maxy=Math.max(b.maxy,c.maxy)}
 const frames=bounds.map((b,slot)=>{const canvas=document.createElement('canvas'),fw=b.maxx-b.minx+1,fh=b.maxy-b.miny+1;canvas.width=fw;canvas.height=fh;const fc=canvas.getContext('2d'),data=fc.createImageData(fw,fh),dest=data.data;for(let yy=b.miny;yy<=b.maxy;yy++){for(let xx=b.minx;xx<=b.maxx;xx++){const i=yy*w+xx,label=labels[i];if(!label||assigned[label]!==slot)continue;const si=i*4,di=((yy-b.miny)*fw+xx-b.minx)*4;dest[di]=pixels[si];dest[di+1]=pixels[si+1];dest[di+2]=pixels[si+2];dest[di+3]=pixels[si+3]}}fc.putImageData(data,0,0);const col=slot%COLS,row=(slot/COLS)|0;if(b.minx<col*cw||b.maxx>=(col+1)*cw||b.miny<row*ch||b.maxy>=(row+1)*ch)report.extendedFrames.push({row,col,bounds:{...b}});return{canvas,left:(b.minx-col*cw)/cw,top:(b.miny-row*ch)/ch,width:fw/cw,height:fh/ch}});
 source.width=source.height=0;const result={frames,report,fallback:false};cache.set(im,result);reports.push(report);return result;
}

/* Pack already-extracted whole-body poses into ONE lossless texture.
   Positions and anatomical scale remain exactly as in the v48 extractor. */
function packFrames(atlas,im){
 const cols=im.spriteCols||DEFAULT_COLS,frames=atlas.frames;
 const rows=Math.ceil(frames.length/cols);
 const heights=new Array(rows).fill(0),widths=new Array(rows).fill(0);
 for(let i=0;i<frames.length;i++){
  const r=Math.floor(i/cols),f=frames[i],w=f.canvas.width,h=f.canvas.height;
  if(!w||!h)throw Error('Empty pose bitmap '+i);
  widths[r]+=w;heights[r]=Math.max(heights[r],h);
 }
 const w=Math.max(...widths),h=heights.reduce((a,b)=>a+b,0);
 if(!w||!h||w>16384||h>16384||w*h>48000000)
  throw Error('Packed sprites exceed safe texture dimensions');
 const packed=document.createElement('canvas');
 packed.width=w;packed.height=h;
 const ctx=packed.getContext('2d');
 if(!ctx)throw Error('Packed texture context unavailable');
 let y=0;
 for(let r=0;r<rows;r++){
  let x=0;
  for(let col=0;col<cols;col++){
   const f=frames[r*cols+col];if(!f)break;
   ctx.drawImage(f.canvas,x,y);
   f.sx=x;f.sy=y;f.sw=f.canvas.width;f.sh=f.canvas.height;
   x+=f.sw;
  }
  y+=heights[r];
 }
 return packed;
}
function keyFor(im){
 return [CACHE_VERSION,im.currentSrc||im.src,im.naturalWidth||im.width,
  im.naturalHeight||im.height,im.spriteCols||DEFAULT_COLS,
  im.spriteRows||4,im.spriteMinHeight||.4].join('|');
}
function openDatabase(){
 if(typeof indexedDB==='undefined')return Promise.resolve(null);
 return new Promise(resolve=>{
  let finished=false;
  const done=db=>{
   if(finished){db?.close?.();return;}
   finished=true;clearTimeout(timer);resolve(db);
  };
  const timer=setTimeout(()=>done(null),700);
  try{
   const request=indexedDB.open('paripe-sprite-cache',1);
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains('atlases'))
     request.result.createObjectStore('atlases');
   };
   request.onsuccess=()=>done(request.result);
   request.onerror=()=>done(null);
   request.onblocked=()=>done(null);
  }catch(_){done(null)}
 });
}
const database=openDatabase();
function cacheGet(key){
 return database.then(db=>new Promise(resolve=>{
  if(!db)return resolve(null);
  // Cached storage is optional. A stalled Safari/private-mode transaction
  // must never hold up the game loading screen.
  let finished=false;
  const finish=value=>{
   if(finished)return;
   finished=true;clearTimeout(timeout);resolve(value);
  };
  const timeout=setTimeout(()=>finish(null),500);
  try{
   const request=db.transaction('atlases','readonly').objectStore('atlases').get(key);
   request.onsuccess=()=>finish(request.result||null);
   request.onerror=()=>finish(null);
  }catch(_){finish(null)}
 }));
}
function cachePut(key,value){
 return database.then(db=>new Promise(resolve=>{
  if(!db||cacheWriteDisabled)return resolve(false);
  try{
   const tx=db.transaction('atlases','readwrite');
   tx.objectStore('atlases').put(value,key);
   tx.oncomplete=()=>resolve(true);
   tx.onerror=tx.onabort=()=>{
    cacheWriteDisabled=true;stats.storeErrors++;resolve(false);
   };
  }catch(_){cacheWriteDisabled=true;stats.storeErrors++;resolve(false)}
 }));
}
function decodeBlob(blob){
 if(typeof createImageBitmap==='function')return createImageBitmap(blob);
 if(typeof URL==='undefined'||typeof URL.createObjectURL!=='function')
  return Promise.reject(Error('Cached PNG decoder unavailable'));
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(blob),im=new Image();
  im.onload=()=>{URL.revokeObjectURL(url);resolve(im)};
  im.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Invalid cached PNG'))};
  im.src=url;
 });
}
async function recoverAtlas(im){
 const entry=await cacheGet(keyFor(im));
 const count=(im.spriteCols||DEFAULT_COLS)*(im.spriteRows||4);
 if(!entry||!entry.blob||!entry.blob.size
  ||!Array.isArray(entry.frames)||entry.frames.length!==count)return null;
 try{
  const bitmap=await decodeBlob(entry.blob);
  if(!bitmap||bitmap.width!==entry.width||bitmap.height!==entry.height
   ||bitmap.width<=0)throw Error('Cached atlas dimensions differ');
  const frames=entry.frames.map(f=>{
   if(!f||![f.left,f.top,f.width,f.height,f.sx,f.sy,f.sw,f.sh].every(Number.isFinite)
    ||f.sx<0||f.sy<0||f.sw<=0||f.sh<=0||f.sx+f.sw>bitmap.width
    ||f.sy+f.sh>bitmap.height)throw Error('Invalid pose bounds');
   return f;
  });
  const report={...entry.report,fromCache:true};
  const atlas={frames,packed:bitmap,fallback:false,stableSources:true,report};
  cache.set(im,atlas);reports.push(report);stats.reused++;
  return atlas;
 }catch(error){
  console.warn('[SpriteAtlas] Cached atlas invalid; extracting original',error);
  return null;
 }
}
const pendingWrites=new Set();
function scheduleStore(im,atlas,packed){
 if(typeof packed.toBlob!=='function'||typeof indexedDB==='undefined'
   ||cacheWriteDisabled){packed.width=packed.height=0;return;}
 const frames=atlas.frames.map(({left,top,width,height,sx,sy,sw,sh})=>({
  left,top,width,height,sx,sy,sw,sh
 }));
 const key=keyFor(im);
 const save=new Promise(resolve=>{
  try{packed.toBlob(blob=>resolve(blob||null),'image/png')}
  catch(_){resolve(null)}
 }).then(blob=>{
  if(!blob?.size||blob.size>12*1024*1024)return false;
  return cachePut(key,{width:packed.width,height:packed.height,
   blob,frames,report:atlas.report});
 }).then(ok=>{if(ok)stats.stored++;return ok}).catch(error=>{
  stats.storeErrors++;
  console.warn('[SpriteAtlas] Offline atlas cache unavailable',error);
 }).finally(()=>{
  packed.width=packed.height=0;pendingWrites.delete(save);
 });
 pendingWrites.add(save);
}
function releaseFrames(atlas){
 for(const f of atlas.frames)
  if(f.canvas){f.canvas.width=f.canvas.height=0;delete f.canvas;}
}
async function installPacked(im,atlas){
 const packed=packFrames(atlas,im);
 if(typeof createImageBitmap==='function'){
  try{atlas.packed=await createImageBitmap(packed);}
  catch(error){
   atlas.packed=packed;
   console.warn('[SpriteAtlas] Keeping canvas texture',error);
  }
 }else atlas.packed=packed;
 atlas.stableSources=true;
 atlas.report.packed={width:packed.width,height:packed.height};
 releaseFrames(atlas);
 if(atlas.packed!==packed)scheduleStore(im,atlas,packed);
}
async function installOriginalFrames(atlas){
 for(const f of atlas.frames){
  if(!f.canvas)continue;
  try{
   if(typeof createImageBitmap==='function')
    f.source=await createImageBitmap(f.canvas);
  }catch(_){}
  if(!f.source){
   const im=new Image();im.src=f.canvas.toDataURL('image/png');
   await im.decode();f.source=im;
  }
  f.canvas.width=f.canvas.height=0;delete f.canvas;
 }
 atlas.stableSources=true;
}
window.SpriteAtlas={
 reports,stats,
 async prepare(images){
  const out=[];
  for(const im of images){
   if(!im.complete||!im.naturalWidth)await im.decode();
   let atlas=cache.get(im);
   if(!atlas){
    atlas=await recoverAtlas(im);
    if(!atlas){
     try{
      atlas=parse(im);stats.parsed++;
      if(atlas.fallback)stats.fallback++;
     }catch(error){
      console.warn('[SpriteAtlas] Failed extraction; original grid fallback',im.src,error);
      const report={src:im.currentSrc||im.src,fallback:true,error:String(error)};
      atlas={fallback:true,report};cache.set(im,atlas);reports.push(report);stats.fallback++;
     }
    }
   }
   if(!atlas.fallback&&!atlas.stableSources){
    try{await installPacked(im,atlas);}
    catch(error){
     console.warn('[SpriteAtlas] Packing unavailable; individual frames',im.src,error);
     await installOriginalFrames(atlas);
    }
   }
   out.push(atlas.report);
  }
  return out;
 },
 draw(ctx,im,row,col,x,y,size=330){
  if(!im||!(im.naturalWidth||im.width))return;
  const cols=im.spriteCols||DEFAULT_COLS;
  const atlas=cache.get(im);
  const frame=atlas&&!atlas.fallback?atlas.frames?.[row*cols+col]:null;
  if(!frame){gridDraw(ctx,im,row,col,x,y,size);return;}
  const aspect=(im.width/cols)/(im.height/(im.spriteRows||4));
  const dx=x-size*aspect/2+frame.left*size*aspect;
  const dy=y-size+frame.top*size;
  const dw=frame.width*size*aspect,dh=frame.height*size;
  if(atlas.packed)ctx.drawImage(atlas.packed,
   frame.sx,frame.sy,frame.sw,frame.sh,dx,dy,dw,dh);
  else if(frame.source)ctx.drawImage(frame.source,dx,dy,dw,dh);
  else gridDraw(ctx,im,row,col,x,y,size);
 },
 reportFor(im){return cache.get(im)?.report||null},
 whenCacheSettled(){return Promise.allSettled([...pendingWrites])}
};
})();
