/* Fotogramas específicos para la cinemática de Calle Derrota.
   12 luchadores; dos secuencias por luchador: aplauso y copa.
   Cada fotograma es un sprite completo compuesto UNA SOLA VEZ,
   usando las ilustraciones originales de cuerpo entero del combate.
   No se dibujan manos, brazos ni articulaciones superpuestas en escena. */
(function () {
  'use strict';
  const W=360, H=470, CX=W/2, FOOT=458, BODY=320;
  const cache=new Map();

  // Anclajes de los puños elevados, medidos con el mismo sistema de coordenadas
  // anatómicas de las hojas de victoria originales (base 330).
  const GRIP=[
    [-61,-314],  // Alcahueta
    [-54,-313],  // T-Rex
    [-63,-314],  // Coqui
    [-57,-313],  // Lucas
    [-56,-309],  // Dr. Tostador
    [-62,-313],  // Dra. En Berga
    [-57,-310],  // La Drapie
    [89,-304],   // Flor Rubia: mano libre, no mano de la pala
    [65,-314],   // Bites
    [91,-306],   // Maléfica: mano libre, no mano del pincel
    [-57,-312],  // Lu
    [62,-273]    // Daf: puño junto a la cabeza
  ];
  const WINNER_POSE=[1,1,1,1,1,1,1,2,1,2,1,0];
  // En estos luchadores ya existen manos juntas reales, pintadas en el sprite.
  const ORIGINAL_CLAP_POSE={4:2,5:0,8:0,11:2};

  function victoryFrame(c,id,phase) {
    const n=id%4;
    SpriteAtlas.draw(c,victorySheets[Math.floor(id/4)],Math.floor(n/2),
                     (n%2)*3+phase,CX,FOOT,BODY);
  }

  function actionFrame(c,id,pose) {
    const [sheet,row]=actionMap[id];
    SpriteAtlas.draw(c,actionAtlases[sheet],row,pose,CX,FOOT,BODY);
  }

  // Copa dibujada detrás del puño ya existente. La mano del propio sprite
  // tapa la base: no se fabrican brazos falsos ni manos sintéticas.
  function bakeCup(c,id,tilt) {
    const [gx,gy]=GRIP[id];
    const ratio=BODY/330;
    const x=CX+gx*ratio,y=FOOT+gy*ratio;
    c.save();c.translate(x,y);c.rotate(tilt);
    c.lineWidth=5;c.lineCap='round';c.lineJoin='round';
    c.strokeStyle='#bb7716';
    // Asas laterales y copa, con empuñadura justo en el puño levantado.
    c.beginPath();c.arc(-24,-52,23,.44*Math.PI,1.59*Math.PI);c.stroke();
    c.beginPath();c.arc(24,-52,23,-.59*Math.PI,.59*Math.PI);c.stroke();
    const shine=c.createLinearGradient(-31,-88,31,-19);
    shine.addColorStop(0,'#ae5e0d');
    shine.addColorStop(.26,'#ffe88c');
    shine.addColorStop(.64,'#f8bb35');
    shine.addColorStop(1,'#9b5409');
    c.beginPath();c.moveTo(-34,-85);c.lineTo(34,-85);
    c.bezierCurveTo(28,-47,20,-28,4,-24);
    c.lineTo(-4,-24);c.bezierCurveTo(-20,-28,-28,-47,-34,-85);
    c.closePath();c.fillStyle=shine;c.fill();c.lineWidth=2.5;c.strokeStyle='#a96914';c.stroke();
    c.fillStyle='#fff4b2a9';c.beginPath();c.ellipse(-13,-64,5,14,-.2,0,Math.PI*2);c.fill();
    c.fillStyle='#ebaf30';c.fillRect(-5,-26,10,28);
    c.fillStyle='#f4cd60';c.fillRect(-21,0,42,6);
    c.fillStyle='#be8225';c.fillRect(-12,5,24,4);
    c.restore();
  }

  // Nuevas ilustraciones completas: palmas juntas y copa agarrada por la mano
  // dentro de la imagen. Primera hoja: luchadores 0..3; segunda: 4..7.
  const sheets=['assets/ceremony-new-a.png','assets/ceremony-new-b.png'].map(src=>{
    const im=new Image();im.src=src;return im;
  });
  let artworkReady=false, artworkFailed=false, preload=null;
  const CUT_W=384,CUT_H=512;

  function isPaper(data,p) {
    const r=data[p],g=data[p+1],b=data[p+2];
    return r>=225 && g>=225 && b>=225 && Math.max(r,g,b)-Math.min(r,g,b)<=24;
  }
  function removeWhiteCheckerboard(c) {
    // Solo el fondo conectado a los bordes: las batas y zapatos blancos
    // encerrados en la silueta no desaparecen.
    const image=c.getImageData(0,0,CUT_W,CUT_H),a=image.data;
    const total=CUT_W*CUT_H,seen=new Uint8Array(total);
    const stack=new Int32Array(total);let head=0,tail=0;
    const push=i=>{
      if(i<0||i>=total||seen[i]||!isPaper(a,i*4))return;
      seen[i]=1;stack[tail++]=i;
    };
    for(let x=0;x<CUT_W;x++){push(x);push((CUT_H-1)*CUT_W+x);}
    for(let y=0;y<CUT_H;y++){push(y*CUT_W);push(y*CUT_W+CUT_W-1);}
    while(head<tail){
      const i=stack[head++],x=i%CUT_W,y=(i/CUT_W)|0;
      a[i*4+3]=0;
      if(x>0)push(i-1);
      if(x<CUT_W-1)push(i+1);
      if(y>0)push(i-CUT_W);
      if(y<CUT_H-1)push(i+CUT_W);
    }
    c.putImageData(image,0,0);
  }

  function genuineFrame(id,kind,step){
    const sheet=id<4?0:1;
    const canvas=document.createElement('canvas');
    canvas.width=CUT_W;canvas.height=CUT_H;
    const c=canvas.getContext('2d',{willReadFrequently:true});
    const row=kind==='clap'||step===0?0:1;
    const x=(id%4)*CUT_W,y=row*CUT_H;
    c.drawImage(sheets[sheet],x,y,CUT_W,CUT_H,0,0,CUT_W,CUT_H);
    if(sheet===1)removeWhiteCheckerboard(c);
    return canvas;
  }

  function compose(id,kind,step) {
    if(id<8 && artworkReady)return genuineFrame(id,kind,step);
    // Conserva el arte original para 8..11 en vez de sustituir
    // sus caras o cuerpos por otro personaje.
    const frame=document.createElement('canvas');
    frame.width=W;frame.height=H;
    const c=frame.getContext('2d',{alpha:true});
    if(kind==='clap') {
      const already=ORIGINAL_CLAP_POSE[id];
      if(already!==undefined) victoryFrame(c,id,already);
      else victoryFrame(c,id,0);
    } else if(step===0){
      victoryFrame(c,id,0);
    } else {
      bakeCup(c,id,step===2?.065:-.025);
      victoryFrame(c,id,WINNER_POSE[id]);
    }
    return frame;
  }

    function sprite(id,kind,step) {
    id=Number(id);
    if(!Number.isInteger(id)||id<0||id>=fighters.length) return null;
    const total=kind==='clap'?4:3;
    step=((step%total)+total)%total;
    const key=id+':'+kind+':'+step;
    if(!cache.has(key))cache.set(key,compose(id,kind,step));
    return cache.get(key);
  }

  function draw(c,id,kind,x,foot,size,step,dir) {
    const img=sprite(id,kind,step);
    if(!img)return;
    const genuine=id<8 && artworkReady;
    const scale=genuine?size/CUT_H:size/BODY;
    c.save();
    c.translate(x,foot);
    const applausePulse=kind==='clap' && genuine ? 1+Math.sin(step*1.5708)*.016 : 1;
    c.scale(dir*scale*applausePulse,scale);
    c.drawImage(img,-img.width/2,-img.height);
    c.restore();
  }

  async function ensureImages(){
    if(artworkReady||artworkFailed)return;
    if(!preload)preload=Promise.all(sheets.map(im=>im.decode())).then(()=>{
      artworkReady=true;cache.clear();
    }).catch(err=>{artworkFailed=true;console.warn('Ceremony sprites unavailable',err);});
    await preload;
  }
  async function prewarm(entrants,champion) {
    await ensureImages();
    const unique=new Set();
    for(const entrant of entrants||[]) {
      if(unique.has(entrant.number))continue;
      unique.add(entrant.number);
      const id=entrant.fighter,kind=entrant.number===champion.number?'winner':'clap';
      const frames=kind==='winner'?3:4;
      for(let frame=0;frame<frames;frame++)sprite(id,kind,frame);
    }
  }
    window.CeremonySpriteAtlas={draw,prewarm,clear:()=>cache.clear(),get count(){return cache.size}};
})();