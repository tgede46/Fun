"use client";

import {
  LOFI_BREAK_SCENE_BACKGROUND,
  LOFI_SCENE_BACKGROUND,
} from "@/lib/lofi-scene";
import { Button } from "@/components/ui/button";

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
        <Button
          variant="outline"
          size="sm"
          className="bg-card/80 backdrop-blur-sm"
          onClick={onDismiss}
        >
          Masquer la scène
        </Button>
      </div>
    </div>
  );
}
