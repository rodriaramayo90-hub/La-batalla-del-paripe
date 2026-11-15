/* Arena de práctica: controles separados para especial normal y súper EX.
   Sin cambios en campaña, VS local ni online. */
(function(){
'use strict';
const area=document.querySelector('#game .control-group.attacks');
if(!area)return;
const superButton=document.createElement('button');
superButton.type='button';
superButton.id='practice-super-action';
superButton.className='ctl practice-only practice-super-ctl';
superButton.setAttribute('aria-label','Súper EX de práctica: U o R2 más círculo en PS4');
superButton.title='Solo en práctica · U · PS4 R2 + ○';
superButton.innerHTML='<span>⚡</span><small>SÚPER EX</small>';
area.appendChild(superButton);
const help=document.createElement('span');
help.id='practice-special-help';help.className='practice-only';
help.textContent='PRÁCTICA: ○ / L / ESPACIO = especial normal · U o R2 + ○ = Súper EX';
document.querySelector('#game .game-note')?.appendChild(help);
const css=document.createElement('style');
css.textContent=[
'#game .control-group.attacks{position:relative}',
'#game .practice-super-ctl{position:absolute;right:0;bottom:calc(100% + 9px);z-index:18;',
'width:clamp(58px,5.8vw,98px);height:clamp(50px,5.8vw,98px);border-radius:50%;',
'border:2px solid #ffd36f;background:linear-gradient(150deg,#52227d,#b32e8c);',
'box-shadow:0 0 14px #bd55fd88,inset 0 0 12px #ffffff20;touch-action:manipulation;',
'color:#fff1b9;align-items:center;justify-content:center;flex-direction:column;gap:2px}',
'#game.practice .practice-super-ctl{display:flex}',
'#game .practice-super-ctl span{font-size:clamp(19px,2.6vw,35px);line-height:1}',
'#game .practice-super-ctl small{font-size:clamp(8px,.75vw,13px);font-weight:900}',
'#game .practice-super-ctl[disabled]{filter:grayscale(.65);opacity:.45;box-shadow:none}',
'#game.practice .game-note{gap:6px}',
'#practice-special-help{color:#ffdf94;font-weight:800;font-size:clamp(10px,.85vw,17px)}',
'@media (orientation:landscape) and (max-height:550px){',
'#game .practice-super-ctl{right:0;bottom:calc(100% + 6px);',
'width:clamp(43px,11vh,66px);height:clamp(43px,11vh,66px);border-width:2px}',
'#game .practice-super-ctl span{font-size:clamp(17px,5vh,25px)}',
'#game .practice-super-ctl small{font-size:clamp(6px,1.4vh,8px)}',
'#practice-special-help{display:none!important}',
'}'
].join('\n');
document.head.appendChild(css);
const originalStrike=strike,originalHud=updateHud,originalUpdate=update;
let requestingSuper=false;
const supported=id=>id===0||id===1||id===6;
const inTraining=()=>mode==='game'&&practice&&!LOCAL.active&&!(typeof ONLINE!=='undefined'&&ONLINE.active);
const cinematicActive=()=>!!(window.TREX_SUP?.active||window.DRAPIE_SUPER?.active||window.ALCA_SUPER?.active);
const isReady=()=>inTraining()&&player&&supported(player.id)&&!ending&&!introFrames
  &&!cinematicActive()&&player.hp>0&&player.attack<=0&&player.cool<=0
  &&player.stun<=0&&player.blockstun<=0&&!player.blocking&&!player.grabbed
  &&!player.grabbing&&player.escaping<=0&&player.y===0&&!player.legGone
  &&!LOCAL.paused&&!PAD.soloPause;
strike=function(a,b,type,power,low){
 if(!(inTraining()&&type==='special'&&!requestingSuper))return originalStrike.apply(this,arguments);
 // El modo práctica, que antes daba súper automáticamente, se desactiva solo
 // durante esta llamada para ejecutar el especial original de cada personaje.
 const priorPractice=practice,priorMeter=a?.meter;
 practice=false;if(a)a.meter=0;
 try{
  const success=originalStrike.call(this,a,b,type,power,low);
  if(success&&a){a.ex=false;a.cool=a.attackLength;}
  return success;
 }finally{if(a)a.meter=priorMeter;practice=priorPractice;}
};
function fireSuper(){
 if(!isReady())return false;
 unlockAudio();requestingSuper=true;
 try{
  const success=strike(player,enemy,'special',false,false);
  if(success){haptic(24);refreshPracticeUI();}
  return !!success;
 }finally{requestingSuper=false;}
}
window.practiceSuperEX=fireSuper;
superButton.addEventListener('click',event=>{event.preventDefault();fireSuper();});
window.addEventListener('keydown',event=>{
 if(event.code!=='KeyU'||!inTraining()||event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
 const active=document.activeElement;
 if(active&&/INPUT|TEXTAREA|SELECT/.test(active.tagName))return;
 event.preventDefault();event.stopImmediatePropagation();fireSuper();
},true);
const originalHumanInput=humanInput;
humanInput=function(slot,key,pressed,source){
 if(inTraining()&&slot===0&&key==='special'&&pressed&&typeof source==='string'){
  const match=/^pad-(\d+)-special$/.exec(source);
  if(match){
   const pad=navigator.getGamepads?.()[Number(match[1])],trigger=pad?.buttons?.[7];
   if(trigger&&(trigger.pressed||trigger.value>.5)){fireSuper();return;}
  }
 }
 return originalHumanInput.apply(this,arguments);
};
function refreshPracticeUI(){
 const active=inTraining(),available=active&&supported(player?.id);
 superButton.disabled=!isReady();
 superButton.title=!available?'Súper EX: disponible con Alcahueta, T-Rex y La Drapie':'Súper EX · U · PS4 R2 + ○';
 if(!active)return;
 const normal=document.querySelector('#game [data-key="special"]');
 if(normal){
  normal.classList.remove('trex-super-ready','drapie-super-ready','alca-super-ready');
  const small=normal.querySelector('small');
  if(small)small.textContent='ESPECIAL';
  normal.setAttribute('aria-label','Especial normal');
  normal.style.opacity=player?.cool>0?'.55':'1';
 }
 const info=document.getElementById('cool');
 if(info)info.textContent=cinematicActive()?'SÚPER EX EN CURSO'
  :player?.attack>0?'Ataque en curso'
  :available?'○ / L: especial normal · U / R2+○: Súper EX'
  :'○ / L: especial normal · Súper EX aún no disponible';
}
updateHud=function(){
 const result=originalHud.apply(this,arguments);
 refreshPracticeUI();return result;
};
update=function(dt){
 const result=originalUpdate.apply(this,arguments);
 // Durante la cinemática el reloj del combate está suspendido. Al acabar,
 // liberar la recarga para poder repetir ambos movimientos al instante.
 if(inTraining()&&player&&player.attack<=0&&!cinematicActive()&&player.cool>0)player.cool=0;
 refreshPracticeUI();
 return result;
};
refreshPracticeUI();
})();