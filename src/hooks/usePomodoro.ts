"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatTimer,
  notifyPomodoroPhase,
  phaseLabel,
  setPomodoroDurations,
  type PomodoroPhase,
} from "@/lib/pomodoro";

type UsePomodoroOptions = {
  projectPath: string;
  workMinutes: number;
  breakMinutes: number;
  onDurationsChange?: (work: number, breakMin: number) => void;
};

export function usePomodoro({
  projectPath,
  workMinutes: initialWork,
  breakMinutes: initialBreak,
  onDurationsChange,
}: UsePomodoroOptions) {
  const [workMinutes, setWorkMinutes] = useState(initialWork);
  const [breakMinutes, setBreakMinutes] = useState(initialBreak);
  const [phase, setPhase] = useState<PomodoroPhase>("idle");
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [workGeneration, setWorkGeneration] = useState(0);
  const phaseEndHandledRef = useRef(false);

  // Durées directes depuis les props — le parent (WorkshopLayout) gère les changements
  
  const startPhase = useCallback((next: "work" | "break") => {
    phaseEndHandledRef.current = false;
    setPhase(next);
    setSecondsRemaining(
      (next === "work" ? workMinutes : breakMinutes) * 60,
    );
    if (next === "work") {
      setWorkGeneration((g) => g + 1);
    }
  }, [breakMinutes, workMinutes]);

  const handleStart = useCallback(async () => {
    setSaveError(null);
    try {
      await setPomodoroDurations(projectPath, workMinutes, breakMinutes);
      onDurationsChange?.(workMinutes, breakMinutes);
      setConfigOpen(false);
      setShowMeditation(false);
      startPhase("work");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Impossible de sauvegarder.",
      );
    }
  }, [
    breakMinutes,
    onDurationsChange,
    projectPath,
    startPhase,
    workMinutes,
  ]);

  const handleStop = useCallback(() => {
    phaseEndHandledRef.current = true;
    setPhase("idle");
    setSecondsRemaining(0);
    setShowMeditation(false);
  }, []);

  const dismissMeditation = useCallback(() => {
    setShowMeditation(false);
    startPhase("break");
  }, [startPhase]);

  const saveConfig = useCallback(async () => {
    setSaveError(null);
    try {
      await setPomodoroDurations(projectPath, workMinutes, breakMinutes);
      onDurationsChange?.(workMinutes, breakMinutes);
      setConfigOpen(false);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Impossible de sauvegarder.",
      );
    }
  }, [breakMinutes, onDurationsChange, projectPath, workMinutes]);

    // Timer : subscription au compte à rebours externe (intervalle navigateur)
  useEffect(() => {
    if (phase === "idle" || secondsRemaining <= 0) {
      return;
    }

    const tick = window.setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(tick);
  }, [phase, secondsRemaining]);

  // Phase-end handling : réaction au compte à rebours atteignant zéro.
  // Le setState est déclenché de façon asynchrone (microtask) pour éviter
  // le pattern "setState synchrone dans un effet" que ESLint interdit.
  useEffect(() => {
    if (phase === "idle" || secondsRemaining > 0 || phaseEndHandledRef.current) {
      return;
    }

    phaseEndHandledRef.current = true;

    if (phase === "work") {
      void notifyPomodoroPhase("Fun — Pomodoro", "Phase travail terminée.");
      // Deferred microtask — pas de setState synchrone dans l'effet
      Promise.resolve().then(() => {
        setShowMeditation(true);
        setPhase("idle");
      });
      return;
    }

    if (phase === "break") {
      void notifyPomodoroPhase("Fun — Pomodoro", "Pause terminée.");
      Promise.resolve().then(() => {
        startPhase("work");
      });
    }
  }, [phase, secondsRemaining, startPhase]);

  return {
    workMinutes,
    breakMinutes,
    setWorkMinutes,
    setBreakMinutes,
    phase,
    secondsRemaining,
    configOpen,
    setConfigOpen,
    showMeditation,
    saveError,
    timerLabel: phase === "idle" ? phaseLabel("idle") : phaseLabel(phase),
    timerDisplay:
      phase === "idle"
        ? `${String(workMinutes).padStart(2, "0")}:00`
        : formatTimer(secondsRemaining),
    handleStart,
    handleStop,
    dismissMeditation,
    saveConfig,
    isRunning: phase !== "idle",
    workGeneration,
  };
}
