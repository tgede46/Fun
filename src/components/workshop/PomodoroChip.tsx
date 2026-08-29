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
    <div className="workshop-pomodoro">
      <button
        type="button"
        className="workshop-pomodoro__chip"
        onClick={onToggleConfig}
        aria-expanded={configOpen}
        aria-label="Pomodoro — configurer ou démarrer"
      >
        <span className="workshop-pomodoro__phase">{timerLabel}</span>
        <span className="workshop-pomodoro__timer">{timerDisplay}</span>
      </button>

      {configOpen ? (
        <div className="workshop-pomodoro__panel" role="dialog" aria-label="Configuration Pomodoro">
          <p className="workshop-pomodoro__panel-title">🍅 Souffle — Pomodoro</p>
          <label className="workshop-pomodoro__field">
            Travail (min)
            <input
              type="number"
              min={1}
              max={180}
              value={workMinutes}
              onChange={(e) => onWorkChange(Number(e.target.value))}
            />
          </label>
          <label className="workshop-pomodoro__field">
            Pause (min)
            <input
              type="number"
              min={1}
              max={60}
              value={breakMinutes}
              onChange={(e) => onBreakChange(Number(e.target.value))}
            />
          </label>
          {saveError ? (
            <p className="workshop-pomodoro__error" role="status">
              {saveError}
            </p>
          ) : null}
          <div className="workshop-pomodoro__actions">
            <button type="button" onClick={() => void onSaveConfig()}>
              Enregistrer
            </button>
            {isRunning ? (
              <button type="button" onClick={onStop}>
                Arrêter
              </button>
            ) : (
              <button type="button" onClick={onStart}>
                Démarrer
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
