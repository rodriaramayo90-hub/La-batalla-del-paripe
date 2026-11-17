/* Dra. En Berga — BOCINAZO FEROZ. Cinematic car, Dr. Tostador drives while Berga crosses over to honk, road rage and run-over. */
(function(){'use strict';
const S={active:false,t:0,length:320,speed:.72,a:null,b:null,hit:false,horn:0,spoke:false,utterance:null};
window.BERGA_SUPER=S;
const previousStrike=strike,previousUpdate=update,previousDraw=draw,previousHud=updateHud,previousReset=resetArcade;
function reset(){S.active=false;S.t=0;S.a=null;S.b=null;S.hit=false;S.horn=0;S.spoke=false;S.utterance=null;}
resetArcade=function(){reset();return previousReset.apply(this,arguments)};
function allowed(a,type){return type==='special'&&a?.id===5&&a.hp>0&&a.y===0&&a.attack<=0&&a.cool<=0&&a.stun<=0&&a.blockstun<=0&&!a.blocking&&!a.grabbed&&!a.grabbing&&a.escaping<=0&&(practice||a.meter>=100)&&introFrames<=0&&!ending&&!window.TREX_SUP?.active&&!window.DRAPIE_SUPER?.active&&!window.ALCA_SUPER?.active&&!S.active&&!(typeof ONLINE!=='undefined'&&ONLINE.active)}
strike=function(a,b,type,power,low){if(!allowed(a,type))return previousStrike.apply(this,arguments);
 S.active=true;S.t=0;S.a=a;S.b=b||null;S.hit=false;S.horn=0;S.spoke=false;window.SUPER_DEFENSE?.start('berga',a,b);
 a.meter=0;a.attackType='berga-super';a.attackLength=S.length;a.attack=S.length;a.ex=true;a.finisher=false;a.cool=practice?S.length:420;a.vy=0;a.y=0;a.blocking=false;a.crouching=false;a.moving=false;a.hit=false;a.connected=false;a.cast=++castSerial;a.shots=0;a.invuln=S.length+10;
 if(b)b.moving=false;clearActionBuffer();cancelCharges();if(typeof SECOND!=='undefined'){SECOND.actions=[];cancelSecondCharges();}
 announcement='¡BOCINAZO FEROZ!';announceTime=0;exFlash=20;haptic(55);previousHud();return true;
};
function text(s,x,y,size,color='#fff'){ctx.save();ctx.font='italic 900 '+size+'px system-ui';ctx.textAlign='center';ctx.lineWidth=7;ctx.strokeStyle='#170b2c';ctx.strokeText(s,x,y);ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.restore()}
function person(id,x,y,size){const m=atlasMap[id];ctx.save();ctx.translate(x,y);SpriteAtlas.draw(ctx,atlases[m[0]],m[1],0,0,0,size);ctx.restore()}
// Layered original illustrated SVG sprites, pre-rendered once to images for mobile performance.
const illustration={};
function svgImage(key,markup){const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(markup);illustration[key]=img;}
function initializeArt(){
const facade=(x,w,h,n,base)=>`<g transform="translate(${x} ${400-h})"><rect width="${w}" height="${h}" fill="${base}" stroke="#161c35" stroke-width="4"/><path d="M0 18H${w} M0 43H${w} M0 ${h-25}H${w}" stroke="#f2ba8d" stroke-opacity=".55" stroke-width="5"/>${Array.from({length:n*3},(_,i)=>{let col=i%n,row=Math.floor(i/n),xx=12+col*(w-18)/n,yy=55+row*(h-85)/3;return `<g><rect x="${xx}" y="${yy}" width="${Math.max(15,(w-32)/n-9)}" height="43" fill="#172541" stroke="#d8a28c" stroke-width="4"/><rect x="${xx+3}" y="${yy+3}" width="${Math.max(9,(w-32)/n-15)}" height="34" fill="${i%4===0?'#f6d28a':'#5a7894'}"/><path d="M${xx+12} ${yy}v43" stroke="#e8bc9e" stroke-width="2"/></g>`}).join('')}<path d="M-5 0H${w+5}L${w} -20H0Z" fill="#242c4b"/></g>`;
const buildings=Array.from({length:12},(_,i)=>facade(i*101-20,102,220+(i%4)*29,3,['#56506b','#776078','#75647a','#525c78'][i%4])).join('');
const backdrop=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#151d46"/><stop offset=".55" stop-color="#5c3767"/><stop offset="1" stop-color="#e6a56e"/></linearGradient><linearGradient id="street" x2="0" y2="1"><stop stop-color="#343d53"/><stop offset="1" stop-color="#151d33"/></linearGradient></defs><rect width="960" height="540" fill="url(#sky)"/><circle cx="822" cy="109" r="45" fill="#f9d2a1" opacity=".22"/>${buildings}<path d="M0 400H960V540H0Z" fill="url(#street)"/><path d="M0 404H960M0 428H960" stroke="#c39c83" stroke-width="5"/><path d="M0 489H960" stroke="#f6da8b" stroke-width="7" stroke-dasharray="90 80"/>${Array.from({length:12},(_,i)=>`<g transform="translate(${i*91+20} 390)"><path d="M0 0V-108" stroke="#172139" stroke-width="6"/><ellipse cy="-111" rx="16" ry="21" fill="#ffdb8a" opacity=".28"/><path d="M-10 -108Q0 -132 10 -108Z" fill="#fff0ad"/></g>`).join('')}<g opacity=".28" stroke="#ffe3a3" stroke-width="2"><path d="M0 510L960 455M0 540L960 470"/></g></svg>`;
svgImage('street',backdrop);
const car=`<svg xmlns="http://www.w3.org/2000/svg" width="670" height="330" viewBox="0 0 670 330"><defs><linearGradient id="paint" x2=".12" y2="1"><stop stop-color="#ff8c80"/><stop offset=".38" stop-color="#ce253d"/><stop offset="1" stop-color="#681c31"/></linearGradient><linearGradient id="glass" x2="0" y2="1"><stop stop-color="#c7ecf5"/><stop offset="1" stop-color="#344c70"/></linearGradient><radialGradient id="wheel"><stop stop-color="#c6c7cc"/><stop offset=".43" stop-color="#59657b"/><stop offset=".48" stop-color="#1a1c2b"/><stop offset="1" stop-color="#11121e"/></radialGradient></defs><ellipse cx="326" cy="298" rx="298" ry="21" fill="#12172b" opacity=".6"/><path d="M47 160Q77 137 121 133L173 62Q189 37 229 36H428Q458 36 485 65L535 134Q585 143 611 178L635 242Q635 269 597 276H65Q31 273 30 241Z" fill="url(#paint)" stroke="#301b32" stroke-width="8"/><path d="M176 132L219 62H423L481 133Z" fill="url(#glass)" stroke="#251e34" stroke-width="8"/><path d="M320 61V134" stroke="#251e34" stroke-width="9"/><path d="M220 65L182 128H313V65Z" fill="#c9eff5" opacity=".45"/><path d="M337 65H420L472 129H337Z" fill="#b2deee" opacity=".42"/><g id="people"><ellipse cx="267" cy="92" rx="28" ry="31" fill="#e6a787" stroke="#5e3440" stroke-width="3"/><path d="M241 87Q241 54 268 56Q295 56 295 89Q280 70 267 73Q252 72 241 87Z" fill="#4b2a28"/><path d="M244 116Q268 105 294 117L305 132H230Z" fill="#e7e5ef"/><ellipse cx="392" cy="94" rx="28" ry="31" fill="#efb39a" stroke="#5e3440" stroke-width="3"/><path d="M362 91Q354 48 395 51Q433 52 421 96Q410 70 390 72Q374 76 362 91Z" fill="#6b342b"/><path d="M365 116Q391 107 419 117L431 132H354Z" fill="#f4d8df"/><path d="M373 105l11 -6 12 10M402 108l10 -9" stroke="#51252e" stroke-width="3"/><path d="M375 87l13 -5M400 82l13 5" stroke="#41212b" stroke-width="4"/><ellipse cx="391" cy="110" rx="9" ry="11" fill="#692a32"/></g><path d="M169 132H488" stroke="#281c32" stroke-width="9"/><path d="M318 135V250" stroke="#702039" stroke-width="5"/><path d="M82 182H575" stroke="#ffb7a3" stroke-opacity=".48" stroke-width="7"/><path d="M83 222H592" stroke="#521b33" stroke-width="5"/><path d="M72 240H590" stroke="#fa7275" stroke-width="4"/><path d="M102 260a55 55 0 1 1 110 0M449 260a55 55 0 1 1 110 0" fill="#351c30"/><circle cx="157" cy="266" r="49" fill="url(#wheel)" stroke="#121523" stroke-width="9"/><circle cx="504" cy="266" r="49" fill="url(#wheel)" stroke="#121523" stroke-width="9"/><circle cx="157" cy="266" r="17" fill="#cbd3d9"/><circle cx="504" cy="266" r="17" fill="#cbd3d9"/><path d="M596 180h27l8 35h-37Z" fill="#ffefb2" stroke="#492c3e" stroke-width="4"/><path d="M38 186h30v26H35Z" fill="#f9a7ac"/><path d="M304 177h38" stroke="#ffe0c6" stroke-width="5"/><path d="M320 184v30" stroke="#9b3b4b" stroke-width="3"/><path d="M440 180h35" stroke="#ffe0c6" stroke-width="5"/><path d="M55 167L122 143M536 143l68 26" stroke="#ffe5ca" stroke-opacity=".6" stroke-width="6"/><path d="M62 228H601" stroke="#ed4654" stroke-opacity=".5" stroke-width="9"/></svg>`;
svgImage('car',car);
}
initializeArt();
function car(x,y,t){
 ctx.save();ctx.translate(x,y);
 const rage=t>=94&&t<232,zoom=rage?1.52:1,shake=rage?Math.sin(t*.7)*3:0;
 ctx.translate(shake,Math.sin(t*.55)*(rage?3:1));ctx.scale(zoom,zoom);
 if(illustration.car?.complete&&illustration.car.naturalWidth)ctx.drawImage(illustration.car,-230,-230,460,230);
 else{ctx.fillStyle='#bc263e';ctx.fillRect(-190,-120,380,110)}
 // Windshield animation: Dr. Tostador is at the wheel (left seat).
 // Dra. En Berga leans across him and repeatedly slams the central horn.
 if(rage){
  const slam=Math.sin(t*.48)>-.05,reach=slam?1:.62;
  ctx.save();ctx.translate(-230,-230);ctx.scale(460/670,230/330);
  ctx.lineCap='round';ctx.lineJoin='round';
  // Tostador's hands remain on the steering wheel.
  ctx.strokeStyle='#27283c';ctx.lineWidth=10;ctx.beginPath();ctx.arc(264,131,24,Math.PI,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#e2a68e';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(245,127);ctx.lineTo(257,114);ctx.moveTo(283,127);ctx.lineTo(273,114);ctx.stroke();
  // Berga reaches from passenger side over the driver's shoulder.
  ctx.strokeStyle='#fff0ed';ctx.lineWidth=19;ctx.beginPath();ctx.moveTo(402,122);ctx.quadraticCurveTo(350,103,302,111);ctx.quadraticCurveTo(285,110,268,110+15*(1-reach));ctx.stroke();
  ctx.strokeStyle='#e6ad95';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(273,111+15*(1-reach));ctx.lineTo(260,127-12*reach);ctx.stroke();
  ctx.fillStyle='#efb49d';ctx.beginPath();ctx.ellipse(258,126-12*reach,13,8,-.35,0,Math.PI*2);ctx.fill();
  // Comically furious eyebrows and clenched mouth.
  ctx.strokeStyle='#51262f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(373,88);ctx.lineTo(387,94);ctx.moveTo(403,94);ctx.lineTo(416,86);ctx.stroke();
  if(slam){ctx.fillStyle='#ffe16d';for(let k=0;k<3;k++){ctx.save();ctx.translate(263,100);ctx.rotate(k*Math.PI*2/3);ctx.fillRect(-2,-30,4,14);ctx.restore()}}
  ctx.restore();
  ctx.strokeStyle='#ffeb84';ctx.lineWidth=5;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(222,-138,24+i*18+Math.sin(t*.18)*4,-.7,.7);ctx.stroke()}
 }
 ctx.restore();
}
function background(t){if(illustration.street?.complete&&illustration.street.naturalWidth){ctx.drawImage(illustration.street,0,0,960,540)}else{ctx.fillStyle='#302b50';ctx.fillRect(0,0,960,540)}ctx.fillStyle='#ffe7a0';for(let i=0;i<7;i++)ctx.fillRect((i*190-t*3)%1100-120,476,100,8)}
// Illustrated sprite sheet exported from the approved Bocinazo Feroz artwork.
// Frames are cropped by phase; if the image is missing, the previous vector animation remains playable.
const bergaSheet=new Image();
// Las imágenes se suben como .b64 para preservar el WebP sin perder ningún píxel
// y ser compatibles con GitHub Pages y la conexión directa de GitHub.
fetch('assets/berga-bocinazo-sprites-v1.b64?v=1')
 .then(r=>{if(!r.ok)throw new Error('Sprites Bocinazo: HTTP '+r.status);return r.text()})
 .then(data=>{
   const encoded=data.replace(/\s/g,'');
   if(!encoded.startsWith('UklGR'))throw new Error('Hoja de sprites WebP inválida');
   bergaSheet.src='data:image/webp;base64,'+encoded;
 })
 .catch(err=>console.warn('[Bocinazo Feroz] Hoja de sprites no disponible; usando animación de reserva',err));
// The illustrated source is a montage, not a perfectly separated atlas.
// Several later cells contain the preceding vehicle. Compose a clean
// rage animation from the first full windshield and mirrored Berga poses.
const bergaFrames={
 board:[[1050,48,145,122],[1331,48,124,122],[1555,48,162,122]],
 drive:[[31,416,311,139],[380,418,307,137],[725,420,305,134],[1101,420,274,133],[1419,420,297,133]],
 impact:[[17,601,289,124],[338,601,222,124],[659,601,164,124],[1050,601,282,124],[1354,601,363,124]]
};
let rageFramesCache=null;
function correctedRageFrames(){
 if(rageFramesCache)return rageFramesCache;
 if(!bergaSheet.complete||!bergaSheet.naturalWidth)return null;
 const origins=[13,360,704,1049,1393],frames=[];
 for(let i=0;i<5;i++){
  const canvas=document.createElement('canvas');canvas.width=328;canvas.height=164;
  const c=canvas.getContext('2d');
  // Stable Tostador steering wheel and a clean, single windshield.
  c.drawImage(bergaSheet,13,213,328,164,0,0,328,164);
  if(i>0){
   // Flip ONLY the passenger and her outstretched arm; never flip the doctor
   // or the entire car. Thus Berga turns LEFT toward the driver's horn.
   const passenger=document.createElement('canvas');
   passenger.width=166;passenger.height=164;
   const pc=passenger.getContext('2d');
   pc.translate(166,0);pc.scale(-1,1);
   pc.drawImage(bergaSheet,origins[i]+162,213,166,164,0,0,166,164);
   pc.setTransform(1,0,0,1,0,0);
   // Soft silhouette avoids cutout edges and excludes adjacent car/doctor.
   const mask=document.createElement('canvas');mask.width=166;mask.height=164;
   const mc=mask.getContext('2d');
   mc.filter='blur(3px)';mc.fillStyle='#fff';mc.beginPath();
   const outline=[[8,152],[3,119],[16,96],[13,82],[22,57],[48,36],[117,39],[139,54],[147,67],[149,159]];
   outline.forEach(([x,y],k)=>k?mc.lineTo(x,y):mc.moveTo(x,y));
   mc.closePath();mc.fill();
   pc.globalCompositeOperation='destination-in';pc.drawImage(mask,0,0);
   pc.globalCompositeOperation='source-over';
   c.drawImage(passenger,162,0);
  }
  frames.push(canvas);
 }
 rageFramesCache=frames;return frames;
}
function illustratedScene(t){
 if(!bergaSheet.complete||!bergaSheet.naturalWidth)return false;
 ctx.save();ctx.fillStyle='#121027';ctx.fillRect(0,0,960,540);
 if(t>=94&&t<235){
  const frames=correctedRageFrames();
  if(!frames){ctx.restore();return false;}
  const step=Math.min(4,Math.floor((t-94)/141*5));
  // Remove the original sheet's purple header and keep one entire car.
  const w=836,h=390;
  ctx.drawImage(frames[step],0,12,328,150,(960-w)/2,(540-h)/2,w,h);
 }else{
  const phase=t<94?'board':t<270?'drive':'impact';
  const period=phase==='board'?94:phase==='drive'?35:50;
  const start=phase==='board'?0:phase==='drive'?235:270;
  const frames=bergaFrames[phase];
  const step=Math.min(frames.length-1,Math.floor((t-start)/period*frames.length));
  const r=frames[step],scale=Math.min(840/r[2],370/r[3]);
  const w=r[2]*scale,h=r[3]*scale;
  ctx.drawImage(bergaSheet,r[0],r[1],r[2],r[3],(960-w)/2,(540-h)/2,w,h);
 }
 ctx.restore();return true;
}
function speakBocinazo(){
 if(S.spoke)return;S.spoke=true;
 if(!soundEnabled||typeof SpeechSynthesisUtterance==='undefined'||!window.speechSynthesis)return;
 try{const voice=new SpeechSynthesisUtterance('¡Bocinazo!');
  voice.lang='es-AR';voice.rate=1.18;voice.pitch=1.25;voice.volume=1;
  S.utterance=voice;window.speechSynthesis.speak(voice);
 }catch(e){console.warn('[Bocinazo Feroz] Voz no disponible',e);}
}
function cinematic(){if(!S.active)return;const t=S.t;ctx.save();const spriteReady=illustratedScene(t);if(!spriteReady){background(t);
 let x=t<46?-300+(t/46)*515:t<235?340:t<285?215+((t-235)/50)*1120:1400;
 if(t>=235&&t<285){ctx.save();ctx.globalAlpha=.32;for(let i=0;i<8;i++){ctx.strokeStyle='#fff5b1';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,260+i*26);ctx.lineTo(960,260+i*26);ctx.stroke()}ctx.restore()}
 if(S.b){const m=atlasMap[S.b.id];ctx.save();ctx.translate(792,432);ctx.scale(-1,1);SpriteAtlas.draw(ctx,t>=271?actionAtlases[actionMap[S.b.id][0]]:atlases[m[0]],t>=271?actionMap[S.b.id][1]:m[1],t>=271?5:0,0,0,270);ctx.restore()}
 car(x,418,t);
 if(t>=94&&t<236){const k=Math.floor((t-94)/18);text(k%2?'¡MOOOOOC!':'¡PIIIIIIP!',480,103,51,'#fff083');text('¡BERGA SE CRUZA PARA TOCAR LA BOCINA!',480,155,25,'#ffb4be')}
 if(t>=235&&t<290)text('¡BOCINAZO FEROZ!',480,100,53,'#ffe16d');
 if(t>=275&&t<298){ctx.fillStyle='rgba(255,255,255,'+(298-t)/55+')';ctx.fillRect(0,0,960,540)}
 ctx.fillStyle='#111029';ctx.fillRect(0,0,960,43);ctx.fillRect(0,496,960,44);ctx.font='900 20px system-ui';ctx.textAlign='left';ctx.fillStyle='#ffe7ac';ctx.fillText('DRA. EN BERGA / SÚPER EX',27,28);ctx.textAlign='right';ctx.fillText('CON DR. TOSTADOR',932,28);
 if(t<93)text('¡TOSTADOR AL VOLANTE!',480,87,39,'#fff0b2');
 }if(t>=113&&t<235){
 // Readable even on mute: speech bubble precisely when Berga presses the horn.
 const flash=Math.floor((t-113)/16)%2===0;
 if(flash)text('¡BOCINAZO!',480,75,45,'#ffe479');
 else text('¡PIIIIIIP!',480,75,41,'#fff0b3');
}window.SUPER_DEFENSE?.draw('berga',ctx,t);ctx.restore()}
function impact(){if(S.hit)return;S.hit=true;const a=S.a,b=S.b;if(!b||b.hp<=0)return;const factor=window.SUPER_DEFENSE?.multiplier('berga')??1;window.SUPER_DEFENSE?.notice('berga');if(factor===0)return;const damage=MAX_HP*.48*factor;b.hp=clamp(b.hp-damage,0,MAX_HP);b.x=clamp(b.x+(a.dir||1)*115,80,880);b.knockback=(a.dir||1)*9;b.stun=Math.max(b.stun||0,78);b.blockstun=0;b.blocking=false;b.parryWindow=0;b.hitRecoil=1;b.hitStrength=1.9;b.hitDirection=a.dir||1;b.hitHeight=1;b.attack=0;b.hit=true;b.meter=clamp(b.meter+12,0,100);a.hit=true;a.connected=true;effects.push({x:b.x,y:235,t:34,burst:true,kind:-3,blocked:false});effects.push({x:b.x,y:150,t:50,text:'¡ATROPELLADO!',color:'#ffe38d'});shake=Math.max(shake,25);hitstop=Math.max(hitstop,11);sfx('hit',{intensity:2});haptic(90);if(a===player&&!practice)score+=Math.round(damage*18)}
function tick(dt){if(!S.active)return;S.t=Math.min(S.length,S.t+dt*S.speed);const a=S.a;a.attack=Math.max(0,S.length-S.t);window.SUPER_DEFENSE?.tick('berga',S.t);if(S.t>=120)speakBocinazo();if(S.t>=98&&S.t<229&&Math.floor(S.t/20)>S.horn){S.horn=Math.floor(S.t/20);sfx('ready');haptic(20)}if(S.t>=270&&!S.hit)impact();if(S.t>=S.length){const dead=!!S.b&&S.b.hp<=0,win=a===player;window.SUPER_DEFENSE?.end('berga');reset();a.attack=0;a.attackType='';a.ex=false;a.invuln=0;clearActionBuffer();if(typeof SECOND!=='undefined')SECOND.actions=[];if(dead)finish(win)}previousHud()}
update=function(dt){if(S.active){tick(dt);return}return previousUpdate.apply(this,arguments)};
draw=function(){previousDraw.apply(this,arguments);if(S.active)cinematic()};
updateHud=function(){previousHud.apply(this,arguments);if(!player)return;const ready=player.id===5&&(practice||player.meter>=100)&&player.cool<=0&&!S.active;const btn=document.querySelector('[data-key=special]');if(btn){btn.classList.toggle('berga-super-ready',ready);if(ready){const label=btn.querySelector('small');if(label)label.textContent='SÚPER EX';btn.setAttribute('aria-label','Bocinazo feroz')}}if(ready&&$('cool'))$('cool').textContent='EX LLENO · ¡BOCINAZO FEROZ!'};
const css=document.createElement('style');css.textContent='.berga-super-ready{outline:3px solid #ffdc8a!important;box-shadow:0 0 17px 5px #fa7695!important;animation:bergaGlow .8s infinite alternate}@keyframes bergaGlow{to{filter:brightness(1.4)}}';document.head.appendChild(css);
})();