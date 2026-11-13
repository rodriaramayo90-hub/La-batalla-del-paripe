/* One authority advances the ending; online guests render the same snapshots. */
const END_TIMING={freeze:6,slow:78,slowRate:.2,settle:48,settleLimit:84,celebrate:165,phone:237,tie:54};
const ROUND_END={active:false,phase:'',phaseAge:0,age:0,winner:2,reason:'ko',authoritative:true,token:0,revealed:false,voicePlayed:false};
let roundEndDone=null;
function resetRoundEnd(){Object.assign(ROUND_END,{active:false,phase:'',phaseAge:0,age:0,winner:2,reason:'ko',authoritative:true,token:0,revealed:false,voicePlayed:false});roundEndDone=null;}
function startRoundEnd(winner,done){
 if(ROUND_END.active&&ending)return false;
 clearAllGrapples();ending=true;clearKeys();introFrames=0;announceTime=0;announcement='';hitstop=0;exFlash=0;trails=[];
 const reason=matchFrames<=0?'time':'ko';Object.assign(ROUND_END,{active:true,phase:reason==='time'?'settle':'impact',phaseAge:0,age:0,winner,reason,authoritative:true,token:battleToken,revealed:false,voicePlayed:false});roundEndDone=done;
 for(const[a,role]of [[player,0],[enemy,1]])if(a){a.roundWinner=winner===role;a.roundLoser=winner<2&&winner!==role||winner===2&&a.hp<=0;a.victory=false;a.victoryAge=0;a.koFall=0;a.koLanded=false;a.moving=false;a.blocking=false;a.guardMix=0;a.phoneManaged=false;}
 if(reason==='ko'){shake=Math.max(shake,8);}updateHud();return true;
}
function roundEndWinner(){return [player,enemy].find(a=>a?.roundWinner)||null;}
function packRoundEnd(){if(!ROUND_END.active)return null;const{active,phase,phaseAge,age,winner,reason,revealed,voicePlayed}=ROUND_END;return{active,phase,phaseAge,age,winner,reason,revealed,voicePlayed};}
function applyRoundEnd(s){if(!s){resetRoundEnd();return;}Object.assign(ROUND_END,s,{authoritative:false,token:battleToken});roundEndDone=null;}
function advanceEndMotion(dt){
 frame+=dt;tickGrappleStates(dt);
 for(const a of [player,enemy].filter(Boolean)){
  a.attack=Math.max(0,a.attack-dt);finisherStep(a);a.x=clamp(a.x+a.knockback*dt,80,880);a.knockback*=Math.pow(.86,dt);a.vy-=.75*dt;a.y=Math.max(0,a.y+a.vy*dt);if(a.y===0)a.vy=0;
  a.stun=Math.max(0,a.stun-dt);a.hitRecoil=Math.max(0,a.hitRecoil-.075*dt);a.landSquash=0;a.guardMix=0;a.guardHit=0;a.invuln=0;a.moving=false;
 }
 for(const p of projectiles){p.x+=p.dir*p.speed*dt;p.age+=dt;p.life-=dt;}
 projectiles=projectiles.filter(p=>p.life>0&&p.x>-100&&p.x<1060);effects.forEach(e=>e.t-=dt);effects=effects.filter(e=>e.t>0);shake=Math.max(0,shake-dt*.8);exFlash=Math.max(0,exFlash-dt);
}
function beginCelebration(){
 ROUND_END.phase='celebrate';ROUND_END.phaseAge=0;projectiles=[];effects=[];trails=[];shake=0;
 const winner=roundEndWinner();
 for(const a of [player,enemy].filter(Boolean)){
  a.attack=0;a.finisher=false;a.power=false;a.y=0;a.vy=0;a.knockback=0;a.dash=0;a.blocking=false;a.guardMix=0;a.hitRecoil=0;a.thrown=0;a.grabbing=a.grabbed=false;a.grabLink=0;a.moving=false;clearAfflictions(a);
  if(a===winner){a.stun=0;a.victory=true;a.victoryAge=0;a.legGone=false;}
  else if(a.roundLoser){a.koFall=1;a.stun=9999;a.knockdown=ROUND_END.reason==='ko'?9999:0;}
  else a.stun=0;
 }
 if(winner){sfx('win');if(winner.id===1)startTrexVictory(winner,()=>{},true);}else sfx('confirm');
}
function advanceCelebration(dt){
 frame+=dt;const winner=roundEndWinner();if(!winner)return;winner.victoryAge+=dt;
 if(winner.phoneManaged){winner.phoneElapsed+=dt;const t=winner.phoneElapsed*1000/60;winner.phoneFrame=t<450?0:t<850?1:t<1200?2:t<1500?3:t<3450?4+Math.floor((t-1500)/85)%2:3;
  if(!ROUND_END.voicePlayed&&winner.phoneElapsed>=90){ROUND_END.voicePlayed=true;audio.playVoice(12);if(ONLINE.active&&ONLINE.role===0)ONLINE.events.push({voice:12});}
 }
}
function revealRoundEnd(){
 if(ROUND_END.revealed)return;ROUND_END.phase='result';ROUND_END.phaseAge=0;ROUND_END.revealed=true;
 const done=roundEndDone;roundEndDone=null;if(ROUND_END.authoritative&&done&&ROUND_END.token===battleToken&&mode==='game')done();
}
function stepRoundEnd(dt){
 if(!ROUND_END.active)return;if(ROUND_END.token!==battleToken||mode!=='game'){resetRoundEnd();return;}
 // Guest simulation never advances the authoritative cinematic or sends a result.
 if(!ROUND_END.authoritative){if(ROUND_END.phase==='result')advanceCelebration(dt);return;}
 ROUND_END.age+=dt;ROUND_END.phaseAge+=dt;const winner=roundEndWinner();
 if(ROUND_END.phase==='impact'){
  if(ROUND_END.phaseAge>=END_TIMING.freeze){ROUND_END.phase='slow';ROUND_END.phaseAge=0;}
 }else if(ROUND_END.phase==='slow'){
  advanceEndMotion(dt*END_TIMING.slowRate);
  for(const a of [player,enemy].filter(Boolean))if(a.roundLoser){const t=clamp(ROUND_END.phaseAge/END_TIMING.slow,0,1);a.koFall=t*t*(3-2*t);landKoBody(a);}
  if(ROUND_END.phaseAge>=END_TIMING.slow){ROUND_END.phase='settle';ROUND_END.phaseAge=0;}
 }else if(ROUND_END.phase==='settle'){
  advanceEndMotion(dt);for(const a of [player,enemy].filter(Boolean))if(a.roundLoser){a.koFall=Math.min(1,a.koFall+dt/20);landKoBody(a);}
  let ready=true;if(winner){const target=clamp(winner.x,170,790);if(winner.attack>0||winner.y>0)ready=false;else if(Math.abs(winner.x-target)>.1){const move=Math.sign(target-winner.x)*Math.min(Math.abs(target-winner.x),3.5*dt);winner.x+=move;winner.moving=true;winner.walk+=dt;ready=false;}}
  if((ROUND_END.phaseAge>=END_TIMING.settle&&ready&&[player,enemy].every(a=>!a||a.y===0))||ROUND_END.phaseAge>=END_TIMING.settleLimit)beginCelebration();
 }else if(ROUND_END.phase==='celebrate'){
  advanceCelebration(dt);const duration=winner?(winner.id===1?END_TIMING.phone:END_TIMING.celebrate):END_TIMING.tie;
  if(ROUND_END.phaseAge>=duration)revealRoundEnd();
 }else if(ROUND_END.phase==='result')advanceCelebration(dt);
 updateHud();
}
function drawVictoryPose(a,size){
 const pattern=[0,1,2,1],phase=pattern[Math.floor(a.victoryAge/18)%pattern.length],n=a.id%4;
 ctx.save();if(!reducedMotion)ctx.translate(0,Math.sin(a.victoryAge*.13)*1.5);SpriteAtlas.draw(ctx,victorySheets[Math.floor(a.id/4)],Math.floor(n/2),(n%2)*3+phase,0,0,size);ctx.restore();
}
function landKoBody(a){if(a.koLanded||a.koFall<.72||a.y>2)return;a.koLanded=true;sfx('land');shake=Math.max(shake,3);effects.push({x:a.x,y:458,t:20,burst:true,kind:-4,blocked:false});}
const FALL_BOUNDS=[],MASK_FALL_BOUNDS=[];
function fallCell(id,phase,masked=false){if(id===1&&masked)return[maskStages,0,3+phase];const n=id%4;return[fallArt[Math.floor(id/4)],Math.floor(n/2),(n%2)*3+phase];}
function prepareFallBounds(){
 const c=document.createElement('canvas');c.width=c.height=700;const x=c.getContext('2d',{willReadFrequently:true});
 const measure=(id,phase,masked=false)=>{x.clearRect(0,0,700,700);SpriteAtlas.draw(x,...fallCell(id,phase,masked),350,600,330);const d=x.getImageData(0,0,700,700).data;let l=700,r=0,t=700,b=0;for(let y=0;y<700;y++)for(let px=0;px<700;px++)if(d[(y*700+px)*4+3]>32){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,y);b=Math.max(b,y);}return{left:l-350,right:r-350,top:t-600,bottom:b-600};};
 for(let id=0;id<12;id++){const rest=measure(id,2),factor=CHARACTER_HEIGHTS[id]/(rest.right-rest.left),im=fallArt[Math.floor(id/4)],base=Math.floor(id%4/2)*6+id%2*3,scales=POSE_SCALES[im.src.split('/').pop()];for(let p=0;p<3;p++)scales[base+p]*=factor;FALL_BOUNDS[id]=[0,1,2].map(p=>measure(id,p));}for(let p=0;p<3;p++)MASK_FALL_BOUNDS[p]=measure(1,p,true);c.width=c.height=0;
}
function drawKoDefeat(a,size){
 const t=clamp(a.koFall,0,1),phase=t<.32?0:t<.72?1:2,masked=a.id===1&&a.diveMask>0,b=masked?MASK_FALL_BOUNDS[phase]:FALL_BOUNDS[a.id]?.[phase];if(!b)return;
 // Three anatomically drawn poses, never a rigidly rotated standing sprite.
 // Hip/shoulder settle first; a small damped lift resolves the final floor impact.
 const u=clamp((t-.72)/.28,0,1),bounce=phase===2&&!reducedMotion?Math.sin(u*Math.PI*2)*Math.exp(-u*5)*2:0;
 const drift=-a.dir*24*t,center=a.x+drift,worldLeft=center+(a.dir>0?b.left:-b.right),worldRight=center+(a.dir>0?b.right:-b.left),correction=worldLeft<12?12-worldLeft:worldRight>948?948-worldRight:0;
 ctx.save();ctx.translate((drift+correction)*a.dir,-b.bottom-Math.max(0,bounce));SpriteAtlas.draw(ctx,...fallCell(a.id,phase,masked),0,0,size);ctx.restore();
}
function drawRoundEndOverlay(){
 if(!ROUND_END.active)return;const phase=ROUND_END.phase,winner=roundEndWinner(),ko=ROUND_END.reason==='ko';
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
 if(phase==='impact'||phase==='slow'){
  const t=phase==='impact'?0:clamp(ROUND_END.phaseAge/END_TIMING.slow,0,1);if(!reducedMotion&&ROUND_END.age<5){ctx.fillStyle='#fff4bd44';ctx.fillRect(0,0,960,540);}
  ctx.fillStyle='#16051e66';ctx.fillRect(0,180,960,148);ctx.save();ctx.translate(480,250);const scale=1+(1-t)*.10;ctx.scale(scale,scale);ctx.rotate(-.045);ctx.font='italic 108px ParipeDisplay,Impact,sans-serif';ctx.lineWidth=12;ctx.strokeStyle='#2c063f';ctx.strokeText(ko?(ROUND_END.winner===2?'DOBLE K.O.':'K.O.'):'TIEMPO',0,0);ctx.fillStyle='#ffe637';ctx.fillText(ko?(ROUND_END.winner===2?'DOBLE K.O.':'K.O.'):'TIEMPO',0,0);ctx.restore();
 }else if(phase!=='result'){
  const label=phase==='celebrate'?(winner?'¡'+fighters[winner.id][0].toUpperCase()+' GANA!':'¡EMPATE!'):(ko?'K.O.':'TIEMPO');ctx.font='italic 34px ParipeDisplay,Impact,sans-serif';ctx.lineWidth=7;ctx.strokeStyle='#240733';ctx.strokeText(label,480,64);ctx.fillStyle='#ffe637';ctx.fillText(label,480,64);
 }
 ctx.restore();
}
