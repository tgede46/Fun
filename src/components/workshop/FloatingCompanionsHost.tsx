"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultCompanionPosition } from "@/lib/companion-defaults";
import {
  getProjectSettings,
  setCompanionPosition,
  type CompanionPosition,
} from "@/lib/settings";
import { FloatingCompanion } from "./FloatingCompanion";
import { SoufflePanel } from "./SoufflePanel";

type FloatingCompanionsHostProps = {
  projectPath: string;
  pomodoro: {
    timerLabel: string;
    timerDisplay: string;
    isRunning: boolean;
    configOpen: boolean;
    workMinutes: number;
    breakMinutes: number;
    saveError: string | null;
    setConfigOpen: (open: boolean) => void;
    setWorkMinutes: (value: number) => void;
    setBreakMinutes: (value: number) => void;
    saveConfig: () => Promise<void>;
    handleStart: () => void;
    handleStop: () => void;
  };
};

export function FloatingCompanionsHost({
  projectPath,
  pomodoro,
}: FloatingCompanionsHostProps) {
  const [chatPos, setChatPos] = useState<CompanionPosition>(() =>
    defaultCompanionPosition("chat"),
  );
  const [pomoPos, setPomoPos] = useState<CompanionPosition>(() =>
    defaultCompanionPosition("pomo"),
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const settings = await getProjectSettings(projectPath);
        if (cancelled) {
          return;
        }

        setChatPos(settings.companion_chat ?? defaultCompanionPosition("chat"));
        setPomoPos(settings.companion_pomo ?? defaultCompanionPosition("pomo"));
      } catch {
        // Defaults already applied.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  const persistPosition = useCallback(
    async (companion: "chat" | "pomo", position: CompanionPosition) => {
      try {
        await setCompanionPosition(
          projectPath,
          companion,
          position.x,
          position.y,
        );
      } catch {
        // Position stays in local state; user can retry on next drag.
      }
    },
    [projectPath],
  );

  return (
    <>
      <FloatingCompanion
        id="chat"
        icon="💬"
        position={chatPos}
        ariaLabel="Chat IA — bientôt disponible en overlay"
        onPositionChange={(next) => {
          setChatPos(next);
          void persistPosition("chat", next);
        }}
      />

      <FloatingCompanion
        id="pomo"
        icon="🍅"
        position={pomoPos}
        ariaLabel={
          pomodoro.isRunning
            ? `Souffle — ${pomodoro.timerLabel} ${pomodoro.timerDisplay}`
            : "Souffle — ouvrir la configuration"
        }
        liveLabel={pomodoro.isRunning ? pomodoro.timerDisplay : undefined}
        pulsing={pomodoro.isRunning}
        onPositionChange={(next) => {
          setPomoPos(next);
          void persistPosition("pomo", next);
        }}
        onBubbleClick={() => pomodoro.setConfigOpen(true)}
      />

      <SoufflePanel
        open={pomodoro.configOpen}
        timerLabel={pomodoro.timerLabel}
        timerDisplay={pomodoro.timerDisplay}
        isRunning={pomodoro.isRunning}
        workMinutes={pomodoro.workMinutes}
        breakMinutes={pomodoro.breakMinutes}
        saveError={pomodoro.saveError}
        onClose={() => pomodoro.setConfigOpen(false)}
        onWorkChange={pomodoro.setWorkMinutes}
        onBreakChange={pomodoro.setBreakMinutes}
        onSaveConfig={() => void pomodoro.saveConfig()}
        onStart={pomodoro.handleStart}
        onStop={pomodoro.handleStop}
      />
    </>
  );
}
