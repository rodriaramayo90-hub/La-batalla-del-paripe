/* Living scenery stays behind the fighters and never changes combat geometry. */
const STAGES=[
 {name:'Torre de hercules',src:'assets/bg0.jpg',motion:'sea',water:[[[1105,315],[1400,315],[1400,410],[1270,408],[1200,380],[1160,367],[1138,344]],[[470,440],[620,419],[700,451],[795,414],[850,426],[900,397],[977,400],[1020,370],[1106,374],[1171,403],[1250,414],[1250,465],[490,465]]]},
 {name:'Plaza Maria Pita',src:'assets/pita-v52.webp',motion:'flags'},
 {name:'Playa de Orzan',src:'assets/bg2.jpg',motion:'sea',water:[[[392,345],[610,320],[1400,310],[1400,418],[1320,426],[1190,439],[1000,455],[700,437],[510,417],[394,389]]]},
 {name:'Terraza Majul',src:'assets/terraza-majul-v52.webp',motion:'gulls'}
];
let currentStage=0,lastStagePaint=-Infinity;
const SEA_PADDING=12;
const stageImages=STAGES.map(stage=>{const im=new Image();im.src=stage.src;return im;}),waterScenes=new Map();
function setStage(index){
 currentStage=((Math.trunc(Number(index)||0)%STAGES.length)+STAGES.length)%STAGES.length;
 lastStagePaint=-Infinity;
 const stage=STAGES[currentStage],bg=document.getElementById('bg'),name=document.getElementById('stage-name'),change=document.getElementById('change-stage');
 if(bg){if(bg.getAttribute('src')!==stage.src)bg.src=stage.src;bg.alt=stage.name;}
 if(name)name.textContent=stage.name;
 if(change)change.setAttribute('aria-label','Cambiar escenario. Actual: '+stage.name);
}
function onlineStageIndex(room){const seed=[...(room.code||'')].reduce((value,ch)=>(value*31+ch.charCodeAt(0))>>>0,0);return(seed+(room.round||1)-1)%STAGES.length;}
function stageCanvas(scale=1){const c=document.createElement('canvas');c.width=Math.round(960*scale);c.height=Math.round(540*scale);return c;}
function coverStage(c,im){const cw=c.canvas.width,ch=c.canvas.height,scale=Math.max(cw/im.naturalWidth,ch/im.naturalHeight),w=im.naturalWidth*scale,h=im.naturalHeight*scale;c.drawImage(im,(cw-w)/2,(ch-h)/2,w,h);}
function prepareWater(index){
 if(waterScenes.has(index))return waterScenes.get(index);const im=stageImages[index];if(!im.complete||!im.naturalWidth)return null;
 const source=stageCanvas(1.5),sc=source.getContext('2d');coverStage(sc,im);const analysis=stageCanvas(),ac=analysis.getContext('2d',{willReadFrequently:true});ac.drawImage(source,0,0,960,540);
 const mask=stageCanvas(),mc=mask.getContext('2d',{willReadFrequently:true});mc.fillStyle='white';
 for(const polygon of STAGES[index].water){mc.beginPath();polygon.forEach(([x,y],n)=>n?mc.lineTo(x*960/1400,y*540/788):mc.moveTo(x*960/1400,y*540/788));mc.closePath();mc.fill();}
 if(index===2)mc.clearRect(1325*960/1400,0,57*960/1400,450*540/788); // The lamp remains rigid.
 const region=mc.getImageData(0,0,960,540).data,photo=ac.getImageData(0,0,960,540).data,blue=new Uint8Array(960*540);
 for(let i=0;i<blue.length;i++){const j=i*4,r=photo[j],g=photo[j+1],b=photo[j+2];blue[i]=region[j+3]&&b>105&&g>65&&b>r*1.16&&g>r*1.08?1:0;}
 const pixels=mc.createImageData(960,540);let top=540,bottom=0;
 for(let y=0;y<540;y++)for(let x=0;x<960;x++){
  const i=y*960+x,j=i*4;if(!region[j+3])continue;let wet=blue[i];
  if(!wet&&Math.min(photo[j],photo[j+1],photo[j+2])>165){for(let d=1;d<=5&&!wet;d++)wet=(x>=d&&blue[i-d])||(x+d<960&&blue[i+d])||(y>=d&&blue[i-d*960])||(y+d<540&&blue[i+d*960]);}
  if(wet){pixels.data[j]=pixels.data[j+1]=pixels.data[j+2]=255;pixels.data[j+3]=255;top=Math.min(top,y);bottom=Math.max(bottom,y);}
 }
 mc.clearRect(0,0,960,540);mc.putImageData(pixels,0,0);
 analysis.width=analysis.height=0;const offset=Math.max(0,top-SEA_PADDING),height=Math.ceil((bottom+SEA_PADDING+1-offset)/2)*2,crop=document.createElement('canvas');crop.width=960;crop.height=height;crop.getContext('2d').drawImage(mask,0,offset,960,height,0,0,960,height);mask.width=mask.height=0;const surface=document.createElement('canvas');surface.width=1440;surface.height=height*1.5;const cache={source,mask:crop,surface,c:surface.getContext('2d'),top,bottom,offset};waterScenes.set(index,cache);return cache;
}
function drawSea(c,index,t){
 const water=prepareWater(index);if(!water)return;const x=water.c,scale=water.surface.width/960;x.clearRect(0,0,water.surface.width,water.surface.height);
 const displacement=y=>{
  const depth=Math.max(0,Math.min(1,(y-water.top)/(water.bottom-water.top||1)));
  const amplitude=.7+depth*1.4;
  const swell=t*2.1-y*.066;
  return {
   dx:amplitude*(4.6*Math.sin(swell)+.9*Math.sin(1.35*swell)),
   dy:amplitude*(3.25*Math.sin(swell+.65)+.7*Math.sin(1.4*swell))
  };
 };
 const overscan=SEA_PADDING*scale;
 for(let y=water.offset;y<water.offset+water.surface.height/scale;y+=3){
  const a=displacement(y),b=displacement(y+3);
  // Overscan keeps the shifted strips opaque at the edge of the screen.
  x.drawImage(water.source,0,y*scale,water.source.width,3*scale,
   a.dx*scale-overscan,(y+a.dy-water.offset)*scale,
   water.surface.width+2*overscan,(3.15+b.dy-a.dy)*scale);
 }
 x.globalCompositeOperation='destination-in';x.drawImage(water.mask,0,0,water.surface.width,water.surface.height);x.globalCompositeOperation='source-over';c.save();c.globalAlpha=.92;c.drawImage(water.surface,0,water.offset,960,water.surface.height/scale);c.restore();
}
const flagTextures=[];
function flagTexture(kind){
 if(flagTextures[kind])return flagTextures[kind];const surface=document.createElement('canvas');surface.width=96;surface.height=64;const c=surface.getContext('2d');
 if(kind===0){c.fillStyle='#fffbe8';c.fillRect(0,0,96,64);c.fillStyle='#50abe1';c.beginPath();c.moveTo(-10,0);c.lineTo(15,0);c.lineTo(106,64);c.lineTo(81,64);c.closePath();c.fill();c.fillStyle='#bc7630';c.fillRect(41,22,12,17);c.fillStyle='#e9c260';c.fillRect(38,19,18,4);c.fillStyle='#fff4cc';c.fillRect(46,25,3,10);}
 if(kind===1){c.fillStyle='#eac033';c.fillRect(0,0,96,64);c.fillStyle='#d83137';c.fillRect(0,0,96,16);c.fillRect(0,48,96,16);c.fillStyle='#8f293c';c.fillRect(26,25,12,16);c.fillStyle='#ebd5a6';c.fillRect(29,27,6,10);c.fillStyle='#ae6e22';c.fillRect(24,22,16,3);}
 if(kind===2){c.fillStyle='#214fa8';c.fillRect(0,0,96,64);c.fillStyle='#ffe16a';for(let n=0;n<12;n++){const a=n*Math.PI/6-Math.PI/2,x=48+Math.cos(a)*18,y=32+Math.sin(a)*18;c.beginPath();for(let k=0;k<10;k++){const q=k*Math.PI/5-Math.PI/2,r=k%2?1.3:3;c.lineTo(x+Math.cos(q)*r,y+Math.sin(q)*r);}c.closePath();c.fill();}}
 flagTextures[kind]=surface;return surface;
}
function drawFlag(c,kind,x,y,w,h,t){
 const texture=flagTexture(kind),phase=t*3.6+kind*1.9,cols=24,point=u=>({x:x+u*w*(.94+.055*Math.sin(t*.9+kind)),y:y+u*5+Math.sin(phase-u*6)*3.4*u});
 c.save();
 for(let n=0;n<cols;n++){const u=n/cols,next=(n+1)/cols,a=point(u),b=point(next),sw=texture.width/cols;c.save();c.transform((b.x-a.x)/sw,(b.y-a.y)/sw,0,1,a.x,a.y);c.drawImage(texture,n*sw,0,sw+.25,texture.height,0,0,sw+.25,h);c.fillStyle='rgba(12,30,58,'+(.08+.11*(1+Math.sin(phase-u*6))/2)+')';c.fillRect(0,0,sw+.25,h);c.restore();}
 c.strokeStyle='#253d5d';c.lineWidth=.75;c.beginPath();for(let n=0;n<=cols;n++){const p=point(n/cols);n?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);}for(let n=cols;n>=0;n--){const p=point(n/cols);c.lineTo(p.x,p.y+h);}c.closePath();c.stroke();c.restore();
}
function drawPitaFlags(c,t){drawFlag(c,0,444,210,35,25,t);drawFlag(c,1,508,213,36,25,t);drawFlag(c,2,571,214,28,25,t);}
function drawGull(c,x,y,size,t,seed,direction){
 const cycle=(t*.18+seed)%1,flap=cycle>.68?-.22:Math.sin(t*5.2+seed*10),tip=-3-flap*7;
 c.save();c.translate(x,y);c.scale(direction*size,size);c.rotate(Math.sin(t*.7+seed)*.08);c.lineJoin='round';c.strokeStyle='#494d61';c.lineWidth=.7;c.fillStyle='#f7f1e9';
 c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-5,-4,-11,tip-3,-17,tip);c.quadraticCurveTo(-10,tip+4,-3,2);c.lineTo(1,3);c.quadraticCurveTo(8,tip+4,17,tip+1);c.bezierCurveTo(12,tip-3,5,-4,0,0);c.closePath();c.fill();c.stroke();
 c.fillStyle='#48495c';c.beginPath();c.moveTo(-17,tip);c.lineTo(-11,tip+1);c.lineTo(-13,tip+3);c.closePath();c.fill();c.beginPath();c.moveTo(17,tip+1);c.lineTo(11,tip+2);c.lineTo(13,tip+4);c.closePath();c.fill();
 c.fillStyle='#fff9e8';c.beginPath();c.ellipse(0,1,4.5,1.7,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#e1ad47';c.beginPath();c.moveTo(4,0);c.lineTo(7,1);c.lineTo(4,2);c.fill();c.restore();
}
function drawTerraceGulls(c,t){
 for(let n=0;n<7;n++){const direction=n%3===0?-1:1,speed=19+n*3.6,travel=(t*speed+n*173)%1120,x=direction>0?travel-80:1040-travel,y=55+(n*31)%116+Math.sin(t*.3+n*2)*12;drawGull(c,x,y,.38+(n%3)*.19,t,n*.73,direction);}
}
function drawStageEnvironment(c,time=performance.now()/1000){
 const t=typeof reducedMotion!=='undefined'&&reducedMotion?0:time,stage=STAGES[currentStage];
 if(stage.motion==='sea')drawSea(c,currentStage,t);else if(stage.motion==='flags')drawPitaFlags(c,t);else if(stage.motion==='gulls')drawTerraceGulls(c,t);
}

// A separate high-resolution backdrop keeps the sea as crisp as the static art.
// Paint scenery at 30 Hz while the fight and inputs continue at 60 Hz.
function drawStageBackground(){
 const layer=document.getElementById('stage-canvas');if(!layer)return;const time=performance.now()/1000;if(time-lastStagePaint<1/30)return;lastStagePaint=time;
 const c=layer.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,layer.width,layer.height);c.setTransform(layer.width/960,0,0,layer.height/540,0,0);drawStageEnvironment(c,time);
}
