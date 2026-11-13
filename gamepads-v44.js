/* Standard Gamepad mapping, including DualShock 4 over USB or Bluetooth. */
const PAD={seen:new Set(),previous:new Map(),menuRepeat:new Map(),signature:'',soloPause:false,lastMode:'',lastEnding:false,menuLock:0,raf:0};
function isPS4(p){return /054c|dualshock|wireless controller|playstation|sony/i.test(p.id||'');}
function availablePads(){try{return Array.from(navigator.getGamepads?.()||[]).filter(p=>p&&p.connected!==false&&(p.mapping==='standard'||isPS4(p)&&p.buttons.length>=16));}catch(_){return [];}}
function padButton(p,n){const b=p.buttons[n];return !!(b&&(b.pressed||b.value>.5));}
function padState(p){const x=Number(p.axes[0]||0),y=Number(p.axes[1]||0);return{left:padButton(p,14)||x<-.35,right:padButton(p,15)||x>.35,down:padButton(p,13)||y>.45,up:padButton(p,12)||y<-.55,jump:padButton(p,0)||padButton(p,12)||y<-.55,punch:padButton(p,2),kick:padButton(p,3),special:padButton(p,1),defend:padButton(p,4)||padButton(p,6),grab:padButton(p,5),confirm:padButton(p,0),back:padButton(p,1),options:padButton(p,9)};}
function padSlot(p,pads){if(LOCAL.active||mode==='local-screen')return LOCAL.controls.findIndex(value=>value==='pad:'+p.index);return pads[0]?.index===p.index?0:-1;}
function refreshPadStatus(){const pads=availablePads(),text=!navigator.getGamepads?'Este navegador no admite mandos. Probá con Chrome actualizado.':pads.length?'🎮 '+pads.length+' mando'+(pads.length>1?'s':'')+' conectado'+(pads.length>1?'s':'')+' · □ piña · △ patada · ○ especial':'🎮 Mando PS4: conectalo por USB o Bluetooth y pulsá un botón.';for(const id of['menu-pad-status','local-pad-status'])$(id).textContent=text;}
function releasePad(index){const source='pad-'+index;for(let slot=0;slot<2;slot++)for(const key of['left','right','down','jump','defend','punch','kick']){
 const map=HUMAN_SOURCES[slot],sources=map.get(key);if(sources){sources.delete(source);sources.delete(source+'-'+key);const state=slot===0?keys:SECOND.keys;state[key]=sources.size>0;}
 if(slot===0){chargeInputs.delete(source+'-'+key);}else SECOND.charges.delete(source+'-'+key);
 }syncChargeButtons();}
function menuItems(){const root=mode==='game'?$('overlay'):$(mode);return root?Array.from(root.querySelectorAll('button,input,select')).filter(el=>!el.disabled&&el.getClientRects().length):[];}
function focusMenu(delta){const list=menuItems();if(!list.length)return;const old=list.indexOf(document.activeElement),next=(old<0?(delta>0?0:list.length-1):(old+delta+list.length)%list.length);list[next].focus();list[next].scrollIntoView({block:'nearest'});}
function confirmMenu(){const list=menuItems(),el=list.includes(document.activeElement)?document.activeElement:list.find(e=>e.matches('.primary'))||list[0];if(el?.tagName==='BUTTON')el.click();else el?.focus();}
function menuPulse(index,key,on,now){const id=index+':'+key;if(!on){PAD.menuRepeat.delete(id);return false;}const previous=PAD.menuRepeat.get(id);if(previous===undefined||now-previous>240){PAD.menuRepeat.set(id,now);return true;}return false;}
function navigatePad(p,now,s,old){
 if(mode==='game'&&ROUND_END.active&&ROUND_END.phase!=='result')return;
 if(now<PAD.menuLock)return;
 if(mode==='tournament-screen'&&TOURNAMENT.phase==='roster'&&s.back&&!old.back){closeTournamentRoster();return;}
 if(mode==='tournament-screen'&&TOURNAMENT.phase==='sides'){tournamentPadInput(p,s,old);return;}
 const pressed=k=>s[k]&&!old[k];
 if(mode==='local-screen'){
  const role=padSlot(p,availablePads());if(role>=0){if(menuPulse(p.index,'left',s.left,now)||menuPulse(p.index,'right',s.right,now)){localCharacter(role,(LOCAL.selected[role]+(s.left?-1:1)+fighters.length)%fighters.length);$('local-character-'+role).value=LOCAL.selected[role];}}
  if(pressed('confirm')||pressed('options'))startLocalMatch();if(pressed('back'))goMenu();return;
 }
 if(mode==='select'){
  let delta=0;if(menuPulse(p.index,'left',s.left,now))delta=-1;else if(menuPulse(p.index,'right',s.right,now))delta=1;else if(menuPulse(p.index,'up',s.up,now))delta=-4;else if(menuPulse(p.index,'down',s.down,now))delta=4;
  if(delta){choose((selected+delta+fighters.length)%fighters.length);document.querySelector('.fighter.selected')?.scrollIntoView({block:'nearest'});}
  if(pressed('confirm')||pressed('options'))startCampaign();if(pressed('back'))goMenu();return;
 }
 if(mode==='tower'){if(pressed('confirm')||pressed('options'))enterTowerFight();if(pressed('back'))goMenu();return;}
 if(pressed('back')){if(mode==='game'&&PAD.soloPause)resumeSoloPause();else if(mode==='game'&&LOCAL.paused)resumeLocal();else if(mode==='online-screen')onlineLeave();else if(mode!=='menu')goMenu();return;}
 const el=document.activeElement;if(el?.tagName==='SELECT'&&menuItems().includes(el)){
  const delta=menuPulse(p.index,'left',s.left,now)?-1:menuPulse(p.index,'right',s.right,now)?1:0;
  if(delta){el.selectedIndex=(el.selectedIndex+delta+el.options.length)%el.options.length;el.dispatchEvent(new Event('change',{bubbles:true}));}
 }
 if(menuPulse(p.index,'down',s.down,now)||menuPulse(p.index,'right',s.right,now)&&el?.tagName!=='SELECT')focusMenu(1);
 if(menuPulse(p.index,'up',s.up,now)||menuPulse(p.index,'left',s.left,now)&&el?.tagName!=='SELECT')focusMenu(-1);
 if(pressed('confirm')||pressed('options'))confirmMenu();
}
function pollGamepads(now){
 const pads=availablePads(),signature=pads.map(p=>p.index+':'+p.id).join('|');
 if(signature!==PAD.signature){
  const previous=Array.from(PAD.previous.keys());for(const index of previous)if(!pads.some(p=>p.index===index)){releasePad(index);PAD.previous.delete(index);PAD.seen.delete(index);if(mode==='game'&&!LOCAL.active&&!(typeof ONLINE!=='undefined'&&ONLINE.active))pauseSoloGame('Mando desconectado. Reconectalo o seguí con el teclado.');if(LOCAL.active&&LOCAL.controls.includes('pad:'+index))pauseLocal('Se desconectó el mando '+(index+1)+'. Reconectalo para continuar.');}
  PAD.signature=signature;refreshPadStatus();if(typeof syncTournamentPads==='function')syncTournamentPads(pads);if(mode==='local-screen')refreshLocalControls(pads,!LOCAL.controlsManual&&LOCAL.controls.every(v=>v==='keyboard'));
 }
 if(mode!==PAD.lastMode||ending!==PAD.lastEnding){PAD.menuLock=now+260;PAD.lastMode=mode;PAD.lastEnding=ending;PAD.menuRepeat.clear();}
 for(const p of pads){
  const s=padState(p),old=PAD.previous.get(p.index)||{},slot=padSlot(p,pads);
  if(!PAD.seen.has(p.index)){PAD.seen.add(p.index);PAD.previous.set(p.index,s);continue;}
  if(Object.keys(s).some(k=>s[k]&&!old[k]))unlockAudio();
  if(mode==='game'&&!ending&&!LOCAL.paused&&!PAD.soloPause){
   if(s.options&&!old.options&&!(typeof ONLINE!=='undefined'&&ONLINE.active)){if(LOCAL.active)toggleLocalPause();else toggleSoloPause();}
   else if(slot>=0){
    const source='pad-'+p.index;for(const key of['left','right','down','defend'])humanInput(slot,key,s[key],source);
    for(const key of['jump','punch','kick','special','grab'])if(s[key]!==!!old[key])humanInput(slot,key,s[key],source+'-'+key);
   }
  }else navigatePad(p,now,s,old);
  PAD.previous.set(p.index,s);
 }
 PAD.raf=requestAnimationFrame(pollGamepads);
}
window.addEventListener('gamepadconnected',()=>refreshPadStatus());
window.addEventListener('gamepaddisconnected',e=>{releasePad(e.gamepad.index);if(LOCAL.active&&LOCAL.controls.includes('pad:'+e.gamepad.index))pauseLocal('Se desconectó un mando. Reconectalo para continuar.');refreshPadStatus();});
refreshPadStatus();PAD.raf=requestAnimationFrame(pollGamepads);

function pauseSoloGame(reason='Pausa'){if(mode!=='game'||ending||LOCAL.active||ONLINE.active||PAD.soloPause)return;PAD.soloPause=true;clearKeys();$('overlayContent').innerHTML='<h2>PAUSA</h2><p id="solo-pause-reason"></p>';$('solo-pause-reason').textContent=reason;$('overlayButtons').innerHTML='<button class="btn primary" onclick="resumeSoloPause()">CONTINUAR</button><button class="btn back" onclick="goMenu()">MENÚ</button>';$('overlay').classList.remove('hidden');}
function resumeSoloPause(){if(!PAD.soloPause)return;clearKeys();PAD.soloPause=false;last=0;$('overlay').classList.add('hidden');}
function toggleSoloPause(){if(PAD.soloPause)resumeSoloPause();else pauseSoloGame();}
window.addEventListener('blur',()=>{if(availablePads().length)pauseSoloGame('La pestaña perdió el foco.');});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&availablePads().length)pauseSoloGame('El juego quedó pausado al salir de la pestaña.');});
