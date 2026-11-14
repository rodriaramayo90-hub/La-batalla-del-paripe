/* Same-screen matches. The second human never runs through the CPU brain. */
const LOCAL={active:false,paused:false,reason:'',selected:[0,1],controls:['keyboard','keyboard'],wins:[0,0],bestOf:3,round:1,stage:0,loading:false};
const SECOND={keys:{},actions:[],charges:new Map(),lastTap:{left:-10000,right:-10000}};
let HUMAN_JUMP=null;
const HUMAN_SOURCES=[new Map(),new Map()];
const SECOND_MAPPING={KeyA:'left',KeyD:'right',KeyW:'jump',KeyS:'down',KeyZ:'punch',KeyX:'kick',KeyC:'special',KeyV:'defend',KeyB:'grab'};
function resetHumanInputs(){HUMAN_JUMP=null;lastTap.left=lastTap.right=-10000;SECOND.jumpTap=null;for(const map of HUMAN_SOURCES)map.clear();SECOND.keys={};SECOND.actions=[];SECOND.charges.clear();SECOND.lastTap={left:-10000,right:-10000};}
function cancelSecondCharges(){SECOND.charges.clear();}
function localKeyboardAllowed(slot){return !LOCAL.active||LOCAL.controls[slot]==='keyboard';}
function handleHumanKeyDown(e){
 if(mode!=='game')return;
 if(e.code==='Escape'&&!(typeof ONLINE!=='undefined'&&ONLINE.active)){e.preventDefault();if(!e.repeat){if(LOCAL.active)toggleLocalPause();else toggleSoloPause();}return;}
 let slot=0,key=mapping[e.code];if(!key&&LOCAL.active){slot=1;key=SECOND_MAPPING[e.code];}
 if(!key||!localKeyboardAllowed(slot))return;e.preventDefault();if(e.repeat)return;
 humanInput(slot,key,true,'key-'+e.code);
}
function handleHumanKeyUp(e){
 if(mode!=='game')return;let slot=0,key=mapping[e.code];if(!key&&LOCAL.active){slot=1;key=SECOND_MAPPING[e.code];}
 if(!key)return;e.preventDefault();humanInput(slot,key,false,'key-'+e.code);
}
function humanInput(slot,key,pressed,source){
 if(mode==='game'&&projectileClash){if(pressed&&key==='punch')clashTap(slot);return;}
 if(mode!=='game'||slot===1&&!LOCAL.active||LOCAL.paused||PAD.soloPause)return;
 const a=slot===0?player:enemy;if(!a)return;const state=slot===0?keys:SECOND.keys;
 if(['punch','kick'].includes(key)){
  if(slot===0){if(pressed)beginCharge(key,source);else releaseCharge(source);}
  else if(pressed){
   if(key==='punch'&&state.defend){queueSecond('grab');return;}
   if(ending||introFrames>0||a.escaping>0||a.stun>0||a.blockstun>0||state.defend||key==='kick'&&a.legGone)return;
   SECOND.charges.set(source,{type:key,frames:0,low:!!state.down,ready:false});
  }else{const h=SECOND.charges.get(source);SECOND.charges.delete(source);if(h&&!ending&&a.stun<=0)queueSecond(h.type,h.frames>=CHARGE_FRAMES,h.low||!!state.down);}
  return;
 }
 if(key==='special'||key==='grab'){if(pressed&&!ending&&introFrames<=0){if(slot===0)bufferAction(key);else queueSecond(key);}return;}
 const map=HUMAN_SOURCES[slot];let sources=map.get(key);if(!sources){sources=new Set();map.set(key,sources);}const was=sources.has(source);if(pressed)sources.add(source);else sources.delete(source);state[key]=sources.size>0;
 if(pressed&&!was){
  if(key==='left'||key==='right'){if(slot===0)tapDirection(key);else{const now=performance.now();if(now-SECOND.lastTap[key]<260){dashUnit(a,key==='left'?-1:1);SECOND.lastTap[key]=-10000;}else SECOND.lastTap[key]=now;}}
  if(key==='down'){if(slot===0)captureLowChord();else for(const h of SECOND.charges.values())h.low=true;}
  if(key==='jump'){if(slot===0)latchOnlineJump();else SECOND.jumpTap={escape:!!state.defend};}
 }
}
function queueSecond(type,power=false,low=!!SECOND.keys.down){if(SECOND.actions.length<6)SECOND.actions.push({type,power,low,ttl:48});}
function localSecondStep(dt){
 const a=enemy,b=player,i=SECOND;if(!a)return;
 i.actions.forEach(x=>x.ttl-=dt);i.actions=i.actions.filter(x=>x.ttl>0);
 if(a.escaping>0||a.stun>0||a.blockstun>0||i.keys.defend||ending)cancelSecondCharges();
 else for(const h of i.charges.values()){if(i.keys.down)h.low=true;if(!a.attack&&a.y===0){h.frames=Math.min(CHARGE_FRAMES,h.frames+dt);if(h.frames>=CHARGE_FRAMES&&!h.ready){h.ready=true;sfx('ready');}}}
 const escapeTap=i.jumpTap?.escape;if(i.jumpTap){i.keys.jump=true;i.jumpTap=null;}
 if(escapeTap||i.keys.defend&&i.keys.jump){escapeUnit(a,b);i.keys.jump=false;}
 posture(a,i.keys.down);if(i.actions[0]?.type==='grab')consumeInput(a,b,i.actions);
 a.blocking=(i.keys.defend||a.blockstun>0)&&a.stun<=0&&!a.attack&&!a.escaping&&a.y===0;
 if(a.stun<=0&&a.blockstun<=0&&!a.escaping&&!a.blocking){
  if(!a.attack){const move=movementDirection(a,Number(!!i.keys.right)-Number(!!i.keys.left));a.x+=move*(a.crouching?.25:i.charges.size?.35:1)*(a.legGone?1.8:2.3+fighters[a.id][4]*.35)*movementMultiplier(a)*dt;a.moving=!!move;
   if(i.keys.jump&&a.y===0){a.vy=13;i.keys.jump=false;sfx('jump');}}
  consumeInput(a,b,i.actions);
 }
}
function drawSecondCharge(a){const h=[...SECOND.charges.values()].sort((a,b)=>b.frames-a.frames)[0];if(!h)return;const ratio=Math.min(1,h.frames/CHARGE_FRAMES);ctx.save();ctx.fillStyle='#190925';ctx.fillRect(a.x-43,100-a.y,86,7);ctx.fillStyle=ratio>=1?'#ffe43a':'#dc7cff';ctx.fillRect(a.x-43,100-a.y,86*ratio,7);ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.strokeStyle='#21072c';ctx.lineWidth=4;const label=ratio>=1?'¡SOLTÁ!':'CARGANDO';ctx.strokeText(label,a.x,92-a.y);ctx.fillText(label,a.x,92-a.y);ctx.restore();}
function localCharacter(slot,id){LOCAL.selected[slot]=id;renderLocalCard(slot);sfx('select');}
function localControl(slot,value){LOCAL.controlsManual=true;LOCAL.controls[slot]=value;renderLocalCard(slot);$('local-status').textContent='';}
function renderLocalCard(slot){const id=LOCAL.selected[slot],f=fighters[id];$('local-portrait-'+slot).innerHTML=portraitMarkup(id,true);$('local-style-'+slot).textContent=f[1];const pad=LOCAL.controls[slot].startsWith('pad:');$('local-help-'+slot).textContent=pad?'Cruceta / stick · □ piña · △ patada · ○ especial · L1 defensa':slot===0?'← → mover · ↑ saltar · ↓ agacharse · J piña · K patada · ESPACIO especial · MAYÚS defensa · F agarre':'A / D mover · W saltar · S agacharse · Z piña · X patada · C especial · V defensa · B agarre';
 const label=comboLabel;
 $('local-combos-'+slot).innerHTML=COMBO_ROUTES[id].map(r=>`<p><b>${r[0]}</b><span>${label(r[1])}</span></p>`).join('');}
function refreshLocalControls(pads,initial=false){
 if(initial){LOCAL.controls=pads.length>=2?['pad:'+pads[0].index,'pad:'+pads[1].index]:pads.length?['keyboard','pad:'+pads[0].index]:['keyboard','keyboard'];}
 for(let slot=0;slot<2;slot++){
  const select=$('local-control-'+slot),value=LOCAL.controls[slot];select.replaceChildren(new Option(slot===0?'Teclado 1 / táctil':'Teclado 2','keyboard'));
  for(const pad of pads)select.add(new Option('Mando '+(pad.index+1)+(isPS4(pad)?' · PS4':''),'pad:'+pad.index));
  if(value!=='keyboard'&&!pads.some(p=>'pad:'+p.index===value))select.add(new Option('Mando desconectado',value));select.value=value;renderLocalCard(slot);
 }
}
function openLocal(){LOCAL.controlsManual=false;cancelSpeech();audio.stopMusic();leaveLocal();show('local-screen');for(let slot=0;slot<2;slot++){$('local-character-'+slot).innerHTML=fighters.map((f,i)=>`<option value="${i}">${f[0]}</option>`).join('');$('local-character-'+slot).value=LOCAL.selected[slot];}refreshLocalControls(availablePads(),true);$('local-status').textContent='Teclado compartido, teclado + mando o dos mandos. Elegí controles diferentes para cada jugador.';refreshPadStatus();}
async function startLocalMatch(){
 if(LOCAL.loading)return;
 const pads=availablePads();for(const value of LOCAL.controls)if(value.startsWith('pad:')&&!pads.some(p=>'pad:'+p.index===value)){$('local-status').textContent='Reconectá el mando o elegí teclado para ese jugador.';return;}
 if(LOCAL.controls[0]!=='keyboard'&&LOCAL.controls[0]===LOCAL.controls[1]){$('local-status').textContent='Cada jugador necesita un mando diferente. También podés combinar teclado y mando.';return;}
 LOCAL.loading=true;const token=battleToken;$('local-start').disabled=true;$('local-start').textContent='CARGANDO…';unlockAudio();try{await assetReady;if(mode!=='local-screen'||token!==battleToken)return;LOCAL.bestOf=Number($('local-rounds').value);LOCAL.stage=Number($('local-stage').value);LOCAL.wins=[0,0];LOCAL.round=1;LOCAL.active=true;startLocalRound();}catch(_){$('local-status').textContent='No se pudieron cargar los luchadores. Recargá para reintentar.';}finally{LOCAL.loading=false;$('local-start').disabled=false;$('local-start').textContent='¡A PELEAR! →';}
}
function startLocalRound(){LOCAL.paused=false;LOCAL.reason='';resetHumanInputs();selected=LOCAL.selected[0];queue=[LOCAL.selected[1]];battle=0;score=bestCombo=0;show('game');$('game').classList.add('local-match');$('game').classList.toggle('local-no-touch',LOCAL.controls[0].startsWith('pad:'));newBattle();setStage(LOCAL.stage);$('arena-label').textContent='VS. LOCAL · '+LOCAL.wins[0]+' — '+LOCAL.wins[1];$('round').textContent='RONDA '+LOCAL.round;audio.startMusic();}
function nextLocalRound(){LOCAL.round++;startLocalRound();}
function rematchLocal(){LOCAL.wins=[0,0];LOCAL.round=1;startLocalRound();}
function leaveLocal(){LOCAL.active=false;LOCAL.paused=false;LOCAL.reason='';resetHumanInputs();$('game').classList.remove('local-match','local-no-touch');}
function finishLocalRound(){
 if(ending||!LOCAL.active)return;updateHud();const token=battleToken,winner=player.hp===enemy.hp?-1:player.hp>enemy.hp?0:1;if(winner>=0)LOCAL.wins[winner]++;const complete=LOCAL.wins.some(w=>w>=Math.ceil(LOCAL.bestOf/2));
 const tournament=typeof TOURNAMENT!=='undefined'&&TOURNAMENT.phase==='fight';
 const reveal=()=>{if(token!==battleToken||mode!=='game'||!LOCAL.active)return;if(tournament&&complete)finishTournamentMatch(winner);$('overlayContent').innerHTML=`<h2>${winner<0?'¡EMPATE!':complete?'¡GANA '+(winner+1)+'P!':'RONDA PARA '+(winner+1)+'P'}</h2><p>${winner<0?'Nadie cede. Se juega otra ronda.':fighters[LOCAL.selected[winner]][0]}</p><p class="local-score">${LOCAL.wins[0]} — ${LOCAL.wins[1]}</p><p>Primero en ${Math.ceil(LOCAL.bestOf/2)} victorias</p>`;$('overlayButtons').innerHTML=complete?(tournament?'<button class="btn primary" onclick="showTournamentBracket()">VER LLAVE →</button>':'<button class="btn primary" onclick="rematchLocal()">REVANCHA</button>'):'<button class="btn primary" onclick="nextLocalRound()">SIGUIENTE RONDA →</button>';if(!tournament)$('overlayButtons').innerHTML+='<button class="btn secondary" onclick="openLocal()">CAMBIAR LUCHADORES</button>';
 $('overlayButtons').innerHTML+='<button class="btn back" onclick="goMenu()">MENÚ</button>';
 $('overlay').classList.remove('hidden');if(tournament)$('overlayButtons').querySelector('.primary').focus();};
 startRoundEnd(winner<0?2:winner,reveal);
}
function pauseLocal(reason='Pausa'){if(!LOCAL.active||LOCAL.paused||ending||mode!=='game')return;LOCAL.paused=true;LOCAL.reason=reason;clearKeys();$('overlayContent').innerHTML='<h2>PAUSA</h2><p id="local-pause-reason"></p>';$('local-pause-reason').textContent=reason;$('overlayButtons').innerHTML='<button class="btn primary" onclick="resumeLocal()">CONTINUAR</button><button class="btn back" onclick="goMenu()">MENÚ</button>';$('overlay').classList.remove('hidden');}
function resumeLocal(){if(!LOCAL.active||!LOCAL.paused)return;const pads=availablePads();if(LOCAL.controls.some(value=>value.startsWith('pad:')&&!pads.some(p=>'pad:'+p.index===value))){$('local-pause-reason').textContent='Reconectá el mando antes de continuar.';return;}clearKeys();LOCAL.paused=false;last=0;$('overlay').classList.add('hidden');}
function toggleLocalPause(){if(LOCAL.paused)resumeLocal();else pauseLocal();}
window.addEventListener('blur',()=>pauseLocal('La pestaña perdió el foco. Continuá cuando estén listos.'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseLocal('El combate quedó pausado al salir de la pestaña.');});
