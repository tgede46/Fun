"use client";

import { useEffect, useRef } from "react";
import { LOFI_PAGE_WASH, LOFI_SCENE_BACKGROUND } from "@/lib/lofi-scene";

type SoufflePanelProps = {
  open: boolean;
  timerLabel: string;
  timerDisplay: string;
  isRunning: boolean;
  workMinutes: number;
  breakMinutes: number;
  saveError: string | null;
  lofiMuted: boolean;
  lofiVolume: number;
  compactMode: boolean;
  onClose: () => void;
  onWorkChange: (value: number) => void;
  onBreakChange: (value: number) => void;
  onSaveConfig: () => void;
  onStart: () => void;
  onStop: () => void;
  onLofiMutedChange: (muted: boolean) => void;
  onLofiVolumeChange: (volume: number) => void;
  onCompactModeChange: (compact: boolean) => void;
};

function LofiToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function SoufflePanel({
  open,
  timerLabel,
  timerDisplay,
  isRunning,
  workMinutes,
  breakMinutes,
  saveError,
  lofiMuted,
  lofiVolume,
  compactMode,
  onClose,
  onWorkChange,
  onBreakChange,
  onSaveConfig,
  onStart,
  onStop,
  onLofiMutedChange,
  onLofiVolumeChange,
  onCompactModeChange,
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
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="souffle-title"
      style={{ backgroundImage: LOFI_PAGE_WASH }}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div>
          <p id="souffle-title" className="text-lg font-semibold text-foreground">
            🍅 Souffle
          </p>
          <p className="text-sm text-muted-foreground">
            Configure ton rythme, l’ambiance, puis lance le chrono.
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

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 overflow-y-auto px-6 pb-10 pt-8">
        <div className="rounded-2xl border border-border bg-card/90 px-8 py-8 text-center shadow-sm backdrop-blur-sm">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {timerLabel}
          </p>
          <p className="font-mono text-5xl tracking-tight text-foreground tabular-nums">
            {timerDisplay}
          </p>
          {isRunning ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Le chrono tourne — ferme cette page pour le voir flotter dans l&apos;atelier.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Les durées seront enregistrées au démarrage.
            </p>
          )}
        </div>

        {!isRunning && (
          <div className="flex gap-2">
            {[
              { label: "25 / 5", work: 25, brk: 5 },
              { label: "50 / 10", work: 50, brk: 10 },
              { label: "90 / 15", work: 90, brk: 15 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  workMinutes === preset.work && breakMinutes === preset.brk
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
                onClick={() => {
                  onWorkChange(preset.work);
                  onBreakChange(preset.brk);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

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

        <div className="rounded-2xl border border-border bg-card/90 p-5 space-y-4 backdrop-blur-sm">
          <div>
            <p className="text-sm font-medium text-foreground">Ambiance lofi</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Musique et scène visuelle légère au démarrage de la phase travail.
              Tu peux masquer la scène dans l’atelier sans couper le chrono.
            </p>
          </div>

          <div
            className="relative h-20 overflow-hidden rounded-xl border border-border/60"
            aria-hidden
          >
            <div
              className="absolute inset-0 opacity-80"
              style={{ background: LOFI_SCENE_BACKGROUND }}
            />
            <p className="absolute bottom-2 left-3 text-[11px] font-medium text-foreground/80">
              Aperçu de la scène
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">Muet</span>
            <LofiToggle
              checked={lofiMuted}
              onChange={onLofiMutedChange}
              label="Couper l'ambiance sonore"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-sm text-foreground">Mode compact</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Barre de progression en bas du canvas
              </p>
            </div>
            <LofiToggle
              checked={compactMode}
              onChange={onCompactModeChange}
              label="Activer le mode compact"
            />
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              Volume ({lofiVolume}%)
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={lofiVolume}
              disabled={lofiMuted}
              onChange={(e) => onLofiVolumeChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-primary disabled:opacity-40"
            />
          </label>
        </div>

        {saveError ? (
          <p className="text-sm text-destructive" role="status">
            {saveError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          {!isRunning ? (
            <>
              <button
                className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                type="button"
                onClick={() => void onStart()}
              >
                Démarrer
              </button>
              <button
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                type="button"
                onClick={() => void onSaveConfig()}
              >
                Enregistrer sans démarrer
              </button>
            </>
          ) : (
            <button
              className="w-full rounded-xl border border-border px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
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
