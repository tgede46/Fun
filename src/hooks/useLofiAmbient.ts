"use client";

import { useEffect, useRef } from "react";

const LOFI_SRC = "/sounds/lofi/ambient.wav";

/** Volume relatif en pause (CAP-5 « adouci »). */
export const LOFI_BREAK_SOFT_FACTOR = 0.3;

export type LofiIntensity = "off" | "full" | "soft";

type UseLofiAmbientOptions = {
  intensity: LofiIntensity;
  muted: boolean;
  volume: number; // 0–100
};

/** Volume HTMLAudio (0–1) selon prefs + intensité de phase. */
export function lofiEffectiveVolume(
  volume: number,
  intensity: LofiIntensity,
  muted: boolean,
): number {
  if (muted || intensity === "off") {
    return 0;
  }
  const base = Math.max(0, Math.min(1, volume / 100));
  return intensity === "soft" ? base * LOFI_BREAK_SOFT_FACTOR : base;
}

/** Joue l'ambiance embarquée — pleine en travail, adoucie en pause. */
export function useLofiAmbient({
  intensity,
  muted,
  volume,
}: UseLofiAmbientOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(LOFI_SRC);
    audio.loop = true;
    audio.preload = "auto";

    audio.addEventListener("error", () => {
      console.warn("[lofi] Audio file not found or unsupported:", LOFI_SRC);
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const effective = lofiEffectiveVolume(volume, intensity, muted);
    audio.volume = effective;
    audio.muted = muted || intensity === "off";

    if (intensity !== "off" && !muted) {
      void audio.play().catch(() => {
        // Autoplay may be blocked until a user gesture (Souffle start counts).
      });
    } else {
      audio.pause();
      if (intensity === "off") {
        try {
          audio.currentTime = 0;
        } catch {
          // Audio may not be ready yet
        }
      }
    }
  }, [intensity, muted, volume]);
}
