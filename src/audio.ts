const BASE = `${import.meta.env.BASE_URL}assets/audio/`;
const LOOP_OVERLAP = 0.65;
export interface AudioSettings { music: number; sound: number; voice: number; shake: boolean; particles: boolean; }
type MusicLayer = { source: AudioBufferSourceNode; gain: GainNode; start: number; end: number };

export class AudioManager {
  settings: AudioSettings;
  context: AudioContext | null = null;
  music: AudioBufferSourceNode | null = null;
  voice: AudioBufferSourceNode | null = null;
  track = '';
  unlocked = false;
  lastSfx = new Map<string, number>();
  private musicBus: GainNode | null = null;
  private voiceBus: GainNode | null = null;
  private soundBus: GainNode | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private musicLayers = new Set<MusicLayer>();
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private musicVersion = 0;
  private loadingMusic = -1;
  private voiceVersion = 0;
  private voiceRequest = '';
  private nextLoop = 0;
  private suspended = false;
  private scheduler: number | null = null;

  constructor(settings: AudioSettings) {
    this.settings = settings;
    document.addEventListener('visibilitychange', () => this.suspend(document.hidden));
  }

  unlock() {
    if (!this.context) {
      try {
        const Context = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Context) return;
        this.context = new Context();
        this.musicBus = this.context.createGain();
        this.voiceBus = this.context.createGain();
        this.soundBus = this.context.createGain();
        this.musicBus.connect(this.context.destination);
        this.voiceBus.connect(this.context.destination);
        this.soundBus.connect(this.context.destination);
        this.updateSettings();
        // One scheduler owns all loops. Track changes cannot leave stale fade timers.
        this.scheduler = window.setInterval(() => this.scheduleMusic(), 100);
      } catch { return; }
    }
    this.unlocked = true;
    if (!this.suspended && !document.hidden) this.context.resume().catch(() => {});
    if (this.track && !this.musicBuffer) void this.loadMusic(this.track, this.musicVersion);
    if (this.voiceRequest && !this.voice) void this.loadVoice(this.voiceRequest, this.voiceVersion);
  }

  private buffer(name: string): Promise<AudioBuffer | null> {
    const existing = this.buffers.get(name);
    if (existing) {
      this.buffers.delete(name);
      this.buffers.set(name, existing);
      return existing;
    }
    const context = this.context;
    if (!context) return Promise.resolve(null);
    // MP3 works across desktop and mobile Safari, Chrome, and Firefox.
    const pending = fetch(`${BASE}${name}.mp3`).then(async response => {
      if (!response.ok) return null;
      return context.decodeAudioData(await response.arrayBuffer());
    }).catch(() => null);
    this.buffers.set(name, pending);
    // A few decoded tracks are sufficient; do not retain the whole soundtrack in RAM.
    while (this.buffers.size > 6) this.buffers.delete(this.buffers.keys().next().value!);
    return pending;
  }

  playMusic(name: string) {
    if (name === this.track) {
      if (!this.musicBuffer && this.context) void this.loadMusic(name, this.musicVersion);
      return;
    }
    this.track = name;
    this.musicBuffer = null;
    const version = ++this.musicVersion;
    if (this.context) void this.loadMusic(name, version);
  }

  private async loadMusic(name: string, version: number) {
    if (this.loadingMusic === version) return;
    this.loadingMusic = version;
    const buffer = await this.buffer(name);
    if (version !== this.musicVersion || name !== this.track || !this.context) return;
    this.loadingMusic = -1;
    if (!buffer) return;
    const now = this.context.currentTime;
    for (const layer of this.musicLayers) {
      layer.gain.gain.cancelScheduledValues(now);
      layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
      layer.gain.gain.linearRampToValueAtTime(0, now + 0.5);
      try { layer.source.stop(layer.start > now ? now : now + 0.52); } catch {}
    }
    this.musicBuffer = buffer;
    this.nextLoop = now + 0.02;
    this.scheduleMusic();
  }

  private scheduleMusic() {
    const context = this.context, buffer = this.musicBuffer;
    if (!context || !buffer || !this.musicBus || this.suspended || document.hidden) return;
    if (this.nextLoop > context.currentTime + 0.75) return;
    const start = Math.max(context.currentTime + 0.01, this.nextLoop);
    const overlap = Math.min(LOOP_OVERLAP, buffer.duration / 4);
    const source = context.createBufferSource(), gain = context.createGain();
    const layer: MusicLayer = { source, gain, start, end: start + buffer.duration };
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.musicBus);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(1, start + overlap);
    gain.gain.setValueAtTime(1, layer.end - overlap);
    gain.gain.linearRampToValueAtTime(0, layer.end);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.musicLayers.delete(layer);
      if (this.music === source) this.music = null;
    };
    this.musicLayers.add(layer);
    this.music = source;
    source.start(start);
    this.nextLoop = layer.end - overlap;
  }

  speak(name: string) {
    this.stopVoice();
    if (this.settings.voice <= 0) return;
    this.voiceRequest = name;
    if (this.context) void this.loadVoice(name, this.voiceVersion);
  }

  private async loadVoice(name: string, version: number) {
    const buffer = await this.buffer(name);
    if (!buffer || !this.context || !this.voiceBus || version !== this.voiceVersion || this.voiceRequest !== name || this.voice) return;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.voiceBus);
    this.voice = source;
    source.onended = () => {
      source.disconnect();
      if (this.voice !== source) return;
      this.voice = null;
      this.voiceRequest = '';
      this.updateMix(false);
    };
    this.updateMix(false);
    source.start();
  }

  stopVoice() {
    ++this.voiceVersion;
    this.voiceRequest = '';
    const voice = this.voice;
    this.voice = null;
    if (voice) { try { voice.stop(); } catch {} }
    this.updateMix(false);
  }

  private volume(value: number) { return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0; }

  private updateMix(immediate: boolean) {
    if (!this.context) return;
    const now = this.context.currentTime;
    const musicVolume = this.volume(this.settings.music) * 0.65 * (this.voice && this.settings.voice > 0 ? 0.25 : 1);
    if (this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(now);
      if (immediate) this.musicBus.gain.setValueAtTime(musicVolume, now);
      else this.musicBus.gain.setTargetAtTime(musicVolume, now, 0.08);
    }
    this.voiceBus?.gain.setValueAtTime(this.volume(this.settings.voice), now);
    this.soundBus?.gain.setValueAtTime(this.volume(this.settings.sound), now);
  }

  updateSettings() { this.updateMix(true); }

  suspend(on: boolean) {
    this.suspended = on || document.hidden;
    if (!this.context) return;
    // Suspending the shared clock preserves both the exact voice position and loop overlaps.
    if (this.suspended) this.context.suspend().catch(() => {});
    else if (this.unlocked) {
      this.context.resume().then(() => this.scheduleMusic()).catch(() => {});
    }
  }

  sfx(kind: 'shoot'|'hit'|'hurt'|'dash'|'xp'|'level'|'explode'|'click'|'boss'|'heal'|'evolve'|'death') {
    if (!this.context || !this.soundBus || this.settings.sound <= 0 || this.suspended || this.context.state !== 'running') return;
    const ctx = this.context, now = ctx.currentTime;
    const last = this.lastSfx.get(kind) ?? -10;
    const gate = kind === 'shoot' ? .1 : kind === 'hit' ? .065 : kind === 'xp' ? .075 : .03;
    if (now - last < gate) return;
    this.lastSfx.set(kind, now);
    const presets: Record<string, [number,number,number,OscillatorType,number]> = {
      shoot: [630,160,.065,'triangle',.08], hit: [170,65,.07,'square',.055], hurt:[170,45,.23,'sawtooth',.13],
      dash:[220,900,.15,'sine',.1], xp:[820+Math.random()*200,1300,.06,'sine',.06], level:[440,1320,.5,'triangle',.18],
      explode:[110,25,.35,'sawtooth',.13], click:[700,1000,.06,'sine',.13], boss:[120,40,.8,'sawtooth',.16],
      heal:[440,880,.35,'sine',.12], evolve:[220,1760,.85,'triangle',.19], death:[230,35,.9,'triangle',.18]
    };
    const [from,to,duration,type,vol] = presets[kind];
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=type; osc.frequency.setValueAtTime(from,now); osc.frequency.exponentialRampToValueAtTime(to,now+duration);
    gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(vol,now+.008); gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    osc.connect(gain); gain.connect(this.soundBus); osc.start(now); osc.stop(now+duration+.02);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
}
