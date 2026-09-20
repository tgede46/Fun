"use client";

import { LOFI_PAGE_WASH, LOFI_SCENE_BACKGROUND } from "@/lib/lofi-scene";
import {
  TIMER_DISPLAY_OPTIONS,
  type TimerDisplayStyle,
} from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  timerStyle: TimerDisplayStyle;
  onClose: () => void;
  onWorkChange: (value: number) => void;
  onBreakChange: (value: number) => void;
  onSaveConfig: () => void;
  onStart: () => void;
  onStop: () => void;
  onLofiMutedChange: (muted: boolean) => void;
  onLofiVolumeChange: (volume: number) => void;
  onCompactModeChange: (compact: boolean) => void;
  onTimerStyleChange: (style: TimerDisplayStyle) => void;
};

function TimerStylePreview({
  style,
  selected,
}: {
  style: TimerDisplayStyle;
  selected: boolean;
}) {
  const ring = (
    <span
      className={`absolute inset-0 rounded-full border-2 ${
        selected ? "border-primary" : "border-border"
      }`}
      style={{
        clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)",
      }}
    />
  );

  if (style === "pill") {
    return (
      <span
        className={`flex h-8 w-16 items-center justify-center gap-1 rounded-full border text-[10px] ${
          selected ? "border-primary bg-primary/15" : "border-border bg-background/60"
        }`}
      >
        <span aria-hidden>🍅</span>
        <span className="font-mono tabular-nums">24:18</span>
      </span>
    );
  }

  if (style === "ring_tomato") {
    return (
      <span className="relative flex h-10 w-10 items-center justify-center">
        {ring}
        <span className="relative text-base" aria-hidden>
          🍅
        </span>
      </span>
    );
  }

  return (
    <span className="relative flex h-10 w-10 items-center justify-center">
      {ring}
      <span className="relative font-mono text-[9px] tabular-nums">24:18</span>
    </span>
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
  timerStyle,
  onClose,
  onWorkChange,
  onBreakChange,
  onSaveConfig,
  onStart,
  onStop,
  onLofiMutedChange,
  onLofiVolumeChange,
  onCompactModeChange,
  onTimerStyleChange,
}: SoufflePanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[var(--z-overlay)] flex flex-col bg-background"
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
            Configure ton rythme, l&apos;ambiance, puis lance le chrono.
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 pb-10 pt-8">
          <div className="rounded-2xl border border-border bg-card/90 px-8 py-8 text-center shadow-sm backdrop-blur-sm">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {timerLabel}
            </p>
            <p className="font-mono text-5xl tracking-tight text-foreground tabular-nums">
              {timerDisplay}
            </p>
            {isRunning ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Le chrono tourne — ferme cette page pour le voir flotter dans
                l&apos;atelier.
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
                <Button
                  key={preset.label}
                  variant={workMinutes === preset.work && breakMinutes === preset.brk ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    onWorkChange(preset.work);
                    onBreakChange(preset.brk);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Travail (min)</Label>
              <Input
                type="number"
                min={1}
                max={180}
                value={workMinutes}
                disabled={isRunning}
                onChange={(e) => onWorkChange(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Pause (min)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={breakMinutes}
                disabled={isRunning}
                onChange={(e) => onBreakChange(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card/90 p-5 backdrop-blur-sm">
            <div>
              <p className="text-sm font-medium text-foreground">Ambiance lofi</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Musique et scène visuelle légère au démarrage de la phase
                travail. Tu peux masquer la scène dans l&apos;atelier sans couper le
                chrono.
              </p>
            </div>

            <div
              className="relative h-24 overflow-hidden rounded-xl border border-border/60 bg-[#1a1814]"
              aria-hidden
            >
              <div
                className="absolute inset-0"
                style={{ background: LOFI_SCENE_BACKGROUND }}
              />
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  background:
                    "radial-gradient(circle at 30% 70%, rgba(180,140,90,0.45), transparent 45%), radial-gradient(circle at 75% 25%, rgba(80,120,140,0.4), transparent 40%)",
                }}
              />
              <p className="absolute bottom-2 left-3 text-[11px] font-medium text-foreground/90">
                Aperçu de la scène
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm text-foreground">Muet</Label>
              <Switch
                checked={lofiMuted}
                onCheckedChange={onLofiMutedChange}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-sm text-foreground">Mode compact</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Barre de progression en bas du canvas
                </p>
              </div>
              <Switch
                checked={compactMode}
                onCheckedChange={onCompactModeChange}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm text-muted-foreground">
                Volume ({lofiVolume}%)
              </Label>
              <Slider
                min={0}
                max={100}
                value={[lofiVolume]}
                disabled={lofiMuted}
                onValueChange={(value) => onLofiVolumeChange(Array.isArray(value) ? value[0] : value)}
              />
            </div>
          </div>

          {saveError ? (
            <p className="text-sm text-destructive" role="status">
              {saveError}
            </p>
          ) : null}

          {!isRunning && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Affichage du compteur
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Choisis comment le chrono apparaît dans l&apos;atelier.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {TIMER_DISPLAY_OPTIONS.map((option) => {
                  const selected = timerStyle === option.id;
                  return (
                    <Button
                      key={option.id}
                      variant={selected ? "default" : "outline"}
                      className="flex flex-col items-center gap-2 h-auto py-3"
                      onClick={() => onTimerStyleChange(option.id)}
                    >
                      <TimerStylePreview style={option.id} selected={selected} />
                      <span className="text-xs font-medium">{option.label}</span>
                      <span className="text-[10px] leading-tight text-muted-foreground">
                        {option.hint}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {!isRunning ? (
              <>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => void onStart()}
                >
                  Démarrer
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void onSaveConfig()}
                >
                  Enregistrer sans démarrer
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={onStop}
              >
                Arrêter le chrono
              </Button>
            )}
          </div>
        </main>
      </ScrollArea>
    </div>
  );
}
