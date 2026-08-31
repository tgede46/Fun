"use client";

import { useEffect, useRef } from "react";

type SoufflePanelProps = {
  open: boolean;
  timerLabel: string;
  timerDisplay: string;
  isRunning: boolean;
  workMinutes: number;
  breakMinutes: number;
  saveError: string | null;
  onClose: () => void;
  onWorkChange: (value: number) => void;
  onBreakChange: (value: number) => void;
  onSaveConfig: () => void;
  onStart: () => void;
  onStop: () => void;
};

export function SoufflePanel({
  open,
  timerLabel,
  timerDisplay,
  isRunning,
  workMinutes,
  breakMinutes,
  saveError,
  onClose,
  onWorkChange,
  onBreakChange,
  onSaveConfig,
  onStart,
  onStop,
}: SoufflePanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background" role="dialog" aria-modal="true" aria-labelledby="souffle-title">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <p id="souffle-title" className="text-lg font-semibold text-foreground">
            🍅 Souffle
          </p>
          <p className="text-sm text-muted-foreground">
            Configure ton rythme, puis lance le chrono.
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent/50"
          onClick={onClose}
        >
          Fermer
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-10">
        <div className="rounded-2xl border border-border bg-card px-8 py-10 text-center shadow-sm">
          <p className="mb-2 text-sm font-medium text-muted-foreground">{timerLabel}</p>
          <p className="font-mono text-5xl tracking-tight text-foreground tabular-nums">
            {timerDisplay}
          </p>
          {isRunning ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Le chrono tourne — ferme cette page pour le voir flotter dans l’atelier.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Choisis les durées, puis démarre.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Travail (min)</span>
            <input
              className="w-full rounded-xl border border-border bg-card px-4 py-3 font-mono text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              type="number"
              min={1}
              max={180}
              value={workMinutes}
              disabled={isRunning}
              onChange={(e) => onWorkChange(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Pause (min)</span>
            <input
              className="w-full rounded-xl border border-border bg-card px-4 py-3 font-mono text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              type="number"
              min={1}
              max={60}
              value={breakMinutes}
              disabled={isRunning}
              onChange={(e) => onBreakChange(Number(e.target.value))}
            />
          </label>
        </div>

        {saveError ? (
          <p className="text-sm text-destructive" role="status">
            {saveError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          {!isRunning ? (
            <>
              <button
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
                type="button"
                onClick={() => void onSaveConfig()}
              >
                Enregistrer
              </button>
              <button
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                type="button"
                onClick={onStart}
              >
                Démarrer
              </button>
            </>
          ) : (
            <button
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
              type="button"
              onClick={onStop}
            >
              Arrêter le chrono
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
