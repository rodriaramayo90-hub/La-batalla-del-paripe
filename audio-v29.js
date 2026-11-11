/* Original battle score and creature sound; es-AR neural voice recordings. */
(function () {
  'use strict';
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  class ArcadeAudio {
    constructor() {
      this.context = null;
      this.muted = false;
      try { this.muted = localStorage.getItem('paripe-audio-muted') === '1'; } catch (_) {}
      this.musicWanted = false;
      this.recordedMusic = null; this.voiceSource = null; this.buffers = new Map();
      this.mediaReady = Promise.all(['battle-theme','trex-shriek',...Array.from({length:13},(_,i)=>i===1?null:'voice-'+i).filter(Boolean)].map(async name=>{
        const response=await fetch('assets/'+(['voice-2','voice-12'].includes(name)?'audio-v29/':['voice-5','trex-shriek'].includes(name)?'audio-v28/':['voice-4','voice-10'].includes(name)?'audio-v15/':name==='voice-7'?'audio-v14/':'audio-v13/')+name+'.mp3');
        if(!response.ok)throw new Error('Audio '+name+': '+response.status);
        return [name,await response.arrayBuffer()];
      }));
      this.mediaReady.catch(()=>{});
      this.musicTimer = null;
      this.nextStepAt = 0;
      this.step = 0;
      this.voices = new Set();
      this.recent = new Map();
      this.resumePending = null;
      this.volume = .72;
      this._onVisibility = () => {
        if (document.hidden) {
          this._stopClock();
          if (this.context && this.context.state === 'running') this.context.suspend().catch(() => {});
        } else if (this.context && !this.muted) {
          this.unlock().then(() => { if (this.musicWanted) this._startClock(); }).catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', this._onVisibility);
    }

    async unlock() {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return false;
      if (this.context?.state === 'closed') {this._stopClock();this.context=null;this.buffers.clear();}
      if (!this.context) {
        try {
          this.context = new Context({ latencyHint: 'interactive' });
          // Request the media playback route on supported mobile browsers.
          try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(_){}
          this.context.onstatechange=()=>{
            if(this.context.state==='running'&&this.musicWanted&&!this.muted&&!document.hidden)this._startClock();
            if(typeof this.onStateChange==='function')this.onStateChange();
          };
          this._buildGraph();
          this.decodedReady=this.mediaReady.then(async entries=>{
            for(const [name,bytes] of entries)this.buffers.set(name,await this.context.decodeAudioData(bytes.slice(0)));
            if(this.musicWanted&&!this.muted&&!document.hidden)this._startClock();
            return true;
          }).catch(error=>{console.error('Recorded audio unavailable',error);this.recordingFailed=true;if(this.musicWanted)this._startClock();return false});
        } catch (_) { this.context = null; return false; }
      }
      // Call resume on EVERY eligible gesture. A touch-down request can remain
      // pending until touch-end; sharing that pending promise prevents a retry.
      let resumed=Promise.resolve();
      if(this.context.state!=='running'){
        try{resumed=Promise.resolve(this.context.resume()).catch(()=>{});}catch(_){}
      }
      // Prime the hardware output synchronously while user activation is valid.
      try{const silent=this.context.createBufferSource();silent.buffer=this.context.createBuffer(1,1,this.context.sampleRate);silent.connect(this.context.destination);silent.onended=()=>silent.disconnect();silent.start(0);}catch(_){}
      await resumed;
      if (this.context.state === 'running' && this.musicWanted && !this.muted) this._startClock();
      return this.context.state === 'running';
    }

    _buildGraph() {
      const c = this.context;
      this.master = c.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = -13;
      limiter.knee.value = 12;
      limiter.ratio.value = 5;
      limiter.attack.value = .003;
      limiter.release.value = .12;
      this.master.connect(limiter);
      limiter.connect(c.destination);
      this.fx = c.createGain(); this.fx.gain.value = .64; this.fx.connect(this.master);
      this.music = c.createGain(); this.music.gain.value = .22; this.music.connect(this.master);
      // A quiet stereo echo gives the melodic instruments space without blurring hits.
      this.echo = c.createDelay(.7); this.echo.delayTime.value = 60 / 122 * .75;
      const feedback = c.createGain(); feedback.gain.value = .22;
      const echoTone = c.createBiquadFilter(); echoTone.type = 'lowpass'; echoTone.frequency.value = 3200;
      const echoLevel = c.createGain(); echoLevel.gain.value = .13;
      this.echo.connect(echoTone); echoTone.connect(feedback); feedback.connect(this.echo);
      echoTone.connect(echoLevel); echoLevel.connect(this.music);
      const count = Math.ceil(c.sampleRate * 2);
      this.noiseBuffer = c.createBuffer(1, count, c.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < count; i++) {
        // A blend of white and slightly correlated noise avoids brittle speaker hiss.
        const white = Math.random() * 2 - 1;
        last = (last + white * .08) / 1.08;
        data[i] = white * .75 + last * .6;
      }
    }

    setMuted(muted) {
      this.muted = !!muted;
      try { localStorage.setItem('paripe-audio-muted', this.muted ? '1' : '0'); } catch (_) {}
      if (this.context && this.master) {
        const t = this.context.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, t, .018);
      }
      if (this.muted) this._stopClock();
      else if (this.musicWanted && this.context && this.context.state === 'running') this._startClock();
      return this.muted;
    }

    startMusic() {
      this.musicWanted = true;
      if (this.context && this.context.state === 'running' && !this.muted) this._startClock();
    }

    stopMusic() { this.musicWanted = false; this._stopClock(); }

    playVoice(id) {
      if(this.muted||document.hidden||!this.context||this.context.state!=='running')return false;
      const buffer=this.buffers.get(id===1?'trex-shriek':'voice-'+id);
      if(!buffer)return false;
      this.stopVoice();
      const source=this.context.createBufferSource(),gain=this.context.createGain();
      source.buffer=buffer;gain.gain.value=id===1?.8:1.15;
      source.connect(gain);gain.connect(this.master);this.voiceSource=source;
      this.music.gain.setTargetAtTime(.12,this.context.currentTime,.025);
      source.onended=()=>{gain.disconnect();if(this.voiceSource===source){this.voiceSource=null;if(this.musicWanted)this.music.gain.setTargetAtTime(.4,this.context.currentTime,.2)}};
      source.start();return true;
    }
    stopVoice(){if(this.voiceSource){const source=this.voiceSource;this.voiceSource=null;try{source.stop()}catch(_){}}}
    _stopClock() {
      if(this.recordedMusic){try{this.recordedMusic.stop()}catch(_){}this.recordedMusic=null;}
      this.stopVoice();
      if (this.musicTimer !== null) clearInterval(this.musicTimer);
      this.musicTimer = null;
      // Scheduled notes have short envelopes and fade naturally; no stuck oscillators.
      if (this.context && this.music) this.music.gain.setTargetAtTime(.001, this.context.currentTime, .07);
    }

    _startClock() {
      if(!this.recordingFailed){
        if(this.recordedMusic||this.muted||document.hidden||!this.context||this.context.state!=='running')return;
        const buffer=this.buffers.get('battle-theme');if(!buffer)return;
        const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.music);
        this.music.gain.setTargetAtTime(.4,this.context.currentTime,.09);source.start();this.recordedMusic=source;return;
      }
      if (this.musicTimer !== null || this.muted || document.hidden || !this.context || this.context.state !== 'running') return;
      this.music.gain.setTargetAtTime(.22, this.context.currentTime, .09);
      this.nextStepAt = this.context.currentTime + .04;
      const schedule = () => {
        if (!this.context || this.context.state !== 'running' || this.muted || document.hidden) { this._stopClock(); return; }
        // If a tab or main-thread stall interrupted us, resume here rather than catch up.
        if (this.nextStepAt < this.context.currentTime - .12) this.nextStepAt = this.context.currentTime + .025;
        let limit = 0;
        while (this.nextStepAt < this.context.currentTime + .14 && limit++ < 6) {
          this._musicStep(this.step++, this.nextStepAt);
          this.nextStepAt += 60 / 122 / 4;
        }
      };
      schedule();
      this.musicTimer = setInterval(schedule, 45);
    }

    _track(node, until) {
      this.voices.add(node);
      node.onended = () => { this.voices.delete(node); try { node.disconnect(); } catch (_) {} };
      if (this.voices.size > 80) {
        const oldest = this.voices.values().next().value;
        try { oldest.stop(); } catch (_) {}
        this.voices.delete(oldest);
      }
      node.stop(until);
    }

    _output(bus, pan) {
      if (!this.context.createStereoPanner || !pan) return { input: bus, cleanup: () => {} };
      const panner = this.context.createStereoPanner();
      panner.pan.value = clamp(pan, -1, 1);
      panner.connect(bus);
      return { input: panner, cleanup: () => panner.disconnect() };
    }

    _tone({ at, dur = .16, freq = 220, end = freq, type = 'sine', gain = .2, bus = this.fx, pan = 0, attack = .003, cutoff = 0, echo = false }) {
      const c = this.context, osc = c.createOscillator(), env = c.createGain();
      const output = this._output(bus, pan);
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(12, freq), at);
      osc.frequency.exponentialRampToValueAtTime(Math.max(12, end), at + dur);
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(gain, at + Math.min(attack, dur * .4));
      env.gain.exponentialRampToValueAtTime(.0001, at + dur);
      let filter;
      if (cutoff) { filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = cutoff; osc.connect(filter); filter.connect(env); }
      else osc.connect(env);
      env.connect(output.input);
      if (echo) env.connect(this.echo);
      osc.start(at);
      this._track(osc, at + dur + .02);
      const ended = osc.onended;
      osc.onended = () => { ended(); env.disconnect(); if (filter) filter.disconnect(); output.cleanup(); };
    }

    _noise({ at, dur = .12, freq = 1500, end = freq, type = 'bandpass', gain = .18, q = .7, bus = this.fx, pan = 0, attack = .002 }) {
      const c = this.context, source = c.createBufferSource(), filter = c.createBiquadFilter(), env = c.createGain();
      const output = this._output(bus, pan);
      source.buffer = this.noiseBuffer;
      filter.type = type; filter.Q.value = q;
      filter.frequency.setValueAtTime(Math.max(30, freq), at);
      filter.frequency.exponentialRampToValueAtTime(Math.max(30, end), at + dur);
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(gain, at + Math.min(attack, dur * .4));
      env.gain.exponentialRampToValueAtTime(.0001, at + dur);
      source.connect(filter); filter.connect(env); env.connect(output.input);
      source.start(at, Math.random() * .7);
      this._track(source, at + dur + .015);
      const ended = source.onended;
      source.onended = () => { ended(); env.disconnect(); filter.disconnect(); output.cleanup(); };
    }

    _musicStep(step, at) {
      const sixteenth = 60 / 122 / 4, bar = Math.floor(step / 16), beat = step % 16;
      // Original 8-bar D-minor / Bb / C / A progression with changing upper voices.
      const roots = [38, 38, 34, 34, 36, 36, 33, 33], root = roots[bar % 8];
      if ([0, 6, 8, 11].includes(beat)) {
        this._tone({ at, dur: .17, freq: 150, end: 43, gain: .62, bus: this.music });
        this._noise({ at, dur: .025, freq: 1800, gain: .09, bus: this.music });
      }
      if (beat === 4 || beat === 12) {
        this._noise({ at, dur: .14, freq: 1850, end: 900, type: 'highpass', gain: .48, bus: this.music });
        this._tone({ at, dur: .105, freq: 186, end: 92, type: 'triangle', gain: .27, bus: this.music });
        this._noise({ at: at + .014, dur: .06, freq: 4100, gain: .14, bus: this.music, pan: .1 });
      }
      if (beat % 2 === 0) this._noise({ at, dur: beat === 14 ? .095 : .035, freq: 7100, type: 'highpass', gain: beat % 4 === 0 ? .14 : .09, bus: this.music, pan: beat % 4 ? .3 : -.25 });
      if ([0, 3, 6, 8, 10, 14].includes(beat)) {
        const note = root + (beat === 6 || beat === 14 ? 12 : 0);
        this._tone({ at, dur: sixteenth * 1.8, freq: midi(note), type: 'sawtooth', gain: .17, cutoff: 650, bus: this.music });
        this._tone({ at, dur: sixteenth * 1.4, freq: midi(note - 12), gain: .23, bus: this.music });
      }
      if (beat === 0 || beat === 10) {
        const third = root === 33 ? 4 : 3;
        for (const interval of [12, 12 + third, 19]) this._tone({ at, dur: .42, freq: midi(root + interval), type: 'triangle', gain: .055, bus: this.music, pan: (interval - 15) / 15, echo: true, attack: .025 });
      }
      const motif = [12, null, 15, 19, null, 22, 19, null, 15, null, 12, 10, null, 15, 19, 22];
      const note = motif[beat];
      if (note !== null && (bar % 4 >= 2 || beat % 4 === 2)) {
        this._tone({ at, dur: .12, freq: midi(root + note + 12), type: 'square', gain: .048, cutoff: 2600, bus: this.music, pan: -.18, echo: true });
      }
      if (bar % 8 === 7 && beat >= 14) this._noise({ at, dur: .07, freq: 2300, gain: .17, bus: this.music, pan: .25 });
    }

    cue(name, opts = {}) {
      if (!this.context || this.context.state !== 'running' || this.muted || document.hidden) return;
      const now = this.context.currentTime;
      const gaps = { select: .045, punch: .07, kick: .09, hit: .045, block: .075, land: .09, combo: .12 };
      if (now - (this.recent.get(name) ?? -10) < (gaps[name] || .035)) return;
      this.recent.set(name, now);
      const pan = clamp(Number(opts.pan) || 0, -.85, .85), power = clamp(Number(opts.intensity) || 1, .35, 1.6), at = now + .004;
      const tone = o => this._tone({ at, pan, ...o, gain: (o.gain || .2) * power });
      const noise = o => this._noise({ at, pan, ...o, gain: (o.gain || .18) * power });
      const notes = (sequence, type = 'triangle', speed = .095, gain = .22) => sequence.forEach((n, i) => tone({ at: at + i * speed, freq: midi(n), end: midi(n) * .995, dur: speed * 2.1, type, gain, echo: true }));
      switch (name) {
        case 'select':
          tone({ freq: 610, end: 920, type: 'triangle', gain: .15, dur: .075 });
          noise({ freq: 5100, gain: .035, dur: .025 });
          break;
        case 'confirm': notes([62, 69, 74], 'square', .065, .10); break;
        case 'punch':
          noise({ freq: 1000, end: 4300, q: .65, dur: .13, gain: .24, attack: .014 });
          tone({ freq: 180, end: 72, dur: .085, gain: .19 });
          break;
        case 'kick':
          noise({ freq: 600, end: 3100, dur: .2, gain: .3, attack: .024 });
          tone({ freq: 155, end: 43, dur: .16, gain: .26 });
          break;
        case 'hit': {
          const pitch = .94 + Math.random() * .12;
          tone({ freq: 132 * pitch, end: 37, dur: .18, gain: .65 });
          tone({ freq: 310 * pitch, end: 100, type: 'triangle', dur: .075, gain: .23 });
          noise({ freq: 1450, end: 540, dur: .13, gain: .44, q: .45 });
          noise({ freq: 3900, type: 'highpass', dur: .027, gain: .17 });
          break;
        }
        case 'block':
          tone({ freq: 745, end: 592, type: 'triangle', dur: .19, gain: .18 });
          tone({ freq: 1180, end: 990, type: 'sine', dur: .115, gain: .13 });
          noise({ freq: 2700, dur: .05, gain: .26, q: 2.1 });
          tone({ freq: 104, end: 70, dur: .1, gain: .22 });
          break;
        case 'jump':
          noise({ freq: 700, end: 2800, dur: .16, gain: .12, attack: .018 });
          tone({ freq: 120, end: 270, type: 'triangle', dur: .16, gain: .11 });
          break;
        case 'land':
          tone({ freq: 100, end: 39, dur: .16, gain: .33 });
          noise({ freq: 650, end: 180, dur: .12, gain: .16 });
          break;
        case 'special': {
          const id = Number.isFinite(opts.id) ? opts.id : 0;
          tone({ freq: 90, end: 380, type: 'sawtooth', cutoff: 1700, dur: .32, gain: .16, attack: .06 });
          noise({ freq: 400, end: 6100, dur: .36, gain: .28, attack: .14 });
          const root = [50, 45, 57, 53, 54, 55, 48, 59, 51, 56, 60, 52][id % 12];
          for (let i = 0; i < 4; i++) tone({ at: at + i * .055, freq: midi(root + [0, 7, 12, 19][i]), type: id === 10 ? 'sine' : 'triangle', dur: .22, gain: .16, echo: true });
          break;
        }
        case 'release': {
          const id = Number(opts.id) || 0;
          noise({ freq: id === 10 ? 1500 : 1100, end: 4600, dur: .19, gain: .28 });
          tone({ freq: id === 7 ? 820 : 230, end: id === 7 ? 500 : 74, dur: .13, gain: .22, type: 'triangle' });
          break;
        }
        case 'combo': notes([74, 77, 81 + Math.min(5, Number(opts.count) || 0)], 'triangle', .055, .13); break;
        case 'round':
          tone({ freq: 108, end: 41, dur: .5, gain: .45 });
          notes([50, 57, 62, 69], 'sawtooth', .12, .075);
          noise({ at: at + .36, freq: 2500, end: 800, dur: .25, gain: .17 });
          break;
        case 'fight':
          tone({ freq: 165, end: 44, dur: .28, gain: .62 });
          noise({ freq: 2400, end: 500, dur: .25, gain: .37 });
          notes([62, 74], 'square', .06, .09);
          break;
        case 'win':
          notes([62, 65, 69, 74, 72, 74, 77, 81], 'triangle', .115, .23);
          for (const n of [50, 57, 62]) tone({ at: at + .8, freq: midi(n), dur: .9, type: 'triangle', gain: .14, attack: .015, echo: true });
          noise({ at: at + .82, freq: 5500, type: 'highpass', dur: .55, gain: .11 });
          break;
        case 'lose':
          notes([62, 60, 57, 53, 50], 'triangle', .19, .17);
          tone({ at: at + .72, freq: 100, end: 35, dur: .55, gain: .3 });
          break;
        case 'phone':
          // Llamada de T-Rex: timbre corto de dos notas, sin archivos de terceros.
          for(let i=0;i<3;i++){
            tone({at:at+i*.34,freq:midi(81),end:midi(81),type:'sine',dur:.13,gain:.13});
            tone({at:at+i*.34+.14,freq:midi(76),end:midi(76),type:'sine',dur:.13,gain:.13});
          }
          break;
        case 'dash': noise({ freq: 500, end: 5200, dur: .13, gain: .2, attack: .012 }); break;
        case 'ready': notes([62, 69], 'triangle', .07, .14); break;
        default: break;
      }
    }

    destroy() {
      this.musicWanted = false;
      this._stopClock();
      document.removeEventListener('visibilitychange', this._onVisibility);
      for (const voice of this.voices) { try { voice.stop(); } catch (_) {} }
      this.voices.clear();
      if(this.context)this.context.onstatechange=null;
      if (this.context && this.context.state !== 'closed') this.context.close().catch(() => {});
    }
  }

  window.ArcadeAudio = ArcadeAudio;
})();
