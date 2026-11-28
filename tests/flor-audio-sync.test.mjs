import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
function fighter(id,x){
 return {id,x,dir:x<480?1:-1,hp:220,meter:100,attack:0,attackLength:0,
  attackType:'',cool:0,stun:0,blockstun:0,blocking:false,escaping:0,
  grabbed:false,grabbing:false,legGone:false,moving:false,
  y:0,vy:0,parryWindow:0,invuln:0};
}
function fixture({sound=true,tts=true}={}){
 const log={speech:[],sounds:[],words:[],cancel:0};
 const timers=new Map();let nextTimer=0;
 const synth={cancel(){log.cancel++},speak(u){log.speech.push(u)}};
 const art={background(){},officer(){},luggage(){},confiscated(){},
  conveyor(){},scanner(){},sticker(){},passport(){},baggageArc(){},
  explosion(){},prompt(){},stamp(){},cross(){},rect(){},ellipse(){},line(){},
  label(_ctx,t){log.words.push(t);}};
 const context=new Proxy({
  save(){},restore(){},translate(){},rotate(){},scale(){},
  beginPath(){},moveTo(){},lineTo(){},closePath(){},
  fill(){},stroke(){},fillRect(){},strokeText(){},fillText(){},
  arc(){},drawImage(){},roundRect(){},
 },{
  get(o,k){return k in o?o[k]:()=>{};}
 });
 class Utterance{constructor(text){this.text=text;}}
 const sandbox={
  window:null,document:{hidden:false,querySelector:()=>null,getElementById:()=>null},
  ctx:context,FLOR_AIRPORT_ART:art,
  player:fighter(7,220),enemy:fighter(2,740),
  LOCAL:{active:true,paused:false},ONLINE:{active:false},
  SECOND:{actions:[]},mode:'game',practice:false,
  soundEnabled:sound,SpeechSynthesisUtterance:Utterance,
  speechSynthesis:tts?synth:null,MAX_HP:220,
  castSerial:0,introFrames:0,ending:false,projectileClash:null,
  announcement:'',announceTime:0,exFlash:0,effects:[],
  shake:0,hitstop:0,score:0,
  console:{warn(){},error(){}},
  atlases:[{id:0}],actionAtlases:[{id:0}],atlasMap:Array.from({length:12},()=>[0,0]),
  actionMap:Array.from({length:12},()=>[0,0]),
  SpriteAtlas:{draw(){}},
  setTimeout(fn,_ms){const id=++nextTimer;timers.set(id,fn);return id;},
  clearTimeout(id){timers.delete(id)},
  $:()=>null,clamp:(v,a,b)=>Math.max(a,Math.min(v,b)),
  sfx(name){log.sounds.push([sandbox.FLOR_SUPER?.t,name]);},
  haptic(){},finish(){},updateHud(){},clearActionBuffer(){},
  cancelCharges(){},cancelSecondCharges(){},
  strike(){return false},update(){},draw(){},resetArcade(){}
 };
 sandbox.window=sandbox;
 const contextVM=vm.createContext(sandbox);
 for(const file of ['super-defense-v1.js','super-manager-v1.js','flor-super-v1.js'])
  vm.runInContext(read(file),contextVM,{filename:file,timeout:3000});
 function launch(){
  assert.equal(sandbox.strike(sandbox.player,sandbox.enemy,'special',false,false),true);
 }
 function moveTo(t){
  sandbox.FLOR_SUPER.t=t-1;
  sandbox.update(2);
  assert.equal(sandbox.FLOR_SUPER.t,t);
 }
 return {sandbox,log,timers,launch,moveTo,
  last:()=>log.speech.at(-1),end:()=>log.speech.at(-1).onend(),
  error:()=>log.speech.at(-1).onerror(),
  drawWords:()=>{log.words.length=0;sandbox.draw();return log.words.slice();}
 };
}
test('Flor speech begins exactly when each subtitle first appears, not frames later',()=>{
 const f=fixture();f.launch();
 for(const {at,voice,caption,sfx} of [
  {at:28,voice:'Madame, contrôle de sécurité.',caption:'MADAME, CONTRÔLE DE SÉCURITÉ',sfx:'step'},
  {at:63,voice:'¡Yo no hice nada!',caption:'¡YO NO HICE NADA!',sfx:'ready'},
  {at:98,voice:'¡Pero si esto en Argentina se puede!',caption:'¡PERO SI ESTO EN ARGENTINA SE PUEDE!',sfx:'step'},
  {at:143,voice:'¡Él fue! ¡Ese es el sospechoso!',caption:'¡ÉL FUE! ¡ESE ES EL SOSPECHOSO!',sfx:'ready'}
 ]){
  f.moveTo(at);
  assert.equal(f.last().text,voice,'Voice spoken at visual cut '+at);
  assert.ok(f.drawWords().includes(caption),'Caption must exist when audio begins '+at);
  assert.ok(f.log.sounds.some(([t,type])=>t===at&&type===sfx),
   'SFX must begin on the same visual cut '+at);
  assert.equal(f.sandbox.FLOR_SUPER.voiceWait.at,at);
  f.end();
  assert.equal(f.sandbox.FLOR_SUPER.voiceWait,null);
 }
 assert.equal(f.log.speech.length,4,'Four dialogue cues, exactly once each');
});
test('Cinematic timeline pauses for spoken line, then resumes when TTS finishes',()=>{
 const f=fixture();f.launch();f.moveTo(28);
 const startAttack=f.sandbox.player.attack;
 f.sandbox.update(30);
 assert.equal(f.sandbox.FLOR_SUPER.t,28,'No subtitles slip away mid-sentence');
 assert.equal(f.sandbox.player.attack,startAttack,'Attack timer stays aligned');
 assert.equal(f.log.speech.length,1,'No queued duplicate lines');
 f.end();f.sandbox.update(1);
 assert.ok(f.sandbox.FLOR_SUPER.t>28);
 assert.equal(f.log.speech.length,1);
});
test('Outcome dialogue and Flor final protest are correctly timed and branch specific',()=>{
 for(const result of ['perfect','partial','fail']){
  const f=fixture();f.launch();
  f.sandbox.FLOR_SUPER.verdict=result;f.moveTo(291);
  assert.equal(f.last().text,{
   perfect:'Alles gut. ¡El pasaporte está bien!',
   partial:'Inspección secundaria...',
   fail:'¡Expulsión inmediata!'
  }[result]);
  const words=f.drawWords();
  assert.ok(words.some(s=>s.includes(result==='perfect'?'ALLES GUT':result==='partial'?'INSPECCIÓN SECUNDARIA':'EXPULSIÓN INMEDIATA')));
  f.end();
  f.moveTo(347);
  if(result==='perfect'){
   assert.equal(f.last().text,'¡Pero otra vez yo, boludo!');
   assert.ok(f.drawWords().includes('¡PERO OTRA VEZ YO, BOLUDO!'));
   assert.equal(f.log.speech.length,2);
  }else assert.equal(f.log.speech.length,1,'Final protest must be omitted');
 }
});
test('Reset cancels pending voice and stale onend cannot unblock next EX',()=>{
 const f=fixture();f.launch();f.moveTo(28);
 const stale=f.last();
 f.sandbox.resetArcade();
 assert.equal(f.sandbox.FLOR_SUPER.voiceWait,null);
 assert.ok(f.log.cancel>=2);
 assert.equal(f.timers.size,0);
 f.sandbox.player.meter=100;f.sandbox.player.cool=0;f.sandbox.player.attack=0;
 f.launch();f.moveTo(28);
 stale.onend();
 assert.equal(f.sandbox.FLOR_SUPER.voiceWait.at,28,'Old callback must not touch new speech');
 f.end();
});
test('Mute, synth error and stalled mobile TTS all release the narration safely',()=>{
 const f=fixture();f.launch();f.moveTo(28);
 f.sandbox.soundEnabled=false;f.sandbox.update(1);
 assert.equal(f.sandbox.FLOR_SUPER.voiceWait,null);
 assert.ok(f.sandbox.FLOR_SUPER.t>28);
 const g=fixture();g.launch();g.moveTo(28);g.error();
 assert.equal(g.sandbox.FLOR_SUPER.voiceWait,null);
 const h=fixture();h.launch();h.moveTo(28);
 assert.equal(h.timers.size,1);
 [...h.timers.values()][0]();
 assert.equal(h.sandbox.FLOR_SUPER.voiceWait,null);
 assert.ok(h.log.cancel>=2);
});
test('No audio or speechSynthesis uses original timeline without holding QTE',()=>{
 for(const opts of [{sound:false,tts:true},{sound:true,tts:false}]){
  const f=fixture(opts);f.launch();f.moveTo(28);
  assert.equal(f.sandbox.FLOR_SUPER.voiceWait,null);
  assert.equal(f.log.speech.length,0);
  f.sandbox.update(100);
  assert.ok(f.sandbox.FLOR_SUPER.t>28);
 }
});
