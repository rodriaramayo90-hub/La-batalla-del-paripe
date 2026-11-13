/* EXPERIMENTAL ONLY: Lucas (3) / T-Rex (1).
 * Two-fighter hit reactions and pose-size calibration.
 * Loaded exclusively by preview-hitreactions-lucas-trex.html.
 * Does not alter the main engine, published page or other 10 fighters.
 */
(function(){
'use strict';
const TEST_FIGHTERS=new Set([1,3]);
const W=480,H=450,ORIGIN_X=240,ORIGIN_Y=402,SPRITE_HEIGHT=330;
const textureBank=new Map(),poseCorrections=new Map();
const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let ready=false,enabled=true;

function limit(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function ease(v){v=limit(v,0,1);return v*v*(3-2*v);}
function slot(im,row,col){return [im.src.split('/').pop(),row,col].join(':');}
function surface(){
  const c=document.createElement('canvas');c.width=W;c.height=H;
  return c;
}
function atlasFrame(im,row,col,extraScale){
  const c=surface(),g=c.getContext('2d');
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  SpriteAtlas.draw(g,im,row,col,ORIGIN_X,ORIGIN_Y,SPRITE_HEIGHT*(extraScale||1));
  return c;
}
function visibleHeight(image){
  const g=image.getContext('2d',{willReadFrequently:true});
  const rgba=g.getImageData(0,0,W,H).data;
  let top=H,bottom=-1;
  // Alpha bounds: ignore anti-alias fringe but preserve hair and shoes.
  for(let y=0;y<H;y++)for(let x=35;x<W-35;x++){
    if(rgba[(y*W+x)*4+3]>42){top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  return bottom>=top?bottom-top+1:0;
}
function crouchTexture(id){
  if(id===3){
    // The replacement includes Lucas's complete original face and body.
    return atlasFrame(lucasArt[1],0,0,1);
  }
  // Same extraction and grounding rules used by the original low-pose renderer.
  const image=crouchArt,cell=crouchCells[id],result=surface();
  if(!cell)return result;
  const scale=POSE_SCALES[image.src.split('/').pop()]?.[id]||1;
  const unit=SPRITE_HEIGHT/(image.height/3)*scale,gw=image.width/4,gx=id%4*gw;
  const width=cell.w*unit,height=cell.h*unit;
  const g=result.getContext('2d');
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(image,cell.x,cell.y,cell.w,cell.h,
    ORIGIN_X+(cell.x-gx-gw/2)*unit,ORIGIN_Y-height,width,height);
  return result;
}
function prepare(){
  for(const id of TEST_FIGHTERS){
    const [normalSheet,normalRow]=atlasMap[id], [actionSheet,actionRow]=actionMap[id];
    const normal=atlases[normalSheet],action=actionAtlases[actionSheet];
    const stand=atlasFrame(normal,normalRow,0,1);
    const reference=visibleHeight(stand);
    // Only standing ACTION poses are calibrated; crouch, jump and KO have
    // intentionally different silhouettes and must never be stretched.
    for(let col=0;col<6;col++){
      const sample=atlasFrame(action,actionRow,col,1);
      const measured=visibleHeight(sample);
      const relative=col===5?.92:col===0?.94:.97;
      const correction=reference>170&&measured>150
        ?limit(reference*relative/measured,.94,1.06):1;
      poseCorrections.set(slot(action,actionRow,col),correction);
    }
    const hurt=atlasFrame(action,actionRow,5,poseCorrections.get(slot(action,actionRow,5))||1);
    textureBank.set(id,{
      hurt,stand,crouch:crouchTexture(id),height:reference,
      baselineHeight:reference,hitHeight:visibleHeight(hurt)
    });
  }
  ready=true;
  window.PARIPE_HITREACTION_TEST={
    fighters:['T-Rex','Lucas'],
    frameSet:['high','mid','low','heavy'],
    calibration:[...poseCorrections].map(([k,v])=>[k,Number(v.toFixed(3))]),
    enabled:()=>enabled
  };
  console.info('[Paripé preview] Hit reactions loaded for Lucas and T-Rex.',window.PARIPE_HITREACTION_TEST);
}
function reactionKind(attacker,damage,push,kind,info){
  const level=info?.level||(kind===-3?(attacker?.level||'mid'):'mid');
  const powerful=!!(attacker?.power||attacker?.finisher||info?.finisher||
      info?.special||kind!==-3&&kind!==-4&&kind!==-9||damage>=25||Math.abs(push)>=85);
  if(powerful)return 'heavy';
  if(level==='low')return 'low';
  if(level==='high'||level==='overhead')return 'high';
  return 'mid';
}
const originalHit=hit;
hit=function(target,damage,push,kind=-3,impactY=target?280-target.y:280,info=null){
  const attacker=info?.attacker||(target===enemy?player:enemy);
  const result=originalHit.call(this,target,damage,push,kind,impactY,info);
  if(!result||!ready||!enabled||!target||!TEST_FIGHTERS.has(target.id)||
     target.lastBlocked||target.hp<=0||target.knockdown>0||target.grabbed||target.thrown>0)return result;
  const type=reactionKind(attacker,damage,push,kind,info);
  target.previewReaction={
    type,started:frame,duration:type==='heavy'?25:type==='low'?19:21,
    receivedDirection:Math.sign(push)||1
  };
  // Existing rigid rotation is superseded by the anatomical warp below.
  target.hitRecoil=0;
  return result;
};
const originalDrawSprite=drawSprite;
drawSprite=function(im,row,col,x,y,size=330){
  const a=window.renderedFighter||null;
  if(ready&&enabled&&a&&TEST_FIGHTERS.has(a.id)&&a.diveMask<=0&&
     size>=300&&size<=335){
    const [sheet,r]=actionMap[a.id];
    if(im===actionAtlases[sheet]&&r===row){
      size*=poseCorrections.get(slot(im,row,col))||1;
    }
  }
  return originalDrawSprite.call(this,im,row,col,x,y,size);
};
function warpedFrame(image,torso,head,settle){
  if(!image)return;
  const steps=6;
  for(let sy=0;sy<H;sy+=steps){
    const sh=Math.min(steps,H-sy);
    const y=sy-ORIGIN_Y; // 0 = floor, negative = up the body
    // Feet stay grounded. Torso bends around the hips; head moves as a single
    // piece above the neck, preserving face shape, width and identity.
    const hip=ease((-y-103)/105),neck=ease((-y-225)/56);
    const dx=hip*torso+neck*(head-torso);
    ctx.drawImage(image,0,sy,W,sh,-ORIGIN_X+dx,-ORIGIN_Y+sy,W,sh+.15);
  }
}
function showReaction(a){
  const r=a.previewReaction,bank=textureBank.get(a.id);
  if(!r||!bank)return false;
  const t=limit((frame-r.started)/r.duration,0,1);
  // Instant contact pose during hitstop, then a short elastic recovery.
  const jolt=t<.12?1:Math.pow(1-(t-.12)/.88,1.65);
  const recovery=t>.55?ease((t-.55)/.38):0;
  const secondary=t>.4?Math.sin((t-.4)/.6*Math.PI)*.11:0;
  const values={
    high:[-12,-29],
    mid:[17,21],
    low:[8,3],
    heavy:[-24,-43]
  }[r.type]||[11,18];
  let torso=(values[0]*jolt-values[0]*secondary),
      head=(values[1]*jolt-values[1]*secondary);
  if(prefersReducedMotion){torso*=.35;head*=.35;}
  let main=bank.hurt;
  if(r.type==='low'&&t<.54)main=bank.crouch;
  warpedFrame(main,torso,head,0);
  // Replace static hurt pose with a genuine return to standing. Crossfade
  // happens briefly near the end of visual reaction, not for all of hitstun.
  if(recovery>0){
    ctx.save();ctx.globalAlpha*=recovery;
    warpedFrame(bank.stand,torso*.25,head*.25,0);
    ctx.restore();
  }
  return true;
}
const originalDrawNormalAction=drawNormalAction;
drawNormalAction=function(a,size){
  if(!ready||!enabled||!TEST_FIGHTERS.has(a.id)||!a.previewReaction||
     a.stun<=0||a.roundLoser||a.grabbed||a.thrown>0||a.knockdown>0||
     a.phoneVictory||a.victory){
    return originalDrawNormalAction.call(this,a,size);
  }
  ctx.save();
  // drawFighter applies a constant -0.09rad when stunned; undo it only
  // here so the reaction isn't a rigid leaning photo.
  if(a.hitRecoil<=0)ctx.rotate(.09);
  if(!showReaction(a))originalDrawNormalAction.call(this,a,size);
  ctx.restore();
};
function attachControls(){
  const toggle=document.getElementById('preview-hitreaction-toggle');
  if(!toggle)return;
  function redraw(){
    toggle.textContent='Reacciones: '+(enabled?'ACTIVADAS':'ORIGINALES');
    toggle.setAttribute('aria-pressed',String(enabled));
  }
  toggle.addEventListener('click',()=>{
    enabled=!enabled;redraw();
    // A/B switches do not modify combat balance, cooldowns or HP.
  });
  const quick=document.getElementById('preview-quick-start');
  if(quick)quick.addEventListener('click',()=>{
    // Select exactly the two test subjects; player can choose gamepads in
    // the original local-mode setup screen.
    if(typeof LOCAL==='undefined'||typeof openLocal!=='function')return;
    LOCAL.selected[0]=1;LOCAL.selected[1]=3;
    openLocal();
  });
  redraw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachControls);
else attachControls();
assetReady.then(prepare).catch(error=>{
  console.error('[Paripé preview] Failed preparing hit reaction textures',error);
});
})();