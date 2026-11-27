(function florAirportV2(){
'use strict';
const old=window.FLOR_AIRPORT_ART;
if(!old)throw Error('Load Flor airport v1 before v2');
const cache=new Map();
const E=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
const defs=`<defs>
<linearGradient id="coat" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#6f94b5"/><stop offset=".27" stop-color="#2a496e"/><stop offset=".69" stop-color="#172946"/><stop offset="1" stop-color="#09142a"/></linearGradient>
<linearGradient id="pants" x2="1" y2="1"><stop stop-color="#57738d"/><stop offset=".48" stop-color="#223650"/><stop offset="1" stop-color="#10192d"/></linearGradient>
<linearGradient id="face" x2=".8" y2="1"><stop stop-color="#ffe4ba"/><stop offset=".36" stop-color="#e0b092"/><stop offset=".72" stop-color="#bc816f"/><stop offset="1" stop-color="#774c53"/></linearGradient>
<linearGradient id="badge" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".47" stop-color="#b2c7d8"/><stop offset=".9" stop-color="#657d9b"/></linearGradient>
<radialGradient id="halo"><stop stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>`;
const O='stroke="#111a30" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"';
const D='stroke="#23354f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
function arm(pose,side){
 const right=side==='right';
 const pos=pose===1?(right?'M0 0Q12-30 28-68L31-146Q49-167 64-148L65-56L36 27Z':'M0 0L-26 72L-19 108Q-3 124 17 111L23 73L27 0Z'):
 pose===2?(right?'M0 0Q7 49 34 61L72 94Q92 105 99 84L68 38L34 0Z':'M0 0Q-25 34-7 69L35 103Q58 109 66 86L25 37L24 0Z'):
 pose===3||pose===7?(right?'M0 0Q-2 43 23 62L69 56Q91 47 84 26L35 14L29-1Z':'M0 0Q-9 40 14 57L75 67Q97 55 84 36L31 16L26-1Z'):
 pose===4?(right?'M0 0Q26 10 43 58L70 96Q90 106 103 89L73 41L32-1Z':'M0 0L-22 75L-14 112Q4 125 21 111L24 68L29 0Z'):
 pose===5?(right?'M0 0Q36-17 74-15L157-4Q180-10 173 13L78 23L29 13Z':'M0 0L-28 72L-20 108Q0 125 19 103L23 65L29 0Z'):
 pose===6?(right?'M0 0Q9-35 45-64L86-101Q105-110 112-93L67-37L30 0Z':'M0 0Q-12-34 25-64L63-104Q83-112 91-91L40-31L27 0Z'):
 pose===8?(right?'M0 0L-10 93L11 126Q25 141 43 124L29 68L29-1Z':'M0 0L-23 81L-19 113Q-1 129 16 111L26 71L29 0Z'):
 'M0 0Q-26 43-12 75L0 108Q18 120 33 104L34 68L30 0Z';
 const handY=pose===1&&right?-148:pose===2?87:pose===4&&right?93:pose===5&&right?7:pose===6?-94:102;
 return `<g transform="${right?'translate(255 191)':'translate(128 191) scale(-1 1)'}">
 <path d="${pos}" fill="url(#coat)" ${O}/>
 <path d="M5 8Q-4 40 4 72" fill="none" stroke="#8cb7d4" opacity=".58" stroke-width="5"/>
 <path d="M-5 5L35 9L35 32L-5 27Z" fill="#172944" stroke="#bfd3df" stroke-width="4"/>
 <ellipse cx="36" cy="${handY}" rx="14" ry="17" fill="url(#face)" ${D}/>
 </g>`;
}
function policeSVG(pose,variant){
 const female=variant===1;
 const face=female?`<path d="M142 78Q135 40 168 19Q214-2 245 35L251 96L236 169L159 166Z" fill="#3c2e49" ${O}/>
 <ellipse cx="196" cy="99" rx="60" ry="68" fill="url(#face)" ${O}/>
 <path d="M138 85Q132 35 191 20Q237 18 250 76Q207 69 190 51Q160 65 139 104Z" fill="#48354f" ${D}/>
 <path d="M234 125Q272 147 268 205Q253 214 245 194L217 157Z" fill="#382943" ${D}/>
 <path d="M157 111L175 105M210 105L232 102" stroke="#573649" stroke-width="8"/>
 <ellipse cx="176" cy="115" rx="5" ry="6" fill="#13243a"/><ellipse cx="218" cy="112" rx="5" ry="6" fill="#13243a"/>
 <path d="M191 117L187 143L199 148M176 168Q198 158 217 166" stroke="#a65e62" stroke-width="5" fill="none"/>`
 :`<path d="M143 72Q140 22 189 15Q233 9 250 65L228 94Z" fill="#382d3d" ${O}/>
 <ellipse cx="198" cy="102" rx="64" ry="72" fill="url(#face)" ${O}/>
 <path d="M137 92Q148 40 200 27Q231 30 242 75L218 91Q189 72 169 105L147 116Z" fill="#352a39" ${D}/>
 <path d="M150 117L180 111M210 111L240 114" stroke="#4a2d37" stroke-width="9"/>
 <ellipse cx="176" cy="121" rx="5" ry="6" fill="#142137"/><ellipse cx="223" cy="121" rx="5" ry="6" fill="#142137"/>
 <path d="M195 120L191 149L204 148" stroke="#995b5d" stroke-width="5" fill="none"/>
 <path d="M166 168Q194 147 232 166L224 179Q205 170 192 179Q175 173 169 183Z" fill="#302b37" ${D}/>`;
 const props=pose===2?`<g transform="translate(260 285) rotate(11)"><rect x="-35" y="-62" width="72" height="100" rx="9" fill="#8d2945" ${O}/><path d="M-26-45H27M-27 18H27" stroke="#e8bd86" stroke-width="4"/></g>`:
 pose===4?`<g transform="translate(287 312) rotate(-17)"><rect x="-21" y="12" width="61" height="21" rx="5" fill="#d53552" ${D}/><path d="M0-51H19V12H0Z" fill="#e1c298" ${D}/></g>`:
 pose===7?`<g transform="translate(257 292)" fill="none" stroke="#cedfe9" stroke-width="9"><circle cx="-24" cy="0" r="20"/><circle cx="24" cy="-2" r="20"/><path d="M-3-3L5-4"/></g>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="550" viewBox="0 0 390 550">
 ${defs}
 <ellipse cx="195" cy="534" rx="104" ry="10" fill="#0b182c" opacity=".35"/>
 <path d="M113 352Q105 424 114 498L101 517L160 525L172 371Z" fill="url(#pants)" ${O}/>
 <path d="M211 352L218 506L210 520L275 522L275 471L270 367Z" fill="url(#pants)" ${O}/>
 <path d="M101 492L163 496L186 528Q173 543 97 533Q82 518 101 492Z" fill="#101a30" ${O}/>
 <path d="M212 497L277 497L306 529Q280 547 213 535Q199 520 212 497Z" fill="#111a2b" ${O}/>
 <path d="M110 520Q151 529 185 523M214 525Q265 534 302 524" fill="none" stroke="#abbcc8" stroke-width="5"/>
 <path d="M109 410L154 427M229 433L270 449" fill="none" stroke="#91b9d1" opacity=".5" stroke-width="5"/>
 <path d="M108 204Q131 180 173 184L231 178Q273 185 287 204L287 369Q194 395 105 369Z" fill="url(#coat)" ${O}/>
 <path d="M132 213L196 229L261 209L258 356Q192 370 132 354Z" fill="#294968" stroke="#192841" stroke-width="7"/>
 <path d="M176 188L191 211L214 191L214 256L194 307L173 254Z" fill="#a1b7c8" ${D}/>
 <path d="M191 215L209 220L201 265L194 277L188 261Z" fill="#19263c"/>
 <g>${face}
 <path d="M164 178L175 201L213 201L224 175Z" fill="url(#face)" ${D}/>
 <path d="M126 76Q140 28 186 20Q248 16 263 68L257 91H124Z" fill="url(#coat)" ${O}/>
 <path d="M117 84L277 79Q289 93 278 101L125 109Z" fill="#13223d" ${O}/>
 <path d="M143 65Q199 31 246 65" stroke="#9bbad2" stroke-width="6" fill="none" opacity=".6"/>
 <path d="M186 43H211L217 61L199 77L182 61Z" fill="url(#badge)" ${D}/>
 <path d="M195 48H202V70H195Z M187 57H209V63H187Z" fill="#d42a48"/>
 </g>
 ${arm(pose,'left')}${arm(pose,'right')}
 <path d="M110 351L289 351L286 379L111 384Z" fill="#0e1728" stroke="#7996af" stroke-width="6"/>
 <path d="M181 350H210V381H181Z" fill="url(#badge)" ${D}/>
 <path d="M122 354L141 354L143 397L119 396Z M258 351L278 351L278 391L256 394Z" fill="#1e334b" ${D}/>
 <path d="M134 294H170V330H134Z M223 292H262V331H223Z" fill="#1a304a" stroke="#a8bdca" stroke-width="4"/>
 <path d="M136 302L169 311M225 304L258 310" stroke="#a4bdcb" stroke-width="4"/>
 <rect x="244" y="207" width="36" height="40" rx="7" fill="#f3f5f6" ${D}/>
 <rect x="249" y="214" width="26" height="27" fill="#cf2343"/>
 <path d="M259 217H265V239H259Z M252 226H273V232H252Z" fill="#fff"/>
 <text x="192" y="282" text-anchor="middle" fill="#effaff" font-size="21" font-family="Arial" font-weight="900" letter-spacing="2">POLIZEI</text>
 ${props}
 <path d="M132 222Q141 245 140 270M263 230Q252 246 260 271" fill="none" stroke="#c1d9e8" stroke-width="4" opacity=".38"/>
 </svg>`;
}
function airportSVG(){
 const distant=[];
 for(let i=0;i<14;i++){
 const x=34+i*72,y=324+(i%3)*9;
 distant.push(`<g transform="translate(${x} ${y}) scale(${.45+(i%4)*.06})" opacity=".62">
 <ellipse cx="0" cy="-85" rx="18" ry="21" fill="#536176"/>
 <path d="M-25-63Q0-79 25-63L30 1H-30Z" fill="${['#5e728d','#758d9f','#425e80','#b4a9a2'][i%4]}"/>
 <path d="M-13 0L-15 42M15 0L18 42" stroke="#364d68" stroke-width="12"/></g>`);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
 <defs>
 <linearGradient id="sky" x2=".4" y2="1"><stop stop-color="#64a3d8"/><stop offset=".65" stop-color="#c5eafb"/><stop offset="1" stop-color="#fff0d6"/></linearGradient>
 <linearGradient id="floor" x2="0" y2="1"><stop stop-color="#7798ab"/><stop offset=".3" stop-color="#e1ecec"/><stop offset=".65" stop-color="#b4cbd2"/><stop offset="1" stop-color="#6f869e"/></linearGradient>
 <linearGradient id="roof" x2="0" y2="1"><stop stop-color="#101d36"/><stop offset=".55" stop-color="#334967"/><stop offset="1" stop-color="#172c48"/></linearGradient>
 <linearGradient id="glass" x2="1" y2="1"><stop stop-color="#effaff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="#85b5d0" stop-opacity=".33"/></linearGradient>
 </defs>
 <path d="M0 0H960V540H0Z" fill="url(#sky)"/>
 <path d="M-70 314L130 169L226 248L346 128L434 261L550 145L664 253L774 163L982 302V361H0Z" fill="#8fafc9" stroke="#456d9e" stroke-width="6"/>
 <path d="M270 227L346 128L421 245L366 216L343 225L328 201Z M484 231L550 145L623 237L566 213L548 222L531 202Z M709 238L774 163L841 253L792 219L770 227L752 210Z" fill="#f6fbff"/>
 <path d="M0 329H960V404H0Z" fill="#a7b2b4"/>
 <path d="M0 374L960 367" stroke="#fff" stroke-dasharray="50 28" stroke-width="5"/>
 <path d="M679 318H691V195H679Z M655 192H712V210H655Z M682 165H691V198H682Z" fill="#426d92" stroke="#1b395c" stroke-width="5"/>
 <ellipse cx="686" cy="166" rx="25" ry="8" fill="#537d9d"/>
 <path d="M0 0H960V119H0Z" fill="url(#roof)" stroke="#0c152c" stroke-width="10"/>
 <path d="M0 34H960M0 81H960" stroke="#8eb8cf" opacity=".38" stroke-width="5"/>
 <g stroke="#c6e8f4" stroke-width="9" opacity=".67"><path d="M15 15L103 47M168 15L256 47M321 15L409 47M474 15L562 47M627 15L715 47M780 15L868 47"/></g>
 <path d="M0 114H960V404H0Z" fill="url(#glass)" stroke="#223b57" stroke-width="8"/>
 <g stroke="#294964" stroke-width="11"><path d="M18 114V405M243 114V405M469 114V405M697 114V405M944 114V405"/></g>
 <g stroke="#e5faff" stroke-width="4" opacity=".42"><path d="M25 121V405M252 121V405M478 121V405M706 121V405"/></g>
 ${distant.join('')}
 <path d="M0 402H960V540H0Z" fill="url(#floor)" stroke="#233d5b" stroke-width="7"/>
 <path d="M0 461H960M0 519H960M238 401L177 540M478 401L474 540M695 401L770 540" stroke="#f8ffff" stroke-width="3" opacity=".43"/>
 <path d="M22 428L219 428L189 517L62 514Z M711 430L920 430L941 508L756 515Z" fill="#fff" opacity=".1"/>
 <rect x="30" y="48" width="511" height="85" rx="11" fill="#0d1e39" stroke="#9bc5dd" stroke-width="5"/>
 <rect x="44" y="60" width="52" height="56" rx="7" fill="#cc2946"/>
 <path d="M67 68H75V109H67Z M52 83H90V94H52Z" fill="#fff"/>
 <text x="109" y="86" font-family="Arial" font-size="27" font-weight="900" fill="#fff">ZÜRICH AIRPORT</text>
 <text x="110" y="113" font-family="Arial" font-size="14" font-weight="700" fill="#c4d9e8">FLUGHAFEN • AEROPUERTO • ZRH</text>
 <rect x="553" y="48" width="375" height="85" rx="11" fill="#112b49" stroke="#a5cbda" stroke-width="5"/>
 <text x="742" y="85" text-anchor="middle" font-family="Arial" font-size="22" font-weight="900" fill="#fff">SECURITY / ZOLL</text>
 <text x="743" y="114" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#8de5e7">PASSPORT CONTROL  →</text>
 <g fill="#20354b" stroke="#91b4ca" stroke-width="5"><rect x="22" y="338" width="148" height="64" rx="8"/><rect x="795" y="335" width="137" height="64" rx="8"/></g>
 <g fill="#fff" font-family="Arial" font-size="19" font-weight="900"><text x="35" y="378">CHECK-IN</text><text x="809" y="376">GATE 07</text></g>
 </svg>`;
}
function loadSvg(key,svg){
 if(cache.has(key))return cache.get(key);
 const entry={ready:false,img:null,error:false};
 cache.set(key,entry);
 if(typeof Image!=='undefined'){
  try{
   const img=new Image();
   img.onload=()=>{entry.ready=true;entry.img=img;};
   img.onerror=()=>{entry.error=true;};
   img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }catch(_){entry.error=true;}
 }
 return entry;
}
loadSvg('airport',airportSVG());
for(const variant of [0,1])for(const pose of [0,1,2,3,4,5,6,7,8,9])
 loadSvg('cop-'+variant+'-'+pose,policeSVG(pose,variant));
function background(ctx,t){
 const item=cache.get('airport');
 if(!item?.ready){old.background(ctx,t);return;}
 ctx.drawImage(item.img,0,0,960,540);
 // Lively glass lighting and runway traffic, independent of the static backdrop.
 const x=1010-(t*.95+120)%1180,y=265+Math.sin(t*.028)*4;
 ctx.save();ctx.translate(x,y);ctx.strokeStyle='#e6f4ff';ctx.lineWidth=7;
 ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-65,0);ctx.lineTo(85,0);
 ctx.moveTo(-16,-3);ctx.lineTo(23,-36);ctx.moveTo(-9,2);ctx.lineTo(30,26);
 ctx.moveTo(-56,-1);ctx.lineTo(-67,-19);ctx.stroke();ctx.restore();
 ctx.save();ctx.globalAlpha=.07+.02*Math.sin(t*.04);ctx.fillStyle='#fff';
 for(const x of [234,465,690])ctx.fillRect(x,122,8,282);
 ctx.restore();
}
function officer(ctx,x,y,scale=.72,pose=0,flip=false,variant=0,t=0){
 const item=cache.get('cop-'+variant+'-'+pose);
 if(item?.ready){
  ctx.save();ctx.translate(x,y+(pose===8?Math.sin(t*.15+variant)*3:Math.sin(t*.05+variant)*1.3));
  ctx.scale((flip?-1:1)*scale,scale);
  ctx.drawImage(item.img,-135,-360,270,360);ctx.restore();
 }else old.officer(ctx,x,y,scale,pose,flip);
}
function luggage(ctx,x,y,s=1,open=false){
 const key='luggage-'+Number(open);
 let item=cache.get(key);
 if(!item){
  item=loadSvg(key,`<svg xmlns="http://www.w3.org/2000/svg" width="216" height="245" viewBox="0 0 216 245">
   <defs><linearGradient id="case" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffa2bc"/><stop offset=".3" stop-color="#f44f85"/><stop offset=".7" stop-color="#9f2d69"/><stop offset="1" stop-color="#482553"/></linearGradient></defs>
   <ellipse cx="109" cy="228" rx="91" ry="10" fill="#090e2a" opacity=".3"/>
   <path d="M75 41V17Q75 8 89 8H132Q147 8 147 17V41" fill="none" stroke="#152336" stroke-width="15"/>
   <path d="M75 38V17Q75 8 89 8H132Q147 8 147 17V38" fill="none" stroke="#d4e4ea" stroke-width="5"/>
   <rect x="23" y="37" width="172" height="166" rx="24" fill="url(#case)" stroke="#22152e" stroke-width="10"/>
   <rect x="41" y="53" width="136" height="132" rx="16" fill="none" stroke="#ffc2ce" stroke-width="5"/>
   <path d="M67 43V195M111 42V198M151 44V196" stroke="#672451" stroke-width="7" opacity=".73"/>
   <path d="M42 54Q100 36 173 54L152 91Q106 62 45 87Z" fill="#fff" opacity=".19"/>
   <rect x="137" y="77" width="33" height="35" rx="6" fill="#d32640" stroke="#ffedee" stroke-width="3"/>
   <path d="M151 82H157V107H151Z M141 92H166V98H141Z" fill="#fff"/>
   <path d="M42 192V217H60V197M160 196V220H177V195" fill="#181e2e" stroke="#11192d" stroke-width="5"/>
   ${open?'<path d="M27 37Q100-23 193 38L183 66Q109 8 35 71Z" fill="#f08eaa" stroke="#42223c" stroke-width="8"/>':''}
  </svg>`);
 }
 if(item?.ready){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.drawImage(item.img,-91,-137,182,137);ctx.restore();
 }else old.luggage(ctx,x,y,s,open);
}
window.FLOR_AIRPORT_ART=Object.freeze({
 ...old,background,officer,luggage,version:2,
 get illustratedOfficersReady(){return [...cache].filter(([key,v])=>key.startsWith('cop-')&&v.ready).length;},
 get illustratedBackgroundReady(){return !!cache.get('airport')?.ready;},
 get policeSpritesReady(){return old.policeSpritesReady;},
 get backgroundReady(){return !!cache.get('airport')?.ready||old.backgroundReady;}
});
})();