/* Private friend rooms. The room host simulates the match; the guest sends inputs. */
const ONLINE={active:false,role:null,ws:null,room:null,remote:{keys:{},actions:[]},lastInput:0,lastFrame:0,round:0,events:[],service:'',connected:false,result:null,resultWaiting:false};
function onlineSend(m){if(ONLINE.ws?.readyState===WebSocket.OPEN)ONLINE.ws.send(JSON.stringify(m));}
function onlineStatus(text){$('online-status').textContent=text;}
function openOnline(){cancelSpeech();audio.stopMusic();show('online-screen');$('online-character').innerHTML=fighters.map((f,i)=>`<option value="${i}">${f[0]}</option>`).join('');const invite=new URL(location.href);$('online-code').value=invite.searchParams.get('room')||'';onlineStatus('Creá una sala o pegá el código que te mandó tu amigo.');}
async function onlineConnect(join){
 if(ONLINE.ws){onlineStatus('Ya estás en una sala. Salí antes de abrir otra.');return;}
 const service=window.PARIPE_ONLINE_URL; if(!service){onlineStatus('El servidor online todavía no está conectado. El modo individual sigue disponible.');return;}
 ONLINE.service=service.replace(/\/$/,'');$('online-create').disabled=$('online-join').disabled=true;
 try{let code=$('online-code').value.trim().toUpperCase();if(join&&!/^[A-Z0-9]{10}$/.test(code))throw Error('Pegá el código de diez caracteres.');const response=await fetch(ONLINE.service+(join?'/rooms/'+code+'/join':'/rooms'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({bestOf:Number($('online-rounds').value)})});if(!(response.headers.get('content-type')||'').includes('application/json'))throw Error('El Worker todavía no tiene el código de salas. Falta desplegar online-server.');const ticket=await response.json();if(!response.ok)throw Error(ticket.error||'No se pudo abrir la sala');ONLINE.role=ticket.role;ONLINE.room=ticket.code;ONLINE.ws=new WebSocket(ONLINE.service.replace(/^http/,'ws')+'/rooms/'+ticket.code+'/ws?token='+ticket.token);ONLINE.ws.onmessage=e=>onlineMessage(JSON.parse(e.data));ONLINE.ws.onclose=()=>onlineDisconnected('Se perdió la conexión. Creá otra sala para volver a jugar.');ONLINE.ws.onerror=()=>onlineStatus('No se pudo conectar con el servidor.');$('online-link').value=location.origin+location.pathname+'?v=51&room='+ticket.code;onlineStatus('Conectando…');}
 catch(e){onlineStatus(e.message);$('online-create').disabled=$('online-join').disabled=false;}
}
function onlineLeave(){ONLINE.result=null;ONLINE.resultWaiting=false;ONLINE.active=false;ONLINE.connected=false;ONLINE.ws?.close();ONLINE.ws=null;ONLINE.room=null;cancelAnimationFrame(animationId);clearKeys();audio.stopMusic();$('online-ready').disabled=true;$('online-create').disabled=$('online-join').disabled=false;show('menu');}
function onlineDisconnected(text){ONLINE.result=null;ONLINE.resultWaiting=false;ONLINE.active=false;ONLINE.connected=false;clearKeys();audio.stopMusic();show('online-screen');onlineStatus(text);$('online-ready').disabled=true;}
function onlineLobby(room){ONLINE.data=room;const me=room.players.find(p=>p.role===ONLINE.role);$('online-character').value=me?.character||0;$('online-rounds').value=room.bestOf;$('online-rounds').disabled=ONLINE.role!==0||room.phase!=='lobby';$('online-ready').disabled=!!me?.ready||room.players.length<2||room.phase==='disconnected';$('online-score').textContent=`${room.wins[0]} — ${room.wins[1]} · Al mejor de ${room.bestOf}`;onlineStatus(room.players.length<2?'Sala '+room.code+' · Esperando a tu amigo…':me?.ready?'Esperando la confirmación de tu amigo…':'Ambos conectados. Elegí personaje y tocá «Listo».');if(ONLINE.result&&mode==='game'&&!ONLINE.active)onlineShowResult();}
function onlineMessage(m){
 if(m.type==='lobby'){ONLINE.connected=true;onlineLobby(m.room);}
 if(m.type==='disconnected')onlineDisconnected('Tu amigo salió de la sala. Creá otra para volver a jugar.');
 if(m.type==='input'&&ONLINE.role===0){ONLINE.lastInput=performance.now();const i=m.input||{};const jumpPending=ONLINE.remote.keys.jump;ONLINE.remote.keys=Object.fromEntries(['left','right','jump','down','defend'].map(k=>[k,!!i.keys?.[k]]));ONLINE.remote.keys.jump=jumpPending||!!i.keys?.jump;if(i.keys?.jump&&i.keys?.defend)ONLINE.remote.escapeTap=true;for(const action of (Array.isArray(i.actions)?i.actions:[]).slice(0,6))if(['punch','kick','special','grab'].includes(action.type))ONLINE.remote.actions.push({...action,ttl:48});ONLINE.remote.actions=ONLINE.remote.actions.slice(-6);}
 if(m.type==='start')onlineStart(m.room);
 if(m.type==='frame'&&ONLINE.role===1&&ONLINE.active&&m.round===ONLINE.round){onlineApply(m.state);ONLINE.lastFrame=performance.now();}
 if(m.type==='result'){
  ONLINE.active=false;ending=true;clearKeys();audio.stopMusic();ONLINE.result=m;ONLINE.resultWaiting=false;onlineLobby(m.room);
  $('online-ready').textContent=m.room.phase==='matchEnd'?'REVANCHA':'SIGUIENTE RONDA';
 }
}
function onlineStart(room){ONLINE.result=null;ONLINE.resultWaiting=false;ONLINE.data=room;ONLINE.round=room.round;ONLINE.active=true;ONLINE.remote={keys:{},actions:[]};ONLINE.jumpTap=null;ONLINE.lastInput=ONLINE.lastFrame=performance.now();selected=room.players.find(p=>p.role===ONLINE.role).character;queue=[room.players.find(p=>p.role!==ONLINE.role).character];battle=0;show('game');newBattle();$('arena-label').textContent='Contra un amigo · '+room.wins.join(' — ');$('round').textContent='RONDA '+room.round;}
function onlineFinish(win){
 if(ending)return;const winner=player.hp===enemy.hp?2:win?0:1;
 startRoundEnd(winner,()=>{onlinePublish();onlineSend({type:'result',round:ONLINE.round,winner});});onlinePublish();
}
function onlineShowResult(){
 const m=ONLINE.result,room=ONLINE.data;if(!m||mode!=='game')return;
 const me=room.players.find(p=>p.role===ONLINE.role),waiting=ONLINE.resultWaiting||!!me?.ready,complete=room.phase==='matchEnd',won=m.winner===ONLINE.role;
 const label=m.winner===2?'¡EMPATE!':won?'¡VICTORIA!':'RONDA PARA TU AMIGO';
 $('overlayContent').innerHTML=`<h2>${label}</h2><p>${m.winner===2?'Se juega otra ronda.':fighters[room.players.find(p=>p.role===m.winner)?.character??0][0]+' gana la ronda'}</p><p class="local-score">${room.wins[ONLINE.role]} — ${room.wins[1-ONLINE.role]}</p><p>${waiting?'Esperando a tu amigo…':complete?'Partida terminada. ¿Una revancha?':'Listos para la siguiente ronda.'}</p>`;
 $('overlayButtons').innerHTML=`<button class="btn primary" onclick="onlineReadyFromResult()" ${waiting?'disabled':''}>${waiting?'ESPERANDO A TU AMIGO…':complete?'REVANCHA':'SIGUIENTE RONDA →'}</button><button class="btn secondary" onclick="onlineReturnToRoom()">VER SALA</button><button class="btn back" onclick="onlineLeave()">SALIR</button>`;
 $('overlay').classList.remove('hidden');
}
async function onlineReadyFromResult(){
 if(!ONLINE.result||ONLINE.resultWaiting)return;unlockAudio();ONLINE.resultWaiting=true;onlineShowResult();
 try{await assetReady;onlineSend({type:'ready'});}catch(_){ONLINE.resultWaiting=false;onlineShowResult();}
}
function onlineReturnToRoom(){if(!ONLINE.result)return;show('online-screen');audio.stopMusic();onlineLobby(ONLINE.data);}

function onlineRemoteStep(dt){
 const a=enemy,b=player,i=ONLINE.remote;if(performance.now()-ONLINE.lastInput>800){i.keys={};i.actions=[];}
 i.actions.forEach(x=>x.ttl-=dt);i.actions=i.actions.filter(x=>x.ttl>0);
 if(i.escapeTap||i.keys.defend&&i.keys.jump){escapeUnit(a,b);i.escapeTap=false;i.keys.jump=false;}
 posture(a,i.keys.down);if(i.actions[0]?.type==='grab')consumeInput(a,b,i.actions);
 a.blocking=(i.keys.defend||a.blockstun>0)&&a.stun<=0&&!a.attack&&!a.escaping&&a.y===0;
 if(a.stun<=0&&a.blockstun<=0&&!a.escaping&&!a.blocking){
  if(!a.attack){const move=movementDirection(a,Number(!!i.keys.right)-Number(!!i.keys.left));a.x+=move*(a.crouching?.25:1)*(a.legGone?1.8:2.3+fighters[a.id][4]*.35)*movementMultiplier(a)*dt;a.moving=!!move;if(i.keys.jump&&a.y===0){a.vy=13;i.keys.jump=false;}}
  consumeInput(a,b,i.actions);
 }
}
function onlinePublish(){if(ONLINE.role!==0||!ONLINE.active)return;const pack=a=>({...a,castHits:[...a.castHits]});onlineSend({type:'frame',round:ONLINE.round,state:{p:pack(player),e:pack(enemy),projectiles:projectiles.map(p=>({...p,owner:p.owner===player?0:1})),effects,frame,matchFrames,introFrames,ending,announcement,announceTime,roundEnd:packRoundEnd(),events:ONLINE.events.splice(0)}});}
function onlineApply(s){
 const unpack=a=>({...a,castHits:new Set(a.castHits)});enemy=unpack(s.p);player=unpack(s.e);projectiles=s.projectiles.map(p=>({...p,owner:p.owner===0?enemy:player}));effects=s.effects;frame=s.frame;matchFrames=s.matchFrames;introFrames=s.introFrames;ending=s.ending;announcement=s.announcement;announceTime=s.announceTime;applyRoundEnd(s.roundEnd);trails=[];for(const e of s.events||[]){if(e.voice!==undefined)audio.playVoice(e.voice);else audio.cue(e.type,e.opts);}updateHud();}
function onlineTick(t){
 if(!ONLINE.active)return false;
 if(ONLINE.role===1){const dt=last?Math.min((t-last)/16.67,2):1;last=t;updateCharge(dt);if(t-(ONLINE.sentAt||0)>33){const actions=inputQueue.splice(0);clearActionBuffer();const input={keys:{...keys},actions};if(ONLINE.jumpTap){input.keys.jump=true;if(ONLINE.jumpTap.escape)input.keys.defend=true;}ONLINE.jumpTap=null;if(syncPortraitMode())input.keys={};onlineSend({type:'input',input});keys.jump=false;ONLINE.sentAt=t;}if(performance.now()-ONLINE.lastFrame>5000){onlineDisconnected('La conexión se interrumpió. Volvé a crear una sala.');return true;}draw();animationId=requestAnimationFrame(loop);return true;}
 if(t-(ONLINE.sentAt||0)>50){onlinePublish();ONLINE.sentAt=t;}return false;
}
document.addEventListener('DOMContentLoaded',()=>{if(new URL(location.href).searchParams.has('room'))openOnline();});

async function onlineReady(){unlockAudio();$('online-ready').disabled=true;try{await assetReady;onlineSend({type:'ready'});}catch(_){onlineStatus('No se pudieron cargar los personajes. Recargá la página.');}}
