import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(ROOT,f),'utf8');

function fixture(){
 const actor={id:0,x:200,dir:1,hp:220,meter:100,attack:0,attackType:'',attackLength:0,
  stun:0,blockstun:0,blocking:false,escaping:0,grabbed:false,grabbing:false,
  y:0,vy:0,cool:0,crouching:false,legGone:false,invuln:0,parryWindow:0,hit:false,
  receivedHits:0,daze:0,diveMask:0,chainDepth:0,castHits:new Set()};
 const defender={...actor,id:1,x:730,dir:-1,attackType:'punch',meter:0,
  blocking:false,castHits:new Set()};
 let parryCalls=0,finishes=0;
 const env={player:actor,enemy:defender,practice:false,ending:false,
  MAX_HP:220,DAMAGE_SCALE:.75,DIVE_MASK_REDUCTION:.45,
  LOCAL:{active:false},ONLINE:{active:false},effects:[],
  hitstop:0,shake:0,score:0,comboCount:0,comboTimer:0,bestCombo:0,
  exFlash:0,castSerial:0,announcement:'',announceTime:0,
  COMBO_ROUTES:Array.from({length:12},()=>[]),
  specialPlans:Array.from({length:12},()=>({length:90})),
  specialNames:Array.from({length:12},(_,i)=>'special-'+i),
  fighters:Array.from({length:12},(_,i)=>['Fighter'+i,'','','',7,7,7,7,'voice-'+i]),
  audio:{playVoice(){}},haptic(){},sfx(){},
  clamp:(v,a,b)=>Math.max(a,Math.min(v,b)),
  canChain(){return false},routeCanContinue(){return false},
  comboMoveToken(_a,type){return type},routePrefix(){return ''},
  commitComboMove(){},beginGrab(){return true},
  finisherData(){return {total:65,level:'mid'}},
  moveData(_a,type){return {total:type==='kick'?42:32,stun:27,start:10,end:19}},
  attackLevel(){return 'mid'},guardCovers(a){return !!a.blocking},
  resolveParry(){parryCalls++;return false},
  releaseGrapple(){},cancelCharges(){},cancelSecondCharges(){},
  applyAdvantage(){},finish(){finishes++}
 };
 const code=read('game-v52.js');
 const attackStart=code.indexOf('function strike('),attackEnd=code.indexOf('function phaseFor(',attackStart);
 const hitStart=code.indexOf('function hit('),hitEnd=attackStart;
 assert.ok(attackStart>=0&&attackEnd>attackStart&&hitStart>=0&&hitEnd>hitStart);
 const context=vm.createContext(env);
 vm.runInContext(code.slice(hitStart,hitEnd),context,{timeout:3000});
 vm.runInContext(code.slice(attackStart,attackEnd),context,{timeout:3000});
 return {context,actor,defender,
  strike:(kind)=>context.strike(actor,defender,kind,false,false),
  hit:(damage=20,push=20,kind=-3,info=null)=>context.hit(defender,damage,push,kind,280,info),
  parryCount:()=>parryCalls,finishCount:()=>finishes};
}

test('All twelve characters support normal punches, kicks and ordinary specials',()=>{
 for(let id=0;id<12;id++){
  const h=fixture();h.actor.id=id;
  assert.equal(h.strike('punch'),true,'punch '+id);
  assert.equal(h.actor.attackType,'punch');
  assert.equal(h.strike('kick'),false,'cannot attack during another attack '+id);
  h.actor.attack=0;
  assert.equal(h.strike('kick'),true,'kick '+id);
  assert.equal(h.actor.attackType,'kick');
  h.actor.attack=0;
  assert.equal(h.strike('special'),true,'special '+id);
  assert.equal(h.actor.attackType,'special');
  assert.equal(h.actor.meter,0,'special expends EX meter '+id);
  assert.equal(h.strike('special'),false,'cooldown locks repeated special '+id);
 }
});

test('Normal punch damage scales HP and creates recoil',()=>{
 const h=fixture();
 assert.equal(h.hit(20),true);
 assert.equal(h.defender.hp,205);
 assert.ok(h.defender.stun>0);
 assert.equal(h.defender.hit,true);
});

test('Holding guard blocks a standard punch without losing life',()=>{
 const h=fixture();h.defender.blocking=true;
 assert.equal(h.hit(20),true);
 assert.equal(h.defender.hp,220);
 assert.ok(h.defender.blockstun>0);
 assert.equal(h.defender.lastBlocked,true);
});

test('An ordinary character can parry using the canonical parry resolver',()=>{
 const h=fixture();h.actor.id=3;
 h.context.resolveParry=()=>true;
 assert.equal(h.hit(20),true);
 assert.equal(h.defender.hp,220);
 assert.equal(h.parryCount(),0); // mock was replaced by the parry resolver
});

test('Coquis regular Flic Flac bypasses guard and normal parry',()=>{
 const h=fixture();
 h.actor.id=2;h.actor.attackType='special';
 h.defender.blocking=true;h.defender.parryWindow=5;
 h.context.resolveParry=()=>{throw Error('Flic Flac incorrectly parried')};
 assert.equal(h.hit(20,20,-5,{special:true,attacker:h.actor}),true);
 assert.ok(h.defender.hp<220);
 assert.equal(h.defender.lastBlocked,false);
});

test('Invulnerable fighters and practice opponents cannot receive core damage',()=>{
 const h=fixture();h.defender.invuln=10;
 assert.equal(h.hit(20),false);
 assert.equal(h.defender.hp,220);
 h.defender.invuln=0;h.context.practice=true;
 assert.equal(h.hit(20),false);
 assert.equal(h.defender.hp,220);
});
