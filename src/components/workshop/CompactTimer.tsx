"use client";

import type { PomodoroPhase } from "@/lib/pomodoro";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

      <Progress value={pct} className="flex-1 h-1.5" />

      <span className="font-mono text-xs tabular-nums text-foreground shrink-0">
        {timerDisplay}
      </span>

      <Button
        variant="outline"
        size="icon-xs"
        onClick={onExpand}
        aria-label="Agrandir le timer"
        title="Agrandir"
      >
        ⛶
      </Button>

      <Button
        variant="destructive"
        size="icon-xs"
        onClick={onStop}
        aria-label="Arrêter le chrono"
        title="Arrêter"
      >
        ■
      </Button>
    </div>
  );
}
