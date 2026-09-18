import { useCallback, useEffect, useState } from "react";
import { playSoundFx, unlockSoundFx } from "@/lib/soundFx";

export type PlayerIntensity = "sobrio" | "paranormal";
export type PlayerVisualStyle = "operacao" | "arquivo" | "ocultista" | "minimalista";
export interface PlayerPreferences {
  accent: string;
  intensity: PlayerIntensity;
  visualStyle: PlayerVisualStyle;
  sound: boolean;
  volume: number;
  uiVolume: number;
  diceVolume: number;
  eventVolume: number;
}

export const PLAYER_ACCENTS = [
  { name: "Vinho", value: "#a83b57" }, { name: "Ciano", value: "#20b8cc" },
  { name: "Violeta", value: "#8d68d8" }, { name: "Âmbar", value: "#d29832" },
  { name: "Verde", value: "#3ea878" }, { name: "Azul", value: "#4b82d0" },
];
const DEFAULT_ACCENT = "#20b8cc";
const defaults: PlayerPreferences = { accent: DEFAULT_ACCENT, intensity: "sobrio", visualStyle: "operacao", sound: true, volume: 0.45, uiVolume: 0.75, diceVolume: 0.9, eventVolume: 1 };

function storageKey(profileId: string) { return `berco-player-preferences:${profileId}`; }
function readPreferences(profileId: string) {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(profileId)) ?? "{}") as Partial<PlayerPreferences>;
    return { ...defaults, ...stored, uiVolume: stored.uiVolume ?? defaults.uiVolume, diceVolume: stored.diceVolume ?? defaults.diceVolume, eventVolume: stored.eventVolume ?? defaults.eventVolume };
  } catch { return defaults; }
}

export function accentVariables(hex: string) {
  const valid = /^#[0-9a-f]{6}$/i.test(hex) ? hex : defaults.accent;
  const red = Number.parseInt(valid.slice(1, 3), 16), green = Number.parseInt(valid.slice(3, 5), 16), blue = Number.parseInt(valid.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return { "--primary": valid, "--ring": valid, "--sidebar-primary": valid, "--primary-foreground": luminance > 0.58 ? "#101317" : "#f7f9fb" } as Record<string, string>;
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

export type PlayerSound = "navigate" | "click" | "open" | "paper" | "notify" | "dice" | "impact" | "critical" | "combat" | "transcend";

export function usePlayerAudio(preferences: PlayerPreferences) {
  const unlock = useCallback(() => {
    if (!preferences.sound || typeof window === "undefined") return null;
    return unlockSoundFx();
  }, [preferences.sound]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFirstGesture = () => { unlock(); };
    window.addEventListener("pointerdown", onFirstGesture, { once: true, passive: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [unlock]);

  const play = useCallback((kind: PlayerSound) => {
    if (!preferences.sound) return;
    const categoryVolume = kind === "dice" || kind === "impact" || kind === "critical"
      ? preferences.diceVolume
      : kind === "transcend" || kind === "notify"
        ? preferences.eventVolume
        : preferences.uiVolume;
    const volume = preferences.volume * categoryVolume;
    const fx = kind === "navigate" ? "ui-navigate"
      : kind === "click" ? "ui-click"
      : kind === "open" ? "ui-open"
      : kind === "paper" ? "paper"
      : kind === "notify" ? "notify"
      : kind === "dice" ? "dice-roll"
      : kind === "impact" ? "dice-impact"
      : kind === "critical" ? "dice-critical"
      : kind === "combat" ? "combat-enter"
      : "paranormal";
    playSoundFx(fx, volume);
  }, [preferences.sound, preferences.volume, preferences.uiVolume, preferences.diceVolume, preferences.eventVolume]);

  return { play, unlock };
}
