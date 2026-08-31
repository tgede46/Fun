"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultCompanionPosition } from "@/lib/companion-defaults";
import {
  getProjectSettings,
  setCompanionPosition,
  type CompanionPosition,
} from "@/lib/settings";
import { FloatingCompanion } from "./FloatingCompanion";
import { PomodoroChip } from "./PomodoroChip";

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
        ariaLabel="Souffle — configurer ou démarrer"
        title={pomodoro.timerLabel}
        subtitle={pomodoro.timerDisplay}
        expanded={pomodoro.configOpen}
        onPositionChange={(next) => {
          setPomoPos(next);
          void persistPosition("pomo", next);
        }}
        onBubbleClick={() => pomodoro.setConfigOpen(!pomodoro.configOpen)}
      >
        <PomodoroChip
          workMinutes={pomodoro.workMinutes}
          breakMinutes={pomodoro.breakMinutes}
          saveError={pomodoro.saveError}
          isRunning={pomodoro.isRunning}
          onWorkChange={pomodoro.setWorkMinutes}
          onBreakChange={pomodoro.setBreakMinutes}
          onSaveConfig={() => void pomodoro.saveConfig()}
          onStart={pomodoro.handleStart}
          onStop={pomodoro.handleStop}
        />
      </FloatingCompanion>
    </>
  );
}
