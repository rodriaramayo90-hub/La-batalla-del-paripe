/* Parse whole sprite sheets before frame extraction. Original RGBA is preserved. */
(function(){'use strict';
const cache=new WeakMap(),reports=[];
const ALPHA=24,COLS=6;
function gridDraw(ctx,im,row,col,x,y,size){const ROWS=im.spriteRows||4;ctx.drawImage(im,col*im.width/COLS,row*im.height/ROWS,im.width/COLS,im.height/ROWS,x-size/2,y-size,size,size)}
function parse(im){
 const ROWS=im.spriteRows||4,COUNT=ROWS*COLS;
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
 const minArea=cw*ch*.015,minHeight=ch*.4;
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
window.SpriteAtlas={reports,async prepare(images){const out=[];for(const im of images){if(!im.complete||!im.naturalWidth)await im.decode();const existing=cache.get(im);const atlas=existing||parse(im);if(!atlas.fallback&&!atlas.stableSources){for(const frame of atlas.frames){try{if(typeof createImageBitmap==='function')frame.source=await createImageBitmap(frame.canvas);}catch(_){}if(!frame.source){const image=new Image();image.src=frame.canvas.toDataURL('image/png');await image.decode();frame.source=image;}frame.canvas.width=frame.canvas.height=0;}atlas.stableSources=true;}out.push(atlas.report)}return out},draw(ctx,im,row,col,x,y,size=330){const atlas=cache.get(im),frame=atlas&&!atlas.fallback?atlas.frames[row*COLS+col]:null;if(!frame){gridDraw(ctx,im,row,col,x,y,size);return}ctx.drawImage(frame.source||frame.canvas,x-size/2+frame.left*size,y-size+frame.top*size,frame.width*size,frame.height*size)},reportFor(im){return cache.get(im)?.report||null}};
})();
