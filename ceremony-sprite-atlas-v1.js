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

  function compose(id,kind,step) {
    const frame=document.createElement('canvas');
    frame.width=W;frame.height=H;
    const c=frame.getContext('2d',{alpha:true});
    if(kind==='clap') {
      const already=ORIGINAL_CLAP_POSE[id];
      // Fotogramas ENTEROS del luchador: cierre / apertura / cierre / apertura.
      // La alternancia de guardia y recuperación mueve los brazos propios.
      if(already!==undefined && (step===0 || step===2)) victoryFrame(c,id,already);
      else actionFrame(c,id,[0,3,0,1][step%4]);
    } else {
      if(step===0) {
        victoryFrame(c,id,0);
      } else {
        bakeCup(c,id,step===2?.065:-.025);
        victoryFrame(c,id,WINNER_POSE[id]);
      }
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
    const scale=size/BODY;
    c.save();
    c.translate(x,foot);
    c.scale(dir*scale,scale);
    c.drawImage(img,-CX,-FOOT);
    c.restore();
  }

  function prewarm(entrants,champion) {
    const unique=new Set();
    for(const entrant of entrants||[]) {
      if(unique.has(entrant.number))continue;
      unique.add(entrant.number);
      const id=entrant.fighter;
      const isWinner=entrant.number===champion.number;
      const kind=isWinner?'winner':'clap';
      const frames=isWinner?3:4;
      for(let frame=0;frame<frames;frame++)sprite(id,kind,frame);
    }
  }
  window.CeremonySpriteAtlas={draw,prewarm,clear:()=>cache.clear(),get count(){return cache.size}};
})();