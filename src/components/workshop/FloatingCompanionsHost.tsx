"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AiStatus, BenchmarkUiState, ChatTurn } from "@/lib/ai";
import {
  clampCompanionPosition,
  defaultCompanionPosition,
  type CompanionLayoutOptions,
} from "@/lib/companion-layout";
import {
  useLofiAmbient,
  type LofiIntensity,
} from "@/hooks/useLofiAmbient";
import {
  getProjectSettings,
  parseTimerDisplay,
  setCompanionPosition,
  setLofiPrefs,
  setTimerDisplay,
  type CompanionPosition,
  type TimerDisplayStyle,
} from "@/lib/settings";
import type { PomodoroPhase } from "@/lib/pomodoro";
import { ChatOverlay } from "./ChatOverlay";
import { CompactTimer } from "./CompactTimer";
import { FloatingCompanion } from "./FloatingCompanion";
import { LofiSceneOverlay } from "./LofiSceneOverlay";
import { SoufflePanel } from "./SoufflePanel";

type FloatingCompanionsHostProps = {
  projectPath: string;
  focusMode: boolean;
  layersOpen: boolean;
  pomodoro: {
    timerLabel: string;
    timerDisplay: string;
    isRunning: boolean;
    phase: PomodoroPhase;
    workGeneration: number;
    configOpen: boolean;
    workMinutes: number;
    breakMinutes: number;
    secondsRemaining: number;
    saveError: string | null;
    setConfigOpen: (open: boolean) => void;
    setWorkMinutes: (value: number) => void;
    setBreakMinutes: (value: number) => void;
    saveConfig: () => Promise<void>;
    handleStart: () => void;
    handleStop: () => void;
    setCompactMode: (compact: boolean) => void;
    compactMode: boolean;
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
    onImageFile?: (file: File) => void;
  };
  /** Notifie le parent si l'overlay chat est ouvert (notif OS async). */
  onChatOpenChange?: (open: boolean) => void;
};

export function FloatingCompanionsHost({
  projectPath,
  focusMode,
  layersOpen,
  pomodoro,
  chat,
  onChatOpenChange,
}: FloatingCompanionsHostProps) {
  const layoutOptions = useMemo<CompanionLayoutOptions>(
    () => ({ focusMode, layersOpen }),
    [focusMode, layersOpen],
  );

  const [chatPos, setChatPos] = useState<CompanionPosition>(() =>
    defaultCompanionPosition("chat", layoutOptions),
  );
  const [pomoPos, setPomoPos] = useState<CompanionPosition>(() =>
    defaultCompanionPosition("pomo", layoutOptions),
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(false);
  const [lofiMuted, setLofiMuted] = useState(false);
  const [lofiVolume, setLofiVolume] = useState(40);
  const [timerStyle, setTimerStyle] = useState<TimerDisplayStyle>("ring_time");
  const [sceneDismissedKey, setSceneDismissedKey] = useState<string | null>(
    null,
  );
  const wasLoadingRef = useRef(false);

  const workActive = pomodoro.phase === "work";
  const breakActive = pomodoro.phase === "break";
  const lofiIntensity: LofiIntensity = workActive
    ? "full"
    : breakActive
      ? "soft"
      : "off";
  const sceneKey = workActive
    ? `work:${pomodoro.workGeneration}`
    : breakActive
      ? `break:${pomodoro.workGeneration}`
      : null;
  const sceneOpen = sceneKey !== null && sceneDismissedKey !== sceneKey;
  const sceneVariant = breakActive ? "break" : "work";

  useLofiAmbient({
    intensity: lofiIntensity,
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

        const chat =
          settings.companion_chat ?? defaultCompanionPosition("chat", layoutOptions);
        const pomo =
          settings.companion_pomo ?? defaultCompanionPosition("pomo", layoutOptions);
        setChatPos(clampCompanionPosition(chat.x, chat.y, 44, layoutOptions));
        setPomoPos(clampCompanionPosition(pomo.x, pomo.y, 116, layoutOptions));
        setLofiMuted(settings.lofi_muted ?? false);
        setLofiVolume(settings.lofi_volume ?? 40);
        setTimerStyle(parseTimerDisplay(settings.timer_display));
      } catch {
        // Defaults already applied.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectPath, layoutOptions]);

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
    onChatOpenChange?.(true);
  }, [onChatOpenChange]);

  const closeChat = useCallback(() => {
    setChatOpen(false);
    onChatOpenChange?.(false);
  }, [onChatOpenChange]);

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

  const persistTimerStyle = useCallback(
    async (style: TimerDisplayStyle) => {
      setTimerStyle(style);
      try {
        await setTimerDisplay(projectPath, style);
      } catch {
        // keep local
      }
    },
    [projectPath],
  );

  const chatThinking = chat.loading && !chatOpen;
  const chatHasError = !!chat.chatError && !chatOpen;
  const chatDone = chatUnread && !chatHasError && !chatOpen;
  const chatBadge = chatHasError || chatDone;
  const chatBadgeTone = chatHasError ? "destructive" : "primary";

  // Progression du timer pomodoro (0 → 1)
  const pomoTotalSeconds =
    pomodoro.phase === "work"
      ? pomodoro.workMinutes * 60
      : pomodoro.phase === "break"
        ? pomodoro.breakMinutes * 60
        : 0;
  const pomoProgress =
    pomoTotalSeconds > 0 && pomodoro.isRunning
      ? 1 - pomodoro.secondsRemaining / pomoTotalSeconds
      : 0;

  return (
    <>
      <FloatingCompanion
        id="chat"
        icon="💬"
        position={chatPos}
        ariaLabel={
          chatThinking
            ? "Chat IA — réponse en cours"
            : chatHasError
              ? "Chat IA — erreur, rouvre pour voir le détail"
              : chatDone
                ? "Chat IA — nouvelle réponse"
                : "Chat IA — ouvrir"
        }
        pulsing={chatThinking}
        badge={chatBadge}
        badgeTone={chatBadgeTone}
        layoutOptions={layoutOptions}
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
        progress={pomodoro.isRunning ? pomoProgress : undefined}
        timerStyle={timerStyle}
        pulsing={pomodoro.isRunning}
        layoutOptions={layoutOptions}
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
        onImageFile={chat.onImageFile}
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
        compactMode={pomodoro.compactMode}
        timerStyle={timerStyle}
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
        onCompactModeChange={pomodoro.setCompactMode}
        onTimerStyleChange={(style) => {
          void persistTimerStyle(style);
        }}
      />

      <LofiSceneOverlay
        open={sceneOpen}
        variant={sceneVariant}
        onDismiss={() => {
          if (sceneKey) {
            setSceneDismissedKey(sceneKey);
          }
        }}
      />

      {pomodoro.compactMode && pomodoro.isRunning ? (
        <CompactTimer
          phase={pomodoro.phase}
          timerDisplay={pomodoro.timerDisplay}
          timerLabel={pomodoro.timerLabel}
          secondsRemaining={pomodoro.secondsRemaining}
          workMinutes={pomodoro.workMinutes}
          breakMinutes={pomodoro.breakMinutes}
          onExpand={() => pomodoro.setCompactMode(false)}
          onStop={pomodoro.handleStop}
        />
      ) : null}
    </>
  );
}
