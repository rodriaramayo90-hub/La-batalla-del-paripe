/* Flor Rubia — Zürich police REAL IMAGE sprite atlases (v3).
 * 12 cel-shaded painted character poses per police officer, authored as
 * WebP image sheets in /assets. No polygons/rectangles used to draw cops.
 * One immutable 256×256 atlas cell per pose keeps size and feet anchoring
 * constant during inspection, passport controls, arrest and escort.
 */
(function(){
'use strict';
const old=window.FLOR_AIRPORT_ART;
if(!old)throw Error('Flor art modules must load before image sprite module');
const sources=[
 'assets/flor-police-officer-v3.webp',
 'assets/flor-police-officer-female-v3.webp'
];
const atlases=sources.map(src=>{
 const entry={src,ready:false,error:false,image:null,width:0,height:0};
 if(typeof Image==='undefined'){entry.error=true;return entry;}
 try{
  const image=new Image();
  image.decoding='async';
  image.onload=()=>{
   if(image.naturalWidth!==1024||image.naturalHeight!==768){
    entry.error=true;
    console.warn('[Flor police] Invalid atlas dimensions',src,image.naturalWidth,image.naturalHeight);
    return;
   }
   entry.image=image;entry.ready=true;
  };
  image.onerror=()=>{
   entry.error=true;
   console.warn('[Flor police] Sprite image could not be decoded',src);
  };
  image.src=src;
 }catch(error){entry.error=true;console.warn('[Flor police] Sprite image error',src,error);}
 return entry;
});
// Mapping from v2 semantic pose numbers into the *image* sprite sheets.
// Source layout: idle, walk, halt, point, inspect, passport, startled,
// grab/escort, stamp, shout, handcuffs, salute.
const frames=Object.freeze({
 0:0, // idle
 1:2, // show STOP
 2:4, // inspecting luggage
 3:7, // escort suspect
 4:8, // passport stamp
 5:3, // accusing/pointing
 6:6, // shock
 7:10,// cuffs
 8:1, // walk
 9:9  // shout
});
function poseAt(pose,t){
 let frame=frames[pose]??0;
 if(pose===8)frame=Math.floor(Math.max(0,t)/8)%2?1:0;
 if(pose===2)frame=Math.floor(Math.max(0,t)/28)%2?5:4;
 if(pose===3)frame=Math.floor(Math.max(0,t)/19)%2?10:7;
 if(pose===4)frame=Math.floor(Math.max(0,t)/24)%2?5:8;
 return frame;
}
function officer(ctx,x,y,scale=.72,pose=0,flip=false,variant=0,t=0){
 const src=atlases[variant===1?1:0];
 if(!src?.ready){
  // Do not momentarily show the old geometric cops while WebP is loading.
  // If the actual file is broken, fall back so gameplay isn't blocked.
  if(src?.error)old.officer(ctx,x,y,scale,pose,flip,variant,t);
  return;
 }
 const frame=poseAt(pose,t),col=frame%4,row=Math.floor(frame/4);
 const size=370*scale; // 1:1 square scale, same on every pose (no shrinking).
 const walking=pose===8;
 const bob=walking?Math.sin(t*.16+(variant||0)*1.8)*3:Math.sin(t*.044+variant)*1.1;
 ctx.save();
 ctx.translate(x,y+bob);
 ctx.scale(flip?-1:1,1);
 ctx.drawImage(src.image,col*256,row*256,256,256,
  -size/2,-size,size,size);
 ctx.restore();
}
const upgraded=Object.freeze({
 ...old,officer,policeArtVersion:3,
 get illustratedOfficersReady(){return atlases.filter(x=>x.ready).length;},
 get realSpriteAtlasesReady(){return atlases.filter(x=>x.ready).length;},
 get realSpriteAtlasErrors(){return atlases.filter(x=>x.error).length;},
 get policeSpriteSources(){return sources.slice();},
 get backgroundReady(){return old.backgroundReady;},
 get policeSpritesReady(){return old.policeSpritesReady;},
 get illustratedBackgroundReady(){return old.illustratedBackgroundReady;}
});
window.FLOR_AIRPORT_ART=upgraded;
window.FLOR_POLICE_SPRITES=Object.freeze({
 sources:sources.slice(),frames,
 get ready(){return atlases.every(x=>x.ready);},
 get loaded(){return atlases.filter(x=>x.ready).length;},
 get failed(){return atlases.filter(x=>x.error).length;}
});
})();
