/* La Batalla del Paripe — isolated hit reactions v2.
 * TEST ONLY: character 1 (T-Rex) and 3 (Lucas).
 * Unlike v1's horizontal slice distortion, this builds separately authored
 * 2D articulated poses from each character's ORIGINAL complete-body artwork.
 * No changes to main, gameplay damage, physics, collisions or other fighters.
 */
(function(){
'use strict';
const IDS=new Set([1,3]),TYPES=['high','mid','low','heavy'],CW=480,CH=470,OX=240,GY=430;
const COLS=8,ROWS=11,STRENGTH=[.46,1,.66,-.16,.06];
const poseCache=new Map(),enabledState={value:true};
let loaded=false,error=null;
const clamp2=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
const ease=x=>{x=clamp2(x,0,1);return x*x*(3-2*x)};
const peak=(x,m,s)=>Math.exp(-2*Math.pow((x-m)/s,2));

function canvas(){const c=document.createElement('canvas');c.width=CW;c.height=CH;return c;}
function boundPixels(surface){
  const {data}=surface.getContext('2d',{willReadFrequently:true}).getImageData(0,0,CW,CH);
  let x0=CW,x1=-1,y0=CH,y1=-1;
  for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){
    if(data[(y*CW+x)*4+3]<=45)continue;
    if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
  }
  return x1<0?null:{left:x0,right:x1,top:y0,bottom:y1,width:x1-x0+1,height:y1-y0+1};
}
function sourceStanding(id){
  const c=canvas(),g=c.getContext('2d'),[index,row]=atlasMap[id];
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  SpriteAtlas.draw(g,atlases[index],row,0,OX,GY,330);
  return c;
}
function sourceCrouched(id){
  const c=canvas(),g=c.getContext('2d');
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  if(id===3){
    // Complete original Lucas illustration, including the same face.
    SpriteAtlas.draw(g,lucasArt[1],0,0,OX,GY,330);
  }else{
    // Match T-Rex's existing crouch sprite position and anatomical scale.
    const cell=crouchCells[id],im=crouchArt;
    if(cell){
      const f=POSE_SCALES[im.src.split('/').pop()]?.[id]||1;
      const unit=330/(im.height/3)*f,gw=im.width/4,gx=(id%4)*gw;
      const w=cell.w*unit,h=cell.h*unit;
      g.drawImage(im,cell.x,cell.y,cell.w,cell.h,
        OX+(cell.x-gx-gw/2)*unit,GY-h,w,h);
    }
  }
  return boundPixels(c)?c:sourceStanding(id);
}
function deform(u,v,type,amplitude,side){
  const nx=(u-.5)*2,head=ease((.40-v)/.22),shoulders=peak(v,.33,.17);
  const chest=peak(v,.48,.21),hips=peak(v,.65,.15),knee=peak(v,.80,.105);
  // The transformation is joint-aware: head moves as one unit, torso folds
  // around the pelvis and ankles are anchored to the floor.
  let dx=0,dy=0;
  switch(type){
    case 'high':
      dx=-35*head-14*shoulders-7*chest-2*hips;
      dy=-4*head+6*shoulders+3*chest;
      dx+=7*nx*shoulders;
      break;
    case 'mid':
      dx=13*head+25*shoulders+21*chest+3*hips;
      dy=8*head+13*shoulders+16*chest+5*hips;
      // Both elbows tuck toward the abdomen during the hit.
      dx-=Math.sign(nx)*13*chest*Math.pow(Math.abs(nx),1.2);
      break;
    case 'low':
      dx=-6*head-9*shoulders-11*hips+(nx>0?-18:8)*knee;
      dy=10*head+11*shoulders+13*chest+22*hips+21*knee;
      // Ankle is stationary, the struck knee buckles.
      break;
    case 'heavy':
      dx=-49*head-29*shoulders-24*chest-6*hips+(nx>0?8:-6)*knee;
      dy=-5*head+8*shoulders+12*chest+9*hips+11*knee;
      dx+=8*nx*shoulders;
      break;
  }
  const footLock=1-ease((v-.90)/.085);
  const faceLock=v<.19?1:1; // head's dimensions remain unchanged
  return {x:side*dx*amplitude*footLock*faceLock,
          y:dy*amplitude*footLock};
}
function mapTriangle(g,img,s0,s1,s2,d0,d1,d2){
  const sx0=s0.x,sx1=s1.x,sx2=s2.x,sy0=s0.y,sy1=s1.y,sy2=s2.y;
  const den=sx0*(sy1-sy2)+sx1*(sy2-sy0)+sx2*(sy0-sy1);
  if(Math.abs(den)<.001)return;
  const a=(d0.x*(sy1-sy2)+d1.x*(sy2-sy0)+d2.x*(sy0-sy1))/den;
  const b=(d0.y*(sy1-sy2)+d1.y*(sy2-sy0)+d2.y*(sy0-sy1))/den;
  const c=(d0.x*(sx2-sx1)+d1.x*(sx0-sx2)+d2.x*(sx1-sx0))/den;
  const d=(d0.y*(sx2-sx1)+d1.y*(sx0-sx2)+d2.y*(sx1-sx0))/den;
  const e=(d0.x*(sx1*sy2-sx2*sy1)+d1.x*(sx2*sy0-sx0*sy2)+d2.x*(sx0*sy1-sx1*sy0))/den;
  const f=(d0.y*(sx1*sy2-sx2*sy1)+d1.y*(sx2*sy0-sx0*sy2)+d2.y*(sx0*sy1-sx1*sy0))/den;
  if(![a,b,c,d,e,f].every(Number.isFinite))return;
  // Tiny clipping overlap avoids holes at shared triangle edges.
  const mx=(d0.x+d1.x+d2.x)/3,my=(d0.y+d1.y+d2.y)/3;
  const expand=p=>({x:p.x+(p.x-mx)*.006,y:p.y+(p.y-my)*.006});
  const p0=expand(d0),p1=expand(d1),p2=expand(d2);
  g.save();g.beginPath();g.moveTo(p0.x,p0.y);g.lineTo(p1.x,p1.y);
  g.lineTo(p2.x,p2.y);g.closePath();g.clip();
  g.setTransform(a,b,c,d,e,f);g.drawImage(img,0,0);g.restore();
}
function renderArticulated(source,type,power,side){
  const output=canvas(),g=output.getContext('2d');
  const b=boundPixels(source);
  if(!b)return source;
  const left=Math.max(0,b.left-5),right=Math.min(CW,b.right+6);
  const top=Math.max(0,b.top-5),bottom=Math.min(CH,b.bottom+5);
  let srcGrid=[],dstGrid=[];
  for(let j=0;j<=ROWS;j++){
    const v=j/ROWS,y=top+(bottom-top)*v;
    const sRow=[],dRow=[];
    for(let i=0;i<=COLS;i++){
      const u=i/COLS,x=left+(right-left)*u,offset=deform(u,v,type,power,side);
      sRow.push({x,y});dRow.push({x:x+offset.x,y:y+offset.y});
    }
    srcGrid.push(sRow);dstGrid.push(dRow);
  }
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){
    const a=srcGrid[j][i],b=srcGrid[j][i+1],
          c=srcGrid[j+1][i],d=srcGrid[j+1][i+1];
    const A=dstGrid[j][i],B=dstGrid[j][i+1],
          C=dstGrid[j+1][i],D=dstGrid[j+1][i+1];
    mapTriangle(g,source,a,b,c,A,B,C);
    mapTriangle(g,source,b,d,c,B,D,C);
  }
  return output;
}
function bake(id,side){
  const standing=sourceStanding(id),crouch=sourceCrouched(id);
  const reference=boundPixels(standing);
  if(!reference||reference.height<120)throw Error('Missing standing artwork for fighter '+id);
  const set={id,side,referenceHeight:reference.height,frames:{}};
  for(const type of TYPES){
    set.frames[type]=STRENGTH.map((strength,i)=>{
      // A true low hit includes the fighter's actual drawn crouch.
      // Other hit types use a consistent standing body as their source.
      const source=type==='low'&&i<2?crouch:standing;
      return renderArticulated(source,type,strength,side);
    });
  }
  return set;
}
function key(id,side){return id+':'+side;}
function getPose(id,side){
  const k=key(id,side);
  if(!poseCache.has(k))poseCache.set(k,bake(id,side));
  return poseCache.get(k);
}
function kind(attacker,damage,push,moveKind,info){
  const level=info?.level||(moveKind===-3?(attacker?.level||'mid'):'mid');
  if(attacker?.power||attacker?.finisher||info?.finisher||info?.special||
     Math.abs(push)>=80||damage>=27||(moveKind!==-3&&moveKind!==-4))
    return 'heavy';
  if(level==='low')return 'low';
  if(level==='high'||level==='overhead')return 'high';
  return 'mid';
}
function timing(type,stun){
  return type==='heavy'?Math.min(26,Math.max(17,stun)):
         type==='low'?Math.min(23,Math.max(17,stun)):Math.min(22,Math.max(16,stun));
}
const originalHit=hit;
hit=function(target,damage,push,moveKind=-3,impactY=target?280-target.y:280,info=null){
  const attacker=info?.attacker||(target===enemy?player:enemy);
  const connected=originalHit.call(this,target,damage,push,moveKind,impactY,info);
  if(!enabledState.value||!loaded||!connected||!target||
     !IDS.has(target.id)||target.lastBlocked||target.hp<=0||
     target.knockdown>0||target.grabbed||target.thrown>0)return connected;
  const type=kind(attacker,damage,push,moveKind,info),dir=Math.sign(push);
  target.testHitV2={
    kind:type,start:frame,frames:timing(type,target.stun),
    side:(dir&&target.dir===dir)?-1:1
  };
  return connected;
};
function spriteForReaction(a){
  if(!enabledState.value||!loaded||!IDS.has(a.id)||!a.testHitV2||
     a.stun<=0||a.hp<=0||a.roundLoser||a.grabbed||a.thrown>0||
     a.knockdown>0||a.phoneVictory||a.victory)return null;
  const r=a.testHitV2;
  const elapsed=Math.max(0,frame-r.start),pct=clamp2(elapsed/r.frames,0,1);
  let stage=pct<.15?0:pct<.36?1:pct<.58?2:pct<.81?3:4;
  if(pct>=1)stage=4;
  const set=getPose(a.id,r.side);
  return set.frames[r.kind]?.[stage]||null;
}
const originalDrawNormalAction=drawNormalAction;
drawNormalAction=function(a,size){
  const sprite=spriteForReaction(a);
  if(!sprite)return originalDrawNormalAction.call(this,a,size);
  // drawFighter's legacy constant stun tilt is counter-rotated here.
  ctx.save();ctx.rotate(.09);
  ctx.drawImage(sprite,-OX,-GY);
  ctx.restore();
};
const originalDrawFighter=drawFighter;
drawFighter=function(a,ghost=false){
  const active=!ghost&&!!spriteForReaction(a);
  if(!active)return originalDrawFighter.call(this,a,ghost);
  // Visual-only: preserve the engine's invulnerability and recoil values.
  // Stop the flicker and rigid rocking only while rendering the new pose.
  const inv=a.invuln,recoil=a.hitRecoil;
  a.invuln=0;a.hitRecoil=0;
  try{return originalDrawFighter.call(this,a,ghost);}
  finally{a.invuln=inv;a.hitRecoil=recoil;}
};
function initPanel(){
  const toggle=document.getElementById('beta-v2-toggle');
  const quick=document.getElementById('beta-v2-match');
  const status=document.getElementById('beta-v2-status');
  if(!toggle)return;
  function updateLabel(){
    toggle.textContent=enabledState.value?'REACCIONES NUEVAS':'REACCIONES ORIGINALES';
    toggle.setAttribute('aria-pressed',String(enabledState.value));
    if(status)status.textContent=error?'Error preparando poses':
      loaded?'T-Rex y Lucas · 4 reacciones':'Preparando animaciones…';
  }
  toggle.addEventListener('click',()=>{enabledState.value=!enabledState.value;updateLabel();});
  if(quick)quick.addEventListener('click',()=>{
    if(typeof LOCAL==='undefined'||typeof openLocal!=='function')return;
    LOCAL.selected[0]=1;LOCAL.selected[1]=3;
    openLocal();
  });
  window.PARIPE_HITREACTIONS_V2={
    version:2,characterIds:[1,3],types:TYPES,
    get ready(){return loaded;},get enabled(){return enabledState.value;},
    get poseCount(){return poseCache.size*20;},
    get error(){return error&&String(error);},
    setEnabled(value){enabledState.value=!!value;updateLabel();}
  };
  updateLabel();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initPanel);
else initPanel();

assetReady.then(()=>{
  // Execute only after Work's sprite extraction and identity corrections.
  for(const id of IDS)getPose(id,1);
  loaded=true;
  const status=document.getElementById('beta-v2-status');
  if(status)status.textContent='T-Rex y Lucas · 4 reacciones';
  console.info('[Paripe beta v2] Articulated poses prepared; originals preserved.');
}).catch(ex=>{
  error=ex;console.error('[Paripe beta v2] Could not prepare reaction poses:',ex);
  const status=document.getElementById('beta-v2-status');
  if(status)status.textContent='Error preparando poses';
});
})();
