/* La Batalla del Paripe — HIT REACTIONS V3 (experimental branch only).
 * T-Rex / Lucas only. All image frames are COMPLETE FULL-BODY poses assembled
 * from the game's hand-illustrated character art, not meshes or cut-up limbs.
 * No game-rule, collision, life bar, hitbox, tournament or projectile changes.
 * Other fighters and both original betas are untouched.
 */
(function(){
'use strict';
const IDS=new Set([1,3]);
const WIDTH=510,HEIGHT=480,ORIGIN_X=255,GROUND=435;
const FRAME_COUNT=5;
const atlas=new Map();
const toggleState={active:true,ready:false,lastHit:'',lastTime:0,issue:''};
const PHASES={
  high:['hurt','hurt','shield','hurt','guard'],
  mid:['forward','forward','low','shield','guard'],
  low:['low','low','low','shield','guard'],
  heavy:['hurt','fall','fall','hurt','guard']
};
// Each item is a complete artist-authored sprite, not a warped copy of one pose.
// Original illustrations already contain different arm, leg and head positions.
const NAMES={high:'GOLPE ALTO',mid:'GOLPE AL CUERPO',low:'GOLPE BAJO',heavy:'IMPACTO FUERTE'};
const DELAYS={high:[0,.13,.36,.67,.83],mid:[0,.13,.35,.62,.83],
              low:[0,.12,.38,.65,.85],heavy:[0,.12,.34,.65,.84]};
function between(v,a,b){return Math.max(a,Math.min(b,v))}
function createSurface(){const c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;return c;}
function bounds(c){
 const data=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,WIDTH,HEIGHT).data;
 let top=HEIGHT,bottom=-1,left=WIDTH,right=-1;
 for(let y=0;y<HEIGHT;y+=1)for(let x=0;x<WIDTH;x+=1){
   if(data[(y*WIDTH+x)*4+3]<=52)continue;
   top=Math.min(top,y);bottom=Math.max(bottom,y);
   left=Math.min(left,x);right=Math.max(right,x);
 }
 return bottom<top?null:{top,bottom,left,right,height:bottom-top+1,width:right-left+1};
}
function drawBase(c,im,row,col,scale=1){
 const g=c.getContext('2d');g.imageSmoothingEnabled=true;
 g.imageSmoothingQuality='high';SpriteAtlas.draw(g,im,row,col,ORIGIN_X,GROUND,330*scale);
}
function renderLow(id,c){
 const g=c.getContext('2d');g.imageSmoothingEnabled=true;
 if(id===3){
   // Lucas' corrected complete-body original (with his mustache).
   SpriteAtlas.draw(g,lucasArt[1],0,0,ORIGIN_X,GROUND,330);
   return;
 }
 const im=crouchArt,part=crouchCells?.[id];
 if(!part)return;
 const scale=POSE_SCALES[im.src.split('/').pop()]?.[id]||1;
 const unit=330/(im.height/3)*scale;
 const gw=im.width/4,gx=id%4*gw,w=part.w*unit,h=part.h*unit;
 g.drawImage(im,part.x,part.y,part.w,part.h,
   ORIGIN_X+(part.x-gx-gw/2)*unit,GROUND-h,w,h);
}
function renderSource(id,name){
 const c=createSurface(),[sheet,row]=atlasMap[id],[as,ar]=actionMap[id];
 switch(name){
  case 'guard':drawBase(c,actionAtlases[as],ar,id===3?3:0);break;
  case 'hurt':drawBase(c,actionAtlases[as],ar,5);break;
  case 'forward':drawBase(c,actionAtlases[as],ar,1);break;
  case 'shield':drawBase(c,heldSheet,0,id===1?1:3);break;
  case 'fall': {
    // First frame of Work's independently illustrated KO/collapse sequence.
    // Used only as a strong recoil (not the floor-contact frames).
    const im=fallArt[Math.floor(id/4)];
    const r=Math.floor((id%4)/2),col=(id%2)*3;
    drawBase(c,im,r,col);
    break;
  }
  case 'low':renderLow(id,c);break;
  case 'lowRecover':
    // A full-body bent-legs artist frame, not an interpolated resize.
    drawBase(c,actionAtlases[as],ar,4);
    break;
 }
 return c;
}
function cacheFighter(id){
 const sources={},issues=[];
 const names=new Set(Object.values(PHASES).flat());
 // This is a visual experiment: a missing/shortened animation must NOT
 // abort the entire game. Work's source sheets have different proportions.
 // The v3.0 strict height threshold incorrectly treated valid bent/low
 // poses as fatal. Render each independently and use a safe full-body pose.
 for(const name of names){
   try{
     const image=renderSource(id,name);
     if(!image)throw Error('renderSource returned no canvas');
     // Alpha inspection can fail on a restricted Canvas implementation.
     // It is diagnostic only, not a prerequisite to play.
     let bb=null;
     try{bb=bounds(image)}catch(scanErr){
       issues.push(name+': lectura de pixeles no disponible ('+scanErr.message+')');
     }
     if(!bb&&image){
       issues.push(name+': pose transparente; se utilizará una alternativa');
       sources[name]=null;
     }else sources[name]=image;
   }catch(e){
     sources[name]=null;
     issues.push(name+': '+(e?.message||String(e)));
   }
 }
 let neutral=sources.guard||sources.forward||sources.hurt||sources.shield;
 if(!neutral){
   // Last resort: try the known-good normal sheet. Only this is fatal.
   try{
     const [index,row]=atlasMap[id];neutral=createSurface();
     drawBase(neutral,atlases[index],row,0);
     issues.push('usando pose normal como fallback');
   }catch(e){throw Error('No hay imagen base de '+id+': '+(e?.message||e));}
 }
 sources.guard=neutral;
 for(const name of names)if(!sources[name])sources[name]=neutral;
 let height=0;try{height=bounds(neutral)?.height||0}catch(_){}
 atlas.set(id,{sources,referenceHeight:height});
 return issues;
}
function getKind(attacker,damage,push,moveKind,info){
 const level=info?.level||(moveKind===-3?(attacker?.level||'mid'):'mid');
 if(info?.special||info?.finisher||attacker?.finisher||attacker?.power||
      damage>=27||Math.abs(push)>=75||(moveKind!==-3&&moveKind!==-4))
   return 'heavy';
 if(level==='low')return 'low';
 if(level==='high'||level==='overhead')return 'high';
 return 'mid';
}
function duration(kind,stun){
 const max=kind==='heavy'?30:kind==='low'?22:24;
 return Math.max(17,Math.min(max,stun||20));
}
const originalHit=hit;
hit=function(target,damage,push,moveKind=-3,impactY=target?280-target.y:280,info=null){
 const attacker=info?.attacker||(target===enemy?player:enemy);
 const result=originalHit.call(this,target,damage,push,moveKind,impactY,info);
 if(!result||!toggleState.active||!toggleState.ready||!target||
    !IDS.has(target.id)||target.lastBlocked||target.hp<=0||
    target.knockdown>0||target.grabbed||target.thrown>0)return result;
 const type=getKind(attacker,damage,push,moveKind,info);
 target.previewV3={type,at:frame,span:duration(type,target.stun)};
 toggleState.lastHit=(target.id===1?'T-Rex':'Lucas')+' · '+NAMES[type];
 toggleState.lastTime=frame;
 const current=document.getElementById('beta-v3-last');
 if(current)current.textContent=toggleState.lastHit;
 return result;
};
function activeReaction(a){
 return toggleState.active&&toggleState.ready&&a&&IDS.has(a.id)&&
 a.previewV3&&a.stun>0&&a.hp>0&&!a.knockdown&&!a.roundLoser&&
 !a.grabbed&&!a.thrown&&!a.victory&&!a.phoneVictory;
}
function positionAt(a){
 const h=a.previewV3;
 const progress=between((frame-h.at)/h.span,0,.9999);
 const intervals=DELAYS[h.type],seq=PHASES[h.type];
 let index=seq.length-1;
 for(let k=seq.length-2;k>=0;k--){
   if(progress<intervals[k+1])index=k;
 }
 // Brief, physical recoil offset (engine knockback remains unchanged).
 const impulse=(1-progress)*Math.sin(Math.min(1,progress*7)*Math.PI/2);
 const dir=h.type==='mid'?-1:1;
 const visualX=dir*impulse*(h.type==='heavy'?10:h.type==='high'?6:4);
 return {name:seq[index],progress,index,visualX};
}
const originalDrawAction=drawNormalAction;
drawNormalAction=function(a,size){
 if(!activeReaction(a))return originalDrawAction.call(this,a,size);
 const frameData=positionAt(a),art=atlas.get(a.id);
 if(!art)return originalDrawAction.call(this,a,size);
 const pose=art.sources[frameData.name];
 if(!pose)return originalDrawAction.call(this,a,size);
 ctx.save();
 // Work's drawFighter tilts ALL stunned fighters by -0.09 rad.
 // Cancel only that legacy rigid lean while we draw a real full-body pose.
 ctx.rotate(.09);
 ctx.translate(frameData.visualX,0);
 ctx.drawImage(pose,-ORIGIN_X,-GROUND);
 ctx.restore();
};
const originalDrawFighter=drawFighter;
drawFighter=function(a,ghost=false){
 if(ghost||!activeReaction(a))return originalDrawFighter.call(this,a,ghost);
 const inv=a.invuln,knock=a.hitRecoil,missingLeg=a.legGone;
 // Affect appearance only; restore these properties before physics advances.
 // Removing alpha flicker makes the new body poses readable.
 a.invuln=0;a.hitRecoil=0;a.legGone=false;
 try{return originalDrawFighter.call(this,a,ghost)}
 finally{a.invuln=inv;a.hitRecoil=knock;a.legGone=missingLeg;}
};
function activate(flag){
 toggleState.active=!!flag;
 const button=document.getElementById('beta-v3-toggle');
 if(button){
   button.textContent=toggleState.active?'ANIMACIONES BETA 3':'ANIMACIONES ORIGINALES';
   button.setAttribute('aria-pressed',String(toggleState.active));
 }
}
function controls(){
 const toggle=document.getElementById('beta-v3-toggle');
 if(!toggle)return;
 toggle.addEventListener('click',()=>activate(!toggleState.active));
 const local=document.getElementById('beta-v3-local');
 if(local)local.addEventListener('click',()=>{
   if(typeof LOCAL==='undefined'||typeof openLocal!=='function')return;
   LOCAL.selected[0]=1;LOCAL.selected[1]=3;openLocal();
 });
 const cpu=document.getElementById('beta-v3-cpu');
 if(cpu)cpu.addEventListener('click',async()=>{
   try{
     if(typeof unlockAudio==='function')unlockAudio();
     await assetReady;
     if(typeof leaveTournament==='function')leaveTournament();
     if(typeof leaveLocal==='function')leaveLocal();
     selected=1;queue=Array(11).fill(3);battle=0;practice=false;
     show('game');newBattle();
     const label=document.getElementById('arena-label');
     if(label)label.textContent='BETA 3 · T-REX VS LUCAS (CPU)';
   }catch(e){console.error('[V3] CPU match start error',e)}
 });
 activate(true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',controls);
else controls();
window.PARIPE_BETA3={
 version:3,characters:[1,3],types:Object.keys(PHASES),get ready(){return toggleState.ready},
 get active(){return toggleState.active},get lastHit(){return toggleState.lastHit},
 get error(){return toggleState.issue},get frameCount(){return atlas.size*4*FRAME_COUNT},
 activate
};
assetReady.then(()=>{
 const issues=[];
 for(const id of IDS){
   try{
     const warnings=cacheFighter(id);
     if(warnings.length)issues.push((id===1?'T-Rex':'Lucas')+': '+warnings.join('; '));
   }catch(e){
     issues.push((id===1?'T-Rex':'Lucas')+': '+(e?.message||String(e)));
   }
 }
 toggleState.ready=atlas.size>0;
 toggleState.issue=issues.join(' | ');
 const st=document.getElementById('beta-v3-status');
 if(st){
   st.textContent=toggleState.ready
     ?(issues.length?'LISTA CON AVISOS · VER DETALLE':'LISTA · T-REX Y LUCAS')
     :'ERROR: '+(issues[0]||'No se generaron poses');
   st.title=issues.join('\n')||'Todas las poses preparadas';
 }
 console.info('[BETA 3] Pose sheets prepared. Fighter count:',atlas.size);
 if(issues.length)console.warn('[BETA 3] Diagnostic warnings:',issues);
}).catch(e=>{
 const reason=e?.message||String(e);
 toggleState.issue='Fallo al preparar recursos originales: '+reason;
 const st=document.getElementById('beta-v3-status');
 if(st){st.textContent='ERROR: '+reason.slice(0,105);st.title=toggleState.issue;}
 console.error('[BETA 3] Original game assets were not ready:',e);
});
})();