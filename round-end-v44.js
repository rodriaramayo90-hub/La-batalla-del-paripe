/* One authority advances the ending; online guests render the same snapshots. */
const END_TIMING={freeze:6,slow:78,slowRate:.2,settle:48,settleLimit:84,celebrate:165,phone:237,tie:54};
const ROUND_END={active:false,phase:'',phaseAge:0,age:0,winner:2,reason:'ko',authoritative:true,token:0,revealed:false,voicePlayed:false};
let roundEndDone=null;
function resetRoundEnd(){Object.assign(ROUND_END,{active:false,phase:'',phaseAge:0,age:0,winner:2,reason:'ko',authoritative:true,token:0,revealed:false,voicePlayed:false});roundEndDone=null;}
function startRoundEnd(winner,done){
 if(ROUND_END.active&&ending)return false;
 clearAllGrapples();ending=true;clearKeys();introFrames=0;announceTime=0;announcement='';hitstop=0;exFlash=0;trails=[];
 const reason=matchFrames<=0?'time':'ko';Object.assign(ROUND_END,{active:true,phase:reason==='time'?'settle':'impact',phaseAge:0,age:0,winner,reason,authoritative:true,token:battleToken,revealed:false,voicePlayed:false});roundEndDone=done;
 for(const[a,role]of [[player,0],[enemy,1]])if(a){a.roundWinner=winner===role;a.roundLoser=winner<2&&winner!==role||winner===2&&a.hp<=0;a.victory=false;a.victoryAge=0;a.koFall=0;a.moving=false;a.blocking=false;a.guardMix=0;a.phoneManaged=false;}
 if(reason==='ko'){shake=Math.max(shake,8);sfx('land');}updateHud();return true;
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
 audio.stopVoice();if(winner){sfx('win');if(winner.id===1)startTrexVictory(winner,()=>{},true);}else sfx('confirm');
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
  for(const a of [player,enemy].filter(Boolean))if(a.roundLoser){const t=clamp(ROUND_END.phaseAge/END_TIMING.slow,0,1);a.koFall=t*t*(3-2*t);}
  if(ROUND_END.phaseAge>=END_TIMING.slow){ROUND_END.phase='settle';ROUND_END.phaseAge=0;}
 }else if(ROUND_END.phase==='settle'){
  advanceEndMotion(dt);for(const a of [player,enemy].filter(Boolean))if(a.roundLoser)a.koFall=Math.min(1,a.koFall+dt/20);
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
function drawKoDefeat(a,size){
 const b=a.id===1&&a.diveMask>0?MASKED_FLOOR_BOUNDS:KNOCKDOWN_BOUNDS[a.id];if(!b)return;
 const t=clamp(a.koFall,0,1),sign=(a.x>480?-1:1)*a.dir,angle=sign*Math.PI/2*t,min=sign>0?-b.bottom:b.top,max=sign>0?-b.top:b.bottom,center=(min+max)/2,half=(max-min)/2,worldCenter=clamp(a.x,half+12,948-half),localCenter=(worldCenter-a.x)*a.dir,bottom=sign>0?b.right:-b.left,tx=(localCenter-center)*t,ty=-bottom*t;
 const c=Math.cos(angle),s=Math.sin(angle),corners=[[b.left,b.top],[b.right,b.top],[b.left,b.bottom],[b.right,b.bottom]].map(([x,y])=>({x:tx+c*x-s*y,y:ty+s*x+c*y})),minX=Math.min(...corners.map(p=>p.x)),maxX=Math.max(...corners.map(p=>p.x)),maxY=Math.max(...corners.map(p=>p.y)),left=a.x+(a.dir>0?minX:-maxX),right=a.x+(a.dir>0?maxX:-minX),dx=(left<12?12-left:right>948?948-right:0)*a.dir,dy=Math.min(0,a.y-maxY-1);
 ctx.save();ctx.translate(tx+dx,ty+dy);ctx.rotate(angle);const[sheet,row]=actionMap[a.id];drawSprite(actionAtlases[sheet],row,5,0,0,size);ctx.restore();
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
