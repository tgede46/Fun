"use client";

import { LOFI_SCENE_BACKGROUND } from "@/lib/lofi-scene";

type LofiSceneOverlayProps = {
  open: boolean;
  onDismiss: () => void;
};

/** Scène visuelle légère pendant la phase travail — non bloquante. */
export function LofiSceneOverlay({ open, onDismiss }: LofiSceneOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: LOFI_SCENE_BACKGROUND,
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
