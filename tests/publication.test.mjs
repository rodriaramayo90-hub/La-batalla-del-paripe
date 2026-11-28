import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(root,f),'utf8');

test('Published game has one ordered CSS bundle, no legacy inline style blocks',()=>{
 const html=read('index.html');
 const head=html.slice(html.indexOf('<head>'),html.indexOf('</head>'));
 const links=[...head.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1].split('?')[0]);
 assert.deepEqual(links,['game.css']);
 assert.doesNotMatch(head,/<style\b/i);
 const css=read('game.css');
 const names=[...css.matchAll(/\/\* ===== LEGACY STYLE SEGMENT (\d+): ([^\n]+) ===== \*\//g)];
 assert.equal(names.length,17,'All 13 stylesheets and 4 inline blocks must preserve their cascade');
 assert.deepEqual(names.map(m=>Number(m[1])),Array.from({length:17},(_,i)=>i+1));
 const oldOrder=['styles-v11.css','styles-v14.css','styles-v18.css',
  'styles-v19.css','styles-v21.css','fullscreen-v23.css','styles-v24.css',
  'online-v25.css','tower-v30.css','combat-v33.css','local-v40.css',
  'tournament-local.css','readability-v53.css'];
 assert.deepEqual(names.filter(m=>m[2].endsWith('.css')).map(m=>m[2]),oldOrder);
 assert.match(css,/@font-face/);assert.match(css,/#menu/);assert.match(css,/tournament/);
});

test('All CSS asset URLs resolve after bundling from repository root',()=>{
 const css=read('game.css');
 const urls=[...css.matchAll(/url\(([^)]+)\)/g)].map(m=>m[1].trim().replace(/^['"]|['"]$/g,''));
 assert.ok(urls.length>2);
 for(const uri of urls){
  if(/^(data:|https?:|#)/.test(uri))continue;
  const path=uri.split(/[?#]/)[0];
  assert.ok(existsSync(resolve(root,path)),'Missing CSS asset '+path);
 }
});

test('Root publication no longer serves historical JS, CSS or HTML entrypoints',()=>{
 const rootFiles=readdirSync(root,{withFileTypes:true}).filter(x=>x.isFile()).map(x=>x.name);
 const html=read('index.html');
 const activeScripts=[...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)]
  .map(m=>m[1].split('?')[0]);
 assert.equal(activeScripts.length,39,'Unexpected game runtime script count');
 assert.deepEqual(rootFiles.filter(n=>n.endsWith('.js')).sort(),activeScripts.slice().sort());
 assert.deepEqual(rootFiles.filter(n=>n.endsWith('.css')).sort(),['game.css']);
 assert.deepEqual(rootFiles.filter(n=>n.endsWith('.html')).sort(),['index.html']);
});
