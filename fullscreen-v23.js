(function(){
 'use strict';
 const root=document.documentElement,button=document.getElementById('fullscreen-toggle'),message=document.getElementById('fullscreen-message');
 const mobile=()=>matchMedia('(pointer:coarse)').matches;
 const installed=()=>matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches||navigator.standalone===true;
 const active=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
 let pending=false,timer;
 function note(text){message.textContent=text;message.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{message.hidden=true},6500);}
 function refresh(){const on=active();button.hidden=installed()&&!on;button.textContent=on?'⊡':'⛶';button.setAttribute('aria-label',on?'Salir de pantalla completa':'Pantalla completa');button.setAttribute('aria-pressed',String(on));button.title=on?'Salir de pantalla completa':'Pantalla completa';}
 function enter(explicit=false){
  if(pending||active()||installed())return;
  const request=root.requestFullscreen||root.webkitRequestFullscreen;
  if(!request){if(explicit)note('Para abrir sin barras: usá «Añadir a pantalla de inicio» en el menú del navegador y abrí el juego desde ese icono.');return;}
  pending=true;
  let result;
  try{result=request.call(root,{navigationUI:'hide'});}catch(_){pending=false;if(explicit)note('Abrí «Pantalla completa» desde el menú de tu navegador.');return;}
  Promise.resolve(result).then(()=>{
   if(mobile()&&active()&&screen.orientation?.lock)screen.orientation.lock('landscape').catch(()=>{});
  }).catch(()=>{if(explicit)note('El navegador no permitió pantalla completa. Podés usar su menú o añadir el juego a la pantalla de inicio.');}).finally(()=>{pending=false;refresh();});
 }
 button.addEventListener('click',()=>{
  if(active()){const exit=document.exitFullscreen||document.webkitExitFullscreen;try{Promise.resolve(exit.call(document)).catch(()=>{});}catch(_){}return;}
  enter(true);
 });
 // Use the deliberate menu/start tap; never retry on every combat button.
 document.addEventListener('click',e=>{if(mobile()&&e.target.closest('#menu .menu-actions button,#start'))enter();},{capture:true});
 for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,refresh);
 window.addEventListener('pageshow',refresh);refresh();
})();
