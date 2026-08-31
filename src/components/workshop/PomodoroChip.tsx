"use client";

type PomodoroChipProps = {
  isRunning: boolean;
  workMinutes: number;
  breakMinutes: number;
  saveError: string | null;
  onWorkChange: (value: number) => void;
  onBreakChange: (value: number) => void;
  onSaveConfig: () => void;
  onStart: () => void;
  onStop: () => void;
};

export function PomodoroChip({
  isRunning,
  workMinutes,
  breakMinutes,
  saveError,
  onWorkChange,
  onBreakChange,
  onSaveConfig,
  onStart,
  onStop,
}: PomodoroChipProps) {
  return (
    <div
      className="w-72 rounded-xl border border-border bg-card p-4 shadow-xl"
      role="dialog"
      aria-label="Configuration Pomodoro"
    >
      <p className="mb-3 text-sm font-semibold text-foreground">
        🍅 Souffle — Pomodoro
      </p>
      <label className="mb-2 flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Travail (min)</span>
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          type="number"
          min={1}
          max={180}
          value={workMinutes}
          onChange={(e) => onWorkChange(Number(e.target.value))}
        />
      </label>
      <label className="mb-3 flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Pause (min)</span>
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          type="number"
          min={1}
          max={60}
          value={breakMinutes}
          onChange={(e) => onBreakChange(Number(e.target.value))}
        />
      </label>
      {saveError ? (
        <p className="mb-2 text-xs text-destructive" role="status">
          {saveError}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
          type="button"
          onClick={() => void onSaveConfig()}
        >
          Enregistrer
        </button>
        {isRunning ? (
          <button
            className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent/50"
            type="button"
            onClick={onStop}
          >
            Arrêter
          </button>
        ) : (
          <button
            className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
            type="button"
            onClick={onStart}
          >
            Démarrer
          </button>
        )}
      </div>
    </div>
  );
}
