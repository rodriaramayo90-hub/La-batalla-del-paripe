/* T-Rex SUP EX: twelve independently rendered animation sprites and a cinematic super.
   Safe for solo, practice and local multiplayer. Existing normal special is preserved. */
(function(){
'use strict';
var SUP={active:false,age:0,actor:null,victim:null,landed:false,blocked:false,miss:false,frames:[],length:198,ready:false,voice:false};
window.TREX_SUP=SUP;
var oldStrike=strike,oldUpdate=update,oldDraw=draw,oldHud=updateHud,oldReset=resetArcade;
function reset(){SUP.active=false;SUP.actor=null;SUP.victim=null;SUP.age=0;SUP.landed=false;SUP.miss=false;SUP.voice=false;}
resetArcade=function(){reset();return oldReset.apply(this,arguments);};
function canStart(a,type){
 return type==='special'&&a&&a.id===1&&(practice||a.meter>=100)&&a.cool<=0&&a.attack<=0&&a.stun<=0&&a.blockstun<=0&&!a.blocking&&a.escaping<=0&&a.hp>0&&a.y===0&&!a.legGone&&!ending&&!SUP.active&&introFrames<=0&&!(typeof ONLINE!=='undefined'&&ONLINE.active);
}
strike=function(a,b,type,power,low){
 if(!canStart(a,type))return oldStrike.apply(this,arguments);
 SUP.active=true;SUP.age=0;SUP.actor=a;SUP.victim=b||null;SUP.landed=false;SUP.blocked=false;SUP.miss=false;SUP.voice=false;
 a.meter=0;a.attackType='trex-super';a.attackLength=SUP.length;a.attack=SUP.length;a.ex=true;a.finisher=false;a.cool=practice?SUP.length:390;a.crouching=false;a.blocking=false;a.moving=false;a.hit=false;a.connected=false;a.shots=0;a.cast=++castSerial;a.vy=0;a.y=0;a.invuln=SUP.length+8;
 if(b){b.blocking=b.blocking&&b.y===0; b.moving=false;}
 clearActionBuffer();cancelCharges();if(typeof SECOND!=='undefined'){SECOND.actions=[];cancelSecondCharges();}
 announcement='¡SUPREMO: TABLAZO DE T-REX!';announceTime=0;exFlash=20;
 sfx('ready');haptic(45);oldHud();
 return true;
};
function stroke(c,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.stroke();}
function round(c,x,y,w,h,r,color,outline){
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();
 if(outline){stroke(c,outline,3);c.stroke();}
}
function board(c,x,y,w,h,angle,flat){
 c.save();c.translate(x,y);c.rotate(angle);
 var bh=Math.max(7,h*(flat?0.26:1)),gradient=c.createLinearGradient(0,-bh/2,0,bh/2);
 gradient.addColorStop(0,'#a5ffff');gradient.addColorStop(.30,'#2ae6e7');gradient.addColorStop(.8,'#057fbd');gradient.addColorStop(1,'#063f83');
 c.shadowColor='#2ff8ff';c.shadowBlur=9;
 c.beginPath();c.moveTo(-w*.49,0);c.bezierCurveTo(-w*.47,-bh*.58,-w*.20,-bh*.56,w*.38,-bh*.48);c.bezierCurveTo(w*.61,-bh*.30,w*.60,bh*.35,w*.37,bh*.47);c.bezierCurveTo(-w*.22,bh*.55,-w*.48,bh*.50,-w*.49,0);c.closePath();
 c.fillStyle=gradient;c.fill();c.shadowBlur=0;stroke(c,'#062a63',4);c.stroke();
 c.beginPath();c.moveTo(-w*.32,-bh*.26);c.quadraticCurveTo(0,-bh*.30,w*.31,-bh*.22);c.quadraticCurveTo(w*.42,0,w*.30,bh*.22);c.quadraticCurveTo(0,bh*.33,-w*.32,bh*.27);c.closePath();c.fillStyle='#123d8b';c.fill();stroke(c,'#8de9f7',2);c.stroke();
 c.strokeStyle='#d3ffff';c.lineWidth=3;c.beginPath();c.moveTo(-w*.25,-bh*.38);c.lineTo(w*.25,-bh*.37);c.stroke();
 c.strokeStyle='#111e4f';c.lineWidth=3;
 for(var k=0;k<3;k++){var sx=w*(.23+k*.055);c.beginPath();c.moveTo(sx,-bh*.17);c.lineTo(sx+w*.06,bh*.16);c.stroke();}
 c.font='bold 20px system-ui';c.fillStyle='#b8f7fb';c.textAlign='center';if(bh>26)c.fillText('SUP',-w*.10,7);
 c.restore();
}
function pump(c,phase){
 var v=Math.sin(phase*Math.PI*2),handleY=129+v*22;
 c.save();c.strokeStyle='#08264d';c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(290,294);c.lineTo(290,171);c.stroke();
 round(c,277,202,25,91,8,'#0c83ba','#153458');
 stroke(c,'#79ecff',7);c.beginPath();c.moveTo(290,206);c.lineTo(290,handleY+21);c.stroke();
 round(c,247,handleY,86,16,7,'#273b66','#080f2d');
 round(c,267,292,47,11,5,'#082b5c');
 c.strokeStyle='#101d43';c.lineWidth=5;c.beginPath();c.moveTo(290,296);c.bezierCurveTo(350,300,333,348,388,326);c.stroke();
 c.restore();
}
function bag(c){c.save();c.translate(345,319);c.rotate(-.08);round(c,-62,-25,125,50,18,'#1b3154','#75f4fc');c.fillStyle='#eaffff';c.font='bold 14px system-ui';c.fillText('SUP',-20,8);c.restore();}
function basePose(c,index){
 // These are real T-Rex body sprites from the existing game, anchored to one ground point.
 var col=index===1||index===2?1:index===9||index===10?2:index===11?0:index===8?3:index>=4&&index<=7?(index%2?1:0):0;
 var im=index===1||index===2||index>=4&&index<=7||index===9||index===10?actionAtlases[0]:atlases[0];
 SpriteAtlas.draw(c,im,1,col,210,374,275);
}
function sprite(index){
 var canvas=document.createElement('canvas');canvas.width=750;canvas.height=410;var c=canvas.getContext('2d');
 if(index===0){basePose(c,0);}
 else if(index===1){basePose(c,1);bag(c);}
 else if(index===2){board(c,410,330,310,12,-.08,true);basePose(c,2);bag(c);}
 else if(index>=3&&index<=7){
  var fullness=Math.min(1,(index-2)/5),up=index%2;
  board(c,435,333,350,24+fullness*50,-.025,false);
  basePose(c,index);
  pump(c,up?.16:.72);
  // Yellow motion arcs emphasize repeated pumping, not hand-like overlays.
  c.strokeStyle='#ffe27c';c.lineWidth=4;for(var s=0;s<2;s++){c.beginPath();c.arc(290,156,40+s*13,up?.9:1.8,up?2.35:3.25);c.stroke();}
 }
 else if(index===8){board(c,433,330,350,73,-.03,false);basePose(c,8);}
 else if(index===9){basePose(c,9);board(c,348,156,390,72,-.86,false);}
 else if(index===10){basePose(c,10);board(c,460,192,425,76,.27,false);}
 else {basePose(c,11);board(c,445,328,352,72,-.06,false);}
 return canvas;
}
function prepare(){if(SUP.ready)return;try{SUP.frames=Array.from({length:12},function(_,i){return sprite(i);});SUP.ready=true;}catch(e){console.warn('[T-Rex SUP] sprites unavailable',e);}}
assetReady.then(prepare).catch(function(){});
/* The illustrated 4x3 sprite sheet is stored as text to preserve its alpha over Pages.
   Decode once; the composited game sprites remain a visual fallback. */
fetch('assets/trex-sup-super-v1.b64?v=1').then(function(r){if(!r.ok)throw Error('SUP art '+r.status);return r.text();}).then(function(s){
 var art=new Image();art.onload=function(){if(art.naturalWidth&&art.naturalHeight)SUP.art=art;};
 art.onerror=function(){console.warn('[T-Rex SUP] illustrated sheet could not decode');};
 art.src='data:image/webp;base64,'+s.replace(/\s/g,'');
}).catch(function(err){console.warn('[T-Rex SUP] original sprite fallback',err);});
function hitNow(){
 if(SUP.landed)return;SUP.landed=true;
 var a=SUP.actor,b=SUP.victim;
 if(!b){SUP.miss=true;sfx('release');return;}
 var dist=Math.abs(a.x-b.x),canReach=dist<=490&&b.invuln<=0;
 if(!canReach){SUP.miss=true;sfx('release');return;}
 SUP.blocked=!!(b.blocking&&guardCovers(b,'mid'));
 var damage=MAX_HP*(SUP.blocked?.045:.38);
 b.hp=clamp(b.hp-damage,0,MAX_HP);
 b.meter=clamp(b.meter+(SUP.blocked?9:18),0,100);
 b.x=clamp(b.x+a.dir*(SUP.blocked?25:100),80,880);
 b.knockback=a.dir*(SUP.blocked?1:6);b.blocking=SUP.blocked;b.stun=SUP.blocked?0:65;b.blockstun=SUP.blocked?34:0;
 b.guardHit=SUP.blocked?22:0;b.hitRecoil=SUP.blocked?0:1;b.hitStrength=1.6;b.hitDirection=a.dir;b.hitHeight=1;
 b.parryWindow=0;b.attack=0;b.grabbed=false;b.grabbing=false;b.hit=true;
 a.connected=!SUP.blocked;a.hit=true;
 effects.push({x:b.x,y:235,t:30,burst:true,kind:-3,blocked:SUP.blocked});
 effects.push({x:b.x,y:150,t:48,text:SUP.blocked?'¡BLOQUEADO!':'¡TABLAZO!',color:SUP.blocked?'#b7e9ff':'#ffec56'});
 shake=Math.max(shake,21);sfx(SUP.blocked?'guard':'hit',{intensity:1.8});haptic(SUP.blocked?32:90);
 if(b===enemy&&!SUP.blocked&&!practice)score+=Math.round(damage*18);
}
function tick(dt){
 if(!SUP.active)return;SUP.age=Math.min(SUP.length,SUP.age+dt);
 var t=SUP.age,a=SUP.actor;
 a.attack=Math.max(0,SUP.length-t);
 if(t>=43&&t<125&&Math.floor(t/13)!==Math.floor((t-dt)/13))sfx('step',{intensity:.35});
 if(t>=134&&!SUP.voice){SUP.voice=true;audio.playVoice(1);sfx('special',{id:1});}
 if(t>=169&&!SUP.landed)hitNow();
 if(t>=SUP.length){var dead=SUP.victim&&SUP.victim.hp<=0,win=SUP.actor===player;reset();a.attack=0;a.attackType='';a.ex=false;a.invuln=0;if(dead)finish(win);}
 oldHud();
}
update=function(dt){if(SUP.active){tick(dt);return;}return oldUpdate.apply(this,arguments);};
function visualIndex(t){
 if(t<15)return 0;if(t<32)return 1;if(t<44)return 2;
 if(t<124)return 3+Math.min(4,Math.floor((t-44)/16));
 if(t<138)return 8;if(t<151)return 9;if(t<179)return 10;return 11;
}
function drawText(c,line,size,y,color){
 c.save();c.textAlign='center';c.textBaseline='middle';c.font='italic 900 '+size+'px system-ui';c.lineJoin='round';c.strokeStyle='#06142c';c.lineWidth=size>38?9:6;c.strokeText(line,480,y);c.fillStyle=color;c.fillText(line,480,y);c.restore();
}
function cinematic(){
 if(!SUP.ready)prepare();if(!SUP.ready)return;
 var t=SUP.age,actor=SUP.actor,victim=SUP.victim;
 ctx.save();ctx.fillStyle='#041429ec';ctx.fillRect(0,0,960,540);
 var bg=ctx.createRadialGradient(370,220,35,480,250,620);
 bg.addColorStop(0,t>155?'#35dceb':'#096b87');bg.addColorStop(.55,'#073b5e');bg.addColorStop(1,'#130a34');ctx.fillStyle=bg;ctx.fillRect(0,0,960,540);
 ctx.save();ctx.globalAlpha=.20;ctx.strokeStyle='#4bdbef';ctx.lineWidth=3;
 for(var i=0;i<22;i++){var off=(i*87+t*3)%1120;ctx.beginPath();ctx.moveTo(off-140,510);ctx.lineTo(off+200,60);ctx.stroke();}ctx.restore();
 ctx.fillStyle='#06152a';ctx.fillRect(0,463,960,77);
 ctx.strokeStyle='#f7e78c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,463);ctx.lineTo(960,463);ctx.stroke();
 if(victim&&t>110){
  var targetId=victim.id,m=atlasMap[targetId],sx=770;
  ctx.save();ctx.translate(sx,467);ctx.scale(-1,1);
  var victimPose=t>=169&&!SUP.miss&&!SUP.blocked?5:0;
  SpriteAtlas.draw(ctx,t>=169&&!SUP.miss?actionAtlases[actionMap[targetId][0]]:atlases[m[0]],t>=169&&!SUP.miss?actionMap[targetId][1]:m[1],victimPose,0,0,275);
  ctx.restore();
 }
 var idx=visualIndex(t),cam= t<15?1.16:t>=150&&t<190?1.09:.91;
 var wiggle=t>=169&&t<188?Math.sin(t*5)*Math.max(0,17-(t-169)):0;
 var bx=t<120?265:t<151?270:310+Math.min(1,(t-151)/18)*225;
 ctx.save();ctx.translate(bx+wiggle,464);ctx.scale(cam,cam);
 if(SUP.art&&SUP.art.complete&&SUP.art.naturalWidth>0){
  var sheet=SUP.art,cw=sheet.naturalWidth/4,ch=sheet.naturalHeight/3;
  ctx.drawImage(sheet,idx%4*cw,Math.floor(idx/4)*ch,cw,ch,-200,-355,400,400);
 }else ctx.drawImage(SUP.frames[idx],-210,-374);
 ctx.restore();
 if(t>=145&&t<190){ctx.save();ctx.globalAlpha=t<169?.5:Math.max(0,(188-t)/19);ctx.strokeStyle='#fff7b1';ctx.lineWidth=15;for(var a=0;a<5;a++){ctx.beginPath();ctx.arc(420,260,120+a*20,-1.15,.52);ctx.stroke()}ctx.restore();}
 if(t>=169&&t<184){ctx.fillStyle='rgba(255,255,255,'+(Math.max(0,(184-t)/15)*.70)+')';ctx.fillRect(0,0,960,540);}
 ctx.fillStyle='#060c22';ctx.fillRect(0,0,960,42);ctx.fillRect(0,496,960,44);
 ctx.fillStyle='#ffeb91';ctx.font='900 20px system-ui';ctx.textAlign='left';ctx.fillText('T-REX  /  ULTRA EX',30,29);
 ctx.textAlign='right';ctx.fillText('SUP REMATE',930,29);
 var caption=t<22?'¡SE VIENE UNA MUY GORDA!':t<44?'SACANDO LA TABLA...':t<124?'¡A INFLAR, WACHO!':t<149?'¡15 PSI DE BRONCA!':t<169?'¡TABLAZO SUPREMO!':SUP.miss?'¡NO LE DIO!':SUP.blocked?'¡LO BLOQUEÓ!':'¡PLOOOF!';
 drawText(ctx,caption,t<149?38:47,83,'#fff0a0');
 if(t>=44&&t<124){var air=(t-44)/80;round(ctx,380,438,260,12,6,'#0e2545','#d9ffff');round(ctx,382,440,256*air,8,4,'#20f6c4');ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.font='900 17px system-ui';ctx.fillText(Math.floor(air*15)+' PSI',510,425);}
 ctx.restore();
}
draw=function(){oldDraw.apply(this,arguments);if(SUP.active)cinematic();};
updateHud=function(){oldHud.apply(this,arguments);if(!player)return;var ready=player.id===1&&(practice||player.meter>=100)&&player.cool<=0&&!SUP.active;
 var btn=document.querySelector('[data-key=special]');if(btn){btn.classList.toggle('trex-super-ready',ready);if(ready){var small=btn.querySelector('small');if(small)small.textContent='SÚPER EX';btn.setAttribute('aria-label','Súper EX T-Rex: inflar tabla y golpear');}}
 if(ready&&$('cool'))$('cool').textContent='¡EX LLENO! ○ / L / ESPACIO = SUPREMO';
};
var css=document.createElement('style');css.textContent='.trex-super-ready{box-shadow:0 0 18px 5px #3df9e9,inset 0 0 14px #fff0a1!important;outline:3px solid #ffe954!important;animation:trexPulse .9s ease-in-out infinite alternate}@keyframes trexPulse{from{filter:brightness(1)}to{filter:brightness(1.45)}}';document.head.appendChild(css);
})();