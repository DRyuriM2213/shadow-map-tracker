import { useCallback, useEffect, useRef, useState } from "react";

export type PlayerIntensity = "sobrio" | "paranormal";
export interface PlayerPreferences { accent: string; intensity: PlayerIntensity; sound: boolean; volume: number }

export const PLAYER_ACCENTS = [
  { name: "Vinho", value: "#a83b57" }, { name: "Ciano", value: "#20b8cc" },
  { name: "Violeta", value: "#8d68d8" }, { name: "Âmbar", value: "#d29832" },
  { name: "Verde", value: "#3ea878" }, { name: "Azul", value: "#4b82d0" },
];
const DEFAULT_ACCENT = "#20b8cc";
const defaults: PlayerPreferences = { accent: DEFAULT_ACCENT, intensity: "sobrio", sound: true, volume: 0.45 };

function storageKey(profileId: string) { return `berco-player-preferences:${profileId}`; }
function readPreferences(profileId: string) {
  if (typeof window === "undefined") return defaults;
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey(profileId)) ?? "{}") } as PlayerPreferences; }
  catch { return defaults; }
}

export function accentVariables(hex: string) {
  const valid = /^#[0-9a-f]{6}$/i.test(hex) ? hex : defaults.accent;
  const red = Number.parseInt(valid.slice(1, 3), 16), green = Number.parseInt(valid.slice(3, 5), 16), blue = Number.parseInt(valid.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return { "--primary": valid, "--ring": valid, "--primary-foreground": luminance > 0.58 ? "#101317" : "#f7f9fb" } as Record<string, string>;
}

export function usePlayerPreferences(profileId: string, readOnly: boolean) {
  const [preferences, setPreferencesState] = useState<PlayerPreferences>(() => readPreferences(profileId));
  useEffect(() => setPreferencesState(readPreferences(profileId)), [profileId]);
  const setPreferences = useCallback((next: PlayerPreferences | ((current: PlayerPreferences) => PlayerPreferences)) => {
    setPreferencesState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      if (!readOnly) localStorage.setItem(storageKey(profileId), JSON.stringify(value));
      return value;
    });
  }, [profileId, readOnly]);
  return [preferences, setPreferences] as const;
}

export type PlayerSound = "navigate" | "click" | "notify" | "dice" | "impact" | "transcend";

export function usePlayerAudio(preferences: PlayerPreferences) {
  const context = useRef<AudioContext | null>(null);
  const unlock = useCallback(() => {
    if (!preferences.sound || typeof window === "undefined") return null;
    context.current ??= new AudioContext();
    if (context.current.state === "suspended") void context.current.resume();
    return context.current;
  }, [preferences.sound]);
  const play = useCallback((kind: PlayerSound) => {
    const audio = unlock(); if (!audio || !preferences.sound) return;
    const now = audio.currentTime;
    const tones: Array<[number, number]> = kind === "transcend" ? [[52, .45], [79, .55], [117, .7]] : kind === "impact" ? [[72, .18], [48, .24]] : kind === "dice" ? [[110, .13], [76, .2]] : kind === "notify" ? [[420, .1], [620, .16]] : kind === "navigate" ? [[260, .07]] : [[340, .055]];
    tones.forEach(([frequency, duration], index) => {
      const oscillator = audio.createOscillator(), gain = audio.createGain(), start = now + index * .07;
      oscillator.type = kind === "transcend" ? "sawtooth" : kind === "dice" || kind === "impact" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      if (kind === "transcend") oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.7, start + duration);
      gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(Math.max(.002, preferences.volume * .07), start + .012); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start + duration + .02);
    });
  }, [preferences.sound, preferences.volume, unlock]);
  return { play, unlock };
}