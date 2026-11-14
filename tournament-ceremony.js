/* Calle Derrota · ceremonia final del torneo local */
(function(){
const css=document.createElement('style');
css.textContent=`
#paripe-ceremony{position:fixed;inset:0;z-index:99999;background:linear-gradient(#20104a 0%,#723aa0 54%,#29213d 55%,#151226 100%);color:white;overflow:auto;text-align:center;font-family:inherit;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:2vh 2vw;box-sizing:border-box}
#paripe-ceremony[hidden]{display:none!important}
#paripe-ceremony .street{font-size:clamp(18px,4vw,42px);font-weight:1000;background:#166c62;border:5px solid #fff;border-radius:12px;padding:.2em 1em;box-shadow:0 0 0 4px #183b37;transform:rotate(-3deg)}
#paripe-ceremony h2{font-size:clamp(19px,4vw,45px);margin:.2em;text-shadow:3px 4px #391544}
#paripe-ceremony .scene{width:100%;display:flex;align-items:end;justify-content:center;gap:1vw;flex:1;min-height:0}
#paripe-ceremony .crowd{width:35%;display:flex;flex-wrap:wrap;align-content:end;align-items:end;justify-content:center;gap:1vw;padding-bottom:3vh}
#paripe-ceremony .loser{width:clamp(56px,8vw,110px);animation:paripeClap .55s infinite alternate;display:flex;flex-direction:column;align-items:center}
#paripe-ceremony .loser .tournament-portrait{display:block;width:100%;height:clamp(55px,13vh,140px);overflow:hidden}
#paripe-ceremony .loser .tournament-portrait img{width:100%;height:100%;object-fit:contain}
#paripe-ceremony .loser small{font-size:clamp(9px,1.1vw,14px);font-weight:bold}
#paripe-ceremony .loser:after{content:'👏 👏';font-size:clamp(12px,2vw,23px);animation:paripeClap .35s infinite alternate}
#paripe-ceremony .winner{width:28%;display:flex;align-items:center;flex-direction:column;justify-content:end;animation:paripeRise 1.2s both}
#paripe-ceremony .cup{font-size:clamp(50px,9vw,110px);animation:paripeLift 1.3s .8s both}
#paripe-ceremony .winner .tournament-portrait{display:block;width:clamp(85px,14vw,180px);height:clamp(85px,23vh,220px);overflow:hidden}
#paripe-ceremony .winner .tournament-portrait img{width:100%;height:100%;object-fit:contain}
#paripe-ceremony .podium{width:100%;background:linear-gradient(110deg,#e5a632,#fff2a1,#b87812);border:5px solid #ffe4a0;border-bottom:0;border-radius:12px 12px 0 0;min-height:clamp(50px,13vh,140px);display:flex;align-items:center;justify-content:center;color:#542e07;font-size:clamp(25px,6vw,75px);font-weight:1000}
#paripe-ceremony .actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;padding:8px}
#paripe-ceremony .confetti{position:absolute;top:-10%;pointer-events:none;font-size:clamp(16px,2vw,30px);animation:paripeFall 4s linear infinite;animation-delay:var(--delay);left:var(--x)}
@keyframes paripeClap{to{transform:translateY(-7px) rotate(3deg)}}@keyframes paripeRise{from{transform:translateY(70vh)}to{transform:translateY(0)}}@keyframes paripeLift{from{transform:translateY(90px) scale(.6)}to{transform:translateY(0) scale(1)}}@keyframes paripeFall{to{transform:translateY(115vh) rotate(720deg)}}
@media(max-height:500px){#paripe-ceremony{padding:1vh 1vw}#paripe-ceremony .loser .tournament-portrait{height:24vh}#paripe-ceremony .winner .tournament-portrait{height:27vh}#paripe-ceremony .podium{min-height:12vh}}
`;
document.head.append(css);
window.showTournamentCeremony=function(){
 const t=window.TOURNAMENT || (typeof TOURNAMENT!=='undefined'?TOURNAMENT:null);
 if(!t?.champion){showTournamentBracket();return}
 const winner=t.champion;
 const entrants=t.entrants||[];
 let root=document.getElementById('paripe-ceremony');
 if(!root){root=document.createElement('section');root.id='paripe-ceremony';document.body.append(root)}
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const losers=entrants.filter(e=>e.number!==winner.number).map(e=>'<div class="loser">'+tournamentPortrait(e.fighter)+'<small>'+escape(fighters[e.fighter][0])+'</small></div>');
 const mid=Math.ceil(losers.length/2);
 root.innerHTML='<div class="street">CALLE DERROTA</div><h2>🏆 ¡CAMPEÓN DEL PARIPÉ! 🏆</h2><div class="scene"><div class="crowd">'+losers.slice(0,mid).join('')+'</div><div class="winner"><div class="cup">🏆</div>'+tournamentPortrait(winner.fighter)+'<strong>'+escape(tournamentLabel(winner))+'</strong><div class="podium">1</div></div><div class="crowd">'+losers.slice(mid).join('')+'</div></div><div class="actions"><button class="btn primary" id="paripe-ceremony-continue">VER LLAVE →</button><button class="btn back" id="paripe-ceremony-menu">MENÚ</button></div>'+Array.from({length:25},(_,i)=>'<span class="confetti" style="--x:'+((i*37)%100)+'%;--delay:-'+(i%9)/2+'s">'+['🎊','✨','🎉'][i%3]+'</span>').join('');
 root.hidden=false;
 t.phase='ceremony';
 document.getElementById('paripe-ceremony-continue').onclick=()=>{root.hidden=true;showTournamentBracket()};
 document.getElementById('paripe-ceremony-menu').onclick=()=>{root.hidden=true;goMenu()};
 document.getElementById('paripe-ceremony-continue').focus();
};
})();
