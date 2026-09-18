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
let masterBus: DynamicsCompressorNode | null = null;

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
    // Camadas curtas de contato + um corpo grave simulam um dado quicando
    // sobre uma mesa, sem depender de arquivos de áudio externos.
    noiseSweep(context, now, 185, 92, .92, level * .045);
    const ticks = [0, .042, .09, .145, .208, .282, .366, .46, .565, .68, .805, .91];
    ticks.forEach((offset, index) => {
      const decay = Math.max(.075, .19 - index * .0085);
      const pitch = 680 + index * 61 + (index % 2 ? 55 : -25);
      noiseHit(context, now + offset, pitch, .016 + index * .0016, level * decay);
      if (index % 4 === 0) tone(context, now + offset, 104 - index * 2.4, .04, level * .045, "triangle", .7);
    });
    return;
  }

  if (kind === "dice-impact") {
    // Pancada principal + dois micro-quiques dão sensação física ao assentamento.
    noiseHit(context, now, 470, .095, level * .29);
    noiseHit(context, now + .018, 1180, .034, level * .105);
    tone(context, now, 72, .18, level * .155, "sine", .46);
    noiseHit(context, now + .072, 760, .028, level * .082);
    noiseHit(context, now + .132, 910, .022, level * .048);
    return;
  }

  if (kind === "dice-critical") {
    noiseHit(context, now, 500, .1, level * .31);
    tone(context, now, 68, .22, level * .17, "sine", .4);
    noiseHit(context, now + .07, 810, .03, level * .075);
    tone(context, now + .055, 392, .3, level * .085, "sine", 1.5);
    tone(context, now + .125, 587, .36, level * .072, "sine", 1.35);
    tone(context, now + .205, 784, .42, level * .06, "sine", 1.18);
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
  gain.connect(outputNode(context));
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
  gain.connect(outputNode(context));
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
  gain.connect(outputNode(context));
  source.start(start, 0, Math.min(duration + .04, source.buffer.duration));
  source.stop(start + duration + .05);
}


function outputNode(context: AudioContext) {
  if (masterBus && masterBus.context === context) return masterBus;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.knee.value = 18;
  compressor.ratio.value = 5;
  compressor.attack.value = .003;
  compressor.release.value = .18;
  compressor.connect(context.destination);
  masterBus = compressor;
  return compressor;
}
