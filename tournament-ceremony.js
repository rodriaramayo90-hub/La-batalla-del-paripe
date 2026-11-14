/* Calle Derrota 2.0 - cinemática animada con sprites de cuerpo completo del juego. */
(function () {
  'use strict';
  const WIDTH = 1280, HEIGHT = 720;
  let running = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = v => 1 - Math.pow(1 - clamp(v, 0, 1), 3);
  const smooth = v => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  const escapeText = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function setup() {
    let root = document.getElementById('paripe-ceremony');
    if (root) return root;
    const style = document.createElement('style');
    style.id = 'paripe-ceremony-style';
    style.textContent = [
      '#paripe-ceremony{position:fixed;inset:0;z-index:99999;background:#140c29;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0;box-sizing:border-box;color:white}',
      '#paripe-ceremony[hidden]{display:none!important}',
      '#paripe-ceremony .ceremony-stage{position:relative;width:min(100vw,177.77778vh);height:min(100vh,56.25vw);aspect-ratio:16/9;max-width:100%;overflow:hidden;background:#271341;box-shadow:0 0 0 1px #ffffff22}',
      '#paripe-ceremony canvas{display:block;width:100%;height:100%;image-rendering:auto}',
      '#paripe-ceremony .ceremony-actions{position:absolute;left:0;right:0;bottom:1.3%;display:flex;align-items:center;justify-content:center;gap:1.5%;pointer-events:none}',
      '#paripe-ceremony .ceremony-actions button{pointer-events:auto;border:3px solid #ffffff;box-shadow:0 5px 0 #201020,0 9px 18px #140820bb;background:#ffdf34;color:#281536;border-radius:9px;font-weight:1000;font-family:inherit;font-size:clamp(12px,1.75vw,24px);padding:.35em 1.25em;min-height:36px;cursor:pointer;touch-action:manipulation}',
      '#paripe-ceremony .ceremony-actions button.secondary{background:#28173e;color:white;border-color:#c29fe3}',
      '#paripe-ceremony .ceremony-actions button:focus-visible{outline:4px solid #6dfad9;outline-offset:2px}',
      '#paripe-ceremony .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',
      '@media(max-height:500px){#paripe-ceremony .ceremony-actions button{font-size:clamp(11px,2.4vh,16px);min-height:27px;border-width:2px;padding:.2em .9em}}'
    ].join('\n');
    document.head.append(style);
    root = document.createElement('section');
    root.id = 'paripe-ceremony';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Celebración de Calle Derrota');
    root.innerHTML = '<div class="ceremony-stage"><canvas width="1280" height="720" aria-label="Escena animada: todos los participantes aplauden al campeón levantando la copa en Calle Derrota"></canvas>' +
      '<div class="ceremony-actions"><button type="button" id="ceremony-continue">VER LLAVE →</button><button type="button" class="secondary" id="ceremony-menu">MENÚ</button></div></div>' +
      '<p class="sr-only" id="ceremony-a11y"></p>';
    document.body.append(root);
    return root;
  }

  function stop() {
    if (!running) {
      const node = document.getElementById('paripe-ceremony');
      if (node) node.hidden = true;
      return;
    }
    const scene = running;
    running = null;
    cancelAnimationFrame(scene.raf);
    scene.root.hidden = true;
  }
  window.hideTournamentCeremony = stop;

  function rect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  }
  function round(c, x, y, w, h, radius, color, stroke, strokeWidth) {
    c.beginPath();
    c.roundRect(x, y, w, h, radius);
    c.fillStyle = color;
    c.fill();
    if (stroke) {
      c.lineWidth = strokeWidth || 2;
      c.strokeStyle = stroke;
      c.stroke();
    }
  }
  function text(c, value, x, y, font, color, strokeColor, strokeWidth) {
    c.font = font;
    c.textAlign = 'center';
    c.lineJoin = 'round';
    if (strokeColor) {
      c.lineWidth = strokeWidth || 5;
      c.strokeStyle = strokeColor;
      c.strokeText(value, x, y);
    }
    c.fillStyle = color;
    c.fillText(value, x, y);
  }

  function streetSign(c) {
    // Cartel vial con poste: está físicamente en la acera derecha.
    // Su base toca el pavimento en (1046, 507), detrás de los espectadores.
    c.save();
    const px=1046, ground=506;
    c.fillStyle='#130b25a0';c.beginPath();c.ellipse(px+18,ground+5,56,10,-.22,0,Math.PI*2);c.fill();
    const metal=c.createLinearGradient(px-7,0,px+8,0);
    metal.addColorStop(0,'#5d6476');metal.addColorStop(.45,'#e1e3ec');metal.addColorStop(1,'#536278');
    round(c,px-7,284,14,224,4,metal,'#344254',2);
    round(c,px-13,499,28,10,3,'#485161','#25283a',2);
    c.translate(px,280);
    c.rotate(-.045);
    c.shadowColor='#18102099';c.shadowBlur=12;c.shadowOffsetY=6;
    const plaque=c.createLinearGradient(-178,-44,111,20);
    plaque.addColorStop(0,'#17675f');plaque.addColorStop(.6,'#217f74');plaque.addColorStop(1,'#12504d');
    round(c,-183,-43,292,83,9,plaque,'#f4f3e6',6);
    c.shadowBlur=0;c.shadowOffsetY=0;
    round(c,-174,-34,274,65,4,'#206d66','#7fb5a7',1.5);
    for(const x of [-162,88]){
      c.fillStyle='#d5ddd6';c.beginPath();c.arc(x,-1,3.5,0,Math.PI*2);c.fill();
    }
    text(c,'CALLE DERROTA',-39,10,'900 28px system-ui,Arial','#fffdf1','#134941',2);
    c.restore();
  }

  function background(c, seconds) {
    const sky = c.createLinearGradient(0, 0, 0, 570);
    sky.addColorStop(0, '#170a35');
    sky.addColorStop(.52, '#77338c');
    sky.addColorStop(1, '#f58c71');
    rect(c, 0, 0, WIDTH, HEIGHT, sky);

    // Edificios y escaparates: la ceremonia ocurre en una calle, no en la pantalla del selector.
    for (let side = 0; side < 2; side++) {
      const flip = side ? -1 : 1;
      c.save();
      if (side) { c.translate(WIDTH, 0); c.scale(-1, 1); }
      const buildings = [
        {x:-35,y:153,w:168,h:312,color:'#3b2454'},
        {x:129,y:207,w:144,h:258,color:'#503054'},
        {x:265,y:260,w:137,h:205,color:'#693c59'},
        {x:378,y:310,w:98,h:155,color:'#92526a'}
      ];
      buildings.forEach((b, j) => {
        rect(c,b.x,b.y,b.w,b.h,b.color);
        rect(c,b.x,b.y, b.w, 12, j%2?'#d27e82':'#a3609a');
        for (let yy=b.y+29; yy<b.y+b.h-30; yy+=68) {
          for (let xx=b.x+20; xx<b.x+b.w-20; xx+=53) {
            round(c,xx,yy,26,37,3,(Math.round(xx+yy+side)%3)?'#f7bb72':'#30244e','#281b39',3);
            rect(c,xx+11,yy,4,37,'#382245');
          }
        }
      });
      c.restore();
    }
    // Una perspectiva única: todas las fachadas llegan a la misma
    // línea de suelo (y=465) desde la que empieza la calzada.
    rect(c,0,465,WIDTH,255,'#996783');
    c.beginPath();c.moveTo(0,465);c.lineTo(480,465);
    c.lineTo(215,720);c.lineTo(0,720);c.closePath();
    c.fillStyle='#816b87';c.fill();
    c.beginPath();c.moveTo(800,465);c.lineTo(1280,465);
    c.lineTo(1280,720);c.lineTo(1065,720);c.closePath();
    c.fillStyle='#816b87';c.fill();
    // Carretera conectada exactamente al pie de los edificios laterales.
    c.beginPath();c.moveTo(480,465);c.lineTo(800,465);
    c.lineTo(1065,720);c.lineTo(215,720);c.closePath();
    const asphalt=c.createLinearGradient(0,465,0,720);
    asphalt.addColorStop(0,'#44374f');asphalt.addColorStop(1,'#302c48');
    c.fillStyle=asphalt;c.fill();
    // Bordes de acera y profundidad en la misma perspectiva.
    c.lineWidth=8;c.strokeStyle='#e8c794';
    c.beginPath();c.moveTo(215,720);c.lineTo(480,465);
    c.moveTo(1065,720);c.lineTo(800,465);c.stroke();
    c.strokeStyle='#3d294b';c.lineWidth=2;
    for(const side of [-1,1]){
      for(let i=1;i<6;i++){
        const y=465+Math.pow(i/5,1.75)*255;
        const edge=640+side*(160+(y-465)*265/255);
        c.beginPath();c.moveTo(edge+side*9,y);c.lineTo(side<0?0:1280,y);
        c.globalAlpha=.12;c.stroke();c.globalAlpha=1;
      }
    }
    c.fillStyle='#f2d39888';
    for(let i=0;i<4;i++){
      const z=(i+1)/4,y=465+z*z*220,w=3+z*11;
      c.beginPath();c.moveTo(640-w,y);c.lineTo(640+w,y);
      c.lineTo(640+w*1.2,y+3+z*8);c.lineTo(640-w*1.2,y+3+z*8);
      c.closePath();c.fill();
    }

    // Guirnaldas de farolas y banderines.
    c.strokeStyle='#211732';c.lineWidth=5;c.beginPath();c.moveTo(0,193);c.quadraticCurveTo(640,320,1280,193);c.stroke();
    for(let i=0;i<16;i++){
      const x=i*87-15, k=x/WIDTH, y=193+126*(1-Math.pow(2*k-1,2));
      c.fillStyle=['#ffdf4c','#75e5cf','#ee7ac6'][i%3];
      c.beginPath();c.moveTo(x,y);c.lineTo(x+21,y+2);c.lineTo(x+10,y+34);c.closePath();c.fill();
    }
    for (const x of [86,1194]) {
      round(c,x-9,297,18,231,5,'#272037','#a48f9d',3);
      c.save();c.shadowColor='#ffd69c';c.shadowBlur=25;
      round(c,x-22,288,44,32,7,'#ffe0a1','#3b2438',5);c.restore();
    }
    streetSign(c);
    // La cabecera es información de campeonato, no el nombre de la calle.
    if(seconds>4.2){
      c.save();c.globalAlpha=smooth((seconds-4.2)/.9);
      text(c,'¡CAMPEÓN DEL PARIPÉ!',640,103,'1000 52px system-ui,Arial','#fff0a8','#351541',8);
      c.restore();
    }
  }

  function podium(c, y, entrant) {
    // Madera maciza con superficie en perspectiva, tablones, vetas y herrajes.
    const left=510,w=260,h=127;
    c.save();
    c.shadowColor='#110c1bb0';c.shadowBlur=24;c.shadowOffsetY=11;
    c.beginPath();c.moveTo(left-16,y+5);c.lineTo(left+13,y-15);
    c.lineTo(left+w-13,y-15);c.lineTo(left+w+16,y+5);
    c.closePath();c.fillStyle='#b87a46';c.fill();c.strokeStyle='#efc38a';c.lineWidth=4;c.stroke();
    const wood=c.createLinearGradient(left,y,left+w,y+h);
    wood.addColorStop(0,'#784321');wood.addColorStop(.24,'#bf8145');
    wood.addColorStop(.62,'#98602f');wood.addColorStop(1,'#5f331b');
    round(c,left,y+3,w,h,8,wood,'#4b291c',6);
    c.shadowBlur=0;c.shadowOffsetY=0;
    // Planchas horizontales y juntas con profundidad.
    for(let row=0;row<4;row++){
      const yy=y+8+row*29;
      rect(c,left+8,yy,w-16,2,'#4e2a1ca8');
      rect(c,left+9,yy+4,w-18,1,'#e9b77388');
    }
    // Vetas orgánicas, sin una textura de franjas uniformes.
    for(let j=0;j<20;j++){
      const yy=y+12+j*5.8, x=left+13+(j*71)%43;
      c.beginPath();c.moveTo(x,yy);
      c.bezierCurveTo(x+35,yy-7,x+95,yy+7,x+190+(j%3)*7,yy-1);
      c.strokeStyle=j%3===0?'#e6b27444':'#42200f55';
      c.lineWidth=j%4===0?2.1:1.1;c.stroke();
    }
    for(const xx of [left+12,left+w-12]){
      for(const yy of [y+17,y+43,y+75,y+108]){
        c.beginPath();c.arc(xx,yy,2.4,0,Math.PI*2);
        c.fillStyle='#e5ba76';c.fill();c.strokeStyle='#573c26';c.lineWidth=1;c.stroke();
      }
    }
    // Número tallado y plaquita del campeón.
    text(c,'1',640,y+85,'1000 82px Georgia,serif','#ffe1a0','#3b1b0a',6);
    const label='J'+entrant.number+' · '+fighters[entrant.fighter][0];
    c.save();
    let fontsize=22;
    do{c.font='900 '+fontsize+'px system-ui,Arial';if(c.measureText(label).width<220)break;fontsize--;}while(fontsize>13);
    round(c,530,y+95,220,29,5,'#3e271b','#d8a468',2);
    text(c,label,640,y+116,'900 '+fontsize+'px system-ui,Arial','#fff1ca','#2b1309',2);
    c.restore();
    c.restore();
  }

  

  function avatar(c, entrant, x, footY, size, phase, direction) {
    const id = entrant.fighter;
    const k = id%4, sheet=Math.floor(id/4), row=Math.floor(k/2), col=(k%2)*3+phase;
    c.save();
    c.translate(x,footY);
    c.scale(direction,1);
    // Son los frames originales de victoria del combate, no fotos del selector.
    SpriteAtlas.draw(c,victorySheets[sheet],row,col,0,0,size);
    c.restore();
  }

  function nameplate(c, entrant, x, y, size) {
    const label='J'+entrant.number+' · '+fighters[entrant.fighter][0];
    c.save();let font=20;
    do {c.font='900 '+font+'px system-ui,Arial';if(c.measureText(label).width<=size+26)break;font--;} while(font>13);
    const width=Math.min(size+37,c.measureText(label).width+22);
    round(c,x-width/2,y-21,width,29,8,'#221233e8','#f8d89c88',2);
    text(c,label,x,y,'900 '+font+'px system-ui,Arial','#fff7dc','#241038',2);
    c.restore();
  }

  function confetti(c, seconds) {
    const t=seconds-4.1;if(t<=0)return;
    for(let i=0;i<92;i++){
      const speed=80+(i*47)%120;
      const start=((i*193)%840);
      const y=((t*speed + start)%900)-125;
      const x=((i*97)%1290)+25*Math.sin(t*1.2+i*.77);
      c.save();c.translate(x,y);c.rotate(t*2.4+i);
      c.fillStyle=['#ffe04b','#fd70b0','#68efdf','#fff5dc'][i%4];
      c.fillRect(-5,-4,10,8);c.restore();
    }
  }

  function spectators(scene, seconds) {
    const c=scene.ctx, entrants=scene.losers;
    const countLeft=Math.ceil(entrants.length/2);
    const left=entrants.slice(0,countLeft),right=entrants.slice(countLeft);
    const placed=[];
    [left,right].forEach((group,side)=>{
      group.forEach((entrant,i)=>{
        const n=group.length;
        // Excluimos una franja central para el podio.
        const near=side ? 870:410;
        const far=side ? 1180:100;
        const position=n===1?.5:i/(n-1);
        const target=near+(far-near)*(side?position:(1-position));
        const isBack=n>=4&&(i%2===0);
        const foot=isBack?543:589;
        const size=isBack?151:182;
        const time=seconds-(.15+i*.22+side*.09);
        const entry=ease(time/1.65);
        const x=(side?1390:-110)+(target-(side?1390:-110))*entry;
        placed.push({entrant,x,foot,size,side,index:i+side*4,entry});
      });
    });
    placed.sort((a,b)=>a.foot-b.foot);
    placed.forEach(p=>{
      if(p.entry<=0)return;
      const bob=(seconds>1.4?Math.sin(seconds*12.8+p.index*.9)*3:0);
      const phase=[0,1,2,1][Math.floor(seconds*4+p.index)%4];
      // Fotograma de cuerpo entero generado para este luchador (sin manos pegadas).
      const clapPhase=Math.floor(seconds*7.2+p.index*1.3)%4;
      CeremonySpriteAtlas.draw(c,p.entrant.fighter,'clap',p.x,p.foot+bob,p.size,clapPhase,p.side?-1:1);
      nameplate(c,p.entrant,p.x,p.foot+30,p.size);
    });
  }

  function paint(scene, seconds) {
    const c=scene.ctx;c.clearRect(0,0,WIDTH,HEIGHT);
    background(c,seconds);
    spectators(scene,seconds);
    const top=506;
    const move=ease((seconds-1.9)/1.1);
    const podiumY=top+(1-move)*260;
    podium(c,podiumY,scene.winner);
    if(move>.01){
      const jump=seconds>4.8?Math.abs(Math.sin(seconds*3.7))*6:0;
      const foot=podiumY+8-jump;
      // La copa y sus manos ya son parte del fotograma completo.
      // Pose de espera -> elevación -> trofeo sostenido: ningún trazo artificial.
      const age=seconds-2.05;
      const phase=age<.85?0:(Math.floor((age-.85)*2.4)%3===2?2:1);
      CeremonySpriteAtlas.draw(c,scene.winner.fighter,'winner',640,foot,292,phase,1);
    }
    confetti(c,seconds);
  }

  function pollPad(scene) {
    if(typeof navigator.getGamepads!=='function')return;
    const pads=Array.from(navigator.getGamepads()||[]).filter(Boolean);
    const current=[];
    pads.forEach((pad,i)=>{
      const confirm=!!(pad.buttons[0]?.pressed||pad.buttons[9]?.pressed);
      const back=!!pad.buttons[1]?.pressed;
      if(confirm&&!scene.padPrev[i]?.confirm)document.getElementById('ceremony-continue')?.click();
      else if(back&&!scene.padPrev[i]?.back)document.getElementById('ceremony-menu')?.click();
      current[i]={confirm,back};
    });
    scene.padPrev=current;
  }

  window.showTournamentCeremony=function () {
    const state=typeof TOURNAMENT!=='undefined'?TOURNAMENT:null;
    if(!state?.champion){showTournamentBracket();return;}
    stop();
    const root=setup();
    const entrants=state.entrants||state.rounds[0].flatMap(m=>m.players.filter(Boolean));
    const losers=entrants.filter(e=>e.number!==state.champion.number);
    CeremonySpriteAtlas.prewarm(entrants,state.champion);
    const ctx=root.querySelector('canvas').getContext('2d');
    if(!ctx){showTournamentBracket();return;}
    // Desconectar el combate anterior, para no dibujar ni escuchar la pelea bajo la cinemática.
    leaveLocal();
    audio.stopMusic();
    show('tournament-screen');
    state.phase='ceremony';
    root.hidden=false;
    root.querySelector('#ceremony-a11y').textContent='Campeón: '+fighters[state.champion.fighter][0]+'. Los otros '+losers.length+' participantes aplauden en Calle Derrota.';
    const connectedPads=typeof navigator.getGamepads==='function'?Array.from(navigator.getGamepads()||[]).filter(Boolean):[];
    const padPrev=connectedPads.map(pad=>({confirm:!!(pad.buttons[0]?.pressed||pad.buttons[9]?.pressed),back:!!pad.buttons[1]?.pressed}));
    const scene={root,ctx,winner:state.champion,losers,raf:0,start:0,lastDraw:0,padPrev};
    running=scene;
    document.getElementById('ceremony-continue').onclick=()=>{
      if(running!==scene)return;
      stop();showTournamentBracket();
    };
    document.getElementById('ceremony-menu').onclick=()=>{
      if(running!==scene)return;
      stop();goMenu();
    };
    const loop=now=>{
      if(running!==scene)return;
      if(!scene.start)scene.start=now;
      if(now-scene.lastDraw>28){paint(scene,(now-scene.start)/1000);scene.lastDraw=now;}
      pollPad(scene);
      if(running===scene)scene.raf=requestAnimationFrame(loop);
    };
    scene.raf=requestAnimationFrame(loop);
    root.querySelector('#ceremony-continue').focus({preventScroll:true});
    try{sfx('win');}catch(_){}
  };
})();