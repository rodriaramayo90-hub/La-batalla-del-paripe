/* Maléfica — HUMOR NEGRO, super EX jugable.
   El ataque normal «Ataque Artístico» se conserva; gráficos del atlas
   assets/malefica-humor-negro-{poses,fx,sticker}.b64.
   El rival verdadero usa sus propios sprites; tres pulsaciones de defensa. */
(function(){
'use strict';

const H={
 active:false,t:0,length:326,speed:.78,actor:null,victim:null,hit:false,
 art:{poses:null,fx:null,sticker:null},waveTick:-1,finishResult:null
};
window.MALEFICA_SUPER=H;



function loadSheet(file,key,minW,minH){
 fetch('assets/malefica-humor-negro-'+file+'.b64?v=1')
  .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.text()})
  .then(raw=>{
   const encoded=raw.replace(/\s/g,'');
   if(!encoded.startsWith('UklGR'))throw Error('Invalid WEBP payload for '+file);
   const im=new Image();
   im.onload=()=>{
    if(im.naturalWidth>=minW&&im.naturalHeight>=minH)H.art[key]=im;
    else console.warn('[Humor Negro] Unexpected image geometry',file,im.naturalWidth,im.naturalHeight);
   };
   im.onerror=()=>console.warn('[Humor Negro] Image could not decode',file);
   im.src='data:image/webp;base64,'+encoded;
  }).catch(e=>console.warn('[Humor Negro] Sprite fallback for '+file,e));
}
loadSheet('poses','poses',1536,1536);
loadSheet('fx','fx',1280,960);
loadSheet('sticker','sticker',640,360);

function reset(){
 if(H.active)window.SUPER_DEFENSE?.end('malefica');
 H.active=false;H.t=0;H.actor=null;H.victim=null;
 H.hit=false;H.waveTick=-1;H.finishResult=null;
}

function ready(a,type){
 return type==='special'&&a&&a.id===9&&a.hp>0&&a.y===0&&a.attack<=0
  &&a.cool<=0&&a.stun<=0&&a.blockstun<=0&&!a.blocking
  &&!a.grabbed&&!a.grabbing&&a.escaping<=0
  &&(practice||a.meter>=100)&&introFrames<=0&&!ending
  &&!(typeof projectileClash!=='undefined'&&projectileClash)
  &&!(typeof ONLINE!=='undefined'&&ONLINE.active)
  &&!window.TREX_SUP?.active&&!window.DRAPIE_SUPER?.active
  &&!window.ALCA_SUPER?.active&&!window.BERGA_SUPER?.active&&!H.active;
}

function startStrike(a,b,type,power,low){
 if(!ready(a,type))return false;
 reset();
 H.active=true;H.t=0;H.actor=a;H.victim=b||null;
 window.SUPER_DEFENSE?.start('malefica',a,b);
 a.meter=0;a.attackType='malefica-super';a.attackLength=H.length;
 a.attack=H.length;a.ex=true;a.finisher=false;a.cool=practice?H.length:390;
 a.crouching=false;a.blocking=false;a.moving=false;a.hit=false;
 a.connected=false;a.shots=0;a.cast=++castSerial;a.vy=0;a.y=0;
 a.invuln=H.length+10;
 if(b)b.moving=false;
 clearActionBuffer();cancelCharges();
 if(typeof SECOND!=='undefined'){SECOND.actions=[];cancelSecondCharges();}
 announcement='¡HUMOR NEGRO!';announceTime=0;exFlash=22;
 haptic(35);updateHud();return true;
};

function frame(img,id,cols,rows,x,y,w,h){
 if(!img||!img.complete||!img.naturalWidth)return false;
 const cw=img.naturalWidth/cols,ch=img.naturalHeight/rows;
 ctx.drawImage(img,(id%cols)*cw,Math.floor(id/cols)*ch,cw,ch,x,y,w,h);
 return true;
}
function letters(txt,x,y,size,color='#fff',outline='#150725'){
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
 ctx.font='italic 900 '+size+'px system-ui';
 ctx.strokeStyle=outline;ctx.lineWidth=Math.max(5,size*.14);
 ctx.strokeText(txt,x,y);ctx.fillStyle=color;ctx.fillText(txt,x,y);
 ctx.restore();
}
function background(t){
 const grad=ctx.createRadialGradient(430,190,25,500,250,690);
 grad.addColorStop(0,t>275?'#7f279a':'#462075');
 grad.addColorStop(.58,'#23123e');grad.addColorStop(1,'#080919');
 ctx.fillStyle=grad;ctx.fillRect(0,0,960,540);
 ctx.save();ctx.globalAlpha=.20;ctx.strokeStyle='#a55afb';
 for(let i=0;i<19;i++){
  const x=(i*137+t*2)%1200-100;
  ctx.lineWidth=i%3+1;ctx.beginPath();ctx.moveTo(x-140,540);ctx.lineTo(x+220,0);ctx.stroke();
 }
 ctx.restore();
 ctx.fillStyle='#100c25';ctx.fillRect(0,465,960,75);
 ctx.strokeStyle='#9c74e9';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(0,465);ctx.lineTo(960,465);ctx.stroke();
}
function actorPose(t){
 if(t<25)return 0;
 if(t<50)return 1;
 if(t<96)return 1;
 if(t<117)return 2;
 if(t<135)return 3;
 if(t<166)return 4;
 if(t<204)return 6;
 if(t<243)return 6;
 if(t<280)return 7;
 return 8;
}
function drawActor(t){
 const id=actorPose(t);
 ctx.save();
 const x=id>=7?115:127,y=id>=7?114:104;
 if(t>=135&&t<280)ctx.translate(Math.sin(t*.36)*2,0);
 const ok=frame(H.art.poses,id,3,3,x,y,370,365);
 if(!ok){
  ctx.translate(310,461);ctx.scale(1,1);
  const m=atlasMap[9];
  SpriteAtlas.draw(ctx,atlases[m[0]],m[1],0,0,0,300);
 }
 ctx.restore();
}
function drawVictim(t){
 const b=H.victim;
 if(!b||!Number.isInteger(b.id)||!atlasMap[b.id])return;
 const verdict=window.SUPER_DEFENSE?.result('malefica');
 const perfect=verdict==='perfect';
 const hit=t>=289&&!perfect;
 const move=Math.max(0,Math.min(1,(t-289)/35));
 ctx.save();
 ctx.translate(760+(hit?move*85:0),464-(hit?Math.sin(move*Math.PI)*100:0));
 ctx.scale(-1,1);
 if(hit)ctx.rotate(.36*Math.sin(move*Math.PI));
 const cell=hit?5:0;
 const sheet=hit?actionAtlases[actionMap[b.id][0]]:atlases[atlasMap[b.id][0]];
 const row=hit?actionMap[b.id][1]:atlasMap[b.id][1];
 SpriteAtlas.draw(ctx,sheet,row,cell,0,0,300);
 ctx.restore();
}
function visualShield(t){
 if(t<174||t>315||!H.victim)return;
 const w=window.SUPER_DEFENSE?.result('malefica');
 const perfect=w==='perfect';
 const beats=[178,217,256];
 let activeBeat=-1;
 for(let i=0;i<3;i++)if(Math.abs(t-beats[i])<18)activeBeat=i;
 const idx=perfect?(t>=282?9+Math.min(2,Math.floor((t-282)/12)):8)
  :activeBeat>=0?6+Math.min(2,activeBeat):null;
 if(idx===null)return;
 ctx.save();ctx.globalAlpha=perfect?.92:.78;
 const ok=frame(H.art.fx,idx,4,3,645,146,240,250);
 if(!ok){
  ctx.strokeStyle=perfect?'#9efff1':'#d783ff';ctx.lineWidth=8;
  ctx.beginPath();ctx.ellipse(760,268,83,127,0,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}
function drawWave(t){
 const start=[166,205,244];
 for(let i=0;i<3;i++){
  const p=(t-start[i])/36;
  if(p<0||p>1)continue;
  const x=380+370*p;
  ctx.save();ctx.globalAlpha=Math.min(1,(1-p)*2+.15);
  const size=135+62*p;
  const ok=frame(H.art.fx,i,4,3,x-size/2,225-size/2,size,size);
  if(!ok){
   ctx.strokeStyle='#cd76f5';ctx.lineWidth=7;
   for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(x,225,size*.17+j*13,size*.31+j*16,0,0,Math.PI*2);ctx.stroke();}
  }
  ctx.restore();
 }
}
function finalBurst(t){
 if(t<280||t>318)return;
 const passed=t-280;
 const perfect=window.SUPER_DEFENSE?.result('malefica')==='perfect';
 const idx=perfect?9+Math.min(2,Math.floor(passed/13))
  :3+Math.min(2,Math.floor(passed/13));
 ctx.save();ctx.globalAlpha=Math.max(0,1-Math.max(0,passed-25)/13);
 const w=315+passed*4;
 if(!frame(H.art.fx,idx,4,3,760-w/2,234-w/2,w,w)){
  const rad=30+passed*5;ctx.strokeStyle=perfect?'#abffec':'#ff9df3';
  ctx.lineWidth=12;ctx.beginPath();ctx.arc(760,240,rad,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}
function closeup(){
 ctx.save();
 const img=H.art.sticker;
 if(img?.complete&&img.naturalWidth){
  const w=445,h=Math.min(340,445*img.naturalHeight/img.naturalWidth);
  ctx.fillStyle='#17192c';ctx.beginPath();ctx.roundRect(480-w/2-10,100, w+20,h+20,20);ctx.fill();
  ctx.drawImage(img,480-w/2,110,w,h);
 }else{
  ctx.fillStyle='#101b26';ctx.beginPath();ctx.roundRect(355,146,440,260,18);ctx.fill();
  letters('LINDO DÍA PARA',575,227,33,'#edfffb');
  letters('CLAVARSE UNA FRÍA',575,278,33,'#edfffb');
 }
 ctx.restore();
}
function cinematic(){
 if(!H.active)return;
 const t=H.t;ctx.save();background(t);
 drawVictim(t);drawActor(t);
 if(t>=48&&t<99)closeup();
 if(t>109&&t<279){
  const a=Math.min(1,Math.max(0,(t-109)/22));
  ctx.globalAlpha=a;
  const big=t>=158;
  letters(big?'¡JAJAJAJAJA!':'jeje... jeje...',460,72,big?43:30,big?'#fff0b0':'#ddbbff');
  ctx.globalAlpha=1;
 }
 if(t>=126&&t<287){
  ctx.save();ctx.globalAlpha=.23+.14*Math.sin(t*.2);
  const g=ctx.createRadialGradient(280,270,25,280,270,300);
  g.addColorStop(0,'#e4b4ff88');g.addColorStop(1,'#8f00ff00');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(280,270,260,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 drawWave(t);visualShield(t);finalBurst(t);
 if(t>=280&&t<310)letters('¡HUMOR NEGRO!',480,92,44,'#fff2a9');
 window.SUPER_DEFENSE?.draw('malefica',ctx,t);
 ctx.restore();
}
function impact(){
 if(H.hit)return;
 H.hit=true;
 const a=H.actor,b=H.victim;
 H.finishResult=window.SUPER_DEFENSE?.result('malefica')??'fail';
 if(!b||b.hp<=0)return;
 const mul=window.SUPER_DEFENSE?.multiplier('malefica')??1;
 window.SUPER_DEFENSE?.notice('malefica');
 if(mul===0){
  effects.push({x:b.x,y:160,t:47,text:'¡TE CABIÓ!',color:'#a7ffe5'});
  haptic(28);return;
 }
 const damage=MAX_HP*.46*mul;
 b.hp=clamp(b.hp-damage,0,MAX_HP);
 b.x=clamp(b.x+(a.dir||1)*(mul===.5?58:106),80,880);
 b.knockback=(a.dir||1)*7;b.stun=Math.max(b.stun||0,68);
 b.blockstun=0;b.blocking=false;b.parryWindow=0;
 b.hitRecoil=1;b.hitStrength=1.8;b.hitHeight=1;
 b.hitDirection=a.dir||1;b.attack=0;b.hit=true;
 b.meter=clamp(b.meter+11,0,100);a.hit=true;a.connected=true;
 effects.push({x:b.x,y:236,t:31,burst:true,kind:-3,blocked:false});
 effects.push({x:b.x,y:150,t:49,text:'¡RISA MALDITA!',color:'#f6d7ff'});
 shake=Math.max(shake,20);hitstop=Math.max(hitstop,9);
 sfx('hit',{intensity:2});haptic(85);
 if(a===player&&!practice)score+=Math.round(damage*17);
}
function tick(dt){
 if(!H.active)return;
 H.t=Math.min(H.length,H.t+dt*H.speed);
 const t=H.t,a=H.actor;
 a.attack=Math.max(0,H.length-t);
 window.SUPER_DEFENSE?.tick('malefica',t);
 const laugh=Math.floor((t-132)/18);
 if(t>=132&&t<170&&laugh>H.waveTick){
  H.waveTick=laugh;sfx('ready');haptic(14);
 }
 if(t>=289&&!H.hit)impact();
 if(t>=H.length){
  const b=H.victim,dead=!!b&&b.hp<=0,win=a===player;
  window.SUPER_DEFENSE?.end('malefica');
  reset();a.attack=0;a.attackType='';a.ex=false;a.invuln=0;
  clearActionBuffer();if(typeof SECOND!=='undefined')SECOND.actions=[];
  if(dead)finish(win);
 }
 updateHud();
}


function drawSuperHud(){
if(!player)return;
 const ready=player.id===9&&(practice||player.meter>=100)&&player.cool<=0&&!H.active;
 const btn=document.querySelector('[data-key=special]');
 if(btn)btn.classList.toggle('malefica-super-ready',ready);
 if(ready&&$('cool'))$('cool').textContent='EX LLENO · ¡HUMOR NEGRO!';
};
const css=document.createElement('style');
css.textContent='.malefica-super-ready{outline:3px solid #e6acff!important;box-shadow:0 0 16px 6px #b86aff!important;animation:maleficaExPulse .8s ease-in-out infinite alternate}@keyframes maleficaExPulse{to{filter:brightness(1.4)}}';
document.head.appendChild(css);

// Central EX dispatcher owns strike/update/draw/HUD/reset. No global wrappers here.
window.SUPER_MANAGER.register({fighterId:9,key:'malefica',state:H,
 canStart:ready,start:startStrike,update:tick,draw:cinematic,hud:drawSuperHud,reset});
})();