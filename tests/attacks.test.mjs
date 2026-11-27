import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(ROOT,f),'utf8');

function node(){
 const listeners={};
 return {listeners,style:{},classList:{add(){},remove(){},toggle(){}},
  appendChild(){},setAttribute(){},addEventListener(type,fn){listeners[type]=fn},
  querySelector(){return {textContent:''}},textContent:'',disabled:false};
}
function fighter(id,x){
 return {id,x,hp:220,meter:100,attack:0,cool:0,stun:0,blockstun:0,
  blocking:false,grabbed:false,grabbing:false,escaping:0,legGone:false,
  y:0,vy:0,dir:x<480?1:-1,parryWindow:0,knockback:0};
}
function fixture(type,{practice=false,actorSlot=0}={}){
 const id=type==='malefica'?9:2;
 const main=fighter(actorSlot===0?id:3,240);
 const second=fighter(actorSlot===1?id:3,720);
 const area=node(),specialButton=node(),help=node(),cool=node();
 const document={
  createElement:()=>node(),head:{appendChild(){}},
  querySelector:sel=>sel.includes('control-group.attacks')?area:
    sel.includes('game-note')?help:sel.includes('data-key')?specialButton:null,
  getElementById:key=>key==='cool'?cool:null,
  addEventListener(){}
 };
 const env={
  window:null,document,
  player:main,enemy:second,practice,mode:'game',
  ONLINE:{active:false},LOCAL:{active:!practice,paused:false},
  PAD:{soloPause:false},SECOND:{actions:[]},
  ending:false,introFrames:0,projectileClash:null,
  castSerial:0,MAX_HP:220,shake:0,hitstop:0,score:0,
  exFlash:0,announcement:'',announceTime:0,effects:[],
  clamp:(v,a,b)=>Math.max(a,Math.min(v,b)),
  clearActionBuffer(){},cancelCharges(){},cancelSecondCharges(){},
  haptic(){},sfx(){},unlockAudio(){},
  console:{warn(){},error(){}},navigator:{getGamepads:()=>[]},
  fetch(){return Promise.reject(Error('offline asset mock'))},
  Image:class {},ctx:{},
  $:key=>key==='cool'?cool:null,
  update(){},draw(){},updateHud(){},resetArcade(){},finish(){},
  humanInput(){},baseStrikes:0,
  strike(actor,_other,kind){
   env.baseStrikes++;
   actor.attack=40;actor.attackLength=40;
   actor.attackType=kind;
   return true;
  }
 };
 env.window=env;env.addEventListener=()=>{};
 const sandbox=vm.createContext(env);
 function load(path){vm.runInContext(read(path),sandbox,{filename:path,timeout:3000});}
 load('super-defense-v1.js');
 load('super-manager-v1.js');
 load(type==='malefica'?'malefica-super-v1.js':'coqui-super-v1.js');
 if(practice)load('training-special-controls-v1.js');
 const name=type==='malefica'?'MALEFICA_SUPER':'COQUI_SUPER';
 const state=()=>sandbox[name];
 const actor=actorSlot===0?main:second,defender=actorSlot===0?second:main;
 const defenderSlot=1-actorSlot;
 return {sandbox,actor,defender,defenderSlot,name,state,
  tick:n=>sandbox.update(n),strike:kind=>sandbox.strike(actor,defender,kind,false,false),
  guard(t){sandbox.SUPER_DEFENSE.input(defenderSlot,'defend',true,'key-defender');
   state().t=t-(type==='malefica'?.78:.82);sandbox.update(1);
   sandbox.SUPER_DEFENSE.input(defenderSlot,'defend',false,'key-defender');
  }};
}
for(const type of ['malefica','coqui']){
 const timing=type==='malefica'?[178,217,256]:[127,215,304];
 const atImpact=type==='malefica'?289:318;
 const fraction=type==='malefica'?.46:.44;
 test(type+' normal punch delegates to the original combat engine',()=>{
  const f=fixture(type);
  assert.equal(f.strike('punch'),true);
  assert.equal(f.sandbox.baseStrikes,1);
  assert.equal(f.state().active,false);
 });
 test(type+' full meter activates its EX and consumes meter',()=>{
  const f=fixture(type);
  assert.equal(f.strike('special'),true);
  assert.equal(f.state().active,true);
  assert.equal(f.actor.meter,0);
  assert.equal(f.sandbox.baseStrikes,0);
  assert.equal(f.actor.attackType,type+'-super');
 });
 for(const [blocks,expectedMultiplier] of [[0,1],[1,.5],[3,0]]){
  test(type+' computes live HP damage with '+blocks+' precise defenses',()=>{
   const f=fixture(type);
   f.strike('special');
   for(let i=0;i<blocks;i++)f.guard(timing[i]);
   const expectedGrade=blocks===3?'perfect':blocks===1?'partial':'fail';
   assert.equal(f.sandbox.SUPER_DEFENSE.result(type),expectedGrade);
   assert.equal(f.sandbox.SUPER_DEFENSE.multiplier(type),expectedMultiplier);
   f.state().t=atImpact-.7;f.tick(2);
   assert.equal(f.state().hit,true);
   const damage=220*fraction*expectedMultiplier;
   assert.ok(Math.abs(f.defender.hp-(220-damage))<.001);
  });
 }
 test(type+' preserves ordinary special in practice and uses a separate EX button',()=>{
  const f=fixture(type,{practice:true});
  f.actor.meter=0;
  assert.equal(f.strike('special'),true);
  assert.equal(f.sandbox.baseStrikes,1,'Ordinary practice special must not invoke EX');
  assert.equal(f.state().active,false);
  f.actor.attack=0;f.actor.cool=0;
  assert.equal(f.sandbox.practiceSuperEX(),true);
  assert.equal(f.state().active,true);
  assert.equal(f.actor.attackType,type+'-super');
 });
}
test('An EX used by player two still targets player one for defense/damage',()=>{
 const f=fixture('coqui',{actorSlot:1});
 assert.equal(f.strike('special'),true);
 f.guard(127);f.guard(215);f.guard(304);
 assert.equal(f.sandbox.SUPER_DEFENSE.result('coqui'),'perfect');
 f.state().t=317.5;f.tick(2);
 assert.equal(f.defender.hp,220);
});
