"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AiStatus, BenchmarkUiState, ChatTurn } from "@/lib/ai";
import { defaultCompanionPosition } from "@/lib/companion-defaults";
import { useLofiAmbient } from "@/hooks/useLofiAmbient";
import {
  getProjectSettings,
  setCompanionPosition,
  setLofiPrefs,
  type CompanionPosition,
} from "@/lib/settings";
import type { PomodoroPhase } from "@/lib/pomodoro";
import { ChatOverlay } from "./ChatOverlay";
import { FloatingCompanion } from "./FloatingCompanion";
import { LofiSceneOverlay } from "./LofiSceneOverlay";
import { SoufflePanel } from "./SoufflePanel";

type FloatingCompanionsHostProps = {
  projectPath: string;
  pomodoro: {
    timerLabel: string;
    timerDisplay: string;
    isRunning: boolean;
    phase: PomodoroPhase;
    workGeneration: number;
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
  chat: {
    aiStatus: AiStatus | null;
    aiError: string | null;
    benchmarkState: BenchmarkUiState;
    benchmarkMessage: string | null;
    history: ChatTurn[];
    loading: boolean;
    chatError: string | null;
    onSend: (message: string) => void;
  };
};

export function FloatingCompanionsHost({
  projectPath,
  pomodoro,
  chat,
}: FloatingCompanionsHostProps) {
  const [chatPos, setChatPos] = useState<CompanionPosition>(() =>
    defaultCompanionPosition("chat"),
  );
  const [pomoPos, setPomoPos] = useState<CompanionPosition>(() =>
    defaultCompanionPosition("pomo"),
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(false);
  const [lofiMuted, setLofiMuted] = useState(false);
  const [lofiVolume, setLofiVolume] = useState(40);
  const [sceneDismissedGen, setSceneDismissedGen] = useState<number | null>(null);
  const wasLoadingRef = useRef(false);

  const workActive = pomodoro.phase === "work";
  const sceneOpen =
    workActive && sceneDismissedGen !== pomodoro.workGeneration;

  useLofiAmbient({
    active: workActive,
    muted: lofiMuted,
    volume: lofiVolume,
  });

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
        setLofiMuted(settings.lofi_muted ?? false);
        setLofiVolume(settings.lofi_volume ?? 40);
      } catch {
        // Defaults already applied.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  useEffect(() => {
    if (chat.loading) {
      wasLoadingRef.current = true;
      return;
    }

    if (wasLoadingRef.current && !chatOpen) {
      setChatUnread(true);
    }
    wasLoadingRef.current = false;
  }, [chat.loading, chatOpen]);

  const openChat = useCallback(() => {
    setChatOpen(true);
    setChatUnread(false);
  }, []);

  const closeChat = useCallback(() => {
    setChatOpen(false);
  }, []);

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
        // keep local
      }
    },
    [projectPath],
  );

  const persistLofi = useCallback(
    async (muted: boolean, volume: number) => {
      try {
        await setLofiPrefs(projectPath, muted, volume);
      } catch {
        // keep local
      }
    },
    [projectPath],
  );

  const chatThinking = chat.loading && !chatOpen;
  const chatBadge = chatUnread || (!!chat.chatError && !chatOpen);

  return (
    <>
      <FloatingCompanion
        id="chat"
        icon="💬"
        position={chatPos}
        ariaLabel={
          chatThinking
            ? "Chat IA — réponse en cours"
            : chatBadge
              ? "Chat IA — nouvelle réponse"
              : "Chat IA — ouvrir"
        }
        pulsing={chatThinking}
        badge={chatBadge}
        onPositionChange={(next) => {
          setChatPos(next);
          void persistPosition("chat", next);
        }}
        onBubbleClick={openChat}
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

      <ChatOverlay
        open={chatOpen}
        onClose={closeChat}
        aiStatus={chat.aiStatus}
        aiError={chat.aiError}
        benchmarkState={chat.benchmarkState}
        benchmarkMessage={chat.benchmarkMessage}
        history={chat.history}
        loading={chat.loading}
        chatError={chat.chatError}
        onSend={chat.onSend}
      />

      <SoufflePanel
        open={pomodoro.configOpen}
        timerLabel={pomodoro.timerLabel}
        timerDisplay={pomodoro.timerDisplay}
        isRunning={pomodoro.isRunning}
        workMinutes={pomodoro.workMinutes}
        breakMinutes={pomodoro.breakMinutes}
        saveError={pomodoro.saveError}
        lofiMuted={lofiMuted}
        lofiVolume={lofiVolume}
        onClose={() => pomodoro.setConfigOpen(false)}
        onWorkChange={pomodoro.setWorkMinutes}
        onBreakChange={pomodoro.setBreakMinutes}
        onSaveConfig={() => void pomodoro.saveConfig()}
        onStart={pomodoro.handleStart}
        onStop={pomodoro.handleStop}
        onLofiMutedChange={(muted) => {
          setLofiMuted(muted);
          void persistLofi(muted, lofiVolume);
        }}
        onLofiVolumeChange={(volume) => {
          setLofiVolume(volume);
          void persistLofi(lofiMuted, volume);
        }}
      />

      <LofiSceneOverlay
        open={sceneOpen}
        onDismiss={() => setSceneDismissedGen(pomodoro.workGeneration)}
      />
    </>
  );
}
