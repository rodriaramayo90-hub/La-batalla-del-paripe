/* A grapple links two actors by a serializable token, never by object references. */
const GRAPPLE={total:56,catchAt:9,releaseAt:30,techUntil:21,distance:84};
let grappleSerial=0,MASKED_FLOOR_BOUNDS=null,MASKED_HELD_BOUNDS=null;
const HELD_POSE_BOUNDS=[];
function grapplePartner(a){return [player,enemy].find(b=>b&&b!==a&&a.grabLink&&b.grabLink===a.grabLink)||null;}
function clearGrabFlags(a){if(!a)return;a.grabbing=false;a.grabbed=false;a.grabLink=0;}
function releaseGrapple(a,interrupt=false){
 const b=grapplePartner(a),units=[a,b].filter(Boolean);
 for(const unit of units){const wasHeld=unit.grabbed,wasOwner=unit.grabbing;clearGrabFlags(unit);if(wasHeld){unit.stun=0;unit.invuln=Math.max(unit.invuln,8);unit.throwImmune=Math.max(unit.throwImmune,40);unit.y=0;unit.vy=0;}if(interrupt&&wasOwner){unit.attack=0;unit.grabCool=Math.max(unit.grabCool,50);}}
}
function clearAllGrapples(){for(const a of [player,enemy].filter(Boolean))if(a.grabbing||a.grabbed)releaseGrapple(a,true);}
function breakGrab(a,b){
 releaseGrapple(a,true);releaseGrapple(b,true);
 const direction=a.x<=b.x?1:-1;
 for(const unit of [a,b]){unit.attack=0;unit.stun=0;unit.blockstun=0;unit.grabCool=65;unit.throwImmune=65;unit.invuln=16;unit.knockback=unit===a?-direction*3:direction*3;unit.hitTrail='';unit.moveTrail='';unit.moveAge=0;unit.grabCaptured=false;unit.grabReleased=false;}
 effects.push({x:(a.x+b.x)/2,y:235,t:42,text:'¡ZAFADA!',color:'#9cf7ff'});sfx('guard');return true;
}
function beginGrab(a,b){
 if(!a||a.hp<=0||ending||a.escaping>0)return false;
 if(a.grabbed){const owner=grapplePartner(a);if(owner&&owner.attackLength-owner.attack<=GRAPPLE.techUntil)return breakGrab(a,owner);return false;}
 if(a.y>0||a.vy>0||a.legGone)return false;
 if(b&&b.attackType==='grab'&&b.attack>0&&b.attackLength-b.attack<=12&&Math.abs(a.x-b.x)<100&&a.stun<=0)return breakGrab(a,b);
 if(a.grabbing||a.attack>0||a.stun>0||a.blockstun>0||a.grabCool>0)return false;
 if(a===player)cancelCharges();else if(LOCAL.active)cancelSecondCharges();
 a.blocking=false;a.guardMix=0;a.crouching=false;a.power=false;a.finisher=false;a.attackType='grab';a.attackLength=GRAPPLE.total;a.attack=GRAPPLE.total;a.hit=false;a.connected=false;a.grabCool=88;a.hitTrail='';a.moveTrail='';a.moveAge=0;a.chainDepth=0;a.grabAttempted=false;a.grabCaptured=false;a.grabReleased=false;a.grabTraining=false;a.grabLink=0;sfx('release');return true;
}
function captureGrapple(a,b){
 const token=++grappleSerial;a.grabbing=true;a.grabCaptured=true;a.grabLink=token;a.connected=true;a.hit=true;
 b.grabbed=true;b.grabLink=token;b.attack=0;b.finisher=false;b.power=false;b.blocking=false;b.guardMix=0;b.crouching=false;b.knockback=0;b.dash=0;b.vy=0;b.y=0;b.hitRecoil=0;b.daze=0;b.knockdown=0;b.thrown=0;b.receivedHits=0;b.stun=2;b.invuln=2;b.hitTrail='';b.moveTrail='';b.moveAge=0;
 if(b.legGone){b.legGone=false;projectiles=projectiles.filter(p=>!(p.owner===b&&p.kind===6));}
 if(b===player){cancelCharges();clearActionBuffer();}else if(LOCAL.active){cancelSecondCharges();SECOND.actions=[];}
 syncGrapplePairs();hitstop=Math.max(hitstop,3);sfx('guard');
 effects.push({x:(a.x+b.x)/2,y:170,t:28,text:'¡AGARRE!',color:'#bcefff'});
}
function throwGrapple(a,b){
 const forwards=a.dir,wall=b.x+forwards*155<80||b.x+forwards*155>880,direction=wall?-forwards:forwards;
 clearGrabFlags(a);clearGrabFlags(b);a.grabReleased=true;b.stun=0;b.invuln=0;b.attack=0;b.blocking=false;b.lastBlocked=false;
 const didHit=hit(b,17,direction*8,-4,405-b.y,{attacker:a,level:'mid'});
 if(didHit){b.throwDir=direction;b.throwAge=0;b.thrown=46;b.throwLanded=false;b.knockdown=46;b.stun=46;b.invuln=32;b.throwImmune=110;b.vy=11;b.y=Math.max(8,b.y);b.knockback=direction*14;b.hitRecoil=0;b.receivedHits=0;sfx('dash');}
}
function resolveGrab(a,b){
 const elapsed=a.attackLength-a.attack;
 if(!a.grabAttempted&&elapsed>=GRAPPLE.catchAt){
  a.grabAttempted=true;
  if(practice&&!b){a.grabCaptured=true;a.grabTraining=true;sfx('guard');}
  else if(b&&!b.grabbed&&!b.grabbing&&b.hp>0&&b.y<=10&&b.escaping<=0&&b.stun<=0&&b.blockstun<=0&&b.invuln<=0&&b.throwImmune<=0&&Math.abs(a.x-b.x)<=88&&Math.sign(b.x-a.x)===a.dir)captureGrapple(a,b);
 }
 if(a.grabTraining&&!a.grabReleased&&elapsed>=GRAPPLE.releaseAt){a.grabReleased=true;sfx('dash');}
 if(a.grabbing&&elapsed>=GRAPPLE.releaseAt){const victim=grapplePartner(a);if(victim)throwGrapple(a,victim);else releaseGrapple(a,true);}
}
function syncGrapplePairs(){
 for(const a of [player,enemy].filter(Boolean))if(a.grabbing){
  const b=grapplePartner(a);if(!b||!b.grabbed||a.attack<=0||a.stun>0||a.hp<=0||b.hp<=0){releaseGrapple(a,true);continue;}
  a.x=clamp(a.x,a.dir<0?80+GRAPPLE.distance:80,a.dir>0?880-GRAPPLE.distance:880);a.y=0;a.vy=0;a.knockback=0;a.moving=false;
  b.x=a.x+a.dir*GRAPPLE.distance;b.y=clamp((a.attackLength-a.attack-22)/8,0,1)*18;b.vy=0;b.dir=-a.dir;b.stun=Math.max(b.stun,2);b.invuln=Math.max(b.invuln,2);b.blocking=false;b.moving=false;b.knockback=0;
 }
 for(const a of [player,enemy].filter(Boolean))if(a.grabbed&&!grapplePartner(a))releaseGrapple(a,true);
}
function tickGrappleStates(dt){
 for(const a of [player,enemy].filter(Boolean)){
  if(a.thrown>0){a.thrown=Math.max(0,a.thrown-dt);a.throwAge+=dt;
   if(a.y<=0&&a.throwAge>14&&!a.throwLanded){a.throwLanded=true;effects.push({x:a.x,y:452,t:26,kind:-4,burst:true,blocked:false});shake=Math.max(shake,5);hitstop=Math.max(hitstop,4);sfx('land');}
  }
 }
}
function drawGrabAttacker(a,size=330){
 const elapsed=a.attackLength-a.attack;
 if(a.grabAttempted&&!a.grabCaptured&&elapsed>18){const[sheet,row]=atlasMap[a.id];drawSprite(atlases[sheet],row,0,0,0,size);return;}
 const phase=a.grabCaptured?(a.grabReleased?2:1):0;
 if(a.id===1&&a.diveMask>0){SpriteAtlas.draw(ctx,maskedSheets[2],0,3+phase,0,0,size);return;}
 const n=a.id%4;SpriteAtlas.draw(ctx,grappleSheets[Math.floor(a.id/4)],Math.floor(n/2),(n%2)*3+phase,0,0,size);
}
function drawHeldVictim(a,size=330){
 if(a.id===1&&a.diveMask>0)SpriteAtlas.draw(ctx,maskedSheets[2],1,0,0,0,size);
 else SpriteAtlas.draw(ctx,heldSheet,Math.floor(a.id/6),a.id%6,0,0,size);
}
function drawThrownVictim(a,size=330){
 const angle=(a.throwDir*a.dir)*(.25+Math.min(1,a.throwAge/32)*1.6),pivot=size*.45,b=a.id===1&&a.diveMask>0?MASKED_HELD_BOUNDS:HELD_POSE_BOUNDS[a.id];
 let dx=0,dy=0;if(b){const c=Math.cos(angle),s=Math.sin(angle),corners=[[b.left,b.top],[b.right,b.top],[b.left,b.bottom],[b.right,b.bottom]].map(([x,y])=>({x:c*x-s*(y+pivot),y:-pivot+s*x+c*(y+pivot)}));const minX=Math.min(...corners.map(p=>p.x)),maxX=Math.max(...corners.map(p=>p.x)),maxY=Math.max(...corners.map(p=>p.y)),left=a.x+(a.dir>0?minX:-maxX),right=a.x+(a.dir>0?maxX:-minX);dx=(left<12?12-left:right>948?948-right:0)*a.dir;dy=Math.min(0,a.y-maxY-2);}
 ctx.save();ctx.translate(dx,dy-pivot);ctx.rotate(angle);ctx.translate(0,pivot);drawHeldVictim(a,size);ctx.restore();
}
function drawTrainingGrapple(){
 if(!practice||!player?.grabTraining||player.attack<=0)return;
 const elapsed=player.attackLength-player.attack;if(elapsed<GRAPPLE.catchAt)return;
 const t=clamp((elapsed-GRAPPLE.releaseAt)/(GRAPPLE.total-GRAPPLE.releaseAt),0,1),x=clamp(player.x+player.dir*(GRAPPLE.distance+t*155),80,880);
 const dummy={...entity(player.id,x,-player.dir),grabbed:elapsed<GRAPPLE.releaseAt,thrown:elapsed>=GRAPPLE.releaseAt?46:0,throwAge:t*32,throwDir:player.dir,y:Math.sin(t*Math.PI)*95,diveMask:player.diveMask};
 ctx.save();ctx.globalAlpha=.3;ctx.filter='grayscale(1)';drawFighter(dummy,true);ctx.restore();ctx.save();ctx.font='bold 10px Arial';ctx.fillStyle='#c8eaff';ctx.textAlign='center';ctx.fillText('SILUETA DE PRÁCTICA',x,520);ctx.restore();
}
function prepareMaskedFloorBounds(){
 const c=document.createElement('canvas');c.width=c.height=700;const x=c.getContext('2d',{willReadFrequently:true});SpriteAtlas.draw(x,maskedSheets[0],1,5,350,600,330);const data=x.getImageData(0,0,700,700).data;let l=700,r=0,t=700,b=0;
 for(let y=0;y<700;y++)for(let px=0;px<700;px++)if(data[(y*700+px)*4+3]>32){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,y);b=Math.max(b,y);}
 MASKED_FLOOR_BOUNDS={left:l-350,right:r-350,top:t-600,bottom:b-600};c.width=c.height=0;
}

function prepareHeldPoseBounds(){
 const c=document.createElement('canvas');c.width=c.height=700;const x=c.getContext('2d',{willReadFrequently:true});
 const measure=()=>{const d=x.getImageData(0,0,700,700).data;let l=700,r=0,t=700,b=0;for(let y=0;y<700;y++)for(let px=0;px<700;px++)if(d[(y*700+px)*4+3]>32){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,y);b=Math.max(b,y);}return{left:l-350,right:r-350,top:t-600,bottom:b-600};};
 for(let id=0;id<12;id++){x.clearRect(0,0,700,700);SpriteAtlas.draw(x,heldSheet,Math.floor(id/6),id%6,350,600,330);HELD_POSE_BOUNDS[id]=measure();}
 x.clearRect(0,0,700,700);SpriteAtlas.draw(x,maskedSheets[2],1,0,350,600,330);MASKED_HELD_BOUNDS=measure();c.width=c.height=0;
}
