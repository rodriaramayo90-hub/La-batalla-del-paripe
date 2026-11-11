function showTower(){
 cancelSpeech();audio.stopMusic();show('tower');sfx('select');
 const rival=queue[battle];$('tower-progress').textContent=`${battle} / ${queue.length} rivales derrotados`;$('tower-progress-bar').value=battle;$('tower-progress-bar').max=queue.length;
 $('tower-player').innerHTML=portraitMarkup(selected);$('tower-player-name').textContent=fighters[selected][0];$('tower-next-name').textContent=fighters[rival][0];$('tower-match').textContent=`COMBATE ${battle+1} / ${queue.length}`;
 $('tower-rivals').innerHTML=queue.map((id,index)=>({id,index})).reverse().map(({id,index})=>`<li class="tower-step ${index<battle?'defeated':index===battle?'current':'upcoming'}" ${index===battle?'aria-current="step" id="tower-current"':''}><span class="tower-rank">${index+1}</span>${index===battle?`<div class="tower-climber">${portraitMarkup(selected)}<b>1P →</b></div>`:''}<div class="tower-enemy">${portraitMarkup(id)}</div><div class="tower-step-copy"><b>${fighters[id][0]}</b><small>${index<battle?'✓ DERROTADO':index===battle?'PRÓXIMO RIVAL':index===queue.length-1?'LA CIMA':'POR DELANTE'}</small></div></li>`).join('');
 requestAnimationFrame(()=>{const box=$('tower-view'),row=$('tower-current');box.scrollTop+=row.getBoundingClientRect().top-box.getBoundingClientRect().top-box.clientHeight/2+row.offsetHeight/2;});
}
function enterTowerFight(){unlockAudio();show('game');newBattle();}
