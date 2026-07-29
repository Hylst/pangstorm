import { Howl } from 'howler';

let _sharedCtx: AudioContext | null = null;
function audioCtx(): AudioContext {
  if (!_sharedCtx) {
    _sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return _sharedCtx;
}

// synthèse sonore à la zob — avec des maths on fait des bruits
function generateTone(
  duration: number,
  freqStart: number,
  freqEnd: number,
  type: 'square' | 'sawtooth' | 'sine' | 'noise' = 'square',
  vol = 0.15,
  decay = 1,
): string {
  const ctx = audioCtx();
  const sampleRate = ctx.sampleRate;
  const frames = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < frames; i++) {
    const t = i / sampleRate;
    const progress = i / frames;
    const freq = freqStart + (freqEnd - freqStart) * progress;
    const phase = (t * freq) % 1;
    const env = Math.pow(1 - progress, decay);
    let sample = 0;
    if (type === 'square') sample = phase < 0.5 ? 1 : -1;
    else if (type === 'sawtooth') sample = phase * 2 - 1;
    else if (type === 'sine') sample = Math.sin(t * freq * Math.PI * 2);
    else sample = Math.random() * 2 - 1;
    data[i] = sample * env * vol;
  }
  return URL.createObjectURL(new Blob([toWav(buffer)], { type: 'audio/wav' }));
}

function generateChord(
  duration: number,
  freqs: number[],
  type: 'sine' | 'square' | 'sawtooth' = 'sine',
  vol = 0.16,
): string {
  const ctx = audioCtx();
  const sampleRate = ctx.sampleRate;
  const frames = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const progress = i / frames;
    const t = i / sampleRate;
    const env = Math.pow(1 - progress, 1.2);
    let sample = 0;
    for (const f of freqs) {
      const phase = (t * f) % 1;
      if (type === 'sine') sample += Math.sin(t * f * Math.PI * 2);
      else if (type === 'square') sample += phase < 0.5 ? 1 : -1;
      else sample += phase * 2 - 1;
    }
    sample /= freqs.length;
    data[i] = sample * env * vol;
  }
  return URL.createObjectURL(new Blob([toWav(buffer)], { type: 'audio/wav' }));
}

function generateNoise(duration: number, vol = 0.12, tone = 800): string {
  const ctx = audioCtx();
  const sampleRate = ctx.sampleRate;
  const frames = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const progress = i / frames;
    const env = Math.exp(-progress * 5);
    const noise = Math.random() * 2 - 1;
    const toneSample = Math.sin(i * tone * Math.PI * 2 / sampleRate);
    data[i] = (noise * 0.6 + toneSample * 0.4) * env * vol;
  }
  return URL.createObjectURL(new Blob([toWav(buffer)], { type: 'audio/wav' }));
}

function generateSweep(duration: number, freqStart: number, freqEnd: number, vol = 0.18): string {
  const ctx = audioCtx();
  const sampleRate = ctx.sampleRate;
  const frames = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const progress = i / frames;
    const t = i / sampleRate;
    const freq = freqStart * Math.pow(freqEnd / freqStart, progress);
    const env = Math.sin(progress * Math.PI); // swell in and out
    data[i] = Math.sin(t * freq * Math.PI * 2) * env * vol;
  }
  return URL.createObjectURL(new Blob([toWav(buffer)], { type: 'audio/wav' }));
}

// convertir un AudioBuffer en WAV, à l'arrache
function toWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  const channels: Float32Array[] = [];
  let sample;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
  setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2); setUint16(16);
  setUint32(0x61746164); setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return out;
}

const soundBank: Record<string, Howl> = {};
const musicTracks: Howl[] = [];
let currentTrack = -1;

function ensureSound(name: string, url: string, vol = 0.5) {
  if (!soundBank[name]) {
    soundBank[name] = new Howl({ src: [url], format: ['wav'], volume: vol });
  }
}

export async function initSounds() {
  ensureSound('shot',      generateTone(0.14, 1200, 2400, 'square', 0.11, 1.5));
  ensureSound('shot2',     generateTone(0.16, 1600, 2600, 'square', 0.10, 1.3));
  ensureSound('pop',       generateChord(0.20, [660, 990, 1320], 'sine', 0.20));
  ensureSound('split',     generateTone(0.24, 440, 990, 'sawtooth', 0.17, 1.4));
  ensureSound('hit',       generateNoise(0.5, 0.26, 160));
  ensureSound('levelup',   generateSweep(0.9, 392, 1568, 0.22));
  ensureSound('gameover',  generateSweep(1.3, 880, 110, 0.22));
  ensureSound('start',     generateSweep(0.6, 330, 880, 0.18));
  ensureSound('powerup',   generateChord(0.45, [523, 659, 784, 1046], 'sine', 0.18));
  ensureSound('uplife',    generateChord(0.5, [784, 988, 1175, 1568], 'sine', 0.18));
  ensureSound('bounce',    generateTone(0.07, 220, 160, 'sine', 0.06, 2));
  ensureSound('charge',    generateSweep(0.5, 200, 1200, 0.10));
  ensureSound('combo',     generateChord(0.3, [784, 988, 1318], 'square', 0.14));
  ensureSound('milestone', generateChord(0.7, [523, 659, 784, 1046, 1318], 'square', 0.18));
}

export function playSfx(name: keyof typeof soundBank) {
  const howl = soundBank[name];
  if (howl) howl.play();
}

interface TrackSpec {
  bpm: number;
  bass: number[];     // 16 steps
  arp: number[];      // 16 steps
  lead: number[];     // 16 steps (0 = rest)
  drumStyle: 'house' | 'break' | 'four' | 'trap';
  mood: 'bright' | 'dark' | 'warm' | 'cold' | 'epic';
}

const TRACKS: TrackSpec[] = [
  // 0 - Cyber city (bright house)
  {
    bpm: 124, drumStyle: 'house', mood: 'bright',
    bass: [110,0,110,0, 146.8,0,146.8,0, 98,0,98,0, 130.8,0,130.8,0],
    arp:  [523,659,784,1046, 659,784,1046,1318, 784,659,523,659, 1046,784,659,523],
    lead: [1046,0,1318,0, 0,1568,0,1318, 1046,0,880,0, 659,784,988,1046],
  },
  // 1 - Magma (dark break)
  {
    bpm: 138, drumStyle: 'break', mood: 'dark',
    bass: [82.4,82.4,0,82.4, 110,0,110,110, 73.4,0,73.4,0, 98,98,0,98],
    arp:  [440,523,659,523, 440,587,659,587, 392,494,587,494, 349,440,523,440],
    lead: [880,0,1046,880, 0,659,587,0, 784,0,659,0, 523,587,659,784],
  },
  // 2 - Bio lumen (warm)
  {
    bpm: 116, drumStyle: 'four', mood: 'warm',
    bass: [146.8,0,146.8,0, 196,0,196,0, 164.8,0,164.8,0, 220,0,220,0],
    arp:  [523,659,784,659, 587,740,880,740, 659,784,988,784, 587,740,880,740],
    lead: [784,0,988,0, 880,0,784,0, 659,587,523,0, 659,784,880,988],
  },
  // 3 - Crystal (cold)
  {
    bpm: 108, drumStyle: 'four', mood: 'cold',
    bass: [130.8,0,164.8,0, 196,0,164.8,0, 130.8,0,164.8,0, 196,0,246.9,0],
    arp:  [659,0,784,0, 988,0,784,0, 659,0,880,0, 1046,0,880,0],
    lead: [1046,0,0,1318, 0,1568,0,0, 1175,0,1046,0, 880,988,1046,1318],
  },
  // 4 - Nebula (epic)
  {
    bpm: 132, drumStyle: 'trap', mood: 'epic',
    bass: [55,0,65.4,0, 82.4,0,98,0, 110,0,98,0, 82.4,0,65.4,0],
    arp:  [440,523,659,784, 880,784,659,523, 440,587,740,880, 988,740,587,440],
    lead: [880,0,1108,0, 1318,0,1108,880, 659,0,880,0, 1108,1318,1108,880],
  },
];

function generateMusicTrack(spec: TrackSpec, duration: number): string {
  const ctx = audioCtx();
  const sampleRate = ctx.sampleRate;
  const frames = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, frames, sampleRate);
  const beatDuration = 60 / spec.bpm / 4; // 16th note

  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    const pan = c === 0 ? 0.9 : 1.1;
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const step16 = Math.floor(t / beatDuration);
      const step = step16 % 16;
      const phaseIn16 = (t / beatDuration) - step16; // 0..1 within a 16th
      const phaseInBeat = ((t / beatDuration) % 4) / 4; // 0..1 within a beat (4 sixteenths)

      let out = 0;

      if (step % 4 === 0) {
        const kickFreq = 55 * Math.exp(-phaseInBeat * 8) + 40;
        const kickEnv = Math.exp(-phaseInBeat * 9);
        out += Math.sin(t * kickFreq * Math.PI * 2) * kickEnv * 0.5;
      }

      if (step % 2 === 1) {
        const hatEnv = Math.exp(-phaseIn16 * 30);
        out += (Math.random() * 2 - 1) * hatEnv * 0.10;
      }

      if (step === 4 || step === 12) {
        const snareEnv = Math.exp(-phaseInBeat * 12);
        out += (Math.random() * 2 - 1) * snareEnv * 0.14;
        out += Math.sin(t * 200 * Math.PI * 2) * snareEnv * 0.06;
      }

      const bassFreq = spec.bass[step];
      if (bassFreq) {
        const bassEnv = Math.exp(-phaseIn16 * 3);
        const bp = (t * bassFreq) % 1;
        out += (bp < 0.5 ? 1 : -1) * bassEnv * 0.22;
      }

      const arpFreq = spec.arp[step];
      if (arpFreq) {
        const arpEnv = Math.exp(-phaseIn16 * 6);
        out += Math.sin(t * arpFreq * Math.PI * 2) * arpEnv * 0.12;
      }

      const leadFreq = spec.lead[step];
      if (leadFreq) {
        const leadEnv = Math.exp(-phaseIn16 * 2.5);
        const lp = (t * leadFreq) % 1;
        out += ((lp < 0.5 ? 1 : -1) * 0.6 + Math.sin(t * leadFreq * Math.PI * 2) * 0.4) * leadEnv * 0.10;
      }

      data[i] = Math.tanh(out * 0.9) * pan * 0.65;
    }
  }

  return URL.createObjectURL(new Blob([toWav(buffer)], { type: 'audio/wav' }));
}

export async function initMusic() {
  if (musicTracks.length > 0) return;
  for (const spec of TRACKS) {
    const url = generateMusicTrack(spec, 19.2); // 19.2s loops cleanly
    musicTracks.push(new Howl({ src: [url], format: ['wav'], loop: true, volume: 0.22 }));
  }
}

export function playMusicForLevel(level: number) {
  const idx = (level - 1) % musicTracks.length;
  if (idx === currentTrack && musicTracks[idx]?.playing()) return;

  musicTracks.forEach((t, i) => {
    if (i === idx) {
      if (!t.playing()) t.play();
      t.fade(0, 0.22, 900);
    } else {
      if (t.playing()) t.fade(0.22, 0, 600);
      setTimeout(() => t.stop(), 700);
    }
  });
  currentTrack = idx;
}

export function stopMusic() {
  musicTracks.forEach(t => t.stop());
  currentTrack = -1;
}

export function toggleMusic(mute: boolean) {
  musicTracks.forEach(t => t.mute(mute));
}

export function setMusicVolume(vol: number) {
  musicTracks.forEach(t => t.volume(vol));
}

export function setSfxVolume(vol: number) {
  Object.values(soundBank).forEach(h => h.volume(vol));
}
