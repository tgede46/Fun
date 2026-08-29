"use client";

type PomodoroChipProps = {
  timerLabel: string;
  timerDisplay: string;
  isRunning: boolean;
  configOpen: boolean;
  workMinutes: number;
  breakMinutes: number;
  saveError: string | null;
  onToggleConfig: () => void;
  onWorkChange: (value: number) => void;
  onBreakChange: (value: number) => void;
  onSaveConfig: () => void;
  onStart: () => void;
  onStop: () => void;
};

export function PomodoroChip({
  timerLabel,
  timerDisplay,
  isRunning,
  configOpen,
  workMinutes,
  breakMinutes,
  saveError,
  onToggleConfig,
  onWorkChange,
  onBreakChange,
  onSaveConfig,
  onStart,
  onStop,
}: PomodoroChipProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-lg text-sm text-foreground hover:bg-accent/50 transition-colors"
        onClick={onToggleConfig}
        aria-expanded={configOpen}
        aria-label="Pomodoro — configurer ou démarrer"
      >
        <span className="font-medium">{timerLabel}</span>
        <span className="text-muted-foreground">{timerDisplay}</span>
      </button>

      {configOpen ? (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-xl border border-border bg-card shadow-xl p-4"
          role="dialog"
          aria-label="Configuration Pomodoro"
        >
          <p className="text-sm font-semibold text-foreground mb-3">🍅 Souffle — Pomodoro</p>
          <label className="flex flex-col gap-1 mb-2">
            <span className="text-xs text-muted-foreground">Travail (min)</span>
            <input
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              type="number"
              min={1}
              max={180}
              value={workMinutes}
              onChange={(e) => onWorkChange(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 mb-3">
            <span className="text-xs text-muted-foreground">Pause (min)</span>
            <input
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              type="number"
              min={1}
              max={60}
              value={breakMinutes}
              onChange={(e) => onBreakChange(Number(e.target.value))}
            />
          </label>
          {saveError ? (
            <p className="text-xs text-destructive mb-2" role="status">
              {saveError}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              type="button"
              onClick={() => void onSaveConfig()}
            >
              Enregistrer
            </button>
            {isRunning ? (
              <button
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border text-foreground hover:bg-accent/50 transition-colors"
                type="button"
                onClick={onStop}
              >
                Arrêter
              </button>
            ) : (
              <button
                className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                type="button"
                onClick={onStart}
              >
                Démarrer
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
