export type SoundFxKind =
  | "ui-click"
  | "ui-navigate"
  | "ui-open"
  | "paper"
  | "notify"
  | "dice-roll"
  | "dice-impact"
  | "dice-critical"
  | "combat-enter"
  | "paranormal";

let sharedContext: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext;
  if (!AudioCtor) return null;
  sharedContext ??= new AudioCtor();
  return sharedContext;
}

export function unlockSoundFx() {
  const context = getContext();
  if (!context) return null;
  if (context.state === "suspended") void context.resume();
  return context;
}

export function playSoundFx(kind: SoundFxKind, volume = 0.5) {
  const context = unlockSoundFx();
  if (!context || volume <= 0) return;
  const level = Math.max(0.001, Math.min(1, volume));
  const now = context.currentTime;

  if (kind === "dice-roll") {
    const ticks = [0, .045, .095, .15, .215, .29, .375, .47, .575, .69, .82];
    ticks.forEach((offset, index) => {
      noiseHit(context, now + offset, 720 + index * 72, .018 + index * .002, level * (.22 - index * .008));
      if (index % 3 === 0) tone(context, now + offset, 95 + index * 4, .035, level * .055, "triangle", .62);
    });
    return;
  }

  if (kind === "dice-impact") {
    noiseHit(context, now, 540, .085, level * .34);
    noiseHit(context, now + .022, 1220, .035, level * .13);
    tone(context, now, 76, .16, level * .18, "sine", .48);
    return;
  }

  if (kind === "dice-critical") {
    noiseHit(context, now, 620, .09, level * .36);
    tone(context, now, 70, .2, level * .2, "sine", .42);
    tone(context, now + .045, 392, .28, level * .095, "sine", 1.5);
    tone(context, now + .11, 587, .34, level * .08, "sine", 1.35);
    tone(context, now + .19, 784, .4, level * .07, "sine", 1.2);
    return;
  }

  if (kind === "paper") {
    noiseSweep(context, now, 900, 2600, .22, level * .12);
    noiseHit(context, now + .05, 1700, .05, level * .08);
    return;
  }

  if (kind === "combat-enter") {
    tone(context, now, 52, .28, level * .22, "sine", .55);
    noiseHit(context, now + .015, 380, .12, level * .22);
    tone(context, now + .12, 110, .18, level * .085, "triangle", 1.55);
    return;
  }

  if (kind === "paranormal") {
    tone(context, now, 48, .72, level * .11, "sawtooth", 2.15);
    tone(context, now + .08, 73, .82, level * .075, "sine", 1.62);
    noiseSweep(context, now + .02, 340, 1180, .68, level * .07);
    return;
  }

  if (kind === "notify") {
    tone(context, now, 440, .12, level * .075, "sine", 1.3);
    tone(context, now + .105, 660, .16, level * .065, "sine", 1.15);
    return;
  }

  if (kind === "ui-open") {
    tone(context, now, 190, .075, level * .045, "sine", 1.55);
    tone(context, now + .035, 310, .08, level * .035, "sine", 1.35);
    return;
  }

  if (kind === "ui-navigate") {
    tone(context, now, 245, .055, level * .035, "sine", 1.25);
    return;
  }

  tone(context, now, 330, .045, level * .03, "sine", 1.12);
}

function tone(context: AudioContext, start: number, frequency: number, duration: number, volume: number, type: OscillatorType, endRatio = 1) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency * endRatio), start + duration);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(.012, duration * .2));
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .02);
}

function ensureNoise(context: AudioContext) {
  if (noiseBuffer && noiseBuffer.sampleRate === context.sampleRate) return noiseBuffer;
  const length = Math.ceil(context.sampleRate * .8);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 0x2f6e2b1;
  for (let i = 0; i < length; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[i] = (seed / 0xffffffff) * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

function noiseHit(context: AudioContext, start: number, frequency: number, duration: number, volume: number) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = ensureNoise(context);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(frequency, start);
  filter.Q.setValueAtTime(.8, start);
  gain.gain.setValueAtTime(Math.max(.0002, volume), start);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(start, 0, Math.min(duration + .03, source.buffer.duration));
  source.stop(start + duration + .04);
}

function noiseSweep(context: AudioContext, start: number, from: number, to: number, duration: number, volume: number) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = ensureNoise(context);
  filter.type = "bandpass";
  filter.Q.value = .45;
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + .025);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(start, 0, Math.min(duration + .04, source.buffer.duration));
  source.stop(start + duration + .05);
}
