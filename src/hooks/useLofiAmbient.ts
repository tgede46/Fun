"use client";

import { useEffect, useRef } from "react";

const LOFI_SRC = "/sounds/lofi/ambient.wav";

type UseLofiAmbientOptions = {
  active: boolean;
  muted: boolean;
  volume: number; // 0–100
};

/** Joue l'ambiance embarquée pendant la phase travail Souffle. */
export function useLofiAmbient({ active, muted, volume }: UseLofiAmbientOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(LOFI_SRC);
    audio.loop = true;
    audio.preload = "auto";
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

    audio.volume = Math.max(0, Math.min(1, volume / 100));
    audio.muted = muted;

    if (active && !muted) {
      void audio.play().catch(() => {
        // Autoplay may be blocked until a user gesture (Souffle start counts).
      });
    } else {
      audio.pause();
      if (!active) {
        audio.currentTime = 0;
      }
    }
  }, [active, muted, volume]);
}
