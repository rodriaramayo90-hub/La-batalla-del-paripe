(function florAirportPropsV2(){
'use strict';
const old=window.FLOR_AIRPORT_ART;
if(!old)throw Error('Missing Flor art');
const cached=new Map(),easing=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
function sprite(key,source){
 if(cached.has(key))return cached.get(key);
 const node={ready:false,img:null};cached.set(key,node);
 if(typeof Image!=='undefined'){
  try{
   const img=new Image();
   img.onload=()=>{node.ready=true;node.img=img};
   img.onerror=()=>{};
   img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source);
  }catch(_){}
 }
 return node;
}
const metal=`<defs><linearGradient id="frame" x2="1" y2="1"><stop stop-color="#b2d8e9"/><stop offset=".25" stop-color="#6793b4"/><stop offset=".72" stop-color="#2a4967"/><stop offset="1" stop-color="#142440"/></linearGradient><radialGradient id="light"><stop stop-color="#62ffec" stop-opacity=".85"/><stop offset="1" stop-color="#1b65a3" stop-opacity=".06"/></radialGradient></defs>`;
function scanner(ctx,t){
 const im=sprite('scanner',`<svg xmlns="http://www.w3.org/2000/svg" width="290" height="200" viewBox="0 0 290 200">
 ${metal}
 <rect x="11" y="13" width="268" height="170" rx="18" fill="url(#frame)" stroke="#0f1b34" stroke-width="10"/>
 <rect x="35" y="38" width="214" height="136" rx="9" fill="#132843" stroke="#bfdce8" stroke-width="8"/>
 <rect x="53" y="51" width="177" height="112" rx="5" fill="#081e39" stroke="#152744" stroke-width="7"/>
 <ellipse cx="145" cy="111" rx="84" ry="56" fill="url(#light)" opacity=".55"/>
 <g stroke="#48a9c1" opacity=".23" stroke-width="3"><path d="M56 74H225M56 98H225M56 122H225M56 145H225M89 54V159M130 54V159M171 54V159"/></g>
 <rect x="11" y="13" width="268" height="29" rx="9" fill="#203a57" stroke="#bdd7e5" stroke-width="5"/>
 <text x="145" y="32" font-family="Arial" font-size="16" font-weight="900" text-anchor="middle" fill="#d8fbff">X-RAY / KONTROLLE</text>
 <circle cx="256" cy="177" r="6" fill="#80ffdd"/>
 </svg>`);
 if(!im.ready){old.scanner(ctx,t);return;}
 ctx.drawImage(im.img,553,282,225,147);
 ctx.save();ctx.globalAlpha=.13+.22*Math.sin(t*.2)**2;
 ctx.fillStyle='#a5fff4';ctx.fillRect(609+(t%100)*.3,317,10,78);ctx.restore();
}
function conveyor(ctx,t){
 const gradient=ctx.createLinearGradient(380,409,900,520);
 gradient.addColorStop(0,'#1b2c47');gradient.addColorStop(.4,'#567b9b');gradient.addColorStop(1,'#0b172a');
 ctx.save();ctx.shadowColor='#080c22';ctx.shadowBlur=15;ctx.shadowOffsetY=9;
 ctx.beginPath();ctx.roundRect(380,404,607,68,11);
 ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle='#101b31';ctx.lineWidth=7;ctx.stroke();
 ctx.restore();
 const rollers=ctx.createLinearGradient(0,420,0,456);
 rollers.addColorStop(0,'#aacbdf');rollers.addColorStop(.4,'#283f57');rollers.addColorStop(1,'#0a1c2f');
 ctx.fillStyle=rollers;ctx.fillRect(389,416,570,35);
 ctx.save();ctx.beginPath();ctx.rect(390,417,565,33);ctx.clip();
 for(let i=0;i<24;i++){
  const x=385+((i*29+t*1.7)%590);
  ctx.strokeStyle=i%3?'#8aa5bd':'#d7eaf1';
  ctx.lineWidth=i%3?5:3;ctx.beginPath();ctx.moveTo(x,419);ctx.lineTo(x-7,451);ctx.stroke();
 }
 ctx.restore();
 ctx.strokeStyle='#e2f1f7';ctx.lineWidth=5;
 ctx.beginPath();ctx.moveTo(389,414);ctx.lineTo(954,414);ctx.stroke();
 ctx.fillStyle='#283e55';for(let i=0;i<7;i++){
  const x=410+i*85;ctx.fillRect(x,468,14,41);
  ctx.beginPath();ctx.ellipse(x+7,505,17,5,0,0,Math.PI*2);ctx.fill();
 }
}
function passport(ctx,x,y,s=1){
 const im=sprite('passport',`<svg xmlns="http://www.w3.org/2000/svg" width="165" height="210" viewBox="0 0 165 210">
  <defs><linearGradient id="ruby" x2="1" y2="1"><stop stop-color="#b82c4e"/><stop offset=".5" stop-color="#64223c"/><stop offset="1" stop-color="#321c34"/></linearGradient></defs>
  <rect x="16" y="6" width="134" height="198" rx="17" fill="url(#ruby)" stroke="#24132e" stroke-width="9"/>
  <rect x="27" y="16" width="112" height="180" rx="10" fill="none" stroke="#d7a86d" stroke-width="3"/>
  <path d="M76 45H90V94H76Z M59 64H107V76H59Z" fill="#edc68d"/>
  <ellipse cx="83" cy="120" rx="28" ry="21" fill="none" stroke="#d8a878" stroke-width="3"/>
  <path d="M55 120H111M83 99Q62 122 83 141Q105 122 83 99Z" fill="none" stroke="#d8a878" stroke-width="2"/>
  <text x="83" y="172" font-size="16" font-weight="900" font-family="Arial" fill="#e7c894" text-anchor="middle">PASSPORT</text>
  </svg>`);
 if(!im.ready){old.passport(ctx,x,y,s);return;}
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(-.08);
 ctx.drawImage(im.img,-56,-78,112,156);ctx.restore();
}
const props=[
 ['perfume',453,283,88,102,`<rect x="21" y="32" width="61" height="65" rx="11" fill="#f3a5cc" stroke="#50264f" stroke-width="6"/><path d="M36 29V11H66V29Z" fill="#f7e4bf" stroke="#4a3050" stroke-width="5"/><path d="M33 59Q57 42 73 59" stroke="#fff5f9" stroke-width="7" fill="none"/><circle cx="51" cy="74" r="9" fill="#cb568b"/>`],
 ['dryer',538,262,103,103,`<path d="M15 35Q15 16 43 20L82 26Q103 33 88 63L49 68L38 85H22L28 63Q12 56 15 35Z" fill="#a5a7e6" stroke="#323153" stroke-width="7"/><path d="M77 26Q97 27 93 47L77 53Z" fill="#e6ebff"/><path d="M23 70H40" stroke="#404a76" stroke-width="9"/>`],
 ['fernet',607,284,72,113,`<path d="M31 9H55V23L61 40V100H23V40L31 23Z" fill="#56352c" stroke="#271e2c" stroke-width="7"/><path d="M27 48H58V84H27Z" fill="#eedfa4" stroke="#38283b" stroke-width="4"/><text x="43" y="68" text-anchor="middle" fill="#35212f" font-size="12" font-weight="900" font-family="Arial">F</text><path d="M28 15H57" stroke="#b09b78" stroke-width="6"/>`],
 ['cheese',667,302,105,90,`<path d="M12 69L25 28L94 39L87 77Z" fill="#f7d46c" stroke="#bc892e" stroke-width="7"/><path d="M25 28L43 13L96 26L94 39Z" fill="#fff5ad" stroke="#bc892e" stroke-width="6"/><g fill="#e6b24e"><circle cx="45" cy="54" r="10"/><circle cx="78" cy="57" r="7"/><circle cx="61" cy="37" r="5"/></g>`]
];
const propSprites=props.map(([name,,, , ,body])=>sprite('prop-'+name,`<svg xmlns="http://www.w3.org/2000/svg" width="115" height="118" viewBox="0 0 115 118">${body}</svg>`));
function confiscated(ctx,t){
 if(props.some((p,i)=>t>=84+i*9&&!propSprites[i].ready)){old.confiscated(ctx,t);return;}
 for(let i=0;i<props.length;i++){
  const [name,x,y,w,h]=props[i];
  const p=Math.max(0,Math.min(1,(t-84-i*9)/18));if(p===0)continue;
  ctx.save();ctx.globalAlpha=p;ctx.translate(x,y-(1-easing(p))*100);ctx.rotate(Math.sin(t*.05+i)*.04);
  ctx.drawImage(propSprites[i].img,-w/2,-h,w,h);ctx.restore();
 }
}
window.FLOR_AIRPORT_ART=Object.freeze({...old,scanner,conveyor,passport,confiscated,propsVersion:2,
 get illustratedOfficersReady(){return old.illustratedOfficersReady;},
 get illustratedBackgroundReady(){return old.illustratedBackgroundReady;},
 get policeSpritesReady(){return old.policeSpritesReady;},
 get backgroundReady(){return old.backgroundReady;}
});
})();