import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(ROOT,path),'utf8');

test('All active JavaScript files parse and linked scripts/stylesheets exist',()=>{
 const html=read('index.html');
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1].split('?')[0]);
 const styles=[...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.css(?:\?[^"']*)?)["']/gi)].map(m=>m[1].split('?')[0]);
 assert.ok(scripts.length>=30);
 for(const file of [...scripts,...styles])assert.ok(existsSync(resolve(ROOT,file)),'Missing '+file);
 for(const file of scripts)assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}),'Syntax '+file);
});

test('All six cinematic supers start shared defenses and apply damage multipliers',()=>{
 const types=['trex','drapie','alca','berga','malefica','coqui','flor'];
 const paths=['trex-super-v1.js','drapie-super-v1.js','alcahueta-super-v1.js',
  'berga-super-v1.js','malefica-super-v1.js','coqui-super-v1.js','flor-super-v1.js'];
 for(let i=0;i<paths.length;i++){
  const src=read(paths[i]);
  assert.ok(src.includes("SUPER_DEFENSE?.start('"+types[i]+"'"),paths[i]+' must start cinematic defense');
  assert.match(src,/SUPER_DEFENSE\?\.multiplier/,'Damage must use common multiplier: '+paths[i]);
 }
});
