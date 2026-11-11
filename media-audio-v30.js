/* Native media playback for Samsung Internet, independent of Web Audio output. */
(function(){
 const Original=window.ArcadeAudio;
 window.ArcadeAudio=class extends Original{
  constructor(){
   super();this.native=/SamsungBrowser\//i.test(navigator.userAgent);this.mediaUnlocked=false;this.mediaError=false;this.effects=new Set();this.mediaVoice=null;this.unlockPending=null;
   this.song=new Audio('assets/audio-v13/battle-theme.mp3');this.song.loop=true;this.song.preload='auto';this.song.volume=.4;this.song.playsInline=true;
   this._nativeVisibility=()=>{if(!this.native)return;if(document.hidden){this.song.pause();this.stopVoice();this.stopEffects();}else if(this.musicWanted&&!this.muted&&this.mediaUnlocked)this.startMusic();};
   document.addEventListener('visibilitychange',this._nativeVisibility);
  }
  isReady(){return this.native?this.mediaUnlocked&&!this.mediaError:this.context?.state==='running';}
  changed(){this.onStateChange?.();}
  failed(){this.mediaError=true;this.changed();}
  unlock(){
   if(!this.native)return super.unlock();
   if(this.muted)return Promise.resolve(false);
   // A real media play request is made synchronously inside each user gesture.
   // Each gesture can retry; a rejected or stranded attempt never blocks a later one.
   if(this.song.paused)this.song.volume=this.musicWanted ? .4 : 0;
   let attempt;try{attempt=this.song.play();}catch(_){this.failed();return Promise.resolve(false);}
   return Promise.resolve(attempt).then(()=>{this.mediaUnlocked=true;this.mediaError=false;if(!this.musicWanted||this.muted||document.hidden)this.song.pause();else this.song.volume=this.mediaVoice ? .12 : .4;this.changed();return true;}).catch(()=>{this.failed();return false;});
  }
  startMusic(){if(!this.native)return super.startMusic();this.musicWanted=true;if(this.muted||document.hidden||!this.mediaUnlocked)return;this.song.volume=this.mediaVoice ? .12 : .4;if(this.song.paused)this.song.play().catch(()=>this.failed());}
  stopMusic(){if(!this.native)return super.stopMusic();this.musicWanted=false;this.song.pause();this.stopVoice();}
  _stopClock(){if(!this.native)return super._stopClock();this.song.pause();this.stopVoice();this.stopEffects();}
  setMuted(value){if(!this.native)return super.setMuted(value);this.muted=!!value;try{localStorage.setItem('paripe-audio-muted',this.muted?'1':'0')}catch(_){}if(this.muted)this._stopClock();else if(this.musicWanted)this.startMusic();this.changed();return this.muted;}
  voicePath(id){const name=id===1?'trex-shriek':'voice-'+id,folder=id===12?'audio-v30':id===2?'audio-v29':[1,5].includes(id)?'audio-v28':[4,10].includes(id)?'audio-v15':id===7?'audio-v14':'audio-v13';return 'assets/'+folder+'/'+name+'.mp3';}
  playVoice(id){if(!this.native)return super.playVoice(id);if(this.muted||document.hidden||!this.mediaUnlocked)return false;this.stopVoice();const voice=new Audio(this.voicePath(id));voice.preload='auto';voice.volume=.95;voice.playsInline=true;this.mediaVoice=voice;this.song.volume=.12;const finish=()=>{if(this.mediaVoice===voice){this.mediaVoice=null;this.song.volume=.4;}};voice.onended=finish;voice.onerror=()=>{finish();this.failed()};voice.play().catch(()=>{finish();this.failed()});return true;}
  stopVoice(){if(!this.native)return super.stopVoice();if(this.mediaVoice){this.mediaVoice.pause();this.mediaVoice=null;}if(this.song)this.song.volume=.4;}
  cue(name,opts={}){if(!this.native)return super.cue(name,opts);if(this.muted||document.hidden||!this.mediaUnlocked)return;const now=performance.now(),gap=['land','punch','kick','hit','block','select'].includes(name)?70:35;if(now-(this.recent.get(name)||-1000)<gap)return;this.recent.set(name,now);if(!['select','confirm','punch','kick','hit','block','jump','land','special','release','combo','round','fight','win','lose','phone','dash','ready'].includes(name))return;const fx=new Audio('assets/fx-v26/'+name+'.mp3');fx.volume=.85;fx.playsInline=true;this.effects.add(fx);const done=()=>this.effects.delete(fx);fx.onended=done;fx.onerror=done;fx.play().catch(done);if(this.effects.size>8){const old=this.effects.values().next().value;old.pause();this.effects.delete(old);}}
  stopEffects(){for(const fx of this.effects)fx.pause();this.effects.clear();}
  destroy(){document.removeEventListener('visibilitychange',this._nativeVisibility);this.song.pause();this.stopVoice();this.stopEffects();super.destroy();}
 };
})();
