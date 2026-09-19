"use client";

import {
  LOFI_BREAK_SCENE_BACKGROUND,
  LOFI_SCENE_BACKGROUND,
} from "@/lib/lofi-scene";

export type LofiSceneVariant = "work" | "break";

type LofiSceneOverlayProps = {
  open: boolean;
  variant?: LofiSceneVariant;
  onDismiss: () => void;
};

/** Scène visuelle légère — travail ou pause ; non bloquante. */
export function LofiSceneOverlay({
  open,
  variant = "work",
  onDismiss,
}: LofiSceneOverlayProps) {
  if (!open) {
    return null;
  }

  const isBreak = variant === "break";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[var(--z-scene)] overflow-hidden"
      aria-hidden
    >
      <div
        className={isBreak ? "absolute inset-0 opacity-25" : "absolute inset-0 opacity-40"}
        style={{
          background: isBreak
            ? LOFI_BREAK_SCENE_BACKGROUND
            : LOFI_SCENE_BACKGROUND,
        }}
      />
      <div className="pointer-events-auto absolute bottom-6 left-6">
        <button
          type="button"
          className="rounded-lg border border-border/60 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground"
          onClick={onDismiss}
        >
          Masquer la scène
        </button>
      </div>
    </div>
  );
}
