"use client";

import type { PomodoroPhase } from "@/lib/pomodoro";

type CompactTimerProps = {
  phase: PomodoroPhase;
  timerDisplay: string;
  timerLabel: string;
  secondsRemaining: number;
  workMinutes: number;
  breakMinutes: number;
  onExpand: () => void;
  onStop: () => void;
};

export function CompactTimer({
  phase,
  timerDisplay,
  timerLabel,
  secondsRemaining,
  workMinutes,
  breakMinutes,
  onExpand,
  onStop,
}: CompactTimerProps) {
  if (phase === "idle") return null;

  const totalSeconds =
    phase === "work" ? workMinutes * 60 : breakMinutes * 60;
  const progress = totalSeconds > 0 ? 1 - secondsRemaining / totalSeconds : 0;
  const pct = Math.round(progress * 100);

  return (
    <div className="pointer-events-auto fixed bottom-0 left-[56px] right-0 z-40 flex items-center gap-3 border-t border-border bg-card/90 px-4 py-2 backdrop-blur-sm">
      <span className="text-xs font-medium text-muted-foreground shrink-0">
        {timerLabel}
      </span>

      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>

      <span className="font-mono text-xs tabular-nums text-foreground shrink-0">
        {timerDisplay}
      </span>

      <button
        type="button"
        className="shrink-0 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        onClick={onExpand}
        aria-label="Agrandir le timer"
        title="Agrandir"
      >
        ⛶
      </button>

      <button
        type="button"
        className="shrink-0 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        onClick={onStop}
        aria-label="Arrêter le chrono"
        title="Arrêter"
      >
        ■
      </button>
    </div>
  );
}
