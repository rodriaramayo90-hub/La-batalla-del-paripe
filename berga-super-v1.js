/* Dra. En Berga — BOCINAZO FEROZ. Cinematic car, Dr. Tostador drives while Berga crosses over to honk, road rage and run-over. */
(function(){'use strict';
const S={active:false,t:0,length:320,speed:.72,a:null,b:null,hit:false,horn:-1};
window.BERGA_SUPER=S;
const previousStrike=strike,previousUpdate=update,previousDraw=draw,previousHud=updateHud,previousReset=resetArcade;
function reset(){S.active=false;S.t=0;S.a=null;S.b=null;S.hit=false;S.horn=-1;}
resetArcade=function(){reset();return previousReset.apply(this,arguments)};
function allowed(a,type){return type==='special'&&a?.id===5&&a.hp>0&&a.y===0&&a.attack<=0&&a.cool<=0&&a.stun<=0&&a.blockstun<=0&&!a.blocking&&!a.grabbed&&!a.grabbing&&a.escaping<=0&&(practice||a.meter>=100)&&introFrames<=0&&!ending&&!window.TREX_SUP?.active&&!window.DRAPIE_SUPER?.active&&!window.ALCA_SUPER?.active&&!S.active&&!(typeof ONLINE!=='undefined'&&ONLINE.active)}
strike=function(a,b,type,power,low){if(!allowed(a,type))return previousStrike.apply(this,arguments);
 S.active=true;S.t=0;S.a=a;S.b=b||null;S.hit=false;S.horn=0;window.SUPER_DEFENSE?.start('berga',a,b);
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
 drive:[[31,427,311,127],[380,427,307,128],[725,427,305,127],[1101,427,274,126],[1419,427,297,126]],
 impact:[[17,625,278,101],[338,625,208,101],[659,625,140,101],[1095,625,238,101],[1354,625,363,101]]
};
// Keep the car and Tostador absolutely still. Only Berga's cut-out
// moves across the wheel: no alternating heads, extra hands or bleed.
let rageFramesCache=null;
function correctedRageFrames(){
 if(rageFramesCache)return rageFramesCache;
 if(!bergaSheet.complete||!bergaSheet.naturalWidth)return null;
 const makeCanvas=()=>{
  const canvas=document.createElement('canvas');
  canvas.width=328;canvas.height=164;return canvas;
 };
 const passenger=makeCanvas();
 // Single approved full-body pose, mirrored so her arm reaches Tostador.
 const pc=passenger.getContext('2d');
 pc.translate(328,0);pc.scale(-1,1);
 pc.drawImage(bergaSheet,1049,213,328,164,0,0,328,164);
 pc.setTransform(1,0,0,1,0,0);
 // A close silhouette around Berga (NOT the right car door / stray hand).
 // Points are local to the mirrored 166px passenger segment.
 const clean=document.createElement('canvas');
 clean.width=166;clean.height=164;
 const cc=clean.getContext('2d');
 cc.drawImage(passenger,0,0,166,164,0,0,166,164);
 const mask=document.createElement('canvas');
 mask.width=166;mask.height=164;
 const mc=mask.getContext('2d');
 mc.filter='blur(1.3px)';
 mc.fillStyle='#fff';mc.beginPath();
 const outline=[[19,139],[10,131],[9,116],[26,111],[32,104],
 [47,100],[51,90],[51,82],[47,73],[52,58],[64,48],
 [88,43],[115,45],[133,55],[143,69],[144,95],
 [146,112],[144,138],[130,148],[95,145],[57,144]];
 outline.forEach(([x,y],i)=>i?mc.lineTo(x,y):mc.moveTo(x,y));
 mc.closePath();mc.fill();
 cc.globalCompositeOperation='destination-in';cc.drawImage(mask,0,0);
 cc.globalCompositeOperation='source-over';
 const frames=[];
 // Offsets model anticipation, reach and pressure. The face and arm art
 // never switch to different source frames while pressing the horn.
 // The source windshield ALREADY includes Berga seated at right.
 // Removing her from the cabin before each moving pose is essential:
 // otherwise a second face remains visible behind the animated silhouette.
 function cleanEmptyPassengerSeat(c){
  c.save();
  c.beginPath();
  c.moveTo(180,49);c.lineTo(324,49);c.lineTo(324,147);
  c.lineTo(194,147);c.lineTo(194,118);c.lineTo(180,118);
  c.closePath();
  c.clip();
  const cabin=c.createLinearGradient(177,53,310,146);
  cabin.addColorStop(0,'#11172a');
  cabin.addColorStop(.50,'#101525');
  cabin.addColorStop(1,'#26283e');
  c.fillStyle=cabin;c.fillRect(178,49,149,101);
  // Reconstruct a dark passenger seat and the lower dashboard,
  // keeping the red roof, mirror, doctor and windshield frame untouched.
  c.fillStyle='#1b2035';c.strokeStyle='#33364c';c.lineWidth=2;
  c.beginPath();c.roundRect(227,72,76,76,15);c.fill();c.stroke();
  c.fillStyle='#181c30';c.beginPath();c.ellipse(262,82,39,20,0,0,Math.PI*2);c.fill();
  c.fillStyle='#24263c';c.beginPath();c.roundRect(200,127,110,21,8);c.fill();
  c.strokeStyle='#34283b';c.lineWidth=4;
  c.beginPath();c.moveTo(194,146);c.lineTo(323,146);c.stroke();
  c.restore();
  // Restore the rear-view mirror without the original passenger's hair.
  c.drawImage(bergaSheet,13+150,213+35,43,26,150,35,43,26);
 }
 for(const offset of [null,18,9,0]){
  const frame=makeCanvas(),c=frame.getContext('2d');
  c.drawImage(bergaSheet,13,213,328,164,0,0,328,164);
  if(offset!==null){
   cleanEmptyPassengerSeat(c);
   c.drawImage(clean,162+offset,0);
  }
  frames.push(frame);
 }
 rageFramesCache=frames;
 return frames;
}
function illustratedScene(t){
 if(!bergaSheet.complete||!bergaSheet.naturalWidth)return false;
 ctx.save();ctx.fillStyle='#121027';ctx.fillRect(0,0,960,540);
 if(t>=94&&t<235){
  const frames=correctedRageFrames();
  if(!frames){ctx.restore();return false;}
  // Three small approach poses, then one stable press pose. Releasing
  // the horn moves only Berga's arm by nine source pixels.
  const beat=t>=125?(t-125)%20:-1;
  const step=t<110?0:t<118?1:t<125?2:beat<13?3:2;
  const w=836,h=390;
  ctx.drawImage(frames[step],0,12,328,150,(960-w)/2,(540-h)/2,w,h);
 }else{
  const phase=t<94?'board':t<270?'drive':'impact';
  const period=phase==='board'?94:phase==='drive'?35:50;
  const start=phase==='board'?0:phase==='drive'?235:270;
  const frames=bergaFrames[phase];
  const step=Math.min(frames.length-1,Math.floor((t-start)/period*frames.length));
  const r=frames[step],scale=phase==='board'?3.4:phase==='drive'?2.7:2.56;
  const w=r[2]*scale,h=r[3]*scale;
  ctx.drawImage(bergaSheet,r[0],r[1],r[2],r[3],(960-w)/2,(540-h)/2,w,h);
 }
 ctx.restore();return true;
}
// The honk is a comic effect, NEVER synthesized dialogue.
// A visible comic horn ONLY while her hand is pressing the steering wheel.
function comicHonk(t){
 if(t<125||t>=232)return;
 const beat=Math.floor((t-125)/20),phase=(t-125)%20;
 if(phase>=13)return; // horn released, no floating onomatopoeia
 const sound=beat%2===0?'¡PIIIIIIP!':'¡MOOOOOC!';
 const ease=Math.sin(Math.min(1,phase/6)*Math.PI/2);
 const scale=.82+ease*.19;
 const x=480,y=85;
 ctx.save();ctx.translate(x,y);ctx.rotate(beat%2?.032:-.032);
 ctx.scale(scale,scale);
 ctx.beginPath();
 for(let i=0;i<28;i++){
  const theta=i*Math.PI/14-Math.PI/2,r=i%2?112:148;
  if(!i)ctx.moveTo(Math.cos(theta)*r,Math.sin(theta)*r*.37);
  else ctx.lineTo(Math.cos(theta)*r,Math.sin(theta)*r*.37);
 }
 ctx.closePath();
 ctx.fillStyle=beat%2?'#fd4760':'#ffce35';
 ctx.strokeStyle='#191130';ctx.lineWidth=8;ctx.fill();ctx.stroke();
 ctx.font='italic 1000 48px system-ui';ctx.textAlign='center';
 ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=9;
 ctx.strokeStyle='#22152e';ctx.strokeText(sound,0,0);
 ctx.fillStyle='#fff9d5';ctx.fillText(sound,0,0);
 ctx.restore();
 // The impact sparks have one fixed origin at Berga's hand on the horn.
 const hx=486,hy=382;
 ctx.save();ctx.translate(hx,hy);
 ctx.strokeStyle='#ffe66d';ctx.lineWidth=5;ctx.lineCap='round';
 ctx.globalAlpha=Math.max(.20,1-phase/15);
 for(let i=0;i<5;i++){
  const theta=(-2.9+i*.43),r=21+phase*.75;
  ctx.beginPath();ctx.moveTo(Math.cos(theta)*r,Math.sin(theta)*r);
  ctx.lineTo(Math.cos(theta)*(r+20),Math.sin(theta)*(r+20));ctx.stroke();
 }
 ctx.restore();
}
// Extract ONLY the red car silhouette from the illustrated driving frame.
// The old 'impact' row contains a fixed stranger, so it must never be used.
let mobileCarSprite=null;
function getMobileCar(){
 if(mobileCarSprite)return mobileCarSprite;
 if(!bergaSheet.complete||!bergaSheet.naturalWidth)return null;
 const canvas=document.createElement('canvas');canvas.width=311;canvas.height=127;
 const c=canvas.getContext('2d');
 c.save();c.beginPath();
 const outline=[[76,127],[78,112],[80,98],[85,84],[99,77],[108,74],
 [117,57],[130,51],[142,47],[203,46],[214,47],[228,54],
 [246,73],[260,78],[279,84],[289,97],[294,107],[294,117],[289,126]];
 outline.forEach(([x,y],index)=>index?c.lineTo(x,y):c.moveTo(x,y));
 c.closePath();c.clip();c.drawImage(bergaSheet,31,427,311,127,0,0,311,127);c.restore();
 mobileCarSprite=canvas;return canvas;
}
function drawPracticeMannequin(x,y,t,hit,guard){
 ctx.save();ctx.translate(x,y);
 if(hit&&!guard){const p=Math.max(0,Math.min(1,(t-270)/43));ctx.translate(p*88,-118*Math.sin(Math.PI*p));ctx.rotate(-.65*Math.sin(Math.PI*p))}
 if(guard)ctx.translate(0,-30);
 ctx.lineJoin='round';ctx.strokeStyle='#9cd8ed';ctx.lineWidth=8;
 ctx.fillStyle='#343d58';ctx.beginPath();ctx.roundRect(-39,-160,78,108,15);ctx.fill();ctx.stroke();
 ctx.fillStyle='#b7c2d7';ctx.beginPath();ctx.arc(0,-195,32,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#bbc5d8';ctx.lineWidth=13;ctx.beginPath();
 ctx.moveTo(-20,-50);ctx.lineTo(-24,0);ctx.moveTo(20,-50);ctx.lineTo(24,0);
 ctx.moveTo(-37,-138);ctx.lineTo(-53,-72);ctx.moveTo(37,-138);ctx.lineTo(53,-72);ctx.stroke();
 ctx.fillStyle='#ffde8e';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.fillText('PRÁCTICA',0,-104);
 ctx.restore();
}
function drawActualRival(t,front){
 const b=S.b,ground=463,perfect=window.SUPER_DEFENSE?.result('berga')==='perfect';
 if(!b||!Number.isInteger(b.id)||!atlasMap[b.id]){
  // Practice without a selected opponent: explicitly a dummy, not a fixed character.
  drawPracticeMannequin(778,ground,t,t>=270,false);return;
 }
 const wasHit=t>=270&&!perfect;
 const p=Math.max(0,Math.min(1,(t-270)/46));
 let x=front?778+(wasHit?p*100:perfect?p*80:0):778;
 let lift=wasHit?140*Math.sin(p*Math.PI):perfect&&t>=260?96*Math.sin(Math.min(1,(t-260)/43)*Math.PI):0;
 const source=wasHit?actionAtlases[actionMap[b.id][0]]:atlases[atlasMap[b.id][0]];
 const row=wasHit?actionMap[b.id][1]:atlasMap[b.id][1],pose=wasHit?5:0;
 ctx.save();ctx.translate(x,ground-lift);ctx.scale(-1,1);
 if(wasHit)ctx.rotate(.83*Math.sin(p*Math.PI));
 if(perfect&&t>=259)ctx.translate(-20,0);
 // These are the EXACT combat atlases and body proportions used in-game.
 SpriteAtlas.draw(ctx,source,row,pose,0,0,300);
 ctx.restore();
}
function collisionFlash(t){
 const elapsed=t-270;if(elapsed<0||elapsed>25)return;
 const opacity=Math.max(0,1-elapsed/25);
 const perfect=window.SUPER_DEFENSE?.result('berga')==='perfect';
 ctx.save();ctx.translate(758,329);ctx.globalAlpha=opacity;
 ctx.strokeStyle=perfect?'#b1fff1':'#ffde70';ctx.lineWidth=6;
 for(let i=0;i<14;i++){const theta=i*Math.PI/7,rad=20+elapsed*3;
  ctx.beginPath();ctx.moveTo(Math.cos(theta)*rad,Math.sin(theta)*rad);
  ctx.lineTo(Math.cos(theta)*(rad+75),Math.sin(theta)*(rad+75));ctx.stroke()}
 ctx.restore();
 if(!perfect&&elapsed<16){
  ctx.save();ctx.translate(745,170);ctx.rotate(-.11);ctx.fillStyle='#ffe45a';
  ctx.strokeStyle='#371439';ctx.lineWidth=7;
  ctx.beginPath();for(let i=0;i<20;i++){let angle=i*Math.PI/10,r=i%2?55:92;
   let x=Math.cos(angle)*r,y=Math.sin(angle)*r*.75;
   if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();
  ctx.font='italic 1000 25px system-ui';ctx.textAlign='center';ctx.fillStyle='#431a3d';
  ctx.fillText('¡PAM!',0,9);ctx.restore();
 }
}
function integratedAtropello(t){
 // The real stage remains visible through the game canvas, exactly as in
 // gameplay; no independent photo with a hardcoded opponent is displayed.
 ctx.clearRect(0,0,960,540);
 ctx.fillStyle='rgba(14,7,41,.24)';ctx.fillRect(0,0,960,540);
 ctx.fillStyle='rgba(14,6,31,.40)';ctx.fillRect(0,465,960,75);
 for(let i=0;i<13;i++){
  const shift=(t-235)*12+i*93;
  ctx.strokeStyle='rgba(255,226,151,.18)';ctx.lineWidth=i%3?3:6;
  ctx.beginPath();ctx.moveTo((shift%1200)-180,400+i*7);
  ctx.lineTo((shift%1200)+140,320+i*4);ctx.stroke();
 }
 const carArt=getMobileCar();
 const progress=Math.max(0,Math.min(1,(t-235)/35));
 const x=t<270?-620+835*progress:215+Math.min(1,(t-270)/40)*1040;
 const carWidth=622,carHeight=254,carY=463-carHeight;
 const perfect=window.SUPER_DEFENSE?.result('berga')==='perfect';
 // Victim starts in front of the approaching car; after impact, draw again
 // above the moving vehicle so the game character visibly tumbles.
 if(t<270||perfect)drawActualRival(t,false);
 ctx.save();ctx.fillStyle='rgba(18,16,41,.30)';
 ctx.beginPath();ctx.ellipse(x+395,468,210,13,0,0,Math.PI*2);ctx.fill();ctx.restore();
 if(carArt){
  ctx.save();ctx.translate(x,carY+Math.sin(t*.72)*2);
  ctx.drawImage(carArt,0,0,carWidth,carHeight);ctx.restore();
 }else{
  // Startup fallback when illustrated asset is still loading.
  car(x+370,450,t);
 }
 // Dust follows the wheels without carrying the baked-in opponent.
 ctx.save();ctx.globalAlpha=.45;
 for(let i=0;i<6;i++){const dx=x+130-i*32,dy=444-i%2*13;
  ctx.fillStyle=i%2?'#e2b9d7':'#f5e7e0';ctx.beginPath();
  ctx.arc(dx,dy,15+i%3*5+Math.sin(t*.3+i)*4,0,Math.PI*2);ctx.fill()}
 ctx.restore();
 if(t>=270&&!perfect)drawActualRival(t,true);
 collisionFlash(t);
 if(t>=235&&t<272){text('¡A FONDO!',480,88,39,'#ffdf7a')}
 if(t>=280&&t<313&&!perfect){text('¡ATROPELLADO!',480,98,44,'#ffe284')}
}
function cinematic(){
 if(!S.active)return;const t=S.t;ctx.save();
 if(t>=235){integratedAtropello(t)}
 else{
  const spriteReady=illustratedScene(t);
  if(!spriteReady){
   background(t);car(t<46?-300+t/46*515:340,418,t);
   if(t<93)text('¡TOSTADOR AL VOLANTE!',480,88,35,'#fff0b2');
  }
  comicHonk(t);
 }
 window.SUPER_DEFENSE?.draw('berga',ctx,t);ctx.restore();
}
function impact(){if(S.hit)return;S.hit=true;const a=S.a,b=S.b;if(!b||b.hp<=0)return;const factor=window.SUPER_DEFENSE?.multiplier('berga')??1;window.SUPER_DEFENSE?.notice('berga');if(factor===0)return;const damage=MAX_HP*.48*factor;b.hp=clamp(b.hp-damage,0,MAX_HP);b.x=clamp(b.x+(a.dir||1)*115,80,880);b.knockback=(a.dir||1)*9;b.stun=Math.max(b.stun||0,78);b.blockstun=0;b.blocking=false;b.parryWindow=0;b.hitRecoil=1;b.hitStrength=1.9;b.hitDirection=a.dir||1;b.hitHeight=1;b.attack=0;b.hit=true;b.meter=clamp(b.meter+12,0,100);a.hit=true;a.connected=true;effects.push({x:b.x,y:235,t:34,burst:true,kind:-3,blocked:false});effects.push({x:b.x,y:150,t:50,text:'¡ATROPELLADO!',color:'#ffe38d'});shake=Math.max(shake,25);hitstop=Math.max(hitstop,11);sfx('hit',{intensity:2});haptic(90);if(a===player&&!practice)score+=Math.round(damage*18)}
function tick(dt){if(!S.active)return;S.t=Math.min(S.length,S.t+dt*S.speed);const a=S.a;a.attack=Math.max(0,S.length-S.t);window.SUPER_DEFENSE?.tick('berga',S.t);if(S.t>=125&&S.t<232){const beat=Math.floor((S.t-125)/20);if(beat>S.horn){S.horn=beat;sfx('ready');haptic(20)}}if(S.t>=270&&!S.hit)impact();if(S.t>=S.length){const dead=!!S.b&&S.b.hp<=0,win=a===player;window.SUPER_DEFENSE?.end('berga');reset();a.attack=0;a.attackType='';a.ex=false;a.invuln=0;clearActionBuffer();if(typeof SECOND!=='undefined')SECOND.actions=[];if(dead)finish(win)}previousHud()}
update=function(dt){if(S.active){tick(dt);return}return previousUpdate.apply(this,arguments)};
draw=function(){previousDraw.apply(this,arguments);if(S.active)cinematic()};
updateHud=function(){previousHud.apply(this,arguments);if(!player)return;const ready=player.id===5&&(practice||player.meter>=100)&&player.cool<=0&&!S.active;const btn=document.querySelector('[data-key=special]');if(btn){btn.classList.toggle('berga-super-ready',ready);if(ready){const label=btn.querySelector('small');if(label)label.textContent='SÚPER EX';btn.setAttribute('aria-label','Bocinazo feroz')}}if(ready&&$('cool'))$('cool').textContent='EX LLENO · ¡BOCINAZO FEROZ!'};
const css=document.createElement('style');css.textContent='.berga-super-ready{outline:3px solid #ffdc8a!important;box-shadow:0 0 17px 5px #fa7695!important;animation:bergaGlow .8s infinite alternate}@keyframes bergaGlow{to{filter:brightness(1.4)}}';document.head.appendChild(css);
})();